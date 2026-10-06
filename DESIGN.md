# DESIGN.md — PackRL_
> Canonical visual spec. Agents read this before writing UI and apply Taste Skill anti-slop rules on top.

## 1. Atmosphere
A **lab instrument**, not a SaaS template: quiet, exact, editorial. The 3D box is the protagonist; the interface is its readout. Left-aligned, asymmetric, hairlines instead of cards.
* **Dials (Taste Skill header settings):** layout variance HIGH, motion MEDIUM-HIGH (tied to data), visual density LOW-MEDIUM.

## 2. Color
| Role | Token | Hex |
| :-- | :-- | :-- |
| Canvas | `--bg` | `#0E1218` |
| Surface | `--panel` | `#141A23` |
| Hairline | `--line` | `#222B38` |
| Text | `--text` | `#E6EBF2` |
| Muted | `--muted` | `#8A96A8` |
| PackRL_ | `--teal` | `#00E5CC` |
| FFD baseline | `--orange` | `#E8A33D` |
Teal and orange mean PackRL_ and FFD only. No purple/blue AI gradients, no pure `#000`. One exception: a faint (<=10% teal) cursor spotlight on the hero.

## 3. Typography
Display: Bricolage Grotesque 700, tight tracking, `clamp(52px, 10.5vw, 138px)`. Body: Geist 400/500, 17px, max 52ch. Data: Geist Mono, tabular. Banned: Inter, Roboto, Arial.

## 4. Components
* **Viewport:** hairline border, mono caps label, translucent wireframe box, items colored by placement order, ghost next placement.
* **HUD:** mono STEP / DENSITY / LATENCY readout over the scene, synced to playback.
* **Voxel meter:** 10x10 cells filling from the bottom (gravity), one per algorithm.
* **Editorial rows:** numbered, hairline-separated, instead of card grids.
* **CTA:** large text link with arrow; no pills, no twin buttons.

## 5. Visual Stack
* **Aceternity UI:** Spotlight, Background Beams, Bento; re-themed to tokens.
* **Canvas background:** dot field that lights near the cursor, with travelling beams.
* **Spline:** optional hero accent object; never replaces the packing scene.
* **Graphics:** R3F / Three.js; WebGPU behind a feature check with WebGL fallback.
* **Motion.dev:** reveals (24px rise + fade), number count-ups, voxel stagger, scroll-scrubbed timeline. 200-800 ms, ease-out.

## 6. Layout
12-col, 1200px max, 24px gutters. Hero text bottom-left, scene bleeds right. Vary rhythm: full-bleed, 5/7 split, single column. Section padding 96-150px desktop, 72px mobile.

## 7. Depth
Flat. Hairlines and tone shifts; one soft shadow under the box. No glassmorphism.

## 8. Do / Don't
DO use real or clearly-labelled illustrative data, one focal point per screen. DON'T center everything, use emoji, stock gradients, lorem ipsum, or "Revolutionize / Seamless / Next-gen" copy.

## 9. Responsive & Accessibility
Desktop dual viewport; tablet stacked; mobile single viewport with FFD / PackRL_ switch, HUD on one line, tap targets >= 44px. Honor `prefers-reduced-motion` (static scene, no beams). AA contrast.

## 10. Agent Prompt
"Build `<component>` for PackRL_. Follow `/DESIGN.md`. Apply Taste Skill anti-slop rules. Motion for DOM, R3F for 3D, Aceternity and Bklit UI primitives re-themed to tokens. Run pre-flight before finishing."
