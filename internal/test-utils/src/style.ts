const cache = new Map<string, string>();

/* One element per distinct value, removed before the value is returned: reading a custom
 * property means resolving it through an element, and one left in the body outlives every
 * fixture that asked for it. The cache keeps the cost at one read per value. */
const computed = (property: 'color' | 'opacity', value: string): string => {
  const key = `${property}:${value}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const probe = document.createElement('span');
  probe.style.setProperty(property, value);
  document.body.append(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  cache.set(key, resolved);

  return resolved;
};

export const clearStyleCache = (): void => {
  cache.clear();
};

export const colorOf = (value: string): string => computed('color', value);

export const opacityOf = (value: string): string => computed('opacity', value);
