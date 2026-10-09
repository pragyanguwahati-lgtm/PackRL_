"""
Items generator and representation for PackRL_ 3D Bin Packing.
"""

from dataclasses import dataclass
from typing import List, Tuple
import numpy as np


@dataclass
class Item:
    """Represents a 3D box item with dimensions and properties."""
    id: int
    dims: Tuple[int, int, int]  # (w, h, d)
    fragility: float = 0.0      # 0.0 = sturdy, 1.0 = fragile

    @property
    def volume(self) -> int:
        return self.dims[0] * self.dims[1] * self.dims[2]


def get_orientations(dims: Tuple[int, int, int]) -> List[Tuple[int, int, int]]:
    """
    Returns 6 distinct 90-degree orthogonal orientations of a 3D cuboid.
    Rotations indexed 0 to 5:
    0: (w, h, d)
    1: (w, d, h)
    2: (h, w, d)
    3: (h, d, w)
    4: (d, w, h)
    5: (d, h, w)
    """
    w, h, d = dims
    return [
        (w, h, d),
        (w, d, h),
        (h, w, d),
        (h, d, w),
        (d, w, h),
        (d, h, w),
    ]


def generate_item_stream(
    num_items: int,
    box_dims: Tuple[int, int, int],
    rng: np.random.Generator,
    sort_by_volume: bool = True,
) -> List[Item]:
    """
    Generates a stream of items sized relative to the container box.
    Items arrive in fixed order (e.g. sorted by volume descending).
    """
    max_w, max_h, max_d = [max(1, int(s * 0.6)) for s in box_dims]
    items: List[Item] = []

    for i in range(num_items):
        w = int(rng.integers(1, max(2, max_w + 1)))
        h = int(rng.integers(1, max(2, max_h + 1)))
        d = int(rng.integers(1, max(2, max_d + 1)))
        fragile = float(rng.choice([0.0, 1.0], p=[0.8, 0.2]))
        items.append(Item(id=i + 1, dims=(w, h, d), fragility=fragile))

    if sort_by_volume:
        items.sort(key=lambda item: item.volume, reverse=True)

    # Re-index items sequentially after sorting
    for idx, item in enumerate(items):
        item.id = idx + 1

    return items
