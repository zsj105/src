<template>
  <!-- 1. 使用 page-container，并添加 flex-center 类实现垂直居中 -->
  <div class="page-container flex-center">
    <!-- 2. 使用 common-card -->
    <el-card class="common-card upload-card">
      <template #header>
        <div class="text-center">
          <h2 class="text-xl font-bold">产品数据导入</h2>
        </div>
      </template>

      <el-form @submit.prevent="handleUpload" class="upload-form">
        <!-- 提示框 -->
        <transition name="el-fade-in">
          <el-alert
            v-if="feedback.message"
            :title="feedback.message"
            :type="feedback.isSuccess ? 'success' : 'error'"
            show-icon
            closable
            @close="feedback.message = ''"
            class="mb-6"
          />
        </transition>

        <!-- 上传区域 -->
        <el-form-item class="upload-item">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleChange"
            :on-exceed="handleExceed"
            :file-list="fileList"
            :accept="'.xlsx'"
            drag
            class="full-width-upload"
          >
            <el-icon class="el-icon--upload upload-icon"><upload-filled /></el-icon>
            <div class="el-upload__text upload-text">拖放文件到此处 或 <em>点击选择</em></div>
            <template #tip>
              <div class="el-upload__tip text-center">仅支持 .xlsx 格式，单次限传 1 个文件</div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 按钮区域 -->
        <el-form-item class="mt-4">
          <el-button
            type="primary"
            :loading="isLoading"
            :disabled="!fileList.length || isLoading"
            @click="handleUpload"
            class="beautiful-upload-btn"
          >
            <span v-if="!isLoading" class="flex items-center justify-center">
              <el-icon class="mr-2"><UploadFilled /></el-icon> 开始导入
            </span>
            <span v-else>数据处理中...</span>
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { uploadProductsFile } from '../../services/api/product.js'

// --- 状态 ---
const isLoading = ref(false)
const fileList = ref([])
const uploadRef = ref(null)

// 统一反馈消息状态
const feedback = ref({
  message: '',
  isSuccess: false,
})

// 文件选择/改变时的回调
const handleChange = (file, list) => {
  fileList.value = list.slice(-1) // 限制1个
  feedback.value.message = ''
}

// 文件数量超出限制
const handleExceed = () => {
  ElMessage.warning(`当前限制选择 1 个文件，请先移除现有文件。`)
}

// 处理文件上传
const handleUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的 Excel 文件。')
    return
  }

  const file = fileList.value[0].raw
  if (!file.name.endsWith('.xlsx')) {
    ElMessage.error('仅支持 .xlsx 格式的文件。')
    uploadRef.value.clearFiles()
    fileList.value = []
    return
  }

  isLoading.value = true
  feedback.value.message = ''

  const formData = new FormData()
  formData.append('file', file)

  try {
    const responseData = await uploadProductsFile(formData)

    if (responseData) {
      feedback.value.isSuccess = true
      const successMsg = responseData.message || '数据导入成功！'
      feedback.value.message = successMsg

      ElNotification({
        title: '导入成功',
        message: successMsg,
        type: 'success',
        duration: 4500,
      })

      uploadRef.value.clearFiles()
      fileList.value = []
    }
  } catch (error) {
    console.error('导入失败:', error)
    let errorMessage = error.message || '未知错误，导入失败。'
    feedback.value.isSuccess = false
    feedback.value.message = errorMessage
    ElMessage.error(errorMessage)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/*
  ✨ 导入页面专属样式
  继承 theme-custom.css 的基础，增加居中布局和拖拽框美化
*/

/* 1. 布局居中 */
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
  /* 减去顶部导航的大概高度，视觉更居中 */
  min-height: calc(100vh - 60px);
}

/* 2. 卡片尺寸调整 */
.upload-card {
  width: 100%;
  max-width: 500px;
  /* 增加一点额外的内边距让呼吸感更强 */
  padding: 10px;
}

/* 文本辅助 */
.text-center {
  text-align: center;
}
.text-xl {
  font-size: 1.25rem;
}
.text-sm {
  font-size: 0.875rem;
}
.text-secondary {
  color: var(--el-text-color-secondary);
}
.mt-2 {
  margin-top: 0.5rem;
}
.mt-4 {
  margin-top: 1rem;
}
.mb-6 {
  margin-bottom: 1.5rem;
}
.mr-2 {
  margin-right: 0.5rem;
}

/* 3. 上传拖拽区域美化 (核心适配) */
.full-width-upload {
  width: 100%;
}

.upload-item :deep(.el-upload) {
  width: 100%;
}

.upload-item :deep(.el-upload-dragger) {
  /* 背景适配暗黑模式 */
  background-color: var(--el-fill-color-blank);
  border: 2px dashed var(--el-border-color);
  border-radius: 12px;
  padding: 40px 20px;
  transition: all 0.3s;
}

/* 悬停效果 */
.upload-item :deep(.el-upload-dragger:hover) {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9); /* 浅色主题下变蓝 */
}
/* 暗黑模式下的悬停背景微调 (利用 css 变量的透明度特性) */
html.dark .upload-item :deep(.el-upload-dragger:hover) {
  background-color: rgba(64, 158, 255, 0.1);
}

/* 图标和文字 */
.upload-icon {
  font-size: 60px;
  color: var(--el-text-color-placeholder);
  transition: color 0.3s;
  margin-bottom: 10px;
}
.upload-item :deep(.el-upload-dragger:hover) .upload-icon {
  color: var(--el-color-primary);
}

.upload-text {
  color: var(--el-text-color-regular);
  font-size: 1rem;
}
.upload-text em {
  color: var(--el-color-primary);
  font-style: normal;
  font-weight: bold;
}

/* 4. 按钮美化 (保留您喜欢的渐变风格) */
.beautiful-upload-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(45deg, #409eff, #79bbff);
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.3);
  transition: all 0.3s;
}

.beautiful-upload-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(64, 158, 255, 0.4);
}

.beautiful-upload-btn:disabled {
  background: var(--el-fill-color);
  color: var(--el-text-color-placeholder);
  box-shadow: none;
  cursor: not-allowed;
}

/* 列表项居中 */
.upload-item :deep(.el-upload-list__item) {
  margin-top: 10px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
}
</style>
