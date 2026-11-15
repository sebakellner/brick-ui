import { expect, fixture, html } from '@open-wc/testing';
import './define.js';
import '../bk-checkbox/define.js';
import '../bk-field/define.js';
import type { BkCheckboxGroup } from './bk-checkbox-group.js';
import { loadTheme, setTheme } from '../../test/helpers/theme.js';

const part = (el: BkCheckboxGroup, name: string) =>
  el.shadowRoot!.querySelector<HTMLElement>(`[part="${name}"]`);

const boxesContainer = (el: BkCheckboxGroup) => part(el, 'boxes')!;

const descriptionAtom = (el: BkCheckboxGroup) =>
  el.querySelector<HTMLElement>(':scope > bk-field-description');

const errorAtom = (el: BkCheckboxGroup) => el.querySelector<HTMLElement>(':scope > bk-field-error');

const describedNode = (el: BkCheckboxGroup): Element | null => {
  const id = el.getAttribute('aria-describedby');
  return id ? document.getElementById(id) : null;
};

const resolved = (el: BkCheckboxGroup, atom: Element | null) => describedNode(el) === atom;

const nameOf = (el: BkCheckboxGroup) => Array.from(el.ariaLabelledByElements ?? []);

const atomState = (atom: Element | null) => atom?.getAttribute('data-state') ?? null;

const boxAttributes = (box: Element) =>
  Array.from(box.attributes)
    .map((one) => one.name)
    .sort();

const colorOf = async (value: string): Promise<string> => {
  const probe = await fixture<HTMLElement>(html`<span style="color: ${value}"></span>`);

  return getComputedStyle(probe).color;
};

const settle = async (el: BkCheckboxGroup) => {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
};

const twoBoxes = html`
  <bk-checkbox-group>
    <bk-field-label>Notifications</bk-field-label>
    <bk-checkbox name="email"><bk-field-label slot="label">Email</bk-field-label></bk-checkbox>
    <bk-checkbox name="sms"><bk-field-label slot="label">SMS</bk-field-label></bk-checkbox>
  </bk-checkbox-group>
`;

describe('bk-checkbox-group', () => {
  before(loadTheme);

  afterEach(() => {
    setTheme('light');
  });

  it('should be a group named by the slotted label atom', async () => {
    const el = await fixture<BkCheckboxGroup>(twoBoxes);
    await settle(el);
    const label = el.querySelector<HTMLElement>(':scope > bk-field-label')!;

    expect(el.getAttribute('role'), 'the host is the group').to.equal('group');
    expect(nameOf(el).length, 'exactly one element names the group').to.equal(1);
    expect(nameOf(el)[0] === label, 'the name is the consumer atom, not a copy').to.equal(true);
  });

  it('should route its own atoms by tag and leave the boxes alone', async () => {
    const el = await fixture<BkCheckboxGroup>(html`
      <bk-checkbox-group>
        <bk-field-label>Notifications</bk-field-label>
        <bk-checkbox name="email"><bk-field-label>Email</bk-field-label></bk-checkbox>
        <bk-field-description>Pick at least one.</bk-field-description>
        <bk-field-error>Pick two.</bk-field-error>
      </bk-checkbox-group>
    `);
    await settle(el);
    const own = el.querySelector<HTMLElement>(':scope > bk-field-label')!;
    const ownDescription = el.querySelector<HTMLElement>(':scope > bk-field-description')!;
    const ownError = el.querySelector<HTMLElement>(':scope > bk-field-error')!;
    const hosted = el.querySelector<HTMLElement>('bk-checkbox > bk-field-label')!;

    expect(own.slot).to.equal('label');
    expect(ownDescription.slot).to.equal('description');
    expect(ownError.slot).to.equal('error');
    expect(hosted.slot, 'the group does not route the atoms of a box').to.equal('');
    expect(el.querySelector('bk-checkbox')!.slot, 'the box keeps the default slot').to.equal('');

    for (const atom of [own, ownError]) {
      expect(
        atom.getBoundingClientRect().height,
        `${atom.localName} is rendered by the group`,
      ).to.be.greaterThan(0);
    }
    expect(
      Boolean(ownDescription.assignedSlot),
      'the description atom is projected while the error has content',
    ).to.equal(true);
  });

  it('should describe itself with the description atom while it has text', async () => {
    const el = await fixture<BkCheckboxGroup>(twoBoxes);
    await settle(el);

    expect(Boolean(describedNode(el)), 'no text, no description').to.equal(false);

    const description = document.createElement('bk-field-description');
    description.textContent = 'Pick at least one.';
    el.append(description);
    await settle(el);
    const atom = descriptionAtom(el)!;

    expect(Boolean(atom.id), 'the group gives its atom an id').to.equal(true);
    expect(resolved(el, atom), 'the id resolves in the document tree').to.equal(true);
    expect(getComputedStyle(atom).position, 'an atom with text takes its place').to.not.equal(
      'absolute',
    );
    expect(atom.hasAttribute('data-empty'), 'an atom with text is not marked empty').to.equal(
      false,
    );
  });

  it('should point at the error atom while it has text and keep the description', async () => {
    const el = await fixture<BkCheckboxGroup>(html`
      <bk-checkbox-group>
        <bk-field-label>Notifications</bk-field-label>
        <bk-checkbox name="email"><bk-field-label slot="label">Email</bk-field-label></bk-checkbox>
        <bk-field-description>Pick at least one.</bk-field-description>
        <bk-field-error>Pick two.</bk-field-error>
      </bk-checkbox-group>
    `);
    await settle(el);
    const description = descriptionAtom(el)!;
    const error = errorAtom(el)!;

    expect(resolved(el, error), 'the error atom is what the host points at').to.equal(true);
    expect(error.getAttribute('role'), 'the error atom is the live region').to.equal('status');
    expect(document.getElementById(description.id) === description, 'both ids resolve').to.equal(
      true,
    );
    expect(
      description.hasAttribute('hidden'),
      'the description gives the row to the error while it has text',
    ).to.equal(true);
    expect(description.hasAttribute('data-empty'), 'the description has text').to.equal(false);
    expect(
      Boolean(description.isConnected) && Boolean(error.isConnected),
      'both atoms stay in the tree',
    ).to.equal(true);
  });

  it('should keep an empty atom clipped, present and unreferenced until it has text', async () => {
    const el = await fixture<BkCheckboxGroup>(html`
      <bk-checkbox-group>
        <bk-field-label>Notifications</bk-field-label>
        <bk-field-description></bk-field-description>
      </bk-checkbox-group>
    `);
    await settle(el);
    const atom = descriptionAtom(el)!;

    expect(atom.hasAttribute('data-empty'), 'the empty atom says so').to.equal(true);
    expect(getComputedStyle(atom).position, 'an empty atom takes no space').to.equal('absolute');
    expect(Boolean(atom.isConnected), 'the empty atom keeps its place in the tree').to.equal(true);
    expect(Boolean(describedNode(el)), 'an empty atom describes nothing').to.equal(false);

    atom.textContent = 'Pick at least one.';
    await settle(el);

    expect(atom.hasAttribute('data-empty'), 'text clears the mark').to.equal(false);
    expect(getComputedStyle(atom).position, 'text gives the atom its place back').to.not.equal(
      'absolute',
    );
    expect(resolved(el, atom), 'the atom now describes the group').to.equal(true);
  });

  it('should keep the live region on an empty error atom', async () => {
    const el = await fixture<BkCheckboxGroup>(html`
      <bk-checkbox-group>
        <bk-field-label>Notifications</bk-field-label>
        <bk-field-error></bk-field-error>
      </bk-checkbox-group>
    `);
    await settle(el);
    const error = errorAtom(el)!;

    expect(error.getAttribute('role'), 'the live region exists before the error').to.equal(
      'status',
    );
    expect(error.hasAttribute('data-empty'), 'the empty error is marked').to.equal(true);
    expect(Boolean(error.id), 'the atom has an id').to.equal(true);
    expect(document.getElementById(error.id) === error, 'the id resolves while empty').to.equal(
      true,
    );
    expect(Boolean(describedNode(el)), 'an empty error describes nothing').to.equal(false);
  });

  it('should take back the role and the empty mark when an atom leaves the group', async () => {
    const el = await fixture<BkCheckboxGroup>(html`
      <bk-checkbox-group>
        <bk-field-label>Notifications</bk-field-label>
        <bk-field-description></bk-field-description>
        <bk-field-error>Pick two.</bk-field-error>
      </bk-checkbox-group>
    `);
    await settle(el);
    const description = descriptionAtom(el)!;
    const error = errorAtom(el)!;

    expect(resolved(el, error), 'the error atom describes the group').to.equal(true);
    expect(description.hasAttribute('data-empty'), 'the empty description is marked').to.equal(
      true,
    );

    error.remove();
    description.remove();
    await settle(el);

    expect(error.hasAttribute('role'), 'the live-region role was the group’s').to.equal(false);
    expect(description.hasAttribute('data-empty'), 'the empty mark was the group’s').to.equal(
      false,
    );
    expect(Boolean(error.id) && Boolean(description.id), 'the ids stay').to.equal(true);
    expect(Boolean(el.getAttribute('aria-describedby')), 'nothing describes the group').to.equal(
      false,
    );
  });

  it('should replace the description with the error visually and remove neither', async () => {
    const el = await fixture<BkCheckboxGroup>(html`
      <bk-checkbox-group>
        <bk-field-label>Notifications</bk-field-label>
        <bk-checkbox name="email"><bk-field-label slot="label">Email</bk-field-label></bk-checkbox>
        <bk-field-description>Pick at least one.</bk-field-description>
        <bk-field-error>Pick two.</bk-field-error>
      </bk-checkbox-group>
    `);
    await settle(el);
    const description = el.querySelector('bk-field-description') as HTMLElement;
    const error = el.querySelector('bk-field-error') as HTMLElement;

    expect(
      description.hasAttribute('hidden'),
      'the description is not shown while the error is',
    ).to.equal(true);
    expect(getComputedStyle(description).display, 'and takes no space').to.equal('none');
    expect(Boolean(description.isConnected), 'but it is not removed').to.equal(true);
    expect(error.hasAttribute('hidden'), 'the error is the one shown').to.equal(false);

    error.textContent = '';
    await settle(el);

    expect(
      description.hasAttribute('hidden'),
      'an empty error gives the description back',
    ).to.equal(false);
    expect(getComputedStyle(description).display).to.not.equal('none');
  });

  it('should flow the boxes in a column by default and in a row while horizontal', async () => {
    const el = await fixture<BkCheckboxGroup>(twoBoxes);
    await settle(el);
    const [first, second] = Array.from(el.querySelectorAll('bk-checkbox'));

    expect(el.getAttribute('orientation'), 'vertical is the default, reflected').to.equal(
      'vertical',
    );
    expect(getComputedStyle(boxesContainer(el)).flexDirection).to.equal('column');
    expect(
      first.getBoundingClientRect().top,
      'the boxes are stacked while vertical',
    ).to.be.lessThan(second.getBoundingClientRect().top);

    el.orientation = 'horizontal';
    await settle(el);

    expect(el.getAttribute('orientation')).to.equal('horizontal');
    expect(getComputedStyle(boxesContainer(el)).flexDirection).to.equal('row');
    expect(
      Math.abs(first.getBoundingClientRect().top - second.getBoundingClientRect().top),
      'the boxes sit on one row while horizontal',
    ).to.be.lessThan(2);
  });

  it('should paint its own label while invalid and write nothing on the boxes', async () => {
    const el = await fixture<BkCheckboxGroup>(twoBoxes);
    await settle(el);
    const label = el.querySelector<HTMLElement>(':scope > bk-field-label')!;
    const box = el.querySelector('bk-checkbox')!;
    const hosted = box.querySelector('bk-field-label')!;
    const before = boxAttributes(box);

    expect(atomState(label), 'a valid group paints no state').to.equal(null);
    expect(getComputedStyle(label).color).to.equal(await colorOf('var(--bk-text-default)'));

    el.invalid = true;
    await settle(el);

    expect(el.hasAttribute('invalid'), 'the attribute reflects the property').to.equal(true);
    expect(atomState(label), 'the group state reaches its own label').to.equal('invalid');
    expect(getComputedStyle(label).color).to.equal(await colorOf('var(--bk-text-danger)'));
    expect(box.getAttribute('aria-invalid'), 'no aria-invalid on a box').to.equal(null);
    expect(box.hasAttribute('invalid'), 'no invalid attribute on a box').to.equal(false);
    expect(atomState(hosted), 'the label a box hosts is the box’s').to.equal(null);
    expect(boxAttributes(box), 'no attribute written on a box').to.deep.equal(before);

    el.invalid = false;
    await settle(el);

    expect(atomState(label), 'the state leaves with the property').to.equal(null);
  });

  it('should expose neither required nor disabled', async () => {
    const el = await fixture<BkCheckboxGroup>(html`<bk-checkbox-group></bk-checkbox-group>`);

    expect('required' in el, 'the group cannot enforce required').to.equal(false);
    expect('disabled' in el, 'the group cannot honour disabled').to.equal(false);
  });

  it('should clear the name when the label atom is removed', async () => {
    const host = await fixture<HTMLElement>(html`
      <div>
        <bk-checkbox-group id="first">
          <bk-field-label>Notifications</bk-field-label>
          <bk-checkbox name="email"
            ><bk-field-label slot="label">Email</bk-field-label></bk-checkbox
          >
        </bk-checkbox-group>
        <bk-checkbox-group id="second"></bk-checkbox-group>
      </div>
    `);
    const first = host.querySelector<BkCheckboxGroup>('#first')!;
    const second = host.querySelector<BkCheckboxGroup>('#second')!;
    await settle(first);
    await settle(second);
    const label = first.querySelector<HTMLElement>(':scope > bk-field-label')!;

    expect(nameOf(first).length, 'the atom names its group').to.equal(1);

    second.append(label);
    await settle(first);
    await settle(second);

    expect(nameOf(first).length, 'the group the atom left is unnamed').to.equal(0);
    expect(nameOf(second).length, 'the group the atom joined is named by it').to.equal(1);

    label.remove();
    await settle(second);

    expect(nameOf(second).length, 'no atom, no name').to.equal(0);
    expect(first.getAttribute('role'), 'the host is still a group').to.equal('group');
  });
});
