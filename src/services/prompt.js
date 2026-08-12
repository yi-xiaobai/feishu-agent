const IDENTITY = `你是一个强大的编程助手。主动使用工具完成任务，行动优先于空泛解释。
对于多步骤任务先维护 todo；需要专业知识时按需加载 skill；必要时把独立调查交给子 Agent。
当用户明确要求“记住”，或提供长期稳定的偏好、反馈、项目事实和参考位置时，在本轮结束前调用 memory_write；不要保存临时或敏感信息。`;

let cachedKey = null;
let cachedPrompt = null;

export function assembleSystemPrompt({ tools = [], workDir, skills = "", memoryIndex = "", relevantMemories = "" }) {
  const sections = [
    IDENTITY,
    `当前工作目录: ${workDir}`,
    `可用工具: ${tools.map((tool) => tool.name).join(", ") || "无"}`,
  ];
  if (skills) sections.push(`可用专业技能（通过 load_skill 按需加载）:\n${skills}`);
  if (memoryIndex) sections.push(`持久记忆索引:\n${memoryIndex}`);
  if (relevantMemories) sections.push(`与当前请求相关的记忆:\n${relevantMemories}`);
  sections.push("所有工具调用都受权限与生命周期 Hook 管线约束。不要规避权限检查。");
  return sections.join("\n\n");
}

export function getSystemPrompt(context) {
  const key = JSON.stringify(context);
  if (key === cachedKey && cachedPrompt) return cachedPrompt;
  cachedKey = key;
  cachedPrompt = assembleSystemPrompt(context);
  return cachedPrompt;
}

export function clearPromptCache() {
  cachedKey = null;
  cachedPrompt = null;
}
