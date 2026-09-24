# Finality Market Intelligence API

The merchant API is available to both autonomous agents and browser users. Production client: [https://finality.accuracy.wtf](https://finality.accuracy.wtf). Production merchant: [https://finality-x402-backend.onrender.com](https://finality-x402-backend.onrender.com). Locally, the API is at `http://localhost:4021`; Swagger UI is at `http://localhost:3000/docs`; and the non-custodial wallet tester is at `http://localhost:3000`.

## Public endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Service and dependency readiness |
| GET | `/info` | Network, payment asset, and service metadata |
| GET | `/v1/catalog` | Machine-readable paid-resource catalog |
| GET | `/v1/openapi.json` | OpenAPI 3.1 specification used by Swagger |

## Paid endpoints

All prices are denominated in Algorand Testnet USDC (ASA `10458941`). An unsigned request returns HTTP `402` with x402 payment requirements. A client signs those requirements and retries with `PAYMENT-SIGNATURE`; a successful response includes `PAYMENT-RESPONSE`.

| Operation ID | Method | Path | Price (USDC) | Purpose |
|---|---|---|---:|---|
| `market.quotes` | GET | `/v1/market/quotes?symbols=BTC` | $0.15 | Bounded spot quotes |
| `market.assets` | GET | `/v1/market/assets?query=BTC&limit=10` | $0.15 | Asset search and normalization |
| `market.candles` | POST | `/v1/market/candles` | $0.25 | OHLCV history |
| `market.trending` | GET | `/v1/market/trending?limit=10` | $0.20 | Ranked crypto assets |
| `market.categories` | GET | `/v1/market/categories` | $0.15 | Coin categories by 24h market-cap change |
| `market.tokenPrices` | GET | `/v1/market/token-prices` | $0.20 | ERC-20 / on-chain token USD prices |
| `market.fearGreed` | GET | `/v1/market/fear-greed?limit=1` | $0.10 | Fear and Greed index |
| `intelligence.signals` | POST | `/v1/signals` | $0.45 | Multi-market signals |
| `intelligence.technicals` | POST | `/v1/technicals` | $0.45 | Indicators and regime |
| `intelligence.report` | POST | `/v1/analysis/report` | $0.70 | Combined intelligence report |
| `intelligence.volume` | POST | `/v1/analysis/volume` | $0.25 | Volume participation analysis |
| `intelligence.events` | POST | `/v1/analysis/events` | $0.45 | Market event intelligence |
| `intelligence.backtest` | POST | `/v1/backtest` | $0.70 | Bounded strategy backtest |
| `agent.decision` | POST | `/v1/agent/decision` | $0.55 | Risk-aware decision |
| `agent.briefing` | POST | `/v1/agent/briefing` | $0.70 | Machine-readable briefing |
| `agent.strategyParse` | POST | `/v1/agent/strategy/parse` | $0.55 | Natural-language strategy parser |
| `ai.chat` | POST | `/v1/ai/chat` | $0.90 | Data-grounded analyst response |
| `onchain.algorandAccount` | POST | `/v1/onchain/algorand/account` | $0.25 | Algorand account intelligence (Indexer) |
| `onchain.algorandPortfolio` | POST | `/v1/onchain/algorand/portfolio` | $0.35 | ASA portfolio (Indexer) |
| `onchain.algorandAsset` | POST | `/v1/onchain/algorand/asset` | $0.20 | ASA metadata/intelligence (Indexer) |
| `onchain.algorandDefi` | POST | `/v1/onchain/algorand/defi` | $0.45 | Indexer-backed DeFi activity |
| `onchain.algodStatus` | GET | `/v1/onchain/algod/status` | $0.10 | Nodely algod node status |
| `onchain.algodSupply` | GET | `/v1/onchain/algod/supply` | $0.10 | Ledger ALGO supply |
| `onchain.algodParams` | GET | `/v1/onchain/algod/params` | $0.10 | Suggested transaction parameters |
| `onchain.algodAccount` | GET | `/v1/onchain/algod/account?address=` | $0.20 | Live algod account |
| `onchain.algodAccountAssets` | GET | `/v1/onchain/algod/account/assets?address=` | $0.25 | Paginated account ASAs |
| `onchain.algodAccountAsset` | GET | `/v1/onchain/algod/account/asset?address=&assetId=` | $0.20 | One account ASA holding |
| `onchain.algodAccountApps` | GET | `/v1/onchain/algod/account/applications?address=` | $0.25 | Paginated account apps |
| `onchain.algodAccountApp` | GET | `/v1/onchain/algod/account/application?address=&applicationId=` | $0.20 | One account application |
| `onchain.algodPendingByAddress` | GET | `/v1/onchain/algod/account/pending?address=` | $0.25 | Address mempool |
| `onchain.algodAsset` | GET | `/v1/onchain/algod/asset?assetId=` | $0.20 | Live algod ASA params |
| `onchain.algodApplication` | GET | `/v1/onchain/algod/application?applicationId=` | $0.25 | Application global state |
| `onchain.algodApplicationBoxes` | GET | `/v1/onchain/algod/application/boxes?applicationId=` | $0.35 | Application box names |
| `onchain.algodApplicationBox` | GET | `/v1/onchain/algod/application/box?applicationId=&name=` | $0.20 | One box value |
| `onchain.algodBlock` | GET | `/v1/onchain/algod/block` | $0.35 | Block header (header-only by default) |
| `onchain.algodBlockHash` | GET | `/v1/onchain/algod/block/hash` | $0.10 | Block hash |
| `onchain.algodBlockTxids` | GET | `/v1/onchain/algod/block/txids` | $0.15 | Top-level transaction IDs |
| `onchain.algodBlockLogs` | GET | `/v1/onchain/algod/block/logs` | $0.35 | App-call logs for a round |
| `onchain.algodPending` | GET | `/v1/onchain/algod/pending` | $0.15 | Global mempool snapshot |

## Testing

Start both services:

```bash
npm run dev:all
```

Inspect an x402 challenge without spending funds:

```bash
curl -i 'http://localhost:4021/v1/market/quotes?symbols=BTC'
```

For a browser user, open [https://finality.accuracy.wtf/explore](https://finality.accuracy.wtf/explore) (or `http://localhost:3000/explore` locally), connect Pera, Defly, or Lute on Algorand Testnet, select an operation, review its input, and choose **Pay & run**. The wallet remains non-custodial: the application requests signatures but never receives the mnemonic or private key.

For an automated agent with its own funded and USDC-opted-in wallet, use an x402 client that supports the AVM exact scheme. The repository's complete integration smoke test is:

```bash
npm run test:x402:testnet
```

That command executes the published paid catalog using the local ignored test-wallet file. Never commit or expose that wallet file.

Algorand data queries use Nodely Testnet algod (`https://testnet-api.4160.nodely.dev`) and Indexer (`https://testnet-idx.4160.nodely.dev`). The merchant does not proxy algod admin, long-poll, proof, delta, TEAL compile, or transaction-submit paths.

Swagger's **Authorize** dialog accepts a pre-built `PAYMENT-SIGNATURE` header. Swagger itself does not manage Algorand wallets, so use the main wallet tester for interactive payment signing.
