import { BkRadio } from './bk-radio.js';

if (!customElements.get('bk-radio')) {
  customElements.define('bk-radio', BkRadio);
}

export { BkRadio };
