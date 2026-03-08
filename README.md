# 飞书 Agent 服务

通过飞书机器人与 Claude/MiniMax Agent 交互。

## 功能特性

- **WebSocket 长连接**：无需公网回调，通过飞书长连接模式接收消息
- **AI 集成**：支持 Claude/MiniMax 模型，理解自然语言并执行操作
- **文件操作**：读取、写入、编辑文件
- **Shell 命令**：在workspace中执行终端命令
- **项目管理**：扫描并切换项目，多项目代码搜索
- **IDE 集成**：一键在 Windsurf/Cursor 中打开文件或项目
- **Skills 系统**：按需加载专业知识（Git工作流、项目管理、代码搜索等）

## 支持的工具

| 工具 | 功能 |
|------|------|
| `bash` | 执行 Shell 命令 |
| `read_file` / `write_file` / `edit_file` | 文件读写编辑 |
| `find_file` | 按文件名搜索文件 |
| `find_projects` / `open_project` | 项目扫描与切换 |
| `search_code` / `search_all_projects` | 单项目/全项目代码搜索 |
| `open_in_ide` | 在 Windsurf/Cursor 中打开 |
| `load_skill` | 加载专业知识库 |

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

## 使用示例

与 Agent 对话即可完成各种开发任务：

```
用户: 列出当前所有项目
Agent: [扫描 projects 目录，返回项目列表]

用户: 切换到 master-web 项目
Agent: [切换工作目录到 master-web]

用户: 搜索 "userService" 相关的代码
Agent: [在当前项目中搜索，返回匹配结果]

用户: 在 Windsurf 中打开 src/index.js
Agent: [调用 open_in_ide 工具打开文件]
```

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
