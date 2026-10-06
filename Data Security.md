# Data Security — PackRL_

## 1. Data Inventory & Classification
| Data | Example | Class | Notes |
| :-- | :-- | :-- | :-- |
| Synthetic orders | 50,000+ generated item sets | Public | Generated, no real customers |
| Replay JSON | per-step placements, density, ms | Public | Integrity-critical |
| Benchmark results | density, void %, P95 latency | Public | Must match logged runs |
| Model files | Maskable PPO `.zip` | Internal | See section 3 |
| Secrets | API keys, deploy tokens | Secret | Never in repo |
| Analytics (if any) | page views | Internal | Anonymous, no fingerprinting |
**No personal data is collected or stored.** If real order data is ever used, it must be anonymized (strip customer, address, SKU names) before leaving its source and kept out of the repo.

## 2. In Transit & At Rest
* TLS everywhere; no mixed content.
* Static replays served from the CDN; API traffic over HTTPS only.
* No database in v1. If one is added: encrypted at rest, least-privilege credentials, no public access.

## 3. Model File Safety (important)
Stable-Baselines3 `.zip` files contain pickled data. **Loading an untrusted model file can execute arbitrary code.**
* Load only models we trained ourselves.
* Store a SHA-256 checksum next to each model; verify before loading.
* The API never accepts uploaded models or file paths from clients.
* Keep model files out of the public web bundle; the browser only receives replay JSON.

## 4. Input & Output Handling
* Validate all API input (Pydantic) and all loaded replays (Zod); reject on mismatch.
* Replay fields are numbers and enums only; no free-text rendered as HTML.
* Cap replay size (e.g. <= 2 MB, <= 500 steps) so a bad file cannot stall a GPU or tab.
* API errors are generic to clients; details only in server logs.

## 5. Secrets Management
* `.env` files local only; production secrets in the hosting platform's secret store.
* Pre-commit secret scan (gitleaks or similar) and GitHub secret scanning enabled.
* Rotate all tokens after the hackathon.

## 6. Logging & Retention
* Log request ID, route, status, latency; **do not log** request bodies, IPs beyond rate-limit windows, or tokens.
* Keep logs <= 30 days; delete training artifacts you no longer need.

## 7. Backups & Integrity
* Source of truth is git. Tag the commit that produced the demo replays and model.
* Record seed, library versions and commit hash alongside every benchmark so results are reproducible and verifiable.
