import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../bk-field/define.js';
import './define.js';
import type { BkSlider, BkSliderOrientation, BkSliderTooltip } from './bk-slider.js';

type Args = {
  label: string;
  description: string;
  error: string;
  name: string;
  value: number;
  valueEnd: number | null;
  min: number;
  max: number;
  step: number;
  orientation: BkSliderOrientation;
  valueText: string;
  valueTextEnd: string;
  ticks: boolean;
  tooltip: BkSliderTooltip;
  disabled: boolean;
};

const parts = (label: string, description: string) => html`
  <bk-field-label>${label}</bk-field-label>
  ${description ? html`<bk-field-description>${description}</bk-field-description>` : ''}
`;

const meta: Meta<Args> = {
  title: 'Form/Slider',
  component: 'bk-slider',
  args: {
    label: 'Volume',
    description: '',
    error: '',
    name: 'volume',
    value: 40,
    valueEnd: null,
    min: 0,
    max: 100,
    step: 1,
    orientation: 'horizontal',
    valueText: '',
    valueTextEnd: '',
    ticks: false,
    tooltip: 'none',
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    name: { control: 'text' },
    value: { control: 'number' },
    valueEnd: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    valueText: { control: 'text' },
    valueTextEnd: { control: 'text' },
    ticks: { control: 'boolean' },
    tooltip: { control: 'inline-radio', options: ['none', 'hover', 'always'] },
    disabled: { control: 'boolean' },
  },
  render: ({
    label,
    description,
    error,
    name,
    value,
    valueEnd,
    min,
    max,
    step,
    orientation,
    valueText,
    valueTextEnd,
    ticks,
    tooltip,
    disabled,
  }) => html`
    <div style="width: 320px;">
      <bk-field>
        <bk-slider
          error=${error}
          name=${name}
          .value=${value}
          .valueEnd=${valueEnd}
          min=${min}
          max=${max}
          step=${step}
          orientation=${orientation}
          value-text=${valueText}
          value-text-end=${valueTextEnd}
          ?ticks=${ticks}
          tooltip=${tooltip}
          ?disabled=${disabled}
        >
          ${parts(label, description)}
        </bk-slider>
      </bk-field>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Range: Story = {
  args: { label: 'Price', value: 20, valueEnd: 80 },
};

/* No label on purpose: the row above a vertical slider reads badly, and this canvas is
 * about the shape. A real page still has to name the control. A mixer strip is three of
 * them in a centred row; no ticks, because three ticked rails at this height read as three
 * rulers, and the density is what the Ticks story is for. */
export const Vertical: Story = {
  args: { label: '', orientation: 'vertical' },
  render: ({ step }) => html`
    <div
      style="display: flex; align-items: center; justify-content: center; gap: var(--bk-space-4);"
    >
      ${[
        { name: 'high', value: 80 },
        { name: 'mid', value: 50 },
        { name: 'low', value: 20 },
      ].map(
        (channel) => html`
          <bk-slider
            name=${channel.name}
            orientation="vertical"
            step=${step}
            .value=${channel.value}
          ></bk-slider>
        `,
      )}
    </div>
  `,
};

/* The step is not the decision: it is what makes one mark per value readable on a canvas
 * this wide. */
export const Ticks: Story = {
  args: { step: 10, ticks: true },
};

/* `hover`, which is how the three modes behave in the field: the readout is a response to
 * the knob, not a permanent ornament. Hover or focus the knob, or drag it — the bubble
 * follows the value and stays while the drag is held, even if the pointer leaves the
 * knob. `always` is one attribute away and lives in the controls below. */
export const Tooltip: Story = {
  args: { tooltip: 'hover' },
};

/* The readout follows `bk-input`, the continuous channel, so the number moves with the
 * thumb instead of jumping when it is released; `bk-change` would only report the end of
 * the gesture. The value text follows the same event: a thumb that has moved to 24 is
 * announced as "24 °C", never as a stale "21 °C" and never as a bare 24. */
export const Controlled: Story = {
  args: {
    label: 'Temperature',
    name: 'temperature',
    value: 21,
    min: 16,
    max: 30,
    valueText: '21 °C',
  },
  render: ({ label, value, min, max }) => {
    let readout: HTMLElement | null = null;

    const say = (next: number) => {
      if (readout) readout.textContent = `${next} °C`;
    };

    return html`
      <div style="width: 320px;">
        <bk-field>
          <bk-slider
            name="temperature"
            .value=${value}
            min=${min}
            max=${max}
            value-text="${value} °C"
            @bk-input=${(event: Event) => {
              const slider = event.currentTarget as BkSlider;
              const detail = (event as CustomEvent<{ value: number }>).detail;
              slider.valueText = `${detail.value} °C`;
              say(detail.value);
            }}
          >
            ${parts(label, 'The readout under the track follows bk-input, every move.')}
          </bk-slider>
          <p ${ref((element) => (readout = element instanceof HTMLElement ? element : null))}>
            ${value} °C
          </p>
        </bk-field>
      </div>
    `;
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};
