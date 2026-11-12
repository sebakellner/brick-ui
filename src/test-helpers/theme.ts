const THEME_HREF = '/src/styles/theme.css';

/**
 * Components no longer carry fallback values: the theme is required. Tests
 * therefore load the real generated stylesheet before rendering anything.
 */
export const loadTheme = async (): Promise<void> => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = THEME_HREF;
  const loaded = new Promise<void>((resolve, reject) => {
    link.addEventListener('load', () => resolve());
    link.addEventListener('error', () => reject(new Error(`${THEME_HREF} failed to load`)));
  });
  document.head.append(link);
  await loaded;
};
