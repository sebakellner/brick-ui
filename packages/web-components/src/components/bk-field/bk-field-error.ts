import { LitElement, css, html } from 'lit';
import { SlottedTextController } from '../shared/form-control/index.js';
import { BkField } from './bk-field.js';

/**
 * The problem a field reports. An atom with text **is** the field's error: it marks the field
 * invalid and blocks submission.
 *
 * @slot - The message.
 */
export class BkFieldError extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--bk-font-sans);
      font-size: var(--bk-font-size-sm);
      line-height: var(--bk-line-height-md);
      color: var(--bk-text-danger);
    }

    :host([hidden]) {
      display: none;
    }

    :host([data-empty]) {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `;

  /* The text the atom holds, which no container can read for it: it is this
   * element's light DOM. Why the atom, and not its container, decides: ADR 0022. */
  private readonly text = new SlottedTextController(this);

  override connectedCallback(): void {
    super.connectedCallback();
    const field = this.closest('bk-field');
    if (field instanceof BkField) field.registerPart(this);
    this.text.watchNodes([this]);
  }

  /* `data-empty` stays present-while-empty, so the `::slotted(:not([data-empty]))`
   * of a group that consumes this atom keeps reading it, and the group no longer
   * writes it on the atom's behalf. */
  protected override willUpdate(): void {
    if (this.text.nodeHasText(this)) this.removeAttribute('data-empty');
    else this.setAttribute('data-empty', '');
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
