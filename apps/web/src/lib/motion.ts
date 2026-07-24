import { Variants, Transition } from 'framer-motion'

// ─── Shared Transitions ───────────────────────────────────────────────────────
export const spring: Transition = { type: 'spring', stiffness: 400, damping: 30 }
export const smooth: Transition = { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
export const fast: Transition = { duration: 0.2, ease: 'easeOut' }

// ─── Page Variants ────────────────────────────────────────────────────────────
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
}

// ─── Container (Stagger children) ────────────────────────────────────────────
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

// ─── Item (used inside stagger containers) ───────────────────────────────────
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
}

export const itemVariantsLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
}

export const itemVariantsRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
}

// ─── Scale in ────────────────────────────────────────────────────────────────
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
}

// ─── Card Hover ───────────────────────────────────────────────────────────────
export const cardHoverVariants = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.01,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
}

// ─── Hero Title ───────────────────────────────────────────────────────────────
export const heroTitleVariants: Variants = {
  hidden: { opacity: 0, y: 60, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
  },
}

// ─── Stagger container for hero ───────────────────────────────────────────────
export const heroContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 },
  },
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export const sidebarVariants: Variants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: smooth },
}

// ─── Leaderboard Row ──────────────────────────────────────────────────────────
export const leaderboardRowVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.4, ease: 'easeOut' },
  }),
}

// ─── Number count up ─────────────────────────────────────────────────────────
export const numberVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ─── Notification/Toast ───────────────────────────────────────────────────────
export const toastVariants: Variants = {
  hidden: { opacity: 0, x: 60, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: spring },
  exit: { opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.2 } },
}
