import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';

export type BkInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

let instanceCount = 0;
const nextInstanceId = () => `bk-input-${++instanceCount}`;

/**
 * A single-line text field.
 *
 * Accessibility is wired from the inside out: the visible `<label>` is bound to
 * the input with `for`/`id`, and the message region is the input's
 * `aria-describedby`. The region always exists so screen readers announce error
 * text when it appears; it collapses with `:empty` when there is nothing to say.
 *
 * `error` wins over `helper`, and sets `aria-invalid` on the input.
 */
export class BkInput extends LitElement {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    label {
      display: block;
      margin-bottom: var(--bk-space-1);
      font-family: var(--bk-font-sans);
      font-size: var(--bk-font-size-sm);
      font-weight: 500;
      color: var(--bk-input-label-color);
    }

    input {
      box-sizing: border-box;
      width: 100%;
      min-height: var(--bk-control-height);
      padding: 0 var(--bk-space-3);
      font-family: var(--bk-font-sans);
      font-size: var(--bk-font-size-md);
      line-height: var(--bk-line-height-md);
      color: var(--bk-input-color);
      background: var(--bk-input-bg);
      border: var(--bk-border-width) solid var(--bk-input-border-color);
      border-radius: var(--bk-input-radius, var(--bk-radius-md));
      transition:
        border-color var(--bk-transition),
        background-color var(--bk-transition);
    }

    input::placeholder {
      color: var(--bk-color-text-muted);
    }

    input:hover:not(:disabled):not([aria-invalid='true']) {
      border-color: var(--bk-color-border-strong);
    }

    input:focus-visible {
      outline: 2px solid var(--bk-focus-ring);
      outline-offset: 1px;
    }

    input:disabled {
      cursor: not-allowed;
      color: var(--bk-color-text-muted);
      background: var(--bk-color-surface-muted);
    }

    input[aria-invalid='true'] {
      border-color: var(--bk-color-danger);
    }

    .message {
      margin-top: var(--bk-space-1);
      font-family: var(--bk-font-sans);
      font-size: var(--bk-font-size-sm);
      line-height: var(--bk-line-height-md);
      color: var(--bk-color-text-muted);
    }

    .message[data-state='error'] {
      color: var(--bk-color-danger);
    }

    .message:empty {
      display: none;
    }
  `;

  @property({ type: String }) label = '';

  @property({ type: String }) helper = '';

  @property({ type: String }) error = '';

  @property({ type: String }) value = '';

  @property({ type: String }) name = '';

  @property({ type: String }) type: BkInputType = 'text';

  @property({ type: String }) placeholder = '';

  @property({ type: Boolean, reflect: true }) disabled = false;

  @property({ type: Boolean, reflect: true }) required = false;

  // Generated once per instance: re-rendering must never break the label/id link.
  private readonly controlId = nextInstanceId();

  private readonly messageId = `${this.controlId}-message`;

  override render() {
    const message = this.error || this.helper;

    return html`
      ${this.label
        ? html`<label part="label" for=${this.controlId}>${this.label}</label>`
        : nothing}
      <input
        part="input"
        id=${this.controlId}
        type=${this.type}
        name=${this.name || nothing}
        placeholder=${this.placeholder || nothing}
        .value=${this.value}
        ?disabled=${this.disabled}
        ?required=${this.required}
        aria-invalid=${this.error ? 'true' : nothing}
        aria-describedby=${message ? this.messageId : nothing}
        @input=${this.handleInput}
        @change=${this.handleChange}
      />
      <div
        part="message"
        id=${this.messageId}
        class="message"
        data-state=${this.error ? 'error' : 'helper'}
        aria-live="polite"
      >
        ${message || nothing}
      </div>
    `;
  }

  private readonly handleInput = (event: Event) => {
    this.value = (event.target as HTMLInputElement).value;
  };

  private readonly handleChange = (event: Event) => {
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('bk-change', {
        detail: { value: (event.target as HTMLInputElement).value },
        bubbles: true,
        composed: true,
      }),
    );
  };
}

customElements.define('bk-input', BkInput);

declare global {
  interface HTMLElementTagNameMap {
    'bk-input': BkInput;
  }
}
