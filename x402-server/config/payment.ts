import type { Env } from './env'

// GoPlausible advertises the full Algorand genesis hash. The shortened
// @x402/avm constant is not accepted by the hosted facilitator as of v2.26.
export const ALGORAND_MAINNET_CAIP2 =
  'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=' as const
export const ALGORAND_TESTNET_CAIP2 =
  'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=' as const

/** Circle USDC on Algorand Mainnet. */
export const MAINNET_USDC_ASA_ID = 31566704
/** USDC on Algorand Testnet (kept for local/test helpers). */
export const TESTNET_USDC_ASA_ID = 10458941

/** Challenge attribution for GoPlausible x402 Global Challenge enrollment. */
export const X402_GLOBAL_CHALLENGE_TAG = 'x402-global-challenge'

export function caip2ForNetwork(network: string): typeof ALGORAND_MAINNET_CAIP2 | typeof ALGORAND_TESTNET_CAIP2 {
  if (network === 'algorand-testnet' || network.includes('SGO1GKSzyE7IEPItTxCByw9x8FmnrCDex')) {
    return ALGORAND_TESTNET_CAIP2
  }
  return ALGORAND_MAINNET_CAIP2
}

export const paymentAsset = (env: Env) => ({
  asset: env.X402_USDC_ASA_ID,
  // GoPlausible reads the challenge attribution tag from the payment
  // option's `extra` object. Route-level resource tags are catalog metadata,
  // but do not enroll a settlement in the x402 Global Challenge.
  tag: X402_GLOBAL_CHALLENGE_TAG,
})
