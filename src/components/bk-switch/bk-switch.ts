import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { FieldControlMixin, formControlStyles } from '../shared/form-control/index.js';

/**
 * A switch: the native `<input type="checkbox">`, announced as a switch, hidden behind a painted
 * track with a thumb in it, in the `<label>` row that carries the label, the required mark and the
 * field's message regions.
 *
 * @slot label - The label atom that names the switch.
 * @slot description - The help text, named by `aria-describedby` while it has content.
 * @slot error - The problem, announced from the status region; text in it is the switch's error.
 * @csspart label - The `<label>` row, carrying `data-state` while the switch is invalid or disabled.
 * @csspart input - The native `<input type="checkbox">`, visually hidden and still focusable.
 * @csspart track - The painted track, which carries the fill and the focus ring.
 * @csspart thumb - The painted thumb, which travels from one end of the track to the other.
 * @csspart required - The `*` that marks a required switch.
 * @csspart message - The container of the help and error regions, indented to the label text.
 * @csspart description - The help region.
 * @csspart error - The error region.
 * @fires bk-change - The state changed, with `detail.checked`.
 */
export class BkSwitch extends FieldControlMixin(LitElement) {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = [
    formControlStyles,
    css`
      :host {
        --bk-switch-variant-track-width: calc(var(--bk-space-4) * 2 + var(--bk-space-1) * 2);
        --bk-switch-variant-thumb-size: var(--bk-space-4);
        --bk-switch-variant-radius: var(--bk-radius-lg);
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

      .track {
        box-sizing: border-box;
        display: flex;
        flex: none;
        align-items: center;
        inline-size: var(--bk-switch-track-width, var(--bk-switch-variant-track-width));
        block-size: calc(
          var(--bk-switch-thumb-size, var(--bk-switch-variant-thumb-size)) + var(--bk-space-1)
        );
        padding-inline-start: calc(var(--bk-space-1) / 2);
        background: var(--bk-bg-surface-strong);
        border-radius: var(--bk-switch-radius, var(--bk-switch-variant-radius));
        transition: background-color var(--bk-transition);
      }

      .thumb {
        box-sizing: border-box;
        flex: none;
        inline-size: var(--bk-switch-thumb-size, var(--bk-switch-variant-thumb-size));
        block-size: var(--bk-switch-thumb-size, var(--bk-switch-variant-thumb-size));
        background: var(--bk-bg-surface);
        border-radius: 100%;
        transition:
          transform var(--bk-transition),
          background-color var(--bk-transition);
      }

      .field:not([data-disabled]):hover .native:not(:checked) + .track {
        background: var(--bk-bg-surface-strong-hover);
      }

      .native:checked + .track {
        background: var(--bk-bg-accent);
      }

      .native:checked + .track .thumb {
        transform: translateX(
          calc(
            var(--bk-switch-track-width, var(--bk-switch-variant-track-width)) - var(
                --bk-switch-thumb-size,
                var(--bk-switch-variant-thumb-size)
              ) - var(--bk-space-1)
          )
        );
      }

      .native:focus-visible + .track {
        outline: var(--bk-focus-ring-width) solid var(--bk-focus-ring);
        outline-offset: var(--bk-focus-ring-offset);
      }

      .native[aria-disabled='true'] + .track {
        cursor: not-allowed;
      }

      .native[aria-disabled='true'] + .track {
        background: var(--bk-bg-surface-muted);
      }

      .native[aria-disabled='true'] + .track .thumb {
        background: var(--bk-bg-surface-strong);
      }

      [part='message'] {
        margin-inline-start: calc(
          var(--bk-switch-track-width, var(--bk-switch-variant-track-width)) + var(--bk-space-2)
        );
      }
    `,
  ];

  @property({ type: Boolean }) checked = false;

  override get formControlElement(): HTMLInputElement | undefined {
    return this.shadowRoot?.querySelector('input') ?? undefined;
  }

  override get submittedValue(): string | null {
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
          role="switch"
          name=${this.name || nothing}
          .checked=${this.checked}
          ?required=${this.required}
          aria-disabled=${this.fieldDisabled ? 'true' : nothing}
          aria-invalid=${this.fieldInvalid ? 'true' : nothing}
          aria-describedby=${this.fieldParts.describedBy(this.messageSources()) || nothing}
          @click=${this.handleClick}
          @change=${this.handleChange}
        />
        <span part="track" class="track" aria-hidden="true">
          <span part="thumb" class="thumb"></span>
        </span>
        <slot name="label" @slotchange=${this.fieldParts.handleLabelSlot}></slot>
        ${this.fieldParts.glyph}
      </label>
      ${this.fieldParts.messages}
    `;
  }

  override formResetCallback(): void {
    const initialChecked = this.hasAttribute('checked');
    const control = this.formControlElement;
    if (control) control.checked = initialChecked;
    this.checked = initialChecked;
    super.formResetCallback();
  }

  private readonly handleClick = (event: MouseEvent): void => {
    if (this.fieldDisabled) event.preventDefault();
  };

  private readonly handleChange = (): void => {
    const control = this.formControlElement;
    if (!control) return;
    this.checked = control.checked;
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
    'bk-switch': BkSwitch;
  }
}
