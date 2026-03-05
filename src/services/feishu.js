import axios from "axios";
import crypto from "crypto";
import config from "../config/index.js";

const { feishu: feishuConfig } = config;

// 缓存 Access Token
let appAccessToken = "";
let tokenExpireTime = 0;

/**
 * 获取应用 Access Token
 */
export async function getAppAccessToken() {
  const now = Date.now();
  if (appAccessToken && now < tokenExpireTime - 60) {
    return appAccessToken;
  }

  const response = await axios.post(
    `${feishuConfig.apiBase}/auth/v3/tenant_access_token/internal`,
    {
      app_id: feishuConfig.appId,
      app_secret: feishuConfig.appSecret,
    }
  );

  if (response.data.code === 0) {
    appAccessToken = response.data.tenant_access_token;
    tokenExpireTime = now + response.data.expire * 1000;
    return appAccessToken;
  }
  throw new Error(`获取 Access Token 失败: ${response.data.msg}`);
}

/**
 * 发送消息
 * @param {string} receiveId - 接收者 ID（用户 ID 或群聊 ID）
 * @param {string} msgType - 消息类型
 * @param {object} content - 消息内容
 */
export async function sendMessage(receiveId, msgType, content) {
  const token = await getAppAccessToken();
  const isGroupChat = receiveId.startsWith("oc_");

  const url = isGroupChat
    ? `${feishuConfig.apiBase}/im/v1/messages?receive_id_type=chat_id`
    : `${feishuConfig.apiBase}/im/v1/messages?receive_id_type=user_id`;

  const data = {
    receive_id: receiveId,
    msg_type: msgType,
    content: JSON.stringify(content),
  };

  const response = await axios.post(url, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.data.code !== 0) {
    console.error("发送消息失败:", response.data);
  }
  return response.data;
}

/**
 * 发送文本消息
 */
export async function sendTextMessage(receiveId, text) {
  return sendMessage(receiveId, "text", { text });
}

/**
 * 验证飞书签名
 */
export function verifySignature(signature, timestamp, nonce, encrypt) {
  const sortParams = [
    encrypt,
    timestamp,
    nonce,
    feishuConfig.verificationToken,
  ]
    .sort()
    .join("");
  const hash = crypto
    .createHash("sha1")
    .update(sortParams)
    .digest("hex");
  return hash === signature;
}

/**
 * 解密消息
 */
export function decryptMessage(encrypt) {
  const key = Buffer.from(feishuConfig.encryptKey, "base64");
  const iv = Buffer.alloc(16, 0);

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypt, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}
