'use client'

import { useMemo } from 'react'
import { WalletManager, NetworkId } from '@txnlab/use-wallet'
import { WalletProvider } from '@txnlab/use-wallet-react'
import { pera } from '@txnlab/use-wallet-pera'
import { defly } from '@txnlab/use-wallet-defly'
import { lute } from '@txnlab/use-wallet-lute'

export default function Providers({ children }: { children: React.ReactNode }) {
  const manager = useMemo(() => new WalletManager({ wallets: [pera(),defly(),lute({siteName:'Finality'})], defaultNetwork: NetworkId.MAINNET, options: { persistNetwork: true } }), [])
  return <WalletProvider manager={manager}>{children}</WalletProvider>
}
