<template>
  <div class="page-container">
    <el-card class="common-card shadow-lg">
      <template #header>
        <div>外销出运单查询条件</div>
      </template>

      <el-form
        :model="searchParams"
        label-position="left"
        label-width="100px"
        class="common-form search-form"
      >
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="起始时间">
              <el-date-picker
                v-model="searchParams.startDate"
                type="date"
                placeholder="选择起始日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                clearable
                @keyup.enter="handleSearch(1)"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="结束时间">
              <el-date-picker
                v-model="searchParams.endDate"
                type="date"
                placeholder="选择结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                clearable
                @keyup.enter="handleSearch(1)"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8" class="flex justify-start items-start pt-1">
            <el-button
              type="primary"
              :icon="Search"
              @click="handleSearch(1)"
              :loading="isSearching"
            >
              查询
            </el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card class="common-card shadow-lg" v-loading="isSearching">
      <template #header>
        <div class="card-header">
          <span class="font-bold">查询结果 (共 {{ total }} 条)</span>

          <el-button
            type="success"
            :icon="Download"
            @click="handleSubmitExport"
            :loading="isExporting"
            :disabled="total === 0 || isExporting"
            class="export-btn"
          >
            {{ isExporting ? '导出中...' : '导出全部数据' }}
          </el-button>
        </div>
      </template>

      <el-alert
        v-if="exportStatus.id"
        :title="exportStatus.message"
        :type="alertType"
        :closable="false"
        show-icon
        class="mb-3"
      />

      <el-table
        :data="tableData"
        border
        max-height="600"
        :empty-text="isSearching ? '正在查询数据...' : '暂无数据'"
        class="common-table"
      >
        <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />

        <el-table-column
          v-for="column in tableColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :min-width="column.minWidth"
          :align="column.align || 'left'"
          :header-align="column.headerAlign || 'center'"
          :fixed="column.fixed"
          show-overflow-tooltip
        />
      </el-table>

      <div class="pagination-container mt-4">
        <el-pagination
          v-if="total > 0"
          @size-change="handlePageSizeChange"
          @current-change="handleSearch"
          :current-page="searchParams.pageIndex"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="searchParams.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
        />
      </div>
    </el-card>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import { format } from 'date-fns'

// 假设这些 API 函数已在 './services/api/product.js' 中正确定义
import {
  searchShipmentSummaryList,
  submitShipmentExport,
  getExportStatus,
} from '../../services/api/product.js'

// --- 辅助函数：列样式定义 (保持不变) ---
const getStylingTemplates = () => {
  const templates = [
    { prop: '出运编号', label: '出运编号', minWidth: 120, fixed: 'left' },
    { prop: '混箱号', label: '混箱号', minWidth: 100, fixed: 'left' },
    { prop: '出运数量', label: '出运数量', minWidth: 100, align: 'right' },
    { prop: '采购金额', label: '采购金额', minWidth: 100, align: 'right' },
    { prop: '卡片费', label: '卡片费', minWidth: 100, align: 'right' },
    { prop: '包装费', label: '包装费', minWidth: 100, align: 'right' },
    { prop: '产品费', label: '产品费', minWidth: 100, align: 'right' },
    {
      prop: '采购总成本(含税)',
      label: '采购总成本(含税)',
      minWidth: 150,
      align: 'right',
      fixed: 'right',
    },
    { prop: '商品中文名', label: '商品中文名', minWidth: 150 },
    { prop: '分发发票号', label: '分发发票号', minWidth: 120 },
    { prop: '采购主体', label: '采购主体', minWidth: 160 },
    { prop: '供应商名称', label: '供应商名称', minWidth: 180 },
    { prop: '销售合同号', label: '销售合同号', minWidth: 120 },
    { prop: '采购合同号', label: '采购合同号', minWidth: 120 },
    { prop: '供应商退税率%', label: '供应商退税率%', minWidth: 120, align: 'right' },
    { prop: '报关退税率%', label: '报关退税率%', minWidth: 120, align: 'right' },
    { prop: '海关编码', label: '海关编码', minWidth: 120 },
    { prop: '报关中文名', label: '报关中文名', minWidth: 120 },
    { prop: '境内货源地', label: '境内货源地', minWidth: 100 },
    { prop: '备注', label: '备注', minWidth: 200 },
  ]

  return templates.reduce((map, col) => {
    map[col.prop] = col
    return map
  }, {})
}

// --- 状态定义 ---

const endDate = format(new Date(), 'yyyy-MM-dd')
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
const startDate = format(thirtyDaysAgo, 'yyyy-MM-dd')

const isSearching = ref(false)
const total = ref(0)
const tableData = ref([])
const columnKeys = ref([])

const searchParams = reactive({
  startDate: startDate,
  endDate: endDate,
  pageIndex: 1,
  pageSize: 20,
})

// *** 重构点 1: 异步导出状态 (与 ProductSearch.vue 统一) ***
const isExporting = ref(false) // 导出状态
const exportTaskId = ref(null) // 任务 ID
const exportStatusMessage = ref('') // 状态信息 (用于 ElMessage/ElNotification)

// 统一的异步导出状态对象 (用于 ElAlert 显示)
const exportStatus = reactive({
  id: null,
  status: null,
  message: null,
  filename: null,
})

let pollingTimer = null
const LOCAL_STORAGE_KEY = 'activeShipmentExportTaskId'

// --- 计算属性 (保持不变) ---

const alertType = computed(() => {
  if (exportStatus.status === 'SUCCESS') return 'success'
  if (exportStatus.status === 'FAILURE') return 'error'
  // 保持 PENDING/RUNNING 状态一致
  if (exportStatus.status === 'PENDING' || exportStatus.status === 'RUNNING') return 'info'
  return 'warning'
})

const tableColumns = computed(() => {
  if (columnKeys.value.length === 0) {
    return []
  }

  const stylingTemplates = getStylingTemplates()
  const columns = []

  const processedKeys = new Set()

  // 1. 先处理在模板中定义的列
  columnKeys.value.forEach((key) => {
    if (stylingTemplates[key]) {
      columns.push(stylingTemplates[key])
      processedKeys.add(key)
    }
  })

  // 2. 处理未在模板中定义但存在于数据中的列
  columnKeys.value.forEach((key) => {
    if (!processedKeys.has(key)) {
      const column = {
        prop: key,
        label: key,
        minWidth: 150,
        headerAlign: 'center',
        // 尝试根据列名判断是否为数值类型（金额、数量、百分比等）
        align: ['数量', '金额', '成本', '费', '率', '%'].some((suffix) => key.includes(suffix))
          ? 'right'
          : 'left',
      }
      columns.push(column)
    }
  })

  return columns
})

// --- 方法 ---

const handlePageSizeChange = (val) => {
  searchParams.pageSize = val
  handleSearch(1)
}

const handleReset = () => {
  const newEndDate = format(new Date(), 'yyyy-MM-dd')
  const newThirtyDaysAgo = new Date()
  newThirtyDaysAgo.setDate(newThirtyDaysAgo.getDate() - 30)
  const newStartDate = format(newThirtyDaysAgo, 'yyyy-MM-dd')

  searchParams.startDate = newStartDate
  searchParams.endDate = newEndDate
  searchParams.pageIndex = 1

  // 清理表格数据
  tableData.value = []
  total.value = 0
  columnKeys.value = []

  exportStatus.id = null
  exportStatus.status = null
  exportStatus.message = null
  exportStatus.filename = null

  isExporting.value = false
  exportTaskId.value = null // 清理任务 ID
  exportStatusMessage.value = ''

  stopPolling() // 停止轮询
  localStorage.removeItem(LOCAL_STORAGE_KEY)

  // 刷新表格
  handleSearch(1)
}

/**
 * 查询数据逻辑 (保持不变)
 */
const handleSearch = async (page = 1) => {
  if (!searchParams.startDate || !searchParams.endDate) {
    ElMessage.warning('请选择完整的起始时间和结束时间。')
    return
  }

  searchParams.pageIndex = page
  isSearching.value = true
  tableData.value = []
  columnKeys.value = []

  try {
    const apiResponse = await searchShipmentSummaryList(searchParams)

    const receivedData = apiResponse.data || []
    total.value = apiResponse.total || 0
    tableData.value = receivedData

    if (apiResponse.columns && apiResponse.columns.length > 0) {
      columnKeys.value = apiResponse.columns
    } else if (tableData.value.length > 0) {
      columnKeys.value = Object.keys(tableData.value[0])
    } else {
      columnKeys.value = []
    }
  } catch (error) {
    console.error('查询失败:', error)
    const errorMessage =
      error.response?.data?.detail || error.message || '查询数据失败，请检查网络和API服务。'
    ElMessage.error(errorMessage)
    tableData.value = []
    total.value = 0
    columnKeys.value = []
  } finally {
    isSearching.value = false
  }
}

// --- 异步导出逻辑 (与 ProductSearch.vue 保持一致的核心逻辑) ---

/**
 * 停止轮询定时器
 */
const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

/**
 * 启动轮询定时器
 */
const startPolling = () => {
  if (pollingTimer) return
  // 设置 5 秒轮询间隔
  pollingTimer = setInterval(checkExportStatus, 5000)
}

/**
 * 检查导出任务状态
 */
const checkExportStatus = async () => {
  // 检查任务 ID，如果丢失则停止轮询
  if (!exportTaskId.value) {
    // 使用 exportTaskId.value
    stopPolling()
    isExporting.value = false
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    exportStatus.id = null // 清理 ElAlert 状态
    return
  }

  try {
    // 使用 exportTaskId.value 进行查询
    const response = await getExportStatus(exportTaskId.value)
    const task = response

    // 更新 ElAlert 状态对象
    Object.assign(exportStatus, task)

    if (exportStatus.status === 'SUCCESS') {
      // 成功：停止轮询，清理状态，触发下载
      stopPolling()
      isExporting.value = false
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      exportStatusMessage.value = '文件生成成功' // 统一状态信息

      ElNotification({
        title: '导出成功',
        message: `文件已生成：${exportStatus.filename}，正在下载...`,
        type: 'success',
        duration: 5000,
      })

      // 统一的简洁下载逻辑 (与 ProductSearch.vue 保持一致)
      if (exportStatus.filename) {
        // 假设下载 API 端点
        const downloadUrl = `/api/product/attachments/${encodeURIComponent(exportStatus.filename)}`
        const link = document.createElement('a')
        link.href = downloadUrl
        link.setAttribute('download', exportStatus.filename)

        document.body.appendChild(link)
        link.click()

        document.body.removeChild(link)
        link.remove()
        ElMessage.success('文件下载完成！')
      } else {
        exportStatusMessage.value = '任务失败: 未返回文件。'
        ElMessage.error('任务成功，但服务器未提供有效的文件名。')
      }
    } else if (exportStatus.status === 'FAILURE') {
      // 失败：停止轮询，清理状态
      stopPolling()
      isExporting.value = false
      localStorage.removeItem(LOCAL_STORAGE_KEY)

      exportStatusMessage.value = `任务失败: ${exportStatus.message}`
      ElNotification.error({
        title: '导出失败',
        message: exportStatus.message,
        duration: 0,
      })
    } else {
      // PENDING 或 RUNNING 状态，持续提示
      exportStatus.message = `任务状态: ${task.status} - 正在后台处理...` // 更新 ElAlert message
      exportStatusMessage.value = exportStatus.message // 更新 ElTag message

      ElMessage.info({
        message: exportStatusMessage.value,
        duration: 2500,
        grouping: true,
      })
    }
  } catch (error) {
    console.error('失败:', error)
    // 网络错误等导致轮询失败：停止并清理状态
    stopPolling()
    isExporting.value = false
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    exportStatus.status = 'FAILURE'
    exportStatus.message = `查询任务状态失败：${error.message}`
    exportStatusMessage.value = `查询任务状态失败：${error.message}`
    ElMessage.error(exportStatus.message)
  }
}

/**
 * 提交导出任务 (适配 ProductSearch.vue 的 handleExport 逻辑)
 */
const handleSubmitExport = async () => {
  if (!searchParams.startDate || !searchParams.endDate) {
    ElMessage.warning('请先选择日期范围才能提交导出任务！')
    return
  }

  if (isExporting.value) {
    ElMessage.warning('当前已有导出任务正在处理中，请勿重复提交。')
    return
  }

  // 1. 确认并发送请求 (使用 ElMessageBox.confirm 弹窗)
  ElMessageBox.confirm(`确定导出共 ${total.value} 条数据吗？`, '确认导出', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      // 1. 设置提交状态，并清理旧的轮询
      isExporting.value = true
      stopPolling()

      exportStatus.id = null
      exportStatus.status = 'PENDING'
      exportStatus.message = '任务提交中...'

      exportTaskId.value = null
      exportStatusMessage.value = '任务提交中...'

      ElNotification({
        title: '导出任务提交',
        message: '任务已提交到后台线程，请等待通知。',
        type: 'info',
        duration: 3000,
      })

      try {
        const exportPayload = {
          startDate: searchParams.startDate,
          endDate: searchParams.endDate,
          exportType: '3',
        }

        const response = await submitShipmentExport(exportPayload)
        const task = response

        // 2. 存储任务
        exportTaskId.value = task.id
        Object.assign(exportStatus, task)

        localStorage.setItem(LOCAL_STORAGE_KEY, exportTaskId.value)

        startPolling()
      } catch (error) {
        console.error('任务提交失败:', error)
        exportStatus.status = 'FAILURE'
        exportStatus.message =
          error.response?.data?.detail || '任务提交失败，请检查网络或联系管理员。'

        // 3. 提交失败，彻底清理状态
        isExporting.value = false
        exportTaskId.value = null
        localStorage.removeItem(LOCAL_STORAGE_KEY)

        exportStatusMessage.value = exportStatus.message
        ElMessage.error(exportStatus.message)
      }
    })
    .catch(() => {
      // 用户取消
    })
}

// --- 生命周期钩子 ---

onMounted(() => {
  handleSearch(1)

  const storedTaskId = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (storedTaskId) {
    // 恢复任务状态并重新启动轮询
    exportTaskId.value = storedTaskId // 使用新的状态变量
    exportStatus.id = storedTaskId // 保持 ElAlert 显示
    isExporting.value = true
    exportStatus.status = 'RUNNING'
    exportStatus.message = '检测到上次未完成的导出任务，正在后台查询进度...'
    exportStatusMessage.value = exportStatus.message
    startPolling()
  }
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  padding: 0 10px;
}

.export-btn {
  color: white;
}

.pagination-container {
  display: flex;
  justify-content: center;
}
</style>
