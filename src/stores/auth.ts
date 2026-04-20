import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request' // 引入配置好的带 Token 拦截器的 axios

// 用户信息接口 - 匹配后端 User 实体
export interface UserInfo {
  id?: number
  orgId?: number              // 机构ID（管理员使用）
  username?: string           // 登录账号（管理员使用）
  phone?: string              // 手机号（捐赠者使用）
  nickname?: string           // 昵称（捐赠者显示用）/ 真名（管理员显示用）
  avatar?: string             // 头像URL
  role?: number               // 1-捐赠人，2-管理员，9-超级管理员
  userStatus?: number         // 1-正常，2-禁用
  userType?: 'donor' | 'admin'  // 前端用的用户类型
  lastLogin?: string          // 最后登录时间
  displayName?: string        // 显示名称（前端计算）
  createTime?: string         // 创建时间
}

export const useAuthStore = defineStore('auth', () => {
  // State - 全面拥抱 JWT
  const token = ref<string | null>(null)
  const userInfo = ref<UserInfo | null>(null)
  const getPrefix = () => {
    // 根据 URL 判断当前是管理员端还是捐赠人端
    const isUrlAdmin = window.location.pathname.includes('admin') || 
                       window.location.hash.includes('admin') || 
                       window.location.pathname.includes('Admin')
    return isUrlAdmin ? 'admin_' : 'donor_'
  }
  // Getters
  // 只要有 token 和 userInfo 就认为已登录
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
  
  // 判断是否为管理员（role: 2 或 9）
  const isAdmin = computed(() => {
    const role = userInfo.value?.role
    return role === 2 || role === 9
  })
  
  // 判断是否为捐赠者（role: 1）
  const isDonor = computed(() => {
    return userInfo.value?.role === 1
  })
  
  // 判断是否为超级管理员
  const isSuperAdmin = computed(() => {
    return userInfo.value?.role === 9
  })
  
  // 显示名称：捐赠者显示nickname，管理员显示nickname（真名）
  const displayName = computed(() => {
    if (!userInfo.value) return '用户'
    if (userInfo.value.nickname) return userInfo.value.nickname
    if (userInfo.value.displayName) return userInfo.value.displayName
    if (userInfo.value.username) return userInfo.value.username
    if (userInfo.value.phone) return userInfo.value.phone
    return '用户'
  })
  
  // 用户角色文本
  const roleText = computed(() => {
    const role = userInfo.value?.role
    if (role === 1) return '捐赠者'
    if (role === 2) return '管理员'
    if (role === 9) return '超级管理员'
    return '未知'
  })
  
  // 用户头像
  const userAvatar = computed(() => {
    return userInfo.value?.avatar || '/default-avatar.png'
  })
  
  // 用户状态是否正常
  const isActive = computed(() => {
    return userInfo.value?.userStatus === 1
  })
  
  // Actions
  const setToken = (newToken: string | undefined) => {
    if (newToken) {
      token.value = newToken
    }
  }

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
    // 注意：这里不再强制写入 sessionStorage，因为 Login.vue 已经处理了存入哪种 storage 
  }
  
  // 退出登录
  const logout = async () => {
    try {
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      // 彻底清理前端的 JWT 和状态数据
      token.value = null
      userInfo.value = null
      
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userType')
      
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('userInfo')
      sessionStorage.removeItem('isLoggedIn')
      sessionStorage.removeItem('userType')
    }
  }
  
  // 初始化用户信息（兼顾 localStorage 和 sessionStorage）
  const initAuth = () => {
    const prefix = getPrefix() // 获取前缀

    // 1. 精准找 token
    const storedToken = localStorage.getItem(`${prefix}token`) || sessionStorage.getItem(`${prefix}token`)
    if (storedToken) {
      token.value = storedToken
    }

    // 2. 精准找 userInfo
    const storedUserInfo = localStorage.getItem(`${prefix}userInfo`) || sessionStorage.getItem(`${prefix}userInfo`)
    if (storedUserInfo) {
      try {
        userInfo.value = JSON.parse(storedUserInfo)
      } catch (e) {
        console.error('解析用户信息失败', e)
      }
    }
  }
  
  // 更新用户信息
  const updateUserInfo = (info: Partial<UserInfo>) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...info }
      const prefix = getPrefix() // 获取前缀
      
      // 同步更新到对应的存储中
      if (localStorage.getItem(`${prefix}userInfo`)) {
        localStorage.setItem(`${prefix}userInfo`, JSON.stringify(userInfo.value))
      } else if (sessionStorage.getItem(`${prefix}userInfo`)) {
        sessionStorage.setItem(`${prefix}userInfo`, JSON.stringify(userInfo.value))
      }
    }
  }
  
  // 检查用户是否被禁用
  const checkUserStatus = (): boolean => {
    if (userInfo.value?.userStatus === 2) {
      logout()
      return false
    }
    return true
  }
  
  // 获取当前用户信息（使用配置好的 request 发送）
  const fetchCurrentUser = async () => {
    try {
      // 使用 Axios 请求，它会自动带上 Token 拦截器
      const response: any = await request.get('/v1/user/current')
      // 假设你后端返回的数据包在 data 里
      if (response && response.data) {
        setUserInfo(response.data)
        return response.data
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
    return null
  }
  
  // Store 实例化时自动执行初始化
  initAuth()
  
  return {
    // State
    token,
    userInfo,
    
    // Getters
    isLoggedIn,
    isAdmin,
    isDonor,
    isSuperAdmin,
    displayName,
    roleText,
    userAvatar,
    isActive,
    
    // Actions
    setToken,
    setUserInfo,
    logout,
    initAuth,
    updateUserInfo,
    checkUserStatus,
    fetchCurrentUser,
  }
})