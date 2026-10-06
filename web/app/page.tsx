"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DotField } from "@/components/fx/DotField";
import { HeroScene } from "@/components/scene/HeroScene";
import { Hud } from "@/components/ui/Hud";
import { VoxelMeter } from "@/components/metrics/VoxelMeter";
import { validateReplay, type Replay } from "@/lib/replay";

export default function LandingPage() {
  const [replay, setReplay] = useState<Replay | null>(null);
  const [hudState, setHudState] = useState({
    step: 0,
    density: 0,
    latency: 0,
  });

  // Load and Zod-validate mock replay JSON
  useEffect(() => {
    async function loadMockReplay() {
      try {
        const res = await fetch("/replays/mock_packrl.json");
        if (res.ok) {
          const raw = await res.json();
          const parsed = validateReplay(raw);
          setReplay(parsed);
        }
      } catch (err) {
        console.warn("Using built-in layout for hero scene:", err);
      }
    }
    loadMockReplay();
  }, []);

  // Reveal animation using IntersectionObserver
  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = document.querySelectorAll<HTMLElement>(".rv");

    if (isReduced) {
      elements.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            observer.unobserve(el);
            el.style.opacity = "1";
            el.style.transform = "translateY(0px)";
          }
        });
      },
      { threshold: 0.05, rootMargin: "300px" }
    );

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      el.style.transition =
        "opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)";
      if (rect.top <= window.innerHeight * 1.2) {
        el.style.opacity = "1";
        el.style.transform = "translateY(0px)";
      } else {
        el.style.opacity = "0.05";
        el.style.transform = "translateY(24px)";
        observer.observe(el);
      }
    });

    // Fallback: make sure all elements reach full opacity after initial interaction
    const timer = setTimeout(() => {
      elements.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0px)";
      });
    }, 1200);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const totalSteps = replay?.steps?.length || 7;

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)] overflow-x-hidden">
      {/* Background canvas layer */}
      <DotField />

      {/* Navigation */}
      <nav className="absolute top-[env(safe-area-inset-top,0px)] left-0 right-0 z-40 flex justify-between items-center px-6 py-[22px] text-[14px]">
        <Link href="/" className="logo mono text-[var(--text)] no-underline">
          Pack<b className="text-[var(--teal)] font-medium">RL</b>_
        </Link>
        <Link
          href="/studio"
          className="mono text-[var(--muted)] hover:text-[var(--text)] transition-colors no-underline"
        >
          Studio →
        </Link>
      </nav>

      {/* Hero Header */}
      <header className="hero relative min-h-[100svh] flex items-end overflow-hidden border-b border-[var(--line)]">
        {/* Dynamic cursor spotlight */}
        <div
          id="spot"
          className="spot absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(560px circle at var(--mx,72%) var(--my,38%), rgba(0,229,204,0.09), transparent 62%)",
          }}
        />

        {/* 3D Packing Scene */}
        <HeroScene
          replay={replay}
          onStepChange={(step, density, latency) => {
            setHudState({ step, density, latency });
          }}
        />

        {/* Live HUD */}
        <Hud
          step={hudState.step}
          totalSteps={totalSteps}
          density={hudState.density}
          latency={hudState.latency}
          isIllustrative={replay?.illustrative ?? true}
        />

        {/* Left-aligned editorial Hero content */}
        <div className="wrap relative z-20 w-full pb-16 pointer-events-none">
          <h1 className="display-title text-[clamp(52px,10.5vw,138px)] max-w-[9ch] leading-[0.95] tracking-[-0.035em]">
            Fewer boxes. Less <em className="not-italic text-[var(--teal)]">air.</em>
          </h1>
          <p className="lede text-[var(--muted)] max-w-[40ch] mt-[22px] mb-7 text-[17px] leading-[1.6]">
            A reinforcement-learning agent that learns where every parcel goes, and
            decides in under 50 milliseconds.
          </p>
          <Link
            href="/studio"
            className="go text-[15px] border-b border-[var(--teal)] pb-[3px] text-[var(--text)] hover:text-[var(--teal)] transition-colors inline-block pointer-events-auto no-underline"
          >
            Watch it pack, side by side with the heuristic
          </Link>
        </div>
      </header>

      {/* The Void Problem Section */}
      <section id="void" className="py-[clamp(72px,12vw,150px)] border-b border-[var(--line)] relative z-10">
        <div className="wrap grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-9 md:gap-12 items-start">
          <div>
            <h2 className="display-title rv text-[clamp(38px,6.4vw,84px)]">
              A third of every box is <span className="text-[var(--orange)]">air.</span>
            </h2>
            <p className="t rv text-[var(--muted)] max-w-[46ch] mt-[22px] text-[17px] leading-[1.6]">
              Fixed heuristics like First-Fit Decreasing are fast but blind: they
              leave 25–40% of the box empty, and they never improve. Exact search is
              optimal and far too slow for a live conveyor.
            </p>
          </div>

          <div className="meters grid grid-cols-1 sm:grid-cols-2 gap-7">
            <VoxelMeter
              label="FFD BASELINE"
              targetPercent={67.5}
              cellsCount={68}
              variant="orange"
              subtitle="≈32.5% void · exponential at scale"
            />
            <VoxelMeter
              label="PACKRL_ TARGET"
              targetPercent={85.0}
              cellsCount={85}
              variant="teal"
              subtitle="≤15% void · <50 ms per decision"
            />
          </div>
        </div>
      </section>

      {/* The Loop Section */}
      <section id="loop" className="py-[clamp(72px,12vw,150px)] border-b border-[var(--line)] relative z-10">
        <div className="wrap">
          <h2 className="display-title rv text-[clamp(38px,6.4vw,84px)] max-w-[12ch]">
            The box is a grid. The grid is the lesson.
          </h2>

          <div className="rows border-t border-[var(--line)] mt-14">
            <div className="row rv grid grid-cols-[48px_1fr] sm:grid-cols-[90px_1fr_1.3fr] gap-4 sm:gap-6 items-baseline py-[30px] border-b border-[var(--line)]">
              <span className="i mono text-[var(--teal)] text-[14px]">01</span>
              <h3 className="display-title text-[clamp(26px,3.4vw,42px)] tracking-[-0.02em] leading-none m-0">
                Observe
              </h3>
              <p className="col-span-2 sm:col-span-1 text-[var(--muted)] m-0 text-[17px]">
                The container becomes a 3D occupancy tensor, paired with the size
                and fragility of every item still waiting.
              </p>
            </div>

            <div className="row rv grid grid-cols-[48px_1fr] sm:grid-cols-[90px_1fr_1.3fr] gap-4 sm:gap-6 items-baseline py-[30px] border-b border-[var(--line)]">
              <span className="i mono text-[var(--teal)] text-[14px]">02</span>
              <h3 className="display-title text-[clamp(26px,3.4vw,42px)] tracking-[-0.02em] leading-none m-0">
                Mask
              </h3>
              <p className="col-span-2 sm:col-span-1 text-[var(--muted)] m-0 text-[17px]">
                Overlaps and out-of-bounds placements are removed before the
                policy chooses, so it spends its capacity on geometry.
              </p>
            </div>

            <div className="row rv grid grid-cols-[48px_1fr] sm:grid-cols-[90px_1fr_1.3fr] gap-4 sm:gap-6 items-baseline py-[30px] border-b border-[var(--line)]">
              <span className="i mono text-[var(--teal)] text-[14px]">03</span>
              <h3 className="display-title text-[clamp(26px,3.4vw,42px)] tracking-[-0.02em] leading-none m-0">
                Reward
              </h3>
              <p className="col-span-2 sm:col-span-1 text-[var(--muted)] m-0 text-[17px]">
                Volume gained and stable support score points; invalid and
                unplaced items cost them. 50,000+ synthetic orders later, intuition.
              </p>
            </div>
          </div>

          <div className="stack mono rv text-[var(--muted)] text-[13px] mt-12 leading-[2] flex flex-wrap gap-x-2">
            {[
              "Gymnasium",
              "Stable-Baselines3",
              "Maskable PPO",
              "PyTorch",
              "React Three Fiber",
              "Motion",
              "Bklit UI",
            ].map((tech, idx, arr) => (
              <span key={tech}>
                {tech}
                {idx < arr.length - 1 && (
                  <span className="text-[var(--line)] ml-2 select-none">/</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="studio" className="cta py-[clamp(80px,14vw,180px)] relative z-10">
        <div className="wrap rv">
          <Link
            href="/studio"
            className="group display-title text-[clamp(40px,8vw,112px)] tracking-[-0.035em] no-underline leading-none inline-block text-[var(--text)] hover:text-[var(--text)]"
          >
            Open the Studio{" "}
            <span className="text-[var(--teal)] inline-block transition-transform duration-300 group-hover:translate-x-3">
              →
            </span>
          </Link>
          <p className="t text-[var(--muted)] mt-5 text-[17px]">
            Same order, two algorithms, one timeline.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 pb-9 max-w-[1200px] mx-auto flex justify-between gap-4 flex-wrap text-[var(--muted)] text-[12px] mono border-t border-[var(--line)]/50 pt-8">
        <span>PackRL_ · Tensor Bros</span>
        <span>IEEE Hackathon 2026 · Track 03.2</span>
      </footer>
    </div>
  );
}
