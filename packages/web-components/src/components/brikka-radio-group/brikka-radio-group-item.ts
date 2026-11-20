import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { SlottedTextController, formControlStyles } from '../shared/form-control/index.js';

let instanceCount = 0;
const nextInstanceId = () => `brikka-radio-group-item-${++instanceCount}`;

/* Private because a radio alone is not a component: ADR 0012. */
/**
 * One radio of a `brikka-radio-group`: the native `<input type="radio">` behind a painted circle, with
 * the option's own label and hint. It is the group's markup, not a component to import.
 *
 * @slot label - The label atom that names the option.
 * @slot description - The hint of this option, which is its accessible description.
 * @csspart label - The `<label>` row: the hidden input, the box and the label.
 * @csspart input - The native `<input type="radio">`, visually hidden and still focusable.
 * @csspart box - The painted circle, with the dot drawn in it while it is selected.
 * @csspart description - The region of the option's hint, hidden while it holds no text.
 * @fires brikka-change - The option was activated; the group is what keeps the selection.
 */
export class BrikkaRadioGroupItem extends LitElement {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = [
    formControlStyles,
    css`
      :host {
        --brikka-radio-group-item-variant-size: var(--brikka-space-4);
        --brikka-radio-group-item-variant-radius: var(--brikka-radius-lg);
      }

      .field {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--brikka-space-2);
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
        inline-size: var(
          --brikka-radio-group-item-size,
          var(--brikka-radio-group-item-variant-size)
        );
        block-size: var(
          --brikka-radio-group-item-size,
          var(--brikka-radio-group-item-variant-size)
        );
        background: var(--brikka-bg-surface);
        border: var(--brikka-border-width) solid var(--brikka-border-default);
        border-radius: var(
          --brikka-radio-group-item-radius,
          var(--brikka-radio-group-item-variant-radius)
        );
        transition:
          border-color var(--brikka-transition),
          background-color var(--brikka-transition);
      }

      .field:not([data-disabled]):hover .box {
        border-color: var(--brikka-border-strong);
      }

      .native:focus-visible + .box {
        outline: var(--brikka-focus-ring-width) solid var(--brikka-focus-ring);
        outline-offset: var(--brikka-focus-ring-offset);
      }

      .native:checked + .box {
        background: var(--brikka-bg-accent);
      }

      .native[aria-disabled='true'] + .box {
        cursor: not-allowed;
      }

      .box::after {
        content: '';
        box-sizing: border-box;
        visibility: hidden;
        inline-size: 50%;
        block-size: 50%;
        color: var(--brikka-text-on-accent);
        background: currentColor;
        border-radius: 100%;
      }

      .native:checked + .box::after {
        visibility: visible;
      }

      .message {
        margin-inline-start: calc(
          var(--brikka-radio-group-item-size, var(--brikka-radio-group-item-variant-size)) +
            var(--brikka-space-2)
        );
      }
    `,
  ];

  @property({ type: Boolean }) checked = false;

  @property({ type: Boolean, reflect: true }) disabled = false;

  @property({ type: String }) value = '';

  @property({ attribute: false }) tabStop = false;

  private readonly controlId = nextInstanceId();

  private readonly text = new SlottedTextController(this);

  private hasDescription = false;

  /* The item's atoms arrive in its own light DOM, so that is what it hands
   * over: an atom is the item's before it carries a slot, and the item is the
   * one that gives it one. */
  override connectedCallback(): void {
    super.connectedCallback();
    this.text.watchNodes([this]);
  }

  override render() {
    return html`
      <label class="field label" part="label" for=${this.controlId} ?data-disabled=${this.disabled}>
        <input
          part="input"
          class="native"
          id=${this.controlId}
          type="radio"
          .checked=${this.checked}
          tabindex=${this.tabStop ? '0' : '-1'}
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-describedby=${this.hasDescription ? `${this.controlId}-description` : nothing}
          @click=${this.handleClick}
          @change=${this.handleChange}
        />
        <span part="box" class="box" aria-hidden="true"></span>
        <slot name="label"></slot>
      </label>
      <div
        class="message"
        part="description"
        id=${`${this.controlId}-description`}
        ?hidden=${!this.hasDescription}
      >
        <slot name="description" @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }

  /* The atoms are routed before the render that reads them, so a hint that
   * arrived or was emptied is the region's state in one pass. */
  protected override willUpdate(): void {
    this.syncDescription();
  }

  protected override updated(): void {
    this.syncChecked();
  }

  /* The group is the only writer of the selection: an activation the native
   * control already performed is undone on the next update. */
  private syncChecked(): void {
    const control = this.control;
    if (!control || control.checked === this.checked) return;
    control.checked = this.checked;
  }

  private get control(): HTMLInputElement | undefined {
    return this.shadowRoot?.querySelector('input') ?? undefined;
  }

  /* The hint of an option is the option's: the consumer writes the atom and the
   * item assigns the slot, because the surrounding group must not adopt an
   * option's hint as a message about the set. It takes no space while it holds
   * no text, so a column of options stays tight. */
  private syncDescription(): void {
    for (const atom of this.descriptions()) {
      if (atom.slot !== 'description') atom.slot = 'description';
    }
    this.hasDescription = this.text.slotHasText('description');
  }

  /* Routing is the item's own promise, so a consumer who moves an atom off the
   * description slot is answered by the next update rather than ignored. */
  private readonly handleSlotChange = (): void => {
    this.requestUpdate();
  };

  /* An atom of a nested item is that item's, the way the group leaves the atoms
   * of its radios alone. */
  private descriptions(): HTMLElement[] {
    return Array.from(this.querySelectorAll<HTMLElement>('brikka-field-description')).filter(
      (atom) => atom.parentElement?.closest('brikka-radio-group-item, brikka-radio-group') === this,
    );
  }

  private readonly handleClick = (event: MouseEvent): void => {
    if (this.disabled) event.preventDefault();
  };

  private readonly handleChange = (): void => {
    if (this.disabled) return;

    this.dispatchEvent(
      new CustomEvent<{ checked: boolean }>('brikka-change', {
        detail: { checked: true },
        bubbles: true,
        composed: true,
      }),
    );
    this.requestUpdate();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'brikka-radio-group-item': BrikkaRadioGroupItem;
  }
}
