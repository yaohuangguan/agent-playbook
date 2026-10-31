#!/usr/bin/env node
// Installs the skills so that coding agents can find them.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const START = "<!-- agent-playbook:start -->", END = "<!-- agent-playbook:end -->";
// Codex and Gemini CLI read .agents/skills, and Claude Code reads .claude/skills.
const SKILL_ROOTS = [".agents/skills", ".claude/skills"];
const USAGE = `Usage:
  agent-playbook <project> [--check]   Install rules and skills into a project
  agent-playbook --global [--check]    Install skills for every project on this machine

--check reports what is out of date, and writes nothing.`;
const root = path.dirname(fileURLToPath(import.meta.url));
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n") : null;
const fail = (message) => { console.error("agent-playbook: " + message); process.exit(1); };

function agentsFile(current) {
  const block = read(path.join(root, "AGENTS.md")).replace(/`skills\//g, "`.agents/skills/").trim();
  if (current === null) return block + "\n";
  const start = current.indexOf(START), end = current.indexOf(END);
  if ((start === -1) !== (end === -1) || end < start) fail("AGENTS.md has a damaged agent-playbook block");
  if (start === -1) return current.trimEnd() + "\n\n" + block + "\n";
  return current.slice(0, start) + block + current.slice(end + END.length);
}

function claudeFile(current) {
  if (current === null) return "@AGENTS.md\n";
  return current.split("\n").some((line) => line.trim() === "@AGENTS.md") ? current : current.trimEnd() + "\n\n@AGENTS.md\n";
}

function geminiSettings(current) {
  let settings = {};
  if (current !== null) {
    try { settings = JSON.parse(current); } catch { fail(".gemini/settings.json is not plain JSON; add AGENTS.md to context.fileName by hand"); }
  }
  const names = [settings.context?.fileName ?? "GEMINI.md"].flat();
  if (names.includes("AGENTS.md")) return current;
  return JSON.stringify({ ...settings, context: { ...settings.context, fileName: ["AGENTS.md", ...names] } }, null, 2) + "\n";
}

const skillFiles = fs.readdirSync(path.join(root, "skills"), { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => path.relative(path.join(root, "skills"), path.join(entry.parentPath, entry.name)).replaceAll("\\", "/"));

const args = process.argv.slice(2), check = args.includes("--check"), global = args.includes("--global");
if (args.includes("--help") || args.includes("-h")) { console.log(USAGE); process.exit(0); }
const [project] = args.filter((arg) => !arg.startsWith("--"));
if (!global && !project) fail("a project folder or --global is required\n\n" + USAGE);
if (global && project) fail("use either a project folder or --global, not both");
const target = global ? os.homedir() : project;
if (!fs.statSync(target, { throwIfNoEntry: false })?.isDirectory()) fail("project folder not found: " + target);

// Everything is computed first, so that a problem in one file writes nothing.
const planned = [
  ...(global ? [] : [["AGENTS.md", agentsFile], ["CLAUDE.md", claudeFile], [".gemini/settings.json", geminiSettings]]),
  ...SKILL_ROOTS.flatMap((skills) => [
    ...skillFiles.map((name) => [skills + "/" + name, () => read(path.join(root, "skills", name))]),
    // The MIT license requires its notice to travel with every copy.
    [skills + "/AGENT-PLAYBOOK-LICENSE", () => read(path.join(root, "LICENSE"))],
  ]),
].map(([name, build]) => {
  const file = path.join(target, name), current = read(file);
  return { name, file, current, next: build(current) };
}).filter(({ current, next }) => current !== next);

if (check) {
  for (const { name } of planned) console.error("out of date: " + name);
  if (planned.length) process.exit(1);
  console.log("agent-playbook is up to date");
} else {
  for (const { file, next } of planned) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, next);
  }
  console.log(planned.length ? `updated ${planned.length} files in ${target}` : "agent-playbook is up to date");
}
