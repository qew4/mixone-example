<div align="center">

# 🚀 MixOne Example

**基于 MixOne 工具的 Electron 桌面应用示例项目**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-Latest-47848f.svg)](https://electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.x-4fc08d.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-Latest-646cff.svg)](https://vitejs.dev/)

</div>

## 📖 项目简介

**mixone-example** 是由 MixOne 工具创建的 Electron 桌面项目示例。本项目展示了：

- ✨ **去除 IPC 通信代码**的开发模式
- 🎯 **WindowManager** 窗口管理类的使用方法
- 🔧 **完整的项目结构**和最佳实践

## 🛠️ MixOne 工具介绍
MixOne是一个Node脚手架工具，基于Vite实现，用于编译HTML5、JavasCript，Vue，React等代码，支持打包多HTML入口的(BS架构)Web应用和打包(CS架构)桌面端安装包。桌面端的目前基于Electron实现，MixOne有自己的语法糖来访问Electron的API和NodeJS的功能，这种语法糖完全可以取代Electron的IPC通讯代码。

### 🌟 核心特性

- **🚫 去除 IPC 通信复杂性**：通过编译时处理，让开发者无需关心主进程和渲染进程间的通信
- **📁 简化目录结构**：项目结构与传统 Vue/React 项目保持一致
- **⚡ 基于 Vite 构建**：享受极速的开发体验
- **🔌 无缝集成**：Node.js 包和 Electron API 可直接在组件中使用

### 📚 相关资源

- 📖 [MixOne 中文文档](doc/MixOne_document_chinese.md)
- 🐛 [问题反馈](https://github.com/qew4/mixone-example/issues)
- 💬 **联系作者 QQ**：996150938
## 🚀 快速开始

### 方式一：使用 MixOne 工具创建新项目

你可以自由选择 UI 库、Electron 版本、Vite 版本等配置：

```bash
# 全局安装 MixOne
npm install mixone -g

# 创建新项目
mixone create mixone-demo1
cd mixone-demo1

# 安装依赖
npm install  # 或使用 yarn

# 启动开发服务器
npm run dev
```

### 方式二：克隆本示例项目

本项目集成了丰富的使用示例：

```bash
# 全局安装 MixOne
npm install mixone -g

# 克隆项目
git clone https://github.com/qew4/mixone-example.git
cd mixone-example

# 安装依赖
npm install  # 或使用 yarn

# 启动开发服务器
npm run dev
```
## 📁 项目结构

### 🗂️ 完整目录结构
```
mixone-vue-app/
├── 📂 assets/                    # 🎨 全局静态资源
│   └── 📄 favicon.ico            # 应用图标
├── 📂 components/                # 🧩 全局组件库
│   ├── 📄 Button.vue             # 按钮组件
│   └── 📄 Dialog.vue             # 对话框组件
├── 📂 windows/                   # 🖼窗口目录（以 -window 结尾，windows是根窗口目录）
│   ├── 📄 Index.page.vue         # 主窗口入口页面组件
│   ├── 📂 other-window/          # 其他窗口
│   │   ├── 📄 Index.page.vue     # 入口页面组件
│   │   ├── 📄 Second.page.vue    # 页面组件（自动路由）
│   │   ├── 📄 Second.vue         # 普通组件
│   │   ├── 📄 preload.js         # 窗口预加载脚本(可选)
│   │   └── 📄 window.json        # 窗口配置
│   └── 📂 setting-window/        # 设置窗口
│       ├── 📄 Index.page.vue     # 入口页面组件
│       ├── 📄 main.ts            # Vue 入口（可选）
│       ├── 📄 App.vue            # 顶层组件（可选）
│       └── 📄 router.js          # 路由配置（可选）
├── 📂 main/                      # ⚡ 主进程代码
│   ├── 📄 main.js                # 主进程入口
│   └── 📄 *.fn.js                # 原生插件（PJS 访问）
├── 📂 utils/                     # 🔧 工具函数
│   ├── 📄 request.js             # 请求工具
│   └── 📄 common.js              # 通用工具
├── 📂 out/                       # 📦 编译输出
└── 📄 package.json               # 项目配置	
```
- 工程文件介绍
	- 窗口目录
		窗口目录是指在/windows下的以“-window”结尾的目录（若不以“-window”结尾则为普通文件夹），/windows本身就是根窗口目录。
	- 窗目录的特性：
		* 窗口目录是可以嵌套窗口的。
		* 窗口目录下默认是以Index.vue为访问入口。
		* 窗口目录下分为页面组件和普通组件，页面组件以“page.vue”结尾，创建后会被mixone识别并加入到vue的路由配置中。
		* 窗口目录下可以创建preload.js作为窗口的预加载文件，暴露自己定义的方法等功能。preload.js默认会自动创建、若在窗口目录下创建了preload.js则会自动与项目根目录的preload.js合并(如果根preload.js存在)。
		* 窗口目录下的window.json可以配置窗口的属性，在多个位置打开窗口无需再重复编写相同的属性，不存在window.json则默认。
		* 窗口目录下的assets文件夹是静态资源文件夹，当前窗口的组件使用。和全局有区别。
	- main.js
#### 📁 其他重要目录

| 目录/文件 | 说明 | 特点 |
|-----------|------|------|
| `main/main.js` | 程序主入口 | 默认配置即可，建议不要修改 |
| `components/` | 全局组件目录 | 所有窗口共享，可被任意窗口调用 |
| `assets/` | 全局静态资源 | 所有窗口共享的资源文件 |
| `utils/` | 全局工具目录 | 所有窗口共享，不建议 main 目录引用 |
- 窗口目录文件
```
📁 xxxx-window/                    # 窗口目录（以 "-window" 结尾）
├── 📄 Index.vue                   # 🚪 窗口入口文件
├── 📄 Second.page.vue             # 📄 页面组件（自动路由）
├── 📄 main.ts                     # ⚙️ Vue 项目入口（可选）
├── 📄 App.vue                     # 🎯 Vue 顶层组件（可选）
├── 📄 router.js                   # 🛣️ 路由配置（可选）
├── 📄 window.json                 # ⚙️ 窗口配置（可选）
└── 📄 preload.js                  # ⚡ 预加载脚本（可选）

```

## 🍬 MixOne 去 IPC 语法糖

### 💡 什么是去 IPC 通信语法糖

**IPC**（Inter-Process Communication）是进程间通信的意思。在传统 Electron 开发中，主进程和渲染进程需要开发者自己设计：

- 🎯 事件位置
- 📝 事件名称  
- 🔄 传输方向（主进程 ↔ 渲染进程）

MixOne 通过**编译时处理**，让开发者可以直接在业务代码中使用主进程 API 和 Node.js 代码，编译后自动转换为符合 Electron 安全规范的 IPC 通信代码。

> 💡 **核心理念**：开发时去 IPC，运行时仍是 IPC
### 🎯 四种语法糖详解

#### 1️⃣ 注释方式 `@mainProcess`

使用 `// @mainProcess` 注释声明函数访问了系统 API，适用于所有 JS 文件和 Vue 组件。

```javascript
// @mainProcess
export async function getSystemInfo() {
  return os.cpus();
}

// @mainProcess
export async function monitorCPU() {
  const initial = os.cpus();
  return 'initial2:' + initial;
}
```

#### 2️⃣ Main 常量语法

使用 `Main` 标识符直接访问 Electron API，简单快捷。

```javascript
// 访问 Electron Main API
await Main.app.getPath('documents')
```

#### 3️⃣ PJS 常量语法

使用 `PJS` 标识符访问原生插件（Plugin Javascript）。

```javascript
// 先要在 main 目录下实现 WENJIAN.fn.js 文件，请看源码中的例子
await PJS.WENJIAN.read()
```

#### 4️⃣ NodeJS 常量语法

使用 `NodeJS` 访问 Node.js 包。

```javascript
// os 是 NodeJS 内置包，无需安装
// 第三方包需要通过 npm install 安装
const homeDirectory = await NodeJS.os.homedir();
const filePathToRead = await NodeJS.path.join(homeDirectory, 'my_test_document.txt'); 
  ```
### 💡 使用技巧

不同语法糖适用于不同场景：

- **常量语法**：适用于访问简单的方法和属性
- **注释方式**：适用于包含回调函数、定时器等复杂场景
- **无需预暴露**：语法常量可直接使用，无需提前暴露

> ⚠️ **注意**：当常量语法遇到回调函数、定时器等复杂情况时可能报错，此时应使用注释方式。
## 🪟 窗口管理类

### 🎛️ 窗口管理功能

#### 📱 创建窗口

```javascript
let winInfo = await window.windowManager.openWindow('/windows/help-window', {
  width: 1200,
  height: 900
});
console.log('Window created with ID:', winInfo);
```

#### 🔲 创建模态窗口

```javascript
const currentWinId = window.getWinId();
let modalWinInfo = await window.windowManager.openModalWindow(
  currentWinId, 
  '/windows/help-window', 
  {
    width: 600,
    height: 400,
    minimizable: false,
    maximizable: false
  }
);
```

#### 💬 窗口间通信

```javascript
window.windowManager.sendToWindow(WinId, 'orderPay', { orderId: 12345 })
```

#### 👂 窗口事件监听

```javascript
// 监听窗口 close、did-stop-loading 事件
// 注意：并非所有原生事件都能监听
let winInfo = await window.windowManager.openWindow('/windows/help-window', {
  width: 1200,
  height: 900
});

console.log('Window created with ID:', winInfo);

// 监听页面加载完成
winInfo.webContents.on('did-stop-loading', (res) => {
  console.log('Window loaded successfully');
  console.log(res);
});

// 监听窗口关闭
winInfo.on('close', () => {
  console.log('Window closed');
});
```
## ❓ 常见问题

### 🔧 故障排除

**Q: 遇到未知问题或其他方式无法解决时怎么办？**  
A: `npm run dev` 重启应用是比较万能的解决方法。如果仍无法解决，请在 [Issues](https://github.com/qew4/mixone-example/issues) 中提交问题。

### 🛠️ 技术支持

**Q: 支持 React 吗？**  
A: ✅ 支持

**Q: 支持 Vue 吗？**  
A: ✅ 当前已支持 Vue 2.7 和 Vue 3
当前已支持vue2.7和vue3。
- 支持typescript吗？
vue3和react项目支持typescript
- 如何访问Election的API
主要是指访问Election Main Process API，翻阅electron文档找到使用方法。记得使用了Election API的函数要进行注释。
- 如何访问NodeJS的包
nodejs的内置包可以通过NodeJS.包名直接访问，比如：NodeJS.fs,如果是第三方的包需要提前安装。
- 支持win7吗?
初始化项目时候electron版本选择v21即可支持win7。
- 支持mac、Ubuntu吗？
尚未测试。
- 改动了需要编辑的代码后没有生效。
请全部重新启动。以Main、NodeJS、PJS开头的语法发生改动后，有时候需要重启才能生效。
- 以Main、NodeJS、PJS开头的语法前的await可以不用写吗？
必须写await，并且所在函数应该是async函数。
- 使用“// @mainProcess”注释的函数内不要使用以Main、NodeJS、PJS开头的语法。
- 以Main、NodeJS、PJS开头的语法所调用的函数内部不能再使用以Main、NodeJS、PJS开头的语法为参数。
- 是否存在官方所说的安全性问题？
mixone是一个编译工具，你在渲染进程访问主进程API的代码以及NodeJS代码都是按照安全机制实现和编译的。
```javascript
//错误的写法
const result = await Main.dialog.showOpenDialog({
    title: '选择一个或多个文件',
    defaultPath: await Main.app.getPath('documents'), // 示例：默认打开文档目录
    buttonLabel: '选择',
    filters: [
        { name: '图片文件', extensions: ['jpg', 'png', 'gif'] },
        { name: '文本文件', extensions: ['txt', 'md'] },
        { name: '所有文件', extensions: ['*'] }
    ],
    properties: ['openFile', 'multiSelections', 'showHiddenFiles'] // 允许选择文件、允许多选、显示隐藏文件
});
//正确的写法
let documentsPath = await Main.app.getPath('documents');
const result = await Main.dialog.showOpenDialog({
    title: '选择一个或多个文件',
    defaultPath: documentsPath, // 示例：默认打开文档目录
    buttonLabel: '选择',
    filters: [
        { name: '图片文件', extensions: ['jpg', 'png', 'gif'] },
        { name: '文本文件', extensions: ['txt', 'md'] },
        { name: '所有文件', extensions: ['*'] }
    ],
    properties: ['openFile', 'multiSelections', 'showHiddenFiles'] // 允许选择文件、允许多选、显示隐藏文件
});
//错误的写法
await NodeJS.path.join(await NodeJS.os.homedir(), 'my_test_document.txt')
//正确的写法
let documentsPath = await NodeJS.os.homedir();
await NodeJS.path.join(documentsPath,'my_test_document.txt')
```
- 你可以使用别名方式引入文件的方法，支持的别名有@/utils、@/store、@/assets、@/windows、@/components、@/main。
（preload.js和main/main.js中不能使用别名）
```javascript
//使用例子
//在xxx.vue文件中 
import {getDocumentsPath2} from '@/utils/api/utils.js';
```
## 问题反馈群
- 有问题请加微信进群。

![项目结构](./qr-wechat.jpg)