import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/i18n/locales/en.json';
import ptBR from '@/i18n/locales/pt-BR.json';

export type SupportedLanguage = 'pt-BR' | 'en';
export type LanguagePreference = 'system' | SupportedLanguage;

export function normalizeLanguageTag(tag?: string): SupportedLanguage {
  if (!tag) return 'pt-BR';
  return tag.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
}

export function getDeviceLanguage(): SupportedLanguage {
  const locale = Localization.getLocales()[0];
  return normalizeLanguageTag(locale?.languageTag);
}

export const resources = {
  en: { translation: en },
  'pt-BR': { translation: ptBR },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'pt-BR',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
  compatibilityJSON: 'v4',
});

export default i18n;
