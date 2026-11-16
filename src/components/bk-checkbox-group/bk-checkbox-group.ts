import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import {
  FieldPartsController,
  FieldRegionsController,
  formControlStyles,
} from '../shared/form-control/index.js';

export type BkCheckboxGroupOrientation = 'vertical' | 'horizontal';

let instanceCount = 0;
const nextInstanceId = () => `bk-checkbox-group-${++instanceCount}`;

export class BkCheckboxGroup extends LitElement {
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

  private readonly groupId = nextInstanceId();

  private readonly fieldParts = new FieldPartsController(this, this.groupId);

  private readonly regions = new FieldRegionsController(this, {
    idPrefix: this.groupId,
    role: 'group',
    controlSelector: 'bk-checkbox, bk-input',
  });

  get fieldInvalid(): boolean {
    return this.invalid;
  }

  override render() {
    return html`
      <div class="label" part="label" ?hidden=${!this.fieldParts.labelled}>
        <slot name="label" @slotchange=${this.handleSlotChange}></slot>
      </div>
      <div class="boxes" part="boxes">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
      <slot name="description" @slotchange=${this.handleSlotChange}></slot>
      <slot name="error" @slotchange=${this.handleSlotChange}></slot>
    `;
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
