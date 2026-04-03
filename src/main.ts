import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css' // 引入组件库样式
import * as ElementPlusIconsVue from '@element-plus/icons-vue'


import ElementPlus from 'element-plus'
import App from './App.vue'
import router from './router'
import axios from 'axios'
//设置基础的baseUrl
axios.defaults.baseURL = "/api";// 设置后端服务的基础地址

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}


app.config.globalProperties.$http = axios;
app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')

