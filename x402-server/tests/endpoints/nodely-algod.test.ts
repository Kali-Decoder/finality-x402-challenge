import { afterEach, describe, expect, it, vi } from 'vitest'
import { executeOperation } from '../../services/operation'
import { loadEnv } from '../../config/env'

const env = loadEnv({
  NODE_ENV: 'test', DATA_MODE: 'live', ALLOW_MOCK_FALLBACK: 'false', ENABLE_DUMMY_ENDPOINT: 'false',
  X402_PAYTO_ADDRESS: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ',
  X402_FACILITATOR_URL: 'https://facilitator.goplausible.xyz', X402_NETWORK: 'algorand-testnet',
  X402_USDC_ASA_ID: '10458941', X402_ALLOWED_ORIGINS: 'http://localhost:3000', X402_SERVER_PORT: '4021',
  INDEXER_SERVER: 'https://testnet-idx.4160.nodely.dev', ALGOD_SERVER: 'https://testnet-api.4160.nodely.dev',
  LLM_PROVIDER: 'ollama', OLLAMA_BASE_URL: 'http://localhost:11434', OLLAMA_MODEL: 'qwen3:8b',
})

afterEach(() => vi.unstubAllGlobals())

describe('Nodely algod data queries', () => {
  it('reads /v2/status from the configured algod', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ 'last-round': 67421801 }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await executeOperation(env, 'onchain.algodStatus', {})
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://testnet-api.4160.nodely.dev/v2/status')
    expect(result.meta).toMatchObject({ source: 'nodely-algod', dataMode: 'live', synthetic: false })
    expect(result.data).toMatchObject({ found: true, 'last-round': 67421801 })
  })

  it('uses last-round when block round is omitted', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.endsWith('/v2/status')) return new Response(JSON.stringify({ 'last-round': 42 }), { status: 200 })
      if (url.includes('/v2/blocks/42')) return new Response(JSON.stringify({ hash: 'abc' }), { status: 200 })
      throw new Error(url)
    })
    vi.stubGlobal('fetch', fetchMock)
    const result = await executeOperation(env, 'onchain.algodBlockHash', {})
    expect(fetchMock.mock.calls.map(call => String(call[0]))).toEqual([
      'https://testnet-api.4160.nodely.dev/v2/status',
      'https://testnet-api.4160.nodely.dev/v2/blocks/42/hash',
    ])
    expect(result.data).toMatchObject({ found: true, hash: 'abc' })
  })

  it('returns found:false when algod 404s a box', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not found', { status: 404 })))
    const result = await executeOperation(env, 'onchain.algodApplicationBox', { applicationId: 1, name: 'str:missing' })
    expect(result.data).toEqual({ found: false })
    expect(result.meta.source).toBe('nodely-algod')
  })
})
