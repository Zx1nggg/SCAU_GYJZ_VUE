<template>
  <div class="register-page">
    <div class="register-container">
      <!-- 头部 -->
      <div class="register-header">
        <h2>捐赠人注册</h2>
        <p>加入我们，让爱心传递</p>
      </div>

      <!-- 注册表单 -->
      <form @submit.prevent="handleRegister" class="register-form">
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
          <label>昵称</label>
          <input 
            type="text" 
            v-model="form.nickname" 
            placeholder="请输入昵称"
            class="form-input"
            required
          >
        </div>

        <div class="form-group">
          <label>设置密码</label>
          <div class="password-input">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.password" 
              placeholder="请输入密码（6-20位）"
              class="form-input"
              required
            >
            <span class="password-toggle" @click="showPassword = !showPassword">
              {{ showPassword ? '隐藏' : '显示' }}
            </span>
          </div>
        </div>

        <div class="form-group">
          <label>确认密码</label>
          <div class="password-input">
            <input 
              :type="showConfirmPassword ? 'text' : 'password'" 
              v-model="form.confirmPassword" 
              placeholder="请再次输入密码"
              class="form-input"
              required
            >
            <span class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
              {{ showConfirmPassword ? '隐藏' : '显示' }}
            </span>
          </div>
        </div>

        <div class="form-group">
          <label>验证码</label>
          <div class="code-input-group">
            <input 
              type="text" 
              v-model="form.code" 
              placeholder="请输入验证码"
              class="form-input"
              required
            >
            <button 
              type="button" 
              class="code-btn" 
              @click="sendCode"
              :disabled="codeCountdown > 0 || loading"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}秒后重试` : '获取验证码' }}
            </button>
          </div>
        </div>

        <div class="form-agreement">
          <label class="agreement-checkbox">
            <input type="checkbox" v-model="form.agree" required>
            <span>我已阅读并同意</span>
            <a href="#" class="agreement-link">《用户协议》</a>
            <span>和</span>
            <a href="#" class="agreement-link">《隐私政策》</a>
          </label>
        </div>

        <button type="submit" class="register-btn" :disabled="loading">
          {{ loading ? '注册中...' : '立即注册' }}
        </button>
      </form>

      <!-- 登录链接 -->
      <div class="login-link">
        <p>
          已有账号？
          <router-link to="/donorLogin">立即登录</router-link>
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
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { donorRegister, sendVerifyCode } from '@/api/auth'

const router = useRouter()
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const codeCountdown = ref(0)

const form = reactive({
  phone: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  code: '',
  agree: false
})

// 发送验证码
const sendCode = async () => {
  // 验证手机号
  if (!form.phone) {
    alert('请先输入手机号')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    alert('请输入正确的手机号')
    return
  }
  
  try {
    const response = await sendVerifyCode(form.phone)
    
    if (response.code === 200) {
      // 显示提示信息
      alert(`验证码已发送至 ${form.phone}`)
      
      // 开始倒计时
      codeCountdown.value = 60
      const timer = setInterval(() => {
        codeCountdown.value--
        if (codeCountdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      alert(response.message || '发送失败')
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    alert('发送失败，请稍后重试')
  }
}

// 注册
const handleRegister = async () => {
  // 表单验证
  if (!form.phone) {
    alert('请输入手机号')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    alert('请输入正确的手机号')
    return
  }
  
  if (!form.nickname) {
    alert('请输入昵称')
    return
  }
  
  if (!form.password) {
    alert('请输入密码')
    return
  }
  
  if (form.password.length < 6 || form.password.length > 20) {
    alert('密码长度应为6-20位')
    return
  }
  
  if (form.password !== form.confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }
  
  if (!form.code) {
    alert('请输入验证码')
    return
  }
  
  if (!form.agree) {
    alert('请阅读并同意用户协议')
    return
  }
  
  loading.value = true
  
  try {
    // 调用注册接口
    const response = await donorRegister({
      phone: form.phone,
      password: form.password,
      nickname: form.nickname,
      verifyCode: form.code
    })
    
    if (response.code === 200) {
      alert('注册成功！请登录')
      router.push('/donorLogin')
    } else {
      alert(response.message || '注册失败')
    }
  } catch (error) {
    console.error('注册失败:', error)
    alert(error.message || '注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.register-container {
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  padding: 48px 40px;
  animation: slideUp 0.5s ease;
}

.register-header {
  text-align: center;
  margin-bottom: 40px;
}

.register-header h2 {
  font-size: 32px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 600;
}

.register-header p {
  color: #ff6b6b;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
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
  box-sizing: border-box;
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

.code-input-group {
  display: flex;
  gap: 10px;
}

.code-input-group .form-input {
  flex: 2;
}

.code-btn {
  flex: 1;
  padding: 0 12px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  white-space: nowrap;
}

.code-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.code-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.form-agreement {
  margin: 24px 0;
}

.agreement-checkbox {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  cursor: pointer;
  color: #666;
  font-size: 14px;
}

.agreement-checkbox input {
  margin-right: 8px;
  cursor: pointer;
  accent-color: #ff6b6b;
}

.agreement-link {
  color: #ff6b6b;
  text-decoration: none;
  margin: 0 3px;
}

.agreement-link:hover {
  text-decoration: underline;
}

.register-btn {
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

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin: 24px 0 16px;
}

.login-link p {
  color: #666;
  font-size: 14px;
}

.login-link a {
  color: #ff6b6b;
  text-decoration: none;
  font-weight: 600;
  margin-left: 5px;
}

.login-link a:hover {
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
  .register-container {
    padding: 32px 24px;
  }
  
  .register-header h2 {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .register-container {
    padding: 24px 20px;
  }
  
  .register-header h2 {
    font-size: 24px;
  }
  
  .code-input-group {
    flex-direction: column;
  }
  
  .code-btn {
    padding: 10px;
  }
}
</style>