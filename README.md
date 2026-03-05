# 飞书 Agent 服务

通过飞书机器人与 Claude Agent 交互。

## 配置

1. 复制 `.env.example` 为 `.env` 并配置：
   - `APP_ID`: 飞书应用 App ID
   - `APP_SECRET`: 飞书应用 App Secret
   - `ENCRYPT_KEY`: 飞书回调加密 Key（可选）
   - `VERIFICATION_TOKEN`: 飞书回调验证 Token
   - `ANTHROPIC_API_KEY`: Anthropic API Key
   - `PORT`: 服务端口（默认 3000）

2. 配置飞书开放平台：
   - 创建企业自建应用
   - 开启"接收消息"能力
   - 配置回调 URL（需要公网访问，可用 ngrok 内网穿透）

## 启动

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 飞书配置说明

### 1. 创建应用
在飞书开放平台创建企业自建应用，获取 App ID 和 App Secret。

### 2. 配置权限
需要的权限：
- `im:chat:message` - 接收群聊消息
- `im:message:send_as_bot` - 发送消息

### 3. 配置回调
在应用的"事件订阅"中配置：
- 回调 URL: `https://your-domain.com/webhook`
- 事件类型: `im.message.message_created`（接收消息）

### 4. 发布应用
配置完成后发布应用到企业。
