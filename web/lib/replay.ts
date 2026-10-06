import { z } from "zod";

export const ItemSchema = z.object({
  id: z.number(),
  dims: z.tuple([z.number(), z.number(), z.number()]),
});

export const StepSchema = z.object({
  itemId: z.number(),
  rot: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  pos: z.tuple([z.number(), z.number(), z.number()]),
  density: z.number(),
  ms: z.number(),
});

export const ReplaySummarySchema = z.object({
  density: z.number(),
  void: z.number(),
  p95ms: z.number(),
  boxes: z.number(),
});

export const ReplaySchema = z.object({
  algo: z.enum(["ffd", "packrl"]),
  box: z.tuple([z.number(), z.number(), z.number()]),
  items: z.array(ItemSchema),
  steps: z.array(StepSchema),
  summary: ReplaySummarySchema,
  illustrative: z.boolean().optional(),
});

export type Item = z.infer<typeof ItemSchema>;
export type Step = z.infer<typeof StepSchema>;
export type ReplaySummary = z.infer<typeof ReplaySummarySchema>;
export type Replay = z.infer<typeof ReplaySchema>;

export function validateReplay(data: unknown): Replay {
  return ReplaySchema.parse(data);
}
