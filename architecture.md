# System Architecture

## 1. Overview
`Python ML engine` -> `replay.json` / `FastAPI /pack` -> `Next.js 3D web app`
Closed learning loop inside the engine: State Observation -> Action Masking -> Policy Inference -> Environment Step -> Reward.

## 2. ML Engine (Python)
* **Env (Gymnasium):** 3D occupancy tensor (`(1, W, H, D)`) + `next_items` (next 3-5 item dims + fragility) + `volume_left` normalized to [0, 1]. Validates bounds, collisions, and stable bottom support.
* **Agent:** Maskable PPO (`sb3-contrib`, PyTorch). Items arrive in fixed sequence (e.g. sorted by volume descending or conveyor order). Action = `(rotation 0-5, x, y)`; `z` is determined by dropping the item until supported. Flattened action space: `Discrete(6 * W * H)` (e.g., 6x10x10 = 600).
* **Mask layer:** Decoupled from physics; filters invalid rotation/cell placements prior to softmax (< 5 ms vectorized check).
* **Reward:** `r = alpha * d(V_packed/V_box) + beta * support - gamma * invalid - delta * unplaced` (initial: `alpha=1.0, beta=0.2, gamma=0.5, delta=1.0`).
* **Baseline:** NumPy 3D FFD.
* **Exporter:** `engine/export_replays.py` logs per-step placements, density, and latency to replay JSON.
* **API:** `POST /pack {seed, n, box}` -> `{ffd, rl}`; `GET /benchmarks`. Input capped (N <= 200, dims 1-100, box <= 64/axis, 2s timeout).

## 3. Replay Contract
```ts
type Replay = {
  algo: "ffd" | "packrl";
  box: [number, number, number]; // [W, H, D]
  items: { id: number; dims: [number, number, number] }[];
  steps: {
    itemId: number;
    rot: 0 | 1 | 2 | 3 | 4 | 5;
    pos: [number, number, number]; // [x, y, z]
    density: number; // 0.0 - 100.0 %
    ms: number;
  }[];
  summary: {
    density: number;
    void: number;
    p95ms: number;
    boxes: number;
  };
  illustrative?: boolean;
};
```

## 4. Web App (Next.js App Router, TypeScript)
* **3D / graphics:** React Three Fiber + drei, `InstancedMesh` items. WebGPU renderer only behind a feature check with WebGL fallback. Optional Spline hero object via `@splinetool/react-spline`, lazy-loaded behind a flag.
* **Animation:** Motion (motion.dev) for DOM, scroll and number transitions; `useFrame` for 3D easing.
* **UI:** Aceternity UI (Spotlight, Background Beams, Bento) for effects and chrome; Bklit UI for charts and metric cards; Tailwind tokens from `DESIGN.md`.
* **Canvas layer:** `DotField` canvas background (dots, beams, cursor spotlight).
* **State:** Zustand `{replayFFD, replayRL, t, playing, speed, seed, cameraLock}`; one clock drives both scenes.
* **Data:** static `/public/replays/*.json`; live mode calls FastAPI. **Deploy:** Vercel (+ Render/Fly for API).

## 5. Folder Layout
```
/DESIGN.md  /rules.md  /PRD.md  /memory.md
/engine  env/ agents/ baselines/ export_replays.py api.py
/web     app/ (landing, studio, how-it-works, results)
         components/ (scene/, fx/, ui/, metrics/)  lib/ (replay.ts, store.ts)  public/replays/
```

## 6. Performance Budget
< 300 draw calls, DPR cap 2, Canvas lazy-loaded, fx layers pause when tab hidden, 3D and fx static under `prefers-reduced-motion`, Spline never blocks first paint.
