import { readFile } from 'node:fs/promises'
import algosdk from 'algosdk'

const wallet=JSON.parse(await readFile('x402-server/finality-payer.test-wallet.json','utf8')) as {address:string;mnemonic:string}
const algod=new algosdk.Algodv2('',process.env.ALGOD_SERVER||'https://testnet-api.4160.nodely.dev','')
const account=algosdk.mnemonicToSecretKey(wallet.mnemonic)
if(account.addr.toString()!==wallet.address) throw new Error('Stored wallet address does not match signing key')
const info=await algod.accountInformation(wallet.address).do()
const balance=Number(info.amount)/1e6
console.log(JSON.stringify({stage:'balance',address:wallet.address,algo:balance}))
if(balance<0.2) throw new Error('At least 0.2 Testnet ALGO is required before ASA opt-in')
const assetId=10458941
const optedIn=(info.assets??[]).some((asset:any)=>Number(asset.assetId??asset['asset-id'])===assetId)
if(optedIn){console.log(JSON.stringify({stage:'already-opted-in',address:wallet.address,assetId}));process.exit(0)}
const suggestedParams=await algod.getTransactionParams().do()
const transaction=algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({sender:wallet.address,receiver:wallet.address,amount:0,assetIndex:assetId,suggestedParams})
const result=await algod.sendRawTransaction(transaction.signTxn(account.sk)).do()
const txId=String(result.txid)
const confirmation=await algosdk.waitForConfirmation(algod,txId,10)
console.log(JSON.stringify({stage:'opted-in',address:wallet.address,assetId,txId,confirmedRound:Number(confirmation.confirmedRound)}))
