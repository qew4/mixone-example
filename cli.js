#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// 获取工作目录
const cwd = process.cwd();
// 获取命令行参数
const [command, ...args] = process.argv.slice(2);

// 支持的命令列表
const VALID_COMMANDS = ['create', 'compile', 'dev', 'serve', 'package', 'build'];

// 检查命令是否有效
if (!command || !VALID_COMMANDS.includes(command)) {
  console.log('请使用以下命令：');
  console.log('  mixone create    构建项目');
  console.log('  mixone compile  编译项目');
  console.log('  mixone dev      开发模式');
  console.log('  mixone serve    启动服务');
  console.log('  mixone package  打包应用');
  console.log('  mixone build    构建项目');
  process.exit(1);
}

// 构建命令文件路径
const commandFile = path.join(__dirname, `${command}.js`);

// 定义一个函数来使用 spawn 执行 serve.js
function runServeScript(cwd, args) {
  console.log(cwd);
  const serveProcess = spawn('node', ['serve.js', '--electron'], { stdio: 'inherit', cwd });

  serveProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`serve.js 进程退出，退出码: ${code}`);
      process.exit(code);
    }
  });
}

// 执行对应的命令
try {
  if (command === 'dev') {
    // 使用 spawn 调用 node 执行 compile.js
    const compileProcess = spawn('node', [path.join(__dirname, 'compile.js'), ...args], { stdio: 'inherit' });

    compileProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`compile.js 进程退出，退出码: ${code}`);
        process.exit(code);
      } else {
        console.log('------------------------');
        // 调用独立的函数来执行 serve.js
        runServeScript(cwd, args);
      }
    });
  } if(command == 'create'){
    // 获取项目名称（第一个参数）
    const projectName = args[0] + path.sep + 'out' || 'electron-app' + path.sep + 'out';
    // 构建项目路径
    const projectPath = path.join(cwd, projectName);
    // 使用 spawn 调用 node 执行 compile.js
    const compileProcess = spawn('node', [path.join(__dirname, 'project.js'), ...args], { stdio: 'inherit' });

    compileProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`project.js 进程退出，退出码: ${code}`);
        process.exit(code);
      } else {
        console.log('------------------------');
      }
    });
  } else {
    // 检查命令文件是否存在
    if (!fs.existsSync(commandFile)) {
      console.error(`错误: 命令 "${command}" 对应的文件不存在`);
      process.exit(1);
    }
    require(commandFile);
  }
} catch (err) {
  console.error(`执行命令 "${command}" 时出错:`, err);
  process.exit(1);
}