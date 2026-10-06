"use client";

import React, { useEffect, useRef } from "react";

interface Beam {
  c: number;
  y: number;
  v: number;
  l: number;
}

export function DotField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let isVisible = true;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = window.innerWidth;
    let H = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const GAP = 34;
    let beams: Beam[] = [];
    let mx = -999;
    let my = -999;

    function resize() {
      if (!canvas || !ctx) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const colCount = Math.floor(W / GAP);
      beams = [];
      for (let i = 0; i < 6; i++) {
        beams.push({
          c: Math.floor(Math.random() * colCount),
          y: Math.random() * H,
          v: 0.5 + Math.random() * 1.1,
          l: 90 + Math.random() * 120,
        });
      }
    }

    function onPointerMove(e: PointerEvent) {
      mx = e.clientX;
      my = e.clientY;
      const spot = document.getElementById("spot");
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
    }

    function onVisibilityChange() {
      isVisible = !document.hidden;
      if (isVisible && !reduceMotion) {
        animId = requestAnimationFrame(draw);
      }
    }

    function draw() {
      if (!ctx || !isVisible) return;
      ctx.clearRect(0, 0, W, H);

      // Dot grid
      for (let gx = GAP / 2; gx < W; gx += GAP) {
        for (let gy = GAP / 2; gy < H; gy += GAP) {
          const d = Math.hypot(gx - mx, gy - my);
          const b = d < 190 ? 1 - d / 190 : 0;
          ctx.fillStyle =
            b > 0
              ? `rgba(0, 229, 204, ${0.14 + b * 0.7})`
              : "rgba(138, 150, 168, 0.14)";
          const size = 2 + b * 1.5;
          ctx.fillRect(gx - 1, gy - 1, size, size);
        }
      }

      // Beams
      const colCount = Math.max(1, Math.floor(W / GAP));
      beams.forEach((beam) => {
        const bx = beam.c * GAP + GAP / 2;
        const g = ctx.createLinearGradient(0, beam.y - beam.l, 0, beam.y);
        g.addColorStop(0, "rgba(0, 229, 204, 0)");
        g.addColorStop(1, "rgba(0, 229, 204, 0.55)");
        ctx.fillStyle = g;
        ctx.fillRect(bx - 0.5, beam.y - beam.l, 1, beam.l);

        if (!reduceMotion) {
          beam.y += beam.v;
          if (beam.y - beam.l > H) {
            beam.y = 0;
            beam.c = Math.floor(Math.random() * colCount);
          }
        }
      });

      if (!reduceMotion) {
        animId = requestAnimationFrame(draw);
      }
    }

    resize();
    draw();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bg"
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
