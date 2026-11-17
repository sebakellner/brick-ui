import { settle } from '../../../test/helpers/settle.js';
import { colorOf, opacityOf } from '../../../test/helpers/style.js';
import { describedNode, region } from '../../../test/helpers/dom.js';
import { watchSubmit } from '../../../test/helpers/form.js';
import { expect, fixture, html } from '@open-wc/testing';
import '.././define.js';
import '../../bk-checkbox/define.js';
import '../../bk-field/define.js';
import type { BkCheckbox } from '../../bk-checkbox/bk-checkbox.js';
import type { BkCheckboxGroup } from '.././bk-checkbox-group.js';
import { setTheme } from '../../../test/helpers/theme.js';
import { expectNoViolations, expectRendered } from '../../../test/helpers/a11y.js';

const boxesContainer = (el: BkCheckboxGroup) => region(el, 'boxes')!;

const descriptionAtom = (el: BkCheckboxGroup) =>
  el.querySelector<HTMLElement>(':scope > bk-field-description');

const errorAtom = (el: BkCheckboxGroup) => el.querySelector<HTMLElement>(':scope > bk-field-error');

const resolved = (el: BkCheckboxGroup, atom: Element | null) => describedNode(el) === atom;

const nameOf = (el: BkCheckboxGroup) => Array.from(el.ariaLabelledByElements ?? []);

const atomState = (atom: Element | null) => atom?.getAttribute('data-state') ?? null;

const boxAttributes = (box: Element) =>
  Array.from(box.attributes)
    .map((one) => one.name)
    .sort();

const boxesOf = (el: BkCheckboxGroup) => Array.from(el.querySelectorAll<BkCheckbox>('bk-checkbox'));

const inputOf = (box: BkCheckbox) => box.shadowRoot!.querySelector('input')!;

/* The group writes on the boxes, so their own update has to commit too. */
const settleBoxes = async (el: BkCheckboxGroup) => {
  await settle(el);
  for (const box of boxesOf(el)) await box.updateComplete;
  await settle(el);
};

/* A real activation: the platform's click on the inner input, which is what
 * makes a box emit `bk-change`. Nothing is written by hand. */
const toggle = async (el: BkCheckboxGroup, box: BkCheckbox) => {
  inputOf(box).click();
  await settleBoxes(el);
};

const requiredForm = html`
  <form>
    <bk-checkbox-group name="channels" required>
      <bk-field-label>Notifications</bk-field-label>
      <bk-checkbox name="email" value="email"
        ><bk-field-label slot="label">Email</bk-field-label></bk-checkbox
      >
      <bk-checkbox name="sms" value="sms"
        ><bk-field-label slot="label">SMS</bk-field-label></bk-checkbox
      >
    </bk-checkbox-group>
  </form>
`;

const twoBoxes = html`
  <bk-checkbox-group>
    <bk-field-label>Notifications</bk-field-label>
    <bk-checkbox name="email"><bk-field-label slot="label">Email</bk-field-label></bk-checkbox>
    <bk-checkbox name="sms"><bk-field-label slot="label">SMS</bk-field-label></bk-checkbox>
  </bk-checkbox-group>
`;

describe('bk-checkbox-group', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkCheckboxGroup>(html`
          <bk-checkbox-group>
            <bk-field-label slot="label">Channels</bk-field-label>
            <bk-checkbox name="email" value="email"
              ><bk-field-label slot="label">Email</bk-field-label></bk-checkbox
            >
            <bk-checkbox name="sms" value="sms"
              ><bk-field-label slot="label">SMS</bk-field-label></bk-checkbox
            >
          </bk-checkbox-group>
        `);

        await expectRendered(el, '[part="boxes"]');
        await expectNoViolations(el);
      });
    }
  });
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

  it('should report valueMissing while required has nothing checked, and block the submit', async () => {
    const form = await fixture<HTMLFormElement>(requiredForm);
    const el = form.querySelector<BkCheckboxGroup>('bk-checkbox-group')!;
    await settle(el);
    const watch = watchSubmit(form);

    expect(el.validity.valueMissing, 'nothing checked is a missing answer').to.equal(true);
    expect(el.validity.valid).to.equal(false);
    expect(form.checkValidity()).to.equal(false);

    form.requestSubmit();
    await settle(el);

    expect(watch.count, 'the submit never runs').to.equal(0);
    expect(watch.invalidOrder[0] === el, 'the group is what the submit rejected').to.equal(true);
    expect(el.validationMessage, 'the fixed English default').to.equal(
      'Please select at least one option.',
    );
  });

  it('should mark its label with a star while required', async () => {
    const el = await fixture<BkCheckboxGroup>(html`
      <bk-checkbox-group required>
        <bk-field-label>Notifications</bk-field-label>
        <bk-checkbox name="email" value="email"
          ><bk-field-label slot="label">Email</bk-field-label></bk-checkbox
        >
      </bk-checkbox-group>
    `);
    await settleBoxes(el);
    const mark = region(el, 'required');

    expect(Boolean(mark), 'a required group marks its label').to.equal(true);
    expect(mark!.textContent, 'the mark is a star').to.equal('*');
    expect(mark!.getAttribute('aria-hidden'), 'and decoration for the eye').to.equal('true');
    expect(getComputedStyle(mark!).color, 'painted with the danger role').to.equal(
      await colorOf('var(--bk-text-danger)'),
    );

    const optional = await fixture<BkCheckboxGroup>(twoBoxes);
    await settle(optional);

    expect(Boolean(region(optional, 'required')), 'an optional group marks nothing').to.equal(
      false,
    );
  });

  it('should submit nothing while its value is assigned', async () => {
    const form = await fixture<HTMLFormElement>(requiredForm);
    const el = form.querySelector('bk-checkbox-group') as BkCheckboxGroup;
    await settle(el);

    el.value = 'channels';
    await settle(el);

    const data = new FormData(form);

    expect(el.submittedValue === null, 'the group has no value of its own').to.equal(true);
    expect(data.has('channels'), 'the assigned value adds no entry to the form data').to.equal(
      false,
    );
  });

  it('should clear valueMissing as soon as one box is checked, with no manual call', async () => {
    const form = await fixture<HTMLFormElement>(requiredForm);
    const el = form.querySelector<BkCheckboxGroup>('bk-checkbox-group')!;
    await settle(el);
    const [email] = boxesOf(el);

    expect(el.validity.valueMissing).to.equal(true);

    await toggle(el, email);

    expect(email.checked, 'the box took the click').to.equal(true);
    expect(el.validity.valueMissing, 'the constraint follows the box').to.equal(false);
    expect(form.checkValidity(), 'the form now validates').to.equal(true);
  });

  it('should bring valueMissing back when the last checked box is unchecked', async () => {
    const form = await fixture<HTMLFormElement>(requiredForm);
    const el = form.querySelector<BkCheckboxGroup>('bk-checkbox-group')!;
    await settle(el);
    const [email, sms] = boxesOf(el);

    await toggle(el, email);
    expect(el.validity.valueMissing).to.equal(false);

    await toggle(el, email);

    expect(email.checked).to.equal(false);
    expect(el.validity.valueMissing, 'the last box left, so the answer is missing again').to.equal(
      true,
    );
    expect(form.checkValidity()).to.equal(false);

    await toggle(el, sms);

    expect(el.validity.valueMissing, 'another box carries the answer').to.equal(false);
  });

  it('should submit the boxes and no entry of its own', async () => {
    const form = await fixture<HTMLFormElement>(requiredForm);
    const el = form.querySelector<BkCheckboxGroup>('bk-checkbox-group')!;
    await settle(el);
    const [email, sms] = boxesOf(el);

    expect(
      new FormData(form).get('channels'),
      'a group with nothing checked submits nothing',
    ).to.equal(null);

    await toggle(el, email);

    const data = new FormData(form);

    expect(data.get('email'), 'the box submits its own value').to.equal('email');
    expect(data.get('sms'), 'an unchecked box submits nothing').to.equal(null);
    expect(data.get('channels'), 'the group is a constraint, not a payload entry').to.equal(null);
    expect(data.getAll('channels').length, 'not even an empty one').to.equal(0);

    await toggle(el, sms);

    expect(new FormData(form).get('sms')).to.equal('sms');
    expect(
      new FormData(form).getAll('channels').length,
      'two boxes checked still make no group entry',
    ).to.equal(0);
  });

  it('should report the consumer error atom as its message, and the fixed default without one', async () => {
    const form = await fixture<HTMLFormElement>(requiredForm);
    const el = form.querySelector<BkCheckboxGroup>('bk-checkbox-group')!;
    await settle(el);

    expect(el.validationMessage, 'no atom and no error: the fixed default').to.equal(
      'Please select at least one option.',
    );

    const error = document.createElement('bk-field-error');
    error.textContent = 'Pick at least one channel.';
    el.append(error);
    await settle(el);

    expect(el.validity.valueMissing, 'the constraint is still the missing answer').to.equal(true);
    expect(el.validationMessage, 'the atom text is the message').to.equal(
      'Pick at least one channel.',
    );

    error.remove();
    el.error = 'Pick one.';
    await settle(el);

    expect(el.validationMessage, 'the property is the message while no atom is').to.equal(
      'Pick one.',
    );

    el.error = '';
    await settle(el);

    expect(el.validationMessage, 'and the default is back').to.equal(
      'Please select at least one option.',
    );
  });

  it('should disable every box it owns and give back only what it wrote', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox-group name="channels">
          <bk-field-label>Notifications</bk-field-label>
          <bk-checkbox name="email" value="email"
            ><bk-field-label slot="label">Email</bk-field-label></bk-checkbox
          >
          <bk-checkbox name="sms" value="sms" disabled
            ><bk-field-label slot="label">SMS</bk-field-label></bk-checkbox
          >
        </bk-checkbox-group>
      </form>
    `);
    const el = form.querySelector<BkCheckboxGroup>('bk-checkbox-group')!;
    await settleBoxes(el);
    const [email, sms] = boxesOf(el);
    const row = el.shadowRoot!.querySelector<HTMLElement>('[part="label"]')!;

    expect(email.disabled).to.equal(false);
    expect(sms.disabled, 'a box disabled in its markup').to.equal(true);
    expect(getComputedStyle(row).opacity, 'an enabled group paints its row fully').to.equal('1');

    el.disabled = true;
    await settleBoxes(el);

    expect(el.hasAttribute('disabled'), 'the attribute reflects').to.equal(true);
    expect(
      boxesOf(el).every((box) => box.disabled),
      'every box the group owns is disabled',
    ).to.equal(true);
    expect(inputOf(email).getAttribute('aria-disabled'), 'and announces it').to.equal('true');
    expect(getComputedStyle(row).opacity, 'the group label dims with the primitive').to.equal(
      await opacityOf('var(--bk-opacity-disabled)'),
    );

    inputOf(email).click();
    await settleBoxes(el);

    expect(email.checked, 'a disabled group leaves its boxes inert').to.equal(false);

    el.disabled = false;
    await settleBoxes(el);

    expect(email.disabled, 'the group gives back what it took').to.equal(false);
    expect(sms.disabled, 'a box disabled on its own stays disabled').to.equal(true);

    inputOf(email).click();
    await settleBoxes(el);

    expect(email.checked, 'and the box responds again').to.equal(true);

    const fieldset = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset disabled>
          <bk-checkbox-group name="channels" required>
            <bk-field-label>Notifications</bk-field-label>
            <bk-checkbox name="email" value="email"
              ><bk-field-label slot="label">Email</bk-field-label></bk-checkbox
            >
          </bk-checkbox-group>
        </fieldset>
      </form>
    `);
    const inherited = fieldset.querySelector<BkCheckboxGroup>('bk-checkbox-group')!;
    await settleBoxes(inherited);

    expect(inherited.fieldDisabled, 'a disabled fieldset reaches the group').to.equal(true);
    expect(boxesOf(inherited)[0].disabled, 'and flows on to the boxes the group owns').to.equal(
      true,
    );
    expect(inherited.validity.valueMissing, 'a disabled group reports no error').to.equal(false);
  });

  it('should write nothing on the boxes but disabled', async () => {
    const el = await fixture<BkCheckboxGroup>(html`
      <bk-checkbox-group required>
        <bk-field-label>Notifications</bk-field-label>
        <bk-checkbox name="email" value="email"
          ><bk-field-label slot="label">Email</bk-field-label></bk-checkbox
        >
        <bk-checkbox name="sms" value="sms"
          ><bk-field-label slot="label">SMS</bk-field-label></bk-checkbox
        >
      </bk-checkbox-group>
    `);
    await settleBoxes(el);
    const [email] = boxesOf(el);
    const before = boxAttributes(email);

    expect(el.validity.valueMissing, 'the constraint is on the group').to.equal(true);
    expect(
      email.hasAttribute('required'),
      'the group never marks a box required: the constraint is its own',
    ).to.equal(false);
    expect(email.hasAttribute('aria-invalid')).to.equal(false);
    expect(boxAttributes(email), 'a missing answer writes nothing on a box').to.deep.equal(before);

    await toggle(el, email);

    expect(email.checked).to.equal(true);
    expect(
      boxAttributes(email),
      'nor with an answer: no required, no aria-invalid on a box',
    ).to.deep.equal(before);

    el.invalid = true;
    el.error = 'Pick one.';
    await settleBoxes(el);

    expect(boxAttributes(email), 'the group paints its own label, never a box').to.deep.equal(
      before,
    );

    el.disabled = true;
    await settleBoxes(el);

    expect(boxAttributes(email), 'disabled is the only attribute the group writes').to.deep.equal(
      [...before, 'disabled'].sort(),
    );
  });

  it('should leave a nested group’s label to that group', async () => {
    const el = await fixture<BkCheckboxGroup>(html`
      <bk-checkbox-group>
        <bk-checkbox-group>
          <bk-field-label>Inner</bk-field-label>
          <bk-checkbox name="inner"
            ><bk-field-label slot="label">Inner box</bk-field-label></bk-checkbox
          >
        </bk-checkbox-group>
      </bk-checkbox-group>
    `);
    const inner = el.querySelector<BkCheckboxGroup>('bk-checkbox-group')!;
    await settle(el);
    await settle(inner);
    await settle(el);
    const label = inner.querySelector<HTMLElement>(':scope > bk-field-label')!;

    expect(nameOf(el).length, 'the inner label does not name the outer group').to.equal(0);
    expect(nameOf(inner).length, 'the inner label names the inner group').to.equal(1);
    expect(nameOf(inner)[0] === label, 'by the consumer atom itself').to.equal(true);
  });

  it('should not describe itself with a nested group’s description', async () => {
    const el = await fixture<BkCheckboxGroup>(html`
      <bk-checkbox-group>
        <bk-field-error></bk-field-error>
        <bk-checkbox-group>
          <bk-field-label>Inner</bk-field-label>
          <bk-field-description>Inner only.</bk-field-description>
          <bk-checkbox name="inner"
            ><bk-field-label slot="label">Inner box</bk-field-label></bk-checkbox
          >
        </bk-checkbox-group>
      </bk-checkbox-group>
    `);
    const inner = el.querySelector<BkCheckboxGroup>('bk-checkbox-group')!;
    await settle(el);
    await settle(inner);
    await settle(el);
    const ownError = el.querySelector<HTMLElement>(':scope > bk-field-error')!;
    const description = inner.querySelector<HTMLElement>(':scope > bk-field-description')!;
    const ownPrefix = ownError.id.replace(/-error$/, '');

    expect(
      Boolean(el.getAttribute('aria-describedby')),
      'the outer group has no region of its own, so nothing describes it',
    ).to.equal(false);
    expect(describedNode(inner) === description, 'the inner group points at its own atom').to.equal(
      true,
    );
    expect(
      description.id === `${ownPrefix}-description`,
      'the outer group did not adopt the inner atom',
    ).to.equal(false);
    expect(
      description.hasAttribute('data-empty'),
      'the atom has text and nobody marked it empty',
    ).to.equal(false);
  });

  it('should keep a required group valueMissing while its only box is mixed', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox-group name="channels" required>
          <bk-field-label>Notifications</bk-field-label>
          <bk-checkbox name="email" value="email" checked indeterminate
            ><bk-field-label slot="label">Email</bk-field-label></bk-checkbox
          >
        </bk-checkbox-group>
      </form>
    `);
    const el = form.querySelector<BkCheckboxGroup>('bk-checkbox-group')!;
    await settleBoxes(el);
    const [email] = boxesOf(el);
    const watch = watchSubmit(form);

    expect(email.checked, 'the box is checked').to.equal(true);
    expect(email.indeterminate, 'and mixed').to.equal(true);
    expect(
      el.validity.valueMissing,
      'a mixed box submits no value, so the set has no answer',
    ).to.equal(true);
    expect(el.validity.valid).to.equal(false);
    expect(form.checkValidity()).to.equal(false);

    form.requestSubmit();
    await settleBoxes(el);

    expect(watch.count, 'the submit never runs').to.equal(0);
    expect(watch.invalidOrder[0] === el, 'the group is what the submit rejected').to.equal(true);
    expect(new FormData(form).get('email'), 'the mixed box submitted nothing').to.equal(null);

    await toggle(el, email);

    expect(email.indeterminate, 'the real activation resolved the mixed state').to.equal(false);
    expect(email.checked, 'the click toggled the box checkedness, so it is unchecked now').to.equal(
      false,
    );
    expect(el.validity.valueMissing, 'a resolved but unchecked box is still no answer').to.equal(
      true,
    );

    await toggle(el, email);

    expect(email.checked, 'the second activation checks the box for real').to.equal(true);
    expect(el.validity.valueMissing, 'a checked box is the answer').to.equal(false);
    expect(form.checkValidity(), 'the form now validates').to.equal(true);
    expect(new FormData(form).get('email')).to.equal('email');
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

  it('should treat a nested group as its own widget and leave it alone', async () => {
    const el = await fixture<BkCheckboxGroup>(html`
      <bk-checkbox-group name="outer" disabled>
        <bk-field-label>Channels</bk-field-label>
        <bk-checkbox name="email" value="email"
          ><bk-field-label slot="label">Email</bk-field-label></bk-checkbox
        >
        <bk-checkbox-group name="inner">
          <bk-field-label>Frequency</bk-field-label>
          <bk-checkbox name="daily" value="daily"
            ><bk-field-label slot="label">Daily</bk-field-label></bk-checkbox
          >
        </bk-checkbox-group>
      </bk-checkbox-group>
    `);
    await settleBoxes(el);
    const inner = el.querySelector<BkCheckboxGroup>('bk-checkbox-group')!;
    await settleBoxes(inner);

    expect(boxesOf(el)[0].disabled, 'the outer group disables the boxes it owns').to.equal(true);
    expect(inner.disabled, 'the inner group is a widget of its own').to.equal(false);
    expect(
      boxesOf(inner)[0].disabled,
      'and its boxes keep responding, which is what they look like',
    ).to.equal(false);
  });
});
