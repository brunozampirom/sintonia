import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { getDeviceLanguage, type LanguagePreference, type SupportedLanguage } from '@/i18n';
import { MAX_PLAYERS, MIN_PLAYERS, PLAYER_COLOR_PALETTE, assignDefaultColors, reconcileColors } from '@/constants/player-colors';
import { GameColors } from '@/constants/theme';

const DEFAULT_TEAM_COLORS: [string, string] = [GameColors.sky, GameColors.primary];

const STORAGE_KEY = '@wavelength_settings';

export interface Spectrum {
  left: string;
  right: string;
}

export interface TeamConfig {
  name: string;
  players: string[];
  color?: string;
}

export type GameMode = 'individual' | 'teams';
export type ScoringTarget = 'cluer' | 'guesser';
export type RoundFlow = 'all-guess' | 'single-guess';

export interface GameSettings {
  language: LanguagePreference;
  gameMode: GameMode;
  scoringTarget: ScoringTarget;
  winningScore: number;
  skipsPerPlayer: number; // -1 = unlimited
  playerNames: string[];
  playerColors: string[];
  roundFlow: RoundFlow;
  clueTimeLimit: number; // seconds; -1 = unlimited
  guessTimeLimit: number; // seconds; -1 = unlimited
  hapticsEnabled: boolean;
  customSpectrums: Spectrum[];
  teams: [TeamConfig, TeamConfig];
}

export const VALID_TIME_LIMITS = [-1, 15, 30, 60] as const;

export const DEFAULT_SETTINGS: GameSettings = {
  language: 'system',
  gameMode: 'individual',
  scoringTarget: 'cluer',
  winningScore: 10,
  skipsPerPlayer: 0,
  playerNames: ['Player 1', 'Player 2'],
  playerColors: assignDefaultColors(2),
  roundFlow: 'single-guess',
  clueTimeLimit: -1,
  guessTimeLimit: -1,
  hapticsEnabled: true,
  customSpectrums: [],
  teams: [
    { name: 'Team 1', players: ['Player 1', 'Player 2'], color: DEFAULT_TEAM_COLORS[0] },
    { name: 'Team 2', players: ['Player 3', 'Player 4'], color: DEFAULT_TEAM_COLORS[1] },
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
  });

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

function normalizePlayerNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SETTINGS.playerNames];
  const cleaned = raw.filter((n): n is string => typeof n === 'string' && n.trim().length > 0);
  if (cleaned.length < MIN_PLAYERS) {
    while (cleaned.length < MIN_PLAYERS) {
      cleaned.push(`Player ${cleaned.length + 1}`);
    }
  }
  return cleaned.slice(0, MAX_PLAYERS);
}

function normalizeSettings(partial: Partial<GameSettings>): Partial<GameSettings> {
  const next: Partial<GameSettings> = { ...partial };
  if (next.playerNames !== undefined) {
    next.playerNames = normalizePlayerNames(next.playerNames);
  }
  const names = next.playerNames ?? DEFAULT_SETTINGS.playerNames;
  next.playerColors = reconcileColors(names.length, next.playerColors ?? DEFAULT_SETTINGS.playerColors);
  if (next.roundFlow !== 'all-guess' && next.roundFlow !== 'single-guess') {
    next.roundFlow = DEFAULT_SETTINGS.roundFlow;
  }
  if (next.clueTimeLimit !== undefined && !VALID_TIME_LIMITS.includes(next.clueTimeLimit as typeof VALID_TIME_LIMITS[number])) {
    next.clueTimeLimit = DEFAULT_SETTINGS.clueTimeLimit;
  }
  if (next.guessTimeLimit !== undefined && !VALID_TIME_LIMITS.includes(next.guessTimeLimit as typeof VALID_TIME_LIMITS[number])) {
    next.guessTimeLimit = DEFAULT_SETTINGS.guessTimeLimit;
  }
  if (typeof next.hapticsEnabled !== 'boolean') {
    next.hapticsEnabled = DEFAULT_SETTINGS.hapticsEnabled;
  }
  if (next.teams) {
    next.teams = next.teams.map((team, teamIdx) => ({
      name: team.name,
      players: team.players,
      color: team.color && PLAYER_COLOR_PALETTE.includes(team.color)
        ? team.color
        : DEFAULT_TEAM_COLORS[teamIdx] ?? DEFAULT_TEAM_COLORS[0],
    })) as [TeamConfig, TeamConfig];
  }
  return next;
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
            const normalized = normalizeSettings(parsed);
            setSettings((prev) => ({ ...prev, ...normalized }));
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
      const merged = { ...prev, ...partial };
      const normalized = normalizeSettings(merged);
      const next = { ...merged, ...normalized } as GameSettings;
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
