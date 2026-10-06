"use client";

import React, { useEffect } from "react";

interface PlaybackDeckProps {
  currentStep: number;
  totalSteps: number;
  playing: boolean;
  speed: number;
  cameraLock: boolean;
  onStepChange: (step: number) => void;
  onTogglePlay: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onRestart: () => void;
  onSpeedChange: (speed: number) => void;
  onToggleCameraLock: () => void;
}

export function PlaybackDeck({
  currentStep,
  totalSteps,
  playing,
  speed,
  cameraLock,
  onStepChange,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onRestart,
  onSpeedChange,
  onToggleCameraLock,
}: PlaybackDeckProps) {
  // Keyboard navigation shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        onStepBack();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        onStepForward();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        onRestart();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTogglePlay, onStepBack, onStepForward, onRestart]);

  return (
    <div className="w-full bg-[var(--panel)] border border-[var(--line)] rounded-lg p-3.5 sm:p-4 select-none">
      {/* Top scrubber bar with step tags */}
      <div className="flex items-center gap-3 mb-3">
        <span className="mono text-xs text-[var(--muted)] min-w-[56px]">
          STEP {currentStep}/{totalSteps}
        </span>
        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min={0}
            max={totalSteps}
            value={currentStep}
            onChange={(e) => onStepChange(Number(e.target.value))}
            className="w-full h-1.5 bg-[var(--line)] rounded-lg appearance-none cursor-pointer accent-[var(--teal)] focus:outline-none"
            aria-label="Timeline scrubber"
          />
        </div>
        <span className="mono text-xs text-[var(--muted)]">
          {currentStep === totalSteps ? "DONE" : `${Math.round((currentStep / totalSteps) * 100)}%`}
        </span>
      </div>

      {/* Control buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--line)]">
        {/* Playback action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Restart */}
          <button
            onClick={onRestart}
            title="Restart (R)"
            className="px-2.5 py-1.5 rounded border border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--muted)] mono text-xs transition-colors cursor-pointer"
          >
            ⏮
          </button>

          {/* Step Back */}
          <button
            onClick={onStepBack}
            disabled={currentStep <= 0}
            title="Step Back (←)"
            className="px-2.5 py-1.5 rounded border border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed mono text-xs transition-colors cursor-pointer"
          >
            ◀
          </button>

          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            title="Play/Pause (Space)"
            className="px-4 py-1.5 rounded border border-[var(--teal)] bg-[var(--teal)]/10 text-[var(--teal)] hover:bg-[var(--teal)]/20 font-medium mono text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>{playing ? "⏸ Pause" : "▶ Play"}</span>
          </button>

          {/* Step Forward */}
          <button
            onClick={onStepForward}
            disabled={currentStep >= totalSteps}
            title="Step Forward (→)"
            className="px-2.5 py-1.5 rounded border border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed mono text-xs transition-colors cursor-pointer"
          >
            ▶
          </button>
        </div>

        {/* Speed & Sync controls */}
        <div className="flex items-center gap-3">
          {/* Speed switcher */}
          <div className="flex items-center rounded border border-[var(--line)] p-0.5 bg-[var(--bg)]">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-1 rounded text-[11px] mono cursor-pointer transition-colors ${
                  speed === s
                    ? "bg-[var(--line)] text-[var(--text)] font-medium"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Camera Lock toggle */}
          <button
            onClick={onToggleCameraLock}
            className={`px-3 py-1.5 rounded border mono text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              cameraLock
                ? "border-[var(--teal)]/50 bg-[var(--teal)]/10 text-[var(--teal)]"
                : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            title="Mirror camera orbit and zoom across both viewports"
          >
            <span>{cameraLock ? "🔒 Cameras Synced" : "🔓 Cameras Free"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
