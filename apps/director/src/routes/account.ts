import { updateProfile } from "@chronicle/db";
import { AVATAR_CONTENT_TYPES, avatarKey } from "@chronicle/utils";
import { Hono } from "hono";
import { z } from "zod";
import { type AuthEnv, requireSession } from "~/auth";
import { upload } from "~/storage";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const nameBody = z.object({ name: z.string().trim().min(1).max(60) });

export const accountRoutes = new Hono<AuthEnv>()
  .use("*", requireSession)
  .patch("/", async (context) => {
    const parsed = nameBody.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success) return context.json({ error: "A name of 1 to 60 characters." }, 400);

    const account = await updateProfile(context.get("user").id, { name: parsed.data.name });
    if (account === null) return context.json({ error: "That account no longer exists." }, 404);
    return context.json({ account });
  })
  .post("/avatar", async (context) => {
    const form = await context.req.formData().catch(() => null);
    const file = form?.get("avatar");
    if (!(file instanceof File)) return context.json({ error: "Attach an image." }, 400);

    const extension = AVATAR_CONTENT_TYPES[file.type];
    if (extension === undefined) {
      return context.json({ error: "Use a PNG, JPEG or WebP image." }, 415);
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return context.json({ error: "Keep the image under 2 MB." }, 413);
    }

    const userId = context.get("user").id;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const url = await upload(avatarKey(userId, extension), bytes, file.type);
    const image = `${url}?v=${Date.now()}`;

    const account = await updateProfile(userId, { image });
    if (account === null) return context.json({ error: "That account no longer exists." }, 404);
    return context.json({ account });
  })
  .delete("/avatar", async (context) => {
    const account = await updateProfile(context.get("user").id, { image: null });
    if (account === null) return context.json({ error: "That account no longer exists." }, 404);
    return context.json({ account });
  });
