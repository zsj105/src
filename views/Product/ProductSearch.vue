<template>
  <div class="product-search-container p-6 bg-gray-50 min-h-screen">
    <el-card class="mb-6 shadow-lg">
      <template #header>
        <div class="text-lg font-bold">搜索条件</div>
      </template>

      <el-form :model="searchParams" label-position="top" class="search-form">
        <el-row :gutter="20">
          <el-col :span="6" v-for="field in searchFields" :key="field.key">
            <el-form-item :label="field.label">
              <template v-if="['bzsname', 'gdyname', 'cgztname'].includes(field.key)">
                <el-input
                  :model-value="getSelectedDisplay(field.key)"
                  :placeholder="field.label + ' (点击多选)'"
                  readonly
                  clearable
                  @click="openSelectDialog(field.key, field.label)"
                  @clear="searchParams[field.key] = []"
                  @keyup.enter="handleSearch(1)"
                  style="width: 100%"
                >
                  <template #suffix>
                    <el-icon class="el-input__icon"><Search /></el-icon>
                  </template>
                </el-input>
              </template>

              <template v-else-if="field.key === 'PurchaseMode'">
                <el-select
                  v-model="searchParams.PurchaseMode"
                  placeholder="请选择"
                  clearable
                  multiple
                  collapse-tags
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in purchaseModeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </template>

              <template v-else>
                <el-input
                  v-model="searchParams[field.key]"
                  clearable
                  :placeholder="'请输入' + field.label"
                  @keyup.enter="handleSearch(1)"
                />
              </template>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="&nbsp;">
              <div class="flex justify-end space-x-4 w-full">
                <el-button
                  type="primary"
                  :loading="isLoading"
                  @click="handleSearch(1)"
                  class="gradient-search-btn"
                >
                  <el-icon><Search /></el-icon> 搜索
                </el-button>
                <el-button @click="resetSearch">重置</el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card v-loading="isLoading" class="shadow-lg result-table-card">
      <template #header>
        <div class="flex justify-between items-center result-header-flex">
          <span class="text-lg font-bold">查询结果</span>

          <div class="flex items-center space-x-4">
            <el-select
              v-model="selectedExportType"
              placeholder="请选择导出类型"
              size="large"
              style="width: 200px"
              :disabled="isExporting || totalCount === 0"
            >
              <el-option
                v-for="item in exportTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-tag v-if="isExporting" type="warning" size="large">{{
              exportStatusMessage
            }}</el-tag>

            <el-button
              type="success"
              size="large"
              :loading="isExporting"
              :disabled="isExporting || totalCount === 0"
              @click="handleExport"
            >
              <el-icon><Download /></el-icon>
              {{
                isExporting
                  ? '导出中...'
                  : selectedProductNos.length > 0
                    ? '导出已选 (' + selectedProductNos.length + ')'
                    : '导出全部 (' + totalCount + ')'
              }}
            </el-button>
          </div>
        </div>
      </template>

      <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon class="mb-4" />
      <el-alert
        v-if="totalCount === 0 && !isLoading"
        title="没有找到符合条件的商品数据。"
        type="info"
        show-icon
        class="mb-4"
      />

      <el-table
        :data="products"
        v-loading="isLoading"
        style="width: 100%"
        stripe
        border
        size="small"
        max-height="650"
        :header-cell-style="{ backgroundColor: '#f5f7fa', color: '#606266', textAlign: 'center' }"
        @selection-change="handleSelectionChange"
        class="custom-data-table"
      >
        <el-table-column type="selection" width="40" fixed align="center" />

        <el-table-column
          v-for="col in tableColumns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :min-width="col.minWidth"
          :align="col.align"
          :header-align="col.headerAlign"
        >
          <template #default="{ row }">
            <div v-if="col.prop === '主图'" class="flex justify-center items-center">
              <el-button
                link
                type="primary"
                :icon="Picture"
                @click="handleImagePreview(row[col.prop])"
                :disabled="!row[col.prop]"
                size="small"
              >
                {{ row[col.prop] ? '预览' : '无图' }}
              </el-button>
            </div>

            <div v-else-if="col.prop === '审核状态'" class="flex justify-center">
              <el-tag :type="auditStatusMap[row[col.prop]]?.tag || 'info'" size="small">
                {{ auditStatusMap[row[col.prop]]?.label || '未知' }}
              </el-tag>
            </div>

            <div v-else class="truncate-text" :style="{ textAlign: col.align }">
              {{ row[col.prop] }}
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end mt-4">
        <el-pagination
          @size-change="((pageSize = $event), handleSearch(1))"
          @current-change="handleSearch"
          :current-page="currentPage"
          :page-sizes="[20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalCount"
        />
      </div>
    </el-card>

    <el-dialog v-model="showImageDialog" title="主图预览" width="60%" top="5vh" destroy-on-close>
      <div class="flex justify-center items-center">
        <img
          :src="currentImageUrl"
          alt="主图预览"
          style="max-width: 100%; max-height: 80vh; object-fit: contain"
        />
      </div>
    </el-dialog>

    <el-dialog v-model="dialogVisible" :title="dialogTitle + '选择'" width="500px" destroy-on-close>
      <div class="flex flex-col space-y-4">
        <el-input
          v-model="dialogSearchQuery"
          :placeholder="'请输入' + dialogTitle + '名称进行搜索 (中文匹配)'"
          clearable
          @keyup.enter="handleDialogSearch"
          style="width: 100%"
        >
          <template #append>
            <el-button :loading="dialogLoading" @click="loadDialogOptions(1)">
              <el-icon><Search /></el-icon> 搜索
            </el-button>
          </template>
        </el-input>

        <el-table
          :data="dialogOptions"
          v-loading="dialogLoading"
          max-height="300"
          border
          size="small"
          @selection-change="handleDialogSelectionChange"
          ref="dialogTableRef"
          style="width: 100%"
        >
          <el-table-column type="selection" width="40" />
          <el-table-column :prop="dialogLabelKey" :label="dialogTitle" min-width="120" />
        </el-table>

        <div class="flex justify-end">
          <el-pagination
            size="small"
            layout="prev, pager, next, total"
            :total="dialogTotalCount"
            :page-size="dialogPageSize"
            :current-page="dialogCurrentPage"
            @current-change="loadDialogOptions"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDialogSelection">
          确定 (已选 {{ dialogSelectedItems.length }} 项)
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Search, Download, Picture } from '@element-plus/icons-vue'

import {
  searchProducts,
  searchBzs,
  searchGdy,
  searchCgzt,
  submitExport,
  getExportStatus,
  getPicPreviewUrl,
} from '../../services/api/product.js'

// --- 异步导出任务状态 ---
const isExporting = ref(false)
const exportTaskId = ref(null)
const exportStatusMessage = ref('')
let pollingTimer = null

// --- 🎯 新增：导出类型选项和状态 ---
const exportTypeOptions = ref([
  { label: '设计师提成分析', value: '1' },
  { label: '客户及bom商品清单', value: '2' }, // 对应上一轮修改的方法
])
const selectedExportType = ref('1') // 默认选中标准导出
// --- 🎯 结束新增 ---

// --- 状态 (主要搜索) ---
const isLoading = ref(false)
const errorMessage = ref('')
const products = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const selectedProductNos = ref([])
const columnNames = ref([])

// 图片预览状态
const showImageDialog = ref(false)
const currentImageUrl = ref('')

// 采购模式选项
const purchaseModeOptions = ref([
  { label: '包装', value: '包装' },
  { label: '成品', value: '成品' },
])

// 审核状态映射
const auditStatusMap = {
  0: { label: '草稿', tag: 'info' },
  1: { label: '提交', tag: 'warning' },
  2: { label: '通过', tag: 'success' },
}

// --- 状态 (Dialog Selection) ---
const dialogTableRef = ref(null)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogSearchQuery = ref('')
const dialogCurrentPage = ref(1)
const dialogPageSize = ref(10)
const dialogTotalCount = ref(0)
const dialogLoading = ref(false)
const dialogOptions = ref([])
const currentSelectingField = ref('')
const dialogLabelKey = ref('label')
const dialogSelectedItems = ref([])

// 搜索字段定义 (保持不变)
const searchFields = reactive([
  { key: 'item_no', label: '商品编号' },
  { key: 'ProNo', label: '助记符' },
  { key: 'cust_item_no', label: '客户货号' },
  { key: 'PurchaseMode', label: '采购模式' },
  { key: 'cgztname', label: '采购主体' },
  { key: 'cply', label: '产品来源' },
  { key: 'gdyname', label: '跟单员' },
  { key: 'Item_Invoice_Name', label: '开票品名' },
  { key: 'preferred_supplier', label: '首选供应商' },
  { key: 'bzsname', label: '包装商' },
  { key: 'BriefName', label: '客户简称' },
])

// 搜索参数
const searchParams = reactive({
  item_no: '',
  ProNo: '',
  cust_item_no: '',
  PurchaseMode: [],
  cgztname: [],
  cply: '',
  gdyname: [],
  Item_Invoice_Name: '',
  preferred_supplier: '',
  bzsname: [],
  BriefName: '',
})

// --- 计算属性 (表格列定义) ---
const tableColumns = computed(() => {
  if (!columnNames.value || columnNames.value.length === 0) {
    return []
  }

  const filteredColumns = columnNames.value.filter((col) => col !== 'Fid' && col !== 'cgzt')

  return filteredColumns.map((key) => {
    let align = 'left'
    let minWidth = key.length * 20 + 40

    if (
      [
        '默认成本价',
        '包装费',
        '占比1',
        '占比2',
        '占比3',
        '占比4',
        '占比5',
        '占比6',
        '审核状态',
      ].includes(key)
    ) {
      align = 'center'
    } else if (['主图'].includes(key)) {
      align = 'center'
      minWidth = 100
    }

    return {
      prop: key,
      label: key,
      minWidth: minWidth,
      headerAlign: 'center',
      align: align,
    }
  })
})

// --- 辅助方法 (保持不变) ---
const getSelectedDisplay = (key) => {
  const selected = searchParams[key]
  if (!Array.isArray(selected) || selected.length === 0) return ''
  if (selected.length === 1) return selected[0]
  return `${selected.slice(0, 2).join('; ')}... (共${selected.length}项)`
}

const handleImagePreview = (PicPath) => {
  if (!PicPath) {
    ElMessage.warning('该商品无主图信息。')
    return
  }
  currentImageUrl.value = getPicPreviewUrl(PicPath)
  showImageDialog.value = true
}

const handleSelectionChange = (selection) => {
  // 假设表格数据中包含 '产品编号' 字段
  selectedProductNos.value = selection.map((item) => item.产品编号)
}

const resetSearch = () => {
  Object.keys(searchParams).forEach((key) => {
    if (['PurchaseMode', 'gdyname', 'bzsname', 'cgztname'].includes(key)) {
      searchParams[key] = []
    } else {
      searchParams[key] = ''
    }
  })
  currentPage.value = 1
  pageSize.value = 20
}

const openSelectDialog = (fieldKey, fieldLabel) => {
  currentSelectingField.value = fieldKey
  dialogTitle.value = fieldLabel

  dialogSearchQuery.value = ''
  dialogCurrentPage.value = 1
  dialogOptions.value = []

  // 复制当前已选中的值
  dialogSelectedItems.value = [...searchParams[fieldKey]]

  dialogLabelKey.value = 'label'

  dialogVisible.value = true
  loadDialogOptions(dialogCurrentPage.value)
}

const handleDialogSearch = () => {
  loadDialogOptions(1)
}

const loadDialogOptions = async (page = 1) => {
  dialogCurrentPage.value = page
  dialogLoading.value = true
  dialogOptions.value = []

  const searchApiMap = {
    bzsname: searchBzs,
    gdyname: searchGdy,
    cgztname: searchCgzt,
  }

  const searchFunction = searchApiMap[currentSelectingField.value]
  if (!searchFunction) {
    dialogLoading.value = false
    ElMessage.error('字段配置错误')
    return
  }

  const requestBody = {
    query: dialogSearchQuery.value,
    page: dialogCurrentPage.value,
    pageSize: dialogPageSize.value,
  }

  try {
    const response = await searchFunction(requestBody)

    if (response && !response.error) {
      dialogOptions.value = response.data || []
      dialogTotalCount.value = response.total_count || 0

      // 确保在数据加载后，同步对话框的选中状态
      nextTick(() => {
        if (dialogTableRef.value) {
          dialogOptions.value.forEach((row) => {
            const isSelected = dialogSelectedItems.value.includes(row[dialogLabelKey.value])
            if (isSelected) {
              dialogTableRef.value.toggleRowSelection(row, true)
            } else {
              dialogTableRef.value.toggleRowSelection(row, false)
            }
          })
        }
      })
    } else {
      ElMessage.error(response?.detail || `加载${dialogTitle.value}列表失败`)
    }
  } catch (e) {
    console.error(`加载${dialogTitle.value}列表失败`, e)
    ElMessage.error(`请求${dialogTitle.value}列表失败: ${e.message}`)
  } finally {
    dialogLoading.value = false
  }
}

const handleDialogSelectionChange = (selection) => {
  const currentPageLabels = dialogOptions.value.map((item) => item[dialogLabelKey.value])
  const newlySelectedLabels = selection.map((item) => item[dialogLabelKey.value])

  // 过滤掉当前页未被选中的旧选项
  const updatedSelected = dialogSelectedItems.value.filter(
    (label) => !currentPageLabels.includes(label) || newlySelectedLabels.includes(label),
  )

  // 添加当前页新增的选项
  newlySelectedLabels.forEach((label) => {
    if (!updatedSelected.includes(label)) {
      updatedSelected.push(label)
    }
  })

  dialogSelectedItems.value = updatedSelected
}

const confirmDialogSelection = () => {
  if (currentSelectingField.value) {
    searchParams[currentSelectingField.value] = dialogSelectedItems.value
    dialogVisible.value = false
  }
}

const handleSearch = async (page = 1) => {
  currentPage.value = page
  isLoading.value = true
  errorMessage.value = ''
  products.value = []
  totalCount.value = 0
  columnNames.value = []

  const requestBody = {
    ...searchParams,
    page: currentPage.value,
    pageSize: pageSize.value,
  }

  try {
    const response = await searchProducts(requestBody)

    if (response && !response.error) {
      products.value = response.data || []
      totalCount.value = response.total_count || 0

      if (response.columns) {
        columnNames.value = response.columns
      }
    } else {
      errorMessage.value = response?.detail || '查询失败，请稍后重试。'
      ElMessage.error(errorMessage.value)
    }
  } catch (error) {
    console.error('搜索失败:', error)
    const errorDetail = error.message
    errorMessage.value = `搜索请求失败: ${errorDetail}`
    ElMessage.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

// --- 异步导出逻辑 (修改 handleExport) ---
const handleExport = async () => {
  if (totalCount.value === 0) {
    ElMessage.warning('当前没有数据可以导出。')
    return
  }

  if (isExporting.value) {
    ElMessage.warning('导出任务正在进行中，请勿重复操作。')
    return
  }

  const isExportingSelected = selectedProductNos.value.length > 0
  const countToExport = isExportingSelected ? selectedProductNos.value.length : totalCount.value

  // 🎯 新增：获取选中的导出类型名称用于提示
  const selectedTypeLabel =
    exportTypeOptions.value.find((o) => o.value === selectedExportType.value)?.label || '未知类型'

  // 1. 构造请求体：适配后端 ExportRequest 模型
  let requestBody = {}
  if (isExportingSelected) {
    // 导出已选数据：只传递产品编号列表
    requestBody = {
      product_nos: selectedProductNos.value,
      export_all: false,
    }
  } else {
    // 导出全部数据：传递搜索条件
    requestBody = {
      ...searchParams,
      export_all: true,
      product_nos: null, // 确保 product_nos 为空
    }
  }
  // 清理 page/pageSize 以确保后端使用搜索条件
  delete requestBody.page
  delete requestBody.pageSize

  // 🎯 核心修改：添加 export_type 字段到请求体
  requestBody.export_type = selectedExportType.value

  // 2. 确认并发送请求 (替换了同步下载逻辑)
  ElMessageBox.confirm(
    // 🎯 修改确认消息，包含导出类型
    `确定使用【${selectedTypeLabel}】导出 ${countToExport} 条数据吗？`,
    '确认导出',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  )
    .then(async () => {
      isExporting.value = true // 标记导出状态，禁用按钮
      exportStatusMessage.value = '任务提交中...'

      ElNotification({
        title: '导出任务提交',
        message: `任务 (${selectedTypeLabel}) 已提交到后台线程，请等待通知。`,
        type: 'info',
        duration: 3000,
      })

      try {
        const response = await submitExport(requestBody)
        const task = response

        exportTaskId.value = task.id
        localStorage.setItem('activeExportTaskId', task.id) // 存储任务ID
        startPolling() // 启动轮询机制
      } catch (error) {
        isExporting.value = false
        localStorage.removeItem('activeExportTaskId') // 清除存储的任务ID
        exportStatusMessage.value = ''
        console.error('导出提交失败:', error)
        ElMessage.error(`提交导出任务失败: ${error.message}`)
      }
    })
    .catch(() => {
      // 取消导出
    })
}

/**
 * 启动轮询：查询任务状态。
 * 在任务成功时，直接触发浏览器下载。
 */
const startPolling = () => {
  // 每次启动前，先清除旧的定时器
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }

  // 使用 5 秒轮询间隔
  pollingTimer = setInterval(async () => {
    if (!exportTaskId.value) {
      clearInterval(pollingTimer)
      return
    }

    try {
      // 轮询状态路由: /api/product/export_status/{task_id}
      const response = await getExportStatus(exportTaskId.value)
      const task = response

      if (task.status === 'SUCCESS') {
        // 1. 任务成功：停止轮询，重置状态
        clearInterval(pollingTimer)
        pollingTimer = null
        isExporting.value = false
        localStorage.removeItem('activeExportTaskId') // 清除存储的任务ID
        exportStatusMessage.value = '文件生成成功'

        // 2. 检查后端返回的 JSON 中是否包含 'filename'
        if (task.filename) {
          // 3. 构建附件下载 URL
          const downloadUrl = `/api/product/attachments/${encodeURIComponent(task.filename)}`

          // 4. 创建 <a> 标签并模拟点击以下载文件
          const link = document.createElement('a')
          link.href = downloadUrl

          // 'download' 属性建议浏览器下载，使用友好文件名
          link.setAttribute('download', task.filename)

          document.body.appendChild(link)
          link.click()

          // 清理 DOM
          document.body.removeChild(link)
          link.remove() // 现代浏览器

          ElNotification.success({
            title: '导出成功',
            message: `文件 ${task.filename} 已开始下载。`,
            duration: 5000,
          })
        } else {
          // 虽然后端返回 SUCCESS，但 JSON 中缺少 filename
          exportStatusMessage.value = '任务失败: 后端未返回文件。'
          ElNotification.error({
            title: '导出失败',
            message: '任务成功，但服务器未提供有效的文件名。',
            duration: 0, // 永久显示
          })
        }
      } else if (task.status === 'FAILURE') {
        // 任务失败 (此部分保持不变)
        clearInterval(pollingTimer)
        pollingTimer = null
        isExporting.value = false
        localStorage.removeItem('activeExportTaskId') // 清除存储的任务ID
        exportStatusMessage.value = `任务失败: ${task.message}`
        ElNotification.error({
          title: '导出失败',
          message: `任务执行失败: ${task.message}`,
          duration: 0, // 永久显示
        })
      } else {
        // PENDING 或 RUNNING 状态，给出提示 (此部分保持不变)
        exportStatusMessage.value = `任务状态: ${task.status} - ${task.message}`
        ElMessage.info({
          message: exportStatusMessage.value,
          duration: 2500,
          grouping: true, // 相似消息只显示一条
        })
      }
    } catch (error) {
      // 捕获轮询错误
      clearInterval(pollingTimer)
      pollingTimer = null
      isExporting.value = false
      localStorage.removeItem('activeExportTaskId') // 清除存储的任务ID
      exportStatusMessage.value = `查询失败: ${error.message || '网络错误'}`

      const message = error.message || '未知错误'
      ElMessage.error(`查询任务状态失败: ${message}`)
    }
  }, 5000) // 5秒轮询间隔
}

// --- 生命周期 ---
onMounted(() => {
  handleSearch()

  // 检查是否有未完成的导出任务
  const storedTaskId = localStorage.getItem('activeExportTaskId')
  if (storedTaskId) {
    exportTaskId.value = storedTaskId
    isExporting.value = true
    exportStatusMessage.value = '任务恢复中，正在查询后台进度...'
    startPolling() // 重新启动轮询
  }
})

// 【关键】组件卸载前清理定时器
onBeforeUnmount(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
})
</script>

<style scoped>
/* --- 布局样式 --- */
.product-search-container {
  background-color: #fcfcfc; /* 使用更浅的背景 */
}

/* 提升卡片样式 */
.product-search-container :deep(.el-card) {
  border-radius: 12px; /* 圆角增大 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); /* 柔和的阴影 */
}

/* 突出卡片头部：渐变分割线 */
.product-search-container :deep(.el-card__header) {
  border-bottom: 2px solid transparent;
  background-image: linear-gradient(to right, #409eff 0%, #a4e4ff 100%); /* 蓝色渐变 */
  background-repeat: no-repeat;
  background-position: bottom;
  background-size: 100% 2px;
  padding-bottom: 12px; /* 增加标题底部空间 */
}

/* 统一表单项间距 */
.search-form :deep(.el-form-item) {
  margin-bottom: 16px; /* 略微增大间距 */
}

/* 统一输入框/选择器样式 */
.search-form :deep(.el-input__wrapper),
.search-form :deep(.el-select__wrapper) {
  background-color: #f7f9fa; /* 浅色背景 */
  border-radius: 8px;
  /* 边框默认使用浅色 */
  box-shadow: 0 0 0 1px #e3e8ee inset;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

/* 聚焦时的 '绚丽' 效果 */
.search-form :deep(.el-input__wrapper.is-focus),
.search-form :deep(.el-select__wrapper.is-focused) {
  /* 边框高亮颜色改为 Element Plus 主色 */
  box-shadow:
    0 0 0 1px #409eff inset,
    0 0 8px rgba(64, 158, 255, 0.3);
  background-color: #ffffff; /* 聚焦时变白 */
}

/* 搜索按钮渐变效果 */
.gradient-search-btn {
  /* 覆盖 Element Plus 的背景和边框 */
  background: linear-gradient(45deg, #409eff, #79bbff);
  border: none;
  border-radius: 8px;
  /* 添加微弱的阴影 */
  box-shadow: 0 4px 6px rgba(64, 158, 255, 0.2);
  transition: all 0.3s;
}

.gradient-search-btn:hover {
  /* 鼠标悬停时的动画效果 */
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(64, 158, 255, 0.3);
}

/* 导出按钮的独特样式 */
.product-search-container :deep(.el-button--success) {
  border-radius: 8px; /* 匹配其他控件的圆角 */
  background-color: #67c23a;
  border-color: #67c23a;
}

/* --- 确保搜索按钮所在的 el-form-item 内容区域右对齐 --- */
.search-form :deep(.el-col:nth-last-child(1) .el-form-item__content) {
  width: 100% !important;
  display: flex;
  justify-content: flex-end;
}
/* ------------------------------------------- */

.result-table-card :deep(.el-card__header) > .result-header-flex {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
/* ------------------------------------------- */

/* --- 查询结果表格美化样式 (custom-data-table) --- */

.result-table-card :deep(.el-card__body) {
  padding: 10px 20px 20px 20px; /* 减少表格上方的内边距 */
}

.custom-data-table {
  border-radius: 8px; /* 统一圆角 */
  overflow: hidden; /* 确保圆角生效 */
  border: 1px solid #ebeef5;
}

/* 表头样式 */
.custom-data-table :deep(.el-table__header-wrapper th) {
  background-color: #eef1f6 !important; /* 浅灰色背景，比默认更清晰 */
  color: #333 !important; /* 深色文字 */
  font-weight: bold;
  padding: 10px 0; /* 增加垂直内边距 */
}

/* 表格行样式 */
.custom-data-table :deep(.el-table__row) {
  transition:
    background-color 0.3s,
    box-shadow 0.3s;
}

/* 悬停时的“绚丽”效果 */
.custom-data-table :deep(.el-table__row:hover) {
  background-color: #f0f8ff !important; /* 浅蓝色背景 */
  cursor: pointer;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.1); /* 柔和的蓝色阴影 */
}

/* 斑马纹行样式调整 */
.custom-data-table :deep(.el-table__row.el-table__row--striped) {
  background-color: #f7f9fc; /* 极浅的底色 */
}

/* 确保悬停效果覆盖斑马纹 */
.custom-data-table :deep(.el-table__row.el-table__row--striped:hover) {
  background-color: #f0f8ff !important;
}

/* 表格内单元格对齐与间距 */
.custom-data-table :deep(.el-table__cell) {
  padding: 8px 0;
}

/* 强制截断文本，实现悬停显示完整内容 */
.truncate-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.product-search-container :deep(.el-pagination) {
  display: flex;
}
.product-search-container :deep(.el-pager) {
  margin-left: auto;
}
</style>
