<template>
  <div class="admin-dashboard">
    <!-- 欢迎卡片 -->
    <el-card class="welcome-card">
      <div class="welcome-header">
        <div>
          <h2>欢迎回来，{{ authStore.displayName }}！</h2>
          <p>今天是 {{ currentDate }}，祝您工作愉快</p>
        </div>
        <div class="stats-badge">
          <el-tag type="success" size="large">
            管理员权限：{{ authStore.roleText }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-info">
              <div class="stats-number">{{ stats.totalProjects }}</div>
              <div class="stats-label">公益项目</div>
            </div>
            <div class="stats-icon" style="background: #409eff20; color: #409eff">
              <el-icon :size="40"><Folder /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-info">
              <div class="stats-number">{{ stats.totalDonationCount }}</div>
              <div class="stats-label">捐赠总笔数</div>
            </div>
            <div class="stats-icon" style="background: #67c23a20; color: #67c23a">
              <el-icon :size="40"><Money /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-info">
              <div class="stats-number">¥{{ stats.totalAmount }}</div>
              <div class="stats-label">捐赠总额</div>
            </div>
            <div class="stats-icon" style="background: #e6a23c20; color: #e6a23c">
              <el-icon :size="40"><Wallet /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-info">
              <div class="stats-number">{{ stats.totalUsers }}</div>
              <div class="stats-label">注册用户</div>
            </div>
            <div class="stats-icon" style="background: #f56c6c20; color: #f56c6c">
              <el-icon :size="40"><User /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表和列表 -->
    <el-row :gutter="20">
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>捐赠趋势（近7天）</span>
            </div>
          </template>
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="8">
        <el-card class="activity-card">
          <template #header>
            <div class="card-header">
              <span>最新动态</span>
              <el-button type="primary" link @click="loadRecentActivities">刷新</el-button>
            </div>
          </template>
          <div v-loading="loadingActivities" style="min-height: 200px;">
            <el-empty v-if="recentActivities.length === 0" description="暂无动态" :image-size="60" />
            <el-timeline v-else>
              <el-timeline-item
                v-for="activity in recentActivities"
                :key="activity.id"
                :timestamp="activity.time"
                :type="activity.type"
                placement="top"
              >
                <!-- 增加了提示气泡，鼠标悬停可看支持的具体项目 -->
                <el-tooltip :content="'支持项目：' + activity.projectTitle" placement="left" v-if="activity.projectTitle">
                  <span style="cursor: pointer; font-weight: 500;">{{ activity.content }}</span>
                </el-tooltip>
                <span v-else style="font-weight: 500;">{{ activity.content }}</span>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { Folder, Money, Wallet, User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getOrgProjectStats } from '@/api/project'
import { getDonationList } from '@/api/donation' 
import request from '@/utils/request' // 引入request以调用趋势接口

const authStore = useAuthStore()
const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 当前日期
const currentDate = ref('')
const updateDate = () => {
  const now = new Date()
  currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
}
updateDate()

// 统计数据
const stats = ref({
  totalProjects: 0,
  totalDonationCount: 0,
  totalAmount: '',
  totalUsers: 0
})

// 加载当前组织下的统计数据
const loadOrgStats = async () => {
  try {
    const orgId = authStore.userInfo?.orgId
    if (!orgId) return

    const res: any = await getOrgProjectStats(orgId)
    if (res.code === 200 && res.data) {
      const data = res.data
      stats.value.totalProjects = data.totalProjectCount
      stats.value.totalAmount = data.totalAmount.toLocaleString() 
      stats.value.totalUsers = data.totalDonorCount
      stats.value.totalDonationCount = data.totalDonationCount
    }
  } catch (err) {
    console.error('加载机构统计失败', err)
  }
}

// === 最新动态（真实捐赠数据） ===
const recentActivities = ref<any[]>([])
const loadingActivities = ref(false)

// 时间格式化工具：转换为 "几分钟前", "几小时前"
const formatTimeAgo = (timeStr: string) => {
  if (!timeStr) return '刚刚'
  // 兼容部分带 T 的时间格式
  const date = new Date(timeStr.replace('T', ' ')).getTime()
  const now = new Date().getTime()
  const diff = (now - date) / 1000 // 秒

  if (diff < 60) return '刚刚'
  if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前'
  if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前'
  if (diff < 2592000) return Math.floor(diff / 86400) + ' 天前'
  
  // 超过一个月直接显示日期
  return timeStr.split('T')[0]
}

const loadRecentActivities = async () => {
  const orgId = authStore.userInfo?.orgId
  if (!orgId) return

  loadingActivities.value = true
  try {
    // 因为 getDonationList 内部已经处理了 orgId，这里只需要传分页参数即可
    const res: any = await getDonationList({ page: 1, size: 5 })
    
    if (res.code === 200 && res.data && res.data.records) {
      // 颜色循环数组，让时间轴更生动
      const types = ['primary', 'success', 'warning', 'danger', 'info']
      
      recentActivities.value = res.data.records.map((item: any, index: number) => {
        // 脱敏处理手机号
        const phone = item.donorPhone || '热心人士'
        const maskPhone = phone.length === 11 ? `${phone.substring(0, 3)}****${phone.substring(7)}` : phone

        return {
          id: item.id,
          content: `收到 ${maskPhone} 的捐赠 ¥${item.amount}`,
          projectTitle: item.projectTitle || '爱心项目', // 用于 tooltip 悬浮显示
          time: formatTimeAgo(item.donationTime || item.createTime),
          type: types[index % types.length]
        }
      })
    }
  } catch (err) {
    console.error('获取最新动态失败', err)
  } finally {
    loadingActivities.value = false
  }
}


// === 图表动态数据加载 ===
const loadChartTrend = async () => {
  try {
    const orgId = authStore.userInfo?.orgId
    const res: any = await request.get('/v1/donations/donations-trend', {
      params: { orgId, days: 7 }
    })
    
    if (res.code === 200 && res.data) {
      // 提取 X 轴日期 (把 2026-03-22 截取为 03-22)
      const dates = res.data.map((item: any) => item.date.substring(5))
      // 提取 Y 轴每天对应的总金额
      const amounts = res.data.map((item: any) => item.amount)
      
      // 执行渲染
      renderChart(dates, amounts)
    }
  } catch (err) {
    console.error('加载图表趋势失败', err)
  }
}

// 渲染或更新图表
const renderChart = (dates: string[], amounts: number[]) => {
  if (chartRef.value) {
    if (!chartInstance) {
      chartInstance = echarts.init(chartRef.value)
    }
    
    chartInstance.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: dates // 植入后端传来的动态日期
      },
      yAxis: { type: 'value', name: '捐赠金额(元)' },
      series: [{
        data: amounts, // 植入后端传来的动态金额
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        lineStyle: { width: 3, color: '#409eff' },
        itemStyle: { color: '#409eff' }
      }]
    })
  }
}

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  loadOrgStats()
  loadRecentActivities() 
  loadChartTrend() // 🌟 挂载时触发加载图表
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.admin-dashboard {
  padding: 0;
}

.welcome-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.welcome-card :deep(.el-card__body) {
  padding: 24px;
}

.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.welcome-header p {
  margin: 0;
  opacity: 0.9;
}

.stats-badge :deep(.el-tag) {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  margin-bottom: 20px;
}

.stats-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-number {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stats-label {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
}

.pending-card {
  margin-top: 20px;
}
</style>