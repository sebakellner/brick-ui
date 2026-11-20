/* The field anatomy a control with a label, a message region and an error atom
 * shares: it composes `FormControlMixin`, which stays the whole form-association
 * contract on its own, so a control with no field parts can use it alone. */
import type { LitElement } from 'lit';
import type { FieldMessageFallbacks } from './field-messages.controller.js';
import { FieldPartsController } from './field-parts.controller.js';
import { FormControlMixin, type Constructor } from './form-control.mixin.js';

let instanceCount = 0;

/* One counter for every field control, so ids stay unique across tags instead
 * of pretending each tag owns its own document. */
const nextInstanceId = (host: LitElement): string =>
  `${host.localName || 'bk-field'}-${++instanceCount}`;

export function FieldControlMixin<T extends Constructor<LitElement>>(Base: T) {
  class FieldControl extends FormControlMixin(Base) {
    protected readonly controlId: string = nextInstanceId(this);

    protected readonly fieldParts = new FieldPartsController(this, this.controlId);

    /* A slotted `bk-field-error` with text is this field's error: it is what the
     * region shows, and markup is the more specific statement, so it wins over
     * the property. An atom with no text is not content and says nothing. */
    override get fieldError(): string {
      return this.fieldParts.slotError || this.error;
    }

    protected messageSources(): FieldMessageFallbacks {
      return {
        error: this.fieldError || this.fieldMessage,
      };
    }
  }

  return FieldControl;
}
