import { env } from "@chronicle/config";
import { audioChannel, type TtsJob, ttsJobSchema } from "@chronicle/shared";
import type { Job } from "bullmq";
import { publisher } from "../redis";
import { sentenceKey, upload } from "../storage";

function endpoint(): string {
  return `${env().TTS_ENDPOINT.replace(/\/+$/u, "")}/v1/audio/speech`;
}

export async function synthesize(job: Job<TtsJob>): Promise<string> {
  const payload = ttsJobSchema.parse(job.data);

  const response = await fetch(endpoint(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: "kokoro",
      input: payload.text,
      voice: payload.voice,
      speed: payload.speed,
      response_format: "mp3",
    }),
  });
  if (!response.ok) {
    throw new Error(`TTS request failed with ${response.status}: ${await response.text()}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const audioUrl = await upload(
    sentenceKey(payload.turnId, payload.sentenceIndex),
    bytes,
    "audio/mpeg",
  );

  await publisher().publish(
    audioChannel(payload.turnId),
    JSON.stringify({
      turnId: payload.turnId,
      sentenceIndex: payload.sentenceIndex,
      audioUrl,
    }),
  );
  return audioUrl;
}
