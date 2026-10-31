# Agent Playbook

[![CI](https://github.com/yaohuangguan/agent-playbook/actions/workflows/ci.yml/badge.svg)](https://github.com/yaohuangguan/agent-playbook/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Step-by-step engineering skills for AI coding agents, written so that weaker models can follow them.**

Works with Claude Code, Codex, Gemini CLI, and any tool that can read a file. MIT licensed, so you can use it in any project, including commercial ones.

[简体中文](README.zh-CN.md)

```bash
npx github:yaohuangguan/agent-playbook .
```

## Why

Coding agents fail in predictable ways. They say a fix works without running it, guess API names, mock the code under test, loosen an assertion to get a green build, and retry the same broken idea.

Telling an agent to "write good tests" doesn't help much. Agent Playbook gives it the procedure a careful engineer follows: what to do next, when to stop and ask, which shortcuts are traps, and what evidence to report.

| Without a procedure | With Agent Playbook |
| --- | --- |
| "This should work now." | Names the command it ran and the result |
| Adds `user?.email` to stop a crash | Finds out why the user was missing |
| Mocks the database, and the test passes | Uses a real test database, and proves the test can fail |
| Raises a sleep to fix a flaky test | Reproduces it under load, then waits for the real outcome |
| Reports "add tests for billing" | Reports the exact defect, with the evidence and test case |

## Skills

| Skill | Use it for |
| --- | --- |
| [orient-in-codebase](skills/orient-in-codebase/SKILL.md) | Learning a repository's real commands and current health |
| [implement-change](skills/implement-change/SKILL.md) | Any feature, fix or behaviour change |
| [debug-failure](skills/debug-failure/SKILL.md) | Finding a root cause before fixing |
| [write-tests](skills/write-tests/SKILL.md) | Tests that catch real defects, with JavaScript, Python and Go templates |
| [audit-test-suite](skills/audit-test-suite/SKILL.md) | Finding weak spots, ranked by risk |
| [fix-flaky-test](skills/fix-flaky-test/SKILL.md) | Fixing intermittent failures without retries |
| [refactor-safely](skills/refactor-safely/SKILL.md) | Restructuring code, and proving nothing changed |
| [change-data-safely](skills/change-data-safely/SKILL.md) | Migrations, backfills and bulk data changes |
| [secure-change](skills/secure-change/SKILL.md) | Login, permissions, input, secrets and payments |
| [use-external-api](skills/use-external-api/SKILL.md) | Checking real docs and versions instead of guessing |
| [review-code](skills/review-code/SKILL.md) | Reviews where every finding is verified |
| [verify-and-report](skills/verify-and-report/SKILL.md) | Honest, evidence-based completion reports |
| [write-pull-request](skills/write-pull-request/SKILL.md) | Commits and pull requests that are quick to review |
| [hand-off-work](skills/hand-off-work/SKILL.md) | Passing work to another agent or a later session |

## Install

Requires Node 24 or later.

**In a project**, so that everyone and every agent on the project gets the rules:

```bash
npx github:yaohuangguan/agent-playbook /path/to/project
```

**On your machine**, so that the skills are available in every repository:

```bash
npx github:yaohuangguan/agent-playbook --global
```

Rerunning is safe. To check for an out-of-date install in CI:

```bash
npx github:yaohuangguan/agent-playbook /path/to/project --check
```

### What gets installed

| Location | Read by |
| --- | --- |
| `AGENTS.md` | Codex directly, and Claude Code and Gemini CLI through the two files below |
| `CLAUDE.md`, adds `@AGENTS.md` | Claude Code |
| `.gemini/settings.json`, adds `AGENTS.md` to `context.fileName` | Gemini CLI |
| `.agents/skills/` | Codex and Gemini CLI |
| `.claude/skills/` | Claude Code |

Your own content is kept. Only the marked block in `AGENTS.md` is replaced. If a file can't be updated safely, the installer stops and writes nothing.

A global install writes only `~/.agents/skills/` and `~/.claude/skills/`, and leaves your global rule files alone.

## How it works

`AGENTS.md` loads in every session, so it stays small. It holds a table that routes each kind of task to a skill, plus 10 rules that always apply. An agent opens a skill only when the task needs it. Tools with no skill support can still follow the table and read the file.

Every skill has the same structure, enforced by a test:

1. **When to use**, so the agent picks the right skill.
2. **Numbered steps**, each a concrete action.
3. **Stop and ask when**, so it doesn't guess at a decision that isn't its to make.
4. **Common mistakes**: the tempting move, why it fails, and what to do instead.
5. **Report**: a fixed template that makes it state what it ran and what it didn't check.

The skills avoid project-specific commands and paths. Put your own in `AGENTS.md`, outside the marked block, and they take priority.

## Tested

`npm test` runs on Linux, Windows and macOS:

- **Skill structure:** every skill has valid metadata, all its sections, working links and no project-specific content.
- **Installer:** fresh installs, reruns, drift detection, preserved files, and refusing unsafe changes.
- **Mutation proof:** 30 deliberate defects across the JavaScript, Python and Go templates. Each must make the example tests fail for the expected reason.

**What hasn't been measured yet:** there is no benchmark of how much these skills improve a given model. The comparison table above describes the intended behaviour, not measured results. If you run a comparison, please share it in an issue.

## Where this comes from

The practices were extracted from the tests and pull requests of a large production codebase, then rewritten to work in any repository.

## Contributing

New skills, language templates and real failure examples are all welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 Sam Yao
