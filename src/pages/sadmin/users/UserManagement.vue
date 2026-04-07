<template>
  <div class="user-management-container">
    <el-card shadow="hover" class="box-card">
      <template #header>
        <div class="card-header">
          <span class="title">👥 全平台用户管理</span>
          <div class="search-area">
            <el-input
              v-model="queryParams.keyword"
              placeholder="搜索手机号/昵称/账号"
              clearable
              style="width: 250px; margin-right: 10px;"
              @keyup.enter="handleQuery"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="queryParams.role" placeholder="用户角色" clearable style="width: 120px; margin-right: 10px;" @change="handleQuery">
              <el-option label="捐赠者" :value="1" />
              <el-option label="机构管理员" :value="2" />
            </el-select>
            <el-button type="primary" @click="handleQuery">搜索</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="userList" stripe style="width: 100%">
        <el-table-column label="头像" width="80" align="center">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar || defaultAvatar" />
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="用户昵称/姓名" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <strong>{{ row.nickname || '未设置' }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="登录账号" width="130">
          <template #default="{ row }">
            {{ row.username || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号码" width="130">
          <template #default="{ row }">
            {{ row.phone || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色身份" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.role === 1" type="success" effect="plain">捐赠者</el-tag>
            <el-tag v-else-if="row.role === 2" type="primary" effect="plain">机构管理员</el-tag>
            <el-tag v-else-if="row.role === 9" type="danger" effect="dark">超级管理员</el-tag>
            <el-tag v-else type="info">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="userStatus" label="账号状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.userStatus"
              :active-value="1"
              :inactive-value="2"
              inline-prompt
              active-text="正常"
              inactive-text="封禁"
              :disabled="row.role === 9"
              style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
              @change="(val: any) => handleStatusChange(row, val)"
            />
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getUserList, updateUserStatus } from '@/api/sadmin'

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const loading = ref(false)
const userList = ref<any[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  size: 10,
  keyword: '',
  role: '' as number | string
})

const loadData = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = { ...queryParams }
    if (params.role === '') delete params.role
    if (!params.keyword) delete params.keyword

    const res: any = await getUserList(params)
    if (res.code === 200 && res.data) {
      userList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.page = 1
  loadData()
}

// 🌟 更改用户状态 (封禁/解禁)
const handleStatusChange = async (row: any, newStatus: number) => {
  const actionText = newStatus === 1 ? '解禁' : '封禁'
  try {
    if (newStatus === 2) {
      // 封禁时给予强提示
      await ElMessageBox.confirm(`确定要封禁用户【${row.nickname || row.phone || row.username}】吗？封禁后该用户将无法登录。`, '高危操作提示', {
        confirmButtonText: '确定封禁',
        cancelButtonText: '取消',
        type: 'error'
      })
    }

    const res: any = await updateUserStatus(row.id, newStatus)
    if (res.code === 200) {
      ElMessage.success(`已成功${actionText}该用户`)
    } else {
      // 恢复开关状态
      row.userStatus = newStatus === 1 ? 2 : 1
      ElMessage.error(res.msg || `${actionText}失败`)
    }
  } catch (error) {
    // 捕获取消操作，恢复开关状态
    row.userStatus = newStatus === 1 ? 2 : 1
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
.user-management-container {
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
.search-area {
  display: flex;
  align-items: center;
}
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>