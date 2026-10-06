# Authentication & Authorization — PackRL_

## 1. Current Decision
**No user accounts.** PRD scope excludes auth. The site and replays are public and read-only. This removes the largest class of risk (credential storage, sessions, account takeover).

## 2. Access Model
| Surface | Access | Protection |
| :-- | :-- | :-- |
| Landing, Studio (static replays), Results | Public | CDN, security headers |
| `POST /pack` (live mode) | Public, optional | Rate limit, input caps, CORS allowlist, timeout |
| `GET /benchmarks` | Public | Cached, read-only |
| Admin / training / export scripts | Team only, local or CI | Never exposed over HTTP |
| Deploy dashboards, repo, secrets | Team only | MFA, least privilege |

## 3. Live API Hardening (no auth)
* Per-IP rate limit (e.g. 30 req/min) plus a global concurrency cap.
* Optional shared `X-API-Key` for the web app's server-side calls only; never shipped to the browser.
* Strict request schema and size cap (see Threat model.md); 2 s compute timeout.
* CORS allowlist; reject unknown origins.
* Feature flag to turn live mode off instantly.

## 4. Team Account Security
* MFA on GitHub, Vercel, API host, and any cloud GPU account.
* Branch protection on `main`; no direct pushes; review before merge.
* Deploy tokens scoped to one project, stored as platform secrets, rotated after the event.
* Separate tokens per environment (dev / prod).

## 5. If Auth Is Added Later
* Use a managed provider (Auth.js, Clerk, or similar); **never build password storage**.
* OAuth/OIDC sign-in; `httpOnly`, `Secure`, `SameSite=Lax` session cookies; short-lived tokens.
* Roles: `visitor`, `member` (saved runs), `admin`. Enforce authorization **server-side** on every route, not in the UI.
* CSRF protection on state-changing routes; re-auth for sensitive actions.
* Log auth events without logging credentials or tokens.
