<template>
  <div class="role-management-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" :icon="Plus" @click="handleEdit(null)"> 新增角色 </el-button>
        </div>
      </template>

      <el-table :data="roles" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="role_name" label="角色名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="role_code" label="角色代码" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="updated_at" label="更新时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingRole.id ? '编辑角色' : '新增角色'"
      width="400px"
    >
      <el-form :model="editingRole" label-width="80px" ref="roleFormRef">
        <el-form-item
          label="名称"
          prop="role_name"
          :rules="[{ required: true, message: '角色名称不能为空' }]"
        >
          <el-input v-model="editingRole.role_name" clearable />
        </el-form-item>
        <el-form-item
          label="代码"
          prop="role_code"
          :rules="[{ required: true, message: '角色代码不能为空' }]"
        >
          <el-input v-model="editingRole.role_code" :disabled="!!editingRole.id" clearable />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editingRole.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">
            {{ editingRole.id ? '保存修改' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// 🚀 重点修改：使用解构命名导入，并根据您的新路径调整
import { createRole, getAllRoles, updateRole, deleteRole } from '../../services/api/user.js'

// --- 状态 ---
const roles = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const roleFormRef = ref(null)

const defaultRole = {
  id: null,
  role_name: '',
  role_code: '',
  description: '',
}
const editingRole = reactive({ ...defaultRole })

// --- 辅助函数 ---
const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('sv-SE')
}

// --- CRUD 操作 ---

// R: 获取角色列表
const fetchRoles = async () => {
  loading.value = true
  try {
    // 修正：直接调用函数名
    const response = await getAllRoles()

    roles.value = response
  } catch (error) {
    ElMessage.error('加载角色失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    loading.value = false
  }
}

// C/U: 提交保存
const handleSave = async () => {
  if (!roleFormRef.value) return
  await roleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (editingRole.id) {
          // Update
          const updateData = {
            role_name: editingRole.role_name,
            description: editingRole.description,
          }
          // 修正：直接调用函数名
          await updateRole(editingRole.id, updateData)
          ElMessage.success('角色更新成功')
        } else {
          // Create
          // 修正：直接调用函数名
          await createRole(editingRole)
          ElMessage.success('角色创建成功')
        }

        dialogVisible.value = false
        await fetchRoles()
      } catch (error) {
        ElMessage.error('操作失败: ' + (error.response?.data?.detail || error.message))
      }
    }
  })
}

// D: 删除角色
const handleDelete = (role) => {
  ElMessageBox.confirm(`确定要删除角色 "${role.role_name}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        // 修正：直接调用函数名
        await deleteRole(role.id)
        ElMessage.success('角色删除成功')
        await fetchRoles()
      } catch (error) {
        ElMessage.error('删除失败: ' + (error.response?.data?.detail || error.message))
      }
    })
    .catch(() => {})
}
// ... (其他 handleEdit 和 onMounted 保持不变)
const handleEdit = (role) => {
  if (role) {
    Object.assign(editingRole, role)
  } else {
    Object.assign(editingRole, defaultRole)
  }
  dialogVisible.value = true
}

onMounted(() => {
  fetchRoles()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}
</style>
