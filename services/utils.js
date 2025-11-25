// utils/auth.js

/**
 * 从 JWT 中解析 Payload
 * @param {string} token - JWT Token
 * @returns {object|null} - 返回 Payload 对象，如果解析失败返回 null
 */
export function parseJwt(token) {
  if (!token) return null
  try {
    // JWT 的格式是 header.payload.signature
    const base64Url = token.split('.')[1]
    // 将 base64Url 转换为 base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    // 解码 Payload
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        })
        .join(''),
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    console.error('解析 Token 失败:', e)
    return null
  }
}

/**
 * @returns {Array<string>} - 权限代码数组，如果未登录或解析失败，返回空数组
 */
export function getCurrentUserPermissions() {
  const token = localStorage.getItem('accessToken') //
  if (!token) return []

  const payload = parseJwt(token)

  // ⚠️ 请根据你实际的 JWT 结构，修改 'permissions' 字段名 ⚠️
  const permissions = payload?.permissions

  // 返回一个有效的权限代码数组
  return Array.isArray(permissions) ? permissions : []
}

/**
 * 检查用户是否拥有指定权限
 * @param {string} permissionCode - 要求的权限代码
 * @returns {boolean}
 */
export function hasPermission(permissionCode) {
  const userPermissions = getCurrentUserPermissions()
  // 假设 'ADMIN' 拥有所有权限
  return userPermissions.includes(permissionCode) || userPermissions.includes('admin')
}
