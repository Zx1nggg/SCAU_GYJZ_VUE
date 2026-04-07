<template>
  <div class="admin-layout">
    <!-- 顶部导航栏 -->
    <div class="admin-header">
      <div class="header-left">
        <div class="logo" @click="router.push('/admin/main')">
          <el-icon :size="24"><Management /></el-icon>
          <span>公益机构管理后台</span>
        </div>
      </div>
      <div class="header-right">
        <el-badge :value="notificationCount" :hidden="notificationCount === 0">
          <el-button :icon="Bell" circle @click="showNotifications" />
        </el-badge>
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
                个人资料
              </el-dropdown-item>
              <el-dropdown-item command="org">
                <el-icon><OfficeBuilding /></el-icon>
                机构信息
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <el-icon><Setting /></el-icon>
                账号设置
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

    <div class="admin-container">
      <!-- 侧边栏 -->
      <div class="admin-sidebar">
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          router
          background-color="#1f2d3d"
          text-color="#bfcbd9"
          active-text-color="#409eff"
        >
          <el-menu-item index="/admin/main/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          
          <el-sub-menu index="projects">
            <template #title>
              <el-icon><Folder /></el-icon>
              <span>公益项目</span>
            </template>
            <el-menu-item index="/admin/main/projects">
              <el-icon><List /></el-icon>
              <span>项目列表</span>
            </el-menu-item>

          </el-sub-menu>

          <el-sub-menu index="/admin/main/donations">
            <template #title>
              <el-icon><Money /></el-icon>
              <span>捐赠管理</span>
            </template>
            <el-menu-item index="/admin/main/donations">
              <el-icon><List /></el-icon>
              <span>捐赠记录</span>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item index="/admin/main/reports">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据报表</span>
          </el-menu-item>

          <el-menu-item index="/admin/main/settings">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 主内容区 - 子路由出口 -->
      <div class="admin-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Management, Bell, ArrowDown, User, OfficeBuilding, Setting,
  SwitchButton, Odometer, Folder, List, Plus, Money,
  DataAnalysis
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notificationCount = ref(3)
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 当前激活的菜单项
const activeMenu = computed(() => route.path)

// 显示通知
const showNotifications = () => {
  ElMessage.info('您有3条未读通知')
}

// 处理下拉菜单
const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      // 占位路由：后续你可以把个人资料、机构信息都整合进 settings 页面当做不同的 tab
      router.push('/admin/main/settings?tab=profile') 
      break
    case 'org':
      router.push('/admin/main/settings?tab=org')
      break
    case 'settings':
      router.push('/admin/main/settings')
      break
    case 'logout':
      executeLogout()
      break
  }
}
// 退出登录核心逻辑
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
    // 1. 清除 Pinia 里的状态 (直接置空)
    authStore.token = ''
    authStore.userInfo = null
    // 或者直接调用 authStore 里的退出方法：authStore.logoutAction()
    
    // 2. 清除本地存储 (如果有的话)
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUserInfo')

    // 3. 提示并跳转
    ElMessage.success('已安全退出系统')
    router.push('/adminLogin') // 注意改成你实际的登录路由路径
    
  }).catch(() => {
    // 用户点击取消，不执行任何操作
  })
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f0f2f5;
}

.admin-header {
  height: 60px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left .logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 40px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f5f5;
}

.user-name {
  font-size: 14px;
  color: #333;
}

.admin-container {
  display: flex;
  height: calc(100vh - 60px);
}

.admin-sidebar {
  width: 240px;
  background: #1f2d3d;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
}

.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-sidebar {
    position: fixed;
    left: -240px;
    transition: left 0.3s;
    z-index: 200;
  }
  
  .admin-sidebar.open {
    left: 0;
  }
  
  .admin-content {
    margin-left: 0;
  }
}
</style>