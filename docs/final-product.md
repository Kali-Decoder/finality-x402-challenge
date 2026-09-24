# Finality — Final Product Guide

## Product

Finality is a pay-per-result market-intelligence service for people and autonomous agents. A browser user connects a non-custodial Algorand wallet; an agent supplies its own signer. Both call the same catalog of HTTP resources and pay the displayed Testnet USDC amount through x402. GoPlausible verifies and settles the payment before Finality executes the provider operation.

The application never receives a wallet mnemonic or private key. Browser signing is provided by TxnLab `use-wallet`; supported choices are Pera, Defly, and Lute. AlgoKit Utils reads connected-account readiness from Algorand Testnet. The x402 AVM SDK constructs the protocol payment and bridges its transaction group to the selected wallet's `signTransactions` method.

## Run the product

Install once:

```bash
npm install
```

Run both services:

```bash
npm run dev:all
```

Or run them in separate terminals:

```bash
npm run dev:merchant
npm run dev:frontend
```

| Surface | URL |
|---|---|
| Landing page | [https://finality.accuracy.wtf](https://finality.accuracy.wtf) (local: `http://localhost:3000`) |
| Human endpoint explorer | [https://finality.accuracy.wtf/explore](https://finality.accuracy.wtf/explore) |
| Swagger/OpenAPI UI | [https://finality.accuracy.wtf/docs](https://finality.accuracy.wtf/docs) |
| Merchant health | [https://finality-x402-backend.onrender.com/health](https://finality-x402-backend.onrender.com/health) (local: `http://localhost:4021/health`) |
| Agent catalog | [https://finality-x402-backend.onrender.com/v1/catalog](https://finality-x402-backend.onrender.com/v1/catalog) |
| OpenAPI document | [https://finality-x402-backend.onrender.com/v1/openapi.json](https://finality-x402-backend.onrender.com/v1/openapi.json) |

The frontend calls `/api/x402/*`, a same-origin proxy to the merchant. This avoids browser CORS, mixed-content, LAN-host, and `localhost:4021` discovery failures while preserving the x402 `PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE`, and `PAYMENT-RESPONSE` headers.

## User journey

1. Open the landing page and choose **Launch Intelligence**.
2. Choose **Connect wallet** and select Pera, Defly, or Lute on Testnet.
3. Select a resource. The explorer loads the correct request example and displays the exact USDC price.
4. Choose **Pay & run** and approve the transaction group in the wallet.
5. Inspect the result, live/synthetic status, provider, limitations, request ID, and settlement receipt.

The wallet needs Testnet ALGO for fees and must be opted into Testnet USDC ASA `10458941` with enough balance for the selected resource.

## Agent journey

1. Read `/v1/catalog` or `/v1/openapi.json`.
2. Send the resource request without payment and receive HTTP `402` plus `PAYMENT-REQUIRED`.
3. Use an AVM exact-scheme x402 client and the agent's Algorand wallet to sign the required transaction group.
4. Retry with `PAYMENT-SIGNATURE`.
5. Consume the stable JSON envelope and retain `PAYMENT-RESPONSE` as the settlement receipt.

The repository's complete agent integration test is:

```bash
npm run test:x402:testnet
```

## Paid resources

| Resource | Price | Primary source/calculation | Useful result |
|---|---:|---|---|
| `GET /v1/market/quotes` | $0.15 | Binance spot REST | Current price, 24h change and quote volume |
| `GET /v1/market/assets` | $0.15 | Supported universe + Binance validation | Normalized symbol, market and quote asset |
| `POST /v1/market/candles` | $0.25 | Binance klines | Bounded OHLCV candle history |
| `GET /v1/market/trending` | $0.20 | Binance quotes, ranked by volume | Ranked liquid-asset snapshot |
| `GET /v1/market/fear-greed` | $0.10 | Alternative.me | Sentiment value, classification and timestamp |
| `POST /v1/signals` | $0.45 | Deterministic analysis of live candles | BUY/SELL/HOLD, score, price and regime |
| `POST /v1/technicals` | $0.45 | Deterministic analysis of live candles | SMA10, SMA30, RSI14, momentum and regime |
| `POST /v1/analysis/report` | $0.70 | Deterministic combined analysis | Technical snapshot, signal and risk state |
| `POST /v1/analysis/volume` | $0.25 | Live candle volume calculation | Current/average volume, ratio and spike flag |
| `POST /v1/analysis/events` | $0.45 | Live OHLCV movement detection | Price events crossing the bounded threshold |
| `POST /v1/backtest` | $0.70 | Historical candles + MA simulation | Final equity, return and trade count |
| `POST /v1/agent/decision` | $0.55 | Deterministic technical/risk rules | Action, confidence, risk and max position size |
| `POST /v1/agent/briefing` | $0.70 | Deterministic market summarization | Compact bias, regime, score and risks |
| `POST /v1/agent/strategy/parse` | $0.55 | Bounded deterministic parser | Validated moving-average rules from plain text |
| `POST /v1/ai/chat` | $0.90 | Groq; Ollama fallback | Concise model-generated analyst response |
| `POST /v1/onchain/algorand/account` | $0.25 | Nodely Testnet Indexer | Full account state |
| `POST /v1/onchain/algorand/portfolio` | $0.35 | Nodely Testnet Indexer | ALGO balance, ASA holdings and round |
| `POST /v1/onchain/algorand/asset` | $0.20 | Nodely Testnet Indexer | Verified ASA metadata |
| `POST /v1/onchain/algorand/defi` | $0.45 | Nodely Testnet Indexer | Recent application activity; no invented liquidity |
| `GET /v1/onchain/algod/status` | $0.10 | Nodely Testnet algod | Last round and node status |
| `GET /v1/onchain/algod/supply` | $0.10 | Nodely Testnet algod | Online and total ALGO supply |
| `GET /v1/onchain/algod/params` | $0.10 | Nodely Testnet algod | Suggested transaction parameters |
| `GET /v1/onchain/algod/account` | $0.20 | Nodely Testnet algod | Live account state |
| `GET /v1/onchain/algod/account/assets` | $0.25 | Nodely Testnet algod | Paginated ASA holdings |
| `GET /v1/onchain/algod/account/asset` | $0.20 | Nodely Testnet algod | One ASA holding |
| `GET /v1/onchain/algod/account/applications` | $0.25 | Nodely Testnet algod | Paginated app local state |
| `GET /v1/onchain/algod/account/application` | $0.20 | Nodely Testnet algod | One app local/global state |
| `GET /v1/onchain/algod/account/pending` | $0.25 | Nodely Testnet algod | Address mempool |
| `GET /v1/onchain/algod/asset` | $0.20 | Nodely Testnet algod | Live ASA parameters |
| `GET /v1/onchain/algod/application` | $0.25 | Nodely Testnet algod | Application programs and global state |
| `GET /v1/onchain/algod/application/boxes` | $0.35 | Nodely Testnet algod | Box names |
| `GET /v1/onchain/algod/application/box` | $0.20 | Nodely Testnet algod | One box value |
| `GET /v1/onchain/algod/block` | $0.35 | Nodely Testnet algod | Block header (header-only default) |
| `GET /v1/onchain/algod/block/hash` | $0.10 | Nodely Testnet algod | Block hash |
| `GET /v1/onchain/algod/block/txids` | $0.15 | Nodely Testnet algod | Top-level transaction IDs |
| `GET /v1/onchain/algod/block/logs` | $0.35 | Nodely Testnet algod | App-call logs |
| `GET /v1/onchain/algod/pending` | $0.15 | Nodely Testnet algod | Global mempool snapshot |

## Result contract

Successful operations return:

```json
{
  "success": true,
  "operationId": "market.quotes",
  "requestId": "uuid",
  "data": {},
  "meta": {
    "source": "binance",
    "asOf": "ISO timestamp",
    "freshnessSeconds": 15,
    "limitations": [],
    "availabilityTrack": "durable",
    "dataMode": "live",
    "synthetic": false
  },
  "payment": {
    "network": "algorand-testnet",
    "asset": "USDC",
    "settlementId": "receipt"
  }
}
```

Clients must use `meta.source`, `meta.synthetic`, `meta.fallback`, and `meta.fallbackReason`; they must never infer that fallback data is live.

## Provider exhaustion and fallback

The configured resilient profile is:

```env
DATA_MODE=auto
ALLOW_MOCK_FALLBACK=true
LLM_PROVIDER=groq
```

Fallback order:

| Failure | Behavior |
|---|---|
| Groq quota, rate limit, credentials, timeout or outage | Try local Ollama |
| Groq and Ollama unavailable | Return deterministic AI fallback with `generatedByModel:false` |
| Binance unavailable or rate-limited | Return deterministic schema-valid market fixture |
| Alternative.me unavailable | Return deterministic sentiment fixture |
| Nodely algod/Indexer unavailable | Return deterministic schema-valid on-chain fixture |
| Deterministic calculations | Continue over the selected live or fallback input data |

Every last-resort response is visibly labeled:

```json
{
  "meta": {
    "dataMode": "mock",
    "synthetic": true,
    "fallback": true,
    "fallbackReason": "rate_limited"
  }
}
```

Possible reasons are `missing_credentials`, `invalid_credentials`, `quota_exhausted`, `rate_limited`, `timeout`, `upstream_error`, and `model_unavailable`. Fallback preserves the endpoint schema and keeps the product usable, but synthetic output is not represented as current market or chain truth. The explorer displays an amber degraded-data warning.

Set `DATA_MODE=live` or `ALLOW_MOCK_FALLBACK=false` when fail-closed behavior is preferred; provider failures then return an explicit `503` instead of synthetic output.

## Data limitations

- Binance endpoints cover crypto spot markets, not authenticated trading or balances. Binance API credentials are not needed for these public routes.
- Asset search and trending use a bounded launch universe.
- Price events are candle-derived movements, not news claims.
- Backtests exclude fees, slippage, taxes and market impact.
- Strategy parsing supports bounded moving-average language.
- DeFi activity reports Indexer transactions and does not infer pool, TVL or liquidity values.
- AI output is model-generated analysis, not financial advice.

## Verification

```bash
npx tsc --noEmit
npm run test:x402
npm run build:x402
npm run build
```

The contract suite covers all published resources, validation, discovery, unpaid x402 challenges, dummy-route exclusion, and explicitly labeled provider fallback. Real Testnet verification uses the agent smoke command above.
