// server/utils/classifier.js

const TEMPLATE_KEYWORDS = {
  saas: [
    'saas', 'software', 'app', 'tool', 'platform', 
    'analytics', 'dashboard', 'crm', 'api', 'cloud',
    'subscription', 'b2b', 'productivity', 'automation'
  ],
  portfolio: [
    'portfolio', 'personal', 'designer', 'developer',
    'freelancer', 'resume', 'cv', 'about me', 'showcase',
    'photographer', 'artist', 'creative professional'
  ],
  agency: [
    'agency', 'creative', 'studio', 'marketing', 
    'branding', 'design firm', 'digital agency',
    'advertising', 'consulting', 'services'
  ],
  restaurant: [
    'restaurant', 'food', 'cafe', 'menu', 'dining',
    'hotel', 'bakery', 'bar', 'bistro', 'catering',
    'delivery', 'cuisine', 'chef'
  ],
  ecommerce: [
    'shop', 'store', 'ecommerce', 'product', 'sell',
    'buy', 'marketplace', 'fashion', 'clothing', 'retail',
    'cart', 'checkout', 'inventory'
  ],
  startup: [
    'startup', 'launch', 'mvp', 'waitlist', 'coming soon',
    'pre-launch', 'beta', 'early access', 'fundraising',
    'pitch', 'investor'
  ],
  blog: [
    'blog', 'magazine', 'news', 'articles', 'writing',
    'content', 'journal', 'newsletter', 'media', 'podcast'
  ],
  business: [
    'business', 'company', 'corporate', 'enterprise',
    'professional', 'firm', 'office', 'solution', 'service'
  ]
}

export function classifyTemplate(userPrompt) {
  const lower = userPrompt.toLowerCase()
  
  const scores = {}
  
  for (const [template, keywords] of Object.entries(TEMPLATE_KEYWORDS)) {
    scores[template] = keywords.filter(kw => lower.includes(kw)).length
  }
  
  // Sabse zyada match wala template
  const best = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0]
  
  // Agar koi match nahi toh saas default
  if (best[1] === 0) {
    console.log('[Classifier] No match found → defaulting to saas')
    return 'saas'
  }
  
  console.log(`[Classifier] "${userPrompt.slice(0, 50)}..." → ${best[0]} (score: ${best[1]})`)
  return best[0]
}