import { readFile } from 'node:fs/promises'
import algosdk from 'algosdk'
import { x402Client } from '@x402/core/client'
import { wrapFetchWithPayment } from '@x402/fetch'
import { ExactAvmScheme } from '@x402/avm/exact/client'
import { toClientAvmSigner } from '@x402/avm'
import { endpoints } from '../x402-server/registry/endpoints'
import { ALGORAND_TESTNET_CAIP2 } from '../x402-server/config/payment'

const body:Record<string,any>={
  'market.candles':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:30},
  'intelligence.signals':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:30},
  'intelligence.technicals':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:30},
  'intelligence.report':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:30},
  'intelligence.volume':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:30},
  'intelligence.events':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:30},
  'intelligence.backtest':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:50,strategy:{fastPeriod:5,slowPeriod:10,initialCapital:10000}},
  'agent.decision':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:30,risk:'balanced'},
  'agent.briefing':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:30},
  'agent.strategyParse':{prompt:'Buy when fast 10 crosses above slow 30'},
  'ai.chat':{symbols:['BTC'],marketType:'crypto',interval:'1h',limit:30,prompt:'Analyze BTC'},
  'onchain.algorandAccount':{address:'TEST_WALLET'},
  'onchain.algorandPortfolio':{address:'TEST_WALLET'},
  'onchain.algorandAsset':{assetId:10458941},
  'onchain.algorandDefi':{address:'TEST_WALLET',limit:10},
}
const query:Record<string,string>={
  'market.quotes':'symbols=BTC','market.assets':'query=BTC&limit=10','market.trending':'limit=10',
  'market.categories':'',
  'market.tokenPrices':'network=eth&addresses=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  'market.fearGreed':'limit=1',
  'onchain.algodStatus':'',
  'onchain.algodSupply':'',
  'onchain.algodParams':'',
  'onchain.algodAccount':'address=TEST_WALLET',
  'onchain.algodAccountAssets':'address=TEST_WALLET&limit=20',
  'onchain.algodAccountAsset':'address=TEST_WALLET&assetId=10458941',
  'onchain.algodAccountApps':'address=TEST_WALLET&limit=20',
  'onchain.algodAccountApp':'address=TEST_WALLET&applicationId=12174882',
  'onchain.algodPendingByAddress':'address=TEST_WALLET&max=10',
  'onchain.algodAsset':'assetId=10458941',
  'onchain.algodApplication':'applicationId=12174882',
  'onchain.algodApplicationBoxes':'applicationId=12174882&max=32',
  'onchain.algodApplicationBox':'applicationId=12174882&name=str:hello',
  'onchain.algodBlock':'headerOnly=true',
  'onchain.algodBlockHash':'',
  'onchain.algodBlockTxids':'',
  'onchain.algodBlockLogs':'',
  'onchain.algodPending':'max=10',
}

async function loadPayer() {
  try {
    return JSON.parse(await readFile('x402-server/finality-payer.test-wallet.json', 'utf8')) as { address: string; mnemonic: string }
  } catch {
    const address = process.env.X402_TEST_PAYER_ADDRESS
    const mnemonic = process.env.X402_TEST_PAYER_MNEMONIC
    if (!address || !mnemonic) {
      throw new Error('Missing x402-server/finality-payer.test-wallet.json and X402_TEST_PAYER_* env vars')
    }
    return { address, mnemonic }
  }
}

async function main(){
  const wallet = await loadPayer()
  const account=algosdk.mnemonicToSecretKey(wallet.mnemonic)
  if(account.addr.toString()!==wallet.address) throw new Error('Test payer key mismatch')
  const signer=toClientAvmSigner(Buffer.from(account.sk).toString('base64'))
  const client=new x402Client().register(ALGORAND_TESTNET_CAIP2,new ExactAvmScheme(signer))
  const paidFetch=wrapFetchWithPayment(fetch,client)
  const base=process.env.X402_SMOKE_URL||'https://finality-x402-backend.onrender.com'
  const operationFilter=process.env.X402_SMOKE_OPERATION
  const continueOnError=process.env.X402_SMOKE_CONTINUE !== '0'
  const delayMs=Number(process.env.X402_SMOKE_DELAY_MS || 800)
  const selected=endpoints.filter(endpoint=>!operationFilter||endpoint.operationId===operationFilter)
  if(operationFilter&&!selected.length)throw new Error(`Unknown operation ${operationFilter}`)
  const results=[] as Array<{operationId:string;status:number;receipt:boolean;ok:boolean;error?:string}>
  for(const endpoint of selected){
    const qs = (query[endpoint.operationId] ?? '').replaceAll('TEST_WALLET', wallet.address)
    const path = endpoint.method === 'GET' ? (qs ? `${endpoint.path}?${qs}` : endpoint.path) : endpoint.path
    const requestBody={...body[endpoint.operationId]}
    if(requestBody.address==='TEST_WALLET') requestBody.address=wallet.address
    const init:RequestInit=endpoint.method==='POST'?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(requestBody)}:{method:'GET'}
    try {
      const response=await paidFetch(`${base}${path}`,init)
      const result=await response.json().catch(()=>({})) as any
      const ok=response.ok && result.operationId===endpoint.operationId
      const row={
        operationId:endpoint.operationId,
        status:response.status,
        receipt:Boolean(response.headers.get('payment-response')||response.headers.get('PAYMENT-RESPONSE')),
        ok,
        ...(!ok ? { error: JSON.stringify(result).slice(0,240) } : {}),
      }
      results.push(row)
      console.error(`${ok ? 'ok' : 'fail'} ${endpoint.operationId} HTTP ${response.status}`)
      if(!ok && !continueOnError) throw new Error(`${endpoint.operationId} failed with HTTP ${response.status}: ${row.error}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      results.push({ operationId: endpoint.operationId, status: 0, receipt: false, ok: false, error: message.slice(0,240) })
      console.error(`fail ${endpoint.operationId} ${message.slice(0,160)}`)
      if(!continueOnError) throw error
    }
    if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs))
  }
  const passed = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok)
  console.log(JSON.stringify({
    payer: wallet.address,
    network: 'algorand-testnet',
    base,
    passed,
    failed: failed.length,
    results,
  }, null, 2))
  if (failed.length) process.exitCode = 1
}

main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1})
