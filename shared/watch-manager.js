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

module.exports = {
  setWatchingStatus,
  isWatchingActive,
  cleanupWatchStatus
}; 