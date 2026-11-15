import { html, nothing, type LitElement, type ReactiveController, type TemplateResult } from 'lit';
import {
  FieldMessagesController,
  type FieldMessageFallbacks,
} from './field-messages.controller.js';

export type FieldLabelState = 'invalid' | 'disabled';

export type FieldPartsHost = LitElement & {
  readonly required?: boolean;
  readonly fieldInvalid?: boolean;
  readonly fieldDisabled?: boolean;
};

export class FieldPartsController implements ReactiveController {
  private readonly host: FieldPartsHost;

  private readonly regions: FieldMessagesController;

  labelled = false;

  constructor(host: FieldPartsHost, idPrefix: string) {
    this.host = host;
    this.regions = new FieldMessagesController(host, idPrefix);
    host.addController(this);
  }

  get labelState(): FieldLabelState | undefined {
    if (this.host.fieldInvalid === true) return 'invalid';
    return this.host.fieldDisabled === true ? 'disabled' : undefined;
  }

  get glyph(): TemplateResult | typeof nothing {
    if (this.host.required !== true || !this.labelled) return nothing;
    return html`<span class="required" part="required" aria-hidden="true">*</span>`;
  }

  get messages(): TemplateResult {
    return this.regions.render();
  }

  describedBy(sources: FieldMessageFallbacks): string | undefined {
    return this.regions.update(sources);
  }

  hostConnected(): void {
    this.labelled = this.readSlottedLabel();
    this.regions.connect();
  }

  hostUpdated(): void {
    this.syncHostedLabel();
  }

  readonly handleLabelSlot = (event: Event): void => {
    const labelled = (event.target as HTMLSlotElement).assignedNodes({ flatten: false }).length > 0;
    this.syncHostedLabel();
    if (labelled === this.labelled) return;
    this.labelled = labelled;
    this.host.requestUpdate();
  };

  private readSlottedLabel(): boolean {
    return Array.from(this.host.children).some((child) => child.slot === 'label');
  }

  private syncHostedLabel(): void {
    const state = this.labelState ?? null;
    for (const child of this.host.children) {
      if (child.slot !== 'label') continue;
      if (child.getAttribute('data-state') === state) continue;
      if (state) child.setAttribute('data-state', state);
      else child.removeAttribute('data-state');
    }
  }
}
