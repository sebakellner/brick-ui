import { LitElement, css, html, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import type { BkRadioGroupItem } from './bk-radio-group-item.js';
import {
  FieldControlMixin,
  FieldRegionsController,
  formControlStyles,
  type FieldConstraint,
} from '../shared/form-control/index.js';

export type BkRadioGroupOrientation = 'vertical' | 'horizontal';

/* The message a missing selection reports. It is English and fixed: a component
 * does not translate, and a consumer who needs another language writes it in the
 * error atom. */
const MISSING_VALUE_MESSAGE = 'Please select an option.';

export class BkRadioGroup extends FieldControlMixin(LitElement) {
  static override styles = [
    formControlStyles,
    css`
      .radios {
        display: flex;
        flex-direction: column;
        gap: var(--bk-space-2);
      }

      :host([orientation='horizontal']) .radios {
        flex-direction: row;
      }

      slot[name='description']::slotted(:not([data-empty])),
      slot[name='error']::slotted(:not([data-empty])) {
        margin-block-start: var(--bk-space-1);
      }
    `,
  ];

  @property({ type: String, reflect: true })
  orientation: BkRadioGroupOrientation = 'vertical';

  private readonly regions = new FieldRegionsController(this, {
    idPrefix: this.controlId,
    role: 'radiogroup',
    controlSelector: 'bk-radio-group-item',
  });

  /* The radios whose `disabled` this group wrote, so that leaving `disabled`
   * gives back only what it took and a radio disabled on its own stays so. */
  private readonly disabledByGroup = new WeakSet<BkRadioGroupItem>();

  private authoredRead = false;

  override render() {
    return html`
      <div class="label" part="label" ?hidden=${!this.fieldParts.labelled}>
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
    this.addEventListener('bk-change', this.handleRadioChange);
    this.addEventListener('keydown', this.handleKeyDown);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('bk-change', this.handleRadioChange);
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
  private radios(): BkRadioGroupItem[] {
    return Array.from(this.querySelectorAll<BkRadioGroupItem>('bk-radio-group-item')).filter(
      (radio) => radio.parentElement?.closest('bk-radio-group') === this,
    );
  }

  /* What the markup declared: the radio carrying `checked`. The group writes the
   * property, never the attribute, so the authored state stays readable. */
  private authoredValue(): string {
    const radio = this.radios().find((one) => one.hasAttribute('checked'));
    return radio?.getAttribute('value') ?? '';
  }

  private selected(radios: BkRadioGroupItem[]): BkRadioGroupItem | undefined {
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

  private syncDisabled(radios: BkRadioGroupItem[]): void {
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
    const radio = event.target as BkRadioGroupItem;
    if (radio.disabled || !this.radios().includes(radio)) return;
    this.value = radio.value;
    this.syncRadios();
  };

  /* Both axes always navigate, so a user's guess can never trap them. The
   * radios' key events are composed, so they arrive here from the inner input. */
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const owned = this.radios();
    if (!owned.includes(event.target as BkRadioGroupItem)) return;
    const enabled = owned.filter((radio) => !radio.disabled);
    if (enabled.length === 0) return;

    const from = enabled.indexOf(event.target as BkRadioGroupItem);
    const last = enabled.length - 1;
    let next: BkRadioGroupItem | undefined;

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

  private select(radio: BkRadioGroupItem): void {
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
    'bk-radio-group': BkRadioGroup;
  }
}
