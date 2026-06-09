import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setUserData } from '../redux/userSlice'
import { serverUrl } from '../App'
import axios from 'axios'

// ─── Palettes ─────────────────────────────────────────────────────────────────
const RANDOM_PALETTES = [
  { name: 'Sunset Coral',   primary: '#FF6B6B', accent: '#FFE66D', bg: '#1a0a0a', desc: 'Warm coral & golden tones' },
  { name: 'Ocean Mint',     primary: '#00D4AA', accent: '#00A8E8', bg: '#020f0d', desc: 'Fresh teal & sky blue' },
  { name: 'Neon Violet',    primary: '#BF5AF2', accent: '#FF375F', bg: '#0d0010', desc: 'Electric purple & pink' },
  { name: 'Forest Sage',    primary: '#4CAF50', accent: '#8BC34A', bg: '#050d05', desc: 'Natural greens, earthy' },
  { name: 'Amber Blaze',    primary: '#FF9500', accent: '#FF6B00', bg: '#0d0800', desc: 'Bold amber & deep orange' },
  { name: 'Arctic Blue',    primary: '#4FC3F7', accent: '#B3E5FC', bg: '#000d1a', desc: 'Cool icy blues, crisp' },
  { name: 'Rose Gold',      primary: '#F48FB1', accent: '#FCE4EC', bg: '#1a0510', desc: 'Soft rose, luxe feel' },
  { name: 'Cyberpunk',      primary: '#39FF14', accent: '#FF0090', bg: '#050505', desc: 'Neon green & hot pink' },
  { name: 'Sandstone',      primary: '#D4A76A', accent: '#8D6E63', bg: '#0d0906', desc: 'Warm desert neutrals' },
  { name: 'Lavender Dream', primary: '#CE93D8', accent: '#80DEEA', bg: '#08000d', desc: 'Soft purple & aqua' },
]
const getRandomPalette = () => RANDOM_PALETTES[Math.floor(Math.random() * RANDOM_PALETTES.length)]

const STEP_WEIGHTS = [0.10, 0.15, 0.20, 0.25, 0.20, 0.10]

const STYLE_PRESETS = [
  { id: 'minimal',       label: 'Minimal',   icon: '◻', desc: 'Clean, lots of whitespace' },
  { id: 'bold',          label: 'Bold',       icon: '◼', desc: 'Strong colors, big typography' },
  { id: 'glassmorphism', label: 'Glass',      icon: '◈', desc: 'Frosted glass effects' },
  { id: 'dark',          label: 'Dark',       icon: '◉', desc: 'Dark theme, premium feel' },
  { id: 'colorful',      label: 'Colorful',   icon: '◍', desc: 'Vibrant, playful palette' },
  { id: 'corporate',     label: 'Corporate',  icon: '◫', desc: 'Professional, trustworthy' },
  { id: 'random',        label: 'Random',     icon: '🎲', desc: 'Surprise color palette' },
]

const SECTIONS = [
  { id: 'hero',         label: 'Hero' },
  { id: 'features',     label: 'Features' },
  { id: 'pricing',      label: 'Pricing' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'faq',          label: 'FAQ' },
  { id: 'footer',       label: 'Footer' },
  { id: 'contact',      label: 'Contact' },
  { id: 'gallery',      label: 'Gallery' },
]

const EXAMPLES = [
  'A dark SaaS landing page for a project management tool with animated hero, feature cards, and pricing table',
  'Minimalist portfolio for a product designer with case studies grid and contact form',
  'E-commerce store for handmade jewellery with product grid, filters, and cart',
  'Restaurant website with full-screen hero, online menu, and reservation form',
  'Fitness coaching landing page with transformation gallery and program tiers',
  'Crypto analytics dashboard with charts, portfolio tracker, and news feed',
]

const GEN_STEPS = [
  'Analyzing your prompt…',
  'Choosing design system…',
  'Building layout structure…',
  'Generating components…',
  'Polishing styles & animations…',
  'Finalizing & validating code…',
]

const TIPS = [
  '💡 Add "with dark mode toggle" to your prompt for a theme switcher.',
  '🎨 Mention a brand color like "blue #2563EB" for more accurate results.',
  '📱 Every generated site is fully mobile-responsive out of the box.',
  '⚡ Use the Enhance button to turn a short idea into a perfect prompt.',
  '🧩 Select only the sections you actually need for a tighter layout.',
  '🚀 Generated sites are export-ready — paste the HTML anywhere.',
  '✨ Try "glassmorphism" style for a modern frosted-glass look.',
  '📝 Mention your target audience for better copy and tone.',
  '🔥 Add "with FAQ accordion" or "with pricing toggle" for extra interactivity.',
]

// ─── Timer persistence ─────────────────────────────────────────────────────────
const STORAGE_KEY    = 'gen_avg_ms'
const DEFAULT_EST_MS = 30000
const PROMPT_CHAR_LIMIT = 1500

function getStoredAvg() {
  try { const v = localStorage.getItem(STORAGE_KEY); return v ? parseFloat(v) : DEFAULT_EST_MS } catch { return DEFAULT_EST_MS }
}
function updateStoredAvg(ms) {
  try {
    const old = getStoredAvg()
    localStorage.setItem(STORAGE_KEY, String(old === DEFAULT_EST_MS ? ms : old * 0.7 + ms * 0.3))
  } catch {}
}
function formatTime(s) {
  if (s <= 0) return '0s'
  const m = Math.floor(s / 60), sec = Math.round(s % 60)
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

// ─── Safe Blob URL creator ─────────────────────────────────────────────────────
function createSafeBlobUrl(html) {
  const safetyHead = `
<base target="_blank">
<script>
(function() {
  try {
    Object.defineProperty(window, 'top',    { get: function() { return window; } });
    Object.defineProperty(window, 'parent', { get: function() { return window; } });
  } catch(e) {}
})();
<\/script>`
  let out = html
  if (out.includes('<head>'))          out = out.replace('<head>', '<head>' + safetyHead)
  else if (/<head\s[^>]*>/i.test(out)) out = out.replace(/<head\s[^>]*>/i, m => m + safetyHead)
  else                                 out = '<head>' + safetyHead + '</head>' + out
  return URL.createObjectURL(new Blob([out], { type: 'text/html' }))
}

async function fetchJsonWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    const data = await response.json().catch(() => ({}))
    return { response, data }
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The AI request took too long. Please try again with a shorter prompt.')
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// ─── Circular progress ─────────────────────────────────────────────────────────
function CircularProgress({ pct = 0, size = 176, stroke = 8 }) {
  const r      = (size - stroke) / 2
  const circum = 2 * Math.PI * r
  const offset = circum * (1 - pct / 100)
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', display:'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke+4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(59,130,246,0.07)" strokeWidth={stroke} />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#cGrad)"
        strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circum}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="cGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Syntax-highlighted code viewer ───────────────────────────────────────────
function CodeViewer({ code }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const highlight = (raw) => {
    const escaped = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return escaped
      .replace(/(&lt;\/?)([\w-]+)/g, '<span style="color:#60a5fa">$1$2</span>')
      .replace(/(\s)([\w-]+)(=)/g, '$1<span style="color:#93c5fd">$2</span>$3')
      .replace(/(&lt;!--.*?--&gt;)/g, '<span style="color:#6b7280;font-style:italic">$1</span>')
  }
  const lines = code.split('\n')
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#08080f' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'#0c0c18', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:'6px' }}>
          {['#FF5F56','#FFBD2E','#27C93F'].map((c,i) => <div key={i} style={{ width:'11px', height:'11px', borderRadius:'50%', background:c }} />)}
        </div>
        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)', fontFamily:'monospace' }}>generated-website.html · {lines.length} lines</span>
        <button onClick={handleCopy} style={{ padding:'4px 12px', borderRadius:'6px', border:'1px solid rgba(255,255,255,0.09)', background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)', color: copied ? '#4ade80' : 'rgba(255,255,255,0.45)', fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>{copied ? '✓ Copied' : '⎘ Copy'}</button>
      </div>
      <div style={{ flex:1, display:'flex', overflow:'auto' }}>
        <div style={{ padding:'14px 0', background:'#0a0a15', borderRight:'1px solid rgba(255,255,255,0.04)', userSelect:'none', flexShrink:0, minWidth:'46px', textAlign:'right' }}>
          {lines.map((_,i) => <div key={i} style={{ padding:'0 12px', fontSize:'11.5px', lineHeight:'20px', color:'rgba(255,255,255,0.1)', fontFamily:"'Fira Code','Courier New',monospace" }}>{i+1}</div>)}
        </div>
        <div style={{ flex:1, padding:'14px 18px', fontFamily:"'Fira Code','Courier New',monospace", fontSize:'12.5px', lineHeight:'20px', color:'#c9d1d9', whiteSpace:'pre', overflowX:'auto' }}>
          {lines.map((line,i) => (
            <div key={i} dangerouslySetInnerHTML={{ __html: highlight(line) || '&nbsp;' }}
              style={{ minHeight:'20px', borderRadius:'2px', transition:'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.025)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Full-page preview overlay ─────────────────────────────────────────────────
function FullPreviewOverlay({ url, onClose }) {
  return (
    <motion.div
      initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.98 }}
      transition={{ duration:0.22, ease:[0.22,1,0.36,1] }}
      style={{ position:'fixed', inset:0, zIndex:9999, background:'#000', display:'flex', flexDirection:'column' }}
    >
      <div style={{ height:'44px', flexShrink:0, background:'rgba(8,8,14,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ display:'flex', gap:'5px' }}>
            {['#FF5F56','#FFBD2E','#27C93F'].map((c,i) => <div key={i} style={{ width:'10px', height:'10px', borderRadius:'50%', background:c }} />)}
          </div>
          <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'6px', padding:'4px 14px', fontSize:'11.5px', color:'rgba(255,255,255,0.28)', fontFamily:'monospace', minWidth:'260px', textAlign:'center' }}>generated-website.html</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)' }}>Press Esc to go back</span>
          <button onClick={onClose}
            style={{ width:'28px', height:'28px', borderRadius:'7px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(255,255,255,0.6)', fontSize:'17px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.15)'; e.currentTarget.style.color='#f87171'; e.currentTarget.style.borderColor='rgba(239,68,68,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.09)' }}
          >×</button>
        </div>
      </div>
      <iframe src={url} style={{ flex:1, width:'100%', border:'none', background:'white' }} title="Full Page Preview" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin" />
    </motion.div>
  )
}

// ─── 3D Orbital Scene Background ──────────────────────────────────────────────
function OrbitScene3D() {
  return (
    <>
      <style>{`
        @keyframes orb-spin-1  { from { transform: rotateX(72deg) rotateY(0deg);   } to { transform: rotateX(72deg) rotateY(360deg);  } }
        @keyframes orb-spin-2  { from { transform: rotateX(52deg) rotateY(120deg); } to { transform: rotateX(52deg) rotateY(480deg);  } }
        @keyframes orb-spin-3  { from { transform: rotateX(30deg) rotateY(240deg); } to { transform: rotateX(30deg) rotateY(600deg);  } }
        @keyframes orb-spin-4  { from { transform: rotateX(88deg) rotateY(60deg);  } to { transform: rotateX(88deg) rotateY(420deg);  } }
        @keyframes orb-spin-5  { from { transform: rotateX(15deg) rotateY(180deg); } to { transform: rotateX(15deg) rotateY(540deg);  } }

        @keyframes dot-travel  { from { transform: rotateY(0deg)   translateX(var(--r)) rotateY(0deg);   }
                                  to   { transform: rotateY(360deg) translateX(var(--r)) rotateY(-360deg); } }
        @keyframes dot-travel-r{ from { transform: rotateY(0deg)   translateX(var(--r)) rotateY(0deg);   }
                                  to   { transform: rotateY(-360deg) translateX(var(--r)) rotateY(360deg); } }

        @keyframes core-pulse  { 0%,100% { transform: scale(1);     opacity: 0.85; }
                                  50%     { transform: scale(1.18);  opacity: 1;    } }
        @keyframes halo-pulse  { 0%,100% { transform: scale(1);     opacity: 0.18; }
                                  50%     { transform: scale(1.3);   opacity: 0.32; } }
        @keyframes halo-pulse2 { 0%,100% { transform: scale(1);     opacity: 0.08; }
                                  50%     { transform: scale(1.5);   opacity: 0.15; } }

        @keyframes float-1 { 0%,100%{transform:translate(0,0) scale(1)}   50%{transform:translate(12px,-18px) scale(1.08)} }
        @keyframes float-2 { 0%,100%{transform:translate(0,0) scale(1)}   50%{transform:translate(-14px,10px) scale(0.94)} }
        @keyframes float-3 { 0%,100%{transform:translate(0,0) scale(1)}   50%{transform:translate(8px,16px)  scale(1.05)} }
        @keyframes float-4 { 0%,100%{transform:translate(0,0) scale(1)}   50%{transform:translate(-10px,-12px) scale(1.1)} }
        @keyframes float-5 { 0%,100%{transform:translate(0,0) scale(1)}   50%{transform:translate(18px,8px)  scale(0.92)} }

        @keyframes scanline  { 0%   { transform: translateY(-100%); opacity: 0; }
                               10%  { opacity: 1; }
                               90%  { opacity: 0.6; }
                               100% { transform: translateY(220%); opacity: 0; } }

        @keyframes grid-drift { from { background-position: 0 0; } to { background-position: 58px 58px; } }

        @keyframes star-twinkle { 0%,100%{opacity:0.15} 50%{opacity:0.8} }
        @keyframes atmo-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes atmo-spin-r { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
      `}</style>

      {/* Deep space background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(14,8,38,1) 0%, rgba(4,3,18,1) 45%, rgba(2,2,10,1) 100%)',
      }} />

      {/* Animated grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(99,60,220,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,60,220,0.06) 1px, transparent 1px)',
        backgroundSize: '58px 58px',
        animation: 'grid-drift 8s linear infinite',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 80%)',
      }} />

      {/* Atmospheric glow rings */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700, height: 700, borderRadius: '50%',
        background: 'conic-gradient(from 0deg, rgba(99,60,220,0.06), rgba(56,189,248,0.06), rgba(99,60,220,0.06))',
        animation: 'atmo-spin 30s linear infinite',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'conic-gradient(from 180deg, rgba(244,114,182,0.05), rgba(99,60,220,0.07), rgba(56,189,248,0.05))',
        animation: 'atmo-spin-r 22s linear infinite',
      }} />

      {/* Nebula dust blobs */}
      {[
        { top:'28%', left:'18%', w:260, h:180, c:'rgba(99,60,220,0.09)',  anim:'float-1', dur:'9s'  },
        { top:'55%', left:'65%', w:220, h:160, c:'rgba(56,189,248,0.07)', anim:'float-2', dur:'11s' },
        { top:'70%', left:'25%', w:190, h:140, c:'rgba(244,114,182,0.06)',anim:'float-3', dur:'14s' },
        { top:'20%', left:'60%', w:200, h:150, c:'rgba(52,211,153,0.06)', anim:'float-4', dur:'12s' },
        { top:'42%', left:'42%', w:320, h:240, c:'rgba(99,60,220,0.06)',  anim:'float-5', dur:'16s' },
      ].map((b, i) => (
        <div key={i} style={{
          position: 'absolute', top: b.top, left: b.left,
          width: b.w, height: b.h, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${b.c} 0%, transparent 70%)`,
          animation: `${b.anim} ${b.dur} ease-in-out infinite`,
          filter: 'blur(2px)',
        }} />
      ))}

      {/* Twinkling star field */}
      {Array.from({ length: 60 }).map((_, i) => {
        const left  = ((i * 37 + 11) % 97) + '%'
        const top   = ((i * 53 + 17) % 93) + '%'
        const size  = (i % 3 === 0) ? 2.5 : (i % 3 === 1) ? 1.5 : 1
        const delay = (i * 0.18) % 4
        const dur   = 2 + (i % 5) * 0.7
        const color = i % 4 === 0 ? '#a78bfa' : i % 4 === 1 ? '#67e8f9' : i % 4 === 2 ? '#f9a8d4' : '#fff'
        return (
          <div key={i} style={{
            position: 'absolute', left, top,
            width: size, height: size, borderRadius: '50%',
            background: color,
            animation: `star-twinkle ${dur}s ease-in-out ${delay}s infinite`,
            boxShadow: size > 2 ? `0 0 ${size * 3}px ${color}` : 'none',
          }} />
        )
      })}

      {/* 3D Orbital Scene */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 420, height: 420,
        perspective: '900px',
      }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>

          {/* Ring 1 — indigo */}
          <div style={{ position:'absolute', inset:'15%', borderRadius:'50%', border:'1.5px solid rgba(99,60,220,0.45)', boxShadow:'0 0 18px rgba(99,60,220,0.2), inset 0 0 18px rgba(99,60,220,0.1)', animation:'orb-spin-1 12s linear infinite', transformStyle:'preserve-3d' }}>
            <div style={{ position:'absolute', top:'50%', left:'50%', '--r':'50%', animation:'dot-travel 12s linear infinite', transformOrigin:'0 0' }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'radial-gradient(circle, #c4b5fd 0%, #818cf8 60%, transparent 100%)', boxShadow:'0 0 16px 4px rgba(129,140,248,0.9)', transform:'translate(-50%, -50%)' }} />
            </div>
          </div>

          {/* Ring 2 — cyan */}
          <div style={{ position:'absolute', inset:'5%', borderRadius:'50%', border:'1px solid rgba(56,189,248,0.32)', boxShadow:'0 0 14px rgba(56,189,248,0.15)', animation:'orb-spin-2 18s linear infinite', transformStyle:'preserve-3d' }}>
            <div style={{ position:'absolute', top:'50%', left:'50%', '--r':'47%', animation:'dot-travel-r 18s linear infinite', transformOrigin:'0 0' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'radial-gradient(circle, #bae6fd 0%, #38bdf8 60%, transparent 100%)', boxShadow:'0 0 14px 3px rgba(56,189,248,0.85)', transform:'translate(-50%, -50%)' }} />
            </div>
          </div>

          {/* Ring 3 — rose */}
          <div style={{ position:'absolute', inset:'25%', borderRadius:'50%', border:'1px solid rgba(244,114,182,0.3)', boxShadow:'0 0 12px rgba(244,114,182,0.12)', animation:'orb-spin-3 8s linear infinite', transformStyle:'preserve-3d' }}>
            <div style={{ position:'absolute', top:'50%', left:'50%', '--r':'38%', animation:'dot-travel 8s linear infinite', transformOrigin:'0 0' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'radial-gradient(circle, #fce7f3 0%, #f472b6 60%, transparent 100%)', boxShadow:'0 0 12px 3px rgba(244,114,182,0.85)', transform:'translate(-50%, -50%)' }} />
            </div>
          </div>

          {/* Ring 4 — emerald */}
          <div style={{ position:'absolute', inset:'-2%', borderRadius:'50%', border:'0.8px solid rgba(52,211,153,0.22)', animation:'orb-spin-4 28s linear infinite', transformStyle:'preserve-3d' }}>
            <div style={{ position:'absolute', top:'50%', left:'50%', '--r':'52%', animation:'dot-travel-r 28s linear infinite', transformOrigin:'0 0' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'radial-gradient(circle, #a7f3d0 0%, #34d399 60%, transparent 100%)', boxShadow:'0 0 10px 2px rgba(52,211,153,0.8)', transform:'translate(-50%, -50%)' }} />
            </div>
          </div>

          {/* Ring 5 — amber */}
          <div style={{ position:'absolute', inset:'32%', borderRadius:'50%', border:'0.8px solid rgba(251,191,36,0.25)', animation:'orb-spin-5 10s linear infinite', transformStyle:'preserve-3d' }}>
            <div style={{ position:'absolute', top:'50%', left:'50%', '--r':'35%', animation:'dot-travel 10s linear infinite', transformOrigin:'0 0' }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'radial-gradient(circle, #fef9c3 0%, #fbbf24 60%, transparent 100%)', boxShadow:'0 0 10px 2px rgba(251,191,36,0.8)', transform:'translate(-50%, -50%)' }} />
            </div>
          </div>

          {/* Central core */}
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:130, height:130, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,60,220,0.15) 0%, transparent 70%)', animation:'halo-pulse2 4s ease-in-out infinite' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:90, height:90, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,60,220,0.3) 0%, rgba(56,189,248,0.15) 50%, transparent 70%)', animation:'halo-pulse 3s ease-in-out infinite' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:56, height:56, borderRadius:'50%', border:'1.5px solid rgba(167,139,250,0.6)', boxShadow:'0 0 24px rgba(129,140,248,0.5), inset 0 0 16px rgba(129,140,248,0.25)' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:42, height:42, borderRadius:'50%', background:'radial-gradient(circle at 35% 35%, #c4b5fd 0%, #818cf8 40%, #4f46e5 80%)', boxShadow:'0 0 32px 8px rgba(129,140,248,0.7), 0 0 60px 16px rgba(99,60,220,0.35)', animation:'core-pulse 3s ease-in-out infinite' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:14, height:14, borderRadius:'50%', background:'radial-gradient(circle, #fff 0%, rgba(196,181,253,0.9) 60%, transparent 100%)', boxShadow:'0 0 16px 4px rgba(255,255,255,0.6)', animation:'core-pulse 3s ease-in-out infinite 0.4s' }} />
        </div>
      </div>

      {/* Scan-line shimmer */}
      <div style={{ position:'absolute', left:0, right:0, height:'18%', background:'linear-gradient(to bottom, transparent, rgba(99,60,220,0.04), transparent)', animation:'scanline 7s ease-in-out infinite', pointerEvents:'none' }} />

      {/* Left edge vignette */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(7,7,10,0.6) 0%, transparent 22%)', pointerEvents:'none' }} />

      {/* Bottom fade */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(6,6,8,0.55) 0%, transparent 28%)', pointerEvents:'none' }} />
    </>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Generate() {
  const { userData } = useSelector(s => s.user)
  const navigate     = useNavigate()
  const dispatch = useDispatch()
  const [prompt,            setPrompt]            = useState('')
  const [isEnhanced,        setIsEnhanced]        = useState(false)
  const [enhancing,         setEnhancing]         = useState(false)
  const [selectedStyle,     setSelectedStyle]     = useState('dark')
  const [selectedSections,  setSelectedSections]  = useState(['hero', 'features', 'pricing', 'faq', 'footer'])
  const [charCount,         setCharCount]         = useState(0)
  const [activePalette,     setActivePalette]     = useState(null)

  const [generating,     setGenerating]     = useState(false)
  const [generatingStep, setGeneratingStep] = useState(0)
  const [generated,      setGenerated]      = useState(false)
  const [generatedCode,  setGeneratedCode]  = useState('')
  const [previewUrl,     setPreviewUrl]     = useState(null)
  const [error,          setError]          = useState('')

  const [activeTab,       setActiveTab]       = useState('preview')
  const [showFullPreview, setShowFullPreview] = useState(false)

  const [elapsedMs,   setElapsedMs]   = useState(0)
  const [estimatedMs, setEstimatedMs] = useState(DEFAULT_EST_MS)
  const [tipIndex,    setTipIndex]    = useState(0)

  const textareaRef  = useRef(null)
  const countdownRef = useRef(null)
  const stepTimeouts = useRef([])
  const startTimeRef = useRef(null)
  const tipTimerRef  = useRef(null)
  const prevBlobUrl  = useRef(null)

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') setShowFullPreview(false) }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  useEffect(() => { if (!userData) navigate('/login') }, [userData])

  useEffect(() => {
    const p = sessionStorage.getItem('pendingPrompt')
    if (p) { setPrompt(p); sessionStorage.removeItem('pendingPrompt') }
  }, [])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
    setCharCount(prompt.length)
  }, [prompt])

  useEffect(() => () => {
    clearInterval(countdownRef.current)
    stepTimeouts.current.forEach(clearTimeout)
    clearInterval(tipTimerRef.current)
    if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current)
  }, [])

  const handleStyleSelect = (id) => { setSelectedStyle(id); setActivePalette(id === 'random' ? getRandomPalette() : null) }
  const rerollPalette = (e) => { e.stopPropagation(); setActivePalette(getRandomPalette()) }
  const toggleSection = (id) => setSelectedSections(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id])

  const startTimers = useCallback((totalMs) => {
    setEstimatedMs(totalMs); startTimeRef.current = Date.now(); setElapsedMs(0)
    clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => setElapsedMs(Date.now() - startTimeRef.current), 150)
    stepTimeouts.current.forEach(clearTimeout); stepTimeouts.current = []
    let cum = 0
    STEP_WEIGHTS.slice(0,-1).forEach((w,i) => { cum += w*totalMs; stepTimeouts.current.push(setTimeout(() => setGeneratingStep(i+1), cum)) })
    clearInterval(tipTimerRef.current)
    tipTimerRef.current = setInterval(() => setTipIndex(p => (p+1) % TIPS.length), 6000)
  }, [])

  const stopTimers = useCallback(() => {
    clearInterval(countdownRef.current); stepTimeouts.current.forEach(clearTimeout); clearInterval(tipTimerRef.current)
    updateStoredAvg(Date.now() - (startTimeRef.current || Date.now()))
  }, [])

  const updatePromptDraft = (value) => {
    setPrompt(value.slice(0, PROMPT_CHAR_LIMIT))
    setIsEnhanced(false)
  }

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || enhancing) return
    setEnhancing(true)
    setError('')
    try {
      const { response, data } = await fetchJsonWithTimeout(`${serverUrl}/api/website/enhance-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: prompt.trim() }),
      }, 75000)
      if (!response.ok || !data.success) throw new Error(data.message || 'Enhancement failed')
      setPrompt(data.enhancedPrompt.slice(0, PROMPT_CHAR_LIMIT))
      setIsEnhanced(true)
    } catch (err) {
      setError(err.message || 'Failed to enhance prompt. Try again.')
    } finally {
      setEnhancing(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return
    setGenerating(true); setGenerated(false); setError(''); setGeneratingStep(0); setElapsedMs(0)
    setTipIndex(Math.floor(Math.random() * TIPS.length)); setShowFullPreview(false)
    if (prevBlobUrl.current) { URL.revokeObjectURL(prevBlobUrl.current); prevBlobUrl.current = null }
    setPreviewUrl(null)
    startTimers(getStoredAvg())
    try {
      let styleNote = selectedStyle, paletteNote = ''
      if (selectedStyle === 'random' && activePalette) {
        styleNote   = 'colorful with custom palette'
        paletteNote = ` Use this exact palette — primary: ${activePalette.primary}, accent: ${activePalette.accent}, background: ${activePalette.bg}. Name: "${activePalette.name}".`
      }
      const enrichedPrompt = `${prompt.trim()}. Visual style: ${styleNote}.${paletteNote} Include sections: ${selectedSections.join(', ')}.`
      const { response: res, data } = await fetchJsonWithTimeout(`${serverUrl}/api/website/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: enrichedPrompt }),
      }, 240000)
      if (!res.ok || !data.success) throw new Error(data.message || 'Generation failed')
      setGeneratedCode(data.code)
      setGeneratingStep(GEN_STEPS.length)
      const blobUrl = createSafeBlobUrl(data.code)
      prevBlobUrl.current = blobUrl
      setPreviewUrl(blobUrl)
      setGenerated(true)
      setActiveTab('preview')

      try {
        const result = await axios.get(`${serverUrl}/api/user/current`, { withCredentials: true })
        if (result.data.user) dispatch(setUserData(result.data.user))
      } catch {}

      if (data.websiteId) {
        setTimeout(() => navigate(`/editor?id=${data.websiteId}`), 2000)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      stopTimers()
      setGenerating(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate() }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([generatedCode], { type: 'text/html' }))
    a.download = 'genweb-site.html'; a.click()
  }

  const realPct       = Math.min(99, Math.round((elapsedMs / estimatedMs) * 100))
  const remainingSecs = Math.max(0, (estimatedMs - elapsedMs) / 1000)
  const canGenerate   = prompt.trim().length > 0 && !generating && !enhancing

  const LBL = {
    fontSize: '10.5px', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
    letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '10px',
  }

  return (
    <div style={{ minHeight:'100vh', background:'#060608', color:'#f0f0f0', fontFamily:"'Inter',sans-serif", display:'flex', flexDirection:'column' }}>

      <AnimatePresence>
        {showFullPreview && previewUrl && (
          <FullPreviewOverlay url={previewUrl} onClose={() => setShowFullPreview(false)} />
        )}
      </AnimatePresence>

      {/* NAV */}
      <motion.nav initial={{ y:-16, opacity:0 }} animate={{ y:0, opacity:1 }}
        style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:'56px', background:'rgba(6,6,8,0.94)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:'16px', width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)' }}
          >←</button>
          <span style={{ fontSize:'14px', fontWeight:600, color:'white' }}>New Website</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 12px', borderRadius:'20px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.18)' }}>
            <span style={{ fontSize:'12px' }}>⚡</span>
            <span style={{ fontSize:'12px', fontWeight:600, color:'#60a5fa' }}>{userData?.credits ?? 0} credits</span>
          </div>
          <AnimatePresence>
            {generated && !generating && (
              <motion.div initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:10 }} style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <button onClick={handleDownload}
                  style={{ padding:'6px 14px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', fontWeight:600, fontSize:'12px', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color='white'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.7)'}
                >↓ Download</button>
                <button onClick={() => navigate('/dashboard')}
                  style={{ padding:'6px 16px', borderRadius:'8px', background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', border:'none', color:'white', fontWeight:600, fontSize:'12px', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 0 20px rgba(59,130,246,0.25)' }}
                >Save to Dashboard</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* BODY */}
      <div style={{ display:'flex', height:'100vh', paddingTop:'56px', position:'relative', zIndex:10, overflow:'hidden' }}>

        {/* SIDEBAR */}
        <aside style={{ width:'368px', minWidth:'368px', height:'100%', overflowY:'auto', overflowX:'hidden', borderRight:'1px solid rgba(255,255,255,0.06)', background:'rgba(7,7,10,0.93)', display:'flex', flexDirection:'column', flexShrink:0, scrollbarWidth:'none' }}>
          <style>{`aside::-webkit-scrollbar{display:none}`}</style>
          <div style={{ padding:'20px 18px', display:'flex', flexDirection:'column', gap:'20px', flex:1 }}>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'10px', padding:'11px 13px', fontSize:'12.5px', color:'#f87171', display:'flex', gap:'8px' }}>
                  <span>⚠️</span>
                  <div>
                    <p style={{ margin:0, fontWeight:600 }}>Error</p>
                    <p style={{ margin:'3px 0 0', opacity:0.75, fontSize:'12px' }}>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PROMPT */}
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'9px' }}>
                <label style={LBL}>Describe your website</label>
                <span style={{ fontSize:'11px', color: charCount > (PROMPT_CHAR_LIMIT - 100) ? '#f87171' : 'rgba(255,255,255,0.2)' }}>
                  {charCount}/{PROMPT_CHAR_LIMIT}
                </span>
              </div>

              <AnimatePresence>
                {isEnhanced && (
                  <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px', padding:'5px 10px', borderRadius:'8px', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.25)' }}>
                    <span style={{ fontSize:'11px' }}>✨</span>
                    <span style={{ fontSize:'11px', color:'#34d399', fontWeight:600 }}>Prompt enhanced by AI</span>
                    <button onClick={() => setIsEnhanced(false)} style={{ marginLeft:'auto', fontSize:'10px', color:'rgba(52,211,153,0.6)', background:'none', border:'none', cursor:'pointer', padding:'0 2px' }}>reset</button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${prompt ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'12px', padding:'12px', transition:'border-color 0.2s, box-shadow 0.2s', boxShadow: prompt ? '0 0 0 3px rgba(59,130,246,0.06)' : 'none' }}>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={e => updatePromptDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. A dark SaaS landing page with animated hero, glassmorphism cards, FAQ accordion, and 3-tier pricing…"
                  style={{ width:'100%', background:'transparent', border:'none', outline:'none', color:'white', fontSize:'13px', lineHeight:1.65, resize:'none', minHeight:'88px', maxHeight:'180px', fontFamily:'inherit', boxSizing:'border-box' }}
                />
                <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'8px', marginTop:'7px' }}>
                  <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.2)', margin:'0 0 5px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Try an example</p>
                  {EXAMPLES.slice(0,3).map((ex,i) => (
                    <button key={i} onClick={() => updatePromptDraft(ex)}
                      style={{ display:'block', width:'100%', background:'none', border:'none', textAlign:'left', cursor:'pointer', color:'rgba(255,255,255,0.28)', fontSize:'11.5px', lineHeight:1.5, padding:'3px 5px', borderRadius:'5px', fontFamily:'inherit', transition:'all 0.15s', marginBottom:'2px' }}
                      onMouseEnter={e => { e.currentTarget.style.color='#60a5fa'; e.currentTarget.style.background='rgba(59,130,246,0.06)' }}
                      onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.28)'; e.currentTarget.style.background='none' }}
                    >→ {ex.length > 58 ? ex.slice(0,58)+'…' : ex}</button>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={handleEnhancePrompt}
                disabled={!prompt.trim() || enhancing || generating}
                whileHover={prompt.trim() && !enhancing && !generating ? { scale:1.02 } : {}}
                whileTap={prompt.trim() && !enhancing && !generating ? { scale:0.97 } : {}}
                style={{ width:'100%', marginTop:'10px', padding:'11px', borderRadius:'10px', border:'1px solid rgba(139,92,246,0.35)', background: prompt.trim() && !enhancing && !generating ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)', color: prompt.trim() && !enhancing && !generating ? '#a78bfa' : 'rgba(255,255,255,0.2)', fontWeight:600, fontSize:'13px', fontFamily:'inherit', cursor: prompt.trim() && !enhancing && !generating ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.2s' }}>
                {enhancing ? (
                  <><motion.span animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }} style={{ display:'inline-block' }}>⟳</motion.span> Enhancing your prompt…</>
                ) : (
                  <>✨ Enhance Prompt with AI <span style={{ fontSize:'10px', opacity:0.5, marginLeft:2 }}>(optional)</span></>
                )}
              </motion.button>
            </div>

            {/* STYLE */}
            <div>
              <label style={LBL}>Visual Style</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                {STYLE_PRESETS.map(s => (
                  <motion.button key={s.id} onClick={() => handleStyleSelect(s.id)} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                    style={{ padding:'9px 11px', borderRadius:'9px', cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'all 0.15s', border:`1px solid ${selectedStyle===s.id ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.06)'}`, background: selectedStyle===s.id ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.015)' }}>
                    <div style={{ fontSize:'14px', marginBottom:'3px', color: selectedStyle===s.id ? '#60a5fa' : 'rgba(255,255,255,0.35)' }}>{s.icon}</div>
                    <div style={{ fontSize:'11.5px', fontWeight:600, color: selectedStyle===s.id ? 'white' : 'rgba(255,255,255,0.5)', marginBottom:'1px' }}>{s.label}</div>
                    <div style={{ fontSize:'10.5px', color:'rgba(255,255,255,0.2)' }}>{s.id==='random' && activePalette ? activePalette.name : s.desc}</div>
                  </motion.button>
                ))}
              </div>
              <AnimatePresence>
                {selectedStyle === 'random' && activePalette && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ overflow:'hidden', marginTop:'7px' }}>
                    <div style={{ borderRadius:'9px', border:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.015)', padding:'9px 11px', display:'flex', alignItems:'center', gap:'9px' }}>
                      <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
                        {[activePalette.primary, activePalette.accent, activePalette.bg].map((c,i) => <div key={i} style={{ width:'15px', height:'15px', borderRadius:'50%', background:c, border:'1px solid rgba(255,255,255,0.1)' }} />)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'11.5px', fontWeight:600, color:'white' }}>{activePalette.name}</div>
                        <div style={{ fontSize:'10.5px', color:'rgba(255,255,255,0.25)' }}>{activePalette.desc}</div>
                      </div>
                      <button onClick={rerollPalette} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'5px', padding:'3px 7px', color:'rgba(255,255,255,0.4)', fontSize:'12px', cursor:'pointer' }}>🔀</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SECTIONS */}
            <div>
              <label style={LBL}>Include Sections</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {SECTIONS.map(s => (
                  <motion.button key={s.id} onClick={() => toggleSection(s.id)} whileTap={{ scale:0.95 }}
                    style={{ padding:'5px 11px', borderRadius:'20px', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', fontSize:'11.5px', fontWeight:500, border:`1px solid ${selectedSections.includes(s.id) ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.07)'}`, background: selectedSections.includes(s.id) ? 'rgba(59,130,246,0.09)' : 'transparent', color: selectedSections.includes(s.id) ? '#60a5fa' : 'rgba(255,255,255,0.35)' }}
                  >{selectedSections.includes(s.id) ? '✓ ' : ''}{s.label}</motion.button>
                ))}
              </div>
            </div>

            <div style={{ flex:1 }} />

            {/* GENERATE BUTTON */}
            <div>
              <div style={{ fontSize:'10.5px', color:'rgba(255,255,255,0.18)', textAlign:'center', marginBottom:'9px' }}>
                50 credits per generation · {userData?.credits ?? 0} remaining
              </div>
              <motion.button
                onClick={handleGenerate}
                disabled={!canGenerate}
                whileHover={canGenerate ? { scale:1.02 } : {}}
                whileTap={canGenerate ? { scale:0.97 } : {}}
                style={{ width:'100%', padding:'13px', borderRadius:'11px', border:'none', background: canGenerate ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'rgba(255,255,255,0.04)', color: canGenerate ? 'white' : 'rgba(255,255,255,0.18)', fontWeight:700, fontSize:'14px', fontFamily:'inherit', cursor: canGenerate ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.2s', boxShadow: canGenerate ? '0 4px 22px rgba(59,130,246,0.28)' : 'none' }}>
                {generating
                  ? <><motion.span animate={{ rotate:360 }} transition={{ duration:1.2, repeat:Infinity, ease:'linear' }} style={{ display:'inline-block' }}>⟳</motion.span> {GEN_STEPS[Math.min(generatingStep, GEN_STEPS.length-1)]}</>
                  : <>🚀 Generate Website</>
                }
              </motion.button>
              {!prompt.trim() && (
                <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.15)', textAlign:'center', marginTop:'6px' }}>
                  Describe your website above to get started
                </p>
              )}
            </div>

          </div>
        </aside>

        {/* RIGHT PANEL */}
        <div style={{ flex:1, height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, position:'relative' }}>

          {/* ── ORBIT SCENE BACKGROUND ── */}
          <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden', background:'#02020e' }}>
            <OrbitScene3D />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(7,7,10,0.55) 0%, transparent 18%)' }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(6,6,8,0.5) 0%, transparent 30%)' }} />
          </div>

          {/* Tab bar */}
          {generated && !generating && (
            <div style={{ position:'relative', zIndex:2, height:'46px', flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', padding:'0 14px', gap:'4px', background:'rgba(8,8,12,0.88)', backdropFilter:'blur(12px)' }}>
              {['preview','code'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding:'5px 13px', borderRadius:'7px', border:'none', cursor:'pointer', background: activeTab===tab ? 'rgba(59,130,246,0.12)' : 'transparent', color: activeTab===tab ? '#60a5fa' : 'rgba(255,255,255,0.35)', fontSize:'12.5px', fontWeight:500, fontFamily:'inherit', transition:'all 0.15s' }}>
                  {tab==='preview' ? '🖥 Preview' : '‹/› Code'}
                </button>
              ))}
              {activeTab === 'preview' && (
                <button onClick={() => setShowFullPreview(true)}
                  style={{ marginLeft:'6px', padding:'5px 12px', borderRadius:'7px', border:'1px solid rgba(59,130,246,0.25)', background:'rgba(59,130,246,0.07)', color:'#60a5fa', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', display:'flex', alignItems:'center', gap:'5px' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(59,130,246,0.14)'; e.currentTarget.style.borderColor='rgba(59,130,246,0.45)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(59,130,246,0.07)'; e.currentTarget.style.borderColor='rgba(59,130,246,0.25)' }}
                >⛶ Full Page</button>
              )}
            </div>
          )}

          {/* Content area */}
          <div style={{ flex:1, position:'relative', zIndex:1, display:'flex', alignItems: !generating && !generated ? 'center' : 'stretch', justifyContent: !generating && !generated ? 'center' : 'stretch', overflow:'hidden' }}>

            {/* IDLE state */}
            {!generating && !generated && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', maxWidth:'420px', padding:'24px' }}>
                <div style={{ width:'88px', height:'88px', borderRadius:'28px', background:'linear-gradient(135deg,rgba(99,60,220,0.18),rgba(59,130,246,0.12))', border:'1px solid rgba(139,92,246,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px', fontSize:'36px', boxShadow:'0 0 80px rgba(99,60,220,0.2), 0 0 40px rgba(59,130,246,0.1)' }}>✨</div>
                <h2 style={{ fontSize:'24px', fontWeight:800, color:'white', margin:'0 0 12px', letterSpacing:'-0.03em', textShadow:'0 0 40px rgba(139,92,246,0.4)' }}>Your website will appear here</h2>
                <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.38)', lineHeight:1.75, margin:'0 0 28px' }}>
                  Describe your idea in the sidebar and hit <strong style={{ color:'#60a5fa' }}>Generate</strong>.<br/>
                  Use <strong style={{ color:'#a78bfa' }}>Enhance</strong> first for better results — it's optional.
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'7px', justifyContent:'center' }}>
                  {['✨ AI Prompt Enhancer','⚡ Top-tier AI models','📱 Mobile responsive','🎨 Premium design','💾 Export ready'].map((f,i) => (
                    <div key={i} style={{ padding:'6px 14px', borderRadius:'20px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', fontSize:'11.5px', color:'rgba(255,255,255,0.38)', backdropFilter:'blur(8px)' }}>{f}</div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* GENERATING state */}
            {generating && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center', maxWidth:'400px', width:'100%', margin:'auto', padding:'24px' }}>
                <div style={{ position:'relative', width:'176px', margin:'0 auto 26px', userSelect:'none' }}>
                  <CircularProgress pct={realPct} size={176} stroke={8} />
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'3px' }}>
                    <span style={{ fontSize:'36px', fontWeight:800, color:'white', letterSpacing:'-0.04em', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{realPct}%</span>
                    <span style={{ fontSize:'11px', fontWeight:500, color: remainingSecs < 5 ? '#4ade80' : '#60a5fa', transition:'color 1s' }}>
                      {remainingSecs > 1 ? `~${formatTime(remainingSecs)} left` : 'almost done…'}
                    </span>
                  </div>
                </div>
                <h3 style={{ fontSize:'17px', fontWeight:700, color:'white', margin:'0 0 4px', letterSpacing:'-0.02em' }}>Building your website</h3>
                <p style={{ fontSize:'12.5px', color:'rgba(255,255,255,0.38)', margin:'0 0 20px' }}>{GEN_STEPS[Math.min(generatingStep, GEN_STEPS.length-1)]}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'5px', marginBottom:'18px' }}>
                  {GEN_STEPS.map((step,i) => {
                    const done=i<generatingStep, active=i===generatingStep
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'9px', padding:'7px 11px', borderRadius:'8px', background: done ? 'rgba(59,130,246,0.07)' : active ? 'rgba(59,130,246,0.04)' : 'rgba(255,255,255,0.015)', border:`1px solid ${done ? 'rgba(59,130,246,0.18)' : active ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)'}`, opacity: done ? 1 : active ? 0.9 : 0.22, transition:'all 0.4s' }}>
                        <div style={{ width:'18px', height:'18px', borderRadius:'50%', flexShrink:0, background: done ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', color:'white', transition:'all 0.4s' }}>
                          {done ? '✓' : active ? <motion.span animate={{ opacity:[1,0.2,1] }} transition={{ duration:1, repeat:Infinity }}>·</motion.span> : <span style={{ color:'rgba(255,255,255,0.3)' }}>{i+1}</span>}
                        </div>
                        <span style={{ fontSize:'12px', flex:1, textAlign:'left', color: done ? 'rgba(255,255,255,0.6)' : active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)', transition:'color 0.4s' }}>{step}</span>
                        {done && <span style={{ fontSize:'10px', color:'#3b82f6' }}>✓</span>}
                      </div>
                    )
                  })}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={tipIndex} initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-5 }} transition={{ duration:0.35 }}
                    style={{ padding:'11px 14px', borderRadius:'9px', background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.1)', fontSize:'11.5px', color:'rgba(255,255,255,0.35)', lineHeight:1.6, textAlign:'left' }}>
                    {TIPS[tipIndex]}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}

            {/* GENERATED state */}
            {generated && !generating && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column' }}>
                {activeTab === 'preview' ? (
                  <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
                    <iframe key={previewUrl} src={previewUrl} style={{ width:'100%', height:'100%', border:'none', background:'white' }} title="Generated Website Preview" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin" />
                    <div onClick={() => setShowFullPreview(true)}
                      style={{ position:'absolute', inset:0, display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom:'22px', background:'linear-gradient(to top, rgba(5,5,10,0.55) 0%, transparent 35%)', cursor:'pointer', zIndex:2, opacity:0, transition:'opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity='1'}
                      onMouseLeave={e => e.currentTarget.style.opacity='0'}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 18px', borderRadius:'99px', background:'rgba(8,8,16,0.92)', border:'1px solid rgba(59,130,246,0.4)', backdropFilter:'blur(14px)', color:'#60a5fa', fontSize:'12.5px', fontWeight:600, boxShadow:'0 4px 20px rgba(59,130,246,0.2)' }}>
                        ⛶ Click to open full-page preview
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex:1, overflow:'hidden' }}>
                    <CodeViewer code={generatedCode} />
                  </div>
                )}
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}