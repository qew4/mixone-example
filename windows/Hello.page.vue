<template>
	<div>
		hello 123
		<button @click="backPage">后退</button>
	</div>
</template>

<script>
export default {
	data() {
		return {
			// 1. 定义一个数组
			arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
			// 2. 定义一个变量，用来存储数组中所有偶数的和
			sum: 0
		}
	},
	methods: {
		backPage() {
			this.$router.go(-1)
		}
	}
}
</script>

<style>
</style>