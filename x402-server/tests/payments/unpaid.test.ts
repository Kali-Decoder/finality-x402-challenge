import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../app'
import { testEnv } from '../helpers'
import { ALGORAND_TESTNET_CAIP2, X402_GLOBAL_CHALLENGE_TAG } from '../../config/payment'

function decodePaymentRequired(header: string) {
  return JSON.parse(Buffer.from(header, 'base64').toString('utf8')) as {
    accepts?: Array<{ extra?: { asset?: number; tag?: string }; network?: string; payTo?: string }>
    resource?: { url?: string; tags?: string[] }
  }
}

describe('x402 payment enforcement', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns 402 before running a paid handler', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.endsWith('/supported')) {
        return new Response(
          JSON.stringify({
            kinds: [{ x402Version: 2, scheme: 'exact', network: ALGORAND_TESTNET_CAIP2, extra: {} }],
            extensions: [],
            signers: {},
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      throw new Error(`Unexpected request ${url}`)
    }))
    const app = createApp(testEnv)
    const r = await app.request('/v1/market/quotes?symbols=BTC')
    expect(r.status).toBe(402)
    const header = r.headers.get('payment-required') ?? r.headers.get('PAYMENT-REQUIRED')
    expect(header).toBeTruthy()
    const decoded = Buffer.from(header!, 'base64').toString('utf8')
    expect(decoded).toContain('10458941')
    expect(decoded).toContain('algorand')
  })

  it('includes x402-global-challenge on payment extra.tag and resource tags', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.endsWith('/supported')) {
        return new Response(
          JSON.stringify({
            kinds: [{ x402Version: 2, scheme: 'exact', network: ALGORAND_TESTNET_CAIP2, extra: {} }],
            extensions: [],
            signers: {},
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      throw new Error(`Unexpected request ${url}`)
    }))
    const app = createApp(testEnv)
    const r = await app.request('/v1/market/quotes?symbols=BTC')
    expect(r.status).toBe(402)
    const header = r.headers.get('payment-required') ?? r.headers.get('PAYMENT-REQUIRED')
    expect(header).toBeTruthy()
    const body = decodePaymentRequired(header!)
    const accept = body.accepts?.[0]
    expect(accept?.extra?.asset).toBe(10458941)
    expect(accept?.extra?.tag).toBe(X402_GLOBAL_CHALLENGE_TAG)
    expect(body.resource?.tags ?? []).toContain(X402_GLOBAL_CHALLENGE_TAG)
  })

  it('rejects a malformed payment signature', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      if (String(input).endsWith('/supported')) {
        return new Response(
          JSON.stringify({
            kinds: [{ x402Version: 2, scheme: 'exact', network: ALGORAND_TESTNET_CAIP2, extra: {} }],
            extensions: [],
            signers: {},
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      throw new Error('The facilitator must not be called with an undecodable signature')
    }))
    const app = createApp(testEnv)
    const response = await app.request('/v1/market/quotes?symbols=BTC', {
      headers: { 'Payment-Signature': 'not-a-valid-payment' },
    })
    expect(response.status).not.toBe(200)
  })
})
