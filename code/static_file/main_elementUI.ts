// @ts-nocheck
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.config.productionTip = false;
Vue.use(ElementUI);
// Vue 2.7 的应用初始化方式
new Vue({
  router,
  render: h => h(App)
}).$mount('#app'); 