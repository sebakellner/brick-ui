import { LitElement, css, html, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import type { BkCheckbox } from '../bk-checkbox/bk-checkbox.js';
import {
  FieldControlMixin,
  FieldRegionsController,
  formControlStyles,
  type FieldConstraint,
} from '../shared/form-control/index.js';

export type BkCheckboxGroupOrientation = 'vertical' | 'horizontal';

/* The message a group with nothing checked reports. It is English and fixed: a
 * component does not translate, and a consumer who needs another language writes
 * it in the error atom. */
const MISSING_VALUE_MESSAGE = 'Please select at least one option.';

export class BkCheckboxGroup extends FieldControlMixin(LitElement) {
  static override styles = [
    formControlStyles,
    css`
      .boxes {
        display: flex;
        flex-direction: column;
        gap: var(--bk-space-2);
      }

      :host([orientation='horizontal']) .boxes {
        flex-direction: row;
      }

      slot[name='description']::slotted(:not([data-empty])),
      slot[name='error']::slotted(:not([data-empty])) {
        margin-block-start: var(--bk-space-1);
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) invalid = false;

  @property({ type: String, reflect: true })
  orientation: BkCheckboxGroupOrientation = 'vertical';

  private readonly regions = new FieldRegionsController(this, {
    idPrefix: this.controlId,
    role: 'group',
    controlSelector: 'bk-checkbox, bk-input',
  });

  /* The boxes whose `disabled` this group wrote, so that leaving `disabled`
   * gives back only what it took and a box disabled on its own stays so. */
  private readonly disabledByGroup = new WeakSet<BkCheckbox>();

  /* `invalid` is the consumer's own statement and survives beside what the field
   * derives from its error; either one paints the group's label. */
  override get fieldInvalid(): boolean {
    return this.invalid || super.fieldInvalid;
  }

  /* The boxes submit their own values, so the group is a constraint and never a
   * payload entry: `null` adds no row to the form data. */
  override get submittedValue(): null {
    return null;
  }

  /* TypeScript cannot see a protected member through the mixin's constructor
   * intersection, so the override of the mixin's getter carries no modifier. */
  protected get fieldConstraint(): FieldConstraint | undefined {
    if (!this.required || this.boxes().some((box) => box.checked)) return undefined;
    return {
      flags: { valueMissing: true },
      message: this.fieldError || MISSING_VALUE_MESSAGE,
    };
  }

  override render() {
    return html`
      <div
        class="label"
        part="label"
        ?data-disabled=${this.fieldDisabled}
        ?hidden=${!this.fieldParts.labelled}
      >
        <slot name="label" @slotchange=${this.handleSlotChange}></slot>
        ${this.fieldParts.glyph}
      </div>
      <div class="boxes" part="boxes">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
      <slot name="description" @slotchange=${this.handleSlotChange}></slot>
      <slot name="error" @slotchange=${this.handleSlotChange}></slot>
    `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('bk-change', this.handleBoxChange);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('bk-change', this.handleBoxChange);
    super.disconnectedCallback();
  }

  override updated(changed: PropertyValues): void {
    this.syncBoxes();
    super.updated(changed);
  }

  /* The constraint is read from the boxes' own state, so the event is only the
   * reason to re-evaluate: `syncFormValue` runs on every update, and this is
   * what asks for one. */
  private readonly handleBoxChange = (event: Event): void => {
    if (!this.boxes().includes(event.target as BkCheckbox)) return;
    this.requestUpdate();
  };

  /* A box inside another group belongs to that group, not to this one. */
  private boxes(): BkCheckbox[] {
    return Array.from(this.querySelectorAll<BkCheckbox>('bk-checkbox')).filter(
      (box) => box.parentElement?.closest('bk-checkbox-group') === this,
    );
  }

  private syncBoxes(): void {
    for (const box of this.boxes()) {
      if (this.fieldDisabled) {
        if (box.disabled) continue;
        box.disabled = true;
        this.disabledByGroup.add(box);
      } else if (this.disabledByGroup.delete(box)) {
        box.disabled = false;
      }
    }
  }

  private readonly handleSlotChange = (event: Event): void => {
    this.regions.handleSlotChange();
    if ((event.target as HTMLSlotElement).name === 'label') this.fieldParts.handleLabelSlot(event);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'bk-checkbox-group': BkCheckboxGroup;
  }
}
