# Project Memory & Context

## State
* **Project:** PackRL_ · IEEE Hackathon 2026 · Track 03.2 · Team Tensor Bros
* **Status:** `architecture.md` modernized; Phase M0, Phase 05/06 (Landing Page), and Phase 07 (Studio with dual synced viewports) completed; running on Next.js App Router on localhost:3000; pushed to GitHub (`main` -> https://github.com/pragyanguwahati-lgtm/PackRL_.git).
* **Focus:** Next up: Phase 08 (How It Works & Results) and Phase 01 (Python Gymnasium environment).

## Decisions
* Voxel grids over continuous geometry; Maskable PPO with fixed item arrival sequence and gravity drop. Action = `(rotation 0-5, x, y)` flattened to `Discrete(6 * W * H)`.
* Website is the primary product: Next.js (App Router), React Three Fiber, Three.js, Motion.dev, Zustand, Zod, Tailwind CSS with `DESIGN.md` tokens.
* Replay JSON contract decouples ML from web; Zod validation at runtime.
* `DESIGN.md` is canonical; Taste Skill applied to all UI.
* Teal (`#00E5CC`) = PackRL_, orange (`#E8A33D`) = FFD. All metrics clearly tagged as illustrative until real benchmarks run.
* Security headers and strict CSP (no `unsafe-eval`, allowlisted origins) configured in `next.config.ts`.

## Completed Deliverables
* `architecture.md`: Updated action space, observation dict, API caps, and replay contract.
* `web/lib/replay.ts`: Zod schema and TypeScript types for replay verification.
* `web/lib/store.ts`: Synchronized playback Zustand store.
* `web/public/replays/mock_packrl.json`: 8 items, 6x4x4 box, 87.5% density, zero collisions, marked illustrative.
* `web/public/replays/mock_ffd.json`: 8 items, 6x4x4 box, 66.7% density, zero collisions, marked illustrative.
* `web/app/page.tsx` & components: Landing page ported from `PackRL_ Landing Page v3.html` with:
  - `DotField.tsx`: Canvas dot grid, travelling beams, and cursor spotlight.
  - `HeroScene.tsx`: React Three Fiber packing scene with translucent box wireframe, grid, animated falling items, and step HUD synchronization.
  - `Hud.tsx`: Real-time STEP, DENSITY, LATENCY readout.
  - `VoxelMeter.tsx`: 10x10 gravity-filled cells and count-up numbers.
  - Editorial how-it-works rows and studio CTA routing directly to `/studio`.
* `web/app/studio/page.tsx` (Phase 07): Flagship interactive studio with:
  - `StudioViewport.tsx`: Dual 3D viewports (FFD vs PackRL_) with OrbitControls, translucent wireframe box, placed parcels, next-step ghost preview, and live HUD.
  - `PlaybackDeck.tsx`: Synchronized timeline scrubber (0..N), Play/Pause, Step Back/Forward, Restart, Speed dial (0.5x, 1x, 2x), and Camera Lock toggle.
  - `MetricDeltas.tsx`: Live comparison readout (Density Delta, Void Reduction, Latency Multiplier, Container Overflow).
  - Mobile segmented switch: Seamlessly switches between FFD and PackRL_ on small viewports.
  - Verified across viewports (1440x900 desktop, 375x812 mobile) with Playwright.

## Next Actions
1. Phase 08: Build `/how-it-works` (voxel -> action mask -> reward explainer) and `/results` (benchmark charts).
2. Phase 01 (engine): Setup Python venv with Gymnasium, PyTorch, Stable-Baselines3, sb3-contrib, and draft `packrl_env.py`.
