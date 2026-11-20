import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../brikka-field/define.js';
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
  <brikka-native-select-opt value="email">Email</brikka-native-select-opt>
  <brikka-native-select-opt value="sms">SMS</brikka-native-select-opt>
  <brikka-native-select-opt value="push">Push</brikka-native-select-opt>
`;

const meta: Meta<Args> = {
  title: 'Form/Native Select',
  component: 'brikka-native-select',
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
      <brikka-field>
        <brikka-native-select
          error=${error}
          value=${value}
          placeholder=${placeholder}
          name=${name}
          ?disabled=${disabled}
          ?required=${required}
        >
          ${channels}
          ${description ? html`<brikka-field-description>${description}</brikka-field-description>` : ''}
        </brikka-native-select>
      </brikka-field>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Groups: Story = {
  render: () => html`
    <div style="width: 320px;">
      <brikka-field>
        <brikka-native-select name="channel" placeholder="Choose a channel">
          <brikka-native-select-opt-group label="Direct">
            <brikka-native-select-opt value="email">Email</brikka-native-select-opt>
            <brikka-native-select-opt value="sms">SMS</brikka-native-select-opt>
          </brikka-native-select-opt-group>
          <brikka-native-select-opt-group label="Quiet">
            <brikka-native-select-opt value="push">Push</brikka-native-select-opt>
          </brikka-native-select-opt-group>
        </brikka-native-select>
      </brikka-field>
    </div>
  `,
};

export const Disabled: Story = {
  args: { value: 'sms', disabled: true, description: '' },
};

export const Invalid: Story = {
  args: { error: 'Choose a channel.', description: '' },
};
