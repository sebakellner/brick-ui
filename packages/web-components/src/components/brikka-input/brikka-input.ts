import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { FieldControlMixin, formControlStyles } from '../shared/form-control/index.js';

export type BrikkaInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

export type BrikkaInputMode =
  'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';

/**
 * A text field: the platform's `<input>` with the field's label, help text and error regions
 * around it.
 *
 * @slot label - The label atom that names the field.
 * @slot description - The help text, named by `aria-describedby` while it has content.
 * @slot error - The problem, announced from the status region; text in it is the field's error.
 * @csspart label - The `<label>` row, carrying `data-state` while the field is invalid or disabled.
 * @csspart input - The native `<input>`.
 * @csspart required - The `*` that marks a required field.
 * @csspart message - The container of the help and error regions.
 * @csspart description - The help region.
 * @csspart error - The error region.
 * @fires brikka-change - The value changed, with the new value in `detail.value`.
 */
export class BrikkaInput extends FieldControlMixin(LitElement) {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = [
    formControlStyles,
    css`
      .control {
        border-radius: var(--brikka-input-radius, var(--brikka-radius-md));
      }
    `,
  ];

  @property({ type: String }) type: BrikkaInputType = 'text';

  @property({ type: String }) placeholder = '';

  @property({ type: String }) autocomplete = '';

  @property({ type: String }) override inputMode: BrikkaInputMode | '' = '';

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
      new CustomEvent<{ value: string }>('brikka-change', {
        detail: { value: (event.target as HTMLInputElement).value },
        bubbles: true,
        composed: true,
      }),
    );
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'brikka-input': BrikkaInput;
  }
}
