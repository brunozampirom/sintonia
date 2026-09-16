// Room codes for multiplayer. 4-character alphanumeric, drawing from
// an alphabet that excludes visually ambiguous characters (I/O/0/1)
// so a code read across a noisy room can be retyped without confusion.
// Same alphabet used by the web /join/[code] page.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars
const LENGTH = 4;

export function generateRoomCode(): string {
  let out = "";
  for (let i = 0; i < LENGTH; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function normalizeRoomCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, LENGTH);
}

export function isValidRoomCode(value: string): boolean {
  if (value.length !== LENGTH) return false;
  for (const c of value) {
    if (!ALPHABET.includes(c)) return false;
  }
  return true;
}
