/**
 * WCAG 1.4.11 wants non-text UI boundaries at 3:1 against their adjacent
 * colour. Components assume a white surface, so the tests compare against it.
 */
export const contrastWithWhite = (rgb: string): number => {
  const [r, g, b] = rgb
    .match(/[\d.]+/g)!
    .slice(0, 3)
    .map((value) => Number(value) / 255);
  const channel = (value: number) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

  return 1.05 / (luminance + 0.05);
};
