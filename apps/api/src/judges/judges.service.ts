import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class JudgesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const judges = await this.prisma.judge.findMany({
      include: {
        user: true,
        assignments: true,
        scoreSheets: true,
      },
    })
    
    return {
      success: true,
      data: judges.map(j => ({
        id: j.id,
        name: j.user.name,
        email: j.user.email,
        avatar: j.user.avatar || j.user.image,
        company: j.company,
        title: j.designation,
        assignedTeams: j.assignments.length,
        assignmentsCount: j.assignments.length,
        completedScores: j.scoreSheets.filter(s => s.isSubmitted).length,
        totalTeams: j.assignments.length,
        isActive: j.user.isActive,
        expertise: [], // Kept empty as it's not in schema
      })),
    }
  }

  async createJudge(data: { name: string, email: string, password?: string, company?: string, designation?: string }) {
    try {
      const { auth } = require('../auth/better-auth')
      // Create user using better-auth to handle hashing
      const res = await auth.api.signUpEmail({
        body: {
          email: data.email,
          password: data.password || 'Judge@123',
          name: data.name,
        },
        asResponse: false,
        headers: new Headers()
      })

      if (!res?.user?.id) {
        throw new Error('Failed to create user')
      }

      // Update role to JUDGE
      await this.prisma.user.update({
        where: { id: res.user.id },
        data: { role: 'JUDGE' }
      })

      // Get first hackathon to link (assuming single hackathon for now)
      const hackathon = await this.prisma.hackathon.findFirst()

      // Create Judge profile
      const judge = await this.prisma.judge.create({
        data: {
          id: res.user.id,
          hackathonId: hackathon?.id || 'cmrys521n0000118v0me4w0gr',
          company: data.company,
          designation: data.designation,
        }
      })

      return { success: true, data: judge }
    } catch (error) {
      console.error(error)
      return { success: false, error: 'Failed to create judge' }
    }
  }

  async deleteJudge(id: string) {
    try {
      const judge = await this.prisma.judge.findUnique({
        where: { id }
      })
      
      if (!judge) {
        return { success: false, error: 'Judge not found' }
      }

      // Deleting the User will cascade delete the Judge profile
      await this.prisma.user.delete({
        where: { id: judge.id }
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to delete judge:', error)
      return { success: false, error: 'Failed to delete judge' }
    }
  }

  async getAssignedTeams(userId: string) {
    const judgeRecord = await this.prisma.judge.findFirst({
      where: { OR: [{ id: userId }, { user: { id: userId } }] },
    })

    if (!judgeRecord) {
      return { success: true, data: [], activeRound: 1 }
    }

    const assignments = await this.prisma.judgeAssignment.findMany({
      where: { judgeId: judgeRecord.id },
      include: {
        team: {
          include: {
            members: true,
            track: true,
            application: true,
            scoreSheets: {
              where: { judgeId: judgeRecord.id },
              include: { scores: { include: { criteria: true } } }
            }
          }
        }
      }
    })

    const r3Count = await this.prisma.team.count({ where: { status: 'COMPETING', round: 3 } })
    const r2Count = await this.prisma.team.count({ where: { status: 'COMPETING', round: 2 } })
    const eventRound = r3Count >= 1 ? 3 : r2Count >= 1 ? 2 : 1

    // Only this judge's competing teams. Do not hide Round 1 assignments just because
    // other teams have been promoted to Round 2/3.
    const filteredAssignments = assignments.filter(a => a.team.status === 'COMPETING')
    const assignmentRounds = filteredAssignments.map(a => a.team.round || 1)
    const activeJudgingRound = assignmentRounds.length > 0
      ? Math.max(...assignmentRounds)
      : eventRound

    return {
      success: true,
      activeRound: activeJudgingRound,
      data: filteredAssignments.map(a => {
        const team = a.team
        const scoreSheet = team.scoreSheets?.[0]
        
        let totalScore: number | null = null
        const existingScores: Record<string, number> = {}

        if (scoreSheet && scoreSheet.isSubmitted) {
          totalScore = scoreSheet.scores.reduce((acc, curr) => acc + curr.score, 0)
        }

        if (scoreSheet && scoreSheet.scores) {
          scoreSheet.scores.forEach(s => {
            if (s.criteria?.name) {
              existingScores[s.criteria.name] = s.score
            }
          })
        }

        let isScored = scoreSheet?.isSubmitted || false
        let isLocked = scoreSheet?.isSubmitted || false

        // Admin override scores only lock Round 1. Round 2+ needs a fresh judge pass.
        if ((team.round || 1) === 1 && team.adminScore !== null && team.adminScore !== undefined) {
          if (team.adminScore === 0) {
            totalScore = null
            isScored = false
            isLocked = false
          } else {
            totalScore = team.adminScore
            isScored = true
            isLocked = true
          }
        }

        return {
          id: team.id,
          teamName: team.name,
          round: team.round || 1,
          college: team.application?.college || 'Unknown',
          track: team.track.slug === 'real-world-deployment' ? 'Real World Deployment' : 
                 team.track.slug === 'multimodal-ai' ? 'Multimodal AI' : 'Voice AI',
          projectTitle: team.projectTitle || team.application?.projectTitle || 'Untitled Project',
          projectDescription: team.projectDescription || team.application?.projectDescription || 'No description provided',
          agentName: team.agentName || 'Unknown Agent',
          agentSolution: team.agentSolution || 'No solution provided',
          agentPhoneNumber: team.agentPhoneNumber || null,
          githubUrl: team.githubUrl || null,
          demoUrl: team.demoUrl || null,
          techStack: team.techStack || [],
          tableNumber: team.tableNumber || 'TBA',
          members: team.members,
          isScored,
          isLocked,
          totalScore,
          bonusPoints: team.bonusPoints || 0,
          notes: scoreSheet?.notes || null,
          existingScores
        }
      })
    }
  }
}
