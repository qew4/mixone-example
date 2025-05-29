import Vue from 'vue';
import VueRouter from 'vue-router';

// 使用 Vue Router 插件
Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'Index',
        component: () => import('./Index.vue')
    },
    {
        path: '/help',
        name: 'Help',
        component: () => import('./Help.vue')
    },
    {
        path: '/second',
        name: 'Second',
        component: () => import('./Second.vue')
    },
];

// Vue 2.7 的 Vue Router 初始化方式
const router = new VueRouter({
    mode: 'hash',
    routes
});

export default router; 