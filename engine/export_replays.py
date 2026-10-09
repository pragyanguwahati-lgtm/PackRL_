"""
Export real simulation replays for FFD and PackRL_ agent to web/public/replays.
Outputs JSON adhering to the Zod Replay schema in web/lib/replay.ts.
"""

import json
import os
import time
from typing import Any, Dict, List
import numpy as np
from sb3_contrib import MaskablePPO

from engine.env import PackEnv
from engine.items import Item, generate_item_stream, get_orientations
from engine.mask import decode_action
from engine.baseline import FFDBaseline


def run_packrl_episode(model_path: str, seed: int, num_items: int = 8, box_dims=(6, 4, 4)) -> Dict[str, Any]:
    env = PackEnv(box_dims=box_dims, num_items=num_items, seed=seed)
    obs, info = env.reset(seed=seed)
    
    # Store items
    items = [{"id": it.id, "dims": list(it.dims)} for it in env.items]
    
    model = None
    if os.path.exists(model_path + ".zip") or os.path.exists(model_path):
        model = MaskablePPO.load(model_path)

    steps = []
    terminated = False
    
    while not terminated:
        action_masks = env.action_masks()
        if not np.any(action_masks):
            break

        step_start = time.perf_counter()
        if model is not None:
            action, _ = model.predict(obs, action_masks=action_masks, deterministic=True)
            action = int(action)
        else:
            # Fallback: greedy valid action
            action = int(np.where(action_masks)[0][0])

        current_item = env.items[env.item_idx]
        rot, x, y = decode_action(action, box_dims)

        obs, reward, terminated, truncated, info = env.step(action)
        step_elapsed_ms = (time.perf_counter() - step_start) * 1000.0

        if env.packed_items:
            last_placement = env.packed_items[-1]
            steps.append({
                "itemId": last_placement["itemId"],
                "rot": last_placement["rot"],
                "pos": last_placement["pos"],
                "density": round(info["density"], 2),
                "ms": round(step_elapsed_ms, 2)
            })

    step_latencies = [s["ms"] for s in steps] if steps else [0.0]
    p95_ms = float(np.percentile(step_latencies, 95)) if step_latencies else 0.0

    return {
        "algo": "packrl",
        "box": list(box_dims),
        "items": items,
        "steps": steps,
        "summary": {
            "density": round(info["density"], 1),
            "void": round(info["void"], 1),
            "p95ms": round(p95_ms, 2),
            "boxes": 1,
        },
        "illustrative": False
    }


def main():
    os.makedirs("web/public/replays", exist_ok=True)
    box_dims = (6, 4, 4)
    seed = 42

    print(f"Generating benchmark replays for seed {seed}...")
    rng = np.random.default_rng(seed)
    items = generate_item_stream(8, box_dims, rng)

    # 1. Run FFD
    baseline = FFDBaseline(box_dims=box_dims)
    ffd_replay = baseline.pack(items)
    ffd_replay["illustrative"] = False

    def default_converter(o):
        if isinstance(o, (np.integer, np.int64, np.int32)):
            return int(o)
        if isinstance(o, (np.floating, np.float32, np.float64)):
            return float(o)
        if isinstance(o, np.ndarray):
            return o.tolist()
        raise TypeError(f"Cannot serialize {type(o)}")

    ffd_path = "web/public/replays/eval_ffd.json"
    with open(ffd_path, "w", encoding="utf-8") as f:
        json.dump(ffd_replay, f, indent=2, default=default_converter)
    print(f"Saved FFD replay to {ffd_path} (Density: {ffd_replay['summary']['density']}%)")

    # 2. Run PackRL
    model_path = "models/packrl_v1"
    rl_replay = run_packrl_episode(model_path, seed=seed, num_items=8, box_dims=box_dims)

    rl_path = "web/public/replays/eval_packrl.json"
    with open(rl_path, "w", encoding="utf-8") as f:
        json.dump(rl_replay, f, indent=2, default=default_converter)
    print(f"Saved PackRL replay to {rl_path} (Density: {rl_replay['summary']['density']}%)")


if __name__ == "__main__":
    main()
