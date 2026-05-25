import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'bb-theme';
const THEME_COLOR_LIGHT = '#faf7f2';
const THEME_COLOR_DARK = '#0f1014';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);

  readonly mode = signal<ThemeMode>(this.readStoredMode());

  constructor() {
    this.applyTheme();
  }

  cycle(): void {
    this.set(this.mode() === 'light' ? 'dark' : 'light');
  }

  set(mode: ThemeMode): void {
    this.mode.set(mode);
    this.applyTheme();
  }

  private readStoredMode(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      // localStorage unavailable
    }
    try {
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // matchMedia unavailable
    }
    return 'light';
  }

  private applyTheme(): void {
    const m = this.mode();

    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // storage write failures don't block the in-memory swap
    }

    this.doc.documentElement.setAttribute('data-theme', m);

    const themeColor = m === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
    this.doc
      .querySelectorAll('meta[name="theme-color"]')
      .forEach(meta => meta.setAttribute('content', themeColor));
  }
}
