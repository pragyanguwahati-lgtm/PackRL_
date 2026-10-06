"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Replay } from "@/lib/replay";

interface HeroSceneProps {
  replay?: Replay | null;
  onStepChange?: (step: number, density: number, latency: number) => void;
}

interface ItemDef {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: string;
  density: number;
  latency: number;
}

// Fallback layout per landing page v3
const DEFAULT_ITEMS: ItemDef[] = [
  { x: 0, y: 0, z: 0, w: 3, h: 2, d: 2, color: "#00E5CC", density: 12.5, latency: 11 },
  { x: 3, y: 0, z: 0, w: 3, h: 2, d: 2, color: "#00cdb8", density: 25.0, latency: 9 },
  { x: 0, y: 0, z: 2, w: 2, h: 2, d: 2, color: "#00b8a5", density: 33.3, latency: 14 },
  { x: 2, y: 0, z: 2, w: 4, h: 1, d: 2, color: "#14d9c4", density: 41.7, latency: 12 },
  { x: 2, y: 1, z: 2, w: 4, h: 1, d: 2, color: "#00a291", density: 50.0, latency: 10 },
  { x: 0, y: 2, z: 0, w: 3, h: 2, d: 4, color: "#2ff0dc", density: 75.0, latency: 13 },
  { x: 3, y: 2, z: 0, w: 3, h: 2, d: 2, color: "#0b8f82", density: 87.5, latency: 12 },
];

const TEAL_PALETTE = [
  "#00E5CC",
  "#00cdb8",
  "#00b8a5",
  "#14d9c4",
  "#00a291",
  "#2ff0dc",
  "#0b8f82",
  "#38f8e5",
];

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function PackingGroup({
  items,
  boxDims,
  onStepChange,
}: {
  items: ItemDef[];
  boxDims: [number, number, number];
  onStepChange?: (step: number, density: number, latency: number) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lastStepRef = useRef<number>(-1);
  const pointerXRef = useRef<number>(0);
  const { camera, size } = useThree();

  const [W, H, D] = boxDims;

  // Track pointer for subtle parallax
  useEffect(() => {
    function handlePointer(e: PointerEvent) {
      pointerXRef.current = e.clientX / window.innerWidth - 0.5;
    }
    window.addEventListener("pointermove", handlePointer);
    return () => window.removeEventListener("pointermove", handlePointer);
  }, []);

  // Responsive camera and group position per DESIGN.md (hero text bottom-left, scene bleeds right)
  useEffect(() => {
    const isWide = size.width > 820;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 38;
      if (isWide) {
        camera.position.set(-1, 6.5, 13);
        camera.lookAt(2.6, 0.6, 0);
      } else {
        camera.position.set(0, 9, 14);
        camera.lookAt(0, 0.8, 0);
      }
      camera.updateProjectionMatrix();
    }
    if (groupRef.current) {
      groupRef.current.position.set(isWide ? 2.6 : 0, isWide ? 0 : 1.2, 0);
    }
  }, [camera, size.width]);

  // Wireframe box edges
  const boxLineSegments = useMemo(() => {
    const geom = new THREE.BoxGeometry(W, H, D);
    const edges = new THREE.EdgesGeometry(geom);
    const mat = new THREE.LineBasicMaterial({
      color: 0x8a96a8,
      transparent: true,
      opacity: 0.75,
    });
    const line = new THREE.LineSegments(edges, mat);
    line.position.y = H / 2;
    return line;
  }, [W, H, D]);

  // Grid helper
  const gridHelper = useMemo(() => {
    const grid = new THREE.GridHelper(16, 16, 0x222b38, 0x181f29);
    grid.position.y = -0.01;
    return grid;
  }, []);

  // Precomputed settled targets
  const targets = useMemo(() => {
    return items.map((it) => ({
      x: it.x + it.w / 2 - W / 2,
      y: it.y + it.h / 2,
      z: it.z + it.d / 2 - D / 2,
    }));
  }, [items, W, D]);

  const stepDuration = 700;
  const dropDuration = 900;
  const cycleDuration = items.length * stepDuration + dropDuration + 2600;

  useFrame((state) => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = state.clock.getElapsedTime() * 1000;
    const t = isReduced ? cycleDuration - 100 : now % cycleDuration;

    let currentStep = 0;

    items.forEach((_, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      const target = targets[i];

      const elapsed = t - i * stepDuration;
      const progress = Math.max(0, Math.min(1, elapsed / dropDuration));

      mesh.visible = elapsed > 0;
      mesh.position.set(
        target.x,
        target.y + (1 - easeOutCubic(progress)) * 7,
        target.z
      );

      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        let opacity = 0.95 * Math.min(1, progress * 3);
        if (t > cycleDuration - 500) {
          const fadeProgress = (cycleDuration - t) / 500;
          opacity = 0.95 * fadeProgress;
        }
        mat.opacity = opacity;
      }

      if (progress >= 1) {
        currentStep = i + 1;
      }
    });

    if (currentStep !== lastStepRef.current) {
      lastStepRef.current = currentStep;
      if (onStepChange) {
        const itemInfo = currentStep > 0 ? items[currentStep - 1] : null;
        onStepChange(
          currentStep,
          itemInfo ? itemInfo.density : 0,
          itemInfo ? itemInfo.latency : 0
        );
      }
    }

    if (groupRef.current && !isReduced) {
      groupRef.current.rotation.y =
        -0.35 + now * 0.00009 + pointerXRef.current * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={boxLineSegments} />
      <primitive object={gridHelper} />
      {items.map((it, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            meshRefs.current[idx] = el;
          }}
        >
          <boxGeometry
            args={[
              Math.max(0.1, it.w - 0.07),
              Math.max(0.1, it.h - 0.07),
              Math.max(0.1, it.d - 0.07),
            ]}
          />
          <meshStandardMaterial
            color={it.color}
            roughness={0.5}
            metalness={0.05}
            transparent
            opacity={0.95}
          />
        </mesh>
      ))}
    </group>
  );
}

export function HeroScene({ replay, onStepChange }: HeroSceneProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items: ItemDef[] = useMemo(() => {
    if (!replay || !replay.steps || replay.steps.length === 0) {
      return DEFAULT_ITEMS;
    }

    // Build items from loaded replay
    return replay.steps.map((st, i) => {
      const itemMeta = replay.items.find((it) => it.id === st.itemId);
      const dims = itemMeta?.dims || [1, 1, 1];
      const color = TEAL_PALETTE[i % TEAL_PALETTE.length];
      return {
        x: st.pos[0],
        y: st.pos[1],
        z: st.pos[2],
        w: dims[0],
        h: dims[1],
        d: dims[2],
        color,
        density: st.density,
        latency: st.ms,
      };
    });
  }, [replay]);

  const boxDims: [number, number, number] = useMemo(() => {
    return replay?.box || [6, 4, 4];
  }, [replay]);

  if (!mounted) {
    return <div className="absolute inset-0 w-full h-full bg-transparent" />;
  }

  return (
    <Canvas
      id="c"
      aria-label="3D animation: items packing into a shipping box one by one"
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 38, position: [10, 7.5, 12] }}
      dpr={[1, 2]}
      className="absolute inset-0 w-full h-full"
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 10, 8]} intensity={0.85} />
      <PackingGroup
        items={items}
        boxDims={boxDims}
        onStepChange={onStepChange}
      />
    </Canvas>
  );
}
