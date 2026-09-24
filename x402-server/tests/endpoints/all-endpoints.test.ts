import { describe,expect,it } from 'vitest'
import { createApp } from '../../app'
import { endpoints } from '../../registry/endpoints'
import { testEnv } from '../helpers'

const app=createApp(testEnv,{payments:false})
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
  'onchain.algorandAccount':{address:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ'},
  'onchain.algorandPortfolio':{address:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ'},
  'onchain.algorandAsset':{assetId:10458941},
  'onchain.algorandDefi':{limit:10},
}
const query:Record<string,string>={
  'market.quotes':'symbols=BTC','market.assets':'query=BTC&limit=10','market.trending':'limit=10',
  'market.categories':'',
  'market.tokenPrices':'network=eth&addresses=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&addresses=0x6b175474e89094c44da98b954eedeac495271d0f',
  'market.fearGreed':'limit=1',
  'onchain.algodStatus':'',
  'onchain.algodSupply':'',
  'onchain.algodParams':'',
  'onchain.algodAccount':'address=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ',
  'onchain.algodAccountAssets':'address=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ&limit=20',
  'onchain.algodAccountAsset':'address=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ&assetId=10458941',
  'onchain.algodAccountApps':'address=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ&limit=20',
  'onchain.algodAccountApp':'address=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ&applicationId=12174882',
  'onchain.algodPendingByAddress':'address=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ&max=10',
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

describe('every published product endpoint',()=>{
  for(const endpoint of endpoints) it(`${endpoint.method} ${endpoint.path}`,async()=>{
    const q = query[endpoint.operationId]
    const response=endpoint.method==='GET'
      ?await app.request(q ? `${endpoint.path}?${q}` : endpoint.path)
      :await app.request(endpoint.path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body[endpoint.operationId])})
    const result=await response.json() as any
    expect(response.status).toBe(200)
    expect(result).toMatchObject({success:true,operationId:endpoint.operationId,meta:{dataMode:'mock',synthetic:true},payment:{network:'algorand-testnet',asset:'USDC'}})
    expect(result.requestId).toEqual(expect.any(String))
  })
})
