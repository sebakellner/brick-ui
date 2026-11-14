import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import {
  FieldPartsController,
  FormControlMixin,
  formControlStyles,
  type FieldMessageFallbacks,
} from '../shared/form-control/index.js';

export type BkInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

export type BkInputMode =
  'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';

let instanceCount = 0;
const nextInstanceId = () => `bk-input-${++instanceCount}`;

export class BkInput extends FormControlMixin(LitElement) {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = [
    formControlStyles,
    css`
      slot[name='label']::slotted(*) {
        display: inline-block;
      }

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

  private readonly controlId = nextInstanceId();

  private readonly fieldParts = new FieldPartsController(this, this.controlId);

  override get formControlElement(): HTMLInputElement | undefined {
    return this.shadowRoot?.querySelector('input') ?? undefined;
  }

  override render() {
    return html`
      <label
        class="label"
        part="label"
        for=${this.controlId}
        data-state=${this.fieldParts.labelState ?? nothing}
        ?hidden=${!this.fieldParts.labelled}
      >
        <slot name="label" @slotchange=${this.fieldParts.handleLabelSlot}>
          ${this.fieldParts.slottedLabel ? nothing : this.label}
        </slot>
        ${this.fieldParts.glyph}
      </label>
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
        aria-invalid=${this.fieldInvalid ? 'true' : nothing}
        aria-describedby=${this.fieldParts.describedBy(this.messageSources()) || nothing}
        @input=${this.handleInput}
        @change=${this.handleChange}
      />
      ${this.fieldParts.messages}
    `;
  }

  private messageSources(): FieldMessageFallbacks {
    return {
      description: this.helper,
      error: this.error || this.fieldMessage,
    };
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
