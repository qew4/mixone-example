import Vuex from 'vuex'
import Vue from 'vue'
Vue.use(Vuex)
 
// 用于存储数据
const state = {
	navTabs:{
		
	},
}

// 响应组件中的动作
const actions = {
	addNavTab(context, {route,name, query}) {
		if(!context.state.navTabs[route]) {
			context.commit('SET_tab',{route,name, query})
		}
		// $router.push({
		// 	name:route,
		// 	query
		// })
	}
}
 
// 操作数据（state）
const mutations = {
	SET_tab(state, {route, query}) {
		state.navTabs =  {route, query}
	}
}

 
// 创建store
const store = new Vuex.Store({
    actions,
    mutations,
    state
})
 
 
// 暴露store 使其他VueComponents可以使用   简称vc组件实例对象
export default store