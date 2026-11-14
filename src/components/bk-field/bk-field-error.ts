import { LitElement, css, html } from 'lit';
import { BkField } from './bk-field.js';

export class BkFieldError extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--bk-font-sans);
      font-size: var(--bk-font-size-sm);
      line-height: var(--bk-line-height-md);
      color: var(--bk-text-danger);
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    const field = this.closest('bk-field');
    if (field instanceof BkField) field.registerPart(this);
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bk-field-error': BkFieldError;
  }
}
