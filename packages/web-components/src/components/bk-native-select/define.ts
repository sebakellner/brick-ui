import { BkNativeSelect } from './bk-native-select.js';
import { BkNativeSelectOpt } from './bk-native-select-opt.js';
import { BkNativeSelectOptGroup } from './bk-native-select-opt-group.js';

/* One import for the consumer: the select and the atoms it reads. An atom whose
 * tag was never defined would stay inert, and the atoms are the select's parts,
 * so only the select leaves this module. */
if (!customElements.get('bk-native-select')) {
  customElements.define('bk-native-select', BkNativeSelect);
}

if (!customElements.get('bk-native-select-opt')) {
  customElements.define('bk-native-select-opt', BkNativeSelectOpt);
}

if (!customElements.get('bk-native-select-opt-group')) {
  customElements.define('bk-native-select-opt-group', BkNativeSelectOptGroup);
}

export { BkNativeSelect };
