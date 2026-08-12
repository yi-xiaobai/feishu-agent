import Anthropic from "@anthropic-ai/sdk";
import config from "../config/index.js";
import { TOOLS } from "../tools/definitions.js";
import { TOOL_HANDLERS } from "../tools/handlers.js";
import { getWorkDir, setWorkDir } from "../tools/index.js";
import { skillLoader } from "../utils/skills.js";
import { mcpManager } from "./mcp-client.js";
import { hooks } from "./hooks.js";
import { createPermissionHook } from "./permissions.js";
import { cheapCompact, emergencyCompact, estimateTokens } from "./context.js";
import { memoryStore } from "./memory.js";
import { getSystemPrompt, clearPromptCache } from "./prompt.js";

const { anthropic: anthropicConfig } = config;
const client = new Anthropic({
  baseURL: anthropicConfig.baseURL,
  apiKey: anthropicConfig.apiKey,
});

const sessions = new Map();
const MAX_AGENT_STEPS = 40;
const CONTEXT_TOKEN_THRESHOLD = 80_000;

hooks.register("PreToolUse", createPermissionHook({ workDir: getWorkDir() }));

function isContextLengthError(error) {
  const text = `${error?.status || ""} ${error?.message || ""}`.toLowerCase();
  return text.includes("prompt_too_long") || text.includes("context length") || text.includes("too many tokens") || text.includes("413");
}

function extractText(content = []) {
  return content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
}

async function summarizeHistory(messages) {
  const response = await client.messages.create({
    model: anthropicConfig.model,
    max_tokens: 1800,
    messages: [{
      role: "user",
      content: `请压缩下面的 Agent 对话，必须保留当前目标、用户约束、关键发现、已修改文件、工具执行结果和剩余工作。只输出摘要。\n\n${JSON.stringify(messages).slice(0, 240000)}`,
    }],
  });
  return [{ role: "user", content: `[Compacted conversation]\n\n${extractText(response.content)}` }];
}

async function prepareContext(messages) {
  let prepared = cheapCompact(messages, getWorkDir());
  if (estimateTokens(prepared) > CONTEXT_TOKEN_THRESHOLD) {
    try {
      prepared = await summarizeHistory(prepared);
    } catch {
      prepared = emergencyCompact(prepared);
    }
  }
  return prepared;
}

function buildPrompt(allTools, relevantMemories = "") {
  return getSystemPrompt({
    tools: allTools.map(({ name }) => ({ name })),
    workDir: getWorkDir(),
    skills: skillLoader.getDescriptions(),
    memoryIndex: memoryStore.getIndex(),
    relevantMemories,
  });
}

async function spawnSubagent(description) {
  const allowedNames = new Set(["bash", "read_file", "write_file", "edit_file", "find_file", "search_code", "load_skill"]);
  const subTools = TOOLS.filter((tool) => allowedNames.has(tool.name));
  const messages = [{ role: "user", content: description }];
  const result = await agentLoop(messages, { tools: subTools, isSubagent: true, maxSteps: 20 });
  return result.text || "Subagent finished without a textual conclusion.";
}

export function getSession(chatId) {
  if (!sessions.has(chatId)) sessions.set(chatId, { history: [], lastActive: Date.now() });
  const session = sessions.get(chatId);
  session.lastActive = Date.now();
  return session;
}

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [chatId, session] of sessions) {
    if (now - session.lastActive > 3_600_000) sessions.delete(chatId);
  }
}, 600_000);
cleanupTimer.unref?.();

export function clearSession(chatId) {
  sessions.delete(chatId);
}

export function getAllSessions() {
  return sessions;
}

export async function agentLoop(inputMessages, options = {}) {
  let messages = structuredClone(inputMessages);
  const toolLogs = [];
  const maxSteps = options.maxSteps || MAX_AGENT_STEPS;
  let compactRetries = 0;
  let turnsWithoutTodo = 0;

  for (let step = 0; step < maxSteps; step += 1) {
    messages = await prepareContext(messages);
    const allTools = options.tools || [...TOOLS, ...mcpManager.getAllTools()];
    const latestUserText = [...messages].reverse().find((message) => message.role === "user" && typeof message.content === "string")?.content || "";
    const relevantMemories = options.isSubagent ? "" : memoryStore.formatRelevant(latestUserText);

    let response;
    try {
      response = await client.messages.create({
        model: anthropicConfig.model,
        system: buildPrompt(allTools, relevantMemories),
        messages,
        tools: allTools,
        max_tokens: 8000,
      });
      compactRetries = 0;
    } catch (error) {
      if (isContextLengthError(error) && compactRetries < 1) {
        messages = emergencyCompact(messages);
        compactRetries += 1;
        continue;
      }
      throw error;
    }

    messages.push({ role: "assistant", content: response.content });
    if (response.stop_reason !== "tool_use") {
      const force = await hooks.trigger("Stop", messages, { isSubagent: !!options.isSubagent });
      if (force) {
        messages.push({ role: "user", content: String(force) });
        continue;
      }
      return { text: extractText(response.content), toolLogs, messages };
    }

    const results = [];
    let usedTodo = false;
    let compactRequested = false;
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const blocked = await hooks.trigger("PreToolUse", block, { workDir: getWorkDir(), isSubagent: !!options.isSubagent });
      let output;
      if (blocked) {
        output = String(blocked);
      } else if (block.name === "task" && !options.isSubagent) {
        output = await spawnSubagent(block.input.description);
      } else if (block.name === "compact") {
        compactRequested = true;
        output = "Conversation context compacted.";
      } else if (mcpManager.isMCPTool(block.name)) {
        output = await mcpManager.callTool(block.name, block.input);
      } else {
        const handler = TOOL_HANDLERS[block.name];
        output = handler ? await handler(block.input) : `Unknown tool: ${block.name}`;
      }
      if (block.name === "open_project" && !String(output).startsWith("Error:")) {
        memoryStore.setBaseDir(getWorkDir());
        clearPromptCache();
      }
      if (block.name === "todo_write") usedTodo = true;
      await hooks.trigger("PostToolUse", block, output, { workDir: getWorkDir() });
      toolLogs.push(`$ ${block.name}: ${String(output).slice(0, 100)}...`);
      results.push({ type: "tool_result", tool_use_id: block.id, content: String(output) });
    }

    turnsWithoutTodo = usedTodo ? 0 : turnsWithoutTodo + 1;
    if (!options.isSubagent && turnsWithoutTodo >= 3) {
      results.push({ type: "text", text: "[Reminder: 如果任务包含多个步骤，请使用 todo_write 更新计划和进度。]" });
      turnsWithoutTodo = 0;
    }
    messages.push({ role: "user", content: results });
    if (compactRequested) messages = await summarizeHistory(messages).catch(() => emergencyCompact(messages));
  }
  return { text: `Agent stopped after reaching the ${maxSteps}-step safety limit.`, toolLogs, messages };
}

export async function processMessage(message, chatId) {
  const session = getSession(chatId);
  const transformed = await hooks.trigger("UserPromptSubmit", message, { chatId });
  session.history.push({ role: "user", content: transformed || message });
  const { text, toolLogs } = await agentLoop(session.history);
  session.history.push({ role: "assistant", content: text });
  session.history = snipSession(session.history);
  const logText = toolLogs.length ? `📋 执行记录:\n\`\`\`\n${toolLogs.join("\n")}\n\`\`\`\n\n` : "";
  return `${logText}${text || "(无回复)"}`;
}

function snipSession(history) {
  return history.length > 50 ? history.slice(-50) : history;
}

export async function processSingleMessage(message) {
  const { text } = await agentLoop([{ role: "user", content: message }]);
  return text || "(无回复)";
}

export function setWorkspace(dir) {
  setWorkDir(dir);
  memoryStore.setBaseDir(dir);
  clearPromptCache();
}
