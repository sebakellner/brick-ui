import { BkRadioGroup } from './bk-radio-group.js';

if (!customElements.get('bk-radio-group')) {
  customElements.define('bk-radio-group', BkRadioGroup);
}

export { BkRadioGroup };
