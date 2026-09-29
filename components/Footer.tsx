import Image from 'next/image'
import Link from 'next/link'
import { GOPLAUSIBLE } from '@/lib/goplausible'

const PRODUCT = [
  { href: '/explore', label: 'Dashboard' },
  { href: '/explore/run', label: 'Run endpoint' },
  { href: '/explore/endpoints', label: 'Endpoints' },
  { href: '/explore/transactions', label: 'Transactions' },
] as const

const RESOURCES = [
  { href: GOPLAUSIBLE.merchant, label: 'Merchant page' },
  { href: GOPLAUSIBLE.leaderboard, label: 'Leaderboard' },
  { href: GOPLAUSIBLE.facilitator, label: 'Facilitator' },
  { href: GOPLAUSIBLE.discovery, label: 'Discovery guide' },
] as const

const CATEGORIES = ['Market data', 'Intelligence', 'Agent tools', 'AI analyst', 'Algorand'] as const

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto relative z-10 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-14 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 font-bold tracking-tight text-lg">
              <Image src="/logo.webp" alt="" width={28} height={28} className="w-7 h-7" />
              <span>FINALITY</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Algorand data and analysis at your agent’s fingertips via x402. No paid subscriptions, settle per request
              in Mainnet USDC.
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Network · {GOPLAUSIBLE.network}
            </p>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-4">Product</h3>
            <ul className="space-y-2.5">
              {PRODUCT.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-4">Resources</h3>
            <ul className="space-y-2.5">
              {RESOURCES.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-4">Catalog</h3>
            <ul className="space-y-2.5">
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link
                    href="/explore/endpoints"
                    className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            © {new Date().getFullYear()} Finality · Algorand Mainnet USDC
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            ASA {GOPLAUSIBLE.usdcAsaId} · x402 exact AVM
          </p>
        </div>
      </div>
    </footer>
  )
}
