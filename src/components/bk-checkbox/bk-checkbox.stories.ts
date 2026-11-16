import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../bk-field/define.js';
import './define.js';

type Args = {
  label: string;
  description: string;
  error: string;
  checked: boolean;
  value: string;
  name: string;
  disabled: boolean;
  required: boolean;
};

const parts = (label: string, description: string) => html`
  <bk-field-label>${label}</bk-field-label>
  ${description ? html`<bk-field-description>${description}</bk-field-description>` : ''}
`;

const meta: Meta<Args> = {
  title: 'Form/Checkbox',
  component: 'bk-checkbox',
  args: {
    label: 'Accept the terms',
    description: 'You can change this later.',
    error: '',
    checked: false,
    value: '',
    name: 'terms',
    disabled: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    checked: { control: 'boolean' },
    value: { control: 'text' },
    name: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  render: ({ label, description, error, checked, value, name, disabled, required }) => html`
    <bk-field>
      <bk-checkbox
        error=${error}
        value=${value}
        name=${name}
        .checked=${checked}
        ?disabled=${disabled}
        ?required=${required}
      >
        ${parts(label, description)}
      </bk-checkbox>
    </bk-field>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Checked: Story = {
  args: { checked: true, description: '' },
};

export const States: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 20px; width: 320px;">
      <bk-field>
        <bk-checkbox name="terms">
          <bk-field-label>Accept the terms</bk-field-label>
        </bk-checkbox>
      </bk-field>
      <bk-field>
        <bk-checkbox name="terms" checked>
          <bk-field-label>Accept the terms</bk-field-label>
          <bk-field-description>You can change this later.</bk-field-description>
        </bk-checkbox>
      </bk-field>
      <bk-field>
        <bk-checkbox name="terms" error="You have to accept the terms.">
          <bk-field-label>Accept the terms</bk-field-label>
        </bk-checkbox>
      </bk-field>
      <bk-field>
        <bk-checkbox name="terms" disabled>
          <bk-field-label>Accept the terms</bk-field-label>
        </bk-checkbox>
      </bk-field>
      <bk-field>
        <bk-checkbox name="terms" checked disabled>
          <bk-field-label>Accept the terms</bk-field-label>
        </bk-checkbox>
      </bk-field>
    </div>
  `,
};

export const Required: Story = {
  args: { required: true, description: '', label: 'Accept the terms to continue' },
};

export const Mixed: Story = {
  render: () => html`
    <bk-field>
      <bk-checkbox name="all" indeterminate>
        <bk-field-label>Select all</bk-field-label>
        <bk-field-description>The selection is partly made.</bk-field-description>
      </bk-checkbox>
    </bk-field>
  `,
};
