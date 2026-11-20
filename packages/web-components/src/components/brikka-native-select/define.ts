import { BrikkaNativeSelect } from './brikka-native-select.js';
import { BrikkaNativeSelectOpt } from './brikka-native-select-opt.js';
import { BrikkaNativeSelectOptGroup } from './brikka-native-select-opt-group.js';

/* One import for the consumer: the select and the atoms it reads. An atom whose
 * tag was never defined would stay inert, and the atoms are the select's parts,
 * so only the select leaves this module. */
if (!customElements.get('brikka-native-select')) {
  customElements.define('brikka-native-select', BrikkaNativeSelect);
}

if (!customElements.get('brikka-native-select-opt')) {
  customElements.define('brikka-native-select-opt', BrikkaNativeSelectOpt);
}

if (!customElements.get('brikka-native-select-opt-group')) {
  customElements.define('brikka-native-select-opt-group', BrikkaNativeSelectOptGroup);
}

export { BrikkaNativeSelect };
