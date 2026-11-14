import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import type { BkFieldDescription } from './bk-field-description.js';
import type { BkFieldError } from './bk-field-error.js';
import type { BkFieldLabel } from './bk-field-label.js';

export type BkFieldPart = BkFieldLabel | BkFieldDescription | BkFieldError;

const PART_SLOTS = [
  { tag: 'bk-field-label', slot: 'label' },
  { tag: 'bk-field-description', slot: 'description' },
  { tag: 'bk-field-error', slot: 'error' },
] as const;

export class BkField extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .stack {
      display: flex;
      flex-direction: column;
      gap: var(--bk-space-1);
    }
  `;

  @property({ type: Boolean, reflect: true }) invalid = false;

  registerPart(part: BkFieldPart): void {
    this.syncPart(part);
  }

  override updated(): void {
    this.syncParts();
  }

  override render() {
    return html`
      <div class="stack">
        <slot name="label" @slotchange=${this.syncParts}></slot>
        <slot @slotchange=${this.syncParts}></slot>
        <slot name="description" @slotchange=${this.syncParts}></slot>
        <slot name="error" @slotchange=${this.syncParts}></slot>
      </div>
    `;
  }

  private readonly syncParts = (): void => {
    for (const { tag } of PART_SLOTS) {
      for (const part of this.querySelectorAll<BkFieldPart>(tag)) this.syncPart(part);
    }
  };

  private syncPart(part: BkFieldPart): void {
    const entry = PART_SLOTS.find((candidate) => candidate.tag === part.localName);
    if (entry && part.slot !== entry.slot) part.slot = entry.slot;
    if (this.invalid) part.setAttribute('data-state', 'invalid');
    else part.removeAttribute('data-state');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bk-field': BkField;
  }
}
