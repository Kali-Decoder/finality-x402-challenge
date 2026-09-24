import OpenAI from 'openai'
import { FinalityError } from '../../lib/contracts/errors'
import type { ProviderResult, Quote, Candle } from '../../lib/providers/types'
import {
  fetchMarketCandles,
  fetchMarketCategories,
  fetchMarketQuotes,
  fetchMarketTokenPrices,
  fetchMarketTrending,
} from '../../lib/providers/market'
import { mockCandles, mockMeta, mockQuotes } from '../../lib/providers/mock'
import { fetchAlgodOperation } from '../../lib/providers/nodely'
import type { Env } from '../config/env'

type AnyObject = Record<string, any>
type FallbackReason = 'missing_credentials' | 'invalid_credentials' | 'quota_exhausted' | 'rate_limited' | 'timeout' | 'upstream_error' | 'model_unavailable'

function fallbackReason(error: unknown): FallbackReason {
  const status = typeof error === 'object' && error ? Number((error as {status?:unknown}).status) : 0
  if (status === 401 || status === 403) return 'invalid_credentials'
  if (status === 429) return 'rate_limited'
  if (error instanceof FinalityError) {
    if (error.code.includes('quota')) return 'quota_exhausted'
    if (error.code.includes('rate')) return 'rate_limited'
    if (error.code.includes('credential')) return error.code.includes('invalid') ? 'invalid_credentials' : 'missing_credentials'
    if (error.code.includes('timeout')) return 'timeout'
  }
  return 'upstream_error'
}

/** Market / intelligence / agent / AI never surface upstream failures — always return dummy data. */
function isSoftDomain(operationId: string) {
  return /^(market|intelligence|agent|ai)\./.test(operationId)
}

function canFallback(env: Env, soft: boolean) {
  if (soft) return true
  return env.DATA_MODE === 'auto' && env.ALLOW_MOCK_FALLBACK
}

async function provider<T>(
  env: Env,
  live: () => Promise<ProviderResult<T>>,
  mock: (reason?: FallbackReason) => ProviderResult<T>,
  soft = false,
): Promise<ProviderResult<T>> {
  if (env.DATA_MODE === 'mock') return mock()
  try { return await live() }
  catch (error) {
    if (canFallback(env, soft)) return mock(fallbackReason(error))
    throw error
  }
}

function sma(values: number[], period: number) { return values.slice(-period).reduce((a,b) => a+b, 0) / Math.min(period, values.length) }
function rsi(values: number[], period = 14) {
  const changes = values.slice(-period - 1).slice(1).map((v,i) => v - values.slice(-period - 1)[i])
  const gains = changes.reduce((a,v) => a + Math.max(v,0),0) / period
  const losses = changes.reduce((a,v) => a + Math.max(-v,0),0) / period
  return losses === 0 ? 100 : 100 - 100 / (1 + gains/losses)
}
function technical(candles: Candle[]) {
  const closes = candles.map(c => c.close), last = closes.at(-1) ?? 0
  const fast = sma(closes, 10), slow = sma(closes, 30), rsi14 = rsi(closes)
  const direction = fast > slow * 1.002 ? 'BUY' : fast < slow * .998 ? 'SELL' : 'HOLD'
  const score = Math.max(0, Math.min(100, 50 + (fast/slow-1)*800 + (50-rsi14)*.25))
  return { price: last, sma10: fast, sma30: slow, rsi14, momentum: closes.length > 1 ? (last/closes[0]-1)*100 : 0, regime: fast > slow ? 'trending_up' : fast < slow ? 'trending_down' : 'ranging', direction, score }
}

async function candlesFor(env: Env, input: AnyObject) {
  const symbol = input.symbols?.[0] ?? 'BTC', limit = input.limit ?? 100
  return provider(
    env,
    () => fetchMarketCandles(symbol, input.interval ?? '1h', limit, marketOpts(env)),
    reason => mockCandles(symbol, limit, reason),
    true,
  )
}

async function json(url: string, token?: string) {
  try {
    const headers: Record<string, string> = { accept: 'application/json' }
    if (token) headers['X-Indexer-API-Token'] = token
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(8_000) })
    if (!response.ok) throw new Error(String(response.status))
    return response.json()
  } catch { throw new FinalityError('provider_unavailable', 'Upstream provider unavailable', 503, true) }
}

const liveMeta = (source: string, freshnessSeconds: number, limitations: string[] = []) => ({ source, provider: 'public-rest', asOf: new Date().toISOString(), freshnessSeconds, limitations, availabilityTrack: 'durable' as const, dataMode: 'live' as const, synthetic: false })

function marketOpts(env: Env) {
  return { coingeckoApiKey: env.COINGECKO_API_KEY, coingeckoProApiKey: env.COINGECKO_PRO_API_KEY }
}

async function quotes(env: Env, symbols: string[]) {
  return provider(
    env,
    () => fetchMarketQuotes(symbols, marketOpts(env)),
    reason => mockQuotes(symbols, reason),
    true,
  )
}

async function onchain(env: Env, operationId: string, input: AnyObject): Promise<ProviderResult<unknown>> {
  if (operationId.startsWith('onchain.algod')) return fetchAlgodOperation(env, operationId, input)
  const base = env.INDEXER_SERVER.replace(/\/$/, '')
  const token = env.INDEXER_TOKEN
  if (operationId === 'onchain.algorandAsset') {
    const result: any = await json(`${base}/v2/assets/${input.assetId}`, token)
    return { data: result.asset, meta: liveMeta('nodely-indexer', 30) }
  }
  if (operationId === 'onchain.algorandDefi') {
    const query = input.address ? `?address=${input.address}&limit=${input.limit}` : `?tx-type=appl&limit=${input.limit}`
    const result: any = await json(`${base}/v2/transactions${query}`, token)
    return { data: { transactions: result.transactions ?? [], nextToken: result['next-token'] }, meta: liveMeta('nodely-indexer', 30, ['Indexer activity only; no inferred pool or liquidity values']) }
  }
  const result: any = await json(`${base}/v2/accounts/${input.address}`, token)
  const account = result.account
  if (operationId === 'onchain.algorandPortfolio') return { data: { address: account.address, algo: Number(account.amount ?? 0)/1e6, assets: account.assets ?? [], round: account.round }, meta: liveMeta('nodely-indexer', 30) }
  return { data: account, meta: liveMeta('nodely-indexer', 30) }
}

function syntheticChat(prompt: unknown, reason: FallbackReason = 'model_unavailable'): ProviderResult<unknown> {
  return {
    data: {
      answer: `Synthetic analyst response for: ${String(prompt ?? '')}. Live model data is temporarily unavailable; this is a deterministic fallback for demo continuity.`,
      generatedByModel: false,
    },
    meta: mockMeta(reason),
  }
}

async function llm(env: Env, input: AnyObject): Promise<ProviderResult<unknown>> {
  if (env.DATA_MODE === 'mock' || (!env.GROQ_API_KEY && !env.OLLAMA_BASE_URL)) {
    return syntheticChat(input.prompt, 'model_unavailable')
  }
  const groq = env.LLM_PROVIDER === 'groq'
  const completion = async (useGroq: boolean, reason?: FallbackReason) => {
    const client = new OpenAI({ apiKey: useGroq ? env.GROQ_API_KEY : (env.OLLAMA_API_KEY || 'ollama'), baseURL: useGroq ? 'https://api.groq.com/openai/v1' : `${env.OLLAMA_BASE_URL.replace(/\/$/,'')}/v1`, timeout: 15_000 })
    const result = await client.chat.completions.create({ model: useGroq ? env.GROQ_MODEL : env.OLLAMA_MODEL, max_tokens: 500, messages: [{ role: 'system', content: 'You are Finality Market Intelligence. Be concise, data-grounded, and state limitations.' }, { role: 'user', content: input.prompt }] })
    return { data: { answer: result.choices[0]?.message.content ?? '', generatedByModel: true }, meta: { ...liveMeta(useGroq ? 'groq' : 'ollama', 0), availabilityTrack: useGroq ? 'quota-limited' as const : 'durable' as const, ...(groq && !useGroq ? { fallback:true, fallbackReason:reason ?? 'upstream_error' } : {}) } }
  }
  if (groq && (!env.GROQ_API_KEY || !env.GROQ_MODEL)) {
    try { return await completion(false, 'missing_credentials') }
    catch { return syntheticChat(input.prompt, 'missing_credentials') }
  }
  try {
    return await completion(groq)
  } catch (primaryError) {
    if (groq) {
      try { return await completion(false, fallbackReason(primaryError)) } catch { /* soft fallback below */ }
    }
    return syntheticChat(input.prompt, fallbackReason(primaryError))
  }
}

export async function executeOperation(env: Env, operationId: string, input: AnyObject): Promise<ProviderResult<unknown>> {
  try {
    return await executeOperationInner(env, operationId, input)
  } catch (error) {
    // Market / intelligence / agent / AI: never fail closed — return deterministic dummy data.
    if (!isSoftDomain(operationId)) throw error
    if (operationId === 'ai.chat') return syntheticChat(input.prompt, fallbackReason(error))
    const mockEnv = { ...env, DATA_MODE: 'mock' as const }
    const result = await executeOperationInner(mockEnv, operationId, input)
    return { ...result, meta: { ...result.meta, ...mockMeta(fallbackReason(error)) } }
  }
}

async function executeOperationInner(env: Env, operationId: string, input: AnyObject): Promise<ProviderResult<unknown>> {
  if (operationId.startsWith('onchain.')) {
    if (env.DATA_MODE === 'mock') return { data: { operationId, fixture: true, input }, meta: mockMeta() }
    return provider(env, () => onchain(env, operationId, input), reason => ({ data:{operationId,fixture:true,input},meta:mockMeta(reason) }))
  }
  if (operationId === 'ai.chat') return llm(env, input)
  if (operationId === 'market.quotes') return quotes(env, input.symbols)
  if (operationId === 'market.candles') return candlesFor(env, input)
  if (operationId === 'market.assets') {
    const q = String(input.query).toUpperCase()
    const known = ['BTC','ETH','BNB','SOL','XRP','DOGE','ADA','AVAX','LINK','DOT'].filter(s => s.includes(q)).slice(0,input.limit)
    const result = await quotes(env, known.length ? known : [q])
    return {
      data: result.data.map(v => ({
        symbol: v.symbol,
        name: v.name ?? v.symbol,
        marketType: 'crypto',
        quoteAsset: 'USD',
        marketCap: v.marketCap,
        change1h: v.change1h,
        change24h: v.change24h,
        change7d: v.change7d,
        change30d: v.change30d,
        sparkline: v.sparkline,
      })),
      meta: result.meta,
    }
  }
  if (operationId === 'market.trending') {
    const limit = input.limit ?? 10
    return provider(env, async () => {
      const result = await fetchMarketTrending(limit, marketOpts(env))
      return {
        data: result.data.map((v, i) => ({
          rank: v.rank ?? i + 1,
          symbol: v.symbol,
          name: v.name,
          price: v.price,
          change1h: v.change1h,
          change24h: v.change24h,
          change7d: v.change7d,
          change30d: v.change30d,
          volume24h: v.volume24h,
          marketCap: v.marketCap,
          sparkline: v.sparkline,
        })),
        meta: result.meta,
      }
    }, reason => {
      const mock = mockQuotes(['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT'].slice(0, limit), reason)
      return { data: mock.data.map((v, i) => ({ rank: i + 1, ...v })), meta: mock.meta }
    }, true)
  }
  if (operationId === 'market.categories') {
    return provider(env, () => fetchMarketCategories(marketOpts(env)), reason => ({
      data: [
        { id: 'layer-1', name: 'Layer 1', marketCapChange24h: 1.2, volume24h: 1e9 },
        { id: 'defi', name: 'DeFi', marketCapChange24h: -0.4, volume24h: 5e8 },
      ],
      meta: mockMeta(reason),
    }), true)
  }
  if (operationId === 'market.tokenPrices') {
    const network = String(input.network ?? 'eth')
    const addresses = (input.addresses as string[]).map(a => String(a))
    return provider(env, () => fetchMarketTokenPrices(network, addresses, marketOpts(env)), reason => ({
      data: addresses.map(address => ({
        network,
        address: address.toLowerCase(),
        priceUsd: 1,
        change24h: 0,
      })),
      meta: mockMeta(reason),
    }), true)
  }
  if (operationId === 'market.fearGreed') {
    if (env.DATA_MODE === 'mock') return { data: [{ value: 47, classification: 'Neutral', timestamp: '1767225600' }], meta: mockMeta() }
    return provider(env, async() => {
      const result: any = await json(`https://api.alternative.me/fng/?limit=${input.limit}`)
      return { data: result.data, meta: liveMeta('alternative.me', 86400, ['Alternative.me attribution required; not investment advice']) }
    }, reason => ({data:[{value:47,classification:'Neutral',timestamp:'1767225600'}],meta:mockMeta(reason)}), true)
  }

  if (operationId === 'agent.strategyParse') {
    const prompt = String(input.prompt).toLowerCase()
    const fast = Number(prompt.match(/(?:fast|short)[^0-9]*(\d+)/)?.[1] ?? 10), slow = Number(prompt.match(/(?:slow|long)[^0-9]*(\d+)/)?.[1] ?? 30)
    return { data: { name: 'Parsed moving-average strategy', rules: [{ indicator: 'sma', operator: 'crosses_above', fastPeriod: fast, slowPeriod: slow, action: 'BUY' }, { indicator: 'sma', operator: 'crosses_below', fastPeriod: fast, slowPeriod: slow, action: 'SELL' }], validated: fast < slow }, meta: env.DATA_MODE==='mock'?mockMeta():liveMeta('finality-deterministic', 0, ['Supports bounded moving-average strategy language']) }
  }

  const result = await candlesFor(env, input), tech = technical(result.data)
  if (operationId === 'intelligence.technicals') return { data: tech, meta: result.meta }
  if (operationId === 'intelligence.signals') return { data: { signals: input.symbols.map((symbol:string) => ({ symbol, ...tech })), summary: { direction: tech.direction, averageScore: tech.score } }, meta: result.meta }
  if (operationId === 'intelligence.volume') {
    const vols = result.data.map(c => c.volume), current = vols.at(-1) ?? 0, average = sma(vols, Math.min(20,vols.length))
    return { data: { symbol: input.symbols[0], current, average, ratio: average ? current/average : 0, spike: current > average*2 }, meta: result.meta }
  }
  if (operationId === 'intelligence.events') {
    const moves = result.data.slice(1).map((c,i) => ({ time:c.time, changePct:(c.close/result.data[i].close-1)*100 })).filter(v => Math.abs(v.changePct)>=2)
    return { data: { events: moves, derivedFrom: 'OHLCV movement threshold' }, meta: { ...result.meta, limitations: [...result.meta.limitations, 'Events are price/volume-derived; no news claims are made'] } }
  }
  if (operationId === 'intelligence.backtest') {
    let cash = input.strategy.initialCapital, position = 0, trades = 0
    for (let i=input.strategy.slowPeriod;i<result.data.length;i++) { const xs=result.data.slice(0,i+1).map(c=>c.close), f=sma(xs,input.strategy.fastPeriod), s=sma(xs,input.strategy.slowPeriod), p=xs.at(-1)!; if(f>s&&!position){position=cash/p;cash=0;trades++} else if(f<s&&position){cash=position*p;position=0;trades++} }
    const end = cash + position*(result.data.at(-1)?.close ?? 0)
    return { data: { initialCapital: input.strategy.initialCapital, finalEquity: end, returnPct:(end/input.strategy.initialCapital-1)*100, trades }, meta: { ...result.meta, limitations: [...result.meta.limitations, 'Excludes fees, slippage, taxes, and market impact'] } }
  }
  if (operationId === 'agent.decision') return { data: { action: tech.direction, confidence: Math.abs(tech.score-50)*2, risk: input.risk, maxPositionPct: input.risk==='conservative'?5:input.risk==='aggressive'?20:10, rationale: `SMA/RSI regime is ${tech.regime}` }, meta: result.meta }
  if (operationId === 'agent.briefing') return { data: { symbol: input.symbols[0], bias: tech.direction, regime: tech.regime, score: tech.score, risks: ['Market volatility','Provider latency'] }, meta: result.meta }
  if (operationId === 'intelligence.report') return { data: { technicals: tech, signal: tech.direction, risk: tech.rsi14 > 70 ? 'overbought' : tech.rsi14 < 30 ? 'oversold' : 'normal' }, meta: result.meta }
  throw new FinalityError('not_implemented', `Operation ${operationId} is unavailable`, 501)
}
