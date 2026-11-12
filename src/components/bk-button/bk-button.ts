import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';

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
      --bk-button-variant-bg: var(--bk-button-primary-bg);
      --bk-button-variant-bg-hover: var(--bk-button-primary-bg-hover);
      --bk-button-variant-fg: var(--bk-button-primary-fg);
      --bk-button-variant-border: var(--bk-button-primary-border);
    }

    :host([hidden]) {
      display: none;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--bk-space-2);
      min-height: var(--bk-control-height);
      padding: 0 var(--bk-space-4);
      font-family: var(--bk-font-sans);
      font-size: var(--bk-font-size-md);
      font-weight: 500;
      line-height: var(--bk-line-height-md);
      border: var(--bk-border-width) solid
        var(--bk-button-border, var(--bk-button-variant-border));
      border-radius: var(--bk-button-radius, var(--bk-radius-md));
      background: var(--bk-button-bg, var(--bk-button-variant-bg));
      color: var(--bk-button-fg, var(--bk-button-variant-fg));
      cursor: pointer;
      transition:
        background-color var(--bk-transition),
        border-color var(--bk-transition),
        color var(--bk-transition);
    }

    button:hover:not(:disabled) {
      background: var(--bk-button-bg-hover, var(--bk-button-variant-bg-hover));
      border-color: var(
        --bk-button-border-hover,
        var(--bk-button-border, var(--bk-button-variant-border))
      );
    }

    button:focus-visible {
      outline: 2px solid var(--bk-focus-ring);
      outline-offset: 2px;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    :host([variant='secondary']) {
      --bk-button-variant-bg: var(--bk-button-secondary-bg);
      --bk-button-variant-bg-hover: var(--bk-button-secondary-bg-hover);
      --bk-button-variant-fg: var(--bk-button-secondary-fg);
      --bk-button-variant-border: var(--bk-button-secondary-border);
    }

    :host([variant='ghost']) {
      --bk-button-variant-bg: var(--bk-button-ghost-bg);
      --bk-button-variant-bg-hover: var(--bk-button-ghost-bg-hover);
      --bk-button-variant-fg: var(--bk-button-ghost-fg);
      --bk-button-variant-border: var(--bk-button-ghost-border);
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
