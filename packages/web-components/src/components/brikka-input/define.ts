import { BrikkaInput } from './brikka-input.js';

if (!customElements.get('brikka-input')) {
  customElements.define('brikka-input', BrikkaInput);
}

export { BrikkaInput };
