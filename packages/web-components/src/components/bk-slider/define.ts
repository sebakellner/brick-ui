import { BkSlider } from './bk-slider.js';

if (!customElements.get('bk-slider')) {
  customElements.define('bk-slider', BkSlider);
}

export { BkSlider };
