import { clearStyleCache } from './style.js';

export type Theme = 'light' | 'dark';

/* The theme stylesheet is part of the runner's page (web-test-runner.config.mjs), so a
 * suite only ever switches the attribute. */
export const setTheme = (theme: Theme): void => {
  document.documentElement.setAttribute('data-theme', theme);
  /* The resolved values are theme-scoped: the dark matrix caught a cache that
   * answered with the light ring on a dark surface, a contrast of 2.1 instead of 8. */
  clearStyleCache();
};
