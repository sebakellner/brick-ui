import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../bk-checkbox/define.js';
import '../bk-field/define.js';
import './define.js';
import type { BkCheckboxGroupOrientation } from './bk-checkbox-group.js';

type Args = {
  label: string;
  description: string;
  error: string;
  invalid: boolean;
  required: boolean;
  orientation: BkCheckboxGroupOrientation;
  email: boolean;
  sms: boolean;
};

const meta: Meta<Args> = {
  title: 'Form/Checkbox Group',
  component: 'bk-checkbox-group',
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
    <bk-checkbox-group ?invalid=${invalid} ?required=${required} orientation=${orientation}>
      <bk-field-label>${label}</bk-field-label>
      <bk-checkbox name="email" value="email" .checked=${email}>
        <bk-field-label slot="label">Email</bk-field-label>
      </bk-checkbox>
      <bk-checkbox name="sms" value="sms" .checked=${sms}>
        <bk-field-label slot="label">SMS</bk-field-label>
      </bk-checkbox>
      ${description ? html`<bk-field-description>${description}</bk-field-description>` : ''}
      ${error ? html`<bk-field-error>${error}</bk-field-error>` : ''}
    </bk-checkbox-group>
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
