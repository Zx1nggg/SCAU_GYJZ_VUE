import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
  // 如果完全切换到了 JWT，这里其实可以把 withCredentials: true 删掉，
  // 因为不再依赖 cookie 了。保留也不会报错，但删掉更符合 JWT 的规范。
})

// 核心修改：请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. 因为 Login.vue 中支持“记住我”，所以要在 localStorage 和 sessionStorage 里都找一下
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')

    // 2. 如果找到了 token，就按照 JWT 标准加入到请求头的 Authorization 中
    if (token) {
      // 确保 config.headers 存在
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${token}` // 注意 Bearer 后面有一个空格
    }
    
    return config
  },
  (error: any) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 (保持你原来的逻辑基本不变)
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error: any) => {
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // 后端 JwtAuthenticationFilter 校验失败（比如 Token 过期或没传）会返回 401
          ElMessage.error('登录已过期，请重新登录')
          // 清除本地缓存的所有信息
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          localStorage.removeItem('isLoggedIn')
          localStorage.removeItem('userType')
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('userInfo')
          sessionStorage.removeItem('isLoggedIn')
          sessionStorage.removeItem('userType')
          
          const authStore = useAuthStore()
          authStore.logout()
          
          setTimeout(() => {
            window.location.href = '/login' // 或者使用 router.push
          }, 1500)
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求地址不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      ElMessage.error(error.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default request