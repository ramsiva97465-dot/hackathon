import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

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

    const totalJudges = await this.prisma.judge.count()

    const mapped = teams.map(t => ({
      id: t.id,
      name: t.name,
      college: t.application?.college || 'Unknown',
      track: t.track.slug === 'real-world-deployment' ? 'REAL_WORLD_DEPLOYMENT' : 
             t.track.slug === 'multimodal-ai' ? 'MULTIMODAL_AI' : 'VOICE_AI_AGENT',
      members: t.members.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        role: m.role,
        linkedin: m.linkedin,
        github: m.github
      })),
      judgesAssigned: t.assignments.length,
      totalJudges,
      avgScore: t.leaderboard[0]?.overallScore || null,
      rank: t.leaderboard[0]?.rank || null,
      status: t.status,
      tableNumber: t.tableNumber,
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

    // Also create the empty score sheet
    await this.prisma.scoreSheet.create({
      data: {
        hackathonId: team.hackathonId,
        judgeId,
        teamId,
      }
    })

    return { success: true, data: assignment }
  }

  async updateTableNumber(teamId: string, tableNumber: string) {
    const team = await this.prisma.team.update({
      where: { id: teamId },
      data: { tableNumber },
    })
    return { success: true, data: team }
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

    const results = await this.prisma.$transaction(async (tx) => {
      let createdTeams = 0
      let createdMembers = 0

      for (const teamInput of teamsData) {
        // 1. Resolve Track
        let trackId: string
        const match = tracks.find(
          t => t.name.toLowerCase() === teamInput.track?.toLowerCase() ||
               t.slug.toLowerCase() === teamInput.track?.toLowerCase()
        )
        if (match) {
          trackId = match.id
        } else if (tracks.length > 0) {
          trackId = tracks[0].id
        } else {
          const newTrack = await tx.track.create({
            data: {
              hackathonId: hackathon.id,
              name: teamInput.track || 'Voice AI',
              slug: (teamInput.track || 'Voice-AI').toLowerCase().replace(/\s+/g, '-'),
            }
          })
          tracks.push(newTrack)
          trackId = newTrack.id
        }

        // 2. Find or Create Team
        let team = await tx.team.findFirst({
          where: { hackathonId: hackathon.id, name: teamInput.name }
        })
        if (!team) {
          team = await tx.team.create({
            data: {
              hackathonId: hackathon.id,
              name: teamInput.name,
              trackId,
              tableNumber: teamInput.tableNumber || null,
              status: 'COMPETING',
            }
          })
          createdTeams++
        } else {
          team = await tx.team.update({
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
            const existingMember = await tx.teamMember.findFirst({
              where: { teamId: team.id, email: member.email }
            })
            if (!existingMember) {
              await tx.teamMember.create({
                data: {
                  teamId: team.id,
                  name: member.name,
                  email: member.email,
                  phone: member.phone || null,
                  role: member.role || 'Member',
                }
              })
              createdMembers++
            } else {
              await tx.teamMember.update({
                where: { id: existingMember.id },
                data: {
                  name: member.name || existingMember.name,
                  phone: member.phone || existingMember.phone,
                  role: member.role || existingMember.role,
                }
              })
            }
          }
        }
      }

      return { createdTeams, createdMembers }
    })

    return { success: true, data: results }
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
        githubUrl: team.githubUrl,
        demoUrl: team.demoUrl,
        techStack: team.techStack,
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
    projectTitle?: string
    projectDescription?: string
    githubUrl?: string
    demoUrl?: string
    techStack?: string[]
  }) {
    const team = await this.prisma.team.update({
      where: { id: teamId },
      data: {
        projectTitle: body.projectTitle,
        projectDescription: body.projectDescription,
        githubUrl: body.githubUrl,
        demoUrl: body.demoUrl,
        techStack: body.techStack,
      }
    })
    return { success: true, data: team }
  }
}
