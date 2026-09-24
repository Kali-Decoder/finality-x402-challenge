import { chmod,writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import algosdk from 'algosdk'

const target='x402-server/finality-merchant.test-wallet.json'
if(existsSync(target)) throw new Error(`Refusing to overwrite existing ${target}`)
const account=algosdk.generateAccount()
const wallet={address:account.addr.toString(),mnemonic:algosdk.secretKeyToMnemonic(account.sk),network:'testnet',purpose:'Dedicated Finality x402 merchant receiver',createdAt:new Date().toISOString()}
await writeFile(target,JSON.stringify(wallet,null,2),{encoding:'utf8',mode:0o600,flag:'wx'})
await chmod(target,0o600)
console.log(wallet.address)
