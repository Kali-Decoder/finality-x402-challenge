import { loadEnv } from '../config/env'
export const testEnv = loadEnv({
  NODE_ENV:'test', DATA_MODE:'mock', ALLOW_MOCK_FALLBACK:'false', ENABLE_DUMMY_ENDPOINT:'true',
  X402_PAYTO_ADDRESS:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ',
  X402_FACILITATOR_URL:'https://facilitator.goplausible.xyz', X402_NETWORK:'algorand-testnet',
  X402_USDC_ASA_ID:'10458941', X402_ALLOWED_ORIGINS:'http://localhost:3000', X402_SERVER_PORT:'4021',
  INDEXER_SERVER:'https://testnet-idx.4160.nodely.dev', ALGOD_SERVER:'https://testnet-api.4160.nodely.dev',
  LLM_PROVIDER:'ollama', OLLAMA_BASE_URL:'http://localhost:11434', OLLAMA_MODEL:'qwen3:8b',
})
