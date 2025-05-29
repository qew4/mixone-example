// @ts-nocheck
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
Vue.config.productionTip = false;
Vue.use(Antd);
// Vue 2.7 的应用初始化方式
new Vue({
  router,
  render: h => h(App)
}).$mount('#app'); 