"use client";

import React from "react";

interface HudProps {
  step: number;
  totalSteps: number;
  density: number;
  latency: number;
  isIllustrative?: boolean;
}

export function Hud({
  step,
  totalSteps,
  density,
  latency,
  isIllustrative = true,
}: HudProps) {
  return (
    <div
      className="hud mono absolute z-30 top-[calc(76px+env(safe-area-inset-top,0px))] right-6 text-[12px] leading-[1.9] min-w-[178px] border-l border-[var(--line)] pl-[14px] text-[var(--muted)] pointer-events-auto"
      aria-live="off"
    >
      <div className="flex justify-between gap-5">
        <span>STEP</span>
        <b className="text-[var(--text)] font-medium">
          {step}/{totalSteps}
        </b>
      </div>
      <div className="flex justify-between gap-5">
        <span>DENSITY</span>
        <b className="text-[var(--teal)] font-medium">
          {density.toFixed(1)}%
        </b>
      </div>
      <div className="flex justify-between gap-5">
        <span>LATENCY</span>
        <b className="text-[var(--text)] font-medium">
          {step > 0 ? `${latency} ms` : "— ms"}
        </b>
      </div>
      {isIllustrative && (
        <small className="block mt-1.5 opacity-60 text-[11px] tracking-wider uppercase">
          ILLUSTRATIVE RUN
        </small>
      )}
    </div>
  );
}
