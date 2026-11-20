import { BrikkaField } from './brikka-field.js';
import { BrikkaFieldDescription } from './brikka-field-description.js';
import { BrikkaFieldError } from './brikka-field-error.js';
import { BrikkaFieldLabel } from './brikka-field-label.js';

if (!customElements.get('brikka-field')) {
  customElements.define('brikka-field', BrikkaField);
}

if (!customElements.get('brikka-field-label')) {
  customElements.define('brikka-field-label', BrikkaFieldLabel);
}

if (!customElements.get('brikka-field-description')) {
  customElements.define('brikka-field-description', BrikkaFieldDescription);
}

if (!customElements.get('brikka-field-error')) {
  customElements.define('brikka-field-error', BrikkaFieldError);
}

export { BrikkaField, BrikkaFieldDescription, BrikkaFieldError, BrikkaFieldLabel };
