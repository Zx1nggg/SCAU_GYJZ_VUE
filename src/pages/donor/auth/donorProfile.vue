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
              <span class="label">账号状态：</span>
              <el-tag :type="authStore.userInfo?.userStatus === 1 ? 'success' : 'danger'" size="small" effect="dark">
                {{ authStore.userInfo?.userStatus === 1 ? '正常' : '异常' }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">注册时间：</span>
              <span class="value text-gray">{{ authStore.userInfo?.createTime }}</span>
            </div>
          </div>

          <div class="action-wrap" style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
            <el-button type="primary" plain style="width: 100%; margin: 0;" @click="openEditDialog">
              修改个人信息
            </el-button>
            <el-button type="warning" plain style="width: 100%; margin: 0;" @click="openPwdDialog">
              修改密码
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
        
        <!-- 真正的图片上传组件 -->
        <el-form-item label="用户头像" prop="avatar">
          <el-upload
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            accept="image/jpeg,image/png,image/gif"
            :before-upload="beforeImageUpload"
            :http-request="uploadAvatar"
          >
            <img v-if="editForm.avatar" :src="editForm.avatar" class="avatar-preview" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">点击上方方框上传新头像</div>
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="请输入新昵称" maxlength="20" show-word-limit />
        </el-form-item>
        
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitEdit">保存更改</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="pwdDialogVisible" title="修改密码" width="400px" destroy-on-close>
      <el-form :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-width="80px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input type="password" v-model="pwdForm.oldPassword" placeholder="请输入原密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input type="password" v-model="pwdForm.newPassword" placeholder="请输入新密码 (不少于6位)" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input type="password" v-model="pwdForm.confirmPassword" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="pwdDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="pwdSubmitting" @click="submitPwd">确认修改</el-button>
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
import { useAuthStore } from '@/stores/auth'
import { getMyDonations, type Donation } from '@/api/donation'
import { updateUserInfo } from '@/api/auth'
import { Plus } from '@element-plus/icons-vue' // 导入 Plus 图标
import request from '@/utils/request'        // 导入请求工具，用于上传

const authStore = useAuthStore()

// === 基础数据 ===
const activeTab = ref('history')
const loading = ref(false)
const donationList = ref<Donation[]>([])
const total = ref(0)
const queryParams = reactive({
  page: 1,
  size: 10
})
 //=== 修改密码相关 ===
const pwdDialogVisible = ref(false)
const pwdSubmitting = ref(false)
const pwdFormRef = ref()
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPwd = (value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的新密码不一致!'))
  } else {
    callback()
  }
}

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPwd, trigger: 'blur' }
  ]
}

const openPwdDialog = () => {
  // 每次打开弹窗前，清空旧数据
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  pwdDialogVisible.value = true
}

const submitPwd = async () => {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const userId = authStore.userInfo?.id
      if (!userId) return

      try {
        pwdSubmitting.value = true
        // 调用我们已经写好的后端接口
        const res: any = await request.put(`/v1/users/${userId}/password`, {
          oldPassword: pwdForm.oldPassword,
          newPassword: pwdForm.newPassword
        })
        
        if (res.code === 200) {
          ElMessage.success('密码修改成功，请重新登录')
          pwdDialogVisible.value = false
          
          // 延迟 1.5 秒后清除捐赠人专属缓存并退出
          setTimeout(() => {
            const prefix = 'donor_'
            authStore.token = ''
            authStore.userInfo = null
            
            // 清理 Token 及用户信息
            localStorage.removeItem(`${prefix}token`)
            localStorage.removeItem(`${prefix}userInfo`)
            localStorage.removeItem(`${prefix}isLoggedIn`)
            localStorage.removeItem(`${prefix}userType`)
            
            // 删除浏览器记住的旧密码，防止用户重新跳转回来时自动填错报错！
            localStorage.removeItem(`${prefix}saved_password`) 
            
            sessionStorage.removeItem(`${prefix}token`)
            sessionStorage.removeItem(`${prefix}userInfo`)
            sessionStorage.removeItem(`${prefix}isLoggedIn`)
            sessionStorage.removeItem(`${prefix}userType`)

            // 退回捐赠人登录页
            window.location.href = '/#/donorLogin' 
          }, 1500)
          
        } else {
          ElMessage.error(res.msg || '密码修改失败')
        }
      } catch (err) {
        ElMessage.error('请求失败')
      } finally {
        pwdSubmitting.value = false
      }
    }
  })
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

// 图片上传前置校验
const beforeImageUpload = (file: File) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif'
  const isLt1M = file.size / 1024 / 1024 < 1 

  if (!isImage) {
    ElMessage.error('只能上传 JPG、PNG 或 GIF 格式的图片！')
    return false
  }
  if (!isLt1M) {
    ElMessage.error('图片大小不能超过 1MB！')
    return false
  }
  return true
}

// 真正发起上传请求的方法
const uploadAvatar = async (options: any) => {
  try {
    const formData = new FormData()
    formData.append('file', options.file)
    
    // 调用 /v1/upload/avatar 接口
    const res: any = await request.post(`/v1/upload/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    if (res.code === 200 && res.data) {
      editForm.avatar = res.data
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error(res.msg || '头像上传失败')
    }
  } catch (error) {
    ElMessage.error('上传图片失败')
  }
}

// 核心：保存修改信息
const submitEdit = async () => {
  const userId = authStore.userInfo?.id
  if (!userId) {
    ElMessage.error('登录异常，请重新登录')
    return
  }

  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        submitting.value = true
        
        const res: any = await updateUserInfo(userId, {
          nickname: editForm.nickname,
          avatar: editForm.avatar
        })
        
        if (res.code === 200) {
          // 成功后同步更新本地 Store
          authStore.updateUserInfo({
            nickname: editForm.nickname,
            avatar: editForm.avatar
          })
          ElMessage.success('档案更新成功')
          editDialogVisible.value = false
        } else {
          ElMessage.error(res.msg || '更新失败')
        }
      } catch (error) {
        ElMessage.error('更新异常')
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

/* 🌟 头像上传组件样式 */
.avatar-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  background-color: #fafafa;
  overflow: hidden;
  transition: border-color 0.3s;
}
.avatar-uploader :deep(.el-upload:hover) {
  border-color: #FF7E5F;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 80px;
  height: 80px;
  text-align: center;
  line-height: 80px;
}
.avatar-preview {
  width: 80px;
  height: 80px;
  display: block;
  object-fit: cover;
}
.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
  line-height: 1.2;
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