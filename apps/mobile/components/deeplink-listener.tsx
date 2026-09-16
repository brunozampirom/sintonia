// Listens for Universal / App Links received while the app is already
// open and routes them to the correct expo-router screen. Cold-start
// URLs are handled automatically by expo-router's file-based routing
// (it parses the initial URL on launch); this handles the hot path
// where iOS/Android dispatch a URL to a running app instance.

import { isValidRoomCode, normalizeRoomCode } from '@/lib/room-codes';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export function DeeplinkListener() {
  const router = useRouter();

  useEffect(() => {
    function handleUrl(url: string) {
      const parsed = Linking.parse(url);
      const path = parsed.path ?? '';
      // Path looks like "join/PIZA" (no leading slash from Linking.parse).
      // Route to /join-code with the code prefilled — that's our single
      // "Entrar na sala" UI with code + name + color in one screen.
      if (path.startsWith('join/')) {
        const code = normalizeRoomCode(path.slice('join/'.length).split('/')[0]);
        if (isValidRoomCode(code)) {
          router.push({ pathname: '/join-code', params: { code } });
        }
      }
    }

    // 1) URLs that arrive while the app is in the foreground
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    // 2) URLs that opened the app from cold but didn't trigger the
    //    expo-router initial route (defensive — usually router already
    //    handled it, but no harm in double-checking).
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    return () => sub.remove();
  }, [router]);

  return null;
}
