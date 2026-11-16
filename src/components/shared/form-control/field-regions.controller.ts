import type { LitElement, ReactiveController } from 'lit';

export interface FieldRegionsOptions {
  /* The prefix an atom's id is built from when the atom has none. */
  idPrefix: string;
  /* The role the container claims on its host, unless the consumer set one. */
  role: string;
  /* The nested controls that may host atoms of their own; the container leaves
   * those alone. */
  controlSelector: string;
}

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

/* The live-region role the container puts on a consumer's atom is the
 * container's to take back, wherever that atom is adopted next. */
const liveRegions = new WeakSet<Element>();

/* `Element.ariaLabelledByElements` is Baseline 2025; the local type states the
 * contract the container needs, so the code compiles whatever the DOM lib
 * declares. */
type LabelledByHost = { ariaLabelledByElements?: readonly Element[] | null };

const labelledBy = (host: HTMLElement): LabelledByHost => host;

const isEmptyAtom = (atom: HTMLElement): boolean => (atom.textContent ?? '').trim() === '';

/* A container is named on its host and its regions are the consumer's own
 * atoms, because an IDREF cannot cross a shadow root (ADR 0010). This is that
 * behaviour, shared by every container that has to be announced as a set. */
export class FieldRegionsController implements ReactiveController {
  private readonly host: LitElement;

  private readonly options: FieldRegionsOptions;

  private readonly mutations = new MutationObserver(() => this.host.requestUpdate());

  private adopted: HTMLElement[] = [];

  constructor(host: LitElement, options: FieldRegionsOptions) {
    this.host = host;
    this.options = options;
    host.addController(this);
  }

  hostConnected(): void {
    if (!this.host.hasAttribute('role')) this.host.setAttribute('role', this.options.role);
    this.mutations.observe(this.host, { childList: true, characterData: true, subtree: true });
  }

  hostDisconnected(): void {
    this.mutations.disconnect();
  }

  hostUpdated(): void {
    this.syncAtoms();
    this.syncRegions();
  }

  /* A slot assignment brought atoms in, and their slot is needed before the
   * next update commits. */
  readonly handleSlotChange = (): void => {
    this.syncAtoms();
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
    if (describedBy) this.host.setAttribute('aria-describedby', describedBy);
    else this.host.removeAttribute('aria-describedby');
  }

  private adopt(atom: HTMLElement, name: RegionName): void {
    if (!atom.id) atom.id = `${this.options.idPrefix}-${name}`;
    if (isEmptyAtom(atom)) atom.setAttribute('data-empty', '');
    else atom.removeAttribute('data-empty');
    if (name !== 'error' || atom.hasAttribute('role')) return;
    atom.setAttribute('role', 'status');
    liveRegions.add(atom);
  }

  private release(atom: HTMLElement): void {
    /* an atom another container adopted is that container's to re-state, so
     * only an atom that left every container gives the mark and the role back */
    if (atom.closest(this.host.localName) !== null) return;
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
    return Array.from(this.host.querySelectorAll<HTMLElement>(tag)).filter((atom) => {
      const owner = atom.parentElement?.closest(this.options.controlSelector);
      return !owner || !this.host.contains(owner);
    });
  }

  private syncName(): void {
    const [atom = null] = this.owned('bk-field-label');
    const host = labelledBy(this.host);
    const current = host.ariaLabelledByElements ?? [];
    if (atom === null && current.length === 0) return;
    if (atom !== null && current.length === 1 && current[0] === atom) return;
    host.ariaLabelledByElements = atom ? [atom] : [];
  }
}
