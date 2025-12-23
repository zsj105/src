<template>
  <!-- 1. 页面容器 -->
  <div class="page-container">
    <!-- 2. 搜索卡片 -->
    <el-card class="common-card shadow-lg">
      <template #header>
        <div>搜索条件</div>
      </template>

      <!-- 3. 表单 -->
      <el-form :model="searchParams" label-position="top" class="common-form">
        <el-row :gutter="20">
          <el-col :span="6" v-for="field in searchFields" :key="field.key">
            <el-form-item :label="field.label">
              <!-- 多选弹窗字段 -->
              <template v-if="['bzsname', 'gdyname', 'cgztname', 'salename'].includes(field.key)">
                <el-input
                  :model-value="getSelectedDisplay(field.key)"
                  :placeholder="field.label + ' (点击多选)'"
                  readonly
                  clearable
                  @click="openSelectDialog(field.key, field.label)"
                  @clear="searchParams[field.key] = []"
                  style="width: 100%"
                >
                  <template #suffix>
                    <el-icon class="el-input__icon"><Search /></el-icon>
                  </template>
                </el-input>
              </template>

              <!-- 下拉选择 -->
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

              <!-- 普通输入 -->
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

    <!-- 4. 结果表格卡片 -->
    <el-card v-loading="isLoading" class="common-card shadow-lg result-table-card">
      <template #header>
        <div class="flex justify-between items-center result-header-flex">
          <span class="font-bold">查询结果</span>

          <div class="flex items-center space-x-4">
            <el-select
              v-model="selectedExportType"
              placeholder="请选择导出类型"
              size="large"
              style="width: 200px"
              :disabled="isExporting || totalCount === 0"
              class="common-form"
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

      <!-- 5. 表格 -->
      <el-table
        :data="products"
        v-loading="isLoading"
        style="width: 100%"
        stripe
        border
        size="small"
        max-height="650"
        @selection-change="handleSelectionChange"
        class="common-table"
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
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalCount"
        />
      </div>
    </el-card>

    <!-- 图片预览弹窗 -->
    <el-dialog v-model="showImageDialog" title="主图预览" width="60%" top="5vh" destroy-on-close>
      <div class="flex justify-center items-center">
        <img
          :src="currentImageUrl"
          alt="主图预览"
          style="max-width: 100%; max-height: 80vh; object-fit: contain"
        />
      </div>
    </el-dialog>

    <!-- 选择弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle + '选择'" width="600px" destroy-on-close>
      <div class="flex flex-col space-y-4">
        <el-input
          v-model="dialogSearchQuery"
          :placeholder="'请输入' + dialogTitle + '名称搜索'"
          clearable
          @keyup.enter="handleDialogSearch"
          style="width: 100%"
          class="common-form"
        >
          <template #append>
            <el-button :loading="dialogLoading" @click="loadDialogOptions(1)">
              <el-icon><Search /></el-icon> 搜索
            </el-button>
          </template>
        </el-input>

        <div
          v-if="dialogSelectedItems.length > 0"
          class="selected-tags-container p-3 rounded border shadow-sm"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs text-blue-custom font-bold">已选择 (跨页有效):</span>
            <span class="text-xs text-gray-custom">{{ dialogSelectedItems.length }} 项</span>
          </div>
          <div class="flex flex-wrap gap-2" style="max-height: 100px; overflow-y: auto">
            <el-tag
              v-for="item in dialogSelectedItems"
              :key="item"
              closable
              effect="light"
              size="small"
              @close="removeItemFromSelection(item)"
            >
              {{ item }}
            </el-tag>
          </div>
        </div>

        <el-table
          :data="dialogOptions"
          v-loading="dialogLoading"
          max-height="300"
          border
          size="small"
          @selection-change="handleDialogSelectionChange"
          ref="dialogTableRef"
          style="width: 100%"
          class="common-table"
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
        <div class="flex justify-between w-full">
          <el-button
            type="danger"
            plain
            link
            @click="clearAllDialogSelection"
            :disabled="dialogSelectedItems.length === 0"
          >
            清空已选
          </el-button>
          <div>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmDialogSelection">
              确定 (已选 {{ dialogSelectedItems.length }} 项)
            </el-button>
          </div>
        </div>
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
  searchYwy,
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

const exportTypeOptions = ref([
  { label: '设计师提成分析', value: '1' },
  { label: '客户及bom商品清单', value: '2' },
])
const selectedExportType = ref('1')

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

// 搜索字段定义 (已加 salename)
const searchFields = reactive([
  { key: 'item_no', label: '商品编号' },
  { key: 'ProNo', label: '助记符' },
  { key: 'cust_item_no', label: '客户货号' },
  { key: 'PurchaseMode', label: '采购模式' },
  { key: 'cgztname', label: '采购主体' },
  { key: 'cply', label: '产品来源' },
  { key: 'gdyname', label: '跟单员' },
  { key: 'salename', label: '业务员' },
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
  salename: [],
  Item_Invoice_Name: '',
  preferred_supplier: '',
  bzsname: [],
  BriefName: '',
})

// --- 计算属性 ---
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

// --- 辅助方法 ---
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
  selectedProductNos.value = selection.map((item) => item.商品编号 || item.item_no || item.ItemNo)
}

const resetSearch = () => {
  Object.keys(searchParams).forEach((key) => {
    if (['PurchaseMode', 'gdyname', 'bzsname', 'cgztname', 'salename'].includes(key)) {
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
    salename: searchYwy,
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
      nextTick(() => {
        syncTableSelection()
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

const syncTableSelection = () => {
  if (dialogTableRef.value) {
    dialogOptions.value.forEach((row) => {
      const isSelected = dialogSelectedItems.value.includes(row[dialogLabelKey.value])
      dialogTableRef.value.toggleRowSelection(row, isSelected)
    })
  }
}

const removeItemFromSelection = (label) => {
  dialogSelectedItems.value = dialogSelectedItems.value.filter((item) => item !== label)
  if (dialogTableRef.value) {
    const rowInTable = dialogOptions.value.find((row) => row[dialogLabelKey.value] === label)
    if (rowInTable) {
      dialogTableRef.value.toggleRowSelection(rowInTable, false)
    }
  }
}

const clearAllDialogSelection = () => {
  dialogSelectedItems.value = []
  if (dialogTableRef.value) {
    dialogTableRef.value.clearSelection()
  }
}

const handleDialogSelectionChange = (selection) => {
  const currentSelectionLabels = selection.map((item) => item[dialogLabelKey.value])
  const currentPageAllLabels = dialogOptions.value.map((item) => item[dialogLabelKey.value])
  const otherPageSelections = dialogSelectedItems.value.filter(
    (label) => !currentPageAllLabels.includes(label)
  )
  dialogSelectedItems.value = [...otherPageSelections, ...currentSelectionLabels]
}

const confirmDialogSelection = () => {
  if (currentSelectingField.value) {
    searchParams[currentSelectingField.value] = dialogSelectedItems.value
    dialogVisible.value = false
  }
}

// 🌟 分页处理逻辑
const handlePageChange = (val) => {
  handleSearch()
}

const handleSizeChange = (val) => {
  currentPage.value = 1
  handleSearch()
}

const handleSearch = async (forcePageOne = false) => {
  if (forcePageOne === 1 || forcePageOne === true) {
    currentPage.value = 1
  }

  isLoading.value = true
  errorMessage.value = ''
  products.value = []
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
      // 强制转Number
      totalCount.value = Number(response.total_count) || 0
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
  const selectedTypeLabel =
    exportTypeOptions.value.find((o) => o.value === selectedExportType.value)?.label || '未知类型'

  let requestBody = {}
  if (isExportingSelected) {
    requestBody = { product_nos: selectedProductNos.value, export_all: false }
  } else {
    requestBody = { ...searchParams, export_all: true, product_nos: null }
  }
  delete requestBody.page
  delete requestBody.pageSize
  requestBody.export_type = selectedExportType.value

  ElMessageBox.confirm(
    `确定使用【${selectedTypeLabel}】导出 ${countToExport} 条数据吗？`,
    '确认导出',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  )
    .then(async () => {
      isExporting.value = true
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
        localStorage.setItem('activeExportTaskId', task.id)
        startPolling()
      } catch (error) {
        isExporting.value = false
        localStorage.removeItem('activeExportTaskId')
        exportStatusMessage.value = ''
        console.error('导出提交失败:', error)
        ElMessage.error(`提交导出任务失败: ${error.message}`)
      }
    })
    .catch(() => {})
}

const startPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
  pollingTimer = setInterval(async () => {
    if (!exportTaskId.value) {
      clearInterval(pollingTimer)
      return
    }
    try {
      const response = await getExportStatus(exportTaskId.value)
      const task = response
      if (task.status === 'SUCCESS') {
        clearInterval(pollingTimer)
        pollingTimer = null
        isExporting.value = false
        localStorage.removeItem('activeExportTaskId')
        exportStatusMessage.value = '文件生成成功'
        if (task.filename) {
          const downloadUrl = `/api/product/attachments/${encodeURIComponent(task.filename)}`
          const link = document.createElement('a')
          link.href = downloadUrl
          link.setAttribute('download', task.filename)
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          link.remove()
          ElNotification.success({
            title: '导出成功',
            message: `文件 ${task.filename} 已开始下载。`,
            duration: 5000,
          })
        } else {
          exportStatusMessage.value = '任务失败: 后端未返回文件。'
          ElNotification.error({
            title: '导出失败',
            message: '任务成功，但服务器未提供有效的文件名。',
            duration: 0,
          })
        }
      } else if (task.status === 'FAILURE') {
        clearInterval(pollingTimer)
        pollingTimer = null
        isExporting.value = false
        localStorage.removeItem('activeExportTaskId')
        exportStatusMessage.value = `任务失败: ${task.message}`
        ElNotification.error({
          title: '导出失败',
          message: `任务执行失败: ${task.message}`,
          duration: 0,
        })
      } else {
        exportStatusMessage.value = `任务状态: ${task.status} - ${task.message}`
        ElMessage.info({
          message: exportStatusMessage.value,
          duration: 2500,
          grouping: true,
        })
      }
    } catch (error) {
      clearInterval(pollingTimer)
      pollingTimer = null
      isExporting.value = false
      localStorage.removeItem('activeExportTaskId')
      exportStatusMessage.value = `查询失败: ${error.message || '网络错误'}`
      ElMessage.error(`查询任务状态失败: ${error.message || '未知错误'}`)
    }
  }, 5000)
}

onMounted(() => {
  handleSearch()
  const storedTaskId = localStorage.getItem('activeExportTaskId')
  if (storedTaskId) {
    exportTaskId.value = storedTaskId
    isExporting.value = true
    exportStatusMessage.value = '任务恢复中，正在查询后台进度...'
    startPolling()
  }
})

onBeforeUnmount(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
})
</script>

<style scoped>
/*
  ✨ 本地样式：仅保留布局调整和特定组件样式
  ⚠️ 背景色、边框、表格颜色都移交给了 theme-custom.css
*/

/* 特殊渐变按钮 */
.gradient-search-btn {
  background: linear-gradient(45deg, #409eff, #79bbff);
  border: none;
  color: white;
  border-radius: 8px;
  transition: all 0.3s;
}
.gradient-search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(64, 158, 255, 0.3);
}

.result-table-card :deep(.el-card__header) > .result-header-flex {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.truncate-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 标签容器 - 使用变量适配 */
.selected-tags-container {
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}
.text-blue-custom {
  color: var(--el-color-primary);
}
.text-gray-custom {
  color: var(--el-text-color-secondary);
}

/* 弹窗样式补丁 */
.el-dialog :deep(.el-input-group__append button) {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
</style>
