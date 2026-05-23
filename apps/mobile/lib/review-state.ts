import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@wavelength_review_state';
const COOLDOWN_GAMES = 5;

export type ReviewState = {
  gamesCompleted: number;
  reviewAccepted: boolean;
  lastDeclinedAt: number | null;
};

const DEFAULT_STATE: ReviewState = {
  gamesCompleted: 0,
  reviewAccepted: false,
  lastDeclinedAt: null,
};

export async function getReviewState(): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<ReviewState>;
    return {
      gamesCompleted: typeof parsed.gamesCompleted === 'number' ? parsed.gamesCompleted : 0,
      reviewAccepted: parsed.reviewAccepted === true,
      lastDeclinedAt: typeof parsed.lastDeclinedAt === 'number' ? parsed.lastDeclinedAt : null,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

async function writeReviewState(state: ReviewState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // best-effort; storage unavailable should never break the game
  }
}

export async function recordGameCompleted(): Promise<ReviewState> {
  const current = await getReviewState();
  const next: ReviewState = { ...current, gamesCompleted: current.gamesCompleted + 1 };
  await writeReviewState(next);
  return next;
}

export async function recordReviewResponse(accepted: boolean): Promise<void> {
  const current = await getReviewState();
  const next: ReviewState = accepted
    ? { ...current, reviewAccepted: true }
    : { ...current, lastDeclinedAt: current.gamesCompleted };
  await writeReviewState(next);
}

export function shouldShowReviewPrompt(state: ReviewState): boolean {
  if (state.reviewAccepted) return false;
  if (state.gamesCompleted < 1) return false;
  if (state.lastDeclinedAt === null) return true;
  return state.gamesCompleted - state.lastDeclinedAt >= COOLDOWN_GAMES;
}
