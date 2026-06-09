// server/utils/templateLoader.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = path.join(__dirname, '../templates')

// Cache — ek baar read karo, memory mein rakhو
const templateCache = {}

export function loadTemplate(templateId) {
  // Cache check
  if (templateCache[templateId]) {
    console.log(`[Template] Loaded from cache: ${templateId}`)
    return templateCache[templateId]
  }

  const filePath = path.join(TEMPLATES_DIR, `${templateId}.html`)

  // File exist karti hai?
  if (!fs.existsSync(filePath)) {
    console.warn(`[Template] ${templateId}.html not found → fallback to saas`)
    // Saas template fallback
    const fallback = path.join(TEMPLATES_DIR, 'saas.html')
    if (!fs.existsSync(fallback)) {
      throw new Error('No templates found. Please create templates/saas.html')
    }
    templateCache[templateId] = fs.readFileSync(fallback, 'utf-8')
    return templateCache[templateId]
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  templateCache[templateId] = content
  console.log(`[Template] Loaded: ${templateId}.html (${content.length} chars)`)
  return content
}

// Server start pe saari templates preload karo
export function preloadTemplates() {
  const templates = ['saas', 'portfolio', 'agency', 'restaurant', 'ecommerce', 'startup', 'blog', 'business']
  let loaded = 0
  
  templates.forEach(id => {
    try {
      loadTemplate(id)
      loaded++
    } catch (e) {
      // Template nahi hai toh skip
    }
  })
  
  console.log(`[Templates] ${loaded}/${templates.length} templates preloaded`)
}