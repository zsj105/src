import axios from 'axios'

export const API_BASE_ROOT = '/api/'

const apiClient = axios.create({
  baseURL: API_BASE_ROOT,
  headers: {
    'Content-Type': 'application/json',
  },
})
// 🎯 请求拦截器：自动添加 JWT
apiClient.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 Token
    const token = localStorage.getItem('accessToken')

    // 如果 Token 存在，添加到 Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)
// 响应拦截器：统一处理数据返回和错误捕获
apiClient.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') {
      return response.data
    }
    return response.data
  },
  (error) => {
    const errorResponse = error.response

    // 🎯 响应拦截：处理 401/403 权限错误
    if (errorResponse && (errorResponse.status === 401 || errorResponse.status === 403)) {
      // 1. 清除无效的 Token
      localStorage.removeItem('accessToken')

      // 2. 提示用户
      import('element-plus').then(({ ElMessage }) => {
        ElMessage.error('登录状态已过期，请重新登录！')
      })

      // 3. 重定向到登录页
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)

      // 阻止进一步处理，并返回一个被拒绝的 Promise
      return Promise.reject(new Error('未授权或登录已过期'))
    }
    if (error.response?.data instanceof Blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = function () {
          try {
            const errorJson = JSON.parse(reader.result)
            // 抛出包含详细信息的 Error 对象
            reject(new Error(errorJson.detail || '导出失败：服务器返回错误'))
          } catch {
            reject(new Error('请求失败：无法解析服务器错误信息。'))
          }
        }
        reader.onerror = () => reject(new Error('请求失败：读取 Blob 错误。'))
        reader.readAsText(error.response.data)
      })
    }

    // 处理普通 JSON 响应的错误（例如 400/500）
    const errorMessage = error.response?.data?.detail || error.message || '未知网络错误'
    return Promise.reject(new Error(errorMessage))
  },
)

export default apiClient
