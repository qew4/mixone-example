class WindowController {
  constructor() {
    this.winId = null;
  }
  setWinId(winId) {
    this.winId = winId;
  }
  openWindow(windowPath, options = {}) {
    if (this.winId === null) {
      this.winId = windowPath;
    }
    
    ipcRenderer.send('open-window', {
      windowPath,
      options
    });
  }
  sendMessageToWindow(targetWinId, channel, data) {
    if (this.winId === null) {
      console.log('窗口还未建立');
      return;
    }
    ipcRenderer.send('window-message', {
      sourceWinId: this.winId,
      targetWinId,
      channel,
      data
    });
  }

  broadcastMessage(channel, data) {
    if (this.winId === null) {
      console.log('窗口还未建立');
      return;
    }
    ipcRenderer.send('window-broadcast', {
      sourceWinId: this.winId,
      channel,
      data
    });
  }

  async getAllWindows() {
    return await ipcRenderer.invoke('getAllWindows');
  }

  onWindowMessage(channel, callback) {
    ipcRenderer.on(channel, callback);
  }

  getCurrentWindowId() {
    if (this.winId === null) {
      console.log('窗口还未建立');
      return null;
    }
    return this.winId;
  }
}

module.exports = new WindowController();