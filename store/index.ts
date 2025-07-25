import{defineStore} from'pinia';

export const useAppStore = defineStore('appStore',{
  state: () => {
    return {
        title:'default'
    }
  },
  actions:{
    setTitle(title){
      this.title = title
    },
  }
})
