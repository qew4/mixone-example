<template>
    <div class="preferences-home">
        <h2>偏好设置选项</h2>
        <div class="preferences-options">
            <div class="option">
                <label>主题</label>
                <select v-model="theme">
                    <option value="light">浅色</option>
                    <option value="dark">深色</option>
                </select>
            </div>
            <div class="option">
                <label>语言</label>
                <select v-model="language">
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                </select>
            </div>

            <button @click="USBlist">USB列表</button>
            <button @click="readUSB">读取USB</button>
            <pre id="output"></pre>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PreferencesHome',
    data() {
        return {
            theme: 'light',
            language: 'zh'
        }
    },
    methods: {
        async USBlist() {
            navigator.usb.getDevices().then(devices => {
                devices.forEach(device => {
                    console.log(`已授权设备: ${device.productName}, 厂商: ${device.manufacturerName}`);
                });
            });
        },
        async readUSB() {
            try {
                const device = await navigator.usb.requestDevice({
                    filters: [{ vendorId: 0x2341 }] // 根据你的设备设置 vendorId
                });

                await device.open(); // 打开设备
                if (device.configuration === null) {
                    await device.selectConfiguration(1);
                }

                await device.claimInterface(0); // 声明接口
                await device.controlTransferOut({
                    requestType: 'vendor',
                    recipient: 'device',
                    request: 0x01,
                    value: 0x0002,
                    index: 0x0001
                });

                const result = await device.transferIn(1, 64); // 从设备读取数据（64字节）

                const decoder = new TextDecoder();
                const data = decoder.decode(result.data);
                output.textContent = `设备返回的数据: ${data}`;
            } catch (error) {
                output.textContent = `出错了: ${error}`;
            }
        }
    }
}
</script>

<style scoped>
.preferences-home {
    padding: 20px;
}

.preferences-options {
    margin-top: 20px;
}

.option {
    margin-bottom: 15px;
}

label {
    display: block;
    margin-bottom: 5px;
}

select {
    width: 200px;
    padding: 5px;
}
</style>