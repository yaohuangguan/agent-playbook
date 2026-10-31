// Proves that each example test can fail. Every mutation breaks one guarantee in a
// temp copy of the example, and its test must then fail with the expected message.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const examples = fileURLToPath(new URL("../skills/write-tests/examples/", import.meta.url));
const python = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");

const suites = [
  {
    language: "javascript", source: "app.mjs", command: [process.execPath, "--no-warnings", "app-test.mjs"],
    mutations: [
      ["session check removed", 'if (!userId) return json({ error: "unauthorized" }, 401);', "", /unauthorized|401/],
      ["owner check removed", 'WHERE id=? AND user_id=?").get(deviceId, userId)', 'WHERE id=?").get(deviceId)', /Expected values to be strictly equal|404/],
      ["blank names accepted", "|| !name.trim()", "", /400/],
      ["limit off by one", "slice(0, MAX_NAME)", "slice(0, MAX_NAME - 1)", /Expected values to be strictly equal/],
      ["stored value unbounded", "run(next, deviceId)", "run(name.trim(), deviceId)", /stored name is bounded/],
      ["audit row skipped", /  sql\.prepare\("INSERT INTO audit_events.*\n/, "", /strictly deep-equal/],
      ["secret returned", "return json({ id: device.id, name: next });", "return json({ ...device, name: next });", /credential never leaves/],
      ["unpaid events accepted", 'if (event.status !== "paid") return json({ error: "payment not verified" }, 409);', "", /409/],
      ["provider failure ignored", 'if (!response.ok) return json({ error: "payment not verified" }, 502);', "", /502/],
      ["replay guard removed", "if (inserted.changes) sql", "sql", /grant the credit once/],
    ],
  },
  {
    language: "python", source: "app.py", command: [python, "-B", "-m", "unittest"],
    mutations: [
      ["session check removed", '            if not user_id:\n                return 401, {"error": "unauthorized"}\n', "", /401|unauthorized/],
      ["owner check removed", 'WHERE id=? AND user_id=?", (device_id, user_id)', 'WHERE id=?", (device_id,)', /404|device not found/],
      ["blank names accepted", " or not name.strip()", "", /name is required/],
      ["limit off by one", "[:MAX_NAME]", "[:MAX_NAME - 1]", /test_name_limit_on_both_sides/],
      ["stored value unbounded", "(next_name, device_id)", "(name.strip(), device_id)", /stored name is bounded/],
      ["audit row skipped", /                self\.db\.execute\(\n                    "INSERT INTO audit_events[\s\S]*?\n                \)\n/, "", /test_each_change_is_audited_once/],
      ["secret returned", 'return 200, {"id": device[0], "name": next_name}', 'return 200, {"id": device[0], "name": next_name, "credential": device[1]}', /credential never leaves/],
      ["unpaid events accepted", '        if event["status"] != "paid":\n            return 409, {"error": "payment not verified"}\n', "", /test_unpaid_event_grants_nothing/],
      ["provider failure ignored", 'except ProviderError:\n            return 502, {"error": "payment not verified"}', "except ProviderError:\n            raise", /test_provider_outage_grants_nothing/],
      ["replay guard removed", "if inserted.rowcount:", "if True:", /grant the credit once/],
    ],
  },
  {
    language: "go", source: "app.go", command: ["go", "test", "./..."],
    mutations: [
      ["session check removed", '\tif userID == "" {\n\t\twriteError(w, http.StatusUnauthorized, "unauthorized")\n\t\treturn\n\t}\n', "", /want 401/],
      ["owner check removed", " || device.Owner != userID", "", /intruder-session/],
      ["blank names accepted", ' || strings.TrimSpace(body.Name) == ""', "", /want 400/],
      ["limit off by one", "runes[:maxName]", "runes[:maxName-1]", /stored name is not bounded/],
      ["limit cuts bytes", "if runes := []rune(next); len(runes) > maxName {\n\t\tnext = string(runes[:maxName])", "if len(next) > maxName {\n\t\tnext = next[:maxName]", /multi-byte name was cut incorrectly/],
      ["audit row skipped", '\tstore.Audits = append(store.Audits, "device.renamed")\n', "", /audit records/],
      ["secret returned", 'writeJSON(w, http.StatusOK, map[string]string{"id": device.ID, "name": next})', "writeJSON(w, http.StatusOK, device)", /credential leaked/],
      ["unpaid events accepted", '\tif event.Status != "paid" {\n\t\twriteError(w, http.StatusConflict, "payment not verified")\n\t\treturn\n\t}\n', "", /want 409/],
      ["provider failure ignored", '\tif response.StatusCode != http.StatusOK {\n\t\twriteError(w, http.StatusBadGateway, "payment not verified")\n\t\treturn\n\t}\n', "", /want 502/],
      ["replay guard removed", "if !store.Paid[body.ID] {", "if true {", /want 500 once/],
    ],
  },
];

function run({ language, source, command }, code) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "agent-playbook-mutation-"));
  try {
    fs.cpSync(path.join(examples, language), directory, { recursive: true });
    fs.writeFileSync(path.join(directory, source), code);
    const result = spawnSync(command[0], command.slice(1), { cwd: directory, encoding: "utf8" });
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

let caught = 0;
for (const suite of suites) {
  const original = fs.readFileSync(path.join(examples, suite.language, suite.source), "utf8").replaceAll("\r\n", "\n");
  const clean = run(suite, original);
  assert.equal(clean.status, 0, suite.language + " must pass unmodified\n" + clean.output);
  for (const [name, search, replacement, expected] of suite.mutations) {
    const label = suite.language + ": " + name;
    const mutated = original.replace(search, replacement);
    assert.notEqual(mutated, original, "Mutation no longer applies: " + label);
    const result = run(suite, mutated);
    assert.notEqual(result.status, 0, "The test missed: " + label);
    assert.match(result.output, expected, "Failed for the wrong reason: " + label + "\n" + result.output);
    caught++;
  }
}
console.log(`PASS: the example tests caught ${caught} of ${caught} deliberate defects across ${suites.length} languages, each for the expected reason`);
