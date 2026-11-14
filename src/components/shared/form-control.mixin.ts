import type { LitElement, PropertyValues } from 'lit';
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
  readonly fieldMessage: string;
  readonly fieldInvalid: boolean;
  readonly fieldDisabled: boolean;
  readonly formControlElement: NativeFormControl | undefined;
  readonly submittedValue: File | string | FormData | null;
  checkValidity(): boolean;
  reportValidity(): boolean;
  showValidationMessage(): void;
  formResetCallback(): void;
  formDisabledCallback(disabled: boolean): void;
  formStateRestoreCallback(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void;
}

export function FormControlMixin<T extends Constructor<LitElement>>(Base: T) {
  class FormControl extends Base implements FormControlInterface {
    static formAssociated = true;

    private readonly internals = this.attachInternals();

    private formDisabled = false;

    private touched = false;

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

    get fieldMessage(): string {
      if (!this.touched || this.form?.noValidate) return '';
      const control = this.formControlElement;
      if (!control || control.validity.valid) return '';
      return control.validationMessage;
    }

    get fieldInvalid(): boolean {
      return Boolean(this.error || this.fieldMessage);
    }

    checkValidity(): boolean {
      return this.internals.checkValidity();
    }

    reportValidity(): boolean {
      return this.internals.reportValidity();
    }

    showValidationMessage(): void {
      this.touched = true;
      this.requestUpdate();
    }

    formResetCallback(): void {
      const initial = this.getAttribute('value') ?? '';
      this.error = '';
      this.touched = false;
      this.value = initial;
      this.syncFormValue();
      const control = this.formControlElement;
      if (control) control.value = initial;
      this.requestUpdate();
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

    
    get fieldDisabled(): boolean {
      return this.disabled || this.formDisabled;
    }

    
    get formControlElement(): NativeFormControl | undefined {
      return undefined;
    }

    get submittedValue(): File | string | FormData | null {
      return this.value;
    }

    override updated(changed: PropertyValues): void {
      super.updated(changed);
      this.syncFormValue();
    }

    override connectedCallback(): void {
      super.connectedCallback();
      // focusout is composed and invalid fires at this element without bubbling.
      this.addEventListener('input', this.handleFieldInput);
      this.addEventListener('focusout', this.handleFieldFocusOut);
      this.addEventListener('invalid', this.handleFieldInvalid);
    }

    override disconnectedCallback(): void {
      this.removeEventListener('input', this.handleFieldInput);
      this.removeEventListener('focusout', this.handleFieldFocusOut);
      this.removeEventListener('invalid', this.handleFieldInvalid);
      super.disconnectedCallback();
    }

    private readonly handleFieldInput = (): void => {
      if (this.error) this.error = '';
    };

    private readonly handleFieldFocusOut = (): void => {
      this.showValidationMessage();
    };

    private readonly handleFieldInvalid = (): void => {
      this.showValidationMessage();
    };

    private syncFormValue(): void {
      this.internals.setFormValue(this.submittedValue);

      if (this.fieldDisabled) {
        this.internals.setValidity({});
        return;
      }

      const control = this.formControlElement;

      if (this.error) {
        this.internals.setValidity({ customError: true }, this.error, control);
      } else if (control && !control.validity.valid) {
        this.internals.setValidity(control.validity, control.validationMessage, control);
      } else {
        this.internals.setValidity({});
      }
    }
  }

  return FormControl as Constructor<FormControlInterface> & T;
}
