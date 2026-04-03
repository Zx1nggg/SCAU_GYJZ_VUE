<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <!-- 左侧：个人信息卡片 -->
      <el-col :xs="24" :md="8" class="mb-4">
        <el-card class="box-card profile-card" shadow="hover">
          <div class="avatar-wrap">
            <el-avatar :size="100" :src="authStore.userAvatar" class="avatar-shadow"></el-avatar>
          </div>
          <h3 class="name-title">{{ authStore.displayName }}</h3>
          <p class="role-text">{{ authStore.roleText }}</p>

          <el-divider />

          <div class="info-list">
            <div class="info-item">
              <span class="label">手机号码：</span>
              <span class="value">{{ authStore.userInfo?.phone || '未绑定' }}</span>
            </div>
            <div class="info-item">
              <!-- 替换为数据库真实的 userStatus 字段判断 (1 为正常) -->
              <el-tag :type="authStore.userInfo?.userStatus === 1 ? 'success' : 'danger'" size="small" effect="dark">
                {{ authStore.userInfo?.userStatus === 1 ? '正常' : '异常' }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">注册时间：</span>
              <!-- 如果后端User表有createTime可以在这里展示，暂用占位 -->
              <span class="value text-gray">--</span>
            </div>
          </div>

          <div class="action-wrap">
            <el-button type="primary" plain class="w-full" @click="openEditDialog">
              修改个人信息
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：捐赠记录与证书 -->
      <el-col :xs="24" :md="16">
        <el-card class="box-card" shadow="hover">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="我的捐赠记录" name="history">
              <el-table v-loading="loading" :data="donationList" stripe style="width: 100%">
                <!-- 这里展示的就是后端生成的 certNo -->
                <el-table-column prop="certificateNo" label="凭证号" width="180" show-overflow-tooltip>
                  <template #default="scope">
                    <span class="font-mono text-gray-500">{{ scope.row.certificateNo }}</span>
                  </template>
                </el-table-column>
                
                <el-table-column prop="projectName" label="支持项目" min-width="160" show-overflow-tooltip>
                  <template #default="scope">
                    <span class="project-name">{{ scope.row.projectName }}</span>
                  </template>
                </el-table-column>
                
                <el-table-column prop="amount" label="捐赠金额" width="120">
                  <template #default="scope">
                    <span class="amount-text">¥ {{ scope.row.amount }}</span>
                  </template>
                </el-table-column>
                
                <el-table-column prop="donationTime" label="捐赠时间" width="160">
                  <template #default="scope">
                    {{ formatDate(scope.row.donationTime) }}
                  </template>
                </el-table-column>

                <el-table-column label="爱心证明" width="100" fixed="right" align="center">
                  <template #default="scope">
                    <el-button type="success" size="small" plain @click="viewCertificate(scope.row)">
                      证书
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
                  layout="total, sizes, prev, pager, next"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <!-- 修改个人信息弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑个人资料" width="400px" destroy-on-close>
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="80px">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="请输入新昵称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="头像地址" prop="avatar">
          <el-input v-model="editForm.avatar" placeholder="请输入图片URL(选填)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitEdit">保存更改</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 荣誉证书弹窗 -->
    <el-dialog v-model="certDialogVisible" title="" width="550px" center destroy-on-close custom-class="cert-dialog">
      <div v-if="currentCert" class="certificate-wrapper" id="certificate-content">
        <div class="cert-border">
          <div class="cert-inner">
            <h2 class="cert-title">捐赠证书</h2>
            <div class="cert-body">
              <p class="cert-recipient">尊敬的 <strong>{{ currentCert.donorName || authStore.displayName }}</strong> 爱心人士：</p>
              <p class="cert-text">
                非常感谢您在 <strong>《{{ currentCert.projectName }}》</strong> 公益项目中，慷慨解囊，捐赠人民币 <span class="cert-amount">¥{{ currentCert.amount }}</span> 元。
              </p>
              <p class="cert-text mt-2">
                您的每一分善款，都将化作希望的种子。大爱无疆，善行天下！特发此证，以资鼓励并致以崇高的敬意。
              </p>
              <div v-if="currentCert.remark" class="cert-remark">
                <span class="quote-mark">“</span>{{ currentCert.remark }}<span class="quote-mark">”</span>
              </div>
            </div>
            <div class="cert-footer">
              <div class="cert-seal">
                <div class="seal-ring">
                  <span>公益捐赠平台认证</span>
                </div>
              </div>
              <div class="cert-meta">
                <p>凭证编号：{{ currentCert.certificateNo }}</p>
                <p>发证机构：XX公益平台组委会</p>
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
import { useAuthStore } from '@/stores/auth'
import { getMyDonations } from '@/api/donation'
// 注意：如果在api中没有updateUserInfo，需要您后续在后端补充更新接口
// import { updateUserInfoApi } from '@/api/user' 

const authStore = useAuthStore()

// === 基础数据 ===
const activeTab = ref('history')
const loading = ref(false)
const donationList = ref<any[]>([])
const total = ref(0)
const queryParams = reactive({
  page: 1,
  size: 10
})

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

// === 修改资料逻辑 ===
const editDialogVisible = ref(false)
const submitting = ref(false)
const editFormRef = ref()
const editForm = reactive({
  nickname: '',
  avatar: ''
})

const editRules = {
  nickname: [
    { required: true, message: '昵称不能为空', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

const openEditDialog = () => {
  editForm.nickname = authStore.userInfo?.nickname || ''
  editForm.avatar = authStore.userInfo?.avatar || ''
  editDialogVisible.value = true
}

const submitEdit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        submitting.value = true
        // TODO: 这里需要对接后端的更新用户接口
        // await updateUserInfoApi({ id: authStore.userInfo.id, ...editForm })
        
        // 模拟接口请求成功后，直接更新前端 Pinia Store 的状态
        authStore.updateUserInfo({
          nickname: editForm.nickname,
          avatar: editForm.avatar
        })
        
        ElMessage.success('个人资料更新成功')
        editDialogVisible.value = false
      } catch (error) {
        ElMessage.error('更新失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// === 证书逻辑 ===
const certDialogVisible = ref(false)
const currentCert = ref<any>(null)

const viewCertificate = (row: any) => {
  currentCert.value = row
  certDialogVisible.value = true
}

const downloadCert = () => {
  // 简易处理：实际项目中可以引入 html2canvas 库将 div 截图下载
  ElMessage.success('证书截屏保存功能开发中，您可以先手动截图保存~')
}

// === 工具函数 ===
const formatDate = (dateStr: string, format: string = 'YYYY-MM-DD HH:mm:ss') => {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
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
  loadDonations()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.box-card {
  border-radius: 12px;
  border: none;
}

/* 左侧卡片样式 */
.profile-card {
  text-align: center;
  padding: 20px 0;
}
.avatar-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}
.avatar-shadow {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 2px solid #fff;
}
.name-title {
  font-size: 20px;
  color: #303133;
  margin: 0 0 5px;
}
.role-text {
  font-size: 14px;
  color: #909399;
  margin: 0;
}
.info-list {
  text-align: left;
  padding: 0 20px;
}
.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 14px;
}
.info-item .label {
  color: #606266;
}
.info-item .value {
  color: #303133;
  font-weight: 500;
}
.action-wrap {
  padding: 10px 20px 0;
}
.w-full {
  width: 100%;
}

/* 表格样式 */
.project-name {
  font-weight: bold;
  color: #409EFF;
}
.amount-text {
  color: #F56C6C;
  font-weight: bold;
}
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
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
.cert-remark {
  margin-top: 20px;
  padding: 15px;
  background-color: rgba(212, 175, 55, 0.1);
  border-radius: 6px;
  font-style: italic;
  color: #666;
  text-align: center;
}
.quote-mark {
  font-size: 24px;
  color: #d4af37;
  vertical-align: middle;
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