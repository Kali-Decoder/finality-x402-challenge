'use client'

import Link from 'next/link'
import { useWallet } from '@txnlab/use-wallet-react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { clearTransactions } from '@/lib/dashboard/history'
import { GOPLAUSIBLE } from '@/lib/goplausible'
import { merchantUrl } from '@/lib/x402/client'

export default function SettingsPage() {
  const { activeAccount, activeWallet } = useWallet()

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Settings</h1>
        <p className="text-sm text-muted-foreground mt-2">Wallet, network, and merchant discovery links.</p>
      </div>

      <section className="border border-border p-5 space-y-4">
        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Wallet</div>
        <div className="text-sm break-all mono">{activeAccount?.address || 'Not connected'}</div>
        <div className="flex flex-wrap gap-2">
          {activeAccount ? (
            <Button variant="outline" className="rounded-none" onClick={() => activeWallet?.disconnect()}>
              Disconnect
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Use Connect wallet in the header.</p>
          )}
        </div>
      </section>

      <section className="border border-border p-5 space-y-4">
        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Network</div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <InfoRow label="Chain" value="Algorand Mainnet" />
          <InfoRow label="Asset" value={`USDC ASA ${GOPLAUSIBLE.usdcAsaId}`} />
          <InfoRow label="Protocol" value="x402 exact AVM" />
          <InfoRow label="Proxy" value={merchantUrl} />
        </div>
        <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase">
          Facilitator · GoPlausible
        </Badge>
      </section>

      <section className="border border-border p-5 space-y-3">
        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Discovery</div>
        {[
          ['Catalog', `${merchantUrl}/v1/catalog`],
          ['OpenAPI', `${merchantUrl}/v1/openapi.json`],
          ['Health', `${merchantUrl}/health`],
          ['Info', `${merchantUrl}/info`],
          ['Leaderboard', GOPLAUSIBLE.leaderboard],
          ['Merchant', GOPLAUSIBLE.merchant],
        ].map(([label, href]) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="flex items-center justify-between gap-3 border border-border px-3 py-2 text-sm hover:bg-muted/30"
          >
            <span className="uppercase text-[10px] tracking-wider text-muted-foreground">{label}</span>
            <span className="mono text-xs truncate flex items-center gap-2">
              {href}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </span>
          </a>
        ))}
      </section>

      <section className="border border-border p-5 space-y-3">
        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Local data</div>
        <p className="text-sm text-muted-foreground">Clear browser-stored transaction history from Run sessions.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-none" onClick={() => clearTransactions()}>
            Clear transactions
          </Button>
          <Button asChild variant="outline" className="rounded-none">
            <Link href="/explore/transactions">View transactions</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium break-all">{value}</div>
    </div>
  )
}
