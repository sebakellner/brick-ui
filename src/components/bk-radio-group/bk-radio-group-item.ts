import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { formControlStyles } from '../shared/form-control/index.js';

let instanceCount = 0;
const nextInstanceId = () => `bk-radio-group-item-${++instanceCount}`;

/* The box of one option, and a private part of the group: it is a custom element
 * so that each box owns a shadow root and its own slotted label atom, and it is
 * not exported, because a radio that only works inside its group is not a
 * component a consumer imports. */
export class BkRadioGroupItem extends LitElement {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = [
    formControlStyles,
    css`
      :host {
        --bk-radio-group-item-variant-size: var(--bk-space-4);
        --bk-radio-group-item-variant-radius: var(--bk-radius-lg);
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
        inline-size: var(--bk-radio-group-item-size, var(--bk-radio-group-item-variant-size));
        block-size: var(--bk-radio-group-item-size, var(--bk-radio-group-item-variant-size));
        background: var(--bk-bg-surface);
        border: var(--bk-border-width) solid var(--bk-border-default);
        border-radius: var(--bk-radio-group-item-radius, var(--bk-radio-group-item-variant-radius));
        transition:
          border-color var(--bk-transition),
          background-color var(--bk-transition);
      }

      .field:not([data-disabled]):hover .box {
        border-color: var(--bk-border-strong);
      }

      .native:focus-visible + .box {
        outline: var(--bk-focus-ring-width) solid var(--bk-focus-ring);
        outline-offset: var(--bk-focus-ring-offset);
      }

      .native:checked + .box {
        background: var(--bk-bg-accent);
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
        color: var(--bk-text-on-accent);
        background: currentColor;
        border-radius: 100%;
      }

      .native:checked + .box::after {
        visibility: visible;
      }

      .message {
        margin-inline-start: calc(
          var(--bk-radio-group-item-size, var(--bk-radio-group-item-variant-size)) +
            var(--bk-space-2)
        );
      }
    `,
  ];

  @property({ type: Boolean }) checked = false;

  @property({ type: Boolean, reflect: true }) disabled = false;

  @property({ type: String }) value = '';

  @property({ attribute: false }) tabStop = false;

  private readonly controlId = nextInstanceId();

  private hasDescription = false;

  /* A consumer edits the text of its atom in place, without assigning a node
   * again, so `slotchange` never fires for it; content has to be observed. */
  private readonly descriptionMutations = new MutationObserver(() => this.syncDescription());

  override connectedCallback(): void {
    super.connectedCallback();
    this.descriptionMutations.observe(this, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    this.syncDescription();
  }

  override disconnectedCallback(): void {
    this.descriptionMutations.disconnect();
    super.disconnectedCallback();
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
        <slot name="description" @slotchange=${this.syncDescription}></slot>
      </div>
    `;
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
  private readonly syncDescription = (): void => {
    let describes = false;
    for (const atom of this.descriptions()) {
      if (atom.slot !== 'description') atom.slot = 'description';
      if ((atom.textContent ?? '').trim() !== '') describes = true;
    }
    if (describes === this.hasDescription) return;
    this.hasDescription = describes;
    this.requestUpdate();
  };

  /* An atom of a nested item is that item's, the way the group leaves the atoms
   * of its radios alone. */
  private descriptions(): HTMLElement[] {
    return Array.from(this.querySelectorAll<HTMLElement>('bk-field-description')).filter(
      (atom) => atom.parentElement?.closest('bk-radio-group-item, bk-radio-group') === this,
    );
  }

  private readonly handleClick = (event: MouseEvent): void => {
    if (this.disabled) event.preventDefault();
  };

  private readonly handleChange = (): void => {
    if (this.disabled) return;

    this.dispatchEvent(
      new CustomEvent<{ checked: boolean }>('bk-change', {
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
    'bk-radio-group-item': BkRadioGroupItem;
  }
}
