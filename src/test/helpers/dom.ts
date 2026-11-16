export const region = (el: Element, name: string): HTMLElement | null =>
  (el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null | undefined) ?? null;

export const slotIn = (el: Element, name: string): HTMLSlotElement | null =>
  (el.shadowRoot?.querySelector(`slot[name="${name}"]`) as HTMLSlotElement | null | undefined) ??
  null;

/* The reference is resolved in the carrier's own tree: a host roots at the document, an
 * inner control at the shadow root. The fixture document is the runner's iframe, so
 * `document` is never the tree to search. */
export const describedNode = (carrier: Element): Element | null => {
  const id = carrier.getAttribute('aria-describedby');
  const root = carrier.getRootNode();

  if (!id || !(root instanceof Document || root instanceof ShadowRoot)) return null;

  return root.getElementById(id);
};

export const projectedNodes = (node: Element | null): string[] =>
  Array.from(node?.querySelectorAll('slot') ?? [])
    .flatMap((entry) => entry.assignedNodes({ flatten: true }))
    .map((assigned) => assigned.textContent!.trim())
    .filter(Boolean);

export const projectedText = (node: Element | null): string => projectedNodes(node).join('');

export const slottedText = (el: Element, name: string): string[] =>
  (slotIn(el, name)?.assignedElements({ flatten: true }) ?? []).map((node) =>
    node.textContent!.trim(),
  );
