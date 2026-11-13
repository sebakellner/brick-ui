import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { FormControlMixin } from '../shared/form-control.mixin.js';
import { formControlStyles } from '../shared/form-control.styles.js';

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
 * Form participation — the form value, validity, reset and the form's disabling
 * — comes from `FormControlMixin`; the paint comes from `formControlStyles`.
 * What is left here is the text input itself: the `<label>`/`id` link, the
 * message region that is the input's `aria-describedby`, and the native
 * attributes a text field forwards.
 */
export class BkInput extends FormControlMixin(LitElement) {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = [
    formControlStyles,
    css`
      .control {
        border-radius: var(--bk-input-radius, var(--bk-radius-md));
      }
    `,
  ];

  @property({ type: String }) label = '';

  @property({ type: String }) helper = '';

  @property({ type: String }) type: BkInputType = 'text';

  @property({ type: String }) placeholder = '';

  @property({ type: String }) autocomplete = '';

  @property({ type: String }) override inputMode: BkInputMode | '' = '';

  // Generated once per instance: re-rendering must never break the label/id link.
  private readonly controlId = nextInstanceId();

  private readonly messageId = `${this.controlId}-message`;

  override get formControlElement(): HTMLInputElement | undefined {
    return this.shadowRoot?.querySelector('input') ?? undefined;
  }

  override render() {
    const message = this.error || this.helper;

    return html`
      ${this.label
        ? html`<label class="label" part="label" for=${this.controlId}>${this.label}</label>`
        : nothing}
      <input
        part="input"
        class="control"
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

declare global {
  interface HTMLElementTagNameMap {
    'bk-input': BkInput;
  }
}
