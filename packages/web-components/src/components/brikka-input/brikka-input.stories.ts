import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import type { BrikkaInputMode, BrikkaInputType } from './brikka-input.js';
import '../brikka-button/define.js';
import '../brikka-field/define.js';
import './define.js';

type Args = {
  label: string;
  description: string;
  error: string;
  value: string;
  placeholder: string;
  name: string;
  type: BrikkaInputType;
  autocomplete: string;
  inputMode: BrikkaInputMode | '';
  disabled: boolean;
  required: boolean;
};

const parts = (label: string, description: string) => html`
  <brikka-field-label>${label}</brikka-field-label>
  ${description ? html`<brikka-field-description>${description}</brikka-field-description>` : ''}
`;

const meta: Meta<Args> = {
  title: 'Form/Input',
  component: 'brikka-input',
  args: {
    label: 'Username',
    description: 'This is the name other people see.',
    error: '',
    value: '',
    placeholder: '',
    name: 'username',
    type: 'text',
    autocomplete: 'username',
    inputMode: '',
    disabled: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    value: { control: 'text' },
    placeholder: { control: 'text' },
    name: { control: 'text' },
    type: { control: 'select', options: ['text', 'email', 'password', 'search', 'tel', 'url'] },
    autocomplete: { control: 'text' },
    inputMode: {
      control: 'select',
      options: ['', 'text', 'tel', 'url', 'email', 'numeric', 'decimal', 'search', 'none'],
    },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  render: ({
    label,
    description,
    error,
    value,
    placeholder,
    name,
    type,
    autocomplete,
    inputMode,
    disabled,
    required,
  }) => html`
    <div style="width: 320px;">
      <brikka-field>
        <brikka-input
          error=${error}
          value=${value}
          placeholder=${placeholder}
          name=${name}
          type=${type}
          autocomplete=${autocomplete}
          .inputMode=${inputMode}
          ?disabled=${disabled}
          ?required=${required}
        >
          ${parts(label, description)}
        </brikka-input>
      </brikka-field>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Basic: Story = {
  render: () => html`
    <div style="width: 320px;">
      <brikka-input name="email" type="email" placeholder="you@brikka.dev"></brikka-input>
    </div>
  `,
};

export const Field: Story = {};

export const Disabled: Story = {
  args: { disabled: true, value: 'you@brikka' },
};

export const Invalid: Story = {
  args: { error: 'That name is taken.', value: 'you@brikka' },
};

export const Required: Story = {
  args: { required: true },
};

export const Form: Story = {
  render: () => html`
    <form
      style="display: grid; gap: var(--brikka-space-4); width: 320px;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <brikka-field>
        <brikka-input name="username" autocomplete="username" required>
          <brikka-field-label>Username</brikka-field-label>
          <brikka-field-description>This is the name other people see.</brikka-field-description>
        </brikka-input>
      </brikka-field>
      <brikka-field>
        <brikka-input name="email" type="email" autocomplete="email" required>
          <brikka-field-label>Email</brikka-field-label>
          <brikka-field-description>We never share it.</brikka-field-description>
        </brikka-input>
      </brikka-field>
      <brikka-field>
        <brikka-input name="password" type="password" autocomplete="new-password" required>
          <brikka-field-label>Password</brikka-field-label>
          <brikka-field-description>At least 8 characters.</brikka-field-description>
        </brikka-input>
      </brikka-field>
      <div style="display: flex; gap: var(--brikka-space-3); align-items: center;">
        <brikka-button type="submit">Submit</brikka-button>
        <brikka-button type="reset" variant="secondary">Cancel</brikka-button>
      </div>
    </form>
  `,
};
