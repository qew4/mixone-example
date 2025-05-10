import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';
import vue from '@vitejs/plugin-vue2';
import { setupServerWatcher } from '../watcher';
// 引入监听状态管理模块
const watchManager = (() => {
  try {
    return require('./watch-manager');
  } catch (err) {
    console.warn('⚠️ 未找到监听状态管理模块，将始终启用监听');
    return { isWatchingActive: () => false };
  }
})();

// 检查是否已经编译过
function hasBeenCompiled() {
  const outDir = resolve(process.cwd(),'..');
  return fs.existsSync(outDir) && fs.existsSync(path.join(outDir, 'windows'));
}

// 主进程函数编译插件
function mainProcessCompiler() {
  return {
    name: 'main-process-compiler',
    
    // 开发服务器启动前触发
    configureServer(server) {
      console.log('🚀 开发服务器启动中...');
      
      // 检查是否需要编译
      if (!hasBeenCompiled()) {
        console.log('⚠️ 未检测到编译输出，请先运行 npm run dev:compile');
        process.exit(1);
      } else {
        console.log('✅ 检测到已编译输出，继续启动服务');
      }
      
      // 检查是否已有活跃的文件监听
      if (watchManager.isWatchingActive()) {
        console.log('🔄 检测到已有监听进程活跃，Vite 不再监听文件变更');
      } else {
        console.log('👀 未检测到活跃的监听进程，设置 Vite 监听');
        // 设置文件监听
        setupServerWatcher(server);
      }
      
      // 服务器启动后保存地址信息
      server.httpServer.once('listening', () => {
        const address = server.httpServer.address();
        let serverUrl = '';
        
        if (typeof address === 'string') {
          serverUrl = address;
        } else {
          // 修复 IPv6 地址处理
          let host = 'localhost';  // 默认使用 localhost
          // 只有当地址不是回环地址时才使用实际地址
          if (address.address !== '::' && address.address !== '::1' && address.address !== '0.0.0.0' && address.address !== '127.0.0.1') {
            host = address.address;
          }
          const port = address.port;
          serverUrl = `http://${host}:${port}`;
        }
        
        console.log(`🌐 开发服务器已启动: ${serverUrl}`);
        
        // 确保 out/main 目录存在
        const mainDir = resolve(process.cwd(),'..', 'main');
        if (!fs.existsSync(mainDir)) {
          fs.mkdirSync(mainDir, { recursive: true });
        }
        
        // 将服务器 URL 保存到文件
        const serverInfoPath = resolve(mainDir, 'dev-server.json');
        fs.writeFileSync(
          serverInfoPath, 
          JSON.stringify({ 
            url: serverUrl, 
            timestamp: new Date().toISOString(),
            isDev: true
          }, null, 2),
          'utf-8'
        );
        
        console.log(`📝 已保存服务器信息到: ${serverInfoPath}`);
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
  plugins: [
    vue({
      jsx: true, // 启用 JSX 支持
      // Vue 2.7 新特性配置
      reactivityTransform: true, // 启用响应式转换 (ref sugar)
      template: {
        compilerOptions: {
          // 兼容 Vue 2.x 语法
          compatConfig: {
            MODE: 2
          }
        }
      }
    }),
    {
      name: 'adjust-asset-paths',
      transformIndexHtml(html, ctx) {
        // 获取当前 HTML 文件相对于 windows 目录的深度
        const relativePath = path.relative(__dirname, ctx.filename);
        // 额外增加两个层级
        const depth = relativePath.split(path.sep).length + 1;
        
        // 根据深度生成相对路径前缀
        const prefix = '../'.repeat(depth);
        // 替换资源引用路径
        return html.replace(/(src|href)="\/assets\//g, `$1="${prefix}assets/`)
                  .replace(/(src|href)="\/js\//g, `$1="${prefix}js/`);
      }
    },
    // 只在开发模式下使用主进程编译插件
    ...(isProd ? [] : [mainProcessCompiler()]),
  ],
  build: {
    base: './',
    emptyOutDir: false,
    // 针对 Electron 环境调整构建配置
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'), // 使用输出目录的文件
        help: resolve(__dirname, 'help-window/index.html'), // 使用输出目录的文件
        settings: resolve(__dirname, 'settings-window/index.html'), // 使用输出目录的文件
      },
      output: {
				dir:'./dist'
			},
      // 排除 electron 相关模块和HTML文件中引用的脚本
      external: [
        'electron', 
        'path', 
        'fs', 
        'os',
        // 排除HTML文件中引用的脚本
        /^\.\/main\.js$/,
        /^\.\.\/utils\/api\/github\.js$/,
        // Vue 和 Vue Router 不需要打包，由应用自己提供
        // 'vue',
        // 'vue-router'
      ],
    },
    // 减少打包大小，因为 Electron 已经包含 Node.js 环境
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    // 使用旧版浏览器兼容性配置
    target: 'es2015', 
    cssTarget: 'chrome118', // 适配 Electron 28
    minify: isProd ? 'terser' : false, // 开发模式不压缩，生产模式使用 terser
    terserOptions: isProd ? {
      compress: {
        drop_console: false, // 在生产环境保留控制台日志，方便调试
        drop_debugger: true
      }
    } : undefined,
  },
  // 开发服务器配置 - 基于 out 目录
  server: {
    port: 5174,
    strictPort: true,
    hmr: true,
    origin: 'http://localhost:5174',
    watch: {
      // 启用 Vite 的文件监听功能，但我们自定义处理监听事件
      usePolling: false,
      useFsEvents: true
    }
  },
  // 解析配置
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@windows': resolve(__dirname, './windows'),
      '@components': resolve(__dirname, './components'),
      '@utils': resolve(__dirname, './utils'),
    },
    extensions: ['.js', '.vue', '.json'],
  },
  optimizeDeps: {
    // 在生产环境中禁用依赖优化，避免冲突
    disabled: isProd
  },
  configureServer(server) {
    setupServerWatcher(server);
  }
}}); 