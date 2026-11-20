import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../bk-checkbox/define.js';
import '../bk-checkbox-group/define.js';
import '../bk-input/define.js';
import '../bk-native-select/define.js';
import '../bk-radio-group/define.js';
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
  component: 'bk-field',
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
      <bk-field ?invalid=${invalid}>
        <bk-input name="email" type="email" ?required=${required} error=${error}>
          <bk-field-label>${label}</bk-field-label>
          ${description ? html`<bk-field-description>${description}</bk-field-description>` : ''}
        </bk-input>
      </bk-field>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Input: Story = {
  render: () => html`
    <div style="display: grid; gap: var(--bk-space-4); width: 360px;">
      <bk-field>
        <bk-input name="username" autocomplete="username">
          <bk-field-label>Username</bk-field-label>
          <bk-field-description>This is the name other people see.</bk-field-description>
        </bk-input>
      </bk-field>
      <bk-field>
        <bk-input name="password" type="password" autocomplete="current-password">
          <bk-field-label>Password</bk-field-label>
          <bk-field-description>At least 8 characters.</bk-field-description>
        </bk-input>
      </bk-field>
    </div>
  `,
};

export const Select: Story = {
  render: () => html`
    <div style="width: 360px;">
      <bk-field>
        <bk-native-select name="country" placeholder="Choose a country">
          <bk-field-label>Country</bk-field-label>
          <bk-field-description
            >It decides the tax that applies to the invoice.</bk-field-description
          >
          <bk-native-select-opt value="ar">Argentina</bk-native-select-opt>
          <bk-native-select-opt value="br">Brazil</bk-native-select-opt>
          <bk-native-select-opt value="cl">Chile</bk-native-select-opt>
          <bk-native-select-opt value="uy">Uruguay</bk-native-select-opt>
        </bk-native-select>
      </bk-field>
    </div>
  `,
};

export const Checkbox: Story = {
  render: () => html`
    <div style="display: grid; gap: var(--bk-space-4); width: 360px;">
      <bk-field>
        <bk-checkbox-group name="desktop-items">
          <bk-field-label>Show these items on the desktop</bk-field-label>
          <bk-field-description
            >Select the items you want to show on the desktop.</bk-field-description
          >
          <bk-checkbox value="hard-disks">
            <bk-field-label>Hard disks</bk-field-label>
          </bk-checkbox>
          <bk-checkbox value="external-disks">
            <bk-field-label>External disks</bk-field-label>
          </bk-checkbox>
          <bk-checkbox value="cds">
            <bk-field-label>CDs, DVDs, and iPods</bk-field-label>
          </bk-checkbox>
          <bk-checkbox value="servers">
            <bk-field-label>Connected servers</bk-field-label>
          </bk-checkbox>
        </bk-checkbox-group>
      </bk-field>
      <hr
        style="border: 0; border-block-start: var(--bk-border-width) solid var(--bk-border-default); margin: 0;"
      />
      <bk-field>
        <bk-checkbox name="sync" value="sync" checked>
          <bk-field-label>Sync Desktop &amp; Documents folders</bk-field-label>
          <bk-field-description>
            Your Desktop &amp; Documents folders are being synced with iCloud Drive. You can access
            them from other devices.
          </bk-field-description>
        </bk-checkbox>
      </bk-field>
    </div>
  `,
};

export const RadioGroup: Story = {
  render: () => html`
    <div style="width: 360px;">
      <bk-field>
        <bk-radio-group name="storage">
          <bk-field-label>Store the files</bk-field-label>
          <bk-field-description>You can move them to another drive later.</bk-field-description>
          <bk-radio-group-item value="local">
            <bk-field-label>On this Mac</bk-field-label>
          </bk-radio-group-item>
          <bk-radio-group-item value="icloud">
            <bk-field-label>In iCloud Drive</bk-field-label>
            <bk-field-description
              >They sync to your other devices and take no local space.</bk-field-description
            >
          </bk-radio-group-item>
          <bk-radio-group-item value="external">
            <bk-field-label>On an external drive</bk-field-label>
          </bk-radio-group-item>
        </bk-radio-group>
      </bk-field>
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
      <bk-field ?invalid=${invalid}>
        <bk-input name="email" type="email" .value=${'you@brick'} error=${error}>
          <bk-field-label>${label}</bk-field-label>
          ${description ? html`<bk-field-description>${description}</bk-field-description>` : ''}
          <bk-field-error>${error}</bk-field-error>
        </bk-input>
      </bk-field>
    </div>
  `,
};
