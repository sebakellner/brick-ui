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
    description: '',
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

export const Basic: Story = {
  args: { checked: true },
};

export const Description: Story = {
  args: { description: 'By clicking this checkbox, you agree to the terms and conditions.' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Invalid: Story = {
  args: { error: 'You have to accept the terms.' },
};
