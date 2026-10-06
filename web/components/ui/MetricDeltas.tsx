"use client";

import React from "react";
import type { Replay } from "@/lib/replay";

interface MetricDeltasProps {
  replayFFD: Replay | null;
  replayRL: Replay | null;
  currentStepFFD: number;
  currentStepRL: number;
}

export function MetricDeltas({
  replayFFD,
  replayRL,
  currentStepFFD,
  currentStepRL,
}: MetricDeltasProps) {
  // Current values based on step
  const ffdItem = replayFFD?.steps[currentStepFFD - 1];
  const rlItem = replayRL?.steps[currentStepRL - 1];

  const densityFFD = ffdItem ? ffdItem.density : currentStepFFD === 0 ? 0 : replayFFD?.summary.density || 0;
  const densityRL = rlItem ? rlItem.density : currentStepRL === 0 ? 0 : replayRL?.summary.density || 0;
  const densityDelta = densityRL - densityFFD;

  const voidFFD = Math.max(0, 100 - densityFFD);
  const voidRL = Math.max(0, 100 - densityRL);
  const voidDelta = voidRL - voidFFD; // negative is good (less void)

  const latencyFFD = ffdItem ? ffdItem.ms : replayFFD?.summary.p95ms || 0;
  const latencyRL = rlItem ? rlItem.ms : replayRL?.summary.p95ms || 0;
  const latencyFactor = latencyFFD && latencyRL ? (latencyFFD / latencyRL).toFixed(1) : "—";

  return (
    <div className="w-full bg-[var(--panel)]/40 border border-[var(--line)] rounded-lg p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)]" />
          <span className="mono text-xs text-[var(--muted)] tracking-wider uppercase">
            Live Synchronized Metric Deltas
          </span>
        </div>
        <span className="mono text-[11px] text-[var(--muted)] opacity-60">
          Illustrative benchmarks · Seed #42
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Packing Density Delta */}
        <div>
          <div className="mono text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">
            Density Comparison
          </div>
          <div className="flex items-baseline gap-2">
            <span className="mono text-2xl font-bold text-[var(--teal)]">
              {densityRL.toFixed(1)}%
            </span>
            <span className="mono text-sm text-[var(--orange)] opacity-90">
              vs {densityFFD.toFixed(1)}%
            </span>
          </div>
          <div className="mono text-xs mt-1">
            <span
              className={
                densityDelta >= 0
                  ? "text-[var(--teal)] font-medium"
                  : "text-[var(--orange)] font-medium"
              }
            >
              {densityDelta >= 0 ? `+${densityDelta.toFixed(1)}%` : `${densityDelta.toFixed(1)}%`}
            </span>{" "}
            <span className="text-[var(--muted)] text-[11px]">RL advantage</span>
          </div>
        </div>

        {/* Void Space Delta */}
        <div>
          <div className="mono text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">
            Void Space (Air)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="mono text-2xl font-bold text-[var(--text)]">
              {voidRL.toFixed(1)}%
            </span>
            <span className="mono text-sm text-[var(--muted)]">
              vs {voidFFD.toFixed(1)}%
            </span>
          </div>
          <div className="mono text-xs mt-1">
            <span
              className={
                voidDelta <= 0
                  ? "text-[var(--teal)] font-medium"
                  : "text-[var(--orange)] font-medium"
              }
            >
              {voidDelta <= 0 ? `${voidDelta.toFixed(1)}%` : `+${voidDelta.toFixed(1)}%`}
            </span>{" "}
            <span className="text-[var(--muted)] text-[11px]">air reduction</span>
          </div>
        </div>

        {/* Decision Latency */}
        <div>
          <div className="mono text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">
            Inference Latency
          </div>
          <div className="flex items-baseline gap-2">
            <span className="mono text-2xl font-bold text-[var(--teal)]">
              {currentStepRL > 0 ? `${latencyRL} ms` : "—"}
            </span>
            <span className="mono text-sm text-[var(--orange)] opacity-90">
              vs {currentStepFFD > 0 ? `${latencyFFD} ms` : "—"}
            </span>
          </div>
          <div className="mono text-xs mt-1 text-[var(--teal)]">
            {latencyRL > 0 && latencyFFD > 0 ? (
              <span>~{latencyFactor}× faster per item</span>
            ) : (
              <span className="text-[var(--muted)] text-[11px]">Real-time sub-50ms</span>
            )}
          </div>
        </div>

        {/* Container Efficiency */}
        <div>
          <div className="mono text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">
            Container Fit
          </div>
          <div className="flex items-baseline gap-2">
            <span className="mono text-2xl font-bold text-[var(--text)]">
              1 Box
            </span>
            <span className="mono text-sm text-[var(--muted)]">
              {currentStepRL >= 7 ? "Contained" : "Packing"}
            </span>
          </div>
          <div className="mono text-xs mt-1 text-[var(--muted)] text-[11px]">
            FFD leaves {replayFFD?.items ? replayFFD.items.length - (replayFFD?.steps.length || 0) : 3} items unplaced
          </div>
        </div>
      </div>
    </div>
  );
}
