import fs from "fs";
import path from "path";
import crypto from "crypto";

const COMPACTED_RESULT = "[Earlier tool result compacted. Re-run the tool if needed.]";

function cloneMessages(messages) {
  return structuredClone(messages);
}

function hasToolUse(message) {
  return Array.isArray(message?.content) && message.content.some((b) => b.type === "tool_use");
}

function isToolResult(message) {
  return message?.role === "user" && Array.isArray(message.content) &&
    message.content.some((b) => b.type === "tool_result");
}

export function snipCompact(messages, maxMessages = 50) {
  if (messages.length <= maxMessages) return cloneMessages(messages);
  let headEnd = Math.min(3, messages.length);
  let tailStart = messages.length - (maxMessages - headEnd);
  if (hasToolUse(messages[headEnd - 1])) {
    while (headEnd < tailStart && isToolResult(messages[headEnd])) headEnd += 1;
  }
  if (isToolResult(messages[tailStart]) && hasToolUse(messages[tailStart - 1])) tailStart -= 1;
  const removed = Math.max(0, tailStart - headEnd);
  return [
    ...cloneMessages(messages.slice(0, headEnd)),
    { role: "user", content: `[snipped ${removed} messages from conversation middle]` },
    ...cloneMessages(messages.slice(tailStart)),
  ];
}

export function microCompact(messages, keepRecent = 3) {
  const next = cloneMessages(messages);
  const blocks = [];
  next.forEach((message) => {
    if (!Array.isArray(message.content)) return;
    message.content.forEach((block) => {
      if (block.type === "tool_result") blocks.push(block);
    });
  });
  for (const block of blocks.slice(0, Math.max(0, blocks.length - keepRecent))) {
    if (String(block.content || "").length > 120) block.content = COMPACTED_RESULT;
  }
  return next;
}

export function applyToolResultBudget(messages, workDir, maxBytes = 200_000) {
  const next = cloneMessages(messages);
  const last = next.at(-1);
  if (!last || !Array.isArray(last.content)) return next;
  const blocks = last.content.filter((block) => block.type === "tool_result");
  let total = blocks.reduce((sum, block) => sum + Buffer.byteLength(String(block.content || "")), 0);
  if (total <= maxBytes) return next;

  const outputDir = path.join(workDir, ".task_outputs", "tool-results");
  fs.mkdirSync(outputDir, { recursive: true });
  for (const block of [...blocks].sort((a, b) => String(b.content).length - String(a.content).length)) {
    if (total <= maxBytes) break;
    const original = String(block.content || "");
    const name = `${block.tool_use_id || crypto.randomUUID()}.txt`.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const file = path.join(outputDir, name);
    fs.writeFileSync(file, original, "utf8");
    block.content = `<persisted-output path="${path.relative(workDir, file)}">\n${original.slice(0, 2000)}\n</persisted-output>`;
    total = blocks.reduce((sum, item) => sum + Buffer.byteLength(String(item.content || "")), 0);
  }
  return next;
}

export function estimateTokens(messages) {
  return Math.ceil(Buffer.byteLength(JSON.stringify(messages), "utf8") / 4);
}

export function cheapCompact(messages, workDir, options = {}) {
  const budgeted = applyToolResultBudget(messages, workDir, options.maxToolBytes);
  const snipped = snipCompact(budgeted, options.maxMessages);
  return microCompact(snipped, options.keepRecentToolResults);
}

export function emergencyCompact(messages, keepTail = 6) {
  let start = Math.max(0, messages.length - keepTail);
  if (isToolResult(messages[start]) && hasToolUse(messages[start - 1])) start -= 1;
  return [
    { role: "user", content: "[Context compacted after a context-length error. Reconstruct details with tools when needed.]" },
    ...cloneMessages(messages.slice(start)),
  ];
}
