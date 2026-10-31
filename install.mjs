#!/usr/bin/env node
// Copies the playbook into a project, so every agent that opens it finds the rules.
// Usage: node install.mjs <project> [--check]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const START = "<!-- agent-playbook:start -->", END = "<!-- agent-playbook:end -->";
const root = path.dirname(fileURLToPath(import.meta.url));
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n") : null;
const fail = (message) => { console.error("agent-playbook: " + message); process.exit(1); };

function agentsFile(current) {
  // Installed guides live in .agent-playbook, because "playbook" may be a project folder.
  const block = read(path.join(root, "AGENTS.md")).replace(/`playbook\//g, "`.agent-playbook/").trim();
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

const args = process.argv.slice(2), check = args.includes("--check"), [project] = args.filter((arg) => arg !== "--check");
if (!project) fail("usage: node install.mjs <project> [--check]");
if (!fs.statSync(project, { throwIfNoEntry: false })?.isDirectory()) fail("project folder not found: " + project);

// Everything is computed first, so that a problem in one file writes nothing.
const planned = [
  ["AGENTS.md", agentsFile],
  ["CLAUDE.md", claudeFile],
  [".gemini/settings.json", geminiSettings],
  ...["testing.md", "development.md"].map((name) => [".agent-playbook/" + name, () => read(path.join(root, "playbook", name))]),
].map(([name, build]) => {
  const file = path.join(project, name), current = read(file);
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
  console.log(planned.length ? "updated: " + planned.map(({ name }) => name).join(", ") : "agent-playbook is up to date");
}
