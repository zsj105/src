<template>
  <div class="app-root-container">
    <!-- 🎄 引入圣诞场景 (雪花 + 树) -->
    <ChristmasScene />

    <Transition name="layout-fade" mode="out-in">
      <div v-if="isFullScreen" key="full-screen-layout">
        <RouterView :key="$route.fullPath" />
      </div>

      <el-container class="main-layout" v-else key="main-layout">
        <el-aside
          :width="isCollapse ? '64px' : '220px'"
          class="main-aside"
          :class="{ 'is-collapsed': isCollapse }"
        >
          <div class="logo-header" :class="{ 'is-collapsed': isCollapse }">
            <div
              class="collapse-toggle"
              @click="isCollapse = !isCollapse"
              :title="isCollapse ? '展开菜单' : '收起菜单'"
            >
              <el-icon :size="20">
                <component :is="isCollapse ? DArrowRight : DArrowLeft" />
              </el-icon>
            </div>
            <!-- 修改：字体颜色使用变量，适应暗黑模式 -->
            <span v-if="!isCollapse" class="app-title">圣诞主题</span>
          </div>

          <el-menu
            :default-active="activeRoute"
            class="aside-menu"
            :router="true"
            background-color="transparent"
            text-color="inherit"
            active-text-color="inherit"
            :collapse="isCollapse"
          >
            <!-- 注意：text-color="inherit" 让文字颜色跟随父级 css 变量 -->
            <el-sub-menu index="1">
              <template #title>
                <el-icon><Tickets /></el-icon>
                <span>产品管理</span>
              </template>
              <el-menu-item index="/products" v-if="checkMenuPermission('P003')">
                <el-icon><Menu /></el-icon><span>产品列表</span>
              </el-menu-item>
              <el-menu-item index="/products/export" v-if="checkMenuPermission('P005')">
                <el-icon><Ship /></el-icon><span>外销出运</span>
              </el-menu-item>
              <el-menu-item index="/products/custproduct_profit" v-if="checkMenuPermission('P006')">
                <el-icon :color="'#67c23a'"><Coin /></el-icon><span>客户商品利润分析</span>
              </el-menu-item>
              <el-menu-item index="/upload" v-if="checkMenuPermission('P004')">
                <el-icon><Upload /></el-icon><span>产品导入</span>
              </el-menu-item>
            </el-sub-menu>

            <el-sub-menu index="2">
              <template #title>
                <el-icon><Setting /></el-icon>
                <span>用户管理</span>
              </template>
              <el-menu-item index="/user/roles" v-if="checkMenuPermission('P001')">
                <el-icon><Lock /></el-icon><span>角色管理</span>
              </el-menu-item>
              <el-menu-item index="/user/auth" v-if="checkMenuPermission('P002')">
                <el-icon><User /></el-icon><span>用户授权</span>
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </el-aside>

        <el-container direction="vertical">
          <el-header class="content-header">
            <div class="header-title">
              当前位置：<span class="current-path">{{ currentRouteTitle }}</span>
            </div>
            <div class="header-right">
              <el-icon :size="20" style="margin-right: 15px"><Search /></el-icon>
              <el-dropdown trigger="click">
                <span class="el-dropdown-link header-avatar-icon">
                  <el-icon :size="20"><Avatar /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      ><el-icon><User /></el-icon>个人中心</el-dropdown-item
                    >
                    <el-dropdown-item divided @click="handleLogout">
                      <el-icon><SwitchButton /></el-icon>退出登录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </el-header>

          <el-main class="main-content">
            <RouterView :key="$route.fullPath" />
          </el-main>
        </el-container>
      </el-container>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { hasPermission } from './services/utils.js'
import ChristmasScene from './components/ChristmasScene.vue' // 引入组件

const route = useRoute()
const router = useRouter()
const isCollapse = ref(true)

const activeRoute = computed(() => route.path)
const currentRouteTitle = computed(() => route.meta?.title || '首页')
const isFullScreen = computed(() => route.meta?.isFullScreenLayout)

function checkMenuPermission(code) {
  if (!code) return true
  return hasPermission(code)
}

const handleLogout = () => {
  localStorage.removeItem('accessToken')
  ElMessage.success('退出登录成功！')
  router.push('/login')
}

// 🌑 初始化：强制设置为暗黑模式
onMounted(() => {
  document.documentElement.classList.add('dark')
})
</script>

<!-- App.vue 的 Style 部分 -->

<!-- 👇 1. 全局样式 (不要加 scoped) -->
<!-- 必须在这里定义变量，变量才能根据 html.dark 自动切换 -->
<style>
:root {
  /* 默认（暗黑模式）下的侧边栏背景：深蓝渐变 */
  --sidebar-gradient: linear-gradient(180deg, #1f4e79 0%, #00ced1 100%);
  --sidebar-text-color: #e0e0e0;
}

/* 亮色模式下的覆盖：浅蓝渐变 */
html:not(.dark) :root {
  --sidebar-gradient: linear-gradient(180deg, #87cefa 0%, #00ced1 100%);
  --sidebar-text-color: #303133;
}

/* 全局重置，确保背景黑 */
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: var(--el-bg-color); /* 随 Element 变黑 */
  color: var(--el-text-color-primary);
}

#app {
  width: 100%;
  height: 100%;
}
</style>

<!-- 👇 2. 组件局部样式 (保留 scoped) -->
<style scoped>
.app-root-container {
  height: 100vh;
  width: 100vw;
}

.main-layout {
  height: 100%; /* 确保填满 */
  min-height: 100vh;
}

.main-aside {
  /* 这里引用上面定义的全局变量 */
  background: var(--sidebar-gradient) !important;
  border-right: none;
  transition: width 0.3s;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.logo-header {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  /* 强制使用变量颜色 */
  color: var(--sidebar-text-color);
  gap: 10px;
  font-weight: bold;
}

.collapse-toggle {
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  color: var(--sidebar-text-color);
}
.collapse-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.aside-menu {
  border-right: none;
  flex-grow: 1;
  /* 覆盖 Element Menu 的默认颜色变量 */
  --el-menu-text-color: var(--sidebar-text-color);
  --el-menu-hover-text-color: #fff;
  --el-menu-bg-color: transparent;
  --el-menu-hover-bg-color: rgba(255, 255, 255, 0.1);
  --el-menu-active-color: #fff;
}

/* 选中菜单项样式 */
.aside-menu :deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
  font-weight: bold;
}

/* 顶部 Header */
.content-header {
  background-color: var(--el-bg-color-overlay); /* 跟随 Element 暗黑变量 */
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0 20px;
  color: var(--el-text-color-primary);
}

.header-title {
  font-size: 16px;
  color: var(--el-text-color-secondary);
}
.current-path {
  font-weight: bold;
  color: var(--el-text-color-primary);
}
.header-right {
  color: var(--el-text-color-regular);
  display: flex;
  align-items: center;
}

.main-content {
  background-color: var(--el-bg-color); /* 这里的背景也必须跟随 Element */
  padding: 10px;
}

.header-avatar-icon {
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  color: var(--el-text-color-primary);
}
.header-avatar-icon:hover {
  background-color: var(--el-fill-color);
}

/* 过渡动画 */
.layout-fade-enter-active,
.layout-fade-leave-active {
  transition: opacity 0.3s ease;
}
.layout-fade-enter-from,
.layout-fade-leave-to {
  opacity: 0;
}
</style>
