import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { FieldControlMixin, formControlStyles } from '../shared/form-control/index.js';

export type BkInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

export type BkInputMode =
  'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';

export class BkInput extends FieldControlMixin(LitElement) {
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

  @property({ type: String }) type: BkInputType = 'text';

  @property({ type: String }) placeholder = '';

  @property({ type: String }) autocomplete = '';

  @property({ type: String }) override inputMode: BkInputMode | '' = '';

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
        ?data-disabled=${this.fieldDisabled}
        ?hidden=${!this.fieldParts.labelled}
      >
        <slot name="label" @slotchange=${this.fieldParts.handleLabelSlot}></slot>
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
