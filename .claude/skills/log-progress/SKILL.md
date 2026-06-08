---
name: log-progress
description: Append a structured entry to docs/PROGRESS_LOG.md recording what changed and why, update the "Current State" summary if it's now stale, and rotate older entries into docs/logs/YYYY-MM.md when the log grows past its bounded recent-entries window. Use as the last step of any task that changed code, made an architectural/technical decision, or otherwise changed the state of the project.
---

# Log Progress

`docs/PROGRESS_LOG.md` is how an agent (or developer) picking up work later
gets full situational awareness in one read, instead of paying the token
cost of re-deriving "what's been built and decided so far" from the
codebase and git history every session. This skill is what keeps that file
*useful* over the project's entire lifetime — bounded in size, genuinely
informative, and never stale.

## When to use

As the **last step** of any task that:
- changed application code (new module, migration, feature, fix), or
- recorded an architectural/technical decision (stack choice, convention
  adopted or rejected, pattern established), or
- otherwise changed the project's state in a way a future session would
  need to know about to avoid re-deriving or re-litigating it.

Skip it for pure exploration/research/Q&A that didn't change anything.

## Steps

### 1. Append the entry

Add a new dated section to the **top** of "Recent entries" in
`docs/PROGRESS_LOG.md`, in this terse, bulleted format — never prose:

```
### YYYY-MM-DD — <short scope title>
Done:
- <what changed — one line per item; name files/modules, not implementation
  detail the diff already shows>
Decided (why): <only include this line if a non-obvious decision was made —
name the decision AND the reason a future session would otherwise have to
reconstruct or might get wrong>
Next: <what a future session should pick up — omit if nothing follows>
Status: done | in-progress | blocked
```

Keep "Done" to roughly 6 lines or fewer. If it's creeping past that, either
you're describing implementation detail (the diff already shows *what* —
the log only needs to say *that* it happened and *why*), or the task should
have been split into multiple entries.

### 2. Update "Current State" if it's now stale

If this task changed the *cumulative* picture — first code scaffolded, a
convention superseded an earlier one, a module moved from planned to
done — edit the "Current State" summary at the top of the file to match the
new reality. A summary that contradicts the entry directly below it is worse
than no summary: it actively misleads the next reader.

### 3. Rotate if "Recent entries" has outgrown its window

Use judgment, not a hard byte count — the test is "would reading this whole
section in full still be cheap?" As a guideline, once it holds much more
than ~4 weeks of entries:

1. Identify the oldest entries that fall outside the recent window.
2. Append them verbatim, in chronological order, to `docs/logs/YYYY-MM.md`
   (named for the month *the entries belong to*, not today's date — create
   the file from scratch with a one-line header if it doesn't exist yet).
3. Fold anything from those entries that's still part of the project's
   *current* reality into the "Current State" summary — the day-by-day
   narrative moves to the archive, but nothing genuinely load-bearing should
   simply vanish.
4. Remove the rotated entries from `PROGRESS_LOG.md`.

## Output

State plainly: what entry was appended, whether "Current State" needed an
update (and what changed if so), and whether a rotation happened — and to
which archive file, if it did.
