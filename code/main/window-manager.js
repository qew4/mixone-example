const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
// 保持对窗口对象的全局引用
const iconv = require('iconv-lite');
function filterString(str) {
  return str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\x00-\x7F\u4E00-\u9FFF]/g, '');
  }

// 重写控制台输出方法
console.log = (...args) => {
  const message = args.map(arg => {
    if (typeof arg === 'string') {
      return filterString(arg);
    }
    return arg;
  }).join(' ');
  process.stdout.write(iconv.encode(message + '\n', 'gb2312'));
  };
  
  console.error = (...args) => {
  const message = args.map(arg => {
    if (typeof arg === 'string') {
      return filterString(arg);
    }
    return arg;
  }).join(' ');
  process.stderr.write(iconv.encode(message + '\n', 'gb2312'));
  };

  function isDevelopmentMode() {
    // 检查命令行参数是否有 --dev 标志
    const isDev = process.argv.includes('--dev');
    
    // 检查环境变量
    const nodeEnv = process.env.NODE_ENV;
    const isDevEnv = nodeEnv === 'development' || nodeEnv === 'dev';
    
    return isDev || isDevEnv;
  }
  function getDevServerUrl() {
    try {
      const serverInfoPath = path.join(__dirname, 'dev-server.json');
      if (fs.existsSync(serverInfoPath)) {
        const serverInfo = JSON.parse(fs.readFileSync(serverInfoPath, 'utf-8'));
        let url = serverInfo.url;
  
        // 处理可能的 IPv6 地址
        if (url.includes('://::') || url.includes('://::1') || url.includes('://[::') || url.includes('://[::1')) {
          // 替换为 localhost
          url = url.replace(/:\/{2}(\[)?::(1)?(\])?/, '://localhost');
        }
  
        console.log(`📡 获取到开发服务器地址: ${url}`);
        return url;
      }
    } catch (err) {
      console.error('读取开发服务器信息失败3:', err);
    }
    return null;
  }
// ... 在 WindowManager 类外部添加工具函数
function serializeEventArgs(args) {
  return args.map(arg => {
    if (arg === null || arg === undefined) return arg;
    if (arg instanceof Error) {
      return {
        message: arg.message,
        name: arg.name,
        stack: arg.stack
      };
    }
    // 处理 Electron 对象
    if (arg.constructor && arg.constructor.name === 'Event') {
      return {
        type: arg.type,
        timeStamp: arg.timeStamp
      };
    }
    if (typeof arg === 'object') {
      // 只保留可序列化的属性
      return JSON.parse(JSON.stringify(arg, (key, value) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const cleaned = {};
          for (let k in value) {
            try {
              JSON.stringify(value[k]);
              cleaned[k] = value[k];
            } catch (e) {
              // 忽略不可序列化的属性
            }
          }
          return cleaned;
        }
        return value;
      }));
    }
    return arg;
  });
}
class WindowManager {
  constructor() {
    this.windows = new Map();
    this.configs = new Map();
    this.lastWinId = 0;  // 添加跟踪最后使用的窗口 ID
    this.setupWindowPositionTracking();
    this.setupWindowObjectActions();
  }

  setupWindowPositionTracking() {
    ipcMain.on('window-moved', (event, { winId, bounds }) => {
      const win = this.windows.get(winId);
      if (win) {
        win.lastBounds = bounds;
      }
    });
  }
  
  setupWindowObjectActions() {
    ipcMain.handle('window-obj-action', async (event, { method, winId, type, args }) => {
      try {
        const win = this.getWindow(winId);
        if (!win) {
          throw new Error(`找不到窗口: ${winId}`);
        }
        if (type === 'property') {
          // 获取窗口属性
          return {
            success: true,
            result: win[method]
          };
        } else if (type === 'method') {
          // 调用窗口方法
          const result = await win[method](...(args || []));
          return {
            success: true,
            result
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
  }
  // 对所有窗口广播，传入winId，与自己有关的都取。
  owerWindowBroadcastToAllWindows(eventName, args, sourceWinId) {
    for (const [_, winInfo] of this.windows) {
      winInfo.window.webContents.send('broadcast-window-event', {
        eventName,
        args,
        winId: sourceWinId
      });
    }
  }
  owerWindowObjBroadcastToAllWindows(eventName, args, sourceWinId) {
    for (const [_, winInfo] of this.windows) {
      winInfo.window.webContents.send('broadcast-window-obj-event', {
        eventName,
        args,
        winId: sourceWinId
      });
    }
  }
  async openWindow(windowPath, options = {}) {
    windowPath = windowPath == '/' ? 'windows' : windowPath.trim('/');
    windowPath = windowPath.indexOf('/') === -1 ? windowPath : path.join(...windowPath.split('/'));
    const windowJsonPath = path.join(process.cwd(), windowPath, 'window.json');
    console.log('🚀 打开窗口...', windowJsonPath);
    const windowConfig = JSON.parse(fs.readFileSync(windowJsonPath, 'utf-8'));
    if (!windowConfig) {
      throw new Error(`Window config not found: ${windowPath}`);
    }
    const predictedId = this.lastWinId + 1;
    
    windowConfig.webPreferences = windowConfig.webPreferences || {};
    const windowOptions = {
      ...windowConfig,
      ...options,
      webPreferences: {
        ...windowConfig.webPreferences,
        preload:path.join(process.cwd(), windowPath, 'preload.js')
      }
    };
    windowOptions['webPreferences']['nodeIntegration'] = true;
    windowOptions['webPreferences']['contextIsolation'] = true;
    const _windowOptions = windowOptions;
    _windowOptions['webPreferences']['additionalArguments'] = [`--window-id=${predictedId}`];

    const win = new BrowserWindow(windowOptions);
    // 在创建窗口后立即更新 lastWinId
    this.lastWinId = win.id;
    // 验证预测是否正确

    // 验证预测是否正确
    if (predictedId !== win.id) {
      console.warn(`❗ 窗口 ID 预测不准确: 预测=${predictedId}, 实际=${win.id}`);
    }
    // 监听窗口 webContents 的所有事件并转发
    const forwardEvents = [
      'did-finish-load','did-fail-load','did-fail-provisional-load','did-frame-finish-load','did-start-loading','did-stop-loading','dom-ready','page-title-updated','page-favicon-updated','content-bounds-updated','did-create-window','will-navigate','will-frame-navigate','did-start-navigation','will-redirect','did-redirect-navigation','did-navigate','did-frame-navigate','did-navigate-in-page','will-prevent-unload','render-process-gone','unresponsive','responsive','plugin-crashed','destroyed',
      // 'input-event',
      'before-input-event','enter-html-full-screen','leave-html-full-screen','zoom-changed','blur','focus','devtools-open-url','devtools-search-query','devtools-opened','devtools-closed','devtools-focused','certificate-error','select-client-certificate','login','found-in-page','media-started-playing','media-paused','audio-state-changed','did-change-theme-color','update-target-url',
      // 'cursor-changed',
      'context-menu','select-bluetooth-device','paint','devtools-reload-page','will-attach-webview','did-attach-webview',
      // 'console-message',
      'preload-error','ipc-message','ipc-message-sync','preferred-size-changed',
      // 'frame-created'
    ];
    this.windows.set(win.id, {
      window: win,
      winId: win.id,
      path: windowPath,
      windowOptions,
    });
    forwardEvents.forEach(eventName => {
      if(eventName==='destroyed'){return}
      win.webContents.on(eventName, (...args) => {
        try {
          const serializedArgs = serializeEventArgs(args);
          this.owerWindowBroadcastToAllWindows(eventName, serializedArgs, win.id);
          // 广播事件到所有窗口,为什么要广播，这主要是因为其他窗口可能需要监听新创建的窗口相关内容，这里就是因为创建窗口要监听它的时间。
        } catch (e) {
          console.error('❌ 事件转发失败:', eventName, e);
        }
      });
    });

    const windowObjEvents = [
     'page-title-updated','close','closed','query-session-end','session-end','unresponsive','responsive','blur','focus','show','hide','ready-to-show','maximize','unmaximize','minimize','restore','will-resize','resize','resized','will-move','move','moved','enter-full-screen','leave-full-screen','enter-html-full-screen','leave-html-full-screen','always-on-top-changed','app-command','swipe','rotate-gesture','sheet-begin','sheet-end','new-window-for-tab','system-context-menu' 
    ]
    windowObjEvents.forEach(eventName => {
      win.on(eventName, (...args) => {
        try {
          const serializedArgs = serializeEventArgs(args);
          this.owerWindowObjBroadcastToAllWindows(eventName, serializedArgs, win.id);
          // 广播事件到所有窗口,为什么要广播，这主要是因为其他窗口可能需要监听新创建的窗口相关内容，这里就是因为创建窗口要监听它的时间。
        } catch (e) {
          console.error('❌ 事件转发失败:', eventName, e);
        }
      });
    });
    if (isDevelopmentMode()) {
      const devServerUrl = getDevServerUrl();
      if (devServerUrl) {
        let urlPath = windowPath.replace(/^windows[\/\\]?/, '');
        urlPath = urlPath ? '/' + urlPath : '';
        const windowUrl = `${devServerUrl}${urlPath}/index.html`;
        console.log(' preloadPath:', windowOptions.webPreferences.preload);
        console.log(`🔍 开发模式加载: ${windowUrl}`);
        await win.loadURL(windowUrl);
        // win.webContents.openDevTools();
      } else {
        console.log('⚠️ 未找到开发服务器URL，使用文件加载模式');
        await win.loadFile(path.join(__dirname, '../windows', windowConfig.name, 'index.html'));
      }
    } else {
      const indexPath = path.join(process.cwd(), windowPath, 'dist', 'index.html');
      await win.loadFile(indexPath);
    }
    this.setupWindowCommunication(win, windowPath);
    win.on('closed', () => {
      this.windows.delete(win.id);
    });
    win.webContents.on('destroyed', () => {
      this.windows.delete(win.id);
    });
    return win;
  }
  async _openWindow(windowPath, options = {}) {
    let win = await this.openWindow(windowPath, options);
    let winInfo = this.windows.get(win.id)
    let _winInfo = {};
    for (const key in winInfo) {
      if(key !== 'window'){
        _winInfo[key] = winInfo[key]
      }
    }
    return _winInfo;
  }
  async restoreWindow(windowPath, state) {
    if(windowPath.indexOf('/')===0){
      windowPath = windowPath.trim('/');
    }
    if(windowPath.indexOf(path.sep)===0){
      windowPath = windowPath.trim(path.sep);
    }
    windowPath = windowPath.indexOf('/') === -1 ? windowPath : path.join(...windowPath.split('/'));
    console.log('🔄 恢复窗口状态...', windowPath);
    let win = await this.openWindow(windowPath, {});
    // 加载原始URL
    await win.loadURL(state.url);
    if(state.bounds){
      win.setBounds(state.bounds);
    }
    // 恢复窗口状态
    if (state.isMaximized) {
      win.maximize();
    } else if (state.isMinimized) {
      win.minimize();
    } else if (state.isFullScreen) {
      win.setFullScreen(true);
    }
  }
  setupWindowCommunication(win) {
    ipcMain.on(`window-message:${win.id}`, (event, { winId, channel, data }) => {
      const targetWindow = this.getWindowByWinId(winId);
      targetWindow.webContents.send(channel, data);
    });

    ipcMain.on(`window-broadcast:${win.id}`, (event, { channel, data }) => {
      for (const [winId, winInfo] of this.windows) {
        if (winId !== win.id) {
          winInfo.window.webContents.send(channel, data);
        }
      }
    });
  }

  getWindowInfo(winId) {
    const winInfo = this.windows.get(winId);
    if(!winInfo){
      console.log('窗口不存在2', winId);
      return null;
    }
    return winInfo ? winInfo : null;
  }

  _getWindowInfo(winId) {
    let winInfo = this.getWindowInfo(winId);
    let _winInfo = {};
    for (const key in winInfo) {
      if(key !== 'window'){
        _winInfo[key] = winInfo[key]
      }
    }
    return _winInfo;
  }

  getWindow(winId) {
    const winInfo = this.windows.get(winId);
    if(!winInfo){
      console.log('窗口不存在3', winId);
      return null;
    }
    return winInfo ? winInfo.window : null;
  }

  getAllWindow() {
    return Array.from(this.windows.values()).map(winInfo => {
      return winInfo;
    });
  }
  _getAllWindow() {
    return Array.from(this.windows.values()).map(winInfo => {
      let _winInfo = {};
      for (const key in winInfo) {
        if(key !== 'window'){
          _winInfo[key] = winInfo[key]
        }
      }
      return _winInfo;
    });
  }

  // 保存窗口状态
  saveWindowState(winId) {
    const winInfo = this.windows.get(winId);
    if (!winInfo) return null;
    const win = winInfo.window;
    return {
      bounds: win.getBounds(),
      isMaximized: win.isMaximized(),
      isMinimized: win.isMinimized(),
      isFullScreen: win.isFullScreen()
    };
  }
  // 向指定窗口发送消息
  sendToWindow(winId, eventName, data) {
    const win = this.getWindow(winId);
    if (!win) {
      console.error(`❌ 找不到目标窗口: ${winId}`);
      return false;
    }
    try {
      win.webContents.send('windowEvent:'+winId,{eventName, data});
      return true;
    } catch (error) {
      console.error(`❌ 发送消息失败: ${error.message}`);
      return false;
    }
  }
  // 广播消息给所有窗口（可选排除发送者）
  broadcast(channel, data, excludeWinIds = []) {
    for (const [winId, winInfo] of this.windows) {
      if (excludeWinIds.includes(winId)) continue;
      try {
        winInfo.window.webContents.send('broadcast',{channel, data});
      } catch (error) {
        console.error(`❌ 广播到窗口 ${winId} 失败: ${error.message}`);
      }
    }
  }
  async openModalWindow(parentWinId, windowPath, options = {}) {
    const parentWindow = this.getWindow(parentWinId);
    if (!parentWindow) {
      throw new Error(`父窗口不存在: ${parentWinId}`);
    }

    // 合并选项，强制设置 parent 和 modal
    const modalOptions = {
      ...options,
      parent: parentWindow,
      modal: true
    };

    const win = await this.openWindow(windowPath, modalOptions);

    // 在父窗口记录中添加子窗口信息
    const parentInfo = this.windows.get(parentWinId);
    if (!parentInfo.children) {
      parentInfo.children = {};
    }
    parentInfo.children[win.id] = this._getWindowInfo(win.id);
    this.windows.delete(parentWinId);
    this.windows.set(parentWinId, parentInfo);

    // 当子窗口关闭时，从父窗口记录中移除
    win.on('close', () => {
      if(parentInfo.children && parentInfo.children[win.id]){
        delete parentInfo.children[win.id];
      }
    });

    return win;
  }

  async _openModalWindow(parentWinId, windowPath, options = {}) {
    const win = await this.openModalWindow(parentWinId, windowPath, options);
    let winInfo = this.windows.get(win.id);
    let _winInfo = {};
    for (const key in winInfo) {
      if(key !== 'window'){
        _winInfo[key] = winInfo[key];
      }
    }
    _winInfo['windowOptions']['parent'] = 'un serialize';
    return _winInfo;
  }
}

const windowManager = new WindowManager();
module.exports = windowManager;
