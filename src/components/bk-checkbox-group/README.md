# `bk-checkbox-group`

A container that names and arranges several `bk-checkbox` elements. It is a
`role="group"` with its own label, description and error regions, and it holds no
value and no validity of its own.

[Docs page](https://sebakellner.github.io/brick-ui/?path=/docs/components-checkbox-group--docs)

```html
<bk-checkbox-group>
  <bk-field-label>Notifications</bk-field-label>
  <bk-checkbox name="email" value="email">
    <bk-field-label slot="label">Email</bk-field-label>
  </bk-checkbox>
  <bk-checkbox name="sms" value="sms">
    <bk-field-label slot="label">SMS</bk-field-label>
  </bk-checkbox>
  <bk-field-description>Pick at least one.</bk-field-description>
</bk-checkbox-group>
```

## Attributes and properties

| Property      | Attribute     | Type                         | Default    | Notes                                                                                                                                    |
| ------------- | ------------- | ---------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `invalid`     | `invalid`     | `boolean`                    | `false`    | reflected; paints the group's own `bk-field-label` with `data-state="invalid"`. Sets nothing on the boxes and adds no message of its own |
| `orientation` | `orientation` | `'vertical' \| 'horizontal'` | `vertical` | reflected; the direction the boxes flow in. The only layout difference                                                                   |

The group declares **no `required` and no `disabled`**. An asterisk promises an
enforcement the group does not have, because "at least one checked" is a
constraint no attribute expresses and no single native control carries; and a
`disabled` the group cannot honour is worse than none. Validity stays on each
`bk-checkbox`, and the group never writes to one.

To disable every box, wrap the group in a disabled `fieldset`. Each control
already honours it through `FormControlMixin`, so the boxes stop responding and
stay announced as unavailable without any group-level attribute:

```html
<fieldset disabled>
  <bk-checkbox-group>
    <bk-field-label>Notifications</bk-field-label>
    <bk-checkbox name="email" value="email">
      <bk-field-label slot="label">Email</bk-field-label>
    </bk-checkbox>
  </bk-checkbox-group>
</fieldset>
```

## Slots

| Slot          | Content                | Notes                                                                                                       |
| ------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| _(default)_   | `bk-checkbox`          | the boxes; the only things the group arranges                                                               |
| `label`       | `bk-field-label`       | the name of the group. The slot is the only name; the group is unnamed while it has no such atom            |
| `description` | `bk-field-description` | the help text, and the description region itself; the group gives it an id and takes it back when it leaves |
| `error`       | `bk-field-error`       | the problem, and the live region itself; it wins over the description while it has text                     |

The three atoms need no `slot` attribute inside the group: it assigns them by tag
name, at any depth, the way `bk-field` does. A box keeps its own atoms — the
group never routes or paints what a `bk-checkbox` hosts, so a box's label is
written with `slot="label"` on the box itself, or left bare inside a `bk-field`.

## Group-level messages

The consumer's atoms **are** the regions. The group does not render a region of
its own and does not wrap them: a container cannot reference a region inside its
own shadow root, because `aria-labelledby`/`aria-describedby` resolve per tree.
So the group writes on the atom what a region would otherwise carry, and the
atom stays in the document tree where an IDREF finds it:

| The group writes   | On                 | When                                                                        |
| ------------------ | ------------------ | --------------------------------------------------------------------------- |
| `id`               | description, error | always, if the atom has none: `<group id>-description`/`-error`             |
| `role="status"`    | error              | always, if the atom has no role of its own                                  |
| `data-empty`       | description, error | while `textContent.trim()` is empty                                         |
| `hidden`           | description        | while the error atom has text                                               |
| `aria-describedby` | the host           | the error id while the error has text, else the description id, else absent |

An empty atom is clipped, never removed: it keeps its 1px box, its place in the
flow and its place in the accessibility tree, so the live region is already
there when the error arrives. `data-empty` is what the atom paints — the atom
stays presentational, it never decides that it is empty.

`hidden` is a different job and only the description gets it: while the error has
text the description gives it the row, exactly as a field's two regions behave,
and it comes back when the error empties. Neither atom is ever removed.

When an atom leaves the group, the group takes its `role` and its `data-empty`
back; the `id` it assigned can stay.

**This is a deliberate departure from A7's "never `role="status"` on slotted
content".** A7 keeps the live region on the control's own shadow region, which
works because the control's references live in the same tree as that region. A
group is a different shape: the element a screen reader lands on is the host,
and the host's `aria-describedby` cannot reach into its own shadow root —
measured, the reference resolves to nothing. Putting the role and the id on the
atom the consumer wrote is the only shape that both resolves and keeps the
region in the tree, and the cost is that the group writes on a node it does not
own. It writes only these four facts, never text, never state a box reads.

## Parts

| Part    | Element                                                           |
| ------- | ----------------------------------------------------------------- |
| `label` | the row holding the label slot, hidden while the group is unnamed |
| `boxes` | the flow container of the default slot, `part="boxes"`            |

There is no `message`, `description` or `error` part: those regions are the
consumer's own atoms, styled by the atoms and by the group's `::slotted` rules.
They are always there, because the group never removes them.

## Label state

`invalid` is written as `data-state="invalid"` on the `bk-field-label` the group
hosts, never on a box and never on the label of one:

| Value     | When              | Paints             |
| --------- | ----------------- | ------------------ |
| `invalid` | `invalid` is true | `--bk-text-danger` |

A label with no state keeps `--bk-text-default`, which is what the atom paints
from its own `:host` rules. The group declares no `disabled` state.

## Tokens

No new token tier. The group reads the roles and primitives the atoms already
read — `--bk-space-2` for the gap between the boxes, and the atoms' own
`--bk-text-muted`, `--bk-text-danger` and `--bk-text-default` — and declares **no
override hook**: there is no `--bk-checkbox-group-*` name, and layout is the
only thing `orientation` decides.

```css
/* theming a group means theming the role, not the group */
.checkout {
  display: flex;
  flex-direction: column;
  gap: var(--bk-space-2);
}
```

## Accessibility

- The host is the group: it carries `role="group"`, so a screen reader announces
  the bounds of the set when entering it.
- The accessible name is the slotted `bk-field-label`, assigned to the host with
  `ariaLabelledByElements` (Baseline 2025). The group writes no id on the
  consumer's node and no reference crosses a shadow root; the name is the
  element the consumer wrote. Removing the atom clears it again.
- `aria-describedby` on the host names the **consumer's** error atom while it has
  text, otherwise the consumer's description atom, and neither while both are
  empty. The atom is in the document tree, so the IDREF resolves; the group gives
  it the id rather than referencing a region of its own. The error atom carries
  `role="status"` — the group adds it when the atom has none and takes it back
  when the atom leaves — so the live region is the element that stays in the
  tree. An empty atom is clipped with `data-empty` and never removed; while the
  error has text the description takes `hidden` for that row and gets it back
  when the error empties. Text is read from the atom's `textContent`, never from
  a region the group renders. See [Group-level messages](#group-level-messages).
- `invalid` is reinforcement of the group's own label. It is never the only
  signal for a box: each box carries its own `aria-invalid`, its own message and
  its own native constraint, and the group cannot mark a box valid or invalid.
- **Not form-associated.** The group has no value, no `name` and no
  `ElementInternals`. Each box submits under its own `name`, and a required box
  reports `valueMissing` on its own — the group neither adds to nor blocks the
  form payload.
- No focus, key handling or tab order of its own: the boxes are the controls, and
  the group is a container around them.

## Limitations

- No group-level validity: no "at least one checked", no `required`, no `error`
  property. A cross-control constraint is a new contract and it is not this
  component.
- No `disabled`. Use `<fieldset disabled>`, which every control honours.
- No reaching into the boxes: the group never sets an attribute on a
  `bk-checkbox`, never reads its state, never calls its methods, and no box knows
  it is inside a group.
