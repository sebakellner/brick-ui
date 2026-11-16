import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { FieldControlMixin, formControlStyles } from '../shared/form-control/index.js';
import { BkNativeSelectOpt } from './bk-native-select-opt.js';
import { BkNativeSelectOptGroup } from './bk-native-select-opt-group.js';

interface MirrorOption {
  value: string;
  label: string;
  disabled: boolean;
}

type MirrorEntry =
  | { kind: 'option'; option: MirrorOption }
  | { kind: 'group'; label: string; disabled: boolean; options: MirrorOption[] };

const readOption = (opt: BkNativeSelectOpt): MirrorOption => ({
  value: opt.value,
  label: (opt.textContent ?? '').trim(),
  disabled: opt.disabled,
});

const sameOption = (one: MirrorOption, other: MirrorOption): boolean =>
  one.value === other.value && one.label === other.label && one.disabled === other.disabled;

/* The mirror is rebuilt on every mutation, so an unchanged rebuild has to cost no
 * render: a render that adds options would move the user's selection. */
const sameEntry = (one: MirrorEntry, other: MirrorEntry): boolean => {
  if (one.kind !== other.kind) return false;
  if (one.kind === 'option' && other.kind === 'option') return sameOption(one.option, other.option);
  if (one.kind === 'group' && other.kind === 'group') {
    return (
      one.label === other.label &&
      one.disabled === other.disabled &&
      one.options.length === other.options.length &&
      one.options.every((option, index) => sameOption(option, other.options[index]))
    );
  }
  return false;
};

const sameMirror = (one: MirrorEntry[], other: MirrorEntry[]): boolean =>
  one.length === other.length && one.every((entry, index) => sameEntry(entry, other[index]));

/* One line, so the label is the option's whole text and no layout whitespace
 * becomes part of a name a screen reader reads. */
const renderOption = (option: MirrorOption) =>
  html`<option value=${option.value} ?disabled=${option.disabled}>${option.label}</option>`;

export class BkNativeSelect extends FieldControlMixin(LitElement) {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = [
    formControlStyles,
    css`
      .select {
        position: relative;
      }

      .control {
        border-radius: var(--bk-radius-md);
        appearance: none;
        padding-inline-end: calc(var(--bk-space-4) + var(--bk-space-3));
      }

      /* Chrome anchors the native caret to the control's edge, so no padding can
       * move it: the arrow is drawn here instead, and this is what fixes the gap. */
      .caret {
        position: absolute;
        inset-block-start: 50%;
        inset-inline-end: var(--bk-space-4);
        inline-size: var(--bk-space-1);
        block-size: var(--bk-space-1);
        color: var(--bk-text-muted);
        border-inline-end: var(--bk-border-width) solid currentColor;
        border-block-end: var(--bk-border-width) solid currentColor;
        transform: translateY(-50%) rotate(45deg);
        pointer-events: none;
      }
    `,
  ];

  @property({ type: String }) placeholder = '';

  /* The light DOM as data: the atoms are never moved, so the shadow select is
   * built from a copy of them on every change. */
  @state() private mirror: MirrorEntry[] = [];

  private readonly observer = new MutationObserver(() => this.syncMirror());

  override get formControlElement(): HTMLSelectElement | undefined {
    return this.shadowRoot?.querySelector('select') ?? undefined;
  }

  /* A select with nothing selected contributes no entry at all, and a disabled
   * one contributes nothing either: a custom element has to say both itself. */
  override get submittedValue(): string | null {
    if (this.fieldDisabled) return null;
    return this.value === '' ? null : this.value;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['value', 'disabled', 'label'],
    });
    this.syncMirror();
  }

  override disconnectedCallback(): void {
    this.observer.disconnect();
    super.disconnectedCallback();
  }

  override render() {
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
        ${this.fieldParts.glyph}
      </label>
      <div class="select">
        <select
          part="input"
          class="control"
          id=${this.controlId}
          ?disabled=${this.fieldDisabled}
          ?required=${this.required}
          aria-invalid=${this.fieldInvalid ? 'true' : nothing}
          aria-describedby=${this.fieldParts.describedBy(this.messageSources()) || nothing}
          @change=${this.handleChange}
        >
          ${
            this.placeholder
              ? html`<option value="" disabled hidden>${this.placeholder}</option>`
              : nothing
          }
          ${this.mirror.map((entry) =>
            entry.kind === 'group'
              ? html`<optgroup label=${entry.label} ?disabled=${entry.disabled}>
                  ${entry.options.map((option) => renderOption(option))}
                </optgroup>`
              : renderOption(entry.option),
          )}
        </select>
        <span class="caret" part="caret" aria-hidden="true"></span>
      </div>
      ${this.fieldParts.messages}
    `;
  }

  override updated(changed: PropertyValues): void {
    this.syncControl();
    super.updated(changed);
  }

  /* The mixin's reset clears the value, and on a select with no placeholder an
   * empty value is not a choice the platform can show: it leaves the control blank
   * where the browser would restore the first option. Re-adopt what the platform
   * would have chosen, then write it. */
  override formResetCallback(): void {
    super.formResetCallback();
    this.value = '';
    this.adoptFirstChoice(this.mirror);
    this.syncControl();
    this.requestUpdate();
  }

  /* The select is written after every render, which is what carries a value the
   * consumer set before any option existed: the write it missed happens here. */
  private syncControl(): void {
    const select = this.formControlElement;
    if (!select) return;

    /* No placeholder: the platform selects the first option, and that selection
     * is the value the mirror adopted when the options arrived. */
    if (this.value === '' && !this.placeholder) return;

    if (select.value !== this.value) select.value = this.value;
  }

  private syncMirror(): void {
    const next: MirrorEntry[] = [];

    for (const child of Array.from(this.children)) {
      if (child instanceof BkNativeSelectOpt) {
        next.push({ kind: 'option', option: readOption(child) });
      } else if (child instanceof BkNativeSelectOptGroup) {
        next.push({
          kind: 'group',
          label: child.label,
          disabled: child.disabled,
          /* A group inside a group is not rendered: the platform has no such
           * thing, so the nested group and its options are left out. */
          options: Array.from(child.children)
            .filter((option): option is BkNativeSelectOpt => option instanceof BkNativeSelectOpt)
            .map(readOption),
        });
      }
    }

    if (!sameMirror(this.mirror, next)) this.mirror = next;
    this.adoptFirstChoice(next);
  }

  /* With no placeholder the platform shows the first option, so that option is
   * the field's value: the mirror states what the browser would otherwise only
   * display, and the form submits what the user sees. */
  private adoptFirstChoice(entries: MirrorEntry[]): void {
    if (this.value !== '' || this.placeholder) return;

    const options = entries.flatMap((entry) =>
      entry.kind === 'group' ? entry.options : [entry.option],
    );
    const first = options.find((option) => !option.disabled);

    if (first) this.value = first.value;
  }

  private readonly handleChange = (event: Event): void => {
    const select = event.target as HTMLSelectElement;
    this.value = select.value;
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('bk-change', {
        detail: { value: select.value },
        bubbles: true,
        composed: true,
      }),
    );
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'bk-native-select': BkNativeSelect;
  }
}
