import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

export type BrikkaButtonVariant = 'primary' | 'secondary' | 'ghost';
export type BrikkaButtonType = 'submit' | 'reset' | 'button';

/**
 * A button that delegates focus to its inner native `<button>`. The default slot is its content,
 * and `type` decides which form action the activation runs.
 *
 * @slot - The content of the button: its text, or an icon.
 * @csspart button - The native `<button>`, carrying `aria-disabled` while it is unavailable.
 */
export class BrikkaButton extends LitElement {
  static formAssociated = true;

  private readonly internals = this.attachInternals();

  @state() private formDisabled = false;

  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = css`
    :host {
      display: inline-block;
      --brikka-button-variant-bg: var(--brikka-bg-accent);
      --brikka-button-variant-bg-hover: var(--brikka-bg-accent-hover);
      --brikka-button-variant-fg: var(--brikka-text-on-accent);
      --brikka-button-variant-border: transparent;
    }

    :host([hidden]) {
      display: none;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--brikka-space-2);
      min-height: var(--brikka-control-height);
      padding: 0 var(--brikka-space-4);
      font-family: var(--brikka-font-sans);
      font-size: var(--brikka-font-size-md);
      font-weight: var(--brikka-font-weight-medium);
      line-height: var(--brikka-line-height-md);
      border: var(--brikka-border-width) solid
        var(--brikka-button-border, var(--brikka-button-variant-border));
      border-radius: var(--brikka-button-radius, var(--brikka-radius-md));
      background: var(--brikka-button-bg, var(--brikka-button-variant-bg));
      color: var(--brikka-button-fg, var(--brikka-button-variant-fg));
      cursor: pointer;
      transition:
        background-color var(--brikka-transition),
        border-color var(--brikka-transition),
        color var(--brikka-transition);
    }

    button:active:not([aria-disabled='true']) {
      background: var(--brikka-button-bg-hover, var(--brikka-button-variant-bg-hover));
      border-color: var(
        --brikka-button-border-hover,
        var(--brikka-button-border, var(--brikka-button-variant-border))
      );
    }

    @media (hover: hover) {
      button:hover:not([aria-disabled='true']) {
        background: var(--brikka-button-bg-hover, var(--brikka-button-variant-bg-hover));
        border-color: var(
          --brikka-button-border-hover,
          var(--brikka-button-border, var(--brikka-button-variant-border))
        );
      }
    }

    button:focus-visible {
      outline: var(--brikka-focus-ring-width) solid var(--brikka-focus-ring);
      outline-offset: var(--brikka-focus-ring-offset);
    }

    button[aria-disabled='true'] {
      cursor: not-allowed;
      opacity: var(--brikka-button-disabled-opacity);
    }

    @media (forced-colors: active) {
      button {
        border-color: ButtonText;
      }

      button[aria-disabled='true'] {
        color: GrayText;
        border-color: GrayText;
      }
    }

    :host([variant='secondary']) {
      --brikka-button-variant-bg: var(--brikka-bg-surface);
      --brikka-button-variant-bg-hover: var(--brikka-bg-surface-hover);
      --brikka-button-variant-fg: var(--brikka-text-default);
      --brikka-button-variant-border: var(--brikka-border-default);
    }

    :host([variant='ghost']) {
      --brikka-button-variant-bg: transparent;
      --brikka-button-variant-bg-hover: var(--brikka-bg-surface-muted);
      --brikka-button-variant-fg: var(--brikka-text-default);
      --brikka-button-variant-border: transparent;
    }
  `;

  @property({ type: String, reflect: true }) variant: BrikkaButtonVariant = 'primary';

  @property({ type: String }) label = '';

  @property({ type: String, reflect: true }) type: BrikkaButtonType = 'button';

  @property({ type: Boolean, reflect: true }) disabled = false;

  override render() {
    return html`
      <button
        part="button"
        type="button"
        aria-label=${this.label || nothing}
        aria-disabled=${this.isDisabled ? 'true' : nothing}
        @click=${this.handleClick}
      >
        <slot></slot>
      </button>
    `;
  }

  override click(): void {
    if (this.isDisabled) return;
    this.renderRoot.querySelector('button')?.click();
  }

  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  private get isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  private readonly handleClick = (event: MouseEvent) => {
    if (this.isDisabled) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
    }

    const form = this.internals.form;
    if (!form) return;
    if (this.type === 'submit') form.requestSubmit();
    else if (this.type === 'reset') form.reset();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'brikka-button': BrikkaButton;
  }
}
