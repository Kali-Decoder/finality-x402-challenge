import { z } from 'zod'

const symbols = z.array(z.string().trim().min(1).max(20)).min(1).max(10)
const market = z.enum(['crypto','meme','forex','equity','etf']).default('crypto')
const base = z.object({ symbols: symbols.default(['BTC']), marketType: market, interval: z.enum(['1m','5m','15m','1h','4h','1d']).default('1h'), limit: z.number().int().min(2).max(500).default(100) })
const address = z.string().regex(/^[A-Z2-7]{58}$/, 'Invalid Algorand address')

export const requestSchemas: Record<string, z.ZodTypeAny> = {
  'market.quotes': z.object({ symbols }),
  'market.assets': z.object({ query: z.string().trim().min(1).max(40), limit: z.number().int().min(1).max(20).default(10) }),
  'market.candles': base,
  'market.trending': z.object({ limit: z.number().int().min(1).max(20).default(10) }),
  'market.categories': z.object({}),
  'market.tokenPrices': z.object({
    network: z.string().trim().min(2).max(32).default('eth'),
    addresses: z.array(z.string().trim().min(8).max(128)).min(1).max(20),
  }),
  'market.fearGreed': z.object({ limit: z.number().int().min(1).max(30).default(1) }),
  'intelligence.signals': base,
  'intelligence.technicals': base,
  'intelligence.report': base,
  'intelligence.volume': base,
  'intelligence.events': base,
  'intelligence.backtest': base.extend({ strategy: z.object({ fastPeriod: z.number().int().min(2).max(100).default(10), slowPeriod: z.number().int().min(3).max(200).default(30), initialCapital: z.number().positive().max(1_000_000).default(10_000) }).default({}) }),
  'agent.decision': base.extend({ risk: z.enum(['conservative','balanced','aggressive']).default('balanced') }),
  'agent.briefing': base,
  'agent.strategyParse': z.object({ prompt: z.string().min(5).max(2000) }),
  'ai.chat': base.extend({ prompt: z.string().min(1).max(4000) }),
  'onchain.algorandAccount': z.object({ address }),
  'onchain.algorandPortfolio': z.object({ address }),
  'onchain.algorandAsset': z.object({ assetId: z.number().int().positive() }),
  'onchain.algorandDefi': z.object({ address: address.optional(), limit: z.number().int().min(1).max(100).default(20) }),
  'onchain.algodStatus': z.object({}),
  'onchain.algodSupply': z.object({}),
  'onchain.algodParams': z.object({}),
  'onchain.algodAccount': z.object({ address, exclude: z.string().optional() }),
  'onchain.algodAccountAssets': z.object({ address, limit: z.number().int().min(1).max(100).default(20), next: z.string().optional() }),
  'onchain.algodAccountAsset': z.object({ address, assetId: z.number().int().positive() }),
  'onchain.algodAccountApps': z.object({ address, limit: z.number().int().min(1).max(100).default(20), next: z.string().optional(), include: z.string().optional() }),
  'onchain.algodAccountApp': z.object({ address, applicationId: z.number().int().positive() }),
  'onchain.algodPendingByAddress': z.object({ address, max: z.number().int().min(1).max(50).default(10) }),
  'onchain.algodAsset': z.object({ assetId: z.number().int().positive() }),
  'onchain.algodApplication': z.object({ applicationId: z.number().int().positive() }),
  'onchain.algodApplicationBoxes': z.object({
    applicationId: z.number().int().positive(),
    max: z.number().int().min(1).max(256).default(32),
    limit: z.number().int().min(1).max(256).optional(),
    next: z.string().optional(),
    prefix: z.string().optional(),
    include: z.string().optional(),
    round: z.number().int().positive().optional(),
  }),
  'onchain.algodApplicationBox': z.object({
    applicationId: z.number().int().positive(),
    name: z.string().trim().min(3).max(200),
  }),
  'onchain.algodBlock': z.object({ round: z.number().int().positive().optional(), headerOnly: z.boolean().default(true) }),
  'onchain.algodBlockHash': z.object({ round: z.number().int().positive().optional() }),
  'onchain.algodBlockTxids': z.object({ round: z.number().int().positive().optional() }),
  'onchain.algodBlockLogs': z.object({ round: z.number().int().positive().optional() }),
  'onchain.algodPending': z.object({ max: z.number().int().min(1).max(50).default(10) }),
}

export function parseRequest(operationId: string, value: unknown) {
  return requestSchemas[operationId].parse(value)
}
