import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import type { BkButtonVariant } from './bk-button.js';
import './bk-button.js';

type Args = {
  variant: BkButtonVariant;
  disabled: boolean;
  label: string;
};

const meta: Meta<Args> = {
  title: 'Components/Button',
  component: 'bk-button',
  args: { variant: 'primary', disabled: false, label: 'Save changes' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost'] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
  render: ({ variant, disabled, label }) => html`
    <bk-button variant=${variant} ?disabled=${disabled}>${label}</bk-button>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Variants: Story = {
  render: () => html`
    <div style="display: flex; gap: 12px; align-items: center;">
      <bk-button>Save changes</bk-button>
      <bk-button variant="secondary">Cancel</bk-button>
      <bk-button variant="ghost">Learn more</bk-button>
    </div>
  `,
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Themed: Story = {
  render: () => html`
    <div style="display: flex; gap: 12px; align-items: center;">
      <bk-button
        style="--bk-button-bg: #0f766e; --bk-button-bg-hover: #115e59; --bk-button-radius: 999px;"
      >
        Themed through custom properties
      </bk-button>
      <bk-button variant="secondary" style="--bk-button-radius: 999px;">
        Secondary, same radius
      </bk-button>
    </div>
  `,
};
