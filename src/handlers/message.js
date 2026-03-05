import { sendTextMessage } from "../services/feishu.js";
import { processMessage, setWorkspace } from "../services/agent.js";

// 设置工作目录
const WORKDIR = "/Users/luoyi/Documents";
setWorkspace(WORKDIR);

/**
 * 处理飞书消息事件
 * @param {object} message - 消息对象
 */
export async function handleMessage(message) {
  const messageId = message.message_id;
  const chatId = message.chat_id;
  const userId = message.sender?.user_id;
  const content = JSON.parse(message.content);
  const userMessage = content.text?.replace(/@_all_/g, "")?.trim() || "";

  if (!userMessage) {
    return;
  }

  console.log(`收到消息 from ${userId}: ${userMessage}`);

  // 1. 发送"正在处理"状态
  await sendTextMessage(chatId, "🤖 正在思考...");

  // 2. 调用 Agent 处理
  try {
    const agentResponse = await processMessage(userMessage, userId);
    await sendTextMessage(chatId, agentResponse);
  } catch (error) {
    console.error("Agent 处理错误:", error);
    await sendTextMessage(chatId, `❌ 处理出错: ${error.message}`);
  }
}
