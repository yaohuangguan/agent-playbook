# Testing guide

The goal of a test is to catch a real defect. A test that cannot fail, or that
only repeats the implementation, costs time and gives false confidence.

## 1. Choose what to test

Rank by the damage a defect would cause, not by the lowest coverage number.

1. Money, credits, quota and entitlements
2. Authentication, authorization and tenant isolation
3. Data loss and irreversible operations
4. Secrets and personal data
5. State machines, schedules and retries
6. Everything else

Before writing anything new, do these checks. They are often cheaper than new
tests and find more.

- **Do existing tests run?** List the test files and confirm that a script or CI
  job executes each one. Test files that nothing runs are common.
- **Do they test the real code?** A harness that compiles a private copy can
  pass after the real code has moved or broken.
- **What does the coverage number measure?** Check which suites and files are in
  scope before you trust the percentage.

Use coverage to find code that never ran, then ask what could go wrong there.
An uncovered line in a payment path matters more than ten in a formatter.

## 2. Choose the test level

| Behaviour | Level |
| --- | --- |
| Pure rule: dates, parsing, limits | Unit test with a fixed table of inputs |
| API, permissions, persistence | Real entry point, real schema, in-memory database |
| External provider | Real client code with a stub at the network boundary |
| Multi-step business flow | One scenario in order, through real entry points |
| UI behaviour | Browser test against a local app |
| OS, filesystem, processes | Real OS, on the platforms you ship |

Start at the highest level that stays fast and deterministic. Add unit tests for
rules with many edge cases.

## 3. Fake only at the boundary

Keep real: your handlers, schema, SQL, validation, policy and serialization.
Fake: third-party APIs, the clock when needed, and platform bindings that cannot
run locally.

Do not mock your own modules. If a module cannot be tested without that, change
its seam.

A network fake must fail closed:

```js
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input));
  assert.equal(url.origin, "https://api.provider.test");
  assert.notEqual(init?.method, "POST", "Unexpected provider mutation " + url.pathname);
  const response = responses[url.pathname + url.search];
  assert(response, "Unexpected provider call " + url.pathname + url.search);
  return Response.json(response);
};
```

Restore globals and close resources in `finally`, so that a failure stays visible
and cannot affect the next test.

### Keep fakes faithful

A fake that is more forgiving than production hides bugs. List the semantics your
code depends on and copy them:

- Batches and transactions must roll back as a unit.
- If production rejects `undefined` bindings, the fake must too.
- Foreign keys must be on.
- Migrations must be applied from the real files, in order.

Keep one shared fixture per boundary. When each test file has its own copy, the
copies drift apart and some lose these guarantees.

## 4. Test permissions as a matrix

For each protected operation:

| Caller | Expected | Also assert |
| --- | --- | --- |
| No credentials | 401 | No state change |
| Forged or expired credentials | 401 | No state change |
| Valid user, someone else's resource | 404 | Same body as a missing resource, no state change |
| Member without the required role | 403 | No state change |
| Owner | 2xx | Stored state, not only the response |
| Wrong origin on a cookie-authenticated write | 403 | No state change |

Use 404 when the caller should not learn that the resource exists. Use 403 when
the caller can already see it but may not perform the action. Follow the project's
existing convention if it differs.

Run the matrix over a list of endpoints, so that a new endpoint is one new row.

A compact helper keeps the matrix readable:

```js
const expectError = async (response, status, error) => {
  const result = await response;
  assert.equal(result.status, status);
  const body = await result.json();
  if (typeof error === "string") assert.equal(body.error, error);
  else assert.match(body.error, error);
  return body;
};
```

## 5. Test input boundaries

Use exact limits, on both sides of each limit:

- Empty, whitespace only, and the wrong type
- The maximum, and one over the maximum
- Duplicates, and mixed valid and invalid items
- Unicode, encoded paths, and characters that are special in the storage layer,
  such as `%` and `_` in `LIKE`
- Conflicting state, such as enabling a feature before its prerequisite

Assert the stored value as well as the response.

## 6. Prove what did not happen

Most serious bugs are side effects that should not have occurred.

- After a denied or failed call, compare the state with the state before it.
- Assert exact counts of side effects: one email, one charge, zero model calls.
- Check that the audit or event record exists and holds the right fields.
- Put a unique canary in secrets, then search everything the caller can see:

```js
assert(!JSON.stringify(response).includes("canary-private-token"));
assert(!auditRows.includes("canary-private-token"));
```

## 7. Test retries, replays and races

Anything triggered by a webhook, queue, schedule or user double-click runs more
than once eventually.

- Deliver the same event twice and assert one effect.
- Send concurrent requests with `Promise.all` and assert that exactly one wins.
- Fail after the first step of a multi-step operation, then retry.
- Test the ordering you do not expect, such as a refund before the payment event.
- Test near limits, where two callers can both pass a check before either writes.

## 8. Test failure paths

For each dependency, test a timeout, an error response and malformed data.
Assert how the failure is classified, because that drives alerts and user
messages. A user's offline device is not a server outage.

## 9. Make time and waiting deterministic

- Pass the clock in, and use fixed timestamps for date rules.
- Test both sides of each time boundary.
- Do not synchronize with sleeps. Wait for a condition or an explicit signal.
- A short sleep inside a polling loop is fine. A sleep that assumes work has
  finished is not.
- A deadline only guards against a hang. Base it on the product's own budget. If
  the product allows a capture 25 seconds, a 3-second test wait will flake.
- When you fix a flaky test, slow the code down to reproduce the failure first,
  then show that the new wait survives the same delay.

```go
// A slow host must not end the run first; this bound only catches a hang.
const settleTimeout = 60 * time.Second

deadline := time.Now().Add(settleTimeout)
for !finished() {
	if time.Now().After(deadline) {
		t.Fatalf("did not settle within %v:\n%s", settleTimeout, output())
	}
	time.Sleep(50 * time.Millisecond)
}
```

## 10. Write assertions that explain themselves

- Use strict equality and compare exact values.
- Say why in the message when the value alone does not:
  `assert.equal(count, 0, "Connect revenue never joins the paid funding pool")`.
- Name the rule in the comment above a group of assertions.
- Compare whole objects where the full shape matters.
- Prefer one clear file per behaviour to a wall of dense lines. A test that a
  reviewer cannot read will not be reviewed.

## 11. Browser tests

- Fail on any uncaught page error, through a fixture that applies to every test.
- Block every origin except the local app, so a test cannot reach a real system.
- Derive route lists from the app's own catalog, so new pages are covered.
- Query by role and visible text. Avoid CSS structure.
- Cover the combinations users have, such as desktop and mobile, each language,
  and light and dark theme.
- Check horizontal overflow, internal links and focus handling.
- Keep retries at zero in CI, and forbid `.only`. A retry hides a flake.
- Keep traces and screenshots for failures.

## 12. Go tests

- Use `t.TempDir()`, `t.Setenv()`, `t.Cleanup()` and `t.Helper()`.
- Use `httptest` for HTTP boundaries.
- Run with `-race` in CI. Use `-count=3` to expose timing problems.
- Test on every OS you ship. Paths, processes and signals differ.
- For filesystem policy, cover symlink and junction escapes, cycles and missing
  descendants.
- Keep OS-only code in `_windows_test.go` files or behind build tags.

## 13. Prove the test works

Do this for every new test or fix.

1. Run the test against the bug, or break the code on purpose.
2. Confirm that it fails **with the expected message**.
3. Restore the code and confirm that it passes.

For a critical module, automate this as a mutation script. See
`examples/device-api/mutations.mjs` in the agent-playbook repository.

Good mutations remove an owner check, change `<=` to `<`, skip an audit write,
remove an idempotency guard, or return a secret field.

## 14. Keep suites healthy

- Wire every test into a script or job that CI runs.
- Quarantine nothing silently. Fix a flake, or disable it with a linked issue.
- Keep coverage floors as a ratchet: raise them to measured values, never lower
  them to pass, and never remove production files from scope.
- Do not claim a target from a passing floor. A floor of 50% that passes does not
  show 90%.
- Keep test output free of secrets and real customer data.

## 15. Anti-patterns

| Anti-pattern | Why it fails | Instead |
| --- | --- | --- |
| Asserting on source text | Breaks on a move and misses behaviour | Exercise the behaviour |
| Testing a copied module | Passes after the real code changes | Import the real source |
| A mock that returns what the test expects | Proves only the mock | Run real code to the boundary |
| `assert.ok(result)` | Passes on almost anything | Assert the exact value |
| Checking only the response | Misses storage bugs | Read the stored state |
| Sleeping for a fixed time | Flakes on slow hosts | Wait for the outcome |
| Only the happy path | Misses most real incidents | Add the permission and failure matrix |
| Loosening an assertion to pass | Hides the defect | Find out why it failed |
| Snapshotting everything | Reviewers approve noise | Assert the fields that matter |
| A new test no job runs | Never protects anything | Wire it into CI, then confirm it ran |

## 16. Review checklist

- [ ] It failed for the right reason before the fix, or under a deliberate break.
- [ ] It runs real code, through a real entry point.
- [ ] Unexpected external calls fail the test.
- [ ] Denied calls are covered, and they changed nothing.
- [ ] Boundaries are tested on both sides.
- [ ] Side effects are counted, and secrets are checked with a canary.
- [ ] Retries and concurrency are covered where effects are external.
- [ ] It does not depend on timing, order or leftover state.
- [ ] CI runs it.
