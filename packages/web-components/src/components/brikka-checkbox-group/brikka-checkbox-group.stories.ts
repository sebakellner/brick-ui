import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../brikka-checkbox/define.js';
import '../brikka-field/define.js';
import './define.js';
import type { BrikkaCheckboxGroupOrientation } from './brikka-checkbox-group.js';

type Args = {
  label: string;
  description: string;
  error: string;
  invalid: boolean;
  required: boolean;
  orientation: BrikkaCheckboxGroupOrientation;
  email: boolean;
  sms: boolean;
};

const meta: Meta<Args> = {
  title: 'Form/Checkbox Group',
  component: 'brikka-checkbox-group',
  args: {
    label: 'Notifications',
    description: 'Pick at least one.',
    error: '',
    invalid: false,
    required: false,
    orientation: 'vertical',
    email: false,
    sms: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    invalid: { control: 'boolean' },
    required: { control: 'boolean' },
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    email: { control: 'boolean' },
    sms: { control: 'boolean' },
  },
  render: ({ label, description, error, invalid, required, orientation, email, sms }) => html`
    <brikka-checkbox-group ?invalid=${invalid} ?required=${required} orientation=${orientation}>
      <brikka-field-label>${label}</brikka-field-label>
      <brikka-checkbox name="email" value="email" .checked=${email}>
        <brikka-field-label slot="label">Email</brikka-field-label>
        <brikka-field-description>Where the receipt and the invoice go.</brikka-field-description>
      </brikka-checkbox>
      <brikka-checkbox name="sms" value="sms" .checked=${sms}>
        <brikka-field-label slot="label">SMS</brikka-field-label>
        <brikka-field-description>Only for delivery updates.</brikka-field-description>
      </brikka-checkbox>
      ${description ? html`<brikka-field-description>${description}</brikka-field-description>` : ''}
      ${error ? html`<brikka-field-error>${error}</brikka-field-error>` : ''}
    </brikka-checkbox-group>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Horizontal: Story = {
  args: { orientation: 'horizontal', description: '', email: true },
};

export const Invalid: Story = {
  args: { invalid: true, error: 'Pick at least one channel.', description: '' },
};
