import { unsafeCSS } from 'lit';
import type { CSSResult } from 'lit';

import type { HookName, TokenName } from './tokens.generated.js';

/**
 * Interpolates a token name into a `css` template. Lit only accepts
 * `CSSResultGroup | number` in interpolations, so a bare string would not
 * typecheck; this keeps the name checked against the generated union.
 */
export const v = (name: TokenName | HookName): CSSResult => unsafeCSS(name);
