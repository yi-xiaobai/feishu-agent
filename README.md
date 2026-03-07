# 飞书 Agent 服务

通过飞书机器人与 Claude/MiniMax Agent 交互。

## 功能特性

- WebSocket 长连接模式，无需公网回调
- 集成 Claude/MiniMax AI 能力
- Shell 命令、文件操作
- 多项目管理、代码搜索
- Git 工作流、GitHub/GitLab MR
- IDE 集成（Windsurf/Cursor）
- Skills 按需加载专业知识

## 快速开始

### 1. 安装

```bash
yarn install
```

### 2. 配置

创建 `~/feishu-agent.json`：

```json
{
  "APP_ID": "飞书AppID",
  "APP_SECRET": "飞书AppSecret",
  "VERIFICATION_TOKEN": "验证Token",
  "ENCRYPT_KEY": "加密Key",
  "ANTHROPIC_BASE_URL": "https://api.minimaxi.com/anthropic",
  "ANTHROPIC_API_KEY": "APIKey",
  "MODEL_ID": "MiniMax-M2.5-highspeed",
  "PROJECTS_BASE_PATH": "/path/to/projects"
}
```

### 3. 启动

```bash
yarn dev
```

## 飞书配置

1. 在[飞书开放平台](https://open.feishu.cn/)创建企业自建应用
2. 添加权限：`im:message:send_as_bot`、`im:message:receive_v1`
3. 事件订阅：添加 `im.message.receive_v1`，选择「长连接」模式
4. 发布应用

## MCP 配置

支持通过 MCP 协议连接 GitHub、GitLab 等外部服务。配置 `~/feishu-agent.json`：

```json
{
  "GITHUB_TOKEN": "ghp_xxx"
}
```

启动时自动连接 MCP Server，获取其提供的工具（创建 PR、搜索代码等）。

## 项目结构

```
feishu-agent/
├── src/
│   ├── index.js              # 服务入口
│   ├── config/index.js       # 配置管理
│   ├── handlers/
│   │   └── message.js       # 消息处理
│   ├── services/
│   │   ├── agent.js         # AI Agent
│   │   ├── feishu.js        # 飞书 SDK
│   │   └── mcp-client.js    # MCP 客户端
│   ├── tools/
│   │   ├── definitions.js   # 工具定义
│   │   ├── handlers.js      # 工具处理
│   │   └── index.js         # 工具实现
│   └── utils/
│       ├── project.js       # 项目搜索
│       └── skills.js        # Skills 加载
├── skills/                   # 专业知识库
│   ├── git-workflow/
│   ├── project-management/
│   └── code-search/
└── package.json
```
