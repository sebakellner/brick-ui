import type { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

export type Constructor<T = object> = new (...args: any[]) => T;

export type NativeFormControl =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

export interface FormControlInterface {
  name: string;
  value: string;
  disabled: boolean;
  required: boolean;
  error: string;
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly fieldDisabled: boolean;
  readonly formControlElement: NativeFormControl | undefined;
  checkValidity(): boolean;
  reportValidity(): boolean;
  formResetCallback(): void;
  formDisabledCallback(disabled: boolean): void;
  formStateRestoreCallback(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void;
}

const REQUIRED_MESSAGE = 'This field is required.';

/** Form participation for a custom element that wraps a native control. */
export function FormControlMixin<T extends Constructor<LitElement>>(Base: T) {
  class FormControl extends Base implements FormControlInterface {
    static formAssociated = true;

    private readonly internals = this.attachInternals();

    private formDisabled = false;

    @property({ type: String }) name = '';

    @property({ type: String }) value = '';

    @property({ type: Boolean, reflect: true }) disabled = false;

    @property({ type: Boolean, reflect: true }) required = false;

    @property({ type: String }) error = '';

    get form(): HTMLFormElement | null {
      return this.internals.form;
    }

    get validity(): ValidityState {
      return this.internals.validity;
    }

    get validationMessage(): string {
      return this.internals.validationMessage;
    }

    checkValidity(): boolean {
      return this.internals.checkValidity();
    }

    reportValidity(): boolean {
      return this.internals.reportValidity();
    }

    formResetCallback(): void {
      const initial = this.getAttribute('value') ?? '';
      this.value = initial;
      // A reset handler may read FormData or submit before the next render, so the
      // internals and the visible field are updated synchronously.
      this.syncFormValue();
      const control = this.formControlElement;
      if (control) control.value = initial;
    }

    formDisabledCallback(disabled: boolean): void {
      if (this.formDisabled === disabled) return;
      this.formDisabled = disabled;
      this.requestUpdate();
    }

    formStateRestoreCallback(state: File | string | FormData | null): void {
      this.value = typeof state === 'string' ? state : '';
      this.syncFormValue();
    }

    /** The author's `disabled` and the form's disabling are separate states. */
    get fieldDisabled(): boolean {
      return this.disabled || this.formDisabled;
    }

    /** The native control: validity anchors on it, and a reset writes it. */
    get formControlElement(): NativeFormControl | undefined {
      return undefined;
    }

    override updated(): void {
      this.syncFormValue();
    }

    private syncFormValue(): void {
      this.internals.setFormValue(this.value);

      if (this.error) {
        this.internals.setValidity({ customError: true }, this.error, this.formControlElement);
      } else if (this.required && !this.value) {
        this.internals.setValidity(
          { valueMissing: true },
          REQUIRED_MESSAGE,
          this.formControlElement,
        );
      } else {
        this.internals.setValidity({});
      }
    }
  }

  return FormControl as Constructor<FormControlInterface> & T;
}
