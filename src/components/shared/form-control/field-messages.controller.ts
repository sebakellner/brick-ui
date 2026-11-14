import { html, type LitElement, type TemplateResult } from 'lit';

export type FieldRegion = 'description' | 'error';

export interface FieldMessageFallbacks {
  description: string;
  error: string;
}

const REGIONS: FieldRegion[] = ['description', 'error'];

export class FieldMessagesController {
  readonly descriptionId: string;

  readonly errorId: string;

  private readonly host: LitElement;

  private assigned: Record<FieldRegion, boolean> = { description: false, error: false };

  private fallbacks: FieldMessageFallbacks = { description: '', error: '' };

  constructor(host: LitElement, baseId: string) {
    this.host = host;
    this.descriptionId = `${baseId}-description`;
    this.errorId = `${baseId}-error`;
  }

  get describedBy(): string | undefined {
    if (this.hasContent('error')) return this.errorId;
    if (this.hasContent('description')) return this.descriptionId;
    return undefined;
  }

  connect(): void {
    this.readLightDom();
  }

  update(fallbacks: FieldMessageFallbacks): string | undefined {
    this.fallbacks = fallbacks;
    this.readLightDom();
    return this.describedBy;
  }

  render(): TemplateResult {
    const description = this.hasContent('description');
    const error = this.hasContent('error');

    return html`
      <div part="message">
        <div
          class="message"
          part="description"
          id=${this.descriptionId}
          ?hidden=${error}
          ?data-empty=${!description}
        >
          <slot name="description" @slotchange=${this.handleSlotChange}>
            ${this.fallbacks.description}
          </slot>
        </div>
        <div
          class="message"
          part="error"
          id=${this.errorId}
          role="status"
          data-state="error"
          ?data-empty=${!error}
        >
          <slot name="error" @slotchange=${this.handleSlotChange}>${this.fallbacks.error}</slot>
        </div>
      </div>
    `;
  }

  private hasContent(region: FieldRegion): boolean {
    return this.assigned[region] || this.fallbacks[region].trim() !== '';
  }

  private readLightDom(): void {
    for (const region of REGIONS) {
      this.assigned[region] = this.nodesFor(region).length > 0;
    }
  }

  private nodesFor(region: FieldRegion): Node[] {
    const slot = this.host.shadowRoot?.querySelector<HTMLSlotElement>(`slot[name="${region}"]`);
    if (slot) return slot.assignedNodes();
    return Array.from(this.host.children).filter((child) => child.slot === region);
  }

  private readonly handleSlotChange = (): void => {
    this.readLightDom();
    this.host.requestUpdate();
  };
}
