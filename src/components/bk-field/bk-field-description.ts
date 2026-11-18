import { LitElement, css, html } from 'lit';
import { SlottedTextController } from '../shared/form-control/index.js';
import { BkField } from './bk-field.js';

/**
 * The help text under a field, referenced by `aria-describedby` while it has content.
 *
 * @slot - The help text.
 */
export class BkFieldDescription extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--bk-font-sans);
      font-size: var(--bk-font-size-sm);
      line-height: var(--bk-line-height-md);
      color: var(--bk-text-muted);
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
   * of a group that consumes this atom keeps reading it. */
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
    'bk-field-description': BkFieldDescription;
  }
}
