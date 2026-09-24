'use client'

import { useEffect, useMemo, useState } from 'react'
import { Filter, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { loadTransactions, type DashboardTx } from '@/lib/dashboard/history'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'settled' | 'rejected' | 'degraded'

export default function TransactionsPage() {
  const [txs, setTxs] = useState<DashboardTx[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  useEffect(() => {
    const refresh = () => setTxs(loadTransactions())
    refresh()
    window.addEventListener('finality:tx', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('finality:tx', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return txs.filter((tx) => {
      if (status !== 'all' && tx.status !== status) return false
      if (!q) return true
      const hay = `${tx.title} ${tx.operationId} ${tx.path} ${tx.wallet || ''} ${tx.id} ${tx.receipt || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [txs, query, status])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-2">Monitor wallet-paid x402 settlements from this browser.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by wallet, hash, or ID."
            className="pl-9 h-10 rounded-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="h-10 appearance-none border border-border bg-background pl-9 pr-8 text-sm outline-none min-w-[160px]"
          >
            <option value="all">All Statuses</option>
            <option value="settled">Settled</option>
            <option value="degraded">Degraded</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">Status / Date</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Endpoint</th>
              <th className="px-4 py-3 font-medium">Wallet</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                  No transactions found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 align-top">
                    <div className={cn('text-[10px] uppercase tracking-wider font-semibold', statusTone(tx.status))}>
                      {tx.status}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(tx.at).toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3 align-top font-semibold">${tx.price} USDC</td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">{tx.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {tx.method} {tx.path}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-xs break-all max-w-[180px]">
                    {tx.wallet ? `${tx.wallet.slice(0, 8)}…${tx.wallet.slice(-6)}` : '—'}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {tx.receipt ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none h-8 text-[10px] uppercase"
                        onClick={() => navigator.clipboard.writeText(tx.receipt || '')}
                      >
                        Copy receipt
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function statusTone(status: DashboardTx['status']) {
  if (status === 'settled') return 'text-foreground'
  if (status === 'degraded') return 'text-muted-foreground'
  return 'text-destructive'
}
