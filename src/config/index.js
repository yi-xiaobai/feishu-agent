import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env 文件
dotenv.config({ path: join(__dirname, "..", ".env") });

export default {
  // 飞书配置
  feishu: {
    appId: process.env.APP_ID,
    appSecret: process.env.APP_SECRET,
    verificationToken: process.env.VERIFICATION_TOKEN,
    encryptKey: process.env.ENCRYPT_KEY,
    apiBase: "https://open.feishu.cn/open-apis",
  },

  // Anthropic/MiniMax 配置
  anthropic: {
    baseURL: process.env.ANTHROPIC_BASE_URL,
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.MODEL_ID || "MiniMax-M2.5",
  },

  // 服务配置
  server: {
    port: process.env.PORT || 3000,
  },
};
