import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { LeaderboardGateway } from '../leaderboard/leaderboard.gateway'
import { LeaderboardService } from '../leaderboard/leaderboard.service'
import {
  buildProviderTechStack,
  normalizeSquadAgents,
  parseLegacySquadFromTechStack,
  type SquadAgentInput,
} from './squad-agents.util'

function formatPhoneNumber(phone?: string | null): string | null {
  if (!phone) return null
  let str = String(phone).trim()
  if (!str) return null

  if (/e\+/i.test(str) || /^[\d.]+[eE][+-]?\d+$/.test(str)) {
    try {
      const num = Number(str)
      if (!isNaN(num)) {
        str = BigInt(Math.round(num)).toString()
      }
    } catch {
      // fallback
    }
  }

  str = str.replace(/\.0+$/, '')
  const digitsOnly = str.replace(/\D/g, '')

  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`
  }

  return str || null
}

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leaderboardGateway: LeaderboardGateway,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  async findAll() {
    const teams = await this.prisma.team.findMany({
      include: {
        application: true,
        track: true,
        members: true,
        assignments: { include: { judge: { include: { user: true } } } },
        scoreSheets: true,
        leaderboard: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    // Collect emails of participants who belong to a multi-member team (>1 members)
    const multiMemberEmails = new Set<string>()
    teams.forEach(t => {
      if (t.members.length > 1) {
        t.members.forEach(m => {
          if (m.email) multiMemberEmails.add(m.email.toLowerCase().trim())
        })
      }
    })

    // Filter out 1-member solo teams whose member is already in a multi-member team
    const validTeams = teams.filter(t => {
      if (t.members.length === 1 && t.members[0]?.email) {
        const email = t.members[0].email.toLowerCase().trim()
        if (multiMemberEmails.has(email)) {
          // Cleanup abandoned solo team in background
          this.prisma.teamMember.deleteMany({ where: { teamId: t.id } }).then(() => {
            this.prisma.leaderboard.deleteMany({ where: { teamId: t.id } }).then(() => {
              this.prisma.judgeAssignment.deleteMany({ where: { teamId: t.id } }).then(() => {
                this.prisma.team.delete({ where: { id: t.id } }).catch(() => {})
              }).catch(() => {})
            }).catch(() => {})
          }).catch(() => {})
          return false
        }
      }
      return true
    })

    const totalJudges = await this.prisma.judge.count()

    const mapped = validTeams.map(t => ({
      id: t.id,
      name: t.name,
      round: t.round || 1,
      college: t.application?.college || 'Unknown',
      track: t.track.slug === 'real-world-deployment' ? 'REAL_WORLD_DEPLOYMENT' : 
             t.track.slug === 'multimodal-ai' ? 'MULTIMODAL_AI' : 'VOICE_AI_AGENT',
      members: t.members.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: formatPhoneNumber(m.phone),
        role: m.role,
        linkedin: m.linkedin,
        github: m.github,
        isPresent: Boolean(m.isPresent),
        checkedInAt: m.checkedInAt,
        checkedInBy: m.checkedInBy,
      })),
      judgesAssigned: t.assignments.length,
      assignedJudgeIds: t.assignments.map(a => a.judgeId),
      assignedJudgeName: t.assignments[0]?.judge?.user?.name || null,
      // Evaluation is a persistent team status across promotions. Scores remain
      // round-specific, but once a judge has evaluated a team this stays 1/1.
      scoresSubmitted: t.scoreSheets.some(s => s.isSubmitted) ? 1 : 0,
      totalJudges: 1, // 1 Judge per Team requirement
      avgScore: t.leaderboard[0]?.overallScore || null,
      rank: t.leaderboard[0]?.rank || null,
      status: t.status,
      attendanceStatus: t.attendanceStatus || 'PENDING',
      tableNumber: t.tableNumber,
      projectTitle: t.projectTitle,
      projectDescription: t.projectDescription,
      agentName: t.agentName,
      agentSolution: t.agentSolution,
      agentPhoneNumber: t.agentPhoneNumber,
      agentArchitecture: (t as any).agentArchitecture
        || parseLegacySquadFromTechStack(t.techStack).agentArchitecture,
      squadAgents: ((t as any).squadAgents as SquadAgentInput[] | null)
        || parseLegacySquadFromTechStack(t.techStack).squadAgents,
      githubUrl: t.githubUrl,
      demoUrl: t.demoUrl,
      techStack: t.techStack,
      bonusPoints: t.bonusPoints,
      followedInstagram: t.followedInstagram,
      followedLinkedin: t.followedLinkedin,
      isSpecialCategory: Boolean(t.isSpecialCategory),
    }))

    return { success: true, data: mapped }
  }

  async assignJudge(teamId: string, judgeId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } })
    if (!team) throw new Error('Team not found')

    const judge = await this.prisma.judge.findUnique({ where: { id: judgeId } })
    if (!judge) return { success: false, message: 'Judge not found.' }

    const judgingRound = team.round || 1
    const currentAssignments = await this.prisma.judgeAssignment.findMany({
      where: { teamId },
    })
    const alreadyThisJudge = currentAssignments.find(a => a.judgeId === judgeId)
    if (alreadyThisJudge && (judgingRound === 2 || currentAssignments.length === 1)) {
      return {
        success: true,
        data: alreadyThisJudge,
        message: 'This judge is already assigned to this team.',
      }
    }

    const replaced = judgingRound !== 2 && currentAssignments.some(a => a.judgeId !== judgeId)

    // Round 1 stays one judge per team. Round 2 keeps every assigned judge.
    if (judgingRound !== 2) {
      await this.prisma.judgeAssignment.deleteMany({
        where: { teamId, judgeId: { not: judgeId } },
      })
      await this.prisma.scoreSheet.deleteMany({
        where: {
          teamId,
          round: judgingRound,
          judgeId: { not: judgeId },
        },
      })
    }

    const assignment = alreadyThisJudge || await this.prisma.judgeAssignment.create({
      data: {
        hackathonId: team.hackathonId,
        judgeId,
        teamId,
      }
    })

    const existingSheet = await this.prisma.scoreSheet.findFirst({
      where: { teamId, judgeId, round: judgingRound }
    })
    if (!existingSheet) {
      await this.prisma.scoreSheet.create({
        data: {
          hackathonId: team.hackathonId,
          judgeId,
          teamId,
          round: judgingRound,
        }
      })
    }

    return {
      success: true,
      data: assignment,
      message: replaced
        ? `Judge updated for Round ${judgingRound}.`
        : judgingRound === 2
          ? `Judge added for Round 2. All assigned judges score this team (10 pts each).`
          : `Judge assigned for Round ${judgingRound}.`,
    }
  }

  async autoDistributeJudges(judgesPerTeam: number = 1, round?: number) {
    // Round 3 is reveal-only. Winners come from frozen Round 2 scores, so no
    // finale judging queue is ever created.
    if (round !== undefined && round !== null && Number(round) === 3) {
      return {
        success: false,
        message: 'Round 3 is reveal-only. The Top 5 winners are ranked by their Round 2 scores, so no judges are assigned for the finale.',
      }
    }

    const whereClause: any = { status: 'COMPETING', isSpecialCategory: false }
    if (round !== undefined && round !== null) {
      whereClause.round = Number(round)
    } else {
      // An "all rounds" auto-assign must still skip the finalists.
      whereClause.round = { not: 3 }
    }

    const teams = await this.prisma.team.findMany({ where: whereClause })
    const judges = await this.prisma.judge.findMany()

    if (teams.length === 0) return { success: false, message: `No active teams found${round ? ` in Round ${round}` : ''} to assign.` }
    if (judges.length === 0) return { success: false, message: 'No judges available.' }

    // Round 2: every available judge scores every shortlisted team.
    // Max score is 10 × judge count (5 judges → 50, 4 → 40, 3 → 30).
    if (Number(round) === 2) {
      let count = 0
      for (const team of teams) {
        for (const judge of judges) {
          const existing = await this.prisma.judgeAssignment.findUnique({
            where: { judgeId_teamId: { judgeId: judge.id, teamId: team.id } },
          })
          if (!existing) {
            await this.prisma.judgeAssignment.create({
              data: {
                hackathonId: team.hackathonId,
                judgeId: judge.id,
                teamId: team.id,
              },
            })
            count++
          }
          const existingSheet = await this.prisma.scoreSheet.findUnique({
            where: {
              judgeId_teamId_round: { judgeId: judge.id, teamId: team.id, round: 2 },
            },
          })
          if (!existingSheet) {
            await this.prisma.scoreSheet.create({
              data: {
                hackathonId: team.hackathonId,
                judgeId: judge.id,
                teamId: team.id,
                round: 2,
              },
            })
          }
        }
      }
      return {
        success: true,
        message: `Assigned all ${judges.length} judges to all ${teams.length} Round 2 teams. Team totals are out of ${judges.length * 10}.`,
      }
    }

    let count = 0
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i]
      const alreadyAssigned = await this.prisma.judgeAssignment.findFirst({
        where: { teamId: team.id }
      })
      if (alreadyAssigned) continue

      const judge = judges[i % judges.length]
      await this.prisma.judgeAssignment.create({
        data: {
          hackathonId: team.hackathonId,
          judgeId: judge.id,
          teamId: team.id,
        }
      })
      const existingSheet = await this.prisma.scoreSheet.findFirst({
        where: { teamId: team.id, judgeId: judge.id, round: team.round || 1 }
      })
      if (!existingSheet) {
        await this.prisma.scoreSheet.create({
          data: {
            hackathonId: team.hackathonId,
            judgeId: judge.id,
            teamId: team.id,
            round: team.round || 1,
          }
        })
      }
      count++
    }

    return { success: true, message: `Successfully assigned ${count} judge assignments across ${teams.length} teams${round ? ` in Round ${round}` : ''}.` }
  }

  async updateTableNumber(teamId: string, tableNumber: string) {
    const team = await this.prisma.team.update({
      where: { id: teamId },
      data: { tableNumber },
    })
    return { success: true, data: team }
  }

  /** Admin rename — updates Team.name and linked Application.teamName everywhere. */
  async updateTeamName(teamId: string, name: string) {
    const trimmed = (name || '').trim()
    if (!trimmed) {
      throw new BadRequestException('Team name is required')
    }

    const existing = await this.prisma.team.findUnique({ where: { id: teamId } })
    if (!existing) {
      throw new NotFoundException('Team not found')
    }

    const team = await this.prisma.team.update({
      where: { id: teamId },
      data: { name: trimmed },
    })

    // Keep registration application snapshot in sync so admin/applications views match.
    if (existing.applicationId) {
      await this.prisma.application.update({
        where: { id: existing.applicationId },
        data: { teamName: trimmed },
      }).catch(() => {})
    }

    try {
      await this.leaderboardService.getLeaderboard()
      await this.leaderboardGateway.broadcastLeaderboardUpdate()
      await this.leaderboardGateway.broadcastSpecialLeaderboardUpdate()
    } catch (err) {
      console.error('Failed to update live leaderboard after team rename:', err)
    }

    return { success: true, data: team }
  }

  async updateBonus(id: string, bonusPoints: number) {
    const team = await this.prisma.team.update({
      where: { id },
      data: { bonusPoints }
    })

    // Immediately recalculate leaderboard scores & broadcast live update via WebSocket to all clients!
    try {
      await this.leaderboardService.getLeaderboard()
      await this.leaderboardGateway.broadcastLeaderboardUpdate()
    } catch (err) {
      console.error('Failed to update live leaderboard after bonus update:', err)
    }

    return { success: true, data: team }
  }

  async validateUrl(url: string) {
    try {
      // Basic regex check first
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return { success: true, valid: false, error: 'URL must start with http:// or https://' }
      }

      const isSocial = /linkedin\.com|twitter\.com|x\.com|instagram\.com|github\.com/i.test(url)

      const response = await fetch(url, { 
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      })

      // LinkedIn (999), 403, 401, 429, 405 are anti-scraping/rate-limiting responses, not broken URLs
      if (response.ok || response.status === 999 || response.status === 403 || response.status === 401 || response.status === 429 || response.status === 405) {
        return { success: true, valid: true }
      }

      if (!response.ok) {
        if (isSocial) {
          return { success: true, valid: true }
        }
        return { success: true, valid: false, error: `Link returned status ${response.status}` }
      }

      return { success: true, valid: true }
    } catch (err: any) {
      // Network/CORS/fetch errors shouldn't block user if URL is well-formed
      return { success: true, valid: true }
    }
  }

  async importTeams(teamsData: any[]) {
    let hackathon = await this.prisma.hackathon.findFirst({
      where: { slug: 'ai-voice-agent-2026' }
    })
    if (!hackathon) {
      hackathon = await this.prisma.hackathon.findFirst()
    }
    if (!hackathon) {
      return { success: false, error: 'No active hackathon found to import teams into.' }
    }

    const tracks = await this.prisma.track.findMany({
      where: { hackathonId: hackathon.id }
    })

    let createdTeams = 0
    let createdMembers = 0

    if (!Array.isArray(teamsData) || teamsData.length === 0) {
      return { success: false, error: 'No teams data provided for import.' }
    }

    for (const teamInput of teamsData) {
      if (!teamInput || !teamInput.name) continue

      try {
        // 1. Resolve Track
        let trackId: string
        const match = tracks.find(
          t => t.name?.toLowerCase() === teamInput.track?.toLowerCase() ||
               t.slug?.toLowerCase() === teamInput.track?.toLowerCase()
        )
        if (match) {
          trackId = match.id
        } else if (tracks.length > 0) {
          trackId = tracks[0].id
        } else {
          trackId = 'default-track'
        }

        // 2. Find or Create Team
        let team = await this.prisma.team.findFirst({
          where: { 
            hackathonId: hackathon.id, 
            name: { equals: teamInput.name.trim(), mode: 'insensitive' } 
          }
        })
        if (!team) {
          team = await this.prisma.team.create({
            data: {
              hackathonId: hackathon.id,
              name: teamInput.name.trim(),
              trackId,
              tableNumber: teamInput.tableNumber || null,
              status: 'COMPETING',
              isSpecialCategory: Boolean(teamInput.isSpecialCategory),
            }
          })
          createdTeams++
        } else {
          team = await this.prisma.team.update({
            where: { id: team.id },
            data: {
              tableNumber: teamInput.tableNumber || team.tableNumber,
              trackId,
              ...(teamInput.isSpecialCategory !== undefined
                ? { isSpecialCategory: Boolean(teamInput.isSpecialCategory) }
                : {}),
            }
          })
        }

        // 3. Create or Update Members
        if (Array.isArray(teamInput.members)) {
          for (const member of teamInput.members) {
            if (!member || !member.name) continue
            const cleanPhone = formatPhoneNumber(member.phone)
            const cleanEmail = member.email ? member.email.trim().toLowerCase() : `${teamInput.name.toLowerCase().replace(/\s+/g, '')}_${createdMembers}@placeholder.com`

            const existingMember = await this.prisma.teamMember.findFirst({
              where: { teamId: team.id, email: cleanEmail }
            })
            if (!existingMember) {
              await this.prisma.teamMember.create({
                data: {
                  teamId: team.id,
                  name: member.name.trim(),
                  email: cleanEmail,
                  phone: cleanPhone,
                  role: member.role || 'Member',
                }
              })
              createdMembers++
            } else {
              await this.prisma.teamMember.update({
                where: { id: existingMember.id },
                data: {
                  name: member.name.trim() || existingMember.name,
                  phone: cleanPhone || existingMember.phone,
                  role: member.role || existingMember.role,
                }
              })
            }
          }
        }
      } catch (teamErr) {
        console.error(`Error importing team ${teamInput.name}:`, teamErr)
      }
    }

    return { success: true, data: { createdTeams, createdMembers } }
  }

  async findMyTeam(teamId: string) {
    if (!teamId) {
      throw new NotFoundException('Team not found')
    }

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        track: true,
        members: true,
        scoreSheets: {
          where: { isSubmitted: true },
          include: {
            scores: {
              include: { criteria: true }
            }
          }
        }
      }
    })

    // Stale participant JWT (team deleted / re-imported) — 404, not a 500 crash.
    if (!team) throw new NotFoundException('Team not found')

    // Fetch all score criteria to ensure we list all criteria even if not graded yet
    const criteriaList = await this.prisma.scoreCriteria.findMany({
      where: { hackathonId: team.hackathonId }
    })

    // Calculate score details per criteria
    const criteriaScores = criteriaList.map(c => {
      const scoresForCriteria = team.scoreSheets.flatMap(sheet => 
        sheet.scores.filter(s => s.criteriaId === c.id)
      )
      
      const avgScore = scoresForCriteria.length > 0
        ? parseFloat((scoresForCriteria.reduce((sum, s) => sum + s.score, 0) / scoresForCriteria.length).toFixed(2))
        : null

      const comments = scoresForCriteria
        .map(s => s.comments?.trim())
        .filter(Boolean) as string[]

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        maxScore: c.maxScore,
        weight: c.weight,
        avgScore,
        comments
      }
    })

    // Get overall score from leaderboard if available
    const leaderboardEntry = await this.prisma.leaderboard.findUnique({
      where: { hackathonId_teamId: { hackathonId: team.hackathonId, teamId: team.id } }
    })

    return {
      success: true,
      data: {
        id: team.id,
        name: team.name,
        tableNumber: team.tableNumber,
        track: team.track,
        projectTitle: team.projectTitle,
        projectDescription: team.projectDescription,
        agentName: team.agentName,
        agentSolution: team.agentSolution,
        agentPhoneNumber: team.agentPhoneNumber,
        agentArchitecture: (team as any).agentArchitecture
          || parseLegacySquadFromTechStack(team.techStack).agentArchitecture,
        squadAgents: ((team as any).squadAgents as SquadAgentInput[] | null)
          || parseLegacySquadFromTechStack(team.techStack).squadAgents,
        githubUrl: team.githubUrl,
        demoUrl: team.demoUrl,
        techStack: team.techStack,
        followedInstagram: team.followedInstagram,
        followedLinkedin: team.followedLinkedin,
        bonusPoints: team.bonusPoints,
        round: team.round,
        members: team.members.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          role: m.role,
          linkedin: m.linkedin,
          github: m.github
        })),
        evaluation: {
          submittedSheetsCount: team.scoreSheets.length,
          overallScore: leaderboardEntry?.overallScore || null,
          rank: leaderboardEntry?.rank || null,
          criteria: criteriaScores
        }
      }
    }
  }

  async submitProject(teamId: string, body: {
    teamName?: string
    projectTitle?: string
    projectDescription?: string
    agentName?: string
    agentSolution?: string
    agentPhoneNumber?: string
    agentArchitecture?: string
    squadAgents?: SquadAgentInput[]
    githubUrl?: string
    demoUrl?: string
    techStack?: string[]
    followedInstagram?: boolean
    followedLinkedin?: boolean
    members?: { id?: string; name: string; email: string; phone?: string; role?: string; linkedin?: string; github?: string }[]
  }) {
    const currentTeam = await this.prisma.team.findUnique({ where: { id: teamId } })
    
    // We only update the claims. Admin will verify and set bonusPoints.
    const nextName = body.teamName?.trim() || ''

    const hasArchitecturePayload =
      body.agentArchitecture !== undefined
      || body.squadAgents !== undefined
      || Array.isArray(body.techStack)

    let nextArchitecture: string | undefined
    let nextSquadAgents: SquadAgentInput[] | undefined
    let nextTechStack = body.techStack

    if (hasArchitecturePayload) {
      const fromBody = normalizeSquadAgents(body.squadAgents)
      const fromLegacy = parseLegacySquadFromTechStack(body.techStack || currentTeam?.techStack)
      const archRaw = String(body.agentArchitecture || '').trim().toUpperCase()
      const resolvedArch =
        archRaw === 'MULTI_AGENT' || archRaw === 'SINGLE_AGENT'
          ? archRaw
          : (fromBody.length > 0 || fromLegacy.squadAgents.length > 0 ? 'MULTI_AGENT' : 'SINGLE_AGENT')

      nextArchitecture = resolvedArch
      nextSquadAgents = resolvedArch === 'MULTI_AGENT'
        ? (fromBody.length > 0 ? fromBody : fromLegacy.squadAgents)
        : []

      const stackSource = body.techStack || currentTeam?.techStack || []
      const stt = stackSource.find(s => s.startsWith('STT: '))?.replace('STT: ', '')
      const llm = stackSource.find(s => s.startsWith('LLM: '))?.replace('LLM: ', '')
      const tts = stackSource.find(s => s.startsWith('TTS: '))?.replace('TTS: ', '')
      nextTechStack = buildProviderTechStack({
        stt,
        llm,
        tts,
        agentArchitecture: nextArchitecture,
        squadAgents: nextSquadAgents,
        existing: stackSource,
      })
    }

    const team = await this.prisma.team.update({
      where: { id: teamId },
      data: {
        ...(nextName ? { name: nextName } : {}),
        projectTitle: body.projectTitle,
        projectDescription: body.projectDescription,
        agentName: body.agentName,
        agentSolution: body.agentSolution,
        agentPhoneNumber: body.agentPhoneNumber,
        githubUrl: body.githubUrl,
        demoUrl: body.demoUrl,
        ...(nextTechStack !== undefined ? { techStack: nextTechStack } : {}),
        ...(nextArchitecture !== undefined
          ? {
              agentArchitecture: nextArchitecture,
              squadAgents: nextSquadAgents as any,
            }
          : {}),
        followedInstagram: body.followedInstagram,
        followedLinkedin: body.followedLinkedin,
      }
    })

    if (nextName && currentTeam?.applicationId) {
      await this.prisma.application.update({
        where: { id: currentTeam.applicationId },
        data: { teamName: nextName },
      }).catch(() => {})
    }

    if (body.members) {
      for (const member of body.members) {
        if (!member.email || !member.name) continue
        const cleanEmail = member.email.trim().toLowerCase()
        const cleanPhone = formatPhoneNumber(member.phone)

        // 1. Check if this email exists on any OTHER team
        const existingOtherMember = await this.prisma.teamMember.findFirst({
          where: {
            email: { equals: cleanEmail, mode: 'insensitive' },
            teamId: { not: teamId }
          },
          include: { team: { include: { members: true } } }
        })

        if (existingOtherMember) {
          const oldTeam = existingOtherMember.team
          const oldTeamId = oldTeam?.id

          // Re-assign member to current team
          await this.prisma.teamMember.update({
            where: { id: existingOtherMember.id },
            data: {
              teamId,
              name: member.name.trim(),
              phone: cleanPhone || existingOtherMember.phone,
              role: member.role || existingOtherMember.role,
              linkedin: member.linkedin || existingOtherMember.linkedin,
              github: member.github || existingOtherMember.github,
            }
          })

          // Clean up old team if it has no members left or was a 1-member solo team
          if (oldTeamId && oldTeam && oldTeam.members.length <= 1) {
            try {
              await this.prisma.teamMember.deleteMany({ where: { teamId: oldTeamId } })
              await this.prisma.leaderboard.deleteMany({ where: { teamId: oldTeamId } })
              await this.prisma.judgeAssignment.deleteMany({ where: { teamId: oldTeamId } })
              await this.prisma.team.delete({ where: { id: oldTeamId } }).catch(() => {})
            } catch (e) {
              console.error('Failed to cleanup old team:', e)
            }
          }
        } else {
          // 2. Check if member already exists on THIS team
          const existingThisMember = await this.prisma.teamMember.findFirst({
            where: {
              teamId,
              OR: [
                ...(member.id ? [{ id: member.id }] : []),
                { email: { equals: cleanEmail, mode: 'insensitive' } }
              ]
            }
          })

          if (existingThisMember) {
            await this.prisma.teamMember.update({
              where: { id: existingThisMember.id },
              data: {
                name: member.name.trim(),
                email: cleanEmail,
                phone: cleanPhone || existingThisMember.phone,
                role: member.role || existingThisMember.role,
                linkedin: member.linkedin || existingThisMember.linkedin,
                github: member.github || existingThisMember.github,
              }
            })
          } else {
            await this.prisma.teamMember.create({
              data: {
                teamId,
                name: member.name.trim(),
                email: cleanEmail,
                phone: cleanPhone,
                role: member.role || 'Member',
                linkedin: member.linkedin,
                github: member.github,
              }
            })
          }
        }
      }

      // Remove any members on THIS team that were removed from submission form
      const activeEmailList = body.members.map(m => m.email?.trim().toLowerCase()).filter(Boolean)
      await this.prisma.teamMember.deleteMany({
        where: {
          teamId,
          email: { notIn: activeEmailList }
        }
      })
    }

    // Re-fetch to return complete team
    return this.findMyTeam(teamId)
  }

  async promoteTeams(currentRound: number) {
    const hackathon = await this.prisma.hackathon.findFirst()
    if (!hackathon) throw new Error('No hackathon found')

    const scoreForRound = (
      t: {
        adminScore: number | null
        bonusPoints: number
        bonusVerifiedAt: Date | null
        bonusVerifiedBy: string | null
        round: number
        scoreSheets: { isSubmitted: boolean; round: number; scores: { score: number }[] }[]
      },
      round: number,
    ) => {
      const submittedSheets = t.scoreSheets.filter(s => s.isSubmitted && (s.round || 1) === round)
      let overallScore = 0
      if (t.adminScore !== null && t.adminScore !== undefined && (t.round || 1) === round) {
        overallScore = t.adminScore
      } else if (submittedSheets.length > 0) {
        const total = submittedSheets.reduce((sum, sheet) => {
          const sheetTotal = sheet.scores.reduce((sSum, sc) => sSum + sc.score, 0)
          return sum + sheetTotal
        }, 0)
        // Round 1 stays a single-judge average. Round 2 sums every judge (10 × judges).
        overallScore = round === 2 ? total : total / submittedSheets.length
      }
      if (round === 1 && (t.bonusVerifiedAt || t.bonusVerifiedBy)) {
        overallScore += t.bonusPoints || 0
      }
      return { overallScore, judgeCount: submittedSheets.length }
    }

    if (currentRound === 1) {
      const teams = await this.prisma.team.findMany({
        where: { hackathonId: hackathon.id, status: 'COMPETING', isSpecialCategory: false },
        include: {
          scoreSheets: {
            where: { isSubmitted: true },
            include: { scores: true }
          }
        }
      })

      const scoredTeams = teams.map(t => {
        const { overallScore, judgeCount } = scoreForRound(t, 1)
        return { id: t.id, overallScore, judgeCount }
      })

      const sortedTeams = [...scoredTeams].sort((a, b) => b.overallScore - a.overallScore)

      const top20 = sortedTeams.slice(0, 20)
      const top20Ids = top20.map(t => t.id)
      const restIds = sortedTeams.slice(20).map(t => t.id)

      if (top20Ids.length === 0) {
        throw new Error('No teams found to promote.')
      }

      // Freeze Round 1 scores for promoted teams only, so the Round 1 board keeps their
      // real Round 1 result. Teams staying in Round 1 keep scoring live.
      await Promise.all(top20.map((t) =>
        this.prisma.team.update({
          where: { id: t.id },
          data: { round1Score: t.overallScore, round1JudgeCount: t.judgeCount },
        })
      ))

      if (restIds.length > 0) {
        await this.prisma.team.updateMany({
          where: { id: { in: restIds } },
          data: { round: 1, round1Score: null, round1JudgeCount: null }
        })
      }

      // Move top 20 to Round 2. Keep Round 1 score sheets. Round 2 starts at 0.
      await this.prisma.team.updateMany({
        where: { id: { in: top20Ids } },
        data: { round: 2, adminScore: null }
      })

      await this.prisma.judgeAssignment.deleteMany({
        where: { team: { isSpecialCategory: false } },
      })

      this.leaderboardGateway.broadcastLeaderboardUpdate().catch(err =>
        console.error('[WS] Promote R1→R2 broadcast failed:', err)
      )
      this.leaderboardGateway.clearRevealOnPromote().catch(err =>
        console.error('[WS] Promote R1→R2 clear reveal failed:', err)
      )

      return { success: true, promotedCount: top20Ids.length }
    } else if (currentRound === 2) {
      const teams = await this.prisma.team.findMany({
        where: { hackathonId: hackathon.id, status: 'COMPETING', isSpecialCategory: false, round: { in: [2, 3] } },
        include: {
          scoreSheets: {
            where: { isSubmitted: true },
            include: { scores: true }
          }
        }
      })

      const scoredTeams = teams.map(t => {
        const { overallScore, judgeCount } = scoreForRound(t, 2)
        return { id: t.id, overallScore, judgeCount }
      })

      const sortedTeams = [...scoredTeams].sort((a, b) => b.overallScore - a.overallScore)

      const top5 = sortedTeams.slice(0, 5)
      if (top5.length === 0) {
        throw new BadRequestException('No teams found in Round 2 to promote.')
      }

      // Prefer teams that actually have Round 2 scores; warn if none do.
      const withScores = sortedTeams.filter((t) => t.overallScore > 0 || t.judgeCount > 0)
      if (withScores.length === 0) {
        throw new BadRequestException(
          'Round 2 teams have no submitted scores yet. Finish Round 2 judging (or Assign All Judges to Top 20 first), then promote Top 5.',
        )
      }

      const top5Ids = top5.map(t => t.id)

      await Promise.all(top5.map((t) =>
        this.prisma.team.update({
          where: { id: t.id },
          data: { round2Score: t.overallScore, round2JudgeCount: t.judgeCount },
        })
      ))

      await this.prisma.team.updateMany({
        where: { id: { in: top5Ids } },
        data: { round: 3, adminScore: null }
      })

      await this.prisma.team.updateMany({
        where: {
          hackathonId: hackathon.id,
          status: 'COMPETING',
          isSpecialCategory: false,
          round: { in: [2, 3] },
          id: { notIn: top5Ids },
        },
        data: { round: 2 },
      })

      await this.prisma.judgeAssignment.deleteMany({
        where: { team: { isSpecialCategory: false } },
      })

      this.leaderboardGateway.broadcastLeaderboardUpdate().catch(err =>
        console.error('[WS] Promote R2→R3 broadcast failed:', err)
      )
      this.leaderboardGateway.showFinaleReady().catch(err =>
        console.error('[WS] Promote R2→R3 finale-ready broadcast failed:', err)
      )

      return { success: true, promotedCount: top5.length }
    }


    throw new Error('Invalid round promotion request.')
  }


  /**
   * Send the current Round 3 finalists back to Round 2 without touching any
   * score sheets. Used when the Top 5 was promoted before Round 2 judging had
   * finished, so the qualifiers can be judged and re-promoted correctly.
   */
  async undoFinalistPromotion() {
    const hackathon = await this.prisma.hackathon.findFirst()
    if (!hackathon) throw new Error('No hackathon found')

    const finalists = await this.prisma.team.findMany({
      where: { hackathonId: hackathon.id, status: 'COMPETING', round: 3, isSpecialCategory: false },
      select: { id: true, name: true },
    })

    if (finalists.length === 0) {
      return { success: false, message: 'There are no Round 3 finalists to move back.' }
    }

    await this.prisma.team.updateMany({
      where: { id: { in: finalists.map(t => t.id) } },
      data: { round: 2, adminScore: null, round2Score: null, round2JudgeCount: null },
    })

    this.leaderboardGateway.broadcastLeaderboardUpdate().catch(err =>
      console.error('[WS] Undo finalists broadcast failed:', err)
    )

    return {
      success: true,
      movedBack: finalists.length,
      teams: finalists.map(t => t.name),
      message: `Moved ${finalists.length} finalists back to Round 2. Assign judges and finish Round 2 scoring, then promote the Top 5 again.`,
    }
  }

  /** Promote Special Category → exactly Top 5 in Round 2, then assign every judge. Idempotent; never touches main teams. */
  async promoteSpecialCategory() {
    const hackathon = await this.prisma.hackathon.findFirst()
    if (!hackathon) throw new BadRequestException('No hackathon found')

    // Rank the full Special Category pool (any round) so re-running stays safe
    // even when a bad promote left every special team in Round 2.
    const teams = await this.prisma.team.findMany({
      where: {
        hackathonId: hackathon.id,
        status: 'COMPETING',
        isSpecialCategory: true,
      },
      include: {
        scoreSheets: {
          where: { isSubmitted: true },
          include: { scores: true },
        },
      },
    })

    if (teams.length === 0) {
      throw new BadRequestException('No Special Category teams found to promote.')
    }

    const scored = teams.map((t) => {
      const submittedSheets = t.scoreSheets.filter((s) => s.isSubmitted && (s.round || 1) === 1)
      let overallScore = 0
      let judgeCount = submittedSheets.length
      // Prefer live R1 sheets, then frozen round1Score (works even if team.round is already 2).
      if (submittedSheets.length > 0) {
        const total = submittedSheets.reduce((sum, sheet) => {
          return sum + sheet.scores.reduce((sSum, sc) => sSum + sc.score, 0)
        }, 0)
        overallScore = total / submittedSheets.length
        judgeCount = submittedSheets.length
      } else if (t.round1Score !== null && t.round1Score !== undefined) {
        overallScore = t.round1Score
        judgeCount = t.round1JudgeCount ?? 0
      } else if (t.adminScore !== null && t.adminScore !== undefined && (t.round || 1) === 1) {
        overallScore = t.adminScore
      }
      if (t.bonusVerifiedAt || t.bonusVerifiedBy) {
        overallScore += t.bonusPoints || 0
      }
      return { id: t.id, name: t.name, overallScore, judgeCount }
    })

    const scoredWithPoints = scored.filter((t) => t.overallScore > 0 || t.judgeCount > 0)
    if (scoredWithPoints.length === 0) {
      throw new BadRequestException(
        'Special Category teams have no Round 1 scores yet. Finish judging before promoting Top 5.',
      )
    }

    const sorted = [...scored].sort((a, b) => b.overallScore - a.overallScore)
    const top5 = sorted.slice(0, 5)
    const top5Ids = top5.map((t) => t.id)
    const restIds = sorted.slice(5).map((t) => t.id)

    // Freeze Round 1 scores for the whole Special pool so Special R1 stays readable.
    await Promise.all(
      scored.map((t) =>
        this.prisma.team.update({
          where: { id: t.id },
          data: { round1Score: t.overallScore, round1JudgeCount: t.judgeCount },
        }),
      ),
    )

    // Demote everyone not in Top 5 back to Round 1 (fixes stacked / all-in-R2 state).
    if (restIds.length > 0) {
      await this.prisma.team.updateMany({
        where: { id: { in: restIds } },
        data: {
          round: 1,
          adminScore: null,
          round2Score: null,
          round2JudgeCount: null,
        },
      })
      // Drop Round 2 sheets for demoted teams so they cannot keep scoring in R2.
      await this.prisma.scoreSheet.deleteMany({
        where: { teamId: { in: restIds }, round: 2 },
      })
    }

    await this.prisma.team.updateMany({
      where: { id: { in: top5Ids } },
      data: { round: 2, adminScore: null, round2Score: null, round2JudgeCount: null },
    })

    // Clear prior assignments on the new Top 5, then assign every judge automatically.
    await this.prisma.judgeAssignment.deleteMany({
      where: { teamId: { in: top5Ids } },
    })

    const assignResult = await this.autoDistributeSpecialJudges(2)

    this.leaderboardGateway.broadcastSpecialLeaderboardUpdate().catch((err) =>
      console.error('[WS] Special promote broadcast failed:', err),
    )

    return {
      success: true,
      promotedCount: top5Ids.length,
      demotedCount: restIds.length,
      top5: top5.map((t) => ({ id: t.id, name: t.name, score: t.overallScore })),
      assigned: assignResult.success,
      assignmentsCreated: assignResult.created ?? 0,
      message: assignResult.success
        ? `Special Top 5 locked into Round 2 and assigned to all judges (${top5Ids.length} teams, ${restIds.length} kept in Round 1).`
        : `Special Top 5 locked into Round 2, but judge assign failed: ${assignResult.message}`,
    }
  }

  /** Assign every judge to every Special Category team in the given round. */
  async autoDistributeSpecialJudges(round: number = 1) {
    const targetRound = Number(round) || 1
    if (targetRound !== 1 && targetRound !== 2) {
      return { success: false, message: 'Special Category only uses Round 1 and Round 2.' }
    }

    const teams = await this.prisma.team.findMany({
      where: {
        status: 'COMPETING',
        isSpecialCategory: true,
        round: targetRound,
      },
    })
    const judges = await this.prisma.judge.findMany()

    if (teams.length === 0) {
      return { success: false, message: `No Special Category teams found in Round ${targetRound}.` }
    }
    if (judges.length === 0) {
      return { success: false, message: 'No judges available.' }
    }

    let created = 0
    for (const team of teams) {
      for (const judge of judges) {
        const existing = await this.prisma.judgeAssignment.findUnique({
          where: { judgeId_teamId: { judgeId: judge.id, teamId: team.id } },
        })
        if (!existing) {
          await this.prisma.judgeAssignment.create({
            data: {
              hackathonId: team.hackathonId,
              judgeId: judge.id,
              teamId: team.id,
            },
          })
          created++
        }
        const existingSheet = await this.prisma.scoreSheet.findUnique({
          where: {
            judgeId_teamId_round: { judgeId: judge.id, teamId: team.id, round: targetRound },
          },
        })
        if (!existingSheet) {
          await this.prisma.scoreSheet.create({
            data: {
              hackathonId: team.hackathonId,
              judgeId: judge.id,
              teamId: team.id,
              round: targetRound,
            },
          })
        }
      }
    }

    return {
      success: true,
      message: `Assigned all ${judges.length} judges to all ${teams.length} Special Category Round ${targetRound} teams. Team totals are out of ${judges.length * 10}.`,
      created,
    }
  }

  async resetRounds() {
    const hackathon = await this.prisma.hackathon.findFirst()
    if (!hackathon) throw new Error('No hackathon found')

    // Wipe ALL judging state (not filtered by hackathonId — orphan rows can linger)
    await this.prisma.score.deleteMany({})
    await this.prisma.scoreSheet.deleteMany({})
    await this.prisma.judgeAssignment.deleteMany({})
    await this.prisma.leaderboard.deleteMany({})
    await this.prisma.team.updateMany({
      where: { hackathonId: hackathon.id },
      data: {
        round: 1,
        adminScore: null,
        round1Score: null,
        round1JudgeCount: null,
        round2Score: null,
        round2JudgeCount: null,
      },
    })

    return { success: true, message: 'Reset complete: scores, score sheets, and judge assignments cleared. All teams back to Round 1.' }
  }

  async removeTeam(teamId: string) {
    try {
      await this.prisma.team.delete({
        where: { id: teamId }
      })
      return { success: true }
    } catch (error) {
      console.error('Failed to remove team:', error)
      return { success: false, message: 'Failed to remove team' }
    }
  }
}
