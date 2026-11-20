import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import type { BrikkaFieldDescription } from './brikka-field-description.js';
import type { BrikkaFieldError } from './brikka-field-error.js';
import type { BrikkaFieldLabel } from './brikka-field-label.js';

export type BrikkaFieldPart = BrikkaFieldLabel | BrikkaFieldDescription | BrikkaFieldError;

const PART_SLOTS = [
  { tag: 'brikka-field-label', slot: 'label' },
  { tag: 'brikka-field-description', slot: 'description' },
  { tag: 'brikka-field-error', slot: 'error' },
] as const;

/**
 * Stacks a field's parts and routes each one to its slot. It renders no control and carries no
 * validity: the element put inside it does.
 *
 * @slot - The control.
 * @slot label - The label atom.
 * @slot description - The help text atom.
 * @slot error - The message atom.
 */
export class BrikkaField extends LitElement {
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
      gap: var(--brikka-space-1);
    }
  `;

  @property({ type: Boolean, reflect: true }) invalid = false;

  registerPart(part: BrikkaFieldPart): void {
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
      for (const part of this.querySelectorAll<BrikkaFieldPart>(tag)) this.syncPart(part);
    }
  };

  private syncPart(part: BrikkaFieldPart): void {
    const entry = PART_SLOTS.find((candidate) => candidate.tag === part.localName);
    if (entry && part.slot !== entry.slot) part.slot = entry.slot;
    if (!this.hosts(part)) return;
    if (this.invalid) part.setAttribute('data-state', 'invalid');
    else part.removeAttribute('data-state');
  }

  private hosts(part: BrikkaFieldPart): boolean {
    const assigned = part.assignedSlot;
    if (assigned) return assigned.getRootNode() === this.shadowRoot;
    return part.parentElement === this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'brikka-field': BrikkaField;
  }
}
