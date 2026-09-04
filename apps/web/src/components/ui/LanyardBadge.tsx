import React, { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Sparkles, Phone, MapPin, Wifi, ShieldCheck, QrCode, RotateCw, Cpu, Layers, Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { BrandLockup, SnapServeMark } from '@/components/brand/BrandLogos'

interface LanyardBadgeProps {
  participantName?: string
  memberRole?: string
  teamName?: string
  teamId?: string | null
  memberId?: string | null
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
  teamId = null,
  memberId = null,
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

  // Desk scanner expects SNAPSERVE:teamId:memberId (falls back to team name for older passes)
  const qrPayload =
    teamId && memberId
      ? `SNAPSERVE:${teamId}:${memberId}`
      : teamId
        ? `SNAPSERVE:${teamId}`
        : (teamName || participantName || 'SnapServe AI')


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

  const generatePassCanvas = async (pName: string, pRole: string) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 1500
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // 1. Transparent / Warm Canvas Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1000, 1500)
    bgGrad.addColorStop(0, '#FAF6F0')
    bgGrad.addColorStop(1, '#EAE0D2')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, 1000, 1500)

    // 2. Lanyard Fabric Strap (Top Center)
    ctx.fillStyle = '#12141A'
    ctx.fillRect(460, 0, 80, 160)
    ctx.fillStyle = '#E83C00'
    ctx.fillRect(498, 0, 4, 160) // Orange stitching line

    // Lanyard Clamp & Swivel Ring
    ctx.fillStyle = '#18191E'
    ctx.beginPath()
    ctx.roundRect(440, 120, 120, 35, 6)
    ctx.fill()
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#D4AF37'
    ctx.font = '900 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('SNAPSERVE', 500, 142)

    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(500, 175, 15, 0, Math.PI * 2)
    ctx.stroke()

    // 3. Card Body Container (Solid Dark Matte #12141A - Exact On-Screen Card)
    const cardX = 150
    const cardY = 200
    const cardW = 700
    const cardH = 1180
    const cardR = 48

    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    ctx.shadowBlur = 50
    ctx.shadowOffsetY = 25

    ctx.fillStyle = '#12141A'
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardW, cardH, cardR)
    ctx.fill()
    ctx.restore()

    ctx.strokeStyle = '#1E293B'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardW, cardH, cardR)
    ctx.stroke()

    // Punch Hole
    ctx.fillStyle = '#FAF8F5'
    ctx.beginPath()
    ctx.arc(500, 245, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#0F1117'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // 4. Header Text (Exact On-Screen Typography)
    ctx.textAlign = 'left'
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '900 22px sans-serif'
    ctx.fillText('SNAPSERVE AI x VOBIZ AI VOICE 2026', 205, 305)

    ctx.fillStyle = '#D4AF37'
    ctx.font = '900 20px sans-serif'
    ctx.fillText('TECH INNOVATION SUMMIT', 205, 335)

    // 5. Hero Title & SnapServe Logo Mark
    ctx.fillStyle = '#D4AF37'
    ctx.font = '900 48px sans-serif'
    ctx.fillText('VOICE AI BUILDER', 205, 450)

    ctx.fillStyle = '#94A3B8'
    ctx.font = 'bold 17px monospace'
    const formattedTable = tableNumber ? (tableNumber.toUpperCase().startsWith('T-') ? tableNumber.toUpperCase() : `TABLE ${tableNumber}`) : 'TABLE T-01'
    ctx.fillText(formattedTable, 210, 505)

    // Load & Draw Exact SnapServe Logo Mark Image
    await new Promise<void>((resolve) => {
      const logoImg = new Image()
      logoImg.src = '/logos/snapserve-mark.svg'
      logoImg.onload = () => {
        ctx.drawImage(logoImg, 700, 390, 110, 110)
        resolve()
      }
      logoImg.onerror = () => {
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.roundRect(700, 400, 100, 24, 12)
        ctx.fill()
        ctx.fillStyle = '#94A3B8'
        ctx.beginPath()
        ctx.roundRect(720, 435, 100, 24, 12)
        ctx.fill()
        ctx.fillStyle = '#64748B'
        ctx.beginPath()
        ctx.roundRect(740, 470, 80, 24, 12)
        ctx.fill()
        resolve()
      }
    })

    // 6. Participant Info Stack (Exact On-Screen Layout)
    // Name
    ctx.textAlign = 'left'
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '900 54px sans-serif'
    ctx.fillText(pName.toUpperCase(), 205, 615)

    // Speaker / Member Role
    ctx.fillStyle = '#D4AF37'
    ctx.font = '900 22px sans-serif'
    ctx.fillText((pRole || 'TEAM LEAD').toUpperCase(), 205, 658)

    // Track Subtitle
    ctx.fillStyle = '#CBD5E1'
    ctx.font = '700 18px sans-serif'
    ctx.fillText('AI குரல் • VOICE FOR TAMIL NADU', 205, 692)

    // Team Name
    ctx.fillStyle = '#E83C00'
    ctx.font = '900 20px sans-serif'
    ctx.fillText(teamName.toUpperCase(), 205, 725)

    // Solid Brand Orange Horizontal Accent Bar
    ctx.fillStyle = '#E83C00'
    ctx.beginPath()
    ctx.roundRect(205, 755, 590, 7, 3.5)
    ctx.fill()

    // Date & Venue Location
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '900 26px sans-serif'
    ctx.fillText('SATURDAY, 5 SEP 2026', 205, 810)

    ctx.fillStyle = '#D4AF37'
    ctx.font = '900 18px sans-serif'
    ctx.fillText('OLIVE PUBLIC SCHOOL, CHENNAI', 205, 845)

    // 7. White Barcode Container Box (Exact On-Screen Design)
    const barX = 205
    const barY = 900
    const barW = 590
    const barH = 175
    const barR = 28

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(barX, barY, barW, barH, barR)
    ctx.fill()

    // Barcode lines
    const lineXStart = 255
    const lineYStart = 925
    const barHeights = 85
    const widths = [5, 2, 6, 2, 7, 2, 5, 6, 2, 3, 7, 2, 5, 3, 2, 6, 2, 5, 7, 2, 6, 2, 5, 7]

    ctx.fillStyle = '#000000'
    let currentX = lineXStart
    widths.forEach((w) => {
      ctx.fillRect(currentX, lineYStart, w, barHeights)
      currentX += w + 8
    })

    // Draw Real Scannable QR Code Box on HD Canvas
    const qrImg = new Image()
    qrImg.crossOrigin = 'anonymous'
    const qrDataStr = encodeURIComponent(qrPayload)
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrDataStr}&color=000000&bgcolor=ffffff`
    
    await new Promise((resolve) => {
      qrImg.onload = resolve
      qrImg.onerror = resolve
    })

    if (qrImg.complete && qrImg.naturalWidth > 0) {
      // Draw QR image inside barcode box
      ctx.drawImage(qrImg, 680, 920, 110, 110)
    }

    // Barcode numeric string
    ctx.textAlign = 'center'
    ctx.font = 'bold 22px monospace'
    ctx.fillText('9  781234  567897', 440, 1045)

    // Footer Access Marker
    ctx.fillStyle = '#94A3B8'
    ctx.font = 'bold 15px monospace'
    ctx.fillText(`ACCESS | VOICE AI BUILDER | [${agentNumber || '#0117'}]`, 500, 1220)

    // Trigger Download PNG
    const image = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = image
    link.download = `SnapServe_VIP_Pass_${pName.replace(/\s+/g, '_')}.png`
    link.click()
  }

  const handleDownloadPass = async () => {
    try {
      toast.loading(`Generating Official Pass for ${participantName}...`)
      await generatePassCanvas(participantName, memberRole)
      toast.dismiss()
      toast.success(`Downloaded VIP Pass for ${participantName}!`)
    } catch (err) {
      console.error(err)
      toast.dismiss()
      toast.error('Could not download pass image.')
    }
  }

  const handleDownloadAllPasses = async () => {
    const teamMemberList = members && members.length > 0 ? members : [{ name: participantName, role: memberRole }]
    try {
      toast.loading(`Downloading all ${teamMemberList.length} Team Passes...`)
      for (let i = 0; i < teamMemberList.length; i++) {
        const m = teamMemberList[i]
        const role = i === 0 ? 'Team Lead' : (m.role || 'Team Member')
        await generatePassCanvas(m.name, role)
        await new Promise(r => setTimeout(r, 300))
      }
      toast.dismiss()
      toast.success(`Successfully downloaded all ${teamMemberList.length} team passes!`)
    } catch (err) {
      console.error(err)
      toast.dismiss()
      toast.error('Could not download team passes.')
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

              {/* 2. Hero Title & Glowing AI Processor Chip Section */}
              <div className="flex items-center justify-between py-1 px-1">
                {/* Big Metallic Gold Title Text */}
                <div className="flex flex-col text-left">
                  <span className="text-xl font-black tracking-tight leading-none text-[#D4AF37] drop-shadow-md font-display">
                    VOICE AI BUILDER
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
                    <span className="text-xl font-black text-white uppercase tracking-tight font-display">VOICE AI BUILDER</span>
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

              {/* 3. Admin Attendance Check-In QR Code Section (100% Real Scannable QR Code) */}
              <div className="space-y-1 pt-1">
                <div className="bg-white rounded-2xl p-2.5 flex items-center justify-between shadow-md border border-slate-200">
                  <div className="text-left space-y-0.5 min-w-0 flex-1 pr-2">
                    <span className="text-[8px] font-black text-[#E83C00] uppercase tracking-widest block font-sans">ADMIN ATTENDANCE SCAN</span>
                    <span className="text-[11px] font-black text-black block font-sans truncate">{participantName}</span>
                    <span className="text-[8px] font-mono font-bold text-slate-600 block">
                      PASS ID: {agentNumber ? `PASS-${agentNumber.replace('#','')}` : 'T-01'}
                    </span>
                  </div>
                  <div className="p-1.5 bg-white rounded-xl shrink-0 border border-slate-300 shadow-2xs">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}&color=000000&bgcolor=ffffff`}
                      alt="Pass QR Code"
                      className="w-10 h-10 object-contain rounded-md"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>

                <div className="text-center pt-1">
                  <span className="text-[7.5px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                    ACCESS | VOICE AI BUILDER | [{agentNumber || '#0117'}]
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
          Download {participantName} PNG
        </button>

        {members && members.length > 1 && (
          <button
            type="button"
            onClick={handleDownloadAllPasses}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-amber-400 border border-amber-500/40 text-[11px] font-bold shadow-xs hover:bg-slate-800 transition-all active:scale-95"
          >
            <Download size={12} />
            Download All {members.length} Passes
          </button>
        )}

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
