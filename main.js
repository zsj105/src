import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 引入 Element Plus 图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './assets/main.css' // Vite 默认的 CSS
import './assets/theme-custom.css'
const app = createApp(App)

// 全局注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus)

app.mount('#app')
