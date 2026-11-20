import { BrikkaRadioGroupItem } from './brikka-radio-group-item.js';
import { BrikkaRadioGroup } from './brikka-radio-group.js';

/* One import for the consumer: the group and the boxes it coordinates. A markup
 * <brikka-radio-group-item> whose tag was never defined would stay inert. The item
 * is the group's private part, so only the group leaves this module. */
if (!customElements.get('brikka-radio-group')) {
  customElements.define('brikka-radio-group', BrikkaRadioGroup);
}

if (!customElements.get('brikka-radio-group-item')) {
  customElements.define('brikka-radio-group-item', BrikkaRadioGroupItem);
}

export { BrikkaRadioGroup };
