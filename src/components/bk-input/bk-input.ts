import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import {
  FieldMessagesController,
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

  private readonly messages = new FieldMessagesController(this, this.controlId);

  private hasSlottedLabel = false;

  override get formControlElement(): HTMLInputElement | undefined {
    return this.shadowRoot?.querySelector('input') ?? undefined;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.hasSlottedLabel = this.readSlottedLabel();
    this.messages.connect();
  }

  override render() {
    const describedBy = this.messages.update(this.messageSources());
    const labelled = this.label !== '' || this.hasSlottedLabel;

    return html`
      <label class="label" part="label" for=${this.controlId} ?hidden=${!labelled}>
        <slot name="label" @slotchange=${this.handleLabelSlotChange}>
          ${this.hasSlottedLabel ? nothing : this.label}
        </slot>
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
        aria-describedby=${describedBy || nothing}
        @input=${this.handleInput}
        @change=${this.handleChange}
      />
      ${this.messages.render()}
    `;
  }

  private messageSources(): FieldMessageFallbacks {
    return {
      description: this.helper,
      error: this.error || this.fieldMessage,
    };
  }

  private readSlottedLabel(): boolean {
    return Array.from(this.children).some((child) => child.slot === 'label');
  }

  private readonly handleLabelSlotChange = (event: Event): void => {
    const slotted = (event.target as HTMLSlotElement).assignedNodes({ flatten: false }).length > 0;
    if (slotted === this.hasSlottedLabel) return;
    this.hasSlottedLabel = slotted;
    this.requestUpdate();
  };

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
