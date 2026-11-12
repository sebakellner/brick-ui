import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import type { BkInputType } from './bk-input.js';
import './bk-input.js';

type Args = {
  label: string;
  helper: string;
  error: string;
  value: string;
  placeholder: string;
  type: BkInputType;
  disabled: boolean;
  required: boolean;
};

const meta: Meta<Args> = {
  title: 'Components/Input',
  component: 'bk-input',
  args: {
    label: 'Email',
    helper: 'We never share it.',
    error: '',
    value: '',
    placeholder: 'you@brick.dev',
    type: 'email',
    disabled: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    helper: { control: 'text' },
    error: { control: 'text' },
    value: { control: 'text' },
    placeholder: { control: 'text' },
    type: { control: 'select', options: ['text', 'email', 'password', 'search', 'tel', 'url'] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  render: ({ label, helper, error, value, placeholder, type, disabled, required }) => html`
    <div style="width: 320px;">
      <bk-input
        label=${label}
        helper=${helper}
        error=${error}
        value=${value}
        placeholder=${placeholder}
        type=${type}
        ?disabled=${disabled}
        ?required=${required}
      ></bk-input>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const States: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 20px; width: 320px;">
      <bk-input label="Email" helper="We never share it." placeholder="you@brick.dev"></bk-input>
      <bk-input
        label="Email"
        helper="We never share it."
        error="That address looks wrong."
        value="you@brick"
      ></bk-input>
      <bk-input label="Email" value="you@brick.dev" disabled></bk-input>
    </div>
  `,
};
