<template>
  <div class="page-container">
    <el-card class="common-card shadow-lg">
      <template #header>
        <div>客户商品利润分析 - 筛选条件</div>
      </template>

      <el-form :model="searchParams" label-position="top" class="common-form">
        <el-row :gutter="20">
          <el-col :span="6" v-for="field in searchFields" :key="field.key">
            <el-form-item :label="field.label">
              <template v-if="field.key === 'PurchaseMode'">
                <el-select
                  v-model="searchParams.PurchaseMode"
                  placeholder="请选择采购模式"
                  clearable
                  multiple
                  collapse-tags
                  style="width: 100%"
                >
                  <el-option label="包装" value="包装" />
                  <el-option label="成品" value="成品" />
                </el-select>
              </template>

              <template v-else-if="['brief_name', 'salename'].includes(field.key)">
                <el-input
                  :model-value="getSelectedDisplay(field.key)"
                  :placeholder="'点击选择' + field.label"
                  readonly
                  clearable
                  @click="openSelectionDialog(field.key)"
                  @clear="clearSelection(field.key)"
                  style="width: 100%; cursor: pointer"
                >
                  <template #suffix>
                    <el-icon class="el-input__icon"><Search /></el-icon>
                  </template>
                </el-input>
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

          <el-col :span="12" class="flex items-end">
            <el-form-item label="&nbsp;" style="width: 100%">
              <div class="flex justify-end space-x-4 w-full">
                <el-button
                  type="primary"
                  :loading="isLoading"
                  @click="handleSearch(1)"
                  class="gradient-search-btn"
                >
                  <el-icon><Search /></el-icon> 查询分析
                </el-button>
                <el-button @click="resetSearch">重置</el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card v-loading="isLoading" class="common-card shadow-lg result-table-card">
      <template #header>
        <div class="flex justify-between items-center result-header-flex">
          <span class="font-bold">
            分析结果
            <span v-if="totalCount > 0" class="text-sm font-normal text-gray-custom ml-2">
              (共 {{ totalCount }} 条记录)
            </span>
          </span>
          <div class="flex items-center space-x-4">
            <transition name="el-fade-in">
              <el-tag v-if="isExporting" type="warning" size="large" effect="dark">
                <el-icon class="is-loading mr-1"><Loading /></el-icon>
                {{ exportStatusMessage }}
              </el-tag>
            </transition>
            <el-button
              type="success"
              size="large"
              :loading="isExporting"
              :disabled="isExporting || totalCount === 0"
              @click="handleExport"
              class="export-btn"
            >
              <el-icon><Download /></el-icon>
              {{ isExporting ? '后台生成中...' : '导出利润报表' }}
            </el-button>
          </div>
        </div>
      </template>
      <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon class="mb-4" />

      <el-table
        :data="products"
        v-loading="isLoading"
        style="width: 100%"
        stripe
        border
        size="small"
        max-height="650"
        class="common-table"
      >
        <el-table-column type="index" label="#" width="50" align="center" fixed />
        <el-table-column
          v-for="col in tableColumns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :min-width="col.minWidth"
          :align="col.align"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div
              v-if="col.prop === '产品图片' || col.prop === 'PicPath'"
              class="flex justify-center"
            >
              <el-button
                link
                type="primary"
                :icon="Picture"
                @click="handleImagePreview(row[col.prop])"
                :disabled="!row[col.prop]"
                size="small"
              >
                {{ row[col.prop] ? '查看' : '无图' }}
              </el-button>
            </div>
            <div v-else-if="col.prop === '毛利率'" class="font-bold">
              <span :class="getProfitRateColor(row[col.prop])">{{ row[col.prop] }}</span>
            </div>
            <div v-else class="truncate-text" :style="{ textAlign: col.align }">
              {{ row[col.prop] }}
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end mt-4">
        <el-pagination
          @size-change="
            (val) => {
              pageSize = val
              handleSearch(1)
            }
          "
          @current-change="handleSearch"
          :current-page="currentPage"
          :page-sizes="[20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalCount"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="'选择' + currentDialogTitle + ' (可多选)'"
      width="600px"
      append-to-body
      destroy-on-close
    >
      <div class="flex flex-col space-y-4">
        <el-input
          v-model="dialogQueryStr"
          :placeholder="'输入' + currentDialogTitle + '搜索...'"
          clearable
          @keyup.enter="fetchDialogData(1)"
          @clear="fetchDialogData(1)"
          class="common-form"
        >
          <template #append>
            <el-button :icon="Search" @click="fetchDialogData(1)" />
          </template>
        </el-input>

        <div
          v-if="tempSelectedItems.length > 0"
          class="selected-tags-container p-3 rounded border shadow-sm"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-bold label-text">已选 (跨页有效):</span>
            <span class="text-xs count-text">{{ tempSelectedItems.length }} 项</span>
          </div>
          <div class="flex flex-wrap gap-2" style="max-height: 80px; overflow-y: auto">
            <el-tag
              v-for="item in tempSelectedItems"
              :key="item.value || item.label"
              closable
              size="small"
              @close="removeItemFromSelection(item)"
            >
              {{ item.label }}
            </el-tag>
          </div>
        </div>

        <el-table
          ref="dialogTableRef"
          :data="dialogDataList"
          v-loading="isDialogLoading"
          row-key="label"
          height="350"
          border
          @selection-change="handleDialogSelectionChange"
          class="common-table"
        >
          <el-table-column type="selection" width="55" reserve-selection />
          <el-table-column prop="label" :label="currentDialogTitle" />
        </el-table>

        <div class="flex justify-end mt-2">
          <el-pagination
            small
            layout="prev, pager, next"
            :total="dialogTotal"
            :page-size="dialogPageSize"
            v-model:current-page="dialogPage"
            @current-change="fetchDialogData"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between items-center w-full">
          <el-button type="danger" plain link @click="clearAllSelection">清空已选</el-button>
          <div>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmSelection">确定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showImageDialog" title="预览" width="50%" align-center>
      <div class="flex justify-center p-4 preview-container">
        <img :src="currentImageUrl" style="max-height: 70vh; max-width: 100%" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Search, Download, Picture, Loading } from '@element-plus/icons-vue'

// 引入 API
import {
  custproduct_profit,
  submit_cust_productsExport,
  getExportStatus,
  getPicPreviewUrl,
  searchBzs,
  searchYwy, // 🎯 引入业务员查询接口
} from '../../services/api/product.js'

// --- 状态定义 ---
const isLoading = ref(false)
const isExporting = ref(false)
const exportTaskId = ref(null)
const exportStatusMessage = ref('')
const pollingTimer = ref(null)

const errorMessage = ref('')
const products = ref([])
const totalCount = ref(0)
const columnNames = ref([])

const currentPage = ref(1)
const pageSize = ref(20)

const showImageDialog = ref(false)
const currentImageUrl = ref('')

// --- 搜索配置 (更新 searchFields) ---
const searchFields = reactive([
  { key: 'cust_item_no', label: '客户货号' },
  { key: 'item_no', label: '商品编码' },
  { key: 'brief_name', label: '客户简称' },
  { key: 'salename', label: '业务员' }, // 🎯 新增字段
  { key: 'PurchaseMode', label: '采购模式' },
])

const searchParams = reactive({
  cust_item_no: '',
  item_no: '',
  brief_name: [],
  salename: [], // 🎯 新增字段
  PurchaseMode: [],
})

// ================= 通用选择弹框逻辑 (客户/业务员) =================

const dialogVisible = ref(false)
const isDialogLoading = ref(false)
const currentFieldKey = ref('') // 当前正在操作的字段 ('brief_name' or 'salename')
const currentDialogTitle = ref('') // 弹框标题

const dialogDataList = ref([]) // 表格数据
const dialogTotal = ref(0)
const dialogPage = ref(1)
const dialogPageSize = ref(10)
const dialogQueryStr = ref('')

const tempSelectedItems = ref([]) // 临时存储选中的对象 {label: 'xx', value: 'xx'}
const dialogTableRef = ref(null)

// 映射字段 Key 到 API 和 标题
const dialogConfigMap = {
  brief_name: { title: '客户简称', api: searchBzs },
  salename: { title: '业务员', api: searchYwy },
}

// 打开弹框
const openSelectionDialog = (key) => {
  const config = dialogConfigMap[key]
  if (!config) return

  currentFieldKey.value = key
  currentDialogTitle.value = config.title
  dialogQueryStr.value = ''
  dialogPage.value = 1
  dialogVisible.value = true

  // 初始化选中状态：从 searchParams 中恢复
  // 注意：searchParams 存的是字符串数组 ['A', 'B']，table 需要对象数组
  const currentValues = searchParams[key] || []
  tempSelectedItems.value = currentValues.map((label) => ({ label })) // 构造临时对象以便回显

  // 加载数据
  fetchDialogData(1)
}

// 获取弹框列表数据
const fetchDialogData = async (page = 1) => {
  dialogPage.value = page
  isDialogLoading.value = true
  // 清空表格数据以避免 row-key 冲突（虽然 vue3 一般没事，但稳妥起见）
  dialogDataList.value = []

  const apiFunc = dialogConfigMap[currentFieldKey.value].api

  try {
    const res = await apiFunc({
      query: dialogQueryStr.value,
      page: dialogPage.value,
      pageSize: dialogPageSize.value,
    })

    if (res.data) {
      dialogDataList.value = res.data
      dialogTotal.value = res.total_count

      // 🎯 核心：回显选中状态 (reserve-selection 模式下需要手动 toggle)
      nextTick(() => {
        if (dialogTableRef.value) {
          // 先清空当前页的选中视觉效果（不影响 reserve 的数据）
          // 实际上 reserve-selection 会自动管理，但我们需要确保 visual sync
          dialogDataList.value.forEach((row) => {
            const isSelected = tempSelectedItems.value.some((item) => item.label === row.label)
            // 注意：如果已经选中，无需再次 toggle，否则可能反选。
            // 但 Element Plus 的 reserve-selection 比较智能，
            // 只要 row-key 一致，它会自动匹配。我们主要依靠 @selection-change 维护 tempSelectedItems
            // 这里其实可以不需要手动 toggle，如果 row-key 设置正确且数据对象一致。
            // 但为了保险，可以手动设置一下:
            dialogTableRef.value.toggleRowSelection(row, isSelected)
          })
        }
      })
    } else {
      dialogDataList.value = []
      dialogTotal.value = 0
    }
  } catch (error) {
    ElMessage.error(`获取${currentDialogTitle.value}列表失败`)
    console.error(error)
  } finally {
    isDialogLoading.value = false
  }
}

// 处理表格选中变化
const handleDialogSelectionChange = (val) => {
  // val 是当前所有已选中的行对象数组 (因为开启了 reserve-selection，它包含所有页的选中项)
  // 但是，element-plus 在刷新数据时，val 可能会只包含当前页的。
  // 最佳实践：我们需要维护一个全局的 selected 数组。
  // 实际上，开启 reserve-selection 后，val 参数就包含了跨页的所有数据。
  // 我们直接用它更新 tempSelectedItems 即可。
  tempSelectedItems.value = val
}

// 移除单个标签
const removeItemFromSelection = (itemToRemove) => {
  // 1. 从 temp 数组移除
  tempSelectedItems.value = tempSelectedItems.value.filter(
    (item) => item.label !== itemToRemove.label
  )
  // 2. 同步表格状态
  if (dialogTableRef.value) {
    // 找到表格中对应的行（如果在当前页）
    const row = dialogDataList.value.find((r) => r.label === itemToRemove.label)
    if (row) {
      dialogTableRef.value.toggleRowSelection(row, false)
    } else {
      // 如果不在当前页，element-plus 的 reserve-selection 机制比较隐蔽
      // 这里的逻辑其实主要依赖 handleDialogSelectionChange 的 val
      // 直接修改 tempSelectedItems 可能不会触发 table 的 update
      // 但对于用户体验来说，点 x 删除了就行。
      // 下次点确定时，以 tempSelectedItems 为准。
    }
  }
}

// 清空所有
const clearAllSelection = () => {
  tempSelectedItems.value = []
  if (dialogTableRef.value) {
    dialogTableRef.value.clearSelection()
  }
}

// 确认选择
const confirmSelection = () => {
  // 提取 label 存入 searchParams
  searchParams[currentFieldKey.value] = tempSelectedItems.value.map((item) => item.label)
  dialogVisible.value = false
}

// 外部输入框清除
const clearSelection = (key) => {
  searchParams[key] = []
}

// 辅助：获取输入框显示文本
const getSelectedDisplay = (key) => {
  const val = searchParams[key]
  if (!val || val.length === 0) return ''
  if (val.length === 1) return val[0]
  return `${val[0]} (+${val.length - 1})`
}

// ================= End =================

// --- 计算属性：表格列 ---
const tableColumns = computed(() => {
  if (!columnNames.value || columnNames.value.length === 0) return []
  const filtered = columnNames.value.filter((col) => !['FID', 'Fid', 'MainPic'].includes(col))

  return filtered.map((key) => {
    let align = 'left'
    let minWidth = 120

    if (
      ['FOB价', '主档成本价', '主档包装费', '配件成本', '产品总成本', '毛利'].some((k) =>
        key.includes(k)
      )
    ) {
      align = 'right'
      minWidth = 110
    } else if (['毛利率', '采购模式', '产品图片', '单位'].includes(key)) {
      align = 'center'
      minWidth = 100
    } else if (['中文名称', '英文描述', '供应商'].some((k) => key.includes(k))) {
      minWidth = 200
    }

    return { prop: key, label: key, minWidth, align }
  })
})

const getProfitRateColor = (rateStr) => {
  if (!rateStr) return ''
  const val = parseFloat(rateStr.replace('%', ''))
  if (isNaN(val)) return ''
  if (val < 0) return 'text-red-500'
  if (val > 0) return 'text-green-600'
  return ''
}

const handleSearch = async (page = 1) => {
  currentPage.value = page
  isLoading.value = true
  errorMessage.value = ''
  products.value = []

  const payload = {
    ...searchParams,
    page: currentPage.value,
    pageSize: pageSize.value,
  }

  try {
    const res = await custproduct_profit(payload)
    const data = res.data || res
    if (data && !data.error) {
      products.value = data.list || []
      totalCount.value = data.total || 0
      if (data.columns) columnNames.value = data.columns
    } else {
      errorMessage.value = data.detail || '查询返回数据异常'
    }
  } catch (err) {
    errorMessage.value = `服务器请求失败: ${err.message}`
  } finally {
    isLoading.value = false
  }
}

const resetSearch = () => {
  searchParams.cust_item_no = ''
  searchParams.item_no = ''
  searchParams.brief_name = []
  searchParams.salename = [] // 🎯 重置业务员
  searchParams.PurchaseMode = []
  handleSearch(1)
}

// 导出相关逻辑保持不变...
const handleExport = () => {
  if (totalCount.value === 0) return ElMessage.warning('无数据可导出')
  const payload = { ...searchParams }

  ElMessageBox.confirm(`确定导出当前条件下的 ${totalCount.value} 条数据吗？`, '导出确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  }).then(async () => {
    isExporting.value = true
    exportStatusMessage.value = '任务提交中...'
    try {
      const res = await submit_cust_productsExport(payload)
      const task = res.data || res
      if (task.task_id) {
        exportTaskId.value = task.task_id
        localStorage.setItem('activeProfitTask', task.task_id)
        ElNotification({ title: '导出已开始', message: '任务在后台运行...', type: 'success' })
        startPolling()
      }
    } catch (err) {
      isExporting.value = false
      ElMessage.error(`导出请求失败: ${err.message}`)
    }
  })
}

const startPolling = () => {
  if (pollingTimer.value) clearInterval(pollingTimer.value)
  pollingTimer.value = setInterval(async () => {
    if (!exportTaskId.value) {
      stopPolling()
      return
    }
    try {
      const res = await getExportStatus(exportTaskId.value)
      const task = res.data || res
      if (!task || task.code === 404) {
        stopPolling()
        return
      }
      if (task.status === 'SUCCESS') {
        stopPolling()
        isExporting.value = false
        localStorage.removeItem('activeProfitTask')
        if (task.filename) downloadFile(task.filename)
      } else if (task.status === 'FAILURE') {
        stopPolling()
        isExporting.value = false
        localStorage.removeItem('activeProfitTask')
        ElMessage.error(`导出失败: ${task.message}`)
      } else {
        exportStatusMessage.value = `处理中... ${task.progress || 0}%`
      }
    } catch (err) {
      stopPolling()
    }
  }, 5000)
}

const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}

const downloadFile = (filename) => {
  const link = document.createElement('a')
  link.href = `/api/product/attachments/${encodeURIComponent(filename)}`
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleImagePreview = (path) => {
  if (!path) return
  currentImageUrl.value = getPicPreviewUrl(path)
  showImageDialog.value = true
}

onMounted(() => {
  handleSearch(1)
  const savedTaskId = localStorage.getItem('activeProfitTask')
  if (savedTaskId) {
    exportTaskId.value = savedTaskId
    isExporting.value = true
    startPolling()
  }
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<style scoped>
/* 按钮 */
.gradient-search-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  color: white;
  border-radius: 8px;
}
.gradient-search-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.export-btn {
  color: white;
}

/* 利润颜色变量适配 */
.text-red-500 {
  color: var(--el-color-danger);
  font-weight: bold;
}
.text-green-600 {
  color: var(--el-color-success);
  font-weight: bold;
}
.text-gray-custom {
  color: var(--el-text-color-secondary);
}

/* 标签区 */
.selected-tags-container {
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}
.label-text {
  color: var(--el-color-primary);
}
.count-text {
  color: var(--el-text-color-secondary);
}

/* 图片预览 */
.preview-container {
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
}

/* 弹窗搜索框按钮适配 */
.el-dialog :deep(.el-input-group__append button) {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
</style>
