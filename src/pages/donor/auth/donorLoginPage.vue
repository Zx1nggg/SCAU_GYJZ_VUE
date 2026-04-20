<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h2>捐赠人登录</h2>
        <p>欢迎回来，让爱心继续传递</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>手机号</label>
          <input 
            type="tel" 
            v-model="form.phone" 
            placeholder="请输入手机号"
            maxlength="11"
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

      <div class="register-link">
        <p>
          还没有账号？
          <router-link to="/donorRegister">立即注册</router-link>
        </p>
      </div>
      
      <div class="back-link">
        <router-link to="/">返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { donorLogin, type User } from '@/api/auth'
import { useAuthStore } from '@/stores/auth' // 引入 authStore
import { onMounted } from 'vue'

const authStore = useAuthStore() // 实例化
const router = useRouter()
const loading = ref(false)
const showPassword = ref(false)

const form = reactive({
  phone: '',
  password: '',
  remember: false
})

// 页面加载时去localstorage找看之前有没有保存的手机号和密码，如果有就自动填充到表单里
onMounted(() => {
  const savedPhone = localStorage.getItem('donor_saved_phone')
  const savedPassword = localStorage.getItem('donor_saved_password')
  
  if (savedPhone && savedPassword) {
    // 如果找到了，直接赋值给表单绑定的变量，页面上瞬间就填好了！
    form.phone = savedPhone
    form.password = savedPassword
    form.remember = true // 顺便把“记住密码”的框也自动勾上
  }
})

const handleLogin = async () => {
  if (!form.phone || !form.password) {
    alert('请填写手机号和密码')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    alert('请输入正确的手机号')
    return
  }
  
  loading.value = true
  
  try {
    const user: User = {
      phone: form.phone,
      password: form.password
    }
    
    const response = await donorLogin(user)
    console.log('登录响应:', response)
    
    if (response.code === 200) {
      const userData = response.data // userData 就是后端返回的 data 对象

      if (userData?.userStatus === 2) {
        ElMessage.error('账号因为违反相关约定已被封禁，请联系管理员解封')
        // 立刻终止程序，绝对不能往下执行存 Token 的代码！
        return 
      }
      
      const userInfo = {
        id: userData?.id,
        nickname: userData?.nickname,
        role: userData?.role,
        phone: userData?.phone,
        avatar: userData?.avatar || '',
        userType: 'donor' as const,
        userStatus: userData?.userStatus, 
        createTime: userData?.createTime,
        loginTime: Date.now()
      }
      
      // 在存入新身份前，彻底清空所有可能的历史残留状态！
      localStorage.removeItem('donor_token')
      localStorage.removeItem('donor_userInfo')
      localStorage.removeItem('donor_isLoggedIn')
      localStorage.removeItem('donor_userType')
      sessionStorage.removeItem('donor_token')
      sessionStorage.removeItem('donor_userInfo')
      sessionStorage.removeItem('donor_isLoggedIn')
      sessionStorage.removeItem('donor_userType')

      const storage = form.remember ? localStorage : sessionStorage
      storage.setItem('donor_userInfo', JSON.stringify(userInfo))
      storage.setItem('donor_isLoggedIn', 'true')
      storage.setItem('donor_userType', 'donor')

      // 1：拿到数据后，立刻同步更新 Pinia 内存中的用户信息！
      authStore.setUserInfo(userInfo)

      // 从 userData (即 response.data) 中获取 token
      if (userData?.token) {
        storage.setItem('donor_token', userData.token)
        
        // 2：同步更新 Pinia 内存中的 Token！
        authStore.setToken(userData.token)
        
        console.log('Token 保存成功:', userData.token)
      } else {
        console.warn('后端没有返回 Token！')
      }
      if (form.remember) {
        // 如果勾选了记住密码，把密码存到本地
        localStorage.setItem('donor_saved_phone', form.phone)
        localStorage.setItem('donor_saved_password', form.password)
      } else {
        // 如果没勾选，一定要清除掉
        localStorage.removeItem('donor_saved_phone')
        localStorage.removeItem('donor_saved_password')
      }
      
      alert('登录成功')
      router.push('/donor/main')
    } else {
      alert(response.msg || '登录失败')
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    if (error.response?.data?.msg) {
      alert(error.response.data.msg)
    } else if (error.message) {
      alert(error.message)
    } else {
      alert('登录失败，请检查网络或账号密码')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 样式保持不变 */
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