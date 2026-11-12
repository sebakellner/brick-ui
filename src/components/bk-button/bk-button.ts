import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';

export type BkButtonVariant = 'primary' | 'secondary' | 'ghost';

/**
 * A button.
 *
 * Theming is layered on purpose: `--bk-button-*` are the public properties a
 * consumer may set, and each variant only fills internal `--bk-button-variant-*`
 * variables that the public ones fall back to. That way a host page can re-theme
 * a single button without fighting the variant defaults.
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
    }

    :host([hidden]) {
      display: none;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--bk-space-2, 8px);
      min-height: var(--bk-control-height, 40px);
      padding: 0 var(--bk-space-4, 16px);
      font-family: var(--bk-font-sans, system-ui, sans-serif);
      font-size: var(--bk-font-size-md, 0.9375rem);
      font-weight: 500;
      line-height: var(--bk-line-height-md, 1.5);
      border: var(--bk-border-width, 1px) solid
        var(--bk-button-border, var(--bk-button-variant-border, transparent));
      border-radius: var(--bk-button-radius, var(--bk-radius-md, 8px));
      background: var(
        --bk-button-bg,
        var(--bk-button-variant-bg, var(--bk-color-primary, #c2410c))
      );
      color: var(--bk-button-fg, var(--bk-button-variant-fg, var(--bk-color-on-primary, #ffffff)));
      cursor: pointer;
      transition:
        background-color var(--bk-transition, 120ms ease),
        border-color var(--bk-transition, 120ms ease),
        color var(--bk-transition, 120ms ease);
    }

    button:hover:not(:disabled) {
      background: var(
        --bk-button-bg-hover,
        var(--bk-button-variant-bg-hover, var(--bk-color-primary-hover, #9a3412))
      );
      border-color: var(
        --bk-button-border-hover,
        var(--bk-button-border, var(--bk-button-variant-border, transparent))
      );
    }

    button:focus-visible {
      outline: 2px solid var(--bk-focus-ring, #0284c7);
      outline-offset: 2px;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    :host([variant='secondary']) {
      --bk-button-variant-bg: var(--bk-color-surface, #ffffff);
      --bk-button-variant-bg-hover: var(--bk-color-surface-hover, #e7e5e4);
      --bk-button-variant-fg: var(--bk-color-text, #1c1917);
      --bk-button-variant-border: var(--bk-color-border, #d6d3d1);
    }

    :host([variant='ghost']) {
      --bk-button-variant-bg: transparent;
      --bk-button-variant-bg-hover: var(--bk-color-surface-muted, #f5f5f4);
      --bk-button-variant-fg: var(--bk-color-text, #1c1917);
      --bk-button-variant-border: transparent;
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
