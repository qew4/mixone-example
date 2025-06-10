<template>
    <button 
        class="custom-button"
        :class="{ 'custom-button--primary': type === 'primary' }"
        @click="$emit('click')"
    >
        <slot></slot>
    </button>
</template>

<script>
export default {
    name: 'CustomButton',
    props: {
        type: {
            type: String,
            default: 'default'
        }
    }
}
</script>

<style scoped>
.custom-button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    background-color: #4CAF50;
    color: white;
}

.custom-button:hover {
    background-color: #45a049;
}

.custom-button--primary {
    background-color: #2196F3;
}

.custom-button--primary:hover {
    background-color: #1976D2;
}
</style> 