<template>
  <div class="project-list-container">
    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="项目分类">
          <el-select v-model="queryParams.category" placeholder="全部" clearable @change="handleQuery" style="width: 150px">
            <el-option label="助学" value="助学" />
            <el-option label="助老" value="助老" />
            <el-option label="环保" value="环保" />
            <el-option label="医疗" value="医疗" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="queryParams.title" placeholder="搜索项目标题" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 项目列表 -->
    <div v-loading="loading" class="project-grid">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="project in projects" :key="project.id" class="project-col">
          <el-card :body-style="{ padding: '0px' }" class="project-item-card" shadow="hover">
            <div class="image-wrapper">
              <!-- 封面图 -->
              <img 
                :src="resolveImageUrl(project.coverImage)" 
                class="project-cover" 
                @error="handleImageError"
              >
              <div class="status-tag">
                <el-tag :type="project.projectStatus === 1 ? 'success' : 'info'" effect="dark">
                  {{ project.projectStatus === 1 ? '募集中' : '已结束' }}
                </el-tag>
              </div>
            </div>
            
            <div class="project-content">
              <h3 class="project-title">{{ project.title }}</h3>
              <div class="project-category">
                <el-tag size="small" type="info" plain>{{ project.category }}</el-tag>
              </div>
              <p class="project-desc">{{ project.content }}</p>
              
              <div class="progress-section">
                <div class="progress-info">
                  <span>进度：{{ calculatePercent(project) }}%</span>
                  <span>目标：¥{{ project.targetAmount }}</span>
                </div>
                <el-progress 
                  :percentage="calculatePercent(project)" 
                  :status="project.projectStatus === 1 ? '' : 'exception'" 
                  :show-text="false" 
                />
              </div>

              <div class="project-footer">
                <span class="current-amount">已筹：¥{{ project.currentAmount || 0 }}</span>
                <el-button 
                  type="primary" 
                  size="small" 
                  :disabled="project.projectStatus !== 1" 
                  @click="openDonateDialog(project)"
                >
                  我要捐赠
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 无数据提示 -->
      <el-empty v-if="projects.length === 0 && !loading" description="暂无符合条件的项目" />

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :total="total"
          :page-sizes="[8, 12, 24, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleQuery"
          @current-change="loadProjects"
        />
      </div>
    </div>

    <!-- 捐赠对话框 -->
    <el-dialog v-model="donateDialogVisible" title="爱心捐赠" width="420px" destroy-on-close>
      <div v-if="selectedProject" class="donate-form">
        <div class="donate-target-box">
          <p class="donate-label">支持项目：</p>
          <p class="donate-value">{{ selectedProject.title }}</p>
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
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { getProjectList } from '@/api/project'
import { createDonation } from '@/api/donation'

const authStore = useAuthStore()

// 🌟 默认占位图链接 (选用稳定的 CDN 资源)
const DEFAULT_PLACEHOLDER = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png'

// 查询与列表状态
const queryParams = reactive({
  page: 1,
  size: 8,
  title: '',
  category: ''
})
const projects = ref<any[]>([])
const total = ref(0)
const loading = ref(false)

// 捐赠对话框状态
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

// 解析图片路径
const resolveImageUrl = (url: string | null) => {
  if (!url) return DEFAULT_PLACEHOLDER
  return url
}

/**
 * 关键修复：处理图片加载错误
 * 在图片加载失败时，首先取消该图片的 onerror 监听。
 * 这样即使占位图 DEFAULT_PLACEHOLDER 也加载失败，也不会再次触发此函数，从而打破死循环。
 */
const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.onerror = null // 核心：断开监听，防止死循环
  img.src = DEFAULT_PLACEHOLDER
}

const loadProjects = async () => {
  try {
    loading.value = true
    const res: any = await getProjectList(queryParams)
    if (res.code === 200 && res.data) {
      projects.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (err) {
    console.error('加载项目失败', err)
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.page = 1
  loadProjects()
}

const resetQuery = () => {
  queryParams.title = ''
  queryParams.category = ''
  handleQuery()
}

const calculatePercent = (project: any) => {
  if (!project.targetAmount || project.targetAmount === 0) return 0
  const percent = Math.floor(((project.currentAmount || 0) / project.targetAmount) * 100)
  return percent > 100 ? 100 : percent
}

const openDonateDialog = (project: any) => {
  selectedProject.value = project
  donateForm.amount = 10
  donateForm.donorName = authStore.userInfo?.nickname || authStore.userInfo?.phone || ''
  donateForm.remark = ''
  donateDialogVisible.value = true
}

const submitDonation = async () => {
  if (!donateFormRef.value) return
  
  await donateFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        submitting.value = true
        const donationData = {
          projectId: selectedProject.value.id,
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
          loadProjects()
        }
      } catch (err: any) {
        ElMessage.error(err.message || '捐赠失败，请稍后重试')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.project-list-container { padding: 20px; background-color: #f5f7fa; min-height: calc(100vh - 60px); }
.filter-card { margin-bottom: 20px; }
.project-grid { min-height: 400px; }
.project-col { margin-bottom: 24px; }
.project-item-card { height: 100%; display: flex; flex-direction: column; border-radius: 12px; border: none; transition: all 0.3s ease; }
.project-item-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1); }
.image-wrapper { position: relative; height: 180px; }
.project-cover { width: 100%; height: 100%; object-fit: cover; }
.status-tag { position: absolute; top: 12px; right: 12px; }
.project-content { padding: 20px; flex: 1; display: flex; flex-direction: column; }
.project-title { margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #2c3e50; height: 50px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.project-category { margin-bottom: 12px; }
.project-desc { font-size: 14px; color: #7f8c8d; margin-bottom: 20px; height: 66px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
.progress-section { margin-bottom: 20px; }
.progress-info { display: flex; justify-content: space-between; font-size: 13px; color: #95a5a6; margin-bottom: 8px; }
.project-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #f0f2f5; }
.current-amount { font-weight: 700; color: #e74c3c; font-size: 16px; }
.pagination-wrapper { margin: 40px 0; display: flex; justify-content: center; }
.donate-target-box { background-color: #f0f9eb; border-left: 4px solid #67c23a; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px; }
.donate-label { font-size: 13px; color: #67c23a; margin-bottom: 4px; }
.donate-value { font-weight: 600; color: #2c3e50; }
.quick-amounts { display: flex; gap: 10px; margin-top: 8px; }
.amount-tag { cursor: pointer; transition: all 0.2s; }
.amount-tag:hover { background-color: #67c23a; color: white; border-color: #67c23a; }
</style>