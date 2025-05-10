const path = require('path');
const chokidar = require('chokidar');
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const windowManager = require('./window-manager');
// 保存原始的定时器函数和清除函数
const originalSetTimeout = global.setTimeout.bind(global);
const originalSetInterval = global.setInterval.bind(global);
const originalClearTimeout = global.clearTimeout.bind(global);
const originalClearInterval = global.clearInterval.bind(global);

// 用于存储所有定时器的集合
const timerManager = {
  timeouts: new Set(),
  intervals: new Set(),
  
  // 添加 setTimeout
  addTimeout(timer) {
    this.timeouts.add(timer);
  },
  
  // 添加 setInterval
  addInterval(timer) {
    this.intervals.add(timer);
  },
  
  // 清除所有定时器
  clearAll() {
    // 使用正确的清除函数
    this.timeouts.forEach(timer => {
      originalClearTimeout(timer);
    });
    this.timeouts.clear();
    
    this.intervals.forEach(timer => {
      originalClearInterval(timer);
    });
    this.intervals.clear();
    
    console.log('🧹 已清除所有定时器');
  }
};

// 重写定时器函数，使用保存的原始函数
global.setTimeout = function wrappedSetTimeout(callback, delay, ...args) {
  const timer = originalSetTimeout(callback, delay, ...args);
  timerManager.addTimeout(timer);
  return timer;
};

global.setInterval = function wrappedSetInterval(callback, delay, ...args) {
  const timer = originalSetInterval(callback, delay, ...args);
  timerManager.addInterval(timer);
  return timer;
};

/**
 * 处理主进程文件的热重载
 * @param {string} outDir 输出目录路径
 */
function setupMainProcessHotReload(outDir) {
  console.log('🔥 开始设置主进程热重载...');
  
  // 添加防抖标志，避免短时间内多次触发
  let isReloading = false;
  let reloadTimeout = null;

  const mainDir = outDir;
  console.log('📁 监听目录:', mainDir);

  // 检查目录是否存在
  if (!fs.existsSync(mainDir)) {
    console.error('❌ 监听目录不存在:', mainDir);
    return;
  }

  // 创建文件监听器，添加更多的忽略选项
  const watcher = chokidar.watch(mainDir, {
    ignored: [
      /(^|[\/\\])\../, // 忽略隐藏文件
      '**/node_modules/**', // 忽略 node_modules
      '**/*.map', // 忽略 source map 文件
      '**/tmp/**' // 忽略临时文件
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500, // 等待文件写入完成的时间
      pollInterval: 100
    },
    depth: 1 // 限制监听深度
  });

  // 处理文件变化的防抖函数
  function debounceReload(filePath, handler) {
    if (isReloading) {
      return;
    }

    isReloading = true;
    clearTimeout(reloadTimeout);

    reloadTimeout = setTimeout(() => {
      try {
        handler(filePath);
      } catch (error) {
        console.error('❌ 重新加载失败:', error);
      } finally {
        isReloading = false;
      }
    }, 300); // 300ms 防抖延迟
  }
  // 从 URL 提取窗口 ID
  function getWindowIdFromUrl(url) {
    try {
      // 匹配 http://localhost:5174/settings-window/preferences-window/index.html 格式
      // 匹配 http://localhost:5174/help-window/index.html 格式
      // 匹配 http://localhost:5174/index.html 格式
      const { pathname } = new URL(url);
      const pathSegments = pathname.split('/').filter(p => p.indexOf('.html')===-1);
      
      // 寻找包含 "-window" 的路径段
      let windowPath = pathSegments.join(path.sep);
      
      // 示例结果：
      // 1. "settings-window/preferences-window"
      // 2. "help-window"
      // 3. "" → 返回 null
      return path.sep + 'windows' + windowPath || null;
    } catch (error) {
      console.error('❌ 解析窗口 URL 失败:', error);
      return null;
    }
  }
  let mainWindow = null;
  const windows = new Set();

  // 保存所有已加载的模块缓存
  const cachedModules = new Map();

  // 移除所有 IPC 处理程序
  function removeIpcHandlers() {
    try {
      console.log('🔄 准备移除 IPC 处理程序');
      // 移除 call-main-fn 处理程序
      ipcMain.removeHandler('call-main-fn');
      console.log('✨ 已移除 IPC 处理程序');
    } catch (error) {
      console.error('❌ 移除 IPC 处理程序失败:', error);
    }
  }

  // 清除模块缓存
  function clearModuleCache(modulePath) {
    try {
      console.log('🔄 准备清除模块缓存:', modulePath);
      // 删除 require 缓存
      delete require.cache[require.resolve(modulePath)];
      console.log('✨ 已清除模块缓存:', modulePath);
    } catch (error) {
      console.error('❌ 清除模块缓存失败:', error);
    }
  }

  // 重新加载模块
  function reloadModule(modulePath) {
    try {
      console.log('🔄 准备重新加载模块:', modulePath);
      // 先移除旧的 IPC 处理程序
      removeIpcHandlers();
      // 清除模块缓存
      clearModuleCache(modulePath);
      // 重新加载模块
      const newModule = require(modulePath);
      cachedModules.set(modulePath, newModule);
      console.log('✅ 已重新加载模块:', modulePath);
      return newModule;
    } catch (error) {
      console.error('❌ 重新加载模块失败:', error);
      return null;
    }
  }
  // 保存窗口状态
  function saveWindowStates() {
    let windowStateStr = {};
    BrowserWindow.getAllWindows().forEach(win => {
      let save_win  = windowManager._getWindowInfo(win.id);
      const url = win.webContents.getURL();
      const windowPath = getWindowIdFromUrl(url);
      //经过考虑modal窗口不用恢复，因为一旦恢复了，父窗口实际是不能控制的。反而成了大问题。
      if(!save_win.windowOptions.modal){
        let item = {
          windowPath,
          // 基本属性
          bounds: win.getBounds(),
          url: win.webContents.getURL(),
          // 窗口状态
          isMaximized: win.isMaximized(),
          isMinimized: win.isMinimized(),
          isFullScreen: win.isFullScreen(),
          // 窗口配置
          resizable: win.isResizable(),
          movable: win.isMovable(),
          minimizable: win.isMinimizable(),
          maximizable: win.isMaximizable(),
          closable: win.isClosable(),
          modal:win.isModal(),
          // 其他重要配置
          alwaysOnTop: win.isAlwaysOnTop(),
          autoHideMenuBar: win.autoHideMenuBar,
          windowOptions:save_win.windowOptions
        }
        // 处理子窗口的配置
        
        let childrenWinIds = Object.keys(save_win.children || {});
        if(childrenWinIds.length>0){
          item.childrenWindowOptions = childrenWinIds.map(child_win_id=>{
            return windowManager._getWindowInfo(Number(child_win_id));
          })
        }
        windowStateStr[win.id] = JSON.stringify(item);
      } else {
        console.log('窗口'+win.id+'是模态窗口，不保存状态')
      }
      // 获取完整的窗口配置
    });
    
    // 将窗口状态写入临时文件
    const statesPath = path.join(app.getPath('temp'), 'window-states.txt');
    fs.writeFileSync(statesPath, Object.values(windowStateStr).join('------'));
    console.log('✅ 已保存窗口状态到临时文件:', statesPath);
    return statesPath;
  }
  // 处理 main.js 的变化
  function handleMainJsChange() {
    // 保存窗口状态
    saveWindowStates();
    // 重启应用
    console.log('🔄 重启应用准备完成...');
  }

  // 处理其他 JS 文件的变化
  function handleOtherJsChange(filePath) {
    console.log('🔄 检测到文件变化:', filePath);
    
    // 清除所有定时器
    timerManager.clearAll();
    
    // 重新加载模块
    const reloadedModule = reloadModule(filePath);
    
    if (reloadedModule) {
      // 如果模块有 hot reload 处理函数，则调用它
      if (typeof reloadedModule.onHotReload === 'function') {
        console.log('🔄 调用模块的 onHotReload 函数');
        reloadedModule.onHotReload();
      }
      // 如果模块导出了新的主进程函数，需要重新注册
      if (typeof reloadedModule.registerMainFunctions === 'function') {
        console.log('🔄 重新注册主进程函数');
        reloadedModule.registerMainFunctions();
      }
      
      console.log('✅ 模块热重载完成:', filePath);
    }
  }
  function fnReload(filePath) {
    const normalizedPath = path.normalize(filePath);
    // 使用防抖处理文件变化
    if (normalizedPath.endsWith('main.js')) {
      console.log('🔄 main.js 发生变化，需要重启生效...');
      handleMainJsChange()
    } else if (normalizedPath.endsWith('fn.js')) {
      console.log('🔧 fn.js 文件变化，执行特殊处理...');
      debounceReload(normalizedPath, handleOtherJsChange);
    } else {
      handleMainJsChange()
      console.log('🔄 main目录 发生变化，需要重启生效...');
    }
  }
  // 监听文件变化
  watcher.on('all', (event,filePath) => {
    console.log(`📝 检测到文件${event}:`, filePath);
    if (['add', 'change', 'unlink'].includes(event)) {
      fnReload(filePath)
    }
  });

  // 监听错误，添加更多错误处理
  watcher.on('error', (error) => {
    console.error('❌ 文件监听器错误:', error);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
    
    // 尝试重新启动监听器
    try {
      watcher.close();
      setTimeout(() => {
        setupMainProcessHotReload(outDir);
      }, 1000);
    } catch (e) {
      console.error('❌ 重启监听器失败:', e);
    }
  });

  // 监听就绪事件
  watcher.on('ready', () => {
    console.log('✅ 文件监听器已就绪');
  });

  console.log('✅ 主进程热重载设置完成');

  // 确保在应用退出时关闭监听器
  app.on('before-quit', () => {
    watcher.close();
    clearTimeout(reloadTimeout);
  });

  return watcher;
}

module.exports = {
  setupMainProcessHotReload,
  timerManager // 导出定时器管理器以便其他模块使用
}; 