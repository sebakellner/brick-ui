# Documentation Conventions

Rules for what a component ships as documentation: its `README.md`, its Storybook page
and its stories. Token rules are in [conventions-tokens.md](conventions-tokens.md),
testing is in [conventions-testing.md](conventions-testing.md), and the rules for the
documents in this directory are in [README.md](README.md).

**Scope: the web components package.** These rules describe a custom element, so they use
the platform's vocabulary — attributes, properties, events, slots, `part`s and custom
properties. A React or a Vue package arrives later with its own README per component and its
own words for the same ideas; what stays shared between them is the contract, not the
wording.

| #   | Rule                                                                     | Enforced by                             |
| --- | ------------------------------------------------------------------------ | --------------------------------------- |
| D1  | One fact, one home: the README states, the page renders, the story shows | review, and the page imports the README |
| D2  | The README sections are a fixed set, in a fixed order                    | `pnpm check:readmes`                    |
| D3  | Every name the README documents exists in the code, and has a case       | `pnpm check:readmes`, the testing rules |
| D4  | A story is one decision, and its name says which                         | review                                  |
| D5  | The page connects; the README and the ADRs explain                       | review                                  |
| D6  | The contract is shared; the idiom is not                                 | `pnpm check:readmes`                    |
| D7  | Documentation in code earns its place like a comment does                | review                                  |
| D8  | The README explains itself; it never sends the reader to an ADR          | `pnpm check:readmes`                    |

## D1. One fact, one home

**Rule.** The `README.md` states the contract: what the component is, when to use it, and
the names it exposes. The Storybook page renders that same document
(`import readme from './README.md?raw'`) and adds the live canvases. The stories are the
fixtures those canvases draw. The test proves the behaviour.

**Why.** Three copies of one fact drift, and the two that nobody reads win. The page
already imports the README, so the only way a table can disagree with itself is if someone
writes a second one in the `.mdx`. The rule this repository learned the hard way: `brikka-field`
documented three parts it never rendered, so `brikka-field::part(error)` styled nothing.

The same file is read in three places — on GitHub, in Storybook, and on this library's
documentation page once it exists — so every link it carries is an **absolute URL**: a
relative path resolves under one renderer and breaks under the others, which is how
`brikka-field`'s link to these conventions was broken on GitHub while nobody was looking.

**Do** — one README, rendered by the page, and a `.mdx` that only sequences canvases.

**Don't** — restate a token table, an attribute list or a limitation in the `.mdx`.

**Enforced by.** Review; the page imports the file, so a second copy is visible in the
diff. The names it lists are covered by the rule below on documented names.

## D2. The README sections are a fixed set, in a fixed order

**Rule.** A component README uses these headings, with these names, in this order. A
section appears only when the component has something to put in it — an empty section is
worse than a missing one.

| #   | Section                        | Holds                                                                  |
| --- | ------------------------------ | ---------------------------------------------------------------------- |
| 1   | _(no heading)_                 | one paragraph: what it is, and when to reach for it instead of another |
| 2   | `## Usage`                     | one recipe per thing a consumer comes to do, pasted into their own app |
| 3   | `## Attributes and properties` | one table: attribute, property, type, default, and what it does        |
| 4   | `## Slots`                     | named and default slots, and what belongs in each                      |
| 5   | `## Events`                    | the `CustomEvent`s it dispatches, and when                             |
| 6   | `## Parts`                     | the `part` names `::part()` reaches                                    |
| 7   | `## Tokens and hooks`          | the component tokens it paints and the hooks a consumer may override   |
| 8   | `## Accessibility`             | the roles, names, states and keyboard behaviour it provides            |
| 9   | `## Limitations`               | what it deliberately does not do                                       |

`## Usage` exists because the Storybook page shows states and the consumer pastes
snippets into an app with no canvas in front of them: a recipe is a snippet and the one
sentence it needs, and it never restates a row of the table below it.

A component whose behaviour needs its own explanation (`## Label state`, `## Form API`,
`## The two channels`) puts it **after** `## Limitations`, never between the standard
ones: a reader who wants the contract finds it in the same place in every README.

`packages/web-components/src/components/brikka-checkbox/README.md` is the reference: a new component starts from it.
A live document cannot drift from the component it describes, and a template can — the
list this rule replaces had already lost `Slots` and `Accessibility` before anyone noticed.

**Why.** Seven READMEs had two names for one section — `## Properties` in four, `##
Attributes and properties` in three — and their descriptive sections were named per
component. That is the same defect as a token with two names: the reader has to learn seven
vocabularies to compare seven components.

**Do** — `## Attributes and properties`, always, because the attribute is the HTML surface
and the property is the JavaScript one, and a consumer needs both columns.

**Don't** — invent a section name for one component, or reorder the standard ones.

**Enforced by.** `pnpm check:readmes`, which reads the generated manifest and every component
README: a `##` heading that does not belong to the set, or that breaks the order, fails; so
does a table whose header is not the one the section asks for. The rows stay hand-written —
the check fixes the names and the headers, not the prose.

## D3. Every name the README documents exists in the code, and has a case

**Rule.** A name the README lists — attribute, property, event, `part`, slot, hook — is in
the code, and has at least one case that proves it behaves as the document says. A
limitation the README declares gets a case too, the one that shows the limit.

**Why.** Prose earns nothing. A name in a table with no case behind it is the same false
statement as an `Enforced by` column that names a check nobody runs.

**Enforced by.** `pnpm check:readmes` proves the name is in the code and in the table; the
rule in [conventions-testing.md](conventions-testing.md) that gives every documented name a
case proves the rest, and review guards the case that exists without a name.

## D4. A story is one decision, and its name says which

**Rule.** A story exists to show one thing a consumer decides — the default rendering, the
state set, the native message — and its exported name says that thing in a word or two
(`Default`, `States`, `NativeValidation`, `InAForm`). A story never invents a state the
component cannot reach.

**Why.** A story named after its implementation (`Variants1`, `WithEverything`) is a
fixture nobody can find, and a story that fakes a state proves the fixture rather than the
component.

**Do** — `title: 'Form/Input'`, one category, named per component. The categories are
`Form` today; a new category is a decision recorded in this document, not a choice per
component.

**Enforced by.** Review.

## D5. The page connects; the README and the ADRs explain

**Rule.** The `.mdx` carries the canvases and, between them, the sentence that says why
this canvas follows the previous one. The explanation — why a decision was made, what was
rejected — belongs in the README or in an [ADR](adr/), never in a paragraph next to a
canvas.

**Why.** The page is read with one hand on the controls, and a paragraph there is read
once. The README is read before adopting, and an ADR is read years later when someone asks
why. A reason stored in the least durable of the three is a reason about to be lost.

**Do** — one or two sentences per canvas: what to look at.

**Don't** — a rationale paragraph, a comparison with another library, or a decision
recorded only here.

**Enforced by.** Review.

## D6. The contract is shared; the idiom is not

**Rule.** A second technology gets its own package and its own README per component, because
its vocabulary differs: React has props and children, Vue has props, emits and scoped slots,
a custom element has attributes, properties, events, slots and `part`s. What every package
must state identically is the **contract** — the names that exist, what each one does, its
default, the events and their payloads, the accessibility commitments, the limitations. That
part is declared once, in the component manifest, and each package renders it; only the
idiomatic usage, the snippet a consumer of that technology writes, is authored per package.

**Why.** Two hand-written READMEs per component are two documents per fact per technology,
and the first divergence will be a default or an event name. The rule that keeps them honest
is the one this folder already uses: a fact true of every technology belongs to the manifest,
and a fact true of one technology belongs to that package.

**Do** — a React README whose tables are generated from the manifest and whose `## Usage`
shows `<BrikkaInput onChange>`; a custom element README whose tables come from the same manifest
and whose `## Usage` shows `<brikka-input>` with a listener.

**Don't** — copy a table by hand into a second package, or rename a contract name to fit the
idiom: `disabled` stays `disabled`, and how you _set_ it is the package's business.

**Enforced by.** `pnpm check:readmes`, in both directions: a contract name the manifest
declares and no table carries fails, and a table row with no name behind it fails too. Which
surfaces the manifest carries from code and which are annotated is the decision in
.

## D7. Documentation in code earns its place like a comment does

**Rule.** The JSDoc a name carries — the tags the manifest renders, and the sentence above a
declaration — says what the name means for a consumer, in one line. It never explains how the
code works, never restates a type the signature already shows, and never narrates a decision
that belongs in an ADR. What is not needed to use the name is not written.

**Why.** Doc prose is read once and believed forever, so the second copy of a fact is a second
thing to keep true — the same reason the README is rendered rather than retyped. An annotation
that restates the signature goes stale at the first refactor and nobody notices, because it is
the least reviewed line in the file.

**Do** — `@slot error The problem, rendered in the status region.`

**Don't** — an `@example` block that repeats the whole README `## Usage`, or a `@param` for
`value` saying "the value".

**Enforced by.** Review. The budget for an ordinary comment is the rule in
[conventions-code.md](conventions-code.md) about what a comment is allowed to say.

## D8. The README explains itself; it never sends the reader to an ADR

**Rule.** A component README states its contract and the reasons it needs **in its own words**.
It carries no link to an [ADR](adr/): an ADR is cited from `docs/` and from other ADRs, where a
maintainer is already reading reasoning. What D5 says still holds — the explanation belongs to the
README or to an ADR — with one clause added: when it is the README, the README says it.

**Why.** Two readers, two jobs. The README is read before adopting, by someone who cannot act on
"see ADR 0012" — and in this repository it is also the Storybook page, so the link leaves the
reader mid-sentence to go somewhere the page cannot take them. It was also a link to `main` on
GitHub, so it aged with the branch. The twenty-four links this rule replaces were each a fact the
README could not state by itself: a limitation whose reason was one click away, in a document
written for someone deciding whether to change the code.

**Do** — state the limitation: _"A radio group is a widget, not a container: nothing outside it
keeps its selection, submits it or reaches it with the keyboard."_

**Don't** — `it is not a public component, see [ADR 0012](https://github.com/…/docs/adr/0012-….md)`.

**Enforced by.** `pnpm check:readmes`, which fails naming the file, the line and the ADR. The
reasoning a README points at is still one directory away for the maintainer who wants it; what
the rule forbids is asking a consumer to go there.
