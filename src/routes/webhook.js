import express from "express";
import config from "../config/index.js";
import { verifySignature, decryptMessage } from "../services/feishu.js";
import { handleMessage } from "../handlers/message.js";

const router = express.Router();
const { feishu: feishuConfig } = config;

// 飞书回调验证（URL 验证）
router.get("/webhook", (req, res) => {
  const { challenge, verification_token } = req.query;

  if (verification_token === feishuConfig.verificationToken) {
    res.send({ challenge });
  } else {
    res.status(400).send({ error: "verification token mismatch" });
  }
});

// 飞书消息回调
router.post("/webhook", async (req, res) => {
  try {
    const { type, challenge, event } = req.body;

    // URL 验证
    if (type === "url_verification") {
      res.send({ challenge });
      return;
    }

    // 加密模式验证签名
    if (req.headers["x-feishu-signature"]) {
      const signature = req.headers["x-feishu-signature"];
      const timestamp = req.headers["x-feishu-timestamp"];
      const encrypt = req.body.encrypt;

      if (!verifySignature(signature, timestamp, "", encrypt)) {
        res.status(400).send({ error: "signature verification failed" });
        return;
      }

      const decrypted = decryptMessage(encrypt);
      req.body = decrypted;
    }

    // 处理消息事件
    if (type === "im.message" && req.body.event?.message) {
      const message = req.body.event.message;
      // 异步处理消息，不阻塞响应
      handleMessage(message).catch(console.error);
    }

    res.send({});
  } catch (error) {
    console.error("Webhook 处理错误:", error);
    res.status(500).send({ error: "internal error" });
  }
});

export default router;
