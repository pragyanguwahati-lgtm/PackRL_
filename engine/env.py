"""
PackRL_ Gymnasium Environment for 3D Box Packing.
Implements the exact observation space, action masking, gravity drop,
and multi-objective reward function specified in training.md and architecture.md.
"""

from typing import Any, Dict, List, Optional, Tuple
import gymnasium as gym
from gymnasium import spaces
import numpy as np

from engine.items import Item, get_orientations, generate_item_stream
from engine.mask import compute_action_mask, decode_action


class PackEnv(gym.Env):
    """
    Gymnasium Environment for 3D Voxel Packing with Maskable Actions.
    Action = (rot, x, y); z is resolved by gravity drop.
    """

    metadata = {"render_modes": ["ansi", "human"]}

    def __init__(
        self,
        box_dims: Tuple[int, int, int] = (6, 4, 4),  # (W, H, D)
        num_items: int = 8,
        lookahead: int = 3,
        seed: Optional[int] = None,
        alpha: float = 1.0,   # Volume packed reward
        beta: float = 0.2,    # Support ratio reward
        gamma: float = 0.5,   # Invalid penalty (fallback)
        delta: float = 1.0,   # Unplaced penalty
    ):
        super().__init__()
        self.box_dims = box_dims
        self.W, self.H, self.D = box_dims
        self.num_items = num_items
        self.lookahead = lookahead

        # Reward weights
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.delta = delta

        self.box_volume = self.W * self.H * self.D

        # Action space: Discrete(6 * W * H)
        self.action_space = spaces.Discrete(6 * self.W * self.H)

        # Observation space:
        # grid: 3D binary occupancy shape (1, W, H, D)
        # next_items: next `lookahead` items, each with [w/W, h/H, d/D, fragility], shape (lookahead, 4)
        # volume_left: remaining volume normalized [0, 1]
        self.observation_space = spaces.Dict(
            {
                "grid": spaces.Box(
                    low=0.0,
                    high=1.0,
                    shape=(1, self.W, self.H, self.D),
                    dtype=np.float32,
                ),
                "next_items": spaces.Box(
                    low=0.0,
                    high=1.0,
                    shape=(self.lookahead, 4),
                    dtype=np.float32,
                ),
                "volume_left": spaces.Box(
                    low=0.0,
                    high=1.0,
                    shape=(1,),
                    dtype=np.float32,
                ),
            }
        )

        self._rng = np.random.default_rng(seed)
        self.grid = np.zeros((self.W, self.H, self.D), dtype=np.int32)
        self.items: List[Item] = []
        self.item_idx = 0
        self.packed_items: List[Dict[str, Any]] = []

    def reset(
        self,
        *,
        seed: Optional[int] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Dict[str, np.ndarray], Dict[str, Any]]:
        super().reset(seed=seed)
        if seed is not None:
            self._rng = np.random.default_rng(seed)

        self.grid = np.zeros((self.W, self.H, self.D), dtype=np.int32)
        self.items = generate_item_stream(
            num_items=self.num_items,
            box_dims=self.box_dims,
            rng=self._rng,
            sort_by_volume=True,
        )
        self.item_idx = 0
        self.packed_items = []

        obs = self._get_obs()
        info = self._get_info()
        return obs, info

    def action_masks(self) -> np.ndarray:
        """Returns boolean mask for valid actions on the current item."""
        if self.item_idx >= len(self.items):
            return np.zeros(self.action_space.n, dtype=bool)

        current_item = self.items[self.item_idx]
        return compute_action_mask(self.grid, current_item, self.box_dims)

    def _get_obs(self) -> Dict[str, np.ndarray]:
        # Grid occupancy
        grid_obs = (self.grid > 0).astype(np.float32).reshape(1, self.W, self.H, self.D)

        # Next items window
        next_items_obs = np.zeros((self.lookahead, 4), dtype=np.float32)
        for i in range(self.lookahead):
            curr_idx = self.item_idx + i
            if curr_idx < len(self.items):
                item = self.items[curr_idx]
                next_items_obs[i] = [
                    item.dims[0] / self.W,
                    item.dims[1] / self.H,
                    item.dims[2] / self.D,
                    item.fragility,
                ]

        # Remaining box volume
        occupied_voxels = np.sum(self.grid > 0)
        volume_left = float(self.box_volume - occupied_voxels) / float(self.box_volume)

        return {
            "grid": grid_obs,
            "next_items": next_items_obs,
            "volume_left": np.array([max(0.0, volume_left)], dtype=np.float32),
        }

    def _get_info(self) -> Dict[str, Any]:
        occupied_voxels = int(np.sum(self.grid > 0))
        density = (occupied_voxels / self.box_volume) * 100.0
        return {
            "item_idx": self.item_idx,
            "items_placed": len(self.packed_items),
            "density": density,
            "void": 100.0 - density,
        }

    def step(self, action: int) -> Tuple[Dict[str, np.ndarray], float, bool, bool, Dict[str, Any]]:
        """
        Executes placement action = (rot, x, y) for current item.
        Drops to z using height map / gravity.
        """
        if self.item_idx >= len(self.items):
            return self._get_obs(), 0.0, True, False, self._get_info()

        current_item = self.items[self.item_idx]
        rot, x, y = decode_action(action, self.box_dims)
        orientations = get_orientations(current_item.dims)
        iw, ih, id_dim = orientations[rot]

        # Calculate drop z
        x_end = x + iw
        y_end = y + ih

        # Bounds check
        if x_end > self.W or y_end > self.H:
            # Illegal out of bounds action
            reward = -self.gamma
            self.item_idx += 1
            terminated = (self.item_idx >= len(self.items))
            return self._get_obs(), reward, terminated, False, self._get_info()

        occupied_mask = (self.grid > 0)
        if not np.any(occupied_mask):
            height_map = np.zeros((self.W, self.H), dtype=np.int32)
        else:
            z_indices = np.arange(self.D, dtype=np.int32).reshape(1, 1, self.D)
            height_map = np.max(np.where(occupied_mask, z_indices + 1, 0), axis=2)

        drop_z = int(np.max(height_map[x:x_end, y:y_end]))
        z_end = drop_z + id_dim

        # Height boundary check
        if z_end > self.D:
            # Cannot fit item without overflow
            reward = -self.delta
            self.item_idx += 1
            terminated = (self.item_idx >= len(self.items))
            return self._get_obs(), reward, terminated, False, self._get_info()

        # Voxel collision check
        if np.any(self.grid[x:x_end, y:y_end, drop_z:z_end]):
            reward = -self.gamma
            self.item_idx += 1
            terminated = (self.item_idx >= len(self.items))
            return self._get_obs(), reward, terminated, False, self._get_info()

        # Support ratio & pyramid stability check
        # Underneath items must support the base
        pyramid_penalty = 0.0
        if drop_z > 0:
            underneath = self.grid[x:x_end, y:y_end, drop_z - 1]
            support_ratio = float(np.mean(underneath > 0))
            if support_ratio < 0.80:
                # Disallow unstable/floating placement
                reward = -self.gamma
                self.item_idx += 1
                terminated = (self.item_idx >= len(self.items))
                return self._get_obs(), reward, terminated, False, self._get_info()
            
            # Check for inverted pyramid (small box placed beneath a larger box):
            # Inspect items directly underneath to ensure they are not much smaller
            underlying_ids = np.unique(underneath[underneath > 0])
            for uid in underlying_ids:
                # Find item by id
                supporting_items = [it for it in self.items if it.id == uid]
                if supporting_items:
                    supp_item = supporting_items[0]
                    # If this item is larger in volume than its supporter, penalize
                    if current_item.volume > supp_item.volume * 1.5:
                        pyramid_penalty += 0.3
        else:
            support_ratio = 1.0

        # Execute placement
        self.grid[x:x_end, y:y_end, drop_z:z_end] = current_item.id
        self.packed_items.append(
            {
                "itemId": current_item.id,
                "rot": rot,
                "pos": [int(x), int(y), int(drop_z)],
                "dims": [int(iw), int(ih), int(id_dim)],
                "support": support_ratio,
            }
        )

        # Multi-objective reward:
        # 1. Volume packed ratio (efficiency)
        item_volume_ratio = (current_item.volume) / self.box_volume
        
        # 2. Strong Bottom-Layer-First Incentive:
        # Check current floor occupancy (z=0 layer):
        floor_occupancy = float(np.mean(self.grid[:, :, 0] > 0))

        # Heavy penalty if attempting to stack upward (drop_z > 0) while the floor is still empty (< 65% occupied)
        premature_stack_penalty = 0.0
        if drop_z > 0 and floor_occupancy < 0.65:
            premature_stack_penalty = 0.8 * (0.65 - floor_occupancy)

        # Floor placement bonus: placing directly onto the base container floor (drop_z == 0)
        floor_bonus = 0.35 if drop_z == 0 else 0.0

        # Height penalty: strongly discourage tall, spiky columns
        height_ratio = float(z_end) / float(self.D)
        gravity_incentive = 1.0 - (0.8 * height_ratio)

        # 3. Contact Area Bonus (tight clustering with existing items and walls)
        # Calculates face-sharing area with adjacent boxes to avoid random gaps
        contact_faces = 0
        # Check X faces
        if x > 0:
            contact_faces += int(np.sum(self.grid[x - 1, y:y_end, drop_z:z_end] > 0))
        else:
            contact_faces += (ih * id_dim) # Wall contact
        if x_end < self.W:
            contact_faces += int(np.sum(self.grid[x_end, y:y_end, drop_z:z_end] > 0))
        else:
            contact_faces += (ih * id_dim) # Wall contact

        # Check Y faces
        if y > 0:
            contact_faces += int(np.sum(self.grid[x:x_end, y - 1, drop_z:z_end] > 0))
        else:
            contact_faces += (iw * id_dim) # Wall contact
        if y_end < self.H:
            contact_faces += int(np.sum(self.grid[x:x_end, y_end, drop_z:z_end] > 0))
        else:
            contact_faces += (iw * id_dim) # Wall contact

        # Total surface area of placed item
        total_surface = 2 * (iw * ih + iw * id_dim + ih * id_dim)
        contact_ratio = float(contact_faces) / float(total_surface)
        clustering_bonus = 0.6 * contact_ratio

        # 4. Corner distance incentive: pack continuously outward from origin (0, 0)
        corner_dist = (float(x) / self.W + float(y) / self.H) / 2.0
        corner_incentive = 0.2 * (1.0 - corner_dist)

        reward = (
            (self.alpha * item_volume_ratio * gravity_incentive)
            + (self.beta * support_ratio)
            + floor_bonus
            + clustering_bonus
            + corner_incentive
            - premature_stack_penalty
            - pyramid_penalty
        )

        self.item_idx += 1
        terminated = (self.item_idx >= len(self.items))

        # Check if no valid moves exist for next items
        if not terminated:
            next_mask = self.action_masks()
            if not np.any(next_mask):
                # No more items can fit
                terminated = True

        return self._get_obs(), reward, terminated, False, self._get_info()
