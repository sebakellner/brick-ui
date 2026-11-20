import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import type { BkInputMode, BkInputType } from './bk-input.js';
import '../bk-button/define.js';
import '../bk-field/define.js';
import './define.js';

type Args = {
  label: string;
  description: string;
  error: string;
  value: string;
  placeholder: string;
  name: string;
  type: BkInputType;
  autocomplete: string;
  inputMode: BkInputMode | '';
  disabled: boolean;
  required: boolean;
};

const parts = (label: string, description: string) => html`
  <bk-field-label>${label}</bk-field-label>
  ${description ? html`<bk-field-description>${description}</bk-field-description>` : ''}
`;

const meta: Meta<Args> = {
  title: 'Form/Input',
  component: 'bk-input',
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
      <bk-field>
        <bk-input
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
        </bk-input>
      </bk-field>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Basic: Story = {
  render: () => html`
    <div style="width: 320px;">
      <bk-input name="email" type="email" placeholder="you@brick.dev"></bk-input>
    </div>
  `,
};

export const Field: Story = {};

export const Disabled: Story = {
  args: { disabled: true, value: 'you@brick' },
};

export const Invalid: Story = {
  args: { error: 'That name is taken.', value: 'you@brick' },
};

export const Required: Story = {
  args: { required: true },
};

export const Form: Story = {
  render: () => html`
    <form
      style="display: grid; gap: var(--bk-space-4); width: 320px;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <bk-field>
        <bk-input name="username" autocomplete="username" required>
          <bk-field-label>Username</bk-field-label>
          <bk-field-description>This is the name other people see.</bk-field-description>
        </bk-input>
      </bk-field>
      <bk-field>
        <bk-input name="email" type="email" autocomplete="email" required>
          <bk-field-label>Email</bk-field-label>
          <bk-field-description>We never share it.</bk-field-description>
        </bk-input>
      </bk-field>
      <bk-field>
        <bk-input name="password" type="password" autocomplete="new-password" required>
          <bk-field-label>Password</bk-field-label>
          <bk-field-description>At least 8 characters.</bk-field-description>
        </bk-input>
      </bk-field>
      <div style="display: flex; gap: var(--bk-space-3); align-items: center;">
        <bk-button type="submit">Submit</bk-button>
        <bk-button type="reset" variant="secondary">Cancel</bk-button>
      </div>
    </form>
  `,
};
