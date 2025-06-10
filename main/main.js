const { app } = require('electron');
// 保持对窗口对象的全局引用
let mainWindow = null;

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(async () => {
  // 创建主窗口
  mainWindow = await windowManager.openWindow('/windows');
})

// 当所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (mainWindow === null) {
    mainWindow = await windowManager.openWindow('/windows');
  }
});