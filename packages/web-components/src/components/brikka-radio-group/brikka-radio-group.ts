import { LitElement, css, html, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import type { BrikkaRadioGroupItem } from './brikka-radio-group-item.js';
import {
  FieldControlMixin,
  FieldRegionsController,
  formControlStyles,
  type FieldConstraint,
} from '../shared/form-control/index.js';

export type BrikkaRadioGroupOrientation = 'vertical' | 'horizontal';

/* The message a missing selection reports. It is English and fixed: a component
 * does not translate, and a consumer who needs another language writes it in the
 * error atom. */
const MISSING_VALUE_MESSAGE = 'Please select an option.';

/**
 * One value shared by several `brikka-radio-group-item` boxes: the group owns the selection, the tab
 * stop, the keyboard and the message regions.
 *
 * @slot - The `brikka-radio-group-item` elements of the group.
 * @slot label - The label atom that names the group.
 * @slot description - The consumer's own help atom, which is the group's description region.
 * @slot error - The consumer's own error atom, which is the group's live region.
 * @csspart label - The row holding the label slot and the `*`, hidden while the group is unnamed.
 * @csspart radios - The flow container of the radios, vertical or horizontal by `orientation`.
 * @csspart required - The `*` that marks a required group.
 */
export class BrikkaRadioGroup extends FieldControlMixin(LitElement) {
  static override styles = [
    formControlStyles,
    css`
      .radios {
        display: flex;
        flex-direction: column;
        gap: var(--brikka-space-2);
      }

      :host([orientation='horizontal']) .radios {
        flex-direction: row;
      }

      slot[name='description']::slotted(:not([data-empty])),
      slot[name='error']::slotted(:not([data-empty])) {
        margin-block-start: var(--brikka-space-1);
      }
    `,
  ];

  @property({ type: String, reflect: true })
  orientation: BrikkaRadioGroupOrientation = 'vertical';

  private readonly regions = new FieldRegionsController(this, {
    idPrefix: this.controlId,
    role: 'radiogroup',
    controlSelector: 'brikka-radio-group-item',
  });

  /* The radios whose `disabled` this group wrote, so that leaving `disabled`
   * gives back only what it took and a radio disabled on its own stays so. */
  private readonly disabledByGroup = new WeakSet<BrikkaRadioGroupItem>();

  private authoredRead = false;

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
      <div class="radios" part="radios">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
      <slot name="description" @slotchange=${this.handleSlotChange}></slot>
      <slot name="error" @slotchange=${this.handleSlotChange}></slot>
    `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.authoredRead) {
      this.authoredRead = true;
      this.value ||= this.authoredValue();
    }
    this.addEventListener('brikka-change', this.handleRadioChange);
    this.addEventListener('keydown', this.handleKeyDown);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('brikka-change', this.handleRadioChange);
    this.removeEventListener('keydown', this.handleKeyDown);
    super.disconnectedCallback();
  }

  /* The radios are not form controls: the group is the one value, so a disabled
   * group submits nothing even while it still remembers the selection. */
  override get submittedValue(): string | null {
    if (this.fieldDisabled) return null;
    return this.selected(this.radios())?.value ?? null;
  }

  /* TypeScript cannot see a protected member through the mixin's constructor
   * intersection, so the override of the mixin's getter carries no modifier. */
  protected get fieldConstraint(): FieldConstraint | undefined {
    if (!this.required || this.submittedValue !== null) return undefined;
    return {
      flags: { valueMissing: true },
      message: this.fieldError || MISSING_VALUE_MESSAGE,
    };
  }

  override updated(changed: PropertyValues): void {
    if (this.fieldInvalid) this.setAttribute('aria-invalid', 'true');
    else this.removeAttribute('aria-invalid');
    this.syncRadios();
    super.updated(changed);
  }

  override formResetCallback(): void {
    super.formResetCallback();
    this.value = this.authoredValue();
    this.requestUpdate();
  }

  /* A radio inside another group belongs to that group, not to this one. */
  private radios(): BrikkaRadioGroupItem[] {
    return Array.from(
      this.querySelectorAll<BrikkaRadioGroupItem>('brikka-radio-group-item'),
    ).filter((radio) => radio.parentElement?.closest('brikka-radio-group') === this);
  }

  /* What the markup declared: the radio carrying `checked`. The group writes the
   * property, never the attribute, so the authored state stays readable. */
  private authoredValue(): string {
    const radio = this.radios().find((one) => one.hasAttribute('checked'));
    return radio?.getAttribute('value') ?? '';
  }

  private selected(radios: BrikkaRadioGroupItem[]): BrikkaRadioGroupItem | undefined {
    if (!this.value) return undefined;
    return radios.find((radio) => radio.value === this.value);
  }

  private syncRadios(): void {
    const radios = this.radios();
    this.syncDisabled(radios);

    const selected = this.selected(radios);
    const enabled = radios.filter((radio) => !radio.disabled);
    const tabStop =
      selected && !selected.disabled ? selected : enabled.length > 0 ? enabled[0] : undefined;

    for (const radio of radios) {
      radio.checked = radio === selected;
      radio.tabStop = radio === tabStop;
    }
  }

  private syncDisabled(radios: BrikkaRadioGroupItem[]): void {
    for (const radio of radios) {
      if (this.fieldDisabled) {
        if (radio.disabled) continue;
        radio.disabled = true;
        this.disabledByGroup.add(radio);
      } else if (this.disabledByGroup.delete(radio)) {
        radio.disabled = false;
      }
    }
  }

  /* The radio reports an activation; the group is the one writer of the
   * selection, so the value lands here and every radio is written from it. */
  private readonly handleRadioChange = (event: Event): void => {
    const radio = event.target as BrikkaRadioGroupItem;
    if (radio.disabled || !this.radios().includes(radio)) return;
    this.value = radio.value;
    this.syncRadios();
  };

  /* Both axes always navigate, so a user's guess can never trap them. The
   * radios' key events are composed, so they arrive here from the inner input. */
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const owned = this.radios();
    if (!owned.includes(event.target as BrikkaRadioGroupItem)) return;
    const enabled = owned.filter((radio) => !radio.disabled);
    if (enabled.length === 0) return;

    const from = enabled.indexOf(event.target as BrikkaRadioGroupItem);
    const last = enabled.length - 1;
    let next: BrikkaRadioGroupItem | undefined;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = enabled[from === last ? 0 : from + 1];
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        next = enabled[from <= 0 ? last : from - 1];
        break;
      case 'Home':
        next = enabled[0];
        break;
      case 'End':
        next = enabled[last];
        break;
      default:
        return;
    }

    event.preventDefault();
    this.select(next);
  };

  private select(radio: BrikkaRadioGroupItem): void {
    this.value = radio.value;
    this.syncRadios();
    radio.focus();
  }

  private readonly handleSlotChange = (event: Event): void => {
    this.regions.handleSlotChange();
    if ((event.target as HTMLSlotElement).name === 'label') this.fieldParts.handleLabelSlot(event);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'brikka-radio-group': BrikkaRadioGroup;
  }
}
