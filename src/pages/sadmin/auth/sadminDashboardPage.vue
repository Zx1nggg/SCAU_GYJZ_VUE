<template>
  <div class="super-dashboard">
    
    <!-- 欢迎卡片 -->
    <el-card class="welcome-card" shadow="never">
      <div class="welcome-header">
        <div class="welcome-text">
          <h2>欢迎回来，超级管理员 {{ authStore.displayName }}！</h2>
          <p>您拥有 SCAU 公益平台的最高操作权限，请谨慎处理每一项机构入驻申请与用户数据。</p>
        </div>
        <div class="welcome-icon">
          <el-icon :size="60" color="rgba(255,255,255,0.8)"><Monitor /></el-icon>
        </div>
      </div>
    </el-card>

    <!-- 平台数据大盘 (展示用，后期可接真实接口) -->
    <el-row :gutter="24" class="stats-row">
      <el-col :xs="24" :md="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon warning-icon"><el-icon><DocumentChecked /></el-icon></div>
          <div class="stat-info">
            <div class="stat-label">待处理机构申请</div>
            <div class="stat-number text-warning">{{ stats.pendingApplyCount }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon success-icon"><el-icon><OfficeBuilding /></el-icon></div>
          <div class="stat-info">
            <div class="stat-label">已入驻机构总数</div>
            <div class="stat-number text-success">{{ stats.approvedOrgCount }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon primary-icon"><el-icon><UserFilled /></el-icon></div>
          <div class="stat-info">
            <div class="stat-label">全平台注册用户</div>
            <div class="stat-number text-primary">{{ stats.totalUserCount }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作入口 -->
    <el-card class="quick-actions-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">核心业务直达</span>
        </div>
      </template>
      
      <el-row :gutter="30">
        <!-- 申请处理快捷卡片 -->
        <el-col :xs="24" :md="12">
          <div class="action-box action-apply" @click="router.push('/sadmin/main/applications')">
            <div class="action-icon">
              <el-icon :size="40"><DocumentAdd /></el-icon>
            </div>
            <div class="action-text">
              <h3>处理机构入驻申请</h3>
              <p>审批公益机构提交的注册和资质材料，决定是否放行入驻。</p>
            </div>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </div>
        </el-col>

        <!-- 用户管理快捷卡片 -->
        <el-col :xs="24" :md="12">
          <div class="action-box action-users" @click="router.push('/sadmin/main/users')">
            <div class="action-icon">
              <el-icon :size="40"><Avatar /></el-icon>
            </div>
            <div class="action-text">
              <h3>全平台用户管理</h3>
              <p>管理平台内的所有捐赠人账号，可执行封禁、解禁及档案核查。</p>
            </div>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </div>
        </el-col>
      </el-row>
    </el-card>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { 
  Monitor, DocumentChecked, OfficeBuilding, UserFilled,
  DocumentAdd, Avatar, ArrowRight 
} from '@element-plus/icons-vue'
import { getPlatformStats } from '@/api/sadmin'

const router = useRouter()
const authStore = useAuthStore()

const stats = ref({
  pendingApplyCount: 0,
  approvedOrgCount: 0,
  totalUserCount: 0
})

// 加载全平台统计数据
const loadPlatformStats = async () => {
  try {
    const res: any = await getPlatformStats()
    if (res.code === 200 && res.data) {
      stats.value = res.data
    }
  } catch (err) {
    console.error('加载平台统计数据失败', err)
  }
}

// 页面挂载时调用
onMounted(() => {
  loadPlatformStats()
})

</script>

<style scoped>
.super-dashboard {
  padding: 0;
}

.welcome-card {
  margin-bottom: 24px;
  background: linear-gradient(135deg, #F56C6C 0%, #E6A23C 100%);
  color: white;
  border: none;
  border-radius: 12px;
}

.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

.welcome-text h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
  letter-spacing: 1px;
}

.welcome-text p {
  margin: 0;
  font-size: 15px;
  opacity: 0.9;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  border: none;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 24px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  margin-right: 20px;
}

.warning-icon { background-color: #fdf6ec; color: #E6A23C; }
.success-icon { background-color: #f0f9eb; color: #67C23A; }
.primary-icon { background-color: #ecf5ff; color: #409EFF; }

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
}

.text-warning { color: #E6A23C; }
.text-success { color: #67C23A; }
.text-primary { color: #409EFF; }

.quick-actions-card {
  border-radius: 12px;
  border: none;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.action-box {
  display: flex;
  align-items: center;
  padding: 30px 24px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.action-apply {
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
}
.action-apply:hover {
  background-color: #fde2e2;
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(245, 108, 108, 0.15);
}
.action-apply .action-icon { color: #F56C6C; }

.action-users {
  background-color: #ecf5ff;
  border: 1px solid #d9ecff;
}
.action-users:hover {
  background-color: #d9ecff;
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(64, 158, 255, 0.15);
}
.action-users .action-icon { color: #409EFF; }

.action-icon {
  margin-right: 24px;
}

.action-text h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
}

.action-text p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.arrow-icon {
  position: absolute;
  right: 24px;
  font-size: 24px;
  color: #909399;
  opacity: 0.5;
  transition: transform 0.3s;
}

.action-box:hover .arrow-icon {
  transform: translateX(5px);
  opacity: 1;
}
</style>