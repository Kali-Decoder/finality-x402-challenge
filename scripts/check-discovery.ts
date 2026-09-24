/**
 * Check whether Finality routes are visible in the GoPlausible discovery catalog.
 *
 * Usage:
 *   npx tsx --env-file=x402-server/.env scripts/check-discovery.ts
 *
 * Cataloging requires:
 *  1) bazaar extension on unpaid 402 responses
 *  2) at least one successful settle against each route
 */
const facilitator = (process.env.X402_FACILITATOR_URL || 'https://facilitator.goplausible.xyz').replace(/\/$/, '')
const payTo = process.env.X402_PAYTO_ADDRESS || ''
const merchantBase = (process.env.X402_PUBLIC_URL || process.env.X402_SMOKE_URL || 'https://finality-x402-backend.onrender.com').replace(/\/$/, '')
const merchantId = Buffer.from(payTo.slice(0, 24), 'utf8').toString('base64')

async function getJson(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  const text = await response.text()
  try {
    return { status: response.status, body: JSON.parse(text) as any }
  } catch {
    return { status: response.status, body: { raw: text.slice(0, 200) } }
  }
}

async function main() {
  if (!payTo) throw new Error('X402_PAYTO_ADDRESS is required')

  console.log(JSON.stringify({ payTo, merchantId, merchantBase, facilitator }, null, 2))

  const probe = await fetch(`${merchantBase}/v1/market/fear-greed?limit=1`)
  const paymentRequired = probe.headers.get('payment-required') || probe.headers.get('PAYMENT-REQUIRED')
  let bazaar = false
  let resourceUrl: string | undefined
  if (paymentRequired) {
    const decoded = JSON.parse(Buffer.from(paymentRequired, 'base64').toString('utf8'))
    bazaar = Boolean(decoded?.extensions?.bazaar)
    resourceUrl = decoded?.resource?.url
    console.log(JSON.stringify({
      step: '402_probe',
      status: probe.status,
      hasBazaar: bazaar,
      resourceUrl,
      description: decoded?.resource?.description,
      discoveryInfo: decoded?.extensions?.bazaar?.info ? 'present' : 'missing',
    }, null, 2))
  } else {
    console.log(JSON.stringify({ step: '402_probe', status: probe.status, hasBazaar: false, note: 'No PAYMENT-REQUIRED header' }, null, 2))
  }

  // merchantId-only queries can prefer older high-settle Cloudflare URLs; also search by host.
  const hostQuery = new URL(merchantBase).hostname
  const resourcesByMerchant = await getJson(
    `${facilitator}/discovery/resources?includeTestnets=true&limit=100&merchantId=${encodeURIComponent(merchantId)}`,
  )
  const resourcesByHost = await getJson(
    `${facilitator}/discovery/resources?includeTestnets=true&limit=200&q=${encodeURIComponent(hostQuery)}`,
  )
  const merchants = await getJson(`${facilitator}/discovery/merchants?includeTestnets=true&limit=500`)

  const byMerchant = resourcesByMerchant.body?.items || []
  const byHost = (resourcesByHost.body?.items || []).filter((r: any) =>
    String(r.resourceUrl || '').startsWith(merchantBase),
  )
  const merchantItems = (merchants.body?.items || []).filter((m: any) =>
    JSON.stringify(m).includes(merchantId) || JSON.stringify(m).includes(payTo.slice(0, 16)),
  )

  const listed = byHost.length ? byHost : byMerchant.filter((r: any) => String(r.resourceUrl || '').startsWith(merchantBase))

  console.log(JSON.stringify({
    step: 'discovery',
    resourcesByMerchantStatus: resourcesByMerchant.status,
    resourcesByHostStatus: resourcesByHost.status,
    listedOnPublicHost: listed.length,
    resources: listed.map((r: any) => ({
      method: r.method,
      resourceUrl: r.resourceUrl,
      settleCount: r.settleCount,
      hasDiscoveryInfo: Boolean(r.discoveryInfo),
      description: r.description,
    })),
    merchantCount: merchantItems.length,
    merchants: merchantItems,
    next: listed.length >= 19
      ? 'All hosted routes listed — keep settling to grow settleCount for the global challenge.'
      : listed.length
        ? `Partial: ${listed.length}/19 on ${merchantBase}. Settle remaining routes once against this host.`
        : !bazaar
          ? 'Discovery gap: bazaar metadata missing on 402. Confirm X402_PUBLIC_URL and redeploy merchant.'
          : 'Discovery gap: bazaar present but no settles yet for this public host. Pay one route: X402_SMOKE_URL=' + merchantBase + ' X402_SMOKE_OPERATION=market.fearGreed npm run test:x402:testnet',
  }, null, 2))
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
