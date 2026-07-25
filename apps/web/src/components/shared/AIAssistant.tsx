import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MessageSquare, X, Send, Bot, User, Volume2, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/app.store'
import { cn } from '@/lib/utils'
import { VoiceWaveform } from '@/components/landing/VoiceWaveform'
import { FAQ_ITEMS, HACKATHON_CONFIG, SCHEDULE_ITEMS } from '@hackathon/shared'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const PREDEFINED_QA: Record<string, string> = {
  register: `To register, click the "Register" button on the homepage and complete the form (individual or team). Once submitted, your application will be reviewed within 48 hours.`,
  rules: `Key rules:\n• Teams of 2–4 members\n• Build from scratch during the hackathon\n• Open-source libraries are allowed\n• Projects must use AI/Voice technology\n• Submission must include a working demo`,
  schedule: `The hackathon runs Aug 15–17, 2026:\n• Aug 15, 9AM — Opening Ceremony\n• Aug 15, 11AM — Hacking Begins\n• Aug 16, 5PM — Submission Deadline\n• Aug 17, 10AM — Round 1 Demos\n• Aug 17, 5PM — Awards Ceremony`,
  prizes: `Prize Pool of ₹5,00,000:\n🥇 1st Place — ₹2,00,000 + Internship offers\n🥈 2nd Place — ₹1,00,000\n🥉 3rd Place — ₹50,000\n⭐ Best AI Innovation — ₹75,000\n⭐ Best Presentation — ₹25,000`,
  judging: `Projects are judged on:\n• Innovation & Creativity (25pts)\n• Technical Quality (25pts)\n• AI Usage (20pts)\n• Business Value (15pts)\n• Presentation (10pts)\n• Bonus (5pts)`,
  venue: `Venue: ${HACKATHON_CONFIG.venue}\nThe hackathon is an in-person 48-hour event. Details on accommodation will be shared with approved teams.`,
}

function getAutoResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('register') || lower.includes('sign up') || lower.includes('apply')) return PREDEFINED_QA.register
  if (lower.includes('rule') || lower.includes('eligib')) return PREDEFINED_QA.rules
  if (lower.includes('schedule') || lower.includes('time') || lower.includes('when')) return PREDEFINED_QA.schedule
  if (lower.includes('prize') || lower.includes('money') || lower.includes('win')) return PREDEFINED_QA.prizes
  if (lower.includes('judg') || lower.includes('score') || lower.includes('evaluat')) return PREDEFINED_QA.judging
  if (lower.includes('venue') || lower.includes('where') || lower.includes('location')) return PREDEFINED_QA.venue
  return `I can help you with:\n• How to register\n• Rules & eligibility\n• Event schedule\n• Prize pool\n• Judging criteria\n• Venue details\n\nWhat would you like to know?`
}

const quickReplies = ['How to register?', 'Prize pool?', 'Schedule?', 'Judging criteria?']

export function AIAssistant() {
  const { aiAssistantOpen, setAiAssistantOpen } = useAppStore()
  const [mode, setMode] = useState<'chat' | 'voice'>('chat')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm the AI Voice Hackathon assistant. 👋\n\nAsk me anything about the event — registration, rules, schedule, prizes, or judging criteria.`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    await new Promise(r => setTimeout(r, 800 + Math.random() * 500))
    const response = getAutoResponse(text)
    setIsTyping(false)
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    }])
  }

  const toggleVoice = () => {
    setIsListening(!isListening)
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false)
        sendMessage('How do I register for the hackathon?')
      }, 3000)
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: 'spring' }}
        onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'w-14 h-14 rounded-2xl',
          'flex items-center justify-center',
          'bg-gradient-to-br from-primary to-secondary',
          'shadow-[0_0_30px_rgba(79,70,229,0.4)]',
          'hover:shadow-[0_0_50px_rgba(79,70,229,0.6)]',
          'transition-all duration-300',
          'group'
        )}
        aria-label="Open AI Assistant"
        id="ai-assistant-button"
      >
        <AnimatePresence mode="wait">
          {aiAssistantOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot size={22} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pulse ring */}
        {!aiAssistantOpen && (
          <span className="absolute inset-0 rounded-2xl ring-2 ring-primary/40 animate-ping" />
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {aiAssistantOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-24 right-6 z-50 w-80 md:w-96 rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.5)] border border-white/10"
            style={{ background: 'rgba(9, 11, 28, 0.95)', backdropFilter: 'blur(20px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">AI Assistant</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[11px] text-muted">Online</span>
                  </div>
                </div>
              </div>
              {/* Mode switch */}
              <div className="flex items-center gap-1 glass rounded-lg p-1">
                <button
                  onClick={() => setMode('chat')}
                  className={cn('p-1.5 rounded-md transition-all', mode === 'chat' ? 'bg-primary text-white' : 'text-muted hover:text-white')}
                >
                  <MessageSquare size={14} />
                </button>
                <button
                  onClick={() => setMode('voice')}
                  className={cn('p-1.5 rounded-md transition-all', mode === 'voice' ? 'bg-primary text-white' : 'text-muted hover:text-white')}
                >
                  <Mic size={14} />
                </button>
              </div>
            </div>

            {mode === 'chat' ? (
              <>
                {/* Messages */}
                <div className="h-72 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                      <div className={cn(
                        'w-7 h-7 rounded-xl flex items-center justify-center shrink-0',
                        msg.role === 'assistant' ? 'bg-gradient-to-br from-primary to-secondary' : 'bg-surface-3'
                      )}>
                        {msg.role === 'assistant' ? <Bot size={14} className="text-white" /> : <User size={14} className="text-muted" />}
                      </div>
                      <div className={cn(
                        'max-w-[75%] px-3 py-2.5 rounded-xl text-xs leading-relaxed whitespace-pre-line',
                        msg.role === 'assistant'
                          ? 'bg-surface-3/80 text-white/90 rounded-tl-sm'
                          : 'bg-primary text-white rounded-tr-sm'
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Bot size={14} className="text-white" />
                      </div>
                      <div className="bg-surface-3/80 px-3 py-2.5 rounded-xl rounded-tl-sm">
                        <div className="flex gap-1 items-center h-4">
                          {[0, 1, 2].map(i => (
                            <motion.div key={i} className="w-1.5 h-1.5 bg-muted rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.6 }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Quick replies */}
                <div className="px-4 pb-2 flex gap-2 flex-wrap">
                  {quickReplies.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 text-muted hover:text-white hover:border-primary/30 hover:bg-primary/10 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-white/5">
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                      placeholder="Ask anything…"
                      className="flex-1 bg-surface-3/50 text-white text-xs placeholder:text-muted/50 rounded-xl px-3 py-2 border border-white/10 focus:border-primary/40 outline-none transition-all"
                      id="ai-chat-input"
                    />
                    <button
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim()}
                      className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Voice mode */
              <div className="h-64 flex flex-col items-center justify-center gap-6 p-6">
                <div className="relative">
                  <motion.button
                    onClick={toggleVoice}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'w-20 h-20 rounded-full flex items-center justify-center',
                      'transition-all duration-300',
                      isListening
                        ? 'bg-danger shadow-[0_0_40px_rgba(239,68,68,0.5)]'
                        : 'bg-gradient-to-br from-primary to-secondary shadow-[0_0_30px_rgba(79,70,229,0.4)]'
                    )}
                  >
                    {isListening ? <Loader2 size={32} className="text-white animate-spin" /> : <Mic size={32} className="text-white" />}
                  </motion.button>
                  {isListening && (
                    <>
                      <span className="absolute inset-0 rounded-full border-2 border-danger/40 animate-ping" />
                      <span className="absolute -inset-4 rounded-full border border-danger/20 animate-ping" style={{ animationDelay: '0.3s' }} />
                    </>
                  )}
                </div>

                {isListening ? (
                  <div className="flex flex-col items-center gap-3">
                    <VoiceWaveform size="sm" bars={16} />
                    <p className="text-xs text-muted">Listening…</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-white mb-1">Tap to speak</p>
                    <p className="text-xs text-muted">Ask about registration, rules, schedule or prizes</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
