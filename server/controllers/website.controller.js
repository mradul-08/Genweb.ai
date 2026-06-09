import generateResponse, { enhancePromptResponse, getProviderStatus } from "../config/openRouter.js"
import Website from "../models/website.model.js"
import User from "../models/user.model.js"

const CREDITS_CONFIG = {
  MIN_CREDITS_REQUIRED: 50,
  COST_PER_GENERATION: 50,
  COST_PER_EDIT: 50,
}

// ══════════════════════════════════════════════════════════════════════════════
// MASTER GENERATION PROMPT
// ══════════════════════════════════════════════════════════════════════════════
const MASTER_PROMPT = `You are a world-class frontend engineer and UI/UX designer. Generate a complete, stunning single-page website.

OUTPUT FORMAT — MANDATORY, NO EXCEPTIONS:
{"title": "Website title here", "message": "Brief description here"}
\`\`\`html
<!DOCTYPE html>
...complete HTML...
</html>
\`\`\`

CRITICAL RULES:
1. Output MUST start with the JSON object, then the html code block
2. HTML MUST be 100% complete — from <!DOCTYPE html> to </html>
3. If running long, SIMPLIFY sections but NEVER stop early or truncate
4. Always close every single HTML tag properly

DESIGN REQUIREMENTS:
- Dark background (#0a0a0f), choose ONE vibrant accent: violet #8b5cf6, cyan #06b6d4, emerald #10b981, rose #f43f5e, or amber #f59e0b
- Import Inter font from Google Fonts
- CSS Grid + Flexbox layout — NO Bootstrap, NO Tailwind
- Glassmorphism cards: backdrop-filter blur(20px), semi-transparent backgrounds
- Gradient text on headings, gradient backgrounds on CTAs
- CSS keyframe animations on hero elements
- Scroll animations via Intersection Observer JS
- Custom CSS properties (variables) at :root
- Mobile responsive with 768px breakpoint
- Hover transitions (0.3s ease) on all interactive elements

MANDATORY SECTIONS:
1. Fixed navbar — blur backdrop, logo left, links right, CTA button, mobile hamburger
2. Hero — full viewport height, bold gradient headline, 2 CTA buttons
3. [Sections based on user request]
4. Footer — dark, logo, columns, copyright

USER REQUEST: `

// ══════════════════════════════════════════════════════════════════════════════
// THUMBNAIL EXTRACTOR
// ══════════════════════════════════════════════════════════════════════════════
function extractThumbnailMeta(html, fallbackTitle = "") {
  let bg     = "#0a0a0f"
  let accent = "#818cf8"
  let title  = fallbackTitle

  try {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch?.[1]?.trim()) title = titleMatch[1].trim().slice(0, 60)

    const bgPatterns = [
      /--(?:bg|background|color-bg|bg-color|background-color)\s*:\s*(#[0-9a-fA-F]{3,8})/i,
      /body\s*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8})/i,
      /:root\s*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8})/i,
    ]
    for (const pat of bgPatterns) {
      const m = html.match(pat)
      if (m?.[1]) { bg = m[1]; break }
    }

    const accentPatterns = [
      /--(?:primary|accent|color-primary|brand|highlight|main-color|theme-color)\s*:\s*(#[0-9a-fA-F]{3,8})/i,
      /--(?:violet|cyan|emerald|rose|amber|purple|blue|pink|teal|green|orange)\s*:\s*(#[0-9a-fA-F]{3,8})/i,
      /linear-gradient\([^)]*?(#[0-9a-fA-F]{6})/i,
    ]
    for (const pat of accentPatterns) {
      const m = html.match(pat)
      if (m?.[1] && m[1].toLowerCase() !== bg.toLowerCase()) {
        accent = m[1]
        break
      }
    }

    const knownAccents = ["#8b5cf6", "#06b6d4", "#10b981", "#f43f5e", "#f59e0b"]
    if (accent === "#818cf8") {
      for (const known of knownAccents) {
        if (html.includes(known)) { accent = known; break }
      }
    }
  } catch {
    // silent
  }

  return { thumbnailBg: bg, thumbnailAccent: accent, thumbnailTitle: title }
}

// ══════════════════════════════════════════════════════════════════════════════
// SMART DIFF SYSTEM
// ══════════════════════════════════════════════════════════════════════════════
const EDIT_TYPES = {
  STYLE: "STYLE", TEXT: "TEXT", SECTION_MOD: "SECTION_MOD",
  SECTION_ADD: "SECTION_ADD", NAV: "NAV", FOOTER: "FOOTER",
  ANIMATION: "ANIMATION", LAYOUT: "LAYOUT", FULL: "FULL",
}

function classifyEdit(prompt) {
  const p = prompt.toLowerCase()
  if (/color|colour|background|bg|gradient|theme|dark|light|palette|shade|hue|tint|opacity|transparent|border|shadow|glow/.test(p))
    return EDIT_TYPES.STYLE
  if (/text|copy|content|heading|title|paragraph|word|sentence|write|change.*to|replace.*with|update.*text|wording/.test(p))
    return EDIT_TYPES.TEXT
  if (/nav|navbar|navigation|menu|header|logo|links|hamburger/.test(p))
    return EDIT_TYPES.NAV
  if (/footer|bottom|copyright/.test(p))
    return EDIT_TYPES.FOOTER
  if (/animat|transition|hover|smooth|fade|slide|bounce|spin|pulse|effect/.test(p))
    return EDIT_TYPES.ANIMATION
  if (/add|insert|include|new section|create.*section|put.*section/.test(p))
    return EDIT_TYPES.SECTION_ADD
  if (/mobile|responsive|layout|grid|flex|column|row|align|center|padding|margin|spacing/.test(p))
    return EDIT_TYPES.LAYOUT
  if (/hero|feature|pricing|testimonial|faq|contact|gallery|about|team|cta/.test(p))
    return EDIT_TYPES.SECTION_MOD
  return EDIT_TYPES.FULL
}

function extractMinimalHTML(fullHTML, editType, prompt) {
  const p = prompt.toLowerCase()

  switch (editType) {
    case EDIT_TYPES.STYLE: {
      const styleMatch = fullHTML.match(/<style[\s\S]*?<\/style>/i)
      if (styleMatch) {
        return { extracted: styleMatch[0], mode: "style_only", instruction: "Return ONLY the complete updated <style> tag. Nothing else." }
      }
      return { extracted: fullHTML, mode: "full", instruction: "" }
    }

    case EDIT_TYPES.TEXT: {
      const sectionKeywords = {
        hero: ["hero","headline","heading","main text","banner"],
        features: ["feature","benefit","card"],
        pricing: ["pricing","plan","cost"],
        testimonials: ["testimonial","review","quote"],
        faq: ["faq","question","answer"],
        contact: ["contact","form","email"],
        nav: ["nav","menu","link"],
        footer: ["footer","copyright"],
      }
      let targetSection = null
      for (const [section, keywords] of Object.entries(sectionKeywords)) {
        if (keywords.some(k => p.includes(k))) { targetSection = section; break }
      }
      if (targetSection) {
        const extracted = extractSection(fullHTML, targetSection)
        if (extracted) {
          return { extracted, mode: "section_patch", sectionName: targetSection, instruction: `Return ONLY the updated HTML for the ${targetSection} section. Keep all classes and IDs identical.` }
        }
      }
      return { extracted: extractBodyNoScript(fullHTML), mode: "body_only", instruction: "Return complete updated HTML body content only (no <script> tags unless modifying JS)." }
    }

    case EDIT_TYPES.NAV: {
      const nav = extractSection(fullHTML, "nav")
      if (nav) return { extracted: nav, mode: "section_patch", sectionName: "nav", instruction: "Return ONLY the updated <nav> element HTML." }
      return { extracted: fullHTML, mode: "full", instruction: "" }
    }

    case EDIT_TYPES.FOOTER: {
      const footer = extractSection(fullHTML, "footer")
      if (footer) return { extracted: footer, mode: "section_patch", sectionName: "footer", instruction: "Return ONLY the updated <footer> element HTML." }
      return { extracted: fullHTML, mode: "full", instruction: "" }
    }

    case EDIT_TYPES.ANIMATION: {
      const styleMatch = fullHTML.match(/<style[\s\S]*?<\/style>/i)
      const scriptMatch = fullHTML.match(/<script[\s\S]*?<\/script>/gi)
      const animScript  = scriptMatch?.find(s => /intersection|observer|animate|scroll/i.test(s))
      const extracted   = [styleMatch?.[0], animScript].filter(Boolean).join("\n\n")
      if (extracted.length > 100) {
        return { extracted, mode: "style_script_patch", instruction: "Return ONLY the updated <style> tag and/or <script> tag for animations. Nothing else." }
      }
      return { extracted: fullHTML, mode: "full", instruction: "" }
    }

    case EDIT_TYPES.SECTION_ADD: {
      const skeleton = buildSkeleton(fullHTML)
      return { extracted: skeleton, mode: "section_add", instruction: "Return ONLY the new section HTML to be inserted. Include any needed CSS as a <style> block before it. Do NOT return the full page." }
    }

    case EDIT_TYPES.LAYOUT: {
      const styleMatch = fullHTML.match(/<style[\s\S]*?<\/style>/i)
      return { extracted: styleMatch ? styleMatch[0] : fullHTML, mode: "style_only", instruction: "Return ONLY the complete updated <style> tag with layout/responsive fixes." }
    }

    case EDIT_TYPES.SECTION_MOD: {
      const sectionNames = ["hero","features","pricing","testimonials","faq","contact","gallery","about","team"]
      for (const name of sectionNames) {
        if (p.includes(name) || p.includes(name.slice(0, -1))) {
          const extracted = extractSection(fullHTML, name)
          if (extracted) {
            return { extracted, mode: "section_patch", sectionName: name, instruction: `Return ONLY the updated HTML for the ${name} section. Keep all classes and IDs.` }
          }
        }
      }
      return { extracted: fullHTML, mode: "full", instruction: "" }
    }

    default:
      return { extracted: fullHTML, mode: "full", instruction: "" }
  }
}

function extractSection(html, sectionName) {
  const idPattern = new RegExp(`<(section|div|nav|footer|header)[^>]*id=["']${sectionName}["'][^>]*>[\\s\\S]*?<\\/\\1>`, "i")
  let match = html.match(idPattern)
  if (match) return match[0]

  const classPattern = new RegExp(`<(section|div|nav|footer|header)[^>]*class=["'][^"']*${sectionName}[^"']*["'][^>]*>[\\s\\S]*?<\\/\\1>`, "i")
  match = html.match(classPattern)
  if (match) return match[0]

  if (["nav","footer","header"].includes(sectionName)) {
    const tagPattern = new RegExp(`<${sectionName}[\\s\\S]*?<\\/${sectionName}>`, "i")
    match = html.match(tagPattern)
    if (match) return match[0]
  }

  return null
}

function extractBodyNoScript(html) {
  let body = html.replace(/<script[\s\S]*?<\/script>/gi, "")
  const bodyMatch = body.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  return bodyMatch ? bodyMatch[1] : body
}

function buildSkeleton(html) {
  const sections = []
  const sectionPattern = /<(section|div)[^>]*(?:id|class)=["']([^"']*)["'][^>]*>/gi
  let match
  while ((match = sectionPattern.exec(html)) !== null) {
    sections.push(`<!-- ${match[2]} section -->`)
  }
  const style = html.match(/<style[\s\S]*?<\/style>/i)?.[0] || ""
  return style + "\n" + sections.join("\n") + "\n<!-- Add new section after relevant existing section -->"
}

function patchHTML(fullHTML, extracted, mode, sectionName, aiResponse) {
  const cleaned = cleanAIResponse(aiResponse)

  switch (mode) {
    case "style_only": {
      const newStyle = cleaned.match(/<style[\s\S]*?<\/style>/i)?.[0]
      if (!newStyle) return null
      const oldStyle = fullHTML.match(/<style[\s\S]*?<\/style>/i)?.[0]
      if (oldStyle) return fullHTML.replace(oldStyle, newStyle)
      return fullHTML.replace("</head>", newStyle + "\n</head>")
    }

    case "style_script_patch": {
      let result = fullHTML
      const newStyle = cleaned.match(/<style[\s\S]*?<\/style>/i)?.[0]
      const newScript = cleaned.match(/<script[\s\S]*?<\/script>/i)?.[0]
      if (newStyle) {
        const oldStyle = fullHTML.match(/<style[\s\S]*?<\/style>/i)?.[0]
        if (oldStyle) result = result.replace(oldStyle, newStyle)
      }
      if (newScript) {
        const scripts = [...result.matchAll(/<script[\s\S]*?<\/script>/gi)]
        if (scripts.length > 0) {
          const last = scripts[scripts.length - 1]
          result = result.slice(0, last.index) + newScript + result.slice(last.index + last[0].length)
        }
      }
      return result
    }

    case "section_patch": {
      if (!sectionName) return null
      const oldSection = extractSection(fullHTML, sectionName)
      if (!oldSection) return null
      const newSection = extractSection(cleaned, sectionName) || cleaned
      return fullHTML.replace(oldSection, newSection)
    }

    case "section_add": {
      return fullHTML.replace("</body>", cleaned + "\n</body>")
    }

    case "body_only": {
      const bodyMatch = fullHTML.match(/(<body[^>]*>)([\s\S]*)(<\/body>)/i)
      if (!bodyMatch) return null
      return fullHTML.replace(bodyMatch[2], "\n" + cleaned + "\n")
    }

    default:
      return null
  }
}

function cleanAIResponse(raw) {
  return raw.replace(/```html\s*/gi, "").replace(/```\s*/gi, "").trim()
}

function buildEditPrompt(editType, extracted, userRequest, instruction) {
  return `You are a precise HTML/CSS editor. Make ONLY the requested change.

TASK: ${userRequest}

${instruction}

CURRENT CODE:
${extracted}

RULES:
- Return ONLY what the instruction asks for
- No explanations, no markdown fences
- Preserve all existing class names and IDs
- Keep the same design language and dark theme`
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ══════════════════════════════════════════════════════════════════════════════
const robustExtract = (raw) => {
  if (!raw || typeof raw !== "string" || !raw.trim()) return null
  let title = "Generated Website", message = "Website successfully generated.", code = ""
  try {
    const firstBrace = raw.indexOf("{"), firstClose = raw.indexOf("}")
    if (firstBrace !== -1 && firstClose !== -1 && firstClose > firstBrace) {
      const p = JSON.parse(raw.slice(firstBrace, firstClose + 1))
      if (p.title) title = p.title
      if (p.message) message = p.message
    }
  } catch {
    const t = raw.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)
    const m = raw.match(/"message"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)
    if (t) title = t[1]; if (m) message = m[1]
  }
  const htmlBlock = raw.match(/```html\s*([\s\S]*?)\s*```/i)
  if (htmlBlock?.[1]?.trim().length > 200) { code = htmlBlock[1].trim() }
  else {
    const lo = raw.toLowerCase()
    const s = lo.indexOf("<!doctype"), e = lo.lastIndexOf("</html>")
    if (s !== -1 && e !== -1) code = raw.slice(s, e + 7).trim()
  }
  if (!code || code.length < 500) return null
  return { title, message, code }
}

const validateParsed = (p) => {
  if (!p?.code || p.code.length < 2000) return { valid: false, reason: "Code too short" }
  const lo = p.code.toLowerCase()
  if (!lo.includes("<!doctype")) return { valid: false, reason: "Missing DOCTYPE" }
  if (!lo.includes("</html>"))   return { valid: false, reason: "Missing </html>" }
  if (!lo.includes("</body>"))   return { valid: false, reason: "Missing </body>" }
  return { valid: true }
}

const generateSlug = (title) =>
  title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 40)
  + "-" + Math.random().toString(36).slice(2, 6)

const humanTime = (ms) => {
  if (!ms || ms <= 0) return "soon"
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m} min` : "less than a minute"
}

async function runGeneration(prompt, maxTokens = 12000) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const raw = await generateResponse(prompt)
    if (!raw) continue
    const parsed = robustExtract(raw)
    if (!parsed) continue
    const { valid } = validateParsed(parsed)
    if (valid) return parsed
  }
  return null
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLERS
// ══════════════════════════════════════════════════════════════════════════════
export const getApiStatus = async (req, res) => {
  try {
    const s = getProviderStatus()
    return res.json({ success: true, available: s.anyAvailable, providers: s.providers })
  } catch (e) { return res.status(500).json({ success: false, message: e.message }) }
}

export const enhancePrompt = async (req, res) => {
  try {
    const { prompt } = req.body
    if (!prompt?.trim()) return res.status(400).json({ success: false, message: "Prompt required" })
    const instruction = `Expand this website idea into a detailed description (max 150 words). Include: layout, sections, design style, target audience. Return ONLY JSON: {"enhancedPrompt": "..."}\n\nIdea: "${prompt.trim()}"`
    const raw = await enhancePromptResponse(instruction)
    if (!raw) return res.status(503).json({ success: false, message: "Enhance engine busy" })
    let text = raw.trim()
    try {
      const clean = text.replace(/```json|```/g, "").trim()
      const f = clean.indexOf("{"), l = clean.lastIndexOf("}")
      if (f !== -1 && l !== -1) {
        const p = JSON.parse(clean.slice(f, l + 1))
        text = p?.enhancedPrompt || p?.enhanced_prompt || text
      }
    } catch {}
    return res.json({ success: true, enhancedPrompt: text.slice(0, 1500) })
  } catch (e) { return res.status(500).json({ success: false, message: e.message }) }
}

export const generateWebsite = async (req, res) => {
  try {
    const { prompt } = req.body
    if (!prompt?.trim()) return res.status(400).json({ success: false, message: "Prompt required" })
    const user = req.user
    if ((user.credits ?? 0) < CREDITS_CONFIG.MIN_CREDITS_REQUIRED)
      return res.status(403).json({ success: false, message: `Need ${CREDITS_CONFIG.MIN_CREDITS_REQUIRED} credits` })

    const parsed = await runGeneration(MASTER_PROMPT + prompt.trim())
    if (!parsed) {
      const s = getProviderStatus()
      return res.status(503).json({ success: false, message: "Generation failed", nextResetHuman: humanTime(s.earliestReset) })
    }

    user.credits -= CREDITS_CONFIG.COST_PER_GENERATION
    await user.save()

    const title = (parsed.title || prompt.trim()).slice(0, 80)
    const { thumbnailBg, thumbnailAccent, thumbnailTitle } = extractThumbnailMeta(parsed.code, title)

    const website = await Website.create({
      user:           user._id,
      title,
      latestCode:     parsed.code,
      slug:           generateSlug(title),
      thumbnailBg,
      thumbnailAccent,
      thumbnailTitle,
      conversation: [
        { role: "user", content: prompt.trim() },
        { role: "ai",   content: parsed.message || "Website generated." },
      ],
    })

    return res.status(201).json({
      success:   true,
      message:   parsed.message,
      code:      parsed.code,
      websiteId: website._id,
      website:   { id: website._id, title: website.title, slug: website.slug },
      credits:   { used: CREDITS_CONFIG.COST_PER_GENERATION, remaining: user.credits },
    })
  } catch (e) {
    console.error("[generateWebsite]", e)
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const getUserWebsites = async (req, res) => {
  try {
    const websites = await Website.find({ user: req.user._id })
      .select("title slug deployed deployUrl createdAt thumbnailBg thumbnailAccent thumbnailTitle")
      .sort({ createdAt: -1 })
    return res.json({ success: true, websites })
  } catch (e) { return res.status(500).json({ success: false, message: e.message }) }
}

export const getWebsite = async (req, res) => {
  try {
    const w = await Website.findOne({ _id: req.params.id, user: req.user._id })
    if (!w) return res.status(404).json({ success: false, message: "Not found" })
    return res.json({ success: true, website: w })
  } catch (e) { return res.status(500).json({ success: false, message: e.message }) }
}

export const updateWebsite = async (req, res) => {
  try {
    const { prompt } = req.body
    if (!prompt?.trim()) return res.status(400).json({ success: false, message: "Prompt required" })

    const user    = req.user
    const website = await Website.findOne({ _id: req.params.id, user: user._id })
    if (!website) return res.status(404).json({ success: false, message: "Not found" })
    if ((user.credits ?? 0) < CREDITS_CONFIG.MIN_CREDITS_REQUIRED)
      return res.status(403).json({ success: false, message: "Insufficient credits" })

    const fullHTML = website.latestCode
    const editType = classifyEdit(prompt.trim())
    console.log(`[SmartEdit] Type: ${editType} | Prompt: "${prompt.slice(0, 60)}..."`)

    const { extracted, mode, sectionName, instruction } = extractMinimalHTML(fullHTML, editType, prompt.trim())
    const tokenSavings = Math.round((1 - extracted.length / fullHTML.length) * 100)
    console.log(`[SmartEdit] Mode: ${mode} | Extracted: ${extracted.length} chars (saved ~${tokenSavings}% tokens)`)

    let finalCode = null

    if (mode === "full") {
      const fullPrompt = `You are a world-class frontend engineer editing an existing website.

OUTPUT FORMAT - MANDATORY:
{"title": "...", "message": "Brief description of change"}
\`\`\`html
<!DOCTYPE html>
...COMPLETE modified HTML...
</html>
\`\`\`

RULES: Return COMPLETE HTML. Preserve all existing styles. Only change what's requested.

CURRENT CODE:
${fullHTML}

MODIFICATION: ${prompt.trim()}`

      const parsed = await runGeneration(fullPrompt)
      if (!parsed) return res.status(503).json({ success: false, message: "Update failed — try again." })
      finalCode = parsed.code

    } else {
      const editPrompt = buildEditPrompt(editType, extracted, prompt.trim(), instruction)
      const raw = await generateResponse(editPrompt)

      if (!raw) return res.status(503).json({ success: false, message: "AI busy — try again." })

      const patched = patchHTML(fullHTML, extracted, mode, sectionName, raw)

      if (patched && patched.length > 1000) {
        finalCode = patched
        console.log(`[SmartEdit] ✅ Patched successfully`)
      } else {
        console.log(`[SmartEdit] Patch failed, falling back to full regen`)
        const fallbackPrompt = `Edit this website: ${prompt.trim()}\n\nReturn complete HTML.\n\nCURRENT:\n${fullHTML}`
        const parsed = await runGeneration(fallbackPrompt)
        if (!parsed) return res.status(503).json({ success: false, message: "Update failed." })
        finalCode = parsed.code
      }
    }

    user.credits -= CREDITS_CONFIG.COST_PER_EDIT
    await user.save()

    website.latestCode = finalCode
    website.conversation.push(
      { role: "user", content: prompt.trim() },
      { role: "ai",   content: `Done! Applied: ${prompt.trim().slice(0, 80)}` }
    )
    await website.save()

    return res.json({
      success:  true,
      message:  `Applied: ${prompt.trim().slice(0, 60)}`,
      code:     finalCode,
      editType,
      mode,
      credits:  { used: CREDITS_CONFIG.COST_PER_EDIT, remaining: user.credits },
    })
  } catch (e) {
    console.error("[updateWebsite]", e)
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const deleteWebsite = async (req, res) => {
  try {
    const w = await Website.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!w) return res.status(404).json({ success: false, message: "Not found" })
    return res.json({ success: true, message: "Deleted successfully" })
  } catch (e) { return res.status(500).json({ success: false, message: e.message }) }
}

// ══════════════════════════════════════════════════════════════════════════════
// DEPLOY — serves HTML directly from Express at /s/:slug
// Zero cost, zero external dependency, works on any server/VPS
// ══════════════════════════════════════════════════════════════════════════════

export const deployWebsite = async (req, res) => {
  try {
    const website = await Website.findOne({ _id: req.params.id, user: req.user._id })
    if (!website) return res.status(404).json({ success: false, message: "Not found" })

    // Ensure slug exists
    if (!website.slug) {
      website.slug = generateSlug(website.title)
    }

    const baseUrl  = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3002}`
    const deployUrl = `${baseUrl}/s/${website.slug}`

    website.deployed  = true
    website.deployUrl = deployUrl
    await website.save()

    console.log(`[Deploy] ✅ "${website.title}" → ${deployUrl}`)

    return res.json({
      success:   true,
      deployUrl,
      slug:      website.slug,
      message:   "Deployed successfully!",
    })
  } catch (e) {
    console.error("[deployWebsite]", e)
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const undeployWebsite = async (req, res) => {
  try {
    const website = await Website.findOne({ _id: req.params.id, user: req.user._id })
    if (!website) return res.status(404).json({ success: false, message: "Not found" })

    website.deployed  = false
    website.deployUrl = ""
    await website.save()

    console.log(`[Undeploy] "${website.title}" taken offline`)
    return res.json({ success: true, message: "Site taken offline." })
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

// ── Public route — NO auth — serves raw HTML at GET /s/:slug ─────────────────
export const serveDeployedSite = async (req, res) => {
  try {
    const { slug } = req.params
    const website  = await Website.findOne({ slug, deployed: true })

    if (!website) {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"
      return res.status(404).send(`<!DOCTYPE html>
<html><head><title>Not Found — GenWeb.ai</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#040408;color:#fff;font-family:system-ui,sans-serif;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    min-height:100vh;gap:16px;text-align:center;padding:24px}
  h1{font-size:64px;font-weight:800;background:linear-gradient(135deg,#818cf8,#38bdf8);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent}
  p{color:rgba(255,255,255,0.45);font-size:16px;line-height:1.7;max-width:400px}
  a{display:inline-flex;align-items:center;gap:8px;margin-top:8px;padding:12px 28px;
    border-radius:12px;background:linear-gradient(135deg,#818cf8,#38bdf8);
    color:#fff;text-decoration:none;font-weight:700;font-size:14px}
</style></head>
<body>
  <h1>404</h1>
  <p>This site isn't deployed or the link has expired.</p>
  <a href="${clientUrl}">✦ Build your own with GenWeb.ai</a>
</body></html>`)
    }

    // Inject "Powered by GenWeb.ai" ribbon + prevent clickjacking
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"
    const ribbon = `<style>
#__gwai_ribbon{position:fixed;bottom:16px;right:16px;z-index:2147483647;
  display:flex;align-items:center;gap:7px;padding:8px 16px;
  border-radius:999px;background:rgba(4,4,12,0.88);
  border:1px solid rgba(129,140,248,0.4);backdrop-filter:blur(16px);
  text-decoration:none;font-family:system-ui,sans-serif;font-size:12px;
  font-weight:700;color:#a5b4fc;box-shadow:0 4px 24px rgba(0,0,0,0.5);
  transition:all .2s;letter-spacing:-.01em}
#__gwai_ribbon:hover{border-color:rgba(129,140,248,0.8);color:#c7d2fe;
  transform:translateY(-2px);box-shadow:0 8px 32px rgba(129,140,248,0.25)}
</style>
<a id="__gwai_ribbon" href="${clientUrl}" target="_blank" rel="noopener">
  ✦ Built with GenWeb.ai
</a>`

    let html = website.latestCode

    if (html.includes("</body>")) {
      html = html.replace(/<\/body>/i, ribbon + "\n</body>")
    } else {
      html += ribbon
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8")
    res.setHeader("X-Frame-Options", "SAMEORIGIN")
    res.setHeader("Cache-Control", "public, max-age=60")
    return res.send(html)

  } catch (e) {
    console.error("[serveDeployedSite]", e)
    return res.status(500).send("Server error")
  }
}
