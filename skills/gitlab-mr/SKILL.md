---
name: gitlab-mr
description: GitLab Merge Request creation workflow (use mcp2_create_merge_request)
tags: gitlab, merge-request, code-review
---

# GitLab MR - Merge Request 创建流程

## 使用场景
完成代码开发后,创建 Merge Request 提交代码审查。

**注意**: MR 创建通过 MCP 工具 `mcp2_create_merge_request` 完成。

## 前置条件

1. **代码已提交并推送**
   - 所有修改已提交到 Git
   - 代码已推送到远程仓库
   - 在正确的源分支上

2. **GitLab 项目路径**
   - 格式: `组织名/项目名`
   - 示例: `lanhuapp/master-web`

3. **分支信息**
   - 源分支: 当前开发分支
   - 目标分支: 通常是 `dev` 或 `master`

## 工作流程

### 1. 确认代码已推送
```
步骤:
1. bash { command: "git status --short" } → 确认工作区干净
2. bash { command: "git branch --show-current" } → 获取当前分支名
3. bash { command: "git log --oneline -n 5" } → 查看最近提交
```

### 2. 创建 Merge Request
```
使用 MCP 工具 mcp2_create_merge_request
参数: {
  project_id: "lanhuapp/master-web",
  source_branch: "feature/new-feature",
  target_branch: "dev",
  title: "feat: 添加新功能",
  description: "详细描述"
}
```

### 3. MR 标题规范
遵循 Conventional Commits 规范:

- `feat: 功能描述` - 新功能
- `fix: 问题描述` - Bug 修复
- `refactor: 重构描述` - 代码重构
- `perf: 性能优化描述` - 性能优化
- `docs: 文档更新` - 文档修改
- `style: 样式调整` - 代码格式
- `test: 测试相关` - 测试代码
- `chore: 杂项任务` - 构建、配置等

### 4. MR 描述模板
```markdown
## 改动内容
- 添加了 XXX 功能
- 修复了 YYY 问题
- 重构了 ZZZ 模块

## 测试说明
- [ ] 单元测试通过
- [ ] 手动测试通过
- [ ] 回归测试通过

## 影响范围
- 影响模块: XXX
- 是否需要数据库迁移: 否
- 是否需要配置更新: 否

## 截图(如有)
(粘贴截图)

## 相关链接
- 需求文档: [链接]
- 设计稿: [链接]
```

## 完整示例

### 场景 1: 功能开发完成,创建 MR
```
1. bash { command: "git status --short" }
   → 确认所有修改已提交

2. bash { command: "git branch --show-current" }
   → 获取当前分支: "feature/entity-banner"

3. bash { command: "git push origin" }
   → 推送到远程

4. mcp2_create_merge_request {
     project_id: "lanhuapp/master-web",
     source_branch: "feature/entity-banner",
     target_branch: "dev",
     title: "feat: 添加实体横幅组件",
     description: "## 改动内容\n- 新增实体横幅组件\n- 支持自定义样式"
   }

5. 返回 MR URL 和版本号给用户
```

### 场景 2: Bug 修复,紧急 MR
```
1. bash { command: "git branch --show-current" }
   → "fix/banner-crash"

2. bash { command: "git log --oneline -n 3" }
   → 确认修复提交已包含

3. bash { command: "git push origin" }

4. mcp2_create_merge_request {
     project_id: "lanhuapp/master-web",
     source_branch: "fix/banner-crash",
     target_branch: "master",
     title: "fix: 修复横幅组件崩溃问题",
     description: "## 问题描述\n横幅组件在特定条件下崩溃"
   }
```

## 目标分支选择

### dev 分支 (默认)
- 日常功能开发
- 非紧急 Bug 修复
- 代码重构

### master/main 分支
- 紧急 Bug 修复(Hotfix)
- 生产环境问题修复
- 需要立即发布的更改

### release 分支
- 版本发布准备
- 发布前的最后调整

## MR 审查要点

创建 MR 后,确保:
1. **代码质量**: 遵循项目编码规范
2. **测试覆盖**: 包含必要的测试
3. **文档更新**: 更新相关文档
4. **无冲突**: 与目标分支无冲突
5. **CI 通过**: 所有自动化检查通过

## 版本号说明

MR 创建后会返回:
- **MR ID**: GitLab 内部 ID (如 !123)
- **MR URL**: 可直接访问的链接
- **分支名**: 作为临时版本标识

发送给测试同学的信息应包含:
```
MR 已创建:
- 标题: feat: 添加实体横幅组件
- 链接: https://gitlab.lanhuapp.com/lanhuapp/master-web/-/merge_requests/123
- 分支: feature/entity-banner
- 目标: dev
```

## 常见问题

### Q: MR 创建失败?
A:
1. 检查 GitLab 项目路径是否正确
2. 确认分支已推送到远程
3. 检查是否有权限创建 MR
4. 确认目标分支存在

### Q: 如何更新 MR?
A:
1. 在源分支继续提交
2. 推送到远程
3. MR 会自动更新

### Q: 如何关闭 MR?
A:
通过 GitLab Web 界面关闭,或使用 GitLab API

## 最佳实践

1. **小而频繁**: 保持 MR 小而专注,易于审查
2. **清晰描述**: 提供足够的上下文信息
3. **自我审查**: 创建前先自己审查一遍代码
4. **及时响应**: 快速响应审查意见
5. **保持更新**: 定期从目标分支合并最新代码

## GitLab MCP 集成

本项目使用 GitLab MCP 服务器:
- Token 已在 MCP 配置中
- 支持自动认证
- 错误处理已优化

无需手动配置 GitLab API Token。
