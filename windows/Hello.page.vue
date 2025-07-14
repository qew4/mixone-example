<template>
	<div>
		hello 123 4
		<button @click="backPage">后退</button>
	</div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const $router = useRouter();
const backPage = () => {
	$router.go(-1)
}
const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const sum = 0;
</script>

<style>
</style>