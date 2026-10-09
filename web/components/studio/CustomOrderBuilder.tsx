"use client";

import React, { useState } from "react";
import {
  type CustomBoxInput,
  STANDARD_CONTAINERS,
  selectSmallestContainer,
  packWithRL,
  packWithFFD,
} from "@/lib/packer";
import { usePackStore } from "@/lib/store";

interface CustomOrderBuilderProps {
  onPacked?: () => void;
}

export function CustomOrderBuilder({ onPacked }: CustomOrderBuilderProps) {
  const { setReplayRL, setReplayFFD, resetClock } = usePackStore();

  const [boxes, setBoxes] = useState<CustomBoxInput[]>([
    { id: 1, label: "Box 1", w: 12, h: 14, d: 10, qty: 1 },
    { id: 2, label: "Box 2", w: 15, h: 12, d: 5, qty: 1 },
    { id: 3, label: "Box 3", w: 10, h: 10, d: 10, qty: 1 },
    { id: 4, label: "Box 4", w: 14, h: 10, d: 8, qty: 1 },
  ]);

  const [selectedContainerId, setSelectedContainerId] = useState<string>("auto");
  const [customContainer, setCustomContainer] = useState<{ w: number; d: number; h: number }>({
    w: 35,
    d: 25,
    h: 20,
  });
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [solveStatus, setSolveStatus] = useState<string | null>(null);

  // Computed summary
  const totalItemCount = boxes.reduce((acc, b) => acc + (b.qty || 1), 0);
  const totalVolumeCm3 = boxes.reduce((acc, b) => acc + b.w * b.h * b.d * (b.qty || 1), 0);
  const activeContainer = selectSmallestContainer(boxes, selectedContainerId, customContainer);
  const containerVolCm3 =
    activeContainer.dimsCm[0] * activeContainer.dimsCm[1] * activeContainer.dimsCm[2];
  const estDensity = Math.min(100, Math.round((totalVolumeCm3 / containerVolCm3) * 100));

  const handleAddBox = () => {
    const nextId = boxes.length > 0 ? Math.max(...boxes.map((b) => b.id)) + 1 : 1;
    setBoxes([
      ...boxes,
      {
        id: nextId,
        label: `Box ${nextId}`,
        w: 12,
        h: 12,
        d: 8,
        qty: 1,
      },
    ]);
  };

  const handleUpdateBox = (
    id: number,
    field: "label" | "w" | "h" | "d" | "qty",
    val: string | number
  ) => {
    setBoxes(
      boxes.map((b) => {
        if (b.id !== id) return b;
        if (field === "label") return { ...b, label: String(val) };
        const num = Math.max(1, Number(val) || 1);
        return { ...b, [field]: num };
      })
    );
  };

  const handleRemoveBox = (id: number) => {
    if (boxes.length <= 1) return;
    setBoxes(boxes.filter((b) => b.id !== id));
  };

  const handleLoadUserExample = () => {
    setBoxes([
      { id: 1, label: "Box 1", w: 12, h: 14, d: 10, qty: 1 },
      { id: 2, label: "Box 2", w: 15, h: 12, d: 5, qty: 1 },
      { id: 3, label: "Box 3", w: 10, h: 10, d: 10, qty: 1 },
      { id: 4, label: "Box 4", w: 14, h: 10, d: 8, qty: 1 },
    ]);
    setSelectedContainerId("auto");
    setSolveStatus(null);
  };

  const handleLoadHeavyOrder = () => {
    setBoxes([
      { id: 1, label: "Heavy Crate", w: 16, h: 14, d: 12, qty: 1 },
      { id: 2, label: "Parcel A", w: 12, h: 10, d: 8, qty: 2 },
      { id: 3, label: "Flat Pack", w: 20, h: 14, d: 6, qty: 1 },
      { id: 4, label: "Small Cube", w: 10, h: 10, d: 10, qty: 2 },
    ]);
    setSelectedContainerId("auto");
    setSolveStatus(null);
  };

  const handlePack = () => {
    setIsSolving(true);
    setSolveStatus("Solving with PackRL_ floor-first policy...");

    setTimeout(() => {
      try {
        const container = selectSmallestContainer(boxes, selectedContainerId, customContainer);
        const replayRL = packWithRL(boxes, container);
        const replayFFD = packWithFFD(boxes, container);

        setReplayRL(replayRL);
        setReplayFFD(replayFFD);
        resetClock();

        const unplacedRL = replayRL.items.length - replayRL.steps.length;
        const unplacedFFD = replayFFD.items.length - replayFFD.steps.length;

        if (unplacedRL === 0) {
          setSolveStatus(
            `✓ Solved! PackRL packed ALL ${replayRL.items.length} boxes (0 overflow) into ${container.name}. FFD left ${unplacedFFD} overflow parcels.`
          );
        } else {
          setSolveStatus(
            `Packed ${replayRL.steps.length}/${replayRL.items.length} boxes (${replayRL.summary.density}% density) into ${container.name}. ${unplacedRL} box(es) could not fit in this custom container.`
          );
        }

        if (onPacked) onPacked();
      } catch (err) {
        console.error("Pack error:", err);
        setSolveStatus("Error calculating packing.");
      } finally {
        setIsSolving(false);
      }
    }, 150);
  };

  return (
    <div className="w-full bg-[var(--panel)] border border-[var(--line)] rounded-lg overflow-hidden transition-all duration-200">
      {/* Top Banner Bar */}
      <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--panel)]/70">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--teal)] animate-pulse" />
          <div>
            <div className="mono text-xs sm:text-sm font-semibold tracking-wider flex items-center gap-2">
              <span>CUSTOM ORDER BUILDER</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--teal)]/15 text-[var(--teal)] border border-[var(--teal)]/30 font-normal hidden sm:inline">
                Interactive Solver
              </span>
            </div>
            <div className="mono text-[11px] text-[var(--muted)] opacity-80">
              Add boxes with dimensions (cm) · Auto-sizes smallest container · Solves with floor-first PackRL_
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Quick preset buttons */}
          <button
            onClick={handleLoadUserExample}
            type="button"
            className="px-2.5 py-1 rounded border border-[var(--line)] bg-[var(--bg)] hover:border-[var(--muted)] text-[var(--muted)] hover:text-[var(--text)] mono text-[11px] transition-colors cursor-pointer"
            title="Load Box 1 (12×14×10), Box 2 (15×12×5), etc."
          >
            Example Cart
          </button>
          <button
            onClick={handleLoadHeavyOrder}
            type="button"
            className="px-2.5 py-1 rounded border border-[var(--line)] bg-[var(--bg)] hover:border-[var(--muted)] text-[var(--muted)] hover:text-[var(--text)] mono text-[11px] transition-colors cursor-pointer hidden md:inline"
          >
            Heavy Cargo
          </button>

          {/* Toggle Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
            className="px-2.5 py-1 rounded border border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)] mono text-[11px] transition-colors cursor-pointer"
          >
            {isExpanded ? "▲ Hide Builder" : "▼ Edit Boxes"}
          </button>
        </div>
      </div>

      {/* Expanded Builder Area */}
      {isExpanded && (
        <div className="p-3 sm:p-4 flex flex-col gap-4">
          {/* Controls Bar: Container Selector & Summary Stats */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded bg-[var(--bg)] border border-[var(--line)]">
            {/* Container Selector */}
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <label htmlFor="container-select" className="mono text-[11px] text-[var(--muted)] uppercase whitespace-nowrap">
                CONTAINER:
              </label>
              <select
                id="container-select"
                value={selectedContainerId}
                onChange={(e) => setSelectedContainerId(e.target.value)}
                className="flex-1 mono text-[11px] sm:text-xs bg-[var(--panel)] text-[var(--text)] border border-[var(--line)] rounded px-2.5 py-1.5 focus:outline-none focus:border-[var(--teal)] cursor-pointer"
              >
                <option value="auto">
                  ⚡ Auto-Select Smallest Container ({selectSmallestContainer(boxes, "auto").name})
                </option>
                <option value="custom">
                  🛠 Custom Main Box Size [{customContainer.w}×{customContainer.d}×{customContainer.h} cm]
                </option>
                <optgroup label="Standard Logistics Containers">
                  {STANDARD_CONTAINERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Order Stats readout */}
            <div className="flex items-center gap-3 sm:gap-4 mono text-[11px] text-[var(--muted)]">
              <div>
                ITEMS: <b className="text-[var(--text)]">{totalItemCount}</b>
              </div>
              <div className="hidden sm:block">
                VOLUME:{" "}
                <b className="text-[var(--text)]">
                  {(totalVolumeCm3 / 1000).toFixed(1)} L ({totalVolumeCm3.toLocaleString()} cm³)
                </b>
              </div>
              <div>
                EST. DENSITY:{" "}
                <b className="text-[var(--teal)]">{estDensity}%</b>
              </div>
            </div>
          </div>

          {/* Custom Container Dimensions Sub-Panel */}
          {selectedContainerId === "custom" && (
            <div className="p-3 sm:p-3.5 rounded-lg bg-[var(--bg)]/90 border border-[var(--teal)]/40 shadow-sm flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--teal)] animate-pulse" />
                  <span className="mono text-xs font-semibold text-[var(--text)] tracking-wider">
                    CUSTOM MAIN CONTAINER DIMENSIONS
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--teal)]/15 text-[var(--teal)] mono border border-[var(--teal)]/30">
                    Target Box
                  </span>
                </div>

                {/* Quick container dimension presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mono text-[10px] text-[var(--muted)] mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setCustomContainer({ w: 28, d: 20, h: 15 })}
                    className="px-2 py-0.5 rounded border border-[var(--line)] bg-[var(--panel)] hover:border-[var(--teal)]/50 text-[var(--muted)] hover:text-[var(--text)] mono text-[10px] transition-colors cursor-pointer"
                  >
                    Mailer 28×20×15
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomContainer({ w: 35, d: 25, h: 20 })}
                    className="px-2 py-0.5 rounded border border-[var(--line)] bg-[var(--panel)] hover:border-[var(--teal)]/50 text-[var(--muted)] hover:text-[var(--text)] mono text-[10px] transition-colors cursor-pointer"
                  >
                    Carton 35×25×20
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomContainer({ w: 45, d: 35, h: 30 })}
                    className="px-2 py-0.5 rounded border border-[var(--line)] bg-[var(--panel)] hover:border-[var(--teal)]/50 text-[var(--muted)] hover:text-[var(--text)] mono text-[10px] transition-colors cursor-pointer"
                  >
                    Crate 45×35×30
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Width W */}
                <div className="flex items-center gap-2 bg-[var(--panel)] px-3 py-2 rounded border border-[var(--line)] focus-within:border-[var(--teal)] transition-colors">
                  <label htmlFor="custom-w" className="mono text-[11px] text-[var(--muted)] font-medium w-20">
                    WIDTH (W):
                  </label>
                  <input
                    id="custom-w"
                    type="number"
                    min={5}
                    max={200}
                    value={customContainer.w}
                    onChange={(e) =>
                      setCustomContainer({
                        ...customContainer,
                        w: Math.max(5, Number(e.target.value) || 5),
                      })
                    }
                    className="w-full bg-transparent text-[var(--text)] mono text-xs focus:outline-none"
                  />
                  <span className="mono text-[10px] text-[var(--muted)]">cm</span>
                </div>

                {/* Depth D */}
                <div className="flex items-center gap-2 bg-[var(--panel)] px-3 py-2 rounded border border-[var(--line)] focus-within:border-[var(--teal)] transition-colors">
                  <label htmlFor="custom-d" className="mono text-[11px] text-[var(--muted)] font-medium w-20">
                    DEPTH (D):
                  </label>
                  <input
                    id="custom-d"
                    type="number"
                    min={5}
                    max={200}
                    value={customContainer.d}
                    onChange={(e) =>
                      setCustomContainer({
                        ...customContainer,
                        d: Math.max(5, Number(e.target.value) || 5),
                      })
                    }
                    className="w-full bg-transparent text-[var(--text)] mono text-xs focus:outline-none"
                  />
                  <span className="mono text-[10px] text-[var(--muted)]">cm</span>
                </div>

                {/* Height H */}
                <div className="flex items-center gap-2 bg-[var(--panel)] px-3 py-2 rounded border border-[var(--line)] focus-within:border-[var(--teal)] transition-colors">
                  <label htmlFor="custom-h" className="mono text-[11px] text-[var(--muted)] font-medium w-20">
                    HEIGHT (H):
                  </label>
                  <input
                    id="custom-h"
                    type="number"
                    min={5}
                    max={200}
                    value={customContainer.h}
                    onChange={(e) =>
                      setCustomContainer({
                        ...customContainer,
                        h: Math.max(5, Number(e.target.value) || 5),
                      })
                    }
                    className="w-full bg-transparent text-[var(--text)] mono text-xs focus:outline-none"
                  />
                  <span className="mono text-[10px] text-[var(--muted)]">cm</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] mono text-[var(--muted)] pt-0.5 px-0.5">
                <div>
                  Container Volume:{" "}
                  <b className="text-[var(--text)]">
                    {(
                      (customContainer.w * customContainer.d * customContainer.h) /
                      1000
                    ).toFixed(1)}{" "}
                    L (
                    {(
                      customContainer.w *
                      customContainer.d *
                      customContainer.h
                    ).toLocaleString()}{" "}
                    cm³)
                  </b>
                </div>
                <div>
                  Grid Resolution:{" "}
                  <b className="text-[var(--teal)]">
                    {activeContainer.voxels[0]}×{activeContainer.voxels[1]}×
                    {activeContainer.voxels[2]} voxels
                  </b>
                </div>
              </div>
            </div>
          )}

          {/* Box List Table */}
          <div className="overflow-x-auto border border-[var(--line)] rounded-lg">
            <table className="w-full text-left mono text-xs">
              <thead className="bg-[var(--bg)] border-b border-[var(--line)] text-[var(--muted)] text-[11px]">
                <tr>
                  <th className="py-2 px-3 font-medium">BOX NAME / TAG</th>
                  <th className="py-2 px-3 font-medium w-[90px]">WIDTH (W)</th>
                  <th className="py-2 px-3 font-medium w-[90px]">DEPTH (D)</th>
                  <th className="py-2 px-3 font-medium w-[90px]">HEIGHT (H)</th>
                  <th className="py-2 px-3 font-medium w-[70px]">QTY</th>
                  <th className="py-2 px-3 font-medium w-[100px] text-right">VOLUME</th>
                  <th className="py-2 px-3 font-medium w-[40px] text-center">DEL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] bg-[var(--panel)]/40">
                {boxes.map((b) => {
                  const vol = b.w * b.h * b.d * (b.qty || 1);
                  return (
                    <tr key={b.id} className="hover:bg-[var(--line)]/30 transition-colors">
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={b.label}
                          onChange={(e) => handleUpdateBox(b.id, "label", e.target.value)}
                          className="w-full bg-[var(--bg)] border border-[var(--line)] rounded px-2 py-1 text-xs focus:outline-none focus:border-[var(--teal)]"
                          placeholder="e.g. Box 1"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={b.w}
                            onChange={(e) => handleUpdateBox(b.id, "w", e.target.value)}
                            className="w-full bg-[var(--bg)] border border-[var(--line)] rounded px-2 py-1 text-xs focus:outline-none focus:border-[var(--teal)] text-right"
                          />
                          <span className="text-[var(--muted)] text-[10px]">cm</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={b.h}
                            onChange={(e) => handleUpdateBox(b.id, "h", e.target.value)}
                            className="w-full bg-[var(--bg)] border border-[var(--line)] rounded px-2 py-1 text-xs focus:outline-none focus:border-[var(--teal)] text-right"
                          />
                          <span className="text-[var(--muted)] text-[10px]">cm</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={b.d}
                            onChange={(e) => handleUpdateBox(b.id, "d", e.target.value)}
                            className="w-full bg-[var(--bg)] border border-[var(--line)] rounded px-2 py-1 text-xs focus:outline-none focus:border-[var(--teal)] text-right"
                          />
                          <span className="text-[var(--muted)] text-[10px]">cm</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={b.qty}
                          onChange={(e) => handleUpdateBox(b.id, "qty", e.target.value)}
                          className="w-full bg-[var(--bg)] border border-[var(--line)] rounded px-2 py-1 text-xs focus:outline-none focus:border-[var(--teal)] text-center"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right text-[var(--muted)] text-[11px]">
                        {vol.toLocaleString()} cm³
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveBox(b.id)}
                          disabled={boxes.length <= 1}
                          className="text-[var(--muted)] hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              onClick={handleAddBox}
              type="button"
              className="px-3 py-1.5 rounded border border-dashed border-[var(--line)] bg-[var(--bg)] hover:border-[var(--muted)] text-[var(--muted)] hover:text-[var(--text)] mono text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>+ Add Another Box</span>
            </button>

            {/* Primary Solve CTA */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePack}
                disabled={isSolving}
                type="button"
                className="px-5 py-2 rounded border border-[var(--teal)] bg-[var(--teal)] text-black font-semibold mono text-xs tracking-wider shadow-lg shadow-[var(--teal)]/20 hover:bg-[var(--teal)]/90 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
              >
                <span>{isSolving ? "⚡ Solving Packing..." : "⚡ Pack Order with PackRL_"}</span>
              </button>
            </div>
          </div>

          {/* Status Message */}
          {solveStatus && (
            <div
              className={`p-2.5 rounded mono text-xs border ${
                solveStatus.startsWith("✓")
                  ? "bg-teal-950/40 border-teal-500/50 text-teal-200"
                  : "bg-[var(--bg)] border-[var(--line)] text-[var(--muted)]"
              }`}
            >
              {solveStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
