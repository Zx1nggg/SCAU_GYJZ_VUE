<template>
  <div class="my-subscriptions-container">
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">🔔 我的订阅动态</span>
          <el-button type="primary" plain size="small" @click="loadSubscriptions">刷新记录</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="subscriptionList" stripe style="width: 100%" empty-text="您还没有订阅任何项目哦~">
        <!-- 序号列 -->
        <el-table-column type="index" label="序号" width="80" align="center" />

        <!-- 项目名称 -->
        <el-table-column prop="projectName" label="公益项目名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="project-name">
              {{ row.projectTitle }}
            </span>
          </template>
        </el-table-column>

        <!-- 项目状态 -->
        <el-table-column prop="projectStatus" label="项目状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.projectStatus === 1 ? 'success' : 'info'" effect="light">
              {{ row.projectStatus === 1 ? '募集中' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 订阅时间 -->
        <el-table-column prop="createTime" label="订阅时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleUnsubscribe(row.projectId)">
              取消订阅
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { getMySubscriptions, unsubscribeProject } from '@/api/subscription'

const authStore = useAuthStore()

const loading = ref(false)
const subscriptionList = ref<any[]>([])

// === 加载订阅列表 ===
const loadSubscriptions = async () => {
  const userId = authStore.userInfo?.id
  if (!userId) return

  loading.value = true
  try {
    const res: any = await getMySubscriptions(userId)
    if (res.code === 200) {
      subscriptionList.value = res.data || []
    } else {
      ElMessage.error(res.msg || '加载订阅列表失败')
    }
  } catch (error) {
    console.error('加载订阅列表报错:', error)
    ElMessage.error('加载订阅列表失败')
  } finally {
    loading.value = false
  }
}

// === 取消订阅 ===
const handleUnsubscribe = async (projectId: number) => {
  const userId = authStore.userInfo?.id
  if (!userId) {
    ElMessage.error('未获取到用户信息，请重新登录')
    return
  }

  try {
    await ElMessageBox.confirm('确定不再关注该公益项目的最新动态了吗？', '取消订阅', {
      type: 'warning',
      confirmButtonText: '确定取消',
      cancelButtonText: '再想想'
    })
    
    loading.value = true
    const res: any = await unsubscribeProject(userId, projectId)
    if (res.code === 200) {
      ElMessage.success('已取消订阅')
      await loadSubscriptions() 
    } else {
      ElMessage.error(res.msg || '取消订阅失败')
    }
  } catch (err) {
    // 捕获取消操作
  } finally {
    loading.value = false
  }
}

// === 时间格式化工具 ===
const formatDate = (dateStr: string) => {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

onMounted(() => {
  loadSubscriptions()
})
</script>

<style scoped>
.my-subscriptions-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.box-card {
  border-radius: 12px;
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.project-name {
  font-weight: bold;
  color: #409EFF;
}
</style>