import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { FieldPartsController, formControlStyles } from '../shared/form-control/index.js';

export type BkCheckboxGroupOrientation = 'vertical' | 'horizontal';

const ATOM_SLOTS = [
  { tag: 'bk-field-label', slot: 'label' },
  { tag: 'bk-field-description', slot: 'description' },
  { tag: 'bk-field-error', slot: 'error' },
] as const;

const REGION_ATOMS = {
  description: 'bk-field-description',
  error: 'bk-field-error',
} as const;

type RegionName = keyof typeof REGION_ATOMS;

const CONTROL_OWNER = 'bk-checkbox, bk-input';

let instanceCount = 0;
const nextInstanceId = () => `bk-checkbox-group-${++instanceCount}`;

/* The live-region role the group puts on a consumer's atom is the group's to
 * take back, wherever that atom is adopted next. */
const liveRegions = new WeakSet<Element>();

/* `Element.ariaLabelledByElements` is Baseline 2025; the local type states the
 * contract the group needs, so the code compiles whatever the DOM lib declares. */
type LabelledByHost = { ariaLabelledByElements?: readonly Element[] | null };

const labelledBy = (host: HTMLElement): LabelledByHost => host;

const isEmptyAtom = (atom: HTMLElement): boolean => (atom.textContent ?? '').trim() === '';

export class BkCheckboxGroup extends LitElement {
  static override styles = [
    formControlStyles,
    css`
      .boxes {
        display: flex;
        flex-direction: column;
        gap: var(--bk-space-2);
      }

      :host([orientation='horizontal']) .boxes {
        flex-direction: row;
      }

      slot[name='description']::slotted(:not([data-empty])),
      slot[name='error']::slotted(:not([data-empty])) {
        margin-block-start: var(--bk-space-1);
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) invalid = false;

  @property({ type: String, reflect: true })
  orientation: BkCheckboxGroupOrientation = 'vertical';

  private readonly groupId = nextInstanceId();

  private readonly fieldParts = new FieldPartsController(this, this.groupId);

  private readonly mutations = new MutationObserver(() => this.requestUpdate());

  private adopted: HTMLElement[] = [];

  get fieldInvalid(): boolean {
    return this.invalid;
  }

  override connectedCallback(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    this.mutations.observe(this, { childList: true, characterData: true, subtree: true });
    super.connectedCallback();
  }

  override disconnectedCallback(): void {
    this.mutations.disconnect();
    super.disconnectedCallback();
  }

  override render() {
    return html`
      <div class="label" part="label" ?hidden=${!this.fieldParts.labelled}>
        <slot name="label" @slotchange=${this.handleSlotChange}></slot>
      </div>
      <div class="boxes" part="boxes">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
      <slot name="description" @slotchange=${this.handleSlotChange}></slot>
      <slot name="error" @slotchange=${this.handleSlotChange}></slot>
    `;
  }

  override updated(): void {
    this.syncAtoms();
    this.syncRegions();
  }

  private readonly handleSlotChange = (event: Event): void => {
    this.syncAtoms();
    if ((event.target as HTMLSlotElement).name === 'label') this.fieldParts.handleLabelSlot(event);
  };

  private readonly syncAtoms = (): void => {
    for (const { tag, slot } of ATOM_SLOTS) {
      for (const atom of this.owned(tag)) {
        if (atom.slot !== slot) atom.slot = slot;
      }
    }
    this.syncName();
  };

  private syncRegions(): void {
    const atoms: Record<RegionName, HTMLElement | null> = {
      description: this.owned(REGION_ATOMS.description)[0] ?? null,
      error: this.owned(REGION_ATOMS.error)[0] ?? null,
    };
    const next = [atoms.description, atoms.error].filter(
      (atom): atom is HTMLElement => atom !== null,
    );

    for (const atom of this.adopted) {
      if (!next.includes(atom)) this.release(atom);
    }
    this.adopted = next;

    const errorShows = atoms.error !== null && !isEmptyAtom(atoms.error);

    for (const name of Object.keys(atoms) as RegionName[]) {
      const atom = atoms[name];
      if (atom) this.adopt(atom, name);
    }

    for (const name of Object.keys(atoms) as RegionName[]) {
      const atom = atoms[name];
      if (atom === null) continue;
      if (name === 'description' && errorShows) atom.setAttribute('hidden', '');
      else atom.removeAttribute('hidden');
    }

    const describedBy = this.describedBy(atoms);
    if (describedBy) this.setAttribute('aria-describedby', describedBy);
    else this.removeAttribute('aria-describedby');
  }

  private adopt(atom: HTMLElement, name: RegionName): void {
    if (!atom.id) atom.id = `${this.groupId}-${name}`;
    if (isEmptyAtom(atom)) atom.setAttribute('data-empty', '');
    else atom.removeAttribute('data-empty');
    if (name !== 'error' || atom.hasAttribute('role')) return;
    atom.setAttribute('role', 'status');
    liveRegions.add(atom);
  }

  private release(atom: HTMLElement): void {
    /* an atom another group adopted is that group's to re-state, so only an
     * atom that left every group gives the mark and the role back */
    if (atom.closest('bk-checkbox-group') !== null) return;
    if (liveRegions.has(atom)) {
      atom.removeAttribute('role');
      liveRegions.delete(atom);
    }
    atom.removeAttribute('data-empty');
    atom.removeAttribute('hidden');
  }

  private describedBy(atoms: Record<RegionName, HTMLElement | null>): string | undefined {
    const error = atoms.error;
    if (error && !isEmptyAtom(error)) return error.id;
    const description = atoms.description;
    if (description && !isEmptyAtom(description)) return description.id;
    return undefined;
  }

  private owned(tag: string): HTMLElement[] {
    return Array.from(this.querySelectorAll<HTMLElement>(tag)).filter((atom) => {
      const owner = atom.parentElement?.closest(CONTROL_OWNER);
      return !owner || !this.contains(owner);
    });
  }

  private syncName(): void {
    const [atom = null] = this.owned('bk-field-label');
    const host = labelledBy(this);
    const current = host.ariaLabelledByElements ?? [];
    if (atom === null && current.length === 0) return;
    if (atom !== null && current.length === 1 && current[0] === atom) return;
    host.ariaLabelledByElements = atom ? [atom] : [];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bk-checkbox-group': BkCheckboxGroup;
  }
}
