import { z } from "zod";
import { statePatchSchema } from "../types";
import { envelopeSchema } from "./envelope";

const base = envelopeSchema;

export const submitActionSchema = base.extend({
  type: z.literal("SUBMIT_ACTION"),
  parentTurnId: z.string().nullable(),
  action: z.string().min(1),
  mode: z.enum(["scratch", "enhanced"]),
});

export const selectChoiceSchema = base.extend({
  type: z.literal("SELECT_CHOICE"),
  parentTurnId: z.string(),
  choiceIndex: z.union([z.literal(0), z.literal(1), z.literal(2)]),
});

export const regenerateSchema = base.extend({
  type: z.literal("REGENERATE"),
  turnId: z.string(),
  target: z.enum(["narrative", "visual", "audio"]),
});

export const switchBranchSchema = base.extend({
  type: z.literal("SWITCH_BRANCH"),
  turnId: z.string(),
});

export const directorOverrideSchema = base.extend({
  type: z.literal("DIRECTOR_OVERRIDE"),
  turnId: z.string(),
  patch: statePatchSchema,
});

export const saveCheckpointSchema = base.extend({
  type: z.literal("SAVE_CHECKPOINT"),
  turnId: z.string(),
  name: z.string().min(1),
});

export const rollbackCheckpointSchema = base.extend({
  type: z.literal("ROLLBACK_CHECKPOINT"),
  checkpointId: z.string(),
});

export const abortTurnSchema = base.extend({
  type: z.literal("ABORT_TURN"),
  turnId: z.string(),
});

export const resumeTurnSchema = base.extend({
  type: z.literal("RESUME_TURN"),
  turnId: z.string(),
  fromSentenceIndex: z.number().int().nonnegative(),
});

export const pingSchema = base.extend({
  type: z.literal("PING"),
});

export const clientMessageSchema = z.discriminatedUnion("type", [
  submitActionSchema,
  selectChoiceSchema,
  regenerateSchema,
  switchBranchSchema,
  directorOverrideSchema,
  saveCheckpointSchema,
  rollbackCheckpointSchema,
  abortTurnSchema,
  resumeTurnSchema,
  pingSchema,
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;
export type ClientMessageType = ClientMessage["type"];
