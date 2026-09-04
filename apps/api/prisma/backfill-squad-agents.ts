import { PrismaClient } from '@prisma/client'
import {
  buildProviderTechStack,
  parseLegacySquadFromTechStack,
} from '../src/teams/squad-agents.util'

const prisma = new PrismaClient()

async function main() {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      techStack: true,
      agentArchitecture: true,
      squadAgents: true,
    },
  })

  let updated = 0
  for (const team of teams) {
    const legacy = parseLegacySquadFromTechStack(team.techStack)
    const hasStoredArch = Boolean(team.agentArchitecture)
    const hasStoredSquad = Array.isArray(team.squadAgents) && (team.squadAgents as unknown[]).length > 0

    if (hasStoredArch && (hasStoredSquad || team.agentArchitecture === 'SINGLE_AGENT')) {
      continue
    }

    if (!legacy.agentArchitecture && legacy.squadAgents.length === 0) {
      continue
    }

    const agentArchitecture = legacy.agentArchitecture || 'MULTI_AGENT'
    const squadAgents = agentArchitecture === 'MULTI_AGENT' ? legacy.squadAgents : []
    const stt = team.techStack.find((s) => s.startsWith('STT: '))?.replace('STT: ', '')
    const llm = team.techStack.find((s) => s.startsWith('LLM: '))?.replace('LLM: ', '')
    const tts = team.techStack.find((s) => s.startsWith('TTS: '))?.replace('TTS: ', '')
    const techStack = buildProviderTechStack({
      stt,
      llm,
      tts,
      agentArchitecture,
      squadAgents,
      existing: team.techStack,
    })

    await prisma.team.update({
      where: { id: team.id },
      data: {
        agentArchitecture,
        squadAgents: squadAgents as any,
        techStack,
      },
    })
    updated += 1
    console.log(`backfilled ${team.name} -> ${agentArchitecture} (${squadAgents.length} sub-agents)`)
  }

  console.log(`done. updated=${updated}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
