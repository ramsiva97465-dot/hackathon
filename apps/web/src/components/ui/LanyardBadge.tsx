import React, { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Sparkles, Phone, MapPin, Wifi, ShieldCheck, QrCode, RotateCw, Cpu, Layers, Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { BrandLockup } from '@/components/brand/BrandLogos'

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
      canvas.width = 600
      canvas.height = 900
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Card background
      ctx.fillStyle = '#F4ECE1'
      ctx.fillRect(0, 0, 600, 900)

      // Outer border
      ctx.strokeStyle = '#EAE4D8'
      ctx.lineWidth = 12
      ctx.strokeRect(20, 20, 560, 860)

      // Header
      ctx.fillStyle = '#E83C00'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText('SNAPSERVE ★ VOBIZ AI VOICE 2026', 45, 75)

      ctx.fillStyle = '#64748B'
      ctx.font = 'bold 15px sans-serif'
      ctx.fillText('OFFICIAL PARTICIPANT PASS', 45, 105)

      // Table & Agent Pills
      ctx.fillStyle = '#0F172A'
      ctx.fillRect(45, 135, 130, 36)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 15px monospace'
      ctx.fillText(`TABLE ${tableNumber || '01'}`, 58, 158)

      ctx.fillStyle = '#E83C00'
      ctx.fillRect(190, 135, 130, 36)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 15px monospace'
      ctx.fillText(`AGENT ${agentNumber || '#01'}`, 202, 158)

      // Member & Team Details
      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText('TEAM NAME', 45, 225)
      ctx.fillStyle = '#E83C00'
      ctx.font = 'bold 36px sans-serif'
      ctx.fillText(teamName, 45, 268)

      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText('TEAM LEADER', 45, 325)
      ctx.fillStyle = '#0F172A'
      ctx.font = 'bold 28px sans-serif'
      ctx.fillText(participantName, 45, 362)

      ctx.fillStyle = '#64748B'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText(trackName, 45, 395)

      // Project Details Box
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(45, 430, 510, 260)
      ctx.strokeStyle = '#EAE4D8'
      ctx.lineWidth = 2
      ctx.strokeRect(45, 430, 510, 260)

      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText('PROJECT TITLE', 70, 465)
      ctx.fillStyle = '#0F172A'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText(projectTitle || 'AI Agent Project', 70, 500)

      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText('AGENT SYSTEM NAME', 70, 550)
      ctx.fillStyle = '#0F172A'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText(agentName || 'Agent Pro', 70, 585)

      if (agentPhoneNumber) {
        ctx.fillStyle = '#059669'
        ctx.font = 'bold 14px sans-serif'
        ctx.fillText('HOTLINE NUMBER', 70, 635)
        ctx.fillStyle = '#047857'
        ctx.font = 'bold 20px monospace'
        ctx.fillText(agentPhoneNumber, 70, 665)
      }

      // Barcode Section
      ctx.fillStyle = '#64748B'
      ctx.font = 'bold 14px monospace'
      ctx.fillText('★ 2026-AI-VOICE ★ SNAPSERVE HACKATHON PASS ★', 45, 750)

      // Footer
      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText('Hosted by SnapServe.ai • Powered by Vobiz.ai', 120, 830)

      // Download trigger
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `SnapServe_Pass_${teamName.replace(/\s+/g, '_')}.png`
      link.click()
      toast.success('Official Pass image downloaded!')
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
        {/* Metallic Clip & Clamp Assembly */}
        <div className="flex flex-col items-center relative z-20 shrink-0">
          {/* Silver Clip Ring */}
          <div className="w-5 h-5 rounded-full border-3 border-slate-300 bg-gradient-to-tr from-slate-400 via-slate-200 to-slate-50 shadow-md flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          </div>
          {/* Metal Clamp Holder */}
          <div className="w-7 h-3 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 rounded-b-md shadow-sm border-t border-slate-500 flex items-center justify-center">
            <div className="w-5 h-0.5 bg-slate-600 rounded-full" />
          </div>
        </div>

        {/* ─── 3D Flippable Card Container ──────────────────────────────────── */}
        <div className="w-full max-w-[270px] h-[395px] relative mt-[-4px]">
          <motion.div
            style={{
              rotateX,
              rotateY: useTransform(rotateY, (rY) => rY + (isFlipped ? 180 : 0)),
              transformStyle: 'preserve-3d',
            }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 350, damping: 18 }}
            className="w-full h-full relative rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.2)] border border-slate-200/80 group"
          >
            {/* Holographic Sheen Overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/25 to-white/0 pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity z-30" />

            {/* ─── FRONT FACE ────────────────────────────────────────────────────── */}
            <div
              className="absolute inset-0 w-full h-full rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-xl [backface-visibility:hidden]"
              style={{ backgroundColor: '#F4ECE1', backgroundImage: 'radial-gradient(#EAE4D8 1px, transparent 1px)', backgroundSize: '14px 14px' }}
            >
              {/* Top Header */}
              <div>
                <div className="flex items-center justify-between border-b border-[#EAE4D8] pb-2.5">
                  <div className="flex items-center gap-2">
                    <BrandLockup />
                  </div>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E83C00]/10 text-[#E83C00] border border-[#E83C00]/20 text-[8px] font-black tracking-widest uppercase">
                    <ShieldCheck size={10} /> PASS 2026
                  </span>
                </div>

                {/* Table & Agent Pills */}
                <div className="flex items-center gap-2 mt-2.5">
                  {tableNumber && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-black text-[9px] tracking-wider uppercase shadow-xs">
                      Table {tableNumber}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md bg-[#E83C00] text-white font-mono font-black text-[9px] tracking-wider uppercase shadow-xs">
                    Agent {agentNumber}
                  </span>
                </div>
              </div>

              {/* Participant & Submission Details */}
              <div className="my-auto py-1 space-y-2">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Team Name</span>
                  <h3 className="font-display font-extrabold text-lg text-[#E83C00] tracking-tight leading-tight">{teamName}</h3>
                </div>

                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{memberRole}</span>
                  <h4 className="font-display font-bold text-sm text-slate-900 leading-snug">{participantName}</h4>

                  {/* Team Members List (right under Team Lead) */}
                  {members && members.length > 1 && (
                    <div className="mt-1 pt-1 border-t border-[#EAE4D8]/80 text-left">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                        Team Members
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {members.slice(1).map((m, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/90 border border-[#EAE4D8] text-[8px] font-bold text-slate-800 shadow-2xs">
                            <span className="w-1 h-1 rounded-full bg-[#E83C00]" />
                            {m.name || `Member ${idx + 2}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 font-semibold mt-1">{trackName}</p>
                </div>

                {/* Submitted Project Details Box */}
                <div className="bg-white/80 backdrop-blur-sm border border-[#EAE4D8] p-2.5 rounded-xl space-y-1 shadow-2xs text-left">
                  {projectTitle && (
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase block">Project Title</span>
                      <span className="text-xs font-black text-slate-800 line-clamp-1">{projectTitle}</span>
                    </div>
                  )}

                  {agentName && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Cpu size={10} className="text-[#E83C00]" /> Agent System
                      </span>
                      <span className="text-xs font-black text-slate-800">{agentName}</span>
                    </div>
                  )}

                  {agentPhoneNumber && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 uppercase">
                        <Phone size={10} /> Hotline
                      </span>
                      <span className="text-xs font-mono font-black text-emerald-700">{agentPhoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Barcode Section */}
              <div className="border-t border-[#EAE4D8] pt-2 flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Entry Barcode</span>
                  <span className="font-mono text-[8px] font-bold text-slate-700 tracking-widest">★ 2026-AI-VOICE ★</span>
                </div>

                {/* Barcode Lines */}
                <div className="flex items-center gap-[2px] h-4">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3].map((width, idx) => (
                    <div key={idx} className="bg-slate-900 h-full" style={{ width: `${width}px` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* ─── BACK FACE ─────────────────────────────────────────────────────── */}
            <div
              className="absolute inset-0 w-full h-full rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-xl border border-[#EAE4D8] [transform:rotateY(180deg)] [backface-visibility:hidden]"
              style={{ backgroundColor: '#F4ECE1', backgroundImage: 'radial-gradient(#EAE4D8 1px, transparent 1px)', backgroundSize: '14px 14px' }}
            >
              {/* Top Header */}
              <div className="flex items-center justify-between border-b border-[#EAE4D8] pb-2.5">
                <span className="text-[10px] font-black text-[#E83C00] uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={12} /> VIP HACKATHON ACCESS
                </span>
                <span className="text-[9px] text-slate-500 font-mono font-bold">VERIFIED PASS</span>
              </div>

              {/* Tech Stack & Wi-Fi Details */}
              <div className="space-y-2.5 my-auto text-left">
                {/* Tech Stack */}
                {techStack && techStack.length > 0 && (
                  <div className="bg-white/90 border border-[#EAE4D8] p-2.5 rounded-xl space-y-1 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                      <Layers size={12} className="text-[#E83C00]" /> Submitted Tech Stack
                    </div>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {techStack.map((tech, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded-md bg-[#F4ECE1] border border-[#EAE4D8] text-[8.5px] font-mono font-bold text-slate-800">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wi-Fi Credentials */}
                <div className="bg-white/90 border border-[#EAE4D8] p-2.5 rounded-xl space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                    <Wifi size={12} className="text-[#E83C00]" /> Venue Wi-Fi Access
                  </div>
                  <div className="space-y-0.5 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-500">
                      <span>SSID:</span> <span className="text-slate-900 font-bold">Aitel_Hackathon_5G</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Pass:</span> <span className="text-[#E83C00] font-black">voiceai2026</span>
                    </div>
                  </div>
                </div>

                {/* Check-in QR Code */}
                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl text-white shadow-xs">
                  <div>
                    <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest block">Venue Check-in</span>
                    <span className="text-[11px] font-bold">Scan at Admin Desk</span>
                  </div>
                  <QrCode size={28} className="text-white" />
                </div>
              </div>

              {/* Footer Sponsor Lockup */}
              <div className="border-t border-[#EAE4D8] pt-2 text-center">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest block">Hosted by SnapServe.ai • Powered by Vobiz.ai</span>
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
