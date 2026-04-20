<template>
  <div class="settings-container">
    <el-card shadow="hover" class="settings-card" v-loading="loading">
      <el-tabs v-model="activeTab" class="custom-tabs">
        <!-- 1. 个人资料（展示） -->
        <el-tab-pane name="profile">
          <template #label>
            <span class="tab-label">
              <el-icon><User /></el-icon> 个人资料
            </span>
          </template>
          <div class="tab-content">
            <el-descriptions :column="1" border class="info-descriptions">
              <el-descriptions-item label="用户头像">
                <el-avatar :size="72" :src="displayAvatar" />
              </el-descriptions-item>
              <el-descriptions-item label="登录账号">{{ authStore.userInfo?.username || '—' }}</el-descriptions-item>
              <el-descriptions-item label="用户昵称">{{ authStore.userInfo?.nickname || '—' }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ authStore.userInfo?.phone || '—' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <!-- 2. 机构信息（展示） -->
        <el-tab-pane name="org">
          <template #label>
            <span class="tab-label">
              <el-icon><OfficeBuilding /></el-icon> 机构信息
            </span>
          </template>
          <div class="tab-content">
            <el-alert
              title="以下信息将同步展示在鸿蒙移动端及电子证书中，修改请前往「账号设置」。"
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 20px"
            />
            <template v-if="!authStore.userInfo?.orgId">
              <el-empty description="当前账号未关联机构" />
            </template>
            <el-descriptions v-else :column="2" border class="info-descriptions org-desc">
              <el-descriptions-item label="机构 Logo" :span="2">
                <div v-if="orgForm.logo" class="org-logo-wrap">
                  <img :src="orgForm.logo" alt="机构 Logo" class="org-logo-preview-readonly" />
                </div>
                <span v-else class="muted">未上传</span>
              </el-descriptions-item>
              <el-descriptions-item label="机构名称">{{ orgForm.name || '—' }}</el-descriptions-item>
              <el-descriptions-item label="机构代码">{{ orgForm.code || '—' }}</el-descriptions-item>
              <el-descriptions-item label="机构简介" :span="2">
                <div class="multiline">{{ orgForm.content || '—' }}</div>
              </el-descriptions-item>
              <el-descriptions-item label="办公地址" :span="2">{{ orgForm.address || '—' }}</el-descriptions-item>
              <el-descriptions-item label="联系人">{{ orgForm.contactPerson || '—' }}</el-descriptions-item>
              <el-descriptions-item label="官方电话">{{ orgForm.contactPhone || '—' }}</el-descriptions-item>
              <el-descriptions-item label="联系邮箱" :span="2">{{ orgForm.contactEmail || '—' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <!-- 3. 账号设置（修改入口） -->
        <el-tab-pane name="settings">
          <template #label>
            <span class="tab-label">
              <el-icon><Setting /></el-icon> 账号设置
            </span>
          </template>
          <div class="tab-content settings-actions">
            <div class="security-item">
              <div class="info">
                <div class="title">个人资料</div>
                <div class="desc">修改昵称、手机号与头像（会自动同步机构联系人）</div>
              </div>
              <el-button type="primary" plain @click="openProfileDialog">修改个人资料</el-button>
            </div>
            <div class="security-item">
              <div class="info">
                <div class="title">机构信息</div>
                <div class="desc">机构名称、简介、联系方式与 Logo 等</div>
              </div>
              <el-button type="primary" plain @click="openOrgDialog">修改机构信息</el-button>
            </div>
            <div class="security-item">
              <div class="info">
                <div class="title">登录密码</div>
                <div class="desc">建议定期更换密码，确保账号安全</div>
              </div>
              <el-button type="primary" plain @click="showPasswordDialog = true">修改密码</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 修改个人资料 -->
    <el-dialog v-model="showProfileDialog" title="修改个人资料" width="480px" destroy-on-close @opened="onProfileDialogOpened">
      <el-form :model="profileEditForm" label-width="88px">
        <el-form-item label="用户头像">
          <el-avatar :size="64" :src="profileEditForm.avatar || defaultAvatar" />
          <el-upload
            class="inline-upload"
            action="#"
            :show-file-list="false"
            accept="image/jpeg,image/png,image/gif"
            :before-upload="beforeImageUpload"
            :http-request="uploadProfileAvatar"
          >
            <el-button size="small" type="primary" link style="margin-left: 12px">上传头像</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="登录账号">
          <el-input v-model="profileEditForm.username" disabled />
        </el-form-item>
        <el-form-item label="用户昵称">
          <el-input v-model="profileEditForm.nickname" placeholder="请输入昵称" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="profileEditForm.phone" disabled placeholder="请输入手机号" maxlength="20" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProfileDialog = false">取消</el-button>
        <el-button type="primary" class="warm-btn" :loading="profileSubmitting" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改机构信息 -->
    <el-dialog v-model="showOrgDialog" title="修改机构信息" width="720px" destroy-on-close @opened="onOrgDialogOpened">
      <el-alert
        title="机构信息的修改将同步显示在鸿蒙移动端及电子证书中，请务必核实无误。"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 18px"
      />
      <el-form :model="orgForm" label-width="110px" class="org-edit-form">
        <el-form-item label="机构 Logo">
          <el-upload
            class="logo-uploader"
            action="#"
            :show-file-list="false"
            accept="image/jpeg,image/png,image/gif"
            :before-upload="beforeImageUpload"
            :http-request="uploadOrgLogo"
          >
            <img v-if="orgForm.logo" :src="orgForm.logo" class="org-logo-preview" />
            <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议上传正方形透明底图片，大小不超过 1MB</div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="机构名称">
              <el-input v-model="orgForm.name" placeholder="请输入机构全称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="机构代码">
              <el-input v-model="orgForm.code" placeholder="统一社会信用代码" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="机构简介">
          <el-input
            v-model="orgForm.content"
            type="textarea"
            :rows="4"
            placeholder="向社会公众展示您的公益愿景与机构故事..."
          />
        </el-form-item>

        <el-form-item label="办公地址">
          <el-input v-model="orgForm.address" placeholder="请输入机构详细办公地址" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="联系人">
              <el-input v-model="orgForm.contactPerson" placeholder="负责人姓名" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="官方电话" :style="{ width: '220px' }">
              <el-input v-model="orgForm.contactPhone" placeholder="咨询热线" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系邮箱">
              <el-input v-model="orgForm.contactEmail" placeholder="官方邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <div style="text-align: right; font-size: 12px; color: #999;">* 联系人和官方电话请在“个人资料”中修改，会自动同步</div>
      </el-form>
      <template #footer>
        <el-button @click="showOrgDialog = false">取消</el-button>
        <el-button type="primary" class="warm-btn" :loading="submitting" @click="handleUpdateOrg">保存并更新</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码 -->
    <el-dialog v-model="showPasswordDialog" title="修改登录密码" width="400px" destroy-on-close>
      <el-form :model="passwordForm" label-position="top">
        <el-form-item label="当前密码">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpdatePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { Plus, User, OfficeBuilding, Setting } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { updateUserInfo } from '@/api/auth'
import { getOrgInfo, updateOrgInfo, type Organization } from '@/api/organization'

const route = useRoute()
const authStore = useAuthStore()

const activeTab = ref('profile')
const loading = ref(false)
const submitting = ref(false)
const profileSubmitting = ref(false)
const showPasswordDialog = ref(false)
const showProfileDialog = ref(false)
const showOrgDialog = ref(false)
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const displayAvatar = computed(() => authStore.userInfo?.avatar || defaultAvatar)

const profileEditForm = reactive({
  username: '',
  nickname: '',
  phone: '',
  avatar: '' as string | undefined
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const orgForm = reactive<Organization>({
  id: undefined,
  name: '',
  code: '',
  logo: '',
  content: '',
  address: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: ''
})

const loadOrganizationData = async () => {
  const orgId = authStore.userInfo?.orgId
  if (!orgId) return
  loading.value = true
  try {
    const res: any = await getOrgInfo(orgId)
    if (res.code === 200 && res.data) {
      Object.assign(orgForm, res.data)
    }
  } catch (err) {
    console.error('加载机构信息失败', err)
  } finally {
    loading.value = false
  }
}

const openProfileDialog = () => {
  showProfileDialog.value = true
}

const onProfileDialogOpened = () => {
  profileEditForm.username = authStore.userInfo?.username || ''
  profileEditForm.nickname = authStore.userInfo?.nickname || ''
  profileEditForm.phone = authStore.userInfo?.phone || ''
  profileEditForm.avatar = authStore.userInfo?.avatar || ''
}

const openOrgDialog = async () => {
  const orgId = authStore.userInfo?.orgId
  if (!orgId) {
    ElMessage.warning('当前账号未关联机构，无法修改机构信息')
    return
  }
  showOrgDialog.value = true
}

const onOrgDialogOpened = () => {
  void loadOrganizationData()
}

const handleUpdateOrg = async () => {
  submitting.value = true
  try {
    const res: any = await updateOrgInfo({
      ...orgForm,
      id: authStore.userInfo?.orgId
    })
    if (res.code === 200) {
      ElMessage.success('机构资料更新成功')
      showOrgDialog.value = false
      await loadOrganizationData()
    }
  } catch (err) {
    ElMessage.error('更新失败')
  } finally {
    submitting.value = false
  }
}

const saveProfile = async () => {
  const userId = authStore.userInfo?.id
  if (!userId) {
    ElMessage.error('获取用户信息失败，请重新登录')
    return
  }

  profileSubmitting.value = true
  try {
    const res: any = await updateUserInfo(userId, {
      nickname: profileEditForm.nickname,
      phone: profileEditForm.phone,
      avatar: profileEditForm.avatar
    })
    
    if (res.code === 200) {
      authStore.updateUserInfo({
        nickname: profileEditForm.nickname,
        phone: profileEditForm.phone,
        avatar: profileEditForm.avatar
      })
      ElMessage.success('个人资料已更新')
      showProfileDialog.value = false
      if (authStore.userInfo?.orgId) {
        loadOrganizationData()
      }
    } else {
      ElMessage.error(res.msg || '更新失败')
    }
  } catch (err) {
    ElMessage.error('更新失败，请稍后重试')
  } finally {
    profileSubmitting.value = false
  }
}

const handleUpdatePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的新密码不一致')
    return
  }
  
  const userId = authStore.userInfo?.id
  if (!userId) return
  
  try {
    const res: any = await request.put(`/v1/users/${userId}/password`, {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    if (res.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      showPasswordDialog.value = false
      setTimeout(() => {
        // 1. 获取当前用户类型（用来判断要清空哪套前缀的缓存）
        const userType = authStore.userInfo?.userType || 'donor'
        const prefix = userType === 'admin' ? 'admin_' : 'donor_'

        // 2. 清除 Pinia 里的内存状态
        authStore.token = ''
        authStore.userInfo = null

        // 3. 彻底清空登录凭证 Token
        localStorage.removeItem(`${prefix}token`)
        localStorage.removeItem(`${prefix}userInfo`)
        localStorage.removeItem(`${prefix}isLoggedIn`)
        localStorage.removeItem(`${prefix}userType`)
        
        sessionStorage.removeItem(`${prefix}token`)
        sessionStorage.removeItem(`${prefix}userInfo`)
        sessionStorage.removeItem(`${prefix}isLoggedIn`)
        sessionStorage.removeItem(`${prefix}userType`)

        // 4. 必须抹除本地记住的“旧密码”！
        localStorage.removeItem(`${prefix}saved_password`)
        // 手机号/账号可以不删，这样跳转回去时账号还在，只需重新输新密码即可

        // 5. 原生跳转回对应的登录页，彻底刷新环境
       window.location.href = userType === 'admin' ? '/#/adminLogin' : '/#/'
      }, 1500)
    } else {
      ElMessage.error(res.msg || '密码修改失败')
    }
  } catch (err) {
    ElMessage.error('请求失败')
  }
}

// 图片上传前置校验钩子，将过大的 PNG 拦截在前端
const beforeImageUpload = (file: File) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif'
  // Spring Boot 默认限制 1MB。
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

const uploadFile = async (file: File, type: string): Promise<string | undefined> => {
  const formData = new FormData()
  formData.append('file', file)
  
  const res: any = await request.post(`/v1/upload/${type}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  if (res.code === 200 && res.data) {
    return res.data as string
  }
  return undefined
}

const uploadOrgLogo = async (options: any) => {
  try {
    const url = await uploadFile(options.file, 'logo')
    if (url) {
      orgForm.logo = url
      ElMessage.success('Logo 上传成功')
    }
  } catch {
    ElMessage.error('上传图片失败')
  }
}

const uploadProfileAvatar = async (options: any) => {
  try {
    const url = await uploadFile(options.file, 'avatar')
    if (url) {
      profileEditForm.avatar = url
      ElMessage.success('头像上传成功')
    }
  } catch {
    ElMessage.error('上传图片失败')
  }
}

const syncTabWithUrl = () => {
  const tab = route.query.tab as string
  if (tab && ['profile', 'org', 'settings'].includes(tab)) {
    activeTab.value = tab
  }
}

watch(() => route.query.tab, syncTabWithUrl)

watch(activeTab, (name) => {
  if (name === 'org') void loadOrganizationData()
})

onMounted(() => {
  syncTabWithUrl()
  if (activeTab.value === 'org') void loadOrganizationData()
})
</script>

<style scoped>
.settings-container { padding: 0; }
.settings-card { border-radius: 12px; min-height: 600px; }
.tab-label { display: flex; align-items: center; gap: 8px; font-size: 15px; }
.tab-content { padding: 20px 10px; }
.settings-actions .security-item + .security-item { border-top: 1px solid #f0f0f0; margin-top: 0; padding-top: 18px; }
.settings-actions .security-item:first-child { padding-top: 4px; }

.warm-btn { background: linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%); border: none; padding: 10px 25px; color: white; font-weight: bold; }

.info-descriptions { max-width: 720px; }
.org-desc { margin-top: 4px; }
.multiline { white-space: pre-wrap; line-height: 1.6; }
.muted { color: #999; font-size: 14px; }
.org-logo-wrap { display: inline-block; }
.org-logo-preview-readonly { width: 120px; height: 120px; object-fit: contain; border-radius: 8px; border: 1px solid #eee; background: #fafafa; }
.inline-upload { display: inline-flex; vertical-align: middle; }

.logo-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 12px;
  cursor: pointer;
  background: #fafafa;
}
.logo-uploader :deep(.el-upload:hover) { border-color: #FF7E5F; }
.logo-uploader-icon { font-size: 24px; color: #8c939d; width: 120px; height: 120px; text-align: center; line-height: 120px; }
.org-logo-preview { width: 120px; height: 120px; display: block; object-fit: contain; }
.upload-tip { font-size: 12px; color: #999; margin-top: 8px; }
.org-edit-form { max-height: 60vh; overflow-y: auto; padding-right: 4px; }

.security-item { display: flex; justify-content: space-between; align-items: center; padding: 18px 0; }
.security-item .title { font-size: 16px; font-weight: bold; color: #333; }
.security-item .desc { font-size: 14px; color: #999; margin-top: 5px; }

:deep(.el-tabs__item.is-active) { color: #FF7E5F; }
:deep(.el-tabs__active-bar) { background-color: #FF7E5F; }
</style>