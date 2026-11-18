import { BkTextarea } from './bk-textarea.js';

if (!customElements.get('bk-textarea')) {
  customElements.define('bk-textarea', BkTextarea);
}

export { BkTextarea };
