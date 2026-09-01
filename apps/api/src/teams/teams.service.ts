import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { LeaderboardGateway } from '../leaderboard/leaderboard.gateway'
import { LeaderboardService } from '../leaderboard/leaderboard.service'

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
        assignments: true,
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
        github: m.github
      })),
      judgesAssigned: t.assignments.length,
      totalJudges: 1, // 1 Judge per Team requirement
      avgScore: t.leaderboard[0]?.overallScore || null,
      rank: t.leaderboard[0]?.rank || null,
      status: t.status,
      tableNumber: t.tableNumber,
      projectTitle: t.projectTitle,
      projectDescription: t.projectDescription,
      agentName: t.agentName,
      agentSolution: t.agentSolution,
      agentPhoneNumber: t.agentPhoneNumber,
      githubUrl: t.githubUrl,
      demoUrl: t.demoUrl,
      techStack: t.techStack,
      bonusPoints: t.bonusPoints,
      followedInstagram: t.followedInstagram,
      followedLinkedin: t.followedLinkedin,
    }))

    return { success: true, data: mapped }
  }

  async assignJudge(teamId: string, judgeId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } })
    if (!team) throw new Error('Team not found')

    const assignment = await this.prisma.judgeAssignment.create({
      data: {
        hackathonId: team.hackathonId,
        judgeId,
        teamId,
      }
    })

    // Also ensure the empty score sheet exists
    const existingSheet = await this.prisma.scoreSheet.findFirst({
      where: { teamId, judgeId }
    })
    if (!existingSheet) {
      await this.prisma.scoreSheet.create({
        data: {
          hackathonId: team.hackathonId,
          judgeId,
          teamId,
        }
      })
    }

    return { success: true, data: assignment }
  }

  async autoDistributeJudges(judgesPerTeam: number = 1, round?: number) {
    const whereClause: any = { status: 'COMPETING' }
    if (round !== undefined && round !== null) {
      whereClause.round = Number(round)
    }

    const teams = await this.prisma.team.findMany({ where: whereClause })
    const judges = await this.prisma.judge.findMany()

    if (teams.length === 0) return { success: false, message: `No active teams found${round ? ` in Round ${round}` : ''} to assign.` }
    if (judges.length === 0) return { success: false, message: 'No judges available.' }

    let count = 0
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i]
      for (let j = 0; j < Math.min(judgesPerTeam, judges.length); j++) {
        const judgeIdx = (i * judgesPerTeam + j) % judges.length
        const judge = judges[judgeIdx]

        const existing = await this.prisma.judgeAssignment.findFirst({
          where: { teamId: team.id, judgeId: judge.id }
        })

        if (!existing) {
          await this.prisma.judgeAssignment.create({
            data: {
              hackathonId: team.hackathonId,
              judgeId: judge.id,
              teamId: team.id,
            }
          })
          const existingSheet = await this.prisma.scoreSheet.findFirst({
            where: { teamId: team.id, judgeId: judge.id }
          })
          if (!existingSheet) {
            await this.prisma.scoreSheet.create({
              data: {
                hackathonId: team.hackathonId,
                judgeId: judge.id,
                teamId: team.id,
              }
            })
          }
          count++
        }
      }
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
            }
          })
          createdTeams++
        } else {
          team = await this.prisma.team.update({
            where: { id: team.id },
            data: {
              tableNumber: teamInput.tableNumber || team.tableNumber,
              trackId,
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

    if (!team) throw new Error('Team not found')

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
    githubUrl?: string
    demoUrl?: string
    techStack?: string[]
    followedInstagram?: boolean
    followedLinkedin?: boolean
    members?: { id?: string; name: string; email: string; phone?: string; role?: string; linkedin?: string; github?: string }[]
  }) {
    const currentTeam = await this.prisma.team.findUnique({ where: { id: teamId } })
    
    // We only update the claims. Admin will verify and set bonusPoints.
    const team = await this.prisma.team.update({
      where: { id: teamId },
      data: {
        ...(body.teamName?.trim() ? { name: body.teamName.trim() } : {}),
        projectTitle: body.projectTitle,
        projectDescription: body.projectDescription,
        agentName: body.agentName,
        agentSolution: body.agentSolution,
        agentPhoneNumber: body.agentPhoneNumber,
        githubUrl: body.githubUrl,
        demoUrl: body.demoUrl,
        techStack: body.techStack,
        followedInstagram: body.followedInstagram,
        followedLinkedin: body.followedLinkedin,
      }
    })

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

    if (currentRound === 1) {
      // Find all competing teams in the hackathon
      const teams = await this.prisma.team.findMany({
        where: { hackathonId: hackathon.id, status: 'COMPETING' },
        include: {
          scoreSheets: {
            where: { isSubmitted: true },
            include: { scores: true }
          }
        }
      })

      const sortedTeams = teams.map(t => {
        const submittedSheets = t.scoreSheets.filter(s => s.isSubmitted)
        let overallScore = 0
        if (t.adminScore !== null && t.adminScore !== undefined) {
          overallScore = t.adminScore
        } else if (submittedSheets.length > 0) {
          const total = submittedSheets.reduce((sum, sheet) => {
            const sheetTotal = sheet.scores.reduce((sSum, sc) => sSum + sc.score, 0)
            return sum + sheetTotal
          }, 0)
          overallScore = total / submittedSheets.length
        }
        return { id: t.id, overallScore }
      }).sort((a, b) => b.overallScore - a.overallScore)

      const top20 = sortedTeams.slice(0, 20)
      const top20Ids = top20.map(t => t.id)
      const restIds = sortedTeams.slice(20).map(t => t.id)

      if (top20Ids.length === 0) {
        throw new Error('No teams found to promote.')
      }

      // Reset rest to round 1
      if (restIds.length > 0) {
        await this.prisma.team.updateMany({
          where: { id: { in: restIds } },
          data: { round: 1 }
        })
      }

      // Update top 20 to round 2 — clear adminScore so Round 2 starts clean
      await this.prisma.team.updateMany({
        where: { id: { in: top20Ids } },
        data: { round: 2, adminScore: null }
      })

      // 1. Clear all existing judge assignments so Judges Portal becomes EMPTY for Round 2 until Admin assigns Round 2 teams!
      await this.prisma.judgeAssignment.deleteMany({})

      // 2. Delete existing score sheets for promoted top 20 teams so they start with fresh score sheets in Round 2
      await this.prisma.scoreSheet.deleteMany({
        where: { teamId: { in: top20Ids } }
      })

      // Broadcast leaderboard data update (without triggering reveal countdown)
      this.leaderboardGateway.broadcastLeaderboardUpdate().catch(err =>
        console.error('[WS] Promote R1→R2 broadcast failed:', err)
      )

      return { success: true, promotedCount: top20Ids.length }
    } else if (currentRound === 2) {
      const teams = await this.prisma.team.findMany({
        where: { hackathonId: hackathon.id, status: 'COMPETING', round: { in: [2, 3] } },
        include: {
          scoreSheets: {
            where: { isSubmitted: true },
            include: { scores: true }
          }
        }
      })

      const sortedTeams = teams.map(t => {
        const submittedSheets = t.scoreSheets.filter(s => s.isSubmitted)
        let overallScore = 0
        if (t.adminScore !== null && t.adminScore !== undefined) {
          overallScore = t.adminScore
        } else if (submittedSheets.length > 0) {
          const total = submittedSheets.reduce((sum, sheet) => {
            const sheetTotal = sheet.scores.reduce((sSum, sc) => sSum + sc.score, 0)
            return sum + sheetTotal
          }, 0)
          overallScore = total / submittedSheets.length
        }
        return { id: t.id, overallScore }
      }).sort((a, b) => b.overallScore - a.overallScore)

      const top3 = sortedTeams.slice(0, 3)
      if (top3.length === 0) {
        throw new Error('No teams found in Round 2.')
      }

      const top3Ids = top3.map(t => t.id)

      await this.prisma.team.updateMany({
        where: { id: { in: top3Ids } },
        data: { round: 3, adminScore: null }
      })

      // 1. Clear judge assignments for Round 3
      await this.prisma.judgeAssignment.deleteMany({})

      // 2. Delete score sheets for top 3 teams for Round 3 fresh start
      await this.prisma.scoreSheet.deleteMany({
        where: { teamId: { in: top3Ids } }
      })

      // Broadcast leaderboard data update (without triggering reveal countdown)
      this.leaderboardGateway.broadcastLeaderboardUpdate().catch(err =>
        console.error('[WS] Promote R2→R3 broadcast failed:', err)
      )

      return { success: true, promotedCount: top3.length }
    }


    throw new Error('Invalid round promotion request.')
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
      data: { round: 1, adminScore: null },
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
