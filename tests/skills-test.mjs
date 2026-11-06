// Keeps every skill usable by a weaker model: the same predictable structure, no
// project-specific content, and references that resolve.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.argv[2] ?? fileURLToPath(new URL("../", import.meta.url));
const skillsRoot = path.join(root, "skills");
const SECTIONS = ["## When to use", "## Steps", "## Stop and ask when", "## Common mistakes", "## Report"];
// Skills must work in any repository, so nothing here may name a specific project.
const PROJECT_TERMS = /cloudflare|\bD1\b|\bpnpm\b|\bstripe\b|wrangler/i;
const MAX_LINES = 200, MAX_ROUTER_BYTES = 4096;

const names = fs.readdirSync(skillsRoot).sort();
assert(names.length >= 14, "Expected the full skill set");
const router = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
assert(Buffer.byteLength(router) <= MAX_ROUTER_BYTES, "AGENTS.md loads in every session, so it must stay small");

for (const name of names) {
  const text = fs.readFileSync(path.join(skillsRoot, name, "SKILL.md"), "utf8").replaceAll("\r\n", "\n");
  const front = text.match(/^---\nname: (.+)\ndescription: (.+)\n---\n/);
  assert(front, name + ": frontmatter needs a name and a description");
  assert.equal(front[1], name, "Skill name must match its folder");
  assert.match(name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  const description = front[2];
  assert(description.length >= 100 && description.length <= 1024, name + ": description length " + description.length);
  assert.match(description, /\bUse this\b/, name + ": the description must say when to use it");

  let position = -1;
  for (const section of SECTIONS) {
    const next = text.indexOf("\n" + section + "\n");
    assert(next > position, name + ": missing or misplaced section " + section);
    position = next;
  }
  const steps = text.slice(text.indexOf("## Steps"), text.indexOf("## Stop and ask when"));
  assert((steps.match(/^\d+\. /gm) ?? []).length >= 3, name + ": steps must be numbered");
  assert(text.split("\n").length <= MAX_LINES, name + ": keep skills short enough to follow");
  assert(!PROJECT_TERMS.test(text), name + ": contains project-specific content: " + text.match(PROJECT_TERMS)?.[0]);

  // Every file a skill points at, and every skill it names, must exist.
  for (const [, file] of text.matchAll(/`((?:references|examples)\/[^`\s]+)`/g)) {
    assert(fs.existsSync(path.join(skillsRoot, name, file)), name + " points at a missing file: " + file);
  }
  for (const [, other] of text.matchAll(/`([a-z]+(?:-[a-z]+)+)`/g)) {
    const looksLikeSkill = /^(orient|implement|debug|write|audit|fix|refactor|structure|change|secure|use|review|verify|hand)-/.test(other);
    if (looksLikeSkill) assert(names.includes(other), name + " names a missing skill: " + other);
  }

  assert(router.includes("`skills/" + name + "/SKILL.md`"), "AGENTS.md must route to " + name);
}

for (const [, routed] of router.matchAll(/`skills\/([^/`]+)\/SKILL\.md`/g)) assert(names.includes(routed), "AGENTS.md routes to a missing skill: " + routed);
for (const file of fs.readdirSync(path.join(skillsRoot, "write-tests/references"))) {
  const text = fs.readFileSync(path.join(skillsRoot, "write-tests/references", file), "utf8");
  assert(!PROJECT_TERMS.test(text), file + " contains project-specific content");
}
console.log(`PASS: ${names.length} skills have valid metadata, ordered sections, numbered steps, no project-specific content and working references`);
