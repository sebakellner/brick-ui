import { html, type LitElement, type TemplateResult } from 'lit';
import { SlottedTextController } from './slotted-text.controller.js';

export type FieldRegion = 'description' | 'error';

export interface FieldMessageFallbacks {
  error: string;
}

const REGIONS: FieldRegion[] = ['description', 'error'];

export class FieldMessagesController {
  readonly descriptionId: string;

  readonly errorId: string;

  /* The slotted text of the two regions, observed once for both: a consumer
   * edits the text of an atom in place, which no `slotchange` reports. */
  private readonly text: SlottedTextController;

  private fallbacks: FieldMessageFallbacks = { error: '' };

  constructor(host: LitElement, baseId: string) {
    this.text = new SlottedTextController(host, ...REGIONS);
    this.descriptionId = `${baseId}-description`;
    this.errorId = `${baseId}-error`;
  }

  /* The text of the nodes assigned to the error slot: the slotted atom is the
   * field's error, not decoration, and the control reads it as one. */
  get slotError(): string {
    return this.text.slotText('error');
  }

  get describedBy(): string | undefined {
    if (this.hasContent('error')) return this.errorId;
    if (this.hasContent('description')) return this.descriptionId;
    return undefined;
  }

  render(): TemplateResult {
    const description = this.text.slotHasText('description');
    const error = this.text.slotHasText('error');

    return html`
      <div part="message">
        <div
          class="message"
          part="description"
          id=${this.descriptionId}
          ?hidden=${error}
          ?data-empty=${!description}
        >
          <slot name="description"></slot>
        </div>
        <div
          class="message"
          part="error"
          id=${this.errorId}
          role="status"
          data-state="error"
          ?data-empty=${!error}
        >
          <slot name="error">${this.fallbacks.error}</slot>
        </div>
      </div>
    `;
  }

  update(fallbacks: FieldMessageFallbacks): string | undefined {
    this.fallbacks = fallbacks;
    return this.describedBy;
  }

  /* Content means text, not assignment: a region whose atom is empty is not
   * named by `aria-describedby` (A4). */
  private hasContent(region: FieldRegion): boolean {
    if (this.text.slotHasText(region)) return true;
    return region === 'error' && this.fallbacks.error.trim() !== '';
  }
}
