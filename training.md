# Training Guide — PackRL_ (for humans and Antigravity agents)

## 0. Which model is used
**There is no LLM in this project.** The "brain" is a small reinforcement-learning policy network (MLP or small 3D-CNN, a few hundred thousand parameters) trained with **Maskable PPO** (`sb3-contrib`, PyTorch). It trains from scratch in a custom Gymnasium environment; no pretrained weights, no text, no API calls. Do not add an LLM, transformer, or external model API unless the PRD changes.

## 1. Setup
```
python -m venv .venv && source .venv/bin/activate
pip install gymnasium numpy torch stable-baselines3 sb3-contrib tensorboard
```

## 2. Action Space (change from earlier docs)
A flat action over (item, rotation, x, y, z) is intractable. Use:
* Items arrive in a **fixed order** (e.g. sorted by volume desc, or conveyor order).
* Action = `(rotation 0-5, x, y)`; **z is found by dropping the item** until it rests on support.
* Flatten to `Discrete(6 * W * H)` (e.g. 6x10x10 = 600). The mask marks invalid rotation/cell pairs.
Update `architecture.md` accordingly.

## 3. Observation
Dict: `grid` (occupancy or height-map, shape `(1, W, H, D)` or `(W, H)`), `next_items` (next 3-5 item dims + fragility, zero-padded), `volume_left`. Normalize everything to [0, 1].

## 4. Training Recipe
```python
from sb3_contrib import MaskablePPO
from sb3_contrib.common.maskable.utils import get_action_masks
from sb3_contrib.common.wrappers import ActionMasker
from stable_baselines3.common.vec_env import SubprocVecEnv

def make(seed):
    def _f():
        env = PackEnv(seed=seed)               # your Gymnasium env
        return ActionMasker(env, lambda e: e.action_masks())
    return _f

env = SubprocVecEnv([make(i) for i in range(8)])
model = MaskablePPO("MultiInputPolicy", env, n_steps=1024, batch_size=256,
                    learning_rate=3e-4, gamma=0.99, ent_coef=0.01,
                    tensorboard_log="runs/", seed=0, verbose=1)
model.learn(total_timesteps=5_000_000)         # scale to 10-20M if density plateaus
model.save("models/packrl_v1")
```
Add `MaskableEvalCallback` on held-out seeds; keep the best checkpoint.

## 5. Curriculum & Reward Tuning
1. Start small: 6x6x6 box, 5-8 items, easy shapes.
2. Grow to full box and 15-30 items once density > 70%.
3. Initial reward weights: `alpha=1.0, beta=0.2, gamma=0.5, delta=1.0`. If the agent leaves items unplaced, raise `delta`; if stacks float, raise `beta`.
4. Generate 50,000+ synthetic orders with fixed seeds; hold out ~10% for testing; never train on the test set.

## 6. Hardware
Environment speed is the bottleneck, not the GPU. 8-16 CPU env workers on a laptop or free Colab/Kaggle CPU is fine; a GPU helps only for a 3D-CNN extractor. Expect hours, not days, at 5M steps.

## 7. Evaluation (must match PRD)
Compare against NumPy FFD on the same held-out orders: packing density, void %, P95 inference latency (ms). Log seeds, library versions and git commit with every run. Report honest numbers even if density < 85%.

## 8. Export & Safety
* Save the final model, compute its SHA-256, store it beside the file.
* Run `export_replays.py` to write replay JSON for the website.
* SB3 `.zip` files are pickle-based: load only models you trained (see `Data Security.md`).

## 9. Agent Instructions
Implement `engine/` in this order: env -> mask -> FFD baseline -> training script -> evaluation -> replay exporter. Do not start training runs longer than 10 minutes without asking; run a 50k-step smoke test first. Update `memory.md` after each step.
