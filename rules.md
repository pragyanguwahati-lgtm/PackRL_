# AI & Developer Directives
(Loaded with `/DESIGN.md` by Antigravity / Claude Code agents.)

## 0. Agent Workflow
1. Read `PRD.md`, `architecture.md`, `DESIGN.md`, `memory.md` before any task.
2. UI work: apply the Taste Skill (anti-slop) and follow `DESIGN.md`. With a screenshot reference, extract layout, type and spacing, then adapt to our tokens.
3. Run the skill's pre-flight check before calling a UI task done.
4. No placeholders, TODO stubs or truncated files. End with a short diff summary and update `memory.md`.

## 1. Python (engine)
* Python 3.10+, full type hints, NumPy state, Black (88).
* Strict Gymnasium API; `step()` -> `obs, reward, terminated, truncated, info`.
* Mask decoupled from physics and < 5 ms; vectorized grid ops, no nested overlap loops.
* Docstring every reward and rotation function.

## 2. TypeScript / Web
* `strict: true`, no `any`; Zod-validate replay JSON at load; replay JSON is the only engine interface.
* 3D in `components/scene/`, effects in `components/fx/`. Reuse vectors, `InstancedMesh`, never allocate in `useFrame`.
* Motion for DOM, `useFrame` for 3D; no competing animation libraries.
* Aceternity components are copied in and re-themed to tokens; no untouched defaults.
* Spline and WebGPU are optional, flag-gated, with fallbacks.
* Accessibility: keyboard timeline, AA contrast, chart text alternatives, reduced-motion fallback.

## 3. Design Discipline
* Tokens from `DESIGN.md` only. Teal = PackRL_, orange = FFD, nothing else.
* Banned: Inter, purple gradients, strong glows, centered-everything heroes, three-equal-card rows, filler copy.
* Label illustrative data as illustrative until real benchmarks exist.

## 4. Process
Conventional commits; each phase ends demoable; static replays first, live API later.
