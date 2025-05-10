<template>
    <div class="home">
        <!-- 新增遮罩层 -->
        <div v-if="showModalOverlay" class="modal-overlay"></div>
        <h1>欢迎使用 Electron 应用222</h1>
        <p>这是一个基础的 Electron 应用程序。</p>
        <div id="result">{{ result }}</div>
        <div id="statusResult">{{ statusResult }}</div>
        <div id="status">{{ status }}</div>
        <button @click="openHelp">打开帮助中心</button>
        <button @click="getOpenWindow">已打开的窗口</button>
        <button @click="getWindowInfo">winId：1 的信息</button>
        <button @click="getAttr">访问属性</button>
        <button @click="openModalHelp">打开模态帮助窗口</button>
    </div>
</template>

<script>

export default {
    name: 'Home',
    data() {
        return {
            result: '',
            status: '',
            statusResult: '',
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
        this.openModalHelp();
    },
    methods: {
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
        async getAttr() {
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
                this.status = `系统状态2: ${JSON.stringify(monitor)}`;
                // 每500ms发送一次系统状态
                setInterval( async () => {
                    const monitor = await this.startMonitoring();
                    this.status = `系统状态2: ${JSON.stringify(monitor)}`;
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
.home {
    padding: 20px;
    text-align: center;
}

button {
    display: block;
    margin: 20px auto;
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