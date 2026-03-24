# SmartSelection (划词助手)

[English](#english) | [中文](#中文)

---

<a name="english"></a>
## English

A system-level text selection and AI processing tool that supports translation, explanation, summarization, polishing, and more.

### Features

- **System-level text selection monitoring** - Triggered by selecting text in any application
- **Floating toolbar** - Compact and elegant operation panel
- **Multiple built-in actions**:
  - **Translate** - Intelligent language detection with multiple target languages
  - **Explain** - Detailed explanation of selected text
  - **Summarize** - Extract key points
  - **Polish** - Optimize text expression
  - **Search** - Quick search engine queries
  - **Copy** - One-click copy to clipboard
- **Custom prompts** - Implement various functions through custom prompts
- **Streaming output** - Real-time display of AI responses
- **Multiple LLM support** - Compatible with various models using OpenAI API format

### Tech Stack

- **Electron** - Cross-platform desktop application framework
- **React** - UI component library
- **Redux Toolkit** - State management
- **TypeScript** - Type safety
- **styled-components** - CSS-in-JS styling solution
- **selection-hook** - System-level text selection monitoring

### Installation

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build
pnpm build
```

### Configuration

#### 1. API Configuration

Configure your LLM API in the settings page:

- **API Key**: Your API key
- **Base URL**: API endpoint (default: `https://api.openai.com/v1`)
- **Model ID**: Model name (e.g., `gpt-4o-mini`, `gpt-4o`)

#### 2. Supported API Formats

Compatible with OpenAI Chat Completions API format, supporting:
- OpenAI
- Azure OpenAI
- Claude (requires compatibility layer)
- Local models (e.g., Ollama, LocalAI)
- Other compatible APIs

### Usage

1. **Enable SmartSelection** - Turn it on in the main window settings
2. **Select text** - Select the text you want to process in any application
3. **Click action** - Choose the desired action from the floating toolbar
4. **View results** - See AI processing results in the action window

### Custom Actions

Add custom actions by modifying the `actionItems` configuration:

```typescript
{
  id: 'custom-action',
  name: 'Custom Action',
  enabled: true,
  isBuiltIn: false,
  icon: 'sparkles',
  prompt: 'You are a professional assistant. Please process the following text:\n\n{{text}}'
}
```

The `{{text}}` in the prompt will be replaced with the selected text.

### Project Structure

```
selection-assistant/
├── src/
│   ├── main/                 # Main process code
│   │   ├── index.ts          # Entry file
│   │   ├── services/
│   │   │   └── SelectionService.ts  # Core service
│   │   └── configs/
│   │       └── SelectionConfig.ts   # Configuration
│   ├── preload/              # Preload scripts
│   │   └── index.ts
│   ├── renderer/             # Renderer process
│   │   ├── index.html
│   │   ├── selectionToolbar.html
│   │   ├── selectionAction.html
│   │   └── src/
│   │       ├── App.tsx       # Main window app
│   │       ├── store/        # Redux state management
│   │       ├── hooks/        # React Hooks
│   │       ├── services/     # Service layer
│   │       ├── types/        # Type definitions
│   │       └── windows/      # Window components
│   │           └── selection/
│   │               ├── toolbar/   # Toolbar
│   │               └── action/    # Action window
│   └── shared/               # Shared code
│       └── IpcChannel.ts
├── package.json
├── tsconfig.json
└── electron.vite.config.ts
```

### Development Notes

#### Core Modules

- **SelectionService**: Main process service, responsible for:
  - Managing selection-hook to listen for system text selection
  - Creating and managing toolbar/action windows
  - Handling IPC communication

- **LLMService**: LLM calling service, responsible for:
  - Communicating with LLM API
  - Processing streaming responses
  - Building message lists

- **ConfigService**: Configuration management, using electron-store for persistent settings

#### Window Architecture

The application uses a multi-window architecture:
- **Main window**: Settings interface and configuration management
- **Toolbar window**: Floating operation panel, frameless + transparent
- **Action window**: Display processing results, resizable

### License

Apache 2.0



---

<a name="中文"></a>
## 中文

系统级文本选择与 AI 处理工具，支持翻译、解释、总结、润色等功能。

### 功能特性

- **系统级文本选择监听** - 在任意应用中选中文本即可触发
- **悬浮工具栏** - 紧凑美观的操作面板
- **多种内置动作**:
  - 翻译 - 智能语言检测，支持多种目标语言
  - 解释 - 详细解释选中文本
  - 总结 - 提取关键要点
  - 润色 - 优化文本表达
  - 搜索 - 快速搜索引擎查询
  - 复制 - 一键复制到剪贴板
- **自定义提示词** - 通过自定义提示词实现各种功能
- **流式输出** - 实时显示 AI 响应
- **支持多种 LLM** - 兼容 OpenAI API 格式的各种模型

### 技术栈

- **Electron** - 跨平台桌面应用框架
- **React** - UI 组件库
- **Redux Toolkit** - 状态管理
- **TypeScript** - 类型安全
- **styled-components** - CSS-in-JS 样式方案
- **selection-hook** - 系统级文本选择监听

### 安装

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build
```

### 配置

#### 1. API 配置

在设置页面配置你的 LLM API：

- **API Key**: 你的 API 密钥
- **Base URL**: API 端点地址 (默认: `https://api.openai.com/v1`)
- **模型 ID**: 使用的模型名称 (如: `gpt-4o-mini`, `gpt-4o`)

#### 2. 支持的 API 格式

兼容 OpenAI Chat Completions API 格式，支持：
- OpenAI
- Azure OpenAI
- Claude (需使用兼容层)
- 本地模型 (如 Ollama, LocalAI)
- 其他兼容 API

### 使用方法

1. **启用划词助手** - 在主窗口设置中开启
2. **选择文本** - 在任意应用中选中想要处理的文本
3. **点击动作** - 在悬浮工具栏中选择需要的动作
4. **查看结果** - 在动作窗口中查看 AI 处理结果

### 自定义动作

可以通过修改 `actionItems` 配置添加自定义动作：

```typescript
{
  id: 'custom-action',
  name: '自定义动作',
  enabled: true,
  isBuiltIn: false,
  icon: 'sparkles',
  prompt: '你是一个专业的助手。请对以下文本进行处理：\n\n{{text}}'
}
```

提示词中的 `{{text}}` 会被替换为选中的文本。

### 项目结构

```
selection-assistant/
├── src/
│   ├── main/                 # 主进程代码
│   │   ├── index.ts          # 入口文件
│   │   ├── services/
│   │   │   └── SelectionService.ts  # 核心服务
│   │   └── configs/
│   │       └── SelectionConfig.ts   # 配置
│   ├── preload/              # 预加载脚本
│   │   └── index.ts
│   ├── renderer/             # 渲染进程
│   │   ├── index.html
│   │   ├── selectionToolbar.html
│   │   ├── selectionAction.html
│   │   └── src/
│   │       ├── App.tsx       # 主窗口应用
│   │       ├── store/        # Redux 状态管理
│   │       ├── hooks/        # React Hooks
│   │       ├── services/     # 服务层
│   │       ├── types/        # 类型定义
│   │       └── windows/      # 窗口组件
│   │           └── selection/
│   │               ├── toolbar/   # 工具栏
│   │               └── action/    # 动作窗口
│   └── shared/               # 共享代码
│       └── IpcChannel.ts
├── package.json
├── tsconfig.json
└── electron.vite.config.ts
```

### 开发说明

#### 核心模块

- **SelectionService**: 主进程服务，负责：
  - 管理 selection-hook 监听系统文本选择
  - 创建和管理工具栏/动作窗口
  - 处理 IPC 通信

- **LLMService**: LLM 调用服务，负责：
  - 与 LLM API 通信
  - 处理流式响应
  - 构建消息列表

- **ConfigService**: 配置管理，使用 electron-store 持久化设置

#### 窗口架构

应用使用多窗口架构：
- **主窗口**: 设置界面和配置管理
- **工具栏窗口**: 悬浮操作面板，frameless + transparent
- **动作窗口**: 显示处理结果，可调整大小

### 许可证

Apache 2.0

