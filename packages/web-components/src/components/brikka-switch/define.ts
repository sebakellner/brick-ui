import { BrikkaSwitch } from './brikka-switch.js';

if (!customElements.get('brikka-switch')) {
  customElements.define('brikka-switch', BrikkaSwitch);
}

export { BrikkaSwitch };
