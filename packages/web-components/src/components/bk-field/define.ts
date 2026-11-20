import { BkField } from './bk-field.js';
import { BkFieldDescription } from './bk-field-description.js';
import { BkFieldError } from './bk-field-error.js';
import { BkFieldLabel } from './bk-field-label.js';

if (!customElements.get('bk-field')) {
  customElements.define('bk-field', BkField);
}

if (!customElements.get('bk-field-label')) {
  customElements.define('bk-field-label', BkFieldLabel);
}

if (!customElements.get('bk-field-description')) {
  customElements.define('bk-field-description', BkFieldDescription);
}

if (!customElements.get('bk-field-error')) {
  customElements.define('bk-field-error', BkFieldError);
}

export { BkField, BkFieldDescription, BkFieldError, BkFieldLabel };
