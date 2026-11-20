import { BrikkaCheckbox } from './brikka-checkbox.js';

if (!customElements.get('brikka-checkbox')) {
  customElements.define('brikka-checkbox', BrikkaCheckbox);
}

export { BrikkaCheckbox };
