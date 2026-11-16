import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../bk-button/define.js';
import '../bk-field/define.js';
import './define.js';
import type { BkRadioGroupOrientation } from './bk-radio-group.js';

type Args = {
  label: string;
  description: string;
  error: string;
  value: string;
  orientation: BkRadioGroupOrientation;
  required: boolean;
  disabled: boolean;
};

const sizes = html`
  <bk-radio-group-item value="s">
    <bk-field-label slot="label">Small</bk-field-label>
  </bk-radio-group-item>
  <bk-radio-group-item value="m">
    <bk-field-label slot="label">Medium</bk-field-label>
  </bk-radio-group-item>
  <bk-radio-group-item value="l">
    <bk-field-label slot="label">Large</bk-field-label>
  </bk-radio-group-item>
`;

const meta: Meta<Args> = {
  title: 'Components/Radio group',
  component: 'bk-radio-group',
  args: {
    label: 'Size',
    description: '',
    error: '',
    value: '',
    orientation: 'vertical',
    required: false,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    value: { control: 'text' },
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  render: ({ label, description, error, value, orientation, required, disabled }) => html`
    <div style="width: 320px;">
      <bk-radio-group
        name="size"
        .value=${value}
        orientation=${orientation}
        ?required=${required}
        ?disabled=${disabled}
      >
        <bk-field-label>${label}</bk-field-label>
        ${sizes}
        ${description ? html`<bk-field-description>${description}</bk-field-description>` : ''}
        ${error ? html`<bk-field-error>${error}</bk-field-error>` : ''}
      </bk-radio-group>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Horizontal: Story = {
  args: { orientation: 'horizontal', value: 'm' },
};

export const Required: Story = {
  name: 'Required, blocked submit',
  args: { required: true },
  render: () => html`
    <form
      style="display: grid; gap: var(--bk-space-4); width: 320px;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <bk-radio-group name="size" required>
        <bk-field-label>Size</bk-field-label>
        ${sizes}
      </bk-radio-group>
      <bk-button type="submit">Submit</bk-button>
    </form>
  `,
};

export const DescriptionAndError: Story = {
  name: 'Description and error atom',
  args: {
    description: 'Pick the size you normally wear.',
    error: 'Pick a size.',
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'm', description: 'The set is disabled as a whole.' },
};

export const TheItem: Story = {
  name: 'The item: checked, disabled and resized',
  render: () => html`
    <div
      style="
        width: 320px;
        --bk-radio-group-item-size: calc(var(--bk-space-4) * 1.5);
        --bk-radio-group-item-radius: var(--bk-radius-sm);
      "
    >
      <bk-radio-group name="size">
        <bk-field-label>Size</bk-field-label>
        <bk-radio-group-item value="s">
          <bk-field-label slot="label">Small</bk-field-label>
        </bk-radio-group-item>
        <bk-radio-group-item value="m" checked>
          <bk-field-label slot="label">Medium</bk-field-label>
        </bk-radio-group-item>
        <bk-radio-group-item value="l" disabled>
          <bk-field-label slot="label">Large (sold out)</bk-field-label>
        </bk-radio-group-item>
      </bk-radio-group>
    </div>
  `,
};

const readout = (form: HTMLFormElement, prefix: string) => {
  const output = form.querySelector('output');
  if (!output) return;
  const entries = [...new FormData(form).entries()].map(
    ([key, value]) => `${key}=${String(value) || '(empty)'}`,
  );
  output.textContent = `${prefix}: ${entries.join(' · ') || 'no entries'}`;
};

export const InAForm: Story = {
  name: 'In a form: submit and reset',
  render: () => html`
    <form
      style="display: grid; gap: var(--bk-space-4); width: 320px;"
      @submit=${(event: Event) => {
        event.preventDefault();
        readout(event.currentTarget as HTMLFormElement, 'FormData after submit');
      }}
      @reset=${(event: Event) => {
        const form = event.currentTarget as HTMLFormElement;
        requestAnimationFrame(() => readout(form, 'FormData after reset'));
      }}
      @bk-change=${(event: CustomEvent<{ checked: boolean }>) => {
        readout(event.currentTarget as HTMLFormElement, 'bk-change');
      }}
    >
      <bk-radio-group name="size">
        <bk-field-label>Size</bk-field-label>
        <bk-radio-group-item value="s">
          <bk-field-label slot="label">Small</bk-field-label>
        </bk-radio-group-item>
        <bk-radio-group-item value="m" checked>
          <bk-field-label slot="label">Medium</bk-field-label>
        </bk-radio-group-item>
        <bk-radio-group-item value="l">
          <bk-field-label slot="label">Large</bk-field-label>
        </bk-radio-group-item>
      </bk-radio-group>
      <div style="display: flex; gap: var(--bk-space-3); align-items: center;">
        <bk-button type="submit">Submit</bk-button>
        <bk-button type="reset" variant="secondary">Reset</bk-button>
      </div>
      <output
        style="font: var(--bk-font-size-sm) var(--bk-font-sans); color: var(--bk-text-muted);"
      >
        Submit or reset to read FormData.
      </output>
    </form>
  `,
};
