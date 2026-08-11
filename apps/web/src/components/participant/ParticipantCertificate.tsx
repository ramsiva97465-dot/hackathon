import { useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Download, Share2, CheckCircle2, ShieldCheck, QrCode, Sparkles, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface ParticipantCertificateProps {
  participantName: string
  teamName: string
  trackName: string
  certificateId?: string
  issueDate?: string
}

export function ParticipantCertificate({
  participantName,
  teamName,
  trackName,
  certificateId = 'CERT-2026-SS-9746',
  issueDate = 'September 5, 2026'
}: ParticipantCertificateProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownloadHD = async () => {
    try {
      setDownloading(true)
      toast.loading('Generating Ultra-HD Official Certificate PNG...')

      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 1131 // 1.414 ratio (A4 landscape)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // 1. Parchment Background
      const bgGrad = ctx.createLinearGradient(0, 0, 1600, 1131)
      bgGrad.addColorStop(0, '#FFFDF9')
      bgGrad.addColorStop(0.5, '#FBF8F0')
      bgGrad.addColorStop(1, '#F7F2E6')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, 1600, 1131)

      // 2. Guilloche Outer Border & Metallic Gold Frames
      // Outer Gold Line
      ctx.strokeStyle = '#D4AF37'
      ctx.lineWidth = 6
      ctx.strokeRect(40, 40, 1520, 1051)

      // Inner Fine Gold Line
      ctx.strokeStyle = '#E2C275'
      ctx.lineWidth = 2
      ctx.strokeRect(52, 52, 1496, 1027)

      // Corner Ornaments
      const drawCorner = (x: number, y: number, r1: number, r2: number) => {
        ctx.strokeStyle = '#D4AF37'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(x, y, r1, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(x, y, r2, 0, Math.PI * 2)
        ctx.stroke()
      }
      drawCorner(70, 70, 15, 8)
      drawCorner(1530, 70, 15, 8)
      drawCorner(70, 1061, 15, 8)
      drawCorner(1530, 1061, 15, 8)

      // 3. Header Branding
      ctx.textAlign = 'center'
      ctx.fillStyle = '#1E293B'
      ctx.font = '900 24px sans-serif'
      ctx.fillText('SNAPSERVE AI  x  VOBIZ AI VOICE 2026', 800, 140)

      ctx.fillStyle = '#D4AF37'
      ctx.font = '700 16px sans-serif'
      ctx.fillText('INDIA\'S BIGGEST VOICE-A-THON • TAMIL NADU EDITION', 800, 175)

      // Divider Line
      ctx.strokeStyle = '#D4AF37'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(600, 200)
      ctx.lineTo(1000, 200)
      ctx.stroke()

      // 4. Main Certificate Title
      ctx.fillStyle = '#0F172A'
      ctx.font = '900 56px serif'
      ctx.fillText('CERTIFICATE OF PARTICIPATION', 800, 290)

      // 5. Presentee Text
      ctx.fillStyle = '#64748B'
      ctx.font = 'italic 500 22px serif'
      ctx.fillText('This certificate is proudly presented to', 800, 355)

      // 6. Participant Name (Calligraphic Big Title)
      ctx.fillStyle = '#0F172A'
      ctx.font = '900 64px serif'
      ctx.fillText(participantName.toUpperCase(), 800, 455)

      // Underline accent for name
      ctx.strokeStyle = '#D4AF37'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(350, 480)
      ctx.lineTo(1250, 480)
      ctx.stroke()

      // 7. Citation Text
      ctx.fillStyle = '#334155'
      ctx.font = '500 21px sans-serif'
      ctx.fillText(`for active participation, outstanding innovation, and successfully engineering Voice AI Agents`, 800, 550)
      ctx.fillText(`with Team "${teamName.toUpperCase()}" under the "${trackName.toUpperCase()}" Track.`, 800, 590)

      // 8. Date & Location
      ctx.fillStyle = '#64748B'
      ctx.font = '600 18px sans-serif'
      ctx.fillText(`Issued on ${issueDate}  •  Olive Public School, Chennai`, 800, 670)

      // 9. Metallic Gold Seal & Ribbon (Bottom Center / Left)
      const sealX = 800
      const sealY = 820

      // Gold Ribbon tails
      ctx.fillStyle = '#B45309'
      ctx.beginPath()
      ctx.moveTo(sealX - 35, sealY + 20)
      ctx.lineTo(sealX - 55, sealY + 110)
      ctx.lineTo(sealX - 35, sealY + 95)
      ctx.lineTo(sealX - 15, sealY + 110)
      ctx.closePath()
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(sealX + 15, sealY + 110)
      ctx.lineTo(sealX + 35, sealY + 95)
      ctx.lineTo(sealX + 55, sealY + 110)
      ctx.lineTo(sealX + 35, sealY + 20)
      ctx.closePath()
      ctx.fill()

      // Gold Seal Circle
      const sealGrad = ctx.createRadialGradient(sealX, sealY, 10, sealX, sealY, 65)
      sealGrad.addColorStop(0, '#FEF08A')
      sealGrad.addColorStop(0.5, '#D4AF37')
      sealGrad.addColorStop(1, '#B45309')
      ctx.fillStyle = sealGrad
      ctx.beginPath()
      ctx.arc(sealX, sealY, 65, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(sealX, sealY, 56, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 14px sans-serif'
      ctx.fillText('OFFICIAL', sealX, sealY - 12)
      ctx.font = '900 12px sans-serif'
      ctx.fillText('★ VERIFIED ★', sealX, sealY + 8)
      ctx.font = '900 13px sans-serif'
      ctx.fillText('2026', sealX, sealY + 26)

      // 10. Signatures (Left & Right)
      // Left Signature: CEO SnapServe
      ctx.textAlign = 'center'
      ctx.strokeStyle = '#1E293B'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(250, 840)
      ctx.lineTo(480, 840)
      ctx.stroke()

      // Cursive style font representation
      ctx.fillStyle = '#0F172A'
      ctx.font = 'italic 700 26px serif'
      ctx.fillText('Sivaram R S', 365, 830)

      ctx.font = 'bold 15px sans-serif'
      ctx.fillText('Sivaram R S', 365, 870)
      ctx.fillStyle = '#64748B'
      ctx.font = '500 14px sans-serif'
      ctx.fillText('Co-Founder & CEO, SnapServe AI', 365, 895)

      // Right Signature: Founder Vobiz
      ctx.strokeStyle = '#1E293B'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(1120, 840)
      ctx.lineTo(1350, 840)
      ctx.stroke()

      ctx.fillStyle = '#0F172A'
      ctx.font = 'italic 700 26px serif'
      ctx.fillText('Rohith Raju', 1235, 830)

      ctx.font = 'bold 15px sans-serif'
      ctx.fillText('Rohith RAJU', 1235, 870)
      ctx.fillStyle = '#64748B'
      ctx.font = '500 14px sans-serif'
      ctx.fillText('Founder & CEO, Vobiz.ai', 1235, 895)

      // 11. Verification Footer & ID Code
      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 13px monospace'
      ctx.fillText(`VERIFICATION ID: ${certificateId}  •  AUTHENTICATED BY SNAPSERVE BLOCKCHAIN PROTOCOL`, 800, 1020)

      // 12. Trigger Download
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `Official_Certificate_${participantName.replace(/\s+/g, '_')}.png`
      link.click()
      toast.dismiss()
      toast.success('Downloaded Official HD Certificate PNG!')
    } catch (err) {
      console.error(err)
      toast.dismiss()
      toast.error('Could not download certificate.')
    } finally {
      setDownloading(false)
    }
  }

  const handleShareLinkedIn = () => {
    const text = `📜 Honored to receive my Official Certificate of Participation for India's Biggest Voice-a-thon (Tamil Nadu Edition)!\n\nBuilding next-gen Voice AI Agents with SnapServe AI & Vobiz AI. Team "${teamName}" • Track "${trackName}".\n\n#SnapServe #VoiceAI #Hackathon2026 #AI`
    navigator.clipboard.writeText(text)
    toast.success('LinkedIn certificate post text copied!')
    window.open('https://www.linkedin.com/feed/', '_blank')
  }

  return (
    <div className="w-full space-y-6">
      {/* Action Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md text-slate-950">
            <Award size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white font-sans">Official Certificate of Participation</h3>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck size={11} /> VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400">
              India's Biggest Voice-a-thon • SnapServe AI x Vobiz AI Voice 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDownloadHD}
            disabled={downloading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Download size={15} />
            {downloading ? 'Generating...' : 'Download Official Certificate (PNG)'}
          </button>

          <button
            type="button"
            onClick={handleShareLinkedIn}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-sm transition-all active:scale-95"
          >
            <Share2 size={15} className="text-blue-400" />
            Share Certificate
          </button>
        </div>
      </div>

      {/* Certificate Frame Preview */}
      <div className="relative rounded-3xl p-6 sm:p-10 bg-[#FFFDF9] border-8 border-[#D4AF37] shadow-2xl text-slate-900 font-serif select-none overflow-hidden max-w-4xl mx-auto">
        {/* Decorative Inner Border */}
        <div className="absolute inset-3 border-2 border-[#E2C275] pointer-events-none rounded-2xl" />

        {/* Top Header */}
        <div className="text-center space-y-1 relative z-10">
          <p className="text-xs font-black tracking-widest text-slate-800 font-sans uppercase">
            SNAPSERVE AI &nbsp;x&nbsp; VOBIZ AI VOICE 2026
          </p>
          <p className="text-[11px] font-bold text-[#B45309] tracking-wider font-sans uppercase">
            INDIA'S BIGGEST VOICE-A-THON • TAMIL NADU EDITION
          </p>
          <div className="w-24 h-0.5 bg-[#D4AF37] mx-auto my-2" />
        </div>

        {/* Main Title */}
        <div className="text-center my-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            CERTIFICATE OF PARTICIPATION
          </h2>
          <p className="text-sm italic text-slate-500 font-serif mt-2">
            This certificate is proudly presented to
          </p>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight my-4 uppercase underline decoration-[#D4AF37] decoration-2 underline-offset-8">
            {participantName}
          </h1>
        </div>

        {/* Citation */}
        <div className="text-center max-w-2xl mx-auto space-y-2 text-sm sm:text-base text-slate-700 font-sans leading-relaxed relative z-10">
          <p>
            for active participation, outstanding technical innovation, and successfully building Voice AI Agents with Team <strong className="text-slate-950">{teamName}</strong> under the <strong className="text-slate-950">{trackName}</strong> Track.
          </p>
          <p className="text-xs text-slate-500 pt-2 font-mono">
            Issued on {issueDate} • Olive Public School, Chennai, Tamil Nadu
          </p>
        </div>

        {/* Signatures & Gold Badge Seal */}
        <div className="mt-12 flex items-end justify-between pt-6 border-t border-slate-200 relative z-10 gap-4">
          {/* Signature 1 */}
          <div className="text-center font-sans">
            <p className="font-serif italic text-lg font-bold text-slate-900">Sivaram R S</p>
            <div className="w-32 h-0.5 bg-slate-400 mx-auto my-1" />
            <p className="text-xs font-bold text-slate-900">Sivaram R S</p>
            <p className="text-[10px] text-slate-500">Co-Founder & CEO, SnapServe AI</p>
          </div>

          {/* Center Gold Badge Seal */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 border-4 border-amber-200 shadow-xl flex items-center justify-center text-center p-2 text-slate-950 font-sans relative">
              <div className="absolute -inset-1 rounded-full border border-dashed border-amber-400/80" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider leading-none">OFFICIAL</p>
                <Sparkles size={14} className="mx-auto my-0.5 text-amber-950" />
                <p className="text-[8px] font-black uppercase tracking-widest leading-none">SEAL 2026</p>
              </div>
            </div>
          </div>

          {/* Signature 2 */}
          <div className="text-center font-sans">
            <p className="font-serif italic text-lg font-bold text-slate-900">Rohith Raju</p>
            <div className="w-32 h-0.5 bg-slate-400 mx-auto my-1" />
            <p className="text-xs font-bold text-slate-900">Rohith RAJU</p>
            <p className="text-[10px] text-slate-500">Founder & CEO, Vobiz.ai</p>
          </div>
        </div>

        {/* Verification Footer */}
        <div className="mt-8 text-center text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-3 flex items-center justify-between">
          <span>VERIFICATION CODE: {certificateId}</span>
          <span>SNAPSERVE AI CERTIFICATION AUTHORITY</span>
        </div>
      </div>
    </div>
  )
}
