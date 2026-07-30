import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Sparkles, Zap, CheckCircle2, XCircle, ChevronDown,
  MessageSquare, Globe, FileSpreadsheet, Users, Layers, Award,
  PhoneCall, Terminal, ArrowRight, ShieldAlert, Check, Copy, Clock,
  ExternalLink, Play, Lightbulb, Compass, Star, ChevronRight, CheckSquare, Square
} from 'lucide-react'

export function ParticipantPlaybook() {
  const [activeSection, setActiveSection] = useState<string>('sec-1')
  const [copiedCode, setCopiedCode] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)

  // Interactive Checklist State
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    webcall: true,
    realphone: false,
    whatsapp: false,
    trigger: false,
    callingwindow: true,
    fallback: false,
  })

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el) {
      const yOffset = -20
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const SECTIONS = [
    { id: 'sec-1', label: '1. What is SnapServe?', icon: <Zap size={14} /> },
    { id: 'sec-2', label: '2. Features & Benefits', icon: <Layers size={14} /> },
    { id: 'sec-3', label: '3. Crack the Voiceathon', icon: <Sparkles size={14} /> },
    { id: 'sec-4', label: '4. Top-20 Blueprint', icon: <Award size={14} /> },
    { id: 'sec-5', label: '5. Quickstart (15m)', icon: <Play size={14} /> },
    { id: 'sec-6', label: '6. WhatsApp Playbook', icon: <MessageSquare size={14} /> },
    { id: 'sec-7', label: '7. Website Triggers', icon: <Globe size={14} /> },
    { id: 'sec-8', label: '8. Google Sheets', icon: <FileSpreadsheet size={14} /> },
    { id: 'sec-9', label: '9. Squad Agents', icon: <Users size={14} /> },
    { id: 'sec-10', label: '10. Power Features', icon: <Star size={14} /> },
    { id: 'sec-11', label: '11. Judging Criteria', icon: <Award size={14} /> },
    { id: 'sec-12', label: '12. Demo Day Checklist', icon: <CheckCircle2 size={14} /> },
    { id: 'sec-13', label: '13. Glossary & Map', icon: <BookOpen size={14} /> },
  ]

  // Auto-update active section in Table of Contents on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0.1
      }
    )

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => {
      SECTIONS.forEach((s) => {
        const el = document.getElementById(s.id)
        if (el) observer.unobserve(el)
      })
    }
  }, [])

  return (
    <div className="space-y-6 text-slate-800" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── HEADER BANNER ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-700/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E83C00]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-[#E83C00] text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-sm">
              <Sparkles size={11} /> Official Participant Playbook
            </span>
            <span className="px-3 py-1 bg-slate-800/90 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-700">
              SnapServe Voiceathon
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            SnapServe Voiceathon Participant Playbook
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed font-normal">
            Go from zero → working demo that can place/receive real calls, trigger from a website or Google Sheet, follow up on WhatsApp, and run multi-agent squads.
          </p>

          {/* Schedule Toggle */}
          <div className="pt-2">
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all border border-white/10 shadow-xs"
            >
              <Clock size={14} className="text-orange-400" />
              {showSchedule ? 'Hide Event Schedule' : 'View Event Schedule'}
              <ChevronDown size={14} className={`transition-transform ${showSchedule ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── SCHEDULE COLLAPSIBLE ── */}
      <AnimatePresence>
        {showSchedule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <BookOpen className="text-[#E83C00]" size={18} />
                <h3 className="text-sm font-black text-slate-900">Event Schedule</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { time: '9:30 AM', title: 'Registration & Check-in', icon: '📝' },
                  { time: '11:00 AM', title: '🔔 Round 1 Begins (Table Evaluation)', icon: '🔔', highlight: true },
                  { time: 'Lunch', title: 'Lunch & Networking Break', icon: '🍱' },
                  { time: 'Post-Lunch', title: '🏆 Top 20 Announced & Stage Problem', icon: '🏆', highlight: true },
                  { time: '+2 Hours', title: 'Finalist Sprint (Stage Challenge)', icon: '⚡' },
                  { time: 'Final Round', title: 'Top 20 Live Stage Pitching', icon: '🎤', highlight: true },
                  { time: 'Closing', title: '🏆 Winners Announced & Awards', icon: '🥇', highlight: true },
                ].map((item, i) => (
                  <div key={i} className={`p-3 rounded-xl border flex items-center gap-3 ${item.highlight ? 'bg-orange-50/70 border-orange-200' : 'bg-slate-50/60 border-slate-100'}`}>
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <span className="text-[9px] font-bold text-[#E83C00] uppercase tracking-wider block">{item.time}</span>
                      <p className={`text-xs ${item.highlight ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOBILE HORIZONTAL SECTION NAV ── */}
      <div className="block lg:hidden bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Compass size={13} className="text-[#E83C00]" /> Jump to Section
        </p>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all whitespace-nowrap ${
                activeSection === sec.id
                  ? 'bg-[#E83C00] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{sec.icon}</span>
              <span>{sec.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── LAYOUT WITH STICKY SIDEBAR ON DESKTOP ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── DESKTOP SIDEBAR NAVIGATION ONLY ── */}
        <div className="hidden lg:block lg:col-span-3 lg:sticky lg:top-20 space-y-3 self-start">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Compass size={13} className="text-[#E83C00]" /> Table of Contents
            </p>
            <nav className="space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all text-left ${
                    activeSection === sec.id
                      ? 'bg-[#E83C00] text-white shadow-sm shadow-[#E83C00]/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="shrink-0">{sec.icon}</span>
                  <span className="truncate text-[11px]">{sec.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ── MAIN CONTENT AREA ── */}
        <div className="lg:col-span-9 space-y-6">

          {/* ── 1. WHAT IS SNAPSERVE? ── */}
          <section id="sec-1" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#E83C00] flex items-center justify-center font-black">1</div>
                <h2 className="text-base font-black text-slate-900">What is SnapServe?</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md">Overview</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              SnapServe (powered by <b>Sarvam AI</b>) is a <b>voice-agent platform for India</b>. You design what the agent says and does; SnapServe handles telephony, real-time audio, STT/LLM/TTS, memory, and integrations.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
              💡 Think of it as: your voice-call backend + agent builder + WhatsApp / Sheets / website trigger layer.
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-extrabold">You Focus On</th>
                    <th className="px-4 py-2.5 font-extrabold">SnapServe Handles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">Problem, script, persona</td>
                    <td className="px-4 py-2.5 text-slate-600">Phone numbers &amp; call audio</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">Knowledge (PDFs, FAQs)</td>
                    <td className="px-4 py-2.5 text-slate-600">STT → LLM → TTS (or Gemini Live)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">Tools (booking, webhooks)</td>
                    <td className="px-4 py-2.5 text-slate-600">Transcripts, dispositions, memory</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">Integrations (WA, Sheets, site)</td>
                    <td className="px-4 py-2.5 text-slate-600">TRAI-aware calling windows</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs text-orange-950 leading-relaxed">
              <b className="font-bold text-orange-900 block mb-1">Why Voice (not just a chatbot)?</b>
              India still runs on phone calls — clinics, collections, field sales, school admin, hiring. A great Voiceathon project makes <b>talking</b> the natural interface, not a gimmick on top of a form.
            </div>
          </section>

          {/* ── 2. FEATURES & BENEFITS MAP ── */}
          <section id="sec-2" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">2</div>
                <h2 className="text-base font-black text-slate-900">Features &amp; Benefits (Capability Map)</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-md">Stack Map</span>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#E83C00] flex items-center gap-1.5">
                <PhoneCall size={14} /> Core Voice Capabilities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { feat: 'Outbound calls', desc: 'Agent dials a lead from API, Sheets, website, or campaign' },
                  { feat: 'Inbound calls', desc: 'Assign a DID to an agent; callers get answered live' },
                  { feat: 'Browser Webcall', desc: 'Test without a phone — iterate prompts fast' },
                  { feat: 'Multilingual', desc: 'Hindi, Tamil, Telugu, Kannada, Hinglish + more (Sarvam / Azure)' },
                  { feat: 'Gemini Live', desc: 'Ultra-low latency demos (audio in/out, no STT→TTS hop)' },
                ].map((f, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
                    <span className="text-xs font-bold text-slate-900 block">{f.feat}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">{f.desc}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-xs font-black uppercase tracking-wider text-[#E83C00] pt-2 flex items-center gap-1.5">
                <Zap size={14} /> Intelligence &amp; RAG
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { feat: 'Persistent caller memory', desc: 'Remembers name, preferences, past issues across calls' },
                  { feat: 'Knowledge base (RAG)', desc: 'Ground answers in your PDFs / FAQs / policies' },
                  { feat: 'Disposition engine', desc: 'Auto-label outcomes (hot lead, callback, not interested…)' },
                  { feat: 'Custom webhook tools', desc: 'Agent calls your API mid-call (CRM, inventory, KYC status)' },
                  { feat: 'In-call booking', desc: 'Check slots & book on Google Calendar / Cal.com while talking' },
                ].map((f, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
                    <span className="text-xs font-bold text-slate-900 block">{f.feat}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">{f.desc}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-xs font-black uppercase tracking-wider text-[#E83C00] pt-2 flex items-center gap-1.5">
                <Layers size={14} /> Distribution &amp; Automation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { feat: 'WhatsApp (Instant)', desc: 'Post-call summary / booking / "call me" — no Meta setup' },
                  { feat: 'Website lead capture', desc: 'Form submit → auto dial' },
                  { feat: 'Google Sheets auto-dial', desc: 'New row → call; outcomes write back to the sheet' },
                  { feat: 'Campaigns', desc: 'Bulk lists, retries, lead sources' },
                  { feat: 'Squads', desc: 'Mid-call handoff + follow-up tasks between specialist agents' },
                ].map((f, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
                    <span className="text-xs font-bold text-slate-900 block">{f.feat}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">{f.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs">
              <span className="font-bold text-orange-400 uppercase tracking-wider text-[10px] block">Why this stack wins hackathons</span>
              <ul className="list-disc list-inside space-y-1 text-slate-300 font-normal">
                <li><b>Live phone demos</b> beat slideware.</li>
                <li><b>Data loop</b> (call → transcript → disposition → Sheet / WhatsApp) looks like a real product.</li>
                <li><b>Indic languages</b> differentiate you from English-only teams.</li>
                <li><b>Squads</b> turn “a bot” into “a team that scales.”</li>
              </ul>
            </div>
          </section>

          {/* ── 3. HOW TO CRACK THE VOICEATHON ── */}
          <section id="sec-3" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">3</div>
                <h2 className="text-base font-black text-slate-900">How to Crack the Voiceathon</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded-md">Strategy</span>
            </div>

            {/* Formula */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md">
              <span className="text-[10px] font-extrabold uppercase tracking-widest block mb-1 opacity-90">The Winning Formula</span>
              <p className="text-xs sm:text-sm font-bold leading-relaxed">
                Real India problem + Working live call (Webcall + real phone) + At least 3 platform capabilities + One clear data loop (Sheet / website / WhatsApp) + Tight 3-minute demo story
              </p>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-xs font-black text-slate-800 mb-3 uppercase tracking-wider">Suggested Timeline</h3>
              <div className="space-y-2">
                {[
                  { time: 'Hour 0–1', task: 'Pick problem + write the conversation script on paper' },
                  { time: 'Hour 1–2', task: 'Create agent, Webcall until the script feels natural' },
                  { time: 'Hour 2–3', task: 'Attach KB or memory; add booking or one webhook tool' },
                  { time: 'Hour 3–4', task: 'Wire ONE trigger: Website OR Sheets' },
                  { time: 'Hour 4–5', task: 'Enable Instant WhatsApp; send a test + post-call message' },
                  { time: 'Hour 5–6', task: 'Optional: Squad (qualifier → scheduler)' },
                  { time: 'Before demo', task: 'Rehearse live call 5×; prepare 30s fallback recording' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-all">
                    <span className="px-2.5 py-1 bg-[#E83C00]/10 text-[#E83C00] font-black text-[10px] rounded-lg shrink-0 w-24 text-center">
                      {step.time}
                    </span>
                    <span className="text-xs text-slate-700 font-medium">{step.task}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Do / Don't */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-2">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" /> DO THIS
                </h4>
                <ul className="text-xs text-emerald-950 space-y-1.5 list-disc list-inside font-medium">
                  <li>Solve one sharp problem deeply</li>
                  <li>Use Instant WhatsApp</li>
                  <li>Show Sheet or website → call live</li>
                  <li>Write a ruthless system prompt</li>
                  <li>Test silence, “call later”, language mix</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200/90 space-y-2">
                <h4 className="text-xs font-black text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle size={14} className="text-red-600" /> AVOID THIS
                </h4>
                <ul className="text-xs text-red-950 space-y-1.5 list-disc list-inside font-medium">
                  <li>Boil the ocean (10 agents, no demo)</li>
                  <li>Dive into Meta WABA / BYON on day one</li>
                  <li>Only show a recorded video</li>
                  <li>Rely on a one-line “you are helpful” prompt</li>
                  <li>Assume the happy path only</li>
                </ul>
              </div>
            </div>

            {/* Prompt Tips */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Prompt Tips (80% of Quality)</h4>
              <p className="text-xs text-slate-600">Your system prompt should explicitly define:</p>
              <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1.5 font-semibold">
                <li><b className="text-slate-900">Who</b> the agent is (name, company, tone)</li>
                <li><b className="text-slate-900">Goal</b> of the call (qualify / book / remind / collect)</li>
                <li><b className="text-slate-900">Must ask</b> questions (in exact sequence)</li>
                <li><b className="text-slate-900">Must never say</b> (prohibited claims, prices you don't have)</li>
                <li><b className="text-slate-900">Objection handling</b> (“I’m busy”, “send WhatsApp”, “wrong person”)</li>
                <li><b className="text-slate-900">End of call</b> (summary, next step, disposition)</li>
              </ol>
            </div>
          </section>

          {/* ── 4. WHAT A TOP-20 TEAM LOOKS LIKE ── */}
          <section id="sec-4" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">4</div>
                <h2 className="text-base font-black text-slate-900">What a Top-20 Team Looks Like</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase rounded-md">Blueprint</span>
            </div>

            {/* Scorecard Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-extrabold">Dimension</th>
                    <th className="px-4 py-2.5 font-extrabold">Top-20 Standard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Problem</td>
                    <td className="px-4 py-2.5 text-slate-600">Named ICP + pain (“clinic no-shows costing X”)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Live demo</td>
                    <td className="px-4 py-2.5 text-slate-600">Webcall <b>and</b> at least one real phone call works</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Depth</td>
                    <td className="px-4 py-2.5 text-slate-600">≥ 3 capabilities (e.g. Memory + KB + WhatsApp, or Sheets + Disposition + Squad)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Conversation</td>
                    <td className="px-4 py-2.5 text-slate-600">Stays on script, handles “call later”, doesn't invent facts</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Integration</td>
                    <td className="px-4 py-2.5 text-slate-600">Visible flywheel: trigger → call → outcome in Sheet/WA/dashboard</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Story</td>
                    <td className="px-4 py-2.5 text-slate-600">3 minutes: problem → live call → proof of data → why voice</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-inner">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block">Architecture of a Strong Submission</span>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs font-semibold">
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 w-full sm:w-auto text-center">
                  <p className="text-orange-300 font-bold text-[11px]">1. Trigger</p>
                  <p className="text-[11px] text-slate-300">Website / Sheet</p>
                </div>
                <ArrowRight className="text-orange-400 rotate-90 sm:rotate-0 shrink-0" size={16} />
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 w-full sm:w-auto text-center">
                  <p className="text-orange-300 font-bold text-[11px]">2. Dial Engine</p>
                  <p className="text-[11px] text-slate-300">SnapServe Campaign</p>
                </div>
                <ArrowRight className="text-orange-400 rotate-90 sm:rotate-0 shrink-0" size={16} />
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 w-full sm:w-auto text-center">
                  <p className="text-orange-300 font-bold text-[11px]">3. Voice Agent</p>
                  <p className="text-[11px] text-slate-300">Prompt + KB + Tools</p>
                </div>
                <ArrowRight className="text-orange-400 rotate-90 sm:rotate-0 shrink-0" size={16} />
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 w-full sm:w-auto text-center">
                  <p className="text-orange-300 font-bold text-[11px]">4. Flywheel</p>
                  <p className="text-[11px] text-slate-300">WhatsApp / Writeback</p>
                </div>
              </div>
            </div>

            {/* Example Shapes */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-extrabold">Track</th>
                    <th className="px-4 py-2.5 font-extrabold">Shape</th>
                    <th className="px-4 py-2.5 font-extrabold">Capabilities to Show</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Healthcare</td>
                    <td className="px-4 py-2.5 text-slate-600">Missed-appointment recovery</td>
                    <td className="px-4 py-2.5 text-slate-600">Inbound/outbound + booking + WhatsApp reminder</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Edtech / schools</td>
                    <td className="px-4 py-2.5 text-slate-600">Parent outreach in Hindi</td>
                    <td className="px-4 py-2.5 text-slate-600">Multilingual + Sheets dialer + memory</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Hiring</td>
                    <td className="px-4 py-2.5 text-slate-600">Screen → schedule</td>
                    <td className="px-4 py-2.5 text-slate-600">Squad (qualifier ↔ scheduler) + calendar</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Collections / lending</td>
                    <td className="px-4 py-2.5 text-slate-600">Soft reminder calls</td>
                    <td className="px-4 py-2.5 text-slate-600">Disposition taxonomy + Sheet writeback</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Local business</td>
                    <td className="px-4 py-2.5 text-slate-600">Website lead → instant call</td>
                    <td className="px-4 py-2.5 text-slate-600">Website widget + Instant WhatsApp</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 5. HELLO WORLD IN 15 MINUTES ── */}
          <section id="sec-5" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">5</div>
                <h2 className="text-base font-black text-slate-900">Hello World in 15 Minutes</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-md">Quickstart</span>
            </div>

            <div className="space-y-3">
              {[
                { step: '1', title: 'Sign in to Dashboard', desc: 'Sign in to the SnapServe dashboard portal.' },
                { step: '2', title: 'Create Agent', desc: 'Agents → New agent — name it, paste a short system prompt.' },
                { step: '3', title: 'Test Webcall', desc: 'Open the agent → Webcall → talk for 60 seconds; refine the prompt.' },
                { step: '4', title: 'Assign Phone Number', desc: 'Phone Numbers — assign a number to your agent for live inbound/outbound calls (Free trial credits included).' },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                  <span className="w-6 h-6 rounded-lg bg-[#E83C00] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    {s.step}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{s.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 6. PLAYBOOK: CONNECT WHATSAPP TO YOUR AGENT ── */}
          <section id="sec-6" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">6</div>
                <h2 className="text-base font-black text-slate-900">Connect WhatsApp to Your Agent</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-md">WhatsApp</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 leading-relaxed space-y-2">
              <b className="font-bold text-emerald-900 block">Instant WhatsApp Capabilities (Recommended):</b>
              <ul className="list-disc list-inside space-y-1 font-medium">
                <li>SnapServe-hosted WhatsApp channel (shared tier)</li>
                <li>Post-call messages (summary / booking / callback)</li>
                <li>Customer can ask to be called back (“call me”) → your agent dials automatically</li>
                <li>Optional chatbot replies in-thread</li>
                <li><b>No Meta Business Manager, no WABA token, no BYON required</b></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Step-by-Step Setup</h3>
              <ol className="list-decimal list-inside text-xs text-slate-700 space-y-2 font-medium bg-slate-50 p-4 rounded-xl border border-slate-200">
                <li>Build and test your agent first.</li>
                <li>Go to <b>WhatsApp</b> in the sidebar (<code className="bg-slate-200 px-1.5 py-0.5 rounded text-[11px]">/app/whatsapp</code>).</li>
                <li>Choose <b>Instant · most users</b> → <b>Enable Instant WhatsApp</b>.</li>
                <li>Enter <b>Business Name</b> (e.g. CarePlus Clinic) and select your <b>Call-me agent</b>.</li>
                <li>Confirm / enable. Turn on post-call summary or booking options on the panel.</li>
                <li>Click <b>Send test</b> and check the message log.</li>
                <li>Place a test call → verify the automated WhatsApp follow-up.</li>
              </ol>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-2">
              <span className="font-bold text-orange-400 uppercase tracking-wider text-[10px] block">Demo Pitch Script for Judges</span>
              <ol className="list-decimal list-inside text-slate-300 space-y-1 font-normal">
                <li>Complete a live voice call with the agent on stage.</li>
                <li>Show the Instant WhatsApp log / phone screen receiving the immediate follow-up.</li>
                <li>(Optional) Type “call me” on WhatsApp → watch the agent trigger a live return call.</li>
              </ol>
            </div>
          </section>

          {/* ── 7. PLAYBOOK: CONNECT A WEBSITE ── */}
          <section id="sec-7" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">7</div>
                <h2 className="text-base font-black text-slate-900">Connect a Website (Auto Call Triggers)</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded-md">Webhooks</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              A visitor submits a lead on your site → SnapServe creates a campaign lead → your agent <b>calls them automatically</b> in real time.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">JavaScript Embed Snippet</h3>
                <button
                  onClick={() => copyCode(`<script src="https://YOUR_APP_ORIGIN/api/widget/lead-capture.js"\n        data-token="YOUR_TOKEN"></script>\n\nSnapServe.submit({\n  "phone": "+919876543210",\n  "name": "Priya Sharma",\n  "email": "priya@example.com"\n})`)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1"
                >
                  {copiedCode ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  {copiedCode ? 'Copied Snippet' : 'Copy Code'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">
                <pre>{`<script src="https://YOUR_APP_ORIGIN/api/widget/lead-capture.js"
        data-token="YOUR_TOKEN"></script>

SnapServe.submit({
  "phone": "+919876543210",
  "name": "Priya Sharma",
  "email": "priya@example.com"
})
.then(() => console.log("Lead sent!"))
.catch((err) => console.error(err.message));`}</pre>
              </div>
            </div>
          </section>

          {/* ── 8. PLAYBOOK: CONNECT GOOGLE SHEETS ── */}
          <section id="sec-8" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">8</div>
                <h2 className="text-base font-black text-slate-900">Connect Google Sheets</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-md">Sheets Sync</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Connect Google once via OAuth → Map columns (Phone, Name, Email) → Agent auto-dials new/backfilled rows → Outcomes write back to the sheet automatically.
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-extrabold">Writeback Mode</th>
                    <th className="px-4 py-2.5 font-extrabold">Use Case</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">same_sheet</td>
                    <td className="px-4 py-2.5 text-slate-600">Keep everything in one single sheet tab</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">call_log</td>
                    <td className="px-4 py-2.5 text-slate-600">Clean audit trail in a separate Call Log tab</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">both</td>
                    <td className="px-4 py-2.5 text-slate-600">Best for hackathon demos — original list + detailed log tab</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 9. SQUAD AGENTS ── */}
          <section id="sec-9" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#E83C00] flex items-center justify-center font-black">9</div>
                <h2 className="text-base font-black text-slate-900">Squad Agents (Multi-Agent Teams)</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-orange-50 text-[#E83C00] text-[10px] font-bold uppercase rounded-md">Multi-Agent</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              A <b>squad</b> is a team of specialized agents working together:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1.5 font-medium bg-slate-50 p-4 rounded-xl border border-slate-200">
              <li><b>Hand off mid-call:</b> Same live call transfers to a specialist agent seamlessly.</li>
              <li><b>Shared memory:</b> Facts gathered by Agent A are instantly known by Agent B.</li>
              <li><b>Follow-up tasks:</b> Automated post-call task creation for follow-up dials.</li>
            </ul>

            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-950 font-medium">
              <b>Pitch Narrative for Judges:</b> “One agent is a feature. A squad is a product. Watch our Qualifier hand the live call to the Scheduler — same call, shared context — then Instant WhatsApp delivers the confirmation.”
            </div>
          </section>

          {/* ── 10. POWER FEATURES ── */}
          <section id="sec-10" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">10</div>
                <h2 className="text-base font-black text-slate-900">Power Features Worth Using</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded-md">Power Tools</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { feat: 'Persistent memory', nav: 'Agent / caller profiles', why: 'Returning-caller magic' },
                { feat: 'Knowledge base', nav: 'Upload PDF / text to agent', why: 'Grounded answers, less hallucination' },
                { feat: 'Native booking', nav: 'Agent tools + Scheduling', why: 'Live slot booking on call' },
                { feat: 'Disposition', nav: 'Agent disposition config', why: 'Auto labels for Sheet / CRM story' },
                { feat: 'Webhook tool', nav: 'Agent tools', why: 'Live API lookup mid-call' },
                { feat: 'Instant WhatsApp', nav: 'WhatsApp page', why: 'Follow-up without Meta' },
                { feat: 'Website leads', nav: 'Campaigns', why: 'Trigger without a spreadsheet' },
                { feat: 'Sheets auto-dial', nav: 'Automatic Calls', why: 'Visible ops dashboard for judges' },
                { feat: 'Squads', nav: 'Squads page', why: 'Scalability story' },
                { feat: 'Indic stack', nav: 'Agent STT/TTS/LLM', why: 'Sarvam / Azure LID for Hindi–Tamil' },
              ].map((item, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
                  <span className="font-bold text-slate-900 block">{item.feat}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{item.nav}</span>
                  <span className="text-[11px] text-[#E83C00] font-semibold mt-1 block">{item.why}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── 11. JUDGING CRITERIA ── */}
          <section id="sec-11" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">11</div>
                <h2 className="text-base font-black text-slate-900">Judging Criteria Breakdown</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase rounded-md">Evaluation</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-extrabold">Weight</th>
                    <th className="px-4 py-2.5 font-extrabold">Criterion</th>
                    <th className="px-4 py-2.5 font-extrabold">What to Prove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="px-4 py-2.5 font-black text-[#E83C00]">25%</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Problem fit</td>
                    <td className="px-4 py-2.5 text-slate-600">Real users, voice is the right medium</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-black text-[#E83C00]">25%</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Technical depth</td>
                    <td className="px-4 py-2.5 text-slate-600">≥3 platform capabilities, not a thin wrapper</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-black text-[#E83C00]">20%</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Conversation quality</td>
                    <td className="px-4 py-2.5 text-slate-600">Natural, on-task, edge cases handled</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-black text-[#E83C00]">20%</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Demo impact</td>
                    <td className="px-4 py-2.5 text-slate-600">Live call works; transcript / Sheet / WA visible</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-black text-[#E83C00]">10%</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Market potential</td>
                    <td className="px-4 py-2.5 text-slate-600">Who pays, why now (one slide is enough)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 12. DEMO DAY CHECKLIST (INTERACTIVE) ── */}
          <section id="sec-12" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">12</div>
                <h2 className="text-base font-black text-slate-900">Demo Day Readiness Checklist</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-md">Interactive</span>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">60 Minutes Before Pitching (Click to Check Off):</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'webcall', text: 'Agent Webcall verified' },
                  { id: 'realphone', text: 'Real phone call tested (inbound/outbound)' },
                  { id: 'whatsapp', text: 'Instant WhatsApp test message verified' },
                  { id: 'trigger', text: 'Website or Sheet trigger tested recently' },
                  { id: 'callingwindow', text: 'Calling window open for demo hours' },
                  { id: 'fallback', text: '60-90s fallback recording ready' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      checkedItems[item.id]
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    {checkedItems[item.id] ? (
                      <CheckSquare size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <Square size={16} className="text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs">{item.text}</span>
                  </button>
                ))}
              </div>

              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] pt-3">3-Minute Pitch Time Breakdown</h3>
              <div className="space-y-2 text-xs font-semibold">
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 flex items-center justify-between">
                  <span><b>30s</b> — Problem + who hurts</span>
                  <span className="text-[10px] font-extrabold uppercase bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md">Opening</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                  <span><b>90s</b> — Live call (or trigger form/Sheet → call)</span>
                  <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">Live Demo</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 flex items-center justify-between">
                  <span><b>45s</b> — Show proof: transcript, disposition, Sheet row, WhatsApp message</span>
                  <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">Data Proof</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center justify-between">
                  <span><b>15s</b> — Commercial scale &amp; why now (squads)</span>
                  <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">Closing</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── 13. GLOSSARY & MAP ── */}
          <section id="sec-13" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center font-black">13</div>
                <h2 className="text-base font-black text-slate-900">Glossary &amp; Navigation Map</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-md">Reference</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-extrabold">Term</th>
                    <th className="px-4 py-2.5 font-extrabold">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Agent</td>
                    <td className="px-4 py-2.5 text-slate-600">One voice persona (prompt, voice, tools, KB)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Squad</td>
                    <td className="px-4 py-2.5 text-slate-600">Team of agents with handoff + shared memory + tasks</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Instant WhatsApp</td>
                    <td className="px-4 py-2.5 text-slate-600">Shared SnapServe WA channel — no Meta setup required</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Webcall</td>
                    <td className="px-4 py-2.5 text-slate-600">Browser mic test of an agent</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-900">Automatic Calls</td>
                    <td className="px-4 py-2.5 text-slate-600">Google Sheets → dial + writeback</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>

    </div>
  )
}
