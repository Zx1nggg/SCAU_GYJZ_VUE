<template>
  <div class="project-list">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="项目ID">
          <el-input v-model="searchForm.id" placeholder="请输入项目ID" clearable />
        </el-form-item>
        <el-form-item label="项目标题">
          <el-input v-model="searchForm.title" placeholder="请输入项目标题" clearable />
        </el-form-item>
        <el-form-item label="项目分类" style="width: 200px">
          <el-select v-model="searchForm.category" placeholder="请选择分类" clearable>
            <el-option label="教育助学" value="教育助学" />
            <el-option label="医疗救助" value="医疗救助" />
            <el-option label="灾害救援" value="灾害救援" />
            <el-option label="环境保护" value="环境保护" />
            <el-option label="社区发展" value="社区发展" />
            <el-option label="动物保护" value="动物保护" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="searchForm.startDate"
            type="date"
            placeholder="选择开始日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="searchForm.endDate"
            type="date"
            placeholder="选择结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          <el-button type="success" :icon="Plus" @click="handleCreate">创建项目</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 项目列表 -->
    <el-card class="list-card">
      <el-table :data="projectList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="项目标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetAmount" label="目标金额" width="120">
          <template #default="{ row }">
            ¥{{ formatNumber(row.targetAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="currentAmount" label="已筹金额" width="120">
          <template #default="{ row }">
            <span class="current-amount">¥{{ formatNumber(row.currentAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="getProgress(row)"
              :color="getProgressColor(row)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="projectStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.projectStatus)">
              {{ getStatusText(row.projectStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="开始时间" width="120" />
        <el-table-column prop="endDate" label="结束时间" width="120" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button type="success" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="info" link size="small" @click="handleStatistics(row)">
              统计
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadProjectList"
        @current-change="loadProjectList"
        class="pagination"
      />
    </el-card>

    <!-- 项目详情对话框 -->
    <el-dialog v-model="detailVisible" title="项目详情" width="800px">
      <el-descriptions :column="2" border v-if="currentProject">
        <el-descriptions-item label="项目ID">{{ currentProject.id }}</el-descriptions-item>
        <el-descriptions-item label="项目标题">{{ currentProject.title }}</el-descriptions-item>
        <el-descriptions-item label="项目分类">
          <el-tag>{{ currentProject.category }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="项目状态">
          <el-tag :type="getStatusType(currentProject.projectStatus)">
            {{ getStatusText(currentProject.projectStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="目标金额" span="2">
          ¥{{ formatNumber(currentProject.targetAmount) }}
        </el-descriptions-item>
        <el-descriptions-item label="已筹金额" span="2">
          ¥{{ formatNumber(currentProject.currentAmount) }}
        </el-descriptions-item>
        <el-descriptions-item label="项目进度" span="2">
          <el-progress
            :percentage="getProgress(currentProject)"
            :color="getProgressColor(currentProject)"
            :stroke-width="12"
          />
        </el-descriptions-item>
        <el-descriptions-item label="项目周期" span="2">
          {{ currentProject.startDate }} 至 {{ currentProject.endDate }}
        </el-descriptions-item>
        <el-descriptions-item label="项目内容" span="2">
          <div class="project-content">{{ currentProject.content }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 项目统计对话框 -->
    <el-dialog v-model="statisticsVisible" title="项目统计" width="900px">
      <div v-if="statistics" class="statistics-content">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="项目名称" :span="3">
            {{ statistics.title }}
          </el-descriptions-item>
          <el-descriptions-item label="捐赠总笔数">
            {{ statistics.donationCount }}
          </el-descriptions-item>
          <el-descriptions-item label="捐赠总金额">
            ¥{{ formatNumber(statistics.currentAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="捐赠人数">
            {{ statistics.donorCount }}
          </el-descriptions-item>
          <el-descriptions-item label="平均捐赠金额">
            ¥{{ formatNumber(statistics.averageDonation) }}
          </el-descriptions-item>
          <el-descriptions-item label="最高捐赠">
            ¥{{ formatNumber(statistics.maxDonation) }}
          </el-descriptions-item>
          <el-descriptions-item label="最低捐赠">
            ¥{{ formatNumber(statistics.minDonation) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 每日捐赠趋势图 -->
        <div ref="chartRef" class="statistics-chart" v-if="statistics.dailyStats"></div>
      </div>
    </el-dialog>

    <!-- 创建/编辑对话框 -->
    <project-form
      v-model="formVisible"
      :project="editingProject"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getProjectList, deleteProject, getProjectStatistics, type Project, type ProjectStatistics, type PageResult } from '@/api/project'
import ProjectForm from './ProjectForm.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(false)
const projectList = ref<Project[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const statisticsVisible = ref(false)
const formVisible = ref(false)
const currentProject = ref<Project | null>(null)
const statistics = ref<ProjectStatistics | null>(null)
const editingProject = ref<Project | null>(null)
const chartRef = ref<HTMLElement>()

const searchForm = reactive({
  id: '',
  title: '',
  category: '',
  startDate: '',
  endDate: ''
})

// 格式化数字
const formatNumber = (num?: number) => {
  if (!num) return '0'
  return num.toLocaleString()
}

// 获取进度百分比
const getProgress = (project: Project) => {
  if (!project.targetAmount || !project.currentAmount) return 0
  return Math.min(100, Math.floor((project.currentAmount / project.targetAmount) * 100))
}

// 获取进度条颜色
const getProgressColor = (project: Project) => {
  const progress = getProgress(project)
  if (progress >= 100) return '#67c23a'
  if (progress >= 50) return '#409eff'
  return '#e6a23c'
}

// 获取状态文本
const getStatusText = (projectStatus?: number) => {
  const statusMap: Record<number, string> = {
    0: '待审核',
    1: '进行中',
    2: '已结束',
    3: '已取消'
  }
  return statusMap[projectStatus || 0] || '未知'
}

// 获取状态类型
const getStatusType = (projectStatus?: number) => {
  const typeMap: Record<number, string> = {
    0: 'warning',
    1: 'success',
    2: 'info',
    3: 'danger'
  }
  return typeMap[projectStatus || 0] || 'info'
}

// 加载项目列表
const loadProjectList = async () => {
  loading.value = true
  try {
    // 1. 创建一个临时的 params 对象
    const params: any = {
      page: currentPage.value,
      size: pageSize.value,
      orgId: authStore.userInfo?.orgId,
      ...searchForm
    }

    // 2. 处理 ID：如果 id 是空字符串，直接删掉该字段，不传给后端
    // 如果有值，转成 Number
    if (searchForm.id === '' || searchForm.id === null) {
      delete params.id
    } else {
      params.id = Number(searchForm.id)
    }

    const response = await getProjectList(params)
    projectList.value = response.data?.records || []
    total.value = response.data?.total || 0
  } catch (error) {
    console.error('加载项目列表失败:', error)
    ElMessage.error('加载项目列表失败')
  } finally {
    loading.value = false
  }
}
// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadProjectList()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    id: '',
    title: '',
    category: '',
    startDate: '',
    endDate: ''
  })
  handleSearch()
}

// 查看详情
const handleView = (project: Project) => {
  currentProject.value = project
  detailVisible.value = true
}

// 编辑项目
const handleEdit = (project: Project) => {
  editingProject.value = { ...project }
  formVisible.value = true
}

// 创建项目
const handleCreate = () => {
  editingProject.value = null
  formVisible.value = true
}

// 删除项目
const handleDelete = async (project: Project) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除项目 "${project.title}" 吗？删除后不可恢复！`,
      '警告',
      { type: 'warning' }
    )
    await deleteProject(project.id!)
    ElMessage.success('删除成功')
    loadProjectList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 查看统计
const handleStatistics = async (project: Project) => {
  // 新增拦截逻辑：如果没有筹集到资金，可以直接拦截（可选）
  if (!project.currentAmount || project.currentAmount === 0) {
    ElMessage.warning('该项目暂无捐赠数据，无法进行统计')
    return
  }

  try {
    const response = await getProjectStatistics(project.id!)
    console.log('接口返回数据:', response)
    
    // 1. 判断接口是否成功，且 data 是否存在
    if (response.code === 200 && response.data) {
      // 2. 将 response.data 赋值给 statistics，这里 TS 能自动推断出 data 不为 undefined
      statistics.value = response.data 
      statisticsVisible.value = true
      
      // 延迟渲染图表
      setTimeout(() => {
        if (statistics.value?.dailyStats && chartRef.value) {
          initChart()
        }
      }, 100)
    } else {
      // 接口返回 500 等错误时，给出提示
      ElMessage.error(response.msg || '获取统计数据失败')
    }
  } catch (error) {
    console.error('加载统计失败:', error)
    ElMessage.error('加载统计失败')
  }
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value || !statistics.value?.dailyStats) return
  
  const chart = echarts.init(chartRef.value)
  const dailyStats = statistics.value.dailyStats
  
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['捐赠金额', '捐赠笔数'] },
    xAxis: {
      type: 'category',
      data: dailyStats.map(item => item.date)
    },
    yAxis: [
      { type: 'value', name: '捐赠金额(元)' },
      { type: 'value', name: '捐赠笔数' }
    ],
    series: [
      {
        name: '捐赠金额',
        type: 'line',
        data: dailyStats.map(item => item.amount),
        smooth: true,
        lineStyle: { width: 3, color: '#409eff' },
        areaStyle: { opacity: 0.3 }
      },
      {
        name: '捐赠笔数',
        type: 'bar',
        yAxisIndex: 1,
        data: dailyStats.map(item => item.count),
        itemStyle: { color: '#67c23a' }
      }
    ]
  })
}

// 表单提交成功
const handleFormSuccess = () => {
  loadProjectList()
  editingProject.value = null
}

onMounted(() => {
  loadProjectList()
})
</script>

<style scoped>
.project-list {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.list-card {
  min-height: 500px;
}

.current-amount {
  color: #ff6b6b;
  font-weight: bold;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.project-content {
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  line-height: 1.6;
}

.statistics-content {
  padding: 10px;
}

.statistics-chart {
  height: 400px;
  margin-top: 20px;
}
</style>