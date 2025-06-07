<template>
    <div class="home">
        <h1>欢迎使用mixone开发桌面应用</h1>
        <p>这个窗口页面包含了一些新语法使用例子。</p>
        <ul style="width: 100%;text-align: left;">
            <li>
                <h2>
                    窗口管理
                </h2>
                <div class="btn-item">
                    <button @click="openHelp">打开帮助中心</button> 打开同级窗口
                </div>
                <div class="btn-item">
                    <button @click="getWindowInfo">窗口信息</button> 获取窗口信息，根据窗口ID。
                </div>
                <div class="btn-item">
                    <button @click="getOpenWindow">已打开的窗口</button> 如果同事打开多个同级以及子窗口，这个方法可以获取所有已打开的窗口。
                </div>
                <div class="btn-item">
                    <button @click="openModalHelp">打开模态帮助窗口</button> 打开窗口是当前窗口的子窗口，该例子还实现了父窗口遮罩层。
                </div>
                <div class="btn-item">
                    <button @click="OpenGetWindowAttr">打开新窗口并立即最大化</button>
                </div>
				<div class="btn-item">
				    <button @click="gotoRoutePage">子路由页面</button>
				</div>
            </li>
            <li>
                <h2>
                    新语法
                </h2>
                <div class="btn-item">
                    <button @click="callGitHubAPI">获取 GitHub 数据</button>使用electron主进程的API之fetch获取接口数据的例子。在一个独立的导出utils函数中实现这样的功能，并在函数前加上注释“// @mainProcess”实现。
                    <div class="result" v-if="result">{{ result }}</div>
                </div>
                <div class="btn-item">
                    <button @click="getDocumentsPath">获取系统文档目录</button>使用以Main开始的语法:Main.app.getPath('documents'); 获取系统documents目录,写在method方法内。
                    <div class="result" v-if="getDocumentsPathResult">{{ getDocumentsPathResult }}</div>
                </div>
                <div class="btn-item">
                    <button @click="getDocumentsPath2">获取系统文档目录 方式二</button> 使用以Main开始的语法:Main.app.getPath('documents'); 获取系统documents目录,写在utils中导入使用。
                </div>
                <div class="btn-item">
                    <button @click="openFileDialog">打开对话框选择文件</button> 以Main开头语法“Main.dialog.showOpenDialog” 打开对话框选择文件
                </div>
                <div class="btn-item">
                    <button @click="NodeJSReadFile">NodeJS读取文件</button>
                </div>
                <div class="btn-item">
                    <button @click="PJSReadFile">访问插件</button>以PJS开头语法
                </div>
            </li>
        </ul>
        
       
        <div id="statusResult">窗口打开后立即获取{{ statusResult }}</div>
        <div id="status">{{ status }}</div>
        <!-- 新增遮罩层 -->
        <div v-if="showModalOverlay" class="modal-overlay"></div>
    </div>
</template>

<script>
import { fetchGitHub_viaProxy } from '../../utils/api/github.js';
import {getDocumentsPath2} from '../utils/api/utils.js';
export default {
    name: 'windowIndex',
    data() {
        return {
            result: '',
            status: '',
            statusResult: '',
            getDocumentsPathResult: '',
            showModalOverlay: false,
        }
    },
    mounted() {
        let promise = this.testMainProcess('Hello from renderer3333!','arg222');
        promise.then((statusResult) => {
            this.statusResult = `系统状态: ${statusResult}`;
        });
        this.startMonitoringSystem();
        // 在渲染进程中保存窗口ID
        console.log('Window created with ID:', getWinId());
        // this.openModalHelp();
    },
    methods: {
        async getDocumentsPath() {
            try {
                let path = await Main.app.getPath('documents');
                console.log('Selected getDocumentsPath:', path);
                this.getDocumentsPathResult = path;
            } catch (error) {
                console.error('getDocumentsPath失败:', error);
            }
        },
        async getDocumentsPath2() {
            try {
                let path = await getDocumentsPath2();
                console.log('Selected getDocumentsPath2:', path);
            } catch (error) {
                console.error('getDocumentsPath2失败:', error);
            }
        },
        async showInfoMessage() {
            try {
                const result = await Main.dialog.showMessageBox({
                type: 'info', // 'none', 'info', 'error', 'question', 'warning'
                title: '提示信息',
                message: '这是一个由主进程显示的信息对话框。',
                detail: '更多细节可以放在这里。',
                buttons: ['好的', '取消操作'] // 按钮数组
                });

                console.log('showMessageBox 结果:', result);
                // result.response 会是按钮数组的索引，例如 0 代表 '好的'
                if (result.response === 0) {
                console.log('用户点击了 "好的"');
                } else {
                console.log('用户点击了其他按钮或关闭了对话框');
                }
            } catch (error) {
                console.error('显示信息消息框失败:', error);
            }
        },
        // 3. 显示打开文件对话框，并获取用户选择的文件路径
        async openFileDialog() {
            try {
                let documentsPath = await Main.app.getPath('documents');
                const result = await Main.dialog.showOpenDialog({
                    title: '选择一个或多个文件',
                    defaultPath: documentsPath, // 示例：默认打开文档目录
                    buttonLabel: '选择',
                    filters: [
                        { name: '图片文件', extensions: ['jpg', 'png', 'gif'] },
                        { name: '文本文件', extensions: ['txt', 'md'] },
                        { name: '所有文件', extensions: ['*'] }
                    ],
                    properties: ['openFile', 'multiSelections', 'showHiddenFiles'] // 允许选择文件、允许多选、显示隐藏文件
                });

                console.log('showOpenDialog 结果:', result);
                if (!result.canceled && result.filePaths.length > 0) {
                console.log('用户选择的文件路径:', result.filePaths);
                // 可以用这些路径进行后续操作，例如通过 Main.fs.readFile 读取文件
                } else {
                console.log('用户取消了文件选择');
                }
            } catch (error) {
                console.error('打开文件对话框失败:', error);
            }
        },
        // 2. 显示一个错误消息框
        async showErrorMessage() {
            try {
                // showErrorBox 通常接收 title 和 content 两个字符串参数
                // (假设主进程中 ALLOWED_MODULES.dialog.showErrorBox 如此定义)
                await Main.dialog.showErrorBox('发生错误', '操作未能成功完成，请检查您的网络连接。');
                console.log('错误消息框已显示');
            } catch (error) {
                console.error('显示错误消息框失败:', error);
            }
        },
        // 1. 使用 NodeJS.fs.readFile 读取文件内容
        async NodeJSReadFile() {
            try {
                // 注意：在这个纯粹的 NodeJS.* 示例中，我们没有使用 Main.dialog.showOpenDialog。
                // 文件路径需要预先知道，或者通过其他方式获取。
                // 为了演示，我们假设要读取一个用户目录下的 'my_document.txt' 文件。
                // 我们首先需要获取用户主目录的路径，可以使用 NodeJS.os.homedir()。
                const homeDirectory = await NodeJS.os.homedir(); // 假设 NodeJS.os.homedir 已暴露
                const filePathToRead = await NodeJS.path.join(homeDirectory, 'my_test_document.txt'); // 假设 NodeJS.path.join 已暴露
                console.log(`尝试从以下路径读取文件: ${filePathToRead}`);
                // 为了让这个例子能运行，我们先尝试写入一个测试文件。
                // （如果文件已存在，这会覆盖它。在实际应用中请谨慎处理。）
                try {
                    await NodeJS.fs.writeFileSync(filePathToRead, 'Hello from NodeJS.fs.writeFile!This is a test file.', 'utf-8');
                    console.log(`测试文件已写入到: ${filePathToRead}`);
                } catch (writeError) {
                    console.error(`写入测试文件失败 (这可能是预期之中的，如果权限不足等): ${writeError.message}`);
                    // 如果写入失败，读取操作很可能也会失败，除非文件已通过其他方式存在。
                }

                // 现在尝试读取文件
                const fileContent = await NodeJS.fs.readFileSync(filePathToRead, 'utf-8');
                console.log(`文件 "${filePathToRead}" 的内容:`);
                console.log(fileContent);
                alert(`文件内容:\n${fileContent}`);
            } catch (error) {
                console.error(`NodeJS.fs.readFile 操作失败: ${error.message}`);
                let homedir = await NodeJS.os.homedir();
                alert(`读取文件失败: ${error.message}\n请确保文件 "${await NodeJS.path.join(homedir, 'my_test_document.txt')}" 存在并且可读，或者写入操作成功。`);
            }
        },
        async PJSReadFile() {
            console.log(await PJS.WENJIAN.read());
        },
		async gotoRoutePage(){
			this.$router.push('/Hello.page')
		},
        async openHelp() {
            // 这里可以添加打开偏好设置窗口的逻辑
            let winInfo = await window.windowManager.openWindow('/windows/help-window', {
                width: 800,
                height: 600
            });
            console.log('Window created with ID(winInfo):', winInfo);
            winInfo.webContents.on(
                'did-stop-loading',
                (res) => {
                    console.log('Window did-stop-loading ========================= loaded');
                    console.log(res)
                }
            );
            winInfo.on('close',() =>{
                console.log('Window close');
            })
            // let winInfo = await window.windowManager.openWindow('/windows/help-window', {
            //     width: 800,
            //     height: 600 
            // })
            // console.log('Window created with ID(winInfo):', winInfo);
        },
        async getOpenWindow() {
            let windows = await window.windowManager.getAllWindow()
            console.log('Window created with ID(windows):', windows);
        },
        async getWindowInfo() {
            let winInfo = await window.windowManager.getWindowInfo(1)
            console.log('Window created with ID(winInfo):', winInfo);
        },
        async OpenGetWindowAttr() {
           // 在渲染进程中
           let win = await window.windowManager.openWindow('/windows/help-window', {
                width: 800,
                height: 600
            });
            setTimeout( async () => {
                console.log(win)
                // 访问属性
                const title = await win.title;  // 触发属性访问
                console.log(title)
                // 调用方法
                await win.maximize();  // 触发方法调用
                console.log(await win.getContentSize());
            },20)
            // await win.setSize(800, 600);  // 触发方法调用并传递参数 
        },
        async callGitHubAPI() {
            try {
                this.result = '加载中...';
                const data = await fetchGitHub_viaProxy();
                this.result = JSON.stringify(data, null, 2);
            } catch (error) {
                this.result = '错误: ' + error.message;
            }
        },

        // @mainProcess
        async testMainProcess(redererTxt,arg2) {
            const fs = require('fs');
            const path = require('path');
            const userDataPath = app.getPath('userData');
            const testFile = path.join(userDataPath, 'test.txt');
            await fs.promises.writeFile(testFile, redererTxt+':::Hello from main process!');
            return arg2+':File written successfully22!'+redererTxt;
        },

        // 带回调的主进程函数示例
        // @mainProcess
        async startMonitoring() {
            const { powerMonitor } = require('electron');
            const systemInfo = {
                onBatteryPower: powerMonitor.onBatteryPower,
                time: new Date().toISOString()
            };
            return systemInfo;
        },

        // 调用带回调的主进程函数
        async startMonitoringSystem() {
            try {
                const monitor = await this.startMonitoring();
                this.status = `界面打开立即执行获取系统状态，每2秒获取一次结果: ${JSON.stringify(monitor)}`;
                // 每500ms发送一次系统状态
                setInterval( async () => {
                    const monitor = await this.startMonitoring();
                    this.status = `界面打开立即执行获取系统状态，每2秒获取一次结果: ${JSON.stringify(monitor)}`;
                }, 2000);
            } catch (error) {
                this.status = '监控错误2: ' + error.message;
            }
        },

        // @mainProcess
        async openDialog() {
            const { dialog } = require('electron');
            const result = await dialog.showOpenDialog({
                properties: ['openFile', 'multiSelections']
            });
            return result.filePaths;
        },
        async openModalHelp() {
            try {
                this.showModalOverlay = true; // 打开时显示遮罩层
                const currentWinId = window.getWinId();
                let modalWinInfo = await window.windowManager.openModalWindow(currentWinId, '/windows/help-window', {
                    width: 600,
                    height: 400,
                    minimizable: false,
                    maximizable: false
                });
                console.log('Modal window created:', modalWinInfo);
                modalWinInfo.on('close',() =>{
                    this.showModalOverlay = false; // 出错时隐藏遮罩层
                    console.log('modalWinInfo Window close');
                })
            } catch (error) {
                this.showModalOverlay = false; // 出错时隐藏遮罩层
                console.error('打开模态窗口失败:', error);
            }
        }
    }
}
</script>

<style scoped>
/* For demo */
.ant-carousel >>> .slick-slide {
  text-align: center;
  height: 160px;
  line-height: 160px;
  background: #364d79;
  overflow: hidden;
}

.ant-carousel >>> .slick-slide h3 {
  color: #fff;
}
.home {
    padding: 20px;
    text-align: center;
}
.btn-item{
    margin: 10px;
}
button {
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}
/* 新增遮罩层样式 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9998;
    backdrop-filter: blur(2px);
}
button:hover {
    background-color: #45a049;
}

#result, #status {
    margin-top: 20px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f9f9f9;
    white-space: pre-wrap;
}
</style> 