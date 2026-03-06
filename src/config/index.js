import { existsSync, readFileSync } from "fs";
import os from "os";

// 读取 ~/feishu-agent.json
const globalConfigPath = os.homedir() + "/feishu-agent.json";
let globalConfig = {};

if (existsSync(globalConfigPath)) {
  try {
    const content = readFileSync(globalConfigPath, "utf-8");
    globalConfig = JSON.parse(content);
    console.log("已加载全局配置文件:", globalConfigPath);
  } catch (e) {
    console.error("加载全局配置文件失败:", e.message);
  }
}

// 辅助函数：从全局配置获取值
function getConfig(key, defaultValue) {
  return globalConfig[key] || defaultValue;
}

export default {
  // 飞书配置
  feishu: {
    appId: getConfig("APP_ID"),
    appSecret: getConfig("APP_SECRET"),
    verificationToken: getConfig("VERIFICATION_TOKEN"),
    encryptKey: getConfig("ENCRYPT_KEY"),
    apiBase: "https://open.feishu.cn/open-apis",
  },

  // Anthropic/MiniMax 配置
  anthropic: {
    baseURL: getConfig("ANTHROPIC_BASE_URL", "https://api.minimaxi.com/anthropic"),
    apiKey: getConfig("ANTHROPIC_API_KEY"),
    model: getConfig("MODEL_ID", "MiniMax-M2.5"),
  },

  // 服务配置
  server: {
    port: parseInt(getConfig("PORT", "3000"), 10),
  },

  // GitLab 配置
  gitlab: {
    defaultTargetBranch: getConfig("GITLAB_DEFAULT_TARGET", "dev"),
    defaultProjectPath: getConfig("GITLAB_DEFAULT_PROJECT_PATH"),
  },

  // 项目配置
  projects: {
    basePath: getConfig("PROJECTS_BASE_PATH"),
    searchDepth: 3,
    cacheTimeout: 3600000,
    excludeDirs: ["node_modules", ".git", "dist", "build", ".next", "coverage"],
  },

  // IDE 配置
  ide: {
    defaultTool: getConfig("IDE_TOOL", "windsurf"),
    supportedTools: ["windsurf", "cursor"],
  },
};
