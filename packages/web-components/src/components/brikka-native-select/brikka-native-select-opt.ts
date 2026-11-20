import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';

/**
 * One option of a `brikka-native-select`. Its label is its text, and the atom paints nothing: the
 * select builds the real `<option>` from it.
 *
 * @slot - The text of the option, which is its label.
 */
export class BrikkaNativeSelectOpt extends LitElement {
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
    'brikka-native-select-opt': BrikkaNativeSelectOpt;
  }
}
