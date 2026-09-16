// Anonymous, persistent player ID. Generated on first launch and
// stored in AsyncStorage so the same device shows up as the same
// player across sessions — needed for reconnect into an in-progress
// multiplayer room. Not cryptographically secure (and doesn't need
// to be — server treats it as an opaque opaque identifier, no auth
// hangs off it).

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "sintonia.playerId";

function generateUUIDv4(): string {
  // RFC4122 v4 layout. Math.random is fine for player IDs; if we ever
  // need a real cryptographic ID we can swap in expo-crypto.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cached: string | null = null;

export async function getOrCreatePlayerId(): Promise<string> {
  if (cached) return cached;
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 16) {
      cached = existing;
      return existing;
    }
  } catch {
    // Storage unavailable — generate a session-only ID. Subsequent
    // calls will hit this same fallback.
  }
  const fresh = generateUUIDv4();
  cached = fresh;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, fresh);
  } catch {
    // Best effort — if storage is broken, we still return a valid ID
    // for this session.
  }
  return fresh;
}

/** Synchronous read after at least one prior getOrCreatePlayerId() call. */
export function getCachedPlayerId(): string | null {
  return cached;
}
