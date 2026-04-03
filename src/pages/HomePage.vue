<template>
  <div class="home-page">
    <!-- 顶部公益图片 -->
    <div class="hero-section">
      <div class="hero-image">
        <img src="/src/assets/charity-banner.png" alt="公益图片" />
        <div class="hero-overlay"></div>
      </div>
      <div class="hero-content">
        <h1 class="welcome-title">欢迎使用公益捐赠系统</h1>
        <p class="welcome-subtitle">让爱心传递，让温暖延续</p>
      </div>
    </div>

    <!-- 登录选择区域 -->
    <div class="login-section">
      <div class="login-buttons">
        <!-- 左边：捐赠人登录按钮 -->
        <div class="login-card donor-card" @click="goToDonorLogin">
          <div class="card-icon">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              <circle cx="12" cy="12" r="4"/>
            </svg>
          </div>
          <h3>捐赠人登录</h3>
          <p>查看项目、参与捐赠、记录爱心</p>
          <div class="arrow-icon">→</div>
        </div>

        <!-- 右边：管理员登录按钮 -->
        <div class="login-card admin-card" @click="goToAdminLogin">
          <div class="card-icon">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 15v2m-6-4h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zm10-4V8a4 4 0 0 0-8 0v3h8z"/>
            </svg>
          </div>
          <h3>管理员登录</h3>
          <p>项目管理、数据统计、系统配置</p>
          <div class="arrow-icon">→</div>
        </div>
      </div>

      <!-- 注册跳转链接 -->
      <div class="register-links">
        <div class="register-item">
          <p>
            还没有捐赠人账号？
            <span class="link-text" @click="goToDonorRegister">立即注册</span>
          </p>
        </div>
        <div class="register-item">
          <p>
            还没有管理员账号？
            <span class="link-text" @click="goToAdminRegister">立即注册</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 跳转到捐赠人登录页
const goToDonorLogin = () => {
  router.push('/donorLogin')
}

// 跳转到管理员登录页
const goToAdminLogin = () => {
  router.push('/adminLogin')
}

// 跳转到捐赠人注册页
const goToDonorRegister = () => {
  router.push('/donorRegister')
}

// 跳转到管理员注册页
const goToAdminRegister = () => {
  router.push('/adminRegister')
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Hero 区域 */
.hero-section {
  position: relative;
  height: 60vh;
  min-height: 500px;
  overflow: hidden;
}

.hero-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: scaleUp 20s ease-out;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%);
}

.hero-content {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: white;
  z-index: 1;
  padding: 0 20px;
}

.welcome-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  animation: fadeInUp 0.8s ease-out;
}

.welcome-subtitle {
  font-size: 1.2rem;
  opacity: 0.95;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

/* 登录选择区域 */
.login-section {
  max-width: 1200px;
  margin: -80px auto 0;
  padding: 0 20px 60px;
  position: relative;
  z-index: 2;
}

.login-buttons {
  display: flex;
  gap: 30px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 50px;
}

.login-card {
  flex: 1;
  min-width: 280px;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ff6b6b, #ff8e53);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.login-card:hover::before {
  transform: scaleX(1);
}

.login-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

.donor-card:hover {
  background: linear-gradient(135deg, #fff 0%, #ffe8e8 100%);
}

.admin-card:hover {
  background: linear-gradient(135deg, #fff 0%, #e8f0ff 100%);
}

.card-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.login-card:hover .card-icon {
  transform: scale(1.1);
}

.icon {
  width: 40px;
  height: 40px;
  color: white;
}

.login-card h3 {
  font-size: 1.8rem;
  margin-bottom: 12px;
  color: #333;
}

.login-card p {
  color: #666;
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.arrow-icon {
  font-size: 1.5rem;
  color: #ff6b6b;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.login-card:hover .arrow-icon {
  opacity: 1;
  transform: translateX(0);
}

/* 注册链接区域 */
.register-links {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.register-item {
  text-align: center;
}

.register-item p {
  font-size: 1rem;
  color: #666;
  margin: 0;
}

.link-text {
  color: #ff6b6b;
  cursor: pointer;
  font-weight: 600;
  margin-left: 5px;
  transition: color 0.3s ease;
  position: relative;
}

.link-text::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: #ff6b6b;
  transition: width 0.3s ease;
}

.link-text:hover {
  color: #ff4757;
}

.link-text:hover::after {
  width: 100%;
}

/* 动画 */
@keyframes scaleUp {
  from {
    transform: scale(1.1);
  }
  to {
    transform: scale(1);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-section {
    height: 50vh;
    min-height: 400px;
  }
  
  .welcome-title {
    font-size: 2rem;
  }
  
  .welcome-subtitle {
    font-size: 1rem;
  }
  
  .login-section {
    margin-top: -40px;
  }
  
  .login-buttons {
    gap: 20px;
  }
  
  .login-card {
    padding: 30px 20px;
    min-width: 260px;
  }
  
  .card-icon {
    width: 60px;
    height: 60px;
  }
  
  .icon {
    width: 30px;
    height: 30px;
  }
  
  .login-card h3 {
    font-size: 1.5rem;
  }
  
  .register-links {
    flex-direction: column;
    gap: 15px;
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .welcome-title {
    font-size: 1.5rem;
  }
  
  .login-card {
    padding: 25px 15px;
  }
}
</style>