function isDevelopmentMode() {
    // 检查命令行参数是否有 --dev 标志
    const isDev = process.argv.includes('--dev');
    
    // 检查环境变量
    const nodeEnv = process.env.NODE_ENV;
    const isDevEnv = nodeEnv === 'development' || nodeEnv === 'dev';
    
    return isDev || isDevEnv;
  }
  function getDevServerUrl() {
    try {
      const serverInfoPath = path.join(__dirname, 'dev-server.json');
      if (fs.existsSync(serverInfoPath)) {
        const serverInfo = JSON.parse(fs.readFileSync(serverInfoPath, 'utf-8'));
        let url = serverInfo.url;
  
        // 处理可能的 IPv6 地址
        if (url.includes('://::') || url.includes('://::1') || url.includes('://[::') || url.includes('://[::1')) {
          // 替换为 localhost
          url = url.replace(/:\/{2}(\[)?::(1)?(\])?/, '://localhost');
        }
  
        console.log(`📡 获取到开发服务器地址: ${url}`);
        return url;
      }
    } catch (err) {
      console.error('读取开发服务器信息失败3:', err);
    }
    return null;
  }

  module.exports = {
    isDevelopmentMode,
    getDevServerUrl
};