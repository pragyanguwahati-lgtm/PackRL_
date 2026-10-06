# Implementation Roadmap — PackRL_

## How to use this file
* One phase per Antigravity session. Paste the phase's **Agent prompt**, wait, then run **Your review**.
* A phase is finished only when its **Done when** checks pass. Then: commit to git, have the agent update `memory.md`, move on.
* Every prompt starts with: *"Read PRD.md, architecture.md, rules.md, DESIGN.md, training.md, memory.md and the security files first. Follow rules.md."*
* Two tracks: **ML (01-04)** and **Web (M0, 05a-08)**. Run M0 first so web is never blocked by training.
* If a check fails, fix it before continuing. Never stack phases on a broken one.

---
## Phase M0 · Mock Replay (do first, 15 min)
**Goal:** give the web track realistic data before the model exists.
**Deliverables:** `web/public/replays/mock_ffd.json`, `mock_packrl.json`, `web/lib/replay.ts` (types + Zod schema).
**Done when:** both files validate against the schema in `architecture.md`; PackRL mock reaches ~87% density, FFD mock ~67%.
**Agent prompt:** "Create two mock replay JSON files (8 items, 6x4x4 box) matching the Replay contract, plus the Zod schema. Mark them `illustrative`."
**Your review:** open the JSON; item positions don't overlap.

## Phase 01 · Environment
**Goal:** a correct voxel packing simulator.
**Deliverables:** `engine/env/packrl_env.py`, `tests/test_env.py`.
**Done when:** `check_env` passes; unit tests prove no overlaps, no out-of-bounds, no floating items; 1,000 random valid episodes run without error.
**Agent prompt:** "Implement the Gymnasium env per training.md sections 2-3 (action = rotation, x, y; z by drop). Add pytest tests for collisions, bounds and support."
**Your review:** run `pytest`; render one episode as text and eyeball it.

## Phase 02 · Action Masking
**Goal:** the agent can only choose legal moves, fast.
**Deliverables:** `engine/env/mask.py`, tests.
**Done when:** mask matches brute-force legality on 500 random states; runs < 5 ms; random masked policy never gets an invalid-action penalty.
**Agent prompt:** "Implement a vectorized `action_masks()` and tests comparing it to a brute-force checker."
**Your review:** check the timing printout.

## Phase 03a · FFD Baseline (do before training)
**Goal:** the yardstick everything is measured against.
**Deliverables:** `engine/baselines/ffd.py`, `engine/eval/benchmark.py`.
**Done when:** FFD runs on 100 held-out orders; density lands roughly 60-75%; P95 latency logged.
**Agent prompt:** "Implement 3D First-Fit Decreasing in NumPy and a benchmark script that logs density, void % and P95 ms."
**Your review:** if FFD scores far from ~67%, check the item generator before blaming FFD.

## Phase 03 · Training
**Goal:** a policy that beats FFD.
**Deliverables:** `engine/agents/train.py`, `models/packrl_v1.zip` + SHA-256, TensorBoard logs.
**Done when:** (1) 50k-step smoke test runs clean; (2) full run's eval density > FFD on held-out seeds; (3) target >= 85% density, but an honest lower number is acceptable.
**Agent prompt:** "Write train.py per training.md section 4. Run only a 50k-step smoke test and stop; show me the logs."
**Your review:** watch the reward curve rise; then launch the long run yourself. Tune alpha/beta/gamma/delta using training.md section 5.

## Phase 04 · Benchmarks & Replay Export
**Goal:** real numbers and real replays for the site.
**Deliverables:** `engine/export_replays.py`, `web/public/replays/*.json`, `results/benchmark.md`.
**Done when:** replays validate against the Zod schema; benchmark file lists seeds, versions, git commit, density, void %, P95 ms for both algorithms.
**Agent prompt:** "Export replay JSON for 5 fixed seeds from both algorithms and write results/benchmark.md."
**Your review:** replace every "illustrative" number on the site with these.

---
## Phase 05a · Design Lock
**Goal:** agree on the look before building it.
**Deliverables:** final `DESIGN.md`, 3-5 reference screenshots in `/design/refs`, approved landing v3.
**Done when:** you sign off on landing v3; Taste Skill dials noted in DESIGN.md.
**Agent prompt:** "Review DESIGN.md against the reference screenshots and list conflicts; do not write UI yet."
**Your review:** accept or edit the list.

## Phase 05 · Web Foundation
**Goal:** a running app skeleton.
**Deliverables:** `web/` (Next.js, TS, Tailwind, Motion, R3F), tokens from DESIGN.md, Zustand store, security headers.
**Done when:** `npm run build` passes; one R3F scene renders the mock replay; CSP and headers present.
**Agent prompt:** "Scaffold web/ per architecture.md. Ask before installing anything not listed."
**Your review:** run the dev server; confirm no console errors.

## Phase 06 · Landing Page
**Goal:** the hero and story.
**Deliverables:** landing route with 3D hero + HUD, DotField/beams/spotlight, voxel meters, how-it-works rows, CTA.
**Done when:** matches DESIGN.md; Taste Skill pre-flight passes; reduced-motion works; LCP < 2.5 s; mobile layout clean.
**Agent prompt:** "Build the landing page from DESIGN.md using the mock replay; port landing v3's structure."
**Your review:** test on your phone and with reduced motion on.

## Phase 07 · Studio (hackathon cut line)
**Goal:** the core interactive demo.
**Deliverables:** `/studio` with dual synced viewports, timeline controls, metric deltas.
**Done when:** play/pause/step/scrub keep both scenes in sync; metrics match replay summaries; works on mobile with the switch.
**Agent prompt:** "Build /studio per PRD section 4 using the store in architecture.md."
**Your review:** compare shown numbers with `results/benchmark.md`.

## Phase 08 · How It Works + Results
**Goal:** explain and prove.
**Deliverables:** `/how-it-works`, `/results` with Bklit charts and text alternatives.
**Done when:** charts read real benchmark data; keyboard accessible; AA contrast.

## Phase 09 · Live Mode (optional)
**Goal:** custom orders via the API.
**Deliverables:** FastAPI `/pack` with limits from `Threat model.md`, kill-switch flag.
**Done when:** oversized payloads rejected; rate limit works; static fallback verified with live mode off.

## Phase 10 · Polish & Ship
**Goal:** demo-ready.
**Deliverables:** Vercel deploy, optional WebGPU/Spline flags, demo script.
**Done when:** every item in `Security checklist.md` is ticked; demo numbers match logged runs; tokens rotated after the event.

---
## Cut Line
Must ship: M0, 01-04, 05a, 05-07. Everything else is a bonus.
