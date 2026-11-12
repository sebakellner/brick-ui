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
      margin-bottom: var(--bk-space-1, 4px);
      font-family: var(--bk-font-sans, system-ui, sans-serif);
      font-size: var(--bk-font-size-sm, 0.8125rem);
      font-weight: 500;
      color: var(--bk-input-label-color, #1c1917);
    }

    input {
      box-sizing: border-box;
      width: 100%;
      min-height: var(--bk-control-height, 40px);
      padding: 0 var(--bk-space-3, 12px);
      font-family: var(--bk-font-sans, system-ui, sans-serif);
      font-size: var(--bk-font-size-md, 0.9375rem);
      line-height: var(--bk-line-height-md, 1.5);
      color: var(--bk-input-color, #1c1917);
      background: var(--bk-input-bg, #ffffff);
      border: var(--bk-border-width, 1px) solid var(--bk-input-border-color, #d6d3d1);
      border-radius: var(--bk-input-radius, var(--bk-radius-md, 8px));
      transition:
        border-color var(--bk-transition, 120ms ease),
        background-color var(--bk-transition, 120ms ease);
    }

    input::placeholder {
      color: var(--bk-color-text-muted, #57534e);
    }

    input:hover:not(:disabled) {
      border-color: var(--bk-color-border-strong, #a8a29e);
    }

    input:focus-visible {
      outline: 2px solid var(--bk-focus-ring, #0284c7);
      outline-offset: 1px;
    }

    input:disabled {
      cursor: not-allowed;
      color: var(--bk-color-text-muted, #57534e);
      background: var(--bk-color-surface-muted, #f5f5f4);
    }

    input[aria-invalid='true'] {
      border-color: var(--bk-color-danger, #b91c1c);
    }

    .message {
      margin-top: var(--bk-space-1, 4px);
      font-family: var(--bk-font-sans, system-ui, sans-serif);
      font-size: var(--bk-font-size-sm, 0.8125rem);
      line-height: var(--bk-line-height-md, 1.5);
      color: var(--bk-color-text-muted, #57534e);
    }

    .message[data-state='error'] {
      color: var(--bk-color-danger, #b91c1c);
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
