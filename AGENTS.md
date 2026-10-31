<!-- agent-playbook:start -->
# Engineering rules for coding agents

These rules apply to every coding agent working in this repository. The user's
direct requests and this project's own instructions take precedence over them.

Read the matching guide before you act:

- Writing, changing or reviewing tests: `playbook/testing.md`
- Planning a non-trivial change, migration, refactor, release or PR: `playbook/development.md`

## Work from facts

1. Fetch first. Search the current default branch before saying that something
   does or does not exist. A search on a stale branch proves nothing.
2. Reproduce a bug before fixing it. Read the real failure, log or data.
3. Fix the cause. Do not widen a timeout, add a retry, skip a test or loosen an
   assertion to get a green run unless you can show that is the actual cause.
4. Read the code around your change first, and match its naming and idiom.
5. Treat another agent's summary as a lead, not as evidence. Check it against
   the source before you repeat it.

## Keep changes reviewable

6. One concern per branch. Do not mix behaviour changes into a structural move.
7. Do not build for needs nobody has stated. Remove code you made unused.
8. One source of truth. Derive lists, routes, plans and docs from it. If a file
   is generated, add a `--check` mode to CI.
9. Existing users keep what they have unless the task changes it. Test that too.

## Test rules

10. A test must be able to fail. Break the code on purpose, watch the new test
    fail for the expected reason, then restore the code.
11. Test real code through its real entry point, on the real schema. Never test
    a copy or a re-implementation.
12. Fake only what you do not own, at the process or network boundary. Fakes fail
    closed: an unexpected call is a test failure.
13. A fake must keep the semantics the code relies on, such as transactions.
14. For any protected operation, test no credentials, the wrong owner and the
    right owner. After a denied call, assert that nothing changed.
15. Assert what must not happen as well: no duplicate side effect, no secret in
    the output, no call to a paid or external system.
16. Run retries and concurrent calls against anything that moves money, spends
    quota or has an external effect.
17. Wait for outcomes, not for time. A deadline only guards against a hang, and
    it must be longer than the time the product allows.
18. Every new test must run in CI. Confirm the script or job that executes it.
19. Coverage shows what never ran. It does not show that anything was checked.
    Never narrow its scope, and only raise floors to values you measured.

## Safety

20. Default to deny. Validate input at the boundary and check ownership on every
    resource.
21. Keep secrets out of logs, URLs, errors, test output and commits.
22. Confirm with the user before an irreversible or outward-facing action, unless
    they have already told you to do that specific thing.

## Definition of done

23. Run the narrowest relevant tests, then the wider suite, type check and build.
    For a UI change, also use the feature in a real browser.
24. Report what you ran and the result. Name anything you skipped or could not
    verify. "Should work" is not a result.
25. In a PR, state why, what changed and how it was validated, with measured
    numbers where they exist.
<!-- agent-playbook:end -->
