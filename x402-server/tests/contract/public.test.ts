import { describe,expect,it } from 'vitest'
import { createApp } from '../../app'
import { endpoints } from '../../registry/endpoints'
import { testEnv } from '../helpers'

const app = createApp(testEnv,{payments:false})
describe('public merchant contract',()=>{
  it('reports health without secrets',async()=>{ const r=await app.request('/health'); expect(r.status).toBe(200); expect(await r.json()).toMatchObject({status:'ok',service:'Finality Market Intelligence'}) })
  it('publishes every product operation in catalog',async()=>{ const r=await app.request('/v1/catalog'); const body=await r.json() as any; expect(body.data).toHaveLength(endpoints.length); expect(body.data.some((v:any)=>v.operationId==='test.dummy')).toBe(false) })
  it('publishes OpenAPI',async()=>{ const r=await app.request('/v1/openapi.json'); const body=await r.json() as any; expect(body.openapi).toBe('3.1.0'); expect(body.paths['/v1/signals'].post.operationId).toBe('intelligence.signals') })
})
