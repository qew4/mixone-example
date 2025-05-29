<template>
    <div class="help-home">
        <h2>常见问题</h2>
        <div @click="goPage('/help')" style="cursor: pointer;">help</div>
        <div @click="goPage('/second')" style="cursor: pointer;">second</div>
        <a href="/settings-window/index.html">设置页面</a>
        <br>
        <a href="/index.html">根页面</a> <br>
        <a href="/settings-window/preferences-window/index.html">设置-偏好</a>
        <br>
        <button @click="back">后退</button>
        <div class="faq-list">
            <div class="faq-item">
                <h3>如何开始使用？</h3>
                <p>点击主界3面的"开始"按钮即可开始使用本应用334455。</p>
            </div>
            <div class="faq-item">
                <h3>如何修改设置？</h3>
                <p>点击菜单栏的"设置"选项，可以打开设置窗口进行配置。</p>
            </div>
            <div class="faq-item">
                <h3>遇到问题怎么办？</h3>
                <p>如果遇到问题，可以查看帮助文档或联系技术支持。</p>
            </div>
        </div>
        <div class="result">{{ result }}</div>
        <button @click="openWindow('/windows/settings-window')">打开设置窗口</button>
        <button @click="openWindow('/windows')">打开入口</button>
        <button @click="fetchGitHub_viaProxy2">点击g</button>
        <button @click="getMainConfig2">dialog</button>
        <button @click="getSystemInfo2">获取系统信息</button>
        <button @click="startMonitorCPU">开始监控CPU</button>
        <div class="system-info">
            <h3>系统信息</h3>
            <pre>{{ systemInfo }}</pre>
        </div>
        <div class="cpu-usage">
            <h3>CPU使用情况</h3>
            <pre>{{ cpuUsage }}</pre>
        </div>
        <custom-button @click="fetchGitHub_viaProxy2">自定义按钮</custom-button>
    </div>
</template>

<script>
import { fetchGitHub_viaProxy, getMainConfig2 } from '../../utils/api/github';
import { getSystemInfo, monitorCPU } from '../../utils/api/utils';
import CustomButton from '../../components/basic/CustomButton.vue';
export default {
    name: 'HelpHome',
    components: {
        CustomButton
    },
    data() {
        return {
            result: '',
            systemInfo: '',
            cpuUsage: ''
        }
    },
    mounted() {

    },
    methods: {
        openWindow(url) {
            openWindow(url);
        },
        goPage(path) {
            this.$router.push({path});
        },
        fetchGitHub_viaProxy2() {
            fetchGitHub_viaProxy().then(data => {
                this.result = data;
            });
        },
        getMainConfig2() {
            getMainConfig2();
        },
        async getSystemInfo2() {
            try {
                const info = await getSystemInfo();
                this.systemInfo = JSON.stringify(info, null, 2);
            } catch (error) {
                console.error('获取系统信息失败:', error);
            }
        },
        async startMonitorCPU() {
            // 开始新的监控
            this.cpuUsage = await monitorCPU();
            setInterval(async () => {
                // 每500ms获取一次CPU使用情况
                this.cpuUsage = await monitorCPU();
            }, 1500);
        },
        back() {
            this.$router.go(-1);
        }
    }
}
</script>

<style scoped>
.help-home {
    padding: 20px;
}

.faq-list {
    margin-top: 20px;
}

.faq-item {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.faq-item h3 {
    margin: 0 0 10px 0;
    color: #333;
}

.faq-item p {
    margin: 0;
    color: #666;
}

.system-info, .cpu-usage {
    margin-top: 20px;
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 4px;
}

pre {
    background: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
}

button {
    margin: 5px;
    padding: 8px 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background-color: #45a049;
}
</style> 