// Cold-start Universal Link target. The web URL `sintonia.party/join/CODE`
// opens this route in the app. We immediately redirect to `/join-code` —
// the single combined screen (code + name + color) — passing the code as
// a query param so it shows up prefilled.

import { isValidRoomCode, normalizeRoomCode } from '@/lib/room-codes';
import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function JoinByCodeRedirect() {
  const params = useLocalSearchParams<{ code?: string }>();
  const code = normalizeRoomCode(params.code ?? '');
  const valid = isValidRoomCode(code);

  return (
    <Redirect
      href={{
        pathname: '/join-code',
        params: valid ? { code } : {},
      }}
    />
  );
}
