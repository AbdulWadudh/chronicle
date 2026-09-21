export const SCENE_CONTENT_TYPE = "image/png";
export const AUDIO_CONTENT_TYPE = "audio/mpeg";
export const PORTRAIT_CONTENT_TYPE = "image/png";

export const AVATAR_CONTENT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function userPrefix(userId: string): string {
  return `users/${userId}`;
}

export function avatarKey(userId: string, extension: string): string {
  return `${userPrefix(userId)}/avatar.${extension}`;
}

export function worldPrefix(worldId: string): string {
  return `worlds/${worldId}`;
}

export function characterPrefix(worldId: string, characterId: string): string {
  return `${worldPrefix(worldId)}/characters/${characterId}`;
}

export function turnPrefix(worldId: string, characterId: string, turnId: string): string {
  return `${characterPrefix(worldId, characterId)}/turns/${turnId}`;
}

export function worldCoverKey(worldId: string): string {
  return `${worldPrefix(worldId)}/cover.png`;
}

export function characterPortraitKey(worldId: string, characterId: string): string {
  return `${characterPrefix(worldId, characterId)}/portrait.png`;
}

export function characterDraftPortraitKey(worldId: string, characterId: string): string {
  return `${characterPrefix(worldId, characterId)}/portrait-draft.png`;
}

export function sceneKey(
  worldId: string,
  characterId: string,
  turnId: string,
  variant: number,
): string {
  return `${turnPrefix(worldId, characterId, turnId)}/scene-${variant}.png`;
}

export function sentenceAudioKey(
  worldId: string,
  characterId: string,
  turnId: string,
  sentenceIndex: number,
): string {
  return `${turnPrefix(worldId, characterId, turnId)}/audio/${sentenceIndex}.mp3`;
}

export function assetUrl(endpoint: string, bucket: string, key: string): string {
  return `${endpoint}/${bucket}/${key}`;
}
