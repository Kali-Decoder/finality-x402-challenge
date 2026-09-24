# finality-x402-challenge
# Finality Market Intelligence

Finality is a market-intelligence resource server for humans and autonomous agents. Its canonical public API is the standalone Hono service in `x402-server/`. Paid requests use exact USDC ASA transfers on Algorand Testnet and are verified and settled only by the hosted GoPlausible facilitator.

The Next.js application is a client of this service. It is not the payment authority and must never receive an agent mnemonic.

## Merchant quick start

Requirements: Node.js 20+, a dedicated Algorand Testnet merchant account opted into USDC ASA `10458941`, Testnet ALGO for fees, and Testnet USDC for end-to-end client tests.

```bash
npm install
cp .env.example .env.local
mkdir -p x402-server
cp .env.example x402-server/.env
```

Set `X402_PAYTO_ADDRESS` in `x402-server/.env`, then run `npm run dev:x402`. Locally the server listens on `http://localhost:4021`. Production merchant: [https://finality-x402-backend.onrender.com](https://finality-x402-backend.onrender.com). Production rejects `DATA_MODE=mock` and `ENABLE_DUMMY_ENDPOINT=true`.

Run the services separately in two terminals:

```bash
npm run dev:merchant
npm run dev:frontend
```

Or start both together:

```bash
npm run dev:all
```

The corresponding executable command files are `scripts/run-merchant.sh`, `scripts/run-frontend.sh`, and `scripts/run-finality.sh`. Production client: [https://finality.accuracy.wtf](https://finality.accuracy.wtf). Locally: wallet client at `http://localhost:3000` or Swagger UI at `http://localhost:3000/docs`. The complete endpoint reference is in `docs/api-endpoints.md`.

## Public discovery

| Free route | Purpose |
| --- | --- |
| `GET /health` | Component health and configured modes |
| `GET /info` | Service, payment rail, and discovery links |
| `GET /v1/catalog` | Agent-readable prices, limits, examples, and operation IDs |
| `GET /v1/openapi.json` | OpenAPI 3.1 document |

`GET /v1/test/dummy?operationId=...` is available only when explicitly enabled outside production. It is excluded from the catalog and always labels output as synthetic.

All paid product endpoints, prices, limits, discovery metadata, and operation IDs live in `x402-server/registry/endpoints.ts`. Agents should read the catalog or OpenAPI first. Humans, browser clients, and autonomous agents use the same public HTTP contract. Algorand reads use [Nodely](https://nodely.io) public Testnet algod and Indexer.

## Payment contract

1. Call a paid route without payment and receive HTTP 402 plus `Payment-Required`.
2. Build and sign the exact AVM payment group in the user or agent wallet.
3. Retry with `Payment-Signature`.
4. GoPlausible verifies and settles the payment.
5. Only then does Finality call a provider and compute the response.

No `X-Payment-Proof`, payer attestation, message-signature shortcut, fallback facilitator, or merchant-held mnemonic is accepted.

```bash
curl -i -X POST http://localhost:4021/v1/signals \
  -H 'content-type: application/json' \
  -d '{"marketType":"crypto","symbols":["BTC","ETH"],"interval":"1h","limit":100}'
```

Language-neutral agent flow:

```text
response = HTTP.POST("/v1/signals", json=request)
if response.status == 402:
  requirement = decode(response.header["Payment-Required"])
  signed_group = agent_algorand_wallet.sign_exact_avm(requirement)
  response = HTTP.POST("/v1/signals", json=request,
                       headers={"Payment-Signature": signed_group})
assert response.status == 200
receipt = response.header["Payment-Response"]
```

## Data modes

- `DATA_MODE=live`: real providers only; failures return explicit provider errors.
- `DATA_MODE=mock`: deterministic fixtures for local development and tests; forbidden in production.
- `DATA_MODE=auto`: live first; synthetic fallback only when `ALLOW_MOCK_FALLBACK=true`.

Every response identifies source, provider, as-of time, freshness, limitations, availability track, data mode, and whether it is synthetic. Durable core paths use Binance public REST, Alternative.me, AlgoNode Indexer, deterministic calculations, and optionally local Ollama. AI returns 503 when its configured backend is unavailable unless explicit synthetic fallback is enabled.

## Environment and verification

`.env.example` is a committed blank template only. Next.js reads `.env.local`; the merchant reads `x402-server/.env`. Never commit either runtime file.

Required for the paid Testnet service: `X402_PAYTO_ADDRESS`, the GoPlausible URL, Algorand Testnet, ASA `10458941`, and one live provider path. The durable crypto baseline needs no provider key. Use `X402_ALLOWED_ORIGINS` as a comma-separated allowlist.

```bash
npm run build:x402
npm run test:x402
npx tsc --noEmit
```

The suite covers discovery, OpenAPI, all deterministic operation fixtures, production dummy-route exclusion, validation errors, and unpaid x402 challenges. A real paid smoke test additionally requires a funded wallet and network access to GoPlausible and Algorand Testnet.

## Security rules

- The merchant stores no mnemonic, private key, or raw signed payment payload.
- GoPlausible is the only facilitator; live mode fails closed.
- Inputs, body size, rate, concurrency, provider timeouts, and repeated upstream calls are bounded.
- Algorand DeFi output reports only Indexer activity and never invents pool or liquidity metrics.
# Finality

