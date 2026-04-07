<template>
  <div class="app-management-container">
    <el-card shadow="hover" class="box-card">
      <template #header>
        <div class="card-header">
          <span class="title">🏢 机构入驻申请处理</span>
          <el-radio-group v-model="queryParams.status" @change="handleQuery" size="small">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button :label="0">待审核</el-radio-button>
            <el-radio-button :label="1">已通过</el-radio-button>
            <el-radio-button :label="2">已驳回</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table v-loading="loading" :data="appList" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="机构名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="org-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="统一社会信用代码" width="180" />
        <el-table-column prop="contactPerson" label="联系人" width="120" />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column prop="createTime" label="申请时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="orgStatus" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.orgStatus === 0" type="warning">待审核</el-tag>
            <el-tag v-else-if="row.orgStatus === 1" type="success">已通过</el-tag>
            <el-tag v-else-if="row.orgStatus === 2" type="danger">已驳回</el-tag>
            <el-tag v-else type="info">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="openAuditDialog(row)">
              {{ row.orgStatus === 0 ? '立即审核' : '查看详情' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleQuery"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 审核弹窗 -->
    <el-dialog v-model="auditDialogVisible" title="机构资质审核" width="650px" destroy-on-close>
      <div v-if="currentApp" class="audit-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="机构名称" :span="2">{{ currentApp.name }}</el-descriptions-item>
          <el-descriptions-item label="信用代码" :span="2">{{ currentApp.code }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ currentApp.contactPerson }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentApp.contactPhone }}</el-descriptions-item>
          <el-descriptions-item label="联系邮箱" :span="2">{{ currentApp.contactEmail || '未提供' }}</el-descriptions-item>
          <el-descriptions-item label="机构简介" :span="2">
            <div style="white-space: pre-wrap; line-height: 1.5;">{{ currentApp.content || '无' }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 审核操作区 (仅待审核状态显示) -->
        <div v-if="currentApp.orgStatus === 0" class="audit-action-area">
          <el-divider>审批意见</el-divider>
          <el-form label-position="top">
            <el-form-item label="备注说明 (选填，驳回时建议填写)">
              <el-input v-model="auditForm.remark" type="textarea" :rows="3" placeholder="请输入审批意见..." />
            </el-form-item>
          </el-form>
        </div>
        <div v-else class="audit-action-area">
          <el-alert 
            :title="currentApp.orgStatus === 1 ? '该机构已通过审核' : '该机构已被驳回'" 
            :type="currentApp.orgStatus === 1 ? 'success' : 'error'" 
            show-icon 
            :closable="false" 
            style="margin-top: 20px;"
          />
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="auditDialogVisible = false">关 闭</el-button>
          <template v-if="currentApp?.orgStatus === 0">
            <el-button type="danger" plain :loading="submitting" @click="submitAudit(2)">驳 回</el-button>
            <el-button type="success" :loading="submitting" @click="submitAudit(1)">通 过</el-button>
          </template>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrgApplications, auditOrgApplication } from '@/api/sadmin'

const loading = ref(false)
const appList = ref<any[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  size: 10,
  status: '' as number | string
})

const auditDialogVisible = ref(false)
const currentApp = ref<any>(null)
const submitting = ref(false)
const auditForm = reactive({
  remark: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = { ...queryParams }
    if (params.status === '') delete params.status

    const res: any = await getOrgApplications(params)
    if (res.code === 200 && res.data) {
      appList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error('加载申请列表失败')
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.page = 1
  loadData()
}

const openAuditDialog = (row: any) => {
  currentApp.value = row
  auditForm.remark = ''
  auditDialogVisible.value = true
}

const submitAudit = async (status: number) => {
  if (status === 2 && !auditForm.remark.trim()) {
    try {
      await ElMessageBox.confirm('驳回申请通常需要填写备注说明原因，是否坚持不填写备注直接驳回？', '提示', { type: 'warning' })
    } catch {
      return
    }
  }

  submitting.value = true
  try {
    const res: any = await auditOrgApplication(currentApp.value.id, {
      status,
      auditRemark: auditForm.remark
    })
    if (res.code === 200) {
      ElMessage.success(status === 1 ? '已通过该机构的入驻申请' : '已驳回该机构申请')
      auditDialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (error) {
    ElMessage.error('网络请求失败')
  } finally {
    submitting.value = false
  }
}

const formatDateTime = (timeStr: string) => {
  if (!timeStr) return '--'
  return timeStr.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.app-management-container {
  padding: 0;
}
.box-card {
  border-radius: 12px;
  border: none;
  min-height: calc(100vh - 120px);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}
.org-name {
  font-weight: 500;
  color: #409eff;
}
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.audit-action-area {
  margin-top: 20px;
}
</style>