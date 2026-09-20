import { env } from "@chronicle/config/env";
import {
  AUDIO_CONTENT_TYPE,
  audioChannel,
  fetchBytes,
  sentenceAudioKey,
  type TtsJob,
  ttsJobSchema,
} from "@chronicle/utils";
import type { Job } from "bullmq";
import { publisher } from "~/redis";
import { upload } from "~/storage";

export async function synthesize(job: Job<TtsJob>): Promise<string> {
  const payload = ttsJobSchema.parse(job.data);

  const bytes = await fetchBytes(`${env().TTS_ENDPOINT}/v1/audio/speech`, {
    body: {
      model: "kokoro",
      input: payload.text,
      voice: payload.voice,
      speed: payload.speed,
      response_format: "mp3",
    },
  });
  const audioUrl = await upload(
    sentenceAudioKey(payload.worldId, payload.characterId, payload.turnId, payload.sentenceIndex),
    bytes,
    AUDIO_CONTENT_TYPE,
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
