<template>
  <div class="app-root-container">
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

            <span v-if="!isCollapse" class="app-title"></span>
          </div>

          <el-menu
            :default-active="activeRoute"
            class="aside-menu"
            :router="true"
            background-color="transparent"
            text-color="#303133"
            active-text-color="#303133"
            :collapse="isCollapse"
          >
            <el-sub-menu index="1">
              <template #title>
                <el-icon><Tickets /></el-icon>
                <span>产品管理</span>
              </template>

              <el-menu-item index="/products" v-if="checkMenuPermission('P003')">
                <el-icon><Menu /></el-icon>
                <span>产品列表</span>
              </el-menu-item>

              <el-menu-item index="/products/export" v-if="checkMenuPermission('P005')">
                <el-icon><Ship /></el-icon>
                <span>外销出运</span>
              </el-menu-item>

              <el-menu-item index="/upload" v-if="checkMenuPermission('P004')">
                <el-icon><Upload /></el-icon>
                <span>产品导入</span>
              </el-menu-item>
            </el-sub-menu>

            <el-sub-menu index="2">
              <template #title>
                <el-icon><Setting /></el-icon>
                <span>用户管理</span>
              </template>

              <el-menu-item index="/user/roles" v-if="checkMenuPermission('P001')">
                <el-icon><Lock /></el-icon>
                <span>角色管理</span>
              </el-menu-item>

              <el-menu-item index="/user/auth" v-if="checkMenuPermission('P002')">
                <el-icon><User /></el-icon>
                <span>用户授权</span>
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
                    <el-dropdown-item>
                      <el-icon><User /></el-icon>个人中心 (待开发)
                    </el-dropdown-item>
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
import { computed, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import {
  Tickets,
  Menu,
  Upload,
  Setting,
  Search,
  Avatar,
  DArrowRight,
  DArrowLeft,
  Lock,
  User,
  SwitchButton,
  Ship,
} from '@element-plus/icons-vue'
import { hasPermission } from './services/utils.js'
import { ElMessage } from 'element-plus'
const route = useRoute()
const router = useRouter()
const isCollapse = ref(true)
const activeRoute = computed(() => route.path)
const currentRouteTitle = computed(() => route.meta?.title || '首页')
const isFullScreen = computed(() => {
  // 确保 route.meta 存在，防止读取 undefined 属性
  return route.meta?.isFullScreenLayout
})
function checkMenuPermission(permissionCode) {
  // 如果没有提供权限代码，则默认显示
  if (!permissionCode) return true
  return hasPermission(permissionCode)
}
const handleLogout = () => {
  // 1. 清除认证信息 (Token 和权限)
  localStorage.removeItem('accessToken')

  // 2. 提示用户
  ElMessage.success('退出登录成功！')

  // 3. 重定向到登录页
  router.push('/login')
}
</script>

<style scoped>
/* 样式代码与您原文件保持一致 */
:root {
  /* 侧边栏的蓝绿色渐变 (从浅到深，应用于整个 aside) */
  --sidebar-gradient: linear-gradient(180deg, #87cefa 0%, #00ced1 100%);
  --sidebar-text-color: #303133;
  --sidebar-active-bg: #ffffff;
  --main-bg: #f0f2f5;
  --teal-color: #00ced1;
}

/* 🚀 新增：布局切换过渡样式 */
.layout-fade-enter-active,
.layout-fade-leave-active {
  transition: opacity 0.3s ease;
}

.layout-fade-enter-from,
.layout-fade-leave-to {
  opacity: 0;
}

.main-layout {
  min-height: 100vh;
}

.main-aside {
  background: var(--sidebar-gradient);
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
  color: var(--sidebar-text-color);
  gap: 10px;
  justify-content: flex-start;
  font-weight: bold;
  padding-top: 10px;
  padding-bottom: 10px;
}

.collapse-toggle {
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
  color: var(--sidebar-text-color);
}

.aside-menu {
  border-right: none;
  flex-grow: 1;
}

.aside-menu :deep(.el-menu-item),
.aside-menu :deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  margin: 5px 10px;
  padding: 0 10px !important;
  border-radius: 6px;
  color: var(--sidebar-text-color) !important;
  --el-menu-icon-color: var(--sidebar-text-color);
}

.aside-menu :deep(.el-menu-item):hover,
.aside-menu :deep(.el-sub-menu__title):hover {
  background-color: rgba(255, 255, 255, 0.3) !important;
}

.aside-menu :deep(.el-menu-item.is-active) {
  background: var(--sidebar-active-bg) !important;
  color: #303133 !important;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  --el-menu-icon-color: #303133;
}

.aside-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: #303133 !important;
  --el-menu-icon-color: #303133;
}

.aside-menu :deep(.el-menu--inline .el-menu-item) {
  background-color: transparent !important;
}

.content-header {
  background-color: #ffffff;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 20px;
  color: #333;
}
.header-title {
  font-size: 16px;
  color: #999;
}
.current-path {
  font-weight: bold;
  color: #333;
}
.header-right {
  color: #606266;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.main-content {
  background-color: var(--main-bg);
  padding: 10px;
}
.header-avatar-icon {
  cursor: pointer;
  padding: 5px; /* 增加点击区域 */
  border-radius: 50%;
  transition: background-color 0.2s;
  display: flex; /* 确保图标居中 */
  align-items: center;
}

.header-avatar-icon:hover {
  background-color: #f0f2f5; /* 悬停背景色 */
}
</style>
