<template>
  <div class="user-authorization-page">
    <el-container class="auth-container">
      <el-aside width="300px" class="user-aside">
        <el-card shadow="hover" class="user-list-card">
          <template #header>
            <div class="card-header-title">👤 用户列表 (点击选择)</div>
          </template>

          <el-input
            v-model="userSearchQuery"
            placeholder="搜索用户ID/姓名"
            clearable
            style="margin-bottom: 10px"
          />

          <el-skeleton :rows="5" animated v-if="loadingUsers" />

          <el-scrollbar v-else max-height="calc(100vh - 250px)">
            <ul class="user-list">
              <li
                v-for="user in filteredUserList"
                :key="user.EmpID"
                class="user-list-item"
                :class="{ 'is-active': user.EmpID === currentUserId }"
                @click="handleUserSelect(user.EmpID)"
              >
                <div class="user-item-content">
                  <span class="user-name">{{ user.CNEmpName || '无名' }}</span>
                  <el-tag size="small" type="info">{{ user.EmpID }}</el-tag>
                </div>
              </li>
              <div
                v-if="filteredUserList.length === 0"
                style="text-align: center; color: #999; padding: 20px"
              >
                无匹配用户
              </div>
            </ul>
          </el-scrollbar>
        </el-card>
      </el-aside>

      <el-main class="auth-main">
        <el-card shadow="hover" class="role-config-card">
          <template #header>
            <div class="card-header-title">
              🔑 **页面权限配置**：
              <el-tag v-if="currentUserName" type="success" size="large">{{
                currentUserName
              }}</el-tag>
              <span v-else class="text-placeholder">请在左侧选择用户</span>
            </div>
          </template>

          <el-alert
            v-if="!currentUserId"
            title="提示"
            type="info"
            description="请从左侧列表选择一个员工，然后直接为其分配页面访问权限和功能权限。"
            show-icon
            style="margin-bottom: 20px"
          />

          <div v-else class="transfer-wrapper" v-loading="loadingRoles">
            <el-transfer
              v-model="targetPermissionCodes"
              :data="formattedPermissionList"
              :titles="['可选权限', '已授权权限']"
              :button-texts="['撤销', '授权']"
              filterable
              filter-placeholder="搜索权限代码/名称"
              :left-default-checked="[]"
              :right-default-checked="[]"
              :key="currentUserId"
              style="margin-bottom: 20px"
              class="permission-transfer"
            />

            <div class="submit-footer">
              <el-button type="primary" :loading="submitting" @click="handleSubmitAuth">
                保存权限更改
              </el-button>
            </div>
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 导入扁平化权限 API 函数
import {
  getAllUsers,
  getAllPermissions,
  getUserPermissions,
  updateUserPermissions,
} from '../../services/api/user.js'

// --- 状态 ---
const userList = ref([])
const allPermissionList = ref([])
const loadingUsers = ref(false)
const loadingRoles = ref(false)
const submitting = ref(false)

const currentUserId = ref(null)
const targetPermissionCodes = ref([])
const userSearchQuery = ref('')

// --- Computed ---
const filteredUserList = computed(() => {
  const users = Array.isArray(userList.value) ? userList.value : []
  const query = userSearchQuery.value.toLowerCase()
  if (!query) {
    return users
  }
  return users.filter(
    (user) =>
      (user.CNEmpName && user.CNEmpName.toLowerCase().includes(query)) ||
      (user.EmpID && user.EmpID.toLowerCase().includes(query)),
  )
})

const currentUserName = computed(() => {
  const users = userList.value || []
  const user = users.find((u) => u.EmpID === currentUserId.value)
  return user ? user.CNEmpName : ''
})

// 格式化权限列表用于穿梭框
const formattedPermissionList = computed(() => {
  const permissions = Array.isArray(allPermissionList.value) ? allPermissionList.value : []
  return permissions.map((p) => ({
    key: p.code,
    label: `${p.label} (${p.code})`,
    code: p.code,
    disabled: false,
  }))
})

// --- 动作 ---
const fetchInitialData = async () => {
  loadingUsers.value = true
  try {
    const userRes = await getAllUsers()
    userList.value = userRes?.data || userRes

    const permRes = await getAllPermissions()
    allPermissionList.value = permRes.data || permRes
  } catch (error) {
    ElMessage.error('初始化数据加载失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    loadingUsers.value = false
  }
}

const handleUserSelect = async (empId) => {
  currentUserId.value = empId
  targetPermissionCodes.value = []

  loadingRoles.value = true
  try {
    const res = await getUserPermissions(empId)
    targetPermissionCodes.value = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []
  } catch (error) {
    ElMessage.error('加载用户权限失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    loadingRoles.value = false
  }
}

const handleSubmitAuth = async () => {
  if (!currentUserId.value) {
    ElMessage.warning('请先选择一个用户。')
    return
  }

  submitting.value = true
  try {
    await updateUserPermissions(currentUserId.value, {
      permissions: targetPermissionCodes.value,
    })
    ElMessage.success(`用户 ${currentUserName.value} 权限更新成功!`)
  } catch (error) {
    ElMessage.error('授权失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchInitialData()
})
</script>

<style scoped>
/* ----------------------------------------------------------------- */
/* 整体布局 - 确保容器撑满高度 */
/* ----------------------------------------------------------------- */
.auth-container {
  height: calc(100vh - 84px);
  display: flex;
}

/* ... (左侧用户列表样式保持不变) ... */

/* ----------------------------------------------------------------- */
/* 右侧权限配置区域 - 布局修正 */
/* ----------------------------------------------------------------- */
.auth-main {
  padding: 0 0 0 10px;
  flex-grow: 1;
}
.role-config-card {
  height: 100%;
}

/* ⚡️ 核心修正 1: 穿梭框组件的固定高度和宽度 */
.transfer-wrapper {
  /* 移除所有 Flex 高度计算，采用固定高度，避免 el-card 挤压 */
  min-height: 400px;
}
.permission-transfer :deep(.el-transfer-panel) {
  /* 修正宽度 */
  width: 350px;
  /* ⚡️ 关键：设置一个固定的、足够大的高度，让列表可以滚动，同时避免被挤压 */
  height: 500px;
}

/* 穿梭框列表体，确保可滚动 */
.permission-transfer :deep(.el-transfer-panel__body) {
  /* 关键：计算列表内容高度，减去头部和搜索框 */
  height: calc(100% - 79px);
}
.permission-transfer :deep(.el-transfer-panel__list) {
  height: 100%;
  overflow: auto;
}

/* ⚡️ 核心修正 2: submit-footer 靠右对齐，确保可见 */
.submit-footer {
  text-align: right;
  padding: 20px 0 0 0;
  border-top: 1px solid var(--el-border-color-lighter);
  /* 移除所有可能导致挤压的 Flex 属性 */
}

/* ... (其他辅助样式保持不变) ... */

.user-aside {
  padding: 0 10px 0 0;
}
.user-list-card {
  height: 100%;
}
.card-header-title {
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
}
.user-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.user-list-item {
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 10px 10px;
  transition: background-color 0.2s;
}
.user-list-item.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-left: 4px solid var(--el-color-primary);
  padding-left: 6px;
  font-weight: bold;
}
.user-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
