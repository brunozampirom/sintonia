import { useSettings } from '@/contexts/settings-context';
import { setHapticsEnabled } from '@/lib/haptics';
import { useEffect } from 'react';

/**
 * Pushes the user's `hapticsEnabled` setting into the haptics module so call
 * sites can keep using the static `haptics.x()` API. Mount once near the root,
 * inside SettingsProvider.
 */
export function HapticsBridge() {
  const { settings } = useSettings();
  useEffect(() => {
    setHapticsEnabled(settings.hapticsEnabled);
  }, [settings.hapticsEnabled]);
  return null;
}
