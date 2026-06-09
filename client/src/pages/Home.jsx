import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { Coins, LogOut, X, Menu, Zap, Globe, Code2, Sparkles, ArrowRight, ChevronRight } from "lucide-react"

/* ── Animated gradient orb background ── */
function OrbBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Top-left violet orb */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '60vw', height: '60vw', maxWidth: 700, maxHeight: 700,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0.08) 50%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'orbFloat1 12s ease-in-out infinite',
      }} />
      {/* Bottom-right cyan orb */}
      <div style={{
        position: 'absolute', bottom: '-15%', right: '-5%',
        width: '50vw', height: '50vw', maxWidth: 600, maxHeight: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, rgba(59,130,246,0.06) 50%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'orbFloat2 15s ease-in-out infinite',
      }} />
      {/* Center subtle pink orb */}
      <div style={{
        position: 'absolute', top: '40%', left: '30%',
        width: '40vw', height: '40vw', maxWidth: 500, maxHeight: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,114,182,0.06) 0%, transparent 60%)',
        filter: 'blur(60px)',
        animation: 'orbFloat3 18s ease-in-out infinite',
      }} />
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
      <style>{`
        @keyframes orbFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(3%,5%) scale(1.05)} 66%{transform:translate(-2%,3%) scale(0.97)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-4%,-3%) scale(1.08)} 70%{transform:translate(2%,-5%) scale(0.95)} }
        @keyframes orbFloat3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(3%,-4%)} }
      `}</style>
    </div>
  )
}

/* ── Floating badge ── */
function Badge({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 999,
        background: 'rgba(139,92,246,0.12)',
        border: '1px solid rgba(139,92,246,0.3)',
        fontSize: 12, fontWeight: 600, color: '#a78bfa',
        letterSpacing: '0.05em', textTransform: 'uppercase',
        marginBottom: 24,
        backdropFilter: 'blur(8px)',
      }}
    >
      <Sparkles size={12} />
      {children}
    </motion.div>
  )
}

/* ── Feature card ── */
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, borderColor: `${color}60` }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20, padding: '28px 24px',
        transition: 'all 0.3s ease',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <Icon size={22} color={color} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.7 }}>
        {desc}
      </p>
    </motion.div>
  )
}

/* ── Stat item ── */
function Stat({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
        color: '#fff', letterSpacing: '-0.04em', lineHeight: 1,
        background: 'linear-gradient(135deg, #a78bfa, #38bdf8)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>{value}</div>
      <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { userData } = useSelector(state => state.user)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3002/api/auth/logout', { credentials: 'include' })
      dispatch(setUserData(null))
      navigate('/')
    } catch (err) { console.log(err) }
  }

  const features = [
    { icon: Sparkles, title: 'AI-Generated Code', color: '#a78bfa', delay: 0, desc: 'Production-ready HTML, CSS and JS generated in seconds. Clean, semantic, and fully functional.' },
    { icon: Globe, title: 'Fully Responsive', color: '#38bdf8', delay: 0.1, desc: 'Every website is mobile-first and adapts perfectly to any screen size out of the box.' },
    { icon: Code2, title: 'Export Ready', color: '#34d399', delay: 0.2, desc: 'Download the complete HTML file and host it anywhere — Netlify, Vercel, or your own server.' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#040408',
      color: 'white',
      fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
      overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #040408; } ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 3px; }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(1.6);opacity:0} }
      `}</style>

      <OrbBackground />

      {/* ── NAV ── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          height: 64,
          background: scrolled ? 'rgba(4,4,8,0.95)' : 'rgba(4,4,8,0.6)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 clamp(16px,4vw,48px)',
          transition: 'all 0.3s ease',
          boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        {/* Logo */}
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, boxShadow: '0 0 20px rgba(139,92,246,0.4)',
          }}>✦</div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            GenWeb<span style={{ color: '#8b5cf6' }}>.ai</span>
          </span>
        </div>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
          <Link to="/pricing" style={{
            fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none', padding: '6px 14px', borderRadius: 8,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >Pricing</Link>

          {userData && (
            <div onClick={() => navigate('/pricing')} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 20,
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,191,36,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(251,191,36,0.08)'}
            >
              <Zap size={13} color="#fbbf24" fill="#fbbf24" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>{userData?.credits ?? 0}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>credits</span>
            </div>
          )}

          {userData ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setDropdownOpen(p => !p)}
                style={{
                  width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                  border: dropdownOpen ? '2px solid rgba(139,92,246,0.7)' : '2px solid transparent',
                  padding: 0, background: 'none', overflow: 'hidden',
                  transition: 'border-color 0.2s',
                  boxShadow: dropdownOpen ? '0 0 16px rgba(139,92,246,0.4)' : 'none',
                }}
              >
                {userData.avatar
                  ? <img src={userData.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                      {userData.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                }
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', top: 46, right: 0,
                      width: 230,
                      background: 'rgba(8,8,16,0.98)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16,
                      boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
                      backdropFilter: 'blur(24px)',
                      overflow: 'hidden', zIndex: 300,
                    }}
                  >
                    {/* User info */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      {userData.avatar
                        ? <img src={userData.avatar} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(139,92,246,0.4)' }} />
                        : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                            {userData.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                      }
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userData.name || 'User'}</p>
                        <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userData.email}</p>
                      </div>
                    </div>

                    {[
                      { icon: '⚡', label: 'Dashboard', action: () => { navigate('/dashboard'); setDropdownOpen(false) } },
                      { icon: '💎', label: 'Upgrade Plan', action: () => { navigate('/pricing'); setDropdownOpen(false) } },
                    ].map((item, i) => (
                      <div key={i} onClick={item.action} style={{ padding: '11px 16px', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      ><span>{item.icon}</span>{item.label}</div>
                    ))}

                    <div onClick={handleLogout} style={{ padding: '11px 16px', cursor: 'pointer', fontSize: 13, color: '#f87171', display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    ><LogOut size={14} />Sign out</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              style={{
                padding: '8px 20px', borderRadius: 10,
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                border: 'none', color: '#fff',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 0 20px rgba(139,92,246,0.3)',
              }}
            >Get Started</motion.button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(p => !p)}
            style={{ display: 'none', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}
            className="hamburger-btn"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              position: 'fixed', top: 64, left: 0, right: 0, zIndex: 190,
              background: 'rgba(4,4,8,0.98)', backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {userData && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, marginBottom: 8 }}>
                  {userData.avatar
                    ? <img src={userData.avatar} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                    : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{userData.name?.charAt(0).toUpperCase()}</div>
                  }
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff' }}>{userData.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{userData.email}</p>
                  </div>
                </div>
              )}
              {userData && <div onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false) }} style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>⚡ Dashboard</div>}
              <div onClick={() => { navigate('/pricing'); setMobileMenuOpen(false) }} style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Pricing</div>
              {userData
                ? <div onClick={handleLogout} style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 14, color: '#f87171', marginTop: 4 }}>Sign out</div>
                : <button onClick={() => { navigate('/login'); setMobileMenuOpen(false) }} style={{ margin: '8px 0 0', padding: 12, borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Get Started</button>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', zIndex: 10,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(100px,15vw,140px) clamp(20px,5vw,60px) 80px',
        textAlign: 'center',
      }}>
        <Badge>AI-Powered Website Builder</Badge>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          style={{
            margin: '0 0 24px',
            fontSize: 'clamp(2.8rem, 8vw, 6rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            color: '#fff',
            maxWidth: 820,
          }}
        >
          Build Stunning Websites{' '}
          <span style={{
            background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 4s linear infinite',
          }}>with AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          style={{
            margin: '0 0 40px',
            fontSize: 'clamp(15px, 2.5vw, 18px)',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.75,
            maxWidth: 520,
          }}
        >
          Describe your idea in plain English. Your AI agent writes the code, crafts the design, and ships a production-ready website in seconds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 64 }}
        >
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(139,92,246,0.55)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => userData ? navigate('/dashboard') : navigate('/login')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: 'clamp(12px,2vw,16px) clamp(24px,3vw,36px)',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              border: 'none', color: '#fff',
              fontSize: 'clamp(14px,2vw,16px)', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 0 30px rgba(139,92,246,0.35)',
              transition: 'box-shadow 0.2s',
            }}
          >
            {userData ? 'Go to Dashboard' : 'Start Building Free'}
            <ArrowRight size={18} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/pricing')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: 'clamp(12px,2vw,16px) clamp(24px,3vw,36px)',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 'clamp(14px,2vw,16px)', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            View Pricing <ChevronRight size={16} />
          </motion.button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            display: 'flex', gap: 'clamp(32px,6vw,72px)', flexWrap: 'wrap', justifyContent: 'center',
            padding: '32px 40px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20,
            backdropFilter: 'blur(12px)',
          }}
        >
          <Stat value="10s" label="avg build time" />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
          <Stat value="100%" label="responsive" />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
          <Stat value="Free" label="to start" />
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ position: 'relative', zIndex: 10, padding: 'clamp(60px,10vw,100px) clamp(20px,5vw,60px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
              ✦ Features
            </div>
            <h2 style={{ margin: '0 0 14px', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
              Everything you need to ship
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
              From AI generation to export-ready code — no design or coding skills required.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 18 }}>
            {features.map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ position: 'relative', zIndex: 10, padding: 'clamp(40px,8vw,80px) clamp(20px,5vw,60px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              borderRadius: 28,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))',
              border: '1px solid rgba(139,92,246,0.25)',
              padding: 'clamp(40px,6vw,64px)',
              textAlign: 'center',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Glow */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(139,92,246,0.15), transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
              <h2 style={{ margin: '0 0 14px', fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                Ready to build your website?
              </h2>
              <p style={{ margin: '0 0 32px', fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                Join thousands of creators shipping stunning websites with AI. Start for free today.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(139,92,246,0.55)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => userData ? navigate('/dashboard') : navigate('/login')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '14px 36px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  border: 'none', color: '#fff',
                  fontSize: 16, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 0 30px rgba(139,92,246,0.35)',
                }}
              >
                {userData ? 'Go to Dashboard' : 'Get Started Free'}
                <ArrowRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position: 'relative', zIndex: 10,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: 'clamp(24px,4vw,36px) clamp(20px,5vw,60px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✦</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>GenWeb<span style={{ color: '#8b5cf6' }}>.ai</span></span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['Pricing', '/pricing'], ['Dashboard', '/dashboard']].map(([label, path]) => (
            <span key={label} onClick={() => navigate(path)} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 10px', borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >{label}</span>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>© 2026 GenWeb.ai</span>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav > *:not(.hamburger-btn) { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
