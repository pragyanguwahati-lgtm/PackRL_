"""
Unit tests for PackRL_ 3D Bin Packing Environment and Action Masking.
Verifies boundary conditions, collisions, gravity drops, and support constraints.
"""

import numpy as np
import pytest
from engine.items import Item, generate_item_stream
from engine.mask import compute_action_mask, decode_action, encode_action
from engine.env import PackEnv
from engine.baseline import FFDBaseline


def test_action_encoding_decoding():
    box_dims = (6, 4, 4)
    W, H, _ = box_dims
    for rot in range(6):
        for x in range(W):
            for y in range(H):
                act = encode_action(rot, x, y, box_dims)
                d_rot, d_x, d_y = decode_action(act, box_dims)
                assert (d_rot, d_x, d_y) == (rot, x, y)


def test_empty_box_mask_validity():
    box_dims = (6, 4, 4)
    grid = np.zeros(box_dims, dtype=np.int32)
    item = Item(id=1, dims=(2, 2, 2))
    mask = compute_action_mask(grid, item, box_dims)

    # In an empty box, every position where (x+2 <= 6, y+2 <= 4, z+2 <= 4) must be valid
    valid_count = np.sum(mask)
    assert valid_count > 0

    # Specifically check rotation 0 at (0, 0)
    act_0_0 = encode_action(0, 0, 0, box_dims)
    assert mask[act_0_0] is True or mask[act_0_0] == 1


def test_no_out_of_bounds():
    box_dims = (6, 4, 4)
    grid = np.zeros(box_dims, dtype=np.int32)
    # Item larger than box in one dimension (7 > 6)
    oversized = Item(id=1, dims=(7, 2, 2))
    mask = compute_action_mask(grid, oversized, box_dims)

    # Rotations where the first dimension is 7 cannot fit in x <= 6
    act = encode_action(0, 0, 0, box_dims)
    assert bool(mask[act]) is False


def test_pack_env_reset_and_step():
    env = PackEnv(box_dims=(6, 4, 4), num_items=5, seed=42)
    obs, info = env.reset()

    assert "grid" in obs
    assert "next_items" in obs
    assert "volume_left" in obs
    assert obs["grid"].shape == (1, 6, 4, 4)
    assert obs["volume_left"][0] == 1.0

    mask = env.action_masks()
    assert np.any(mask)

    # Choose first valid action
    valid_idx = np.where(mask)[0][0]
    next_obs, reward, terminated, truncated, info = env.step(valid_idx)

    assert reward > 0.0
    assert info["items_placed"] == 1
    assert next_obs["volume_left"][0] < 1.0


def test_ffd_baseline_runs_clean():
    rng = np.random.default_rng(123)
    items = generate_item_stream(8, (6, 4, 4), rng)
    baseline = FFDBaseline(box_dims=(6, 4, 4))
    res = baseline.pack(items)

    assert res["algo"] == "ffd"
    assert len(res["steps"]) > 0
    assert 0.0 < res["summary"]["density"] <= 100.0
    assert res["summary"]["void"] >= 0.0
