"""
Training pipeline for PackRL_ 3D Bin Packing using Maskable PPO (sb3-contrib).
"""

import os
import argparse
import numpy as np
from sb3_contrib import MaskablePPO
from sb3_contrib.common.maskable.utils import get_action_masks
from sb3_contrib.common.wrappers import ActionMasker
from stable_baselines3.common.vec_env import DummyVecEnv

from engine.env import PackEnv


def make_env(box_dims=(6, 4, 4), num_items=8, seed=0):
    def _init():
        env = PackEnv(box_dims=box_dims, num_items=num_items, seed=seed)
        return ActionMasker(env, lambda e: e.action_masks())
    return _init


def main():
    parser = argparse.ArgumentParser(description="Train PackRL_ Maskable PPO Agent")
    parser.add_argument("--timesteps", type=int, default=50_000, help="Total timesteps to train")
    parser.add_argument("--num_envs", type=int, default=4, help="Number of vectorized environments")
    parser.add_argument("--save_path", type=str, default="models/packrl_v1", help="Path to save model")
    args = parser.parse_args()

    os.makedirs("models", exist_ok=True)
    os.makedirs("runs", exist_ok=True)

    print(f"Creating {args.num_envs} vectorized environments...")
    env_fns = [make_env(box_dims=(6, 4, 4), num_items=8, seed=i) for i in range(args.num_envs)]
    vec_env = DummyVecEnv(env_fns)

    print(f"Initializing Maskable PPO (MultiInputPolicy) for {args.timesteps} timesteps...")
    model = MaskablePPO(
        "MultiInputPolicy",
        vec_env,
        n_steps=512,
        batch_size=128,
        learning_rate=3e-4,
        gamma=0.99,
        ent_coef=0.01,
        tensorboard_log="runs/",
        seed=42,
        verbose=1,
    )

    print("Beginning training loop...")
    model.learn(total_timesteps=args.timesteps)

    model.save(args.save_path)
    print(f"Model saved successfully to {args.save_path}.zip")


if __name__ == "__main__":
    main()
