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
    const judge = await this.prisma.judge.findUnique({
      where: { id: userId }
    })
    
    // Fallback: If it's a User ID, find the associated Judge
    const judgeRecord = judge || await this.prisma.judge.findFirst({
      where: { id: userId }
    })

    if (!judgeRecord) {
      return { success: true, data: [] }
    }

    // Determine current active evaluation round
    const hasRound2Teams = await this.prisma.team.findFirst({
      where: { hackathonId: judgeRecord.hackathonId, status: 'COMPETING', round: 2 }
    })
    const activeJudgingRound = hasRound2Teams ? 2 : 1

    const assignments = await this.prisma.judgeAssignment.findMany({
      where: { 
        judgeId: judgeRecord.id,
        team: {
          round: activeJudgingRound
        }
      },
      include: {
        team: {
          include: {
            members: true,
            track: true,
            application: true,
          }
        }
      }
    })

    const scoreSheets = await this.prisma.scoreSheet.findMany({
      where: { judgeId: judgeRecord.id },
      include: { scores: true }
    })

    return {
      success: true,
      data: assignments.map(a => {
        const team = a.team
        const scoreSheet = scoreSheets.find(s => s.teamId === team.id)
        
        let totalScore: number | null = null
        if (scoreSheet && scoreSheet.isSubmitted) {
          totalScore = scoreSheet.scores.reduce((acc, curr) => acc + curr.score, 0)
        }

        return {
          id: team.id,
          teamName: team.name,
          college: team.application?.college || 'Unknown',
          track: team.track.slug === 'real-world-deployment' ? 'Real World Deployment' : 
                 team.track.slug === 'multimodal-ai' ? 'Multimodal AI' : 'Voice AI',
          projectTitle: team.application?.projectTitle || 'Untitled Project',
          members: team.members,
          isScored: scoreSheet?.isSubmitted || false,
          isLocked: scoreSheet?.isSubmitted || false,
          totalScore
        }
      })
    }
  }
}
