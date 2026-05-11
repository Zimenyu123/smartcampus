import { useAuthStore } from '@/store/auth'
import { storeToRefs } from 'pinia'

// 创建基础URL
const BASE_URL = 'http://127.0.0.1:7001/api'

// 请求拦截器
const requestInterceptor = (config) => {
  const authStore = useAuthStore()
  const { token } = storeToRefs(authStore)

  // 如果有token，自动添加到请求头
    if (token.value) {
      config.headers = { ...config.headers, 'Authorization': `Bearer ${token.value}` }
    }

  // 添加内容类型
  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }

  return config
}

// 响应拦截器
const responseInterceptor = async (response) => {
  if (!response.ok) {
    // 处理错误
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP错误: ${response.status}`)
  }

  // 尝试解析响应数据
  try {
    return await response.json()
  } catch (error) {
    return {}
  }
}

// 创建请求函数
const request = async (url, options = {}) => {
  // 应用请求拦截器
  const config = requestInterceptor({
    url: `${BASE_URL}${url}`,
    ...options,
    headers: options.headers || {}
  })

  try {
    // 发送请求
    const response = await fetch(config.url, {
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body ? JSON.stringify(config.body) : undefined
    })

    // 应用响应拦截器
    return responseInterceptor(response)
  } catch (error) {
    console.error('请求错误:', error)
    throw error
  }
}

// 封装常用HTTP方法
const api = {
  get: (url, options = {}) => request(url, { method: 'GET', ...options }),
  post: (url, data, options = {}) => request(url, { method: 'POST', body: data, ...options }),
  put: (url, data, options = {}) => request(url, { method: 'PUT', body: data, ...options }),
  delete: (url, options = {}) => request(url, { method: 'DELETE', ...options })
}

export default api