export type Theme = 'light' | 'dark';

/* The theme stylesheet is part of the runner's page (web-test-runner.config.mjs), so a
 * suite only ever switches the attribute. */
export const setTheme = (theme: Theme): void => {
  document.documentElement.setAttribute('data-theme', theme);
};
