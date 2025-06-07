/**
 * 文件监听状态管理模块
 * 用于在不同进程间共享监听状态，避免重复监听
 */

const fs = require('fs');
const path = require('path');

// 监听状态文件路径
const statePath = path.join(__dirname, '..', '.watch-status');

/**
 * 设置监听状态
 * @param {boolean} isWatching - 是否正在监听
 */
function setWatchingStatus(isWatching) {
  try {
    if (isWatching) {
      // 创建状态文件，表示已开启监听
      fs.writeFileSync(statePath, new Date().toISOString());
      console.log('📝 监听状态已设置：已开启');
    } else {
      // 移除状态文件，表示已关闭监听
      if (fs.existsSync(statePath)) {
        fs.unlinkSync(statePath);
        console.log('📝 监听状态已设置：已关闭');
      }
    }
  } catch (err) {
    console.error('❌ 设置监听状态失败:', err);
  }
}

/**
 * 检查是否已开启监听
 * @returns {boolean} - 是否已开启监听
 */
function isWatchingActive() {
  try {
    return fs.existsSync(statePath);
  } catch (err) {
    console.error('❌ 检查监听状态失败:', err);
    return false;
  }
}

/**
 * 清理监听状态
 * 在进程退出时调用，确保状态文件被正确移除
 */
function cleanupWatchStatus() {
  try {
    if (fs.existsSync(statePath)) {
      fs.unlinkSync(statePath);
      console.log('🧹 监听状态已清理');
    }
  } catch (err) {
    console.error('❌ 清理监听状态失败:', err);
  }
}

// 确保进程退出时清理状态
process.on('exit', cleanupWatchStatus);
process.on('SIGINT', () => {
  cleanupWatchStatus();
  process.exit(0);
});
/**
 * 匹配Vue文件所在的窗口目录。
 * 窗口目录以“-window”结尾，且其父目录为“windows”。
 *
 * @param {string} filePath Vue文件的完整路径。
 * @returns {string|null} 匹配到的窗口目录的完整路径，如果未找到则返回null。
 */
const getWindowDirectory = (filePath) => {
  // 确保路径是规范化的
  const normalizedPath = path.normalize(filePath);

  // 获取文件所在的目录
  let currentDir = path.dirname(normalizedPath);

  // 向上遍历目录
  while (true) {
      const dirName = path.basename(currentDir);
      const parentDir = path.dirname(currentDir);

      // 1. 检查当前目录是否以 '-window' 结尾
      if (dirName.endsWith('-window')) {
          return currentDir; 
      } else if(dirName === 'windows'){
        return currentDir;
      }
      // 如果已经到达根目录，但还没有找到，则停止遍历
      if (currentDir === parentDir) {
          break;
      }
      // 否则，继续向上移动
      currentDir = parentDir;
  }

  return null; // 未找到符合条件的窗口目录
}
// 递归查找页面文件
const findPageFiles = (dir) => {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
          // 排除以-window结尾的目录
          if (!file.endsWith('-window')) {
              results.push(...findPageFiles(fullPath));
          }
      } else {
          // 检查是否为页面文件
          if (file.endsWith('page.vue') || file.endsWith('page.jsx')) {
              results.push(fullPath);
          }
      }
  }
  
  return results;
}
const isPageComponent = (file) => {
  const lowerFile = file.toLowerCase();
  let suffixName = file.substring(lowerFile.length - 8)
  return suffixName === 'page.vue' || suffixName === 'page.jsx';
}

const generateWindowRouterScript = (currentDir,staticFilePath) => {
  let content = fs.readFileSync(staticFilePath, 'utf-8');
  let routers = [
      `{
          path: '/',
          name: 'Index',
          component: () => import('./Index.vue')
      }`
  ]
  // 读取所有页面文件
  const files = findPageFiles(currentDir).map(fullPath => {
    return path.relative(currentDir, fullPath).replace(/\\/g, '/');  
  });
  const pageFiles = files.filter(file => isPageComponent(file));
  // 生成路由配置
  for (const pageFile of pageFiles) {
    routers.push(`{
      path: '/${pageFile.replace('.vue','').replace('.jsx','')}',
      name: '${pageFile.replace('.vue','').replace('.jsx','')}',
      component: () => import('./${pageFile}')
    }`);
  }
  return content.replace('____routes____','[' + routers.join(`,
    `) + ']');
}
module.exports = {
  setWatchingStatus,
  isWatchingActive,
  cleanupWatchStatus,
  generateWindowRouterScript,
  getWindowDirectory,
  isPageComponent
}; 