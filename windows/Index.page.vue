<template>
  <div class="app-container">
    <!-- 左侧菜单 -->
    <div class="sidebar">
      <div class="logo">
        <h2>MixOne</h2>
      </div>
      <nav class="nav-menu">
        <div 
          class="nav-item" 
          :class="{ active: activeTab === 'home' }"
          @click="activeTab = 'home'"
        >
          <i class="icon">🏠</i>
          <span>首页</span>
        </div>
        <div 
          class="nav-item" 
          :class="{ active: activeTab === 'syntax' }"
          @click="activeTab = 'syntax'"
        >
          <i class="icon">🍬</i>
          <span>语法糖</span>
        </div>
        <div 
          class="nav-item" 
          :class="{ active: activeTab === 'window' }"
          @click="activeTab = 'window'"
        >
          <i class="icon">🪟</i>
          <span>窗口管理</span>
        </div>
      </nav>
    </div>

    <!-- 右侧内容区域 -->
    <div class="main-content">
      <!-- 首页内容 -->
      <div v-if="activeTab === 'home'" class="content-section">
        <h1>欢迎使用 MixOne 工具</h1>
        <div class="intro-card">
          <h3>🚀 关于 MixOne</h3>
          <p>MixOne 是一个强大的 Electron + Vue 开发工具，旨在提供高效的桌面应用开发体验。</p>
          
          <h4>✨ 主要特性</h4>
          <ul>
            <li><strong>现代化架构</strong> - 基于 Electron + Vue 2/3 构建</li>
            <li><strong>热重载支持</strong> - 开发过程中实时预览更改</li>
            <li><strong>多窗口管理</strong> - 灵活的窗口创建和管理机制</li>
            <li><strong>语法糖支持</strong> - 提供丰富的开发语法糖，提升开发效率</li>
            <li><strong>跨平台兼容</strong> - 支持 Windows、macOS、Linux</li>
          </ul>

          <h4>🛠️ 技术栈</h4>
          <div class="tech-stack">
            <span class="tech-tag">Electron</span>
            <span class="tech-tag">Vue.js</span>
            <span class="tech-tag">Node.js</span>
            <span class="tech-tag">Vite</span>
          </div>
          <div>
            <a href="html-window/index.html" native-target="_window">窗口打开路径设计、开发调试</a>
          </div>
          <div>
            <a href="old-window/index.html" native-target="_window">语法设计、窗口管理类、以及其他所有特性</a>
          </div>
        </div>
      </div>

      <!-- 语法糖内容 -->
      <div v-if="activeTab === 'syntax'" class="content-section">
        <h1>语法糖使用案例</h1>
        
        <div class="example-card">
            <h3>🍭 Vue 组件语法糖</h3>
            <div class="code-example">
                <h4>1. 获取系统的documents目录。 </h4>
                <p>传统写法：</p>
                <pre>
    // 首先 要在主进程中监听请求。
    const { app } = Require('electron')
    let documentsPath = app.getPath('documents');
    // 还需要在主进程监听渲染进程发送的事件
    ipcMain.on('getDocuments', (event, arg) => {
        // 回复渲染进程
        event.reply('main-documents-reply', documentsPath);
    });
    // 其次 在渲染进程还需要监听响应回复的结果
    ipcRenderer.on('main-documents-reply', (event, arg) => {
    console.log('收到主进程回复:', arg);
    });</pre>
    <p>语法糖写法:</p>
    <pre>
    // 在项目的任意位置。
    let documentsPath = await Main.app.getPath('documents');</pre>
            </div>
            <div class="code-example">
                <h4>2. NodeJS读取文件。 </h4>
                <p>传统写法：</p>
                <pre>
    // 首先 要在主进程中监听请求。
    const os = Require('os');
    const path = Require('path');
    const fs = Require('fs');
    const homeDirectory = os.homedir();
    const filePathToRead = path.join(homeDirectory, 'my_test_document.txt');
    const fileContent = fs.readFileSync(filePathToRead, 'utf-8');
    // 还需要在主进程监听渲染进程发送的事件
    ipcMain.on('getFileContent', (event, arg) => {
        // 回复渲染进程
        event.reply('main-documents-reply', fileContent);
    });
    // 其次 在渲染进程还需要监听响应回复的结果
    ipcRenderer.on('main-file-content-reply', (event, arg) => {
    console.log('收到主进程回复:', arg);
    });</pre>
    <p>语法糖写法:</p>
    <pre>
    const homeDirectory = await NodeJS.os.homedir();
    const filePathToRead = await NodeJS.path.join(homeDirectory, 'my_test_document.txt');
    const fileContent = await NodeJS.fs.readFileSync(filePathToRead, 'utf-8');</pre>
            </div>
            <div class="code-example">
                            <h4>3. 访问插件。我写了一个插件在main目录下，以WENJIAN.fn.js命名</h4>
                            <p>插件内容:</p>
                            <pre>
    // 插件代码
    const WENJIAN = {
        read: function () {
            console.log('Electron version:', process.versions.electron);
            console.log('Node.js version:', process.versions.node);
            console.log('Chromium version:', process.versions.chrome);
            return 'hello world';
        },
        write: function (data) {
            console.log(data);
        }
    }
    module.exports = WENJIAN;
    </pre>
                <p>项目任意位置使用插件:</p>
                <pre>//无需引入
    await PJS.WENJIAN.read()</pre>
            </div>
            <div class="code-example">
                <h4>4. 使用注释@mainProcess将这个函数变为主进程代码</h4>
                <pre>// @mainProcess
export async function getSystemInfo() {
    return os.cpus();
}</pre>
            </div>
        </div>
      </div>

      <!-- 窗口管理内容 -->
      <div v-if="activeTab === 'window'" class="content-section">
        <h1>窗口管理使用案例</h1>
        
        <div class="example-card">
          <h3>🪟 Electron 窗口管理</h3>
          
          <div class="code-example">
            <h4>1. 创建新窗口(window.windowManager.openWindow)，并监听加载完毕和关闭窗口</h4>
            <pre>let winInfo = await window.windowManager.openWindow('/help-window', {
    width: 1200,
    height: 900
});
console.log('Window created with ID(winInfo):', winInfo);
winInfo.webContents.on(
    'did-stop-loading',
    (res) => {
        console.log('Window did-stop-loading ========================= loaded');
        console.log(res)
    }
);
winInfo.on('close', () => {
    console.log('Window close');
})</pre>
          </div>

          <div class="code-example">
            <h4>2. 关闭当前窗口</h4>
            <pre>// 渲染进程发送消息
const currentWin = window.windowManager.getWindow();
currentWin.close()</pre>
          </div>

          <div class="code-example">
            <h4>3. 窗口状态管理</h4>
            <pre>// 窗口最小化、最大化、关闭
win.minimize()
win.maximize()
win.close()

// 监听窗口事件
win.on('closed', () => {
  console.log('窗口已关闭')
})

win.on('resize', () => {
  console.log('窗口大小已改变')
})</pre>
          </div>
          
          <div class="action-buttons">
            <button class="demo-btn" @click="openNewWindow">打开新窗口</button>
            <button class="demo-btn" @click="minimizeWindow">最小化窗口</button>
            <button class="demo-btn" @click="toggleMaximize">切换最大化</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 响应式数据
const activeTab = ref('home')

// 方法定义
const openNewWindow = async () => {
    // 这里可以调用 Electron API 打开新窗口
    console.log('打开新窗口')
    let winInfo = await window.windowManager.openWindow('/other-window', {
        width: 1200,
        height: 900
    });

}

const minimizeWindow = () => {
    const currentWin = window.windowManager.getWindow();
    currentWin.minimize();
    // 最小化当前窗口
    console.log('最小化窗口')
}

const toggleMaximize = () => {
    // 切换最大化状态
    console.log('切换最大化')
    const currentWin = window.windowManager.getWindow();
    currentWin.maximize();
}
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* 左侧菜单样式 */
.sidebar {
  width: 250px;
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #34495e;
}

.logo h2 {
  margin: 0;
  color: #ecf0f1;
  font-size: 24px;
  font-weight: 600;
}

.nav-menu {
  flex: 1;
  padding: 20px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background-color: #34495e;
  border-left-color: #3498db;
}

.nav-item.active {
  background-color: #3498db;
  border-left-color: #2980b9;
}

.nav-item .icon {
  font-size: 18px;
  margin-right: 12px;
  width: 20px;
  text-align: center;
}

.nav-item span {
  font-size: 16px;
  font-weight: 500;
}

/* 右侧内容区域样式 */
.main-content {
  flex: 1;
  padding: 30px;
  background-color: #f8f9fa;
  overflow-y: auto;
}

.content-section h1 {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 32px;
  font-weight: 600;
}

.intro-card, .example-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.intro-card h3, .example-card h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 24px;
}

.intro-card h4 {
  color: #34495e;
  margin: 25px 0 15px 0;
  font-size: 18px;
}

.intro-card p {
  color: #7f8c8d;
  line-height: 1.6;
  font-size: 16px;
}

.intro-card ul {
  color: #7f8c8d;
  line-height: 1.8;
}

.intro-card li {
  margin-bottom: 8px;
}

.tech-stack {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 15px;
}

.tech-tag {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.code-example {
  margin-bottom: 25px;
}

.code-example h4 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 16px;
}

.code-example pre {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 25px;
  flex-wrap: wrap;
}

.demo-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.demo-btn:hover {
  background: linear-gradient(135deg, #2980b9, #1f5f8b);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.demo-btn:active {
  transform: translateY(0);
}

/* 滚动条样式 */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb {
  background: #bdc3c7;
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #95a5a6;
}
</style>