import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';

/* A group is data too: `label` becomes the `<optgroup>` label, and the options
 * inside it are mirrored under it. */
/**
 * A labelled group of options in a `bk-native-select`. The atom paints nothing: its `label` names
 * the `<optgroup>` the select builds, and its options are mirrored under it.
 *
 * @slot - The `bk-native-select-opt` children of the group.
 */
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
