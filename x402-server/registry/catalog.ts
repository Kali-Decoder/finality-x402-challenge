import { endpoints } from './endpoints'

const symbolList = { type:'array', minItems:1, maxItems:10, items:{type:'string',minLength:1,maxLength:20}, example:['BTC'] }
const baseProperties = {
  symbols:symbolList,
  marketType:{type:'string',enum:['crypto','meme','forex','equity','etf'],default:'crypto'},
  interval:{type:'string',enum:['1m','5m','15m','1h','4h','1d'],default:'1h'},
  limit:{type:'integer',minimum:2,maximum:500,default:100},
}
const baseBody = { type:'object', properties:baseProperties, required:['symbols'], additionalProperties:false }
const address = {type:'string',pattern:'^[A-Z2-7]{58}$',example:'WJJ7MTAZTDXAI7656JHB3V432U7XUNTIKSYRTYQD3FAGDMEGLOUFGMN7SI'}
const assetId = { type:'integer', minimum:1, example:10458941 }
const applicationId = { type:'integer', minimum:1, example:12174882 }
const round = { type:'integer', minimum:1, example:67421801 }

const requestBodies: Record<string,unknown> = {
  'market.candles':baseBody,
  'intelligence.signals':baseBody,
  'intelligence.technicals':baseBody,
  'intelligence.report':baseBody,
  'intelligence.volume':baseBody,
  'intelligence.events':baseBody,
  'intelligence.backtest':{...baseBody,properties:{...baseProperties,strategy:{type:'object',properties:{fastPeriod:{type:'integer',minimum:2,maximum:100,default:10},slowPeriod:{type:'integer',minimum:3,maximum:200,default:30},initialCapital:{type:'number',exclusiveMinimum:0,maximum:1000000,default:10000}}}},required:['symbols']},
  'agent.decision':{...baseBody,properties:{...baseProperties,risk:{type:'string',enum:['conservative','balanced','aggressive'],default:'balanced'}}},
  'agent.briefing':baseBody,
  'agent.strategyParse':{type:'object',properties:{prompt:{type:'string',minLength:5,maxLength:2000,example:'Buy when fast 10 crosses above slow 30'}},required:['prompt'],additionalProperties:false},
  'ai.chat':{...baseBody,properties:{...baseProperties,prompt:{type:'string',minLength:1,maxLength:4000,example:'Analyze BTC market conditions'}},required:['symbols','prompt']},
  'onchain.algorandAccount':{type:'object',properties:{address},required:['address'],additionalProperties:false},
  'onchain.algorandPortfolio':{type:'object',properties:{address},required:['address'],additionalProperties:false},
  'onchain.algorandAsset':{type:'object',properties:{assetId:{type:'integer',minimum:1,example:10458941}},required:['assetId'],additionalProperties:false},
  'onchain.algorandDefi':{type:'object',properties:{address,limit:{type:'integer',minimum:1,maximum:100,default:20}},additionalProperties:false},
}

const queryParameters: Record<string,unknown[]> = {
  'market.quotes':[{name:'symbols',in:'query',required:true,schema:symbolList,explode:true}],
  'market.assets':[{name:'query',in:'query',required:true,schema:{type:'string',minLength:1,maxLength:40},example:'BTC'},{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:20,default:10}}],
  'market.trending':[{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:20,default:10}}],
  'market.categories':[],
  'market.tokenPrices':[
    {name:'network',in:'query',schema:{type:'string',minLength:2,maxLength:32,default:'eth',example:'eth'}},
    {name:'addresses',in:'query',required:true,schema:{type:'array',minItems:1,maxItems:20,items:{type:'string',minLength:8,maxLength:128},example:['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48']},explode:true},
  ],
  'market.fearGreed':[{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:30,default:1}}],
  'onchain.algodStatus':[],
  'onchain.algodSupply':[],
  'onchain.algodParams':[],
  'onchain.algodAccount':[{name:'address',in:'query',required:true,schema:address},{name:'exclude',in:'query',schema:{type:'string',example:'none'}}],
  'onchain.algodAccountAssets':[{name:'address',in:'query',required:true,schema:address},{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'next',in:'query',schema:{type:'string'}}],
  'onchain.algodAccountAsset':[{name:'address',in:'query',required:true,schema:address},{name:'assetId',in:'query',required:true,schema:assetId}],
  'onchain.algodAccountApps':[{name:'address',in:'query',required:true,schema:address},{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'next',in:'query',schema:{type:'string'}},{name:'include',in:'query',schema:{type:'string'}}],
  'onchain.algodAccountApp':[{name:'address',in:'query',required:true,schema:address},{name:'applicationId',in:'query',required:true,schema:applicationId}],
  'onchain.algodPendingByAddress':[{name:'address',in:'query',required:true,schema:address},{name:'max',in:'query',schema:{type:'integer',minimum:1,maximum:50,default:10}}],
  'onchain.algodAsset':[{name:'assetId',in:'query',required:true,schema:assetId}],
  'onchain.algodApplication':[{name:'applicationId',in:'query',required:true,schema:applicationId}],
  'onchain.algodApplicationBoxes':[{name:'applicationId',in:'query',required:true,schema:applicationId},{name:'max',in:'query',schema:{type:'integer',minimum:1,maximum:256,default:32}},{name:'next',in:'query',schema:{type:'string'}},{name:'prefix',in:'query',schema:{type:'string'}}],
  'onchain.algodApplicationBox':[{name:'applicationId',in:'query',required:true,schema:applicationId},{name:'name',in:'query',required:true,schema:{type:'string',example:'str:hello'}}],
  'onchain.algodBlock':[{name:'round',in:'query',schema:round},{name:'headerOnly',in:'query',schema:{type:'boolean',default:true}}],
  'onchain.algodBlockHash':[{name:'round',in:'query',schema:round}],
  'onchain.algodBlockTxids':[{name:'round',in:'query',schema:round}],
  'onchain.algodBlockLogs':[{name:'round',in:'query',schema:round}],
  'onchain.algodPending':[{name:'max',in:'query',schema:{type:'integer',minimum:1,maximum:50,default:10}}],
}

const examples: Record<string, unknown> = {
  'market.quotes': { quotes:[{symbol:'BTC',price:50000,change24h:1.2,volume24h:1000000}] },
  'market.candles': { candles:[{time:1700000000000,open:100,high:102,low:99,close:101,volume:1000}] },
  'market.categories': { categories:[{id:'layer-1',name:'Layer 1',marketCapChange24h:1.2}] },
  'market.tokenPrices': { tokenPrices:[{network:'eth',address:'0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',priceUsd:1}] },
  'intelligence.signals': { signals:[{symbol:'BTC',direction:'HOLD',score:50}],summary:{direction:'HOLD'} },
  'ai.chat': { answer:'Bounded market analysis',generatedByModel:true },
  'onchain.algorandAccount': { address:'ALGORAND_ADDRESS',amount:0,assets:[] },
  'onchain.algodStatus': { found:true, 'last-round':67421801 },
  'onchain.algodSupply': { found:true, 'current_round':67421801, 'online-money':0, 'total-money':0 },
  'onchain.algodAccount': { found:true, address:'ALGORAND_ADDRESS', amount:0, assets:[] },
  'onchain.algodAsset': { found:true, index:10458941, params:{ name:'USDC', 'unit-name':'USDC', decimals:6 } },
}
const requestExamples: Record<string,unknown> = {
  'market.quotes':{symbols:['BTC','ETH']},'market.assets':{query:'BTC',limit:10},
  'market.candles':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:100},'market.trending':{limit:10},'market.categories':{},
  'market.tokenPrices':{network:'eth',addresses:['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48','0x6b175474e89094c44da98b954eedeac495271d0f']},
  'market.fearGreed':{limit:1},
  'intelligence.signals':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:100},'intelligence.technicals':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:100},
  'intelligence.report':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:100},'intelligence.volume':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:100},
  'intelligence.events':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:100},'intelligence.backtest':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:100,strategy:{fastPeriod:10,slowPeriod:30,initialCapital:10000}},
  'agent.decision':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:100,risk:'balanced'},'agent.briefing':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:100},
  'agent.strategyParse':{prompt:'Buy when fast 10 crosses above slow 30'},'ai.chat':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:100,prompt:'Analyze the current BTC market setup and state the risks.'},
  'onchain.algorandAccount':{address:'WJJ7MTAZTDXAI7656JHB3V432U7XUNTIKSYRTYQD3FAGDMEGLOUFGMN7SI'},'onchain.algorandPortfolio':{address:'WJJ7MTAZTDXAI7656JHB3V432U7XUNTIKSYRTYQD3FAGDMEGLOUFGMN7SI'},
  'onchain.algorandAsset':{assetId:10458941},'onchain.algorandDefi':{limit:20},
  'onchain.algodStatus':{},'onchain.algodSupply':{},'onchain.algodParams':{},
  'onchain.algodAccount':{address:'WJJ7MTAZTDXAI7656JHB3V432U7XUNTIKSYRTYQD3FAGDMEGLOUFGMN7SI'},
  'onchain.algodAccountAssets':{address:'WJJ7MTAZTDXAI7656JHB3V432U7XUNTIKSYRTYQD3FAGDMEGLOUFGMN7SI',limit:20},
  'onchain.algodAccountAsset':{address:'WJJ7MTAZTDXAI7656JHB3V432U7XUNTIKSYRTYQD3FAGDMEGLOUFGMN7SI',assetId:10458941},
  'onchain.algodAccountApps':{address:'WJJ7MTAZTDXAI7656JHB3V432U7XUNTIKSYRTYQD3FAGDMEGLOUFGMN7SI',limit:20},
  'onchain.algodAccountApp':{address:'WJJ7MTAZTDXAI7656JHB3V432U7XUNTIKSYRTYQD3FAGDMEGLOUFGMN7SI',applicationId:12174882},
  'onchain.algodPendingByAddress':{address:'WJJ7MTAZTDXAI7656JHB3V432U7XUNTIKSYRTYQD3FAGDMEGLOUFGMN7SI',max:10},
  'onchain.algodAsset':{assetId:10458941},
  'onchain.algodApplication':{applicationId:12174882},
  'onchain.algodApplicationBoxes':{applicationId:12174882,max:32},
  'onchain.algodApplicationBox':{applicationId:12174882,name:'str:hello'},
  'onchain.algodBlock':{headerOnly:true},
  'onchain.algodBlockHash':{},
  'onchain.algodBlockTxids':{},
  'onchain.algodBlockLogs':{},
  'onchain.algodPending':{max:10},
}

export function exampleFor(operationId: string) { return examples[operationId] ?? { operationId, result:'See OpenAPI response schema' } }
export function requestExampleFor(operationId: string): Record<string, unknown> {
  return (requestExamples[operationId] ?? {}) as Record<string, unknown>
}

/** Build a bazaar/discovery extension config for GoPlausible cataloging. */
export function discoveryConfigFor(endpoint: { operationId: string; method: 'GET' | 'POST' }) {
  const outputExample = exampleFor(endpoint.operationId)
  const inputExample = requestExampleFor(endpoint.operationId)

  if (endpoint.method === 'GET') {
    const params = queryParameters[endpoint.operationId] ?? []
    const properties: Record<string, unknown> = {}
    const required: string[] = []
    for (const param of params as Array<{ name: string; required?: boolean; schema?: unknown }>) {
      properties[param.name] = param.schema ?? { type: 'string' }
      if (param.required) required.push(param.name)
    }
    return {
      input: inputExample,
      inputSchema: {
        properties,
        ...(required.length ? { required } : {}),
      },
      output: { example: outputExample },
    }
  }

  const body = requestBodies[endpoint.operationId] as { properties?: Record<string, unknown>; required?: string[] } | undefined
  return {
    bodyType: 'json' as const,
    input: inputExample,
    inputSchema: {
      properties: body?.properties ?? {},
      ...(body?.required?.length ? { required: body.required } : {}),
    },
    output: { example: outputExample },
  }
}

export function catalog() {
  return endpoints.map(endpoint => ({ ...endpoint, currency:'USDC', network:'algorand-mainnet', sourceMetadataRequired:true, requestExample:requestExamples[endpoint.operationId], exampleResponse:{ success:true, operationId:endpoint.operationId, requestId:'00000000-0000-4000-8000-000000000000', data:exampleFor(endpoint.operationId), meta:{ source:'provider', provider:'public-rest', asOf:'2026-01-01T00:00:00.000Z', freshnessSeconds:15, limitations:[], availabilityTrack:endpoint.availabilityTrack, dataMode:'live', synthetic:false } } }))
}

export function openapi(serverUrl = process.env.X402_PUBLIC_URL || 'https://finality-x402-backend.onrender.com') {
  const paths: Record<string,any> = {}
  for (const endpoint of endpoints) {
    const method = endpoint.method.toLowerCase()
    paths[endpoint.path] ??= {}
    paths[endpoint.path][method] = {
      operationId:endpoint.operationId,
      summary:endpoint.description,
      description:`Price: ${endpoint.price} USDC on Algorand Mainnet. First call without PAYMENT-SIGNATURE returns the x402 payment requirements.`,
      tags:[endpoint.operationId.split('.')[0]],
      security:[{x402Payment:[]}],
      parameters:queryParameters[endpoint.operationId],
      requestBody:endpoint.method==='POST'?{required:true,content:{'application/json':{schema:requestBodies[endpoint.operationId]}}}:undefined,
      responses:{
        '200':{description:'Paid successful response',headers:{'PAYMENT-RESPONSE':{description:'Settlement receipt',schema:{type:'string'}}},content:{'application/json':{example:{success:true,operationId:endpoint.operationId,requestId:'00000000-0000-4000-8000-000000000000',data:exampleFor(endpoint.operationId)}}}},
        '400':{description:'Invalid request'},
        '402':{description:'x402 payment required; response contains payment requirements'},
        '503':{description:'Provider unavailable'},
      },
    }
  }
  return { openapi:'3.1.0', info:{ title:'Finality Market Intelligence API',version:'1.0.0',description:'Agent- and user-accessible market intelligence paid with Algorand Mainnet USDC through x402. Swagger can inspect unpaid 402 responses or accept a pre-built PAYMENT-SIGNATURE; use the Finality web app for interactive wallet signing.' }, servers:[{url:serverUrl}], components:{securitySchemes:{x402Payment:{type:'apiKey',in:'header',name:'PAYMENT-SIGNATURE',description:'x402 payment payload generated and signed by an Algorand wallet client.'}}}, paths }
}
