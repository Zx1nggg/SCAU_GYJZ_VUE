<template>
  <div class="super-admin-layout">
    <!-- 顶部导航 -->
    <div class="admin-header">
      <div class="header-left">
        <div class="logo" @click="router.push('/admin/super-dashboard')">
          <el-icon :size="24" color="#F56C6C"><Platform /></el-icon>
          <span class="logo-text">SCAU 公益平台 · 超级管理中心</span>
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
              <el-dropdown-item disabled>
                <el-tag type="danger" size="small" effect="dark">最高权限</el-tag>
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
    <div class="admin-container">
      <!-- 侧边栏 (深色系强调后台管理属性) -->
      <div class="admin-sidebar">
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#2b2f3a"
          text-color="#bfcbd9"
          active-text-color="#F56C6C"
          class="super-sidebar-menu"
        >
          <el-menu-item index="/sadmin/main/super-dashboard">
            <el-icon><DataBoard /></el-icon>
            <span>平台总览</span>
          </el-menu-item>

          <!-- 超管核心功能：申请处理 -->
          <el-menu-item index="/sadmin/main/applications">
            <el-icon><DocumentChecked /></el-icon>
            <span>申请处理</span>
          </el-menu-item>

          <!-- 超管核心功能：用户管理 -->
          <el-menu-item index="/sadmin/main/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 内容区 -->
      <div class="admin-content">
        <!-- 路由动画过渡效果 -->
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowDown, SwitchButton, Platform, DataBoard, DocumentChecked, User
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 自动高亮当前激活的路由菜单
const activeMenu = computed(() => route.path)

// 下拉菜单操作
const handleCommand = async (command: string) => {
  if (command === 'logout') {
    await authStore.logout()
    ElMessage.success('已安全退出超级管理中心')
    router.push('/adminLogin')
  }
}
</script>

<style scoped>
.super-admin-layout {
  min-height: 100vh;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
}

.admin-header {
  height: 60px;
  background: #2b2f3a; /* 顶部栏也采用深色，彰显超管权限 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: white;
  z-index: 10;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 1px;
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
  color: white;
}

.user-name {
  font-weight: 500;
}

.admin-container {
  display: flex;
  flex: 1;
  height: calc(100vh - 60px);
  overflow: hidden;
}

.admin-sidebar {
  width: 220px;
  background: #2b2f3a;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.1);
}

.super-sidebar-menu {
  border-right: none;
}

.admin-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: #f0f2f5;
}

/* 路由切换动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}
.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>