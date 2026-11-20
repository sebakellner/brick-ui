import { LitElement, css, html } from 'lit';
import { SlottedTextController } from '../shared/form-control/index.js';
import { BrikkaField } from './brikka-field.js';

/**
 * The help text under a field, referenced by `aria-describedby` while it has content.
 *
 * @slot - The help text.
 */
export class BrikkaFieldDescription extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--brikka-font-sans);
      font-size: var(--brikka-font-size-sm);
      line-height: var(--brikka-line-height-md);
      color: var(--brikka-text-muted);
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
    const field = this.closest('brikka-field');
    if (field instanceof BrikkaField) field.registerPart(this);
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
    'brikka-field-description': BrikkaFieldDescription;
  }
}
