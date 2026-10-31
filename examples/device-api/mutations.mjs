// Proves that app-test.mjs can fail. Each mutation breaks one guarantee in a temp
// copy of app.mjs, and the test must then fail with the expected message.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const source = fs.readFileSync(new URL("./app.mjs", import.meta.url), "utf8").replaceAll("\r\n", "\n");
const test = fs.readFileSync(new URL("./app-test.mjs", import.meta.url), "utf8");
const schema = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");

const mutations = [
  ["session check removed", 'if (!userId) return json({ error: "unauthorized" }, 401);', "", /unauthorized|401|status/i],
  ["owner check removed", "WHERE id=? AND user_id=?\").get(deviceId, userId)", "WHERE id=?\").get(deviceId)", /Expected values to be strictly equal|404/],
  ["blank names accepted", '|| !name.trim()', "", /400/],
  ["limit off by one", "slice(0, MAX_NAME)", "slice(0, MAX_NAME - 1)", /Expected values to be strictly equal/],
  ["limit removed from stored value", 'run(next, deviceId)', "run(name.trim(), deviceId)", /stored name is bounded/],
  ["audit row skipped", /  sql\.prepare\("INSERT INTO audit_events.*\n/, "", /Expected values to be strictly deep-equal/],
  ["secret returned", "return json({ id: device.id, name: next });", "return json({ ...device, name: next });", /credential never leaves/],
  ["unpaid events accepted", 'if (event.status !== "paid") return json({ error: "payment not verified" }, 409);', "", /409/],
  ["provider failure ignored", 'if (!response.ok) return json({ error: "payment not verified" }, 502);', "", /502/],
  ["replay guard removed", "if (inserted.changes) sql", "sql", /grant the credit once/],
];

function run(appSource) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "agent-playbook-mutation-"));
  try {
    fs.writeFileSync(path.join(directory, "app.mjs"), appSource);
    fs.writeFileSync(path.join(directory, "app-test.mjs"), test);
    fs.writeFileSync(path.join(directory, "schema.sql"), schema);
    return spawnSync(process.execPath, ["--no-warnings", path.join(directory, "app-test.mjs")], { encoding: "utf8" });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

assert.equal(run(source).status, 0, "The unmodified app must pass");
for (const [name, search, replacement, expected] of mutations) {
  const mutated = source.replace(search, replacement);
  assert.notEqual(mutated, source, "Mutation no longer applies: " + name);
  const result = run(mutated);
  assert.notEqual(result.status, 0, "The test missed: " + name);
  assert.match(result.stderr, expected, "The test failed for the wrong reason: " + name + "\n" + result.stderr);
}
console.log(`PASS: the test caught ${mutations.length} of ${mutations.length} deliberate defects, each for the expected reason`);
