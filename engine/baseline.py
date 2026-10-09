"""
First-Fit Decreasing (FFD) 3D Bin Packing Baseline in NumPy.
Places items sorted by volume into the first valid position (x, y) with gravity drop.
"""

from typing import Any, Dict, List, Tuple
import time
import numpy as np
from engine.items import Item, get_orientations
from engine.mask import compute_action_mask, decode_action


class FFDBaseline:
    """
    3D First-Fit Decreasing Heuristic.
    Tests orientations and bottom-left-deepest positions sequentially.
    """

    def __init__(self, box_dims: Tuple[int, int, int]):
        self.box_dims = box_dims
        self.W, self.H, self.D = box_dims
        self.box_volume = self.W * self.H * self.D

    def pack(self, items: List[Item]) -> Dict[str, Any]:
        """
        Executes 3D FFD packing for a given list of items.
        Returns detailed steps and packing summary matching the Replay schema.
        """
        start_time = time.perf_counter()

        grid = np.zeros((self.W, self.H, self.D), dtype=np.int32)
        steps = []
        unplaced_items = []

        # Sort items descending by volume (First-Fit Decreasing rule)
        sorted_items = sorted(items, key=lambda it: it.volume, reverse=True)

        for item in sorted_items:
            step_start = time.perf_counter()
            mask = compute_action_mask(grid, item, self.box_dims)
            valid_actions = np.where(mask)[0]

            if len(valid_actions) == 0:
                unplaced_items.append(item)
                continue

            # In FFD, pick the first valid action (by lowest z / best position)
            # Evaluate valid candidates to pick the one with lowest drop_z, then lowest x, then y
            best_action = None
            best_z = 999999
            best_xy = (999999, 999999)

            occupied_mask = (grid > 0)
            if not np.any(occupied_mask):
                height_map = np.zeros((self.W, self.H), dtype=np.int32)
            else:
                z_indices = np.arange(self.D, dtype=np.int32).reshape(1, 1, self.D)
                height_map = np.max(np.where(occupied_mask, z_indices + 1, 0), axis=2)

            for act in valid_actions:
                rot, x, y = decode_action(act, self.box_dims)
                orientations = get_orientations(item.dims)
                iw, ih, id_dim = orientations[rot]
                drop_z = int(np.max(height_map[x:x + iw, y:y + ih]))

                # Criteria: Lowest drop_z first, then lowest x, then lowest y
                if (drop_z < best_z) or (drop_z == best_z and (x, y) < best_xy):
                    best_z = drop_z
                    best_xy = (x, y)
                    best_action = act

            if best_action is not None:
                rot, x, y = decode_action(best_action, self.box_dims)
                orientations = get_orientations(item.dims)
                iw, ih, id_dim = orientations[rot]
                drop_z = int(np.max(height_map[x:x + iw, y:y + ih]))

                # Place into grid
                grid[x:x + iw, y:y + ih, drop_z:drop_z + id_dim] = item.id

                step_elapsed_ms = (time.perf_counter() - step_start) * 1000.0
                current_density = float(np.sum(grid > 0)) / float(self.box_volume) * 100.0

                steps.append(
                    {
                        "itemId": item.id,
                        "rot": rot,
                        "pos": [int(x), int(y), int(drop_z)],
                        "density": round(current_density, 2),
                        "ms": round(step_elapsed_ms, 2),
                    }
                )

        total_elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        final_density = float(np.sum(grid > 0)) / float(self.box_volume) * 100.0
        step_latencies = [s["ms"] for s in steps] if steps else [0.0]
        p95_ms = float(np.percentile(step_latencies, 95)) if step_latencies else 0.0

        return {
            "algo": "ffd",
            "box": [self.W, self.H, self.D],
            "items": [{"id": it.id, "dims": list(it.dims)} for it in items],
            "steps": steps,
            "summary": {
                "density": round(final_density, 1),
                "void": round(100.0 - final_density, 1),
                "p95ms": round(p95_ms, 2),
                "boxes": 1,
            },
        }
