const cache = new Map<string, string>();

let probe: HTMLElement | undefined;

/* One probe for the whole run, one read per value. Reading a custom property means
 * resolving it through an element, and the earlier version did that inside a fixture
 * for every single assertion. */
const computed = (property: 'color' | 'opacity', value: string): string => {
  const key = `${property}:${value}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  probe ??= document.body.appendChild(document.createElement('span'));
  probe.style.setProperty(property, value);
  const resolved = getComputedStyle(probe)[property];
  probe.style.removeProperty(property);
  cache.set(key, resolved);

  return resolved;
};

export const clearStyleCache = (): void => {
  cache.clear();
};

export const colorOf = (value: string): string => computed('color', value);

export const opacityOf = (value: string): string => computed('opacity', value);
