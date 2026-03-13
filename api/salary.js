// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CheckSalary.us — Secure AI Proxy with Smart Caching
// API key is safe (server-side only, never in browser)
// Caching: same query = free, only new queries cost money
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// In-memory cache (survives for the lifetime of the serverless instance)
// For production upgrade: replace with Redis / Vercel KV (still cheap)
const cache = new Map();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — salary data doesn't change daily

// Normalize query so "software engineer" and "Software Engineer " hit same cache key
function cacheKey(title, city, experience) {
  return `${title.toLowerCase().trim()}|${(city || 'us').toLowerCase().trim()}|${experience}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, city, experience } = req.body;
  if (!title) return res.status(400).json({ error: 'Job title is required' });

  const key = cacheKey(title, city, experience);

  // ── CHECK CACHE FIRST ──────────────────────────────────
  if (cache.has(key)) {
    const cached = cache.get(key);
    const age = Date.now() - cached.timestamp;

    if (age < CACHE_TTL_MS) {
      // Cache hit — return instantly, costs $0.000
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Age', Math.round(age / 1000 / 60) + 'm');
      return res.status(200).json({ ...cached.data, _cached: true });
    } else {
      // Cache expired — delete and refresh
      cache.delete(key);
    }
  }

  // ── CACHE MISS — call Claude AI ────────────────────────
  const expMap = {
    entry:  '0–2 years (entry level)',
    mid:    '3–6 years (mid level)',
    senior: '7–12 years (senior level)',
    lead:   '13+ years (lead/executive)'
  };

  const prompt = `You are a salary intelligence expert. Research the current salary for:
- Job Title: ${title}
- Location: ${city || 'United States national average'}
- Experience: ${expMap[experience] || expMap.mid}

Search the web for current salary data from BLS, Glassdoor, LinkedIn, Indeed, and Levels.fyi.

Return ONLY a valid JSON object, no markdown, no extra text:
{
  "p10": 75000,
  "p25": 95000,
  "p50": 120000,
  "p75": 150000,
  "p90": 180000,
  "withBonus": 130000,
  "totalComp": 148000,
  "yoyGrowth": "+4.2%",
  "narrative": "2-3 insightful paragraphs about salary for ${title} in ${city || 'the US'}. Cover current market rate, what drives salary differences, negotiation tips, and trends. Be specific and useful.",
  "sources": ["BLS OEWS 2024", "Glassdoor", "LinkedIn Salary", "Indeed"]
}

All values must be realistic annual USD integers based on real current market data.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',  // ← Haiku is 10x cheaper than Sonnet, still great for salary data
        max_tokens: 1200,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Anthropic API error' });
    }

    const data = await response.json();

    // Extract text from response
    let rawText = '';
    for (const block of data.content) {
      if (block.type === 'text') rawText += block.text;
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Could not parse AI response' });

    const salaryData = JSON.parse(jsonMatch[0]);

    // ── SAVE TO CACHE ──────────────────────────────────────
    cache.set(key, { data: salaryData, timestamp: Date.now() });

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(salaryData);

  } catch (err) {
    console.error('Salary API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
