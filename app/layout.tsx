import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClientRoot } from '@/components/ClientRoot'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const SITE = 'https://finality.accuracy.wtf'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Finality — Pay-per-request APIs',
  description:
    'Pro market, AI, and Algorand on-chain APIs for people and agents — pay USDC per request via x402. No monthly plans, no API keys.',
  icons: { icon: `${SITE}/logo.webp`, apple: `${SITE}/logo.webp` },
  openGraph: {
    siteName: 'Finality',
    title: 'Finality — Pay-per-request APIs',
    description:
      'Skip monthly Pro subscriptions. Call market, intelligence, AI, and on-chain APIs one request at a time with Mainnet USDC via x402.',
    type: 'website',
    url: SITE,
    images: [{ url: `${SITE}/og.png`, width: 1280, height: 720, alt: 'Finality pay-per-request APIs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Finality — Pay-per-request APIs',
    description:
      'Single-request pricing for pro market, AI, and on-chain APIs. Built for humans and agents on Algorand x402.',
    images: [`${SITE}/og.png`],
  },
  keywords: [
    'Finality',
    'pay per request',
    'API',
    'Market Intelligence',
    'x402',
    'x402-global-challenge',
    'Algorand',
    'Autonomous Agents',
    'USDC',
    'no subscription',
    'GoPlausible',
    'Bazaar',
  ],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  )
}
