import { expect, fixture, html } from '@open-wc/testing';
import './define.js';
import '../bk-field/define.js';
import type { BkField } from '../bk-field/bk-field.js';
import type { BkInput } from './bk-input.js';
import { loadTheme } from '../../test/helpers/theme.js';

const innerInput = (el: BkInput) => el.shadowRoot!.querySelector('input')!;
const innerLabel = (el: BkInput) => el.shadowRoot!.querySelector('label');

const slot = (el: BkInput, name: string) =>
  el.shadowRoot!.querySelector(`slot[name="${name}"]`) as HTMLSlotElement | null;

const slotted = (el: BkInput, name: string) =>
  slot(el, name)!
    .assignedElements({ flatten: true })
    .map((node) => node.textContent!.trim());

const region = (el: BkInput, part: string) =>
  el.shadowRoot!.querySelector(`[part="${part}"]`) as HTMLElement | null;

const describedNode = (el: BkInput) => {
  const id = innerInput(el).getAttribute('aria-describedby');
  return id ? el.shadowRoot!.getElementById(id) : null;
};

const projectedText = (node: Element | null) =>
  Array.from(node?.querySelectorAll('slot') ?? [])
    .flatMap((entry) => entry.assignedNodes({ flatten: true }))
    .map((assigned) => assigned.textContent!.trim())
    .filter(Boolean);

const describedText = (el: BkInput) => {
  const text = describedNode(el)?.textContent!.trim();
  return text ? [text] : [];
};

const settle = async (el: BkField) => {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
};

describe('bk-input composed field parts', () => {
  before(loadTheme);

  it('should take a slotted label as the control label', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-input name="email"><bk-field-label>Email</bk-field-label></bk-input>
      </bk-field>
    `);
    await settle(el);
    const input = el.querySelector('bk-input') as BkInput;

    expect(innerLabel(input), 'the control renders a label').to.not.equal(null);
    expect(innerLabel(input)!.htmlFor, 'the label points at the inner control').to.equal(
      innerInput(input).id,
    );
    expect(slotted(input, 'label'), 'the label content is the consumer node').to.deep.equal([
      'Email',
    ]);
  });

  it('should describe the control with a slotted description', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-input name="email" label="Email">
          <bk-field-description>We only use it for the receipt.</bk-field-description>
        </bk-input>
      </bk-field>
    `);
    await settle(el);
    const input = el.querySelector('bk-input') as BkInput;

    expect(describedNode(input), 'the description region is the description').to.equal(
      region(input, 'description'),
    );
    expect(
      projectedText(describedNode(input)),
      'the region projects the consumer node',
    ).to.deep.equal(['We only use it for the receipt.']);
  });

  it('should reference no description while there is no content', async () => {
    const el = await fixture<BkField>(html`
      <bk-field><bk-input name="email" label="Email"></bk-input></bk-field>
    `);
    await settle(el);
    const input = el.querySelector('bk-input') as BkInput;

    expect(innerInput(input).getAttribute('aria-describedby')).to.equal(null);
  });

  it('should keep the message region in the tree while it is empty', async () => {
    const el = await fixture<BkField>(html`
      <bk-field><bk-input name="email" label="Email"></bk-input></bk-field>
    `);
    await settle(el);
    const input = el.querySelector('bk-input') as BkInput;

    expect(input.shadowRoot!.querySelector('[part="message"]'), 'the region stays').to.not.equal(
      null,
    );
  });

  it('should prefer a slotted error over a slotted description', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-input name="email" label="Email">
          <bk-field-description>We only use it for the receipt.</bk-field-description>
          <bk-field-error>Enter a valid address.</bk-field-error>
        </bk-input>
      </bk-field>
    `);
    await settle(el);
    const input = el.querySelector('bk-input') as BkInput;

    expect(describedNode(input), 'the error region is the description').to.equal(
      region(input, 'error'),
    );
    expect(projectedText(describedNode(input)), 'the error replaces the description').to.deep.equal(
      ['Enter a valid address.'],
    );
    expect(
      region(input, 'description')!.hasAttribute('hidden'),
      'the description is not rendered while the error is',
    ).to.equal(true);
    expect(region(input, 'description'), 'the description keeps its part').to.not.equal(null);
  });

  it('should keep label and helper working as fallback content', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-input name="email" label="Email" helper="Only for receipts"></bk-input>
      </bk-field>
    `);
    await settle(el);
    const input = el.querySelector('bk-input') as BkInput;

    expect(innerLabel(input)!.textContent!.trim(), 'the property still names the field').to.equal(
      'Email',
    );
    expect(describedText(input)).to.deep.equal(['Only for receipts']);
  });

  it('should follow a description added after connect', async () => {
    const el = await fixture<BkField>(html`
      <bk-field><bk-input name="email" label="Email"></bk-input></bk-field>
    `);
    await settle(el);
    const input = el.querySelector('bk-input') as BkInput;
    expect(innerInput(input).getAttribute('aria-describedby')).to.equal(null);

    const description = document.createElement('bk-field-description');
    description.textContent = 'Added later.';
    input.append(description);
    await settle(el);

    expect(describedNode(input), 'the description region is the description').to.equal(
      region(input, 'description'),
    );
    expect(projectedText(describedNode(input))).to.deep.equal(['Added later.']);
  });
});
