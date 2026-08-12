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
- **权限管线（s03）**：工具执行前区分直接允许、需要审批、永久拒绝；飞书场景默认拒绝无法交互审批的风险操作
- **生命周期 Hooks（s04）**：支持 `UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop` 扩展点
- **任务规划（s05）**：`todo_write` 维护长任务进度，连续多轮未规划时自动提醒
- **子 Agent（s06）**：`task` 使用独立上下文执行子任务，只把结论带回主会话，并禁止递归派生
- **上下文压缩（s08）**：消息裁剪、旧工具结果占位、大输出落盘、阈值摘要及超长错误应急压缩
- **持久记忆（s09）**：工作区 `.memory/` 文件仓库与 `MEMORY.md` 索引，相关记忆按需注入
- **动态系统提示（s10）**：依据当前工作区、工具、Skills 和记忆实时组装并缓存

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
| `todo_write` | 创建、更新当前任务计划 |
| `task` | 在隔离上下文中执行独立子任务 |
| `compact` | 主动压缩当前对话上下文 |
| `memory_write` | 持久保存偏好、反馈、项目事实或引用 |

## Agent Harness（s03–s10）

本项目参考 Learn Claude Code 的 [s03 Permission](https://learn.shareai.run/zh/s03/) 至 [s10 System Prompt](https://learn.shareai.run/zh/s10/)，结合飞书机器人和 Node.js 架构完成整合：

1. 用户消息先触发 `UserPromptSubmit` Hook。
2. 每轮调用前按“大结果落盘 → 消息裁剪 → 旧结果占位”的顺序压缩上下文；仍超阈值时调用模型摘要。
3. 系统提示根据当前工具、工作目录、Skills 目录和记忆索引动态组装。
4. 每个工具调用先触发 `PreToolUse`。永久禁止规则直接拦截；风险操作需要审批。当前飞书文本通道没有交互式审批回调，因此风险操作默认拒绝。
5. 工具执行后触发 `PostToolUse`，Agent 停止前触发 `Stop`。

复杂任务可使用 `todo_write` 显式维护计划，或使用 `task` 派生具有全新消息历史的子 Agent。子 Agent 共享工作区文件副作用，但没有 `task` 工具，不能递归派生。

### 记忆目录

调用 `memory_write` 后会在当前项目生成：

```text
.memory/
├── MEMORY.md          # 常驻系统提示的轻量索引
└── <memory-name>.md   # 带 name/description/type frontmatter 的详细记忆
```

四种记忆类型为 `user`、`feedback`、`project` 和 `reference`。详细内容只在与当前请求相关时注入，避免长期占用上下文。

大于上下文预算的工具结果会写入 `.task_outputs/tool-results/`；这些目录属于 Agent 的运行时数据，可按项目需要加入 `.gitignore`。

## 快速开始

### 1. 安装

```bash
yarn install
```

### 2. 配置

创建 `~/engineer-claw.json`：

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
│   │   ├── agent.js         # AI Agent 与子 Agent 循环
│   │   ├── feishu.js        # 飞书 SDK
│   │   ├── mcp-client.js    # MCP 客户端
│   │   ├── permissions.js   # 权限决策管线
│   │   ├── hooks.js         # 生命周期 Hooks
│   │   ├── context.js       # 上下文压缩
│   │   ├── memory.js        # 持久记忆
│   │   └── prompt.js        # 动态系统提示组装
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
