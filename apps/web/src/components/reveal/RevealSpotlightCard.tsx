import { motion } from 'framer-motion'
import { Award, Crown, Medal, ShieldCheck } from 'lucide-react'
import { WinnerLetterReels } from '@/components/reveal/WinnerLetterReels'
import { getTrackConfig } from '@/lib/utils'
import type { LeaderboardEntry } from '@hackathon/shared'

/** Palette lifted from the SnapServe + vobiz lockup: cream plate, ink wordmark, orange mark. */
export const BRAND = {
  orange: '#E83C00',
  orangeLit: '#FF7A1A',
  orangeMuted: '#B24A12',
  ink: '#1A1A1A',
  inkDeep: '#0F0D0B',
  graphite: '#8E8B86',
  silver: '#E4DFD6',
  cream: '#F4ECE1',
  creamLit: '#FBF6EE',
  creamDeep: '#E7DBC9',
}

/**
 * Single source of truth for the reveal card. Round 2 runs on the cream plate with
 * ink type and an orange accent; the finale inverts to an ink stage, where intensity
 * (orange → silver → muted orange → graphite) carries the podium hierarchy.
 */
export function revealTheme(rank: number, isFinale: boolean) {
  if (!isFinale) {
    return {
      surface: `linear-gradient(180deg, ${BRAND.creamLit} 0%, ${BRAND.cream} 55%, ${BRAND.creamDeep} 100%)`,
      border: BRAND.orange,
      glow: '0 28px 70px -28px rgba(232,60,0,0.45)',
      ring: 'rgba(232,60,0,0.12)',
      badgeBg: BRAND.ink,
      badgeText: BRAND.cream,
      badgeIcon: BRAND.orangeLit,
      rank: BRAND.orange,
      rankShadow: '0 6px 30px rgba(232,60,0,0.22)',
      name: BRAND.ink,
      meta: '#7A756E',
      chipBg: '#FFFFFF',
      chipText: BRAND.ink,
      chipBorder: 'rgba(26,26,26,0.10)',
      scoreBg: 'rgba(26,26,26,0.04)',
      scoreBorder: 'rgba(26,26,26,0.08)',
      scoreLabel: BRAND.graphite,
      scoreValue: BRAND.ink,
      divider: 'rgba(26,26,26,0.10)',
      footMuted: BRAND.graphite,
      footStrong: BRAND.ink,
    }
  }

  const accent = rank === 1 ? BRAND.orangeLit : rank === 2 ? BRAND.silver : rank === 3 ? BRAND.orangeMuted : BRAND.graphite
  return {
    surface:
      rank === 1
        ? `linear-gradient(180deg, #2E1205 0%, #1A0A02 55%, ${BRAND.inkDeep} 100%)`
        : `linear-gradient(180deg, #1C1917 0%, #121010 55%, ${BRAND.inkDeep} 100%)`,
    border: accent,
    glow: rank === 1 ? '0 0 90px rgba(232,60,0,0.5)' : '0 28px 70px -28px rgba(0,0,0,0.8)',
    ring: rank === 1 ? 'rgba(255,122,26,0.35)' : 'rgba(255,255,255,0.06)',
    badgeBg: rank === 1 ? BRAND.orange : 'rgba(255,255,255,0.08)',
    badgeText: rank === 1 ? '#FFFFFF' : BRAND.cream,
    badgeIcon: accent,
    rank: accent,
    rankShadow: rank === 1 ? '0 6px 40px rgba(255,122,26,0.55)' : 'none',
    name: '#FFFFFF',
    meta: 'rgba(244,236,225,0.62)',
    chipBg: 'rgba(255,255,255,0.10)',
    chipText: BRAND.cream,
    chipBorder: 'rgba(255,255,255,0.16)',
    scoreBg: 'rgba(255,255,255,0.06)',
    scoreBorder: 'rgba(255,255,255,0.12)',
    scoreLabel: 'rgba(244,236,225,0.55)',
    scoreValue: accent,
    divider: 'rgba(255,255,255,0.12)',
    footMuted: 'rgba(244,236,225,0.5)',
    footStrong: accent,
  }
}

export function RevealSpotlightCard({
  team,
  rank,
  isFinale,
  isDecrypting,
  revealingTeamName,
  nameSpinMs,
  revealedStep,
  maxSteps,
}: {
  team: LeaderboardEntry
  rank: number
  isFinale: boolean
  isDecrypting: boolean
  revealingTeamName: string
  nameSpinMs: number
  revealedStep: number
  maxSteps: number
}) {
  const card = revealTheme(rank, isFinale)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.05, y: -20 }}
      transition={{ type: 'spring', bounce: 0.35, duration: 0.65 }}
      className="relative p-7 sm:p-10 rounded-[2.5rem] overflow-hidden text-center border-2"
      style={{
        background: card.surface,
        borderColor: card.border,
        color: card.name,
        boxShadow: `${card.glow}, 0 0 0 6px ${card.ring}`,
      }}
    >
      {/* Brand accent bar echoing the vobiz mark */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${BRAND.orangeLit}, ${BRAND.orange}, transparent)` }}
        aria-hidden
      />

      <div
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.18em] mb-5"
        style={{ backgroundColor: card.badgeBg, color: card.badgeText }}
      >
        {rank === 1 ? (
          <>
            <Crown size={14} className="stroke-[2.5]" style={{ color: card.badgeIcon }} />
            <span>{isFinale ? 'Grand Champion · 1st Place' : '1st Place Finalist'}</span>
          </>
        ) : rank === 2 ? (
          <>
            <Medal size={14} className="stroke-[2.5]" style={{ color: card.badgeIcon }} />
            <span>{isFinale ? '1st Runner Up · 2nd Place' : '2nd Place Finalist'}</span>
          </>
        ) : rank === 3 ? (
          <>
            <Award size={14} className="stroke-[2.5]" style={{ color: card.badgeIcon }} />
            <span>{isFinale ? '2nd Runner Up · 3rd Place' : '3rd Place Finalist'}</span>
          </>
        ) : rank === 4 && isFinale ? (
          <>
            <Medal size={14} className="stroke-[2.5]" style={{ color: card.badgeIcon }} />
            <span>4th Place</span>
          </>
        ) : rank === 5 && isFinale ? (
          <>
            <Medal size={14} className="stroke-[2.5]" style={{ color: card.badgeIcon }} />
            <span>5th Place</span>
          </>
        ) : (
          <>
            <ShieldCheck size={14} className="stroke-[2.5]" style={{ color: card.badgeIcon }} />
            <span>Qualified For Round 2</span>
          </>
        )}
      </div>

      <div
        className="font-display text-6xl sm:text-7xl font-black mb-3 tracking-[-0.05em]"
        style={{ color: card.rank, textShadow: card.rankShadow }}
      >
        {isFinale && rank === 1 ? 'GRAND CHAMPION' : `#${rank}`}
      </div>

      {/* Team name: wordmark reels spin down to the winner, then the real name */}
      {isDecrypting ? (
        <div className="mb-5 px-2 min-h-[7.5rem] sm:min-h-[9rem] flex items-center justify-center">
          <WinnerLetterReels
            name={revealingTeamName || team.teamName}
            spinning
            spinMs={nameSpinMs}
            dark={isFinale}
          />
        </div>
      ) : (
        <h2
          className="font-display text-3xl sm:text-5xl font-black tracking-[-0.04em] mb-2 truncate px-4"
          style={{ color: card.name }}
        >
          {team.teamName}
        </h2>
      )}

      <div
        className="flex items-center justify-center gap-2.5 flex-wrap text-sm sm:text-base font-medium mb-6"
        style={{ color: card.meta }}
      >
        <span>{team.college || 'Tamil Nadu'}</span>
        <span className="opacity-40">•</span>
        <span
          className="px-3 py-1 rounded-lg text-xs font-bold border"
          style={{ backgroundColor: card.chipBg, color: card.chipText, borderColor: card.chipBorder }}
        >
          {getTrackConfig(team.track).label}
        </span>
      </div>

      <div
        className="inline-flex items-center gap-4 px-7 py-3 rounded-2xl border backdrop-blur-md"
        style={{ backgroundColor: card.scoreBg, borderColor: card.scoreBorder }}
      >
        <span className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: card.scoreLabel }}>
          {isFinale ? 'Final Score' : 'Round 1 Score'}
        </span>
        <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight" style={{ color: card.scoreValue }}>
          {Number(team.totalScore || 0).toFixed(1)}
        </span>
      </div>

      <div
        className="mt-7 pt-4 border-t flex items-center justify-between text-xs font-semibold px-2"
        style={{ borderColor: card.divider }}
      >
        <span className="font-mono uppercase tracking-wider" style={{ color: card.footMuted }}>
          Progress: {revealedStep} of {maxSteps} revealed
        </span>
        {revealedStep === maxSteps ? (
          <span className="font-bold" style={{ color: card.footStrong }}>
            {isFinale ? 'Ceremony complete' : 'Announcement complete'}
          </span>
        ) : (
          <span className="font-bold" style={{ color: card.footStrong }}>
            Next: {isFinale
              ? (rank <= 1 ? 'Ceremony complete'
                : rank === 2 ? 'Grand Champion (#1)'
                : rank === 3 ? '1st Runner Up (#2)'
                : rank === 4 ? '2nd Runner Up (#3)'
                : rank === 5 ? '4th Place'
                : rank === 6 ? '5th Place'
                : `#${rank - 1}`)
              : `#${rank - 1}`}
          </span>
        )}
      </div>
    </motion.div>
  )
}
