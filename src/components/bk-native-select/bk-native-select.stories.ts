import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../bk-field/define.js';
import './define.js';

type Args = {
  description: string;
  error: string;
  value: string;
  placeholder: string;
  name: string;
  disabled: boolean;
  required: boolean;
};

const channels = html`
  <bk-native-select-opt value="email">Email</bk-native-select-opt>
  <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
  <bk-native-select-opt value="push">Push</bk-native-select-opt>
`;

const meta: Meta<Args> = {
  title: 'Form/Native Select',
  component: 'bk-native-select',
  args: {
    description: 'Where we send the receipt.',
    error: '',
    value: '',
    placeholder: 'Choose a channel',
    name: 'channel',
    disabled: false,
    required: false,
  },
  argTypes: {
    description: { control: 'text' },
    error: { control: 'text' },
    value: { control: 'text' },
    placeholder: { control: 'text' },
    name: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  render: ({ description, error, value, placeholder, name, disabled, required }) => html`
    <div style="width: 320px;">
      <bk-field>
        <bk-native-select
          error=${error}
          value=${value}
          placeholder=${placeholder}
          name=${name}
          ?disabled=${disabled}
          ?required=${required}
        >
          ${channels}
          ${description ? html`<bk-field-description>${description}</bk-field-description>` : ''}
        </bk-native-select>
      </bk-field>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Groups: Story = {
  render: () => html`
    <div style="width: 320px;">
      <bk-field>
        <bk-native-select name="channel" placeholder="Choose a channel">
          <bk-native-select-opt-group label="Direct">
            <bk-native-select-opt value="email">Email</bk-native-select-opt>
            <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
          </bk-native-select-opt-group>
          <bk-native-select-opt-group label="Quiet">
            <bk-native-select-opt value="push">Push</bk-native-select-opt>
          </bk-native-select-opt-group>
        </bk-native-select>
      </bk-field>
    </div>
  `,
};

export const Disabled: Story = {
  args: { value: 'sms', disabled: true, description: '' },
};

export const Invalid: Story = {
  args: { error: 'Choose a channel.', description: '' },
};
