---
name: code-search
description: Code search best practices and strategies
tags: search, code, grep, analysis
---

# Code Search - 代码搜索最佳实践

## 使用场景
在项目中查找特定代码、函数、组件或 API 调用。

## 核心策略

### 1. 选择合适的搜索工具

**search_code** - 单项目搜索
- 适用场景: 在当前项目中搜索
- 速度: 快
- 范围: 当前项目

**search_all_projects** - 跨项目搜索
- 适用场景: 不确定代码在哪个项目
- 速度: 较慢
- 范围: 所有项目

### 2. 搜索关键词选择

**精确搜索**:
```
好的关键词:
- "useEntityBanner" (函数名)
- "/api/entity-banner" (API 路径)
- "EntityBannerComponent" (组件名)
- "import { Banner }" (导入语句)

避免的关键词:
- "banner" (太宽泛)
- "entity" (太常见)
- "component" (太通用)
```

**正则表达式**:
```
使用 bash 工具配合 grep:
bash { command: "grep -rn 'function.*Banner' ." }
```

### 3. 文件类型过滤

根据技术栈选择:
```
JavaScript/TypeScript:
- file_pattern: "*.js"
- file_pattern: "*.jsx"
- file_pattern: "*.ts"
- file_pattern: "*.tsx"

Vue:
- file_pattern: "*.vue"

样式文件:
- file_pattern: "*.css"
- file_pattern: "*.scss"

配置文件:
- file_pattern: "*.json"
- file_pattern: "*.yaml"
```

## 搜索工作流

### 场景 1: 查找函数定义
```
目标: 找到 useEntityBanner 函数在哪里定义

步骤:
1. search_code {
     keyword: "function useEntityBanner",
     file_pattern: "*.js"
   }
   或
   search_code {
     keyword: "const useEntityBanner",
     file_pattern: "*.js"
   }

2. 如果没找到,扩大搜索:
   search_code {
     keyword: "useEntityBanner",
     file_pattern: "*.js"
   }

3. 查看结果,找到定义位置
```

### 场景 2: 查找 API 调用
```
目标: 找到所有调用 /entity-banner 接口的地方

步骤:
1. search_code {
     keyword: "/entity-banner"
   }

2. 或搜索变量名:
   search_code {
     keyword: "ENTITY_BANNER_API"
   }

3. 查看所有匹配结果
4. 逐个检查并修改
```

### 场景 3: 查找组件使用
```
目标: 找到 Banner 组件在哪些地方被使用

步骤:
1. 搜索导入语句:
   search_code {
     keyword: "import.*Banner",
     file_pattern: "*.jsx"
   }

2. 搜索组件标签:
   search_code {
     keyword: "<Banner",
     file_pattern: "*.jsx"
   }

3. 合并结果分析
```

### 场景 4: 跨项目影响分析
```
目标: 评估删除某个 API 的影响范围

步骤:
1. search_all_projects {
     keyword: "/entity-banner"
   }

2. 记录所有使用该 API 的项目

3. 对每个项目:
   - open_project { name: "项目名" }
   - search_code { keyword: "/entity-banner" }
   - 分析具体使用情况

4. 评估影响范围和迁移成本
```

## 搜索结果分析

### 1. 理解搜索输出
```
典型输出格式:
/path/to/file.js:123: const url = '/entity-banner'
                 ^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                 行号  匹配内容
```

### 2. 过滤无关结果
忽略以下目录(已自动排除):
- node_modules
- .git
- dist
- build
- coverage

### 3. 优先级排序
1. 直接调用 > 间接调用
2. 业务代码 > 测试代码
3. 主要功能 > 辅助功能

## 高级搜索技巧

### 1. 组合搜索
```
先搜索定义:
search_code { keyword: "function Banner" }

再搜索使用:
search_code { keyword: "Banner(" }
```

### 2. 上下文搜索
```
找到匹配后:
read_file { path: "匹配文件路径", limit: 100 }

查看完整上下文
```

### 3. 排除特定目录
```
使用 bash 工具:
bash {
  command: "grep -rn 'keyword' . --exclude-dir={test,__tests__,spec}"
}
```

### 4. 搜索配置文件
```
查找环境变量:
search_code {
  keyword: "ENTITY_BANNER",
  file_pattern: "*.env*"
}

查找配置:
search_code {
  keyword: "entityBanner",
  file_pattern: "*.json"
}
```

## 性能优化

### 1. 限制结果数量
```
search_code {
  keyword: "banner",
  max_results: 20  // 避免输出过多
}
```

### 2. 使用项目过滤
```
search_all_projects {
  keyword: "banner",
  project_filter: "master"  // 只搜索包含 master 的项目
}
```

### 3. 分阶段搜索
```
1. 先精确搜索
2. 无结果时再模糊搜索
3. 最后才跨项目搜索
```

## 常见搜索模式

### 查找导入
```
search_code { keyword: "import.*from.*'./Banner'" }
```

### 查找导出
```
search_code { keyword: "export.*Banner" }
```

### 查找类型定义
```
search_code {
  keyword: "interface Banner",
  file_pattern: "*.ts"
}
```

### 查找样式
```
search_code {
  keyword: ".banner",
  file_pattern: "*.css"
}
```

### 查找测试
```
search_code {
  keyword: "describe.*Banner",
  file_pattern: "*.test.js"
}
```

## 搜索后的行动

### 1. 代码修改
```
1. read_file 查看完整文件
2. edit_file 进行修改
3. 验证修改正确性
```

### 2. 批量替换
```
对每个匹配:
1. read_file 确认上下文
2. edit_file 替换
3. git_add 添加修改
```

### 3. 影响评估
```
1. 记录所有匹配位置
2. 分析依赖关系
3. 制定迁移计划
```

## 最佳实践

1. **从精确到模糊**: 先用精确关键词,再逐步放宽
2. **使用文件过滤**: 减少无关结果
3. **查看上下文**: 不要只看匹配行,要看完整文件
4. **记录结果**: 重要搜索结果要记录下来
5. **验证修改**: 搜索后的修改要仔细验证

## 常见问题

### Q: 搜索结果太多?
A:
1. 使用更具体的关键词
2. 添加文件类型过滤
3. 减少 max_results
4. 使用正则表达式精确匹配

### Q: 搜索不到预期结果?
A:
1. 检查关键词拼写
2. 尝试不同的关键词变体
3. 扩大搜索范围(跨项目)
4. 检查文件是否在排除目录中

### Q: 如何搜索特殊字符?
A:
使用 bash 工具配合 grep -F (固定字符串):
```
bash { command: "grep -rn -F '/api/entity-banner' ." }
```
