import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';

export type BkInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

export type BkInputMode =
  | 'none'
  | 'text'
  | 'tel'
  | 'url'
  | 'email'
  | 'numeric'
  | 'decimal'
  | 'search';

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
  static formAssociated = true;

  private readonly internals = this.attachInternals();
  private initialValue = '';
  private formDisabled = false;

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
      font-weight: var(--bk-font-weight-medium);
      color: var(--bk-text-default);
    }

    input {
      box-sizing: border-box;
      width: 100%;
      min-height: var(--bk-control-height);
      padding: 0 var(--bk-space-3);
      font-family: var(--bk-font-sans);
      font-size: var(--bk-font-size-md);
      line-height: var(--bk-line-height-md);
      color: var(--bk-text-default);
      background: var(--bk-bg-surface);
      border: var(--bk-border-width) solid var(--bk-border-default);
      border-radius: var(--bk-input-radius, var(--bk-radius-md));
      transition:
        border-color var(--bk-transition),
        background-color var(--bk-transition);
    }

    input::placeholder {
      color: var(--bk-text-muted);
    }

    input:hover:not(:disabled):not([aria-invalid='true']) {
      border-color: var(--bk-border-strong);
    }

    input:focus-visible {
      outline: var(--bk-focus-ring-width) solid var(--bk-focus-ring);
      outline-offset: var(--bk-focus-ring-offset);
    }

    input:disabled {
      cursor: not-allowed;
      color: var(--bk-text-muted);
      background: var(--bk-bg-surface-muted);
    }

    input[aria-invalid='true'] {
      border-color: var(--bk-border-danger);
    }

    .message {
      margin-top: var(--bk-space-1);
      font-family: var(--bk-font-sans);
      font-size: var(--bk-font-size-sm);
      line-height: var(--bk-line-height-md);
      color: var(--bk-text-muted);
    }

    .message[data-state='error'] {
      color: var(--bk-text-danger);
    }

    .message:empty {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `;

  @property({ type: String }) label = '';

  @property({ type: String }) helper = '';

  @property({ type: String }) error = '';

  @property({ type: String }) value = '';

  @property({ type: String }) name = '';

  @property({ type: String }) type: BkInputType = 'text';

  @property({ type: String }) placeholder = '';

  @property({ type: String }) autocomplete = '';

  @property({ type: String }) override inputMode: BkInputMode | '' = '';

  @property({ type: Boolean, reflect: true }) disabled = false;

  @property({ type: Boolean, reflect: true }) required = false;

  // Generated once per instance: re-rendering must never break the label/id link.
  private readonly controlId = nextInstanceId();

  private readonly messageId = `${this.controlId}-message`;

  override firstUpdated() {
    this.initialValue = this.value;
    this.syncFormValue();
  }

  override updated(changed: Map<PropertyKey, unknown>) {
    if (changed.has('value') || changed.has('error') || changed.has('required')) {
      this.syncFormValue();
    }
  }

  formResetCallback() {
    this.value = this.initialValue;
    // A reset handler may read FormData or submit before the next render, so the
    // internals and the visible field are updated synchronously.
    this.syncFormValue();
    const field = this.shadowRoot?.querySelector('input');
    if (field) field.value = this.initialValue;
  }

  formDisabledCallback(disabled: boolean) {
    if (this.formDisabled === disabled) return;
    this.formDisabled = disabled;
    this.requestUpdate();
  }

  /** The author's `disabled` and the form's disabling are separate states. */
  private get fieldDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  private syncFormValue() {
    this.internals.setFormValue(this.value);

    const field = this.shadowRoot?.querySelector('input') ?? undefined;
    if (this.error) {
      this.internals.setValidity({ customError: true }, this.error, field);
    } else if (this.required && !this.value) {
      this.internals.setValidity({ valueMissing: true }, 'This field is required.', field);
    } else {
      this.internals.setValidity({});
    }
  }

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
        autocomplete=${this.autocomplete || nothing}
        inputmode=${this.inputMode || nothing}
        .value=${this.value}
        ?disabled=${this.fieldDisabled}
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
        data-state=${this.error ? 'error' : nothing}
        role="status"
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
