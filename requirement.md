# Test Explorer UI - 需求文档

## 项目概述

一个用于展示和管理 Playwright 测试用例的 Web 界面，支持树形结构展示、过滤搜索、批量选择等功能。

## 核心功能需求

### 1. 数据展示

#### 1.1 树形结构
- **层级展示**：支持多层嵌套的测试套件（suite）和测试用例（test）
- **数据源**：从 JSON 文件加载测试数据（如 case.json）
- **数据结构**：
  ```typescript
  interface TestItem {
    type: 'test';
    title: string;
    location: { file: string; line: number; column: number };
    tags: string[];
    annotations: any[];
    expectedStatus: string;
    timeout: number;
  }
  
  interface SuiteItem {
    type: 'suite';
    title: string;
    file?: string;
    children: TestNode[];
  }
  ```

#### 1.2 节点信息
- **测试套件**：显示套件名称、文件夹图标、展开/折叠按钮
- **测试用例**：显示测试名称、状态图标、文件路径和行号

### 2. 交互功能

#### 2.1 展开/折叠
- 点击展开按钮（▶/▼）可以展开或折叠测试套件
- 支持"全部展开"和"全部折叠"按钮
- 默认展开第一层

#### 2.2 选择功能
- **Checkbox 选择**：每个节点都有 checkbox 用于选择
- **父子联动**：
  - 选中父节点时，自动选中所有子测试用例
  - 取消选中父节点时，自动取消所有子测试用例
  - 部分子节点选中时，父节点显示半选状态（indeterminate）
- **批量操作**：
  - "全选"按钮：选择所有测试用例
  - "取消全选"按钮：取消所有选择
- **选择反馈**：
  - 右侧面板实时显示所有选中的测试用例
  - 只显示测试节点（type === 'test'），不显示套件节点
  - 显示选中数量统计

#### 2.3 过滤搜索
- **实时过滤**：输入关键词实时过滤测试
- **匹配范围**：
  - 测试用例标题
  - 文件路径
  - 套件名称
- **自动展开**：过滤时自动展开包含匹配项的父级套件
- **无结果提示**：没有匹配项时显示友好提示

### 3. 文件管理

#### 3.1 文件选择
- **文件浏览器**：通过文件选择对话框选择本地 JSON 文件
- **路径输入**：支持输入文件路径或 URL
  - 本地路径：`/case.json`
  - 远程 URL：`http://localhost:5173/case.json`
- **文件验证**：
  - 验证 JSON 格式
  - 验证数据结构
  - 错误提示

#### 3.2 文件加载
- **默认加载**：页面加载时自动加载 `/case.json`
- **加载状态**：显示加载中提示
- **错误处理**：加载失败时显示错误信息
- **重置功能**：支持重置到默认文件

#### 3.3 当前文件信息
- 显示当前加载的文件名
- 切换文件时清空之前的选择状态

### 4. 界面布局

#### 4.1 整体布局
- **左侧区域**：测试资源管理器（Test Explorer）
  - 文件选择区域
  - 过滤和操作工具栏
  - 树形结构展示区域
- **右侧区域**：选中的测试列表
  - 显示所有选中的测试用例
  - 显示测试标题、文件路径和行号

#### 4.2 紧凑性要求
- **最小化空白**：
  - 每层缩进：6px
  - 容器内边距：2px
  - 节点内边距：0px
  - 节点最小高度：18px
- **元素间距**：
  - 展开按钮：10x10px，右边距 2px
  - Checkbox：13x13px，右边距 3px
  - 图标：右边距 3px
  - 所有间距统一为 3px
- **字体大小**：
  - 节点标题：12px
  - 位置信息：10px
  - 状态图标：10px

#### 4.3 响应式设计
- 桌面端：左右分栏布局（左侧占主要空间，右侧 400px）
- 移动端：上下布局，右侧面板最大高度 300px

## 技术栈

- **框架**：SvelteKit 2.x
- **语言**：TypeScript
- **样式**：Tailwind CSS 4.x
- **构建工具**：Vite 7.x
- **包管理器**：pnpm

## 数据格式示例

```json
{
  "type": "suite",
  "title": "Root",
  "children": [
    {
      "type": "suite",
      "title": "chromium",
      "children": [
        {
          "type": "suite",
          "title": "jerryZhang\\button\\event.spec.ts",
          "file": "e2e\\tests\\jerryZhang\\button\\event.spec.ts",
          "children": [
            {
              "type": "test",
              "title": "测试事件面板初始状态",
              "location": {
                "file": "e2e\\tests\\jerryZhang\\button\\event.spec.ts",
                "line": 171,
                "column": 5
              },
              "tags": [],
              "annotations": [],
              "expectedStatus": "passed",
              "timeout": 0
            }
          ]
        }
      ]
    }
  ]
}
```


