# Playwright Test Explorer UI

一个用于展示和管理 Playwright 测试用例的 Web 界面，支持树形结构展示、过滤搜索、批量选择等功能。

🌐 **在线体验**: [https://li-zhixin.github.io/playwright-test-explorer-ui/](https://li-zhixin.github.io/playwright-test-explorer-ui/)

## 功能特性

### 核心功能

- **树形结构展示**：多层嵌套的测试套件和测试用例
- **智能选择**：支持父子联动的 checkbox 选择，半选状态显示
- **实时过滤**：根据测试名称、文件路径快速过滤
- **批量操作**：全选、取消全选、全部展开、全部折叠
- **文件管理**：支持本地文件和远程 URL 加载测试数据
- **选择反馈**：右侧面板实时显示所有选中的测试用例

### 界面特点

- **紧凑设计**：最小化空白，优化显示密度
- **响应式布局**：支持桌面端和移动端
- **现代 UI**：简洁美观的界面设计

## 技术栈

- **框架**：SvelteKit 2.x
- **语言**：TypeScript
- **样式**：Tailwind CSS 4.x
- **构建工具**：Vite 7.x
- **包管理器**：pnpm

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:5173` 查看应用。

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 使用说明

### 加载测试数据

1. **选择本地文件**：
   - 点击"选择文件"按钮
   - 从文件浏览器中选择 JSON 文件
   - 文件会自动加载并显示

2. **输入文件路径或 URL**：
   - 在输入框中输入本地路径（如 `/case.json`）
   - 或输入远程 URL（如 `http://localhost:5173/case.json`）
   - 点击"加载"按钮

3. **重置**：点击"重置"按钮加载默认的 `/case.json` 文件

### 操作测试用例

1. **展开/折叠**：
   - 点击 ▶/▼ 按钮展开或折叠测试套件
   - 使用"展开"/"折叠"按钮控制所有节点

2. **选择测试**：
   - 勾选 checkbox 选择测试用例
   - 选中父节点会自动选中所有子测试
   - 部分选中时显示半选状态
   - 使用"全选"/"取消"按钮批量操作

3. **过滤搜索**：
   - 在过滤框中输入关键词
   - 自动匹配测试名称和文件路径
   - 自动展开包含匹配项的父级套件

4. **查看选中**：
   - 右侧面板显示所有选中的测试
   - 显示测试数量统计
   - 显示测试标题和位置信息

## 数据格式

测试数据应为 JSON 格式，结构如下：

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
          "type": "test",
          "title": "测试名称",
          "location": {
            "file": "test.spec.ts",
            "line": 10,
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
```

## 项目结构

```
src/
├── lib/
│   ├── components/
│   │   ├── TreeNode.svelte        # 树形节点组件
│   │   ├── TestExplorer.svelte    # 测试资源管理器
│   │   └── SelectedTests.svelte   # 选中测试列表
│   └── types.ts                   # TypeScript 类型定义
├── routes/
│   ├── +layout.svelte            # 布局组件
│   └── +page.svelte              # 主页面
└── app.css                       # 全局样式

static/
└── case.json                     # 测试数据文件
```

## 开发说明

### 添加新功能

1. 在 `src/lib/types.ts` 中定义类型
2. 在 `src/lib/components/` 中创建组件
3. 在主页面中集成新组件

### 样式定制

- 使用 Tailwind CSS 4.x 进行样式定制
- 组件内样式使用 Svelte 的 scoped style
- 全局样式在 `src/app.css` 中定义

## License

MIT
