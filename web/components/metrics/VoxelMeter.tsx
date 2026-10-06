"use client";

import React, { useEffect, useRef, useState } from "react";

interface VoxelMeterProps {
  label: string;
  targetPercent: number;
  cellsCount: number; // e.g. 68 for FFD, 85 for PackRL
  variant: "orange" | "teal";
  subtitle: string;
}

export function VoxelMeter({
  label,
  targetPercent,
  cellsCount,
  variant,
  subtitle,
}: VoxelMeterProps) {
  const [activeCount, setActiveCount] = useState(0);
  const [displayPercent, setDisplayPercent] = useState(0);
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const colorVar = variant === "orange" ? "var(--orange)" : "var(--teal)";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 1.2) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "150px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setActiveCount(cellsCount);
      setDisplayPercent(targetPercent);
      return;
    }

    // Animate cells filling from bottom up
    let cellTimer: NodeJS.Timeout;
    const timeouts: NodeJS.Timeout[] = [];

    for (let o = 0; o < cellsCount; o++) {
      const t = setTimeout(() => {
        setActiveCount(o + 1);
      }, o * 14);
      timeouts.push(t);
    }

    // Animate percentage count-up
    const startTime = performance.now();
    const duration = 1500;
    let animId: number;

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPercent(targetPercent * eased);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayPercent(targetPercent);
      }
    }

    animId = requestAnimationFrame(step);

    return () => {
      timeouts.forEach(clearTimeout);
      cancelAnimationFrame(animId);
    };
  }, [inView, cellsCount, targetPercent]);

  // Construct 10x10 grid with indices filling from bottom (row 9 -> row 0)
  const cells: { row: number; col: number; order: number }[] = [];
  for (let r = 9; r >= 0; r--) {
    for (let c = 0; c < 10; c++) {
      cells.push({ row: r, col: c, order: (9 - r) * 10 + c });
    }
  }

  return (
    <div ref={containerRef} className="meter">
      <div
        className="lab mono text-[12px] tracking-[0.08em] flex justify-between mb-3 uppercase"
        style={{ color: colorVar }}
      >
        <span>{label}</span>
        <span>DENSITY</span>
      </div>

      <div className="cells grid grid-cols-10 gap-1 ltr">
        {cells.map((cell) => {
          const isOn = cell.order < activeCount;
          return (
            <i
              key={cell.order}
              className="aspect-square rounded-[2px] transition-colors duration-300"
              style={{
                backgroundColor: isOn ? colorVar : "var(--panel)",
                borderColor: isOn ? colorVar : "var(--line)",
                borderWidth: "1px",
                borderStyle: "solid",
              }}
            />
          );
        })}
      </div>

      <div
        className="n mono font-medium text-[clamp(34px,5vw,56px)] mt-3.5 leading-none"
        style={{ color: colorVar }}
      >
        {displayPercent.toFixed(1)}%
      </div>

      <div className="s text-[var(--muted)] text-[13px] mt-1.5">{subtitle}</div>
    </div>
  );
}
