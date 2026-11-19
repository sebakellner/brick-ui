import {
  LitElement,
  css,
  html,
  nothing,
  type ComplexAttributeConverter,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import { FieldControlMixin, formControlStyles } from '../shared/form-control/index.js';

export type BkSliderOrientation = 'horizontal' | 'vertical';

const numberConverter: ComplexAttributeConverter<number> = {
  fromAttribute: (value: string | null): number => (value === null ? 0 : Number(value)),
};

/* A missing attribute is a missing upper thumb, not a thumb stuck at zero: `value-end`
 * is nullable, so its absence has to survive the trip through the attribute. */
const nullableNumberConverter: ComplexAttributeConverter<number | null> = {
  fromAttribute: (value: string | null): number | null =>
    value === null || value === '' ? null : Number(value),
};

/**
 * A slider: one real `<input type="range">` per thumb, painted with a track, the run it fills
 * and a thumb, in the field row that carries the label and the message regions.
 *
 * The thumb is a `::-webkit-slider-thumb` pseudo-element, so it is not a `part`: it is themed
 * through `--bk-slider-thumb-size` and paints `--bk-bg-surface`, and nothing can reach it with
 * `::part()`. The input itself is never hidden — hiding it would mean reimplementing the drag,
 * the keys and the announced value.
 *
 * @slot label - The label atom that names the slider.
 * @slot description - The help text, named by `aria-describedby` while it has content.
 * @slot error - The problem, announced from the status region; text in it is the slider's error.
 * @csspart label - The `<label>` row, carrying `data-state` while the slider is invalid or disabled.
 * @csspart track - The painted track, which carries the hover step and holds the inputs.
 * @csspart fill - The run the slider fills, from the start to the thumb, or between the two thumbs.
 * @csspart input - The native `<input type="range">` of the lower thumb.
 * @csspart input-end - The native `<input type="range">` of the upper thumb, rendered only while
 * `value-end` is set.
 * @csspart message - The container of the help and error regions.
 * @csspart description - The help region.
 * @csspart error - The error region.
 * @fires bk-input - The thumb moved and has not been released yet, with `detail.value` and
 * `detail.valueEnd`.
 * @fires bk-change - The value settled, with `detail.value` and `detail.valueEnd`.
 */
export class BkSlider extends FieldControlMixin(LitElement) {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = [
    formControlStyles,
    css`
      :host {
        --bk-slider-variant-thumb-size: var(--bk-space-4);
        --bk-slider-variant-track-height: var(--bk-space-1);
        --bk-slider-variant-radius: var(--bk-radius-lg);
        --bk-slider-variant-length: calc(var(--bk-space-4) * 15);
        --bk-slider-variant-halo-size: var(--bk-space-2);
      }

      .rail {
        position: relative;
        box-sizing: border-box;
        inline-size: 100%;
        block-size: var(--bk-slider-track-height, var(--bk-slider-variant-track-height));
        background: var(--bk-bg-surface-strong);
        border-radius: var(--bk-slider-radius, var(--bk-slider-variant-radius));
        transition: background-color var(--bk-transition);
      }

      :host([orientation='vertical']) .rail {
        inline-size: var(--bk-slider-length, var(--bk-slider-variant-length));
        writing-mode: vertical-rl;
        direction: rtl;
      }

      .rail[data-disabled] {
        cursor: not-allowed;
        opacity: var(--bk-opacity-disabled);
      }

      .lane {
        position: absolute;
        inset-block: 0;
        inset-inline: calc(var(--bk-slider-thumb-size, var(--bk-slider-variant-thumb-size)) / 2);
      }

      .fill {
        position: absolute;
        inset-block: 0;
        background: var(--bk-bg-accent);
        border-radius: var(--bk-slider-radius, var(--bk-slider-variant-radius));
      }

      :host(:not([orientation='vertical'])) .rail:not([data-two]) .fill {
        margin-inline-start: calc(
          var(--bk-slider-thumb-size, var(--bk-slider-variant-thumb-size)) / -2
        );
      }

      .thumb-input {
        position: absolute;
        inset-inline: 0;
        inset-block-start: calc(
          (
              var(--bk-slider-track-height, var(--bk-slider-variant-track-height)) - var(
                  --bk-slider-thumb-size,
                  var(--bk-slider-variant-thumb-size)
                )
            ) /
            2
        );
        inline-size: 100%;
        block-size: var(--bk-slider-thumb-size, var(--bk-slider-variant-thumb-size));
        margin: 0;
        padding: 0;
        appearance: none;
        background: none;
      }

      .rail[data-two] .thumb-input {
        pointer-events: none;
      }

      .thumb-input::-webkit-slider-runnable-track {
        inline-size: 100%;
        block-size: var(--bk-slider-thumb-size, var(--bk-slider-variant-thumb-size));
        appearance: none;
        background: none;
      }

      .thumb-input::-webkit-slider-thumb {
        box-sizing: border-box;
        inline-size: var(--bk-slider-thumb-size, var(--bk-slider-variant-thumb-size));
        block-size: var(--bk-slider-thumb-size, var(--bk-slider-variant-thumb-size));
        appearance: none;
        background: var(--bk-bg-accent);
        border: var(--bk-border-width) solid var(--bk-border-on-accent);
        border-radius: 100%;
        cursor: pointer;
      }

      .thumb-input:hover::-webkit-slider-thumb {
        outline: var(--bk-slider-halo-size, var(--bk-slider-variant-halo-size)) solid
          var(--bk-focus-halo);
      }

      .rail[data-two] .thumb-input::-webkit-slider-thumb {
        pointer-events: auto;
      }

      .thumb-input:focus-visible::-webkit-slider-thumb {
        outline: var(--bk-focus-ring-width) solid var(--bk-focus-ring);
        outline-offset: var(--bk-focus-ring-offset);
      }

      .thumb-input:disabled::-webkit-slider-thumb {
        cursor: not-allowed;
      }
    `,
  ];

  @property({ converter: numberConverter })
  override value = 0;

  @property({ attribute: 'value-end', converter: nullableNumberConverter })
  valueEnd: number | null = null;

  @property({ type: Number }) min = 0;

  @property({ type: Number }) max = 100;

  @property({ type: Number }) step = 1;

  @property({ type: String, reflect: true }) orientation: BkSliderOrientation = 'horizontal';

  @property({ type: String, attribute: 'value-text' }) valueText = '';

  @property({ type: String, attribute: 'value-text-end' }) valueTextEnd = '';

  override get formControlElement(): HTMLInputElement | undefined {
    return this.rangeInput ?? this.endInput ?? undefined;
  }

  /* The platform clamps a value outside `min`/`max` in the input that holds it, so the input
   * is the truth about what the control shows. With two thumbs this getter assembles the
   * `FormData` and appends both values under `name`, which is what makes them repeated keys
   * for `FormData.getAll`; a disabled field, or one with no name, contributes nothing. */
  override get submittedValue(): string | FormData | null {
    if (this.fieldDisabled) return null;

    const value = this.rangeInput?.value ?? String(this.value);
    if (this.valueEnd === null) return value;
    if (this.name === '') return value;

    const values = new FormData();
    values.append(this.name, value);
    values.append(this.name, this.endInput?.value ?? String(this.valueEnd));

    return values;
  }

  override render() {
    const end = this.valueEnd;
    const two = end !== null;

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
      </label>
      <div class="rail" part="track" ?data-disabled=${this.fieldDisabled} ?data-two=${two}>
        <div class="lane">
          <div class="fill" part="fill" style=${this.fillStyle}></div>
        </div>
        ${this.renderThumb('input', this.value, this.valueText, two ? 'Minimum' : null)}
        ${end === null ? nothing : this.renderThumb('input-end', end, this.valueTextEnd, 'Maximum')}
      </div>
      ${this.fieldParts.messages}
    `;
  }

  override formResetCallback(): void {
    super.formResetCallback();
    const value = this.getAttribute('value');
    const valueEnd = this.getAttribute('value-end');
    this.value = value === null ? 0 : Number(value);
    this.valueEnd = valueEnd === null || valueEnd === '' ? null : Number(valueEnd);
    this.syncThumbs();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (this.valueEnd === null || this.value <= this.valueEnd) return;
    /* The two thumbs clamp at the moment a value is written: the lower one stops at the
     * upper one, and nothing swaps the values the author set. */
    this.value = this.valueEnd;
  }

  private get rangeInput(): HTMLInputElement | null {
    return this.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]') ?? null;
  }

  private get endInput(): HTMLInputElement | null {
    return this.shadowRoot?.querySelector<HTMLInputElement>('[part="input-end"]') ?? null;
  }

  /* The run the fill paints, as the two ends of the row the thumbs travel: one thumb fills
   * from the start of the track, two thumbs fill between them. Logical insets because the
   * vertical rail carries the input's writing mode, so the browser decides which physical
   * end the value axis starts at. */
  private get fillStyle(): string {
    const span = this.max - this.min;
    const percentage = (value: number): number =>
      span === 0 ? 0 : ((value - this.min) / span) * 100;
    const clamp = (value: number): number => Math.min(100, Math.max(0, value));
    const end = clamp(percentage(this.valueEnd ?? this.value));
    const start = this.valueEnd === null ? 0 : clamp(percentage(this.value));

    return `inset-inline-start: ${start}%; inset-inline-end: ${100 - end}%;`;
  }

  private renderThumb(
    part: 'input' | 'input-end',
    value: number,
    valueText: string,
    label: string | null,
  ) {
    return html`
      <input
        part=${part}
        class="thumb-input"
        id=${part === 'input' ? this.controlId : nothing}
        type="range"
        min=${this.min}
        max=${this.max}
        step=${this.step}
        .value=${value}
        name=${this.name || nothing}
        ?disabled=${this.fieldDisabled}
        aria-orientation=${this.orientation}
        aria-valuetext=${valueText || nothing}
        aria-label=${label ?? nothing}
        aria-invalid=${this.fieldInvalid ? 'true' : nothing}
        aria-describedby=${this.fieldParts.describedBy(this.messageSources()) || nothing}
        @pointerdown=${this.handlePointerDown}
        @input=${this.handleInput}
        @change=${this.handleChange}
      />
    `;
  }

  private readonly handleInput = (event: Event): void => {
    this.readThumb(event);
    this.emitInput();
  };

  private readonly handleChange = (event: Event): void => {
    this.readThumb(event);
    this.collapsedDrag = null;
    this.emitChange();
  };

  /* A drag that ends where it began fires no change, so the next press clears the choice too. */
  private readonly handlePointerDown = (): void => {
    this.collapsedDrag = null;
  };

  /* A collapsed pair sits on one spot, where the upper input hit-tests over the lower one:
   * the side the pointer moved to picks the thumb it drags, and it keeps it until it lets go. */
  private collapsedDrag: 'value' | 'valueEnd' | null = null;

  private thumbOf(control: HTMLInputElement, next: number): 'value' | 'valueEnd' {
    if (this.collapsedDrag !== null) return this.collapsedDrag;
    if (control !== this.endInput || this.valueEnd === null) return 'value';
    if (this.value !== this.valueEnd || next === this.value) return 'valueEnd';
    return (this.collapsedDrag = next < this.value ? 'value' : 'valueEnd');
  }

  /* The input under the pointer is the source of truth while it is dragged; the properties
   * follow it, and the clamp puts the lower thumb back at the upper one's value. */
  private readThumb(event: Event): void {
    const control = event.target as HTMLInputElement;
    const next = Number(control.value);

    if (this.thumbOf(control, next) === 'valueEnd') {
      this.valueEnd = Math.max(next, this.value);
    } else {
      this.value = this.valueEnd === null ? next : Math.min(next, this.valueEnd);
    }

    this.syncThumbs();
  }

  private syncThumbs(): void {
    const thumbs: [HTMLInputElement | null, number | null][] = [
      [this.rangeInput, this.value],
      [this.endInput, this.valueEnd],
    ];

    for (const [control, value] of thumbs) {
      if (!control || value === null) continue;
      if (control.value !== String(value)) control.value = String(value);
    }
  }

  private detail(): { value: number; valueEnd: number | null } {
    return { value: this.value, valueEnd: this.valueEnd };
  }

  private emitInput(): void {
    this.dispatchEvent(
      new CustomEvent<{ value: number; valueEnd: number | null }>('bk-input', {
        detail: this.detail(),
        bubbles: true,
        composed: true,
      }),
    );
  }

  private emitChange(): void {
    this.dispatchEvent(
      new CustomEvent<{ value: number; valueEnd: number | null }>('bk-change', {
        detail: this.detail(),
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bk-slider': BkSlider;
  }
}
