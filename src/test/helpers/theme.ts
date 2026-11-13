export type Theme = 'light' | 'dark';

const THEME_HREF = '/src/styles/theme.css';

let loading: Promise<void> | undefined;

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

export const setTheme = (theme: Theme): void => {
  document.documentElement.setAttribute('data-theme', theme);
};

export const loadTheme = (theme: Theme = 'light'): Promise<void> => {
  setTheme(theme);
  return loadCss();
};
