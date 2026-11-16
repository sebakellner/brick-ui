import type { LitElement, ReactiveController } from 'lit';

/* What one observer has to see: an assigned node gains a child (`childList`) or
 * the text of an assigned node is edited (`characterData`), at any depth. */
const OBSERVE: MutationObserverInit = {
  characterData: true,
  childList: true,
  subtree: true,
};

/* Does this slot have text, and what text is it?
 *
 * A component cannot see the text of the nodes slotted into it: `textContent`
 * does not include assigned nodes, and `slotchange` fires only when the *set*
 * of assigned nodes changes — never when the text of an assigned node is
 * edited. A library that keeps a message in a property (`help-text`) never
 * needs either; this kit keeps it in atoms on purpose (ADR 0009, ADR 0010), and
 * the observer is the price of that decision. Without it a message a consumer
 * edits in place stays stale until the next assignment.
 *
 * The slots it answers about are fixed at construction, because a control's
 * regions never change; the nodes it watches are handed over, because a
 * container decides what it owns while it runs.
 *
 * Two entry points, because the kit asks the question in two shapes:
 *
 * - `slotText` / `slotHasText` read a slot of the host's own shadow root, from
 *   the nodes assigned to it. A control's message region is a slot.
 * - `nodeHasText` reads a node the caller owns, and `watchNodes` keeps the
 *   observer on the set the caller hands over. A container adopts atoms that
 *   live in its light DOM, where no slot is involved.
 *
 * Presence means text, not assignment: a node with no text is not content
 * (A4), so every answer is trimmed.
 *
 * One `MutationObserver` per host, registered on it, re-targeted when the
 * assignment changes — `slotchange` is the only report a slot makes about
 * which nodes it now holds. It asks the host for an update rather than
 * answering on its own: what the text means belongs to the consumer.
 */
export class SlottedTextController implements ReactiveController {
  private readonly host: LitElement;

  /* The slots of the host's shadow root this controller answers about. Their
   * assigned nodes are what the observer follows. */
  private readonly slots: readonly string[];

  /* Nodes the caller hands over, outside any slot: a container's own light
   * DOM. Observed wherever the caller watches them. */
  private readonly watched = new Set<Node>();

  private readonly mutations = new MutationObserver(() => this.host.requestUpdate());

  private observed: Node[] = [];

  constructor(host: LitElement, ...slots: string[]) {
    this.host = host;
    this.slots = slots;
    host.addController(this);
  }

  hostConnected(): void {
    this.host.shadowRoot?.addEventListener('slotchange', this.handleSlotChange);
    this.retarget();
  }

  hostDisconnected(): void {
    this.host.shadowRoot?.removeEventListener('slotchange', this.handleSlotChange);
    this.mutations.disconnect();
    this.observed = [];
  }

  /* Nodes the caller owns and the controller should keep an eye on. Calling it
   * again with a different set replaces what is observed. */
  watchNodes(nodes: readonly Node[]): void {
    this.watched.clear();
    for (const node of nodes) this.watched.add(node);
    if (this.host.isConnected) this.retarget();
  }

  /* The text of the nodes assigned to one of the host's slots, in document
   * order: several atoms are read as one message (ADR 0011). */
  slotText(name: string): string {
    return this.projected(name)
      .map((node) => node.textContent ?? '')
      .join(' ')
      .trim();
  }

  slotHasText(name: string): boolean {
    return this.projected(name).some((node) => this.nodeHasText(node));
  }

  nodeHasText(node: Node): boolean {
    return (node.textContent ?? '').trim() !== '';
  }

  /* The nodes a slot projects. Before the first render there is no slot to
   * ask, so the answer is the host's children the slot will claim — the same
   * set, read from the attribute the assignment keys off. It is never every
   * child: a box or a label is not the message the slot holds.
   *
   * The nodes are asked for unflattened, because a flattened read answers with
   * the slot's own fallback content when nothing is assigned — and the error
   * slot's fallback is the field's own message. Reading it back as an assigned
   * atom would make every field carry a slotted error nobody wrote. */
  private projected(name: string): Node[] {
    const slot = this.host.shadowRoot?.querySelector<HTMLSlotElement>(`slot[name="${name}"]`);
    if (slot) return Array.from(slot.assignedNodes());
    return Array.from(this.host.children).filter((child) => child.slot === name);
  }

  private retarget(): void {
    const targets = new Set<Node>(this.watched);
    for (const name of this.slots) {
      for (const node of this.projected(name)) targets.add(node);
    }
    if (this.observed.length === targets.size && this.observed.every((one) => targets.has(one))) {
      return;
    }
    this.observed = Array.from(targets);
    this.mutations.disconnect();
    for (const node of this.observed) this.mutations.observe(node, OBSERVE);
  }

  private readonly handleSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    if (!this.slots.includes(slot.name)) return;
    this.retarget();
    this.host.requestUpdate();
  };
}
