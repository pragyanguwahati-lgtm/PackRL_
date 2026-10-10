# Product Requirements Document (PRD)
**Project:** PackRL_ · **Event:** IEEE Hackathon 2026 · Track 03.2 (The Learned Loop)

## 1. Objective
Ship **PackRL_ Studio**: an immersive 3D website where anyone can watch a Deep RL agent pack a shipping box next to the classical 3D First-Fit Decreasing (FFD) heuristic, on the same order, step by step. The website is the primary product; the trained model is its engine.

## 2. Problem
* 3D packing is NP-hard: n! orderings x 6 rotations x thousands of placements.
* Exact search is too slow for live conveyors; fixed heuristics leave 25-40% void space and never learn.

## 3. Users
* **Judges / visitors:** understand the problem and the win in under 60 seconds.
* **Logistics engineers:** vary box and order, compare density and latency.

## 4. Scope
**Website (core)**
* **Landing:** 3D packing hero with live HUD, Aceternity-style canvas background (dot field, beams, cursor spotlight), voxel density meters, editorial "how it works" rows, CTA.
* **Studio (`/studio`):** dual synced 3D viewports (FFD vs PackRL_), playback (play, pause, step, scrub, speed), seed / item count / box size controls, live metric deltas.
* **How it works (`/how-it-works`):** scroll-pinned voxel grid -> action mask -> reward explainer.
* **Results (`/results`):** density, void %, P95 latency charts over held-out orders.

**ML engine (supporting)**
* Gymnasium voxel env, Maskable PPO agent, NumPy FFD baseline, FastAPI service, replay exporter.

## 5. Functional Requirements
1. Replay JSON for both algorithms drives all visuals; site works with no live backend.
2. One shared clock and optional camera lock across both viewports.
3. Orbit/pan/zoom; items colored by placement order; translucent wireframe box; ghost of next placement.
4. Optional live mode: `POST /pack` for custom orders.
5. Mobile: single viewport with FFD / PackRL_ switch.
6. Hero may include an optional Spline object; the R3F packing scene remains the primary 3D element.

## 6. Success Metrics
| Metric | FFD Baseline | PackRL_ Target |
| :-- | :-- | :-- |
| Packing density | ~67.5% | >= 85% |
| Void space | ~32.5% | <= 15% |
| Decision latency | Exponential (exact) | < 50 ms |

**Website:** LCP < 2.5 s, hero interactive < 3 s, 60 fps on mid-range laptop, Lighthouse >= 90, reduced-motion fallback.
**Design:** passes Taste Skill pre-flight; no "AI template" tells (centered hero + pill + twin buttons + three equal cards).

## 7. Out of Scope
Auth, accounts, irregular meshes, real warehouse integration.

## 8. Build Workflow (Antigravity)
Agents read `DESIGN.md` and `rules.md` first. UI is generated with the Taste Skill (anti-slop), Aceternity UI components, canvas backgrounds, optional Spline; screenshot references inspire, never get cloned.
