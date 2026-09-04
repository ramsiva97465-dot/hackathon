import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Inbox, Clock, CheckCircle, Star, X, Search, FastForward, Github, Globe, Phone, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useSession, signOut } from '@/lib/auth-client'
import { Avatar } from '@/components/ui/Avatar'
import { getTrackConfig } from '@/lib/utils'

const SCORING_RUBRIC = {
  latency: { max: 2, label: 'Latency & Speed', description: 'response time, real-time performance, minimal pauses during calls' },
  conversationalQuality: { max: 2, label: 'Conversational Flow', description: 'natural turn-taking, interruptions, context retention, handling unexpected responses' },
  languageAccuracy: { max: 2, label: 'Language Accuracy', description: 'Tamil/regional fluency, pronunciation, grammar, understanding and response accuracy' },
  aiUsage: { max: 2, label: 'Problem-Solving Ability', description: 'does the agent actually solve the intended problem, reason through edge cases, and take the right action' },
  technicalQuality: { max: 2, label: 'Real-World Implementation & Viability', description: 'is the use case practical, can it run in a real business environment, quality of implementation, integrations, architecture and scalability' },
} as const

type Team = {
  id: string
  teamName: string
  round?: number
  college: string
  track: string
  projectTitle: string
  projectDescription: string
  agentName: string
  agentSolution: string
  tableNumber: string
  agentPhoneNumber: string | null
  githubUrl: string | null
  demoUrl: string | null
  techStack: string[]
  members: { name: string, email: string, role?: string, linkedin?: string, github?: string }[]
  isScored: boolean
  isLocked: boolean
  totalScore: number | null
  bonusPoints?: number
  notes?: string | null
  existingScores?: Record<string, number>
  isSpecialCategory?: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

function SnapServeLogo() {
  return (
    <img src="/logos/snapserve-mark.svg" alt="SnapServe" className="w-9 h-9 sm:w-10 sm:h-10 object-contain shadow-sm rounded-lg" />
  )
}

function VobizLogo() {
  return (
    <img src="/logos/vobiz-mark.svg" alt="Vobiz" className="w-9 h-9 sm:w-10 sm:h-10 object-contain shadow-sm rounded-lg" />
  )
}

function AnimatedSignOutButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      className="relative inline-flex items-center justify-center px-10 py-2.5 text-xs font-extrabold tracking-wide text-[#1a1a1a] bg-[#ffc4a3] hover:bg-[#ffb38a] rounded-xl shadow-xs transition-all duration-300 hover:-translate-y-0.5 cursor-pointer shrink-0 my-1 overflow-visible border-none"
    >
      {/* Left Vine 1 - Ivy Vine (Far Left) */}
      <div className="absolute left-2 -top-3 h-[calc(100%+22px)] w-3.5 pointer-events-none z-10 text-[#1a1a1a]">
        <svg
          viewBox="0 0 11.67 37.63"
          className="h-full w-auto fill-[#1a1a1a]"
          style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', fillRule: 'evenodd', clipRule: 'evenodd' }}
        >
          <path d="M7.63 35.26c-0.02,0.13 0.01,0.05 -0.06,0.14 -0,0 -0.08,0.07 -0.11,0.1 -0.42,0.25 -0.55,0.94 -0.23,1.4 0.68,0.95 2.66,0.91 3.75,0.21 0.2,-0.13 0.47,-0.3 0.57,-0.49 0.09,-0.02 0.04,0.03 0.11,-0.07l-1.35 -1.24c-0.78,-0.78 -1.25,-1.9 -2.07,-0.62 -0.11,0.18 -0.06,0.16 -0.22,0.26 -0.4,-0.72 -0.95,-1.79 -1.26,-2.59 0.82,0.02 1.57,-0.12 2.16,-0.45 0.49,-0.27 1.15,-0.89 1.33,-1.4 0.1,-0.06 0.02,0.01 0.06,-0.1 -0.24,-0.16 -0.87,-0.37 -1.19,-0.52 -0.4,-0.19 -0.73,-0.39 -1.09,-0.62 -0.25,-0.16 -0.85,-0.6 -1.18,-0.3 -0.35,0.32 -0.32,0.83 -0.53,1.17 -0.71,-0.3 -0.55,-0.26 -0.84,-1.22 -0.15,-0.5 -0.31,-1.12 -0.41,-1.66l0.03 -0.13c0.56,0.23 1.28,0.37 1.99,0.28 0.56,-0.07 1.33,-0.42 1.62,-0.71l0.1 -0.1c-0.74,-0.68 -1.09,-1.2 -1.65,-1.99 -1.09,-1.52 -1.2,-0.28 -1.92,0.17 -0.26,-0.79 -0.73,0.2 -0.12,-2.76 0.06,-0.3 0.19,-0.7 0.2,-0.98 0.18,0.08 0.01,-0.01 0.11,0.08 0.05,0.05 0.07,0.07 0.1,0.12 0.94,1.17 3.63,0.82 4.21,0.01 0.13,-0.02 0.06,0.03 0.1,-0.1 -1.14,-0.81 -1.91,-2.89 -2.58,-2.67 -0.29,0.09 -0.78,0.63 -0.93,0.87 -0.54,-0.48 -0.36,-0.63 -0.38,-0.81 0.01,-0.01 0.03,-0.04 0.03,-0.03 0.01,0.02 0.36,-0.35 0.45,-0.6 0.13,-0.35 0.04,-0.65 -0.05,-0.95 0.06,-0.41 0.33,-1.33 0.28,-1.71 0.22,-0.05 0.19,0.05 0.45,0.17 0.47,0.23 1.17,0.33 1.7,0.32 0.62,-0 1.74,-0.39 1.94,-0.75 0.14,-0.02 0.05,0.06 0.13,-0.09 -1.05,-1.1 -0.7,-0.64 -1.62,-1.92 -0.58,-0.81 -0.9,-1.27 -1.9,0.12 -0.44,-0.5 -0.64,-0.69 -0.66,-1.24 0.02,-0.31 0.15,-0.36 0.08,-0.73 -0.04,-0.24 -0.14,-0.41 -0.29,-0.59l-0.47 -2.54c0.09,-0.14 -0.09,-0.1 0.2,-0.05 0.06,0.01 0.19,0.05 0.3,0.07 0.54,0.09 1.47,0.01 1.95,-0.15 0.57,-0.19 1.53,-0.8 1.68,-1.18 0.16,-0.07 0.05,0.02 0.15,-0.13 -0.12,-0.15 -0.95,-0.65 -1.15,-0.8 -1.43,-1.08 -2.21,-2.77 -3.16,-0.38 -0.2,-0.1 -0.75,-0.55 -0.83,-0.74 -0.15,-0.35 -0.21,-0.81 -0.37,-1.15l-0.1 -0.25c-0.03,-0.3 -0.44,-1.33 -0.57,-1.64 -0.2,-0.51 -0.47,-1.09 -0.64,-1.6l-0.55 0c0.14,0.42 0.36,0.84 0.53,1.28 0.12,0.3 0.19,0.35 0.06,0.66l-0.21 0.52c-0.01,0.01 -0.01,0.02 -0.02,0.03 -0.06,0.1 -0.03,0.05 -0.06,0.09 -1.44,-1.03 -1.66,-0.73 -2.07,0.46 -0.16,0.46 -0.3,0.93 -0.5,1.36l-0.64 1.28c0.06,0.07 -0,0.03 0.1,0.03 0.05,0.05 0.02,0.03 0.1,0.08l0.49 0.14c0.23,0.05 0.44,0.09 0.66,0.1 0.55,0.04 0.94,-0.06 1.35,-0.19 0.54,-0.18 1.09,-0.44 1.5,-0.82 0.15,-0.14 0.24,-0.3 0.4,-0.41l0.46 1.66c0.03,0.74 -0.09,0.6 0.27,1.21 0.01,0.01 0.01,0.02 0.02,0.03 0.01,0.01 0.01,0.02 0.02,0.04l0.07 0.11c-0.02,0.22 0.19,1.01 0.24,1.29 0.09,0.46 -0.21,0.79 -0.3,1.2 -0.55,-0.23 -1.25,-1.06 -1.66,-0.23 -0.12,0.25 -0.17,0.36 -0.26,0.62 -0.33,1.01 -0.63,1.61 -1.06,2.43l0.12 0.04 0.23 0.11c0.06,0.02 0.17,0.04 0.25,0.06 0.17,0.04 0.34,0.08 0.52,0.09 0.29,0.02 0.93,0.07 1.12,-0.13 0.42,0.01 1.24,-0.49 1.51,-0.71 0.01,0.01 0.03,0 0.04,0.02l0.09 0.06c-0.04,0.29 0.02,0.41 0.03,0.7l-0.05 1.41c-0.06,1.12 -0.29,1.06 -0.76,1.69 -0.08,-0.07 -0.03,-0.01 -0.11,-0.11 -0.03,-0.03 -0.06,-0.08 -0.09,-0.11 -0.2,-0.25 -0.38,-0.54 -0.7,-0.69 -0.7,-0.32 -1.52,1.73 -2.82,2.61 0.04,0.2 -0.01,0.06 0.1,0.11 0.25,0.3 1,0.67 1.5,0.78 0.35,0.08 0.71,0.08 1.09,0.05 0.25,-0.02 0.82,-0.16 0.92,-0.13 -0.16,0.69 -0.35,1.35 -0.52,2.03 -0.25,1 -0.03,0.77 -0.98,1.53 -0.3,-0.31 -0.33,-0.77 -0.77,-1.02 -0.42,-0.25 -0.91,0.35 -1.12,0.55 -0.33,0.32 -0.58,0.6 -0.97,0.89 -0.19,0.14 -0.34,0.26 -0.53,0.4 -0.14,0.11 -0.43,0.29 -0.53,0.4 0.1,0.15 -0.02,0.06 0.15,0.13 0.09,0.22 0.35,0.38 0.54,0.52 0.22,0.16 0.43,0.29 0.69,0.39 0.43,0.17 1.32,0.31 1.87,0.23l0.23 -0.05c0.01,-0 0.03,-0.02 0.04,-0.02 0.01,-0 0.02,-0.01 0.03,-0.02 0.32,0.05 0.52,-0.18 0.79,-0.24l-0.02 0.66c0,0.77 -0.24,0.75 0.16,1.51l0.04 0.07c0,0.01 0.01,0.03 0.02,0.04 -0.05,0.35 0.18,1.03 0.24,1.4 -0.23,0.18 -0.34,0.33 -0.51,0.41 -0.75,-1.17 -0.82,-1.52 -1.92,-0.43 -0.32,0.31 -0.59,0.57 -0.95,0.86 -0.23,0.19 -0.95,0.65 -1.05,0.81l0.13 0.1c0.88,1.15 3.14,1.5 4.1,0.82 0.47,-0.34 0.54,-0.56 0.52,-1.34l0.67 1.84c0.03,0.16 0.06,0.28 0.12,0.42 0.03,0.06 0.05,0.12 0.09,0.17 0.1,0.15 0.03,0.06 0.13,0.14 -0,0.29 0.14,0.22 0.06,0.56 -0.03,0.13 -0.14,0.43 -0.19,0.53 -1.94,-1.27 -1.57,-0.02 -2.28,1.76 -0.16,0.41 -0.37,0.77 -0.53,1.2 0.09,0.08 0.01,0.03 0.15,0.03 0.29,0.33 1.66,0.28 2.36,-0.01 0.48,-0.2 0.96,-0.46 1.3,-0.82 0.15,-0.16 0.16,-0.3 0.38,-0.33 0.14,0.08 0.17,0.19 0.27,0.36zm-3.62 -12.85c0.13,-0.01 0.31,-0.15 0.55,-0.19 -0.01,0.45 0.02,0.74 -0.34,0.45 -0.06,-0.05 -0.09,-0.06 -0.12,-0.09 -0.09,-0.1 -0.04,-0.01 -0.09,-0.17zm1.92 -12.29l-0.04 0.13c-0.07,-0.02 -0.17,-0.02 -0.21,-0.03 -0.27,-0.08 -0.09,0.04 -0.16,-0.16 0.12,-0.08 0.18,-0.23 0.34,-0.35l0.08 0.4zm1.33 3.05l-0.4 0.17c-0,-0.08 -0,-0.15 -0.02,-0.23 -0.02,-0.09 -0.03,-0.07 -0.05,-0.11l0.07 -0.16c0.21,0.11 0.28,0.16 0.4,0.32zm-1.54 6.48l0.16 -0.51c0.17,0.07 0.25,0.14 0.36,0.29l-0.52 0.22zm0.28 10.88l-0.09 -0.38 0.37 0.07c-0.02,0.1 -0.03,0.13 -0.09,0.19 -0.13,0.15 0.01,0.06 -0.19,0.12zm-1.05 -5.97c0.06,0.12 0.16,0.16 0.26,0.23 -0.09,0.14 -0.22,0.18 -0.37,0.21 -0,-0.02 -0.02,-0.27 -0.02,-0.27 0.04,-0.19 -0.06,-0.09 0.13,-0.16zm1.03 -8.01c-0.09,-0.02 -0.15,-0.02 -0.22,-0.07 -0.21,-0.13 -0.08,-0.02 -0.14,-0.18 0.15,-0.05 0.21,-0.15 0.45,-0.24l-0.08 0.48zm0.57 16.58l-0.45 -0c0.02,-0.18 0.12,-0.3 0.26,-0.42l0.18 0.42zm-1.45 -3.7l-0.19 -0.23c-0.06,-0.07 -0.1,-0.13 -0.17,-0.19 -0.24,-0.23 -0.29,-0.14 -0.36,-0.36l0.46 -0.19c0.07,0.14 0.25,0.78 0.26,0.97zm0.37 -23.67l-0.12 -0.57 0.54 0.21c-0.07,0.16 -0.27,0.31 -0.41,0.36zm-1.46 -3.02c-0.07,0.01 -0.19,-0.04 -0.3,-0.06 -0.04,-0.01 -0.14,-0.02 -0.18,-0.03 -0.15,-0.07 -0.06,0.04 -0.14,-0.13 0.11,-0.07 0.2,-0.27 0.37,-0.4 0.13,0.13 0.2,0.43 0.24,0.62z" />
        </svg>
      </div>

      {/* Left Vine 2 - Ivy Vine (Second from Left) */}
      <div className="absolute left-6 -top-3 h-[calc(100%+16px)] w-3.5 pointer-events-none z-10 text-[#1a1a1a]">
        <svg
          viewBox="0 0 25.29 76.92"
          className="h-full w-auto fill-[#1a1a1a]"
          style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', fillRule: 'evenodd', clipRule: 'evenodd' }}
        >
          <path d="M19.14 6.58c0.09,0.1 -0.02,0.03 0.17,0.15 0.04,0.03 0.19,0.09 0.27,0.13l0.16 0.02c0.12,0.14 0.02,0.06 0.22,0.18 0.63,0.37 1.81,0.52 2.51,0.53 0.42,-0.26 0.61,-1.58 0.55,-2.27 -0.11,-1.17 -1.02,-3.42 -2.17,-3.76 -0.84,-0.25 -1.19,0.02 -1.4,0.7 -0.03,0.1 -0.05,0.19 -0.09,0.28l-0.18 0.25c-0.18,-0.36 -0.77,-0.97 -1.2,-1.18 -0.64,-0.31 -0.36,-0.26 -0.84,-1.59l-0.75 0c0.2,0.63 0.44,1.27 0.61,1.92 0.17,0.64 0.47,1.46 0.58,2.05 -0.21,0.36 -0.43,0.5 -0.31,1.1 0.11,0.51 0.35,0.71 0.76,0.9 0.13,0.31 0.36,1.33 0.39,1.78 -0.68,0.24 -1.38,0.85 -1.62,1.43 -0.45,-0.47 -0.29,-1.59 -1.59,-1.22 -0.8,0.22 -1.09,0.8 -1.45,1.52 -0.58,1.18 -0.96,2.15 -0.6,3.58 0.04,0.17 0.13,0.4 0.19,0.55 0.11,0.29 0.09,0.34 0.35,0.44 1.74,-0.01 2.96,-0.82 4.13,-1.55 0.22,-0.13 0.65,-0.39 0.79,-0.62 0.74,-1.2 -0.74,-2.14 -1.7,-2.43 -0.01,-0.51 1.07,-0.87 1.7,-0.82 0.21,1.74 0.56,3.5 0.61,5.33 0.05,2.05 0.01,3.68 -0.08,5.71 -1.2,0.52 -0.99,0.65 -1.77,1.46 -0.39,-0.45 -0.22,-1.6 -1.59,-1.18 -0.79,0.24 -0.91,0.63 -1.42,1.55 -0.78,1.41 -0.95,2.66 -0.36,4.15 0.14,0.35 0.06,0.36 0.36,0.37 0.78,-0 1.47,-0.18 2.09,-0.43 0.51,-0.2 1.26,-0.76 1.69,-0.86 -0.18,0.3 -0.34,0.91 -0.48,1.25l-1.54 3.5c-1.75,0.08 -1.26,0.29 -2.27,0.59 0.1,-1.15 0.1,-1.69 -1.1,-1.78 -0.7,-0.05 -1.5,0.65 -1.91,0.96 -1.04,0.82 -1.93,1.81 -1.94,3.77 0.09,0.22 -0.03,0.09 0.18,0.11 0.24,0.36 1.4,0.49 1.94,0.58l0.19 -0.01 0.71 -0.01 0.08 -0.02 1.74 -0.17c0.25,0.04 0.03,-0.07 0.19,0.09l-2.62 4.74c-0.28,0.51 -0.56,1.2 -0.86,1.61 -0.44,-0.02 -0.69,-0.14 -1.18,-0.08 -0.38,0.04 -0.72,0.17 -1.08,0.22 0.1,-0.53 0.78,-1.5 -0.62,-1.96 -0.79,-0.26 -1.74,0.32 -2.33,0.6 -2.12,1.02 -2.81,3.28 -2.36,3.38 0.01,0.01 0.03,0.02 0.03,0.04l0.11 0.1c0.42,0.34 1.16,0.64 1.66,0.79 0.65,0.19 1.73,0.31 2.43,0.38 3,0.28 1.16,-2.8 1.09,-3.14 0.86,0.12 1.3,-0.05 1.81,0.56 -0.08,0.35 -0.53,1.2 -0.71,1.6 -0.74,1.61 -1.24,3.24 -1.73,4.96 -0.92,0.11 -1.11,0.44 -1.77,0.69 0.01,-1.08 0.1,-1.68 -1.14,-1.71 -0.55,-0.01 -0.8,0.17 -1.11,0.41 -1.43,1.08 -2.52,2.24 -2.53,4.15 -0,0.62 0.11,0.48 0.22,0.54 0.63,0.38 1.79,0.44 2.67,0.35 0.47,-0.05 0.97,-0.11 1.43,-0.2l0.98 -0.22c0.38,-0.08 0.14,-0.15 0.26,0.06 -0.08,0.78 -0.66,2.6 -0.56,3.29 -0.13,0.14 -0.07,0.08 -0.17,0.29 -0.06,0.13 -0.08,0.18 -0.12,0.33 -0.07,0.3 -0.02,0.6 -0.03,0.92 -0.09,0.94 -0.17,0.52 -0.78,0.94 -0.32,0.22 -0.57,0.55 -0.86,0.82 -0.29,-0.69 -0.22,-1.44 -1.39,-1.13 -0.93,0.25 -1.93,2.19 -2.03,3.16 -0.06,0.56 0.02,1.84 0.39,2.08 2,0.02 2.64,-0.6 4.08,-1.25l-0.01 0.28c-0.06,0.58 -0.22,2.09 -0.14,2.62 -0.44,0.37 -0.46,1.03 -0.12,1.49 -0.08,3.97 0.16,2.73 -0.77,3.57 -0.24,0.21 -0.37,0.4 -0.62,0.62 -0.36,-0.53 -0.09,-1.43 -1.37,-1.13 -0.98,0.23 -1.92,2.22 -2.06,3.14 -0.07,0.47 -0.07,1.79 0.41,2.09 0.86,0.04 1.94,-0.12 2.51,-0.52l0.16 -0.08c0.6,-0.17 1.39,-0.67 1.84,-0.94 0.12,0.18 0.04,0.07 0.14,0.1 -0.18,0.38 -0.31,0.07 -0.71,0.58 -0.67,0.86 0.33,1.72 0.89,2.31 0.6,0.64 1.71,1.63 2.94,1.88 0.38,-0.11 0.92,-1.2 1.04,-1.69 0.21,-0.86 0.15,-1.53 -0.05,-2.41 -0.22,-0.94 -0.24,-1.38 -1.01,-1.81 -0.93,-0.52 -1.19,0.28 -1.59,0.76 -0.21,-0.33 -0.33,-0.79 -0.58,-1.12 -0.48,-0.62 -0.48,-0.13 -0.5,-1.22 -0.02,-1.09 0.05,-2.25 0.01,-3.32 0.37,0.22 0.89,0.86 1.37,1.21 0.51,0.37 1.05,0.65 1.76,0.82 0.32,-0.02 0.92,-1.21 1.04,-1.68 0.22,-0.87 0.15,-1.53 -0.04,-2.41 -0.19,-0.86 -0.3,-1.41 -0.96,-1.79 -1.06,-0.6 -1.26,0.38 -1.71,0.74 -0.22,-0.8 -0.65,-1.34 -1.19,-1.71l0.5 -4.35 0.38 0.28c0.23,0.25 0.6,0.67 0.87,0.82 0.07,0.1 0.05,0.1 0.19,0.21 0.18,0.23 0.66,0.57 0.92,0.6 0.1,0.13 -0.01,0.03 0.16,0.16 0.08,0.06 0.1,0.07 0.18,0.11 0.14,0.07 0.26,0.1 0.44,0.15l0.45 0.17c0.35,0.08 0.75,-0.74 0.91,-1.05 0.21,-0.4 0.41,-1.07 0.43,-1.57 -0,-0.28 0.04,-0.67 -0.1,-0.85l0.03 -0.17c-0,-0.04 -0.01,-0.13 -0.01,-0.15 -0.05,-0.13 -0.03,-0.1 -0.09,-0.17 0.06,-0.51 -0.25,-1.75 -0.94,-2.22 -1.11,-0.74 -1.37,0.09 -1.86,0.69l-0.12 -0.2c-0.28,-0.56 -0.41,-1.06 -1,-1.45 0.04,-1.21 1.29,-5.03 1.31,-5.65 0.07,0.06 0.05,0.04 0.12,0.13 0.63,0.83 0.41,0.6 1.22,1.38 0.76,0.74 1.67,1.73 2.95,1.92 0.28,0.13 0.55,-0.41 0.69,-0.64 0.21,-0.34 0.36,-0.64 0.47,-1.02 0.36,-1.24 0.14,-3.92 -1.03,-4.6 -1.23,-0.72 -1.67,0.89 -1.75,0.72 -0.01,-0.01 -0.03,0.02 -0.04,0.03 -0.19,-0.33 -0.3,-0.68 -0.49,-1 -0.22,-0.38 -0.47,-0.51 -0.68,-0.79 0.39,-1.04 1.05,-2.29 1.59,-3.3 0.57,-1.06 1.2,-2.15 1.7,-3.17 1.43,-0.02 1.51,0.55 1.8,0.6 -0.1,0.19 -0.02,0.07 -0.16,0.2 -0.01,0.01 -0.21,0.13 -0.23,0.15 -0.8,0.47 -1.8,0.96 -1.37,2.09 0.14,0.37 0.42,0.53 0.75,0.73 1.23,0.73 2.46,1.53 4.32,1.53 0.28,-0.08 0.25,-0.15 0.35,-0.44 0.22,-0.63 0.33,-1.22 0.26,-1.93 -0.11,-1.05 -1.06,-3.33 -2.21,-3.65 -1.31,-0.37 -1.17,0.6 -1.56,1.21l-0.2 -0.19c-0.84,-0.96 -0.61,-0.56 -1.27,-1.09 0.16,-0.47 0.7,-1.32 0.98,-1.82 1.05,-1.91 1.94,-3.59 2.84,-5.61 0.73,0.01 1.23,0.31 1.57,0.68 -0.26,0.25 -1.37,0.7 -1.67,1.19 -0.51,0.8 -0.07,1.45 0.63,1.87 1.15,0.7 2.56,1.58 4.34,1.55 0.33,-0.09 0.46,-0.67 0.52,-0.98 0.28,-1.4 -0.01,-2.34 -0.66,-3.5 -0.49,-0.87 -0.67,-1.3 -1.44,-1.54 -1.15,-0.36 -1.27,0.44 -1.56,1.23 -0.65,-0.55 0.03,-0.23 -1.38,-1.25 0.22,-0.6 1.08,-2.59 1.06,-3.14 0.38,-0.35 0.52,-0.78 0.43,-1.4 0.22,-0.75 0.67,-4.16 0.53,-5 0.32,0.09 0.75,0.4 1.06,0.57 0.35,0.2 0.71,0.39 1.06,0.57 0.73,0.38 1.61,0.62 2.65,0.61 0.58,-0.21 0.64,-1.82 0.61,-2.32 -0.04,-0.79 -0.45,-1.64 -0.77,-2.19 -0.39,-0.68 -0.64,-1.3 -1.45,-1.52 -1.33,-0.36 -1.16,0.63 -1.55,1.24 -0.67,-0.66 -0.61,-0.87 -1.64,-1.37 -0.06,-2.55 -0.87,-5.97 -0.9,-6.74l0.15 -0.03 0.01 -0.03zm-14.34 62.71l-0.02 1.23c-0.17,-0.13 -0.38,-0.3 -0.62,-0.45 -0.2,-0.13 -0.4,-0.21 -0.59,-0.39 0.26,-0.28 0.65,-0.51 1.16,-0.55l0.07 0.15zm14.26 -66.46c-0.03,0.28 0.03,0.13 -0.15,0.29 -0.01,0.01 -0.24,0.12 -0.24,0.13 -0.22,0.12 -0.24,0.17 -0.54,0.21 0.01,-0.4 -0.17,-0.77 -0.25,-1.14 0.63,0.03 0.9,0.46 1.18,0.51zm-14.86 55.33c0.15,-0.05 0.34,-0.22 0.51,-0.31 0.29,-0.15 0.4,-0.14 0.78,-0.16 -0.03,0.41 -0.14,0.81 -0.08,1.19 -0.26,0.14 -0.08,0.13 -0.34,-0.03 -0.26,-0.16 -0.76,-0.47 -0.88,-0.69zm2.5 -3.73c0.16,-0.41 0.11,-0.97 0.32,-1.32 0.3,0.08 0.44,0.22 0.64,0.41 0.2,0.19 0.27,0.36 0.41,0.49 -0.16,0.21 0.06,0.08 -0.33,0.21 -0.1,0.03 -0.26,0.05 -0.36,0.08 -0.23,0.05 -0.43,0.12 -0.68,0.14zm0.14 8.74l-1.08 0.27c-0.09,-0.08 -0.07,0.14 -0.08,-0.17l0.07 -1.1c0.51,0.12 0.97,0.57 1.09,1.01zm-0.43 8.78c-0.17,0.02 -0.31,0.07 -0.44,0.1 -0.01,0 -0.23,0.03 -0.24,0.03 -0.22,-0.04 0,0.16 -0.14,-0.1l-0.01 -0.9c0.37,0.15 0.68,0.48 0.83,0.88zm7.48 -41.68c0.31,-0.02 0.51,-0.13 0.93,-0.12 0.35,0 0.54,0.09 0.82,0.17 -0.11,0.53 -0.59,0.91 -0.64,1.43 -0.25,-0.04 -0.12,0.01 -0.27,-0.15l-0.84 -1.31zm4.93 -8.23c-0.27,-0 -0.43,-0.17 -0.68,-0.32 -0.41,-0.23 -0.51,-0.16 -0.64,-0.47 0.15,-0.04 0.4,-0.31 0.62,-0.42 0.29,-0.15 0.49,-0.18 0.85,-0.23 0.05,0.51 -0.12,0.95 -0.14,1.43zm-12.94 26.21c0.63,-0.04 0.61,-0.21 1.47,-0.11l-0.33 1.55c-0.33,-0.14 -0.22,-0.21 -0.62,-0.71 -0.32,-0.39 -0.42,-0.39 -0.52,-0.74zm15.47 -33.38c-0.15,0.29 -0.36,0.33 -0.67,0.51 -0.26,0.15 -0.4,0.29 -0.69,0.42 -0.01,-0.23 0.02,-0.53 -0.08,-0.67l0.03 -0.86c0.33,0.01 0.6,0.1 0.83,0.21 0.22,0.11 0.42,0.34 0.58,0.38zm-12.41 30.37c0.14,-0.37 0.45,-1.36 0.68,-1.6 0.66,0.19 1.09,0.56 1.31,1.14 -0.34,0.04 -0.75,0.16 -1.08,0.25 -0.9,0.24 -0.77,0.49 -0.91,0.21z" />
        </svg>
      </div>

      {/* Button Text */}
      <span className="relative z-20 font-extrabold text-[#1a1a1a]">Signout</span>
    </button>
  )
}

function StarScore({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description?: string
  value: number
  onChange: (points: number) => void
}) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)

  // 5 Stars: 1 Star = 0.4 Pts, 5 Stars = 2.0 Pts
  const currentStarCount = hoveredStar !== null ? hoveredStar : Math.round(value / 0.4)
  const displayScore = hoveredStar !== null ? Math.round(hoveredStar * 0.4 * 10) / 10 : value

  return (
    <div className="rounded-xl border border-[#EAE4D8] bg-white p-2.5 space-y-1.5 shadow-xs hover:shadow-sm transition-all">
      {/* Top Row: Title + 5 Stars + Score Badge */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-black text-slate-900 truncate min-w-0 flex-1">{label}</h4>

        {/* 5 Compact Stars */}
        <div
          className="flex items-center gap-0.5 shrink-0"
          onMouseLeave={() => setHoveredStar(null)}
        >
          {[1, 2, 3, 4, 5].map((starIndex) => {
            const isFilled = starIndex <= currentStarCount
            const pts = Math.round(starIndex * 0.4 * 10) / 10

            return (
              <button
                key={starIndex}
                type="button"
                onMouseEnter={() => setHoveredStar(starIndex)}
                onClick={() => {
                  const newScore = currentStarCount === starIndex && hoveredStar === null ? 0 : pts
                  onChange(newScore)
                }}
                className="p-0.5 rounded-md transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                title={`${starIndex} Star${starIndex > 1 ? 's' : ''} = ${pts} Pts`}
              >
                <Star
                  size={16}
                  className={`transition-all duration-150 ${
                    isFilled
                      ? 'fill-amber-400 text-amber-500 drop-shadow-xs scale-105'
                      : 'fill-slate-100 text-slate-300 hover:text-amber-300'
                  }`}
                />
              </button>
            )
          })}
        </div>

        {/* Numerical Badge */}
        <span className="w-9 py-0.5 text-center rounded-md bg-orange-50 text-[#E83C00] border border-orange-200 font-mono font-black text-[11px] shrink-0">
          {displayScore.toFixed(1)}
        </span>
      </div>

      {/* Description Subtext */}
      {description && (
        <p className="text-[10px] text-slate-500 font-medium leading-tight">{description}</p>
      )}
    </div>
  )
}

export function JudgeDashboard() {
  const { data: session } = useSession()
  const [assignedTeams, setAssignedTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('')
  const [activeRound, setActiveRound] = useState<number>(1)

  const [isEvaluating, setIsEvaluating] = useState(false)
  const [scores, setScores] = useState<Record<string, number>>({
    latency: 0,
    conversationalQuality: 0,
    languageAccuracy: 0,
    aiUsage: 0,
    technicalQuality: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setIsEvaluating(false)
    const target = assignedTeams.find(t => t.id === selectedId)
    if (target && target.isScored && target.existingScores && Object.keys(target.existingScores).length > 0) {
      setScores({
        latency: target.existingScores.latency || 0,
        conversationalQuality: target.existingScores.conversationalQuality || 0,
        languageAccuracy: target.existingScores.languageAccuracy || 0,
        aiUsage: target.existingScores.aiUsage || 0,
        technicalQuality: target.existingScores.technicalQuality || 0,
      })
      setNotes(target.notes || '')
    } else {
      setScores({
        latency: 0,
        conversationalQuality: 0,
        languageAccuracy: 0,
        aiUsage: 0,
        technicalQuality: 0,
      })
      setNotes('')
    }
  }, [selectedId, assignedTeams])

  useEffect(() => {
    if (session?.user?.id && !isEvaluating) {
      fetchTeams(session.user.id)
      const interval = setInterval(() => fetchTeams(session.user.id, true), 30_000)
      return () => clearInterval(interval)
    }
  }, [session?.user?.id, isEvaluating])

  const fetchTeams = async (judgeId: string, silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await api.judges.assignedTeams(judgeId)
      if (res.data?.success) {
        if (res.data.activeRound) {
          setActiveRound(res.data.activeRound)
        }
        const teams = res.data.data as Team[]
        const sorted = [...teams].sort((a, b) => {
          // Special Category pending first so judges see the separate queue clearly.
          const aSpecial = a.isSpecialCategory ? 0 : 1
          const bSpecial = b.isSpecialCategory ? 0 : 1
          if (aSpecial !== bSpecial) return aSpecial - bSpecial
          if (a.isScored === b.isScored) return 0
          return a.isScored ? 1 : -1
        })
        setAssignedTeams(sorted)

        // Do not auto-select first team on load. Only preserve selection if user already selected a team.
        if (silent) {
          setSelectedId(prev => (prev && sorted.some(t => t.id === prev) ? prev : ''))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('hackathon_session')
      localStorage.removeItem('hackathon_participant_auth')
      await signOut().catch(() => {})
    } catch (err) {
      console.error('Sign out error:', err)
    } finally {
      window.location.href = '/login'
    }
  }

  const scored = assignedTeams.filter(t => t.isScored).length
  const total = assignedTeams.length
  const specialAssigned = assignedTeams.filter(t => t.isSpecialCategory)
  const specialPending = specialAssigned.filter(t => !t.isScored).length
  const hasSpecialQueue = specialAssigned.length > 0

  const activeTeam = assignedTeams.find(t => t.id === selectedId)
  const track = activeTeam ? getTrackConfig(activeTeam.track) : null

  const filteredTeams = assignedTeams.filter(t =>
    t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.projectTitle.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredSpecial = filteredTeams.filter(t => t.isSpecialCategory)
  const filteredMain = filteredTeams.filter(t => !t.isSpecialCategory)

  const renderTeamCard = (team: Team) => {
    const active = team.id === selectedId
    return (
      <motion.div
        key={team.id}
        variants={itemVariants}
        onClick={() => setSelectedId(team.id)}
        className={`group w-full flex items-center justify-between p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
          team.isSpecialCategory
            ? active
              ? 'bg-sky-50 border-sky-400/50 shadow-[0_10px_25px_rgba(14,165,233,0.12)] ring-1 ring-sky-400/20'
              : 'bg-sky-50/80 border-sky-300/40 hover:bg-sky-50 hover:border-sky-400/40 shadow-sm'
            : active
              ? 'bg-[#F4ECE1] border-[#E83C00]/40 shadow-[0_10px_25px_rgba(232,60,0,0.08)] ring-1 ring-[#E83C00]/10'
              : 'bg-[#F4ECE1] border-[#EAE4D8] hover:bg-white/50 hover:border-[#E83C00]/20 shadow-sm'
        }`}
      >
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-display font-bold text-sm truncate block transition-colors ${
              active
                ? team.isSpecialCategory ? 'text-sky-700' : 'text-[#E83C00]'
                : 'text-slate-900'
            }`}>
              {team.teamName}
            </span>
            {team.isSpecialCategory && (
              <span className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-400/40 text-[9px] font-black text-sky-700 uppercase tracking-wider shrink-0">
                Special Category
              </span>
            )}
            {team.round ? (
              <span className="px-1.5 py-0.5 rounded bg-slate-200 text-[9px] font-bold text-slate-500 shrink-0">
                R{team.round}
              </span>
            ) : null}
            {team.tableNumber && (
              <span className="px-1.5 py-0.5 rounded bg-slate-200 text-[9px] font-bold text-slate-500 shrink-0">
                T-{team.tableNumber}
              </span>
            )}
            {team.agentPhoneNumber && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-[9px] font-bold text-emerald-800 font-mono shrink-0">
                <Phone size={9} /> {team.agentPhoneNumber}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 truncate block font-medium">{team.projectTitle}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          {team.isScored ? (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              team.isSpecialCategory
                ? 'bg-sky-50 border-sky-200'
                : 'bg-orange-50/50 border-orange-200/50'
            }`}>
              <CheckCircle size={12} className={team.isSpecialCategory ? 'text-sky-600' : 'text-[#E83C00]'} />
              <span className={`text-[10px] font-bold font-mono ${team.isSpecialCategory ? 'text-sky-700' : 'text-[#E83C00]'}`}>
                {team.totalScore !== null ? `${(Math.round(team.totalScore * 10) / 10).toFixed(1)} / 20` : 'Scored'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
              <Clock size={12} className="text-slate-500" />
              <span className="text-[10px] font-bold text-slate-600">Pending</span>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const handleSkip = () => {
    const currentIndex = filteredTeams.findIndex(t => t.id === selectedId)
    if (currentIndex === -1) return

    let nextId = ''
    for (let i = currentIndex + 1; i < filteredTeams.length; i++) {
      if (!filteredTeams[i].isScored) {
        nextId = filteredTeams[i].id
        break
      }
    }
    if (!nextId) {
      for (let i = 0; i < currentIndex; i++) {
        if (!filteredTeams[i].isScored) {
          nextId = filteredTeams[i].id
          break
        }
      }
    }
    if (nextId) {
      setSelectedId(nextId)
      setIsEvaluating(false)
    }
  }

  const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0)
  const maxPossibleScore = Object.values(SCORING_RUBRIC).reduce((sum, r) => sum + r.max, 0)

  const handleSubmitEvaluation = async () => {
    if (!session?.user?.id || !activeTeam?.id) {
      toast.error('Session or team invalid. Please refresh.')
      return
    }

    setSubmitting(true)
    const targetTeam = activeTeam
    const targetUserId = session.user.id

    const formattedScores = Object.entries(scores)
      .filter(([_, value]) => value !== undefined && !isNaN(value))
      .map(([key, value]) => ({
        criteriaId: key,
        score: Number(value),
      }))

    const payload: any = {
      judgeId: targetUserId,
      scores: formattedScores,
    }
    if (notes && notes.trim().length > 0) {
      payload.notes = notes.trim()
    }

    try {
      const res = await api.scores.submit(targetTeam.id, payload)

      if (res.data?.success) {
        toast.success(`Evaluation for ${targetTeam.teamName} saved!`)
        setIsEvaluating(false)
        setSelectedId('')
        await fetchTeams(targetUserId, false)
      } else {
        toast.error('Failed to save score.')
      }
    } catch (err: any) {
      console.error('Score submission error:', err)
      const errorMsg = err.response?.data?.message
      toast.error(Array.isArray(errorMsg) ? errorMsg.join(', ') : (errorMsg || 'Failed to save score.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen text-[#1A1A1A] selection:bg-[#E83C00]/20 selection:text-[#E83C00] font-sans relative" style={{ backgroundColor: '#EBE3D5' }}>
      {/* Light dotted grid background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-white/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 flex flex-col min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-5 border-b border-[#EAE4D8]/80 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <SnapServeLogo />
              <span className="text-slate-400 font-bold text-xs mx-0.5 opacity-75">✕</span>
              <VobizLogo />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-[family-name:var(--font-space-grotesk,'Space_Grotesk',sans-serif)] font-black text-sm sm:text-base md:text-lg tracking-tight leading-none text-slate-900 whitespace-nowrap">
                <span className="bg-gradient-to-r from-[#E83C00] via-orange-500 to-amber-500 bg-clip-text text-transparent">
                  AI குரல்
                </span>
                <span className="text-slate-300 font-light mx-1.5">•</span>
                <span className="font-extrabold text-slate-900 tracking-tight">
                  VOICE FOR TAMIL NADU
                </span>
              </h1>
              <div className="flex items-center gap-2 mt-1 whitespace-nowrap overflow-hidden">
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-[#E83C00] text-white tracking-widest uppercase shadow-xs shrink-0 whitespace-nowrap">
                  JUDGE PANEL
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate hidden xs:inline sm:inline">
                  India's Biggest Voice-a-thon
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-[#EAE4D8]/60 sm:border-t-0">
            <span className="text-xs font-medium text-slate-500 block truncate">
              Welcome, <span className="text-slate-900 font-bold">{session?.user?.name}</span>
            </span>
            <AnimatedSignOutButton onClick={handleSignOut} />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col lg:flex-row gap-6 pb-12">

          {/* Left Column: Team List */}
          <div className="flex-1 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search teams by name or project title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#EAE4D8] rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E83C00] focus:ring-1 focus:ring-[#E83C00] shadow-sm transition-all"
              />
            </div>
            <div className="flex items-center justify-between border border-[#EAE4D8] p-4 rounded-2xl shadow-sm" style={{ backgroundColor: '#F4ECE1' }}>
              <div>
                <h2 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                  Assigned Teams
                  <span className="px-2 py-0.5 rounded-full bg-[#E83C00]/10 text-[9px] text-[#E83C00] font-bold border border-[#E83C00]/20 tracking-wider uppercase">
                    {activeRound === 3 ? 'Judging Complete' : `Round ${activeRound}`}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Evaluate your queue</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-[#E83C00]">{scored}/{total}</span>
                <span className="text-[10px] text-slate-400 block uppercase tracking-widest mt-0.5 font-bold">Scored</span>
              </div>
            </div>

            {hasSpecialQueue && (
              <div className="rounded-2xl border border-sky-400/40 bg-sky-50 px-4 py-3.5 shadow-sm space-y-1">
                <p className="text-xs font-black text-sky-900 uppercase tracking-wider flex items-center gap-2">
                  <Users size={13} className="text-sky-600" />
                  Special Category queue ({specialAssigned.length})
                </p>
                <p className="text-[11px] text-sky-800/80 font-medium leading-relaxed">
                  You have school Special Category teams assigned. Score them as their own track — they do not compete in the main Top 20 / Top 5.
                  {specialPending > 0 ? ` ${specialPending} still pending.` : ' All Special Category scores submitted.'}
                </p>
              </div>
            )}

            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
              {loading ? (
                <div className="py-12 text-center text-slate-500 text-sm font-medium">Fetching teams...</div>
              ) : filteredTeams.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm flex flex-col items-center border border-dashed border-slate-300 rounded-2xl bg-white/40 p-6 space-y-2">
                  <Inbox className="mb-1 text-slate-400" size={36} />
                  <p className="font-bold text-slate-700">
                    {searchQuery
                      ? `No teams found matching "${searchQuery}".`
                      : activeRound === 3
                        ? '👑 Judging Complete — Grand Finale Reveal Stage'
                        : activeRound === 2
                          ? '🎯 Round 2 in Progress — Awaiting Team Assignments'
                          : 'No teams assigned yet.'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    {searchQuery
                      ? 'Try clearing your search query.'
                      : activeRound === 3
                        ? 'All judging is finished. The Top 5 winners are decided by their Round 2 scores, so there is no scoring in Round 3 — the host now reveals the winners on stage.'
                        : activeRound === 2
                          ? 'The admin has advanced the stage. Your queue will appear here as soon as new round teams are assigned to you.'
                          : 'Your queue will populate once an administrator assigns teams to your panel.'}
                  </p>
                </div>
              ) : (
                <>
                  {filteredSpecial.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 px-1 pt-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700">
                          Special Category · Score separately
                        </span>
                        <span className="h-px flex-1 bg-sky-300/50" />
                        <span className="text-[10px] font-bold text-sky-600">
                          {filteredSpecial.filter(t => t.isScored).length}/{filteredSpecial.length}
                        </span>
                      </div>
                      {filteredSpecial.map(renderTeamCard)}
                    </div>
                  )}
                  {filteredMain.length > 0 && (
                    <div className="space-y-2.5">
                      {filteredSpecial.length > 0 && (
                        <div className="flex items-center gap-2 px-1 pt-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                            Main Competition
                          </span>
                          <span className="h-px flex-1 bg-slate-300/60" />
                          <span className="text-[10px] font-bold text-slate-500">
                            {filteredMain.filter(t => t.isScored).length}/{filteredMain.length}
                          </span>
                        </div>
                      )}
                      {filteredMain.map(renderTeamCard)}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>

          {/* Right Column: Preview Panel */}
          <div className={`
            lg:w-[460px] shrink-0
            ${activeTeam ? 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm lg:static lg:block lg:bg-transparent lg:p-0 lg:backdrop-blur-none' : 'hidden lg:block'}
          `}>
            {activeTeam && track ? (
              <div className="w-full max-w-lg lg:max-w-none border border-[#EAE4D8] rounded-3xl lg:sticky lg:top-8 shadow-xl flex flex-col overflow-hidden max-h-[92dvh] lg:max-h-[calc(100vh-100px)]" style={{ backgroundColor: '#F4ECE1' }}>

                {/* Mobile Close Handle/Button for Preview Mode */}
                {!isEvaluating && (
                  <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preview Team</span>
                    <button onClick={() => setSelectedId('')} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-700 shadow-sm border border-slate-200">
                      <X size={16} />
                    </button>
                  </div>
                )}

                {isEvaluating ? (
                  // --- EVALUATION FORM ---
                  <div className="flex flex-col flex-1 min-h-0">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-[#EAE4D8] shrink-0">
                      <div>
                        <h3 className="font-bold text-[#1A1A1A]">Score sheet</h3>
                        <p className="text-xs text-slate-500 font-medium">Evaluating {activeTeam.teamName}</p>
                      </div>
                      <button
                        onClick={() => setIsEvaluating(false)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white/50 rounded-full transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {activeTeam.isSpecialCategory && (
                      <div className="mx-3.5 mt-2.5 px-3 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 shadow-xs">
                        <p className="text-[11px] font-black text-sky-950 uppercase tracking-wider">
                          Special Category team
                        </p>
                        <p className="text-[10.5px] text-sky-900/80 font-medium mt-0.5 leading-snug">
                          Score this school team for the Special Category track only. Same rubric — separate competition from the main Top 20 / Top 5.
                        </p>
                      </div>
                    )}

                    {/* Organizer Social Bonus Banner */}
                    <div className="mx-3.5 mt-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <Star className="text-amber-600 fill-amber-500 shrink-0" size={14} />
                        <p className="text-[11px] font-black text-amber-950">
                          Social Bonus: <span className="text-[#E83C00]">+{activeTeam.bonusPoints || 0} / 10 Pts</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-500/15 px-2 py-0.5 rounded-md">
                        {activeTeam.bonusPoints && activeTeam.bonusPoints >= 10 ? '⭐ Completed' : `+${activeTeam.bonusPoints || 0} Pts`}
                      </span>
                    </div>

                    {/* Compact Criteria List (Fits on 1 Screen) */}
                    <div className="flex-1 overflow-y-auto px-3.5 py-2.5 space-y-1.5">
                      {Object.entries(SCORING_RUBRIC).map(([key, item]) => (
                        <StarScore
                          key={key}
                          label={item.label}
                          description={item.description}
                          value={scores[key] || 0}
                          onChange={(val) => setScores(s => ({ ...s, [key]: val }))}
                        />
                      ))}

                      {/* Notes / Feedback */}
                      <div className="bg-white border border-[#EAE4D8] p-2.5 rounded-xl space-y-1">
                        <label className="text-[11px] font-bold text-[#1A1A1A] block">Feedback Notes (Optional)</label>
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="What did they do well? Suggestions for improvement?"
                          className="w-full bg-[#F4ECE1]/50 border border-[#EAE4D8] rounded-lg px-2.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E83C00] transition-colors resize-none"
                        />
                      </div>

                      {/* 2 Lines of Neat Judge Guidance Text */}
                      <div className="py-1 text-center">
                        <p className="text-[10px] font-semibold text-slate-500 leading-tight">
                          💡 Tap stars to rate (1 Star = 0.4 Pts · 5 Stars = 2.0 Pts Max).
                        </p>
                        <p className="text-[9.5px] text-slate-400 mt-0.5">
                          Scores &amp; bonus points combine live for the team leaderboard.
                        </p>
                      </div>
                    </div>

                    {/* Compact Footer */}
                    <div className="px-4 py-3 border-t border-[#EAE4D8] shrink-0 pb-6 sm:pb-4 space-y-2.5">
                      <div className="p-3.5 px-4 rounded-2xl bg-white border border-[#EAE4D8] flex items-center justify-between text-xs sm:text-sm font-extrabold shadow-xs">
                        <span className="text-slate-700">Test Call ({(totalScore).toFixed(1)}) + Bonus ({activeTeam.bonusPoints || 0})</span>
                        <span className="font-mono text-sm font-black text-[#E83C00]">
                          Total: {(totalScore + (activeTeam.bonusPoints || 0)).toFixed(1)} <span className="text-xs text-slate-400 font-bold">/ 20 Pts</span>
                        </span>
                      </div>

                      <button
                        onClick={handleSubmitEvaluation}
                        disabled={submitting || totalScore === 0}
                        className="w-full py-3.5 rounded-2xl bg-[#E83C00] text-white font-black text-sm shadow-[0_4px_15px_rgba(232,60,0,0.25)] hover:bg-[#FF4500] hover:shadow-[0_6px_20px_rgba(232,60,0,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {submitting ? 'Submitting...' : activeTeam.isScored ? `Update Score (${(totalScore + (activeTeam.bonusPoints || 0)).toFixed(1)} / 20)` : `Submit Evaluation (${(totalScore + (activeTeam.bonusPoints || 0)).toFixed(1)} / 20)`}
                      </button>
                    </div>
                  </div>
                ) : (
                  // --- TEAM OVERVIEW ---
                  <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-wrap">
                          {activeTeam.isSpecialCategory && (
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full border bg-sky-50 text-sky-800 border-sky-300 uppercase tracking-widest">
                              Special Category
                            </span>
                          )}
                          <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest"
                            style={{ background: `${track.color}10`, color: track.color, borderColor: `${track.color}20` }}
                          >
                            {track.label}
                          </span>
                          {activeTeam.tableNumber && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-slate-100 text-slate-500 border-slate-200 uppercase tracking-widest">
                              Table: {activeTeam.tableNumber}
                            </span>
                          )}
                          {activeTeam.bonusPoints !== undefined && (
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1 font-mono">
                              <Star size={10} className="fill-amber-500 text-amber-500" /> +{activeTeam.bonusPoints} Bonus Pts
                            </span>
                          )}
                          {activeTeam.agentPhoneNumber && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 font-mono">
                              <Phone size={10} /> {activeTeam.agentPhoneNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {activeTeam.isSpecialCategory && (
                        <div className="rounded-xl border border-sky-300/50 bg-sky-50 px-3.5 py-3">
                          <p className="text-[11px] font-black text-sky-950 uppercase tracking-wider">
                            Score as Special Category
                          </p>
                          <p className="text-[11px] text-sky-900/80 font-medium mt-1 leading-relaxed">
                            This school team is in the Special Category track. Use the same scoring rubric; results feed the Special Category leaderboard, not the main Top 20 / Top 5.
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">{activeTeam.teamName}</h2>
                        <p className="text-sm text-slate-500 font-medium">{activeTeam.college}</p>
                      </div>

                      <div className="pt-6 border-t border-slate-100 space-y-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Project Overview</span>
                          <h3 className="text-base font-bold text-slate-900">{activeTeam.projectTitle}</h3>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium mt-1">{activeTeam.projectDescription}</p>
                        </div>

                        {(activeTeam.agentName || activeTeam.agentSolution || activeTeam.agentPhoneNumber) && (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {activeTeam.agentName && <h4 className="text-sm font-bold text-slate-900 mb-1">{activeTeam.agentName}</h4>}
                            {activeTeam.agentSolution && <p className="text-xs text-slate-600 leading-relaxed">{activeTeam.agentSolution}</p>}

                            {activeTeam.agentPhoneNumber && (
                              <div className="mt-4 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                  <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest block">Agent Phone Number</span>
                                  <span className="text-base font-black font-mono text-emerald-950">{activeTeam.agentPhoneNumber}</span>
                                </div>
                                <a
                                  href={`tel:${activeTeam.agentPhoneNumber}`}
                                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-lg shadow-sm transition-colors text-xs shrink-0 w-full sm:w-auto"
                                >
                                  <Phone size={14} fill="currentColor" />
                                  Call Agent Live
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {activeTeam.techStack && activeTeam.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {activeTeam.techStack.map(tech => (
                              <span key={tech} className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}

                        {(activeTeam.githubUrl || activeTeam.demoUrl) && (
                          <div className="flex flex-wrap gap-3 pt-2">
                            {activeTeam.demoUrl && (
                              <a href={activeTeam.demoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-[#E83C00] hover:text-[#FF4500] bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 transition-colors">
                                <Globe size={14} /> Live Demo
                              </a>
                            )}
                            {activeTeam.githubUrl && (
                              <a href={activeTeam.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
                                <Github size={14} /> Repository
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-slate-100 space-y-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Team Roster</span>
                        <div className="flex flex-wrap gap-2">
                          {activeTeam.members.map(m => (
                            <div key={m.name} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl hover:border-slate-300 transition-colors">
                              <Avatar name={m.name} size="xs" />
                              <span className="text-xs font-bold text-slate-700">{m.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 border-t border-slate-200 shrink-0 pb-8 sm:pb-6" style={{ backgroundColor: '#F4ECE1' }}>
                      {activeTeam.isScored && activeTeam.totalScore !== null ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center bg-orange-50/50 border border-orange-200 p-4 rounded-xl">
                            <div>
                              <span className="text-[10px] text-[#E83C00] uppercase tracking-wider block font-bold">Evaluated Score</span>
                              <span className="text-xl font-mono font-bold text-[#E83C00]">{activeTeam.totalScore} / 20</span>
                              {activeTeam.notes && (
                                <p className="text-xs text-slate-600 font-medium mt-1 font-sans italic">"{activeTeam.notes}"</p>
                              )}
                            </div>
                            <CheckCircle size={24} className="text-[#E83C00]" />
                          </div>
                          {!activeTeam.isLocked && (
                            <button
                              onClick={() => setIsEvaluating(true)}
                              className="w-full py-3.5 rounded-xl bg-[#E83C00] text-white hover:bg-[#FF4500] font-bold text-sm transition-all shadow-sm"
                            >
                              Edit Evaluation ({activeTeam.totalScore} / 20)
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col-reverse sm:flex-row gap-3">
                          <button
                            onClick={handleSkip}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-all font-bold text-sm shadow-sm"
                          >
                            Skip for Now <FastForward size={16} />
                          </button>
                          <button
                            onClick={() => setIsEvaluating(true)}
                            className="flex-[2] flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl bg-[#E83C00] text-white hover:bg-[#FF4500] hover:shadow-[0_8px_25px_rgba(232,60,0,0.25)] transition-all font-bold text-sm transform hover:-translate-y-0.5"
                          >
                            Start Evaluation <ArrowUpRight size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-[#EAE4D8] rounded-3xl p-8 min-h-[350px] flex flex-col items-center justify-center text-center space-y-3 bg-[#F4ECE1]/60 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#E83C00]/10 flex items-center justify-center text-[#E83C00] font-bold">
                  <Users size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-800">Select a Team</h3>
                <p className="text-xs text-slate-500 max-w-xs font-medium">
                  Click or tap any team from your assigned list on the left to view their project details and test their AI agent.
                </p>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  )
}

export default JudgeDashboard
