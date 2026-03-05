import Anthropic from "@anthropic-ai/sdk";
import config from "../config/index.js";
import { TOOLS } from "./tools/definitions.js";
import { TOOL_HANDLERS } from "./tools/handlers.js";
import { setWorkDir } from "./tools/index.js";

const { anthropic: anthropicConfig } = config;

// 初始化 Anthropic 客户端
const client = new Anthropic({
  baseURL: anthropicConfig.baseURL,
  apiKey: anthropicConfig.apiKey,
});

const SYSTEM = `你是一个编程助手，使用提供的工具来完成任务。行动而不是解释。`;

/**
 * Agent 核心循环
 * @param {string} message - 用户消息
 * @param {string} userId - 用户 ID
 * @returns {Promise<string>} - 最终响应
 */
export async function processMessage(message, userId) {
  // 消息历史
  const messages = [
    {
      role: "user",
      content: message,
    },
  ];

  while (true) {
    // 调用 LLM
    const response = await client.messages.create({
      model: anthropicConfig.model,
      system: SYSTEM,
      messages: messages,
      tools: TOOLS,
      max_tokens: 8000,
    });

    // 添加助手回复到消息历史
    messages.push({ role: "assistant", content: response.content });

    // 如果模型没有调用工具，返回最终回复
    if (response.stop_reason !== "tool_use") {
      // 提取文本回复
      const textBlocks = response.content.filter((block) => block.type === "text");
      if (textBlocks.length > 0) {
        return textBlocks.map((b) => b.text).join("\n");
      }
      return "(无回复)";
    }

    // 执行工具调用
    const results = [];
    for (const block of response.content) {
      if (block.type === "tool_use") {
        const handler = TOOL_HANDLERS[block.name];
        const output = handler
          ? await handler(block.input)
          : `Unknown tool: ${block.name}`;

        console.log(`> ${block.name}: ${output.slice(0, 100)}...`);

        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: output,
        });
      }
    }

    // 将工具结果添加到消息历史
    messages.push({ role: "user", content: results });
  }
}

/**
 * 设置工作目录
 */
export function setWorkspace(dir) {
  setWorkDir(dir);
}
