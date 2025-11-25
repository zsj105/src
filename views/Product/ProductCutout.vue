<template>
  <div class="product-cutout-container">
    <el-card class="box-card-beautiful">
      <template #header>
        <div class="card-header-beautiful">
          <h2 class="card-title">AI 商品抠图</h2>
        </div>
      </template>

      <el-form @submit.prevent="handleUpload" class="upload-form-beautiful">
        <el-alert
          v-if="feedback.message"
          :title="feedback.message"
          :type="feedback.isSuccess ? 'success' : 'error'"
          show-icon
          closable
          @close="feedback.message = ''"
          class="mb-4 beautiful-alert"
        />

        <el-form-item class="upload-area-center">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleChange"
            :accept="'image/*'"
            :show-file-list="false"
          >
            <el-button type="primary">
              <el-icon><UploadFilled /></el-icon> 点击选择图片
            </el-button>
            <template #tip>
              <div class="el-upload__tip beautiful-tip">支持 .jpg, .png 等图片格式。</div>
            </template>
          </el-upload>
        </el-form-item>

        <div v-if="originalImage || resultImage" class="result-display">
          <div class="image-box">
            <h3>原图</h3>
            <img v-if="originalImage" :src="originalImage" alt="Original" />
          </div>
          <div class="image-box">
            <h3>抠图结果 (PNG)</h3>
            <img v-if="resultImage" :src="resultImage" alt="Result" />
          </div>
        </div>

        <el-form-item class="upload-button-container">
          <el-button
            type="primary"
            :loading="isLoading"
            :disabled="!fileList.length || isLoading"
            @click="handleUpload"
            class="beautiful-upload-btn"
          >
            <span v-if="!isLoading">
              <el-icon><MagicStick /></el-icon> 开始智能抠图
            </span>
            <span v-else>AI 处理中...</span>
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { UploadFilled, MagicStick } from '@element-plus/icons-vue'

// 假设的 API 调用函数
// (在 api.js 中, 你需要创建一个能处理 blob 响应的函数)
// import { uploadImageForCutout } from '../../services/api/segment.js'

// --- 状态 ---
const isLoading = ref(false)
const fileList = ref([])
const uploadRef = ref(null)
const feedback = ref({ message: '', isSuccess: false })

// --- 修改 3: 存储图片 URL 用于显示 ---
const originalImage = ref(null)
const resultImage = ref(null)

const handleChange = (file, list) => {
  fileList.value = list.slice(-1)
  feedback.value.message = ''

  // 使用 FileReader 在本地预览原图
  if (file.raw) {
    const reader = new FileReader()
    reader.onload = (e) => {
      originalImage.value = e.target.result
    }
    reader.readAsDataURL(file.raw)
  }
  // 清空上一次的结果
  resultImage.value = null
}

const handleUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择要处理的图片。')
    return
  }

  const file = fileList.value[0].raw
  isLoading.value = true
  feedback.value.message = ''
  resultImage.value = null

  const formData = new FormData()
  formData.append('file', file)

  try {
    // 您的 API 调用 (例如 axios)
    // 必须指定 responseType 为 'blob'
    const response = await fetch('/api/segmentation/predict', {
      // 替换为您的 API 地址
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      // 从 JSON 错误中读取 detail
      const errorData = await response.json()
      throw new Error(errorData.detail || '抠图失败')
    }

    // --- 修改 4: 处理返回的图片 Blob ---
    const imageBlob = await response.blob()

    // 将 Blob 转换为 URL 以便在 <img> 中显示
    resultImage.value = URL.createObjectURL(imageBlob)

    feedback.value.isSuccess = true
    feedback.value.message = 'AI 抠图处理成功！'
    ElNotification.success('AI 抠图处理成功！')

    // 成功后清空文件列表以便下次上传
    uploadRef.value.clearFiles()
    fileList.value = []
  } catch (error) {
    console.error('抠图失败:', error)
    feedback.value.isSuccess = false
    feedback.value.message = error.message || '未知错误，处理失败。'
    ElMessage.error(feedback.value.message)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* (复用您 ProductUpload.vue 中的 .css 样式) */
.product-cutout-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f2f5 0%, #e0e5ec 100%); /* 柔和的渐变背景 */
  padding: 20px;
  box-sizing: border-box; /* 确保 padding 不会超出容器 */
}
.box-card-beautiful {
  width: 90%;
  max-width: 650px; /* 略微增大最大宽度 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); /* 更明显的阴影 */
  border-radius: 16px; /* 更大的圆角 */
  background-color: #ffffff; /* 纯白背景 */
  border: none; /* 移除默认边框 */
  overflow: hidden; /* 确保圆角生效 */
  transition: all 0.3s ease-in-out; /* 添加过渡效果 */
}
.box-card-beautiful:hover {
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15); /* 悬停时阴影更深 */
}

/* --- 卡片头部样式 --- */
.card-header-beautiful {
  background: linear-gradient(90deg, #409eff 0%, #79bbff 100%); /* Element Plus 主色渐变 */
  padding: 25px 30px; /* 增加内边距 */
  color: #fff; /* 白色文字 */
  text-align: center;
  border-bottom: none; /* 移除默认底部边框 */
}

.card-title {
  font-size: 1.8rem; /* 更大的标题 */
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 1px; /* 增加字间距 */
}

.card-subtitle {
  font-size: 0.95rem;
  font-weight: 300;
  opacity: 0.9;
  margin: 0;
}

/* --- 表单和上传区域 --- */
.upload-form-beautiful {
  padding: 30px; /* 增加表单内边距 */
}

/* El-Form-Item Label 样式 */
.form-item-label-bold :deep(.el-form-item__label) {
  font-weight: 600; /* 加粗标签 */
  color: #333; /* 深色 */
  font-size: 1rem;
  margin-bottom: 8px !important; /* 确保间距 */
}

/* 警示框样式 */
.beautiful-alert {
  margin-bottom: 25px !important;
  border-radius: 8px;
  /* 调整成功的背景色，使其与主题色更协调 */
  background-color: #e6f7ff; /* 浅蓝色 */
  color: #1890ff; /* 蓝色字体 */
  border-color: #91d5ff; /* 蓝色边框 */
}
/* 覆盖错误警示框默认背景色，使其更具设计感 */
.beautiful-alert.el-alert--error {
  background-color: #fff0f0; /* 浅红色 */
  color: #cf1322; /* 红色字体 */
  border-color: #ffa39e; /* 红色边框 */
}

/* 拖拽上传区域容器居中 */
.upload-area-center {
  display: flex; /* 启用 Flex 布局 */
  flex-direction: column; /* 垂直排列子项 */
  align-items: center; /* 水平居中 */
  margin-bottom: 20px;
}

/* 拖拽上传区域 */
.full-width-upload {
  width: 100%;
}
/* 确保 el-upload-dragger 在 form-item 中能正确居中 */
.upload-area-center :deep(.el-upload) {
  width: 100%;
  max-width: 550px; /* 继承自拖拽框的最大宽度，保持一致 */
  display: flex;
  flex-direction: column; /* 确保内部元素垂直堆叠 */
  align-items: center; /* 确保拖拽框和列表在 upload 容器中居中 */
}

.full-width-upload :deep(.el-upload-dragger) {
  padding: 40px 20px; /* 增加拖拽区域的内边距 */
  border-radius: 12px; /* 匹配卡片的圆角 */
  border: 2px dashed #a4d8ff; /* 蓝色虚线边框 */
  background-color: #f7fcff; /* 浅蓝色背景 */
  transition:
    border-color 0.3s,
    background-color 0.3s,
    box-shadow 0.3s;
  max-width: 550px; /* 限制拖拽框宽度 */
  width: 100%; /* 确保在 max-width 范围内铺满 */
}

.full-width-upload :deep(.el-upload-dragger:hover) {
  border-color: #409eff; /* 悬停时边框变深 */
  background-color: #e6f7ff; /* 悬停时背景更蓝 */
  box-shadow: 0 0 15px rgba(64, 158, 255, 0.15); /* 增加阴影 */
}

.beautiful-upload-icon {
  font-size: 60px; /* 增大图标 */
  color: #409eff; /* 蓝色图标 */
  margin-bottom: 15px;
}

.beautiful-upload-text {
  font-size: 1.1rem; /* 增大文字 */
  color: #606266;
  font-weight: 500;
}

.beautiful-upload-text em {
  color: #409eff; /* 强调文字蓝色 */
  font-weight: 700;
  font-style: normal;
}

/* 居中提示文字 */
.beautiful-tip {
  color: #909399;
  font-size: 0.85rem;
  margin-top: 10px;
  text-align: center;
  max-width: 550px;
  width: 100%;
}

/* 居中文件列表 */
.upload-area-center :deep(.el-upload-list) {
  width: 100%;
  max-width: 550px; /* 限制宽度与上传框一致 */
  margin: 10px auto 0; /* 使用 auto 左右外边距实现居中 */
  padding: 0;
}

/* 确保列表项内容居中 */
.upload-area-center :deep(.el-upload-list__item) {
  /* 列表项的居中可以根据需要调整，默认列表项是左对齐的 */
  justify-content: center;
}

/* 上传按钮容器 */
.upload-button-container {
  margin-top: 30px !important; /* 增加与上方区域的间距 */
}

/* 上传按钮样式 */
.beautiful-upload-btn {
  width: 100%;
  padding: 15px 20px; /* 增大按钮尺寸 */
  font-size: 1.1rem; /* 增大文字 */
  font-weight: 600;
  border-radius: 10px; /* 圆角 */
  background: linear-gradient(45deg, #409eff, #79bbff); /* 渐变色 */
  border: none;
  box-shadow: 0 5px 15px rgba(64, 158, 255, 0.3); /* 按钮阴影 */
  transition: all 0.3s ease-in-out;
}

.beautiful-upload-btn:hover:not(:disabled) {
  transform: translateY(-3px); /* 悬停时上浮效果 */
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.4); /* 悬停时阴影更明显 */
  filter: brightness(1.05); /* 稍微提亮 */
}

.beautiful-upload-btn:active:not(:disabled) {
  transform: translateY(-1px); /* 点击时下沉效果 */
  box-shadow: 0 3px 10px rgba(64, 158, 255, 0.2);
}

/* 2. 移除加载图标的旋转动画，因为我们不手动添加加载图标了 */
.beautiful-upload-btn :deep(.el-icon) {
  margin-right: 8px; /* 图标与文字间距 */
  font-size: 1.2rem;
}

/* 新增的样式: 结果展示 */
.result-display {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
}
.image-box {
  width: 45%;
  text-align: center;
}
.image-box h3 {
  font-size: 1rem;
  color: #606266;
  margin-bottom: 10px;
}
.image-box img {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  background-color: #f5f7fa; /* 为透明 PNG 添加浅色背景 */
}
</style>
