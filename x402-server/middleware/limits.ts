import type { MiddlewareHandler } from 'hono'
import { endpoints } from '../registry/endpoints'

const windows=new Map<string,{start:number,count:number}>()
let active=0
const paths=new Set(endpoints.map(v=>v.path))

export const limits: MiddlewareHandler = async (c,next) => {
  if(!paths.has(c.req.path)) return next()
  const length=Number(c.req.header('content-length')??0)
  if(length>32_768) return c.json({success:false,requestId:(c as any).get('requestId'),error:{code:'payload_too_large',message:'Request body exceeds 32768 bytes'}},413)
  const payer=c.req.header('x-payer-address') || c.req.header('x-forwarded-for')?.split(',')[0] || 'local'
  const key=`${payer}:${c.req.path}`,now=Date.now(),entry=windows.get(key)
  const current=!entry||now-entry.start>=60_000?{start:now,count:0}:entry
  current.count++; windows.set(key,current)
  if(current.count>60) return c.json({success:false,requestId:(c as any).get('requestId'),error:{code:'rate_limited',message:'Endpoint rate limit exceeded',retryable:true}},429)
  if(active>=50) return c.json({success:false,requestId:(c as any).get('requestId'),error:{code:'concurrency_limited',message:'Server concurrency limit reached',retryable:true}},503)
  active++
  try { await next() } finally { active-- }
}
