---
name: git-workflow
description: Complete Git workflow for code changes, commits, and pushes (use bash tool)
tags: git, version-control, workflow
---

# Git Workflow - 完整的代码提交流程

## 使用场景
当需要提交代码更改到 Git 仓库时,遵循以下标准流程。

**注意**: 所有 Git 操作通过 `bash` 工具执行。

## 工作流程

### 1. 检查当前状态
```
bash { command: "git status --short" }
bash { command: "git branch --show-current" }
```

**目的**: 了解当前工作区状态,避免在错误的分支上操作。

### 2. 创建或切换分支(如需要)
```
创建新功能分支:
bash { command: "git checkout -b feature/xxx" }

切换到已有分支:
bash { command: "git checkout 分支名" }
```

**分支命名规范**:
- `feature/功能名` - 新功能
- `fix/问题描述` - Bug 修复
- `refactor/重构内容` - 代码重构
- `chore/任务描述` - 杂项任务

### 3. 添加修改到暂存区
```
添加所有修改:
bash { command: "git add ." }

添加特定文件:
bash { command: "git add src/file.js" }
```

### 4. 提交更改
```
bash { command: "git commit -m \"提交信息\"" }
```

**Commit Message 规范**:
- `feat: 添加新功能` - 新功能
- `fix: 修复 bug 描述` - Bug 修复
- `refactor: 重构描述` - 代码重构
- `chore: 杂项任务` - 构建、配置等
- `docs: 文档更新` - 文档修改
- `style: 代码格式` - 不影响功能的格式调整

### 5. 推送到远程
```
推送到默认远程:
bash { command: "git push origin" }

推送到指定分支:
bash { command: "git push origin 分支名" }

强制推送(谨慎使用):
bash { command: "git push origin --force" }
```

**注意事项**:
- 推送前确认分支正确
- 避免强制推送到主分支(master/main/dev)
- 推送失败时检查是否需要先 pull

### 6. 查看提交历史(可选)
```
bash { command: "git log --oneline -n 10" }
```

## 完整示例

**场景: 修复 bug 并提交**
```
1. bash { command: "git branch --show-current" } → 确认在正确分支
2. bash { command: "git status --short" } → 查看修改的文件
3. bash { command: "git add ." } → 添加所有修改
4. bash { command: "git commit -m \"fix: 修复实体横幅接口调用问题\"" }
5. bash { command: "git push origin" } → 推送到远程
```

**场景: 创建新功能分支**
```
1. bash { command: "git checkout -b feature/new-banner" }
2. (进行代码修改)
3. bash { command: "git add ." }
4. bash { command: "git commit -m \"feat: 添加新的横幅组件\"" }
5. bash { command: "git push origin feature/new-banner" }
```

## 错误处理

### 提交冲突
如果推送时遇到冲突:
1. 先使用 bash 执行 `git pull --rebase`
2. 解决冲突后重新提交
3. 再次推送

### 误提交
如果提交了错误内容:
1. 使用 bash 执行 `git reset --soft HEAD~1` 撤销最后一次提交
2. 重新修改后再次提交

### 分支保护
如果推送被拒绝(分支受保护):
1. 确认是否应该直接推送到该分支
2. 考虑创建 MR/PR 而不是直接推送

## 最佳实践

1. **频繁提交**: 小步快跑,每个逻辑单元提交一次
2. **清晰的提交信息**: 让其他人(和未来的自己)能理解改动
3. **推送前检查**: 确认分支和修改内容正确
4. **避免大文件**: 不要提交 node_modules、dist 等
5. **保持同步**: 定期从远程拉取最新代码
