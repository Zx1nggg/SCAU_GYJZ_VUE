<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑项目' : '创建项目'"
    width="700px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <!-- 机构信息（只读显示） -->
     <el-form-item label="所属机构">
        <el-input :value="authStore.userInfo?.nickname || '未知机构'" disabled />
      </el-form-item>

      <el-form-item label="项目标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入项目标题" maxlength="100" show-word-limit />
      </el-form-item>

      <el-form-item label="项目分类" prop="category">
        <el-select v-model="form.category" placeholder="请选择项目分类">
          <el-option label="教育助学" value="教育助学" />
          <el-option label="医疗救助" value="医疗救助" />
          <el-option label="灾害救援" value="灾害救援" />
          <el-option label="环境保护" value="环境保护" />
          <el-option label="社区发展" value="社区发展" />
          <el-option label="动物保护" value="动物保护" />
        </el-select>
      </el-form-item>

      <el-form-item label="目标金额" prop="targetAmount">
        <el-input-number
          v-model="form.targetAmount"
          :min="0"
          :precision="2"
          :step="1000"
          placeholder="请输入目标金额"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="项目周期" prop="dateRange">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          unlink-panels
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="封面图片" prop="coverImage">
        <el-upload
          class="cover-uploader"
          action="#"
          :show-file-list="false"
          :before-upload="beforeUpload"
          :http-request="uploadCover"
        >
          <img v-if="form.coverImage" :src="form.coverImage" class="cover-image" />
          <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
        </el-upload>
        <div class="upload-tip">建议上传 16:9 比例的图片，大小不超过 2MB</div>
      </el-form-item>

      <el-form-item label="项目内容" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="6"
          placeholder="请输入项目详细介绍..."
          maxlength="5000"
          show-word-limit
        />
      </el-form-item>

      <!-- <el-form-item label="联系电话" prop="contactPhone">
        <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
      </el-form-item>

      <el-form-item label="联系邮箱" prop="contactEmail">
        <el-input v-model="form.contactEmail" placeholder="请输入联系邮箱" />
      </el-form-item> -->
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ isEdit ? '更新' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { createProject, updateProject, type Project, type Organization } from '@/api/project'
import { useAuthStore } from '@/stores/auth'
import request from '@/utils/request'

const authStore = useAuthStore()
const props = defineProps<{
  modelValue: boolean
  project: Project | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const formRef = ref()
const submitting = ref(false)
const dateRange = ref<string[]>([])
const myOrganization = ref<Organization | null>(null)

const isEdit = computed(() => !!props.project?.id)

const form = reactive<Project>({
  id: 0,
  orgId: 0,
  title: '',
  category: '',
  targetAmount: 0,
  content: '',
  
  coverImage: '',
  startDate: '',
  endDate: '',
  projectStatus: 1
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入项目标题', trigger: 'blur' },
    { min: 5, max: 100, message: '标题长度为5-100个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择项目分类', trigger: 'change' }
  ],
  targetAmount: [
    { required: true, message: '请输入目标金额', trigger: 'blur' },
    { type: 'number', min: 1, message: '目标金额必须大于0', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入项目内容', trigger: 'blur' },
    { min: 10, message: '项目内容至少10个字符', trigger: 'blur' }
  ]
}

// // 获取当前用户所属机构
// const loadMyOrganization = async () => {
//   try {
//     const response = await getMyOrganization()
//     myOrganization.value = response
//     if (myOrganization.value) {
//       form.orgId = myOrganization.value.id
//     }
//   } catch (error) {
//     console.error('获取机构信息失败:', error)
//     ElMessage.error('获取机构信息失败')
//   }
// }

const resetForm = () => {
  Object.assign(form, {
    orgId: authStore.userInfo?.orgId || 0,
    title: '',
    category: '',
    targetAmount: 0,
    content: '',
    contactPhone: '',
    contactEmail: '',
    coverImage: '',
    startDate: '',
    endDate: '',
    projectStatus: 1
  })
  dateRange.value = []
  formRef.value?.clearValidate()
}

// 监听编辑数据
watch(() => props.project, (val) => {
  if (val) {
    Object.assign(form, val)
    dateRange.value = [val.startDate || '', val.endDate || '']
  } else {
    resetForm() // 触发新建时，就会自动带上上面的 orgId
  }
}, { immediate: true })

// 上传前验证
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

// 上传封面
const uploadCover = async (options: any) => {
  const file = options.file
  
  // 1. 创建 FormData 对象，用于封装文件数据
  const formData = new FormData()
  formData.append('file', file) // 这里的 'file' 必须与后端 @RequestParam("file") 保持一致

  try {
    // 2. 发起 POST 请求调用后端上传接口
    // 注意：request 是你封装好的 Axios 实例，它会自动处理 BaseURL 和 Token 注入
    const res: any = await request.post('/v1/upload/project', formData, {
      headers: {
        'Content-Type': 'multipart/form-data' // 必须指定为表单数据格式
      }
    })

    // 3. 处理接口返回结果
    if (res.code === 200) {
      // res.data 即为后端返回的虚拟路径，例如：/images/a1b2c3d4.jpg
      form.coverImage = res.data
      
      // 成功提示
      ElMessage({
        message: '图片上传成功',
        type: 'success'
      })
    } else {
      ElMessage.error(res.msg || '图片上传失败')
    }
  } catch (error) {
    console.error('上传图片发生异常:', error)
    ElMessage.error('连接服务器失败，请检查后端服务是否正常')
  }
}
// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    
    // 核心修复：处理日期格式以匹配后端的 LocalDateTime
    if (dateRange.value && dateRange.value.length === 2) {
      const start = dateRange.value[0]
      const end = dateRange.value[1]
      
      // 如果长度是10 (即 YYYY-MM-DD)，则给它补齐时分秒 (使用 T 连接是 Java 默认的 ISO-8601 标准)
      form.startDate = start.length === 10 ? `${start}T00:00:00` : start
      form.endDate = end.length === 10 ? `${end}T23:59:59` : end
    }
    
    submitting.value = true
    
    try {
      if (isEdit.value) {
        await updateProject(form)
        ElMessage.success('更新成功')
      } else {
        await createProject(form)
        ElMessage.success('创建成功')
      }
      emit('success')
      handleClose()
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    } finally {
      submitting.value = false
    }
  })
}

// 关闭对话框
const handleClose = () => {
  emit('update:modelValue', false)
  resetForm()
}

onMounted(() => {
  // loadMyOrganization()
})
</script>

<style scoped>
.cover-uploader {
  display: inline-block;
}

.cover-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.cover-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 320px;
  height: 180px;
  text-align: center;
  line-height: 180px;
  background: #fafafa;
}

.cover-image {
  width: 320px;
  height: 180px;
  display: block;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
</style>