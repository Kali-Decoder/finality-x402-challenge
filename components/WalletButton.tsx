'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GOPLAUSIBLE } from '@/lib/goplausible'

const USDC_ID = BigInt(GOPLAUSIBLE.usdcAsaId)
const ALGOD_SERVER = 'https://mainnet-api.4160.nodely.dev'

export default function WalletButton() {
  const { wallets, activeAccount, activeWallet } = useWallet()
  const [open, setOpen] = useState(false)
  const [balance, setBalance] = useState<{ algo: number; usdc: number; opted: boolean } | null>(null)

  useEffect(() => {
    if (!activeAccount) {
      setBalance(null)
      return
    }
    let live = true
    ;(async () => {
      try {
        const algorand = AlgorandClient.fromConfig({
          algodConfig: { server: ALGOD_SERVER, port: '', token: '' },
        })
        const info = await algorand.client.algod.accountInformation(activeAccount.address).do()
        const holding = info.assets?.find((a) => BigInt(a.assetId) === USDC_ID)
        if (live) {
          setBalance({
            algo: Number(info.amount) / 1e6,
            usdc: Number(holding?.amount ?? 0) / 1e6,
            opted: Boolean(holding),
          })
        }
      } catch {
        if (live) setBalance(null)
      }
    })()
    return () => {
      live = false
    }
  }, [activeAccount])

  if (activeAccount) {
    return (
      <div className="relative flex items-center gap-3">
        <div className="hidden md:block text-right">
          <div className="text-xs font-semibold mono">
            {activeAccount.address.slice(0, 6)}…{activeAccount.address.slice(-5)}
          </div>
          <div className="text-[10px] text-muted-foreground mono">
            {balance
              ? `${balance.algo.toFixed(2)} ALGO · ${balance.usdc.toFixed(2)} USDC`
              : 'Mainnet connected'}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => activeWallet?.disconnect()}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Connect wallet</Button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md border border-border bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between gap-4 mb-2">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Connect an Algorand wallet</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a non-custodial wallet. Finality can request signatures but never sees your keys.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-2 mt-5">
              {wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  className="flex items-center gap-3 border border-border bg-muted/20 hover:bg-muted/50 p-3 text-left transition-colors"
                  onClick={async () => {
                    await wallet.connect()
                    setOpen(false)
                  }}
                >
                  {wallet.metadata.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={wallet.metadata.icon} alt="" className="w-9 h-9" />
                  )}
                  <div>
                    <div className="font-semibold">{wallet.metadata.name}</div>
                    <div className="text-xs text-muted-foreground">Connect on Algorand Mainnet</div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-5 mono">
              You need Mainnet ALGO for fees and Mainnet USDC ASA {GOPLAUSIBLE.usdcAsaId} for paid
              requests.
            </p>
            <div className="mt-3">
              <Badge variant="outline" className="font-mono text-[10px] uppercase">
                x402 · GoPlausible
              </Badge>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
