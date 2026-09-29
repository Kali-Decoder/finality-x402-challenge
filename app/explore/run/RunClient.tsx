'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Play, Shield, Wallet } from 'lucide-react'
import { useWallet } from '@txnlab/use-wallet-react'
import type { ClientAvmSigner } from '@x402/avm'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { callPaidResource, merchantUrl, type PaymentState } from '@/lib/x402/client'
import { fetchCatalog, metaFor, isProEndpoint, type CatalogEndpoint } from '@/lib/dashboard/catalog'
import { saveTransaction } from '@/lib/dashboard/history'
import ResultPresentation, { sampleResultFor, type ResultEnvelope } from '@/components/ResultPresentation'
import { cn } from '@/lib/utils'
import { GOPLAUSIBLE } from '@/lib/goplausible'

export default function RunClient() {
  const searchParams = useSearchParams()
  const opParam = searchParams.get('op')
  const { activeAccount, signTransactions } = useWallet()

  const [catalog, setCatalog] = useState<CatalogEndpoint[]>([])
  const [selected, setSelected] = useState('market.quotes')
  const [input, setInput] = useState('{}')
  const [result, setResult] = useState<ResultEnvelope | null>(null)
  const [receipt, setReceipt] = useState<string | null>(null)
  const [state, setState] = useState<PaymentState>('idle')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showExample, setShowExample] = useState(false)

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const data = await fetchCatalog()
        if (!live) return
        setCatalog(data)
        const initial =
          opParam && data.some((d) => d.operationId === opParam)
            ? opParam
            : data[0]?.operationId || 'market.quotes'
        setSelected(initial)
      } catch (e: any) {
        if (live) setError(e.message || 'Catalog unavailable')
      } finally {
        if (live) setLoading(false)
      }
    })()
    return () => {
      live = false
    }
  }, [opParam])

  const endpoint = useMemo(() => catalog.find((v) => v.operationId === selected), [catalog, selected])
  const meta = endpoint ? metaFor(endpoint.operationId) : null
  const example = useMemo(() => (endpoint ? sampleResultFor(endpoint.operationId) : null), [endpoint])

  useEffect(() => {
    if (endpoint) {
      setInput(JSON.stringify(endpoint.requestExample ?? {}, null, 2))
      setResult(null)
      setReceipt(null)
      setError('')
      setShowExample(false)
      setState('idle')
    }
  }, [endpoint])

  const busy = ['signing', 'settling', 'requesting'].includes(state)
  const runLabel =
    state === 'requesting'
      ? 'REQUESTING…'
      : state === 'signing'
        ? 'APPROVE…'
        : state === 'settling'
          ? 'SETTLING…'
          : 'PAY NOW'

  const invoke = useCallback(async () => {
    if (!activeAccount) {
      setError('Connect a Mainnet wallet first.')
      return
    }
    if (!endpoint) return
    setError('')
    setResult(null)
    setReceipt(null)
    setShowExample(false)
    try {
      const signer: ClientAvmSigner = {
        address: activeAccount.address,
        signTransactions: (txns, indexes) => signTransactions(txns, indexes),
      }
      const parsed = JSON.parse(input)
      let path = endpoint.path
      let init: RequestInit = { method: endpoint.method }
      if (endpoint.method === 'GET') {
        const qs = new URLSearchParams()
        for (const [k, v] of Object.entries(parsed)) {
          if (Array.isArray(v)) v.forEach((x) => qs.append(k, String(x)))
          else qs.set(k, String(v))
        }
        path += `?${qs}`
      } else {
        init = { ...init, headers: { 'content-type': 'application/json' }, body: JSON.stringify(parsed) }
      }
      const response = await callPaidResource(signer, path, init, setState)
      setResult(response.body)
      setReceipt(response.receipt)
      saveTransaction({
        id: `${Date.now()}`,
        at: new Date().toISOString(),
        operationId: endpoint.operationId,
        title: meta?.title || endpoint.operationId,
        method: endpoint.method,
        path: endpoint.path,
        price: endpoint.price,
        status: response.body?.meta?.synthetic && !isProEndpoint(endpoint.operationId) ? 'degraded' : 'settled',
        wallet: activeAccount.address,
        receipt: response.receipt,
      })
    } catch (e: any) {
      const message = e.message || 'Payment request failed'
      setError(message)
      if (endpoint) {
        saveTransaction({
          id: `${Date.now()}`,
          at: new Date().toISOString(),
          operationId: endpoint.operationId,
          title: meta?.title || endpoint.operationId,
          method: endpoint.method,
          path: endpoint.path,
          price: endpoint.price,
          status: 'rejected',
          wallet: activeAccount?.address,
          error: message,
        })
      }
    }
  }, [activeAccount, endpoint, input, meta, signTransactions])

  return (
    <div className="space-y-6">
      <div>
        <Link href="/explore" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3.5 w-3.5" />
          ./dashboard
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Run_Endpoint</h1>
        <p className="text-sm text-muted-foreground mt-2">Configure a paid request and settle USDC via x402.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="space-y-5">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Configuration</div>
            <p className="text-sm text-muted-foreground mt-1">Customize your API call settings.</p>
          </div>

          <Field label="Endpoint">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={loading || catalog.length === 0}
              className="w-full h-10 border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
            >
              {catalog.map((item) => {
                const m = metaFor(item.operationId)
                return (
                  <option key={item.operationId} value={item.operationId}>
                    {m.title} · ${item.price}
                  </option>
                )
              })}
            </select>
          </Field>

          {endpoint && (
            <>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="border border-border p-3">
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Method</div>
                  <div className="mt-1 font-bold">{endpoint.method}</div>
                </div>
                <div className="border border-border p-3">
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Price</div>
                  <div className="mt-1 font-bold">${endpoint.price} USDC</div>
                </div>
              </div>

              <Field label={endpoint.method === 'GET' ? 'Query (JSON)' : 'Body (JSON)'}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  spellCheck={false}
                  className="w-full h-48 border border-border bg-background p-3 font-mono text-xs outline-none focus:border-foreground"
                />
              </Field>

              <div className="border border-border p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">Wallet payment</div>
                  <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase">
                    {activeAccount ? 'Ready' : 'Required'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Unpaid calls return HTTP 402. Your wallet signs the exact USDC amount; GoPlausible settles on Mainnet.
                </p>
                <div className="text-xs break-all mono text-muted-foreground">
                  {activeAccount?.address || 'Not connected'}
                </div>
              </div>
            </>
          )}

          {error && <div className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
        </section>

        <section className="space-y-4">
          <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Live_Preview</div>
          <div className="border border-border bg-background p-5 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Payment_Gateway
              </div>
              <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase gap-1">
                <Shield className="h-3 w-3" />
                Secure
              </Badge>
            </div>

            <div className="text-center py-4">
              <div className="text-xl font-bold">{meta?.title || 'Select endpoint'}</div>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                {endpoint?.description || 'Choose an endpoint to preview the paid request.'}
              </p>
              <div className="mt-6 text-4xl font-bold tracking-tight mono">
                ${endpoint?.price || '0.00'} <span className="text-lg text-muted-foreground">USDC</span>
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                ASA {GOPLAUSIBLE.usdcAsaId} · Algorand Mainnet
              </div>
            </div>

            <div className="flex items-center justify-center">
              <select className="h-9 border border-border bg-muted/20 px-3 text-sm mono" disabled value="USDC">
                <option>USDC</option>
              </select>
            </div>

            <Button
              className="w-full h-12 rounded-none text-sm uppercase tracking-wider"
              onClick={invoke}
              disabled={!endpoint || busy || loading}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              {runLabel}
            </Button>

            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className={cn(state === 'rejected' && 'text-destructive', state === 'settled' && 'text-foreground')}>
                State · {state}
              </span>
              <button
                type="button"
                className="hover:text-foreground underline underline-offset-2"
                onClick={() => setShowExample((v) => !v)}
              >
                {showExample ? 'Hide example' : 'Show example'}
              </button>
            </div>
          </div>

          {(result || (showExample && example)) && (
            <div className="border border-border p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-3">
                {result ? 'Result' : 'Example response'}
              </div>
              <ResultPresentation
                result={(result || example)!}
                receipt={result ? receipt : null}
                title={result ? 'Result' : 'Example'}
              />
            </div>
          )}

          {!result && !showExample && (
            <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              <Play className="h-6 w-6 mx-auto mb-2 opacity-50" />
              Press PAY NOW to settle and fetch a live response.
            </div>
          )}

          {endpoint && (
            <div className="text-[11px] text-muted-foreground mono break-all">
              {merchantUrl}
              {endpoint.path}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
