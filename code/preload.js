// preload.js
const { contextBridge, ipcRenderer } = require('electron');
const windowController = require('./window-controller');
// 监听主进程日志
ipcRenderer.on('main-process-log', (event, { type, args }) => {
  try {
    // 确保 type 是有效的控制台方法
    const validTypes = ['log', 'error', 'warn', 'info', 'debug'];
    type = validTypes.includes(type) ? type : 'log';

    // 确保 args 是数组且可以安全序列化
    args = Array.isArray(args) ? args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.parse(JSON.stringify(arg));
        } catch (e) {
          return String(arg);
        }
      }
      return arg;
    }) : [String(args)];

    console[type](...args);
  } catch (error) {
    console.error('处理主进程日志失败:', error);
  }
});
const _winId = Number(process.argv.find(arg => arg.startsWith('--window-id=')).split('=')[1]);
windowController.setWinId(_winId);

// 监听指定窗口的事件
ipcRenderer.on(`windowEvent:${_winId}`, (event, { eventName, data }) => {
  const listeners = windowEventListeners.get(eventName);
  if (listeners) {
    listeners.forEach(listener => listener(data));
  }
});
// 监听广播事件
ipcRenderer.on('broadcast', (event, { channel, data }) => {
  const listeners = windowEventListeners.get(channel);
  if (listeners) {
    listeners.forEach(listener => listener(data));
  }
});
contextBridge.exposeInMainWorld('getWinId', () => {
  return _winId;
});
contextBridge.exposeInMainWorld('winId', _winId);
// 存储事件监听器
const windowEventListeners = new Map();
const windowObjEventListeners = new Map();
// 生成事件键
function generateEventKey(eventName, winId) {
  return `${eventName}___${winId}`;
}
// 监听从主进程转发来的窗口事件
ipcRenderer.on('broadcast-window-event', (event, { eventName, args, winId }) => {
  // 只处理属于当前窗口的事件
  const eventKey = generateEventKey(eventName, winId);
  const listeners = windowEventListeners.get(eventKey);
  if (listeners) {
    listeners.forEach(listener => listener(...args));
  }
});
// 监听从主进程转发来的窗口事件
ipcRenderer.on('broadcast-window-obj-event', (event, { eventName, args, winId }) => {
  // 只处理属于当前窗口的事件
  const eventKey = generateEventKey(eventName, winId);
  const listeners = windowObjEventListeners.get(eventKey);
  if (listeners) {
    listeners.forEach(listener => listener(...args));
  }
});
// 跟踪已注册的事件监听器
const registeredCallbacks = new Map();
// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 调用主进程函数的方法
  callMainFunction: async (id, params) => {
    try {
      const response = await ipcRenderer.invoke('call-main-fn', { id, args: params });
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.result;
    } catch (error) {
      throw error;
    }
  },

  // 注册回调函数的方法
  registerCallback: (callbackId, callback) => {
    // 检查是否已经注册过这个回调
    if (registeredCallbacks.has(callbackId)) {
      // 如果已注册，先移除旧的监听器
      const oldListener = registeredCallbacks.get(callbackId);
      ipcRenderer.removeListener('callback:' + callbackId, oldListener);
    }

    // 创建新的监听器函数
    const listener = (event, ...args) => {
      callback(...args);
    };
    // 注册新的监听器
    ipcRenderer.on('callback:' + callbackId, listener);
    // 保存监听器引用
    registeredCallbacks.set(callbackId, listener);
  }
});

contextBridge.exposeInMainWorld('windowManager', {
  openWindow: async (...args) => {
    let response = await ipcRenderer.invoke('window-manager-action', {
      method: '_openWindow',
      args
    });
    const windowProperties = [
      // 'webContents',      
      'id', 'tabbingIdentifier', 'autoHideMenuBar', 'simpleFullScreen', 'fullScreen',
      'focusable',
      'visibleOnAllWorkspaces', 'shadow',
      'menuBarVisible', 'kiosk',
      'documentEdited', 'representedFilename', 'title', 'minimizable',
      'maximizable', 'fullScreenable', 'resizable', 'closable', 'movable',
      'excludedFromShownWindowsMenu', 'accessibleTitle'
    ];
    const windowMethods = ["destroy", "close", "focus", "blur", "isFocused", "isDestroyed", "show", "showInactive", "hide", "isVisible", "isModal", "maximize", "unmaximize",
      "isMaximized", "minimize", "restore", "isMinimized", "setFullScreen", "isFullScreen", "setSimpleFullScreen", "isSimpleFullScreen", "isNormal", "setAspectRatio",
      "setBackgroundColor", "previewFile", "closeFilePreview", "setBounds", "getBounds", "getBackgroundColor", "setContentBounds", "getContentBounds", "getNormalBounds",
      "setEnabled", "isEnabled", "setSize", "getSize", "setContentSize", "getContentSize", "setMinimumSize", "getMinimumSize", "setMaximumSize", "getMaximumSize",
      "setResizable", "isResizable", "setMovable", "isMovable", "setMinimizable", "isMinimizable", "setMaximizable", "isMaximizable", "setFullScreenable",
      "isFullScreenable", "setClosable", "isClosable", "setHiddenInMissionControl", "isHiddenInMissionControl", "setAlwaysOnTop", "isAlwaysOnTop", "moveAbove", "moveTop",
      "center", "setPosition", "getPosition", "setTitle", "getTitle", "setSheetOffset", "flashFrame", "setSkipTaskbar", "setKiosk", "isKiosk", "isTabletMode",
      "getMediaSourceId", "getNativeWindowHandle", "hookWindowMessage", "isWindowMessageHooked", "unhookWindowMessage", "unhookAllWindowMessages",
      "setRepresentedFilename", "getRepresentedFilename", "setDocumentEdited", "isDocumentEdited", "focusOnWebView", "blurWebView", "capturePage", "loadURL", "loadFile",
      "reload", "setMenu", "removeMenu", "setProgressBar", "setOverlayIcon", "invalidateShadow", "setHasShadow", "hasShadow", "setOpacity", "getOpacity", "setShape",
      "setThumbarButtons", "setThumbnailClip", "setThumbnailToolTip", "setAppDetails", "showDefinitionForSelection", "setIcon", "setWindowButtonVisibility",
      "setAutoHideMenuBar", "isMenuBarAutoHide", "setMenuBarVisibility", "isMenuBarVisible", "setVisibleOnAllWorkspaces", "isVisibleOnAllWorkspaces",
      "setIgnoreMouseEvents", "setContentProtection", "setFocusable", "isFocusable", "setParentWindow", "getParentWindow", "getChildWindows", "setAutoHideCursor",
      "selectPreviousTab", "selectNextTab", "showAllTabs", "mergeAllWindows", "moveTabToNewWindow", "toggleTabBar", "addTabbedWindow", "setVibrancy",
      "setBackgroundMaterial", "setWindowButtonPosition", "getWindowButtonPosition", "setTouchBar", "setBrowserView", "getBrowserView", "addBrowserView",
      "removeBrowserView", "setTopBrowserView", "getBrowserViews", "setTitleBarOverlay"]

    if (response.success) {
      let winId = response.result.winId;
      const obj = {
        ...response.result,
        webContents: {
          // 添加窗口事件监听方法
          on: (eventName, callback) => {
            const eventKey = generateEventKey(eventName, winId);
            console.log('set eventKey', eventKey)
            if (!windowEventListeners.has(eventKey)) {
              windowEventListeners.set(eventKey, new Set());
            }
            windowEventListeners.get(eventKey).add(callback);
          },

          // 移除窗口事件监听方法
          off: (eventName, callback) => {
            const eventKey = generateEventKey(eventName, winId);
            const listeners = windowEventListeners.get(eventKey);
            if (listeners) {
              listeners.delete(callback);
              if (listeners.size === 0) {
                windowEventListeners.delete(eventKey);
              }
            }
          },
          // 一次性事件监听
          once: (eventName, callback) => {
            const eventKey = generateEventKey(eventName, winId);
            const onceCallback = (...args) => {
              callback(...args);
              windowEventListeners.get(eventKey)?.delete(onceCallback);
            };
            if (!windowEventListeners.has(eventKey)) {
              windowEventListeners.set(eventKey, new Set());
            }
            windowEventListeners.get(eventKey).add(onceCallback);
          },
        },
        // 添加窗口对象的事件处理方法
        on: (eventName, callback) => {
          const eventKey = generateEventKey(eventName, winId);
          if (!windowObjEventListeners.has(eventKey)) {
            windowObjEventListeners.set(eventKey, new Set());
          }
          windowObjEventListeners.get(eventKey).add(callback);
        },
        off: (eventName, callback) => {
          const eventKey = generateEventKey(eventName, winId);
          const listeners = windowObjEventListeners.get(eventKey);
          if (listeners) {
            listeners.delete(callback);
            if (listeners.size === 0) {
              windowObjEventListeners.delete(eventKey);
            }
          }
        },
        once: (eventName, callback) => {
          const eventKey = generateEventKey(eventName, winId);
          const onceCallback = (...args) => {
            callback(...args);
            windowObjEventListeners.get(eventKey)?.delete(onceCallback);
          };
          if (!windowObjEventListeners.has(eventKey)) {
            windowObjEventListeners.set(eventKey, new Set());
          }
          windowObjEventListeners.get(eventKey).add(onceCallback);
        }
      };
      // 为每个属性定义 getter
      windowProperties.forEach(prop => {
        Object.defineProperty(obj, prop, {
          enumerable: true,
          configurable: true,
          get: async () => {
            const response = await ipcRenderer.invoke('window-obj-action', {
              method: prop,
              winId: winId,
              type: 'property'
            });
            if (response.success) {
              return response.result;
            } else {
              throw new Error(response.error);
            }
          }
        });
      });
      windowMethods.forEach(method => {
        Object.defineProperty(obj, method, {
          enumerable: true,
          configurable: true,
          value: async (...args) => {
            const response = await ipcRenderer.invoke('window-obj-action', {
              method,
              winId: winId,
              type: 'method',
              args
            });
            if (response.success) {
              return response.result;
            } else {
              throw new Error(response.error);
            }
          }
        });
      });
      return obj;
    } else {
      throw new Error(response.error);
    }
  },
  // 添加模态窗口方法
  openModalWindow: async (parentWinId, windowPath, options = {}) => {
    let response = await ipcRenderer.invoke('window-manager-action', {
      method: '_openModalWindow',
      args: [parentWinId, windowPath, options]
    });

    // 复用现有的窗口属性和方法处理逻辑
    let windowProperties = [
      // 'webContents',      
      'id', 'tabbingIdentifier', 'autoHideMenuBar', 'simpleFullScreen', 'fullScreen',
      'focusable',
      'visibleOnAllWorkspaces', 'shadow',
      'menuBarVisible', 'kiosk',
      'documentEdited', 'representedFilename', 'title', 'minimizable',
      'maximizable', 'fullScreenable', 'resizable', 'closable', 'movable',
      'excludedFromShownWindowsMenu', 'accessibleTitle'
    ];
    let windowMethods = ["destroy", "close", "focus", "blur", "isFocused", "isDestroyed", "show", "showInactive", "hide", "isVisible", "isModal", "maximize", "unmaximize",
      "isMaximized", "minimize", "restore", "isMinimized", "setFullScreen", "isFullScreen", "setSimpleFullScreen", "isSimpleFullScreen", "isNormal", "setAspectRatio",
      "setBackgroundColor", "previewFile", "closeFilePreview", "setBounds", "getBounds", "getBackgroundColor", "setContentBounds", "getContentBounds", "getNormalBounds",
      "setEnabled", "isEnabled", "setSize", "getSize", "setContentSize", "getContentSize", "setMinimumSize", "getMinimumSize", "setMaximumSize", "getMaximumSize",
      "setResizable", "isResizable", "setMovable", "isMovable", "setMinimizable", "isMinimizable", "setMaximizable", "isMaximizable", "setFullScreenable",
      "isFullScreenable", "setClosable", "isClosable", "setHiddenInMissionControl", "isHiddenInMissionControl", "setAlwaysOnTop", "isAlwaysOnTop", "moveAbove", "moveTop",
      "center", "setPosition", "getPosition", "setTitle", "getTitle", "setSheetOffset", "flashFrame", "setSkipTaskbar", "setKiosk", "isKiosk", "isTabletMode",
      "getMediaSourceId", "getNativeWindowHandle", "hookWindowMessage", "isWindowMessageHooked", "unhookWindowMessage", "unhookAllWindowMessages",
      "setRepresentedFilename", "getRepresentedFilename", "setDocumentEdited", "isDocumentEdited", "focusOnWebView", "blurWebView", "capturePage", "loadURL", "loadFile",
      "reload", "setMenu", "removeMenu", "setProgressBar", "setOverlayIcon", "invalidateShadow", "setHasShadow", "hasShadow", "setOpacity", "getOpacity", "setShape",
      "setThumbarButtons", "setThumbnailClip", "setThumbnailToolTip", "setAppDetails", "showDefinitionForSelection", "setIcon", "setWindowButtonVisibility",
      "setAutoHideMenuBar", "isMenuBarAutoHide", "setMenuBarVisibility", "isMenuBarVisible", "setVisibleOnAllWorkspaces", "isVisibleOnAllWorkspaces",
      "setIgnoreMouseEvents", "setContentProtection", "setFocusable", "isFocusable", "setParentWindow", "getParentWindow", "getChildWindows", "setAutoHideCursor",
      "selectPreviousTab", "selectNextTab", "showAllTabs", "mergeAllWindows", "moveTabToNewWindow", "toggleTabBar", "addTabbedWindow", "setVibrancy",
      "setBackgroundMaterial", "setWindowButtonPosition", "getWindowButtonPosition", "setTouchBar", "setBrowserView", "getBrowserView", "addBrowserView",
      "removeBrowserView", "setTopBrowserView", "getBrowserViews", "setTitleBarOverlay"
    ];

    if (response.success) {
      let winId = response.result.winId;
      const obj = {
        ...response.result,
        webContents: {
          // 复用现有的事件处理方法
          on: (eventName, callback) => {
            const eventKey = generateEventKey(eventName, winId);
            if (!windowEventListeners.has(eventKey)) {
              windowEventListeners.set(eventKey, new Set());
            }
            windowEventListeners.get(eventKey).add(callback);
          },
          off: (eventName, callback) => {
            const eventKey = generateEventKey(eventName, winId);
            const listeners = windowEventListeners.get(eventKey);
            if (listeners) {
              listeners.delete(callback);
              if (listeners.size === 0) {
                windowEventListeners.delete(eventKey);
              }
            }
          },
          once: (eventName, callback) => {
            const eventKey = generateEventKey(eventName, winId);
            const onceCallback = (...args) => {
              callback(...args);
              windowEventListeners.get(eventKey)?.delete(onceCallback);
            };
            if (!windowEventListeners.has(eventKey)) {
              windowEventListeners.set(eventKey, new Set());
            }
            windowEventListeners.get(eventKey).add(onceCallback);
          },
        },
        on: (eventName, callback) => {
          const eventKey = generateEventKey(eventName, winId);
          if (!windowObjEventListeners.has(eventKey)) {
            windowObjEventListeners.set(eventKey, new Set());
          }
          windowObjEventListeners.get(eventKey).add(callback);
        },
        off: (eventName, callback) => {
          const eventKey = generateEventKey(eventName, winId);
          const listeners = windowObjEventListeners.get(eventKey);
          if (listeners) {
            listeners.delete(callback);
            if (listeners.size === 0) {
              windowObjEventListeners.delete(eventKey);
            }
          }
        },
        once: (eventName, callback) => {
          const eventKey = generateEventKey(eventName, winId);
          const onceCallback = (...args) => {
            callback(...args);
            windowObjEventListeners.get(eventKey)?.delete(onceCallback);
          };
          if (!windowObjEventListeners.has(eventKey)) {
            windowObjEventListeners.set(eventKey, new Set());
          }
          windowObjEventListeners.get(eventKey).add(onceCallback);
        }
      };

      // 复用现有的属性和方法定义逻辑
      windowProperties.forEach(prop => {
        Object.defineProperty(obj, prop, {
          enumerable: true,
          configurable: true,
          get: async () => {
            const response = await ipcRenderer.invoke('window-obj-action', {
              method: prop,
              winId: winId,
              type: 'property'
            });
            if (response.success) {
              return response.result;
            } else {
              throw new Error(response.error);
            }
          }
        });
      });

      windowMethods.forEach(method => {
        Object.defineProperty(obj, method, {
          enumerable: true,
          configurable: true,
          value: async (...args) => {
            const response = await ipcRenderer.invoke('window-obj-action', {
              method,
              winId: winId,
              type: 'method',
              args
            });
            if (response.success) {
              return response.result;
            } else {
              throw new Error(response.error);
            }
          }
        });
      });
      return obj;
    } else {
      throw new Error(response.error);
    }
  },
  getAllWindow: async (...args) => {
    let response = await ipcRenderer.invoke('window-manager-action', {
      method: '_getAllWindow',
      args
    });
    if (response.success) {
      return response.result;
    } else {
      throw new Error(response.error);
    }
  },
  getWindowInfo: async (...args) => {
    let response = await ipcRenderer.invoke('window-manager-action', {
      method: '_getWindowInfo',
      args
    });
    if (response.success) {
      return response.result;
    } else {
      throw new Error(response.error);
    }
  },
  // 发送消息到指定窗口
  sendToWindow: async (winId, eventName, data) => {
    let response = await ipcRenderer.invoke('window-manager-action', {
      method: 'sendToWindow',
      args: [winId, eventName, data]
    });
    return response.success;
  },

  // 广播消息
  broadcast: async (channel, data, excludeWinIds = []) => {
    let response = await ipcRenderer.invoke('window-manager-action', {
      method: 'broadcast',
      args: [channel, data, excludeWinIds]
    });
    return response.success;
  },

  // 监听事件
  on: (eventName, callback) => {
    if (!windowEventListeners.has(eventName)) {
      windowEventListeners.set(eventName, new Set());
    }
    windowEventListeners.get(eventName).add(callback);
  },

  // 移除事件监听
  off: (eventName, callback) => {
    const listeners = windowEventListeners.get(eventName);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        windowEventListeners.delete(eventName);
      }
    }
  },

  // 一次性事件监听
  once: (eventName, callback) => {
    const onceCallback = (...args) => {
      callback(...args);
      windowEventListeners.get(eventName)?.delete(onceCallback);
    };
    if (!windowEventListeners.has(eventName)) {
      windowEventListeners.set(eventName, new Set());
    }
    windowEventListeners.get(eventName).add(onceCallback);
  }
});
contextBridge.exposeInMainWorld('openWindow', async (windowId, options = {}) => {
  try {
    const response = await ipcRenderer.invoke('window-manager-action', {
      method: '_openWindow',
      args: [windowId, options]
    });
    if (response.success) {
      return response.result;
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    throw error;
  }
});
