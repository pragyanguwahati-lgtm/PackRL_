"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { Replay } from "@/lib/replay";

interface StudioViewportProps {
  algo: "ffd" | "packrl";
  title: string;
  accentColor: string;
  replay: Replay | null;
  currentStep: number;
  cameraLock: boolean;
  onCameraChange?: (pos: [number, number, number], target: [number, number, number]) => void;
  sharedCameraState?: { pos: [number, number, number]; target: [number, number, number] } | null;
}

interface ItemRenderDef {
  id: number;
  label?: string;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: string;
  density: number;
  ms: number;
  stepIndex: number;
}

const TEAL_COLORS = [
  "#00E5CC",
  "#00cdb8",
  "#00b8a5",
  "#14d9c4",
  "#00a291",
  "#2ff0dc",
  "#0b8f82",
  "#38f8e5",
];

const ORANGE_COLORS = [
  "#E8A33D",
  "#d8922c",
  "#f3b455",
  "#c9811b",
  "#e09930",
  "#f8c26c",
  "#b8700a",
  "#e2aa5a",
];

function SceneContent({
  algo,
  accentColor,
  boxDims,
  items,
  unplacedItems,
  currentStep,
  ghostItem,
  cameraLock,
  onCameraChange,
  sharedCameraState,
}: {
  algo: "ffd" | "packrl";
  accentColor: string;
  boxDims: [number, number, number];
  items: ItemRenderDef[];
  unplacedItems: { id: number; dims: [number, number, number]; label?: string }[];
  currentStep: number;
  ghostItem: ItemRenderDef | null;
  cameraLock: boolean;
  onCameraChange?: (pos: [number, number, number], target: [number, number, number]) => void;
  sharedCameraState?: { pos: [number, number, number]; target: [number, number, number] } | null;
}) {
  const [W, H, D] = boxDims;
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isUpdatingRef = useRef<boolean>(false);

  // Sync camera when sharedCameraState changes
  useEffect(() => {
    if (!cameraLock || !sharedCameraState || !controlsRef.current) return;
    isUpdatingRef.current = true;
    const { pos, target } = sharedCameraState;
    controlsRef.current.object.position.set(pos[0], pos[1], pos[2]);
    controlsRef.current.target.set(target[0], target[1], target[2]);
    controlsRef.current.update();
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  }, [sharedCameraState, cameraLock]);

  // Wireframe box edges: W is x-width, D is vertical height (engine depth D), H is depth on z-axis (engine H)
  const boxLine = useMemo(() => {
    const geom = new THREE.BoxGeometry(W, D, H);
    const edges = new THREE.EdgesGeometry(geom);
    const mat = new THREE.LineBasicMaterial({
      color: 0x8a96a8,
      transparent: true,
      opacity: 0.7,
    });
    const line = new THREE.LineSegments(edges, mat);
    line.position.set(0, D / 2, 0);
    return line;
  }, [W, H, D]);

  // Ground grid
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(16, 16, 0x222b38, 0x141a23);
    g.position.y = -0.01;
    return g;
  }, []);

  // Ghost outline for next step (only when not completed)
  const ghostMesh = useMemo(() => {
    if (!ghostItem || currentStep >= items.length) return null;
    const geom = new THREE.BoxGeometry(
      Math.max(0.1, ghostItem.w - 0.05),
      Math.max(0.1, ghostItem.h - 0.05),
      Math.max(0.1, ghostItem.d - 0.05)
    );
    const edges = new THREE.EdgesGeometry(geom);
    const lineMat = new THREE.LineBasicMaterial({
      color: algo === "packrl" ? 0x00e5cc : 0xe8a33d,
      transparent: true,
      opacity: 0.6,
    });
    const lines = new THREE.LineSegments(edges, lineMat);
    lines.position.set(
      ghostItem.x + ghostItem.w / 2 - W / 2,
      ghostItem.y + ghostItem.h / 2,
      ghostItem.z + ghostItem.d / 2 - H / 2
    );
    return lines;
  }, [ghostItem, W, H, algo, currentStep, items.length]);

  // Items visible up to current step
  const visibleItems = useMemo(() => {
    return items.filter((it) => it.stepIndex <= currentStep);
  }, [items, currentStep]);

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[8, 12, 10]} intensity={0.9} />
      <directionalLight position={[-8, 6, -6]} intensity={0.3} />

      <primitive object={boxLine} />
      <primitive object={grid} />

      {/* Ghost placement preview */}
      {ghostMesh && <primitive object={ghostMesh} />}

      {/* Placed Parcels */}
      {visibleItems.map((it) => {
        const posX = it.x + it.w / 2 - W / 2;
        const posY = it.y + it.h / 2;
        const posZ = it.z + it.d / 2 - H / 2;
        const isLatest = it.stepIndex === currentStep;

        return (
          <group key={it.id} position={[posX, posY, posZ]}>
            <mesh>
              <boxGeometry
                args={[
                  Math.max(0.1, it.w - 0.06),
                  Math.max(0.1, it.h - 0.06),
                  Math.max(0.1, it.d - 0.06),
                ]}
              />
              <meshStandardMaterial
                color={it.color}
                roughness={0.45}
                metalness={0.08}
                transparent
                opacity={0.92}
              />
            </mesh>
            {/* Outline highlight on the latest placed parcel */}
            {isLatest && (
              <lineSegments>
                <edgesGeometry
                  args={[
                    new THREE.BoxGeometry(
                      Math.max(0.1, it.w - 0.04),
                      Math.max(0.1, it.h - 0.04),
                      Math.max(0.1, it.d - 0.04)
                    ),
                  ]}
                />
                <lineBasicMaterial color={0xffffff} transparent opacity={0.6} />
              </lineSegments>
            )}

            {/* Floating label on placed parcel */}
            <Html key={`badge-${it.id}`} position={[0, it.h / 2 + 0.25, 0]} center distanceFactor={22} zIndexRange={[60, 0]}>
              <div className="px-1.5 py-0.5 rounded bg-black/85 border border-white/25 text-white mono text-[9px] font-medium whitespace-nowrap pointer-events-none select-none shadow-sm backdrop-blur-xs">
                {it.label || `#${it.id}`}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Overflow / Unplaced Parcels (Always rendered on side staging pad) */}
      {unplacedItems.length > 0 && (
        <group position={[W / 2 + 2.8, 0, 0]}>
          {/* Floor staging area marker pad */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.8, Math.max(5.2, unplacedItems.length * 2.5 + 0.8)]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.12} />
          </mesh>
          <lineSegments position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(3.8, Math.max(5.2, unplacedItems.length * 2.5 + 0.8))]} />
            <lineBasicMaterial color="#ef4444" transparent opacity={0.65} />
          </lineSegments>

          {/* Floating Staging Zone 3D Header Badge */}
          <Html position={[0, 3.6, 1.4]} center distanceFactor={18} zIndexRange={[100, 0]}>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#160b0e]/95 border border-red-500/70 shadow-lg shadow-red-950/70 backdrop-blur-md pointer-events-none whitespace-nowrap select-none">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="mono text-[10px] font-semibold tracking-wider text-red-300 uppercase">
                {algo === "ffd" ? "FFD Overflow" : "Unplaced"} ({unplacedItems.length} Parcels)
              </span>
            </div>
          </Html>

          {unplacedItems.map((uItem, uIdx) => {
            const [uw, uh, ud] = uItem.dims;
            // Lay out side-by-side along Z axis
            const zSpan = (unplacedItems.length - 1) * 2.4;
            const zOffset = uIdx * 2.4 - zSpan / 2;
            const isFinished = currentStep >= items.length;

            return (
              <group key={`unplaced-${uItem.id}`} position={[0, uh / 2, zOffset]}>
                <mesh>
                  <boxGeometry args={[Math.max(0.1, uw - 0.06), Math.max(0.1, uh - 0.06), Math.max(0.1, ud - 0.06)]} />
                  <meshStandardMaterial
                    color={isFinished ? "#ef4444" : "#f87171"}
                    roughness={0.4}
                    metalness={0.12}
                    transparent
                    opacity={isFinished ? 0.85 : 0.65}
                  />
                </mesh>
                <lineSegments>
                  <edgesGeometry
                    args={[
                      new THREE.BoxGeometry(
                        Math.max(0.1, uw - 0.04),
                        Math.max(0.1, uh - 0.04),
                        Math.max(0.1, ud - 0.04)
                      ),
                    ]}
                  />
                  <lineBasicMaterial color={isFinished ? 0xff2d20 : 0xef4444} transparent opacity={0.95} />
                </lineSegments>

                {/* Individual parcel dimension tag */}
                <Html key={`unplaced-badge-${uItem.id}`} position={[0, uh / 2 + 0.35, 0]} center distanceFactor={22}>
                  <div className="px-1.5 py-0.5 rounded bg-black/85 border border-red-500/50 text-red-200 mono text-[9px] font-medium whitespace-nowrap pointer-events-none select-none shadow-sm">
                    {uItem.label || `#${uItem.id} [${uw}×${uh}×${ud}]`}
                  </div>
                </Html>
              </group>
            );
          })}
        </group>
      )}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[unplacedItems.length > 0 ? 1.3 : 0, D / 2, 0]}
        enableDamping
        dampingFactor={0.08}
        minDistance={6}
        maxDistance={24}
        maxPolarAngle={Math.PI / 2 + 0.1}
        onChange={() => {
          if (
            cameraLock &&
            onCameraChange &&
            !isUpdatingRef.current &&
            controlsRef.current
          ) {
            const cam = controlsRef.current.object;
            const tgt = controlsRef.current.target;
            onCameraChange(
              [cam.position.x, cam.position.y, cam.position.z],
              [tgt.x, tgt.y, tgt.z]
            );
          }
        }}
      />
    </>
  );
}

export function StudioViewport({
  algo,
  title,
  accentColor,
  replay,
  currentStep,
  cameraLock,
  onCameraChange,
  sharedCameraState,
}: StudioViewportProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const boxDims: [number, number, number] = replay?.box || [6, 4, 4];
  const palette = algo === "packrl" ? TEAL_COLORS : ORANGE_COLORS;

  // 6 orthogonal 90-deg rotations matching engine/items.py:
  // 0: (w, h, d), 1: (w, d, h), 2: (h, w, d), 3: (h, d, w), 4: (d, w, h), 5: (d, h, w)
  const getRotatedDims = (dims: [number, number, number], rot: number): [number, number, number] => {
    const [w, h, d] = dims;
    switch (rot) {
      case 0: return [w, h, d];
      case 1: return [w, d, h];
      case 2: return [h, w, d];
      case 3: return [h, d, w];
      case 4: return [d, w, h];
      case 5: return [d, h, w];
      default: return [w, h, d];
    }
  };

  const items: ItemRenderDef[] = useMemo(() => {
    if (!replay || !replay.steps) return [];
    return replay.steps.map((st, i) => {
      const itemMeta = replay.items.find((it) => it.id === st.itemId);
      const baseDims = itemMeta?.dims || [1, 1, 1];
      const [iw, ih, id_dim] = getRotatedDims(baseDims, st.rot);

      // In engine: pos = [x, y, z] where z is vertical drop height resting on floor (z=0)
      // In Three.js: X is width, Y is vertical height (drop_z), Z is container depth (pos_y)
      return {
        id: st.itemId,
        label: itemMeta?.label || `#${st.itemId}`,
        x: st.pos[0],
        y: st.pos[2], // vertical drop_z
        z: st.pos[1], // horizontal depth y
        w: iw,        // width along X
        h: id_dim,    // vertical height along Y (drop_z)
        d: ih,        // depth along Z (horizontal depth y)
        color: palette[i % palette.length],
        density: st.density,
        ms: st.ms,
        stepIndex: i + 1, // 1-indexed steps
      };
    });
  }, [replay, palette]);

  // Current active step metadata
  const currentStepItem = items.find((it) => it.stepIndex === currentStep);
  const currentDensity = currentStepItem ? currentStepItem.density : currentStep === 0 ? 0 : replay?.summary.density || 0;
  const currentLatency = currentStepItem ? currentStepItem.ms : 0;
  const totalSteps = items.length;

  // Next candidate step for ghost rendering
  const ghostItem = items.find((it) => it.stepIndex === currentStep + 1) || null;

  // Unplaced items that could not fit into the container
  const unplacedItems = useMemo(() => {
    if (!replay || !replay.items) return [];
    const placedItemIds = new Set(replay.steps.map((st) => st.itemId));
    return replay.items.filter((it) => !placedItemIds.has(it.id));
  }, [replay]);

  return (
    <div className="relative w-full h-full min-h-[460px] lg:min-h-[580px] bg-[var(--panel)]/40 border border-[var(--line)] rounded-lg overflow-hidden flex flex-col select-none">
      {/* Viewport Top Header Badge */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded bg-[var(--bg)]/90 border border-[var(--line)] backdrop-blur-sm mono text-[11px] sm:text-[12px] max-w-[65%] sm:max-w-none truncate">
        <span
          className="w-2 h-2 rounded-full shrink-0 animate-pulse"
          style={{ backgroundColor: accentColor }}
        />
        <span className="font-medium tracking-wider truncate" style={{ color: accentColor }}>
          {title}
        </span>
        <span className="text-[var(--teal)] opacity-90 hidden sm:inline font-mono font-medium">
          {replay?.boxCm
            ? `[${replay.boxCm[0]}×${replay.boxCm[1]}×${replay.boxCm[2]} cm]`
            : `[${boxDims[0]}×${boxDims[1]}×${boxDims[2]}]`}
        </span>
        {unplacedItems.length > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-400 text-[10px] font-semibold tracking-wide shrink-0">
            {unplacedItems.length} OVERFLOW
          </span>
        )}
      </div>

      {/* Viewport Live HUD (Top Right) */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded bg-[var(--bg)]/90 border border-[var(--line)] backdrop-blur-sm mono text-[10px] sm:text-[11px] leading-[1.6] text-[var(--muted)] pointer-events-none min-w-[125px] sm:min-w-[150px]">
        <div className="flex justify-between gap-3">
          <span>STEP</span>
          <b className="text-[var(--text)] font-medium">
            {currentStep}/{totalSteps}
          </b>
        </div>
        <div className="flex justify-between gap-3">
          <span>DENSITY</span>
          <b className="font-medium" style={{ color: accentColor }}>
            {currentDensity.toFixed(1)}%
          </b>
        </div>
        <div className="flex justify-between gap-3">
          <span>LATENCY</span>
          <b className="text-[var(--text)] font-medium">
            {currentStep > 0 ? `${currentLatency} ms` : "—"}
          </b>
        </div>
        {unplacedItems.length > 0 ? (
          <div className="flex justify-between gap-3 pt-1 mt-1 border-t border-[var(--line)]/50">
            <span className="text-red-400 font-medium">OVERFLOW</span>
            <b className="text-red-400 font-bold">
              {unplacedItems.length} items
            </b>
          </div>
        ) : (
          <div className="flex justify-between gap-3 pt-1 mt-1 border-t border-[var(--line)]/50">
            <span className="text-[var(--teal)] opacity-80">OVERFLOW</span>
            <b className="text-[var(--teal)] font-medium">
              0 (100% Fit)
            </b>
          </div>
        )}
      </div>

      {/* 3D Canvas Area */}
      <div className="relative flex-1 w-full h-full">
        {mounted ? (
          <Canvas
            camera={{ position: [10, 8.5, 13], fov: 42 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            <SceneContent
              algo={algo}
              accentColor={accentColor}
              boxDims={boxDims}
              items={items}
              unplacedItems={unplacedItems}
              currentStep={currentStep}
              ghostItem={ghostItem}
              cameraLock={cameraLock}
              onCameraChange={onCameraChange}
              sharedCameraState={sharedCameraState}
            />
          </Canvas>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--muted)] mono text-xs">
            Initializing 3D Viewport...
          </div>
        )}
      </div>

      {/* Bottom status strip */}
      <div className="px-4 py-2 border-t border-[var(--line)] bg-[var(--bg)]/60 flex justify-between items-center text-[11px] mono text-[var(--muted)] z-10">
        <span className="flex items-center gap-1.5 truncate">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
              unplacedItems.length > 0 ? "bg-red-400 animate-pulse" : "bg-[var(--muted)] opacity-60"
            }`}
          />
          <span className="truncate">
            {currentStep === 0
              ? unplacedItems.length > 0
                ? `Ready · Order has ${unplacedItems.length} parcels that will overflow outside container`
                : "Ready for packing"
              : currentStep < totalSteps
              ? `Placed item #${currentStepItem?.id ?? currentStep} (stable bottom support)`
              : unplacedItems.length > 0
              ? `⚠️ Container Full: ${unplacedItems.length} parcels overflowed outside`
              : "Packing completed · All candidate parcels contained"}
          </span>
        </span>
        <span className="hidden xl:inline opacity-70 shrink-0 text-[10px]">
          Orbit: Left Click · Pan: Right Click · Zoom: Scroll
        </span>
      </div>
    </div>
  );
}
