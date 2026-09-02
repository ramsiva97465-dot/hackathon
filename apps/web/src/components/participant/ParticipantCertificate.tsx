import { useState } from 'react'
import { Award, Download, Share2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

const TEMPLATE_SRC = '/certificates/participation.jpg'
const NAME_FONT = '"Libre Baskerville", Georgia, "Times New Roman", serif'

interface ParticipantCertificateProps {
  participantName: string
  teamName: string
  trackName: string
}

function titleCaseName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => {
      if (!part) return part
      if (part === part.toUpperCase() && part.length <= 3) return part
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join(' ')
}

async function loadTemplate(): Promise<HTMLImageElement> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = TEMPLATE_SRC
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Could not load certificate template'))
  })
  return img
}

async function ensureNameFont() {
  if (!('fonts' in document)) return
  try {
    await Promise.all([
      document.fonts.load(`700 72px ${NAME_FONT}`),
      document.fonts.load(`400 72px ${NAME_FONT}`),
    ])
  } catch {
    // Canvas will fall back to Arial
  }
}

function drawFittedName(
  ctx: CanvasRenderingContext2D,
  name: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  maxSize: number,
) {
  const minSize = Math.max(16, Math.round(maxSize * 0.42))
  let size = maxSize
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#111111'
  ctx.font = `700 ${size}px ${NAME_FONT}`

  while (size > minSize && ctx.measureText(name).width > maxWidth) {
    size -= 1
    ctx.font = `700 ${size}px ${NAME_FONT}`
  }

  ctx.fillText(name, centerX, centerY)
}

export function ParticipantCertificate({
  participantName,
  teamName,
  trackName,
}: ParticipantCertificateProps) {
  const [downloading, setDownloading] = useState(false)
  const displayName = titleCaseName(participantName || 'Participant')

  const handleDownloadHD = async () => {
    try {
      setDownloading(true)
      toast.loading('Preparing your official certificate...')

      await ensureNameFont()
      const template = await loadTemplate()

      const canvas = document.createElement('canvas')
      canvas.width = template.naturalWidth
      canvas.height = template.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas unavailable')

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(template, 0, 0, canvas.width, canvas.height)

      // Name sits in the blank band above the orange underline on the template.
      const centerX = canvas.width * 0.5
      const centerY = canvas.height * 0.522
      const maxWidth = canvas.width * 0.62
      const maxSize = Math.round(canvas.height * 0.072)

      drawFittedName(ctx, displayName, centerX, centerY, maxWidth, maxSize)

      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `Voice-A-Thon_2026_Certificate_${displayName.replace(/\s+/g, '_')}.png`
      link.click()

      toast.dismiss()
      toast.success(`Certificate downloaded for ${displayName}`)
    } catch (err) {
      console.error(err)
      toast.dismiss()
      toast.error('Could not download certificate.')
    } finally {
      setDownloading(false)
    }
  }

  const handleShareLinkedIn = () => {
    const text = `Honored to receive my Official Certificate of Participation for Voice-A-Thon 2026 — India's Biggest Voice-a-thon (Tamil Nadu Edition).\n\nBuilding Voice AI with SnapServe AI & Vobiz. Team "${teamName}" • Track "${trackName}".\n\n#SnapServe #VoiceAI #VoiceAThon2026`
    navigator.clipboard.writeText(text)
    toast.success('LinkedIn post text copied!')
    window.open('https://www.linkedin.com/feed/', '_blank')
  }

  return (
    <div className="w-full space-y-6">
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
              Issued to <span className="text-white font-semibold">{displayName}</span>
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
            {downloading ? 'Preparing...' : 'Download Certificate (PNG)'}
          </button>

          <button
            type="button"
            onClick={handleShareLinkedIn}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-sm transition-all active:scale-95"
          >
            <Share2 size={15} className="text-blue-400" />
            Share
          </button>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-black/10 shadow-2xl bg-[#F7F3EC]">
        <img
          src={TEMPLATE_SRC}
          alt="Voice-A-Thon 2026 Certificate of Participation"
          className="block w-full h-auto select-none"
          draggable={false}
        />
        <div
          className="absolute left-[14%] right-[14%] text-center pointer-events-none"
          style={{
            top: '52.2%',
            transform: 'translateY(-50%)',
            fontFamily: NAME_FONT,
            fontStyle: 'normal',
            fontWeight: 700,
            color: '#111111',
            fontSize: 'clamp(1.35rem, 4.2vw, 3.4rem)',
            lineHeight: 1.15,
            letterSpacing: '0.01em',
          }}
        >
          {displayName}
        </div>
      </div>
    </div>
  )
}
