import { expect, fixture, html } from '@open-wc/testing';
import './define.js';
import '../bk-field/define.js';
import type { BkField } from '../bk-field/bk-field.js';
import type { BkCheckbox } from './bk-checkbox.js';
import { loadTheme } from '../../test/helpers/theme.js';

const innerInput = (el: BkCheckbox) => el.shadowRoot!.querySelector('input')!;
const innerLabel = (el: BkCheckbox) => el.shadowRoot!.querySelector('label');
const innerBox = (el: BkCheckbox) => el.shadowRoot!.querySelector<HTMLElement>('[part="box"]')!;

const slot = (el: BkCheckbox, name: string) =>
  el.shadowRoot!.querySelector(`slot[name="${name}"]`) as HTMLSlotElement | null;

const assigned = (el: BkCheckbox, name: string) =>
  slot(el, name)!.assignedElements({ flatten: true });

const slotted = (el: BkCheckbox, name: string) =>
  assigned(el, name).map((node) => node.textContent!.trim());

const region = (el: BkCheckbox, part: string) =>
  el.shadowRoot!.querySelector(`[part="${part}"]`) as HTMLElement | null;

const describedNode = (el: BkCheckbox) => {
  const id = innerInput(el).getAttribute('aria-describedby');
  return id ? el.shadowRoot!.getElementById(id) : null;
};

const projectedText = (node: Element | null) =>
  Array.from(node?.querySelectorAll('slot') ?? [])
    .flatMap((entry) => entry.assignedNodes({ flatten: true }))
    .map((assignedText) => assignedText.textContent!.trim())
    .filter(Boolean);

const describedText = (el: BkCheckbox) => {
  const text = describedNode(el)?.textContent!.trim();
  return text ? [text] : [];
};

const settle = async (el: BkField) => {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
};

describe('bk-checkbox composed field parts', () => {
  before(loadTheme);

  it('should take a slotted label as the control label', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-checkbox name="terms">
          <bk-field-label>Accept the terms</bk-field-label>
        </bk-checkbox>
      </bk-field>
    `);
    await settle(el);
    const checkbox = el.querySelector('bk-checkbox') as BkCheckbox;

    expect(innerLabel(checkbox), 'the control renders a label').to.not.equal(null);
    expect(innerLabel(checkbox)!.htmlFor, 'the label points at the inner control').to.equal(
      innerInput(checkbox).id,
    );
    expect(
      innerLabel(checkbox)!.querySelector('slot[name="label"]'),
      'the label slot lives inside the label, so the association stays implicit',
    ).to.not.equal(null);
    expect(assigned(checkbox, 'label')[0].localName, 'the consumer node is the atom').to.equal(
      'bk-field-label',
    );
    expect(slotted(checkbox, 'label'), 'the label content is the consumer node').to.deep.equal([
      'Accept the terms',
    ]);
  });

  it('should keep the label inline beside the box and the description under it', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-checkbox name="terms">
          <bk-field-label>Accept the terms</bk-field-label>
          <bk-field-description>You can change this later.</bk-field-description>
        </bk-checkbox>
      </bk-field>
    `);
    await settle(el);
    const checkbox = el.querySelector('bk-checkbox') as BkCheckbox;

    const box = innerBox(checkbox).getBoundingClientRect();
    const label = assigned(checkbox, 'label')[0].getBoundingClientRect();
    const description = region(checkbox, 'description')!.getBoundingClientRect();
    const middle = (rect: DOMRect) => rect.top + rect.height / 2;

    expect(
      Math.abs(middle(label) - middle(box)),
      'the label sits on the row of the box, not above it',
    ).to.be.lessThan(4);
    expect(label.left, 'the label sits to the box, not over it').to.be.greaterThan(box.right);
    expect(description.top, 'the description sits under the label row').to.be.greaterThan(
      label.bottom,
    );
    expect(
      innerLabel(checkbox)!.querySelector('[part="description"]'),
      'the description is outside the label, so it never joins the name',
    ).to.equal(null);
  });

  it('should describe the control with a slotted description', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-checkbox name="terms">
          <bk-field-label>Accept the terms</bk-field-label>
          <bk-field-description>You can change this later.</bk-field-description>
        </bk-checkbox>
      </bk-field>
    `);
    await settle(el);
    const checkbox = el.querySelector('bk-checkbox') as BkCheckbox;

    expect(describedNode(checkbox), 'the description region is the description').to.equal(
      region(checkbox, 'description'),
    );
    expect(
      projectedText(describedNode(checkbox)),
      'the region projects the consumer node',
    ).to.deep.equal(['You can change this later.']);
  });

  it('should reference no description while there is no content', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-checkbox name="terms"><bk-field-label>Accept the terms</bk-field-label></bk-checkbox>
      </bk-field>
    `);
    await settle(el);
    const checkbox = el.querySelector('bk-checkbox') as BkCheckbox;

    expect(innerInput(checkbox).getAttribute('aria-describedby')).to.equal(null);
  });

  it('should keep the message region in the tree while it is empty', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-checkbox name="terms"><bk-field-label>Accept the terms</bk-field-label></bk-checkbox>
      </bk-field>
    `);
    await settle(el);
    const checkbox = el.querySelector('bk-checkbox') as BkCheckbox;

    expect(region(checkbox, 'message'), 'the region stays').to.not.equal(null);
    expect(
      region(checkbox, 'error')!.getAttribute('role'),
      'the live region keeps its role while it is empty',
    ).to.equal('status');
  });

  it('should prefer a slotted error over a slotted description', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-checkbox name="terms">
          <bk-field-label>Accept the terms</bk-field-label>
          <bk-field-description>You can change this later.</bk-field-description>
          <bk-field-error>You have to accept the terms.</bk-field-error>
        </bk-checkbox>
      </bk-field>
    `);
    await settle(el);
    const checkbox = el.querySelector('bk-checkbox') as BkCheckbox;

    expect(describedNode(checkbox), 'the error region is the description').to.equal(
      region(checkbox, 'error'),
    );
    expect(
      projectedText(describedNode(checkbox)),
      'the error replaces the description',
    ).to.deep.equal(['You have to accept the terms.']);
    expect(
      region(checkbox, 'description')!.hasAttribute('hidden'),
      'the description is not rendered while the error is',
    ).to.equal(true);
    expect(region(checkbox, 'description'), 'the description keeps its part').to.not.equal(null);
    expect(region(checkbox, 'error'), 'the error keeps its part').to.not.equal(null);
  });

  it('should keep label and helper working as fallback content', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-checkbox name="terms" label="Accept the terms" helper="You can change this later.">
        </bk-checkbox>
      </bk-field>
    `);
    await settle(el);
    const checkbox = el.querySelector('bk-checkbox') as BkCheckbox;

    expect(
      innerLabel(checkbox)!.textContent!.trim(),
      'the property still names the field',
    ).to.equal('Accept the terms');
    expect(describedText(checkbox)).to.deep.equal(['You can change this later.']);
  });

  it('should follow a description added after connect', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-checkbox name="terms"><bk-field-label>Accept the terms</bk-field-label></bk-checkbox>
      </bk-field>
    `);
    await settle(el);
    const checkbox = el.querySelector('bk-checkbox') as BkCheckbox;
    expect(innerInput(checkbox).getAttribute('aria-describedby')).to.equal(null);

    const description = document.createElement('bk-field-description');
    description.textContent = 'Added later.';
    checkbox.append(description);
    await settle(el);

    expect(describedNode(checkbox), 'the description region is the description').to.equal(
      region(checkbox, 'description'),
    );
    expect(projectedText(describedNode(checkbox))).to.deep.equal(['Added later.']);
  });
});
