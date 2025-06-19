## mixone-example简介
**mixone-example是由mixone工具创建的electron桌面项目例子。该案例中列出了去除IPC通信代码的例子demo，列出了windowManger管理窗口类的部分用法demo**

## mixone介绍
在详细介绍本案例之前，我们先让大家了解mixone工具：它是开发electron应用的编译工具，将Nodejs的包和electron主进程API的使用集成到vue或react项目中，在需要使用的代码位置以Main、NodeJS、PJS开头即可访问，通过编译实现开发层面去IPC通信。去除IPC通信的语法后，项目目录结构便可与vue或react项目的目录结构相同，而不再需要区分主进程和渲染进程的冗余的目录层级，这就让我们的工程化目录结构比其他框架的目录结构更清晰、一目了然。
若在开发中碰到任何mixone问题，可以在此仓库提issues。或联系作者QQ：996150938
## 创建mixone应用
### 使用mixone工具创建项目
你可以选择自己的UI库、electron版本、vite版本等。
```
npm install mixone -g
//创建项目
mixone create mixone-demo1
cd mixone-demo1
npm install //安装依赖 或 yarn
npm run dev
```
### clone本项目开始创建项目
集成了一些例子。
```
npm install mixone -g
//创建项目
git clone https://github.com/qew4/mixone-example.git
cd mixone-demo
npm install //安装依赖 或 yarn
npm run dev
```
## mixone的项目结构
- 完整目录结构
```
your-mixone-project/              # 项目根目录
├── assets/                       # 静态资源目录
│   ├── favicon.ico               # 应用图标
├── components/                   # 公共组件目录
│   ├── Button.vue                # 按钮组件
│   └── Dialog.vue                # 对话框组件
├── windows/                      # 根窗口目录
│   ├── Index.vue                 # 窗口入口
│   └── other-window/             # 其他窗口，以“-window”结尾
│       ├── Index.vue             # 窗口入口
│       ├── Sencond.page.vue      # 页面组件，以“page.vue”结尾，自动加入router
│       ├── Sencond.vue           # 普通组件
│   └── setting-window/           # 设置窗口，以“-window”结尾
│       ├── Index.vue             # 窗口入口
│       ├── main.ts               # vue项目入口，非必须存在。
│       ├── App.vue               # vue顶层组件，非必须存在。
│       ├── router.js             # 路由组件，非必须存在。
│       ├── window.json			  # 窗口默认配置，可被openWindow方法重置，非必须存在。
│       ├── preload.js			  # 每一个窗口的预加载文件，可省略。可以自定义暴露自己的方法给窗口
├── main/                         # 主进程代码
│   ├── main.js                   # 主进程入口文件
│   ├── Wenjian.fn.js             # 原生插件,以PJS开头进行访问。
├── utils/                        # 工具函数目录
│   ├── request.js                # 请求工具
│   └── common.js                 # 通用工具函数
├── out/                          # 编译输出目录
└── package.json                  # 项目配置文件			
```
- 工程文件介绍
	- 窗口目录
		窗口目录是指在/windows下的以“-window”结尾的目录（若不以“-window”结尾则为普通文件夹），/windows本身就是根窗口目录。
	- 窗目录的特性：
		* 窗口目录是可以嵌套窗口的。
		* 窗口目录下默认是以Index.vue为访问入口。
		* 窗口目录下分为页面组件和普通组件，页面组件以“page.vue”结尾，创建后会被mixone识别并加入到vue的路由配置中。
		* 窗口目录下可以创建preload.js作为窗口的预加载文件，暴露自己定义的方法等功能。preload.js默认会自动创建、若在窗口目录下创建了preload.js则会自动与项目根目录的preload.js合并(如果根preload.js存在)。
		* 窗口目录下的window.json可以配置窗口的属性，在多个位置打开窗口无需再重复编写相同的属性，不存在window.json则默认。
		* 窗口目录下的assets文件夹是静态资源文件夹，当前窗口的组件使用。和全局有区别。
	- main.js
	main/main.js文件是程序的主入口，里面默认就行，能不修改别修改。
	- components
	components是全局的组件目录，会被窗口目录下的组件调用，所有窗口共享。
	- assets是全局的静态资源目录，所有窗口共享。
	- utils是全局的工具目录，所有窗口共享。不建议main目录下的js引用。
- 窗口目录文件
```
│———xxxx-window/           # 设置窗口，以“-window”结尾
│       ├── Index.vue             # 窗口入口
│       ├── Sencond.page.vue      # 以“page.vue”结尾的页面
│       ├── main.ts               # 可省略。
│       ├── App.vue               # 可省略。
│       ├── router.js             # 可省略。
│       ├── window.json			  # 可省略
│       ├── preload.js 		  	  # 可省略

```

## mixone去IPC语法
## 什么是去IPC通讯语法。
IPC是进程之间通讯的意思，electron的主进程和渲染进程需要自己设计事件位置、事件名以及事件传输方向（主->渲,渲->主）。mixone要求把主进程API和nodejs的代码以四种方式写在业务代码的位置，mixone会将其语法编译为到主进程代码并符合electron的安全规范。从而实现开发层面去IPC通讯的语法，但是编译之后依旧以IPC通讯原理运行。
### 去IPC的四种语法
  - 注释方式。使用“// @mainProcess”注释声明函数访问了系统API。可以在所有js文件中注释、也可以在vue组件中注释。
  ```
  // @mainProcess
  export async function getSystemInfo() {
    return os.cpus();
  }
  // @mainProcess
  export async function monitorCPU() {
    const initial = os.cpus();
    return 'initial2:'+initial;
  }
  ```
  - Main常量语法。使用Main标识符号直接访问Electron的API，方便更快捷。
  ```
  // app是 electron Main API，而getPath是该API下的方法
  await Main.app.getPath('documents')
  ```
  - PJS常量语法。使用PJS标识符访问原生插件(Plugin Javascript)。
  ```
  //先要在main目录下实现WENJIAN.fn.js文件，请看源码中的例子
  await PJS.WENJIAN.read()
  ```
  - NodeJS常量语法。使用NodeJS访问nodejs的包。
  ```
  // os是NodeJS的一个内置包，所以不需要安装也能访问，但是如果访问的是一个第三方包，你就得提前把这个包通过npm install的方式安装上。
  const homeDirectory = await NodeJS.os.homedir();
  const filePathToRead = await NodeJS.path.join(homeDirectory, 'my_test_document.txt'); 
  ```
### 使用技巧：
他们之间有着不同的使用场景。常量语法是访问一些简单的方法和属性、如果这些方法中含有回调函数、定时器等情况，那么它就可能报错，这时就该使用注释方式来实现去IPC通信语法。语法常量的使用不需要前提前暴露。
## mixone的窗口管理类
- 窗口管理
  - 创建窗口。 
  ```
	let winInfo = await window.windowManager.openWindow('/windows/help-window', {
	  width: 1200,
	  height: 900
	});
	console.log('Window created with ID(winInfo):', winInfo);
  ```
  - 创建窗口的子modal窗口。 
  ```
	const currentWinId = window.getWinId();
	let modalWinInfo = await window.windowManager.openModalWindow(currentWinId, '/windows/help-window', {
		width: 600,
		height: 400,
		minimizable: false,
		maximizable: false
	});
  ```
  - 窗口之间通讯。 
  ```
  window.windowManager.sendToWindow(WinId,'orderPay',{orderId:12345})
  ```
  - 窗口事件监听 
  ```
    //监听窗口close、did-stop-loading事件，并不是所有的原生事件都能监听，试试就知道了
	  let winInfo = await window.windowManager.openWindow('/windows/help-window', {
		  width: 1200,
		  height: 900
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
  ```
## 常见问题
- 当碰到未知问题或其他方式已经无法解决时，怎么办？
“npm run dev”重启应用是比较万能的解决方法，若还是无法解决，请在issues中提交问题，我们会尽快解决。
- 支持react吗？
考虑支持中，暂未实现。
- 支持vue吗？
支持。默认选择vue2.7.16版本，对新浏览器和旧浏览器都支持，并且支持Vue3的组合式API。
- 支持typescript吗？
vue2本身不支持。将来引入的其他库可能支持。敬请期待...
- 如何访问Election的API
主要是指访问Election Main Process API，翻阅electron文档找到使用方法。记得使用了Election API的函数要进行注释。
- 如何访问NodeJS的包
nodejs的内置包可以通过NodeJS.包名直接访问，比如：NodeJS.fs,如果是第三方的包需要提前安装。
- 支持win7吗?
默认内置的electron版本是v21，是支持Win7及以上版本的。
- 支持mac、Ubuntu吗？
尚未测试。
- 改动了需要编辑的代码后没有生效。
请全部重新启动。以Main、NodeJS、PJS开头的语法发生改动后，有时候需要重启才能生效。
- 以Main、NodeJS、PJS开头的语法前的await可以不用写吗？
必须写await，并且所在函数应该是async函数。
- 使用“// @mainProcess”注释的函数内不要使用以Main、NodeJS、PJS开头的语法。
- 以Main、NodeJS、PJS开头的语法所调用的函数内部不能再使用以Main、NodeJS、PJS开头的语法为参数。
- 是否存在官方所说的安全性问题？
mixone是一个编译工具，你在渲染进程访问主进程API的代码以及NodeJS代码都是按照安全机制实现和编译的。
```javascript
//错误的写法
const result = await Main.dialog.showOpenDialog({
    title: '选择一个或多个文件',
    defaultPath: await Main.app.getPath('documents'), // 示例：默认打开文档目录
    buttonLabel: '选择',
    filters: [
        { name: '图片文件', extensions: ['jpg', 'png', 'gif'] },
        { name: '文本文件', extensions: ['txt', 'md'] },
        { name: '所有文件', extensions: ['*'] }
    ],
    properties: ['openFile', 'multiSelections', 'showHiddenFiles'] // 允许选择文件、允许多选、显示隐藏文件
});
//正确的写法
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
//错误的写法
await NodeJS.path.join(await NodeJS.os.homedir(), 'my_test_document.txt')
//正确的写法
let documentsPath = await NodeJS.os.homedir();
await NodeJS.path.join(documentsPath,'my_test_document.txt')
```
- 不能以别名方式引入组件或文件。
```javascript 
//正确的引入
import {getDocumentsPath2} from '../utils/api/utils.js';
//错误的引入（考虑升级支持）
import {getDocumentsPath2} from '@/utils/api/utils.js';
```
## 问题反馈群
- 有问题请加微信进群。

![项目结构](./qr-wechat.jpg)