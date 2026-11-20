import { LitElement, css, html } from 'lit';
import { BrikkaField } from './brikka-field.js';

/**
 * The label a field renders inside its `<label>`. Its text is the name the control is
 * announced by.
 *
 * @slot - The label text.
 */
export class BrikkaFieldLabel extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--brikka-font-sans);
      font-size: var(--brikka-font-size-sm);
      font-weight: var(--brikka-font-weight-medium);
      color: var(--brikka-text-default);
    }

    :host([data-state='invalid']) {
      color: var(--brikka-text-danger);
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    const field = this.closest('brikka-field');
    if (field instanceof BrikkaField) field.registerPart(this);
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'brikka-field-label': BrikkaFieldLabel;
  }
}
