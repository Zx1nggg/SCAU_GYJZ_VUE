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
          <el-card shadow="hover" class="clickable-card">
            <!-- 图片区域  -->
            <img 
              :src="resolveImageUrl(project.coverImage)" 
              class="project-cover" 
              @error="handleImageError"
            >
            <div class="project-content">
              <h3 class="project-title">{{ project.name || project.title }}</h3>
              <p class="desc">{{ project.content || project.description || '暂无简介' }}</p>
              <div class="progress-info">
                <span>进度：{{ calculatePercent(project) }}%</span>
                <span>目标：¥{{ project.targetAmount || 0 }}</span>
              </div>
              <el-progress 
                :percentage="calculatePercent(project)" 
                :status="project.projectStatus === 1 ? '' : 'exception'" 
                :show-text="false" 
              />
              <el-button 
                type="primary" 
                size="small" 
                style="margin-top: 15px; width: 100%;" 
                :disabled="project.projectStatus !== 1"
                @click="openDonateDialog(project)"
              >
                我要捐赠
              </el-button>
            </div>
          </el-card>
        </el-col>
        <!-- 如果没有项目时显示 -->
        <el-empty v-if="projectList.length === 0" description="暂无推荐项目" style="width: 100%"></el-empty>
      </el-row>
    </el-card>

    <!-- 我的订阅记录 -->
    <el-card class="record-card" v-loading="loadingSubscriptions">
      <template #header>
        <div class="card-header">
          <span>我的订阅动态</span>
        </div>
      </template>

      <el-table :data="subscriptionList">
        <el-table-column prop="projectTitle" label="项目名称" show-overflow-tooltip />
        <el-table-column prop="projectStatus" label="项目状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.projectStatus === 1 ? 'success' : 'info'">
              {{ row.projectStatus === 1 ? '进行中' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="订阅时间" width="180">
           <template #default="{ row }">
             {{ formatDate(row.createTime) }}
           </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <!-- 🌟 直接改造成捐赠按钮 -->
            <el-button 
              type="primary" 
              link 
              :disabled="row.projectStatus !== 1"
              @click="openDonateDialog(row)"
            >
              去捐赠
            </el-button>
            <el-divider direction="vertical" />
            <el-button type="danger" link @click="handleUnsubscribe(row.projectId)">
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 🌟 引入全局统一的爱心捐赠对话框 -->
    <el-dialog v-model="donateDialogVisible" title="爱心捐赠" width="420px" destroy-on-close>
      <div v-if="selectedProject" class="donate-form">
        <div class="donate-target-box">
          <p class="donate-label">支持项目：</p>
          <!-- 兼容推荐项目和订阅列表两种不同的字段名 -->
          <p class="donate-value">{{ selectedProject.title || selectedProject.projectName }}</p>
        </div>
        
        <el-form :model="donateForm" ref="donateFormRef" :rules="donateRules" label-position="top">
          <el-form-item label="捐赠金额 (元)" prop="amount">
            <el-input-number v-model="donateForm.amount" :precision="2" :step="10" :min="0.01" style="width: 100%" />
            <div class="quick-amounts">
              <el-tag v-for="a in [10, 50, 100, 500]" :key="a" @click="donateForm.amount = a" class="amount-tag">
                ¥{{ a }}
              </el-tag>
            </div>
          </el-form-item>
          
          <el-form-item label="您的姓名/昵称" prop="donorName">
            <el-input v-model="donateForm.donorName" placeholder="请输入用于显示的名称" />
          </el-form-item>
          
          <el-form-item label="爱心寄语">
            <el-input v-model="donateForm.remark" type="textarea" :rows="2" placeholder="给受助者一点鼓励吧..." />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="donateDialogVisible = false">取消</el-button>
          <el-button type="success" :loading="submitting" @click="submitDonation">确认支付</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

// API
import { getDonorStatistic, createDonation } from '@/api/donation' 
import { getProjectList } from '@/api/project'
import { getMySubscriptions, unsubscribeProject } from '@/api/subscription'

const router = useRouter()
const authStore = useAuthStore()

// 默认图片占位
const DEFAULT_PLACEHOLDER = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png'

// 1. 统计数据
const stats = ref({
  totalAmount: 0,
  totalCount: 0,
  projectCount: 0
})

// 2. 推荐项目
const projectList = ref<any[]>([])
const loadingProjects = ref(false)

// 3. 订阅记录
const loadingSubscriptions = ref(false)
const subscriptionList = ref<any[]>([])

// 🌟 4. 捐赠弹窗相关状态
const donateDialogVisible = ref(false)
const submitting = ref(false)
const selectedProject = ref<any>(null)
const donateFormRef = ref()
const donateForm = reactive({
  amount: 10,
  donorName: '',
  remark: ''
})

const donateRules = {
  amount: [{ required: true, message: '请输入捐赠金额', trigger: 'blur' }],
  donorName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }]
}

// ======================= 弹窗操作方法 =======================

// 打开捐赠弹窗 (无论是推荐项目还是订阅记录，都调用这个)
const openDonateDialog = (project: any) => {
  selectedProject.value = project
  donateForm.amount = 10
  donateForm.donorName = authStore.userInfo?.nickname || authStore.userInfo?.phone || ''
  donateForm.remark = ''
  donateDialogVisible.value = true
}

// 提交捐赠
const submitDonation = async () => {
  if (!donateFormRef.value) return
  
  await donateFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        submitting.value = true
        const donationData = {
          // 兼容推荐卡片(id)和订阅列表(projectId)
          projectId: selectedProject.value.id || selectedProject.value.projectId, 
          userId: authStore.userInfo?.id,
          donorName: donateForm.donorName,
          donorPhone: authStore.userInfo?.phone,
          amount: donateForm.amount,
          remark: donateForm.remark,
          source: 1,
          payment: '模拟支付',
          donationStatus: 1,
          donorTime: new Date().toISOString()
        }

        const res: any = await createDonation(donationData)
        if (res.code === 200) {
          ElMessage.success('捐赠成功！感谢您的爱心支持 ❤️')
          donateDialogVisible.value = false
          // 捐赠成功后自动刷新统计数据
          loadStats()
        }
      } catch (err: any) {
        ElMessage.error(err.message || '捐赠失败，请稍后重试')
      } finally {
        submitting.value = false
      }
    }
  })
}

// ======================= 数据加载与辅助方法 =======================

const resolveImageUrl = (url: string | null) => {
  if (!url) return DEFAULT_PLACEHOLDER
  return url
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.onerror = null 
  img.src = DEFAULT_PLACEHOLDER
}

const calculatePercent = (project: any) => {
  if (!project.targetAmount || project.targetAmount === 0) return 0
  const percent = Math.floor(((project.currentAmount || 0) / project.targetAmount) * 100)
  return percent > 100 ? 100 : percent
}

const loadStats = async () => {
  try {
    const userId = authStore.userInfo?.id 
    if (!userId) return

    const res: any = await getDonorStatistic(userId)
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

const loadProjects = async () => {
  try {
    loadingProjects.value = true
    const res: any = await getProjectList({
      page: 1,
      size: 3 // 首页只展示 3 个推荐
    })
    
    if (res.code === 200 && res.data) {
      projectList.value = (res.data.records || [])
    }
  } catch (err) {
    console.error('获取推荐项目失败', err)
  } finally {
    loadingProjects.value = false
  }
}

const loadSubscriptions = async () => {
  const userId = authStore.userInfo?.id
  if (!userId) return

  loadingSubscriptions.value = true
  try {
    const res: any = await getMySubscriptions(userId)
    if (res.code === 200) {
      subscriptionList.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('加载订阅列表失败')
  } finally {
    loadingSubscriptions.value = false
  }
}

const handleUnsubscribe = async (projectId: number) => {
  const userId = authStore.userInfo?.id
  if (!userId) return

  try {
    await ElMessageBox.confirm('确定要取消订阅该公益项目吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    
    const res: any = await unsubscribeProject(userId, projectId)
    if (res.code === 200) {
      ElMessage.success('已取消订阅')
      loadSubscriptions() 
    }
  } catch (err) {
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  loadStats()
  loadProjects()
  loadSubscriptions()
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
  transition: all 0.3s;
  border-radius: 12px;
  overflow: hidden;
  border: none;
}
.clickable-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}
.project-cover {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
}
.project-content {
  padding: 15px;
}

.project-title {
  margin: 0 0 10px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 16px;
}
.desc {
  color: #666;
  margin: 10px 0;
  height: 40px;
  font-size: 13px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 6px;
}

/* 捐赠对话框样式 */
.donate-target-box { background-color: #f0f9eb; border-left: 4px solid #67c23a; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px; }
.donate-label { font-size: 13px; color: #67c23a; margin-bottom: 4px; }
.donate-value { font-weight: 600; color: #2c3e50; }
.quick-amounts { display: flex; gap: 10px; margin-top: 8px; }
.amount-tag { cursor: pointer; transition: all 0.2s; }
.amount-tag:hover { background-color: #67c23a; color: white; border-color: #67c23a; }
</style>