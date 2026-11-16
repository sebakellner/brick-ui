import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { FieldControlMixin, formControlStyles } from '../shared/form-control/index.js';

export class BkCheckbox extends FieldControlMixin(LitElement) {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = [
    formControlStyles,
    css`
      :host {
        --bk-checkbox-variant-size: var(--bk-space-4);
        --bk-checkbox-variant-radius: var(--bk-radius-sm);
      }

      .field {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--bk-space-2);
        margin-block-end: 0;
      }

      .native {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        margin: 0;
        padding: 0;
        opacity: 0;
      }

      .box {
        box-sizing: border-box;
        display: grid;
        flex: none;
        place-items: center;
        inline-size: var(--bk-checkbox-size, var(--bk-checkbox-variant-size));
        block-size: var(--bk-checkbox-size, var(--bk-checkbox-variant-size));
        background: var(--bk-bg-surface);
        border: var(--bk-border-width) solid var(--bk-border-default);
        border-radius: var(--bk-checkbox-radius, var(--bk-checkbox-variant-radius));
        transition:
          border-color var(--bk-transition),
          background-color var(--bk-transition);
      }

      .field:not([data-disabled]):hover .box {
        border-color: var(--bk-border-strong);
      }

      .native[aria-invalid='true'] + .box {
        border-color: var(--bk-border-danger);
      }

      .native:focus-visible + .box {
        outline: var(--bk-focus-ring-width) solid var(--bk-focus-ring);
        outline-offset: var(--bk-focus-ring-offset);
      }

      .native:checked + .box {
        background: var(--bk-bg-accent);
      }

      .native:indeterminate + .box {
        background: var(--bk-bg-accent);
      }

      .native[aria-disabled='true'] + .box {
        cursor: not-allowed;
      }

      .box::after {
        content: '';
        box-sizing: border-box;
        visibility: hidden;
        inline-size: 35%;
        block-size: 60%;
        color: var(--bk-text-on-accent);
        border-inline-end: calc(var(--bk-border-width) * 2) solid currentColor;
        border-block-end: calc(var(--bk-border-width) * 2) solid currentColor;
        transform: rotate(45deg);
      }

      .native:checked + .box::after {
        visibility: visible;
      }

      .native:indeterminate + .box::after {
        visibility: visible;
        inline-size: 60%;
        block-size: calc(var(--bk-border-width) * 2);
        border: 0;
        background: currentColor;
        transform: none;
      }
    `,
  ];

  @property({ type: Boolean }) checked = false;

  @property({ type: Boolean, reflect: true }) indeterminate = false;

  private authoredIndeterminate: boolean | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.authoredIndeterminate ??= this.hasAttribute('indeterminate');
  }

  override get formControlElement(): HTMLInputElement | undefined {
    return this.shadowRoot?.querySelector('input') ?? undefined;
  }

  override get submittedValue(): string | null {
    if (this.indeterminate) return null;

    return this.checked ? this.value || 'on' : null;
  }

  override render() {
    return html`
      <label
        class="field label"
        part="label"
        for=${this.controlId}
        data-state=${this.fieldParts.labelState ?? nothing}
        ?data-disabled=${this.fieldDisabled}
      >
        <input
          part="input"
          class="native"
          id=${this.controlId}
          type="checkbox"
          name=${this.name || nothing}
          .checked=${this.checked}
          ?required=${this.required}
          .indeterminate=${this.indeterminate}
          aria-disabled=${this.fieldDisabled ? 'true' : nothing}
          aria-invalid=${this.fieldInvalid ? 'true' : nothing}
          aria-describedby=${this.fieldParts.describedBy(this.messageSources()) || nothing}
          @click=${this.handleClick}
          @change=${this.handleChange}
        />
        <span part="box" class="box" aria-hidden="true"></span>
        <slot name="label" @slotchange=${this.fieldParts.handleLabelSlot}></slot>
        ${this.fieldParts.glyph}
      </label>
      ${this.fieldParts.messages}
    `;
  }

  override formResetCallback(): void {
    const initialChecked = this.hasAttribute('checked');
    const initialIndeterminate = this.authoredIndeterminate ?? this.hasAttribute('indeterminate');
    const control = this.formControlElement;
    if (control) {
      control.checked = initialChecked;
      control.indeterminate = initialIndeterminate;
    }
    this.checked = initialChecked;
    this.indeterminate = initialIndeterminate;
    super.formResetCallback();
  }

  private readonly handleClick = (event: MouseEvent): void => {
    if (this.fieldDisabled) event.preventDefault();
  };

  private readonly handleChange = (): void => {
    const control = this.formControlElement;
    if (!control) return;
    this.checked = control.checked;
    this.indeterminate = control.indeterminate;
    this.dispatchEvent(
      new CustomEvent<{ checked: boolean }>('bk-change', {
        detail: { checked: this.checked },
        bubbles: true,
        composed: true,
      }),
    );
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'bk-checkbox': BkCheckbox;
  }
}
