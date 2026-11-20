import { BrikkaSlider } from './brikka-slider.js';

if (!customElements.get('brikka-slider')) {
  customElements.define('brikka-slider', BrikkaSlider);
}

export { BrikkaSlider };
