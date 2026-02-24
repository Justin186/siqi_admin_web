import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  timeout: 5000
})

// 请求拦截器：自动带上 Token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一处理错误
request.interceptors.response.use(
  response => {
    // bRPC 返回的 JSON 数据
    const res = response.data
    // 根据 proto 定义，如果有 success 字段且为 false，说明业务报错
    if (res.success === false) {
      ElMessage.error(res.message || '操作失败')
      return Promise.reject(new Error(res.message))
    }
    return res
  },
  error => {
    ElMessage.error(error.response?.data?.message || '网络请求失败')
    return Promise.reject(error)
  }
)

export default request
