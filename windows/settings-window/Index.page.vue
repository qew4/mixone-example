<template>
    <div class="settings-home">
        <h2>基本设置</h2>
        <button @click="openHelp">打开帮助中心</button>
        <button @click="back">后退</button>
        <button @click="getCurrentWindowId">当前窗口ID</button>
    </div>
</template>

<script>
export default {
    name: 'SettingsHome',
    methods: {
        getCurrentWindowId() {
            let winID = windowManager.getCurrentWindowId();
            console.log('当前窗口ID：', winID);
        },
        openHelp() {
            // 这里可以添加打开偏好设置窗口的逻辑
            window.openWindow('/help-window', {
                width: 800,
                height: 600
            });
        },
        back() {
            this.$router.go(-1);
        }
    }
}
</script>

<style scoped>
.settings-home {
    padding: 20px;
}
</style> 