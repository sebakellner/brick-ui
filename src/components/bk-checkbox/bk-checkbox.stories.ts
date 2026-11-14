import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './define.js';

type Args = {
  label: string;
  helper: string;
  error: string;
  checked: boolean;
  value: string;
  name: string;
  disabled: boolean;
  required: boolean;
};

const meta: Meta<Args> = {
  title: 'Components/Checkbox',
  component: 'bk-checkbox',
  args: {
    label: 'Accept the terms',
    helper: 'You can change this later.',
    error: '',
    checked: false,
    value: '',
    name: 'terms',
    disabled: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    helper: { control: 'text' },
    error: { control: 'text' },
    checked: { control: 'boolean' },
    value: { control: 'text' },
    name: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  render: ({ label, helper, error, checked, value, name, disabled, required }) => html`
    <bk-checkbox
      label=${label}
      helper=${helper}
      error=${error}
      value=${value}
      name=${name}
      .checked=${checked}
      ?disabled=${disabled}
      ?required=${required}
    ></bk-checkbox>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Checked: Story = {
  args: { checked: true, helper: '' },
};

export const States: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 20px; width: 320px;">
      <bk-checkbox label="Accept the terms"></bk-checkbox>
      <bk-checkbox label="Accept the terms" checked></bk-checkbox>
      <bk-checkbox
        label="Accept the terms"
        error="You have to accept the terms."
      ></bk-checkbox>
      <bk-checkbox label="Accept the terms" disabled></bk-checkbox>
      <bk-checkbox label="Accept the terms" checked disabled></bk-checkbox>
    </div>
  `,
};

export const Required: Story = {
  args: { required: true, helper: '', label: 'Accept the terms to continue' },
};

export const CustomSize: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <bk-checkbox label="Default size"></bk-checkbox>
      <bk-checkbox
        label="Larger, square corners"
        style="--bk-checkbox-size: calc(var(--bk-space-4) * 1.5); --bk-checkbox-radius: 0;"
      ></bk-checkbox>
    </div>
  `,
};
