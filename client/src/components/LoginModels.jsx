import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { auth, provider } from "../firebase"
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import {  signInWithPopup } from "firebase/auth"
import { serverUrl } from '../App'

function AnimatedBackground() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, t = 0
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const nodes = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2.5 + 0.5,
      color: ['#8b5cf6','#6366f1','#3b82f6','#06b6d4','#a855f7'][Math.floor(Math.random()*5)],
      opacity: Math.random() * 0.6 + 0.2,
    }))
    const orbs = [
      { x: 0.15, y: 0.25, r: 320, color: 'rgba(139,92,246,0.12)', speed: 0.0008 },
      { x: 0.75, y: 0.65, r: 280, color: 'rgba(59,130,246,0.10)', speed: 0.0012 },
      { x: 0.45, y: 0.80, r: 200, color: 'rgba(168,85,247,0.08)', speed: 0.0006 },
      { x: 0.85, y: 0.15, r: 180, color: 'rgba(6,182,212,0.07)', speed: 0.001 },
    ]
    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#040408'); bg.addColorStop(0.5, '#06040f'); bg.addColorStop(1, '#040408')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
      ctx.save(); ctx.strokeStyle = 'rgba(139,92,246,0.04)'; ctx.lineWidth = 1
      const gridSize = 60, offset = (t * 20) % gridSize
      for (let x = -gridSize + offset; x < W + gridSize; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = -gridSize + offset; y < H + gridSize; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
      ctx.restore()
      orbs.forEach((orb, i) => {
        const ox = orb.x * W + Math.sin(t * orb.speed * 1000 + i) * 80
        const oy = orb.y * H + Math.cos(t * orb.speed * 800 + i) * 60
        const pulse = 1 + Math.sin(t * 0.8 + i) * 0.15
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r * pulse)
        grad.addColorStop(0, orb.color); grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath(); ctx.arc(ox, oy, orb.r * pulse, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill()
      })
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
        const pulse = 0.7 + Math.sin(t * 2 + n.x) * 0.3
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2)
        ctx.fillStyle = n.color; ctx.globalAlpha = n.opacity * pulse; ctx.fill(); ctx.globalAlpha = 1
      })
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(139,92,246,${(1 - dist/120) * 0.15})`; ctx.lineWidth = 0.8; ctx.stroke()
          }
        }
      }
      const cx = W * 0.15, cy = H * 0.5, ringR = 140
      ctx.save()
      for (let i = 0; i < 3; i++) {
        const angle = t * 0.5 + i * (Math.PI * 2 / 3)
        const scaleY = Math.abs(Math.sin(angle)) * 0.6 + 0.15
        ctx.beginPath(); ctx.ellipse(cx, cy, ringR - i*20, (ringR - i*20) * scaleY, t * 0.3 + i, 0, Math.PI * 2)
        const ringGrad = ctx.createLinearGradient(cx-ringR, cy, cx+ringR, cy)
        ringGrad.addColorStop(0, 'rgba(139,92,246,0)')
        ringGrad.addColorStop(0.5, `rgba(${i===0?'139,92,246':i===1?'99,102,241':'59,130,246'},0.5)`)
        ringGrad.addColorStop(1, 'rgba(139,92,246,0)')
        ctx.strokeStyle = ringGrad; ctx.lineWidth = 1.5; ctx.stroke()
      }
      const sphereGrad = ctx.createRadialGradient(cx-30, cy-30, 10, cx, cy, 80)
      sphereGrad.addColorStop(0, 'rgba(200,170,255,0.9)'); sphereGrad.addColorStop(0.3, 'rgba(139,92,246,0.7)')
      sphereGrad.addColorStop(0.7, 'rgba(67,20,180,0.5)'); sphereGrad.addColorStop(1, 'rgba(10,5,40,0)')
      ctx.beginPath(); ctx.arc(cx, cy, 80, 0, Math.PI * 2); ctx.fillStyle = sphereGrad; ctx.fill()
      for (let i = 0; i < 5; i++) {
        const a = t * 0.8 + (i/5)*Math.PI*2
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 110, cy + Math.sin(a) * 40, 3, 0, Math.PI*2)
        ctx.fillStyle = ['#a78bfa','#60a5fa','#34d399','#f472b6','#fbbf24'][i]
        ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1
      }
      ctx.restore()
      t += 0.008
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }} />
}

export default function Login() {
  const [isLogin, setIsLogin]         = useState(true)
  const [loading, setLoading]         = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [name, setName]               = useState('')
  const [error, setError]             = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [activeField, setActiveField] = useState(null)

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return }
    if (!isLogin && !name.trim()) { setError('Please enter your name.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    try {
      const response = await fetch(`${serverUrl}/api/auth/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() || email.split('@')[0], email: email.trim(), avatar: '', isLogin }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Auth failed')
      dispatch(setUserData(data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
  setError("")
  setGoogleLoading(true)

  try {
    

    const result = await signInWithPopup(auth, provider)

    

    const user = result.user

    const response = await fetch(`${serverUrl}/api/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        name: user.displayName,
        email: user.email,
        avatar: user.photoURL,
      }),
    })

    

    const data = await response.json()

    if (response.ok) {
      dispatch(setUserData(data.user))
      navigate("/dashboard")
    }

  } catch (err) {
    console.error("GOOGLE ERROR =", err)
    setError(err.message)
  } finally {
    setGoogleLoading(false)
  }
}

  const handleKey = (e) => { if (e.key === 'Enter') handleEmailAuth() }
  const switchMode = (m) => { setIsLogin(m); setError(''); setName(''); setEmail(''); setPassword('') }

  const inputStyle = (field) => ({
    width: '100%', padding: '14px 18px 14px 48px', borderRadius: 14,
    border: `1.5px solid ${activeField === field ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.07)'}`,
    background: activeField === field ? 'rgba(139,92,246,0.07)' : 'rgba(255,255,255,0.03)',
    color: 'white', fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'all 0.3s',
    boxShadow: activeField === field ? '0 0 0 4px rgba(139,92,246,0.12)' : 'none', letterSpacing: '0.01em',
  })

  return (
    <div style={{ minHeight:'100vh', background:'#040408', color:'white', display:'flex', position:'relative', overflow:'hidden', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #0a0515 inset !important; -webkit-text-fill-color: white !important; }
        .tab-pill { flex:1; padding:10px; border-radius:10px; border:none; background:transparent; color:rgba(255,255,255,0.35); font-size:13.5px; font-weight:600; cursor:pointer; transition:all 0.25s; font-family:inherit; }
        .tab-pill.active { background:linear-gradient(135deg,rgba(139,92,246,0.25),rgba(99,102,241,0.18)); color:#c084fc; border:1px solid rgba(139,92,246,0.35); box-shadow:0 0 24px rgba(139,92,246,0.12); }
        .tab-pill:hover:not(.active) { color:rgba(255,255,255,0.65); background:rgba(255,255,255,0.05); }
        .g-btn { width:100%; padding:14px 20px; border-radius:14px; background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.08); color:white; font-weight:600; font-size:14px; display:flex; align-items:center; justify-content:center; gap:10px; cursor:pointer; transition:all 0.3s; font-family:inherit; }
        .g-btn:hover:not(:disabled) { border-color:rgba(139,92,246,0.5); background:rgba(139,92,246,0.08); box-shadow:0 0 32px rgba(139,92,246,0.15); transform:translateY(-1px); }
        .g-btn:disabled { opacity:0.5; cursor:not-allowed; }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @media (max-width:860px) { .left-panel{display:none!important} .right-panel{width:100%!important} }
        @media (max-width:480px) { .form-card{padding:28px 20px!important; border-radius:20px!important} }
      `}</style>

      <AnimatedBackground />

      <div className="left-panel" style={{ width:'50%', position:'relative', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 40px' }}>
        <Link to="/" style={{ position:'absolute', top:32, left:40, textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:34, height:34, borderRadius:11, background:'linear-gradient(135deg,#8b5cf6,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, boxShadow:'0 0 24px rgba(139,92,246,0.5)' }}>✦</div>
          <span style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.02em', background:'linear-gradient(90deg,#fff,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>GenWeb.ai</span>
        </Link>
        <motion.div initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.8, delay:0.2 }} style={{ textAlign:'center', maxWidth:420 }}>
          <motion.div style={{ fontSize:72, marginBottom:16, display:'inline-block' }} animate={{ y:[0,-12,0] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}>✦</motion.div>
          <h1 style={{ fontSize:'clamp(2rem,3.5vw,2.8rem)', fontWeight:800, margin:'0 0 16px', letterSpacing:'-0.04em', lineHeight:1.1, background:'linear-gradient(135deg,#fff 0%,#a78bfa 40%,#60a5fa 80%)', backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', animation:'shimmer 5s linear infinite' }}>
            Build Stunning<br/>Websites with AI
          </h1>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.38)', lineHeight:1.75, margin:'0 0 36px' }}>Describe your vision in plain English. Our AI crafts a production-ready website in seconds — no code needed.</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center' }}>
            {[{ icon:'⚡', text:'10 second builds', color:'#a78bfa' }, { icon:'🎨', text:'AI-crafted design', color:'#60a5fa' }, { icon:'📱', text:'100% responsive', color:'#34d399' }, { icon:'🚀', text:'Export ready', color:'#f472b6' }].map((pill, i) => (
              <motion.div key={pill.text} initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.4 + i*0.1 }}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:999, background:`${pill.color}12`, border:`1px solid ${pill.color}30`, fontSize:12.5, fontWeight:600, color:pill.color, animation:`floatUp ${3.5 + i*0.5}s ease-in-out infinite`, animationDelay:`${i*0.4}s` }}>
                <span>{pill.icon}</span>{pill.text}
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.8 }}
            style={{ display:'flex', gap:32, justifyContent:'center', marginTop:40, padding:'20px 32px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, backdropFilter:'blur(12px)' }}>
            {[['100+','Websites built'],['Free','To start'],['10s','Avg build']].map(([val,lbl]) => (
              <div key={lbl} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.6rem', fontWeight:800, color:'#a78bfa', letterSpacing:'-0.03em' }}>{val}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginTop:3 }}>{lbl}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <div className="right-panel" style={{ width:'50%', position:'relative', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'clamp(20px,4vw,60px)' }}>
        <AnimatePresence mode="wait">
          <motion.div key={isLogin ? 'l':'s'} initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-24 }} transition={{ duration:0.35 }} className="form-card"
            style={{ width:'100%', maxWidth:448, background:'rgba(8,6,20,0.85)', border:'1px solid rgba(139,92,246,0.15)', borderRadius:28, padding:'44px 40px', backdropFilter:'blur(40px)', boxShadow:'0 0 0 1px rgba(139,92,246,0.08), 0 48px 100px rgba(0,0,0,0.7)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg,transparent,rgba(139,92,246,0.6),rgba(99,102,241,0.4),transparent)' }} />

            <div style={{ display:'flex', gap:4, background:'rgba(0,0,0,0.3)', borderRadius:13, padding:4, marginBottom:36, border:'1px solid rgba(255,255,255,0.05)' }}>
              <button className={`tab-pill ${isLogin?'active':''}`} onClick={() => switchMode(true)}>Sign In</button>
              <button className={`tab-pill ${!isLogin?'active':''}`} onClick={() => switchMode(false)}>Create Account</button>
            </div>

            <div style={{ marginBottom:30 }}>
              <motion.h2 key={isLogin?'hl':'hs'} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} style={{ fontSize:'clamp(1.6rem,3vw,2rem)', fontWeight:800, margin:'0 0 8px', letterSpacing:'-0.035em', lineHeight:1.15 }}>
                {isLogin ? 'Welcome back 👋' : 'Get started free 🚀'}
              </motion.h2>
              <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.32)', lineHeight:1.65, margin:0 }}>
                {isLogin ? 'Sign in to continue building amazing websites with AI' : 'Create your account and build your first website in 10 seconds'}
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity:0, height:0, marginBottom:0 }} animate={{ opacity:1, height:'auto', marginBottom:20 }} exit={{ opacity:0, height:0, marginBottom:0 }} style={{ overflow:'hidden' }}>
                  <div style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'12px 14px', fontSize:13, color:'#fca5a5', display:'flex', alignItems:'flex-start', gap:8 }}>
                    <span style={{ flexShrink:0 }}>⚠️</span>
                    <span style={{ flex:1, lineHeight:1.5 }}>{error}</span>
                    <button onClick={() => setError('')} style={{ background:'none', border:'none', color:'rgba(252,165,165,0.4)', cursor:'pointer', fontSize:18, padding:0, lineHeight:1, flexShrink:0 }}>×</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!isLogin && (
                <motion.div initial={{ opacity:0, height:0, marginBottom:0 }} animate={{ opacity:1, height:'auto', marginBottom:16 }} exit={{ opacity:0, height:0, marginBottom:0 }} style={{ overflow:'hidden' }}>
                  <FieldLabel>Full Name</FieldLabel>
                  <div style={{ position:'relative' }}>
                    <FieldIcon>👤</FieldIcon>
                    <input style={inputStyle('name')} type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} onFocus={() => setActiveField('name')} onBlur={() => setActiveField(null)} onKeyDown={handleKey} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginBottom:16 }}>
              <FieldLabel>Email address</FieldLabel>
              <div style={{ position:'relative' }}>
                <FieldIcon>✉️</FieldIcon>
                <input style={inputStyle('email')} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setActiveField('email')} onBlur={() => setActiveField(null)} onKeyDown={handleKey} />
              </div>
            </div>

            <div style={{ marginBottom:32 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <FieldLabel style={{ marginBottom:0 }}>Password</FieldLabel>
                {isLogin && <span style={{ fontSize:12, color:'#a855f7', cursor:'pointer', fontWeight:600 }}>Forgot password?</span>}
              </div>
              <div style={{ position:'relative' }}>
                <FieldIcon>🔒</FieldIcon>
                <input style={{ ...inputStyle('pass'), paddingRight:50 }} type={showPass?'text':'password'} placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setActiveField('pass')} onBlur={() => setActiveField(null)} onKeyDown={handleKey} />
                <button onClick={() => setShowPass(p=>!p)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:showPass?'rgba(139,92,246,0.8)':'rgba(255,255,255,0.25)', cursor:'pointer', fontSize:16, padding:0, lineHeight:1 }}>{showPass ? '🙈' : '👁️'}</button>
              </div>
            </div>

            <div style={{ position:'relative', marginBottom:20 }}>
              <div style={{ position:'absolute', inset:-1, borderRadius:15, background:'linear-gradient(135deg,#9333ea,#6d28d9,#3b82f6)', filter:`blur(${loading?20:10}px)`, opacity:loading?0.85:0.55, transition:'all 0.3s' }} />
              <motion.button onClick={handleEmailAuth} whileHover={{ scale:loading?1:1.015 }} whileTap={{ scale:loading?1:0.975 }} disabled={loading||googleLoading}
                style={{ position:'relative', width:'100%', padding:'15px 20px', borderRadius:14, background:'linear-gradient(135deg,#9333ea,#6d28d9 50%,#4f46e5)', color:'white', fontWeight:700, border:'none', cursor:loading?'not-allowed':'pointer', fontSize:15, fontFamily:'inherit', opacity:loading?0.85:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading ? <><SpinIcon />{isLogin ? 'Signing in…' : 'Creating account…'}</> : <>{isLogin ? '✦ Sign In' : '✦ Create Account'}</>}
              </motion.button>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ flex:1, height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)' }} />
              <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.18)', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>or</span>
              <div style={{ flex:1, height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)' }} />
            </div>

            <button className="g-btn" onClick={handleGoogleAuth} disabled={googleLoading||loading}>
              {googleLoading ? <><SpinIcon /> Redirecting to Google…</> : <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>}
            </button>

            <p style={{ textAlign:'center', fontSize:13, color:'rgba(255,255,255,0.22)', marginTop:24, marginBottom:0, lineHeight:1.6 }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => switchMode(!isLogin)} style={{ color:'#a855f7', cursor:'pointer', fontWeight:700 }}>
                {isLogin ? 'Sign up free →' : 'Sign in →'}
              </span>
            </p>
          </motion.div>
        </AnimatePresence>
        <p style={{ marginTop:20, fontSize:11.5, color:'rgba(255,255,255,0.12)', textAlign:'center' }}>
          By continuing you agree to our <span style={{ color:'rgba(168,85,247,0.45)', cursor:'pointer' }}>Terms</span> & <span style={{ color:'rgba(168,85,247,0.45)', cursor:'pointer' }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}

function FieldLabel({ children, style }) {
  return <label style={{ fontSize:11.5, color:'rgba(255,255,255,0.38)', marginBottom:8, display:'block', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', ...style }}>{children}</label>
}
function FieldIcon({ children }) {
  return <span style={{ position:'absolute', left:15, top:'50%', transform:'translateY(-50%)', fontSize:15, pointerEvents:'none', zIndex:1 }}>{children}</span>
}
function SpinIcon() {
  return <span style={{ display:'inline-block', animation:'spin 0.7s linear infinite', fontSize:16 }}>⟳</span>
}