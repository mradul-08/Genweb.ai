import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import axios from 'axios'
import { serverUrl } from '../App'
import { setUserData } from '../redux/userSlice'

/* ── Load Razorpay SDK ── */
function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

/* ── Credit Packs ── */
const PACKS = [
  { id: 'starter',  credits: 100,  price: 499,  label: 'Starter',   perCredit: 4.99, popular: false, color: '#818cf8', desc: 'Try it out'         },
  { id: 'basic',    credits: 300,  price: 999,  label: 'Basic',     perCredit: 3.33, popular: false, color: '#38bdf8', desc: 'For small projects'  },
  { id: 'pro',      credits: 700,  price: 1999, label: 'Pro',       perCredit: 2.85, popular: true,  color: '#a855f7', desc: 'Most popular choice' },
  { id: 'growth',   credits: 1500, price: 3999, label: 'Growth',    perCredit: 2.67, popular: false, color: '#34d399', desc: 'Scale your projects' },
  { id: 'agency',   credits: 3000, price: 6999, label: 'Agency',    perCredit: 2.33, popular: false, color: '#fbbf24', desc: 'For power users'    },
]

const FAQS = [
  { q: 'What is a credit?',               a: '1 website generation or AI edit = 50 credits. Prompt enhancement = 5 credits. Credits never expire.' },
  { q: 'Do credits expire?',              a: 'No! Credits are yours forever. Buy once, use anytime at your own pace.' },
  { q: 'What payment methods work?',      a: 'UPI (GPay, PhonePe, Paytm QR scan), all Credit/Debit cards (Visa, Mastercard, RuPay), Net Banking, and wallets.' },
  { q: 'Is payment secure?',              a: 'Yes — payments are processed by Razorpay, which is PCI-DSS compliant and RBI licensed. We never store your card details.' },
  { q: 'What if payment fails?',          a: 'No money is deducted on a failed payment. If deducted and credits not added, contact support and we will resolve within 24 hours.' },
  { q: 'Can I get a refund?',             a: 'Credits are non-refundable once added. If you face a technical issue during purchase, contact us within 48 hours.' },
]

const FEATURES = [
  { icon: '⚡', label: 'Instant credits',     desc: 'Added to your account immediately after payment' },
  { icon: '∞',  label: 'Never expire',        desc: 'Use your credits anytime — no monthly reset' },
  { icon: '🔒', label: 'Secure payments',     desc: 'Razorpay PCI-DSS compliant checkout' },
  { icon: '📱', label: 'UPI & Cards',         desc: 'GPay, PhonePe, Paytm QR, all cards accepted' },
]

/* ── Orb BG ── */
function OrbBg() {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
      <div style={{ position:'absolute', top:'-15%', left:'-8%', width:'55vw', height:'55vw', maxWidth:650, maxHeight:650, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.13) 0%, transparent 70%)', filter:'blur(50px)', animation:'of1 14s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:'-10%', right:'-5%', width:'45vw', height:'45vw', maxWidth:550, maxHeight:550, borderRadius:'50%', background:'radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)', filter:'blur(50px)', animation:'of2 18s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:'35%', left:'25%', width:'35vw', height:'35vw', maxWidth:400, maxHeight:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 60%)', filter:'blur(60px)', animation:'of3 22s ease-in-out infinite' }} />
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)', backgroundSize:'56px 56px' }} />
      <style>{`
        @keyframes of1{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(3%,6%) scale(1.06)}70%{transform:translate(-2%,3%) scale(0.96)}}
        @keyframes of2{0%,100%{transform:translate(0,0) scale(1)}35%{transform:translate(-4%,-4%) scale(1.09)}65%{transform:translate(2%,-6%) scale(0.94)}}
        @keyframes of3{0%,100%{transform:translate(0,0)}55%{transform:translate(4%,-5%)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes glow{0%,100%{opacity:0.6}50%{opacity:1}}
      `}</style>
    </div>
  )
}

/* ── Toast ── */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t) }, [])
  const isOk = type === 'success'
  return (
    <motion.div
      initial={{ opacity:0, y:50, x:'-50%' }} animate={{ opacity:1, y:0, x:'-50%' }} exit={{ opacity:0, y:50, x:'-50%' }}
      style={{ position:'fixed', bottom:32, left:'50%', zIndex:2000, display:'flex', alignItems:'center', gap:12, padding:'14px 22px', borderRadius:16, background: isOk ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', border:`1px solid ${isOk ? 'rgba(52,211,153,0.4)' : 'rgba(239,68,68,0.4)'}`, backdropFilter:'blur(24px)', boxShadow:'0 8px 40px rgba(0,0,0,0.5)', maxWidth:440, whiteSpace:'nowrap' }}
    >
      <span style={{ fontSize:20 }}>{isOk ? '✅' : '❌'}</span>
      <span style={{ fontSize:14, fontWeight:600, color: isOk ? '#34d399' : '#f87171' }}>{msg}</span>
      <button onClick={onClose} style={{ marginLeft:8, background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
    </motion.div>
  )
}

/* ── FAQ Item ── */
function FaqItem({ q, a, open, onToggle }) {
  return (
    <motion.div onClick={onToggle} style={{ borderRadius:14, border:`1px solid ${open ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.07)'}`, background: open ? 'rgba(168,85,247,0.04)' : 'rgba(255,255,255,0.02)', padding:'18px 22px', cursor:'pointer', transition:'all 0.25s', userSelect:'none' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
        <span style={{ fontSize:14.5, fontWeight:600, color: open ? '#fff' : 'rgba(255,255,255,0.72)', letterSpacing:'-0.01em' }}>{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration:0.2 }} style={{ fontSize:22, color: open ? '#a855f7' : 'rgba(255,255,255,0.28)', flexShrink:0 }}>+</motion.span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.p initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} transition={{ duration:0.25 }}
            style={{ margin:'12px 0 0', fontSize:13.5, color:'rgba(255,255,255,0.45)', lineHeight:1.75, overflow:'hidden' }}>{a}</motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Pack Card ── */
function PackCard({ pack, onBuy, loading }) {
  const isLoading = loading === pack.id
  const savings   = pack.id !== 'starter' ? Math.round(100 - (pack.price / (pack.credits * 4.99)) * 100) : 0

  return (
    <motion.div
      initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
      whileHover={{ y:-8, boxShadow:`0 24px 60px ${pack.color}25` }}
      style={{ borderRadius:24, background: pack.popular ? `${pack.color}08` : 'rgba(255,255,255,0.025)', border:`${pack.popular ? '2px' : '1px'} solid ${pack.popular ? pack.color+'55' : 'rgba(255,255,255,0.08)'}`, padding:'28px 24px', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', gap:20, transition:'border-color .25s, box-shadow .25s', cursor:'default' }}
    >
      {/* Top strip */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, transparent, ${pack.color}90, transparent)` }} />

      {/* Popular badge */}
      {pack.popular && (
        <div style={{ position:'absolute', top:16, right:16, padding:'4px 12px', borderRadius:20, background:`linear-gradient(135deg, ${pack.color}, ${pack.color}bb)`, fontSize:10, fontWeight:800, color:'#fff', letterSpacing:'0.08em', textTransform:'uppercase', boxShadow:`0 0 20px ${pack.color}60` }}>
          ★ Most Popular
        </div>
      )}

      {/* Savings badge */}
      {savings > 0 && (
        <div style={{ position:'absolute', top: pack.popular ? 44 : 16, right:16, padding:'3px 10px', borderRadius:20, background:'rgba(52,211,153,0.15)', border:'1px solid rgba(52,211,153,0.3)', fontSize:10, fontWeight:700, color:'#34d399' }}>
          Save {savings}%
        </div>
      )}

      {/* Header */}
      <div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, background:`${pack.color}18`, border:`1px solid ${pack.color}40`, marginBottom:12 }}>
          <span style={{ fontSize:10, fontWeight:800, color:pack.color, letterSpacing:'0.1em', textTransform:'uppercase' }}>{pack.label}</span>
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:6, marginBottom:4 }}>
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontWeight:600, marginBottom:4 }}>₹</span>
          <span style={{ fontSize:44, fontWeight:800, color:'#fff', letterSpacing:'-0.04em', lineHeight:1 }}>{pack.price.toLocaleString('en-IN')}</span>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginBottom:6 }}>one-time</span>
        </div>
        <p style={{ margin:0, fontSize:12.5, color:'rgba(255,255,255,0.38)', lineHeight:1.6 }}>{pack.desc}</p>
      </div>

      {/* Credits display */}
      <div style={{ padding:'14px 16px', borderRadius:14, background:`${pack.color}0d`, border:`1px solid ${pack.color}30`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>⚡</span>
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:pack.color, letterSpacing:'-0.03em', lineHeight:1 }}>{pack.credits.toLocaleString()}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:1 }}>credits</div>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:13, fontWeight:700, color:pack.color }}>₹{pack.perCredit.toFixed(2)}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>per credit</div>
        </div>
      </div>

      {/* What you get */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {[
          `${Math.floor(pack.credits / 50)} website generations`,
          `${Math.floor(pack.credits / 50)} AI edits`,
          'Credits never expire',
          'All export features',
        ].map((f, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12.5, color:'rgba(255,255,255,0.55)' }}>
            <span style={{ color:pack.color, fontSize:12 }}>✓</span> {f}
          </div>
        ))}
      </div>

      {/* CTA */}
      <motion.button
        whileHover={!isLoading ? { scale:1.03 } : {}}
        whileTap={!isLoading ? { scale:0.97 } : {}}
        onClick={() => onBuy(pack.id)}
        disabled={isLoading}
        style={{ width:'100%', padding:'13px', borderRadius:12, border:'none', background: pack.popular ? `linear-gradient(135deg, ${pack.color}, ${pack.color}bb)` : `${pack.color}18`, color: pack.popular ? '#fff' : pack.color, fontWeight:700, fontSize:14, fontFamily:'inherit', cursor: isLoading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s', boxShadow: pack.popular ? `0 0 28px ${pack.color}40` : 'none', opacity: isLoading ? 0.75 : 1 }}
      >
        {isLoading
          ? <><motion.span animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }} style={{ display:'inline-block', fontSize:16 }}>⟳</motion.span> Processing…</>
          : <>Buy {pack.credits} Credits — ₹{pack.price.toLocaleString('en-IN')}</>
        }
      </motion.button>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════ */
export default function Pricing() {
  const navigate   = useNavigate()
  const dispatch   = useDispatch()
  const [params]   = useSearchParams()
  const { userData } = useSelector(s => s.user)

  const [loading,  setLoading]  = useState(null)
  const [toast,    setToast]    = useState(null)
  const [openFaq,  setOpenFaq]  = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Handle return from payment (success/cancel)
  useEffect(() => {
    if (params.get('success') === 'true') {
      const credits = params.get('credits')
      setToast({ msg: `⚡ ${credits || 'Credits'} added to your account!`, type:'success' })
      axios.get(`${serverUrl}/api/user/current`, { withCredentials:true })
        .then(r => { if (r.data.user) dispatch(setUserData(r.data.user)) }).catch(() => {})
      window.history.replaceState({}, '', '/pricing')
    }
  }, [])

  /* ── Buy handler ── */
  const handleBuy = async (packId) => {
    if (!userData) { navigate('/login'); return }
    setLoading(packId)

    try {
      // 1. Load Razorpay SDK
      const ok = await loadRazorpay()
      if (!ok) { setToast({ msg:'Failed to load payment SDK. Check internet connection.', type:'error' }); return }

      // 2. Create order on backend
      const { data } = await axios.post(`${serverUrl}/api/payment/create-order`, { packId }, { withCredentials:true })
      if (!data.success) { setToast({ msg: data.message || 'Could not create order', type:'error' }); return }

      const pack = PACKS.find(p => p.id === packId)

      // 3. Open Razorpay popup
      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         data.key,
          order_id:    data.order.id,
          amount:      data.order.amount,
          currency:    'INR',
          name:        'GenWeb.ai',
          description: `${data.pack.credits} AI Credits`,
          image:       '/favicon.svg',
          prefill: {
            name:  data.user.name,
            email: data.user.email,
          },
          theme: { color: pack?.color || '#a855f7' },
          modal: {
            ondismiss: () => {
              setToast({ msg:'Payment cancelled.', type:'error' })
              resolve()
            },
          },
          handler: async (response) => {
            try {
              // 4. Verify payment on backend
              const verify = await axios.post(
                `${serverUrl}/api/payment/verify`,
                {
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                  packId,
                },
                { withCredentials:true }
              )
              if (verify.data.success) {
                // Refresh user
                const r = await axios.get(`${serverUrl}/api/user/current`, { withCredentials:true })
                if (r.data.user) dispatch(setUserData(r.data.user))
                setToast({ msg:`🎉 ${data.pack.credits} credits added! Total: ${verify.data.newTotal}`, type:'success' })
              } else {
                setToast({ msg: verify.data.message || 'Verification failed', type:'error' })
              }
            } catch (e) {
              setToast({ msg:'Payment verified but update failed. Contact support.', type:'error' })
            }
            resolve()
          },
        })
        rzp.open()
      })
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Payment error. Try again.', type:'error' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#040408', color:'#fff', fontFamily:"'DM Sans','Inter',system-ui,sans-serif", overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
        *{box-sizing:border-box;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#040408}::-webkit-scrollbar-thumb{background:rgba(168,85,247,0.3);border-radius:3px}
      `}</style>

      <OrbBg />

      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* ── NAV ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:200, height:64, background: scrolled ? 'rgba(4,4,8,0.96)' : 'rgba(4,4,8,0.5)', backdropFilter:'blur(24px)', borderBottom:`1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 clamp(16px,4vw,48px)', transition:'all 0.3s' }}>
        <div onClick={() => navigate('/')} style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#a855f7,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, boxShadow:'0 0 20px rgba(168,85,247,0.4)' }}>✦</div>
          <span style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.02em' }}>GenWeb<span style={{ color:'#a855f7' }}>.ai</span></span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {userData && (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)' }}>
              <span style={{ fontSize:14 }}>⚡</span>
              <span style={{ fontSize:14, fontWeight:700, color:'#fbbf24' }}>{userData.credits ?? 0}</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>credits</span>
            </div>
          )}
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
            onClick={() => userData ? navigate('/dashboard') : navigate('/login')}
            style={{ padding:'8px 20px', borderRadius:10, background: userData ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#a855f7,#3b82f6)', border: userData ? '1px solid rgba(255,255,255,0.1)' : 'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow: userData ? 'none' : '0 0 20px rgba(168,85,247,0.3)' }}
          >{userData ? 'Dashboard' : 'Get Started'}</motion.button>
        </div>
      </nav>

      <main style={{ position:'relative', zIndex:10, paddingTop:64 }}>

        {/* ── HERO ── */}
        <section style={{ textAlign:'center', padding:'clamp(60px,10vw,100px) clamp(20px,5vw,60px) clamp(32px,5vw,48px)' }}>
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'6px 16px', borderRadius:999, background:'rgba(168,85,247,0.12)', border:'1px solid rgba(168,85,247,0.3)', fontSize:11, fontWeight:700, color:'#c084fc', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:22 }}>
              ⚡ Buy credits, pay as you go
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.6 }}
            style={{ margin:'0 0 18px', fontSize:'clamp(2.4rem,6.5vw,4.5rem)', fontWeight:800, lineHeight:1.08, letterSpacing:'-0.045em', color:'#fff' }}>
            Simple credit pricing.{' '}
            <span style={{ background:'linear-gradient(135deg,#a855f7,#60a5fa,#34d399)', backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'shimmer 4s linear infinite' }}>
              No subscriptions.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.5 }}
            style={{ margin:'0 auto 40px', fontSize:'clamp(14px,2.2vw,17px)', color:'rgba(255,255,255,0.48)', lineHeight:1.75, maxWidth:520 }}>
            Buy credits once, use them forever. No monthly resets, no hidden fees. 
            Generate websites with AI and pay only for what you use.
          </motion.p>

          {/* Credits display for logged-in users */}
          {userData && (
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.3 }}
              style={{ display:'inline-flex', alignItems:'center', gap:12, padding:'12px 24px', borderRadius:16, background:'rgba(251,191,36,0.07)', border:'1px solid rgba(251,191,36,0.22)', marginBottom:40 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#fbbf24', boxShadow:'0 0 10px rgba(251,191,36,0.8)', animation:'glow 2s ease-in-out infinite' }} />
              <span style={{ fontSize:15, fontWeight:600, color:'rgba(255,255,255,0.8)' }}>
                You have <strong style={{ color:'#fbbf24', fontSize:18 }}>{userData.credits}</strong> credits remaining
              </span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>· {Math.floor((userData.credits || 0) / 50)} generations left</span>
            </motion.div>
          )}

          {/* Features row */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35 }}
            style={{ display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:20, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', backdropFilter:'blur(8px)' }}>
                <span style={{ fontSize:16 }}>{f.icon}</span>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.8)' }}>{f.label}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.32)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── PACK GRID ── */}
        <section style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(16px,4vw,40px) 80px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(210px, 1fr))', gap:18 }}>
            {PACKS.map((pack, i) => (
              <motion.div key={pack.id} initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }} transition={{ delay:i * 0.08, duration:0.45 }}>
                <PackCard pack={pack} onBuy={handleBuy} loading={loading} />
              </motion.div>
            ))}
          </div>

          {/* Payment methods */}
          <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            style={{ marginTop:40, padding:'20px 28px', borderRadius:16, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', flexWrap:'wrap', gap:24 }}>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Accepted via Razorpay</span>
            {['📱 UPI / QR Scan', '💳 Credit & Debit Cards', '🏦 Net Banking', '👛 Paytm & Wallets', '🔒 PCI-DSS Secure'].map((m, i) => (
              <div key={i} style={{ fontSize:13, color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center', gap:6 }}>{m}</div>
            ))}
          </motion.div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ maxWidth:900, margin:'0 auto', padding:'0 clamp(16px,4vw,40px) 80px' }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 14px', borderRadius:999, background:'rgba(56,189,248,0.1)', border:'1px solid rgba(56,189,248,0.25)', fontSize:11, fontWeight:700, color:'#38bdf8', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:14 }}>How it works</div>
            <h2 style={{ margin:'0 0 10px', fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:800, color:'#fff', letterSpacing:'-0.03em' }}>Get credits in 60 seconds</h2>
            <p style={{ margin:0, fontSize:14, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>Simple, fast, secure — powered by Razorpay</p>
          </motion.div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:20 }}>
            {[
              { num:'01', icon:'🛒', title:'Pick a pack',      desc:'Choose credits that fit your needs. Minimum 100 credits.' },
              { num:'02', icon:'📱', title:'Pay your way',     desc:'UPI scan, card, or net banking — whichever is convenient.' },
              { num:'03', icon:'⚡', title:'Instant credits',  desc:'Credits added to your account in seconds after payment.' },
              { num:'04', icon:'🚀', title:'Build & create',   desc:'Generate stunning websites with AI. Each costs 50 credits.' },
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i * 0.1 }}
                style={{ padding:'24px 20px', borderRadius:20, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:16, right:16, fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.08)', letterSpacing:'0.05em' }}>{step.num}</div>
                <div style={{ fontSize:32, marginBottom:14, animation:'float 3s ease-in-out infinite', animationDelay:`${i * 0.5}s` }}>{step.icon}</div>
                <h3 style={{ margin:'0 0 8px', fontSize:15, fontWeight:700, color:'#fff', letterSpacing:'-0.01em' }}>{step.title}</h3>
                <p style={{ margin:0, fontSize:13, color:'rgba(255,255,255,0.42)', lineHeight:1.7 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CREDIT CALCULATOR ── */}
        <section style={{ maxWidth:700, margin:'0 auto', padding:'0 clamp(16px,4vw,40px) 80px' }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            style={{ padding:'clamp(28px,5vw,44px)', borderRadius:24, background:'rgba(168,85,247,0.05)', border:'1px solid rgba(168,85,247,0.18)' }}>
            <h2 style={{ margin:'0 0 6px', fontSize:'clamp(1.3rem,3vw,1.8rem)', fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>
              How many credits do you need?
            </h2>
            <p style={{ margin:'0 0 28px', fontSize:13.5, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>
              Each website generation or AI edit = <strong style={{ color:'#a855f7' }}>50 credits</strong>. Prompt enhancement = <strong style={{ color:'#a855f7' }}>5 credits</strong>.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[
                { label:'💡 Just exploring',   desc:'5-10 generations',  credits:'250–500',  pack:'Starter + Basic' },
                { label:'🛠 Side project',      desc:'15-20 generations', credits:'750–1000', pack:'Pro pack'         },
                { label:'💼 Client work',       desc:'30+ generations',   credits:'1500+',    pack:'Growth pack'     },
                { label:'🏢 Agency/team',       desc:'60+ generations',   credits:'3000+',    pack:'Agency pack'     },
              ].map((item, i) => (
                <div key={i} style={{ padding:'16px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:6 }}>{item.label}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:8, lineHeight:1.6 }}>{item.desc}</div>
                  <div style={{ fontSize:11, color:'#a855f7', fontWeight:600 }}>~{item.credits} credits → {item.pack}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ maxWidth:720, margin:'0 auto', padding:'0 clamp(16px,4vw,40px) 80px' }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 14px', borderRadius:999, background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)', fontSize:11, fontWeight:700, color:'#34d399', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:14 }}>FAQ</div>
            <h2 style={{ margin:'0 0 10px', fontSize:'clamp(1.5rem,3.5vw,2.2rem)', fontWeight:800, color:'#fff', letterSpacing:'-0.03em' }}>Common questions</h2>
          </motion.div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section style={{ padding:'0 clamp(20px,5vw,60px) 80px' }}>
          <div style={{ maxWidth:860, margin:'0 auto' }}>
            <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              style={{ borderRadius:28, background:'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.08), rgba(52,211,153,0.06))', border:'1px solid rgba(168,85,247,0.22)', padding:'clamp(40px,6vw,64px)', textAlign:'center', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'50%', height:'50%', background:'radial-gradient(ellipse, rgba(168,85,247,0.12), transparent 70%)', pointerEvents:'none' }} />
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ fontSize:44, marginBottom:18, animation:'float 3s ease-in-out infinite' }}>🚀</div>
                <h2 style={{ margin:'0 0 14px', fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:800, color:'#fff', letterSpacing:'-0.03em' }}>
                  Start building with AI today
                </h2>
                <p style={{ margin:'0 0 32px', fontSize:14.5, color:'rgba(255,255,255,0.45)', lineHeight:1.75, maxWidth:400, marginLeft:'auto', marginRight:'auto' }}>
                  New users get 100 free credits. No credit card required to start.
                </p>
                <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
                  <motion.button whileHover={{ scale:1.05, boxShadow:'0 0 50px rgba(168,85,247,0.5)' }} whileTap={{ scale:0.97 }}
                    onClick={() => userData ? navigate('/dashboard') : navigate('/login')}
                    style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'14px 32px', borderRadius:14, background:'linear-gradient(135deg,#a855f7,#3b82f6)', border:'none', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 0 28px rgba(168,85,247,0.32)' }}>
                    {userData ? '← Back to Dashboard' : '✦ Start Free — 100 Credits'}
                  </motion.button>
                  <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    onClick={() => document.getElementById('packs')?.scrollIntoView({ behavior:'smooth' }) || window.scrollTo({ top:400, behavior:'smooth' })}
                    style={{ padding:'14px 28px', borderRadius:14, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.65)', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                    View credit packs ↑
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'clamp(20px,3vw,32px) clamp(20px,5vw,60px)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:8, background:'linear-gradient(135deg,#a855f7,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>✦</div>
            <span style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>GenWeb<span style={{ color:'#a855f7' }}>.ai</span></span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {[['Home','/'],['Dashboard','/dashboard']].map(([l,p]) => (
              <span key={l} onClick={() => navigate(p)} style={{ fontSize:13, color:'rgba(255,255,255,0.35)', cursor:'pointer', padding:'4px 10px', borderRadius:6, transition:'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.75)'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.35)'}>{l}</span>
            ))}
          </div>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.18)' }}>© 2026 GenWeb.ai · Payments by Razorpay</span>
        </footer>
      </main>
    </div>
  )
}
