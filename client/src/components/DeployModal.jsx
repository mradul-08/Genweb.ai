/* ══════════════════════════════════════════════════════════════════════════════
   DEPLOY MODAL — Production-grade
   Drop-in replacement for the DeployModal in Dashboard.jsx and Editor.jsx

   Features:
   - Deploy / Re-deploy
   - Copy link (clipboard)
   - Share via Web Share API (mobile) or fallback share menu (desktop)
   - Open in new tab
   - WhatsApp / Twitter quick share
   - Undeploy (take offline)
══════════════════════════════════════════════════════════════════════════════ */
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { serverUrl } from "../App"   // adjust path if needed

/* ── tiny hook: clipboard with feedback ──────────────────────────────────── */
function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    })
  }
  return [copied, copy]
}

/* ── share helpers ───────────────────────────────────────────────────────── */
const canWebShare = () => typeof navigator !== "undefined" && !!navigator.share

async function nativeShare(url, title) {
  try {
    await navigator.share({
      title: title || "Check out my website",
      text:  "I built this website with AI in seconds using GenWeb.ai 🚀",
      url,
    })
  } catch (e) {
    // user cancelled or not supported — no-op
  }
}

const whatsappUrl  = (url) => `https://wa.me/?text=${encodeURIComponent("Check out this website I built with AI 🚀\n" + url)}`
const twitterUrl   = (url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent("Just built this website with AI in seconds using GenWeb.ai 🚀")}&url=${encodeURIComponent(url)}`
const linkedinUrl  = (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`

/* ══════════════════════════════════════════════════════════════════════════ */
export default function DeployModal({ site, onClose, onDeployed }) {
  const [phase,     setPhase]     = useState(site.deployed ? "deployed" : "idle")
  // phases: idle | deploying | deployed | error
  const [deployUrl, setDeployUrl] = useState(site.deployUrl || "")
  const [errMsg,    setErrMsg]    = useState("")
  const [undeploying, setUndeploying] = useState(false)
  const [shareOpen,   setShareOpen]   = useState(false)

  const [copiedUrl, copyUrl]   = useCopy()
  const [copiedWa,  copyWa]    = useCopy()   // whatsapp text copy fallback

  // ── Deploy / Re-deploy ───────────────────────────────────────────────────
  const handleDeploy = async () => {
    setPhase("deploying")
    setErrMsg("")
    try {
      const { data } = await axios.post(
        `${serverUrl}/api/website/${site._id}/deploy`,
        {},
        { withCredentials: true }
      )
      if (data.success) {
        setDeployUrl(data.deployUrl)
        setPhase("deployed")
        onDeployed?.(site._id, data.deployUrl)
      } else {
        setErrMsg(data.message || "Deploy failed")
        setPhase("error")
      }
    } catch (e) {
      setErrMsg(e?.response?.data?.message || "Deploy failed. Please try again.")
      setPhase("error")
    }
  }

  // ── Undeploy ─────────────────────────────────────────────────────────────
  const handleUndeploy = async () => {
    setUndeploying(true)
    try {
      await axios.post(
        `${serverUrl}/api/website/${site._id}/undeploy`,
        {},
        { withCredentials: true }
      )
      setDeployUrl("")
      setPhase("idle")
      onDeployed?.(site._id, "")  // clear url in parent
    } catch {
      // silent
    } finally {
      setUndeploying(false)
    }
  }

  const displayUrl = deployUrl || site.deployUrl || ""

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(8,8,18,0.99)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 28,
          padding: "32px 30px",
          maxWidth: 460,
          width: "100%",
          boxShadow: "0 40px 100px rgba(0,0,0,0.85)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: "10%", right: "10%", height: 2,
          background: "linear-gradient(90deg,transparent,rgba(52,211,153,0.7),rgba(56,189,248,0.5),transparent)",
        }} />

        {/* ── IDLE / ERROR ── */}
        {(phase === "idle" || phase === "error") && (
          <>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.28)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, fontSize: 24 }}>
              🚀
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              {site.deployed ? "Redeploy Site" : "Deploy Site"}
            </h3>
            <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
              {site.title}
            </p>
            <p style={{ margin: "0 0 22px", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
              {site.deployed
                ? "Redeploy to push your latest changes live. Your URL stays the same."
                : "Make your site publicly accessible. We'll host it on our servers — free, instant, no signup."}
            </p>

            {phase === "error" && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12.5, color: "#f87171" }}>
                ⚠ {errMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >Cancel</button>
              <button
                onClick={handleDeploy}
                style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#34d399,#059669)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(52,211,153,0.35)" }}
              >
                {site.deployed ? "🔄 Redeploy" : "🚀 Deploy Now"}
              </button>
            </div>
          </>
        )}

        {/* ── DEPLOYING ── */}
        {phase === "deploying" && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ width: 52, height: 52, borderRadius: "50%", border: "3px solid rgba(52,211,153,0.15)", borderTopColor: "#34d399", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}
            />
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#fff" }}>Deploying your site…</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)" }}>Publishing to GenWeb servers</p>

            {/* Animated steps */}
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
              {["Saving latest code…", "Generating public URL…", "Going live…"].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.4 }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 10, background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.12)", fontSize: 12.5, color: "rgba(255,255,255,0.5)" }}
                >
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                    style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block", flexShrink: 0 }}
                  />
                  {step}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── DEPLOYED ── */}
        {phase === "deployed" && displayUrl && (
          <>
            {/* Success header */}
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, delay: 0.05 }}
              style={{ width: 58, height: 58, borderRadius: 18, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 28 }}>
              🎉
            </motion.div>

            <motion.h3 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Your site is live!
            </motion.h3>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
              Publicly accessible — share it anywhere.
            </motion.p>

            {/* URL box */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              style={{ padding: "13px 16px", borderRadius: 14, background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.22)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 10px rgba(52,211,153,0.9)", flexShrink: 0, animation: "pulse 2s ease-in-out infinite" }} />
              <a href={displayUrl} target="_blank" rel="noreferrer"
                style={{ fontSize: 12.5, color: "#34d399", fontWeight: 600, fontFamily: "monospace", textDecoration: "none", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayUrl}
              </a>
            </motion.div>

            {/* Primary actions */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
              style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {/* Open */}
              <button
                onClick={() => window.open(displayUrl, "_blank")}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#34d399,#059669)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 20px rgba(52,211,153,0.3)", transition: "all .2s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 28px rgba(52,211,153,0.5)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(52,211,153,0.3)"}
              >
                <span>↗</span> Open Site
              </button>

              {/* Copy */}
              <button
                onClick={() => copyUrl(displayUrl)}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${copiedUrl ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.1)"}`, background: copiedUrl ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)", color: copiedUrl ? "#34d399" : "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .25s" }}
              >
                {copiedUrl ? "✓ Copied!" : "⎘ Copy Link"}
              </button>
            </motion.div>

            {/* Share button */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }}>
              {canWebShare() ? (
                /* Mobile native share */
                <button
                  onClick={() => nativeShare(displayUrl, site.title)}
                  style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: "1px solid rgba(129,140,248,0.3)", background: "rgba(129,140,248,0.08)", color: "#a5b4fc", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s", marginBottom: 12 }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(129,140,248,0.16)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(129,140,248,0.08)"}
                >
                  📤 Share
                </button>
              ) : (
                /* Desktop: expandable share menu */
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <button
                    onClick={() => setShareOpen(p => !p)}
                    style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: `1px solid ${shareOpen ? "rgba(129,140,248,0.5)" : "rgba(129,140,248,0.3)"}`, background: shareOpen ? "rgba(129,140,248,0.14)" : "rgba(129,140,248,0.07)", color: "#a5b4fc", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s" }}
                  >
                    📤 Share <span style={{ fontSize: 11, opacity: 0.6 }}>{shareOpen ? "▲" : "▼"}</span>
                  </button>

                  <AnimatePresence>
                    {shareOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scaleY: 0.9 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -6, scaleY: 0.9 }}
                        style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, right: 0, background: "rgba(10,10,20,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.7)", zIndex: 10 }}
                      >
                        {[
                          {
                            icon: "💬",
                            label: "WhatsApp",
                            color: "#25D366",
                            bg: "rgba(37,211,102,0.07)",
                            action: () => window.open(whatsappUrl(displayUrl), "_blank"),
                          },
                          {
                            icon: "𝕏",
                            label: "Twitter / X",
                            color: "#fff",
                            bg: "rgba(255,255,255,0.04)",
                            action: () => window.open(twitterUrl(displayUrl), "_blank"),
                          },
                          {
                            icon: "in",
                            label: "LinkedIn",
                            color: "#0A66C2",
                            bg: "rgba(10,102,194,0.07)",
                            action: () => window.open(linkedinUrl(displayUrl), "_blank"),
                          },
                          {
                            icon: "⎘",
                            label: copiedUrl ? "Copied!" : "Copy link",
                            color: copiedUrl ? "#34d399" : "rgba(255,255,255,0.6)",
                            bg: copiedUrl ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.02)",
                            action: () => copyUrl(displayUrl),
                          },
                        ].map((item, i) => (
                          <div
                            key={i}
                            onClick={item.action}
                            style={{ padding: "11px 16px", cursor: "pointer", fontSize: 13, color: item.color, display: "flex", alignItems: "center", gap: 12, background: item.bg, borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none", transition: "filter .15s" }}
                            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.2)"}
                            onMouseLeave={e => e.currentTarget.style.filter = "none"}
                          >
                            <span style={{ width: 28, height: 28, borderRadius: 8, background: `${item.color}18`, border: `1px solid ${item.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{item.icon}</span>
                            {item.label}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* Bottom row: Redeploy + Undeploy + Close */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleDeploy}
                style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid rgba(56,189,248,0.25)", background: "rgba(56,189,248,0.06)", color: "#38bdf8", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(56,189,248,0.14)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(56,189,248,0.06)"}
              >🔄 Redeploy</button>

              <button
                onClick={handleUndeploy}
                disabled={undeploying}
                style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: undeploying ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: undeploying ? 0.6 : 1, transition: "all .2s" }}
                onMouseEnter={e => { if (!undeploying) e.currentTarget.style.background = "rgba(239,68,68,0.12)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.05)" }}
              >{undeploying ? "⟳ Taking offline…" : "⊘ Unpublish"}</button>

              <button
                onClick={onClose}
                style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
              >Close</button>
            </motion.div>
          </>
        )}

        <style>{`
          @keyframes pulse {
            0%,100%{opacity:1;box-shadow:0 0 6px rgba(52,211,153,0.6)}
            50%{opacity:0.7;box-shadow:0 0 16px rgba(52,211,153,1)}
          }
        `}</style>
      </motion.div>
    </motion.div>
  )
}
