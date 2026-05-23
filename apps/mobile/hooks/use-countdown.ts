import { useEffect, useRef, useState } from 'react';

interface UseCountdownOptions {
  /** Duration in seconds. Values <= 0 disable the countdown. */
  duration: number;
  /** When false, the countdown is idle (no interval, remaining held at duration). */
  active: boolean;
  /** Called once when remaining reaches 0. */
  onExpire: () => void;
  /** Changing this restarts the countdown from `duration` (e.g. new round/guesser). */
  resetKey?: string | number;
}

export function useCountdown({ duration, active, onExpire, resetKey }: UseCountdownOptions): number {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const [remaining, setRemaining] = useState<number>(duration > 0 ? duration : 0);

  useEffect(() => {
    if (!active || duration <= 0) {
      setRemaining(duration > 0 ? duration : 0);
      return;
    }
    setRemaining(duration);
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, duration - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        onExpireRef.current();
      }
    }, 200);
    return () => clearInterval(id);
  }, [active, duration, resetKey]);

  return remaining;
}
