import express from "express";
import bodyParser from "body-parser";
import config from "./config/index.js";
import webhookRouter from "./routes/webhook.js";

const app = express();
const { server: serverConfig } = config;

// 中间件：日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 中间件：解析 JSON
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// 路由
app.use("/", webhookRouter);

// 健康检查
app.get("/health", (req, res) => {
  res.send({ status: "ok", timestamp: new Date().toISOString() });
});

// 启动服务
app.listen(serverConfig.port, () => {
  console.log(`
🚀 飞书 Agent 服务已启动
   http://localhost:${serverConfig.port}
   Webhook: http://localhost:${serverConfig.port}/webhook
  `);
});
