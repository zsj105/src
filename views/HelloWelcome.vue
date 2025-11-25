<template>
  <div class="welcome-container">
    <h1 class="welcome-text">你好，{{ displayName || '' }}！</h1>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

import { parseJwt } from '../services/utils.js'

const displayName = ref('')

onMounted(() => {
  // 1. 获取存储在 localStorage 中的 Token
  const token = localStorage.getItem('accessToken')

  if (token) {
    // 2. 使用 parseJwt 解码 Token
    const payload = parseJwt(token)

    if (payload && payload.display_name) {
      displayName.value = payload.display_name
    } else {
      console.warn("JWT Token 已找到，但 Payload 中缺少 'display_name' 字段或解析失败。")
    }
  } else {
    console.warn("localStorage 中未找到 'accessToken'。")
  }
})
</script>

<style scoped>
/* 样式部分保持不变 */
.welcome-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: calc(100vh - 60px - 40px);
  width: 100%;
}

.welcome-text {
  font-size: 8vw;
  font-weight: 700;
  margin-bottom: 20px;
  background-image: linear-gradient(90deg, #40e0d0, #00ced1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 1px rgba(64, 224, 208, 0.1);
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.subtitle-text {
  font-size: 2vw;
  color: #606266;
  font-weight: 300;
  opacity: 0.8;
  letter-spacing: 0.1em;
}
</style>
