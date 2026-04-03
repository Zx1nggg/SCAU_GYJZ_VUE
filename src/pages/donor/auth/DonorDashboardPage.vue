<template>
  <div class="donor-dashboard">
    
    <!-- 欢迎卡片 -->
    <el-card class="welcome-card">
      <div class="welcome-header">
        <div>
          <h2>欢迎回来，{{ authStore.displayName }}！</h2>
          <p>感谢您的爱心捐赠 ❤️</p>
        </div>
        <el-tag type="success" size="large">
          当前身份：捐赠者
        </el-tag>
      </div>
    </el-card>

    <!-- 统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card>
          <div class="stats-number">¥{{ stats.totalAmount }}</div>
          <div class="stats-label">累计捐赠金额</div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <div class="stats-number">{{ stats.totalCount }}</div>
          <div class="stats-label">捐赠次数</div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <div class="stats-number">{{ stats.projectCount }}</div>
          <div class="stats-label">支持项目数</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 项目浏览 -->
    <el-card class="project-card" v-loading="loadingProjects">
      <template #header>
        <div class="card-header">
          <span>推荐公益项目</span>
          <el-button type="primary" link @click="router.push('/donor/main/projects')">查看更多</el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="8" v-for="project in projectList" :key="project.id">
          <el-card shadow="hover" @click="goDetail(project.id)" class="clickable-card">
            <h3 class="project-title">{{ project.name || project.title }}</h3>
            <p class="desc">{{ project.description }}</p>
            <div class="amount">
              目标：¥{{ project.targetAmount || 0 }}
            </div>
            <!-- 可以的话这里可以加个进度条 -->
            <el-button type="primary" size="small" style="margin-top: 10px;">我要捐赠</el-button>
          </el-card>
        </el-col>
        <!-- 如果没有项目时显示 -->
        <el-empty v-if="projectList.length === 0" description="暂无推荐项目" style="width: 100%"></el-empty>
      </el-row>
    </el-card>

    <!-- 我的捐赠记录 -->
    <el-card class="record-card" v-loading="loadingDonations">
      <template #header>
        <div class="card-header">
          <span>我的捐赠记录</span>
        </div>
      </template>

      <el-table :data="donationList">
        <el-table-column prop="projectName" label="项目名称" />
        <el-table-column prop="amount" label="金额" />
        <el-table-column prop="donationTime" label="时间" />
        <el-table-column label="票据">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewReceipt(row)">
              查看票据
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
// 👇 注意这里：引入你需要用来获取数据的 API 方法
import { getMyDonations, getDonorStatistic } from '@/api/donation' 
import { getProjectList } from '@/api/project' // 假设你有专门管理项目的 API

const router = useRouter()
const authStore = useAuthStore()

// 1. 统计数据（初始化为 0）
const stats = ref({
  totalAmount: 0,
  totalCount: 0,
  projectCount: 0
})

// 2. 推荐项目列表（初始化为空数组）
const projectList = ref<any[]>([])
const loadingProjects = ref(false)

// 3. 捐赠记录
const donationList = ref<any[]>([])
const loadingDonations = ref(false)

// 跳转项目详情
const goDetail = (id: number) => {
  router.push(`/donor/project/${id}`)
}

// 查看票据
const viewReceipt = (row: any) => {
  alert(`查看票据功能开发中：${row.projectName}`)
}

// ======================= 数据加载方法 =======================

// 加载统计数据
const loadStats = async () => {
  try {
    const userId = authStore.userInfo?.id // 根据 SQL，统计是用 user_id 查的
    if (!userId) return

    const res = await getDonorStatistic(userId)
    if (res.code === 200 && res.data) {
      stats.value = {
        totalAmount: res.data.totalAmount || 0,
        totalCount: res.data.totalCount || 0,
        projectCount: res.data.projectCount || 0
      }
    }
  } catch (err) {
    console.error('获取统计数据失败', err)
  }
}

// 加载推荐项目 (只取前 3 个)
const loadProjects = async () => {
  try {
    loadingProjects.value = true
    // 假设你的 getProjectList 接受 page 和 size 参数
    const res = await getProjectList({
      page: 1,
      size: 3 // 首页只展示 3 个推荐
    })
    
    if (res.code === 200 && res.data) {
      // 适配 MyBatis-Plus 的 Page 结构
      projectList.value = (res.data.records || [])
    }
  } catch (err) {
    console.error('获取推荐项目失败', err)
  } finally {
    loadingProjects.value = false
  }
}

// 加载捐赠记录
const loadDonations = async () => {
  try {
    loadingDonations.value = true
    const phone = authStore.userInfo?.phone

    if (!phone) {
        console.error('用户未登录')
        return
    }
    const res = await getMyDonations({
      phone,
      page: 1,
      size: 5 // 首页展示最近的 5 条即可
    })

    if (res.code === 200 && res.data) {
      donationList.value = res.data.records || [] // MyBatis-Plus 分页结构
    }
  } catch (err) {
    console.error('加载捐赠记录失败', err)
  } finally {
    loadingDonations.value = false
  }
}

// 页面挂载时统一调用
onMounted(() => {
  // 因为带有 JWT token，现在可以安全并发请求这三个接口了
  loadStats()
  loadProjects()
  loadDonations()
})
</script>

<style scoped>
.donor-dashboard {
  padding: 20px;
}

.welcome-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #67c23a, #95d475);
  color: white;
}
.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.welcome-header h2 {
  margin-top: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-number {
  font-size: 28px;
  font-weight: bold;
  color: #f56c6c;
}
.stats-label {
  margin-top: 8px;
  color: #909399;
  font-size: 14px;
}

.project-card, .record-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clickable-card {
  cursor: pointer;
  transition: all 0.3s;
}
.clickable-card:hover {
  transform: translateY(-5px);
}

.project-title {
  margin-top: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.desc {
  color: #666;
  margin: 10px 0;
  height: 40px; /* 固定高度保持卡片整齐 */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.amount {
  margin-bottom: 10px;
  color: #409eff;
  font-weight: bold;
}
</style>