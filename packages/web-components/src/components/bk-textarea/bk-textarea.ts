import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { FieldControlMixin, formControlStyles } from '../shared/form-control/index.js';

export type BkTextareaResize = 'none' | 'vertical' | 'auto';

/**
 * A multiline text field: the platform's `<textarea>` with the field's label, help text and error
 * regions around it, and a counter while `maxlength` bounds the value.
 *
 * @slot label - The label atom that names the field.
 * @slot description - The help text, named by `aria-describedby` while it has content.
 * @slot error - The problem, announced from the status region; text in it is the field's error.
 * @csspart label - The `<label>` row, carrying `data-state` while the field is invalid or disabled.
 * @csspart textarea - The native `<textarea>`.
 * @csspart required - The `*` that marks a required field.
 * @csspart message - The container of the help and error regions.
 * @csspart description - The help region.
 * @csspart error - The error region.
 * @csspart counter - The `value.length` / `maxlength` count, present only while `maxlength` bounds
 * the value, and announced from its own status region.
 * @fires bk-change - The value changed, with the new value in `detail.value`.
 */
export class BkTextarea extends FieldControlMixin(LitElement) {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = [
    formControlStyles,
    css`
      .control {
        min-block-size: 0;
        padding-block: var(--bk-space-2);
        border-radius: var(--bk-textarea-radius, var(--bk-radius-md));
        resize: vertical;
      }

      :host([resize='none']) .control,
      :host([resize='auto']) .control {
        resize: none;
      }

      /* The counter shares the row with the help text, as Material 3 puts it: help on the left,
       * count on the right, and the error takes the left when it shows without moving the count. */
      .footer {
        display: flex;
        gap: var(--bk-space-2);
        align-items: baseline;
        justify-content: space-between;
      }

      .footer > .regions {
        flex: 1 1 auto;
        min-inline-size: 0;
      }

      .counter {
        flex: 0 0 auto;
        margin-block-start: var(--bk-space-1);
        font-family: var(--bk-font-sans);
        font-size: var(--bk-font-size-sm);
        line-height: var(--bk-line-height-md);
        color: var(--bk-text-muted);
        white-space: nowrap;
      }
    `,
  ];

  @property({ type: String }) placeholder = '';

  @property({ type: String }) autocomplete = '';

  @property({ type: Number }) rows = 4;

  @property({ type: String, reflect: true }) resize: BkTextareaResize = 'vertical';

  /* `maxlength` is also the counter's switch, so a bound that is no bound — `0`, the
   * platform's "no limit" — is not forwarded either: the two would disagree. */
  @property({ type: Number }) maxlength = 0;

  @property({ type: Number }) minlength = 0;

  private readonly counterId = `${this.controlId}-counter`;

  override get formControlElement(): HTMLTextAreaElement | undefined {
    return this.shadowRoot?.querySelector('textarea') ?? undefined;
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
      <textarea
        part="textarea"
        class="control"
        id=${this.controlId}
        name=${this.name || nothing}
        placeholder=${this.placeholder || nothing}
        autocomplete=${this.autocomplete || nothing}
        rows=${this.rows}
        maxlength=${this.maxlength > 0 ? this.maxlength : nothing}
        minlength=${this.minlength > 0 ? this.minlength : nothing}
        .value=${this.value}
        ?disabled=${this.fieldDisabled}
        ?required=${this.required}
        aria-invalid=${this.fieldInvalid ? 'true' : nothing}
        aria-describedby=${this.describedBy() || nothing}
        @input=${this.handleInput}
        @change=${this.handleChange}
      ></textarea>
      <div class="footer">
        <div class="regions">${this.fieldParts.messages}</div>
        ${
          this.counted
            ? html`<div class="counter" part="counter" id=${this.counterId} role="status">
                ${String(this.value).length} / ${this.maxlength}
              </div>`
            : nothing
        }
      </div>
    `;
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncControlHeight();
  }

  private get counted(): boolean {
    return this.maxlength > 0;
  }

  /* The regions name themselves from their own content, so the counter is the one id this
   * element adds; the error still displaces the description, the way it does for every field. */
  private describedBy(): string | undefined {
    const ids = [this.fieldParts.describedBy(this.messageSources())];
    if (this.counted) ids.push(this.counterId);
    return ids.filter((id): id is string => id !== undefined).join(' ') || undefined;
  }

  /* `auto` measures, so it runs after every render: the value can arrive as a property, not only
   * from a keystroke, and a shrinking value has to give the height back as well. */
  private syncControlHeight(): void {
    const control = this.formControlElement;
    if (!control) return;
    if (this.resize !== 'auto') {
      control.style.removeProperty('height');
      return;
    }
    control.style.height = 'auto';
    /* `scrollHeight` counts the padding and never the border, and the control is border-box, so
     * the border has to be given back or a full field keeps a scrollbar. */
    const border = control.offsetHeight - control.clientHeight;
    control.style.height = `${control.scrollHeight + border}px`;
  }

  private readonly handleInput = (event: Event) => {
    this.value = (event.target as HTMLTextAreaElement).value;
  };

  private readonly handleChange = (event: Event) => {
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('bk-change', {
        detail: { value: (event.target as HTMLTextAreaElement).value },
        bubbles: true,
        composed: true,
      }),
    );
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'bk-textarea': BkTextarea;
  }
}
