import { FinalityError } from '../contracts/errors'
import type { ProviderResult } from './types'

/** Nodely free Mainnet algod — same infra as algonode.cloud, no API token. */
export const NODELY_MAINNET_ALGOD = 'https://mainnet-api.4160.nodely.dev'
/** Nodely free Mainnet indexer. */
export const NODELY_MAINNET_INDEXER = 'https://mainnet-idx.4160.nodely.dev'
/** Nodely free Testnet algod (kept for dual-env / tests). */
export const NODELY_TESTNET_ALGOD = 'https://testnet-api.4160.nodely.dev'
/** Nodely free Testnet indexer. */
export const NODELY_TESTNET_INDEXER = 'https://testnet-idx.4160.nodely.dev'

const ALGOD_LIMITATIONS = [
  'Nodely public algod. Free-tier responses may include ~50ms injected latency.',
  'Read-only node queries; not a substitute for Indexer history search.',
]

function liveMeta(freshnessSeconds: number, extra: string[] = []) {
  return {
    source: 'nodely-algod',
    provider: 'public-rest',
    asOf: new Date().toISOString(),
    freshnessSeconds,
    limitations: [...ALGOD_LIMITATIONS, ...extra],
    availabilityTrack: 'durable' as const,
    dataMode: 'live' as const,
    synthetic: false,
  }
}

function headers(token = '') {
  const value: Record<string, string> = { accept: 'application/json' }
  if (token) value['X-Algo-API-Token'] = token
  return value
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    search.set(key, String(value))
  }
  const encoded = search.toString()
  return encoded ? `?${encoded}` : ''
}

export async function nodelyGet(base: string, path: string, token = ''): Promise<unknown> {
  const url = `${base.replace(/\/$/, '')}${path}`
  try {
    const response = await fetch(url, { headers: headers(token), signal: AbortSignal.timeout(8_000) })
    if (response.status === 404) return { found: false }
    if (!response.ok) throw new FinalityError('provider_unavailable', `Nodely algod returned ${response.status}`, 503, true)
    const data = await response.json()
    if (data && typeof data === 'object' && !Array.isArray(data)) return { found: true, ...(data as object) }
    return { found: true, data }
  } catch (error) {
    if (error instanceof FinalityError) throw error
    throw new FinalityError('provider_unavailable', 'Nodely algod unavailable', 503, true)
  }
}

async function latestRound(base: string, token: string): Promise<number> {
  const status = (await nodelyGet(base, '/v2/status', token)) as { 'last-round'?: number; found?: boolean }
  const round = Number(status['last-round'])
  if (!Number.isFinite(round) || round < 1) throw new FinalityError('provider_unavailable', 'Nodely algod did not report last-round', 503, true)
  return round
}

type AlgodEnv = { ALGOD_SERVER: string; ALGOD_TOKEN?: string }

/**
 * Paid wrappers around Nodely algod GET data queries.
 * Admin, long-poll, proof, delta, and write paths are intentionally not exposed.
 */
export async function fetchAlgodOperation(
  env: AlgodEnv,
  operationId: string,
  input: Record<string, any>,
): Promise<ProviderResult<unknown>> {
  const base = env.ALGOD_SERVER
  const token = env.ALGOD_TOKEN ?? ''
  const address = input.address ? encodeURIComponent(String(input.address)) : ''
  const assetId = input.assetId
  const applicationId = input.applicationId
  const round = input.round ? Number(input.round) : undefined
  const limit = input.limit
  const max = input.max
  const next = input.next

  switch (operationId) {
    case 'onchain.algodStatus':
      return { data: await nodelyGet(base, '/v2/status', token), meta: liveMeta(2) }
    case 'onchain.algodSupply':
      return { data: await nodelyGet(base, '/v2/ledger/supply', token), meta: liveMeta(2) }
    case 'onchain.algodParams':
      return { data: await nodelyGet(base, '/v2/transactions/params', token), meta: liveMeta(2, ['Suggested params for constructing transactions; not a signed transaction.']) }
    case 'onchain.algodAccount':
      return {
        data: await nodelyGet(base, `/v2/accounts/${address}${qs({ exclude: input.exclude })}`, token),
        meta: liveMeta(5),
      }
    case 'onchain.algodAccountAssets':
      return {
        data: await nodelyGet(base, `/v2/accounts/${address}/assets${qs({ limit, next })}`, token),
        meta: liveMeta(5),
      }
    case 'onchain.algodAccountAsset':
      return {
        data: await nodelyGet(base, `/v2/accounts/${address}/assets/${assetId}`, token),
        meta: liveMeta(5),
      }
    case 'onchain.algodAccountApps':
      return {
        data: await nodelyGet(base, `/v2/accounts/${address}/applications${qs({ limit, next, include: input.include })}`, token),
        meta: liveMeta(5),
      }
    case 'onchain.algodAccountApp':
      return {
        data: await nodelyGet(base, `/v2/accounts/${address}/applications/${applicationId}`, token),
        meta: liveMeta(5),
      }
    case 'onchain.algodPendingByAddress':
      return {
        data: await nodelyGet(base, `/v2/accounts/${address}/transactions/pending${qs({ max: max ?? 10 })}`, token),
        meta: liveMeta(2, ['Unconfirmed mempool transactions only; truncated at max.']),
      }
    case 'onchain.algodAsset':
      return { data: await nodelyGet(base, `/v2/assets/${assetId}`, token), meta: liveMeta(15) }
    case 'onchain.algodApplication':
      return { data: await nodelyGet(base, `/v2/applications/${applicationId}`, token), meta: liveMeta(5) }
    case 'onchain.algodApplicationBoxes':
      return {
        data: await nodelyGet(
          base,
          `/v2/applications/${applicationId}/boxes${qs({ max: max ?? 32, limit, next, prefix: input.prefix, include: input.include, round })}`,
          token,
        ),
        meta: liveMeta(5, ['Box names only unless include=values. Pagination via next.']),
      }
    case 'onchain.algodApplicationBox':
      return {
        data: await nodelyGet(
          base,
          `/v2/applications/${applicationId}/box${qs({ name: input.name })}`,
          token,
        ),
        meta: liveMeta(5, ["Box name must use goal encoding: str:, int:, b64:, or addr:."]),
      }
    case 'onchain.algodBlock': {
      const target = round ?? (await latestRound(base, token))
      const headerOnly = input.headerOnly !== false
      return {
        data: await nodelyGet(base, `/v2/blocks/${target}${qs({ 'header-only': headerOnly })}`, token),
        meta: liveMeta(2, headerOnly ? ['header-only=true by default to bound payload size.'] : ['Full block payset can be large.']),
      }
    }
    case 'onchain.algodBlockHash': {
      const target = round ?? (await latestRound(base, token))
      return { data: await nodelyGet(base, `/v2/blocks/${target}/hash`, token), meta: liveMeta(2) }
    }
    case 'onchain.algodBlockTxids': {
      const target = round ?? (await latestRound(base, token))
      return { data: await nodelyGet(base, `/v2/blocks/${target}/txids`, token), meta: liveMeta(2) }
    }
    case 'onchain.algodBlockLogs': {
      const target = round ?? (await latestRound(base, token))
      return {
        data: await nodelyGet(base, `/v2/blocks/${target}/logs`, token),
        meta: liveMeta(2, ['App-call logs for the round; empty when the block has no inner/outer logs.']),
      }
    }
    case 'onchain.algodPending':
      return {
        data: await nodelyGet(base, `/v2/transactions/pending${qs({ max: max ?? 10 })}`, token),
        meta: liveMeta(2, ['Global mempool snapshot; truncated at max.']),
      }
    default:
      throw new FinalityError('not_implemented', `Operation ${operationId} is unavailable`, 501)
  }
}
