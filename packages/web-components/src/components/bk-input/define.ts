import { BkInput } from './bk-input.js';

if (!customElements.get('bk-input')) {
  customElements.define('bk-input', BkInput);
}

export { BkInput };
