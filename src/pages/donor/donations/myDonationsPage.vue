<template>
  <div class="my-donations-container">
    <!-- 顶部数据概览 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="24">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-item">
              <div class="stat-icon amount-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-title">累计捐赠金额 (元)</div>
                <div class="stat-value text-danger">¥ {{ stats.totalAmount?.toFixed(2) || '0.00' }}</div>
              </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-icon count-icon">
                <el-icon><Star /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-title">爱心奉献次数</div>
                <div class="stat-value text-primary">{{ stats.totalCount || 0 }} 次</div>
              </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-icon project-icon">
                <el-icon><DataBoard /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-title">支持项目数</div>
                <div class="stat-value text-success">{{ stats.projectCount || 0 }} 个</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 捐赠记录列表 -->
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">📜 我的捐赠记录</span>
          <el-button type="primary" plain size="small" @click="loadDonations">刷新记录</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="donationList" stripe style="width: 100%">
        <el-table-column prop="certificateNo" label="凭证号" width="200" show-overflow-tooltip>
          <template #default="scope">
            <span class="font-mono text-gray-500">{{ scope.row.certificateNo || '--' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="projectTitle" label="支持项目" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            <span class="project-name">{{ scope.row.projectName }}</span>
            <el-tag size="small" type="info" class="ml-2" v-if="scope.row.projectCategory">
              {{ scope.row.projectCategory }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="amount" label="捐赠金额" width="140">
          <template #default="scope">
            <span class="amount-text">¥ {{ scope.row.amount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="donationTime" label="捐赠时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.donationTime) }}
          </template>
        </el-table-column>

        <el-table-column label="爱心证明" width="120" fixed="right" align="center">
          <template #default="scope">
            <el-button type="success" size="small" plain @click="viewCertificate(scope.row)">
              查看证书
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页器 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 荣誉证书弹窗 -->
    <el-dialog v-model="certDialogVisible" title="" width="550px" center destroy-on-close custom-class="cert-dialog">
      <div v-if="currentCert" class="certificate-wrapper" id="certificate-content">
        <div class="cert-border">
          <div class="cert-inner">
            <h2 class="cert-title">捐赠证书</h2>
            <div class="cert-body">
              <p class="cert-recipient">尊敬的 <strong>{{ authStore.displayName }}</strong> 爱心人士：</p>
              <p class="cert-text">
                非常感谢您在 <strong>《{{ currentCert.projectName }}》</strong> 公益项目中，慷慨解囊，捐赠人民币 <span class="cert-amount">¥{{ currentCert.amount?.toFixed(2) }}</span> 元。
              </p>
              <p class="cert-text mt-2">
                您的每一分善款，都将化作希望的种子。大爱无疆，善行天下！特发此证，以资鼓励并致以崇高的敬意。
              </p>
            </div>
            <div class="cert-footer">
              <div class="cert-seal">
                <div class="seal-ring">
                  <span>公益捐赠平台认证</span>
                </div>
              </div>
              <div class="cert-meta">
                <p>凭证编号：{{ currentCert.certificateNo }}</p>
                <p>发证机构：SCAU公益平台组委会</p>
                <p>发证日期：{{ formatDate(currentCert.donationTime, 'YYYY年MM月DD日') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="downloadCert">保存证书到本地</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Money, Star, DataBoard } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getMyDonations, getDonorStatistic } from '@/api/donation'

const authStore = useAuthStore()

// === 基础数据 ===
const loading = ref(false)
const donationList = ref<any[]>([])
const total = ref(0)
const queryParams = reactive({
  page: 1,
  size: 10
})

const stats = ref({
  totalAmount: 0,
  totalCount: 0,
  projectCount: 0
})

// === 加载统计数据 ===
const loadStats = async () => {
  const userId = authStore.userInfo?.id
  if (!userId) return
  try {
    const res: any = await getDonorStatistic(userId)
    if (res.code === 200 && res.data) {
      stats.value = res.data
    }
  } catch (err) {
    console.error('获取统计数据失败', err)
  }
}

// === 加载捐赠记录 ===
const loadDonations = async () => {
  if (!authStore.userInfo?.phone) return
  try {
    loading.value = true
    const res: any = await getMyDonations({
      phone: authStore.userInfo.phone,
      page: queryParams.page,
      size: queryParams.size
    })
    if (res.code === 200 && res.data) {
      donationList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (err) {
    console.error('加载记录失败', err)
    ElMessage.error('加载捐赠记录失败')
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val: number) => {
  queryParams.size = val
  loadDonations()
}

const handleCurrentChange = (val: number) => {
  queryParams.page = val
  loadDonations()
}

// === 证书逻辑 ===
const certDialogVisible = ref(false)
const currentCert = ref<any>(null)

const viewCertificate = (row: any) => {
  currentCert.value = row
  certDialogVisible.value = true
}

const downloadCert = () => {
  // TODO: 后期可以引入 html2canvas 库实现一键截图下载
  ElMessage.success('请使用手机截屏或浏览器截图保存您的荣誉证书~')
}

// === 工具函数 ===
const formatDate = (dateStr: string, format: string = 'YYYY-MM-DD HH:mm:ss') => {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  if (format === 'YYYY年MM月DD日') {
    return `${year}年${month}月${day}日`
  }
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

onMounted(() => {
  loadStats()
  loadDonations()
})
</script>

<style scoped>
.my-donations-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.mb-4 {
  margin-bottom: 20px;
}

.box-card {
  border-radius: 12px;
  border: none;
}

/* 顶部统计卡片样式 */
.stat-card {
  border-radius: 12px;
  border: none;
  background: linear-gradient(to right, #ffffff, #fafbfc);
}
.stat-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 10px 0;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
}
.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
}
.amount-icon { background-color: #fef0f0; color: #f56c6c; }
.count-icon { background-color: #ecf5ff; color: #409eff; }
.project-icon { background-color: #f0f9eb; color: #67c23a; }

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.stat-title {
  font-size: 14px;
  color: #909399;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
}
.text-danger { color: #f56c6c; }
.text-primary { color: #409eff; }
.text-success { color: #67c23a; }
.stat-divider {
  width: 1px;
  height: 40px;
  background-color: #ebeef5;
}

/* 表格与内容样式 */
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
  font-weight: 500;
  color: #409EFF;
}
.amount-text {
  color: #F56C6C;
  font-weight: bold;
}
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
.ml-2 { margin-left: 8px; }

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 证书样式 */
.certificate-wrapper {
  background-color: #fef8f5;
  padding: 15px;
  border-radius: 8px;
}
.cert-border {
  border: 8px solid #d4af37;
  padding: 4px;
  border-radius: 4px;
}
.cert-inner {
  border: 1px solid #d4af37;
  padding: 30px 40px;
  background-color: #fffaf0;
  position: relative;
  overflow: hidden;
}
.cert-title {
  text-align: center;
  font-size: 28px;
  color: #c0392b;
  letter-spacing: 5px;
  margin-bottom: 30px;
  font-family: 'STXingkai', 'KaiTi', serif;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}
.cert-body {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}
.cert-amount {
  font-size: 20px;
  color: #c0392b;
  font-weight: bold;
}
.cert-footer {
  margin-top: 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  position: relative;
}
.cert-meta {
  text-align: right;
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}
.cert-seal {
  width: 100px;
  height: 100px;
  border: 4px solid #c0392b;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #c0392b;
  font-weight: bold;
  font-size: 12px;
  text-align: center;
  transform: rotate(-15deg);
  opacity: 0.8;
}
.seal-ring {
  width: 80px;
  height: 80px;
  border: 1px solid #c0392b;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
}
</style>