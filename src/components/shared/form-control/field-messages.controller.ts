import { html, type LitElement, type TemplateResult } from 'lit';

export type FieldRegion = 'description' | 'error';

export interface FieldMessageFallbacks {
  error: string;
}

const REGIONS: FieldRegion[] = ['description', 'error'];

export class FieldMessagesController {
  readonly descriptionId: string;

  readonly errorId: string;

  private readonly host: LitElement;

  /* A consumer edits the text of a slotted atom in place, without assigning a
   * node again, so `slotchange` never fires. Content has to be observed. */
  private readonly mutations = new MutationObserver(() => this.host.requestUpdate());

  private fallbacks: FieldMessageFallbacks = { error: '' };

  constructor(host: LitElement, baseId: string) {
    this.host = host;
    this.descriptionId = `${baseId}-description`;
    this.errorId = `${baseId}-error`;
  }

  /* The text of the nodes assigned to the error slot: the slotted atom is the
   * field's error, not decoration, and the control reads it as one. */
  get slotError(): string {
    return this.textFor('error');
  }

  get describedBy(): string | undefined {
    if (this.hasContent('error')) return this.errorId;
    if (this.hasContent('description')) return this.descriptionId;
    return undefined;
  }

  connect(): void {
    this.observe();
  }

  disconnect(): void {
    this.mutations.disconnect();
  }

  update(fallbacks: FieldMessageFallbacks): string | undefined {
    this.fallbacks = fallbacks;
    return this.describedBy;
  }

  render(): TemplateResult {
    const description = this.hasContent('description');
    const error = this.hasContent('error');

    return html`
      <div part="message">
        <div
          class="message"
          part="description"
          id=${this.descriptionId}
          ?hidden=${error}
          ?data-empty=${!description}
        >
          <slot name="description" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div
          class="message"
          part="error"
          id=${this.errorId}
          role="status"
          data-state="error"
          ?data-empty=${!error}
        >
          <slot name="error" @slotchange=${this.handleSlotChange}>${this.fallbacks.error}</slot>
        </div>
      </div>
    `;
  }

  /* Content means text, not assignment: a region whose atom is empty is not
   * named by `aria-describedby` (A4). */
  private hasContent(region: FieldRegion): boolean {
    if (this.textFor(region) !== '') return true;
    return region === 'error' && this.fallbacks.error.trim() !== '';
  }

  private textFor(region: FieldRegion): string {
    return this.nodesFor(region)
      .map((node) => node.textContent ?? '')
      .join(' ')
      .trim();
  }

  private observe(): void {
    this.mutations.disconnect();
    for (const region of REGIONS) {
      for (const node of this.nodesFor(region)) {
        this.mutations.observe(node, { characterData: true, childList: true, subtree: true });
      }
    }
  }

  private nodesFor(region: FieldRegion): Node[] {
    const slot = this.host.shadowRoot?.querySelector<HTMLSlotElement>(`slot[name="${region}"]`);
    if (slot) return slot.assignedNodes();
    return Array.from(this.host.children).filter((child) => child.slot === region);
  }

  private readonly handleSlotChange = (): void => {
    this.observe();
    this.host.requestUpdate();
  };
}
