# Evidence from Remote Arc

These rules come from reading [Remote Arc](https://github.com/Remote-Arc/remote-arc)
at commit [`116eca7`](https://github.com/Remote-Arc/remote-arc/tree/116eca7802d1419f32901f58232c29d5a1f7f78c),
measured on 2026-10-31. Counts are `git grep` results on that commit, so they
are a snapshot. This file is not installed into projects.

## Where each rule comes from

| Rule | Evidence |
| --- | --- |
| Real entry point and schema | [`worker-fixture.ts`](https://github.com/Remote-Arc/remote-arc/blob/116eca7802d1419f32901f58232c29d5a1f7f78c/apps/relay/scripts/worker-fixture.ts) runs `src/index.ts` on every real migration, on in-memory SQLite |
| Never test a copy | [PR 425](https://github.com/Remote-Arc/remote-arc/pull/425): two harnesses compiled a copy of the relay and could have passed without checking anything after a move |
| Every test must run in CI | PR 425 again: eight arc test files were in no script or job |
| Fail-closed fakes | [`connect-unlimited-test.ts`](https://github.com/Remote-Arc/remote-arc/blob/116eca7802d1419f32901f58232c29d5a1f7f78c/apps/relay/scripts/connect-unlimited-test.ts) rejects unexpected Stripe calls and mutations. [`tests/site/fixtures.ts`](https://github.com/Remote-Arc/remote-arc/blob/116eca7802d1419f32901f58232c29d5a1f7f78c/tests/site/fixtures.ts) aborts every non-local request |
| Permission matrix | [`device-management-test.ts`](https://github.com/Remote-Arc/remote-arc/blob/116eca7802d1419f32901f58232c29d5a1f7f78c/apps/relay/scripts/device-management-test.ts) for ownership. [`organization-flow-test.ts`](https://github.com/Remote-Arc/remote-arc/blob/116eca7802d1419f32901f58232c29d5a1f7f78c/apps/relay/scripts/organization-flow-test.ts) for roles and origin |
| Prove what did not happen | `connect-unlimited-test.ts` asserts zero Credits, zero model grants and no funding pool entry for a subscriber |
| Secret canaries | [`apps-test.ts`](https://github.com/Remote-Arc/remote-arc/blob/116eca7802d1419f32901f58232c29d5a1f7f78c/apps/relay/scripts/apps-test.ts) and [`admin-user-activation-test.ts`](https://github.com/Remote-Arc/remote-arc/blob/116eca7802d1419f32901f58232c29d5a1f7f78c/apps/relay/scripts/admin-user-activation-test.ts) search output for planted secrets |
| Retries and races | `apps-test.ts` runs 12 concurrent calls. [`stripe-billing-test.ts`](https://github.com/Remote-Arc/remote-arc/blob/116eca7802d1419f32901f58232c29d5a1f7f78c/apps/relay/scripts/stripe-billing-test.ts) covers duplicate events and replay |
| Literal storage characters | `admin-user-activation-test.ts` has a user named `literal_%` |
| Input limits | `device-management-test.ts` stores a 100-character name as 80, and rejects a 65-item list. The playbook goes further and tests both sides of each limit |
| Deterministic time | [`schedule-clock-test.ts`](https://github.com/Remote-Arc/remote-arc/blob/116eca7802d1419f32901f58232c29d5a1f7f78c/apps/relay/scripts/schedule-clock-test.ts) tests slots at exact timestamps, one second apart |
| Wait for outcomes, with the product's budget | [PR 437](https://github.com/Remote-Arc/remote-arc/pull/437) replaced fixed waits and reproduced both flakes by slowing the code |
| Classify failures by who must act | [PR 443](https://github.com/Remote-Arc/remote-arc/pull/443) stopped reporting a user's unresponsive computer as a critical Relay incident |
| Derive test lists from the source | [`routes.spec.ts`](https://github.com/Remote-Arc/remote-arc/blob/116eca7802d1419f32901f58232c29d5a1f7f78c/tests/site/routes.spec.ts) builds routes from the app's catalogs |
| Browser matrix, no retries | [`playwright.config.ts`](https://github.com/Remote-Arc/remote-arc/blob/116eca7802d1419f32901f58232c29d5a1f7f78c/playwright.config.ts) has desktop English light and mobile Chinese dark, `retries: 0`, `forbidOnly` in CI |
| Coverage honesty | [`docs/test-coverage.md`](https://github.com/Remote-Arc/remote-arc/blob/116eca7802d1419f32901f58232c29d5a1f7f78c/docs/test-coverage.md) and [`coverage-policy.mjs`](https://github.com/Remote-Arc/remote-arc/blob/116eca7802d1419f32901f58232c29d5a1f7f78c/scripts/coverage-policy.mjs): measured floors, unchanged scope, a separate strict target |
| Refactors prove equivalence | PR 425: the Worker bundle was byte-identical once module-path keys were normalized |
| Size guards after a split | [`app-entry-test.mjs`](https://github.com/Remote-Arc/remote-arc/blob/116eca7802d1419f32901f58232c29d5a1f7f78c/apps/ui/scripts/app-entry-test.mjs) fails if split files grow back |
| Evidence-led PRs | PR 443 starts from 7 days of read-only production data |
| Test the path a user takes | [PR 434](https://github.com/Remote-Arc/remote-arc/pull/434) fixes a scheduling bug found by production acceptance testing through a real connector |

## Review of the Gemini summary

Gemini's summary was useful, but it turned some single examples into universal
rules. It described recent work well and the whole repository less well.

| Claim | Verdict | What the code shows |
| --- | --- | --- |
| Tests use `createWorkerFixture` | Partly true | It exists on master, but only 2 test files use it. 42 other files create their own in-memory SQLite |
| No mocks at all | Too strong | 29 files replace `globalThis.fetch`, and the fixture stubs the registry and rate limiters. The real rule is to fake only at the boundary |
| Real HMAC cookie signing | Not supported | `createSession` stores a SHA-256 hash of a random token, and `auth.ts` has no HMAC |
| Every endpoint has three permission layers | Too strong | This describes the device and organization tests well. `intruder` appears in 1 file |
| Cross-tenant access returns 403 or 404 | Needs detail | Non-owners get 404, which hides existence. 403 is for roles and rejected origins |
| Input boundary examples | True | The 80-character, 65-item and 409 examples are all in `device-management-test.ts` |
| Tests inspect `audit_events` | Partly true | 8 test scripts mention the table. It is not universal |
| Passwords and OTPs are checked for redaction | Not found | A pattern search found no such test. The privacy checks I found use planted tokens |
| `node:assert/strict` is nearly universal | True for Node scripts | 164 files use it. Playwright, 12 `node:test` files and Go tests exist too |
| Helpers such as `expectError` are standard | Too strong | `expectError` is in 2 files |
| Unified `PASS:` output | True | 101 files print it |
| Go tests never use fixed waits | Too strong | 23 `time.Sleep` lines remain in 15 test files, many as poll intervals. PR 437 is the real rule |

The summary also missed the rules that catch the most: proving a test can fail,
confirming CI runs it, testing real sources, fail-closed fakes, asserting what did
not happen, and testing replays and races.

## What not to copy from Remote Arc

- **Copied database shims.** 42 files build their own in-memory SQLite. Only some
  shims roll back a batch or reject `undefined`. `worker-fixture.ts` itself runs a
  batch with no transaction, while D1 batches are transactional.
- **Source-text tests.** 5 of 38 UI test scripts assert on source through
  `appSource`. PR 425 had to repair one of these after a move.
- **Very dense test files.** `arc-acceptance-resume-test.ts` keeps its whole test
  on one line, and others put many statements on a line. They are hard to review.
- **Long sequential scripts for independent cases.** The first failure hides the
  rest, and one case cannot be run alone. They suit a single ordered flow.
- **Long `&&` chains as the only test registry.** This is how eight tests got lost.
  I found no automatic check that every test file is wired in.
- **Reading coverage too generously.** The measured combined baseline was 54.41%
  and TypeScript 50.25%. Relay at 89.24% is one scope.

These are places to improve, not criticism of the tests that exist. Remote Arc
catches real bugs with them.
