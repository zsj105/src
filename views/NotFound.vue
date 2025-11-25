<template>
  <div class="not-found-page">
    <el-result icon="error" title="404" sub-title="抱歉，您访问的页面不存在或已被移除。">
      <template #icon>
        <el-icon class="error-icon"><WarningFilled /></el-icon>
      </template>
      <template #extra>
        <el-button type="primary" size="large" @click="goHome"> 返回首页 </el-button>
      </template>
    </el-result>

    <div class="animation-placeholder"></div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { WarningFilled } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  // 返回到应用首页
  router.push('/')
}
</script>

<style scoped>
/* ------------------------------------------- */
/* 继承您的登录页面的全屏背景和居中风格 */
/* ------------------------------------------- */
.not-found-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  /* 沿用您 App.vue 和 Login 页面的渐变背景色 */
  background: linear-gradient(135deg, #ffdab9 0%, #add8e6 50%, #90ee90 100%);
  color: #333;
  padding: 20px;
}

.el-result {
  /* 确保 ElResult 组件在居中位置 */
  background-color: rgba(255, 255, 255, 0.9);
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  max-width: 450px;
  text-align: center;
}

/* 自定义图标样式 */
.error-icon {
  font-size: 80px;
  color: #f56c6c; /* 红色警告色 */
}

/* 按钮样式沿用 Element Plus 默认 Primary 风格，或根据您的需求调整 */
.el-button {
  margin-top: 20px;
  font-weight: bold;
}

.animation-placeholder {
  margin-top: 30px;
  color: #666;
  font-size: 14px;
}
</style>
