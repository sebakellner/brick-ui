import { BkRadioGroupItem } from './bk-radio-group-item.js';
import { BkRadioGroup } from './bk-radio-group.js';

/* One import for the consumer: the group and the boxes it coordinates. A markup
 * <bk-radio-group-item> whose tag was never defined would stay inert. The item
 * is the group's private part, so only the group leaves this module. */
if (!customElements.get('bk-radio-group')) {
  customElements.define('bk-radio-group', BkRadioGroup);
}

if (!customElements.get('bk-radio-group-item')) {
  customElements.define('bk-radio-group-item', BkRadioGroupItem);
}

export { BkRadioGroup };
