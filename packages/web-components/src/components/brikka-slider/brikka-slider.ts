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

export type BrikkaSliderOrientation = 'horizontal' | 'vertical';

export type BrikkaSliderTooltip = 'none' | 'hover' | 'always';

const TOOLTIP_MODES: readonly string[] = ['none', 'hover', 'always'];

const numberConverter: ComplexAttributeConverter<number> = {
  fromAttribute: (value: string | null): number => (value === null ? 0 : Number(value)),
};

/* A missing attribute is a missing upper thumb, not a thumb stuck at zero: `value-end`
 * is nullable, so its absence has to survive the trip through the attribute. */
const nullableNumberConverter: ComplexAttributeConverter<number | null> = {
  fromAttribute: (value: string | null): number | null =>
    value === null || value === '' ? null : Number(value),
};

/* A mode the element cannot paint is not a mode: anything outside the three reads as
 * `none`, which is the value the attribute starts at. */
const tooltipConverter: ComplexAttributeConverter<BrikkaSliderTooltip> = {
  fromAttribute: (value: string | null): BrikkaSliderTooltip =>
    TOOLTIP_MODES.includes(value ?? '') ? (value as BrikkaSliderTooltip) : 'none',
};

/**
 * A slider: one real `<input type="range">` per thumb, painted with a track, the run it fills
 * and a thumb, in the field row that carries the label and the message regions.
 *
 * The thumb is a `::-webkit-slider-thumb` pseudo-element, so it is not a `part`: it is themed
 * through `--brikka-slider-thumb-size` and paints `--brikka-bg-surface`, and nothing can reach it with
 * `::part()`. The input itself is never hidden — hiding it would mean reimplementing the drag,
 * the keys and the announced value.
 *
 * @slot label - The label atom that names the slider.
 * @slot description - The help text, named by `aria-describedby` while it has content.
 * @slot error - The problem, announced from the status region; text in it is the slider's error.
 * @csspart label - The `<label>` row, carrying `data-state` while the slider is invalid or disabled.
 * @csspart track - The painted track, which carries the hover step and holds the inputs.
 * @csspart fill - The run the slider fills, from the start to the thumb, or between the two thumbs.
 * @csspart ticks - The layer the tick marks are drawn in, `aria-hidden` and rendered only while
 * `ticks` is set.
 * @csspart tick - One tick on the rail, repeated once per step.
 * @csspart tooltip - The value readout, `aria-hidden` and rendered only while `tooltip` is not
 * `none`.
 * @csspart input - The native `<input type="range">` of the lower thumb.
 * @csspart input-end - The native `<input type="range">` of the upper thumb, rendered only while
 * `value-end` is set.
 * @csspart message - The container of the help and error regions.
 * @csspart description - The help region.
 * @csspart error - The error region.
 * @fires brikka-input - The thumb moved and has not been released yet, with `detail.value` and
 * `detail.valueEnd`.
 * @fires brikka-change - The value settled, with `detail.value` and `detail.valueEnd`.
 */
export class BrikkaSlider extends FieldControlMixin(LitElement) {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = [
    formControlStyles,
    css`
      :host {
        --brikka-slider-variant-thumb-size: var(--brikka-space-4);
        --brikka-slider-variant-track-height: var(--brikka-space-1);
        --brikka-slider-variant-radius: var(--brikka-radius-lg);
        --brikka-slider-variant-length: calc(var(--brikka-space-4) * 15);
        --brikka-slider-variant-halo-size: var(--brikka-space-2);
        --brikka-slider-variant-readout-gap: var(--brikka-space-2);
        --brikka-slider-variant-tick-size: calc(var(--brikka-border-width) * 2);
      }

      .rail {
        position: relative;
        box-sizing: border-box;
        inline-size: 100%;
        block-size: var(--brikka-slider-track-height, var(--brikka-slider-variant-track-height));
        background: var(--brikka-bg-surface-strong);
        border-radius: var(--brikka-slider-radius, var(--brikka-slider-variant-radius));
        transition: background-color var(--brikka-transition);
      }

      :host([orientation='vertical']) .rail {
        inline-size: var(--brikka-slider-length, var(--brikka-slider-variant-length));
        writing-mode: vertical-rl;
        direction: rtl;
      }

      .rail[data-disabled] {
        cursor: not-allowed;
        opacity: var(--brikka-opacity-disabled);
      }

      .lane {
        position: absolute;
        inset-block: 0;
        inset-inline: calc(
          var(--brikka-slider-thumb-size, var(--brikka-slider-variant-thumb-size)) / 2
        );
      }

      .fill {
        position: absolute;
        inset-block: 0;
        background: var(--brikka-bg-accent);
        border-radius: var(--brikka-slider-radius, var(--brikka-slider-variant-radius));
      }

      .ticks {
        position: absolute;
        inset: 0;
      }

      .tick {
        position: absolute;
        inline-size: var(--brikka-slider-tick-size, var(--brikka-slider-variant-tick-size));
        block-size: 100%;
        inset-block-start: 0;
        background: var(--brikka-bg-surface);
        border-radius: var(--brikka-border-width);
      }

      .readout-lane {
        position: absolute;
        inset-block: 0;
        inset-inline: calc(
          var(--brikka-slider-thumb-size, var(--brikka-slider-variant-thumb-size)) / 2
        );
        pointer-events: none;
      }

      .readout {
        position: absolute;
        box-sizing: border-box;
        padding-inline: var(--brikka-space-1);
        padding-block: calc(var(--brikka-space-1) / 2);
        font-family: var(--brikka-font-sans);
        font-size: var(--brikka-font-size-sm);
        line-height: var(--brikka-line-height-md);
        white-space: nowrap;
        writing-mode: horizontal-tb;
        direction: ltr;
        color: var(--brikka-text-inverse);
        background: var(--brikka-bg-inverse);
        border-radius: var(--brikka-radius-sm);
        opacity: 0;
        transition: opacity var(--brikka-transition);
      }

      .readout::after {
        content: '';
        position: absolute;
        inline-size: var(--brikka-space-1);
        block-size: var(--brikka-space-1);
        background: var(--brikka-bg-inverse);
        transform: rotate(45deg);
      }

      :host(:not([orientation='vertical'])) .readout {
        margin-block-end: calc(
          var(--brikka-slider-readout-gap, var(--brikka-slider-variant-readout-gap)) +
            var(--brikka-space-1) / 2
        );
      }

      :host(:not([orientation='vertical'])) .readout::after {
        inset-block-end: calc(var(--brikka-space-1) / -2);
        inset-inline-start: 50%;
        margin-inline-start: calc(var(--brikka-space-1) / -2);
      }

      :host([orientation='vertical']) .readout {
        margin-inline-end: calc(
          var(--brikka-slider-readout-gap, var(--brikka-slider-variant-readout-gap)) +
            var(--brikka-space-1) / 2
        );
      }

      :host([orientation='vertical']) .readout::after {
        inset-inline-end: calc(var(--brikka-space-1) / -2);
        inset-block-start: 50%;
        margin-block-start: calc(var(--brikka-space-1) / -2);
      }

      :host([tooltip='always']) .readout {
        opacity: 1;
      }

      :host([tooltip='hover']) .thumb-input[data-knob] ~ .readout-lane .readout,
      :host([tooltip='hover']) .thumb-input:focus-visible ~ .readout-lane .readout,
      :host([tooltip='hover']) .thumb-input:active ~ .readout-lane .readout {
        opacity: 1;
      }

      .thumb-input {
        position: absolute;
        inset-inline: 0;
        inset-block-start: calc(
          (
              var(--brikka-slider-track-height, var(--brikka-slider-variant-track-height)) - var(
                  --brikka-slider-thumb-size,
                  var(--brikka-slider-variant-thumb-size)
                )
            ) /
            2
        );
        inline-size: 100%;
        block-size: var(--brikka-slider-thumb-size, var(--brikka-slider-variant-thumb-size));
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
        block-size: var(--brikka-slider-thumb-size, var(--brikka-slider-variant-thumb-size));
        appearance: none;
        background: none;
      }

      .thumb-input::-webkit-slider-thumb {
        box-sizing: border-box;
        inline-size: var(--brikka-slider-thumb-size, var(--brikka-slider-variant-thumb-size));
        block-size: var(--brikka-slider-thumb-size, var(--brikka-slider-variant-thumb-size));
        appearance: none;
        background: var(--brikka-bg-accent);
        border: var(--brikka-border-width) solid var(--brikka-border-on-accent);
        border-radius: 100%;
        cursor: pointer;
      }

      .thumb-input[data-knob]::-webkit-slider-thumb {
        outline: var(--brikka-slider-halo-size, var(--brikka-slider-variant-halo-size)) solid
          var(--brikka-focus-halo);
      }

      .rail[data-two] .thumb-input::-webkit-slider-thumb {
        pointer-events: auto;
      }

      .thumb-input:focus-visible::-webkit-slider-thumb {
        outline: var(--brikka-focus-ring-width) solid var(--brikka-focus-ring);
        outline-offset: var(--brikka-focus-ring-offset);
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

  @property({ type: String, reflect: true }) orientation: BrikkaSliderOrientation = 'horizontal';

  @property({ type: String, attribute: 'value-text' }) valueText = '';

  @property({ type: String, attribute: 'value-text-end' }) valueTextEnd = '';

  @property({ type: Boolean, reflect: true }) ticks = false;

  @property({ type: String, reflect: true, converter: tooltipConverter })
  tooltip: BrikkaSliderTooltip = 'none';

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
      <div
        class="rail"
        part="track"
        ?data-disabled=${this.fieldDisabled}
        ?data-two=${two}
        @pointermove=${this.handlePointerMove}
        @pointerleave=${this.handlePointerLeave}
      >
        <div class="lane">
          <div class="fill" part="fill" style=${this.fillStyle}></div>
          ${this.renderTicks()}
        </div>
        ${this.renderThumb('input', this.value, this.valueText, two ? 'Minimum' : null)}
        ${end === null ? nothing : this.renderThumb('input-end', end, this.valueTextEnd, 'Maximum')}
        ${this.renderReadout()}
      </div>
      ${this.fieldParts.messages}
    `;
  }

  /* The attribute is the reflected property, so a mode the element cannot paint has no
   * business staying in it: an unknown value is written back as `none` instead. The
   * property alone does not catch this, because an attribute that maps to the value the
   * property already holds changes nothing for the reflection to write. */
  override attributeChangedCallback(
    name: string,
    previous: string | null,
    value: string | null,
  ): void {
    super.attributeChangedCallback(name, previous, value);
    if (name === 'tooltip' && value !== this.tooltip) this.setAttribute('tooltip', this.tooltip);
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

  private knobPointer: 'input' | 'input-end' | null = null;

  private get rail(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part="track"]') ?? null;
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
    const end = this.percentageOf(this.valueEnd ?? this.value);

    if (this.valueEnd === null) {
      /* One thumb: the run starts at the rail's minimum edge and ends under the centre of
       * the knob. The lane is inset by half a knob so its ends follow the centre line, so
       * the start pulls back by that half, and the size carries it: the inline axis is the
       * minimum-to-maximum axis in both orientations, which is what keeps this axis-free. */
      return `inset-inline-start: calc(var(--brikka-slider-thumb-size, var(--brikka-slider-variant-thumb-size)) / -2); inline-size: calc(${end}% + var(--brikka-slider-thumb-size, var(--brikka-slider-variant-thumb-size)) / 2); inset-inline-end: auto;`;
    }

    const start = this.percentageOf(this.value);
    return `inset-inline-start: ${start}%; inset-inline-end: ${100 - end}%;`;
  }

  /* One mark per step, which is the count the ticks API models: `(max - min) / step`.
   * A step that cannot carry a mark — zero, negative, or a range too narrow for it —
   * draws none, and a range that does not divide by it marks the values the browser
   * snaps to, the last of them one step short of the maximum. Each mark is inset by half
   * its own size, because the logical start edge of a box cannot be its centre. */
  private get tickPercentages(): string[] {
    const span = this.max - this.min;
    const count = Math.floor(span / this.step);
    if (!Number.isFinite(count) || count < 1) return [];

    return Array.from(
      { length: count },
      (_, index) =>
        `calc(${(index * this.step * 100) / span}% - var(--brikka-slider-tick-size, var(--brikka-slider-variant-tick-size)) / 2)`,
    );
  }

  /* The readout follows the knob along the run and sits on the side of the rail that has
   * room: above it in the horizontal run, and beside it when the rail is vertical, because
   * the rail's block axis is horizontal there. Both axes are physical in the inline style
   * because the bubble writes horizontally, while its percentages are the lane's. */
  private get readoutStyle(): string {
    const percentage = this.percentageOf(this.value);

    return this.orientation === 'vertical'
      ? `top: ${100 - percentage}%; right: 100%; translate: 0 -50%;`
      : `left: ${percentage}%; bottom: 100%; translate: -50% 0;`;
  }

  private percentageOf(value: number): number {
    const span = this.max - this.min;
    if (span === 0) return 0;

    const percentage = ((value - this.min) / span) * 100;
    return Math.min(100, Math.max(0, percentage));
  }

  private renderTicks() {
    if (!this.ticks) return nothing;

    return html`
      <div class="ticks" part="ticks" aria-hidden="true">
        ${this.tickPercentages.map(
          (inlineStart) =>
            html`<span
              class="tick"
              part="tick"
              style=${`inset-inline-start: ${inlineStart};`}
            ></span>`,
        )}
      </div>
    `;
  }

  private renderReadout() {
    if (this.tooltip === 'none') return nothing;

    return html`
      <div class="readout-lane">
        <div class="readout" part="tooltip" aria-hidden="true" style=${this.readoutStyle}>
          ${this.valueText || this.value}
        </div>
      </div>
    `;
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
        ?data-knob=${this.knobPointer === part}
        @pointerdown=${this.handlePointerDown}
        @input=${this.handleInput}
        @change=${this.handleChange}
      />
    `;
  }

  /* The knob is a pseudo-element, so it has no hover of its own: the pointer over the
   * track is over the whole input. The rail therefore answers the question the paint asks —
   * is the pointer within half a knob of a knob's centre — and each input carries the
   * answer, which is what the halo and the readout key on. */
  private readonly handlePointerMove = (event: PointerEvent): void => {
    const rail = this.rail;
    const control = this.rangeInput;
    if (!rail || !control) return;

    const box = rail.getBoundingClientRect();
    const knob = Math.min(control.offsetWidth, control.offsetHeight);
    const vertical = this.orientation === 'vertical';

    const over = (value: number): boolean => {
      const percentage = this.percentageOf(value) / 100;
      if (vertical) {
        const centre = box.bottom - knob / 2 - percentage * (box.height - knob);
        return Math.abs(event.clientY - centre) <= knob / 2;
      }
      const centre = box.left + knob / 2 + percentage * (box.width - knob);
      return Math.abs(event.clientX - centre) <= knob / 2;
    };

    const next: 'input' | 'input-end' | null = over(this.value)
      ? 'input'
      : this.valueEnd !== null && over(this.valueEnd)
        ? 'input-end'
        : null;

    if (next === this.knobPointer) return;
    this.knobPointer = next;
    this.requestUpdate();
  };

  private readonly handlePointerLeave = (): void => {
    if (this.knobPointer === null) return;
    this.knobPointer = null;
    this.requestUpdate();
  };

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
      new CustomEvent<{ value: number; valueEnd: number | null }>('brikka-input', {
        detail: this.detail(),
        bubbles: true,
        composed: true,
      }),
    );
  }

  private emitChange(): void {
    this.dispatchEvent(
      new CustomEvent<{ value: number; valueEnd: number | null }>('brikka-change', {
        detail: this.detail(),
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'brikka-slider': BrikkaSlider;
  }
}
