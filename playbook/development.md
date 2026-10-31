# Development guide

## 1. Start from current code

- Fetch, then branch from the latest default branch.
- Use one branch or worktree per task. Parallel agents must not share one.
- Keep scratch files out of the repository, and do not use a shared stash.
- Read the project's instructions and the code near your change.
- If the code does not match your task description, stop and find out why.

## 2. Find the evidence

Write down what you know before you design anything.

- **Bug:** the exact failure, how to reproduce it, and the cause in the code.
- **Product change:** the data that shows the problem, using read-only queries
  where production data is needed and allowed.
- **External platform:** its current docs or live API. Your memory may be out of
  date, and platforms change.

Separate what you measured from what you assume, and label it in the PR.

## 3. Design for safe failure

- Default to deny. New capabilities start off and need an explicit grant.
- Put a new risky feature behind a flag or staged rollout.
- Make external effects idempotent, with a key stored before or with the effect.
- Update related records in one transaction.
- Keep one source of truth, and derive the rest from it.
- Classify errors by who must act: the user, the operator or the caller.
- Make migrations additive first, and keep old and new code working together.
  Plan how existing data and existing customers move.
- Set limits on every list, upload, loop and paid call.
- Prefer the platform's own controls over custom versions of them.

## 4. Make the change

- Keep each commit to one purpose, with the reason in its message.
- Separate structural moves from behaviour changes.
- Change the smallest surface that solves the task.
- Search for every caller and every place that lists the thing you changed.
  Plans, routes, docs, tests and translations are often repeated.
- Remove code that your change made unused.
- Comment on constraints the code cannot show, not on what the next line does.

### Refactors must prove that nothing changed

Compare something objective before and after, such as:

- a byte comparison of the build output, with path differences normalized
- a compiler pass for unused names
- a test that fails if the code grows back, such as a limit on file size

Look for tests that would now pass without checking anything. A path that moved
can turn a real check into an empty one.

## 5. Verify

Work from narrow to broad.

1. The test for this change
2. The related suite
3. Type check and lint
4. Build
5. The whole suite, or the CI job that covers the same scope
6. The real feature, in a browser or on the real OS, for anything a user touches

Check every platform you ship when you change paths, processes, packaging or
installers. Run `git diff --check` before you commit.

If something fails, read the output and find the cause. Do not retry until it
passes. If you did not run a check, say so.

## 6. Write the PR

```markdown
## Why
The problem and the evidence for it, with numbers, logs or links.

## Change
What changed, by area. Mention behaviour that stays the same on purpose.

## Validation
The commands you ran and their results. For a bug fix, how the old code fails.

## Not included
Known gaps, follow-ups, and anything still unverified.
```

Keep PRs short enough to review. Use exact numbers, and explain anything a reviewer
would otherwise have to work out.

## 7. Ship and follow up

- Know how to roll back before you deploy.
- Run schema and data changes in a safe order, separately from a risky code change.
- Test the released thing end to end through the path a user takes.
- Turn every production bug into a regression test.
- Fix flakes when they first appear. A failure on a PR that did not touch that
  code is a real defect in the test or the product.
- Raise coverage floors after real tests land, in the same PR.

## 8. Work with other agents

- Give one writer ownership of a set of files at a time.
- Check another agent's result in the diff and test output, not in its summary.
- Hand over the branch, what is verified, what is not, and the next step.
- When a shared rule turns out to be wrong, fix the rule with evidence.
