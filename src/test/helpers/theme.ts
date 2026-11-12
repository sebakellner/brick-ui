export type Theme = 'light' | 'dark';

const THEME_HREF = '/src/styles/theme.css';

let loading: Promise<void> | undefined;

/**
 * Components no longer carry fallback values: the theme is required. Tests
 * therefore load the real generated stylesheet before rendering anything.
 *
 * The promise is memoized: every test file calls this from `before`, and each
 * call would otherwise append another `<link>` for the same stylesheet.
 */
const loadCss = (): Promise<void> => {
  loading ??= new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = THEME_HREF;
    link.addEventListener('load', () => resolve());
    link.addEventListener('error', () => reject(new Error(`${THEME_HREF} failed to load`)));
    document.head.append(link);
  });
  return loading;
};

/**
 * Sets the theme on the document root. Writing the attribute also opts out of the
 * `prefers-color-scheme` block, so a test does not depend on the runner's
 * preference — the same reason a consumer who picks a theme is not overridden by
 * their operating system.
 */
export const setTheme = (theme: Theme): void => {
  document.documentElement.setAttribute('data-theme', theme);
};

export const loadTheme = (theme: Theme = 'light'): Promise<void> => {
  setTheme(theme);
  return loadCss();
};
