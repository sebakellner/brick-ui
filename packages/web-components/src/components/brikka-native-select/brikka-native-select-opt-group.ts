import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';

/**
 * A labelled group of options in a `brikka-native-select`. The atom paints nothing: its `label` names
 * the `<optgroup>` the select builds, and its options are mirrored under it.
 *
 * @slot - The `brikka-native-select-opt` children of the group.
 */
export class BrikkaNativeSelectOptGroup extends LitElement {
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
    'brikka-native-select-opt-group': BrikkaNativeSelectOptGroup;
  }
}
