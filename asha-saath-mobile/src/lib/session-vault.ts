import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
const KEY = "asha-saath-mobile-session";
export interface Credential {
  token: string;
  base: string;
  expiresAt: number;
}
let browserMemory: Credential | null = null;
export async function readCredential(): Promise<Credential | null> {
  if (Platform.OS === "web") return browserMemory;
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (
      typeof value.token !== "string" ||
      !Number.isFinite(value.expiresAt) ||
      typeof value.base !== "string"
    )
      throw new Error();
    return value;
  } catch {
    await SecureStore.deleteItemAsync(KEY);
    return null;
  }
}
export async function saveCredential(value: Credential | null) {
  if (Platform.OS === "web") {
    browserMemory = value;
    return;
  }
  if (value) await SecureStore.setItemAsync(KEY, JSON.stringify(value));
  else await SecureStore.deleteItemAsync(KEY);
}
