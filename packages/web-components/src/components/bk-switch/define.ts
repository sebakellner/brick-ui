import { BkSwitch } from './bk-switch.js';

if (!customElements.get('bk-switch')) {
  customElements.define('bk-switch', BkSwitch);
}

export { BkSwitch };
