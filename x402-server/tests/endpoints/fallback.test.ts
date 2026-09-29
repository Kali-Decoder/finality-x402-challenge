import { afterEach,describe,expect,it,vi } from 'vitest'
import { executeOperation } from '../../services/operation'
import { loadEnv } from '../../config/env'

const autoEnv=loadEnv({
  NODE_ENV:'test',DATA_MODE:'auto',ALLOW_MOCK_FALLBACK:'true',ENABLE_DUMMY_ENDPOINT:'false',
  X402_PAYTO_ADDRESS:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ',
  X402_FACILITATOR_URL:'https://facilitator.goplausible.xyz',X402_NETWORK:'algorand-testnet',
  X402_USDC_ASA_ID:'10458941',X402_ALLOWED_ORIGINS:'http://localhost:3000',X402_SERVER_PORT:'4021',
  INDEXER_SERVER:'https://testnet-idx.4160.nodely.dev',ALGOD_SERVER:'https://testnet-api.4160.nodely.dev',
  LLM_PROVIDER:'ollama',OLLAMA_BASE_URL:'http://localhost:11434',OLLAMA_MODEL:'qwen3:8b',
})

/** Live mode without ALLOW_MOCK_FALLBACK — soft domains must still return dummy data. */
const liveEnv=loadEnv({
  NODE_ENV:'test',DATA_MODE:'live',ALLOW_MOCK_FALLBACK:'false',ENABLE_DUMMY_ENDPOINT:'false',
  X402_PAYTO_ADDRESS:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ',
  X402_FACILITATOR_URL:'https://facilitator.goplausible.xyz',X402_NETWORK:'algorand-testnet',
  X402_USDC_ASA_ID:'10458941',X402_ALLOWED_ORIGINS:'http://localhost:3000',X402_SERVER_PORT:'4021',
  INDEXER_SERVER:'https://testnet-idx.4160.nodely.dev',ALGOD_SERVER:'https://testnet-api.4160.nodely.dev',
  LLM_PROVIDER:'ollama',OLLAMA_BASE_URL:'http://localhost:11434',OLLAMA_MODEL:'qwen3:8b',
})

afterEach(()=>vi.unstubAllGlobals())

describe('explicit automatic fallback',()=>{
  it('returns labeled synthetic on-chain data when the live provider is unavailable',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('provider down')))
    const result=await executeOperation(autoEnv,'onchain.algorandAsset',{assetId:10458941})
    expect(result.meta).toMatchObject({dataMode:'mock',synthetic:true,fallback:true,fallbackReason:'upstream_error'})
  })

  it('returns labeled synthetic fear/greed data when the live provider is unavailable',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('provider down')))
    const result=await executeOperation(autoEnv,'market.fearGreed',{limit:1})
    expect(result.meta).toMatchObject({dataMode:'mock',synthetic:true,fallback:true,fallbackReason:'upstream_error'})
  })
})

describe('soft-domain always-fallback (market / intelligence / agent / ai)',()=>{
  it('returns dummy market quotes in live mode when provider fails',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('provider down')))
    const result=await executeOperation(liveEnv,'market.quotes',{symbols:['BTC','ETH']})
    expect(result.meta).toMatchObject({dataMode:'mock',synthetic:true,fallback:true})
    expect(Array.isArray(result.data)).toBe(true)
    expect((result.data as any[]).length).toBe(2)
  })

  it('returns dummy intelligence signals in live mode when candles provider fails',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('provider down')))
    const result=await executeOperation(liveEnv,'intelligence.signals',{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:40})
    expect(result.data).toMatchObject({signals:[{symbol:'BTC'}],summary:expect.any(Object),answer:expect.any(String)})
    expect(result.meta?.synthetic).toBe(false)
  })

  it('returns dummy agent decision in live mode when candles provider fails',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('provider down')))
    const result=await executeOperation(liveEnv,'agent.decision',{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:40,risk:'balanced'})
    expect(result.data).toMatchObject({action:expect.any(String),confidence:expect.any(Number),risk:'balanced',answer:expect.any(String)})
    expect(result.meta?.synthetic).toBe(false)
  })

  it('returns synthetic ai.chat answer when model provider fails',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('model down')))
    const result=await executeOperation(liveEnv,'ai.chat',{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:20,prompt:'Analyze BTC'})
    expect(result.data).toMatchObject({answer:expect.stringContaining('Synthetic analyst response')})
    expect((result.data as any).answer).toBeTruthy()
  })

  it('returns pro intelligence payload with answer when candles provider fails',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('provider down')))
    const result=await executeOperation(liveEnv,'intelligence.volume',{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:40})
    expect(result.data).toMatchObject({answer:expect.any(String),symbol:'BTC'})
    expect(result.meta?.synthetic).toBe(false)
  })
})
