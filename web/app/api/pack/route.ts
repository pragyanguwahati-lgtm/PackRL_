import { NextResponse } from "next/server";
import {
  packWithRL,
  packWithFFD,
  selectSmallestContainer,
  type CustomBoxInput,
} from "@/lib/packer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawBoxes: Array<Partial<CustomBoxInput> & { w: number; h?: number; d?: number }> =
      body.boxes || [];
    const containerId: string | undefined = body.containerId;
    const customContainer = body.customContainer
      ? {
          w: Number(body.customContainer.w) || 36,
          d: Number(body.customContainer.d ?? body.customContainer.h) || 28,
          h: Number(body.customContainer.h ?? body.customContainer.d) || 22,
        }
      : undefined;

    if (!Array.isArray(rawBoxes) || rawBoxes.length === 0) {
      return NextResponse.json(
        { error: "At least one box must be provided." },
        { status: 400 }
      );
    }

    const boxes: CustomBoxInput[] = rawBoxes.map((b, idx) => ({
      id: b.id ?? idx + 1,
      label: b.label || b.name || `Box ${idx + 1}`,
      name: b.name || b.label,
      w: Number(b.w) || 10,
      h: Number(b.h ?? 10),
      d: Number(b.d ?? 10),
      qty: Math.max(1, Number(b.qty) || 1),
      color: b.color,
    }));

    const container = selectSmallestContainer(boxes, containerId, customContainer);
    const replayRL = packWithRL(boxes, container);
    const replayFFD = packWithFFD(boxes, container);

    return NextResponse.json({
      container,
      replayRL,
      replayFFD,
    });
  } catch (error) {
    console.error("Packing error:", error);
    return NextResponse.json(
      { error: "Failed to process packing request." },
      { status: 500 }
    );
  }
}
