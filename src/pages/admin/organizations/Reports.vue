<template>
  <div class="reports-container">
    <!-- 顶部操作区：筛选与导出 -->
    <el-card class="filter-card" shadow="hover">
      <div class="filter-header">
        <div class="title-area">
          <el-icon :size="24" color="#FF7E5F"><DataAnalysis /></el-icon>
          <span class="title-text">捐赠数据中心</span>
        </div>
        <div class="action-area">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleFilterChange"
            style="margin-right: 15px; width: 300px;"
          />
          <el-button type="primary" @click="exportToCSV" class="export-btn" :icon="Download">
            导出报表
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 可视化图表区 -->
    <el-row :gutter="20" class="charts-row">
      <!-- 左侧饼图：支付渠道分析 -->
      <el-col :xs="24" :lg="10">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>支付渠道占比</span>
            </div>
          </template>
          <div ref="pieChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 右侧柱状图：项目筹款排行 -->
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>热门项目筹款排行 (Top 5)</span>
            </div>
          </template>
          <div ref="barChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header">
          <span>捐赠明细流水</span>
        </div>
      </template>
      
      <el-table 
        v-loading="loading" 
        :data="tableData" 
        style="width: 100%" 
        stripe
        header-cell-class-name="warm-table-header"
      >
        <el-table-column prop="certificateNo" label="捐赠单号" width="180" show-overflow-tooltip />
        <el-table-column prop="projectTitle" label="支持项目" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="color: #FF7E5F; font-weight: 500;">{{ row.projectTitle || '未知项目' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="donorName" label="捐赠人" width="120" />
        <el-table-column prop="donorPhone" label="联系电话" width="130">
          <template #default="{ row }">
            {{ maskPhone(row.donorPhone) }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额(元)" width="120">
          <template #default="{ row }">
            <span style="font-weight: bold; color: #f56c6c;">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payment" label="支付方式" width="100">
          <template #default="{ row }">
            <el-tag :type="getPaymentTagType(row.payment)" effect="light">
              {{ row.payment || '其他' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="donationTime" label="捐赠时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.donationTime) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="loadTableData"
          @current-change="loadTableData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { DataAnalysis, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getDonationList } from '@/api/donation'

// 状态管理
const dateRange = ref<[string, string] | null>(null)
const loading = ref(false)
const tableData = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// Echarts 引用
const pieChartRef = ref<HTMLElement>()
const barChartRef = ref<HTMLElement>()
let pieChartInstance: echarts.ECharts | null = null
let barChartInstance: echarts.ECharts | null = null

// 工具函数：脱敏手机号
const maskPhone = (phone: string) => {
  if (!phone) return '匿名'
  return phone.length === 11 ? `${phone.substring(0, 3)}****${phone.substring(7)}` : phone
}

// 工具函数：格式化时间
const formatDateTime = (timeStr: string) => {
  if (!timeStr) return '-'
  return timeStr.replace('T', ' ')
}

// 工具函数：支付方式对应的标签颜色
const getPaymentTagType = (payment: string) => {
  if (payment?.includes('微信')) return 'success'
  if (payment?.includes('支付宝')) return 'primary'
  if (payment?.includes('模拟')) return 'warning'
  return 'info'
}

// 加载表格明细数据
const loadTableData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      size: pageSize.value
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    // 🌟 这里使用的是我们刚才精化的 getDonationList 接口
    const res: any = await getDonationList(params)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (err) {
    ElMessage.error('加载报表数据失败')
  } finally {
    loading.value = false
  }
}

// 模拟加载聚合图表数据 (实战中如果后端没有图表聚合API，可以拉取size=500的大量数据在前端进行聚合计算展示)
const loadChartData = async () => {
  try {
    const params: any = { page: 1, size: 500 } // 抓取较多数据进行图表统计
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res: any = await getDonationList(params)
    
    if (res.code === 200 && res.data && res.data.records) {
      const records = res.data.records
      
      // 1. 聚合支付渠道占比数据 (Pie)
      const paymentMap = new Map<string, number>()
      records.forEach((r: any) => {
        const pay = r.payment || '其他'
        paymentMap.set(pay, (paymentMap.get(pay) || 0) + r.amount)
      })
      const pieData = Array.from(paymentMap).map(([name, value]) => ({ name, value }))

      // 2. 聚合项目筹款排名 (Bar)
      const projectMap = new Map<string, number>()
      records.forEach((r: any) => {
        const title = r.projectTitle || '未知项目'
        projectMap.set(title, (projectMap.get(title) || 0) + r.amount)
      })
      // 按金额降序并取前5名
      const sortedProjects = Array.from(projectMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
      
      const barNames = sortedProjects.map(item => item[0])
      const barValues = sortedProjects.map(item => item[1])

      renderPieChart(pieData)
      renderBarChart(barNames, barValues)
    }
  } catch (err) {
    console.error('加载图表聚合数据失败', err)
  }
}

// 渲染饼图
const renderPieChart = (data: any[]) => {
  if (!pieChartInstance && pieChartRef.value) {
    pieChartInstance = echarts.init(pieChartRef.value)
  }
  pieChartInstance?.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: '0%', left: 'center' },
    // 采用温暖的色调系
    color: ['#07c160', '#1677ff', '#FF7E5F', '#FEB47B', '#FFD194'],
    series: [
      {
        name: '支付渠道',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' }
        },
        labelLine: { show: false },
        data: data.length ? data : [{ name: '暂无数据', value: 0 }]
      }
    ]
  })
}

// 渲染柱状图
const renderBarChart = (names: string[], values: number[]) => {
  if (!barChartInstance && barChartRef.value) {
    barChartInstance = echarts.init(barChartRef.value)
  }
  barChartInstance?.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'value', 
      name: '金额(元)',
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
    },
    yAxis: { 
      type: 'category', 
      data: names.length ? names.reverse() : ['暂无数据'], // Echarts柱状图通常从下往上画
      axisLabel: {
        formatter: (value: string) => {
          return value.length > 8 ? value.substring(0, 8) + '...' : value
        }
      }
    },
    series: [
      {
        name: '筹款总额',
        type: 'bar',
        barWidth: '40%',
        data: values.length ? values.reverse() : [0],
        itemStyle: {
          // 阳光渐变色柱子
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#FF7E5F' },
            { offset: 1, color: '#FEB47B' }
          ]),
          borderRadius: [0, 8, 8, 0]
        }
      }
    ]
  })
}

// 日期筛选事件
const handleFilterChange = () => {
  currentPage.value = 1
  loadTableData()
  loadChartData()
}

// 🌟 原生前端导出纯净 CSV 功能，无需额外安装依赖
const exportToCSV = () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('当前没有可导出的数据')
    return
  }

  // 1. 添加 BOM 头，防止 Excel 打开中文乱码
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF"
  
  // 2. 拼接表头
  csvContent += "捐赠单号,支持项目,捐赠人,手机号,捐赠金额,支付方式,捐赠时间\n"
  
  // 3. 拼接数据行
  tableData.value.forEach(row => {
    let rowData = [
      row.certificateNo,
      `"${row.projectTitle || ''}"`, // 防项目名包含逗号导致错位
      row.donorName || '匿名',
      row.donorPhone,
      row.amount,
      row.payment,
      formatDateTime(row.donationTime)
    ].join(",")
    csvContent += rowData + "\r\n"
  })

  // 4. 触发浏览器下载
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `捐赠数据报表_${new Date().getTime()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('报表导出成功')
}

// 图表自适应
const handleResize = () => {
  pieChartInstance?.resize()
  barChartInstance?.resize()
}

onMounted(() => {
  loadTableData()
  loadChartData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  pieChartInstance?.dispose()
  barChartInstance?.dispose()
})
</script>

<style scoped>
.reports-container {
  padding: 0;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-text {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.action-area {
  display: flex;
  align-items: center;
}

.export-btn {
  background: linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%);
  border: none;
}
.export-btn:hover {
  opacity: 0.9;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 12px;
}

.card-header {
  font-weight: bold;
  color: #333;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.table-card {
  border-radius: 12px;
}

:deep(.warm-table-header) {
  background-color: #fcf6f5 !important;
  color: #666;
  font-weight: bold;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>