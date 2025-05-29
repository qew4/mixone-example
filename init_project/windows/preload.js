const { shell } = require('electron');
const fs = require('fs');

// 一些辅助函数
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 系统状态
let isReady = false;

// 初始化
async function initialize() {
  await delay(1000);
  isReady = true;
}

initialize();

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('myAPI', {
  // 覆盖第一个文件中的函数
  sendMessage: async (message) => {
    if (!isReady) await delay(100);
    return ipcRenderer.invoke('send-message', message);
  },
  
  // 新增的方法
  openExternal: (url) => {
    return shell.openExternal(url);
  },
  
  // 覆盖常量
  VERSION: '2.0.2',
  
  // 扩展嵌套对象
  utils: {
    readFile: async (path) => {
      return fs.promises.readFile(path, 'utf-8');
    },
    // 保留原有的 isAbsolute 方法
    isAbsolute: (p) => path.isAbsolute(p)
  }
});

// 暴露另一个 API
contextBridge.exposeInMainWorld('systemAPI', {
  getStatus: () => isReady,
  restart: async () => {
    await ipcRenderer.invoke('system-restart');
  }
});

contextBridge.exposeInMainWorld('getAllWindow',() => {
  ipcRenderer.send('getAllWindow', 'msg');
});