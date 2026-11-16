# 0013. A group enforces "at least one" and nothing else

- **Status:** accepted
- **Date:** 2026-11-16

## Context

`bk-checkbox-group` was built as a container that declares no validity: [0012](0012-a-radio-group-is-a-widget-not-a-container.md)
records that as deliberate, and [0011](0011-a-slotted-error-atom-is-the-fields-error.md)
records the group as reporting no validity of its own. The reason given was that a mark
a component cannot enforce drifts — an asterisk that promises a rule nobody checks.

That reasoning depends on whether the constraint is enforceable at all. "At least one of
these boxes" is: the group can see every box it owns, it can report `valueMissing`, and a
`required` group that blocks a submit is telling the truth. A count ("at least two") would
also be enforceable, but it is a different rule with its own messages, and this record
deliberately does not invent it.

The ARIA side is uneven and worth stating once. `aria-required` is supported on
`combobox`, `gridcell`, `listbox`, `radiogroup`, `spinbutton`, `textbox` and `tree` — not
on `group`. A radio group can therefore announce the requirement with an attribute; a
checkbox group cannot, and writing one that no assistive technology maps would be the same
mistake as a decorative asterisk.

## Decision

A checkbox group is form-associated and enforces exactly one constraint:

- `required` means **at least one owned box is checked**. With none checked it reports
  `valueMissing` and blocks the submit; the constraint clears the moment one is checked,
  through the boxes' own `bk-change`.
- The flag is expressed with `fieldConstraint`, the extension point the radio group added,
  so "this group is missing its answer" has one shape in the kit.
- The group adds **no entry** to the form payload: the boxes submit their own values.
- `disabled` flows to the owned boxes, because a group that looks unavailable while its
  boxes respond is the failure rule C5 of [the code conventions](../conventions-code.md)
  exists to prevent. The group gives back only what it wrote.
- The requirement is announced by the consumer's `bk-field-description` and the message is
  their `bk-field-error`; the group writes no text into a node it does not own (0011).

No `min`, no `max`, no group-level `error` semantics beyond the atom. A count is a future
decision with its own messages and its own record.

## Alternatives considered

| Alternative                                                               | Why it was rejected                                                                                                                                                                      |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Leave the group non-form-associated and let the consumer block the submit | Two sources of truth for one rule, and the component's `required` would be a prop with no effect — the drift 0012 was right to avoid.                                                    |
| Set `aria-required="true"` on the `group` host                            | No assistive technology maps it on that role. It would look like an announcement and make none.                                                                                          |
| Paint the host `aria-invalid`, as the radio group does                    | `group` is not a widget role AT queries for validity, so the attribute would be decoration; the invalid state is painted on the label and announced through the consumer's atom instead. |
| Add `min`/`max` in the same change                                        | A different constraint with different messages ("at least two", "no more than three") and no request behind it.                                                                          |

## Consequences

`bk-checkbox-group` now carries `name`, `required`, `disabled` and `error` and takes part in
constraint validation, while `submittedValue` stays `null`. That asymmetry with the radio
group is the honest one: a radio group _is_ the value, a checkbox group only holds a rule
about several values.

A checkbox group announces less than a radio group can. That gap is a property of ARIA, not
of this design, and it is documented in the component's README rather than papered over.

`ADRs 0011 and 0012 are superseded in part` by this one: their statements that the group
reports no validity still describe the shape they were deciding, and this record is where
the enforcement lives.
