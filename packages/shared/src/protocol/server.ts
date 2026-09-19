import { z } from "zod";
import { turnNodeSchema } from "../turns";
import { serverEnvelopeSchema } from "./envelope";

const base = serverEnvelopeSchema;

export const turnInitializedSchema = base.extend({
  type: z.literal("TURN_INITIALIZED"),
  turnId: z.string(),
  parentId: z.string().nullable(),
});

export const narrativeChunkSchema = base.extend({
  type: z.literal("NARRATIVE_CHUNK"),
  turnId: z.string(),
  token: z.string(),
});

export const sentenceAudioReadySchema = base.extend({
  type: z.literal("SENTENCE_AUDIO_READY"),
  turnId: z.string(),
  sentenceIndex: z.number().int().nonnegative(),
  audioUrl: z.string(),
});

export const sceneImageReadySchema = base.extend({
  type: z.literal("SCENE_IMAGE_READY"),
  turnId: z.string(),
  imageUrl: z.string(),
});

export const diceCheckRequiredSchema = base.extend({
  type: z.literal("DICE_CHECK_REQUIRED"),
  turnId: z.string(),
  checkId: z.string(),
  stat: z.string(),
  dc: z.number().int(),
  baseModifier: z.number().int(),
});

export const turnCommittedSchema = base.extend({
  type: z.literal("TURN_COMMITTED"),
  turn: turnNodeSchema,
});

export const errorSchema = base.extend({
  type: z.literal("ERROR"),
  turnId: z.string().nullable().default(null),
  code: z.enum(["BAD_REQUEST", "UNAUTHORIZED", "NOT_FOUND", "ABORTED", "UPSTREAM", "INTERNAL"]),
  message: z.string(),
});

export const pongSchema = base.extend({
  type: z.literal("PONG"),
});

export const serverMessageSchema = z.discriminatedUnion("type", [
  turnInitializedSchema,
  narrativeChunkSchema,
  sentenceAudioReadySchema,
  sceneImageReadySchema,
  diceCheckRequiredSchema,
  turnCommittedSchema,
  errorSchema,
  pongSchema,
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;
export type ServerMessageType = ServerMessage["type"];
export type ErrorCode = z.infer<typeof errorSchema>["code"];
