import { paymentMiddleware } from '@x402/hono'
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server'
import type { ResourceServerExtension } from '@x402/core/types'
import { ExactAvmScheme } from '@x402/avm/exact/server'
import {
  bazaarResourceServerExtension,
  declareDiscoveryExtension,
  validateDiscoveryExtension,
} from '@x402-avm/extensions'
import type { Env } from '../config/env'
import { caip2ForNetwork, paymentAsset } from '../config/payment'
import { endpoints } from '../registry/endpoints'
import { discoveryConfigFor } from '../registry/catalog'
import { GOPLAUSIBLE_TAGS, PLATFORM } from '../discovery/platform'

function categoryFor(operationId: string) {
  if (operationId.startsWith('market.')) return 'Market data'
  if (operationId.startsWith('intelligence.')) return 'Intelligence'
  if (operationId.startsWith('agent.')) return 'Agent tools'
  if (operationId.startsWith('ai.')) return 'AI analyst'
  if (operationId.startsWith('onchain.')) return 'Algorand'
  return 'Finality'
}

function bazaarExtensionFor(endpoint: (typeof endpoints)[number]) {
  const declared = declareDiscoveryExtension(discoveryConfigFor(endpoint) as unknown as Parameters<typeof declareDiscoveryExtension>[0])
  const validation = validateDiscoveryExtension(declared.bazaar)
  if (!validation.valid) {
    // Malformed bazaar metadata does not break pay/settle — it only prevents cataloging.
    console.warn(JSON.stringify({
      level: 'warn',
      message: 'Invalid bazaar discovery extension; falling back to empty declaration',
      operationId: endpoint.operationId,
      errors: validation.errors ?? validation,
    }))
    return declareDiscoveryExtension({})
  }
  return declared
}

export function createPaymentMiddleware(env: Env) {
  // Prefer PLATFORM identity so Render stale env cannot keep advertising the old payTo/host.
  const payTo = PLATFORM.payTo || env.X402_PAYTO_ADDRESS
  if (!payTo) throw new Error('X402_PAYTO_ADDRESS is required for the merchant service')
  const network = caip2ForNetwork(env.X402_NETWORK)
  const facilitator = new HTTPFacilitatorClient({ url: env.X402_FACILITATOR_URL })
  // bazaarResourceServerExtension enriches declarations with HTTP method from the route key
  // and registers the server-side bazaar extension used by GoPlausible discovery/challenge indexing.
  const server = new x402ResourceServer(facilitator)
    .register(network, new ExactAvmScheme())
    .registerExtension(bazaarResourceServerExtension as unknown as ResourceServerExtension)

  const publicBase = (PLATFORM.apiBase || env.X402_PUBLIC_URL).replace(/\/$/, '')

  const routes = Object.fromEntries(endpoints.map(endpoint => {
    const category = categoryFor(endpoint.operationId)
    return [`${endpoint.method} ${endpoint.path}`, {
      // Stable catalog identity (no query string). Required for GoPlausible Bazaar / global challenge.
      // Localhost resource URLs are not listed in the public discovery API — set X402_PUBLIC_URL.
      ...(publicBase ? { resource: `${publicBase}${endpoint.path}` } : {}),
      accepts: [{
        scheme: 'exact',
        price: endpoint.price,
        network,
        payTo,
        extra: paymentAsset(env),
      }],
      description: endpoint.description,
      mimeType: 'application/json',
      serviceName: 'Finality Market Intelligence',
      tags: [...GOPLAUSIBLE_TAGS, category.toLowerCase()],
      extensions: {
        ...bazaarExtensionFor(endpoint),
      },
    }]
  }))

  if (!publicBase) {
    console.warn(JSON.stringify({
      level: 'warn',
      message: 'X402_PUBLIC_URL is unset. 402 responses will use the request Host (often localhost), which GoPlausible public discovery does not list. Set a public HTTPS base URL for Bazaar / global challenge indexing.',
    }))
  }

  return paymentMiddleware(routes as any, server)
}
