import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../brikka-checkbox/define.js';
import '../brikka-checkbox-group/define.js';
import '../brikka-input/define.js';
import '../brikka-native-select/define.js';
import '../brikka-radio-group/define.js';
import './define.js';

type Args = {
  label: string;
  description: string;
  error: string;
  invalid: boolean;
  required: boolean;
};

const meta: Meta<Args> = {
  title: 'Form/Field',
  component: 'brikka-field',
  args: {
    label: 'Email',
    description: 'We only use it for the receipt.',
    error: '',
    invalid: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    invalid: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  render: ({ label, description, error, invalid, required }) => html`
    <div style="width: 360px;">
      <brikka-field ?invalid=${invalid}>
        <brikka-input name="email" type="email" ?required=${required} error=${error}>
          <brikka-field-label>${label}</brikka-field-label>
          ${description ? html`<brikka-field-description>${description}</brikka-field-description>` : ''}
        </brikka-input>
      </brikka-field>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Input: Story = {
  render: () => html`
    <div style="display: grid; gap: var(--brikka-space-4); width: 360px;">
      <brikka-field>
        <brikka-input name="username" autocomplete="username">
          <brikka-field-label>Username</brikka-field-label>
          <brikka-field-description>This is the name other people see.</brikka-field-description>
        </brikka-input>
      </brikka-field>
      <brikka-field>
        <brikka-input name="password" type="password" autocomplete="current-password">
          <brikka-field-label>Password</brikka-field-label>
          <brikka-field-description>At least 8 characters.</brikka-field-description>
        </brikka-input>
      </brikka-field>
    </div>
  `,
};

export const Select: Story = {
  render: () => html`
    <div style="width: 360px;">
      <brikka-field>
        <brikka-native-select name="country" placeholder="Choose a country">
          <brikka-field-label>Country</brikka-field-label>
          <brikka-field-description
            >It decides the tax that applies to the invoice.</brikka-field-description
          >
          <brikka-native-select-opt value="ar">Argentina</brikka-native-select-opt>
          <brikka-native-select-opt value="br">Brazil</brikka-native-select-opt>
          <brikka-native-select-opt value="cl">Chile</brikka-native-select-opt>
          <brikka-native-select-opt value="uy">Uruguay</brikka-native-select-opt>
        </brikka-native-select>
      </brikka-field>
    </div>
  `,
};

export const Checkbox: Story = {
  render: () => html`
    <div style="display: grid; gap: var(--brikka-space-4); width: 360px;">
      <brikka-field>
        <brikka-checkbox-group name="desktop-items">
          <brikka-field-label>Show these items on the desktop</brikka-field-label>
          <brikka-field-description
            >Select the items you want to show on the desktop.</brikka-field-description
          >
          <brikka-checkbox value="hard-disks">
            <brikka-field-label>Hard disks</brikka-field-label>
          </brikka-checkbox>
          <brikka-checkbox value="external-disks">
            <brikka-field-label>External disks</brikka-field-label>
          </brikka-checkbox>
          <brikka-checkbox value="cds">
            <brikka-field-label>CDs, DVDs, and iPods</brikka-field-label>
          </brikka-checkbox>
          <brikka-checkbox value="servers">
            <brikka-field-label>Connected servers</brikka-field-label>
          </brikka-checkbox>
        </brikka-checkbox-group>
      </brikka-field>
      <hr
        style="border: 0; border-block-start: var(--brikka-border-width) solid var(--brikka-border-default); margin: 0;"
      />
      <brikka-field>
        <brikka-checkbox name="sync" value="sync" checked>
          <brikka-field-label>Sync Desktop &amp; Documents folders</brikka-field-label>
          <brikka-field-description>
            Your Desktop &amp; Documents folders are being synced with iCloud Drive. You can access
            them from other devices.
          </brikka-field-description>
        </brikka-checkbox>
      </brikka-field>
    </div>
  `,
};

export const RadioGroup: Story = {
  render: () => html`
    <div style="width: 360px;">
      <brikka-field>
        <brikka-radio-group name="storage">
          <brikka-field-label>Store the files</brikka-field-label>
          <brikka-field-description
            >You can move them to another drive later.</brikka-field-description
          >
          <brikka-radio-group-item value="local">
            <brikka-field-label>On this Mac</brikka-field-label>
          </brikka-radio-group-item>
          <brikka-radio-group-item value="icloud">
            <brikka-field-label>In iCloud Drive</brikka-field-label>
            <brikka-field-description
              >They sync to your other devices and take no local space.</brikka-field-description
            >
          </brikka-radio-group-item>
          <brikka-radio-group-item value="external">
            <brikka-field-label>On an external drive</brikka-field-label>
          </brikka-radio-group-item>
        </brikka-radio-group>
      </brikka-field>
    </div>
  `,
};

export const LabelOnly: Story = {
  name: 'Label only',
  args: { description: '' },
};

export const Invalid: Story = {
  name: 'Invalid, with the error atom',
  args: {
    invalid: true,
    error: 'Enter a valid address.',
  },
  render: ({ label, description, error, invalid }) => html`
    <div style="width: 360px;">
      <brikka-field ?invalid=${invalid}>
        <brikka-input name="email" type="email" .value=${'you@brikka'} error=${error}>
          <brikka-field-label>${label}</brikka-field-label>
          ${description ? html`<brikka-field-description>${description}</brikka-field-description>` : ''}
          <brikka-field-error>${error}</brikka-field-error>
        </brikka-input>
      </brikka-field>
    </div>
  `,
};
