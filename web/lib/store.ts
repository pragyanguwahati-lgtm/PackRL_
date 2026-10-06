import { create } from "zustand";
import type { Replay } from "./replay";

export interface PackStoreState {
  replayFFD: Replay | null;
  replayRL: Replay | null;
  t: number;
  playing: boolean;
  speed: number;
  seed: number;
  cameraLock: boolean;
  setReplayFFD: (replay: Replay | null) => void;
  setReplayRL: (replay: Replay | null) => void;
  setT: (updater: number | ((prev: number) => number)) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  setSeed: (seed: number) => void;
  setCameraLock: (cameraLock: boolean) => void;
  resetClock: () => void;
}

export const usePackStore = create<PackStoreState>((set) => ({
  replayFFD: null,
  replayRL: null,
  t: 0,
  playing: true,
  speed: 1,
  seed: 42,
  cameraLock: true,
  setReplayFFD: (replayFFD) => set({ replayFFD }),
  setReplayRL: (replayRL) => set({ replayRL }),
  setT: (updater) =>
    set((state) => ({
      t: typeof updater === "function" ? updater(state.t) : updater,
    })),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  setSeed: (seed) => set({ seed }),
  setCameraLock: (cameraLock) => set({ cameraLock }),
  resetClock: () => set({ t: 0 }),
}));
