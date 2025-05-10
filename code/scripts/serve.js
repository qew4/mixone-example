const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const iconv = require('iconv-lite');
// 新增 FileWatcher 类
class FileWatcher {
  constructor(electronManager, watchDir, ignorePatterns) {
    this.electronManager = electronManager;
    this.watchDir = watchDir;
    this.ignorePatterns = ignorePatterns;
    this.watcher = null;
    this.reloadDebounce = null;
  }

  initialize() {
    this.watcher = chokidar.watch(this.watchDir, {
      ignored: this.ignorePatterns,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    this.watcher.on('all', this.handleFileChange.bind(this));
    this.watcher.on('error', this.handleError.bind(this));
  }

  async handleFileChange(event, filePath) {
    if (['add', 'change', 'unlink'].includes(event)) {
      console.log(`🔄 检测到 ${filePath} ${event}，触发重启...`);
        
      clearTimeout(this.reloadDebounce);
      this.reloadDebounce = setTimeout(async () => {
        await this.electronManager.restart();
      }, 50);
    }
  }

  handleError(error) {
    console.error('文件监听错误:', error);
  }

  async close() {
    if (this.watcher) {
      await this.watcher.close();
      console.log('✅ 已关闭文件监听器');
    }
  }
}
// 新增 Electron 进程管理类
class ElectronManager {
  constructor() {
    this.electronProcess = null;
    this.restarting = false;
    // 新增状态文件路径属性
    this.stateFilePath = path.join(require('os').tmpdir(), 'window-states.txt');
  }

  // 启动 Electron 进程
  start(args = []) {
    const defaultArgs = ['electron','.', '--dev'];
    console.log('启动 Electron 进程...',defaultArgs,args);
    this.electronProcess = spawn('npx', [...defaultArgs, ...args], {
      stdio: 'inherit',
      shell: true
    });

    // 监听进程意外退出
    this.electronProcess.on('exit', async (code) => {
      console.log(`Electron 进程已退出，退出码: ${code}`);
      if (!this.restarting) {
        await cleanup();
        process.exit(code);
      }
    });
  }

  // 终止 Electron 进程（返回 Promise）
  async stop() {
    if (!this.electronProcess) return;
    
    return new Promise((resolve) => {
      this.restarting = true;
      
      // Windows 使用 taskkill 强制终止进程树
      exec(`taskkill /F /T /PID ${this.electronProcess.pid}`, (error) => {
        this.electronProcess = null;
        this.restarting = false;
        if (error) console.error('终止进程失败:', error.message);
        resolve();
      });
    });
  }

  // 重启应用
  async restart() {
    await this.stop();
    this.start([`--window-states=${this.stateFilePath}`]);
    console.log('✅ Electron 进程已重启');
  }
}
// 在文件顶部声明实例
const electronManager = new ElectronManager();
// 初始化文件监听
const fileWatcher = new FileWatcher(
  electronManager,
  path.join(process.cwd(), 'main'),
  [
    /(^|[/\\])\../,
    '**/node_modules/**',
    '**/*fn.js'
  ]
);
// 解析命令行参数
const args = process.argv.slice(2);
const shouldLaunchElectron = args.includes('--electron');
const shouldOpen = args.includes('--open');
console.log(`启动参数: ${args.join(' ')}`);
console.log(`是否启动 Electron: ${shouldLaunchElectron}`);
console.log(`是否自动打开浏览器: ${shouldOpen}`);

let electronStarted = false;
let electronProcess = null;
let viteProcess = null;

// 清理进程的函数
async function cleanup() {
  console.log('开始清理进程...');
  // 关闭文件监听器
  if (fileWatcher) {
    await fileWatcher.close();
  }
  await electronManager.stop(); // 使用管理器停止
  // 如果 Electron 进程存在，杀掉它
  if (electronProcess) {
    try {
      process.kill(electronProcess.pid);
      console.log('✅ Electron 进程已清理');
    } catch (err) {
      console.log(`清理 Electron 进程失败: ${err.message}`);
    }
  }

  // 查找并杀死所有相关的 node 进程
  try {
    // Windows 下使用 taskkill 命令
    exec('taskkill /F /IM node.exe', (error, stdout, stderr) => {
      if (error) {
        console.log(`清理 node 进程失败: ${error.message}`);
        return;
      }
      console.log('✅ node 进程已清理');
    });
  } catch (err) {
    console.log(`执行清理命令失败: ${err.message}`);
  }
  
  // 尝试删除 dev-server.json
  const serverInfoPath = path.resolve(process.cwd(), 'main/dev-server.json');
  if (fs.existsSync(serverInfoPath)) {
    try {
      fs.unlinkSync(serverInfoPath);
      console.log('✅ 已删除 dev-server.json');
    } catch (err) {
      console.log(`删除 dev-server.json 失败: ${err.message}`);
    }
  }

  // 确保所有进程都有时间被清理
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// 注册进程退出事件
process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});
process.on('exit', cleanup);

// 启动 Vite 服务
const viteArgs = ['vite','--config', 'vite.electron.serve.config.js'];
if (shouldOpen) {
  viteArgs.push('--open');
}
console.log('启动 Vite 服务22...',viteArgs,path.join(process.cwd(), 'windows'));
viteProcess = spawn('npx', viteArgs, {
  cwd: path.join(process.cwd(), 'windows'),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

// 监听 Vite 服务的输出
viteProcess.stdout.on('data', (data) => {
  console.log("data -- >")
  const output = iconv.decode(data, 'utf-8');
  process.stdout.write(output);
  
  // 检查 dev-server.json 是否存在
  const serverInfoPath = path.resolve(process.cwd(), 'main/dev-server.json');
  if (!electronStarted && shouldLaunchElectron && fs.existsSync(serverInfoPath)) {
    electronStarted = true;
    console.log('✅ Vite 服务已启动，正在启动 Electron...');
    electronManager.start(); // 使用管理器启动
    fileWatcher.initialize();
  }
});

// 监听 Vite 服务的错误
viteProcess.stderr.on('data', (data) => {
  console.log("data err -- >",data.toString())
  const output = iconv.decode(data, 'utf-8');
  process.stdout.write(output);
});

// 监听 Vite 服务退出
viteProcess.on('exit', async (code) => {
  console.log(`Vite 服务已退出，退出码: ${code}`);
  await cleanup();
  process.exit(code);
});