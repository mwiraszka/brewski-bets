import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'bb-theme';
const THEME_COLOR_LIGHT = '#faf7f2';
const THEME_COLOR_DARK = '#0f1014';

/**
 * Tracks the active light/dark theme.
 *
 * The active mode is mirrored onto `<html data-theme="...">`, which the SCSS
 * tokens in `_variables.scss` key off (via the matching `[data-theme='dark']`
 * selector and `prefers-color-scheme: dark` media query). The mode is also
 * persisted to `localStorage` under `bb-theme` so the inline `<head>` script
 * in `index.html` can pre-resolve it before Angular bootstraps — keep both
 * paths in sync to avoid a flash of the wrong palette on reload.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);

  /** Read at signal-init time so the very first render already sees the
      persisted mode (otherwise the toggle icon briefly flashes the wrong
      glyph before the constructor flipped it). */
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
      // localStorage may be unavailable (private browsing, sandboxed iframe);
      // fall through to system preference.
    }
    try {
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // matchMedia missing in very old browsers; fall through to light.
    }
    return 'light';
  }

  private applyTheme(): void {
    const m = this.mode();

    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // Ignore quota/security errors; the data-theme attribute still wins
      // for this session.
    }

    this.doc.documentElement.setAttribute('data-theme', m);

    const themeColor = m === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
    this.doc
      .querySelectorAll('meta[name="theme-color"]')
      .forEach(meta => meta.setAttribute('content', themeColor));
  }
}
