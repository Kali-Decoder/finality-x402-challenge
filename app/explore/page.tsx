'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Activity, DollarSign, Link2, Plus, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchCatalog, fetchHealth, metaFor, type CatalogEndpoint } from '@/lib/dashboard/catalog'
import { loadTransactions, spendTotal, type DashboardTx } from '@/lib/dashboard/history'

export default function OverviewPage() {
  const [catalog, setCatalog] = useState<CatalogEndpoint[]>([])
  const [health, setHealth] = useState<Record<string, unknown> | null>(null)
  const [txs, setTxs] = useState<DashboardTx[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const refreshTx = () => setTxs(loadTransactions())
    refreshTx()
    window.addEventListener('finality:tx', refreshTx)
    window.addEventListener('storage', refreshTx)
    return () => {
      window.removeEventListener('finality:tx', refreshTx)
      window.removeEventListener('storage', refreshTx)
    }
  }, [])

  useEffect(() => {
    let live = true
    ;(async () => {
      setLoading(true)
      try {
        const [c, h] = await Promise.all([fetchCatalog(), fetchHealth().catch(() => null)])
        if (!live) return
        setCatalog(c)
        setHealth(h)
        setError('')
      } catch (e: any) {
        if (live) setError(e.message || 'Merchant unavailable')
      } finally {
        if (live) setLoading(false)
      }
    })()
    return () => {
      live = false
    }
  }, [])

  const spent = useMemo(() => spendTotal(txs), [txs])
  const categories = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of catalog) {
      const cat = metaFor(item.operationId).category
      map.set(cat, (map.get(cat) || 0) + 1)
    }
    return [...map.entries()]
  }, [catalog])

  const recent = txs.slice(0, 5)
  const status = String((health as any)?.status || (error ? 'offline' : loading ? '…' : 'ok'))

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Overview</h1>
          <p className="text-sm text-muted-foreground mt-2">Manage paid API calls and track USDC spend on Algorand.</p>
        </div>
        <Button asChild>
          <Link href="/explore/run">
            <Plus className="h-4 w-4" />
            RUN_ENDPOINT
          </Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="TOTAL SPEND"
          value={`$${spent.toFixed(2)}`}
          hint="Local session settlements"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          label="ENDPOINTS"
          value={loading ? '…' : String(catalog.length)}
          hint={`${categories.length} categories live`}
          icon={<Link2 className="h-4 w-4" />}
        />
        <StatCard
          label="MERCHANT"
          value={status.toUpperCase()}
          hint="GoPlausible x402 facilitator"
          icon={<Server className="h-4 w-4" />}
        />
      </div>

      {error && (
        <div className="border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Recent_Activity</div>
        {recent.length === 0 ? (
          <div className="border border-dashed border-border p-10 grid place-items-center text-center">
            <Activity className="h-8 w-8 text-muted-foreground mb-3" />
            <div className="font-bold uppercase tracking-wide">NO_RUNS_FOUND</div>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Get started by running a paid market intelligence endpoint.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/explore/run">RUN_ENDPOINT</Link>
            </Button>
          </div>
        ) : (
          <div className="border border-border divide-y divide-border">
            {recent.map((tx) => (
              <div key={tx.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <div className="font-semibold">{tx.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {tx.method} · {tx.operationId}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${tx.price} USDC</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{tx.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string
  hint: string
  icon: React.ReactNode
}) {
  return (
    <div className="border border-border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="text-3xl font-bold tracking-tight mt-4">{value}</div>
      <div className="text-xs text-muted-foreground mt-2">{hint}</div>
    </div>
  )
}
