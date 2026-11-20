/* The two facts a form case asks of the platform: did a submit reach the form, and which
 * control did it reject. Seventeen copies of that pair lived in the component suites, in
 * two shapes — a counter and a boolean flag, with the `invalid` listener spelled out each
 * time — so a case that only wanted "once" re-derived it, and the two shapes disagreed on
 * what they could say.
 *
 * The count is a number, not a flag: "the submit arrived" and "the submit arrived once" are
 * different rules, and only the count decides the second. `preventDefault()` belongs here
 * because every one of those copies needed it: a copy that dropped it navigated the runner
 * page away from the fixture, and the failure named nothing.
 *
 * `invalid` is captured because it does not bubble — the form only hears it on the way down,
 * so a non-capturing listener on the form never fires.
 *
 * The rejected controls are a list, not a culprit: the browser reports every invalid
 * control in document order and moves the user to the first, so a single field would
 * answer with the last one. `invalidOrder[0]` is what blocked the submit and the length is
 * how many did. */

export type SubmitWatch = { count: number; invalidOrder: EventTarget[] };

export const watchSubmit = (form: HTMLFormElement): SubmitWatch => {
  const watch: SubmitWatch = { count: 0, invalidOrder: [] };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    watch.count += 1;
  });

  form.addEventListener(
    'invalid',
    (event) => {
      if (event.target) watch.invalidOrder.push(event.target);
    },
    true,
  );

  return watch;
};
