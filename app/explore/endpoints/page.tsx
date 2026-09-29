'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { fetchCatalog, metaFor, isProEndpoint, CATEGORY_ORDER, type CatalogEndpoint } from '@/lib/dashboard/catalog'

type CategoryFilter = 'All' | (typeof CATEGORY_ORDER)[number]

const CATEGORY_TABS: CategoryFilter[] = ['All', ...CATEGORY_ORDER]

export default function EndpointsPage() {
  const [catalog, setCatalog] = useState<CatalogEndpoint[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('All')
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

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of catalog) {
      const cat = metaFor(item.operationId).category
      counts.set(cat, (counts.get(cat) || 0) + 1)
    }
    return counts
  }, [catalog])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalog.filter((item) => {
      const m = metaFor(item.operationId)
      if (category !== 'All' && m.category !== category) return false
      if (!q) return true
      return `${m.title} ${m.category} ${item.operationId} ${item.path} ${item.description}${isProEndpoint(item.operationId) ? ' pro-endpoints' : ''}`.toLowerCase().includes(q)
    })
  }, [catalog, query, category])

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

      <div className="space-y-4">
        <div
          role="tablist"
          aria-label="Endpoint categories"
          className="flex items-center gap-1 overflow-x-auto border-b border-border -mb-px"
        >
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab
            const count = tab === 'All' ? catalog.length : categoryCounts.get(tab) || 0
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(tab)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2.5 text-[10px] uppercase tracking-[0.14em] border-b-2 -mb-px transition-colors whitespace-nowrap',
                  active
                    ? 'border-foreground text-foreground font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <span>{tab}</span>
                <span className={cn('tabular-nums', active ? 'text-foreground' : 'text-muted-foreground/70')}>
                  {count}
                </span>
              </button>
            )
          })}
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
                const pro = isProEndpoint(item.operationId)
                return (
                  <tr key={item.operationId} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{m.title}</span>
                        {pro && (
                          <Badge className="rounded-none font-mono text-[10px] uppercase bg-sky-500/15 text-sky-700 dark:text-sky-400 hover:bg-sky-500/15 border-0">
                            pro-endpoints
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 mono">{item.operationId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase">
                        Live
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={cn(
                          'inline-block px-1.5 py-0.5 font-semibold tracking-wider',
                          item.method === 'GET'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
                        )}
                      >
                        {item.method}
                      </span>
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
    </div>
  )
}
