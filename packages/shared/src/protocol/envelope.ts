import { z } from "zod";

export const PROTOCOL_VERSION = 1;

export const envelopeSchema = z.object({
  v: z.literal(PROTOCOL_VERSION),
  msgId: z.string().min(1),
});

export type Envelope = z.infer<typeof envelopeSchema>;

export const serverEnvelopeSchema = z.object({
  v: z.literal(PROTOCOL_VERSION),
  replyTo: z.string().nullable().default(null),
});

export type ServerEnvelope = z.infer<typeof serverEnvelopeSchema>;

export function envelope(msgId: string): Envelope {
  return { v: PROTOCOL_VERSION, msgId };
}

export function reply(replyTo: string | null): ServerEnvelope {
  return { v: PROTOCOL_VERSION, replyTo };
}
