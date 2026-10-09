"""
Vectorized Action Masking for PackRL_ 3D Bin Packing Environment.
Checks boundary limits, collisions, and bottom support conditions.
"""

from typing import Tuple, List
import numpy as np
from engine.items import Item, get_orientations


def compute_action_mask(
    grid: np.ndarray,
    current_item: Item,
    box_dims: Tuple[int, int, int],
) -> np.ndarray:
    """
    Computes a boolean action mask of shape (6 * W * H,).
    True if the action (rotation, x, y) is valid and fits into the box with gravity drop.
    False otherwise.

    Action index formula:
    idx = rot * (W * H) + x * H + y

    Args:
        grid: 3D binary occupancy numpy array of shape (W, H, D).
              1 = occupied voxel, 0 = empty.
        current_item: The Item to be placed.
        box_dims: Tuple of (W, H, D).

    Returns:
        np.ndarray of type bool, shape (6 * W * H,).
    """
    W, H, D = box_dims
    total_actions = 6 * W * H
    mask = np.zeros(total_actions, dtype=bool)

    orientations = get_orientations(current_item.dims)

    # Precompute 2D height map for fast drop estimation
    # height_map[x, y] = highest occupied z index + 1 (or 0 if empty)
    # Using argmax on reversed occupancy or maximum over non-zeros:
    occupied_mask = (grid > 0)
    # Shape: (W, H)
    if not np.any(occupied_mask):
        height_map = np.zeros((W, H), dtype=np.int32)
    else:
        # z indices where occupied
        z_indices = np.arange(D, dtype=np.int32).reshape(1, 1, D)
        height_map = np.max(np.where(occupied_mask, z_indices + 1, 0), axis=2)

    for rot_idx, (iw, ih, id_dim) in enumerate(orientations):
        # If item dimension in any axis exceeds box dimension, entire rotation is invalid
        if iw > W or ih > H or id_dim > D:
            continue

        base_rot_offset = rot_idx * (W * H)

        # Range of valid top-left (x, y) anchors
        max_x = W - iw
        max_y = H - ih

        for x in range(max_x + 1):
            x_end = x + iw
            for y in range(max_y + 1):
                y_end = y + ih

                # Find drop z: max height within footprint [x:x_end, y:y_end]
                drop_z = int(np.max(height_map[x:x_end, y:y_end]))
                z_end = drop_z + id_dim

                # Check if it fits within depth D without container overflow
                if z_end > D:
                    continue

                # Verify collision in voxel grid
                if np.any(grid[x:x_end, y:y_end, drop_z:z_end]):
                    continue

                # Support verification:
                # If resting on bottom (drop_z == 0), 100% supported by floor.
                # If resting on other boxes (drop_z > 0), verify support footprint at drop_z - 1.
                # Require strict support (>= 80% bottom contact) to prevent overhangs or floating boxes
                if drop_z > 0:
                    underneath = grid[x:x_end, y:y_end, drop_z - 1]
                    support_ratio = np.mean(underneath > 0)
                    if support_ratio < 0.80:
                        continue

                act_idx = base_rot_offset + x * H + y
                mask[act_idx] = True

    return mask


def decode_action(action: int, box_dims: Tuple[int, int, int]) -> Tuple[int, int, int]:
    """Decodes flattened discrete action into (rotation, x, y)."""
    W, H, _ = box_dims
    rot = action // (W * H)
    rem = action % (W * H)
    x = rem // H
    y = rem % H
    return rot, x, y


def encode_action(rot: int, x: int, y: int, box_dims: Tuple[int, int, int]) -> int:
    """Encodes (rotation, x, y) into flattened discrete action index."""
    W, H, _ = box_dims
    return rot * (W * H) + x * H + y
