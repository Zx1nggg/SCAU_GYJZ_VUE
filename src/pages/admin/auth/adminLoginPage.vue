<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 头部 -->
      <div class="login-header">
        <h2>管理员登录</h2>
        <p>管理系统，守护公益事业</p>
      </div>

      <!-- 登录表单 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>管理员账号</label>
          <input 
            type="text" 
            v-model="form.username" 
            placeholder="请输入管理员账号"
            class="form-input"
            required
          >
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <div class="password-input">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.password" 
              placeholder="请输入密码"
              class="form-input"
              required
            >
            <span class="password-toggle" @click="showPassword = !showPassword">
              {{ showPassword ? '隐藏' : '显示' }}
            </span>
          </div>
        </div>

        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox" v-model="form.remember">
            <span>记住密码</span>
          </label>
          <a href="#" class="forgot-password">忘记密码？</a>
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <!-- 注册链接 -->
      <div class="register-link">
        <p>
          还没有管理员账号？
          <router-link to="/adminRegister">立即注册</router-link>
        </p>
      </div>
      
      <!-- 返回首页 -->
      <div class="back-link">
        <router-link to="/">返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminLogin } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const loading = ref(false)
const showPassword = ref(false)
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: '',
  remember: false
})

// 页面加载时读取记住的账号
onMounted(() => {
  const savedUsername = localStorage.getItem('rememberAdminUsername')
  if (savedUsername) {
    form.username = savedUsername
    form.remember = true
  }
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    alert('请填写账号和密码')
    return
  }
  
  loading.value = true
  
  try {
    const response = await adminLogin({
      username: form.username,
      password: form.password
    })
    
    if (response.code === 200) {
      console.log('登录响应:', response)
      const userData = response.data
      
      // 构建统一的用户信息对象
      const userInfo = {
        id: userData.id,
        username: userData.username,
        nickname: userData.nickname,
        role: userData.role,
        phone: userData.phone,
        userStatus: userData?.userStatus,
        avatar: userData.avatar,
        orgId: userData.orgId,
        userType: 'admin',
        displayName: userData.nickname
      }
      
      // 🌟 核心修复区：将 Token 和 UserInfo 持久化存储到浏览器中
      // 根据是否勾选"记住密码"决定存到哪里
      const storage = form.remember ? localStorage : sessionStorage
      
      if (userData.token) {
        storage.setItem('token', userData.token)
        authStore.setToken(userData.token) // 更新 Pinia 状态
      } else {
        console.warn('后端没有返回 Token！')
      }
      
      storage.setItem('userInfo', JSON.stringify(userInfo))
      storage.setItem('isLoggedIn', 'true')
      storage.setItem('userType', 'admin')
      
      authStore.setUserInfo(userInfo) // 更新 Pinia 状态
      
      // 独立记住用户名（方便下次自动填入账号框）
      if (form.remember) {
        localStorage.setItem('rememberAdminUsername', form.username)
      } else {
        localStorage.removeItem('rememberAdminUsername')
      }
      
      const role = Number(userData.role)
      if (role === 9) {
        alert('登录成功，欢迎超级管理员')
        router.push('/admin/super-dashboard')
      } else if (role === 2) {
        alert('登录成功，欢迎公益机构管理员')
        router.push('/admin/main')
      }
    } else {
      alert(response.message || '登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    alert('登录失败，请检查网络或账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 样式与 donorLoginPage 相同，保持统一 */
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  padding: 48px 40px;
  animation: slideUp 0.5s ease;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h2 {
  font-size: 32px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 600;
}

.login-header p {
  color: #ff6b6b;
  font-size: 14px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: #fafafa;
}

.form-input:focus {
  outline: none;
  border-color: #ff6b6b;
  background: white;
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: #999;
  transition: color 0.3s;
}

.password-toggle:hover {
  color: #ff6b6b;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.remember-me {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #666;
  font-size: 14px;
}

.remember-me input {
  margin-right: 8px;
  cursor: pointer;
  accent-color: #ff6b6b;
}

.forgot-password {
  color: #ff6b6b;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.forgot-password:hover {
  color: #ff4757;
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin: 24px 0 16px;
}

.register-link p {
  color: #666;
  font-size: 14px;
}

.register-link a {
  color: #ff6b6b;
  text-decoration: none;
  font-weight: 600;
  margin-left: 5px;
}

.register-link a:hover {
  text-decoration: underline;
}

.back-link {
  text-align: center;
}

.back-link a {
  color: #999;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.back-link a:hover {
  color: #ff6b6b;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .login-container {
    padding: 32px 24px;
  }
  
  .login-header h2 {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 24px 20px;
  }
  
  .login-header h2 {
    font-size: 24px;
  }
}
</style>