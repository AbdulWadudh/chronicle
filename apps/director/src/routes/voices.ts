import { env } from "@chronicle/config/env";
import { loadSettings } from "@chronicle/db";
import { Hono } from "hono";
import { type AuthEnv, requireSession } from "~/auth";
import { listVoices, voiceRejection } from "~/engine/voices";

const SAMPLE = "The tide came in early, and nobody thought to tell us.";

export const voiceRoutes = new Hono<AuthEnv>()
  .use("*", requireSession)
  .get("/", async (context) => {
    try {
      return context.json({ voices: await listVoices() });
    } catch (error) {
      return context.json(
        { error: error instanceof Error ? error.message : "The voice list could not be read." },
        502,
      );
    }
  })
  .get("/:id/preview", async (context) => {
    const id = context.req.param("id");
    const rejected = await voiceRejection(id);
    if (rejected !== null) return context.json({ error: rejected }, 400);

    const { tts } = await loadSettings();
    const upstream = await fetch(`${env().TTS_ENDPOINT.replace(/\/+$/u, "")}/v1/audio/speech`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "kokoro",
        input: SAMPLE,
        voice: id,
        speed: tts.speed,
        response_format: "mp3",
      }),
    }).catch(() => null);

    if (upstream === null || !upstream.ok || upstream.body === null) {
      return context.json({ error: "Kokoro could not render that preview." }, 502);
    }
    return new Response(upstream.body, {
      headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=3600" },
    });
  });
