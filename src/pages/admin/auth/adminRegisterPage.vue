<template>
  <div class="register-page">
    <div class="register-container">
      <!-- 头部 -->
      <div class="register-header">
        <h2>管理员注册申请</h2>
        <p>提交申请后，将由超级管理员审核</p>
      </div>

      <!-- 注册表单 -->
      <form @submit.prevent="handleApply" class="register-form">
        <div class="form-group">
          <label>手机号 <span class="required">*</span></label>
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
          <label>设置密码 <span class="required">*</span></label>
          <div class="password-input">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.password" 
              placeholder="请输入密码（6-20位字母数字组合）"
              class="form-input"
              required
            >
            <span class="password-toggle" @click="showPassword = !showPassword">
              {{ showPassword ? '隐藏' : '显示' }}
            </span>
          </div>
        </div>

        <div class="form-group">
          <label>确认密码 <span class="required">*</span></label>
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
          <label>机构名称 <span class="required">*</span></label>
          <input 
            type="text" 
            v-model="form.institutionName" 
            placeholder="请输入机构全称"
            class="form-input"
            required
          >
        </div>

        <div class="form-group">
          <label>统一社会信用代码 <span class="required">*</span></label>
          <input 
            type="text" 
            v-model="form.creditCode" 
            placeholder="请输入18位统一社会信用代码"
            maxlength="18"
            class="form-input"
            required
          >
          <div class="field-tip">示例：91440101MA5XXXXXXX</div>
        </div>

        <div class="form-group">
          <label>联系人 <span class="required">*</span></label>
          <input 
            type="text" 
            v-model="form.contactPerson" 
            placeholder="请输入联系人姓名"
            class="form-input"
            required
          >
        </div>

        <div class="form-group">
          <label>联系电话 <span class="required">*</span></label>
          <input 
            type="tel" 
            v-model="form.contactPhone" 
            placeholder="请输入联系电话"
            class="form-input"
            required
          >
        </div>

        <div class="form-group">
          <label>资质文件URL <span class="required">*</span></label>
          <input 
            type="url" 
            v-model="form.qualification" 
            placeholder="请输入资质文件链接"
            class="form-input"
            required
          >
          <div class="field-tip">请上传营业执照、法人证书等资质文件</div>
        </div>

        <div class="form-group">
          <label>申请说明</label>
          <textarea 
            v-model="form.applyReason" 
            placeholder="请简要说明申请成为管理员的原因（选填）"
            rows="3"
            class="form-textarea"
          ></textarea>
        </div>

        <div class="form-agreement">
          <label class="agreement-checkbox">
            <input type="checkbox" v-model="form.agree" required>
            <span>我已确认所填信息真实有效，并同意接受审核</span>
          </label>
        </div>

        <button type="submit" class="apply-btn" :disabled="loading">
          {{ loading ? '提交中...' : '提交申请' }}
        </button>
      </form>

      <!-- 登录链接 -->
      <div class="login-link">
        <p>
          已有管理员账号？
          <router-link to="/adminLogin">立即登录</router-link>
        </p>
      </div>
      
      <!-- 返回首页 -->
      <div class="back-link">
        <router-link to="/">返回首页</router-link>
      </div>
    </div>

    <!-- 申请成功弹窗 -->
    <div v-if="showSuccessModal" class="modal-overlay" @click.self="closeSuccessModal">
      <div class="modal-container success-modal">
        <div class="modal-header">
          <h3>申请已提交</h3>
        </div>
        <div class="modal-body">
          <div class="success-icon">✓</div>
          <p>您的管理员注册申请已成功提交！</p>
          <p class="modal-tip-text">请耐心等待超级管理员审核，审核通过后我们将通过短信通知您。</p>
          <p class="modal-tip-text">审核周期通常为1-3个工作日。</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn confirm" @click="closeSuccessModal">确 定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminRegisterApply } from '@/api/auth'

const router = useRouter()
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const showSuccessModal = ref(false)

const form = reactive({
  phone: '',
  password: '',
  confirmPassword: '',
  institutionName: '',
  creditCode: '',
  contactPerson: '',
  contactPhone: '',
  qualification: '',
  applyReason: '',
  agree: false
})

// 验证统一社会信用代码格式
const validateCreditCode = (code) => {
  const regex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/
  return regex.test(code)
}

const handleApply = async () => {
  // 表单验证
  if (!form.phone || !form.password || !form.confirmPassword || 
      !form.institutionName || !form.creditCode || 
      !form.contactPerson || !form.contactPhone || !form.qualification) {
    alert('请填写所有必填项')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    alert('请输入正确的手机号')
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
  
  if (!validateCreditCode(form.creditCode)) {
    alert('请输入正确的18位统一社会信用代码')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(form.contactPhone)) {
    alert('请输入正确的联系电话')
    return
  }
  
  if (!form.agree) {
    alert('请确认所填信息真实有效')
    return
  }
  
  loading.value = true
  
  try {
    const response = await adminRegisterApply({
      phone: form.phone,
      password: form.password,
      institutionName: form.institutionName,
      creditCode: form.creditCode,
      contactPerson: form.contactPerson,
      contactPhone: form.contactPhone,
      qualification: form.qualification,
      applyReason: form.applyReason
    })
    
    if (response.code === 200) {
      showSuccessModal.value = true
    } else {
      alert(response.message || '申请提交失败')
    }
  } catch (error) {
    console.error('申请失败:', error)
    alert('申请提交失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const closeSuccessModal = () => {
  showSuccessModal.value = false
  router.push('/adminLogin')
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
  max-width: 600px;
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

.required {
  color: #ff6b6b;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: #fafafa;
  font-family: inherit;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #ff6b6b;
  background: white;
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}

.field-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #999;
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

.form-agreement {
  margin: 24px 0;
}

.agreement-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #666;
  font-size: 14px;
}

.agreement-checkbox input {
  margin-right: 8px;
  cursor: pointer;
  accent-color: #ff6b6b;
}

.apply-btn {
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

.apply-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
}

.apply-btn:disabled {
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

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  animation: slideUp 0.3s ease;
}

.success-modal {
  text-align: center;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  font-size: 20px;
  margin: 0;
  color: #333;
}

.modal-body {
  padding: 32px 24px;
}

.success-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 32px;
  color: white;
}

.modal-body p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.modal-tip-text {
  font-size: 13px;
  color: #999;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: center;
}

.modal-btn {
  padding: 10px 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: white;
}

.modal-btn.confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
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
}
</style>