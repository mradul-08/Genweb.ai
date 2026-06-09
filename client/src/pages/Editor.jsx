import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setUserData } from '../redux/userSlice'
import { serverUrl } from '../App'
import axios from 'axios'

const EDIT_STEPS = ['Reading request…','Analyzing code…','Planning changes…','Applying edits…','Polishing…','Done ✓']

const QUICK_EDITS = [
  { label:'🌙 Dark mode toggle',  prompt:'Add a dark/light mode toggle button to the navbar that switches the entire site theme' },
  { label:'📱 Fix mobile',        prompt:'Fix all mobile responsiveness issues — ensure every section looks great on screens below 480px' },
  { label:'✨ Add animations',    prompt:'Add smooth scroll-triggered fade-up animations to all sections using Intersection Observer' },
  { label:'🎨 New color scheme',  prompt:'Refresh the accent color throughout the site with a more vibrant, modern feel' },
  { label:'⚡ Page loader',       prompt:'Add a beautiful animated page loading screen that fades out after 1.5 seconds' },
  { label:'🔗 Smooth scroll',     prompt:'Make all navigation links scroll smoothly to their sections' },
  { label:'💬 Add testimonials',  prompt:'Add a testimonials/reviews section with 3 cards featuring star ratings and quotes' },
  { label:'📊 Add stats section', prompt:'Add an animated stats/numbers section showcasing key metrics with count-up animation' },
]

const TIPS = [
  '💡 Say "change the hero background to a dark gradient" for quick edits.',
  '🎨 Try "make the CTA button glow purple on hover" for micro effects.',
  '📱 Type "make the navbar sticky with blur backdrop" for nav fixes.',
  '✨ Use "add smooth hover lift effect to all cards" for polish.',
  '🚀 Say "add a back-to-top button" for instant UX wins.',
]

const DEVICES = [
  { id:'desktop', label:'Desktop', icon:'🖥', width:'100%'  },
  { id:'tablet',  label:'Tablet',  icon:'📟', width:'768px' },
  { id:'mobile',  label:'Mobile',  icon:'📱', width:'375px' },
]

function createSafeBlobUrl(html) {
  const head = `<base target="_blank"><script>(function(){try{Object.defineProperty(window,'top',{get:function(){return window;}});Object.defineProperty(window,'parent',{get:function(){return window;}});}catch(e){}})();<\/script>`
  let out = html
  if (out.includes('<head>')) out = out.replace('<head>', '<head>' + head)
  else out = '<head>' + head + '</head>' + out
  return URL.createObjectURL(new Blob([out], { type: 'text/html' }))
}

async function fetchWithTimeout(url, options, timeoutMs = 240000) {
  const ctrl  = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res  = await fetch(url, { ...options, signal: ctrl.signal })
    const data = await res.json().catch(() => ({}))
    return { res, data }
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out. Please try again.')
    throw err
  } finally { clearTimeout(timer) }
}

function useVersionHistory(initial = '') {
  const [history,  setHistory]  = useState(initial ? [initial] : [])
  const [pointer,  setPointer]  = useState(0)

  const push = useCallback((code) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, pointer + 1)
      const next    = [...trimmed, code].slice(-20)
      setPointer(next.length - 1)
      return next
    })
  }, [pointer])

  const undo = useCallback(() => {
    if (pointer <= 0) return null
    const newPtr = pointer - 1
    setPointer(newPtr)
    return history[newPtr]
  }, [history, pointer])

  const redo = useCallback(() => {
    if (pointer >= history.length - 1) return null
    const newPtr = pointer + 1
    setPointer(newPtr)
    return history[newPtr]
  }, [history, pointer])

  const canUndo = pointer > 0
  const canRedo = pointer < history.length - 1

  return { push, undo, redo, canUndo, canRedo, pointer, total: history.length }
}

function CodeViewer({ code, onCodeChange }) {
  const [copied,  setCopied]  = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(code)
  useEffect(() => { setDraft(code) }, [code])

  const lines     = useMemo(() => code.split('\n'), [code])
  const highlight = (raw) =>
    raw.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
       .replace(/(&lt;\/?)([\w-]+)/g,'<span style="color:#60a5fa">$1$2</span>')
       .replace(/(\s)([\w-]+)(=)/g,'$1<span style="color:#93c5fd">$2</span>$3')
       .replace(/(&lt;!--.*?--&gt;)/g,'<span style="color:#6b7280;font-style:italic">$1</span>')

  if (editing) return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#08080f' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'#0c0c18', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        <span style={{ fontSize:12, color:'#818cf8', fontWeight:700 }}>✎ Direct Edit Mode</span>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setEditing(false)} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.5)', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={() => { onCodeChange(draft); setEditing(false) }} style={{ padding:'4px 12px', borderRadius:6, border:'none', background:'linear-gradient(135deg,#818cf8,#38bdf8)', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Apply →</button>
        </div>
      </div>
      <textarea value={draft} onChange={e => setDraft(e.target.value)} spellCheck={false}
        style={{ flex:1, background:'#08080f', color:'#c9d1d9', fontFamily:"'Fira Code','Courier New',monospace", fontSize:12.5, lineHeight:'20px', border:'none', outline:'none', padding:'14px 18px', resize:'none', boxSizing:'border-box' }} />
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#08080f' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'#0c0c18', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:6 }}>
          {['#FF5F56','#FFBD2E','#27C93F'].map((c,i) => <div key={i} style={{ width:11, height:11, borderRadius:'50%', background:c }} />)}
        </div>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.2)', fontFamily:'monospace' }}>website.html · {lines.length} lines</span>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setEditing(true)} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid rgba(129,140,248,0.3)', background:'rgba(129,140,248,0.08)', color:'#818cf8', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>✎ Edit</button>
          <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            style={{ padding:'4px 12px', borderRadius:6, border:'1px solid rgba(255,255,255,0.09)', background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)', color: copied ? '#4ade80' : 'rgba(255,255,255,0.45)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
            {copied ? '✓ Copied' : '⎘ Copy'}
          </button>
        </div>
      </div>
      <div style={{ flex:1, display:'flex', overflow:'auto' }}>
        <div style={{ padding:'14px 0', background:'#0a0a15', borderRight:'1px solid rgba(255,255,255,0.04)', userSelect:'none', flexShrink:0, minWidth:46, textAlign:'right' }}>
          {lines.map((_,i) => <div key={i} style={{ padding:'0 12px', fontSize:11.5, lineHeight:'20px', color:'rgba(255,255,255,0.1)', fontFamily:"monospace" }}>{i+1}</div>)}
        </div>
        <div style={{ flex:1, padding:'14px 18px', fontFamily:"'Fira Code','Courier New',monospace", fontSize:12.5, lineHeight:'20px', color:'#c9d1d9', whiteSpace:'pre', overflowX:'auto' }}>
          {lines.map((line,i) => (
            <div key={i} dangerouslySetInnerHTML={{ __html: highlight(line) || '&nbsp;' }}
              style={{ minHeight:20, borderRadius:2, transition:'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.025)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'} />
          ))}
        </div>
      </div>
    </div>
  )
}

function FullPreview({ url, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:9999, background:'#000', display:'flex', flexDirection:'column' }}>
      <div style={{ height:44, flexShrink:0, background:'rgba(8,8,14,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', gap:5 }}>
            {['#FF5F56','#FFBD2E','#27C93F'].map((c,i) => <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:c }} />)}
          </div>
          <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'4px 14px', fontSize:11.5, color:'rgba(255,255,255,0.28)', fontFamily:'monospace', minWidth:260, textAlign:'center' }}>your-website.html</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.2)' }}>Esc to close</span>
          <button onClick={onClose}
            style={{ width:28, height:28, borderRadius:7, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(255,255,255,0.6)', fontSize:17, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.15)'; e.currentTarget.style.color='#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(255,255,255,0.6)' }}>×</button>
        </div>
      </div>
      <iframe src={url} style={{ flex:1, width:'100%', border:'none', background:'white' }} title="Full Preview" scrolling="yes" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin allow-pointer-lock" />
    </motion.div>
  )
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.28 }}
      style={{ display:'flex', gap:10, padding:'10px 16px', alignItems:'flex-start' }}>
      <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, background: isUser ? 'linear-gradient(135deg,#a855f7,#38bdf8)' : 'rgba(129,140,248,0.15)', border: isUser ? 'none' : '1px solid rgba(129,140,248,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff' }}>
        {isUser ? '✦' : '⚡'}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11, fontWeight:700, color: isUser ? '#a855f7' : '#38bdf8', marginBottom:5, letterSpacing:'0.04em', textTransform:'uppercase' }}>
          {isUser ? 'You' : 'GenWeb AI'}
        </div>
        <div style={{ fontSize:13, color: isUser ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.62)', lineHeight:1.7, wordBreak:'break-word' }}>
          {msg.content}
        </div>
        {msg.meta && (
          <div style={{ marginTop:6, display:'flex', gap:8, flexWrap:'wrap' }}>
            {msg.meta.editType && (
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(129,140,248,0.1)', border:'1px solid rgba(129,140,248,0.2)', color:'#818cf8', fontWeight:600 }}>
                {msg.meta.editType}
              </span>
            )}
            {msg.meta.creditsUsed && (
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', color:'#fbbf24', fontWeight:600 }}>
                ⚡ {msg.meta.creditsUsed} credits
              </span>
            )}
            {msg.meta.tokensSaved && (
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', color:'#34d399', fontWeight:600 }}>
                ~{msg.meta.tokensSaved}% tokens saved
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ParticleBg() {
  const ref = useRef(null)
  const animRef = useRef(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = canvas.parentElement.offsetWidth, H = canvas.parentElement.offsetHeight
    canvas.width = W; canvas.height = H
    const resize = () => { W = canvas.parentElement.offsetWidth; H = canvas.parentElement.offsetHeight; canvas.width = W; canvas.height = H }
    window.addEventListener('resize', resize)
    const pts = Array.from({ length:55 }, () => ({ x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*.28, vy:(Math.random()-.5)*.28, r:Math.random()*1.4+.3, c:Math.random()>.5?'rgba(129,140,248,':'rgba(56,189,248,', a:Math.random()*.35+.1 }))
    const draw = () => {
      ctx.clearRect(0,0,W,H)
      const bg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.7); bg.addColorStop(0,'rgba(8,6,22,1)'); bg.addColorStop(1,'rgba(4,4,12,1)')
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H)
      ctx.strokeStyle='rgba(129,140,248,0.022)'; ctx.lineWidth=1
      for(let x=0;x<W;x+=58){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
      for(let y=0;y<H;y+=58){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
      pts.forEach((p,i)=>{ p.x+=p.vx;p.y+=p.vy; if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.c+p.a+')';ctx.fill()
        pts.slice(i+1).forEach(p2=>{ const dx=p.x-p2.x,dy=p.y-p2.y,d=Math.sqrt(dx*dx+dy*dy); if(d<95){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p2.x,p2.y);ctx.strokeStyle=`rgba(129,140,248,${.055*(1-d/95)})`;ctx.lineWidth=.7;ctx.stroke()} }) })
      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position:'absolute', inset:0, width:'100%', height:'100%', display:'block' }} />
}

export default function Editor() {
  const { userData } = useSelector(s => s.user)
  const dispatch     = useDispatch()
  const navigate     = useNavigate()
  const [params]     = useSearchParams()
  const websiteId    = params.get('id')

  const [website,        setWebsite]        = useState(null)
  const [loadingWebsite, setLoadingWebsite] = useState(true)
  const [currentCode,    setCurrentCode]    = useState('')
  const [previewUrl,     setPreviewUrl]     = useState(null)

  const versionHistory = useVersionHistory()

  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const [deploying,        setDeploying]        = useState(false)
  const [deployUrl,        setDeployUrl]        = useState(null)
  const [showDeployModal,  setShowDeployModal]  = useState(false)
  const [deployCopied,     setDeployCopied]     = useState(false)

  const [activeTab,       setActiveTab]       = useState('preview')
  const [showFullPreview, setShowFullPreview] = useState(false)
  const [device,          setDevice]          = useState('desktop')
  const [editStep,        setEditStep]        = useState(0)
  const [elapsedMs,       setElapsedMs]       = useState(0)
  const [tipIndex,        setTipIndex]        = useState(0)
  const [error,           setError]           = useState('')

  const chatEndRef    = useRef(null)
  const inputRef      = useRef(null)
  const prevBlobUrl   = useRef(null)
  const countdownRef  = useRef(null)
  const stepTimeouts  = useRef([])
  const tipTimer      = useRef(null)
  const startTime     = useRef(null)
  const estimatedMs   = 35000

  useEffect(() => { if (!userData) navigate('/login') }, [userData])

  useEffect(() => {
    tipTimer.current = setInterval(() => setTipIndex(p => (p + 1) % TIPS.length), 5500)
    return () => clearInterval(tipTimer.current)
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, isEditing])

  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape') { setShowFullPreview(false); setShowDeployModal(false) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo() }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [versionHistory.canUndo, versionHistory.canRedo])

  useEffect(() => {
    if (!websiteId || !userData) return
    const load = async () => {
      try {
        const { data } = await axios.get(`${serverUrl}/api/website/${websiteId}`, { withCredentials:true })
        if (data.success && data.website) {
          setWebsite(data.website)
          setCurrentCode(data.website.latestCode)
          versionHistory.push(data.website.latestCode)
          if (data.website.deployUrl) setDeployUrl(data.website.deployUrl)
          const url = createSafeBlobUrl(data.website.latestCode)
          prevBlobUrl.current = url
          setPreviewUrl(url)
          const conv = data.website.conversation || []
          if (conv.length) {
            setMessages(conv.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })))
          } else {
            setMessages([{ role:'assistant', content:`Hi! I'm your AI editor for **${data.website.title}**. Describe any change and I'll apply it instantly. Use quick edits below for common improvements, or type anything custom! 🚀` }])
          }
        }
      } catch { setError('Failed to load website.') }
      finally  { setLoadingWebsite(false) }
    }
    load()
    return () => { if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current) }
  }, [websiteId, userData])

  const updatePreview = useCallback((code) => {
    if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current)
    const url = createSafeBlobUrl(code)
    prevBlobUrl.current = url
    setPreviewUrl(url)
    setCurrentCode(code)
  }, [])

  const startTimers = useCallback(() => {
    startTime.current = Date.now(); setElapsedMs(0); setEditStep(0)
    clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => setElapsedMs(Date.now() - startTime.current), 120)
    stepTimeouts.current.forEach(clearTimeout); stepTimeouts.current = []
    const weights = [0.1, 0.15, 0.2, 0.25, 0.2]
    let cum = 0
    weights.forEach((w, i) => { cum += w * estimatedMs; stepTimeouts.current.push(setTimeout(() => setEditStep(i + 1), cum)) })
  }, [])

  const stopTimers = useCallback(() => {
    clearInterval(countdownRef.current); stepTimeouts.current.forEach(clearTimeout); setEditStep(5)
  }, [])

  const handleUndo = useCallback(() => {
    const code = versionHistory.undo()
    if (!code) return
    updatePreview(code)
    setMessages(prev => [...prev, { role:'assistant', content:'↩ Undone — reverted to previous version.' }])
  }, [versionHistory, updatePreview])

  const handleRedo = useCallback(() => {
    const code = versionHistory.redo()
    if (!code) return
    updatePreview(code)
    setMessages(prev => [...prev, { role:'assistant', content:'↪ Redone — moved forward.' }])
  }, [versionHistory, updatePreview])

  const handleSend = async () => {
    if (!input.trim() || isEditing) return
    const userMsg = { role:'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    const prompt = input.trim()
    setInput('')
    setIsEditing(true)
    setError('')
    startTimers()
    try {
      const { res, data } = await fetchWithTimeout(
        `${serverUrl}/api/website/${websiteId}`,
        { method:'PUT', headers:{ 'Content-Type':'application/json' }, credentials:'include', body: JSON.stringify({ prompt }) },
        240000
      )
      if (!res.ok || !data.success) throw new Error(data.message || 'Edit failed')
      stopTimers()
      versionHistory.push(data.code)
      updatePreview(data.code)
      setActiveTab('preview')
      const savedPct = data.mode && data.mode !== 'full'
        ? { style_only:85, section_patch:70, style_script_patch:75, section_add:80, body_only:40 }[data.mode] || 60
        : 0
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: data.message || 'Done! Changes applied successfully.',
        meta: { editType: data.editType, creditsUsed: data.credits?.used, tokensSaved: savedPct > 0 ? savedPct : null },
      }])
      axios.get(`${serverUrl}/api/user/current`, { withCredentials:true })
        .then(r => { if (r.data.user) dispatch(setUserData(r.data.user)) }).catch(() => {})
    } catch (err) {
      stopTimers()
      setError(err.message)
      setMessages(prev => [...prev, { role:'assistant', content:`Sorry, I hit an error: ${err.message}. Please try again.` }])
    } finally {
      setIsEditing(false)
    }
  }

  const handleDirectEdit = (newCode) => {
    versionHistory.push(newCode)
    updatePreview(newCode)
    setMessages(prev => [...prev, { role:'assistant', content:'✓ Code updated directly. Preview refreshed.' }])
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href     = URL.createObjectURL(new Blob([currentCode], { type:'text/html' }))
    a.download = `${website?.title || 'website'}.html`
    a.click()
  }

  const handleDeploy = async () => {
    if (!websiteId || deploying) return
    setDeploying(true)
    setError('')
    try {
      const { data } = await axios.post(
        `${serverUrl}/api/website/${websiteId}/deploy`,
        { code: currentCode },
        { withCredentials: true }
      )
      if (data.success && data.deployUrl) {
        setDeployUrl(data.deployUrl)
        setShowDeployModal(true)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🚀 Deployed successfully! Your site is live at: ${data.deployUrl}`
        }])
        axios.get(`${serverUrl}/api/user/current`, { withCredentials:true })
          .then(r => { if (r.data.user) dispatch(setUserData(r.data.user)) }).catch(() => {})
      } else {
        throw new Error(data.message || 'Deploy failed. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Deployment failed. Please try again.')
    } finally {
      setDeploying(false)
    }
  }

  const realPct   = Math.min(99, Math.round((elapsedMs / estimatedMs) * 100))
  const remaining = Math.max(0, (estimatedMs - elapsedMs) / 1000)

  if (loadingWebsite) return (
    <div style={{ minHeight:'100vh', background:'#060608', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <motion.div animate={{ rotate:360 }} transition={{ duration:1.2, repeat:Infinity, ease:'linear' }}
        style={{ width:44, height:44, borderRadius:'50%', border:'3px solid rgba(168,85,247,0.15)', borderTopColor:'#a855f7' }} />
      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14 }}>Loading your website…</p>
    </div>
  )

  if (!websiteId) return (
    <div style={{ minHeight:'100vh', background:'#060608', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ fontSize:40 }}>🔍</div>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:16, fontWeight:600 }}>No website selected</p>
      <button onClick={() => navigate('/dashboard')} style={{ padding:'10px 24px', borderRadius:10, background:'rgba(168,85,247,0.12)', border:'1px solid rgba(168,85,247,0.3)', color:'#a855f7', fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14 }}>← Dashboard</button>
    </div>
  )

  return (
    <div style={{ height:'100vh', background:'#060608', color:'#f0f0f0', fontFamily:"'DM Sans','Inter',system-ui,sans-serif", display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(168,85,247,0.3);border-radius:2px}
        textarea{scrollbar-width:thin;scrollbar-color:rgba(168,85,247,0.3) transparent}
      `}</style>

      <AnimatePresence>
        {showFullPreview && previewUrl && <FullPreview url={previewUrl} onClose={() => setShowFullPreview(false)} />}
      </AnimatePresence>

      {/* TOP NAV */}
      <nav style={{ height:56, flexShrink:0, background:'rgba(6,6,8,0.96)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer', color:'rgba(255,255,255,0.5)', width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, transition:'all 0.2s', flexShrink:0 }}
            onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)' }}>←</button>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#34d399', boxShadow:'0 0 8px rgba(52,211,153,0.8)' }} />
            <span style={{ fontSize:14, fontWeight:700, color:'#fff', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {website?.title || 'Editor'}
            </span>
          </div>

          <div style={{ display:'flex', gap:4, marginLeft:4 }}>
            <button onClick={handleUndo} disabled={!versionHistory.canUndo} title="Undo (Ctrl+Z)"
              style={{ width:28, height:28, borderRadius:7, border:'1px solid rgba(255,255,255,0.07)', background:'transparent', color: versionHistory.canUndo ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.18)', cursor: versionHistory.canUndo ? 'pointer' : 'not-allowed', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
              onMouseEnter={e => { if (versionHistory.canUndo) e.currentTarget.style.background='rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent' }}>↩</button>
            <button onClick={handleRedo} disabled={!versionHistory.canRedo} title="Redo (Ctrl+Y)"
              style={{ width:28, height:28, borderRadius:7, border:'1px solid rgba(255,255,255,0.07)', background:'transparent', color: versionHistory.canRedo ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.18)', cursor: versionHistory.canRedo ? 'pointer' : 'not-allowed', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
              onMouseEnter={e => { if (versionHistory.canRedo) e.currentTarget.style.background='rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent' }}>↪</button>
            {versionHistory.total > 1 && (
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.22)', alignSelf:'center', marginLeft:2 }}>v{versionHistory.pointer + 1}/{versionHistory.total}</span>
            )}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)' }}>
            <span style={{ fontSize:12 }}>⚡</span>
            <span style={{ fontSize:13, fontWeight:700, color:'#fbbf24' }}>{userData?.credits ?? 0}</span>
          </div>

          {currentCode && (
            <>
              <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }} onClick={handleDownload}
                style={{ padding:'7px 14px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color='#fff'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.7)'}>↓ Export</motion.button>

              <motion.button
                whileHover={!deploying ? { scale:1.04, boxShadow:'0 0 28px rgba(52,211,153,0.5)' } : {}}
                whileTap={!deploying ? { scale:0.97 } : {}}
                onClick={handleDeploy}
                disabled={deploying}
                style={{ padding:'7px 16px', borderRadius:8, border:'none', background: deploying ? 'rgba(52,211,153,0.15)' : 'linear-gradient(135deg,#34d399,#059669)', color: deploying ? '#34d399' : '#fff', fontWeight:700, fontSize:12, cursor: deploying ? 'not-allowed' : 'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, boxShadow: deploying ? 'none' : '0 0 16px rgba(52,211,153,0.3)', transition:'all 0.2s' }}>
                {deploying
                  ? <><motion.span animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }} style={{ display:'inline-block', fontSize:14 }}>⟳</motion.span> Deploying…</>
                  : deployUrl ? '✓ Re-deploy' : '🚀 Deploy'
                }
              </motion.button>
            </>
          )}

          {previewUrl && (
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }} onClick={() => setShowFullPreview(true)}
              style={{ padding:'7px 14px', borderRadius:8, border:'1px solid rgba(168,85,247,0.35)', background:'rgba(168,85,247,0.08)', color:'#a855f7', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
              ⛶ Full Preview
            </motion.button>
          )}
        </div>
      </nav>

      {/* BODY */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* LEFT: CHAT PANEL */}
        <div style={{ width:370, flexShrink:0, height:'100%', display:'flex', flexDirection:'column', borderRight:'1px solid rgba(255,255,255,0.06)', background:'rgba(6,6,9,0.97)' }}>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={{ margin:'10px 12px 0', padding:'10px 12px', borderRadius:10, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', fontSize:12, color:'#f87171', display:'flex', gap:8, alignItems:'flex-start' }}>
                <span>⚠️</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontWeight:600 }}>Error</p>
                  <p style={{ margin:'2px 0 0', opacity:0.75, fontSize:11 }}>{error}</p>
                </div>
                <button onClick={() => setError('')} style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:16, lineHeight:1 }}>×</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin' }}>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}

            {isEditing && (
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                style={{ padding:'16px', margin:'8px 16px', borderRadius:16, background:'rgba(168,85,247,0.05)', border:'1px solid rgba(168,85,247,0.15)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                  <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
                    <svg width={52} height={52} style={{ transform:'rotate(-90deg)', display:'block' }}>
                      <circle cx={26} cy={26} r={22} fill="none" stroke="rgba(168,85,247,0.1)" strokeWidth={4} />
                      <motion.circle cx={26} cy={26} r={22} fill="none" stroke="url(#eg)" strokeWidth={4}
                        strokeLinecap="round" strokeDasharray={138.2}
                        animate={{ strokeDashoffset: 138.2 * (1 - realPct / 100) }}
                        transition={{ duration:0.4, ease:'easeOut' }} />
                      <defs><linearGradient id="eg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#a855f7"/><stop offset="100%" stopColor="#38bdf8"/></linearGradient></defs>
                    </svg>
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff' }}>{realPct}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:3 }}>Applying changes…</div>
                    <div style={{ fontSize:11, color: remaining < 4 ? '#4ade80' : '#a855f7' }}>
                      {remaining > 1 ? `~${Math.round(remaining)}s remaining` : 'Almost done…'}
                    </div>
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:12 }}>
                  {EDIT_STEPS.map((step, i) => {
                    const done = i < editStep, active = i === editStep
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:7, background: done ? 'rgba(168,85,247,0.08)' : active ? 'rgba(168,85,247,0.04)' : 'transparent', opacity: done ? 1 : active ? 0.9 : 0.2, transition:'all 0.35s' }}>
                        <div style={{ width:16, height:16, borderRadius:'50%', flexShrink:0, background: done ? 'linear-gradient(135deg,#a855f7,#38bdf8)' : 'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'#fff' }}>
                          {done ? '✓' : active ? <motion.span animate={{ opacity:[1,.2,1] }} transition={{ duration:1, repeat:Infinity }}>·</motion.span> : i+1}
                        </div>
                        <span style={{ fontSize:11.5, color: done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)' }}>{step}</span>
                      </div>
                    )
                  })}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={tipIndex} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}
                    style={{ padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', fontSize:11, color:'rgba(255,255,255,0.32)', lineHeight:1.65 }}>
                    {TIPS[tipIndex]}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {!isEditing && (
            <div style={{ padding:'8px 12px 0', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, maxHeight:74, overflow:'hidden' }}>
                {QUICK_EDITS.map((q, i) => (
                  <button key={i} onClick={() => setInput(q.prompt)}
                    style={{ padding:'5px 10px', borderRadius:20, border:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.025)', color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', whiteSpace:'nowrap' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(168,85,247,0.4)'; e.currentTarget.style.color='#a855f7'; e.currentTarget.style.background='rgba(168,85,247,0.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.4)'; e.currentTarget.style.background='rgba(255,255,255,0.025)' }}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding:'8px 12px 12px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ background:'rgba(255,255,255,0.025)', border:`1px solid ${input ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.08)'}`, borderRadius:14, padding:'10px 12px', transition:'all 0.2s', boxShadow: input ? '0 0 0 3px rgba(168,85,247,0.06)' : 'none' }}>
              <textarea ref={inputRef} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend() }}
                placeholder="Describe what to change… (⌘+Enter to send)"
                disabled={isEditing}
                style={{ width:'100%', background:'transparent', border:'none', outline:'none', color:'#fff', fontSize:13, lineHeight:1.65, resize:'none', minHeight:64, maxHeight:120, fontFamily:'inherit', boxSizing:'border-box', opacity: isEditing ? 0.5 : 1 }} />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
                <span style={{ fontSize:10.5, color:'rgba(255,255,255,0.2)' }}>50 credits · {userData?.credits ?? 0} left · ⌘↵ send</span>
                <motion.button onClick={handleSend} disabled={!input.trim() || isEditing}
                  whileHover={input.trim() && !isEditing ? { scale:1.05 } : {}}
                  whileTap={input.trim() && !isEditing ? { scale:0.96 } : {}}
                  style={{ padding:'7px 16px', borderRadius:9, border:'none', background: input.trim() && !isEditing ? 'linear-gradient(135deg,#a855f7,#38bdf8)' : 'rgba(255,255,255,0.05)', color: input.trim() && !isEditing ? '#fff' : 'rgba(255,255,255,0.2)', fontWeight:700, fontSize:12.5, fontFamily:'inherit', cursor: input.trim() && !isEditing ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:6, transition:'all 0.2s', boxShadow: input.trim() && !isEditing ? '0 0 18px rgba(168,85,247,0.35)' : 'none' }}>
                  {isEditing
                    ? <><motion.span animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }} style={{ display:'inline-block', fontSize:14 }}>⟳</motion.span> Editing…</>
                    : <>Send ↑</>}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: PREVIEW / CODE PANEL */}
        <div style={{ flex:1, height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, position:'relative' }}>

          {!previewUrl && (
            <div style={{ position:'absolute', inset:0, zIndex:0 }}><ParticleBg /></div>
          )}

          <div style={{ height:46, flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', padding:'0 14px', gap:4, background:'rgba(8,8,12,0.9)', backdropFilter:'blur(16px)', zIndex:2, position:'relative' }}>
            {['preview','code'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding:'5px 13px', borderRadius:7, border:'none', cursor:'pointer', background: activeTab === tab ? 'rgba(168,85,247,0.12)' : 'transparent', color: activeTab === tab ? '#a855f7' : 'rgba(255,255,255,0.35)', fontSize:12.5, fontWeight:500, fontFamily:'inherit', transition:'all 0.15s' }}>
                {tab === 'preview' ? '🖥 Preview' : '‹/› Code'}
              </button>
            ))}

            {activeTab === 'preview' && previewUrl && (
              <>
                <div style={{ width:1, height:20, background:'rgba(255,255,255,0.08)', margin:'0 6px' }} />
                {DEVICES.map(d => (
                  <button key={d.id} onClick={() => setDevice(d.id)} title={d.label}
                    style={{ padding:'5px 10px', borderRadius:7, border:'none', cursor:'pointer', background: device === d.id ? 'rgba(168,85,247,0.12)' : 'transparent', color: device === d.id ? '#a855f7' : 'rgba(255,255,255,0.3)', fontSize:14, fontFamily:'inherit', transition:'all 0.15s', display:'flex', alignItems:'center', gap:4 }}>
                    {d.icon}
                    {device === d.id && <span style={{ fontSize:10.5, fontWeight:600 }}>{d.label}</span>}
                  </button>
                ))}
                <div style={{ width:1, height:20, background:'rgba(255,255,255,0.08)', margin:'0 6px' }} />
                <button onClick={() => setShowFullPreview(true)}
                  style={{ padding:'5px 12px', borderRadius:7, border:'1px solid rgba(168,85,247,0.3)', background:'rgba(168,85,247,0.07)', color:'#a855f7', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  ⛶ Full Page
                </button>
              </>
            )}

            {isEditing && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.25)' }}>
                <motion.div animate={{ opacity:[1,.3,1] }} transition={{ duration:1.2, repeat:Infinity }}
                  style={{ width:6, height:6, borderRadius:'50%', background:'#a855f7' }} />
                <span style={{ fontSize:11, color:'#a855f7', fontWeight:600 }}>AI editing…</span>
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div style={{ flex:1, overflow:'hidden', position:'relative', zIndex:1, display:'flex', alignItems: !previewUrl && activeTab === 'preview' ? 'center' : 'stretch', justifyContent: !previewUrl && activeTab === 'preview' ? 'center' : 'stretch' }}>

            {/* PREVIEW TAB */}
            {activeTab === 'preview' && (
              previewUrl ? (
                <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', background: device !== 'desktop' ? 'rgba(4,4,8,0.8)' : 'transparent', padding: device !== 'desktop' ? '16px 0 0' : 0, transition:'all 0.3s' }}>
                  <div style={{ position:'relative', width: DEVICES.find(d => d.id === device)?.width, height: device !== 'desktop' ? 'calc(100% - 16px)' : '100%', maxHeight:'100%', transition:'all 0.3s ease', borderRadius: device !== 'desktop' ? '12px 12px 0 0' : 0, overflow:'hidden', boxShadow: device !== 'desktop' ? '0 -4px 40px rgba(0,0,0,0.6)' : 'none', border: device !== 'desktop' ? '1px solid rgba(255,255,255,0.1)' : 'none', borderBottom:'none', display:'flex', flexDirection:'column' }}>
                    {device !== 'desktop' && (
                      <div style={{ height:32, flexShrink:0, background:'rgba(12,12,20,0.98)', display:'flex', alignItems:'center', justifyContent:'center', gap:8, borderBottom:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px 12px 0 0', position:'sticky', top:0, zIndex:10 }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.15)' }} />
                        <div style={{ width:60, height:6, borderRadius:3, background:'rgba(255,255,255,0.08)' }} />
                        <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.15)' }} />
                      </div>
                    )}
                    <div style={{ flex:1, position:'relative', overflow: device !== 'desktop' ? 'auto' : 'hidden', WebkitOverflowScrolling:'touch', overscrollBehavior:'contain' }}>
                      <iframe
                        key={`${previewUrl}-${device}`}
                        src={previewUrl}
                        style={{ width:'100%', height: device === 'desktop' ? '100%' : 'auto', minHeight: device !== 'desktop' ? '100vh' : undefined, border:'none', background:'white', display:'block' }}
                        title="Website Preview"
                        scrolling={device !== 'desktop' ? 'yes' : 'no'}
                        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin allow-pointer-lock"
                      />
                      {!isEditing && device === 'desktop' && (
                        <div
                          onClick={() => setShowFullPreview(true)}
                          style={{ position:'absolute', inset:0, display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom:20, background:'linear-gradient(to top, rgba(5,5,10,0.6) 0%, transparent 28%)', cursor:'pointer', zIndex:2, opacity:0, transition:'opacity 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.opacity='1'}
                          onMouseLeave={e => e.currentTarget.style.opacity='0'}>
                          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:99, background:'rgba(8,8,16,0.92)', border:'1px solid rgba(168,85,247,0.4)', backdropFilter:'blur(14px)', color:'#a855f7', fontSize:12.5, fontWeight:600 }}>
                            ⛶ Open full-page preview
                          </div>
                        </div>
                      )}
                      {isEditing && (
                        <div style={{ position:'absolute', inset:0, background:'rgba(6,6,12,0.65)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5 }}>
                          <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} style={{ textAlign:'center', padding:28 }}>
                            <motion.div animate={{ rotate:360 }} transition={{ duration:1.5, repeat:Infinity, ease:'linear' }} style={{ width:44, height:44, borderRadius:'50%', border:'3px solid rgba(168,85,247,0.2)', borderTopColor:'#a855f7', margin:'0 auto 14px' }} />
                            <p style={{ color:'rgba(255,255,255,0.8)', fontSize:14, fontWeight:600, margin:'0 0 4px' }}>Applying your changes…</p>
                            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:12, margin:0 }}>{EDIT_STEPS[Math.min(editStep, EDIT_STEPS.length-1)]}</p>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', maxWidth:400, padding:24, position:'relative', zIndex:2 }}>
                  <div style={{ width:80, height:80, borderRadius:24, background:'linear-gradient(135deg,rgba(168,85,247,0.2),rgba(56,189,248,0.12))', border:'1px solid rgba(168,85,247,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:34, boxShadow:'0 0 60px rgba(168,85,247,0.18)' }}>🌐</div>
                  <p style={{ color:'rgba(255,255,255,0.5)', fontSize:15 }}>Loading preview…</p>
                </motion.div>
              )
            )}

            {/* CODE TAB */}
            {activeTab === 'code' && (
              <div style={{ height:'100%', width:'100%', overflow:'hidden' }}>
                {currentCode
                  ? <CodeViewer code={currentCode} onCodeChange={handleDirectEdit} />
                  : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'rgba(255,255,255,0.3)', fontSize:14 }}>No code loaded</div>
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DEPLOY SUCCESS MODAL */}
      <AnimatePresence>
        {showDeployModal && deployUrl && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
            onClick={() => setShowDeployModal(false)}>
            <motion.div
              initial={{ scale:0.88, opacity:0, y:24 }}
              animate={{ scale:1, opacity:1, y:0 }}
              exit={{ scale:0.92, opacity:0, y:12 }}
              transition={{ type:'spring', stiffness:260, damping:22 }}
              onClick={e => e.stopPropagation()}
              style={{ background:'rgba(8,8,18,0.99)', border:'1px solid rgba(52,211,153,0.28)', borderRadius:28, padding:36, maxWidth:440, width:'100%', boxShadow:'0 40px 100px rgba(0,0,0,0.85), 0 0 80px rgba(52,211,153,0.08)' }}>

              <motion.div
                initial={{ scale:0, rotate:-20 }}
                animate={{ scale:1, rotate:0 }}
                transition={{ delay:0.08, type:'spring', stiffness:280 }}
                style={{ width:64, height:64, borderRadius:20, background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.28)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:22, fontSize:32 }}>
                🚀
              </motion.div>

              <motion.h3 initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}
                style={{ margin:'0 0 8px', fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>
                Your site is live! 🎉
              </motion.h3>
              <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.16 }}
                style={{ margin:'0 0 24px', fontSize:13.5, color:'rgba(255,255,255,0.42)', lineHeight:1.7 }}>
                Deployment successful — your website is now publicly accessible on the internet.
              </motion.p>

              <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
                style={{ padding:'14px 16px', borderRadius:14, background:'rgba(52,211,153,0.05)', border:'1px solid rgba(52,211,153,0.18)', marginBottom:24, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#34d399', boxShadow:'0 0 10px rgba(52,211,153,0.9)', flexShrink:0 }} />
                <span style={{ fontSize:12.5, color:'#34d399', fontWeight:600, fontFamily:'monospace', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {deployUrl}
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(deployUrl); setDeployCopied(true); setTimeout(() => setDeployCopied(false), 2000) }}
                  style={{ background: deployCopied ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.25)', borderRadius:8, padding:'5px 12px', color: deployCopied ? '#4ade80' : '#34d399', fontSize:11.5, fontWeight:700, cursor:'pointer', flexShrink:0, fontFamily:'inherit', transition:'all 0.2s' }}>
                  {deployCopied ? '✓ Copied' : 'Copy'}
                </button>
              </motion.div>

              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.24 }}
                style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowDeployModal(false)}
                  style={{ flex:1, padding:'12px 0', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.55)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(255,255,255,0.8)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.55)' }}>
                  Close
                </button>
                <button onClick={() => window.open(deployUrl, '_blank')}
                  style={{ flex:2, padding:'12px 0', borderRadius:12, border:'none', background:'linear-gradient(135deg,#34d399,#059669)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 20px rgba(52,211,153,0.35)', transition:'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow='0 6px 28px rgba(52,211,153,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow='0 4px 20px rgba(52,211,153,0.35)'}>
                  Open Live Site →
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
