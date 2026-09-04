/** Shared helpers for multi-agent (squad) submission payload. */

export type SquadAgentInput = {
  name: string
  phone?: string | null
  role?: string | null
}

export function normalizeSquadAgents(input: unknown): SquadAgentInput[] {
  if (!Array.isArray(input)) return []
  return input
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null
      const item = raw as Record<string, unknown>
      const name = String(item.name || '').trim()
      if (!name) return null
      const phone = item.phone != null ? String(item.phone).trim() : ''
      const role = item.role != null ? String(item.role).trim() : ''
      return {
        name,
        ...(phone ? { phone } : {}),
        ...(role ? { role } : {}),
      }
    })
    .filter(Boolean) as SquadAgentInput[]
}

/** Parse legacy "Squad Hotlines: A (): +91… | B: +91…" from techStack. */
export function parseLegacySquadFromTechStack(techStack: string[] | null | undefined): {
  agentArchitecture: 'SINGLE_AGENT' | 'MULTI_AGENT' | null
  squadAgents: SquadAgentInput[]
} {
  const stack = techStack || []
  const archEntry = stack.find((s) => /^AgentArchitecture:\s*/i.test(s))
  const archRaw = archEntry?.replace(/^AgentArchitecture:\s*/i, '').trim().toUpperCase()
  const hotlineEntry = stack.find((s) => /^Squad Hotlines:\s*/i.test(s))

  if (!hotlineEntry && archRaw !== 'MULTI_AGENT') {
    return {
      agentArchitecture: archRaw === 'SINGLE_AGENT' ? 'SINGLE_AGENT' : null,
      squadAgents: [],
    }
  }

  const body = (hotlineEntry || '').replace(/^Squad Hotlines:\s*/i, '').trim()
  const parts = body
    ? body.split('|').map((p) => p.trim()).filter(Boolean)
    : []

  const squadAgents: SquadAgentInput[] = parts.map((part) => {
    // Formats:
    //   NAME (ROLE): +91…
    //   NAME (): +91…
    //   NAME: +91…
    //   NAME (ROLE)
    const withPhone = part.match(/^(.+?)(?::\s*(\+?[\d\s\-()]+))?$/)
    const left = (withPhone?.[1] || part).trim()
    const phone = (withPhone?.[2] || '').trim()
    const roleMatch = left.match(/^(.+?)\s*\((.*)\)\s*$/)
    if (roleMatch) {
      const name = roleMatch[1].trim()
      const role = roleMatch[2].trim()
      return {
        name,
        ...(role ? { role } : {}),
        ...(phone ? { phone } : {}),
      }
    }
    return {
      name: left,
      ...(phone ? { phone } : {}),
    }
  }).filter((s) => s.name)

  return {
    agentArchitecture: 'MULTI_AGENT',
    squadAgents,
  }
}

export function buildProviderTechStack(opts: {
  stt?: string
  llm?: string
  tts?: string
  agentArchitecture?: string | null
  squadAgents?: SquadAgentInput[]
  existing?: string[]
}): string[] {
  const next: string[] = []
  if (opts.stt) next.push(`STT: ${opts.stt}`)
  if (opts.llm) next.push(`LLM: ${opts.llm}`)
  if (opts.tts) next.push(`TTS: ${opts.tts}`)

  // Preserve unknown non-provider tags from existing stack (except our managed ones)
  for (const entry of opts.existing || []) {
    if (/^(STT|LLM|TTS|AgentArchitecture|Squad Hotlines):/i.test(entry)) continue
    next.push(entry)
  }

  const arch = (opts.agentArchitecture || '').toUpperCase()
  if (arch === 'MULTI_AGENT' || arch === 'SINGLE_AGENT') {
    next.push(`AgentArchitecture: ${arch}`)
  }

  if (arch === 'MULTI_AGENT' && opts.squadAgents && opts.squadAgents.length > 0) {
    const summary = opts.squadAgents
      .map((sq) => {
        const role = sq.role ? ` (${sq.role})` : ''
        const phone = sq.phone ? `: ${sq.phone}` : ''
        return `${sq.name}${role}${phone}`
      })
      .join(' | ')
    next.push(`Squad Hotlines: ${summary}`)
  }

  return next
}
