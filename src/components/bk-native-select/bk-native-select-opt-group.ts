import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';

/* A group is data too: `label` becomes the `<optgroup>` label, and the options
 * inside it are mirrored under it. */
export class BkNativeSelectOptGroup extends LitElement {
  static override styles = css`
    :host {
      display: none;
    }
  `;

  @property({ type: String, reflect: true }) label = '';

  @property({ type: Boolean, reflect: true }) disabled = false;

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bk-native-select-opt-group': BkNativeSelectOptGroup;
  }
}
