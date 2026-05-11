import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// 新增Element Plus相关导入
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 新增Pinia相关导入
import { createPinia } from 'pinia'

// 在Vue实例中安装Element Plus和Pinia
const app = createApp(App)
// 创建Pinia实例
const pinia = createPinia()
// 安装插件
app.use(router)
app.use(ElementPlus)
app.use(pinia)
app.mount('#app')