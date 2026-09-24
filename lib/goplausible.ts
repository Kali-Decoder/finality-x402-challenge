/** GoPlausible facilitator links for Finality (Mainnet x402-Global challenge). */
export const GOPLAUSIBLE = {
  facilitator: 'https://facilitator.goplausible.xyz',
  /** Mainnet challenge board (prize-eligible). Primary for production. */
  leaderboardMainnet:
    'https://facilitator.goplausible.xyz/dashboard/leaderboards?cat=merchants&env=mainnet&src=x402-global-challenge',
  /** Testnet challenge board (kept for reference / dual-env ops). */
  leaderboardTestnet:
    'https://facilitator.goplausible.xyz/dashboard/leaderboards?cat=merchants&env=testnet&src=x402-global-challenge',
  /** Default leaderboard link used in UI — Mainnet. */
  leaderboard:
    'https://facilitator.goplausible.xyz/dashboard/leaderboards?cat=merchants&env=mainnet&src=x402-global-challenge',
  /** Finality merchant page on the facilitator dashboard. */
  merchant: 'https://facilitator.goplausible.xyz/dashboard/merchants/e09b4d2b1b66163d',
  discovery: 'https://facilitator.goplausible.xyz/guide/discovery',
  /** Dedicated Mainnet merchant receiver (must be opted into USDC ASA 31566704). */
  payTo: 'UEET5PA753P26B6LVUSXUKUYDVM33YLE6ETZWPLJDHJXQDKNYOUZPFKCSU',
  usdcAsaId: 31566704,
  network: 'algorand-mainnet',
} as const
