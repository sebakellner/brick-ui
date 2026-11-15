import { BkCheckboxGroup } from './bk-checkbox-group.js';

if (!customElements.get('bk-checkbox-group')) {
  customElements.define('bk-checkbox-group', BkCheckboxGroup);
}

export { BkCheckboxGroup };
