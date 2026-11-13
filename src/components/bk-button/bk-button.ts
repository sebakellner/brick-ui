import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';

export type BkButtonVariant = 'primary' | 'secondary' | 'ghost';
export type BkButtonType = 'submit' | 'reset' | 'button';

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
      --bk-button-variant-bg: var(--bk-bg-accent);
      --bk-button-variant-bg-hover: var(--bk-bg-accent-hover);
      --bk-button-variant-fg: var(--bk-text-on-accent);
      --bk-button-variant-border: transparent;
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
      font-weight: var(--bk-font-weight-medium);
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

    button:hover:not([aria-disabled='true']) {
      background: var(--bk-button-bg-hover, var(--bk-button-variant-bg-hover));
      border-color: var(
        --bk-button-border-hover,
        var(--bk-button-border, var(--bk-button-variant-border))
      );
    }

    button:focus-visible {
      outline: var(--bk-focus-ring-width) solid var(--bk-focus-ring);
      outline-offset: var(--bk-focus-ring-offset);
    }

    button[aria-disabled='true'] {
      cursor: not-allowed;
      opacity: var(--bk-button-disabled-opacity);
    }

    :host([variant='secondary']) {
      --bk-button-variant-bg: var(--bk-bg-surface);
      --bk-button-variant-bg-hover: var(--bk-bg-surface-hover);
      --bk-button-variant-fg: var(--bk-text-default);
      --bk-button-variant-border: var(--bk-border-default);
    }

    :host([variant='ghost']) {
      --bk-button-variant-bg: transparent;
      --bk-button-variant-bg-hover: var(--bk-bg-surface-muted);
      --bk-button-variant-fg: var(--bk-text-default);
      --bk-button-variant-border: transparent;
    }
  `;

  @property({ type: String, reflect: true }) variant: BkButtonVariant = 'primary';

  // `button` rather than the platform default, so a button dropped into a form
  // does not submit it by accident. The inner button cannot act on that form —
  // form association does not cross a shadow boundary — so the host finds it.
  @property({ type: String, reflect: true }) type: BkButtonType = 'button';

  @property({ type: Boolean, reflect: true }) disabled = false;

  override render() {
    return html`
      <button
        part="button"
        type=${this.type}
        aria-disabled=${this.disabled ? 'true' : nothing}
        @click=${this.handleClick}
      >
        <slot></slot>
      </button>
    `;
  }

  private readonly handleClick = (event: MouseEvent) => {
    if (this.disabled) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
    }

    const form = this.closest('form');
    if (!form) return;
    if (this.type === 'submit') form.requestSubmit();
    else if (this.type === 'reset') form.reset();
  };
}


declare global {
  interface HTMLElementTagNameMap {
    'bk-button': BkButton;
  }
}
