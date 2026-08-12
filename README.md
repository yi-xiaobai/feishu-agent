# Engineer Claw 🦀

自动化开发助手 - 通过 AI Agent 协调完成开发任务。

## 核心功能

- **PRD 解析** - 读取需求文档，提取关键信息和验证步骤
- **代码修改** - 根据需求自动修改代码
- **E2E 验证** - 启动项目，使用 Playwright 自动化验证
- **Git 提交** - 自动创建分支、提交、推送
- **飞书通知** - 任务完成后发送 Webhook 通知
- **权限管线（s03）**：工具执行前区分直接允许、需要审批、永久拒绝
- **生命周期 Hooks（s04）**：支持 `UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop` 扩展点
- **任务规划与子 Agent（s05–s06）**：任务持久化、状态跟踪和 PRD/Code/E2E/Git 隔离子 Agent
- **上下文压缩（s08）**：消息裁剪、旧工具结果占位、大输出落盘、阈值摘要及超长错误应急压缩
- **持久记忆（s09）**：工作区 `.memory/` 文件仓库与 `MEMORY.md` 索引，相关记忆按需注入
- **动态系统提示（s10）**：共享 Agent 循环依据当前工作区、工具和记忆实时组装并缓存

## Agent Harness（s03–s10）

本项目参考 Learn Claude Code 的 [s03 Permission](https://learn.shareai.run/zh/s03/) 至 [s10 System Prompt](https://learn.shareai.run/zh/s10/)，结合 CLI 多 Agent 编排架构完成整合：

1. 用户消息先触发 `UserPromptSubmit` Hook。
2. 每轮调用前按“大结果落盘 → 消息裁剪 → 旧结果占位”的顺序压缩上下文；仍超阈值时调用模型摘要。
3. 系统提示根据当前工具、工作目录、Skills 目录和记忆索引动态组装。
4. 每个工具调用先触发 `PreToolUse`。永久禁止规则直接拦截；没有审批回调时风险操作默认拒绝。
5. 工具执行后触发 `PostToolUse`，Agent 停止前触发 `Stop`。

复杂任务由 orchestrator 写入 `.tasks/` 并拆分给 PRD、Code、E2E 和 Git 子 Agent；各阶段只传递结构化结果，避免把全部中间对话带入下一阶段。

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
npx playwright install chromium
```

### 2. 配置

创建 `~/engineer-claw.json`：

```json
{
  "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
  "ANTHROPIC_API_KEY": "your-api-key",
  "MODEL_ID": "claude-sonnet-4-20250514",

  "PROJECT_PATH": "/path/to/your/project",
  "START_CMD": "pnpm run serve",
  "DEV_URL": "http://localhost:8080",
  "GIT_REMOTE": "origin",
  "FEISHU_WEBHOOK": "",
  "NOTIFY_USER": "",
  "MAX_RETRIES": 3
}
```

**配置说明：**
- `ANTHROPIC_*` - Claude API 配置（必填）
- `PROJECT_PATH` - 默认项目路径
- `START_CMD` - 项目启动命令
- `DEV_URL` - 开发服务器地址
- `FEISHU_WEBHOOK` - 飞书通知 Webhook
- `MAX_RETRIES` - E2E 验证失败重试次数

### 3. 使用

```bash
# 交互式创建任务
node src/cli.js

# 使用配置文件
node src/cli.js --task ./task-example.json

# 直接指定需求
node src/cli.js --prd "修复登录页验证码不刷新的问题" --name "修复验证码"

# 查看任务状态
node src/cli.js --status task_xxx

# 列出所有任务
node src/cli.js --list
```

## 任务配置

```json
{
  "name": "修复登录页 Bug",
  "prd": "登录页验证码点击后不刷新",
  "projectPath": "/path/to/project",
  "startCmd": "pnpm run serve",
  "devUrl": "http://localhost:8080",
  "branch": "fix/captcha-refresh",
  "feishuWebhook": "https://open.feishu.cn/xxx",
  "notifyUser": "luoyi"
}
```

## 执行流程

```
PRD 解析 → 代码修改 → E2E 验证 → (失败重试 x3) → Git 提交 → 飞书通知
```

## 项目结构

```
engineer-claw/
├── src/
│   ├── cli.js                # 命令行入口
│   ├── config/index.js       # 配置管理
│   ├── services/
│   │   ├── permissions.js   # 权限决策管线
│   │   ├── hooks.js         # 生命周期 Hooks
│   │   ├── context.js       # 上下文压缩
│   │   ├── memory.js        # 持久记忆
│   │   └── prompt.js        # 动态系统提示组装
│   ├── lib/tools.js          # 通用工具函数
│   └── orchestrator/         # 自动化协调器
│       ├── index.js          # 主协调器
│       ├── task-manager.js   # 任务状态管理
│       └── agents/           # 子 Agent
│           ├── prd-agent.js  # PRD 解析
│           ├── code-agent.js # 代码修改
│           ├── e2e-agent.js  # E2E 验证
│           └── git-agent.js  # Git 操作
├── .tasks/                   # 任务状态持久化
├── task-example.json         # 示例配置
└── package.json
```

## 依赖

- `@anthropic-ai/sdk` - Claude API
- `playwright` - E2E 自动化测试
- `axios` - HTTP 请求
