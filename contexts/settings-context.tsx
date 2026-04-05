import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@wavelength_settings';

export interface Spectrum {
  left: string;
  right: string;
}

export interface TeamConfig {
  name: string;
  players: string[];
}

export type GameMode = 'individual' | 'teams';
export type ScoringTarget = 'cluer' | 'guesser';

export interface GameSettings {
  gameMode: GameMode;
  scoringTarget: ScoringTarget;
  winningScore: number;
  skipsPerPlayer: number; // -1 = unlimited
  playerNames: [string, string];
  customSpectrums: Spectrum[];
  teams: [TeamConfig, TeamConfig];
}

export const DEFAULT_SETTINGS: GameSettings = {
  gameMode: 'individual',
  scoringTarget: 'cluer',
  winningScore: 10,
  skipsPerPlayer: 0,
  playerNames: ['Jogador 1', 'Jogador 2'],
  customSpectrums: [],
  teams: [
    { name: 'Time 1', players: ['Jogador 1', 'Jogador 2'] },
    { name: 'Time 2', players: ['Jogador 3', 'Jogador 4'] },
  ],
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
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<GameSettings>;
            setSettings((prev) => ({ ...prev, ...parsed }));
          } catch {
            // ignore corrupt data
          }
        }
      })
      .catch(() => {
        // storage unavailable, use defaults
      })
      .finally(() => {
        setLoaded(true);
      });
  }, []);

  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
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
