import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';

/* The label of this option is its text, so there is nothing to render: the atom
 * is data for the select, and the option inside the select carries the name. */
export class BkNativeSelectOpt extends LitElement {
  static override styles = css`
    :host {
      display: none;
    }
  `;

  @property({ type: String, reflect: true }) value = '';

  @property({ type: Boolean, reflect: true }) disabled = false;

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bk-native-select-opt': BkNativeSelectOpt;
  }
}
