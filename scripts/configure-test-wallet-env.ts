import { readFile,writeFile,chmod } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const wallet=JSON.parse(await readFile('x402-server/finality-payer.test-wallet.json','utf8')) as {address:string;mnemonic:string}
const merchant=existsSync('x402-server/finality-merchant.test-wallet.json')?JSON.parse(await readFile('x402-server/finality-merchant.test-wallet.json','utf8')) as {address:string}:null
const target='x402-server/.env'
const source=existsSync(target)?await readFile(target,'utf8'):await readFile('.env.example','utf8')
const entries:Record<string,string>={
  X402_TEST_PAYER_ADDRESS:wallet.address,
  X402_TEST_PAYER_MNEMONIC:wallet.mnemonic,
  ...(merchant?{X402_PAYTO_ADDRESS:merchant.address}:{}),
}
let output=source
for(const [key,value] of Object.entries(entries)){
  const line=`${key}=${value}`
  const pattern=new RegExp(`^${key}=.*$`,'m')
  output=pattern.test(output)?output.replace(pattern,line):`${output.trimEnd()}\n${line}\n`
}
await writeFile(target,output,{encoding:'utf8',mode:0o600})
await chmod(target,0o600)
console.log(`Configured test payer ${wallet.address} in ${target}`)
