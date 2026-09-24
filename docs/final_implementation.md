# Finality Production Implementation Handoff

This document is the implementation contract for coding agents working on Finality.
Read it before changing routes, providers, wallet code, or x402 behavior.

## Product Definition

Finality is a general-purpose market-intelligence resource server for humans and
autonomous agents. It provides real, normalized intelligence across:

- Crypto and meme assets
- Equities and ETFs
- Forex
- Sentiment and market regime data
- OHLCV, technical indicators, momentum, volatility, and volume analysis
- Trading signals, reports, backtests, and strategy parsing
- AI analyst and agent-oriented services
- Algorand account, ASA, and Algorand DeFi intelligence

Algorand is primarily the x402 payment rail. It is not the product's main
consumer-facing identity. Every paid request is paid in USDC on Algorand through
the hosted GoPlausible facilitator. Algorand Indexer and algod are used for a
specialized on-chain intelligence category.

The public product name and API language should be **Finality Market
Intelligence**, not Algorand-only trading.

## Non-Negotiable Architecture

### Merchant/resource server

Finality is the x402 resource server. It is not a facilitator.

- Use `@x402/hono`, `x402ResourceServer`, `HTTPFacilitatorClient`, and
  `ExactAvmScheme` following the reference implementation.
- Use GoPlausible for both verification and settlement.
- Do not build, deploy, or operate a self-hosted facilitator.
- Do not add a second facilitator or a payment fallback.
- Use exact Algorand USDC ASA payments, not signed messages or opaque proof
  strings.
- Use Algorand Testnet for the first release.
- Use Testnet USDC ASA `10458941` unless the official x402 configuration says
  otherwise at implementation time.
- The merchant `payTo` account must be a dedicated Algorand account.
- The merchant server must never receive or persist an agent mnemonic.

### Client custody

Users sign through an Algorand wallet adapter. Autonomous agents sign with their
own Algorand wallet and submit `Payment-Signature`.

The reference flow is:

1. Client requests a paid resource.
2. Server returns HTTP 402 and payment requirements.
3. Client creates the exact AVM payment group.
4. User wallet or agent wallet signs the group.
5. Client retries with `Payment-Signature`.
6. GoPlausible verifies and settles the payment.
7. Only then does the Finality handler fetch providers and compute output.
8. Server returns real data and `Payment-Response`.

Never accept `X-Payment-Proof`, `X-Payer-Address`, message signatures, or a
minimum-length string as payment evidence.

### Service boundary

Create a standalone `x402-server/` Hono service as the canonical public API.
Keep Next.js routes as temporary compatibility wrappers or internal UI routes.
Handlers must call shared Finality domain functions, not make HTTP calls back to
another paid Finality route.

Use this structure:

```text
x402-server/
  index.ts                         # Hono app and server startup
  config/
    env.ts                         # validated runtime configuration
    payment.ts                     # GoPlausible and AVM payment config
    cors.ts                         # allowed origins and x402 headers
  registry/
    endpoints.ts                   # single source of truth for all routes
    catalog.ts                     # Bazaar and public catalog projection
  middleware/
    x402.ts                        # payment middleware wiring
    errors.ts                      # stable error envelope
    request-context.ts             # request ID, payer, receipt context
  routes/
    public.ts                      # health, info, catalog, OpenAPI
    test.ts                        # disabled-by-default deterministic test route
    market.ts                      # market endpoint registration
    intelligence.ts                # signal and analysis registration
    agents.ts                      # agent and strategy registration
    ai.ts                          # AI endpoint registration
    onchain-algorand.ts            # Algorand Indexer endpoint registration
  handlers/
    public/
    test/
      dummy.ts                     # the only dummy-data endpoint
    market/
      quotes.ts
      assets.ts
      candles.ts
      trending.ts
      fear-greed.ts
    intelligence/
      signals.ts
      technicals.ts
      report.ts
      volume.ts
      events.ts
      backtest.ts
    agents/
      decision.ts
      briefing.ts
      strategy-parse.ts
    ai/
      chat.ts
    onchain-algorand/
      account.ts
      portfolio.ts
      asset.ts
      defi.ts
  schemas/                         # one request/response schema per endpoint
  services/                        # domain logic; no HTTP or x402 concerns
  tests/
    contract/                      # status, headers, schemas, error envelopes
    payments/                      # 402, verify, settle, replay, wrong asset
    endpoints/                     # one test file per endpoint
    providers/                     # fixtures, fallback, freshness, limits
    smoke/                         # local server and Testnet scripts
    fixtures/                      # deterministic mock provider data
  lib/
    logger.ts
    limits.ts
    receipts.ts
    metrics.ts
lib/providers/
  types.ts                         # normalized provider contracts
  mock.ts                          # deterministic test-only provider
  binance.ts
  dexscreener.ts
  alternative-me.ts
  frankfurter.ts
  twelvedata.ts                    # optional free-key adapter
  coingecko.ts                     # optional free-key adapter
lib/onchain/algorand/
  indexer.ts
  account.ts
  assets.ts
  defi.ts
lib/contracts/
  api.ts                           # shared public response types
  errors.ts
  pagination.ts
```

### Code-organization rules

- `registry/endpoints.ts` is the only place where public route names, methods,
  prices, limits, descriptions, and discovery metadata are declared.
- Each endpoint has exactly one handler, one request schema, one response
  schema, one domain service entry point, and one endpoint contract test.
- Handlers parse input, call a service, and format the response. They do not
  contain provider calls, payment logic, or large calculations.
- Services contain business logic and are reusable by the web UI and merchant
  server. They do not read HTTP headers or construct x402 responses.
- Providers only fetch and normalize external data. They must report source,
  timestamp, freshness, limits, and provider errors.
- Payment middleware runs before handlers. A handler must never decide whether
  a request has paid.
- All successful responses use one envelope shape and all failures use one
  error shape. Do not create route-specific ad hoc response formats.
- Every route has a stable operation ID such as `market.quotes` or
  `intelligence.signals`; use these IDs in logs, metrics, tests, and Bazaar
  discovery metadata.

## Bazaar API Catalog

Every paid endpoint must have a stable version, schema, price, description,
example response, source metadata, freshness rule, and input limits. Register
discovery metadata with the x402 Bazaar resource-server extension.

### Market data

| Endpoint | Purpose | Initial price target |
| --- | --- | ---: |
| `GET /v1/market/quotes` | Bounded crypto, meme, equity, ETF, or forex quotes | $0.0005-$0.001 |
| `GET /v1/market/assets` | Asset search, symbol normalization, metadata | $0.0005 |
| `POST /v1/market/candles` | Bounded OHLCV history | $0.001 |
| `GET /v1/market/trending` | Trending and ranked assets | $0.001 |
| `GET /v1/market/fear-greed` | Current or historical crypto sentiment | $0.0005 |

### Intelligence

| Endpoint | Purpose | Initial price target |
| --- | --- | ---: |
| `POST /v1/signals` | Multi-market signals and summary | $0.001-$0.003 |
| `POST /v1/technicals` | RSI, moving averages, momentum, volatility, regime | $0.002 |
| `POST /v1/analysis/report` | Combined signal, technical, sentiment, and risk report | $0.005 |
| `POST /v1/analysis/volume` | Volume spikes and participation analysis | $0.001 |
| `POST /v1/analysis/events` | Market/event intelligence when real data exists | $0.001-$0.003 |
| `POST /v1/backtest` | Bounded historical strategy backtest | $0.005-$0.01 |

### Agent services

| Endpoint | Purpose | Initial price target |
| --- | --- | ---: |
| `POST /v1/agent/decision` | Deterministic decision from signals and risk profile | $0.003-$0.005 |
| `POST /v1/agent/briefing` | Compact machine-readable market briefing | $0.005 |
| `POST /v1/agent/strategy/parse` | Natural language to validated strategy rules | $0.003 |
| `POST /v1/ai/chat` | Bounded, data-grounded analyst response | $0.005-$0.01 |

### Algorand on-chain intelligence

These are specialized routes, not the entire Finality product:

- `POST /v1/onchain/algorand/account`
- `POST /v1/onchain/algorand/portfolio`
- `POST /v1/onchain/algorand/asset`
- `POST /v1/onchain/algorand/defi`

Only expose protocol, pool, liquidity, holder, and activity metrics when the
Indexer or a real adapter provides the data. Never return placeholder DeFi data.

### Public routes

Keep free routes limited to:

- `GET /health`
- `GET /info`
- `GET /v1/catalog`
- `GET /v1/openapi.json`
- x402 Bazaar discovery metadata

The only dummy-data route is `GET /v1/test/dummy`. It is a test utility, not a
product endpoint: it must be disabled or return 404 in production, must not be
listed in Bazaar discovery, and must never be presented as live intelligence.

Do not leave the existing full intelligence routes freely callable after their
paid equivalents are live.

## Canonical Endpoint Manifest

This is the endpoint ownership map agents should implement and test. The public
path, operation ID, handler, service, and test name must remain aligned.

| Operation ID | Method and path | Handler | Service | Contract test |
| --- | --- | --- | --- | --- |
| `public.health` | `GET /health` | `handlers/public/health.ts` | `services/public/health.ts` | `endpoints/public-health.test.ts` |
| `public.info` | `GET /info` | `handlers/public/info.ts` | `services/public/info.ts` | `endpoints/public-info.test.ts` |
| `public.catalog` | `GET /v1/catalog` | `handlers/public/catalog.ts` | `services/public/catalog.ts` | `endpoints/public-catalog.test.ts` |
| `public.openapi` | `GET /v1/openapi.json` | `handlers/public/openapi.ts` | `services/public/openapi.ts` | `endpoints/public-openapi.test.ts` |
| `test.dummy` | `GET /v1/test/dummy?operationId=...` | `handlers/test/dummy.ts` | `services/test/dummy.ts` | `endpoints/test-dummy.test.ts` |
| `market.quotes` | `GET /v1/market/quotes` | `handlers/market/quotes.ts` | `services/market/quotes.ts` | `endpoints/market-quotes.test.ts` |
| `market.assets` | `GET /v1/market/assets` | `handlers/market/assets.ts` | `services/market/assets.ts` | `endpoints/market-assets.test.ts` |
| `market.candles` | `POST /v1/market/candles` | `handlers/market/candles.ts` | `services/market/candles.ts` | `endpoints/market-candles.test.ts` |
| `market.trending` | `GET /v1/market/trending` | `handlers/market/trending.ts` | `services/market/trending.ts` | `endpoints/market-trending.test.ts` |
| `market.fearGreed` | `GET /v1/market/fear-greed` | `handlers/market/fear-greed.ts` | `services/market/fear-greed.ts` | `endpoints/market-fear-greed.test.ts` |
| `intelligence.signals` | `POST /v1/signals` | `handlers/intelligence/signals.ts` | `services/intelligence/signals.ts` | `endpoints/intelligence-signals.test.ts` |
| `intelligence.technicals` | `POST /v1/technicals` | `handlers/intelligence/technicals.ts` | `services/intelligence/technicals.ts` | `endpoints/intelligence-technicals.test.ts` |
| `intelligence.report` | `POST /v1/analysis/report` | `handlers/intelligence/report.ts` | `services/intelligence/report.ts` | `endpoints/intelligence-report.test.ts` |
| `intelligence.volume` | `POST /v1/analysis/volume` | `handlers/intelligence/volume.ts` | `services/intelligence/volume.ts` | `endpoints/intelligence-volume.test.ts` |
| `intelligence.events` | `POST /v1/analysis/events` | `handlers/intelligence/events.ts` | `services/intelligence/events.ts` | `endpoints/intelligence-events.test.ts` |
| `intelligence.backtest` | `POST /v1/backtest` | `handlers/intelligence/backtest.ts` | `services/intelligence/backtest.ts` | `endpoints/intelligence-backtest.test.ts` |
| `agent.decision` | `POST /v1/agent/decision` | `handlers/agents/decision.ts` | `services/agents/decision.ts` | `endpoints/agent-decision.test.ts` |
| `agent.briefing` | `POST /v1/agent/briefing` | `handlers/agents/briefing.ts` | `services/agents/briefing.ts` | `endpoints/agent-briefing.test.ts` |
| `agent.strategyParse` | `POST /v1/agent/strategy/parse` | `handlers/agents/strategy-parse.ts` | `services/agents/strategy-parse.ts` | `endpoints/agent-strategy-parse.test.ts` |
| `ai.chat` | `POST /v1/ai/chat` | `handlers/ai/chat.ts` | `services/ai/chat.ts` | `endpoints/ai-chat.test.ts` |
| `onchain.algorandAccount` | `POST /v1/onchain/algorand/account` | `handlers/onchain-algorand/account.ts` | `services/onchain-algorand/account.ts` | `endpoints/onchain-algorand-account.test.ts` |
| `onchain.algorandPortfolio` | `POST /v1/onchain/algorand/portfolio` | `handlers/onchain-algorand/portfolio.ts` | `services/onchain-algorand/portfolio.ts` | `endpoints/onchain-algorand-portfolio.test.ts` |
| `onchain.algorandAsset` | `POST /v1/onchain/algorand/asset` | `handlers/onchain-algorand/asset.ts` | `services/onchain-algorand/asset.ts` | `endpoints/onchain-algorand-asset.test.ts` |
| `onchain.algorandDefi` | `POST /v1/onchain/algorand/defi` | `handlers/onchain-algorand/defi.ts` | `services/onchain-algorand/defi.ts` | `endpoints/onchain-algorand-defi.test.ts` |

For each product manifest row, the implementation must provide:

1. Request and response schemas.
2. A Bazaar discovery entry.
3. A fixed x402 price and bounded limits.
4. A real provider/service implementation.
5. A happy-path contract test.
6. Invalid input, provider failure, and payment failure tests.
7. A curl example and an agent example in the API documentation.
8. Source, timestamp, freshness, and limitations in the response.

Do not publish an endpoint in `/v1/catalog` until all eight items are complete.

The `test.dummy` row is intentionally excluded from the product catalog and
has a separate contract: it must return deterministic, schema-valid synthetic
data for every product `operationId`, with `meta.dataMode: "mock"` and
`meta.synthetic: true`.

## Endpoint Testing and Publication Workflow

Use the same workflow for every endpoint:

1. Add the endpoint row to `registry/endpoints.ts` with its operation ID.
2. Add request and response schemas.
3. Add the domain service and provider fixture tests.
4. Add the payment-protected handler.
5. Register the route in exactly one domain route module.
6. Add the contract test for unpaid 402 and valid paid 200 behavior.
7. Add negative tests for malformed input, replay, wrong asset/network, provider
   timeout, and unavailable optional dependencies.
8. Add a curl example and a language-neutral agent example.
9. Confirm the endpoint appears correctly in `/v1/catalog`, OpenAPI, and Bazaar
   discovery metadata.
10. Run the local smoke test, then the GoPlausible Algorand Testnet smoke test.
11. Publish only after the response is real, source-labeled, and observable.

### Mock-data testing and outage-fallback contract

Every product service, including AI and inference services, must support a
`mock` provider implementation using the same request and response schema as
its live implementation. This allows all routes to be tested before API keys
are collected and gives the operator an explicit backup when a provider key is
missing, invalid, rate-limited, exhausted, timed out, or otherwise unavailable.

This is not silent fake data. A fallback response must identify itself as
synthetic and explain why the live provider was not used.

Use these rules:

- `DATA_MODE=mock`: always use deterministic fixtures. Intended for local
  development and contract/UI tests.
- `DATA_MODE=live`: use configured live providers only. Provider failure returns
  `provider_unavailable` or `provider_quota_exhausted`; it never fabricates
  data.
- `DATA_MODE=auto`: try live providers, then use deterministic mock data when
  `ALLOW_MOCK_FALLBACK=true`. Every fallback response must be marked synthetic.
- Production must reject `DATA_MODE=mock`. Production may use
  `DATA_MODE=auto` only when the operator explicitly accepts synthetic fallback
  responses and the API contract clearly exposes that state to users and
  agents. The default production policy remains fail-closed.
- x402 payment metadata for mock responses must identify the response as test
  data. The dummy route itself should not request payment.
- Mock values must be stable for the same operation, symbol, interval, and
  fixture seed. Do not use random values that make tests flaky.
- Fixtures must be plausible but must never resemble an actual current quote
  without a visible synthetic marker.
- The fallback reason must be one of `missing_credentials`, `invalid_credentials`,
  `quota_exhausted`, `rate_limited`, `timeout`, `upstream_error`, or
  `model_unavailable`.
- All paid endpoints keep their normal x402 payment behavior in fallback mode;
  payment never turns synthetic data into live data.
- AI fallback must be deterministic templates or fixture-based structured
  analysis. It must not claim that an LLM generated the answer.

The single dummy endpoint accepts an `operationId` from the product manifest:

```text
GET /v1/test/dummy?operationId=intelligence.signals
GET /v1/test/dummy?operationId=market.quotes
GET /v1/test/dummy?operationId=onchain.algorand.defi
```

It returns the exact example response shape for that operation plus:

```json
{
  "meta": {
    "dataMode": "mock",
    "synthetic": true,
    "source": "finality-deterministic-fixture",
    "fallback": true,
    "fallbackReason": "model_unavailable",
    "limitations": ["Test data only; not current market information"]
  }
}
```

Unknown operation IDs return a stable 404. This route is for coding agents,
frontend work, endpoint contract tests, and demonstrations before live provider
keys are available.

### Required endpoint contract

Every paid response should include a stable shape similar to:

```json
{
  "success": true,
  "operationId": "intelligence.signals",
  "requestId": "uuid",
  "data": {},
  "meta": {
    "source": "binance",
    "asOf": "2026-09-16T00:00:00.000Z",
    "freshnessSeconds": 15,
    "limitations": []
  },
  "payment": {
    "network": "algorand-testnet",
    "asset": "USDC",
    "settlementId": "facilitator-or-chain-id"
  }
}
```

Error responses should include `error.code`, `error.message`, `requestId`, and
optional `error.retryable`. Never include API keys, mnemonics, or raw signed
payment payloads.

## Existing Finality Capabilities To Preserve

Use existing real computation where possible:

- `app/api/agent/signals/route.ts`
- `app/api/cmc/route.ts`
- `app/api/livefeed/route.ts`
- `app/api/technicals/route.ts`
- `app/api/ai/chat/route.ts`
- `app/api/agent/strategy/route.ts`
- `lib/signalEngine.ts`
- `lib/skills/cmc.ts`
- `lib/skills/twelvedata.ts`
- `lib/skills/dexscreener.ts`
- `lib/skills/multimarket-technicals.ts`
- `lib/skills/bitget-technicals.ts`
- `lib/algorand/client.ts`

Required cleanup:

- Delete or replace `app/api/agent/signal-x402/route.ts`; it is not real x402.
- Remove `getX402Signal` from `lib/skills/cmc.ts`; it calls a third-party
  endpoint and falls back to unpaid data.
- Remove BSC, GOAT, EVM, Solana, and other non-Algorand wallet, settlement,
  execution, and chain-query paths.
- Keep general crypto market intelligence even when the asset is associated
  with another chain. Treat it as off-chain market data, not chain support.
- Rebrand UI and metadata from Algorand-specific trading to Finality Market
  Intelligence. Mention Algorand in payment instructions, on-chain routes, and
  wallet integration only.
- Remove mnemonic transport from analysis requests. A trading execution worker,
  if retained, must be a separate authenticated and reviewed capability.

## Free-First Provider Policy

No paid provider is required for the initial release. Provider adapters must
normalize data and return:

```json
{
  "source": "binance",
  "provider": "public-rest",
  "asOf": "2026-09-16T00:00:00.000Z",
  "freshnessSeconds": 15,
  "limitations": []
}
```

Never invent data when a provider is unavailable. Return a truthful degraded
response or fail the endpoint with an explicit provider error.

### Recommended baseline

- Binance public REST: crypto spot data and candles; no application key for
  public market endpoints. Cache and obey exchange limits.
- DexScreener public API: DEX and meme discovery; no application key for the
  selected public endpoints. The documented endpoints include 60 requests per
  minute limits; cache aggressively.
- Alternative.me Fear & Greed API: no key. Add required attribution and a
  disclaimer beside displayed data.
- Frankfurter/ECB: no key for reference FX rates. Label delayed/reference data
  accurately; do not promise live FX execution prices.
- AlgoNode public algod and Indexer: no key for light Testnet reads. Support
  configurable endpoints for production reliability.
- Ollama: local LLM server, no hosted API key. Best default for development and
  a self-hosted production worker when compute is available.

### Optional free-key providers

- Twelve Data Basic: optional free key for limited forex/equity coverage. The
  current Basic tier advertises 8 API credits per minute and 800 per day; this
  cannot support unlimited polling.
- CoinGecko Demo/free: optional metadata and crypto fallback. Validate current
  terms and limits before enabling it in production.
- Hugging Face Inference Providers: optional `HF_TOKEN` and a selected model.
  Free credits and availability vary; use it as a fallback, not a guarantee.
- Groq: recommended hosted low-latency LLM option. Create a key in the Groq
  Console, use its OpenAI-compatible endpoint, and obey the current developer
  tier rate/token limits. Treat free access as quota-limited and do not promise
  unlimited usage.
- Gemini: optional only. Do not make Gemini a required dependency because free
  limits may be too low for the expected Bazaar volume.
- CMC: optional legacy fallback, not a launch requirement.

Do not design the launch around paid OpenAI, Anthropic, Kimi, OpenRouter, or
paid market-data plans.

## Provider Tracks: Durable Core vs Quota-Limited Enhancements

This separation is mandatory. A provider being free to create an account does
not mean it is unlimited, durable, or suitable as the only backend dependency.
The API catalog and health endpoint must show which track produced each result.

### Track A: Durable/no-credit core

These services must remain usable for local development, extensive integration
testing, and the minimum production intelligence catalog without expiring
monthly credits or requiring a paid subscription:

| Capability | Provider | Key/credit behavior | Implementation rule |
| --- | --- | --- | --- |
| Crypto public market data | Binance public REST | No application key for selected public endpoints; exchange request limits still apply | Cache, throttle, and expose provider freshness. Never call it once per user poll without a cache. |
| DEX/meme discovery | DexScreener public API | No key for selected endpoints; documented endpoints commonly show 60 requests/minute | Use as a bounded fallback, not unlimited traffic. Add a cache and return `provider_rate_limited` when exhausted. |
| Crypto sentiment | Alternative.me | No key; public service and attribution/disclaimer required | Cache the daily index. Include attribution and do not poll it per request. |
| Reference FX | Frankfurter/ECB | No key and no monthly/daily quota according to current FAQ; still abuse-rate-limited | Use only as daily/reference FX, never advertise it as live trading data. |
| Algorand reads | AlgoNode public algod/Indexer | Public endpoints; operational rate limits and service availability still apply | Cache Indexer results, support endpoint overrides, and provide a provider health state. |
| LLM development | Ollama local models | Local models have no hosted API credits; local compute is the limit | Use for deterministic test fixtures, AI contract tests, and local development. Never expose the local port publicly. |
| Deterministic intelligence | Finality code | No external request or model credit | Signals, technicals, risk rules, summaries, and backtests must work with provider fixtures and cached data. |

Track A endpoints must be labelled `availabilityTrack: "durable"` in the
catalog. A local test profile must be able to run these endpoints repeatedly
without consuming a hosted provider credit balance.

### Track B: quota-limited free/basic enhancements

These providers are useful but may stop working after a daily, monthly, token,
or account quota. They must be optional adapters behind feature flags and must
never be required for the core service:

| Capability | Provider | Current limitation to plan around | Endpoint policy |
| --- | --- | --- | --- |
| Forex/equity/crypto enrichment | Twelve Data Basic | 8 API credits/minute and 800/day; endpoint weights can consume multiple credits | Enable only when configured. Add quota headers/metrics and return explicit degraded coverage. |
| Crypto metadata/fallback | CoinGecko Demo/free | 10,000 call credits/month and 100 requests/minute on the current Demo plan | Use for asset metadata or fallback only. Do not make it the primary high-volume route. |
| Crypto enrichment | CoinMarketCap keyless/free | Keyless public API covers a curated subset; authenticated limits and endpoint access depend on the account plan | Keep optional. Never require `CMC_API_KEY` for deterministic or Track A routes. |
| Hosted LLM fallback | Hugging Face Inference Providers | Free users currently receive $0.10/month; requests can continue only with purchased credits or another billing arrangement | Use only as an explicitly enabled fallback. Monitor remaining credits and fail to Ollama. |
| Hosted low-latency LLM | Groq | Developer access is quota/rate limited; current values vary by model and account and must be read from the Groq console | Use behind `LLM_PROVIDER=groq`, with token/request caps and Ollama fallback. Never promise unlimited free Groq usage. |
| Experimental hosted LLM | Gemini | Free limits vary by model/project and include RPM, TPM, and RPD; Google states limits are not guaranteed | Keep disabled by default. Do not make Gemini a production dependency. |
| Traditional equity fallback | Alpha Vantage | Free access is commonly limited to 25 requests/day and is unsuitable for high-volume service traffic | Exclude from the core launch path. |

Track B responses must include:

```json
{
  "availabilityTrack": "quota-limited",
  "providerQuota": {
    "provider": "twelve-data",
    "remaining": null,
    "resetAt": null,
    "knownLimit": "8 credits/minute; 800 requests/day"
  }
}
```

Never silently replace missing Track B data with fabricated values or stale
values without marking the response as stale. If the feature is optional and
its provider is unavailable, return a stable `provider_unavailable` or
`provider_quota_exhausted` error and preserve the rest of the service.

### Feature flags and provider modes

Implement explicit runtime modes:

```env
MARKET_PROVIDER_MODE=durable
DATA_MODE=live
ALLOW_MOCK_FALLBACK=false
ENABLE_DUMMY_ENDPOINT=false
ENABLE_QUOTA_PROVIDERS=false
ENABLE_CMC=false
ENABLE_COINGECKO=false
ENABLE_TWELVE_DATA=false
ENABLE_GROQ=false
ENABLE_HUGGINGFACE=false
ENABLE_GEMINI=false
LLM_PROVIDER=ollama
ALLOW_PAID_PROVIDER_FALLBACK=false
```

Recommended profiles:

| Profile | Durable providers | Quota-limited providers | Use |
| --- | --- | --- | --- |
| `test` | Fixtures, local Ollama, cached public data | Disabled | Unlimited local contract and UI testing |
| `durable` | Binance, DexScreener, Alternative.me, Frankfurter, AlgoNode, deterministic code | Disabled | Default launch and public demo |
| `enhanced` | Durable providers | Explicitly enabled configured adapters | User acceptance and broader coverage |
| `production-quota` | Durable providers | Enabled with budgets and monitoring | Only after quota dashboards and fallbacks exist |

Paid x402 access does not mean Finality may spend unlimited money on upstream
providers. Provider budgets, quotas, and failure modes remain enforced.

## LLM Strategy: Groq + Local Models

### Recommended order

1. Deterministic services first: signals, technicals, decisions, backtests, and
   strategy validation must work without an LLM.
2. Ollama for local development and self-hosted inference.
3. Groq for hosted low-latency chat and structured strategy parsing.
4. Hugging Face as an optional hosted fallback.
5. Gemini only as an optional experimental fallback.

### Groq setup

1. Create an account at `https://console.groq.com`.
2. Create an API key in the Groq Console.
3. Store it only as `GROQ_API_KEY` in the server environment.
4. Use the OpenAI-compatible base URL `https://api.groq.com/openai/v1`.
5. Select a currently available Groq model through `GROQ_MODEL`.
6. Set request timeouts, maximum input length, maximum output tokens, and a
   per-payer rate limit.
7. Monitor current Groq quotas before advertising a high-volume AI endpoint.

Example server client configuration:

```ts
new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})
```

### Ollama setup

1. Install Ollama from `https://ollama.com/download`.
2. Start Ollama locally.
3. Pull a model suitable for the machine, for example:

```bash
ollama pull qwen3:8b
ollama pull llama3.2:3b
```

4. Configure:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_API_KEY=
OLLAMA_MODEL=qwen3:8b
```

5. Keep the model behind the same OpenAI-compatible adapter as Groq.
6. For hosted production, run Ollama in a private worker or use Groq. Do not
   expose an unauthenticated Ollama port to the internet.

Other useful local models include Qwen, Llama, Gemma, Mistral, Phi, and
DeepSeek. Select based on latency, RAM/VRAM, structured JSON reliability, tool
calling support, and license compatibility.

### Ollama Cloud setup

Ollama Cloud does not require the Ollama app or a downloaded model. It requires
an API key from `https://ollama.com/settings/keys` and uses the OpenAI-compatible
base URL `https://ollama.com/v1`.

Configure the hosted mode as follows:

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=https://ollama.com/v1
OLLAMA_API_KEY=your_ollama_cloud_api_key
OLLAMA_MODEL=gemma4:31b
```

Use the model names returned by `GET https://ollama.com/api/tags`. Do not use
`:cloud` in direct API model names; the Ollama app/CLI may display cloud models
with that suffix. Keep `OLLAMA_API_KEY` server-side and never expose it to the
browser.

Ollama Cloud is not unlimited free infrastructure. The Free plan includes
starter usage credits and one concurrent request; included usage resets monthly.
Larger models or usage beyond included credits require purchased credits or a
paid plan. Therefore:

- Local Ollama is the durable Track A backend for extensive testing.
- Ollama Cloud is a Track B hosted enhancement with usage and concurrency
  monitoring.
- Use `ENABLE_QUOTA_PROVIDERS=false` for unlimited local testing.
- Return a clear `provider_quota_exhausted` or fall back to local Ollama when
  hosted usage is unavailable.
- Never make Ollama Cloud a hard dependency for deterministic endpoints.

### Hugging Face setup

1. Create a Hugging Face account at `https://huggingface.co`.
2. Create a fine-grained token with Inference Provider permissions.
3. Store it as `HF_TOKEN`, never as a public variable.
4. Select a model currently available through Inference Providers.
5. Treat free credits and model availability as variable and report failures
   clearly.

## Complete Environment Template

`.env.example` is only the local variable template. Next.js and the standalone
merchant server do not automatically load it.

After filling in the values, copy the template to both runtime locations:

```bash
cp .env.example .env.local
mkdir -p x402-server
cp .env.example x402-server/.env
```

Use the root `.env.local` for the Next.js application and
`x402-server/.env` for the merchant service. Keep both runtime files private
and do not commit either file. The values below are intentionally blank except
for safe development defaults.

```env
# -----------------------------------------------------------------------------
# x402 merchant: GoPlausible is the only facilitator
# -----------------------------------------------------------------------------
X402_PAYTO_ADDRESS=
X402_FACILITATOR_URL=https://facilitator.goplausible.xyz
X402_NETWORK=algorand-testnet
X402_USDC_ASA_ID=10458941
X402_ALLOWED_ORIGINS=https://finality.accuracy.wtf,http://localhost:3000
X402_SERVER_PORT=4021

# -----------------------------------------------------------------------------
# Algorand reads and explorer
# -----------------------------------------------------------------------------
ALGORAND_NETWORK=testnet
ALGOD_SERVER=https://testnet-api.algonode.cloud
INDEXER_SERVER=https://testnet-idx.algonode.cloud
ALGOD_TOKEN=
INDEXER_TOKEN=

# -----------------------------------------------------------------------------
# Market data: optional free keys. Public baseline providers need no key.
# -----------------------------------------------------------------------------
CMC_API_KEY=
COINGECKO_API_KEY=
TWELVE_DATA_API_KEY=

# -----------------------------------------------------------------------------
# LLM providers: choose Groq, Hugging Face, or local Ollama.
# -----------------------------------------------------------------------------
GROQ_API_KEY=
GROQ_MODEL=
HF_TOKEN=
HF_MODEL=
GEMINI_API_KEY=
GEMINI_MODEL=
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_API_KEY=
OLLAMA_MODEL=qwen3:8b

# -----------------------------------------------------------------------------
# Supabase and authentication
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://finality.accuracy.wtf
NEXT_PUBLIC_APP_URL=https://finality.accuracy.wtf

# -----------------------------------------------------------------------------
# Application security and optional integrations
# -----------------------------------------------------------------------------
ENCRYPTION_SECRET=
OPENCLAW_SECRET=

# -----------------------------------------------------------------------------
# Deprecated execution credentials: leave blank for the intelligence server.
# -----------------------------------------------------------------------------
BITGET_API_KEY=
BITGET_SECRET_KEY=
BITGET_PASSPHRASE=
BINANCE_API_KEY=
BINANCE_API_SECRET=
```

### Required before first paid Testnet request

- `X402_PAYTO_ADDRESS`
- `X402_FACILITATOR_URL`
- `X402_NETWORK`
- `X402_USDC_ASA_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- One real market provider path: public Binance/DexScreener/Alternative.me,
  or `TWELVE_DATA_API_KEY` for forex/equities coverage

### Required for persistence/authenticated deployment

- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `ENCRYPTION_SECRET` if the wallet vault remains enabled

### Required only for hosted AI

- `GROQ_API_KEY` and `GROQ_MODEL`, or
- `HF_TOKEN` and `HF_MODEL`

AI endpoints must return a truthful 503 when no model backend is configured and
`ALLOW_MOCK_FALLBACK=false`. When fallback is explicitly enabled, they return a
deterministic synthetic response with `meta.synthetic=true` and
`fallbackReason: "model_unavailable"`; they must never claim that an LLM
generated it. Signals, technicals, market data, deterministic decisions, and
backtests must continue to work without an LLM.

## Reference Repositories and Documentation

Coding agents should inspect these before implementing x402:

### Primary implementation reference

- `https://github.com/marotipatre/x402-Project`
  - `x402-demo-server/`: merchant/resource server
  - `x402-demo-server/index.ts`: Hono, GoPlausible, middleware, AVM scheme
  - `x402-demo-server/endpoints.config.ts`: endpoint pricing and Bazaar metadata
  - `x402-demo-server/handlers/`: payment-agnostic handlers
  - `X402-Usecase/projects/X402-Usecase/`: browser wallet client
  - `src/utils/weatherApi.ts`: `wrapFetchWithPayment` and signing bridge

### x402 protocol and SDK source

- `https://github.com/x402-foundation/x402`
- `https://github.com/x402-foundation/x402/blob/main/specs/schemes/exact/scheme_exact_algo.md`
- `https://x402.org/`
- `https://algorand.co/agentic-commerce/x402`

Check the current package APIs before coding. Do not hand-roll payment-group
encoding or facilitator request formats if the maintained SDK provides them.

### Algorand development references

- `https://developer.algorand.org/`
- `https://developer.algorand.org/docs/get-details/algod/`
- `https://developer.algorand.org/docs/get-details/indexer/`
- `https://github.com/algorandfoundation/puya-ts`
- `https://github.com/algorandfoundation/algokit-cli`
- `https://github.com/txnlab/use-wallet`
- `https://testnet.algoexplorer.io/` or the current official Testnet explorer

### Market and model provider documentation

- `https://developers.binance.com/docs/binance-spot-api-docs`
- `https://docs.dexscreener.com/api/reference`
- `https://alternative.me/crypto/fear-and-greed-index/`
- `https://www.frankfurter.app/docs/`
- `https://twelvedata.com/docs`
- `https://www.coingecko.com/en/api`
- `https://console.groq.com/docs`
- `https://huggingface.co/docs/api-inference/en/index`
- `https://ai.google.dev/gemini-api/docs`
- `https://ollama.com/library`

## AI Agent and Skills Research Checklist

Agents implementing this project should search for existing skills before
inventing integrations:

```bash
npx skills find x402 algorand agent payments
npx skills find market data crypto trading technical analysis
npx skills find groq ollama huggingface openai-compatible llm
npx skills find hono nextjs typescript api security
```

Review installable skills for documentation quality, maintenance, licensing,
secrets handling, and whether they use the current x402 SDK. Never install a
skill just because its name matches; read its instructions and source first.

Useful skill and agent sources to search:

- `https://skills.sh/`
- `https://github.com/vercel-labs/skills`
- `https://github.com/google-gemini/gemini-skills`
- `https://github.com/anthropics/skills`
- `https://github.com/modelcontextprotocol/servers`
- `https://github.com/ComposioHQ/awesome-claude-skills`
- `https://github.com/VoltAgent/awesome-agent-skills`

Search terms:

- `x402 resource server Algorand AVM ExactAvmScheme`
- `GoPlausible facilitator HTTPFacilitatorClient`
- `x402 Bazaar discovery extension`
- `Algorand Indexer DeFi analytics`
- `market intelligence agent API tool calling`
- `Groq OpenAI compatible structured outputs`
- `Ollama OpenAI compatible local model`
- `Hugging Face Inference Providers agent`
- `MCP market data server`

Local VS Code agent skills relevant to this handoff include:

- `project-setup-info-local` for whole-project scaffolding only
- `agent-customization` for `.instructions.md`, `AGENTS.md`, and skill files
- `find-skills` for discovering installable skills
- `chronicle` for searching prior implementation sessions
- `solana-dev` is not applicable to this project and must not introduce Solana
  code

Do not add a skill that introduces EVM, BSC, Solana, or another payment chain.
General market data about assets on those chains is acceptable; their wallet,
settlement, and chain-query implementations are not.

## Delivery Phases

### Phase 0: Verify dependencies and providers

1. Complete environment placement before starting either runtime:
  - Fill in `.env.example` as the local template.
  - Copy it to the repository root as `.env.local` for Next.js.
  - Copy it to `x402-server/.env` for the Hono merchant server.
  - Confirm both processes load the expected values without printing secrets.
  - Never rely on `.env.example` being loaded automatically.
2. Confirm x402 package names and versions against the reference repo and
   `x402-foundation/x402`.
3. Confirm GoPlausible Testnet support, endpoint configuration, headers, and
   settlement response format.
4. Create the dedicated merchant account and collect Testnet ALGO for fees.
5. Verify the Testnet USDC ASA and wallet opt-in flow.
6. Verify each free provider manually and document its rate limits.
7. Select Groq model and local Ollama fallback, or disable AI until configured.
8. Start in `MARKET_PROVIDER_MODE=durable` with
  `ENABLE_QUOTA_PROVIDERS=false`; enable Track B only after verifying the
  account limits shown by each provider dashboard.
9. Set `DATA_MODE=mock` and `ENABLE_DUMMY_ENDPOINT=true` for local endpoint
  development before API keys are available. Verify every manifest operation
  against deterministic fixtures, then switch back to `DATA_MODE=live`.

### Phase 1: Build one complete paid route

Implement `POST /v1/signals` first. It must:

- Validate market type, symbols, interval, and limits.
- Return 402 with exact AVM payment requirements when unpaid.
- Verify and settle through GoPlausible.
- Fetch real provider data only after settlement.
- Return signals, summary, source metadata, freshness, request ID, and payment
  receipt metadata.

Test unpaid, valid paid, malformed, replayed, wrong-asset, wrong-network,
wrong-receiver, insufficient-balance, facilitator-timeout, and provider-failure
cases before adding more routes.

### Phase 2: Add catalog and discovery

Add the remaining market, intelligence, agent, AI, and Algorand on-chain routes
using one payment middleware and one endpoint registry. Publish Bazaar metadata,
OpenAPI schemas, examples, pricing, limits, and source/freshness behavior.

For each route, first prove the schema and UI/agent integration in mock mode,
then prove the live provider path, then prove provider outage and quota
exhaustion behavior. Mock mode is a development aid and is never a substitute
for live-provider validation before publication.

### Phase 3: Integrate users and agents

- Add browser wallet signing with `ClientAvmSigner`.
- Add a language-neutral agent example using HTTP fetch.
- Add JavaScript and Python examples if practical.
- Update Finality hooks to use paid fetch wrappers.
- Add payment pending, settled, rejected, and provider-degraded states.
- Cache repeated data so users and agents do not pay for accidental duplicate
  polling requests.

### Phase 4: Production hardening

- Add request validation and response schemas.
- Make `DATA_MODE=mock` and `/v1/test/dummy` unavailable in production.
- Ensure production synthetic fallback is an explicit operator decision, with
  `meta.synthetic=true`, fallback reasons, UI/agent disclosure, and separate
  monitoring. The default production configuration must fail closed.
- Add tests proving synthetic responses contain `meta.synthetic=true` and are
  excluded from Bazaar and the public product catalog.
- Add per-payer, IP, endpoint, and concurrency limits.
- Add provider timeouts, caching, circuit breakers, and fallback selection.
- Redact payment signatures, API keys, and wallet secrets from logs.
- Persist settlement IDs and usage metrics, never mnemonics or raw secrets.
- Add health states for x402, providers, database, AI, and Indexer separately.
- Configure strict HTTPS CORS and expose only required x402 response headers.

### Phase 5: Testnet launch

- Run the complete endpoint suite with `DATA_MODE=mock` and no provider keys.
- Verify `GET /v1/test/dummy?operationId=...` covers every manifest operation.
- Verify missing keys, exhausted quotas, and upstream failures return either
  deterministic mock data only in explicitly enabled test mode or a clear
  provider error in live/production mode.
- Browser wallet: connect, sign, settle, receive real response.
- Autonomous agent: discover catalog, sign, settle, call repeatedly.
- Verify transactions in the Algorand Testnet explorer.
- Confirm the merchant receives Testnet USDC.
- Run a bounded load test against free provider limits.
- Publish the Bazaar catalog and integration examples.

## Definition of Done

- Finality is discoverable as a general intelligence service.
- Runtime configuration is present in both root `.env.local` and
  `x402-server/.env`; `.env.example` is treated only as a source template.
- All paid endpoints use real x402 Algorand USDC payments.
- GoPlausible performs verification and settlement.
- No self-hosted facilitator exists.
- No fake payment-proof route remains.
- Agents can discover and call endpoints without the web UI.
- Users can pay through a browser wallet.
- Market outputs are real and source-labeled.
- Every endpoint has a deterministic mock implementation for local testing.
- The single `/v1/test/dummy` endpoint is clearly synthetic, excluded from
  Bazaar, and disabled in production.
- Provider outages and exhausted credits never cause silent fake data in live
  or production mode.
- AI is optional and gracefully disabled without a configured model provider.
- Algorand on-chain intelligence is real, scoped, and separate from general
  market intelligence.
- No non-Algorand wallet or settlement implementation remains.
- No private keys, API keys, or raw signed payment payloads are logged.
- Documentation includes pricing, schemas, limits, provider attribution,
  Testnet setup, and the complete environment checklist.