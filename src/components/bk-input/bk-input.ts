import { LitElement, css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { hooks, tokens } from '../../styles/tokens.generated.js';
import { v } from '../../styles/tokens.js';

export type BkInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

let instanceCount = 0;
const nextInstanceId = () => `bk-input-${++instanceCount}`;

/**
 * A single-line text field.
 *
 * Accessibility is wired from the inside out: the visible `<label>` is bound to
 * the input with `for`/`id`, and the message region is the input's
 * `aria-describedby`. The region always exists so screen readers announce error
 * text when it appears; it collapses with `:empty` when there is nothing to say.
 *
 * `error` wins over `helper`, and sets `aria-invalid` on the input.
 */
export class BkInput extends LitElement {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    label {
      display: block;
      margin-bottom: var(${v(tokens.space1)});
      font-family: var(${v(tokens.fontSans)});
      font-size: var(${v(tokens.fontSizeSm)});
      font-weight: 500;
      color: var(${v(tokens.inputLabelColor)});
    }

    input {
      box-sizing: border-box;
      width: 100%;
      min-height: var(${v(tokens.controlHeight)});
      padding: 0 var(${v(tokens.space3)});
      font-family: var(${v(tokens.fontSans)});
      font-size: var(${v(tokens.fontSizeMd)});
      line-height: var(${v(tokens.lineHeightMd)});
      color: var(${v(tokens.inputColor)});
      background: var(${v(tokens.inputBg)});
      border: var(${v(tokens.borderWidth)}) solid var(${v(tokens.inputBorderColor)});
      border-radius: var(${v(hooks.inputRadius)}, var(${v(tokens.radiusMd)}));
      transition:
        border-color var(${v(tokens.transition)}),
        background-color var(${v(tokens.transition)});
    }

    input::placeholder {
      color: var(${v(tokens.colorTextMuted)});
    }

    input:hover:not(:disabled):not([aria-invalid='true']) {
      border-color: var(${v(tokens.colorBorderStrong)});
    }

    input:focus-visible {
      outline: var(${v(tokens.focusRingWidth)}) solid var(${v(tokens.focusRing)});
      outline-offset: var(${v(tokens.focusRingOffset)});
    }

    input:disabled {
      cursor: not-allowed;
      color: var(${v(tokens.colorTextMuted)});
      background: var(${v(tokens.colorSurfaceMuted)});
    }

    input[aria-invalid='true'] {
      border-color: var(${v(tokens.colorDanger)});
    }

    .message {
      margin-top: var(${v(tokens.space1)});
      font-family: var(${v(tokens.fontSans)});
      font-size: var(${v(tokens.fontSizeSm)});
      line-height: var(${v(tokens.lineHeightMd)});
      color: var(${v(tokens.colorTextMuted)});
    }

    .message[data-state='error'] {
      color: var(${v(tokens.colorDanger)});
    }

    .message:empty {
      display: none;
    }
  `;

  @property({ type: String }) label = '';

  @property({ type: String }) helper = '';

  @property({ type: String }) error = '';

  @property({ type: String }) value = '';

  @property({ type: String }) name = '';

  @property({ type: String }) type: BkInputType = 'text';

  @property({ type: String }) placeholder = '';

  @property({ type: Boolean, reflect: true }) disabled = false;

  @property({ type: Boolean, reflect: true }) required = false;

  // Generated once per instance: re-rendering must never break the label/id link.
  private readonly controlId = nextInstanceId();

  private readonly messageId = `${this.controlId}-message`;

  override render() {
    const message = this.error || this.helper;

    return html`
      ${this.label
        ? html`<label part="label" for=${this.controlId}>${this.label}</label>`
        : nothing}
      <input
        part="input"
        id=${this.controlId}
        type=${this.type}
        name=${this.name || nothing}
        placeholder=${this.placeholder || nothing}
        .value=${this.value}
        ?disabled=${this.disabled}
        ?required=${this.required}
        aria-invalid=${this.error ? 'true' : nothing}
        aria-describedby=${message ? this.messageId : nothing}
        @input=${this.handleInput}
        @change=${this.handleChange}
      />
      <div
        part="message"
        id=${this.messageId}
        class="message"
        data-state=${this.error ? 'error' : nothing}
        aria-live="polite"
      >
        ${message || nothing}
      </div>
    `;
  }

  private readonly handleInput = (event: Event) => {
    this.value = (event.target as HTMLInputElement).value;
  };

  private readonly handleChange = (event: Event) => {
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('bk-change', {
        detail: { value: (event.target as HTMLInputElement).value },
        bubbles: true,
        composed: true,
      }),
    );
  };
}

customElements.define('bk-input', BkInput);

declare global {
  interface HTMLElementTagNameMap {
    'bk-input': BkInput;
  }
}
