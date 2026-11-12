/**
 * WCAG contrast maths. 1.4.11 asks for 3:1 on non-text UI boundaries, 1.4.3 for
 * 4.5:1 on body text.
 *
 * Both sides are passed in. There is no `contrastWithWhite`: a component's surface
 * is no longer white, it is `--bk-bg-surface`, which differs per theme — so the
 * caller reads the background it actually paints instead of assuming one.
 */
const channel = (value: number) =>
  value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

const luminance = (rgb: string): number => {
  const [r, g, b] = rgb
    .match(/[\d.]+/g)!
    .slice(0, 3)
    .map((value) => channel(Number(value) / 255));

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (foreground: string, background: string): number => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);

  return (lighter + 0.05) / (darker + 0.05);
};
