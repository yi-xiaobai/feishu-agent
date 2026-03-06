---
name: project-management
description: Multi-project management and switching workflow
tags: project, workspace, organization
---

# Project Management - 多项目管理流程

## 使用场景
管理多个项目,在项目间切换,查找和定位项目。

## 核心工具

### 1. find_projects - 扫描所有项目
```
使用场景: 查看所有可用项目
参数: { refresh: true/false }
```

**功能**:
- 扫描 `/Users/luoyi/Documents/1_project` 下所有项目
- 自动识别项目特征(package.json, .git, go.mod 等)
- 结果缓存 1 小时,提高性能

**何时刷新缓存**:
- 新增或删除项目后
- 项目列表不准确时
- 设置 `refresh: true` 强制刷新

### 2. open_project - 切换项目
```
使用场景: 切换到指定项目
参数: { name: "项目名" }
```

**支持的匹配方式**:
- 精确匹配: "master-web"
- 模糊匹配: "master" (会匹配 master-web)
- 父目录匹配: "2_master" (会匹配 2_master_web/master-web)

**示例**:
```
open_project { name: "master-web" }
open_project { name: "lanhu-order" }
open_project { name: "master-admin" }
```

### 3. search_code - 当前项目搜索
```
使用场景: 在当前项目中搜索代码
参数: {
  keyword: "搜索关键词",
  file_pattern: "*.js" (可选),
  max_results: 50 (可选)
}
```

**搜索特性**:
- 递归搜索当前项目所有文件
- 自动排除 node_modules, .git, dist 等目录
- 返回文件路径、行号、匹配内容

**文件类型过滤**:
- `*.js` - JavaScript 文件
- `*.tsx` - TypeScript React 文件
- `*.vue` - Vue 组件
- `*.go` - Go 文件

### 4. search_all_projects - 跨项目搜索
```
使用场景: 在所有项目中搜索代码
参数: {
  keyword: "搜索关键词",
  project_filter: "项目名过滤" (可选),
  max_results: 20 (可选)
}
```

**使用场景**:
- 查找某个函数/组件在哪些项目中使用
- 定位共享代码的使用位置
- 评估重构影响范围

## 工作流程

### 场景 1: 查看所有项目
```
步骤:
1. find_projects { refresh: false }
2. 查看返回的项目列表
3. 选择需要的项目
```

### 场景 2: 切换项目并工作
```
步骤:
1. open_project { name: "master-web" }
2. git_current_branch (确认分支)
3. git_status (查看状态)
4. (进行开发工作)
```

### 场景 3: 在当前项目搜索代码
```
步骤:
1. open_project { name: "master-web" }
2. search_code { keyword: "/entity-banner", file_pattern: "*.js" }
3. read_file 查看匹配的文件
4. edit_file 进行修改
```

### 场景 4: 跨项目搜索
```
步骤:
1. search_all_projects { keyword: "useEntityBanner" }
2. 分析哪些项目在使用该代码
3. 根据需要切换到具体项目进行修改
```

### 场景 5: 批量修改多个项目
```
步骤:
1. search_all_projects { keyword: "旧API" }
2. 记录所有使用该API的项目
3. 对每个项目:
   a. open_project { name: "项目名" }
   b. search_code { keyword: "旧API" }
   c. edit_file 替换为新API
   d. git_add, git_commit, git_push
```

## 项目结构识别

系统会自动识别以下项目类型:
- **Node.js**: 包含 package.json
- **Go**: 包含 go.mod
- **Python**: 包含 pyproject.toml
- **Rust**: 包含 Cargo.toml
- **Git 仓库**: 包含 .git 目录

## 最佳实践

### 1. 项目命名规范
保持项目名称清晰、一致:
- `master-web` - 主站前端
- `master-admin` - 管理后台
- `lanhu-order` - 订单系统

### 2. 搜索优化
- 使用具体的关键词,避免过于宽泛
- 利用文件类型过滤减少无关结果
- 限制结果数量,避免输出过长

### 3. 项目切换
- 切换项目后立即检查 Git 状态
- 确认在正确的分支上工作
- 避免在多个项目间频繁切换导致混乱

### 4. 缓存管理
- 正常情况下使用缓存(refresh: false)
- 只在必要时刷新缓存
- 缓存每小时自动更新

## 常见问题

### Q: 项目找不到?
A: 
1. 使用 find_projects { refresh: true } 刷新缓存
2. 检查项目是否在 /Users/luoyi/Documents/1_project 下
3. 确认项目包含识别特征文件

### Q: 搜索结果太多?
A:
1. 使用更具体的关键词
2. 添加文件类型过滤
3. 减少 max_results 限制

### Q: 跨项目搜索很慢?
A:
1. 使用 project_filter 限制搜索范围
2. 减少 max_results
3. 考虑分别在各项目中搜索

## 项目目录结构

```
/Users/luoyi/Documents/1_project/
├── 1_master_admin/
│   └── master-admin/
├── 2_master_web/
│   ├── master-web/
│   ├── mg-oncall/
│   └── feat_select/
├── 3_lanhu_order/
│   └── lanhu-order/
└── ...
```

系统会递归扫描 3 层深度,自动发现所有项目。
