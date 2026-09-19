import { useCallback, useEffect, useState } from 'react';

export type AccentTheme = 'violet' | 'blue' | 'emerald' | 'rose' | 'amber';
export type Wallpaper = 'none' | 'dots' | 'grid' | 'aurora';

export interface Appearance {
  accent: AccentTheme;
  wallpaper: Wallpaper;
  reduceMotion: boolean;
}

const STORAGE_KEY = 'quichat_appearance';

const defaultAppearance: Appearance = {
  accent: 'violet',
  wallpaper: 'none',
  reduceMotion: false,
};

function loadAppearance(): Appearance {
  if (typeof window === 'undefined') return defaultAppearance;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAppearance;
    return { ...defaultAppearance, ...JSON.parse(raw) };
  } catch {
    return defaultAppearance;
  }
}

export function useAppearance() {
  const [appearance, setAppearance] = useState<Appearance>(loadAppearance);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-accent', appearance.accent);
    root.setAttribute('data-wallpaper', appearance.wallpaper);
    root.setAttribute('data-reduce-motion', String(appearance.reduceMotion));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
  }, [appearance]);

  const update = useCallback((patch: Partial<Appearance>) => {
    setAppearance((prev) => ({ ...prev, ...patch }));
  }, []);

  return { appearance, update };
}
