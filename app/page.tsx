'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles, Wallet, Zap, Bot, Database, ShieldCheck, CheckCircle2, Receipt } from 'lucide-react'
import { motion } from 'framer-motion'
import DottedMap from '@/components/ui/dotted-map'
import { GOPLAUSIBLE } from '@/lib/goplausible'

const STEPS = [
  { num: '01', title: 'Connect Wallet', desc: 'Link Pera, Defly, or Lute on Algorand Mainnet — no signup, no API key.' },
  { num: '02', title: 'Pick an API', desc: 'Choose from 39 live endpoints: market data, intel, AI, agents, and Algorand on-chain.' },
  { num: '03', title: 'Pay One Request', desc: 'Unpaid calls return HTTP 402. You sign the exact USDC price for that call only.' },
  { num: '04', title: 'Get the Result', desc: 'Live JSON back immediately, with an on-chain settlement receipt from GoPlausible.' },
]

const FEATURES = [
  {
    title: 'Market Data',
    stat: '7',
    unit: 'APIs',
    desc: 'Quotes, candles, trending, categories, token prices, and fear & greed — priced per call.',
    icon: Database,
    className: 'md:col-span-2',
  },
  {
    title: 'Intelligence',
    stat: '6',
    unit: 'APIs',
    desc: 'Signals, technicals, reports, volume, events, and backtests without a monthly Pro seat.',
    icon: Zap,
    className: 'md:col-span-1',
  },
  {
    title: 'AI & Agents',
    stat: '4',
    unit: 'APIs',
    desc: 'Chat, decisions, briefings, and strategy parse — call model-grade tools one request at a time.',
    icon: Bot,
    className: 'md:col-span-1',
  },
]

const WHY = [
  {
    title: 'No monthly Pro plan',
    desc: 'Skip SaaS subscriptions built for high-volume teams. Buy the call you need, when you need it.',
  },
  {
    title: 'Single-request pricing',
    desc: 'Every endpoint posts an exact USDC price. Pay that amount once — nothing rolls over, nothing locks in.',
  },
  {
    title: 'Built for people and agents',
    desc: 'Humans use the dashboard. Agents hit the same HTTP APIs with x402. One rail for both.',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background">
      <section className="relative min-h-[calc(100vh-5rem)] flex items-center pt-16 pb-20 px-6 border-b border-border">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-16 items-center w-full">
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-border bg-muted/30 mb-8 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Pay-per-request APIs · x402 on Algorand
              </div>
              <h1 className="text-6xl md:text-8xl font-sans font-bold tracking-tighter leading-[0.9] mb-6">
                NO MONTHLY
                <br />
                PLAN.
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-lg leading-relaxed">
                Finality gives people and agents pro market, AI, and on-chain APIs as single paid requests — Mainnet
                USDC via x402. No accounts. No API keys. No subscription.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link
                href="/explore"
                className="h-12 px-8 bg-foreground text-background font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                CALL AN API
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={GOPLAUSIBLE.leaderboard}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-8 border border-border flex items-center justify-center hover:bg-muted/50 transition-colors font-mono text-sm"
              >
                VIEW_LEADERBOARD
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="relative min-h-[400px] flex items-center justify-center"
          >
            <div className="absolute -top-4 -left-4 w-24 h-24 border-t border-l border-foreground/20" />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b border-r border-foreground/20" />
            <DottedMap className="w-full h-full opacity-80" />
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6 border-b border-border">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl md:text-6xl font-sans font-bold tracking-tight mb-4">Why Finality</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Most pro and special APIs force a monthly plan before you can ship. We meter access per request so you
              only pay for what you actually call.
            </p>
            <div className="w-24 h-1 bg-foreground mt-4" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {WHY.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 border border-border bg-background"
              >
                <Receipt className="h-5 w-5 mb-6 text-foreground" />
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-8">
            <h2 className="text-4xl md:text-6xl font-sans font-bold tracking-tight mb-4">What you can call</h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              Thirty-nine live endpoints. Market, intelligence, AI/agent tools, plus 22 Algorand on-chain routes —
              each with a posted USDC price.
            </p>
            <div className="w-24 h-1 bg-foreground mt-4" />
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className={`group relative p-6 border border-border bg-background hover:bg-muted/5 transition-all duration-300 flex flex-col justify-between ${feature.className}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="inline-flex p-3 border border-border text-foreground group-hover:bg-foreground group-hover:text-background transition-all duration-300">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tighter">{feature.stat}</span>
                    <span className="text-xs font-mono text-muted-foreground uppercase">{feature.unit}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground leading-snug text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="group relative p-6 border border-border bg-background hover:bg-muted/5 transition-all duration-300 flex flex-col justify-between md:col-span-2"
            >
              <div className="flex justify-between items-start">
                <div className="inline-flex p-3 border border-border w-fit group-hover:bg-foreground group-hover:text-background transition-all">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tighter">22</span>
                  <span className="text-xs font-mono text-muted-foreground uppercase">On-chain</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Algorand On-chain</h3>
                <p className="text-muted-foreground text-sm leading-snug">
                  Indexer and algod routes for accounts, assets, apps, boxes, blocks, and mempool — settled by
                  GoPlausible on Mainnet. Keys never leave the wallet.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-32 px-6 border-t border-border">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="mb-16">
            <h2 className="text-4xl md:text-6xl font-sans font-bold tracking-tight mb-4">How a single request works</h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              One wallet signature. One USDC payment. One API response. Repeat only when you need another call.
            </p>
            <div className="w-24 h-1 bg-foreground mt-4" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -5 }}
                className="group relative p-8 border border-border bg-background hover:bg-muted/5 transition-all duration-300 flex flex-col justify-between min-h-[240px]"
              >
                <span className="text-5xl font-bold tracking-tighter text-foreground/10 group-hover:text-foreground/20 transition-colors">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 border-t border-border">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-bold mb-4">For builders and autonomous agents</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                If you need working APIs but not a monthly seat — Finality is the metering layer. Same catalog for a
                person in the dashboard or an agent following OpenAPI.
              </p>
              <div className="space-y-4">
                {[
                  'No signup wall — connect a wallet and pay the posted price',
                  'Discover operation IDs and USDC prices from /v1/catalog',
                  'HTTP 402 → signed Payment-Signature → live pro/special API result',
                  'On-chain receipts from GoPlausible on Algorand Mainnet',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 p-4 border border-border bg-muted/20">
                    <CheckCircle2 className="h-5 w-5 text-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-border p-8 bg-muted/10">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Payment rail
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Network', 'Algorand Mainnet'],
                  ['Asset', `USDC ${GOPLAUSIBLE.usdcAsaId}`],
                  ['Protocol', 'x402'],
                  ['Facilitator', 'GoPlausible'],
                  ['Billing', 'Per request'],
                  ['Catalog', '39 endpoints'],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 border border-border bg-background">
                    <div className="text-[10px] font-mono uppercase text-muted-foreground">{k}</div>
                    <div className="text-sm font-medium mt-1">{v}</div>
                  </div>
                ))}
              </div>
              <div className="pt-6 mt-6 border-t border-border">
                <Link href="/explore" className="text-sm font-mono underline underline-offset-4 hover:opacity-70">
                  OPEN_API_DASHBOARD
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 border-t border-border bg-foreground text-background">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">PAY FOR THE CALL.</h2>
          <p className="text-lg md:text-xl text-background/70 mb-16 max-w-2xl mx-auto font-light">
            Skip the monthly Pro plan. Run the request you need — market, AI, or on-chain — and settle in USDC.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 text-xl font-medium border-b-2 border-background hover:opacity-70 transition-opacity"
            >
              Open Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href={GOPLAUSIBLE.merchant}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xl font-medium border-b-2 border-background hover:opacity-70 transition-opacity"
            >
              Merchant Page <Zap className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
