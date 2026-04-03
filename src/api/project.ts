import request from '../utils/request'
import { useAuthStore } from '@/stores/auth'

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
  token?: string
}

// 项目类型定义
export interface Project {
  id?: number
  orgId?: number
  title: string
  content: string
  targetAmount: number      // 目标金额
  currentAmount?: number    // 当前已筹金额
  projectStatus?: number    // 项目状态 1=进行中 2=已结束
  startDate: string         // 开始时间
  endDate: string           // 结束时间
  coverImage?: string       // 封面图片
  category: string          // 分类
  sortOrder?: number        // 排序权重
  createTime?: string       // 创建时间
  donations?: any[]         // 一对多关联

}

// 机构类型定义
export interface Organization {
  id: number
  name: string
  code?: string
  logo?: string
  description?: string
  address?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  status: number
  createTime?: string
}

// 项目统计
export interface ProjectStatistics {
  projectId: number
  title: string
  donationCount: number      // 捐赠总笔数
  currentAmount: number          // 捐赠总金额
  donorCount: number           // 捐赠人数
  averageDonation: number        // 平均捐赠金额
  maxDonation: number          // 最大捐赠金额
  minDonation: number          // 最小捐赠金额
  totalProjectCount: number  // 项目总数
  totalAmount: number        // 累计筹款金额
  totalDonorCount: number    // 累计捐赠人数

  dailyStats?: Array<{
    date: string
    amount: number
    count: number
  }>
}

// 分页响应
export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// 获取项目列表 - 自动添加当前用户的机构ID
export const getProjectList = (params: {
  page?: number
  size?: number
  id?: number
  title?: string
  content?: string
  startDate?: string
  endDate?: string
  category?: string
}) => {
  // 获取当前登录用户信息
  const authStore = useAuthStore()
  const userInfo = authStore.userInfo
  
  // 构建请求参数，添加机构ID
  const requestParams: any = {
    page: params.page || 1,
    size: params.size || 10,
    ...params
  }
   
  // 如果是管理员，添加机构ID
  if (userInfo?.orgId) {
    requestParams.orgId = userInfo.orgId
  }
  
  return request.get<any, ApiResponse<PageResult<Project>>>('/v1/projects', { params: requestParams })
}

// 获取项目详情
export const getProjectById = (id: number) => {
  return request.get<any, Project>(`/v1/projects/${id}`)
}

// 创建项目
export const createProject = (data: Project) => {
  return request.post('/v1/projects', data)
}

// 更新项目
export const updateProject = (data: Project) => {
  return request.put('/v1/projects', data)
}

// 删除项目
export const deleteProject = (id: number) => {
  return request.delete(`/v1/projects/${id}`)
}

// 获取项目统计
export const getProjectStatistics = (id: number) => {
  return request.get<any, ApiResponse<ProjectStatistics>>(`/v1/projects/${id}/statistics`)
}

// // 获取机构列表
// export const getOrganizationList = (params?: { page?: number; size?: number }) => {
//   return request.get<any, PageResult<Organization>>('/v1/organizations', { params })
// }

// // 获取当前用户所属机构
// export const getMyOrganization = () => {
//   return request.get<any, Organization>('/v1/organizations/my')
// }

// 获取用户所在机构的项目统计数据
export const getOrgProjectStats = (orgId: number) => {
  return request.get<any, ApiResponse<ProjectStatistics>>(`/v1/projects/${orgId}/OrgStatistics`)
}