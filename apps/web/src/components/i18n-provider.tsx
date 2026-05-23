"use client";

import { I18nContext, useI18nState } from "@/lib/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const state = useI18nState();
  return <I18nContext.Provider value={state}>{children}</I18nContext.Provider>;
}
