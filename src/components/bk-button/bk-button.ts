import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { hooks, tokens } from '../../styles/tokens.generated.js';
import { v } from '../../styles/tokens.js';

export type BkButtonVariant = 'primary' | 'secondary' | 'ghost';

/**
 * A button.
 *
 * Theming is layered on purpose: `--bk-button-*` are the public properties a
 * consumer may set, `--bk-button-{variant}-*` are the control tokens each
 * variant pulls its defaults from, and the public property wins over the
 * variant default whether it is set on the element or inherited. Both token
 * layers resolve to palette entries, so re-theming never needs a raw color.
 *
 * `::part(button)` exposes the inner native button for anything the properties
 * do not cover.
 */
export class BkButton extends LitElement {
  // The real button lives in the shadow root, so focus must be delegated to it.
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = css`
    :host {
      display: inline-block;
      ${v(hooks.buttonVariantBg)}: var(${v(tokens.buttonPrimaryBg)});
      ${v(hooks.buttonVariantBgHover)}: var(${v(tokens.buttonPrimaryBgHover)});
      ${v(hooks.buttonVariantFg)}: var(${v(tokens.buttonPrimaryFg)});
      ${v(hooks.buttonVariantBorder)}: var(${v(tokens.buttonPrimaryBorder)});
    }

    :host([hidden]) {
      display: none;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(${v(tokens.space2)});
      min-height: var(${v(tokens.controlHeight)});
      padding: 0 var(${v(tokens.space4)});
      font-family: var(${v(tokens.fontSans)});
      font-size: var(${v(tokens.fontSizeMd)});
      font-weight: 500;
      line-height: var(${v(tokens.lineHeightMd)});
      border: var(${v(tokens.borderWidth)}) solid
        var(${v(hooks.buttonBorder)}, var(${v(hooks.buttonVariantBorder)}));
      border-radius: var(${v(hooks.buttonRadius)}, var(${v(tokens.radiusMd)}));
      background: var(${v(hooks.buttonBg)}, var(${v(hooks.buttonVariantBg)}));
      color: var(${v(hooks.buttonFg)}, var(${v(hooks.buttonVariantFg)}));
      cursor: pointer;
      transition:
        background-color var(${v(tokens.transition)}),
        border-color var(${v(tokens.transition)}),
        color var(${v(tokens.transition)});
    }

    button:hover:not(:disabled) {
      background: var(${v(hooks.buttonBgHover)}, var(${v(hooks.buttonVariantBgHover)}));
      border-color: var(
        --bk-button-border-hover,
        var(${v(hooks.buttonBorder)}, var(${v(hooks.buttonVariantBorder)}))
      );
    }

    button:focus-visible {
      outline: var(${v(tokens.focusRingWidth)}) solid var(${v(tokens.focusRing)});
      outline-offset: var(${v(tokens.focusRingOffset)});
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    :host([variant='secondary']) {
      ${v(hooks.buttonVariantBg)}: var(${v(tokens.buttonSecondaryBg)});
      ${v(hooks.buttonVariantBgHover)}: var(${v(tokens.buttonSecondaryBgHover)});
      ${v(hooks.buttonVariantFg)}: var(${v(tokens.buttonSecondaryFg)});
      ${v(hooks.buttonVariantBorder)}: var(${v(tokens.buttonSecondaryBorder)});
    }

    :host([variant='ghost']) {
      ${v(hooks.buttonVariantBg)}: var(${v(tokens.buttonGhostBg)});
      ${v(hooks.buttonVariantBgHover)}: var(${v(tokens.buttonGhostBgHover)});
      ${v(hooks.buttonVariantFg)}: var(${v(tokens.buttonGhostFg)});
      ${v(hooks.buttonVariantBorder)}: var(${v(tokens.buttonGhostBorder)});
    }
  `;

  @property({ type: String, reflect: true }) variant: BkButtonVariant = 'primary';

  @property({ type: Boolean, reflect: true }) disabled = false;

  override render() {
    return html`
      <button part="button" ?disabled=${this.disabled}>
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('bk-button', BkButton);

declare global {
  interface HTMLElementTagNameMap {
    'bk-button': BkButton;
  }
}
