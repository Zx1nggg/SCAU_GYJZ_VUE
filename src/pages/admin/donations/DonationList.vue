<template>
  <div class="donation-list">
    <!-- 项目搜索栏 -->
    <el-card class="search-card">
      <el-form :model="projectSearch" inline>
        <el-form-item label="项目ID">
          <el-input v-model="projectSearch.id" placeholder="请输入项目ID" clearable />
        </el-form-item>
        <el-form-item label="项目标题">
          <el-input v-model="projectSearch.title" placeholder="请输入项目标题" clearable />
        </el-form-item>
        <el-form-item label="项目分类">
          <el-select v-model="projectSearch.category" placeholder="请选择分类" clearable>
            <el-option label="教育助学" value="教育助学" />
            <el-option label="医疗救助" value="医疗救助" />
            <el-option label="灾害救援" value="灾害救援" />
            <el-option label="环境保护" value="环境保护" />
            <el-option label="社区发展" value="社区发展" />
            <el-option label="动物保护" value="动物保护" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadProjects">搜索</el-button>
          <el-button :icon="Refresh" @click="resetProjectSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 项目网格 -->
    <el-row :gutter="20" v-loading="projectLoading" class="project-grid">
      <el-col v-for="project in projects" :key="project.id" :span="6">
        <el-card shadow="hover" class="project-card" @click="openDonation(project)">
          <img v-if="project.coverImage" :src="project.coverImage" class="project-cover" />
          <div class="project-info">
            <h4 class="project-title">{{ project.title }}</h4>
            <el-progress
              :percentage="getProgress(project)"
              :color="getProgressColor(project)"
              :stroke-width="8"
            />
            <div class="project-amounts">
              <span>已筹: ¥{{ formatNumber(project.currentAmount) }}</span>
              <span>目标: ¥{{ formatNumber(project.targetAmount) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 捐赠记录对话框 -->
    <el-dialog v-model="donationVisible" :title="currentProject?.title" width="1000px">
      <!-- 捐赠搜索栏 -->
      <el-form :model="donationSearch" inline class="donation-search">
        <el-form-item label="捐赠人">
          <el-input v-model="donationSearch.donorName" placeholder="请输入捐赠人姓名" clearable />
        </el-form-item>
        <el-form-item label="金额区间">
          <el-input-number v-model="donationSearch.minAmount" placeholder="最小金额" />
          -
          <el-input-number v-model="donationSearch.maxAmount" placeholder="最大金额" />
        </el-form-item>
        <el-form-item label="捐赠时间">
          <el-date-picker
            v-model="donationSearch.startDate"
            type="date"
            placeholder="开始日期"
            value-format="YYYY-MM-DD"
          />
          -
          <el-date-picker
            v-model="donationSearch.endDate"
            type="date"
            placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadDonations">搜索</el-button>
          <el-button @click="resetDonationSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 捐赠表格 -->
      <el-table :data="donations" v-loading="donationLoading" stripe style="margin-top: 10px;">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="donorName" label="捐赠人" width="150" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            ¥{{ formatNumber(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="donationTime" label="捐赠时间" width="150" />
        <el-table-column prop="donationStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.donationStatus)">
              {{ getStatusText(row.donationStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payment" label="支付方式" width="120" />
        <el-table-column prop="remark" label="备注" min-width="200" />
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="donationPage"
        v-model:page-size="donationPageSize"
        :total="donationTotal"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10,20,50,100]"
        class="pagination"
        @size-change="loadDonations"
        @current-change="loadDonations"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import {
  getOrganizationProjects,
  getDonationList,
  type Project,
  type Donation
} from '@/api/donation'

const projectLoading = ref(false)
const projects = ref<Project[]>([])
const projectSearch = reactive({ id: '', title: '', category: '' })

// 网格项目函数
const formatNumber = (num?: number) => (num ? num.toLocaleString() : '0')
const getProgress = (project: Project) => project.targetAmount ? Math.min(100, Math.floor((project.currentAmount || 0)/project.targetAmount*100)) : 0
const getProgressColor = (project: Project) => {
  const p = getProgress(project)
  if (p >= 100) return '#67c23a'
  if (p >= 50) return '#409eff'
  return '#e6a23c'
}

// 状态标签
const getStatusText = (status?: number) => {
  const map: Record<number,string> = { 1:'成功', 2:'已退款', 3:'异常' }
  return map[status||0] || '未知'
}
const getStatusType = (status?: number) => {
  const map: Record<number,string> = { 1:'success', 2:'warning', 3:'danger' }
  return map[status||0] || 'info'
}

// 加载项目列表
const loadProjects = async () => {
  projectLoading.value = true
  try {
    const params: any = { ...projectSearch }
    if (params.id) params.id = Number(params.id)
    else delete params.id
    const res = await getOrganizationProjects(params)
    if (res.code === 200 && res.data) {
      // 按 createTime 降序
      projects.value = res.data.records.sort((a,b)=> new Date(b.createTime!).getTime() - new Date(a.createTime!).getTime())
    } else {
      ElMessage.error(res.msg||'加载项目失败')
    }
  } catch (e) {
    ElMessage.error('加载项目失败')
  } finally { projectLoading.value = false }
}

const resetProjectSearch = () => {
  Object.assign(projectSearch,{id:'',title:'',category:''})
  loadProjects()
}

// ====== 捐赠管理 ======
const donationVisible = ref(false)
const currentProject = ref<Project | null>(null)
const donations = ref<Donation[]>([])
const donationLoading = ref(false)
const donationPage = ref(1)
const donationPageSize = ref(10)
const donationTotal = ref(0)
const donationSearch = reactive({
  donorName:'', minAmount:null, maxAmount:null, startDate:'', endDate:''
})

// 打开捐赠记录
const openDonation = (project: Project) => {
  currentProject.value = project
  donationVisible.value = true
  donationPage.value = 1
  loadDonations()
}

// 加载捐赠记录
const loadDonations = async () => {
  if (!currentProject.value) return
  donationLoading.value = true
  try {
    const params: any = {
      page: donationPage.value,
      size: donationPageSize.value,
      projectId: currentProject.value.id,
      donorName: donationSearch.donorName,
      minAmount: donationSearch.minAmount,
      maxAmount: donationSearch.maxAmount,
      startDate: donationSearch.startDate,
      endDate: donationSearch.endDate
    }
    const res = await getDonationList(params)
    if (res.code === 200 && res.data) {
      donations.value = res.data.records
      donationTotal.value = res.data.total
    } else {
      ElMessage.error(res.msg||'加载捐赠记录失败')
    }
  } catch(e) {
    ElMessage.error('加载捐赠记录失败')
  } finally { donationLoading.value = false }
}

const resetDonationSearch = () => {
  Object.assign(donationSearch,{donorName:'',minAmount:null,maxAmount:null,startDate:'',endDate:''})
  loadDonations()
}

onMounted(()=>{
  loadProjects()
})
</script>

<style scoped>
.donation-list {
  padding: 20px;
}
.search-card {
  margin-bottom: 20px;
}
.project-grid {
  margin-top: 20px;
}
.project-card {
  cursor: pointer;
  transition: 0.3s;
}
.project-card:hover {
  transform: translateY(-5px);
}
.project-cover {
  width: 100%;
  height: 150px;
  object-fit: cover;
}
.project-info {
  padding: 10px 0;
}
.project-title {
  font-weight: bold;
  margin-bottom: 5px;
}
.project-amounts {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-top: 5px;
}
.donation-search {
  margin-bottom: 10px;
}
.pagination {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
</style>