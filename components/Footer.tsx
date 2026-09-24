import Link from 'next/link'
import { GOPLAUSIBLE } from '@/lib/goplausible'

export function Footer() {
  return (
    <footer className="border-t border-border py-12 mt-auto relative z-10 bg-background">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-6 md:px-10">
        <div className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
          © {new Date().getFullYear()} Finality · Algorand Mainnet USDC
        </div>
        <div className="flex gap-6 text-sm font-mono uppercase tracking-wider">
          <Link href="/explore" className="hover:text-foreground text-muted-foreground transition-colors">
            Dashboard
          </Link>
          <a
            href={GOPLAUSIBLE.facilitator}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground text-muted-foreground transition-colors"
          >
            Facilitator
          </a>
          <a
            href={GOPLAUSIBLE.leaderboard}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground text-muted-foreground transition-colors"
          >
            Leaderboard
          </a>
        </div>
      </div>
    </footer>
  )
}
