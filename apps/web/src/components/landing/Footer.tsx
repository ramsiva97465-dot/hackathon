import { Link } from 'react-router-dom'
import { Mic, Github, Twitter, Linkedin, ExternalLink, Heart } from 'lucide-react'
import { HACKATHON_CONFIG } from '@hackathon/shared'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="py-20 border-t border-slate-200 bg-[#F8FAFC] relative">
      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5B5CEB] to-[#8B5CF6] flex items-center justify-center shadow-md">
                <Mic size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg text-[#0F172A] tracking-tight">AI Voice Hackathon</span>
            </Link>
            <p className="text-xs text-[#475569] leading-relaxed max-w-xs font-light">
              India's premier AI Voice Agent Hackathon. Pushing the frontier of conversational speech intelligence, one team at a time.
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[#0F172A] bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold mb-4">Event Links</h4>
            <ul className="space-y-2.5">
              {['About', 'Challenge Tracks', 'Schedule', 'Prizes', 'FAQ'].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-xs text-[#475569] hover:text-[#0F172A] font-light transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Leaderboard', href: '/leaderboard' },
                { label: 'Admin Panel', href: '/admin' },
                { label: 'Judge Portal', href: '/judge' },
                { label: 'Apply Registration', href: '/apply' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="text-xs text-[#475569] hover:text-[#0F172A] font-light transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="border-t border-slate-200/60 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
          <p>© {year} AI Voice Agent Hackathon. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart size={12} className="text-[#EF4444] animate-pulse" /> by The Aitel Team
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-[#0F172A] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#0F172A] transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
export default Footer
