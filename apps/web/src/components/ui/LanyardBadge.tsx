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

  const handleDownloadPass = async () => {
    try {
      toast.loading('Generating Official HD VIP Pass PNG...')
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 1600
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // 1. Warm Studio Lighting Backdrop (Matching reference photo background environment)
      const bgGrad = ctx.createRadialGradient(600, 600, 100, 600, 800, 1100)
      bgGrad.addColorStop(0, '#F5EBE1')
      bgGrad.addColorStop(0.5, '#E2D4C3')
      bgGrad.addColorStop(1, '#C9B7A3')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, 1200, 1600)

      // Vignette effect
      const vigGrad = ctx.createRadialGradient(600, 800, 400, 600, 800, 1000)
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)')
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.15)')
      ctx.fillStyle = vigGrad
      ctx.fillRect(0, 0, 1200, 1600)

      // 2. Black Woven Lanyard Fabric Strap (Hanging from top center)
      ctx.fillStyle = '#12141A'
      ctx.fillRect(550, 0, 100, 210)
      
      // Brand Orange Stitching Line down center
      ctx.fillStyle = '#E83C00'
      ctx.fillRect(598, 0, 4, 210)

      // Fabric Texture Highlights on Strap
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 2
      for (let y = 10; y < 210; y += 12) {
        ctx.beginPath()
        ctx.moveTo(550, y)
        ctx.lineTo(650, y)
        ctx.stroke()
      }

      // 3. Black Matte Clamp Sleeve & Brand Emboss
      ctx.fillStyle = '#18191E'
      ctx.beginPath()
      ctx.roundRect(530, 155, 140, 45, 8)
      ctx.fill()
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 2
      ctx.stroke()

      // Clamp Brand Text
      ctx.fillStyle = '#D4AF37'
      ctx.font = '900 15px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('VOBIZ • SNAPSERVE', 600, 182)

      // 4. Black Metallic Swivel Carabiner Hook Assembly
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.arc(600, 225, 20, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = '#1E293B'
      ctx.beginPath()
      ctx.roundRect(591, 240, 18, 45, 4)
      ctx.fill()
      ctx.strokeStyle = '#475569'
      ctx.lineWidth = 2
      ctx.stroke()

      // 5. Main Card Container (Solid Dark Matte #12141A)
      const cardX = 200
      const cardY = 265
      const cardW = 800
      const cardH = 1260
      const cardR = 56

      ctx.save()
      // Card Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
      ctx.shadowBlur = 65
      ctx.shadowOffsetY = 35

      ctx.fillStyle = '#12141A'
      ctx.beginPath()
      ctx.roundRect(cardX, cardY, cardW, cardH, cardR)
      ctx.fill()
      ctx.restore()

      // Card Border Highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(cardX, cardY, cardW, cardH, cardR)
      ctx.stroke()

      // 6. Punch Hole at Top Center
      ctx.fillStyle = '#FAF8F5'
      ctx.beginPath()
      ctx.arc(600, 315, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#0F1117'
      ctx.lineWidth = 3
      ctx.stroke()

      // 7. Card Header Text (Exact Sans-Serif Bold Typography)
      ctx.textAlign = 'left'
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 24px sans-serif'
      ctx.fillText('SNAPSERVE AI x VOBIZ AI VOICE 2026', 265, 375)

      ctx.fillStyle = '#D4AF37'
      ctx.font = '900 22px sans-serif'
      ctx.fillText('TECH INNOVATION SUMMIT', 265, 410)

      // 8. Hero Metallic Gold VIP Title & Assigned Desk
      ctx.fillStyle = '#D4AF37'
      ctx.font = '900 135px sans-serif'
      ctx.fillText('VIP', 265, 560)

      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 20px monospace'
      const formattedTable = tableNumber ? (tableNumber.toUpperCase().startsWith('T-') ? tableNumber.toUpperCase() : `TABLE ${tableNumber}`) : 'TABLE T-01'
      ctx.fillText(formattedTable, 270, 605)

      // 9. 3D Metallic Gold AI Processor Microchip (Right Side)
      const chipX = 720
      const chipY = 440
      const chipSize = 180

      // Glowing circuit rays behind chip
      const chipGrad = ctx.createRadialGradient(chipX + 90, chipY + 90, 10, chipX + 90, chipY + 90, 140)
      chipGrad.addColorStop(0, 'rgba(232, 60, 0, 0.35)')
      chipGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.15)')
      chipGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = chipGrad
      ctx.beginPath()
      ctx.arc(chipX + 90, chipY + 90, 140, 0, Math.PI * 2)
      ctx.fill()

      // Circuit Trace Lines
      ctx.strokeStyle = '#E83C00'
      ctx.lineWidth = 3
      const lines = [
        [chipX - 30, chipY + 40, chipX, chipY + 40],
        [chipX - 40, chipY + 90, chipX, chipY + 90],
        [chipX - 30, chipY + 140, chipX, chipY + 140],
        [chipX + 40, chipY - 30, chipX + 40, chipY],
        [chipX + 90, chipY - 40, chipX + 90, chipY],
        [chipX + 140, chipY - 30, chipX + 140, chipY],
        [chipX + 180, chipY + 40, chipX + 210, chipY + 40],
        [chipX + 180, chipY + 90, chipX + 220, chipY + 90],
        [chipX + 180, chipY + 140, chipX + 210, chipY + 140],
      ]
      lines.forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        // Glowing dot at trace end
        ctx.fillStyle = '#D4AF37'
        ctx.beginPath()
        ctx.arc(x1, y1, 4, 0, Math.PI * 2)
        ctx.fill()
      })

      // Outer Metallic Chip Frame
      const chipFrameGrad = ctx.createLinearGradient(chipX, chipY, chipX + chipSize, chipY + chipSize)
      chipFrameGrad.addColorStop(0, '#D4AF37')
      chipFrameGrad.addColorStop(0.5, '#FEF08A')
      chipFrameGrad.addColorStop(1, '#92400E')
      ctx.fillStyle = chipFrameGrad
      ctx.beginPath()
      ctx.roundRect(chipX, chipY, chipSize, chipSize, 28)
      ctx.fill()

      // Inner Chip Body
      ctx.fillStyle = '#1E293B'
      ctx.beginPath()
      ctx.roundRect(chipX + 16, chipY + 16, chipSize - 32, chipSize - 32, 20)
      ctx.fill()

      // Chip Engraved Text
      ctx.textAlign = 'center'
      ctx.fillStyle = '#D4AF37'
      ctx.font = '900 42px sans-serif'
      ctx.fillText('AI', chipX + 90, chipY + 105)

      // 10. Participant Information Stack (100% Clean Crisp Text - No Overlap!)
      ctx.textAlign = 'left'

      // Participant Name
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 64px sans-serif'
      ctx.fillText(participantName.toUpperCase(), 265, 735)

      // Speaker / Member Role
      ctx.fillStyle = '#D4AF37'
      ctx.font = '900 26px sans-serif'
      ctx.fillText((memberRole || 'TEAM LEAD').toUpperCase(), 265, 785)

      // Subtitle / Track
      ctx.fillStyle = '#CBD5E1'
      ctx.font = '700 22px sans-serif'
      ctx.fillText('AI குரல் • VOICE FOR TAMIL NADU', 265, 822)

      // Team Name
      ctx.fillStyle = '#E83C00'
      ctx.font = '900 24px sans-serif'
      ctx.fillText(teamName.toUpperCase(), 265, 859)

      // Solid Brand Orange Horizontal Accent Line
      ctx.fillStyle = '#E83C00'
      ctx.beginPath()
      ctx.roundRect(265, 890, 670, 8, 4)
      ctx.fill()

      // Date & Venue Location
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 32px sans-serif'
      ctx.fillText('SATURDAY, 5 SEP 2026', 265, 955)

      ctx.fillStyle = '#D4AF37'
      ctx.font = '900 22px sans-serif'
      ctx.fillText('OLIVE PUBLIC SCHOOL, CHENNAI', 265, 995)

      // 11. White Barcode Container Box
      const barX = 265
      const barY = 1055
      const barW = 670
      const barH = 200
      const barR = 36

      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.roundRect(barX, barY, barW, barH, barR)
      ctx.fill()

      // Barcode lines
      const lineXStart = 330
      const lineYStart = 1085
      const barHeights = 100
      const widths = [6, 3, 7, 3, 9, 3, 6, 8, 3, 4, 9, 3, 6, 4, 3, 8, 3, 6, 9, 3, 8, 3, 6, 9]

      ctx.fillStyle = '#000000'
      let currentX = lineXStart
      widths.forEach((w) => {
        ctx.fillRect(currentX, lineYStart, w, barHeights)
        currentX += w + 9
      })

      // Barcode numeric string
      ctx.textAlign = 'center'
      ctx.font = 'bold 26px monospace'
      ctx.fillText('9  781234  567897', 600, 1225)

      // Footer Access Marker
      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 18px monospace'
      ctx.fillText(`ACCESS | VIP PASSHOLDER | [${agentNumber || '#0117'}]`, 600, 1450)

      // 12. Trigger Download PNG
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `SnapServe_VIP_Pass_${participantName.replace(/\s+/g, '_')}.png`
      link.click()
      toast.dismiss()
      toast.success('Downloaded Ultra-HD VIP Pass PNG!')
    } catch (err) {
      console.error(err)
      toast.dismiss()
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

                {/* Exact SnapServe Logo Mark Alone */}
                <div className="flex items-center justify-center shrink-0 p-1">
                  <img
                    src="/logos/snapserve-mark.svg"
                    alt="SnapServe Logo"
                    className="w-11 h-11 object-contain drop-shadow-sm"
                    style={{ width: '44px', height: '44px' }}
                  />
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

            {/* ─── BACK FACE (Frameless, Front-Face Matching Aesthetic) ────────────────────────── */}
            <div
              className="absolute inset-0 w-full h-full rounded-3xl p-5 pt-3.5 flex flex-col justify-between overflow-hidden shadow-2xl border border-slate-800/90"
              style={{
                backgroundColor: '#12141A',
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              {/* Physical Card Punch Hole */}
              <div className="w-4.5 h-4.5 rounded-full bg-[#FAF8F5] border border-slate-900 mx-auto shadow-inner mb-0.5 shrink-0 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-[#12141A]/10 border border-slate-400/40" />
              </div>

              {/* 1. Header Text (Identical to Front Side Typography) */}
              <div className="text-left space-y-0.5 pb-1">
                <span className="text-[10px] font-extrabold text-white tracking-wide uppercase block font-sans">
                  SNAPSERVE AI x VOBIZ AI VOICE 2026
                </span>
                <span className="text-[9.5px] font-extrabold text-[#D4AF37] tracking-widest uppercase block font-sans">
                  OFFICIAL PARTICIPANT PASS
                </span>
              </div>

              {/* 2. Main Details Stack (Frameless, Clean Typography matching Front Face) */}
              <div className="text-left space-y-2.5 my-auto">
                {/* VIP Access Title & Verified Badge */}
                <div className="flex items-center justify-between border-b border-slate-800/90 pb-2">
                  <div>
                    <span className="text-[8.5px] font-extrabold text-[#D4AF37] uppercase tracking-widest block font-sans">PASS CATEGORY</span>
                    <span className="text-xl font-black text-white uppercase tracking-tight font-display">VIP BUILDER</span>
                  </div>
                  <span className="text-[8px] font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/80 tracking-wider flex items-center gap-1">
                    VERIFIED PASS ✓
                  </span>
                </div>

                {/* Venue & Desk Details */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider block">VENUE HALL</span>
                    <span className="text-[11.5px] font-black text-white uppercase block">MAIN HALL A</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider block">ASSIGNED DESK</span>
                    <span className="text-[11.5px] font-black text-[#D4AF37] uppercase block">
                      {tableNumber ? (tableNumber.toUpperCase().startsWith('T-') ? tableNumber.toUpperCase() : `TABLE ${tableNumber}`) : 'TABLE T-01'}
                    </span>
                  </div>
                </div>

                {/* Wi-Fi Credentials */}
                <div className="grid grid-cols-2 gap-2 border-t border-slate-800/90 pt-2">
                  <div>
                    <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider block">VENUE WI-FI</span>
                    <span className="text-[11px] font-bold text-white block">VoiceAI_Guest_5G</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider block">WI-FI PASS</span>
                    <span className="text-[11px] font-black text-[#E83C00] block">voiceai2026</span>
                  </div>
                </div>

                {/* Solid Orange Horizontal Accent Bar (Exact Front Side Style) */}
                <div className="h-[2.5px] w-full bg-[#E83C00] rounded-full my-1" />
              </div>

              {/* 3. Admin Attendance Check-In QR Code Section (Clean White Container like Front Barcode) */}
              <div className="space-y-1 pt-1">
                <div className="bg-white rounded-2xl p-2.5 flex items-center justify-between shadow-md">
                  <div className="text-left space-y-0.5">
                    <span className="text-[8px] font-black text-[#E83C00] uppercase tracking-widest block font-sans">ADMIN ATTENDANCE SCAN</span>
                    <span className="text-[11px] font-black text-black block font-sans">Scan at Desk to Check-In</span>
                    <span className="text-[8px] font-mono font-bold text-slate-600 block">
                      PASS ID: {agentNumber ? `PASS-${agentNumber.toUpperCase()}` : '#0117'}
                    </span>
                  </div>
                  <div className="p-1 bg-black rounded-xl shrink-0">
                    <QrCode size={32} className="text-white" />
                  </div>
                </div>

                <div className="text-center pt-1">
                  <span className="text-[7.5px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                    ACCESS | VIP PASSHOLDER | [{agentNumber || '#0117'}]
                  </span>
                </div>
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
