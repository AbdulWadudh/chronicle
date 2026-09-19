import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "chronicle_session_token";

const memoryFallback = new Map<string, string>();

const canUseSecureStore = Platform.OS !== "web";

export async function readToken(): Promise<string | null> {
  if (!canUseSecureStore) return memoryFallback.get(TOKEN_KEY) ?? null;
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function writeToken(token: string): Promise<void> {
  if (!canUseSecureStore) {
    memoryFallback.set(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  if (!canUseSecureStore) {
    memoryFallback.delete(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
