import type { Context } from 'hono'
import type { Env } from '../config/env'
import { parseRequest } from '../schemas'
import { executeOperation } from '../services/operation'

const numericKeys = new Set(['limit', 'max', 'assetId', 'applicationId', 'round'])
const booleanKeys = new Set(['headerOnly'])

function query(c: Context) {
  const q = c.req.queries(), value: Record<string,unknown> = {}
  for (const [key,values] of Object.entries(q)) {
    const items = values ?? []
    if (key === 'symbols' || key === 'addresses') {
      value[key] = items.flatMap(v => v.split(',')).map(v => v.trim()).filter(Boolean)
    } else if (numericKeys.has(key)) {
      value[key] = Number(items[0])
    } else if (booleanKeys.has(key)) {
      value[key] = items[0] === 'true' || items[0] === '1'
    } else {
      value[key] = items[0]
    }
  }
  return value
}

export function operationHandler(env: Env, operationId: string) {
  return async (c: Context) => {
    const raw = c.req.method === 'GET' ? query(c) : await c.req.json().catch(() => ({}))
    const input = parseRequest(operationId, raw)
    const result = await executeOperation(env, operationId, input)
    const settlementId = c.res.headers.get('Payment-Response') ?? c.res.headers.get('PAYMENT-RESPONSE') ?? 'settled-by-facilitator'
    return c.json({ success:true, operationId, requestId:c.get('requestId'), data:result.data, meta:result.meta, payment:{ network: env.X402_NETWORK, asset:'USDC', settlementId } })
  }
}
