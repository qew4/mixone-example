<template>
    <div class="help-home">
        <h2>help窗口 second</h2>
        <div @click="$router.push({path:'/'})" style="cursor: pointer;">Index</div>
    </div>
</template>

<script>
export default {
    name: 'SecondIndex',
    data() {
        return {

        }
    },
    mounted() {

    },
    methods: {

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