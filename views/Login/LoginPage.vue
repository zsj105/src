<template>
  <div class="login-page">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>系统登录</span>
        </div>
      </template>
      <el-form :model="loginForm" @submit.prevent="handleLogin" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-button" native-type="submit" :loading="loading">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios' // 确保 axios 已安装和配置

// 导入 Element Plus 图标
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true

  try {
    // 🎯 调用后端的登录 API
    const response = await axios.post('/api/auth/login', {
      username: loginForm.username,
      password: loginForm.password,
    })

    const token = response.data.access_token

    // 存储 Token
    localStorage.setItem('accessToken', token)

    // ✅ 登录成功，使用 ElMessage 提示
    ElMessage.success('登录成功！')

    // 重定向到目标页面
    const redirectPath = route.query.redirect || '/'
    router.push(redirectPath)
  } catch (error) {
    // 清除无效 Token
    localStorage.removeItem('accessToken')

    // ✅ 登录失败，使用 ElMessage 提示
    const errorMessage = error.response?.data?.detail || '登录失败，请检查网络或凭证。'
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  /* 恢复上次的渐变背景 */
  background: linear-gradient(135deg, #ffdab9 0%, #add8e6 50%, #90ee90 100%);
  font-family: 'Arial', sans-serif;
}

.login-card {
  width: 380px;
  max-width: 90%;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border: none;
  background-color: rgba(255, 255, 255, 0.95); /* 略微减少透明度，使卡片更清晰 */
}

.card-header {
  text-align: center;
  font-size: 26px;
  font-weight: bold;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 20px;
}

.login-form {
  padding: 0 20px 20px;
}

.el-form-item {
  margin-bottom: 22px;
}

/* 覆盖 Element Plus 输入框的默认样式 */
/* 注意：这里的 :deep() 是为了美化输入框本身，与 ElMessage 无关 */
.el-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) inset;
  background-color: #f8f8f8;
}

.el-input :deep(.el-input__inner) {
  color: #333;
}

.el-input :deep(.el-input__prefix) {
  color: #999;
}

.login-button {
  width: 100%;
  padding: 12px 0;
  font-size: 18px;
  border-radius: 8px;
  /* 恢复上次的按钮渐变背景 */
  background: linear-gradient(45deg, #6dd5ed, #2193b0);
  border: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  background: linear-gradient(45deg, #2193b0, #6dd5ed);
}
</style>
