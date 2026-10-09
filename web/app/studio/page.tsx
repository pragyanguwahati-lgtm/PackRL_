"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { StudioViewport } from "@/components/scene/StudioViewport";
import { MetricDeltas } from "@/components/ui/MetricDeltas";
import { PlaybackDeck } from "@/components/ui/PlaybackDeck";
import { CustomOrderBuilder } from "@/components/studio/CustomOrderBuilder";
import { usePackStore } from "@/lib/store";
import { validateReplay } from "@/lib/replay";

export default function StudioPage() {
  const {
    replayFFD,
    replayRL,
    t,
    playing,
    speed,
    cameraLock,
    setReplayFFD,
    setReplayRL,
    setT,
    setPlaying,
    setSpeed,
    setCameraLock,
    resetClock,
  } = usePackStore();

  const [activeMobileView, setActiveMobileView] = useState<"ffd" | "packrl">("packrl");
  const [selectedSeed, setSelectedSeed] = useState<number>(101);
  const [sharedCameraState, setSharedCameraState] = useState<{
    pos: [number, number, number];
    target: [number, number, number];
  } | null>(null);

  // Parse initial query params (e.g. ?step=5 or ?seed=101)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const stepParam = params.get("step");
      if (stepParam !== null && !isNaN(Number(stepParam))) {
        setT(Number(stepParam));
      }
      const seedParam = params.get("seed");
      if (seedParam !== null && !isNaN(Number(seedParam))) {
        setSelectedSeed(Number(seedParam));
      }
    }
  }, [setT]);

  // Load replays and Zod validate
  useEffect(() => {
    async function loadReplays() {
      try {
        let resFFD: Response;
        let resRL: Response;

        if (selectedSeed === 42) {
          resFFD = await fetch("/replays/eval_ffd.json");
          resRL = await fetch("/replays/eval_packrl.json");
          if (!resFFD.ok || !resRL.ok) {
            resFFD = await fetch("/replays/mock_ffd.json");
            resRL = await fetch("/replays/mock_packrl.json");
          }
        } else {
          // Hand-curated 87% benchmark mock
          resFFD = await fetch("/replays/mock_ffd.json");
          resRL = await fetch("/replays/mock_packrl.json");
        }

        if (resFFD.ok && resRL.ok) {
          const rawFFD = await resFFD.json();
          const rawRL = await resRL.json();
          setReplayFFD(validateReplay(rawFFD));
          setReplayRL(validateReplay(rawRL));
        }
      } catch (err) {
        console.error("Failed to load replays:", err);
      }
    }
    loadReplays();
  }, [selectedSeed, setReplayFFD, setReplayRL]);

  // Determine total steps
  const totalStepsFFD = replayFFD?.steps.length || 5;
  const totalStepsRL = replayRL?.steps.length || 8;
  const maxSteps = Math.max(totalStepsFFD, totalStepsRL);

  // Auto-play interval
  useEffect(() => {
    if (!playing) return;

    const intervalMs = Math.round(1000 / speed);
    const interval = setInterval(() => {
      setT((prev) => {
        if (prev >= maxSteps) {
          setPlaying(false);
          return maxSteps;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [playing, speed, maxSteps, setT, setPlaying]);

  // Handle camera synchronization
  const handleCameraChange = useCallback(
    (pos: [number, number, number], target: [number, number, number]) => {
      if (cameraLock) {
        setSharedCameraState({ pos, target });
      }
    },
    [cameraLock]
  );

  const currentStepFFD = Math.min(t, totalStepsFFD);
  const currentStepRL = Math.min(t, totalStepsRL);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      {/* Top Studio Header */}
      <header className="border-b border-[var(--line)] bg-[var(--panel)]/50 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 z-30 sticky top-0">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link
            href="/"
            className="mono text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1 no-underline whitespace-nowrap"
          >
            <span>←</span> Overview
          </Link>
          <div className="h-4 w-px bg-[var(--line)] hidden sm:block" />
          <h1 className="mono text-xs sm:text-sm font-semibold tracking-wider flex items-center gap-1.5 m-0 whitespace-nowrap">
            Pack<b className="text-[var(--teal)] font-medium">RL</b>_ Studio
          </h1>
        </div>

        {/* Seed selection dropdown */}
        <div className="flex items-center gap-2 min-w-0">
          <label className="mono text-xs text-[var(--muted)] hidden lg:inline">
            ORDER:
          </label>
          <select
            value={selectedSeed}
            onChange={(e) => {
              setSelectedSeed(Number(e.target.value));
              resetClock();
            }}
            aria-label="Order seed selection"
            className="mono text-[11px] sm:text-xs bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] rounded px-2 py-1 sm:px-2.5 sm:py-1.5 focus:outline-none focus:border-[var(--teal)] cursor-pointer max-w-[170px] sm:max-w-none truncate"
          >
            <option value={101}>Seed #101: Hardware (PackRL 100% Fit vs FFD 3 Overflow)</option>
            <option value={42}>Seed #42: Mixed Small (8 items)</option>
          </select>
        </div>
      </header>

      {/* Main Studio Viewport Area */}
      <main className="flex-1 flex flex-col p-3 sm:p-5 max-w-[1600px] w-full mx-auto gap-4">
        {/* Interactive Custom Order Builder */}
        <CustomOrderBuilder onPacked={() => resetClock()} />

        {/* Mobile Viewport Segmented Control */}
        <div className="flex md:hidden rounded-lg border border-[var(--line)] p-1 bg-[var(--panel)]">
          <button
            onClick={() => setActiveMobileView("ffd")}
            className={`flex-1 py-1.5 rounded mono text-xs font-medium transition-colors ${
              activeMobileView === "ffd"
                ? "bg-[var(--orange)]/15 text-[var(--orange)] border border-[var(--orange)]/30"
                : "text-[var(--muted)]"
            }`}
          >
            FFD Heuristic
          </button>
          <button
            onClick={() => setActiveMobileView("packrl")}
            className={`flex-1 py-1.5 rounded mono text-xs font-medium transition-colors ${
              activeMobileView === "packrl"
                ? "bg-[var(--teal)]/15 text-[var(--teal)] border border-[var(--teal)]/30"
                : "text-[var(--muted)]"
            }`}
          >
            PackRL_ Agent
          </button>
        </div>

        {/* Viewports Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[460px] lg:min-h-[580px]">
          {/* FFD Baseline Viewport */}
          <div
            className={`w-full h-full ${
              activeMobileView === "ffd" ? "block" : "hidden md:block"
            }`}
          >
            <StudioViewport
              algo="ffd"
              title="FFD BASELINE (HEURISTIC)"
              accentColor="var(--orange)"
              replay={replayFFD}
              currentStep={currentStepFFD}
              cameraLock={cameraLock}
              onCameraChange={handleCameraChange}
              sharedCameraState={sharedCameraState}
            />
          </div>

          {/* PackRL_ Agent Viewport */}
          <div
            className={`w-full h-full ${
              activeMobileView === "packrl" ? "block" : "hidden md:block"
            }`}
          >
            <StudioViewport
              algo="packrl"
              title="PACKRL_ TARGET (LEARNED AGENT)"
              accentColor="var(--teal)"
              replay={replayRL}
              currentStep={currentStepRL}
              cameraLock={cameraLock}
              onCameraChange={handleCameraChange}
              sharedCameraState={sharedCameraState}
            />
          </div>
        </div>

        {/* Metric Deltas Readout */}
        <MetricDeltas
          replayFFD={replayFFD}
          replayRL={replayRL}
          currentStepFFD={currentStepFFD}
          currentStepRL={currentStepRL}
        />

        {/* Playback Controls Deck */}
        <PlaybackDeck
          currentStep={t}
          totalSteps={maxSteps}
          playing={playing}
          speed={speed}
          cameraLock={cameraLock}
          onStepChange={(step) => setT(step)}
          onTogglePlay={() => setPlaying(!playing)}
          onStepBack={() => setT(Math.max(0, t - 1))}
          onStepForward={() => setT(Math.min(maxSteps, t + 1))}
          onRestart={resetClock}
          onSpeedChange={(s) => setSpeed(s)}
          onToggleCameraLock={() => setCameraLock(!cameraLock)}
        />
      </main>

      {/* Studio Footer */}
      <footer className="border-t border-[var(--line)]/50 px-4 sm:px-6 py-3 text-[11px] mono text-[var(--muted)] flex flex-col sm:flex-row justify-between items-center gap-2 bg-[var(--bg)] text-center sm:text-left">
        <span>PackRL_ Studio · Dual Synced Viewport Demo</span>
        <span>IEEE Hackathon 2026 · Track 03.2</span>
      </footer>
    </div>
  );
}
