# Project Memory & Context

## State
* **Project:** PackRL_ · IEEE Hackathon 2026 · Track 03.2 · Team Tensor Bros
* **Status:** Phase M0, Phase 01 (Gymnasium env), Phase 02 (Vectorized action mask), Phase 03a (FFD baseline), Phase 03 (Bottom-first floor carpeting + strict physics retrain complete), Phase 04 (Replay exporter), and Phase 05-07 (Web + Studio loaded with live eval & benchmark presets) completed; running Next.js App Router on localhost:3000.
* **Focus:** Next up: Phase 08 (How It Works & Results routes) and scaling up timesteps (1M-5M steps).

## Decisions
* Voxel grids over continuous geometry; Maskable PPO with fixed item arrival sequence and gravity drop. Action = `(rotation 0-5, x, y)` flattened to `Discrete(6 * W * H)`.
* Website is the primary product: Next.js (App Router), React Three Fiber, Three.js, Motion.dev, Zustand, Zod, Tailwind CSS with `DESIGN.md` tokens.
* Replay JSON contract decouples ML from web; Zod validation at runtime.
* `DESIGN.md` is canonical; Taste Skill applied to all UI.
* Teal (`#00E5CC`) = PackRL_, orange (`#E8A33D`) = FFD. All metrics clearly tagged as illustrative until real benchmarks run.
* Security headers and strict CSP (no `unsafe-eval`, allowlisted origins) configured in `next.config.ts`.

## Completed Deliverables
* `architecture.md`: Updated action space, observation dict, API caps, and replay contract.
* `engine/items.py`: 3D box model, 6 orthogonal rotations, and synthetic item generator.
* `engine/mask.py`: Vectorized action masking (< 5ms check verifying boundary limits, collisions, and bottom support).
* `engine/env.py`: Gymnasium `PackEnv` with normalized Dict observations (`grid`, `next_items`, `volume_left`) and multi-objective rewards.
* `engine/baseline.py`: 3D First-Fit Decreasing (FFD) baseline in NumPy.
* `engine/train.py`: Maskable PPO (`sb3-contrib`) training script with TensorBoard logging.
* `engine/export_replays.py`: Replay exporter that generates real simulation runs into `web/public/replays/eval_*.json`.
* `tests/test_env.py`: Pytest suite (5/5 tests passing).
* `models/packrl_v1.zip`: 120,000-step Maskable PPO policy checkpoint trained with floor-first, inverted pyramid penalties, and contact clustering bonuses.
* `web/lib/replay.ts`: Zod schema and TypeScript types for replay verification.
* `web/lib/store.ts`: Synchronized playback Zustand store.
* `web/public/replays/mock_packrl.json` & `mock_ffd.json`: Curated benchmark replays showcasing PackRL packing 7 boxes (87.5% density) vs FFD packing 5 boxes (66.7% density with 3 overflowed items).
* `web/public/replays/eval_packrl.json` & `eval_ffd.json`: Exported simulation replays from real engine execution.
* `web/app/page.tsx` & components: Landing page with DotField, HeroScene, Hud, VoxelMeter, editorial rows.
* `web/app/studio/page.tsx` & `web/components/scene/StudioViewport.tsx`: Dual-viewport interactive comparison studio with real-time 3D side overflow staging pads (hazard pad, neon red parcel models, dimensional tags, and overflow badges) demonstrating unplaced parcel rejection for FFD.
* `web/components/ui/MetricDeltas.tsx`: Capacity readout displaying boxes placed deltas (+2 extra boxes for RL) and overflow tallies.

* `web/lib/packer.ts`: Dynamic multi-objective packing engine with container catalog (`S-10`, `M-20`, `L-30`, `XL-40`, `XXL-50`), auto-selection of smallest viable container with 0 RL overflow, `createCustomContainer()` for user-defined arbitrary main box sizes, floor-first placement policy, and heuristic FFD benchmark.
* `web/app/api/pack/route.ts`: API endpoint accepting custom box dimensions (`W`, `D`, `H` in cm, quantities, labels) and optional `customContainer` dimensions (`w`, `d`, `h`), returning paired `PackRL` and `FFD` replays with physical container specifications.
* `web/components/studio/CustomOrderBuilder.tsx`: Interactive studio table allowing users to input arbitrary box dimensions (cm), select container auto-sizing or define a custom main container ($W \times D \times H$ in cm) with real-time volume calculations and presets, and trigger real-time solving.
* `web/components/scene/StudioViewport.tsx`: Enhanced 3D viewport rendering physical container dimensions in the header (e.g. `[30×24×20 cm]` or custom `[35×25×20 cm]`) and 3D `<Html>` badges hovering over placed boxes showing user labels and dimensions (e.g. `Box 1 [12×14×10 cm]`).

## Next Actions
1. Phase 08: Build `/how-it-works` (voxel -> action mask -> reward explainer) and `/results` (benchmark metrics).
2. Long training run (1M - 5M timesteps) with reward weight tuning for maximum density across diverse container sizes.
