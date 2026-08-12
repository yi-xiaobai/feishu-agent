import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { HookRegistry } from "../src/services/hooks.js";
import { checkPermission } from "../src/services/permissions.js";
import { applyToolResultBudget, microCompact, snipCompact } from "../src/services/context.js";
import { MemoryStore } from "../src/services/memory.js";
import { assembleSystemPrompt } from "../src/services/prompt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("agent harness s03-s10", () => {
  const workDir = path.join(__dirname, "harness-workspace");

  beforeEach(async () => fsp.mkdir(workDir, { recursive: true }));
  afterEach(async () => fsp.rm(workDir, { recursive: true, force: true }));

  test("permission pipeline distinguishes allow, ask and deny", () => {
    expect(checkPermission("read_file", { path: "README.md" }, { workDir }).behavior).toBe("allow");
    expect(checkPermission("bash", { command: "rm temp.txt" }, { workDir }).behavior).toBe("ask");
    expect(checkPermission("bash", { command: "sudo rm -rf /" }, { workDir }).behavior).toBe("deny");
    expect(checkPermission("write_file", { path: "../outside.txt" }, { workDir }).behavior).toBe("ask");
  });

  test("hooks run in registration order and may stop a pipeline", async () => {
    const registry = new HookRegistry();
    const order = [];
    registry.register("PreToolUse", () => { order.push("first"); });
    registry.register("PreToolUse", () => {
      order.push("second");
      return "blocked";
    });
    registry.register("PreToolUse", () => { order.push("third"); });
    await expect(registry.trigger("PreToolUse", {})).resolves.toBe("blocked");
    expect(order).toEqual(["first", "second"]);
  });

  test("context compaction keeps recent tool results and tool-use pairs", () => {
    const messages = [];
    for (let index = 0; index < 30; index += 1) {
      messages.push({ role: "assistant", content: [{ type: "tool_use", id: `t${index}`, name: "read_file", input: {} }] });
      messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: `t${index}`, content: "x".repeat(200) }] });
    }
    const snipped = snipCompact(messages, 20);
    expect(snipped.length).toBeLessThanOrEqual(23);
    const compacted = microCompact(snipped, 3);
    const results = compacted.flatMap((message) => Array.isArray(message.content) ? message.content : []).filter((block) => block.type === "tool_result");
    expect(results.slice(-3).every((block) => block.content.length === 200)).toBe(true);
  });

  test("large tool output is persisted before being replaced with a preview", () => {
    const messages = [{ role: "user", content: [{ type: "tool_result", tool_use_id: "large", content: "z".repeat(5000) }] }];
    const compacted = applyToolResultBudget(messages, workDir, 1000);
    expect(compacted[0].content[0].content).toContain("<persisted-output");
    expect(fs.existsSync(path.join(workDir, ".task_outputs", "tool-results", "large.txt"))).toBe(true);
  });

  test("memory files rebuild the index and can be selected", () => {
    const store = new MemoryStore(workDir);
    store.write({ name: "tabs-style", description: "Use tabs for indentation", type: "user", body: "Always indent JavaScript with tabs." });
    expect(store.getIndex()).toContain("tabs-style.md");
    expect(store.formatRelevant("indent with tabs")).toContain("Always indent JavaScript");
  });

  test("system prompt is assembled from current capabilities", () => {
    const prompt = assembleSystemPrompt({ tools: [{ name: "bash" }], workDir, skills: "- git", memoryIndex: "- preference" });
    expect(prompt).toContain(workDir);
    expect(prompt).toContain("bash");
    expect(prompt).toContain("持久记忆索引");
  });
});
