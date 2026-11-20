import { BkCheckbox } from './bk-checkbox.js';

if (!customElements.get('bk-checkbox')) {
  customElements.define('bk-checkbox', BkCheckbox);
}

export { BkCheckbox };
