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
  title: 'Form/Switch',
  component: 'bk-switch',
  args: {
    label: 'Wi-Fi',
    description: '',
    error: '',
    checked: false,
    value: '',
    name: 'wifi',
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
      <bk-switch
        error=${error}
        value=${value}
        name=${name}
        .checked=${checked}
        ?disabled=${disabled}
        ?required=${required}
      >
        ${parts(label, description)}
      </bk-switch>
    </bk-field>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Basic: Story = {
  args: { checked: true },
};

export const Description: Story = {
  args: { description: 'The radio stays on while you are signed in.' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Invalid: Story = {
  args: { error: 'Turn this on to continue.' },
};
