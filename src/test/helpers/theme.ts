const THEME_HREF = '/src/styles/theme.css';

let loading: Promise<void> | undefined;

/**
 * Components no longer carry fallback values: the theme is required. Tests
 * therefore load the real generated stylesheet before rendering anything.
 *
 * The promise is memoized: every test file calls this from `before`, and each
 * call would otherwise append another `<link>` for the same stylesheet.
 */
export const loadTheme = (): Promise<void> => {
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
