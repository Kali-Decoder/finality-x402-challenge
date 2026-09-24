import { endpoints } from '../registry/endpoints'
import { ALGORAND_MAINNET_CAIP2, MAINNET_USDC_ASA_ID } from '../config/payment'

/** Platform identity scraped by GoPlausible for merchant WVo0V1JSUEYzMklQNFdHSDVLUk9ERjJL */
export const PLATFORM = {
  name: 'Finality Market Intelligence',
  shortName: 'Finality',
  description:
    'Agent- and user-accessible market, AI, and Algorand on-chain intelligence — paid per result with Mainnet USDC via x402.',
  website: 'https://finality.accuracy.wtf',
  apiBase: 'https://finality-x402-backend.onrender.com',
  logoPath: '/logo.webp',
  ogPath: '/og.png',
  themeColor: '#0B0E11',
  payTo: 'UEET5PA753P26B6LVUSXUKUYDVM33YLE6ETZWPLJDHJXQDKNYOUZPFKCSU',
  usdcAsaId: MAINNET_USDC_ASA_ID,
  facilitator: 'https://facilitator.goplausible.xyz',
  merchantId: 'WVo0V1JSUEYzMklQNFdHSDVLUk9ERjJL',
} as const

/** GoPlausible Bazaar / x402-Global challenge discovery tags (402 + well-known metadata). */
export const GOPLAUSIBLE_TAGS = [
  'finality',
  'x402',
  'algorand',
  'x402-global-challenge',
] as const

export function publicOrigin(envPublicUrl?: string): string {
  const base = (envPublicUrl || PLATFORM.apiBase).replace(/\/$/, '')
  return base || PLATFORM.apiBase
}

export function brandingHtml(origin: string): string {
  // Prefer website-hosted assets (already live on Vercel) so GoPlausible enrichment
  // works even when the Render service lags behind a git push.
  const logo = `${PLATFORM.website}${PLATFORM.logoPath}`
  const og = `${PLATFORM.website}${PLATFORM.ogPath}`
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${PLATFORM.name}</title>
  <meta name="description" content="${PLATFORM.description}" />
  <meta name="keywords" content="${[...GOPLAUSIBLE_TAGS, 'x402-Global challenge', 'GoPlausible', 'Bazaar'].join(', ')}" />
  <meta name="theme-color" content="${PLATFORM.themeColor}" />

  <meta property="og:site_name" content="${PLATFORM.shortName}" />
  <meta property="og:title" content="${PLATFORM.name}" />
  <meta property="og:description" content="${PLATFORM.description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${origin}/" />
  <meta property="og:image" content="${og}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${PLATFORM.name}" />
  <meta name="twitter:description" content="${PLATFORM.description}" />
  <meta name="twitter:image" content="${og}" />

  <link rel="icon" type="image/webp" href="${logo}" />
  <link rel="apple-touch-icon" href="${logo}" />
  <link rel="canonical" href="${PLATFORM.website}" />
</head>
<body>
  <main>
    <p><img src="${logo}" alt="${PLATFORM.shortName}" width="96" height="96" /></p>
    <h1>${PLATFORM.name}</h1>
    <p>${PLATFORM.description}</p>
    <ul>
      <li>Website: <a href="${PLATFORM.website}">${PLATFORM.website}</a></li>
      <li>Catalog: <a href="${origin}/v1/catalog">${origin}/v1/catalog</a></li>
      <li>OpenAPI: <a href="${origin}/v1/openapi.json">${origin}/v1/openapi.json</a></li>
      <li>Merchant ID: ${PLATFORM.merchantId}</li>
      <li>PayTo: ${PLATFORM.payTo}</li>
    </ul>
  </main>
</body>
</html>`
}

export function wellKnownX402(origin: string, payTo: string, usdcAsaId: number) {
  return {
    x402Version: 2,
    name: PLATFORM.name,
    description: PLATFORM.description,
    website: PLATFORM.website,
    logo: `${PLATFORM.website}${PLATFORM.logoPath}`,
    image: `${PLATFORM.website}${PLATFORM.ogPath}`,
    merchantId: PLATFORM.merchantId,
    tags: [...GOPLAUSIBLE_TAGS],
    categories: ['market-intelligence', 'agents', 'algorand', 'x402', 'x402-global-challenge'],
    resources: endpoints.map(endpoint => ({
      url: `${origin}${endpoint.path}`,
      method: endpoint.method,
      description: `${endpoint.description} — ${endpoint.price} USDC`,
      network: ALGORAND_MAINNET_CAIP2,
      asset: String(usdcAsaId),
      amount: String(Math.round(Number(endpoint.price.replace('$', '')) * 1e6)),
      payTo,
      tags: [...GOPLAUSIBLE_TAGS, endpoint.availabilityTrack],
    })),
  }
}

export function agentCard(origin: string) {
  return {
    name: PLATFORM.name,
    description: PLATFORM.description,
    url: origin,
    documentation: `${origin}/llms.txt`,
    version: '1.0.0',
    capabilities: { streaming: false },
    defaultInputModes: ['text', 'application/json'],
    defaultOutputModes: ['application/json'],
    tags: [...GOPLAUSIBLE_TAGS],
    skills: endpoints.map(endpoint => ({
      id: endpoint.operationId,
      name: endpoint.operationId,
      description: `${endpoint.description} (${endpoint.price} USDC via x402)`,
      tags: [...GOPLAUSIBLE_TAGS, endpoint.availabilityTrack],
    })),
  }
}

export function agentManifest(origin: string) {
  return {
    name: PLATFORM.name,
    description: PLATFORM.description,
    url: origin,
    website: PLATFORM.website,
    logo: `${PLATFORM.website}${PLATFORM.logoPath}`,
    image: `${PLATFORM.website}${PLATFORM.ogPath}`,
    documentation: `${origin}/llms.txt`,
    tags: [...GOPLAUSIBLE_TAGS],
    categories: ['market-intelligence', 'agents', 'algorand', 'x402', 'x402-global-challenge'],
    payments: {
      protocol: 'x402',
      network: 'algorand-mainnet',
      asset: 'USDC',
      asaId: PLATFORM.usdcAsaId,
      facilitator: PLATFORM.facilitator,
      merchantId: PLATFORM.merchantId,
      payTo: PLATFORM.payTo,
    },
  }
}

export function aiPlugin(origin: string) {
  return {
    schema_version: 'v1',
    name_for_human: PLATFORM.name,
    name_for_model: 'finality_market_intelligence',
    description_for_human: PLATFORM.description,
    description_for_model:
      'Call Finality Market Intelligence paid endpoints. Unsigned requests return HTTP 402 with x402 payment requirements; retry with PAYMENT-SIGNATURE after settling USDC on Algorand Mainnet.',
    api: { type: 'openapi', url: `${origin}/v1/openapi.json` },
    logo_url: `${PLATFORM.website}${PLATFORM.logoPath}`,
    contact_email: 'hello@finality.app',
  }
}

export function llmsTxt(origin: string): string {
  const lines = [
    `# ${PLATFORM.name}`,
    '',
    `> ${PLATFORM.description}`,
    '>',
    '> Every paid route answers HTTP 402 with x402 payment requirements. Pay Mainnet USDC, retry with PAYMENT-SIGNATURE.',
    '',
    '## Platform',
    `- Website: ${PLATFORM.website}`,
    `- API: ${origin}`,
    `- Merchant ID: ${PLATFORM.merchantId}`,
    `- PayTo: ${PLATFORM.payTo}`,
    `- Facilitator: ${PLATFORM.facilitator}`,
    `- Network: Algorand Mainnet · Asset: USDC (${PLATFORM.usdcAsaId})`,
    `- Tags: ${GOPLAUSIBLE_TAGS.join(', ')} (x402-Global challenge)`,
    '',
    '## Paid endpoints',
    ...endpoints.map(
      e => `- [${e.operationId}](${origin}${e.path}): ${e.method} — ${e.description}. ${e.price} USDC.`,
    ),
    '',
    '## Docs',
    `- [Catalog](${origin}/v1/catalog)`,
    `- [OpenAPI](${origin}/v1/openapi.json)`,
    `- [Info](${origin}/info)`,
    '',
  ]
  return lines.join('\n')
}

export function agentsMd(origin: string): string {
  return `# ${PLATFORM.name}

Instructions for agents working with this service.

## Payment
Every product endpoint is x402-paid. On HTTP 402, decode the PAYMENT-REQUIRED header (base64 JSON), pay the advertised requirement in USDC on Algorand Mainnet via ${PLATFORM.facilitator}, then retry with the PAYMENT-SIGNATURE header.

## Identity
- Merchant ID: ${PLATFORM.merchantId}
- PayTo: ${PLATFORM.payTo}
- Website: ${PLATFORM.website}
- API origin: ${origin}

## Discovery
- Catalog: ${origin}/v1/catalog
- OpenAPI: ${origin}/v1/openapi.json
- Well-known: ${origin}/.well-known/x402

## Notes
- Prices are advertised in the 402; never hardcode amounts.
- Prefer durable market/on-chain routes when provider quotas matter.
`
}

/** Fallback SVG mark if binary assets are unavailable at runtime */
export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="Finality">
  <rect width="512" height="512" fill="#0B0E11"/>
  <path fill="#E8EEF5" d="M168 96h210l-48 72H240v72h112l-40 64H240v112h-72V96z"/>
</svg>`

export const OG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Finality Market Intelligence">
  <rect width="1200" height="630" fill="#0B0E11"/>
  <text x="80" y="280" fill="#E8EEF5" font-family="system-ui,sans-serif" font-size="72" font-weight="700">Finality</text>
  <text x="80" y="350" fill="#8B97A8" font-family="system-ui,sans-serif" font-size="32">Market Intelligence</text>
  <polyline fill="none" stroke="#5B9FD4" stroke-width="3" points="640,420 720,380 780,400 860,300 940,320 1020,220 1100,240"/>
</svg>`
