import { merchantUrl } from '@/lib/x402/client'

export type CatalogEndpoint = {
  operationId: string
  method: 'GET' | 'POST'
  path: string
  price: string
  description: string
  availabilityTrack: string
  limits: Record<string, number>
  requestExample: Record<string, unknown>
}

export type EndpointMeta = { title: string; category: string; use: string }

export const ENDPOINT_DETAILS: Record<string, EndpointMeta> = {
  'market.quotes': { title: 'Live Quotes', category: 'Market data', use: 'Current spot price, 24h change and volume' },
  'market.assets': { title: 'Asset Search', category: 'Market data', use: 'Find and normalize supported symbols' },
  'market.candles': { title: 'Price Candles', category: 'Market data', use: 'Bounded OHLCV history for analysis' },
  'market.trending': { title: 'Trending Markets', category: 'Market data', use: 'Rank liquid assets by current volume' },
  'market.categories': { title: 'Coin Categories', category: 'Market data', use: 'Categories ranked by 24h market-cap change' },
  'market.tokenPrices': { title: 'Token Prices', category: 'Market data', use: 'ERC-20 / on-chain token USD prices' },
  'market.fearGreed': { title: 'Fear & Greed', category: 'Market data', use: 'Daily crypto market sentiment' },
  'intelligence.signals': { title: 'Trading Signals', category: 'Intelligence', use: 'Directional signal with score and regime' },
  'intelligence.technicals': { title: 'Technical Snapshot', category: 'Intelligence', use: 'SMA, RSI, momentum and market regime' },
  'intelligence.report': { title: 'Market Report', category: 'Intelligence', use: 'Combined technical signal and risk view' },
  'intelligence.volume': { title: 'Volume Analysis', category: 'Intelligence', use: 'Participation, average volume and spike detection' },
  'intelligence.events': { title: 'Price Events', category: 'Intelligence', use: 'Detect statistically meaningful price moves' },
  'intelligence.backtest': { title: 'Strategy Backtest', category: 'Intelligence', use: 'Test a moving-average strategy on history' },
  'agent.decision': { title: 'Agent Decision', category: 'Agent tools', use: 'Bounded action, confidence and position limit' },
  'agent.briefing': { title: 'Agent Briefing', category: 'Agent tools', use: 'Compact machine-readable market context' },
  'agent.strategyParse': { title: 'Strategy Parser', category: 'Agent tools', use: 'Turn plain language into validated rules' },
  'ai.chat': { title: 'AI Market Analyst', category: 'AI analyst', use: 'Ask a concise Groq-powered market question' },
  'onchain.algorandAccount': { title: 'Algorand Account', category: 'Algorand', use: 'Inspect a Mainnet account from the Indexer' },
  'onchain.algorandPortfolio': { title: 'ASA Portfolio', category: 'Algorand', use: 'Review ALGO and Algorand asset holdings' },
  'onchain.algorandAsset': { title: 'Asset Intelligence', category: 'Algorand', use: 'Retrieve verified ASA metadata' },
  'onchain.algorandDefi': { title: 'DeFi Activity', category: 'Algorand', use: 'Inspect recent application activity without invented metrics' },
  'onchain.algodStatus': { title: 'Node Status', category: 'Algorand', use: 'Live Nodely algod last round and catchup status' },
  'onchain.algodSupply': { title: 'Ledger Supply', category: 'Algorand', use: 'Online and total ALGO reported by the ledger' },
  'onchain.algodParams': { title: 'Tx Parameters', category: 'Algorand', use: 'Suggested fee, first/last round, and genesis' },
  'onchain.algodAccount': { title: 'Live Account', category: 'Algorand', use: 'Current algod account balance and holdings' },
  'onchain.algodAccountAssets': { title: 'Account Assets', category: 'Algorand', use: 'Paginated ASA holdings for an account' },
  'onchain.algodAccountAsset': { title: 'Account ASA', category: 'Algorand', use: 'One asset holding and creator params' },
  'onchain.algodAccountApps': { title: 'Account Apps', category: 'Algorand', use: 'Paginated application local state' },
  'onchain.algodAccountApp': { title: 'Account App', category: 'Algorand', use: 'Local and creator global state for one app' },
  'onchain.algodPendingByAddress': { title: 'Address Mempool', category: 'Algorand', use: 'Unconfirmed transactions for an address' },
  'onchain.algodAsset': { title: 'Live Asset', category: 'Algorand', use: 'Current algod ASA parameters' },
  'onchain.algodApplication': { title: 'Application', category: 'Algorand', use: 'Approval/clear programs and global state' },
  'onchain.algodApplicationBoxes': { title: 'App Boxes', category: 'Algorand', use: 'Box names stored by an application' },
  'onchain.algodApplicationBox': { title: 'App Box', category: 'Algorand', use: 'One box value using goal name encoding' },
  'onchain.algodBlock': { title: 'Block Header', category: 'Algorand', use: 'Header-only block for a round' },
  'onchain.algodBlockHash': { title: 'Block Hash', category: 'Algorand', use: 'Block hash for a round' },
  'onchain.algodBlockTxids': { title: 'Block TxIDs', category: 'Algorand', use: 'Top-level transaction IDs in a block' },
  'onchain.algodBlockLogs': { title: 'Block Logs', category: 'Algorand', use: 'Outer and inner app-call logs for a round' },
  'onchain.algodPending': { title: 'Mempool', category: 'Algorand', use: 'Global unconfirmed transaction pool' },
}

export const CATEGORY_ORDER = ['Market data', 'Intelligence', 'Agent tools', 'AI analyst', 'Algorand'] as const

export function metaFor(operationId: string): EndpointMeta {
  return ENDPOINT_DETAILS[operationId] || { title: operationId, category: 'Other', use: '' }
}

export async function fetchCatalog(): Promise<CatalogEndpoint[]> {
  const r = await fetch(`${merchantUrl}/v1/catalog`)
  const v = await r.json()
  if (!r.ok) throw new Error(v?.error?.message || `HTTP ${r.status}`)
  return v.data ?? []
}

export async function fetchHealth(): Promise<Record<string, unknown>> {
  const r = await fetch(`${merchantUrl}/health`)
  const v = await r.json()
  if (!r.ok) throw new Error(v?.error?.message || `HTTP ${r.status}`)
  return v
}

export async function fetchInfo(): Promise<Record<string, unknown>> {
  const r = await fetch(`${merchantUrl}/info`)
  const v = await r.json()
  if (!r.ok) throw new Error(v?.error?.message || `HTTP ${r.status}`)
  return v
}
