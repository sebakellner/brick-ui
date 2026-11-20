import { BrikkaCheckboxGroup } from './brikka-checkbox-group.js';

if (!customElements.get('brikka-checkbox-group')) {
  customElements.define('brikka-checkbox-group', BrikkaCheckboxGroup);
}

export { BrikkaCheckboxGroup };
