import { z } from 'zod'

const bool = z.enum(['true', 'false']).default('false').transform(v => v === 'true')
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  X402_PAYTO_ADDRESS: z.string().default('UEET5PA753P26B6LVUSXUKUYDVM33YLE6ETZWPLJDHJXQDKNYOUZPFKCSU'),
  X402_FACILITATOR_URL: z.string().url().default('https://facilitator.goplausible.xyz'),
  X402_NETWORK: z.enum(['algorand-mainnet', 'algorand-testnet']).default('algorand-mainnet'),
  X402_USDC_ASA_ID: z.coerce.number().int().positive().default(31566704),
  X402_ALLOWED_ORIGINS: z.string().default('https://finality.accuracy.wtf,http://localhost:3000'),
  X402_SERVER_PORT: z.coerce.number().int().min(1).max(65535).default(4021),
  /** Public base URL used as the discovery/catalog resource identity (no trailing slash). */
  X402_PUBLIC_URL: z.string().default('https://finality-x402-backend.onrender.com'),
  DATA_MODE: z.enum(['live', 'mock', 'auto']).default('live'),
  ALLOW_MOCK_FALLBACK: bool,
  ENABLE_DUMMY_ENDPOINT: bool,
  /** Optional CoinGecko Demo API key (x-cg-demo-api-key). Public endpoints work without it. */
  COINGECKO_API_KEY: z.string().default(''),
  /** Optional CoinGecko Pro API key (x-cg-pro-api-key) for onchain token_price / coins/list. */
  COINGECKO_PRO_API_KEY: z.string().default(''),
  ALGOD_SERVER: z.string().url().default('https://mainnet-api.4160.nodely.dev'),
  ALGOD_TOKEN: z.string().default(''),
  INDEXER_SERVER: z.string().url().default('https://mainnet-idx.4160.nodely.dev'),
  INDEXER_TOKEN: z.string().default(''),
  LLM_PROVIDER: z.enum(['ollama', 'groq', 'huggingface', 'gemini']).default('ollama'),
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_API_KEY: z.string().default(''), OLLAMA_MODEL: z.string().default('qwen3:8b'),
  GROQ_API_KEY: z.string().default(''), GROQ_MODEL: z.string().default(''),
  /** Google AI Studio / Gemini API key (OpenAI-compatible endpoint). */
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
})

export type Env = z.infer<typeof schema>
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const env = schema.parse(source)
  if (env.NODE_ENV === 'production' && env.DATA_MODE === 'mock') throw new Error('Production rejects DATA_MODE=mock')
  if (env.NODE_ENV === 'production' && env.ENABLE_DUMMY_ENDPOINT) throw new Error('Production rejects ENABLE_DUMMY_ENDPOINT=true')
  return env
}
