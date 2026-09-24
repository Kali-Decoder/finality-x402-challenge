'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { fetchCatalog, metaFor, CATEGORY_ORDER, type CatalogEndpoint } from '@/lib/dashboard/catalog'

export default function EndpointsPage() {
  const [catalog, setCatalog] = useState<CatalogEndpoint[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const data = await fetchCatalog()
        if (live) setCatalog(data)
      } catch (e: any) {
        if (live) setError(e.message || 'Failed to load catalog')
      } finally {
        if (live) setLoading(false)
      }
    })()
    return () => {
      live = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter((item) => {
      const m = metaFor(item.operationId)
      return `${m.title} ${m.category} ${item.operationId} ${item.path} ${item.description}`.toLowerCase().includes(q)
    })
  }, [catalog, query])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Endpoints</h1>
          <p className="text-sm text-muted-foreground mt-2">Manage your active paid API resources from the merchant catalog.</p>
        </div>
        <Button asChild>
          <Link href="/explore/run">
            <Plus className="h-4 w-4" />
            RUN_ENDPOINT
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter endpoints."
          className="pl-9 h-10 rounded-none"
        />
      </div>

      {error && <div className="border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[860px]">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Src</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Mode</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                  Loading catalog…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                  No endpoints found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const m = metaFor(item.operationId)
                return (
                  <tr key={item.operationId} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{m.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 mono">{item.operationId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase">
                        Live
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-semibold">{item.method}</span>
                      <div className="text-muted-foreground mt-0.5 truncate max-w-[160px]">{item.path}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold">${item.price}</td>
                    <td className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                      {item.availabilityTrack || 'paid'}
                    </td>
                    <td className="px-4 py-3 text-xs">{m.category}</td>
                    <td className="px-4 py-3">
                      <Button asChild variant="outline" size="sm" className="rounded-none h-8 text-[10px] uppercase">
                        <Link href={`/explore/run?op=${encodeURIComponent(item.operationId)}`}>Run</Link>
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        {CATEGORY_ORDER.map((cat) => (
          <span key={cat} className="border border-border px-2 py-1">
            {cat}
          </span>
        ))}
      </div>
    </div>
  )
}
