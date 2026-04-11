import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { getDeviceLanguage, type LanguagePreference, type SupportedLanguage } from '@/i18n';

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
  language: LanguagePreference;
  gameMode: GameMode;
  scoringTarget: ScoringTarget;
  winningScore: number;
  skipsPerPlayer: number; // -1 = unlimited
  playerNames: [string, string];
  customSpectrums: Spectrum[];
  teams: [TeamConfig, TeamConfig];
}

export const DEFAULT_SETTINGS: GameSettings = {
  language: 'system',
  gameMode: 'individual',
  scoringTarget: 'cluer',
  winningScore: 10,
  skipsPerPlayer: 0,
  playerNames: ['Player 1', 'Player 2'],
  customSpectrums: [],
  teams: [
    { name: 'Team 1', players: ['Player 1', 'Player 2'] },
    { name: 'Team 2', players: ['Player 3', 'Player 4'] },
  ],
};

function localizeIndexedLabel(kind: 'player' | 'team', index: number, language: SupportedLanguage): string {
  const base = kind === 'player'
    ? (language === 'pt-BR' ? 'Jogador' : 'Player')
    : (language === 'pt-BR' ? 'Time' : 'Team');
  return `${base} ${index}`;
}

function parseDefaultIndexedLabel(name: string, kind: 'player' | 'team'): number | null {
  const prefixes = kind === 'player' ? '(Jogador|Player)' : '(Time|Team)';
  const match = name.match(new RegExp(`^${prefixes}\\s+(\\d+)$`, 'i'));
  if (!match) return null;
  const parsed = Number.parseInt(match[2], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function localizeDefaultLikeNames(settings: GameSettings, language: SupportedLanguage): GameSettings {
  const playerNames = settings.playerNames.map((name) => {
    const idx = parseDefaultIndexedLabel(name, 'player');
    return idx ? localizeIndexedLabel('player', idx, language) : name;
  }) as [string, string];

  const teams = settings.teams.map((team) => {
    const teamIndex = parseDefaultIndexedLabel(team.name, 'team');
    const localizedTeamName = teamIndex ? localizeIndexedLabel('team', teamIndex, language) : team.name;

    const localizedPlayers = team.players.map((player) => {
      const playerIndex = parseDefaultIndexedLabel(player, 'player');
      return playerIndex ? localizeIndexedLabel('player', playerIndex, language) : player;
    });

    return {
      ...team,
      name: localizedTeamName,
      players: localizedPlayers,
    };
  }) as [TeamConfig, TeamConfig];

  return {
    ...settings,
    playerNames,
    teams,
  };
}

interface SettingsContextValue {
  settings: GameSettings;
  effectiveLanguage: SupportedLanguage;
  loaded: boolean;
  updateSettings: (partial: Partial<GameSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  effectiveLanguage: 'pt-BR',
  loaded: false,
  updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [effectiveLanguage, setEffectiveLanguage] = useState<SupportedLanguage>(getDeviceLanguage());

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

  useEffect(() => {
    const nextLanguage: SupportedLanguage = settings.language === 'system'
      ? getDeviceLanguage()
      : settings.language;

    setEffectiveLanguage(nextLanguage);
    void i18n.changeLanguage(nextLanguage);

    setSettings((prev) => {
      const localized = localizeDefaultLikeNames(prev, nextLanguage);
      const changed = JSON.stringify(prev.playerNames) !== JSON.stringify(localized.playerNames)
        || JSON.stringify(prev.teams) !== JSON.stringify(localized.teams);

      if (changed) {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localized)).catch(() => {});
      }

      return changed ? localized : prev;
    });
  }, [settings.language]);

  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, effectiveLanguage, loaded, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
