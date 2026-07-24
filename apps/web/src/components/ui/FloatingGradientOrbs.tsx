import { motion } from 'framer-motion'

export function FloatingGradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Orb 1: Primary Indigo */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[-10%] left-[10%] w-[35vw] h-[35vw] max-w-[500px] rounded-full blur-[120px] opacity-25"
        style={{
          background: 'radial-gradient(circle, #4F46E5 0%, rgba(79, 70, 229, 0) 70%)',
        }}
      />

      {/* Orb 2: Accent Cyan */}
      <motion.div
        animate={{
          x: [0, -60, 40, 0],
          y: [0, 30, -50, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-[10%] right-[-5%] w-[40vw] h-[40vw] max-w-[600px] rounded-full blur-[140px] opacity-20"
        style={{
          background: 'radial-gradient(circle, #06B6D4 0%, rgba(6, 182, 212, 0) 70%)',
        }}
      />

      {/* Orb 3: Secondary Violet */}
      <motion.div
        animate={{
          x: [0, 30, -30, 0],
          y: [0, 40, -20, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[30vw] h-[30vw] max-w-[400px] rounded-full blur-[100px] opacity-15"
        style={{
          background: 'radial-gradient(circle, #8B5CF6 0%, rgba(139, 92, 246, 0) 70%)',
        }}
      />
    </div>
  )
}
