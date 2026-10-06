# Security Checklist — PackRL_
Tick before each milestone. Unticked items block the demo.

## Repo & Accounts
- [ ] MFA on GitHub, Vercel, API host, cloud GPU accounts
- [ ] Branch protection on `main`; PR review required
- [ ] `.gitignore` covers `.env*`, model weights, datasets, logs
- [ ] Secret scanning enabled (GitHub + pre-commit)
- [ ] Lockfiles committed (`package-lock.json` / `uv.lock` or `requirements.txt` with hashes)

## Dependencies & Agents
- [ ] `npm audit` and `pip-audit` clean or exceptions documented
- [ ] Every new dependency reviewed (name, maintainer, downloads, install scripts)
- [ ] Third-party skills, rules and DESIGN.md files read before adding to Antigravity
- [ ] Agent permissions limited; shell, network and deploy actions need approval

## Engine
- [ ] Models loaded only from our artifacts; SHA-256 verified
- [ ] No pickle/model upload paths exposed
- [ ] Seeds, versions and commit hash logged with every benchmark
- [ ] Benchmark uses held-out data; methodology written down

## API (if live mode enabled)
- [ ] Pydantic bounds: N <= 200, dims 1-100, box <= 64/axis, payload <= 64 KB
- [ ] Rate limit + concurrency cap + 2 s timeout
- [ ] CORS allowlist (no `*`)
- [ ] Generic error messages; no stack traces to clients
- [ ] Logs exclude bodies and tokens
- [ ] Live-mode kill switch tested

## Web
- [ ] Zod validation on every replay load; size cap enforced
- [ ] No `dangerouslySetInnerHTML` with replay data
- [ ] CSP set, no `unsafe-eval`; third-party hosts allowlisted
- [ ] Security headers verified (securityheaders.com or curl)
- [ ] Spline/WebGPU behind flags with fallbacks
- [ ] `prefers-reduced-motion` path works; huge-scene guard in place

## Deploy & Demo Day
- [ ] Production env vars set in platform secret store, not in code
- [ ] HTTPS and HSTS active; no mixed content
- [ ] Static-replay fallback verified with live mode OFF
- [ ] Demo numbers match logged runs
- [ ] Tokens rotated after the event
