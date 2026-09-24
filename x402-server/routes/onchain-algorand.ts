import type { Hono } from 'hono'; import type { Env } from '../config/env'; import { registerDomain } from './register'
export const registerAlgorandRoutes=(app:Hono,env:Env)=>registerDomain(app,env,'onchain.')
