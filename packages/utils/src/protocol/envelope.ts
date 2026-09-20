import { z } from "zod";

export const PROTOCOL_VERSION = 1;

export const envelopeSchema = z.object({
  v: z.literal(PROTOCOL_VERSION),
  msgId: z.string().min(1),
});

export const serverEnvelopeSchema = z.object({
  v: z.literal(PROTOCOL_VERSION),
  replyTo: z.string().nullable().default(null),
});

export type Envelope = z.infer<typeof envelopeSchema>;
export type ServerEnvelope = z.infer<typeof serverEnvelopeSchema>;
