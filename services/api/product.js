import apiClient, { API_BASE_ROOT } from '../api'

// 商品搜索与查询
export const searchProducts = (params) => {
  return apiClient.post('/product/search', params)
}

// 对应 searchBzs 和 searchGdy
export const searchBzs = (params) => {
  return apiClient.post('/product/bzs_page_search', params)
}

export const searchGdy = (params) => {
  return apiClient.post('/product/gdy_page_search', params)
}

// 对应 searchCgzt
export const searchCgzt = (params) => {
  return apiClient.post('/product/cgzt_page_search', params)
}

// 文件导出
export const exportProducts = (params) => {
  return apiClient.post('/product/export_excel_with_images', params, {
    responseType: 'blob', // 明确要求返回 Blob
  })
}

// 🚀 文件上传函数
export const uploadProductsFile = (formData) => {
  return apiClient.post('/product/upload', formData, {
    headers: {
      //让浏览器自动设置正确的 Content-Type (multipart/form-data)
      'Content-Type': undefined,
    },
    timeout: 60000,
  })
}

// 🚀 异步导出方法 - 任务提交
export const submitExport = (params) => {
  return apiClient.post('/product/export_submit', params)
}

// 🔄 异步导出方法 - 任务状态轮询
export const getExportStatus = async (taskId) => {
  const response = await apiClient.get(`/product/export_status/${taskId}`)
  return response
}

export const getPicPreviewUrl = (PicPath) => {
  const encodedPath = encodeURIComponent(PicPath.replace(/\\/g, '/'))
  return `${API_BASE_ROOT}product/attachments/${encodedPath}`
}
