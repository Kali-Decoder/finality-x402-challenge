'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import DottedMap from '@/components/ui/dotted-map'
import ProductFlowAnimation from '@/components/ProductFlowAnimation'
import { GOPLAUSIBLE } from '@/lib/goplausible'

const STEPS = [
  { num: '01', title: 'Connect wallet', desc: 'Pera, Defly, or Lute on Algorand Mainnet. No signup, no API key.' },
  { num: '02', title: 'Pick an API', desc: 'Market data, intelligence, AI, agents, and Algorand on-chain routes.' },
  { num: '03', title: 'Pay one request', desc: 'Unpaid calls return HTTP 402. Sign the exact USDC price for that call.' },
  { num: '04', title: 'Get the result', desc: 'Live JSON back immediately, with an on-chain settlement receipt.' },
]

const CATALOG = [
  { name: 'Market data', count: '7', detail: 'Quotes, candles, trending, categories, token prices, fear & greed.' },
  { name: 'Intelligence', count: '6', detail: 'Signals, technicals, reports, volume, events, and backtests on top of live feeds.' },
  { name: 'AI & agents', count: '4', detail: 'Chat, decisions, briefings, and strategy parse: analysis your agent can call once.' },
  { name: 'Algorand', count: '22', detail: 'Accounts, assets, apps, boxes, blocks, and mempool: chain data at your agent’s fingertips.' },
]

const REASONS = [
  {
    title: 'No paid data subscriptions',
    desc: 'Skip monthly seats for chain data and pro market APIs. Your agent pays only for the call it makes.',
  },
  {
    title: 'Analysis on top of the data',
    desc: 'Finality does not stop at raw reads. Intelligence, AI, and agent endpoints turn that data into usable signals.',
  },
  {
    title: 'x402 for people and agents',
    desc: 'Same HTTP catalog for a human in the dashboard or an autonomous agent. HTTP 402 → USDC → live result.',
  },
]

export default function Page() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero: one composition, brand, headline, line, CTAs, full-bleed map */}
      <section className="relative min-h-[calc(100svh-4.5rem)] flex items-end overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,oklch(0.92_0.02_220)_0%,transparent_55%),linear-gradient(180deg,oklch(0.98_0.005_220)_0%,var(--background)_70%)]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.55]">
          <DottedMap className="h-full w-full scale-110 origin-center" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20"
        />

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-20 pb-16 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground mb-6">Finality</p>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9]">
              Pay for the call.
              <br />
              Not the plan.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed font-light">
              Put Algorand data at your agent’s fingertips with x402. No paid subscriptions required. Finality adds
              market intelligence and analysis on top of that data, priced per request in Mainnet USDC.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mt-10 flex flex-col sm:flex-row gap-3"
            >
              <Link
                href="/explore"
                className="h-12 px-8 bg-foreground text-background font-medium inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/explore/endpoints"
                className="h-12 px-8 border border-border inline-flex items-center justify-center font-mono text-sm uppercase tracking-wider hover:bg-muted/40 transition-colors"
              >
                Browse endpoints
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Justification */}
      <section className="py-20 md:py-28 px-6 md:px-10 border-b border-border">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-start">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              Chain data for your agent.
              <br />
              Analysis built in.
            </h2>
            <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-xl">
              Most teams buy expensive subscriptions just to read Algorand state or run market tools. Finality gives your
              agent that data over x402. Pay only when it needs a call. Then it layers analysis on the same catalog so
              endpoints return signals, reports, and decisions, not just raw JSON dumps.
            </p>
          </div>
          <div className="space-y-6 border-l border-border pl-6 md:pl-8">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="block font-semibold text-foreground mb-1">Algorand at the edge</span>
              Accounts, assets, apps, boxes, blocks, and mempool: live Mainnet reads your agent can request on demand.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="block font-semibold text-foreground mb-1">No subscription wall</span>
              No API keys, no monthly Pro seat. x402 settles the exact USDC price for that single request.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="block font-semibold text-foreground mb-1">Analysis on the endpoints</span>
              Intelligence and AI routes sit on top of the data layer so agents get usable analysis in one paid call.
            </p>
          </div>
        </div>
      </section>

      <ProductFlowAnimation />

      {/* Why */}
      <section className="py-24 md:py-32 px-6 md:px-10 border-b border-border">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-2xl mb-14 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Why Finality</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              Built so autonomous agents, and the people who run them, can reach Algorand data and pro analysis
              without buying a subscription first.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-x-10 gap-y-12">
            {REASONS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="border-t border-foreground/20 pt-6"
              >
                <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="py-24 md:py-32 px-6 md:px-10 border-b border-border">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-16">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">What you can call</h2>
              <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
                Thirty-nine live endpoints. Each posts an exact USDC price and returns live JSON.
              </p>
            </div>
            <Link
              href="/explore/endpoints"
              className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              View catalog
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <ul className="divide-y divide-border border-y border-border">
            {CATALOG.map((item, i) => (
              <motion.li
                key={item.name}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="grid grid-cols-[4rem_1fr] md:grid-cols-[5rem_12rem_1fr] gap-4 md:gap-8 py-6 md:py-8 items-baseline"
              >
                <span className="font-mono text-sm text-muted-foreground tabular-nums">{item.count}</span>
                <span className="font-semibold text-lg">{item.name}</span>
                <span className="col-span-2 md:col-span-1 text-sm text-muted-foreground leading-relaxed">
                  {item.detail}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 md:py-32 px-6 md:px-10 border-b border-border">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-2xl mb-14 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">How a request works</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              One wallet signature. One USDC payment. One API response. Repeat only when you need another call.
            </p>
          </div>

          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {STEPS.map((step, i) => (
              <motion.li
                key={step.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                className="relative"
              >
                <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground">{step.num}</span>
                <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="hidden lg:block absolute top-2 -right-3 w-6 border-t border-border"
                  />
                )}
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* Rail strip */}
      <section className="py-16 md:py-20 px-6 md:px-10 border-b border-border bg-muted/30">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
          {[
            ['Network', 'Algorand Mainnet'],
            ['Asset', `USDC ${GOPLAUSIBLE.usdcAsaId}`],
            ['Protocol', 'x402'],
            ['Facilitator', 'GoPlausible'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
              <div className="mt-2 text-sm md:text-base font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative py-28 md:py-36 px-6 md:px-10 overflow-hidden bg-foreground text-background">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none hidden md:block">
          <Image src="/finality.webp" alt="" width={420} height={420} className="w-[28rem] h-auto" />
        </div>
        <div className="relative max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="max-w-2xl"
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[0.95]">
              Skip the monthly seat.
              <br />
              Run the request.
            </h2>
            <p className="mt-6 text-lg text-background/65 max-w-lg font-light leading-relaxed">
              Give your agent Algorand data and analysis over x402. Pay per call, skip the subscription.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/explore"
                className="h-12 px-8 bg-background text-foreground font-medium inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={GOPLAUSIBLE.merchant}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-8 border border-background/30 inline-flex items-center justify-center font-mono text-sm uppercase tracking-wider hover:bg-background/10 transition-colors"
              >
                Merchant page
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
