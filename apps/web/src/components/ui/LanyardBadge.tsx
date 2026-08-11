import React, { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Sparkles, Phone, MapPin, Wifi, ShieldCheck, QrCode, RotateCw, Cpu, Layers, Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { BrandLockup, SnapServeMark } from '@/components/brand/BrandLogos'

interface LanyardBadgeProps {
  participantName?: string
  memberRole?: string
  teamName?: string
  trackName?: string
  tableNumber?: string | null
  agentName?: string | null
  agentPhoneNumber?: string | null
  agentNumber?: string | null
  projectTitle?: string | null
  agentSolution?: string | null
  techStack?: string[]
  members?: { name: string; role?: string }[]
}

export function LanyardBadge({
  participantName = 'Participant',
  memberRole = 'Team Member',
  teamName = 'Team Alpha',
  trackName = 'Voice AI Agent',
  tableNumber = 'T-01',
  agentName = 'VoxAgent Pro',
  agentPhoneNumber = '+1 (800) 555-0199',
  agentNumber = '#01',
  projectTitle = 'Voice AI Solution',
  agentSolution = 'Real-time Voice Automation',
  techStack = ['NestJS', 'React', 'ElevenLabs'],
  members = []
}: LanyardBadgeProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  // Motion physics for interactive elastic rubber drag & pendulum swing
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)

  // Spring physics for smooth tilt and rubber recoil
  const springX = useSpring(dragX, { stiffness: 450, damping: 20 })
  const springY = useSpring(dragY, { stiffness: 450, damping: 20 })

  // Dynamic strap height: top edge stays FIXED at top, height stretches from 75px to (75 + dragY)!
  const strapHeight = useTransform(springY, [-50, 0, 250], [60, 75, 325])

  // Pendulum swing angle derived from horizontal drag
  const strapRotate = useTransform(springX, [-150, 150], [-25, 25])

  // Card 3D tilt while dragging
  const rotateY = useTransform(springX, [-120, 120], [-25, 25])
  const rotateX = useTransform(springY, [-120, 120], [20, -20])

  const handleDownloadPass = () => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 750
      canvas.height = 1150
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Smooth rendering
      ctx.imageSmoothingEnabled = true

      // 1. Transparent / Warm Background
      ctx.fillStyle = '#F4ECE1'
      ctx.fillRect(0, 0, 750, 1150)

      // 2. Lanyard Fabric Strap (Top center)
      ctx.fillStyle = '#12141A'
      ctx.fillRect(350, 0, 50, 120)
      ctx.fillStyle = '#E83C00'
      ctx.fillRect(374, 0, 2, 120) // Stitching line

      // 3. Plain Black Metallic Clamp & Swivel Snap Hook
      ctx.fillStyle = '#1A1A1D'
      ctx.fillRect(335, 90, 80, 20)
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 1.5
      ctx.strokeRect(335, 90, 80, 20)

      // Swivel ring & snap hook
      ctx.strokeStyle = '#475569'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(375, 128, 10, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = '#1E293B'
      ctx.fillRect(370, 138, 10, 25)
      ctx.strokeRect(370, 138, 10, 25)

      // 4. Card Body (Solid Dark Matte #12141A)
      const cardX = 125
      const cardY = 150
      const cardW = 500
      const cardH = 920
      const cardR = 36

      ctx.fillStyle = '#12141A'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
      ctx.shadowBlur = 40
      ctx.shadowOffsetY = 20

      // Rounded rectangle card path
      ctx.beginPath()
      ctx.roundRect(cardX, cardY, cardW, cardH, cardR)
      ctx.fill()

      // Reset shadow for internal drawings
      ctx.shadowColor = 'transparent'
      ctx.strokeStyle = '#1E293B'
      ctx.lineWidth = 2
      ctx.stroke()

      // 5. Punch Hole at Top Center of Card
      ctx.fillStyle = '#0B0F17'
      ctx.beginPath()
      ctx.arc(375, 178, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 2
      ctx.stroke()

      // 6. Card Header Text (Exact Screenshot 2 Sans-Serif Typography)
      ctx.textAlign = 'left'
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 16px sans-serif'
      ctx.fillText('SNAPSERVE AI x VOBIZ AI VOICE 2026', 165, 225)

      ctx.fillStyle = '#D4AF37'
      ctx.font = '900 15px sans-serif'
      ctx.fillText('TECH INNOVATION SUMMIT', 165, 248)

      // Divider line under header
      ctx.strokeStyle = '#1E293B'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(155, 265)
      ctx.lineTo(595, 265)
      ctx.stroke()

      // 7. Hero VIP & AI Microchip Graphic
      // Big Metallic Gold VIP
      ctx.textAlign = 'left'
      ctx.fillStyle = '#D4AF37'
      ctx.font = '900 84px sans-serif'
      ctx.fillText('VIP', 165, 360)

      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 14px monospace'
      const formattedTable = tableNumber ? (tableNumber.toUpperCase().startsWith('T-') ? tableNumber.toUpperCase() : `TABLE ${tableNumber}`) : 'TABLE T-01'
      ctx.fillText(formattedTable, 170, 390)

      // AI Microchip Graphic (Right)
      const chipX = 460
      const chipY = 295
      const chipW = 100
      const chipH = 100

      // Glowing rays background
      const grad = ctx.createRadialGradient(chipX + 50, chipY + 50, 5, chipX + 50, chipY + 50, 60)
      // 7. Clean Frameless SnapServe Brand Mark (No yellow borders or boxes)
      const markX = 485
      const markY = 295

      // Top Pill
      ctx.fillStyle = '#F8FAFC'
      ctx.beginPath()
      ctx.roundRect(markX, markY, 70, 18, 9)
      ctx.fill()

      // Middle Pill
      ctx.fillStyle = '#94A3B8'
      ctx.beginPath()
      ctx.roundRect(markX + 12, markY + 25, 70, 18, 9)
      ctx.fill()

      // Bottom Pill
      ctx.fillStyle = '#64748B'
      ctx.beginPath()
      ctx.roundRect(markX + 24, markY + 50, 58, 18, 9)
      ctx.fill()

      // 8. Participant Info Section
      ctx.textAlign = 'left'

      // Name
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 38px sans-serif'
      ctx.fillText(participantName.toUpperCase(), 165, 475)

      // Speaker / Role
      ctx.fillStyle = '#D4AF37'
      ctx.font = '900 17px sans-serif'
      ctx.fillText((memberRole || 'TEAM LEAD').toUpperCase(), 165, 510)

      // Subtitle / Track
      ctx.fillStyle = '#CBD5E1'
      ctx.font = '700 15px sans-serif'
      ctx.fillText('AI குரல் • VOICE FOR TAMIL NADU', 165, 535)

      // Team Name
      ctx.fillStyle = '#E83C00'
      ctx.font = '900 16px sans-serif'
      ctx.fillText(teamName.toUpperCase(), 165, 560)

      // Solid Orange Horizontal Accent Bar
      ctx.fillStyle = '#E83C00'
      ctx.beginPath()
      ctx.roundRect(165, 580, 420, 6, 3)
      ctx.fill()

      // Date & Venue Location Section
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 20px sans-serif'
      ctx.fillText('SATURDAY, 5 SEP 2026', 165, 620)

      ctx.fillStyle = '#D4AF37'
      ctx.font = '900 14px sans-serif'
      ctx.fillText('OLIVE PUBLIC SCHOOL, CHENNAI', 165, 645)

      // 9. White Barcode Container Box
      const barX = 165
      const barY = 740
      const barW = 420
      const barH = 140
      const barR = 24

      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.roundRect(barX, barY, barW, barH, barR)
      ctx.fill()

      // Barcode lines
      const lineXStart = 205
      const lineYStart = 760
      const barHeights = 75
      const widths = [4, 2, 5, 2, 6, 2, 4, 5, 2, 3, 6, 2, 4, 3, 2, 5, 2, 4, 6, 2, 5, 2, 4, 6]

      ctx.fillStyle = '#000000'
      let currentX = lineXStart
      widths.forEach((w) => {
        ctx.fillRect(currentX, lineYStart, w, barHeights)
        currentX += w + 6
      })

      // Barcode numeric string
      ctx.textAlign = 'center'
      ctx.font = 'bold 18px monospace'
      ctx.fillText('9  781234  567897', 375, 862)

      // Footer Access Marker
      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 13px monospace'
      ctx.fillText(`ACCESS | VIP PASSHOLDER | [${agentNumber || '#0117'}]`, 375, 915)

      // Download PNG trigger
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `SnapServe_VIP_Pass_${teamName.replace(/\s+/g, '_')}.png`
      link.click()
      toast.success('Downloaded HD Screenshot 2 VIP Pass PNG!')
    } catch (err) {
      console.error(err)
      toast.error('Could not download pass image.')
    }
  }

  const handleShareLinkedIn = () => {
    const text = `🚀 Excited to compete at SnapServe ★ Vobiz AI Voice Hackathon 2026 with my team "${teamName}"!\n\n🤖 Our Project: ${projectTitle || agentName}\n📍 Track: ${trackName}\n\n#SnapServeHackathon #VoiceAI #AIAgents #Hackathon2026`
    navigator.clipboard.writeText(text)
    toast.success('LinkedIn post caption copied to clipboard!')
    window.open('https://www.linkedin.com/feed/', '_blank')
  }

  return (
    <div className="relative flex flex-col items-center justify-center pt-0 pb-2 w-full max-w-sm mx-auto select-none perspective-[1000px] overflow-visible">

      {/* 1. FIXED TOP ANCHOR PIN (Always stays 100% fixed at top, never moves down!) */}
      <div className="w-10 h-3.5 rounded-full bg-slate-950/20 border border-slate-900/30 shadow-inner z-30 shrink-0 mb-[-4px]" />

      {/* 2. DYNAMICALLY STRETCHING STRAP (Top edge anchored at top pin, height expands with dragY!) */}
      <div className="relative flex flex-col items-center origin-top z-20">
        <motion.div
          style={{
            height: strapHeight,
            rotateZ: strapRotate,
          }}
          className="w-7 relative flex flex-col items-center overflow-hidden rounded-b-md bg-gradient-to-b from-slate-950 via-[#1A1A1A] to-slate-900 border-x border-slate-700/50 shadow-md origin-top shrink-0 transition-[height] duration-75"
        >
          {/* Repeating Lanyard Text Pattern */}
          <div className="w-full h-[350%] flex flex-col justify-around items-center py-2 opacity-90">
            <span className="text-[5.5px] font-black text-[#E83C00] tracking-widest uppercase rotate-90 whitespace-nowrap">
              SNAPSERVE ★ VOBIZ
            </span>
            <span className="text-[5.5px] font-black text-white tracking-widest uppercase rotate-90 whitespace-nowrap">
              AI VOICE 2026
            </span>
            <span className="text-[5.5px] font-black text-[#E83C00] tracking-widest uppercase rotate-90 whitespace-nowrap">
              SNAPSERVE ★ VOBIZ
            </span>
            <span className="text-[5.5px] font-black text-white tracking-widest uppercase rotate-90 whitespace-nowrap">
              AI VOICE 2026
            </span>
          </div>
          {/* Central Stitching Line */}
          <div className="absolute inset-y-0 w-[1.5px] bg-[#E83C00]/40 left-1/2 -translate-x-1/2" />
        </motion.div>
      </div>

      {/* 3. DRAGGABLE CLIP & 3D CARD (Translates with dragX & dragY at bottom of stretching strap) */}
      <motion.div
        drag
        dragSnapToOrigin={true}
        dragElastic={0.45}
        dragTransition={{ bounceStiffness: 450, bounceDamping: 20 }}
        onDrag={(_, info) => {
          dragX.set(info.offset.x)
          dragY.set(info.offset.y)
        }}
        onDragEnd={() => {
          dragX.set(0)
          dragY.set(0)
        }}
        style={{
          x: springX,
          y: springY,
        }}
        className="relative flex flex-col items-center justify-center cursor-grab active:cursor-grabbing origin-top z-10 w-full mt-[-1px]"
      >
        {/* ─── METALLIC CLAMP & SWIVEL HOOK ASSEMBLY (Exact Screenshot 2) ─── */}
        <div className="flex flex-col items-center relative z-20 shrink-0">
          {/* Black Matte Metallic Clamp Sleeve */}
          <div className="w-8 h-4 bg-[#1A1A1D] border border-slate-700/80 rounded-xs shadow-md z-20" />

          {/* Lower Fabric Strap Section */}
          <div className="w-7 h-3 bg-gradient-to-b from-[#1A1A1D] to-slate-900 border-x border-slate-700/50 shadow-inner mt-[-1px]" />

          {/* Black Metallic Swivel D-Ring & Snap Hook */}
          <div className="flex flex-col items-center mt-[-1px] relative z-20">
            {/* Black Metallic D-Ring */}
            <div className="w-6 h-3 rounded-t-full border-t-2 border-x-2 border-slate-700 bg-slate-900 shadow-sm" />

            {/* Black Metallic Swivel Joint & Snap Hook Claw */}
            <div className="w-2.5 h-5 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 rounded-b-sm border border-slate-700 shadow-md mt-[-2px] relative">
              {/* Hook Trigger Pin */}
              <div className="absolute right-[-2px] top-1 w-1 h-2 bg-slate-600 rounded-r-xs" />
            </div>
          </div>
        </div>

        {/* ─── 3D Flippable Card Container ──────────────────────────────────── */}
        <div className="w-full max-w-[285px] h-[440px] relative mt-[-10px]">
          <motion.div
            style={{
              rotateX,
              rotateY: useTransform(rotateY, (rY) => rY + (isFlipped ? 180 : 0)),
              transformStyle: 'preserve-3d',
            }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 350, damping: 18 }}
            className="w-full h-full relative rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-slate-800 group"
          >
            {/* Subtle Reflective Gloss Overlay */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity z-30 overflow-hidden" />

            {/* ─── FRONT FACE (Exact Screenshot 2 VIP Pass) ────────────────────────── */}
            <div
              className="absolute inset-0 w-full h-full rounded-3xl p-5 pt-3 flex flex-col justify-between overflow-hidden shadow-2xl border border-slate-800/90"
              style={{
                backgroundColor: '#12141A',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              {/* Physical Card Punch Hole (Cutout revealing background) */}
              <div className="w-4.5 h-4.5 rounded-full bg-[#FAF8F5] border border-slate-900 mx-auto shadow-inner mb-1 shrink-0 relative z-10 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-[#12141A]/10 border border-slate-400/40" />
              </div>

              {/* 1. Header Text (Exact Screenshot 2 Sans-Serif Typography & Style) */}
              <div className="text-left space-y-0.5 pb-1">
                <span className="text-[10px] font-extrabold text-white tracking-wide uppercase block font-sans drop-shadow-xs">
                  SNAPSERVE AI x VOBIZ AI VOICE 2026
                </span>
                <span className="text-[9.5px] font-extrabold text-[#D4AF37] tracking-widest uppercase block font-sans">
                  TECH INNOVATION SUMMIT
                </span>
              </div>

              {/* 2. Hero VIP & Glowing AI Processor Chip Section */}
              <div className="flex items-center justify-between py-1 px-1">
                {/* Big Metallic Gold VIP Text */}
                <div className="flex flex-col text-left">
                  <span className="text-4xl font-black tracking-tight leading-none text-[#D4AF37] drop-shadow-md font-display">
                    VIP
                  </span>
                  <span className="text-[7.5px] font-mono font-bold text-slate-400 tracking-widest uppercase mt-1">
                    {tableNumber ? (tableNumber.toUpperCase().startsWith('T-') ? tableNumber.toUpperCase() : `TABLE ${tableNumber}`) : 'TABLE T-01'}
                  </span>
                </div>

                {/* Clean Frameless SnapServe Brand Mark (No yellow borders or boxes) */}
                <div className="flex items-center justify-center p-1 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-md" style={{ width: '48px', height: '48px' }} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5" y="15" width="75" height="20" rx="10" fill="#FFFFFF" />
                    <rect x="18" y="42" width="75" height="20" rx="10" fill="#94A3B8" />
                    <rect x="31" y="69" width="64" height="20" rx="10" fill="#64748B" />
                  </svg>
                </div>
              </div>

              {/* 3. Participant Credentials & Stack (Exact Screenshot 2 Typography) */}
              <div className="text-left space-y-1.5 my-auto">
                {/* Big Participant Name */}
                <div className="space-y-0.5">
                  <h2 className="font-display font-black text-2xl text-white tracking-tight uppercase leading-none truncate">
                    {participantName}
                  </h2>
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest pt-0.5">
                    {memberRole || 'TEAM LEAD'}
                  </p>
                  <p className="text-[9px] font-extrabold text-slate-300 uppercase tracking-wider">
                    AI குரல் • VOICE FOR TAMIL NADU
                  </p>
                  <p className="text-[9.5px] font-black text-[#E83C00] uppercase tracking-wide">
                    {teamName}
                  </p>
                </div>

                {/* Solid Orange Horizontal Accent Bar (Exact Screenshot 2) */}
                <div className="h-[3px] w-full bg-[#E83C00] rounded-full my-1.5" />

                {/* Date & Venue Location Section */}
                <div className="space-y-0.5 pt-1">
                  <p className="text-[12px] font-black text-white uppercase tracking-widest leading-none">
                    SATURDAY, 5 SEP 2026
                  </p>
                  <p className="text-[8.5px] font-extrabold text-[#D4AF37] uppercase tracking-wider truncate">
                    OLIVE PUBLIC SCHOOL, CHENNAI
                  </p>
                </div>
              </div>

              {/* 4. White Barcode Container Box (Exact Screenshot 2 Style) */}
              <div className="space-y-1 pt-1">
                <div className="bg-white rounded-xl p-2 flex flex-col items-center justify-center shadow-md">
                  {/* Barcode SVG lines */}
                  <div className="flex items-center gap-[2px] h-6 w-full justify-center px-2">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 3, 2, 1, 4].map((width, idx) => (
                      <div key={idx} className="bg-black h-full" style={{ width: `${width}px` }} />
                    ))}
                  </div>
                  <span className="font-mono text-[8.5px] font-bold text-black tracking-widest mt-0.5">
                    9 781234 567897
                  </span>
                </div>

                <div className="text-center">
                  <span className="text-[7.5px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    ACCESS | VIP PASSHOLDER | [{agentNumber || '#0117'}]
                  </span>
                </div>
              </div>
            </div>

            {/* ─── BACK FACE (Ultra-Premium Dark Glassmorphic Obsidian) ────────────────────────── */}
            <div
              className="absolute inset-0 w-full h-full rounded-3xl p-4.5 flex flex-col justify-between overflow-hidden shadow-2xl border border-slate-800/90"
              style={{
                backgroundColor: '#0F1117',
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              {/* Subtle Radial Glow in Background */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

              {/* Card Punch Hole at Top Center */}
              <div className="w-4.5 h-4.5 rounded-full bg-[#FAF8F5] border border-slate-900 mx-auto shadow-inner mb-1 shrink-0 relative z-10 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-[#0F1117]/10 border border-slate-400/40" />
              </div>

              {/* Top Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 relative z-10">
                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-1.5 font-sans">
                  <Sparkles size={12} className="text-[#D4AF37]" /> VIP BUILDER ACCESS
                </span>
                <span className="text-[8px] text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full font-sans font-extrabold border border-emerald-500/40 tracking-wider flex items-center gap-1">
                  VERIFIED PASS ✓
                </span>
              </div>

              {/* Tech Stack & Wi-Fi Details */}
              <div className="space-y-2.5 my-auto text-left relative z-10">
                {/* Tech Stack */}
                {techStack && techStack.length > 0 && (
                  <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800/90 space-y-1.5 shadow-2xs backdrop-blur-md">
                    <div className="flex items-center justify-between text-[10.5px] font-extrabold text-white font-sans">
                      <div className="flex items-center gap-1.5">
                        <Layers size={12} className="text-[#D4AF37]" /> Submitted Tech Stack
                      </div>
                      <span className="text-[8px] font-mono font-bold text-slate-500">VOICE AI</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {techStack.map((tech, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-700/70 text-[9px] font-sans font-bold text-white shadow-2xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wi-Fi Credentials Card */}
                <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800/90 space-y-1.5 shadow-2xs backdrop-blur-md">
                  <div className="flex items-center justify-between text-[10.5px] font-extrabold text-white font-sans">
                    <div className="flex items-center gap-1.5">
                      <Wifi size={12} className="text-[#D4AF37]" /> Venue Wi-Fi Access
                    </div>
                    <span className="text-[8px] font-mono font-bold text-emerald-400">5GHz ULTRA</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-sans pt-0.5">
                    <div className="bg-slate-950/90 p-1.5 px-2 rounded-xl border border-slate-800 flex flex-col">
                      <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider">SSID NETWORK</span>
                      <span className="text-white font-black truncate">VoiceAI_Guest_5G</span>
                    </div>
                    <div className="bg-slate-950/90 p-1.5 px-2 rounded-xl border border-slate-800 flex flex-col">
                      <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider">PASSWORD</span>
                      <span className="text-[#D4AF37] font-black truncate">voiceai2026</span>
                    </div>
                  </div>
                </div>

                {/* Check-in QR Code Card */}
                <div className="flex items-center justify-between bg-slate-950/95 p-2.5 rounded-2xl text-white shadow-md border border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-[7.5px] font-extrabold text-[#D4AF37] uppercase tracking-widest block font-sans">OFFICIAL CHECK-IN</span>
                    <span className="text-[11px] font-black text-white block leading-tight font-sans">Scan at Admin Desk</span>
                    <span className="text-[7.5px] font-mono font-bold text-slate-500 block">ID: PASS-VIP-2026</span>
                  </div>
                  <div className="p-1.5 bg-white rounded-xl shadow-xs shrink-0">
                    <QrCode size={28} className="text-slate-950" />
                  </div>
                </div>
              </div>

              {/* Footer Sponsor Lockup */}
              <div className="border-t border-slate-800/80 pt-2 text-center relative z-10">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
                  SNAPSERVE AI x VOBIZ AI VOICE 2026
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Interactive Action Controls Bar */}
      <div className="mt-3 flex items-center justify-center gap-2 z-20 flex-wrap">
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#EAE4D8] text-slate-800 text-[11px] font-bold shadow-2xs hover:bg-white hover:border-[#E83C00] transition-all active:scale-95"
        >
          <RotateCw size={12} className={`transition-transform duration-500 ${isFlipped ? 'rotate-180 text-[#E83C00]' : ''}`} />
          {isFlipped ? 'Show Front' : 'Flip Pass'}
        </button>

        <button
          type="button"
          onClick={handleDownloadPass}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E83C00] text-white text-[11px] font-bold shadow-xs hover:bg-[#c93400] transition-all active:scale-95"
        >
          <Download size={12} />
          Download PNG
        </button>

        <button
          type="button"
          onClick={handleShareLinkedIn}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A66C2] text-white text-[11px] font-bold shadow-xs hover:bg-[#084e96] transition-all active:scale-95"
        >
          <Share2 size={12} />
          LinkedIn Share
        </button>
      </div>
    </div>
  )
}
