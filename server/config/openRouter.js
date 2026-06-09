// ═══════════════════════════════════════════════════════════════════════════════
// GenWeb.ai — AI Provider Manager v6 (Patched Free Models)
// SMART SPLIT: Best models for generation | Fast models for enhance
// Generation:  DeepSeek → Cerebras → Sambanova → ZhipuAI → OpenRouter/GLM
// Enhance:     Groq → Mistral → Cloudflare → Cerebras (fast/small fine here)
// ═══════════════════════════════════════════════════════════════════════════════
import dotenv from "dotenv"
dotenv.config()
 
// ─── API Endpoints ────────────────────────────────────────────────────────────
const GROQ_URL       = "https://api.groq.com/openai/v1/chat/completions"
const MISTRAL_URL    = "https://api.mistral.ai/v1/chat/completions"
const ZHIPU_URL      = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
const CEREBRAS_URL   = "https://api.cerebras.ai/v1/chat/completions"
const SAMBANOVA_URL  = "https://api.sambanova.ai/v1/chat/completions"
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
 
const WEBSITE_TIMEOUT = 90000
const ENHANCE_TIMEOUT = 30000
 
// ─── OpenRouter Models (🌟 FIXED: Switched to active free models) ───────────────
const MODEL_GLM      = "google/gemma-2-9b-it:free" // fallback free model
const MODEL_DEEPSEEK = "meta-llama/llama-3.1-8b-instruct:free" // switched to active free R1
 
// ─── Key Pools ────────────────────────────────────────────────────────────────
const ZHIPU_KEYS = [
  process.env.ZHIPU_API_KEY_1,
  process.env.ZHIPU_API_KEY_2,
  process.env.ZHIPU_API_KEY_3,
  process.env.ZHIPU_API_KEY_4,
  process.env.ZHIPU_API_KEY_5,
].filter(Boolean)
 
const CEREBRAS_KEYS = [
  process.env.CEREBRAS_API_KEY_1,
  process.env.CEREBRAS_API_KEY_2,
  process.env.CEREBRAS_API_KEY_3,
  process.env.CEREBRAS_API_KEY_4,
  process.env.CEREBRAS_API_KEY_5,
].filter(Boolean)
 
const CLOUDFLARE_ACCOUNTS = [
  { token: process.env.CLOUDFLARE_API_KEY_1, accountId: process.env.CLOUDFLARE_ACCOUNT_ID_1 },
  { token: process.env.CLOUDFLARE_API_KEY_2, accountId: process.env.CLOUDFLARE_ACCOUNT_ID_2 },
  { token: process.env.CLOUDFLARE_API_KEY_3, accountId: process.env.CLOUDFLARE_ACCOUNT_ID_3 },
  { token: process.env.CLOUDFLARE_API_KEY_4, accountId: process.env.CLOUDFLARE_ACCOUNT_ID_4 },
  { token: process.env.CLOUDFLARE_API_KEY_5, accountId: process.env.CLOUDFLARE_ACCOUNT_ID_5 },
].filter(a => a.token && a.accountId)
 
const SAMBANOVA_KEYS = [
  process.env.SAMBANOVA_API_KEY_1,
  process.env.SAMBANOVA_API_KEY_2,
  process.env.SAMBANOVA_API_KEY_3,
  process.env.SAMBANOVA_API_KEY_4,
  process.env.SAMBANOVA_API_KEY_5,
].filter(Boolean)
 
const MISTRAL_KEYS = [
  process.env.MISTRAL_API_KEY_1,
  process.env.MISTRAL_API_KEY_2,
  process.env.MISTRAL_API_KEY_3,
  process.env.MISTRAL_API_KEY_4,
  process.env.MISTRAL_API_KEY_5,
].filter(Boolean)
 
const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
].filter(Boolean)
 
const OPENROUTER_KEYS = [
  process.env.OPENROUTER_API_KEY_1,
  process.env.OPENROUTER_API_KEY_2,
  process.env.OPENROUTER_API_KEY_3,
  process.env.OPENROUTER_API_KEY_4,
  process.env.OPENROUTER_API_KEY_5,
].filter(Boolean)
 
// ═══════════════════════════════════════════════════════════════════════════════
// KEY MANAGER — Round Robin within a provider + Auto Reset + Dead Key Tracking
// ═══════════════════════════════════════════════════════════════════════════════
class KeyManager {
  constructor(keys, name) {
    this.name = name
    this.idx  = 0
    this.keys = keys.map(k => ({
      key: k, exhausted: false, dead: false,
      resetAt: null, requests: 0, failures: 0,
    }))
    this._scheduleDailyReset()
    console.log(`[${name}] ${this.keys.length} keys loaded`)
  }
 
  next() {
    const avail = this.keys.filter(k => !k.exhausted && !k.dead)
    if (!avail.length) return null
    const key = avail[this.idx % avail.length]
    this.idx++
    key.requests++
    return key
  }
 
  markExhausted(k, hours = 1) {
    k.exhausted = true
    k.resetAt   = Date.now() + hours * 3600000
    k.failures++
    console.warn(`[${this.name}] Key ...${k.key.slice(-6)} exhausted ${hours}h. Available: ${this.available()}/${this.keys.length}`)
  }
 
  markDead(k) {
    k.exhausted = true
    k.dead      = true
    console.error(`[${this.name}] Key ...${k.key.slice(-6)} DEAD`)
  }
 
  available() { return this.keys.filter(k => !k.exhausted && !k.dead).length }
  isEmpty()   { return this.available() === 0 }
 
  nextResetMs() {
    const times = this.keys.filter(k => k.exhausted && !k.dead && k.resetAt).map(k => k.resetAt)
    return times.length ? Math.max(0, Math.min(...times) - Date.now()) : null
  }
 
  status() {
    return {
      provider:    this.name,
      total:       this.keys.length,
      available:   this.available(),
      exhausted:   this.keys.filter(k => k.exhausted && !k.dead).length,
      dead:        this.keys.filter(k => k.dead).length,
      nextResetMs: this.nextResetMs(),
    }
  }
 
  _scheduleDailyReset() {
    const now      = new Date()
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
    setTimeout(() => {
      this._reset()
      setInterval(() => this._reset(), 86400000)
    }, midnight - now)
  }
 
  _reset() {
    const now = Date.now(); let n = 0
    this.keys.forEach(k => {
      if (k.exhausted && !k.dead && k.resetAt && now >= k.resetAt) {
        k.exhausted = false; k.resetAt = null; k.failures = 0; n++
      }
    })
    if (n) console.log(`[${this.name}] Reset ${n} key(s). Available: ${this.available()}/${this.keys.length}`)
  }
}
 
// ─── Cloudflare Manager ───────────────────────────────────────────────────────
class CloudflareManager {
  constructor(accounts) {
    this.name     = "Cloudflare"
    this.idx      = 0
    this.accounts = accounts.map(a => ({
      ...a, exhausted: false, dead: false,
      resetAt: null, requests: 0, failures: 0,
    }))
    this._scheduleDailyReset()
    console.log(`[Cloudflare] ${this.accounts.length} accounts loaded`)
  }
 
  next() {
    const avail = this.accounts.filter(a => !a.exhausted && !a.dead)
    if (!avail.length) return null
    const acc = avail[this.idx % avail.length]
    this.idx++; acc.requests++; return acc
  }
 
  markExhausted(a, hours = 1) {
    a.exhausted = true; a.resetAt = Date.now() + hours * 3600000; a.failures++
    console.warn(`[Cloudflare] Account exhausted. Available: ${this.available()}/${this.accounts.length}`)
  }
 
  markDead(a)  { a.exhausted = true; a.dead = true }
  available()  { return this.accounts.filter(a => !a.exhausted && !a.dead).length }
  isEmpty()    { return this.available() === 0 }
 
  nextResetMs() {
    const times = this.accounts.filter(a => a.exhausted && !a.dead && a.resetAt).map(a => a.resetAt)
    return times.length ? Math.max(0, Math.min(...times) - Date.now()) : null
  }
 
  status() {
    return {
      provider:    "Cloudflare",
      total:       this.accounts.length,
      available:   this.available(),
      exhausted:   this.accounts.filter(a => a.exhausted && !a.dead).length,
      dead:        this.accounts.filter(a => a.dead).length,
      nextResetMs: this.nextResetMs(),
    }
  }
 
  _scheduleDailyReset() {
    const now      = new Date()
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
    setTimeout(() => {
      this._reset()
      setInterval(() => this._reset(), 86400000)
    }, midnight - now)
  }
 
  _reset() {
    const now = Date.now(); let n = 0
    this.accounts.forEach(a => {
      if (a.exhausted && !a.dead && a.resetAt && now >= a.resetAt) {
        a.exhausted = false; a.resetAt = null; a.failures = 0; n++
      }
    })
    if (n) console.log(`[Cloudflare] Reset ${n} account(s). Available: ${this.available()}/${this.accounts.length}`)
  }
}
 
// ─── Manager Instances ────────────────────────────────────────────────────────
const zhipuMgr      = new KeyManager(ZHIPU_KEYS,      "ZhipuAI")
const cerebrasMgr   = new KeyManager(CEREBRAS_KEYS,   "Cerebras")
const cfMgr         = new CloudflareManager(CLOUDFLARE_ACCOUNTS)
const sambanovaMgr  = new KeyManager(SAMBANOVA_KEYS,  "Sambanova")
const mistralMgr    = new KeyManager(MISTRAL_KEYS,    "Mistral")
const groqMgr       = new KeyManager(GROQ_KEYS,       "Groq")
const openrouterMgr = new KeyManager(OPENROUTER_KEYS, "OpenRouter")
 
export const getProviderStatus = () => {
  const providers = [
    cerebrasMgr.status(), zhipuMgr.status(), cfMgr.status(),
    sambanovaMgr.status(), mistralMgr.status(), groqMgr.status(),
    openrouterMgr.status(),
  ]
  const resets = providers.map(p => p.nextResetMs).filter(v => v !== null)
  return {
    timestamp:     new Date().toISOString(),
    providers,
    anyAvailable:  providers.some(p => p.available > 0),
    earliestReset: resets.length ? Math.min(...resets) : null,
  }
}
 
// ─── Fetch with Timeout ───────────────────────────────────────────────────────
async function fetchT(url, opts, ms, label) {
  const ctrl  = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } catch (e) {
    if (e.name === "AbortError") { console.warn(`[${label}] timeout`); return null }
    throw e
  } finally {
    clearTimeout(timer)
  }
}
 
// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER CALLERS
// ═══════════════════════════════════════════════════════════════════════════════
async function callCerebras(prompt, timeoutMs, maxTokens) {
  if (cerebrasMgr.isEmpty()) return null
  const k = cerebrasMgr.next(); if (!k) return null
  console.log(`[Cerebras] key=...${k.key.slice(-6)}`)
  try {
    const res = await fetchT(CEREBRAS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${k.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model:"gpt-oss-120b", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: maxTokens }),
    }, timeoutMs, "Cerebras")
    if (!res) return null
    if (res.status === 401 || res.status === 403) { cerebrasMgr.markDead(k); return null }
    if (res.status === 429) { cerebrasMgr.markExhausted(k, 24); return null }
    if (!res.ok) { k.failures++; console.warn(`[Cerebras] HTTP ${res.status}`); return null }
    const d = await res.json()
    const c = d?.choices?.[0]?.message?.content
    if (!c || c.length < 100) return null
    k.failures = 0; console.log("[Cerebras] ✅"); return c
  } catch (e) { console.error(`[Cerebras] ${e.message}`); return null }
}
 
async function callZhipu(prompt, timeoutMs, maxTokens) {
  if (zhipuMgr.isEmpty()) return null
  const k = zhipuMgr.next(); if (!k) return null
  console.log(`[ZhipuAI] key=...${k.key.slice(-6)}`)
  try {
    const res = await fetchT(ZHIPU_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${k.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "glm-4.5-air", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: maxTokens }),
    }, timeoutMs, "ZhipuAI")
    if (!res) return null
    if (res.status === 401 || res.status === 403) { zhipuMgr.markDead(k); return null }
    if (res.status === 429) { zhipuMgr.markExhausted(k, 1); return null }
    if (!res.ok) { k.failures++; console.warn(`[ZhipuAI] HTTP ${res.status}`); return null }
    const d = await res.json()
    const c = d?.choices?.[0]?.message?.content
    if (!c || c.length < 100) return null
    k.failures = 0; console.log("[ZhipuAI] ✅"); return c
  } catch (e) { console.error(`[ZhipuAI] ${e.message}`); return null }
}
 
async function callCloudflare(prompt, timeoutMs, maxTokens) {
  if (cfMgr.isEmpty()) return null
  const acc = cfMgr.next(); if (!acc) return null
  console.log(`[Cloudflare] account=...${acc.accountId.slice(-6)}`)
  const url = `https://api.cloudflare.com/client/v4/accounts/${acc.accountId}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`
  try {
    const res = await fetchT(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${acc.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }], max_tokens: maxTokens }),
    }, timeoutMs, "Cloudflare")
    if (!res) return null
    if (res.status === 401 || res.status === 403) { cfMgr.markDead(acc); return null }
    if (res.status === 429) { cfMgr.markExhausted(acc, 1); return null }
    if (!res.ok) { acc.failures++; console.warn(`[Cloudflare] HTTP ${res.status}`); return null }
    const d = await res.json()
    const c = typeof d?.result?.response === "string"
      ? d.result.response
      : d?.result?.response?.content
      || d?.choices?.[0]?.message?.content
      || (Array.isArray(d?.result?.response) ? d.result.response.map(r => r.response || r.text || "").join("") : null)
    if (!c || c.length < 100) return null
    acc.failures = 0; console.log("[Cloudflare] ✅"); return c
  } catch (e) { console.error(`[Cloudflare] ${e.message}`); return null }
}
 
async function callSambanova(prompt, timeoutMs, maxTokens) {
  if (sambanovaMgr.isEmpty()) return null
  const k = sambanovaMgr.next(); if (!k) return null
  console.log(`[Sambanova] key=...${k.key.slice(-6)}`)
  try {
    const res = await fetchT(SAMBANOVA_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${k.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "Meta-Llama-3.3-70B-Instruct", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: maxTokens }),
    }, timeoutMs, "Sambanova")
    if (!res) return null
    if (res.status === 401 || res.status === 403) { sambanovaMgr.markDead(k); return null }
    if (res.status === 429) { sambanovaMgr.markExhausted(k, 24); return null }
    if (!res.ok) { k.failures++; console.warn(`[Sambanova] HTTP ${res.status}`); return null }
    const d = await res.json()
    const c = d?.choices?.[0]?.message?.content
    if (!c || c.length < 100) return null
    k.failures = 0; console.log("[Sambanova] ✅"); return c
  } catch (e) { console.error(`[Sambanova] ${e.message}`); return null }
}
 
async function callMistral(prompt, timeoutMs, maxTokens) {
  if (mistralMgr.isEmpty()) return null
  const k = mistralMgr.next(); if (!k) return null
  console.log(`[Mistral] key=...${k.key.slice(-6)}`)
  try {
    const res = await fetchT(MISTRAL_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${k.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "mistral-small-latest", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: maxTokens }),
    }, timeoutMs, "Mistral")
    if (!res) return null
    if (res.status === 401 || res.status === 403) { mistralMgr.markDead(k); return null }
    if (res.status === 429) { mistralMgr.markExhausted(k, 1); return null }
    if (!res.ok) { k.failures++; console.warn(`[Mistral] HTTP ${res.status}`); return null }
    const d = await res.json()
    const c = d?.choices?.[0]?.message?.content
    if (!c || c.length < 100) return null
    k.failures = 0; console.log("[Mistral] ✅"); return c
  } catch (e) { console.error(`[Mistral] ${e.message}`); return null }
}
 
async function callGroq(prompt, timeoutMs, maxTokens) {
  if (groqMgr.isEmpty()) return null
  const k = groqMgr.next(); if (!k) return null
  console.log(`[Groq] key=...${k.key.slice(-6)}`)
  try {
    const res = await fetchT(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${k.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: maxTokens }),
    }, timeoutMs, "Groq")
    if (!res) return null
    if (res.status === 401 || res.status === 403) { groqMgr.markDead(k); return null }
    if (res.status === 429 || res.status === 413)  { groqMgr.markExhausted(k, 0.017); return null }
    if (!res.ok) { k.failures++; console.warn(`[Groq] HTTP ${res.status}`); return null }
    const d = await res.json()
    const c = d?.choices?.[0]?.message?.content
    if (!c || c.length < 10) return null
    k.failures = 0; console.log("[Groq] ✅"); return c
  } catch (e) { console.error(`[Groq] ${e.message}`); return null }
}
 
async function callOpenRouterGLM(prompt, timeoutMs, maxTokens) {
  if (openrouterMgr.isEmpty()) return null
  const k = openrouterMgr.next(); if (!k) return null
  console.log(`[OpenRouter/GLM] key=...${k.key.slice(-6)}`)
  try {
    const res = await fetchT(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${k.key}`,
        "Content-Type": "application/json",
        "HTTP-Referer":  process.env.SITE_URL || "https://genweb.ai",
        "X-Title":       "GenWeb.ai",
      },
      body: JSON.stringify({ model: MODEL_GLM, messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: maxTokens }),
    }, timeoutMs, "OpenRouter/GLM")
    if (!res) return null
    if (res.status === 401 || res.status === 403) { openrouterMgr.markDead(k); return null }
    if (res.status === 429 || res.status === 413)  { openrouterMgr.markExhausted(k, 1); return null }
    if (!res.ok) { k.failures++; console.warn(`[OpenRouter/GLM] HTTP ${res.status}`); return null }
    const d = await res.json()
    const c = d?.choices?.[0]?.message?.content
    if (!c || c.length < 100) return null
    k.failures = 0; console.log("[OpenRouter/GLM] ✅"); return c
  } catch (e) { console.error(`[OpenRouter/GLM] ${e.message}`); return null }
}
 
async function callOpenRouterDeepSeek(prompt, timeoutMs, maxTokens) {
  if (openrouterMgr.isEmpty()) return null
  const k = openrouterMgr.next(); if (!k) return null
  console.log(`[OpenRouter/DeepSeek] key=...${k.key.slice(-6)}`)
  try {
    const res = await fetchT(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${k.key}`,
        "Content-Type": "application/json",
        "HTTP-Referer":  process.env.SITE_URL || "https://genweb.ai",
        "X-Title":       "GenWeb.ai",
      },
      body: JSON.stringify({ model: MODEL_DEEPSEEK, messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: maxTokens }),
    }, timeoutMs, "OpenRouter/DeepSeek")
    if (!res) return null
    if (res.status === 401 || res.status === 403) { openrouterMgr.markDead(k); return null }
    if (res.status === 429 || res.status === 413)  { openrouterMgr.markExhausted(k, 1); return null }
    if (!res.ok) { k.failures++; console.warn(`[OpenRouter/DeepSeek] HTTP ${res.status}`); return null }
    const d = await res.json()
    const c = d?.choices?.[0]?.message?.content
    if (!c || c.length < 100) return null
    k.failures = 0; console.log("[OpenRouter/DeepSeek] ✅"); return c
  } catch (e) { console.error(`[OpenRouter/DeepSeek] ${e.message}`); return null }
}
 
// ═══════════════════════════════════════════════════════════════════════════════
// WEBSITE GENERATION PIPELINE
// ─────────────────────────────────────────────────────────────────────────────
// POOL: Only the 5 best models for HTML generation
//   1. OpenRouter/DeepSeek  — best reasoning, never cuts HTML short ⭐⭐⭐⭐⭐
//   2. Cerebras             — fastest, great HTML quality            ⭐⭐⭐⭐
//   3. Sambanova            — same llama-3.3-70b, very reliable      ⭐⭐⭐⭐
//   4. ZhipuAI              — good HTML, solid backup                ⭐⭐⭐⭐
//   5. OpenRouter/GLM       — good backup, same GLM model            ⭐⭐⭐⭐
//
// Mistral, Groq, Cloudflare are NOT in this pool (bad at long HTML)
// They are only used in enhance or as absolute last resort
//
// TRUE PROVIDER ROUND-ROBIN: each request starts at a different provider
// so no single provider handles all the load
// ═══════════════════════════════════════════════════════════════════════════════
let genProviderIdx = 0
 
const GEN_PROVIDERS = [
  { name: "OpenRouter/DeepSeek", call: (p, t, m) => callOpenRouterDeepSeek(p, t, m), mgr: () => openrouterMgr },
  { name: "Cerebras",            call: (p, t, m) => callCerebras(p, t, m),            mgr: () => cerebrasMgr   },
  { name: "Sambanova",           call: (p, t, m) => callSambanova(p, t, m),           mgr: () => sambanovaMgr  },
  { name: "ZhipuAI",             call: (p, t, m) => callZhipu(p, t, m),              mgr: () => zhipuMgr      },
  { name: "OpenRouter/GLM",      call: (p, t, m) => callOpenRouterGLM(p, t, m),      mgr: () => openrouterMgr },
]
 
// Last resort only — if ALL 5 above fail
const GEN_LAST_RESORT = [
  { name: "Cloudflare", call: (p, t, m) => callCloudflare(p, t, m), mgr: () => cfMgr      },
  { name: "Mistral",    call: (p, t, m) => callMistral(p, t, m),    mgr: () => mistralMgr },
]
 
const generateResponse = async (prompt) => {
  const total    = GEN_PROVIDERS.length
  const startIdx = genProviderIdx % total
  genProviderIdx++
 
  console.log(`\n[AI] Gen — starting with: ${GEN_PROVIDERS[startIdx].name} (slot ${startIdx + 1}/${total})`)
 
  // Try all 5 quality providers starting from the rotated index
  for (let i = 0; i < total; i++) {
    const idx      = (startIdx + i) % total
    const provider = GEN_PROVIDERS[idx]
 
    if (provider.mgr().isEmpty()) {
      console.log(`[AI] ${provider.name} exhausted, skipping`)
      continue
    }
 
    console.log(`[AI] → ${provider.name}`)
    const result = await provider.call(prompt, WEBSITE_TIMEOUT, 12000)
    if (result) return result
    console.log(`[AI] ${provider.name} failed, trying next`)
  }
 
  // All 5 quality providers failed — try last resort
  console.warn("[AI] ⚠️ All quality providers failed — trying last resort")
  for (const provider of GEN_LAST_RESORT) {
    if (provider.mgr().isEmpty()) continue
    console.log(`[AI] → ${provider.name} (last resort)`)
    const result = await provider.call(prompt, WEBSITE_TIMEOUT, 12000)
    if (result) return result
  }
 
  console.error("[AI] ❌ All providers failed")
  return null
}
 
// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCE PIPELINE
// ─────────────────────────────────────────────────────────────────────────────
// POOL: Fast models — enhance only needs 200 words, quality less critical
//   1. Groq      — fastest, perfect for short text
//   2. Mistral   — good at instruction following for short output
//   3. Cerebras  — fast fallback
//   4. DeepSeek  — strong fallback
//   5. ZhipuAI   — backup
//   6. GLM       — backup
//   7. Cloudflare — last resort
//
// NOTE: Groq + Mistral + Cloudflare are ONLY used here, never in generation
// This keeps them fresh and available for enhance at all times
// ═══════════════════════════════════════════════════════════════════════════════
let enhProviderIdx = 0
 
const ENHANCE_PROVIDERS = [
  { name: "Groq",                call: (p, t, m) => callGroq(p, t, m),               mgr: () => groqMgr       },
  { name: "Mistral",             call: (p, t, m) => callMistral(p, t, m),            mgr: () => mistralMgr    },
  { name: "Cerebras",            call: (p, t, m) => callCerebras(p, t, m),           mgr: () => cerebrasMgr   },
  { name: "OpenRouter/DeepSeek", call: (p, t, m) => callOpenRouterDeepSeek(p, t, m), mgr: () => openrouterMgr },
  { name: "ZhipuAI",             call: (p, t, m) => callZhipu(p, t, m),             mgr: () => zhipuMgr      },
  { name: "OpenRouter/GLM",      call: (p, t, m) => callOpenRouterGLM(p, t, m),     mgr: () => openrouterMgr },
  { name: "Cloudflare",          call: (p, t, m) => callCloudflare(p, t, m),         mgr: () => cfMgr         },
]
 
export const enhancePromptResponse = async (prompt) => {
  const total    = ENHANCE_PROVIDERS.length
  const startIdx = enhProviderIdx % total
  enhProviderIdx++
 
  console.log(`\n[AI] Enhance — starting with: ${ENHANCE_PROVIDERS[startIdx].name}`)
 
  for (let i = 0; i < total; i++) {
    const idx      = (startIdx + i) % total
    const provider = ENHANCE_PROVIDERS[idx]
 
    if (provider.mgr().isEmpty()) {
      console.log(`[AI] Enhance: ${provider.name} exhausted, skipping`)
      continue
    }
 
    const result = await provider.call(prompt, ENHANCE_TIMEOUT, 800)
    if (result) return result
    console.log(`[AI] Enhance: ${provider.name} failed, trying next`)
  }
 
  console.error("[AI] ❌ Enhance failed")
  return null
}
 
export default generateResponse