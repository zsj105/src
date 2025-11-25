import apiClient from '../api'

const BASE_URL = '/user' // 统一的基础路由前缀

// --- 角色管理 (bfRole CRUD) ---

/**
 * 🚀 创建新角色 (POST /user/roles)
 * @param {object} roleData - {role_name, role_code, description}
 */
export const createRole = (roleData) => {
  return apiClient.post(`${BASE_URL}/roles`, roleData)
}

/**
 * 📖 获取所有角色列表 (GET /user/roles)
 */
export const getAllRoles = () => {
  return apiClient.get(`${BASE_URL}/roles`)
}

/**
 * ✍️ 更新角色信息 (PUT /user/roles/{roleId})
 */
export const updateRole = (roleId, updateData) => {
  return apiClient.put(`${BASE_URL}/roles/${roleId}`, updateData)
}

/**
 * 🗑️ 删除角色 (DELETE /user/roles/{roleId})
 * @param {number} roleId - 角色ID
 */
export const deleteRole = (roleId) => {
  return apiClient.delete(`${BASE_URL}/roles/${roleId}`)
}

// --- 用户授权管理 (bfEmp_Role CRUD) ---

/**
 * 👤 获取所有用户列表 (GET /user/users)
 */
export const getAllUsers = () => {
  return apiClient.get(`${BASE_URL}/users`)
}

export const getAllPermissions = () => {
  return apiClient.get(`${BASE_URL}/permissions/all`)
}

/**
 * 🔍 获取某个用户当前拥有的所有权限代码 (GET /user/user/{empId}/permissions)
 * 对应后端从 bfEmp.permission 字段读取，返回格式: ['P001', 'F002', ...]
 * @param {string} empId - 员工ID (bfEMP.EmpID)
 */
export const getUserPermissions = (empId) => {
  // 注意：路径从 /roles 变更为 /permissions
  return apiClient.get(`${BASE_URL}/user/${empId}/permissions`)
}

/**
 * 🔄 批量更新用户的权限代码 (POST /user/user/{empId}/permissions)
 * 对应后端写入 bfEmp.permission 字段
 * @param {string} empId - 员工ID (bfEMP.EmpID)
 * @param {object} data - {permissions: ['P001', 'F002']}
 */
export const updateUserPermissions = (empId, data) => {
  // 注意：路径从 /roles 变更为 /permissions，且提交的 body 字段名变更为 permissions
  return apiClient.post(`${BASE_URL}/user/${empId}/permissions`, data)
}
