import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Hono } from 'hono'
import type { Env } from '../config/env'
import { catalog, openapi } from '../registry/catalog'
import { endpoints } from '../registry/endpoints'
import {
  PLATFORM,
  agentsMd,
  agentCard,
  agentManifest,
  aiPlugin,
  brandingHtml,
  llmsTxt,
  LOGO_SVG,
  OG_SVG,
  publicOrigin,
  wellKnownX402,
} from '../discovery/platform'

/** Resolve brand assets without import.meta (Render tsc emits CommonJS). */
function resolveAssetsDir(): string {
  const candidates = [
    join(process.cwd(), 'x402-server', 'public'),
    join(process.cwd(), 'public'),
  ]
  for (const dir of candidates) {
    if (existsSync(join(dir, 'logo.webp')) || existsSync(join(dir, 'og.png'))) return dir
  }
  return candidates[0]
}

const assetsDir = resolveAssetsDir()

function readAsset(name: string): Buffer | null {
  const path = join(assetsDir, name)
  if (!existsSync(path)) return null
  return readFileSync(path)
}

function wantsHtml(accept: string | undefined): boolean {
  if (!accept) return true
  const a = accept.toLowerCase()
  if (a.includes('application/json') && !a.includes('text/html')) return false
  return a.includes('text/html') || a.includes('*/*') || a.includes('text/*')
}

export function registerPublicRoutes(app: Hono, env: Env) {
  const origin = publicOrigin(PLATFORM.apiBase || env.X402_PUBLIC_URL)
  const payTo = PLATFORM.payTo || env.X402_PAYTO_ADDRESS

  // GoPlausible scrapes `/` for og:* / title / icons — serve HTML to crawlers, JSON to API clients.
  app.get('/', c => {
    if (wantsHtml(c.req.header('accept'))) {
      return c.html(brandingHtml(origin))
    }
    return c.json({
      service: PLATFORM.name,
      version: '1.0.0',
      website: PLATFORM.website,
      merchantId: PLATFORM.merchantId,
      payTo,
      logo: `${PLATFORM.website}${PLATFORM.logoPath}`,
      image: `${PLATFORM.website}${PLATFORM.ogPath}`,
      catalog: '/v1/catalog',
      openapi: '/v1/openapi.json',
      wellKnown: {
        x402: '/.well-known/x402',
        agentCard: '/.well-known/agent-card.json',
        agent: '/.well-known/agent.json',
        aiPlugin: '/.well-known/ai-plugin.json',
      },
      llms: '/llms.txt',
      agents: '/agents.md',
    })
  })

  app.get('/logo.webp', c => {
    const file = readAsset('logo.webp')
    if (!file) return c.body(LOGO_SVG, 200, { 'content-type': 'image/svg+xml; charset=utf-8' })
    return c.body(new Uint8Array(file), 200, {
      'content-type': 'image/webp',
      'cache-control': 'public, max-age=86400',
    })
  })
  app.get('/og.png', c => {
    const file = readAsset('og.png')
    if (!file) return c.body(OG_SVG, 200, { 'content-type': 'image/svg+xml; charset=utf-8' })
    return c.body(new Uint8Array(file), 200, {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=86400',
    })
  })
  // Back-compat redirects for older scrapers / bookmarks
  app.get('/logo.svg', c => c.redirect(PLATFORM.logoPath, 302))
  app.get('/og.svg', c => c.redirect(PLATFORM.ogPath, 302))
  app.get('/favicon.ico', c => c.redirect(PLATFORM.logoPath, 302))

  app.get('/.well-known/x402', c =>
    c.json(wellKnownX402(origin, payTo, env.X402_USDC_ASA_ID)),
  )
  app.get('/.well-known/agent-card.json', c => c.json(agentCard(origin)))
  app.get('/.well-known/agent.json', c => c.json(agentManifest(origin)))
  app.get('/.well-known/ai-plugin.json', c => c.json(aiPlugin(origin)))
  app.get('/llms.txt', c => c.text(llmsTxt(origin), 200, { 'content-type': 'text/plain; charset=utf-8' }))
  app.get('/agents.md', c => c.text(agentsMd(origin), 200, { 'content-type': 'text/markdown; charset=utf-8' }))

  app.get('/health', c => c.json({ status:'ok', service: PLATFORM.name, version:'1.0.0', uptimeSeconds:process.uptime(), merchantId: PLATFORM.merchantId, components:{ x402:{status:payTo?'configured':'misconfigured',facilitator:'GoPlausible'}, marketProviders:{status:'configured',mode:env.DATA_MODE}, indexer:{status:'configured'}, ai:{status:env.GEMINI_API_KEY||env.GROQ_API_KEY||env.OLLAMA_BASE_URL?'configured':'disabled',provider:env.LLM_PROVIDER} } }))
  app.get('/info', c => c.json({
    service: PLATFORM.name,
    version: '1.0.0',
    website: PLATFORM.website,
    merchantId: PLATFORM.merchantId,
    network: 'Algorand Mainnet',
    paymentAsset: { symbol: 'USDC', asaId: env.X402_USDC_ASA_ID },
    facilitator: 'GoPlausible',
    logo: `${PLATFORM.website}${PLATFORM.logoPath}`,
    image: `${PLATFORM.website}${PLATFORM.ogPath}`,
    endpoints: endpoints.length,
    catalog: '/v1/catalog',
    openapi: '/v1/openapi.json',
    discovery: {
      wellKnownX402: '/.well-known/x402',
      agentCard: '/.well-known/agent-card.json',
      agent: '/.well-known/agent.json',
      aiPlugin: '/.well-known/ai-plugin.json',
      llms: '/llms.txt',
      agents: '/agents.md',
    },
  }))

  app.get('/v1/catalog', c => c.json({ success:true, data: catalog() }))
  app.get('/v1/openapi.json', c => c.json(openapi(origin)))
}
