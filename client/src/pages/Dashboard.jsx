import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUserData } from "../redux/userSlice";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { serverUrl } from "../App";
import axios from "axios";

/* ══════════════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════════════ */
function useOutsideClick(ref, cb) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
}

/* ══════════════════════════════════════════════════════════════════════════════
   SMART AVATAR
══════════════════════════════════════════════════════════════════════════════ */
function SmartAvatar({ name, avatar, size = 34 }) {
  const femaleNames = ["sarah","priya","anita","neha","pooja","sunita","kavita","rina","sita","maya","leela","meera","divya","anjali","sneha","nisha","ritu","komal","sonal","heena","aisha","fatima","amelia","emma","olivia","sophia","isabella","mia","charlotte","ava","emily","abigail","madison","lily","chloe","aria"];
  const isFemale = femaleNames.some((n) => name?.toLowerCase().includes(n));
  const initial = name?.charAt(0).toUpperCase() || "U";
  const bg = isFemale ? "linear-gradient(135deg,#f472b6,#e879f9)" : "linear-gradient(135deg,#818cf8,#38bdf8)";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden" }}>
      {avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PANDA LOGO
══════════════════════════════════════════════════════════════════════════════ */
function PandaLogo({ size = 32 }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <defs><radialGradient id="pg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="transparent" /></radialGradient></defs>
        <circle cx="20" cy="20" r="19" fill="url(#pg)" opacity="0.3" />
        <circle cx="20" cy="20" r="16" fill="#1a1a2e" stroke="rgba(129,140,248,0.6)" strokeWidth="1" />
        <circle cx="10" cy="11" r="5" fill="#111" /><circle cx="30" cy="11" r="5" fill="#111" />
        <circle cx="10" cy="11" r="2.5" fill="#222" /><circle cx="30" cy="11" r="2.5" fill="#222" />
        <ellipse cx="14.5" cy="20" rx="5" ry="5.5" fill="#111" /><ellipse cx="25.5" cy="20" rx="5" ry="5.5" fill="#111" />
        <circle cx="14.5" cy="20" r="2.5" fill="#818cf8" opacity="0.9" /><circle cx="25.5" cy="20" r="2.5" fill="#38bdf8" opacity="0.9" />
        <circle cx="15" cy="19.5" r="1" fill="#fff" opacity="0.9" /><circle cx="26" cy="19.5" r="1" fill="#fff" opacity="0.9" />
        <ellipse cx="20" cy="25" rx="2" ry="1.2" fill="#555" />
        <path d="M17.5 27 Q20 29 22.5 27" stroke="#666" strokeWidth="0.8" fill="none" strokeLinecap="round" />
        <path d="M17 13 L20 11 L23 13" stroke="rgba(129,140,248,0.4)" strokeWidth="0.7" fill="none" />
        <circle cx="20" cy="11" r="0.8" fill="#818cf8" opacity="0.6" />
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   HERO PANDA POSTER
══════════════════════════════════════════════════════════════════════════════ */
function PandaAgentPoster() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 60); return () => clearInterval(id); }, []);
  const t = tick * 0.02;
  const particles = Array.from({ length: 18 }, (_, i) => ({ x: 15 + ((i * 37 + 11) % 70), y: 10 + ((i * 53 + 7) % 80), r: 1.2 + (i % 3) * 0.8, speed: 0.5 + (i % 5) * 0.3, phase: i * 0.7 }));
  const orbits = [{ rx: 38, ry: 12, icon: "⚡", color: "#818cf8", speed: 0.4, phase: 0 }, { rx: 52, ry: 17, icon: "◈", color: "#34d399", speed: -0.27, phase: 1.5 }, { rx: 44, ry: 14, icon: "✦", color: "#38bdf8", speed: 0.6, phase: 3.1 }];
  return (
    <svg viewBox="0 0 520 380" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="bgG" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor="rgba(129,140,248,0.08)" /><stop offset="100%" stopColor="rgba(0,0,0,0)" /></radialGradient>
        <radialGradient id="pbG" cx="40%" cy="35%" r="65%"><stop offset="0%" stopColor="#2a2a4a" /><stop offset="100%" stopColor="#111122" /></radialGradient>
        <radialGradient id="elL" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="rgba(129,140,248,0)" /></radialGradient>
        <radialGradient id="elR" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="rgba(56,189,248,0)" /></radialGradient>
        <filter id="gp"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="sl" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="transparent" /><stop offset="50%" stopColor="#818cf8" /><stop offset="100%" stopColor="transparent" /></linearGradient>
      </defs>
      <ellipse cx="260" cy="190" rx="200" ry="160" fill="url(#bgG)" />
      {particles.map((p, i) => (<circle key={i} cx={p.x * 5.2 + Math.sin(t * p.speed + p.phase) * 6} cy={p.y * 3.8 + Math.cos(t * p.speed + p.phase) * 4} r={p.r} fill={i % 3 === 0 ? "#818cf8" : i % 3 === 1 ? "#38bdf8" : "#34d399"} opacity={0.3 + Math.sin(t + p.phase) * 0.2} />))}
      <ellipse cx="260" cy="200" rx="130" ry="42" fill="none" stroke="rgba(129,140,248,0.08)" strokeWidth="1" />
      <ellipse cx="260" cy="200" rx="160" ry="55" fill="none" stroke="rgba(56,189,248,0.06)" strokeWidth="1" />
      {orbits.map((o, i) => { const a = t * o.speed + o.phase; const ox = 260 + o.rx * Math.cos(a) * 2.2; const oy = 200 + o.ry * Math.sin(a); const sc = 0.75 + 0.25 * (Math.sin(a) + 1) / 2; return (<g key={i} transform={`translate(${ox},${oy}) scale(${sc})`}><circle cx="0" cy="0" r="14" fill={`${o.color}18`} stroke={`${o.color}40`} strokeWidth="1" /><text x="0" y="5" textAnchor="middle" fontSize="13" fill={o.color} opacity={0.7 + sc * 0.3}>{o.icon}</text></g>); })}
      <g transform={`translate(${260 + Math.sin(t * 0.5) * 4},${190 + Math.sin(t * 0.3) * 5})`}>
        <ellipse cx="0" cy="98" rx="58" ry="10" fill="rgba(0,0,0,0.35)" />
        <ellipse cx="0" cy="55" rx="48" ry="52" fill="url(#pbG)" />
        <circle cx="-34" cy="-36" r="20" fill="#111" /><circle cx="34" cy="-36" r="20" fill="#111" />
        <circle cx="-34" cy="-36" r="10" fill="#1a1a1a" /><circle cx="34" cy="-36" r="10" fill="#1a1a1a" />
        <circle cx="0" cy="-10" r="52" fill="url(#pbG)" />
        <ellipse cx="-18" cy="-12" rx="17" ry="18" fill="#0d0d1a" /><ellipse cx="18" cy="-12" rx="17" ry="18" fill="#0d0d1a" />
        <ellipse cx="-18" cy="-12" rx="17" ry="18" fill="url(#elL)" opacity={0.3 + Math.sin(t * 2) * 0.1} filter="url(#gp)" />
        <ellipse cx="18" cy="-12" rx="17" ry="18" fill="url(#elR)" opacity={0.3 + Math.cos(t * 2) * 0.1} filter="url(#gp)" />
        <circle cx="-18" cy="-12" r="9" fill="#818cf8" opacity="0.95" filter="url(#gp)" /><circle cx="18" cy="-12" r="9" fill="#38bdf8" opacity="0.95" filter="url(#gp)" />
        <circle cx="-18" cy="-12" r="6" fill="#5b5bd6" /><circle cx="18" cy="-12" r="6" fill="#1a8fc4" />
        <circle cx="-18" cy="-12" r="3.5" fill="#1a1a2e" /><circle cx="18" cy="-12" r="3.5" fill="#1a1a2e" />
        <circle cx={-16 + Math.sin(t * 0.8) * 1.5} cy={-14 + Math.cos(t * 0.6) * 1} r="1.8" fill="#fff" opacity="0.9" />
        <circle cx={20 + Math.sin(t * 0.8 + 1) * 1.5} cy={-14 + Math.cos(t * 0.6 + 1) * 1} r="1.8" fill="#fff" opacity="0.9" />
        <ellipse cx="0" cy="8" rx="7" ry="4.5" fill="#1a1a2e" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <circle cx="-3" cy="9" r="1.5" fill="#000" /><circle cx="3" cy="9" r="1.5" fill="#000" />
        <path d="M-8 17 Q0 23 8 17" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <ellipse cx="-38" cy="82" rx="16" ry="10" fill="#111" /><ellipse cx="38" cy="82" rx="16" ry="10" fill="#111" />
        <g transform={`translate(0,${-72 + Math.sin(t * 0.8) * 4})`}>
          <rect x="-28" y="-10" width="56" height="20" rx="10" fill="rgba(129,140,248,0.15)" stroke="rgba(129,140,248,0.35)" strokeWidth="0.8" />
          <text x="0" y="5" textAnchor="middle" fontSize="9" fill="#a5b4fc" fontWeight="700" letterSpacing="1.5" fontFamily="monospace">AI AGENT</text>
        </g>
      </g>
      <rect x="0" y={180 + Math.sin(t * 0.4) * 60} width="520" height="2" fill="url(#sl)" opacity="0.04" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   QUICK-ACTION POSTER BACKGROUNDS
══════════════════════════════════════════════════════════════════════════════ */
function NewWebsitePoster() {
  const [t, setT] = useState(0);
  useEffect(() => { const id = setInterval(() => setT(v => v + 1), 50); return () => clearInterval(id); }, []);
  const k = t * 0.025;
  return (
    <svg viewBox="0 0 300 160" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs><radialGradient id="nwB" cx="30%" cy="40%" r="70%"><stop offset="0%" stopColor="rgba(129,140,248,0.22)" /><stop offset="100%" stopColor="rgba(129,140,248,0)" /></radialGradient></defs>
      <rect width="300" height="160" fill="url(#nwB)" />
      {[0,1,2,3,4,5].map(i => (<line key={i} x1={i*50} y1="0" x2={i*50} y2="160" stroke="rgba(129,140,248,0.07)" strokeWidth="1" />))}
      {[0,1,2,3].map(i => (<line key={i} x1="0" y1={i*40} x2="300" y2={i*40} stroke="rgba(129,140,248,0.07)" strokeWidth="1" />))}
      {[0,1,2].map(i => { const a = k*(0.6+i*0.3)+i*2.1; const rx=55+i*20,ry=28+i*10; return <circle key={i} cx={70+rx*Math.cos(a)} cy={80+ry*Math.sin(a)} r={3-i*0.5} fill="#818cf8" opacity={0.5-i*0.1} />; })}
      <g transform="translate(70,80)">
        <circle cx="0" cy="0" r={18+Math.sin(k*2)*3} fill="rgba(129,140,248,0.1)" stroke="rgba(129,140,248,0.3)" strokeWidth="1" />
        <text x="0" y="8" textAnchor="middle" fontSize="22" fill="#818cf8" opacity="0.85">✦</text>
      </g>
      {[0,1,2,3].map(i => (<rect key={i} x={160+i*28} y={30+i*22} width={60-i*10} height="6" rx="3" fill="rgba(129,140,248,0.12)" stroke="rgba(129,140,248,0.22)" strokeWidth="0.5" opacity={0.5+Math.sin(k+i)*0.3} />))}
    </svg>
  );
}
function TemplatesPoster() {
  const [t, setT] = useState(0);
  useEffect(() => { const id = setInterval(() => setT(v => v + 1), 55); return () => clearInterval(id); }, []);
  const k = t * 0.022;
  const cards = [{x:30,y:25,w:60,h:42,d:0},{x:105,y:55,w:55,h:38,d:.8},{x:175,y:20,w:65,h:45,d:1.6},{x:50,y:90,w:50,h:36,d:2.4},{x:200,y:88,w:60,h:40,d:3.2}];
  return (
    <svg viewBox="0 0 300 160" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs><radialGradient id="tpB" cx="50%" cy="60%" r="65%"><stop offset="0%" stopColor="rgba(52,211,153,0.18)" /><stop offset="100%" stopColor="rgba(52,211,153,0)" /></radialGradient></defs>
      <rect width="300" height="160" fill="url(#tpB)" />
      {cards.map((c,i) => (<g key={i} transform={`translate(0,${Math.sin(k*0.7+c.d)*4})`}><rect x={c.x} y={c.y} width={c.w} height={c.h} rx="5" fill="rgba(52,211,153,0.07)" stroke="rgba(52,211,153,0.22)" strokeWidth="0.8" /><rect x={c.x+5} y={c.y+5} width={c.w-10} height="5" rx="2" fill="rgba(52,211,153,0.22)" /><rect x={c.x+5} y={c.y+14} width={c.w-18} height="3" rx="1.5" fill="rgba(52,211,153,0.12)" /></g>))}
      {[0,1,2,3,4].map(i => (<circle key={i} cx={20+i*60} cy={140-i*12} r="2" fill="#34d399" opacity={0.3+Math.sin(k*1.2+i)*0.25} />))}
    </svg>
  );
}
function ImportHTMLPoster() {
  const [t, setT] = useState(0);
  useEffect(() => { const id = setInterval(() => setT(v => v + 1), 50); return () => clearInterval(id); }, []);
  const k = t * 0.028;
  const lines = [{w:80,i:0},{w:60,i:16},{w:90,i:24},{w:50,i:24},{w:70,i:16},{w:45,i:8},{w:75,i:0}];
  return (
    <svg viewBox="0 0 300 160" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs><radialGradient id="htB" cx="70%" cy="40%" r="60%"><stop offset="0%" stopColor="rgba(56,189,248,0.18)" /><stop offset="100%" stopColor="rgba(56,189,248,0)" /></radialGradient></defs>
      <rect width="300" height="160" fill="url(#htB)" />
      {lines.map((l,i) => { const p=(k*0.5-i*0.15)%1; return (<g key={i}><rect x={120+l.i} y={18+i*19} width={l.w} height="7" rx="3.5" fill="rgba(56,189,248,0.12)" stroke="rgba(56,189,248,0.18)" strokeWidth="0.5" /><rect x={120+l.i+p*l.w} y={18+i*19} width="12" height="7" rx="3.5" fill="rgba(56,189,248,0.32)" opacity={Math.sin(k+i)>0?0.6:0} /></g>); })}
      <g transform="translate(65,80)"><circle cx="0" cy="0" r={22+Math.sin(k*1.5)*3} fill="rgba(56,189,248,0.07)" stroke="rgba(56,189,248,0.22)" strokeWidth="1" /><text x="-12" y="7" fontSize="20" fill="#38bdf8" opacity="0.9" fontFamily="monospace">{"‹›"}</text></g>
    </svg>
  );
}
function ClonePoster() {
  const [t, setT] = useState(0);
  useEffect(() => { const id = setInterval(() => setT(v => v + 1), 55); return () => clearInterval(id); }, []);
  const k = t * 0.024;
  return (
    <svg viewBox="0 0 300 160" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs><radialGradient id="clB" cx="60%" cy="50%" r="65%"><stop offset="0%" stopColor="rgba(244,114,182,0.17)" /><stop offset="100%" stopColor="rgba(244,114,182,0)" /></radialGradient></defs>
      <rect width="300" height="160" fill="url(#clB)" />
      <g transform={`translate(${30+Math.sin(k*0.5)*3},${50+Math.cos(k*0.4)*3})`}><rect x="0" y="0" width="80" height="60" rx="8" fill="rgba(244,114,182,0.1)" stroke="rgba(244,114,182,0.32)" strokeWidth="1" /><rect x="6" y="8" width="68" height="8" rx="3" fill="rgba(244,114,182,0.22)" /><rect x="6" y="22" width="50" height="4" rx="2" fill="rgba(244,114,182,0.12)" /></g>
      <g transform="translate(140,80)"><circle cx="0" cy="0" r={16+Math.sin(k*2)*2} fill="rgba(244,114,182,0.09)" stroke="rgba(244,114,182,0.27)" strokeWidth="1" /><text x="-6" y="5" fontSize="14" fill="#f472b6" opacity="0.9">⎘</text></g>
      {[1,0].map(o => (<g key={o} transform={`translate(${190+o*6+Math.sin(k*0.5+1)*3},${44+o*6})`}><rect x="0" y="0" width="80" height="60" rx="8" fill={`rgba(244,114,182,${0.06+(1-o)*0.05})`} stroke={`rgba(244,114,182,${0.15+(1-o)*0.15})`} strokeWidth="1" />{o===0&&<><rect x="6" y="8" width="68" height="8" rx="3" fill="rgba(244,114,182,0.22)" /><rect x="6" y="22" width="50" height="4" rx="2" fill="rgba(244,114,182,0.12)" /></>}</g>))}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   QUICK ACTION ICONS
══════════════════════════════════════════════════════════════════════════════ */
function IconNewWebsite() {
  return (<svg width="24" height="24" viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="11" stroke="#818cf8" strokeWidth="1.5" opacity="0.4" /><circle cx="13" cy="13" r="7" stroke="#818cf8" strokeWidth="1.2" opacity="0.6" /><line x1="13" y1="2" x2="13" y2="24" stroke="#818cf8" strokeWidth="1" opacity="0.35" /><line x1="2" y1="13" x2="24" y2="13" stroke="#818cf8" strokeWidth="1" opacity="0.35" /><circle cx="13" cy="13" r="3" fill="#818cf8" opacity="0.9" /></svg>);
}
function IconTemplates() {
  return (<svg width="24" height="24" viewBox="0 0 26 26" fill="none"><rect x="2" y="2" width="10" height="10" rx="2.5" stroke="#34d399" strokeWidth="1.4" opacity="0.7" /><rect x="14" y="2" width="10" height="4" rx="2" stroke="#34d399" strokeWidth="1.2" opacity="0.5" /><rect x="14" y="8" width="10" height="4" rx="2" stroke="#34d399" strokeWidth="1.2" opacity="0.5" /><rect x="2" y="14" width="22" height="4" rx="2" stroke="#34d399" strokeWidth="1.2" opacity="0.5" /><rect x="2" y="20" width="14" height="4" rx="2" stroke="#34d399" strokeWidth="1.2" opacity="0.4" /><circle cx="7" cy="7" r="2.5" fill="#34d399" opacity="0.7" /></svg>);
}
function IconImportHTML() {
  return (<svg width="24" height="24" viewBox="0 0 26 26" fill="none"><path d="M8 8 L2 13 L8 18" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" /><path d="M18 8 L24 13 L18 18" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" /><path d="M15 4 L11 22" stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" /></svg>);
}
function IconClone() {
  return (<svg width="24" height="24" viewBox="0 0 26 26" fill="none"><rect x="2" y="8" width="14" height="16" rx="2.5" stroke="#f472b6" strokeWidth="1.4" opacity="0.65" /><rect x="10" y="2" width="14" height="16" rx="2.5" stroke="#f472b6" strokeWidth="1.4" opacity="0.4" fill="rgba(244,114,182,0.04)" /><path d="M6 16 L10 20 L16 13" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" /></svg>);
}

/* ══════════════════════════════════════════════════════════════════════════════
   HOW IT WORKS SECTION (unchanged from original)
══════════════════════════════════════════════════════════════════════════════ */
function StepLogoDescribe({ size = 64 }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 50); return () => clearInterval(id); }, []);
  const t = tick * 0.04;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs><radialGradient id="sl1b" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(129,140,248,0.3)"/><stop offset="100%" stopColor="rgba(129,140,248,0)"/></radialGradient><filter id="sl1g"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="32" cy="32" r={28+Math.sin(t*1.5)*2} fill="url(#sl1b)"/>
      <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(129,140,248,0.22)" strokeWidth="1" strokeDasharray="4 3" strokeDashoffset={-tick*0.3}/>
      <rect x="12" y="14" width="36" height="26" rx="8" fill="rgba(129,140,248,0.16)" stroke="#818cf8" strokeWidth="1.5"/>
      <path d="M18 40 L14 48 L26 42" fill="rgba(129,140,248,0.16)" stroke="#818cf8" strokeWidth="1.5" strokeLinejoin="round"/>
      {[0,1,2].map(i=>(<rect key={i} x="17" y={20+i*6} width={i===2?16:26} height="3.5" rx="1.75" fill="#818cf8" opacity={0.5+Math.sin(t+i*0.8)*0.2}/>))}
      <rect x="44" y="20" width="2" height="10" rx="1" fill="#a5b4fc" opacity={Math.sin(t*4)>0?0.9:0.1} filter="url(#sl1g)"/>
    </svg>
  );
}
function StepLogoGenerate({ size = 64 }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 48); return () => clearInterval(id); }, []);
  const t = tick * 0.038;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs><radialGradient id="sl2b" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(52,211,153,0.3)"/><stop offset="100%" stopColor="rgba(52,211,153,0)"/></radialGradient><filter id="sl2g"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="32" cy="32" r={28+Math.sin(t)*1.5} fill="url(#sl2b)"/>
      <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(52,211,153,0.22)" strokeWidth="1"/>
      {Array.from({length:8}).map((_,i)=>{ const a=(i/8)*Math.PI*2+t*0.4; const p=(Math.sin(t*2+i)+1)/2; return(<line key={i} x1={32+Math.cos(a)*10} y1={32+Math.sin(a)*10} x2={32+Math.cos(a)*(18+p*6)} y2={32+Math.sin(a)*(18+p*6)} stroke="#34d399" strokeWidth={1+p*0.8} opacity={0.3+p*0.5}/>); })}
      <rect x="22" y="22" width="20" height="20" rx="4" fill="rgba(52,211,153,0.22)" stroke="#34d399" strokeWidth="1.5"/>
      <circle cx="32" cy="32" r={4+Math.sin(t*2)*1.5} fill="#34d399" opacity="0.8" filter="url(#sl2g)"/>
    </svg>
  );
}
function StepLogoDeploy({ size = 64 }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 50); return () => clearInterval(id); }, []);
  const t = tick * 0.04;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs><radialGradient id="sl3b" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(56,189,248,0.3)"/><stop offset="100%" stopColor="rgba(56,189,248,0)"/></radialGradient><filter id="sl3g"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="32" cy="32" r={28+Math.sin(t)*1.5} fill="url(#sl3b)"/>
      <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(56,189,248,0.22)" strokeWidth="1" strokeDasharray="3 3" strokeDashoffset={tick*0.25}/>
      <circle cx="32" cy="32" r="16" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="1.5"/>
      <ellipse cx="32" cy="32" rx="16" ry="7" fill="none" stroke="rgba(56,189,248,0.3)" strokeWidth="0.8"/>
      <g transform={`translate(${32+Math.sin(t*0.8)*3},${32-Math.cos(t*0.8)*3}) rotate(${-40+Math.sin(t*0.5)*5})`}>
        <ellipse cx="0" cy="0" rx="4" ry="9" fill="#38bdf8" opacity="0.85"/>
        <path d="M-4 -5 Q0 -14 4 -5" fill="#818cf8" opacity="0.9"/>
        <circle cx="0" cy="-1" r="2" fill="rgba(255,255,255,0.3)"/>
        <ellipse cx="0" cy={13+Math.sin(t*5)*2} rx="2.5" ry={5+Math.sin(t*4)*2} fill="#fbbf24" opacity={0.7+Math.sin(t*4)*0.2} filter="url(#sl3g)"/>
      </g>
      <circle cx="46" cy="18" r="2.5" fill="#34d399" opacity="0.9" filter="url(#sl3g)"/>
    </svg>
  );
}

function DescribePosterBg() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 55); return () => clearInterval(id); }, []);
  const t = tick * 0.018;
  const chars = "Build me a modern SaaS landing page...";
  const vl = Math.floor((Math.sin(t * 0.4) * 0.5 + 0.5) * chars.length);
  return (
    <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
      <defs><radialGradient id="dBg" cx="40%" cy="50%" r="70%"><stop offset="0%" stopColor="rgba(129,140,248,0.18)"/><stop offset="100%" stopColor="rgba(129,140,248,0)"/></radialGradient></defs>
      <rect width="420" height="220" fill="url(#dBg)"/>
      {[0,1,2,3,4,5,6,7,8].map(i=>(<line key={i} x1={i*52} y1="0" x2={i*52} y2="220" stroke="rgba(129,140,248,0.045)" strokeWidth="1"/>))}
      {[0,1,2,3,4].map(i=>(<line key={i} x1="0" y1={i*55} x2="420" y2={i*55} stroke="rgba(129,140,248,0.045)" strokeWidth="1"/>))}
      <rect x="28" y="60" width="280" height="76" rx="14" fill="rgba(129,140,248,0.09)" stroke="rgba(129,140,248,0.25)" strokeWidth="1.2"/>
      <text x="44" y="97" fontSize="10.5" fill="#a5b4fc" fontFamily="monospace" opacity="0.85">{chars.slice(0, vl)}</text>
      <rect x={44+vl*6.3} y="84" width="2" height="13" rx="1" fill="#818cf8" opacity={Math.sin(t*5)>0?0.9:0}/>
      <rect x="28" y="42" width="55" height="14" rx="7" fill="rgba(129,140,248,0.2)"/>
      <text x="55" y="53" textAnchor="middle" fontSize="8.5" fill="#a5b4fc" fontFamily="monospace" fontWeight="700">PROMPT</text>
    </svg>
  );
}
function GeneratePosterBg() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 50); return () => clearInterval(id); }, []);
  const t = tick * 0.022;
  const nodes = [{cx:55,cy:110,r:16,c:"#818cf8"},{cx:120,cy:65,r:13,c:"#38bdf8"},{cx:120,cy:155,r:13,c:"#34d399"},{cx:185,cy:45,r:10,c:"#f472b6"},{cx:185,cy:110,r:14,c:"#818cf8"},{cx:185,cy:175,r:10,c:"#38bdf8"}];
  const edges = [[0,1],[0,2],[1,3],[1,4],[2,4],[2,5]];
  return (
    <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
      <defs><radialGradient id="gBg" cx="35%" cy="50%" r="65%"><stop offset="0%" stopColor="rgba(52,211,153,0.15)"/><stop offset="100%" stopColor="rgba(52,211,153,0)"/></radialGradient><filter id="ggf"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <rect width="420" height="220" fill="url(#gBg)"/>
      {edges.map(([a,b],i)=>{ const na=nodes[a],nb=nodes[b]; const p=(Math.sin(t*1.5+i*0.7)+1)/2; return(<line key={i} x1={na.cx} y1={na.cy} x2={nb.cx} y2={nb.cy} stroke={na.c} strokeWidth={0.8+p*1.2} opacity={0.12+p*0.3}/>); })}
      {nodes.map((n,i)=>{ const p=(Math.sin(t*1.2+i*0.9)+1)/2; return(<g key={i} filter="url(#ggf)"><circle cx={n.cx} cy={n.cy} r={n.r+p*4} fill={n.c} opacity={0.06+p*0.07}/><circle cx={n.cx} cy={n.cy} r={n.r} fill={n.c} opacity={0.14+p*0.1} stroke={n.c} strokeWidth="1.2"/><circle cx={n.cx} cy={n.cy} r={n.r*0.45} fill={n.c} opacity={0.7+p*0.3}/></g>); })}
    </svg>
  );
}
function DeployPosterBg() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 50); return () => clearInterval(id); }, []);
  const t = tick * 0.024;
  return (
    <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
      <defs><radialGradient id="dpBg" cx="60%" cy="50%" r="65%"><stop offset="0%" stopColor="rgba(56,189,248,0.15)"/><stop offset="100%" stopColor="rgba(56,189,248,0)"/></radialGradient></defs>
      <rect width="420" height="220" fill="url(#dpBg)"/>
      <circle cx="285" cy="110" r="68" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.22)" strokeWidth="1.5"/>
      <circle cx={285+Math.cos(t*0.5)*48} cy={110+Math.sin(t*0.5)*28} r="4.5" fill="#34d399" opacity="0.9"/>
    </svg>
  );
}

function HowItWorksSection() {
  const steps = [
    { num:"01", label:"Describe your idea", sub:"Type what you want in plain English — your business, style, and goals. No code or design skills needed.", color:"#818cf8", border:"rgba(129,140,248,0.2)", chipColor:"rgba(129,140,248,0.9)", chipLabel:"Example prompt", chipDetail:'"A SaaS landing page, dark theme, modern"', Logo:StepLogoDescribe, Poster:DescribePosterBg },
    { num:"02", label:"AI builds it instantly", sub:"Your AI agent writes the full code, crafts the layout, design, and content — a production site in seconds.", color:"#34d399", border:"rgba(52,211,153,0.2)", chipColor:"rgba(52,211,153,0.9)", pills:["Layout","Design","Code","Content","SEO"], Logo:StepLogoGenerate, Poster:GeneratePosterBg },
    { num:"03", label:"Go live instantly", sub:"Preview, refine, and publish with one click. Your website is live on the internet immediately.", color:"#38bdf8", border:"rgba(56,189,248,0.2)", chipColor:"rgba(56,189,248,0.9)", liveUrl:"yoursite.genweb.ai", Logo:StepLogoDeploy, Poster:DeployPosterBg },
  ];
  return (
    <section style={{ width:"100%", background:"rgba(255,255,255,0.012)", borderTop:"1px solid rgba(255,255,255,0.05)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"56px clamp(16px,4vw,52px) 64px" }}>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16, marginBottom:40, flexWrap:"wrap" }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"4px 12px", borderRadius:20, background:"rgba(129,140,248,0.1)", border:"1px solid rgba(129,140,248,0.2)", marginBottom:12 }}>
              <span style={{ fontSize:9, color:"#a5b4fc", fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase" }}>✦ How it works</span>
            </div>
            <h2 style={{ margin:0, fontSize:"clamp(22px,3vw,30px)", fontWeight:800, color:"#fff", letterSpacing:"-0.03em", lineHeight:1.15 }}>
              From idea to live website{" "}<span style={{ background:"linear-gradient(135deg,#818cf8,#38bdf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>in three steps</span>
            </h2>
            <p style={{ margin:"10px 0 0", fontSize:14, color:"rgba(255,255,255,0.38)", maxWidth:460, lineHeight:1.65 }}>Your AI agent handles everything — code, design, and deployment. Zero experience needed.</p>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ borderRadius:24, background:"rgba(255,255,255,0.022)", border:`1.5px solid ${step.border}`, overflow:"hidden", position:"relative", minHeight:320, display:"flex", flexDirection:"column", cursor:"default", userSelect:"none" }}>
              <div style={{ position:"absolute", inset:0, zIndex:0 }}><step.Poster /></div>
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,#080810 48%,rgba(8,8,16,0.55) 72%,rgba(8,8,16,0.06) 100%)", zIndex:1 }} />
              <div style={{ position:"relative", zIndex:2, padding:"22px 24px 0" }}>
                <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.12em", color:step.chipColor, textTransform:"uppercase", background:`${step.color}16`, padding:"4px 12px", borderRadius:20, border:`1px solid ${step.border}` }}>Step {step.num}</span>
              </div>
              <div style={{ position:"relative", zIndex:2, display:"flex", justifyContent:"center", alignItems:"center", flex:1, padding:"18px 0 12px" }}>
                <step.Logo size={72} />
              </div>
              <div style={{ position:"relative", zIndex:2, padding:"0 24px 26px" }}>
                <p style={{ margin:"0 0 8px", fontSize:"clamp(15px,1.8vw,17px)", fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>{step.label}</p>
                <p style={{ margin:"0 0 16px", fontSize:12.5, color:"rgba(255,255,255,0.42)", lineHeight:1.75 }}>{step.sub}</p>
                {step.chipDetail && (<div style={{ padding:"10px 14px", borderRadius:12, background:`${step.color}0d`, border:`1px solid ${step.border}` }}><p style={{ margin:"0 0 3px", fontSize:9.5, color:step.chipColor, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" }}>{step.chipLabel}</p><p style={{ margin:0, fontSize:11.5, color:"rgba(255,255,255,0.48)", fontStyle:"italic" }}>{step.chipDetail}</p></div>)}
                {step.pills && (<div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{step.pills.map((p,j)=>(<span key={j} style={{ fontSize:11, padding:"4px 12px", borderRadius:20, background:`${step.color}0e`, border:`1px solid ${step.border}`, color:step.chipColor, fontWeight:600 }}>{p}</span>))}</div>)}
                {step.liveUrl && (<div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"7px 14px", borderRadius:20, background:"rgba(52,211,153,0.07)", border:"1px solid rgba(52,211,153,0.22)" }}><span style={{ width:7, height:7, borderRadius:"50%", background:"#34d399", display:"inline-block", boxShadow:"0 0 8px rgba(52,211,153,0.7)", flexShrink:0 }}/><span style={{ fontSize:12, color:"rgba(52,211,153,0.9)", fontWeight:600, fontFamily:"monospace" }}>{step.liveUrl}</span></div>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   WEBSITE THUMBNAIL
══════════════════════════════════════════════════════════════════════════════ */
function generatePageStructure(title = '', accent = '#818cf8') {
  const hash = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const h = hash;
  const layouts = [
    () => (
      <svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs><linearGradient id={`lg0_${h}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={accent} stopOpacity="0.22" /><stop offset="100%" stopColor={accent} stopOpacity="0.04" /></linearGradient></defs>
        <rect x="0" y="0" width="300" height="17" fill="rgba(255,255,255,0.04)" />
        <circle cx="15" cy="8.5" r="4.5" fill={accent} opacity="0.75" />
        <rect x="23" y="5" width="32" height="7" rx="3.5" fill={accent} opacity="0.5" />
        {[180, 206, 232].map((x, i) => (<rect key={i} x={x} y="5" width="20" height="7" rx="3.5" fill="#fff" opacity="0.18" />))}
        <rect x="256" y="4" width="30" height="9" rx="4.5" fill={accent} opacity="0.7" />
        <rect x="0" y="17" width="300" height="70" fill={`url(#lg0_${h})`} />
        <rect x="24" y="30" width="130" height="11" rx="5.5" fill="#fff" opacity="0.72" />
        <rect x="24" y="46" width="96" height="7" rx="3.5" fill="#fff" opacity="0.35" />
        <rect x="24" y="57" width="110" height="7" rx="3.5" fill="#fff" opacity="0.22" />
        <rect x="24" y="70" width="58" height="13" rx="6.5" fill={accent} opacity="0.9" />
        <ellipse cx="225" cy="52" rx="52" ry="33" fill={accent} opacity="0.14" />
        <ellipse cx="225" cy="52" rx="32" ry="20" fill={accent} opacity="0.18" />
        <circle cx="225" cy="52" r="12" fill={accent} opacity="0.3" />
        {[0, 1, 2].map(i => (<g key={i} transform={`translate(${10 + i * 95},96)`}><rect width="82" height="48" rx="6" fill="#fff" opacity="0.03" stroke={accent} strokeWidth="0.6" strokeOpacity="0.35" /><rect x="8" y="8" width="22" height="22" rx="5" fill={accent} opacity="0.2" /><circle cx="19" cy="19" r="5" fill={accent} opacity="0.4" /><rect x="8" y="33" width="52" height="5" rx="2.5" fill="#fff" opacity="0.32" /><rect x="8" y="41" width="38" height="4" rx="2" fill="#fff" opacity="0.16" /></g>))}
      </svg>
    ),
    () => (
      <svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs><radialGradient id={`rg1_${h}`} cx="75%" cy="45%" r="55%"><stop offset="0%" stopColor={accent} stopOpacity="0.28" /><stop offset="100%" stopColor={accent} stopOpacity="0" /></radialGradient></defs>
        <rect width="300" height="150" fill={`url(#rg1_${h})`} />
        <rect x="0" y="0" width="300" height="15" fill="rgba(0,0,0,0.25)" />
        <rect x="10" y="4" width="44" height="7" rx="3.5" fill={accent} opacity="0.6" />
        {[180, 208, 236, 265].map((x, i) => (<rect key={i} x={x} y="4" width="22" height="7" rx="3.5" fill="#fff" opacity={i === 3 ? 0.6 : 0.18} />))}
        <rect x="14" y="26" width="118" height="10" rx="5" fill="#fff" opacity="0.7" />
        <rect x="14" y="41" width="88" height="7" rx="3.5" fill="#fff" opacity="0.35" />
        <rect x="14" y="52" width="102" height="7" rx="3.5" fill="#fff" opacity="0.22" />
        <rect x="14" y="66" width="60" height="12" rx="6" fill={accent} opacity="0.9" />
        <rect x="158" y="20" width="128" height="82" rx="9" fill={accent} opacity="0.1" stroke={accent} strokeWidth="0.8" strokeOpacity="0.4" />
        <rect x="163" y="25" width="118" height="52" rx="6" fill={accent} opacity="0.12" />
        <ellipse cx="222" cy="51" rx="30" ry="18" fill={accent} opacity="0.2" />
        {[0, 1, 2].map(i => (<g key={i} transform={`translate(${14 + i * 90},108)`}><rect width="78" height="32" rx="6" fill="#fff" opacity="0.03" stroke={accent} strokeWidth="0.5" strokeOpacity="0.25" /><rect x="6" y="7" width="28" height="8" rx="4" fill={accent} opacity="0.5" /><rect x="6" y="19" width="48" height="5" rx="2.5" fill="#fff" opacity="0.2" /></g>))}
      </svg>
    ),
    () => (
      <svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs><linearGradient id={`lg2_${h}`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={accent} stopOpacity="0.16" /><stop offset="100%" stopColor={accent} stopOpacity="0.02" /></linearGradient></defs>
        <rect x="0" y="0" width="54" height="150" fill="rgba(0,0,0,0.35)" />
        <circle cx="27" cy="18" r="9" fill={accent} opacity="0.55" />
        {[0, 1, 2, 3, 4].map(i => (<g key={i} transform={`translate(7,${34 + i * 22})`}><rect width="40" height="16" rx="5" fill={i === 0 ? accent : 'rgba(255,255,255,0.04)'} opacity={i === 0 ? 0.25 : 1} /><circle cx="10" cy="8" r="4" fill={i === 0 ? accent : '#fff'} opacity={i === 0 ? 0.9 : 0.22} /><rect x="18" y="5" width="16" height="5" rx="2.5" fill="#fff" opacity={i === 0 ? 0.7 : 0.2} /></g>))}
        <rect x="54" y="0" width="246" height="16" fill="rgba(255,255,255,0.025)" />
        <rect x="62" y="4" width="80" height="8" rx="4" fill="rgba(255,255,255,0.08)" />
        <circle cx="285" cy="8" r="5" fill={accent} opacity="0.5" />
        {[0, 1, 2].map(i => (<g key={i} transform={`translate(${62 + i * 80},22)`}><rect width="72" height="34" rx="6" fill={`url(#lg2_${h})`} stroke={accent} strokeWidth="0.5" strokeOpacity="0.3" /><rect x="7" y="8" width="32" height="8" rx="4" fill={accent} opacity={0.55 - i * 0.1} /><rect x="7" y="20" width="50" height="5" rx="2.5" fill="#fff" opacity="0.2" /></g>))}
        <rect x="62" y="62" width="168" height="62" rx="7" fill="rgba(255,255,255,0.02)" stroke={accent} strokeWidth="0.5" strokeOpacity="0.22" />
        <polyline points="72,114 88,96 106,101 124,82 140,90 158,74 172,80 200,66 218,70" fill="none" stroke={accent} strokeWidth="2.2" strokeOpacity="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="72,114 88,96 106,101 124,82 140,90 158,74 172,80 200,66 218,70 218,122 72,122" fill={accent} opacity="0.07" />
        {[[88,96],[124,82],[158,74],[200,66]].map(([x,y],i) => (<circle key={i} cx={x} cy={y} r="3" fill={accent} opacity="0.8" />))}
        <rect x="238" y="62" width="60" height="62" rx="6" fill="rgba(255,255,255,0.02)" stroke={accent} strokeWidth="0.5" strokeOpacity="0.22" />
        {[0, 1, 2, 3].map(i => (<g key={i} transform={`translate(244,${70 + i * 13})`}><rect width="48" height="9" rx="4.5" fill={accent} opacity={0.06 + (3 - i) * 0.04} /><rect width={28 + i * 4} height="9" rx="4.5" fill={accent} opacity={0.2 - i * 0.03} /></g>))}
      </svg>
    ),
    () => (
      <svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect x="0" y="0" width="300" height="16" fill="rgba(255,255,255,0.04)" />
        <rect x="10" y="4" width="48" height="8" rx="4" fill={accent} opacity="0.55" />
        <rect x="98" y="4" width="100" height="8" rx="4" fill="rgba(255,255,255,0.07)" />
        {[240, 260, 278].map((x, i) => (<rect key={i} x={x} y="4" width="16" height="8" rx="4" fill="#fff" opacity="0.2" />))}
        <rect x="10" y="20" width="280" height="14" fill="rgba(255,255,255,0.015)" />
        {['All','New','Sale','Popular','Trending'].map((_, i) => (<rect key={i} x={10 + i * 56} y="22" width="48" height="10" rx="5" fill={i === 0 ? accent : 'rgba(255,255,255,0.04)'} opacity={i === 0 ? 0.7 : 1} stroke={i === 0 ? accent : 'rgba(255,255,255,0.1)'} strokeWidth="0.5" />))}
        {[0,1,2,3,4,5].map(i => { const col = i % 3, row = Math.floor(i / 3); return (<g key={i} transform={`translate(${10 + col * 96},${40 + row * 54})`}><rect width="82" height="48" rx="6" fill="#fff" opacity="0.025" stroke={accent} strokeWidth="0.5" strokeOpacity="0.28" /><rect x="0" y="0" width="82" height="28" rx="6" fill={accent} opacity="0.1" /><ellipse cx="41" cy="14" rx="14" ry="9" fill={accent} opacity="0.22" /><rect x="6" y="31" width="46" height="5" rx="2.5" fill="#fff" opacity="0.35" /><rect x="6" y="39" width="28" height="5" rx="2.5" fill={accent} opacity="0.55" /><rect x="60" y="38" width="16" height="7" rx="3.5" fill={accent} opacity="0.4" /></g>); })}
      </svg>
    ),
    () => (
      <svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs><radialGradient id={`rg4_${h}`} cx="50%" cy="28%" r="52%"><stop offset="0%" stopColor={accent} stopOpacity="0.22" /><stop offset="100%" stopColor={accent} stopOpacity="0" /></radialGradient></defs>
        <rect width="300" height="150" fill={`url(#rg4_${h})`} />
        <rect x="0" y="0" width="300" height="14" fill="rgba(0,0,0,0.2)" />
        {[40, 90, 140, 190, 240].map((x, i) => (<rect key={i} x={x} y="3" width="36" height="8" rx="4" fill="#fff" opacity={i === 2 ? 0.55 : 0.18} />))}
        <rect x="60" y="20" width="180" height="10" rx="5" fill="#fff" opacity="0.65" />
        <rect x="90" y="35" width="120" height="7" rx="3.5" fill="#fff" opacity="0.28" />
        <rect x="116" y="47" width="68" height="12" rx="6" fill={accent} opacity="0.85" />
        <rect x="10" y="68" width="86" height="72" rx="7" fill={accent} opacity="0.1" stroke={accent} strokeWidth="0.5" strokeOpacity="0.3" />
        <rect x="10" y="68" width="86" height="40" rx="7" fill={accent} opacity="0.14" />
        <circle cx="53" cy="88" r="12" fill={accent} opacity="0.25" />
        <rect x="16" y="113" width="60" height="6" rx="3" fill="#fff" opacity="0.35" />
        <rect x="104" y="68" width="86" height="52" rx="7" fill={accent} opacity="0.08" stroke={accent} strokeWidth="0.5" strokeOpacity="0.3" />
        <rect x="198" y="68" width="92" height="68" rx="7" fill={accent} opacity="0.08" stroke={accent} strokeWidth="0.5" strokeOpacity="0.3" />
      </svg>
    ),
  ];
  return layouts[hash % layouts.length]();
}

function WebsiteThumbnail({ site, pal }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const hasUrl = !!site.deployUrl;
  return (
    <div style={{ height: 150, position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${pal.accent}18`, background: 'rgba(4,4,12,0.96)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${pal.accent}80,transparent)`, zIndex: 6 }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>{generatePageStructure(site.title, pal.accent)}</div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(4,4,12,0.42)' }} />
      {hasUrl && !errored && (
        <>
          <div style={{ position: 'absolute', inset: 0, zIndex: 3, opacity: loaded ? 1 : 0, transition: 'opacity 0.7s ease' }}>
            <iframe src={site.deployUrl} title={site.title} scrolling="no" onLoad={() => setLoaded(true)} onError={() => setErrored(true)} style={{ width: '300%', height: '300%', border: 'none', transform: 'scale(0.333)', transformOrigin: 'top left', pointerEvents: 'none', background: '#fff' }} sandbox="allow-scripts allow-same-origin" />
          </div>
          <div style={{ position: 'absolute', inset: 0, zIndex: 4, background: 'linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.25) 100%)' }} />
        </>
      )}
      {!loaded && (<div style={{ position: 'absolute', bottom: 10, right: 11, zIndex: 5, width: 26, height: 26, borderRadius: 7, background: `${pal.accent}1a`, border: `1px solid ${pal.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: pal.accent, backdropFilter: 'blur(6px)' }}>{(site.title || 'W').charAt(0).toUpperCase()}</div>)}
      {site.deployed && (<div style={{ position: 'absolute', top: 9, right: 9, zIndex: 7, display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.32)', backdropFilter: 'blur(6px)' }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} /><span style={{ fontSize: 10, color: '#34d399', fontWeight: 700 }}>Live</span></div>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   DEPLOY MODAL — with Copy Link + Share
══════════════════════════════════════════════════════════════════════════════ */
const canWebShare = () => typeof navigator !== "undefined" && !!navigator.share;

function DeployModal({ site, onClose, onDeployed }) {
  const [phase,       setPhase]       = useState(site.deployed ? "deployed" : "idle");
  const [deployUrl,   setDeployUrl]   = useState(site.deployUrl || "");
  const [errMsg,      setErrMsg]      = useState("");
  const [undeploying, setUndeploying] = useState(false);
  const [shareOpen,   setShareOpen]   = useState(false);
  const [copied,      setCopied]      = useState(false);

  const copyLink = (url) => {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  };

  const nativeShare = async (url) => {
    try { await navigator.share({ title: site.title, text: "Check out this website I built with AI 🚀", url }); } catch {}
  };

  const handleDeploy = async () => {
    setPhase("deploying"); setErrMsg("");
    try {
      const { data } = await axios.post(`${serverUrl}/api/website/${site._id}/deploy`, {}, { withCredentials: true });
      if (data.success) { setDeployUrl(data.deployUrl); setPhase("deployed"); onDeployed?.(site._id, data.deployUrl); }
      else { setErrMsg(data.message || "Deploy failed"); setPhase("error"); }
    } catch (e) { setErrMsg(e?.response?.data?.message || "Deploy failed. Please try again."); setPhase("error"); }
  };

  const handleUndeploy = async () => {
    setUndeploying(true);
    try {
      await axios.post(`${serverUrl}/api/website/${site._id}/undeploy`, {}, { withCredentials: true });
      setDeployUrl(""); setPhase("idle"); onDeployed?.(site._id, "");
    } catch {} finally { setUndeploying(false); }
  };

  const displayUrl = deployUrl || site.deployUrl || "";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "rgba(8,8,18,0.99)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 28, padding: "32px 30px", maxWidth: 460, width: "100%", boxShadow: "0 40px 100px rgba(0,0,0,0.85)", position: "relative", overflow: "hidden" }}>

        {/* Top accent line */}
        <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 2, background: "linear-gradient(90deg,transparent,rgba(52,211,153,0.7),rgba(56,189,248,0.5),transparent)" }} />

        {/* IDLE / ERROR */}
        {(phase === "idle" || phase === "error") && (<>
          <div style={{ fontSize: 28, marginBottom: 16 }}>🚀</div>
          <h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#fff" }}>{site.deployed ? "Redeploy Site" : "Deploy Site"}</h3>
          <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{site.title}</p>
          <p style={{ margin: "0 0 22px", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
            {site.deployed ? "Push your latest changes live. Your URL stays the same." : "Make your site publicly accessible. Hosted free on GenWeb servers."}
          </p>
          {phase === "error" && (<div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12.5, color: "#f87171" }}>⚠ {errMsg}</div>)}
          {site.deployed && site.deployUrl && (
            <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "rgba(52,211,153,0.8)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{site.deployUrl}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleDeploy} style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#34d399,#059669)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{site.deployed ? "🔄 Redeploy" : "🚀 Deploy Now"}</button>
          </div>
        </>)}

        {/* DEPLOYING */}
        {phase === "deploying" && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(52,211,153,0.15)", borderTopColor: "#34d399", margin: "0 auto 20px" }} />
            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#fff" }}>Deploying your site…</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", margin: 0 }}>Publishing to GenWeb servers</p>
          </div>
        )}

        {/* DEPLOYED */}
        {phase === "deployed" && displayUrl && (<>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280 }}
            style={{ fontSize: 32, marginBottom: 14 }}>🎉</motion.div>
          <h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#fff" }}>Your site is live!</h3>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>Publicly accessible — share it anywhere.</p>

          {/* URL box */}
          <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.22)", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 10px rgba(52,211,153,0.9)", flexShrink: 0 }} />
            <a href={displayUrl} target="_blank" rel="noreferrer"
              style={{ fontSize: 12.5, color: "#34d399", fontWeight: 600, fontFamily: "monospace", textDecoration: "none", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayUrl}
            </a>
          </div>

          {/* Open + Copy */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button onClick={() => window.open(displayUrl, "_blank")}
              style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#34d399,#059669)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              ↗ Open Site
            </button>
            <button onClick={() => copyLink(displayUrl)}
              style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${copied ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.1)"}`, background: copied ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)", color: copied ? "#34d399" : "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .25s" }}>
              {copied ? "✓ Copied!" : "⎘ Copy Link"}
            </button>
          </div>

          {/* Share */}
          {canWebShare() ? (
            <button onClick={() => nativeShare(displayUrl)}
              style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: "1px solid rgba(129,140,248,0.3)", background: "rgba(129,140,248,0.08)", color: "#a5b4fc", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
              📤 Share
            </button>
          ) : (
            <div style={{ position: "relative", marginBottom: 10 }}>
              <button onClick={() => setShareOpen(p => !p)}
                style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: `1px solid ${shareOpen ? "rgba(129,140,248,0.5)" : "rgba(129,140,248,0.3)"}`, background: shareOpen ? "rgba(129,140,248,0.14)" : "rgba(129,140,248,0.07)", color: "#a5b4fc", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                📤 Share  <span style={{ fontSize: 10, opacity: 0.6 }}>{shareOpen ? "▲" : "▼"}</span>
              </button>
              <AnimatePresence>
                {shareOpen && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, right: 0, background: "rgba(10,10,20,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.7)", zIndex: 10 }}>
                    {[
                      { icon: "💬", label: "WhatsApp", action: () => window.open(`https://wa.me/?text=${encodeURIComponent("Check out this website I built with AI 🚀\n" + displayUrl)}`, "_blank") },
                      { icon: "𝕏",  label: "Twitter / X", action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent("Just built this with AI in seconds 🚀")}&url=${encodeURIComponent(displayUrl)}`, "_blank") },
                      { icon: "in", label: "LinkedIn", action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(displayUrl)}`, "_blank") },
                      { icon: "⎘",  label: copied ? "Copied!" : "Copy link", action: () => copyLink(displayUrl) },
                    ].map((item, i) => (
                      <div key={i} onClick={item.action}
                        style={{ padding: "11px 16px", cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 12, borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{item.icon}</span>
                        {item.label}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Redeploy + Unpublish + Close */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleDeploy}
              style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid rgba(56,189,248,0.25)", background: "rgba(56,189,248,0.06)", color: "#38bdf8", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              🔄 Redeploy
            </button>
            <button onClick={handleUndeploy} disabled={undeploying}
              style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: undeploying ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: undeploying ? 0.6 : 1 }}>
              {undeploying ? "⟳ Wait…" : "⊘ Unpublish"}
            </button>
            <button onClick={onClose}
              style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Close
            </button>
          </div>
        </>)}
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PROJECT CARD
══════════════════════════════════════════════════════════════════════════════ */
function ProjectCard({ site, index, onDelete, onDeploy, navigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const menuRef = useRef(null);
  useOutsideClick(menuRef, () => setMenuOpen(false));

  const age = (() => {
    const d = Math.floor((Date.now() - new Date(site.createdAt)) / 86400000);
    if (d === 0) return "Today"; if (d === 1) return "Yesterday"; return `${d}d ago`;
  })();

  const defaultPalettes = [
    { accent: "#818cf8" }, { accent: "#34d399" }, { accent: "#f472b6" },
    { accent: "#fbbf24" }, { accent: "#38bdf8" },
  ];
  const fallback = defaultPalettes[index % 5];
  const rawAccent = site.thumbnailAccent || fallback.accent;
  const pal = { accent: rawAccent, border: `${rawAccent}55`, bg: site.thumbnailBg || "#0a0a0f" };

  const handlePreview = () => {
    if (site.deployUrl) window.open(site.deployUrl, "_blank");
    else navigate(`/editor?id=${site._id}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
        transition={{ delay: index * 0.05, duration: 0.38 }}
        whileHover={{ y: -6, boxShadow: `0 20px 56px ${pal.accent}22` }}
        style={{ borderRadius: 22, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", position: "relative", transition: "border-color .25s, box-shadow .25s", cursor: "default" }}
        onMouseEnter={e => e.currentTarget.style.borderColor = pal.accent + "60"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}>

        <WebsiteThumbnail site={site} pal={pal} />

        <div style={{ padding: "14px 16px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
            <div style={{ overflow: "hidden" }}>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }}>{site.title || "Untitled"}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: pal.accent, display: "inline-block" }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", fontWeight: 500 }}>{age}</span>
              </div>
            </div>
            <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
              <button onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); }}
                style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent", color: "rgba(255,255,255,0.35)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, transition: "background .15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>···</button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div initial={{ opacity: 0, scale: 0.94, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: -4 }} transition={{ duration: 0.12 }}
                    style={{ position: "absolute", top: 32, right: 0, width: 160, background: "rgba(10,10,18,0.98)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, boxShadow: "0 16px 52px rgba(0,0,0,0.7)", backdropFilter: "blur(20px)", zIndex: 100, overflow: "hidden" }}>
                    {[
                      { label: "✎ Edit",      color: "rgba(255,255,255,0.68)", action: () => navigate(`/editor?id=${site._id}`) },
                      { label: "◎ Preview",   color: "rgba(255,255,255,0.68)", action: handlePreview },
                      { label: "🚀 Deploy",   color: "#38bdf8", action: () => { setShowDeployModal(true); setMenuOpen(false); } },
                      { label: "⬇ Export",   color: "rgba(255,255,255,0.68)", action: () => {} },
                      { label: "⎘ Duplicate", color: "rgba(255,255,255,0.68)", action: () => {} },
                      { label: "🗑 Delete",   color: "#f87171", action: () => { onDelete(); setMenuOpen(false); } },
                    ].map((item, i) => (
                      <div key={i} onClick={item.action}
                        style={{ padding: "9px 14px", cursor: "pointer", fontSize: 12.5, color: item.color, fontWeight: 500, borderTop: i === 5 ? "1px solid rgba(255,255,255,0.07)" : "none" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{item.label}</div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => navigate(`/editor?id=${site._id}`)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", background: `${pal.accent}20`, color: pal.accent, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = `${pal.accent}35`}
              onMouseLeave={e => e.currentTarget.style.background = `${pal.accent}20`}>✎ Edit</button>
            <button onClick={handlePreview}
              style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>◎ Preview</button>
            <button onClick={() => setShowDeployModal(true)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "1px solid rgba(56,189,248,0.3)", background: "rgba(56,189,248,0.08)", color: "#38bdf8", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(56,189,248,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(56,189,248,0.08)"}>🚀 Deploy</button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDeployModal && (
          <DeployModal site={site} onClose={() => setShowDeployModal(false)} onDeployed={(id, url) => { onDeploy(id, url); }} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { userData } = useSelector(s => s.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [websites,     setWebsites]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [activeTab,    setActiveTab]    = useState("all");
  const [deleteId,     setDeleteId]     = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [searchFocused,setSearchFocused]= useState(false);

  const dropdownRef = useRef(null);
  useOutsideClick(dropdownRef, () => setDropdownOpen(false));

  useEffect(() => { if (userData === null) navigate("/login"); }, [userData]);

  useEffect(() => {
    const go = async () => {
      try {
        const { data } = await axios.get(`${serverUrl}/api/user/websites`, { withCredentials: true });
        setWebsites(data.websites || []);
      } catch { setWebsites([]); }
      finally { setLoading(false); }
    };
    if (userData?._id) go();
  }, [userData]);

  const handleLogout = async () => {
    await signOut(auth);
    await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
    dispatch(setUserData(null)); navigate("/");
  };

  const handleDelete = async () => {
    if (!deleteId) return; setDeleting(true);
    try {
      await axios.delete(`${serverUrl}/api/website/${deleteId}`, { withCredentials: true });
      setWebsites(p => p.filter(w => w._id !== deleteId));
    } catch (e) { console.log(e); }
    finally { setDeleting(false); setDeleteId(null); }
  };

  const handleDeployed = (id, url) => {
    setWebsites(prev => prev.map(w => w._id === id ? { ...w, deployed: !!url, deployUrl: url } : w));
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = userData?.name?.split(" ")[0] || "there";
  const credits   = userData?.credits ?? 0;
  const plan      = userData?.plan || "Free";
  const isFreePlan = plan.toLowerCase() === "free";

  const filtered = websites.filter(w => {
    const m = w.title?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "deployed") return m && w.deployed;
    return m;
  });

  const QUICK = [
    { label: "New Website",      sub: "Generate from prompt",  icon: <IconNewWebsite />,  color: "#818cf8", border: "rgba(129,140,248,0.25)", Poster: NewWebsitePoster,  action: () => navigate("/generate"), badge: null },
    { label: "Browse Templates", sub: "Ready-made designs",    icon: <IconTemplates />,   color: "#34d399", border: "rgba(52,211,153,0.2)",   Poster: TemplatesPoster,   action: null, badge: "SOON" },
    { label: "Import HTML",      sub: "Bring your own code",   icon: <IconImportHTML />,  color: "#38bdf8", border: "rgba(56,189,248,0.2)",   Poster: ImportHTMLPoster,  action: null, badge: "SOON" },
    { label: "Clone a Site",     sub: "Replicate any site",    icon: <IconClone />,       color: "#f472b6", border: "rgba(244,114,182,0.2)",  Poster: ClonePoster,       action: null, badge: "SOON" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080810", color: "#f0f0f8", fontFamily: "'DM Sans','Inter',system-ui,sans-serif", overflowX: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 60% at 10% 0%,rgba(129,140,248,0.06) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 90% 100%,rgba(52,211,153,0.04) 0%,transparent 60%)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(255,255,255,0.012) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 300, height: 60, background: "rgba(8,8,16,0.9)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "0 clamp(14px,4vw,36px)", gap: 10 }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", flexShrink: 0 }}>
          <PandaLogo size={34} />
          <span className="nav-brand" style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>GenWeb<span style={{ color: "#818cf8" }}>.ai</span></span>
        </div>
        <div className="nav-search" style={{ flex: 1, maxWidth: 340, position: "relative", marginLeft: 8 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: searchFocused ? "#818cf8" : "rgba(255,255,255,0.25)", fontSize: 14 }}>⌕</span>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search projects…"
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            style={{ width: "100%", boxSizing: "border-box", background: searchFocused ? "rgba(129,140,248,0.09)" : "rgba(255,255,255,0.04)", border: `1px solid ${searchFocused ? "rgba(129,140,248,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, padding: "8px 14px 8px 34px", color: "#f0f0f8", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "all .2s" }} />
        </div>
        <div style={{ flex: 1 }} />
        <motion.div whileHover={{ scale: 1.04 }} onClick={() => navigate("/pricing")}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 20, background: credits < 50 ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.08)", border: `1px solid ${credits < 50 ? "rgba(248,113,113,0.26)" : "rgba(251,191,36,0.2)"}`, cursor: "pointer", flexShrink: 0 }}>
          <span style={{ fontSize: 11 }}>⚡</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: credits < 50 ? "#f87171" : "#fbbf24" }}>{credits}</span>
          <span className="hide-xs" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>credits</span>
        </motion.div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => navigate("/generate")}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#818cf8,#38bdf8)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" }}>
          ✦ <span className="hide-xs">New</span>
        </motion.button>
        <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
          <button onClick={() => setDropdownOpen(p => !p)} style={{ background: "none", border: dropdownOpen ? "2px solid rgba(129,140,248,0.5)" : "2px solid transparent", cursor: "pointer", padding: 1, borderRadius: "50%", transition: "border-color .2s" }}>
            <SmartAvatar name={userData?.name} avatar={userData?.avatar} size={32} />
          </button>
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.15 }}
                style={{ position: "absolute", top: 46, right: 0, width: 224, background: "rgba(10,10,18,0.98)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 18, boxShadow: "0 24px 64px rgba(0,0,0,0.8)", backdropFilter: "blur(24px)", overflow: "hidden", zIndex: 400 }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
                  <SmartAvatar name={userData?.name} avatar={userData?.avatar} size={36} />
                  <div style={{ overflow: "hidden" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userData?.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userData?.email}</p>
                  </div>
                </div>
                <div style={{ padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Plan</span>
                  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: isFreePlan ? "rgba(248,113,113,0.15)" : "rgba(129,140,248,0.15)", border: `1px solid ${isFreePlan ? "rgba(248,113,113,0.3)" : "rgba(129,140,248,0.3)"}`, color: isFreePlan ? "#fca5a5" : "#a5b4fc", textTransform: "capitalize" }}>{plan}</span>
                </div>
                {[{ label: "⬆ Upgrade Plan", action: () => navigate("/pricing"), color: "#a5b4fc" }, { label: "⚙ Settings", action: () => {}, color: "rgba(255,255,255,0.6)" }].map((item, i) => (
                  <div key={i} onClick={() => { item.action(); setDropdownOpen(false); }} style={{ padding: "10px 16px", cursor: "pointer", fontSize: 13, color: item.color }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{item.label}</div>
                ))}
                <div onClick={handleLogout} style={{ padding: "10px 16px", cursor: "pointer", fontSize: 13, color: "#f87171", borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.07)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>⎋ Sign out</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* MAIN */}
      <main style={{ position: "relative", zIndex: 10, paddingTop: 60 }}>

        {/* HERO */}
        <div style={{ width: "100%", position: "relative", overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.05)", minHeight: "clamp(300px,46vw,420px)" }}>
          <div className="hero-poster" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "clamp(38%,50%,56%)", overflow: "hidden" }}>
            <PandaAgentPoster />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,#080810 0%,transparent 42%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,#080810 0%,transparent 38%)" }} />
          </div>
          <div style={{ position: "relative", zIndex: 2, maxWidth: "min(580px,58vw)", padding: "clamp(32px,6vw,68px) 0 clamp(32px,6vw,68px) clamp(16px,5vw,52px)" }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 20, background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.28)", marginBottom: 18 }}>
                <span style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>✦ AI-Powered Website Builder</span>
              </div>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.55 }}
              style={{ margin: "0 0 14px", fontSize: "clamp(1.8rem,4.5vw,3.4rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.1 }}>
              {greeting},<br /><span style={{ background: "linear-gradient(135deg,#818cf8,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{firstName}</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.5 }}
              style={{ margin: "0 0 28px", fontSize: "clamp(13px,1.8vw,15px)", color: "rgba(255,255,255,0.48)", lineHeight: 1.7, maxWidth: 400 }}>
              {websites.length === 0 ? "Your AI agent is ready. Describe your idea and ship a production-ready website in seconds." : `You have ${websites.length} project${websites.length !== 1 ? "s" : ""} — your AI agent is ready to build the next one.`}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.45 }} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={() => navigate("/generate")}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "clamp(10px,2vw,14px) clamp(20px,3vw,30px)", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#818cf8,#38bdf8)", color: "#fff", fontWeight: 700, fontSize: "clamp(13px,2vw,15px)", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 0 28px rgba(129,140,248,0.3)" }}>
                ✦ Generate Website
              </motion.button>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["SaaS", "Portfolio", "Blog"].map(tag => (<span key={tag} style={{ padding: "7px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.33)", border: "1px solid rgba(255,255,255,0.07)" }}>{tag}</span>))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38, duration: 0.5 }}
              style={{ display: "flex", gap: "clamp(16px,4vw,32px)", marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)", flexWrap: "wrap" }}>
              <div><p style={{ margin: "0 0 3px", fontSize: "clamp(1.3rem,2.5vw,2rem)", fontWeight: 800, color: "#818cf8" }}>{websites.length}</p><p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.32)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>Projects</p></div>
              <div><p style={{ margin: "0 0 3px", fontSize: "clamp(1.3rem,2.5vw,2rem)", fontWeight: 800, color: credits < 50 ? "#f87171" : "#fbbf24" }}>{credits}</p><p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.32)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>Credits</p></div>
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => navigate("/pricing")} style={{ cursor: "pointer", position: "relative" }}>
                {isFreePlan && (<span style={{ position: "absolute", top: -10, right: -10, padding: "2px 8px", borderRadius: 20, background: "linear-gradient(135deg,#f87171,#fbbf24)", fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: "0.05em", textTransform: "uppercase" }}>Upgrade ↗</span>)}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, background: isFreePlan ? "rgba(248,113,113,0.08)" : "rgba(52,211,153,0.08)", border: `1.5px solid ${isFreePlan ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)"}` }}>
                  <span style={{ fontSize: "clamp(1.1rem,2vw,1.5rem)", fontWeight: 800, color: isFreePlan ? "#fca5a5" : "#34d399", textTransform: "capitalize" }}>{plan}</span>
                  {isFreePlan && <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>→</span>}
                </div>
                <p style={{ margin: "5px 0 0 2px", fontSize: 10, color: isFreePlan ? "rgba(248,113,113,0.65)" : "rgba(255,255,255,0.32)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>{isFreePlan ? "Tap to upgrade" : "Plan"}</p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ width: "100%", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.012)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(14px,3vw,22px) clamp(16px,4vw,52px)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
              {QUICK.map((a, i) => (
                <motion.div key={i} whileHover={a.action ? { scale: 1.025, y: -4 } : { scale: 1.008 }} whileTap={a.action ? { scale: 0.98 } : {}} onClick={a.action || undefined}
                  style={{ borderRadius: 20, background: "rgba(255,255,255,0.022)", border: `1.5px solid ${a.border}`, padding: "20px 20px 18px", cursor: a.action ? "pointer" : "default", position: "relative", overflow: "hidden", minHeight: 112, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <a.Poster />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(8,8,16,0.88) 38%,rgba(8,8,16,0.06) 100%)", zIndex: 1, borderRadius: 18 }} />
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${a.color}60,transparent)`, zIndex: 2 }} />
                  {a.badge && (<span style={{ position: "absolute", top: 12, right: 12, zIndex: 3, padding: "3px 9px", borderRadius: 20, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 9, color: "rgba(255,255,255,0.32)", fontWeight: 800, letterSpacing: "0.08em" }}>SOON</span>)}
                  <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 13 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: `${a.color}18`, border: `1px solid ${a.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{a.icon}</div>
                    <div>
                      <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 800, color: "#fff" }}>{a.label}</p>
                      <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>{a.sub}</p>
                    </div>
                    {a.action && <span style={{ marginLeft: "auto", fontSize: 18, color: a.color, opacity: 0.75, fontWeight: 700 }}>→</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* UPGRADE BANNER */}
        <AnimatePresence>
          {isFreePlan && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ maxWidth: 1400, margin: "28px auto 0", padding: "0 clamp(16px,4vw,52px)" }}>
              <motion.div whileHover={{ scale: 1.003 }} onClick={() => navigate("/pricing")}
                style={{ borderRadius: 18, background: "linear-gradient(135deg,rgba(248,113,113,0.07),rgba(251,191,36,0.05))", border: "1.5px solid rgba(248,113,113,0.24)", padding: "18px 24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚀</div>
                  <div>
                    <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 800, color: "#fff" }}>You're on the Free Plan</p>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.55 }}>Upgrade to unlock unlimited websites, custom domains, priority AI &amp; more.</p>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  style={{ padding: "10px 22px", borderRadius: 12, background: "linear-gradient(135deg,#f87171,#fbbf24)", color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                  ⬆ Upgrade Now
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PROJECTS */}
        <section style={{ maxWidth: 1400, margin: "0 auto", padding: "40px clamp(16px,4vw,52px) 52px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "clamp(17px,2.5vw,22px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Your Projects</h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.32)" }}>{filtered.length} project{filtered.length !== 1 ? "s" : ""} found</p>
            </div>
            <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4 }}>
              {["all", "recent", "deployed"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: activeTab === tab ? "rgba(129,140,248,0.3)" : "transparent", color: activeTab === tab ? "#c7d2fe" : "rgba(255,255,255,0.32)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s", textTransform: "capitalize" }}>{tab}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 18 }}>
              {[1,2,3,4].map(i => (<div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 22, height: 280, animation: "pulse 1.5s ease-in-out infinite" }} />))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ border: "1.5px dashed rgba(129,140,248,0.18)", borderRadius: 24, padding: "clamp(36px,7vw,68px) 32px", textAlign: "center", background: "rgba(129,140,248,0.022)" }}>
              <div style={{ fontSize: 38, marginBottom: 14 }}>✦</div>
              <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>{searchQuery ? "No projects match" : "No projects yet"}</p>
              <p style={{ margin: "0 0 28px", fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.65 }}>{searchQuery ? "Try a different search term." : "Generate your first AI-powered website in seconds."}</p>
              {!searchQuery && (
                <motion.button onClick={() => navigate("/generate")} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  style={{ padding: "12px 28px", borderRadius: 12, border: "1px solid rgba(129,140,248,0.3)", background: "rgba(129,140,248,0.12)", color: "#a5b4fc", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  Create your first website →
                </motion.button>
              )}
            </motion.div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 18 }}>
              <AnimatePresence>
                {filtered.map((site, i) => (
                  <ProjectCard key={site._id} site={site} index={i} onDelete={() => setDeleteId(site._id)} onDeploy={handleDeployed} navigate={navigate} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        <HowItWorksSection />

        {/* FOOTER */}
        <footer style={{ maxWidth: 1400, margin: "0 auto", padding: "28px clamp(16px,4vw,52px) 44px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[["📖 Docs","#"],["🔌 API","#"],["📢 Changelog","#"],["💬 Community","#"],["🆘 Support","mailto:support@genweb.ai"]].map(([label,href],i) => (
              <a key={i} href={href} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, color: "rgba(255,255,255,0.32)", textDecoration: "none", fontWeight: 500 }}
                onMouseEnter={e => { e.currentTarget.style.color="rgba(255,255,255,0.75)"; e.currentTarget.style.background="rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.color="rgba(255,255,255,0.32)"; e.currentTarget.style.background="transparent"; }}>{label}</a>
            ))}
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.14)" }}>© 2026 GenWeb.ai</span>
        </footer>
      </main>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
            onClick={() => setDeleteId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
              style={{ background: "rgba(10,10,18,0.98)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 24, padding: 32, maxWidth: 360, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}>
              <div style={{ fontSize: 20, marginBottom: 18 }}>🗑</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#fff" }}>Delete Website?</h3>
              <p style={{ margin: "0 0 26px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>This action cannot be undone. All data will be permanently deleted.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{deleting ? "Deleting…" : "Delete"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:.28} 50%{opacity:.55} }
        ::-webkit-scrollbar { display:none }
        * { -webkit-font-smoothing:antialiased; box-sizing:border-box; }
        @media (max-width:480px) {
          .hide-xs { display:none !important; }
          .nav-search { display:none !important; }
          .nav-brand { display:none !important; }
          .hero-poster { display:none !important; }
        }
      `}</style>
    </div>
  );
}