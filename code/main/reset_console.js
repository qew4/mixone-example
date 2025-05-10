const { BrowserWindow } = require('electron');
// 在应用初始化时设置控制台重定向
function setupConsoleRedirect(isDev) {
  if(!isDev){
    return;
  }
    // 保存原始的控制台方法
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };
    // 添加参数处理函数
    function sanitizeArgs(args) {
      return args.map(arg => {
        if (arg === null || arg === undefined) {
          return String(arg);
        }
        
        if (arg instanceof Error) {
          return {
            message: arg.message,
            stack: arg.stack,
            name: arg.name
          };
        }

        if (typeof arg === 'object') {
          try {
            // 处理循环引用和不可序列化的对象
            const seen = new WeakSet();
            const sanitized = JSON.parse(JSON.stringify(arg, (key, value) => {
              if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                  return '[循环引用]';
                }
                seen.add(value);
                
                // 处理特殊对象类型
                if (value instanceof RegExp) return `RegExp(${value.toString()})`;
                if (value instanceof Date) return `Date(${value.toISOString()})`;
                if (value instanceof Function) return `Function(${value.name || 'anonymous'})`;
              }
              return value;
            }));
            return sanitized;
          } catch (e) {
            return `[不可序列化的对象: ${arg.constructor?.name || typeof arg}]`;
          }
        }

        return arg;
      });
    }

    // 修改发送日志函数
    function sendLogToRenderer(type, ...args) {
      originalConsole[type].apply(console, args);
      const prefix = [`%c[Main Process]%c`, 'color: #8a2be2; font-weight: bold', 'color: inherit'];
      const sanitizedArgs = sanitizeArgs(args);
      const formattedArgs = [...prefix, ...sanitizedArgs];

      const windows = BrowserWindow.getAllWindows();
      windows.forEach(win => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('main-process-log', {
            type,
            args: formattedArgs
          });
        }
      });
    }
  
    // 重写控制台方法
    console.log = (...args) => sendLogToRenderer('log', ...args);
    console.info = (...args) => sendLogToRenderer('info', ...args);
    console.warn = (...args) => sendLogToRenderer('warn', ...args);
    console.error = (...args) => sendLogToRenderer('error', ...args);
    console.debug = (...args) => sendLogToRenderer('debug', ...args);
  }

  module.exports = {
    setupConsoleRedirect
  }