import { Hono } from 'hono'
import type { Env } from './config/env'
import { cors } from './config/cors'
import { requestContext } from './middleware/request-context'
import { errorHandler } from './middleware/errors'
import { limits } from './middleware/limits'
import { createPaymentMiddleware } from './middleware/x402'
import { registerPublicRoutes } from './routes/public'
import { registerTestRoutes } from './routes/test'
import { registerMarketRoutes } from './routes/market'
import { registerIntelligenceRoutes } from './routes/intelligence'
import { registerAgentRoutes } from './routes/agents'
import { registerAiRoutes } from './routes/ai'
import { registerAlgorandRoutes } from './routes/onchain-algorand'

export function createApp(env: Env, options: { payments?: boolean } = {}) {
  const app = new Hono()
  app.use('*',cors(env))
  app.use('*',requestContext)
  app.use('*',limits)
  registerPublicRoutes(app,env)
  registerTestRoutes(app,env)
  if (options.payments !== false) app.use(createPaymentMiddleware(env))
  registerMarketRoutes(app,env)
  registerIntelligenceRoutes(app,env)
  registerAgentRoutes(app,env)
  registerAiRoutes(app,env)
  registerAlgorandRoutes(app,env)
  app.notFound(c => c.json({success:false,requestId:(c as any).get('requestId')||crypto.randomUUID(),error:{code:'not_found',message:'Endpoint not found'}},404))
  app.onError(errorHandler)
  return app
}
