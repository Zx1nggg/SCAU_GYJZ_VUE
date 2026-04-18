<template>
  <div class="donor-layout">
    <!-- 顶部导航 -->
    <div class="donor-header">
      <div class="header-left">
        <div class="logo" @click="router.push('/donor/main/dashboard')">
          <el-icon :size="24"><StarFilled /></el-icon>
          <span>爱心捐赠平台</span>
        </div>
      </div>

      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <div class="user-info">
            <el-avatar :src="authStore.userAvatar || defaultAvatar" :size="40" />
            <span class="user-name">{{ authStore.displayName }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人中心
              </el-dropdown-item>
              <el-dropdown-item command="records">
                <el-icon><Document /></el-icon>
                我的捐赠
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 主体 -->
    <div class="donor-container">
      <!-- 侧边栏 -->
      <div class="donor-sidebar">
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
        >
          <el-menu-item index="/donor/main/dashboard">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>

          <el-menu-item index="/donor/main/projects">
            <el-icon><Goods /></el-icon>
            <span>公益项目</span>
          </el-menu-item>

          <el-menu-item index="/donor/main/records">
            <el-icon><Document /></el-icon>
            <span>我的捐赠</span>
          </el-menu-item>

          <el-menu-item index="/donor/main/subscriptions">
            <el-icon><Bell /></el-icon>
            <span>我的订阅</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 内容区 -->
      <div class="donor-content">
        <router-view />
      </div>
    </div>
    <!-- 在最外层容器的底部挂载 AI 聊天助手 -->
    <AiChatAssistant />
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox,ElMessage } from 'element-plus'
import {
  ArrowDown, User, SwitchButton, House, Goods, Document, Bell,
  StarFilled
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import AiChatAssistant from '@/components/AiChatAssistant.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 当前菜单高亮
const activeMenu = computed(() => route.path)

// 下拉菜单
const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/donor/main/profile')
      break
    case 'records':
      router.push('/donor/main/records')
      break
    case 'logout':
      executeLogout()
      break
  }
}

const executeLogout = () => {
  ElMessageBox.confirm(
    '确定要退出当前账号吗？',
    '退出提示',
    {
      confirmButtonText: '安全退出',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const authStore = useAuthStore()
    
    // 1. 清除 Pinia 里的状态
    authStore.token = ''
    authStore.userInfo = null
  
    // 2. 精准清除捐赠人专属的登录状态。不要碰 donor_saved_password 和 admin_ 的数据
    localStorage.removeItem('donor_token')
    localStorage.removeItem('donor_userInfo')
    localStorage.removeItem('donor_isLoggedIn')
    localStorage.removeItem('donor_userType')

    sessionStorage.removeItem('donor_token')
    sessionStorage.removeItem('donor_userInfo')
    sessionStorage.removeItem('donor_isLoggedIn')
    sessionStorage.removeItem('donor_userType')

    // 3. 提示并跳转
    ElMessage.success('已安全退出，让爱心稍作休息')
    
    // 原生跳转回捐赠人登录页，彻底刷新浏览器内存，防止状态残留
    window.location.href = '/donorLogin' 
    
  }).catch(() => {
    // 用户点击取消，继续留在页面
  })
}

</script>
<style scoped>
.donor-layout {
  min-height: 100vh;
  background: #f0f2f5;
}

.donor-header {
  height: 60px;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
  cursor: pointer;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.donor-container {
  display: flex;
  height: calc(100vh - 60px);
}

.donor-sidebar {
  width: 200px;
  background: #304156;
}

.donor-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>