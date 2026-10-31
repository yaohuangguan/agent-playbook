# Contributing

The goal of this project is simple: a weaker model should be able to follow a skill
and do better work. Judge every change by that.

## What helps most

- A real agent failure that a skill should have prevented
- A comparison of a model with and without a skill
- Test templates for more languages
- Clearer steps, or a common mistake that's missing

## Change a skill

Every skill must:

- Work in any repository, with no project-specific commands, paths or product names.
- Have a `description` that says what it does and starts its trigger with "Use this".
- Keep these sections in order: When to use, Steps, Stop and ask when, Common
  mistakes, Report.
- Use numbered steps, each a concrete action.
- Stay under 200 lines. Put extra detail in `references/`.

Prefer evidence. A new rule should point to a real bug, pull request or failed run.
Explain why a step matters, because a model that knows the reason handles
unexpected cases better.

`AGENTS.md` loads in every session, so keep it under 4 KB. Most new guidance belongs
in a skill.

## Add a skill

1. Create `skills/<name>/SKILL.md`.
2. Add a row to the table in `AGENTS.md`.
3. Add it to both README files.

## Add a test template

1. Add `skills/write-tests/examples/<language>/` with a small API and a complete test.
2. Add `skills/write-tests/references/<language>.md`.
3. Add a suite to `tests/mutations.mjs`, with a defect for each guarantee.

## Before you open a pull request

```bash
npm test
```

You'll need Node 24, Python and Go. Every example test must catch every mutation for
the expected reason.

## License

By contributing, you agree that your contribution is licensed under the
[MIT License](LICENSE).
