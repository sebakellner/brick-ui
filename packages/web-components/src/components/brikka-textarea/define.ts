import { BrikkaTextarea } from './brikka-textarea.js';

if (!customElements.get('brikka-textarea')) {
  customElements.define('brikka-textarea', BrikkaTextarea);
}

export { BrikkaTextarea };
