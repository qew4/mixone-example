// @ts-nocheck
import Vue from 'vue';
import App from './App.vue';
import router from './router';

// Vue 2.7 的应用初始化方式
new Vue({
  router,
  render: h => h(App)
}).$mount('#app'); 