'use client'
import { x402Client } from '@x402/core/client'
import { wrapFetchWithPayment } from '@x402/fetch'
import { ExactAvmScheme } from '@x402/avm/exact/client'
import type { ClientAvmSigner } from '@x402/avm'

export type PaymentState = 'idle' | 'requesting' | 'signing' | 'settling' | 'settled' | 'rejected' | 'degraded'
export const merchantUrl = '/api/x402'
/** GoPlausible Mainnet CAIP-2 (full genesis hash). */
const ALGORAND_MAINNET_CAIP2 = 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=' as const

/** Must cover highest catalog price (ai.chat $4.00). @x402 default is $1. */
const MAX_AMOUNT_PER_PAYMENT = '$5'

export function createPaidFetch(signer: ClientAvmSigner, onState?: (state: PaymentState) => void) {
  const client = x402Client.fromConfig({
    schemes: [{ network: ALGORAND_MAINNET_CAIP2, client: new ExactAvmScheme(signer) }],
    spendControls: { maxAmountPerPayment: MAX_AMOUNT_PER_PAYMENT },
  })
  client.onBeforePaymentCreation(async () => {
    onState?.('signing')
  })
  client.onAfterPaymentCreation(async () => {
    onState?.('settling')
  })
  client.onPaymentResponse(async () => {
    onState?.('settled')
  })
  return wrapFetchWithPayment(globalThis.fetch, client)
}

export async function callPaidResource(
  signer: ClientAvmSigner,
  path: string,
  init: RequestInit,
  onState?: (state: PaymentState) => void,
) {
  onState?.('requesting')
  try {
    const response = await createPaidFetch(signer, onState)(`${merchantUrl}${path}`, init)
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error?.message || `Request failed with HTTP ${response.status}`)
    if (body?.meta?.synthetic) onState?.('degraded')
    else onState?.('settled')
    return { body, receipt: response.headers.get('Payment-Response') || response.headers.get('PAYMENT-RESPONSE') }
  } catch (error) {
    onState?.('rejected')
    throw error
  }
}
