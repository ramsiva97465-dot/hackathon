import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Menu, X, ExternalLink, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { HACKATHON_CONFIG } from '@hackathon/shared'

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#tracks', label: 'Tracks' },
  { href: '#schedule', label: 'Schedule' },
  { href: '#judges', label: 'Judges' },
  { href: '#prizes', label: 'Prizes' },
  { href: '#faq', label: 'FAQ' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isLanding = location.pathname === '/'

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled ? 'py-4' : 'py-6'
        )}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div
            className={cn(
              'w-full flex items-center justify-between transition-all duration-500 rounded-2xl px-6 py-3',
              scrolled
                ? 'bg-white/75 backdrop-blur-xl border border-slate-200/50 shadow-[0_15px_40px_rgba(15,23,42,0.03)]'
                : 'bg-transparent border border-transparent'
            )}
          >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5B5CEB] to-[#8B5CF6] flex items-center justify-center shadow-[0_0_15px_rgba(91,92,235,0.2)] transition-all duration-300 group-hover:scale-105">
                  <Mic size={18} className="text-white" />
                </div>
              </div>
              <span className="font-display font-bold text-lg text-[#0F172A] tracking-tight">
                AI Voice
                <span className="text-[#06B6D4] ml-1">Hackathon</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            {isLanding && (
              <div className="hidden md:flex items-center gap-1 bg-[#F4F6F8] rounded-full p-1 border border-slate-200/40">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-4 py-1.5 text-xs font-semibold text-[#475569] hover:text-[#0F172A] rounded-full hover:bg-white transition-all duration-300"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/leaderboard">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-[#475569] hover:text-[#5B5CEB]">
                  Leaderboard
                </Button>
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 rounded-xl text-[#475569] hover:text-[#0F172A] hover:bg-[#F4F6F8] transition-all border border-transparent hover:border-slate-200/50"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-24 left-6 right-6 z-40 p-6 bg-white/95 backdrop-blur-2xl border border-slate-200/50 rounded-2xl shadow-[0_30px_60px_rgba(15,23,42,0.15)]"
          >
            <div className="flex flex-col gap-2 mb-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-semibold text-[#475569] hover:text-[#0F172A] rounded-xl hover:bg-[#F4F6F8] transition-all"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/leaderboard" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" fullWidth size="md">
                  Leaderboard
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
