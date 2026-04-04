import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@wavelength_settings';

export interface Spectrum {
  left: string;
  right: string;
}

export interface GameSettings {
  winningScore: number;
  skipsPerPlayer: number; // -1 = unlimited
  playerNames: [string, string];
  customSpectrums: Spectrum[];
}

export const DEFAULT_SETTINGS: GameSettings = {
  winningScore: 10,
  skipsPerPlayer: 0,
  playerNames: ['Jogador 1', 'Jogador 2'],
  customSpectrums: [],
};

interface SettingsContextValue {
  settings: GameSettings;
  loaded: boolean;
  updateSettings: (partial: Partial<GameSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<GameSettings>;
          setSettings((prev) => ({ ...prev, ...parsed }));
        } catch {
          // ignore corrupt data
        }
      }
      setLoaded(true);
    });
  }, []);

  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
