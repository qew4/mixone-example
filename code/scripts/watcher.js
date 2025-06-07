const chokidar = require('chokidar');
const path = require('path');
const { spawnSync } = require('child_process');
const watchManager = require('./watch-manager');
const fs = require('fs');
const { console } = require('inspector');
const { isPageComponent, getWindowDirectory,generateWindowRouterScript } = watchManager;
/**
 * 检查是否已经编译过
 * @returns {boolean} 是否已经编译过
 */
/**
 * 创建文件监听器的配置
 * @returns {Object} 监听器配置对象
 */
function createWatchConfig() {
  return {
    ignored: [
      '**/node_modules/**',
      '**/out/**',
      '**/scripts/**',
      '**/vite.config.js',
      '**/package.json',
      '**/package-lock.json',
      '**/.git/**'
    ],
    persistent: true,
    ignoreInitial: true
  };
}

/**
 * 设置编译模式的文件监听
 * @param {Function} processFile 处理文件的函数
 * @param {Function} checkWindowDirPreload 检查窗口preload的函数
 */
function setupCompileWatcher(processFile, checkWindowDirPreload) {
  console.log('👀 开始监听文件变化(编译模式)...');
  
  const rootDir = ____root_dir____;
  const outDir = path.join(rootDir, 'out');
  const compileDir = ____compile_dir____;

  // 添加处理 preload.js 的辅助函数
  function handlePreloadFile(srcPath, action) {
    // 检查是否是窗口目录下的 preload.js
    const relativePath = path.relative(rootDir, srcPath);
    if (relativePath.includes('windows/') && path.basename(srcPath) === 'preload.js') {
      const windowDir = path.dirname(relativePath).split('windows/')[1];
      const outWindowPath = path.join(outDir, 'windows', windowDir);

      if (action === 'delete') {
        // 删除时重新生成默认的 preload.js
        console.log(`🔄 重新生成默认 preload.js: ${relativePath}`);
        checkWindowDirPreload(srcPath);
        return true;
      } else if (action === 'change' || action === 'add') {
        // 编辑或新增时重新编译
        console.log(`🔄 重新编译 preload.js: ${relativePath}`);
        processFile(srcPath);
        return true;
      }
    }
    return false;
  }
  
  watchManager.setWatchingStatus(true);
  
  const watcher = chokidar.watch([
    path.join(rootDir, '**/*.js'),
    path.join(rootDir, '**/*.vue'),
    path.join(rootDir, '**/*.html'),
    path.join(rootDir, '**/*.css')
  ], createWatchConfig());
  
  watcher.on('change', (filePath) => {
    console.log(`📝 文件变化: ${filePath}`);
    if (!handlePreloadFile(filePath, 'change')) {
      processFile(filePath);
      checkWindowDirPreload(filePath);
    }
  });
  
  watcher.on('add', (filePath) => {
    console.log(`➕ 新增文件: ${filePath}`);
    if (!handlePreloadFile(filePath, 'add')) {
      processFile(filePath);
      checkWindowDirPreload(filePath);
    }
  });

  // 处理文件删除
  watcher.on('unlink', (srcPath) => {
    try {
      console.log(`🗑️ 检测到文件删除: ${srcPath}`);
      if (!handlePreloadFile(srcPath, 'delete')) {
        const relativePath = path.relative(rootDir, srcPath);
        const outPath = path.join(outDir, relativePath);

        if (fs.existsSync(outPath)) {
          fs.unlinkSync(outPath);
          console.log(`✅ 已删除对应的输出文件: ${relativePath}`);
        }

        const outDirPath = path.dirname(outPath);
        if (fs.existsSync(outDirPath) && fs.readdirSync(outDirPath).length === 0) {
          fs.rmdirSync(outDirPath);
          console.log(`✅ 已删除空的输出目录: ${path.relative(rootDir, outDirPath)}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ 删除输出文件失败: ${error.message}`);
    }
  });

  // 处理目录删除
  watcher.on('unlinkDir', (srcPath) => {
    try {
      console.log(`🗑️ 检测到目录删除: ${srcPath}`);
      
      const relativePath = path.relative(rootDir, srcPath);
      const outPath = path.join(outDir, relativePath);

      if (fs.existsSync(outPath)) {
        fs.rmSync(outPath, { recursive: true });
        console.log(`✅ 已删除对应的输出目录: ${relativePath}`);
      }
    } catch (error) {
      console.error(`❌ 删除输出目录失败: ${error.message}`);
    }
  });
  
  // 处理退出
  process.on('SIGINT', () => {
    console.log('👋 关闭文件监听');
    watcher.close();
    watchManager.setWatchingStatus(false);
    process.exit(0);
  });
  
  return watcher;
}

/**
 * 设置开发服务器的文件监听
 * @param {Object} server Vite服务器实例
 */
function setupServerWatcher(server) {
  console.log('👀 开始监听文件变化(服务器模式)...');
  const rootDir = ____root_dir____;
  const outDir = path.join(rootDir, 'out');
  const compileDir = ____compile_dir____;

  // 添加处理 preload.js 的辅助函数
  function handlePreloadFile(srcPath, action) {
    const relativePath = path.relative(rootDir, srcPath);
    if (relativePath.includes('windows'+path.sep) && path.basename(srcPath) === 'preload.js') {
      console.log(`🔄 处理窗口 preload.js: ${relativePath}`);
      if (action === 'delete') {
        // 删除时重新生成默认的 preload.js
        spawnSync('node', ['compile.js', '--file', srcPath, '--generate-preload', '--root-dir', rootDir, '--out-dir',outDir], {
          cwd:compileDir,
          stdio: 'inherit',
          shell: true
        });
        return true;
      } else if (action === 'change' || action === 'add') {
        // 编辑或新增时重新编译
        spawnSync('node', ['compile.js', '--file', srcPath,'--root-dir',rootDir, '--out-dir',outDir], {
          cwd:compileDir,
          stdio: 'inherit',
          shell: true
        });
        return true;
      }
    }
    return false;
  }

  const watcher = chokidar.watch([
    path.resolve(rootDir, '**/*.js'),
    path.resolve(rootDir, '**/*.vue'),
    path.resolve(rootDir, '**/*.html'),
    path.resolve(rootDir, '**/*.css')
  ], createWatchConfig());

  const handleFileChange = (filePath) => {
    spawnSync('node', ['compile.js', '--file', filePath,'--root-dir',rootDir, '--out-dir',outDir], {
      cwd:compileDir,
      stdio: 'inherit',
      shell: true
    });
  };

  watcher.on('change', (filePath) => {
    console.log(`📝 文件变化: ${filePath}`);
    if (!handlePreloadFile(filePath, 'change')) {
      handleFileChange(filePath);
    }
  });
  
  watcher.on('add', (filePath) => {
    console.log(`➕ 新增文件: ${filePath}`);
    if (!handlePreloadFile(filePath, 'add')) {
      handleFileChange(filePath);
    }
    if(filePath.endsWith('.vue') && isPageComponent(filePath)){
      let windowDir = getWindowDirectory(filePath);
      let windowsDirSrc = path.resolve(rootDir,'windows');
      const relativePath = path.relative(windowsDirSrc, windowDir);
      const outWindowPath = path.join(outDir, 'windows', relativePath);
      const windowFilePath = path.join(windowDir, 'router.js');
      const staticFilePath = path.join(compileDir,'code','static_file','router.js');
      const outWindowFilePath = path.join(outWindowPath, 'router.js');
      if (!fs.existsSync(windowFilePath) && fs.existsSync(staticFilePath)) {//源目录不存在router.js，生成router.js（有则取源目录的）
        const routerFileContent = generateWindowRouterScript(windowDir,staticFilePath);
        fs.writeFileSync(outWindowFilePath, routerFileContent);
      }
    }
  });

  watcher.on('unlink', (srcPath) => {
    try {
      console.log(`🗑️ 检测到文件删除: ${srcPath}`);
      if (!handlePreloadFile(srcPath, 'delete')) {
        const relativePath = path.relative(rootDir, srcPath);
        const outPath = path.join(outDir, relativePath);

        if (fs.existsSync(outPath)) {
          fs.unlinkSync(outPath);
          console.log(`✅ 已删除对应的输出文件: ${relativePath}`);
        }

        const outDirPath = path.dirname(outPath);
        if (fs.existsSync(outDirPath) && fs.readdirSync(outDirPath).length === 0) {
          fs.rmdirSync(outDirPath);
          console.log(`✅ 已删除空的输出目录: ${path.relative(rootDir, outDirPath)}`);
        }
      }
      if(srcPath.endsWith('.vue') && isPageComponent(srcPath)){
        let windowDir = getWindowDirectory(srcPath);
        let windowsDirSrc = path.resolve(rootDir,'windows');
        const relativePath = path.relative(windowsDirSrc, windowDir);
        const outWindowPath = path.join(outDir, 'windows', relativePath);
        const windowFilePath = path.join(windowDir, 'router.js');
        const staticFilePath = path.join(compileDir,'code','static_file','router.js');
        const outWindowFilePath = path.join(outWindowPath, 'router.js');
        if (!fs.existsSync(windowFilePath) && fs.existsSync(staticFilePath)) {//源目录不存在router.js，生成router.js（有则取源目录的）
          const routerFileContent = generateWindowRouterScript(windowDir,staticFilePath);
          fs.writeFileSync(outWindowFilePath, routerFileContent);
        }
      }
    } catch (error) {
      console.error(`❌ 删除输出文件失败: ${error.message}`);
    }
  });

  // 处理目录删除
  watcher.on('unlinkDir', (srcPath) => {
    try {
      console.log(`🗑️ 检测到目录删除: ${srcPath}`);
      
      // 计算在输出目录中的对应路径
      const relativePath = path.relative(rootDir, srcPath);
      const outPath = path.join(outDir, relativePath);

      // 如果输出目录存在，则删除它
      if (fs.existsSync(outPath)) {
        fs.rmSync(outPath, { recursive: true });
        console.log(`✅ 已删除对应的输出目录: ${relativePath}`);
      }
    } catch (error) {
      console.error(`❌ 删除输出目录失败: ${error.message}`);
    }
  });
  
  server.httpServer.on('close', () => {
    console.log('👋 关闭文件监听');
    watcher.close();
  });
  
  return watcher;
}

module.exports = {
  setupCompileWatcher,
  setupServerWatcher
};