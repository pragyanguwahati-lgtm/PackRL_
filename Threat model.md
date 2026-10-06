# Threat Model — PackRL_

## 1. System Summary
Static Next.js site (3D viewer, public) + optional FastAPI `/pack` endpoint running the trained Maskable PPO model and an FFD baseline. Data are synthetic. Build is assisted by AI coding agents.

## 2. Actors
* **Casual visitor / judge** (legitimate)
* **Opportunistic abuser** (bots, scrapers, load)
* **Malicious API client** (crafted payloads)
* **Supply-chain attacker** (poisoned package, script, or skill)
* **Insider mistake** (leaked key, bad deploy)

## 3. Entry Points
Browser UI controls (seed, N, box size) · `POST /pack` · replay JSON files · third-party scripts/fonts/embeds (Spline) · npm/pip dependencies · agent skills and rules files · GitHub/Vercel accounts.

## 4. Threats (STRIDE) & Mitigations
| # | Threat | Type | Impact | Mitigation |
| :-- | :-- | :-- | :-- | :-- |
| T1 | Flood `/pack` with expensive orders | DoS | Site/API down at demo | Rate limit, concurrency cap, 2 s timeout, input caps, live-mode flag to fall back to static |
| T2 | Oversized or malformed payload (huge N, negative dims, NaN) | Tampering/DoS | Crash, memory blowup | Pydantic bounds: N <= 200, dims 1-100, box <= 64 per axis, payload <= 64 KB |
| T3 | Malicious model file loaded (pickle) | Elevation | Remote code execution | Load only own models, checksum verify, never accept uploads |
| T4 | Tampered replay JSON shows false results | Tampering | Credibility loss | Schema validation, commit hashes, reproducible seeds, replays served from our origin |
| T5 | XSS via replay/item labels | Tampering | Script injection | Numbers/enums only, no `innerHTML`, strict CSP |
| T6 | Compromised npm/pip package | Supply chain | Backdoor, key theft | Lockfiles, pinned versions, `npm audit` / `pip-audit`, review new deps, minimal install scripts |
| T7 | Third-party script/embed (Spline, CDN) compromised or tracking | Info disclosure | Data leak, defacement | CSP allowlist, lazy-load behind flag, SRI where possible, self-host when feasible |
| T8 | Leaked secrets in repo or logs | Info disclosure | Account takeover | Env vars, secret scanning, no body logging, rotate after event |
| T9 | CORS misconfiguration | Info disclosure | Abuse from other origins | Origin allowlist, no wildcard with credentials |
| T10 | Client GPU/CPU exhaustion (huge scene, shader loops) | DoS | Frozen tab | Instancing, replay size cap, DPR cap, reduced-motion fallback |
| T11 | Malicious or prompt-injected agent skill/rules file | Elevation | Agent runs harmful commands | Review third-party skills and DESIGN.md before use, restrict agent permissions, human approval for shell/network/deploy |
| T12 | Account takeover (GitHub/Vercel) | Spoofing | Site defacement | MFA, branch protection, scoped tokens |
| T13 | Inflated benchmark claims | Repudiation | Judge distrust | Log seeds, versions, held-out set, publish methodology |

## 5. Out of Scope / Accepted Risks
* No user data, so no breach-of-PII scenario.
* Public replays and results are intentionally world-readable.
* Residual risk on third-party CDNs is accepted for the demo window with CSP and fallback.

## 6. Review Cadence
Revisit when: live mode ships, auth is added, real data is introduced, or a new third-party script is added.
