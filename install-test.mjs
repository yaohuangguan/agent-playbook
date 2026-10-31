import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const installer = fileURLToPath(new URL("./install.mjs", import.meta.url));
const base = fs.mkdtempSync(path.join(os.tmpdir(), "agent-playbook-install-"));
const run = (...args) => spawnSync(process.execPath, [installer, ...args], { encoding: "utf8" });
let count = 0;
const project = (files = {}) => {
  const directory = path.join(base, "project-" + ++count);
  for (const [name, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(directory, name)), { recursive: true });
    fs.writeFileSync(path.join(directory, name), text);
  }
  fs.mkdirSync(directory, { recursive: true });
  return directory;
};
const read = (directory, name) => fs.readFileSync(path.join(directory, name), "utf8");
const exists = (directory, name) => fs.existsSync(path.join(directory, name));

try {
  // A fresh project gets every file, and guide paths point at the installed copies.
  const fresh = project();
  assert.equal(run(fresh, "--check").status, 1, "A fresh project is out of date");
  assert.equal(fs.readdirSync(fresh).length, 0, "--check writes nothing");
  assert.equal(run(fresh).status, 0);
  assert.match(read(fresh, "AGENTS.md"), /`\.agent-playbook\/testing\.md`/);
  assert.doesNotMatch(read(fresh, "AGENTS.md"), /`playbook\//);
  assert.equal(read(fresh, "CLAUDE.md"), "@AGENTS.md\n");
  assert.deepEqual(JSON.parse(read(fresh, ".gemini/settings.json")).context.fileName, ["AGENTS.md", "GEMINI.md"]);
  assert(exists(fresh, ".agent-playbook/testing.md") && exists(fresh, ".agent-playbook/development.md"));

  // A second run changes nothing, and --check agrees.
  const before = read(fresh, "AGENTS.md");
  assert.match(run(fresh).stdout, /up to date/);
  assert.equal(read(fresh, "AGENTS.md"), before);
  assert.equal(run(fresh, "--check").status, 0);

  // A stale copy is reported, then repaired.
  fs.appendFileSync(path.join(fresh, ".agent-playbook/testing.md"), "local edit\n");
  const drift = run(fresh, "--check");
  assert.equal(drift.status, 1);
  assert.match(drift.stderr, /out of date: \.agent-playbook\/testing\.md/);
  assert.equal(run(fresh).status, 0);
  assert.equal(run(fresh, "--check").status, 0);

  // The project's own instructions survive, and only the block is replaced.
  const own = project({
    "AGENTS.md": "# Project rules\r\n\r\nUse pnpm.\r\n\r\n<!-- agent-playbook:start -->\nold rules\n<!-- agent-playbook:end -->\n\n## After\nKeep me.\n",
    "CLAUDE.md": "# Claude notes\nKeep me too.\n",
    ".gemini/settings.json": JSON.stringify({ theme: "dark", context: { fileName: "CONTEXT.md", loadMemoryFromIncludeDirectories: true } }),
  });
  assert.equal(run(own).status, 0);
  const agents = read(own, "AGENTS.md");
  assert.match(agents, /^# Project rules/);
  assert.match(agents, /Use pnpm\./);
  assert.match(agents, /## After\nKeep me\./);
  assert.doesNotMatch(agents, /old rules/);
  assert.match(read(own, "CLAUDE.md"), /^# Claude notes\nKeep me too\.\n\n@AGENTS\.md\n$/);
  const gemini = JSON.parse(read(own, ".gemini/settings.json"));
  assert.equal(gemini.theme, "dark");
  assert.equal(gemini.context.loadMemoryFromIncludeDirectories, true);
  assert.deepEqual(gemini.context.fileName, ["AGENTS.md", "CONTEXT.md"]);
  assert.equal(run(own, "--check").status, 0);

  // Instructions with no block get one appended, without touching what is there.
  const appended = project({ "AGENTS.md": "# Mine\n" });
  assert.equal(run(appended).status, 0);
  assert.match(read(appended, "AGENTS.md"), /^# Mine\n\n<!-- agent-playbook:start -->/);

  // A file it cannot safely update stops the run before anything is written.
  const invalid = project({ ".gemini/settings.json": "{ // comments\n}" });
  const refused = run(invalid);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /not plain JSON/);
  assert(!exists(invalid, "AGENTS.md") && !exists(invalid, "CLAUDE.md"), "Nothing is written after a refusal");
  const damaged = project({ "AGENTS.md": "<!-- agent-playbook:start -->\nno end marker\n" });
  assert.match(run(damaged).stderr, /damaged/);
  assert.equal(read(damaged, "AGENTS.md"), "<!-- agent-playbook:start -->\nno end marker\n");

  assert.match(run().stderr, /usage/);
  assert.match(run(path.join(base, "missing")).stderr, /not found/);
  console.log("PASS: fresh install, idempotent rerun, drift check, preserved project files, merged settings and refusal without writes");
} finally {
  fs.rmSync(base, { recursive: true, force: true });
}
