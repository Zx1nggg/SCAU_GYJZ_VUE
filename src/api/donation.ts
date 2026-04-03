import request from '../utils/request'
import { useAuthStore } from '@/stores/auth'

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
  token?: string
}

// 捐赠记录类型定义
export interface Donation {
  id?: number
  projectId: number          // 项目ID
  userId?: number            // 用户ID
  donorName: string          // 捐赠人姓名
  donorPhone?: string        // 电话
  amount: number             // 捐赠金额
  donorTime: string          // 捐赠时间
  certificateNo?: string     // 捐赠凭证号
  payment?: string           // 支付方式
  source?: number            // 来源 1=线上 2=线下
  donationStatus?: number    // 状态 1=成功 2=已退款 3=异常
  createTime?: string        // 创建时间
  refundTime?: string        // 退款时间
  remark?: string            // 备注
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

// 分页响应
export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// 捐赠人统计数据的返回类型
export interface DonorStatisticResponse {
  totalAmount: number
  totalCount: number
  projectCount: number
}

// 获取项目的捐赠统计
export interface DonationStatistics {
  projectId: number
  title: string
  donationCount: number       // 捐赠总笔数
  totalAmount: number         // 捐赠总金额
  donorCount: number          // 捐赠人数
  averageDonation: number     // 平均捐赠金额
  maxDonation: number
  minDonation: number
  dailyStats?: Array<{
    date: string
    amount: number
    count: number
  }>
}

// 获取当前用户所在组织的项目捐赠列表（分页）
export const getDonationList = (params: {
  page?: number
  size?: number
  projectId?: number
  donorName?: string
  minAmount?: number
  maxAmount?: number
  startDate?: string
  endDate?: string
}) => {
  const authStore = useAuthStore()
  const userInfo = authStore.userInfo

  const requestParams: any = {
    page: params.page || 1,
    size: params.size || 10,
    ...params
  }

  // 如果用户有orgId，自动传给后端
  if (userInfo?.orgId) {
    requestParams.orgId = userInfo.orgId
  }

  return request.get<any, ApiResponse<PageResult<Donation>>>('/v1/donations', {
    params: requestParams
  })
}

// 获取单条捐赠记录详情
export const getDonationById = (id: number) => {
  return request.get<any, ApiResponse<Donation>>(`/v1/donations/${id}`)
}

// 创建捐赠记录
export const createDonation = (data: Donation) => {
  return request.post<any, ApiResponse>('/v1/donations/create', data)
}

// 更新捐赠记录
export const updateDonation = (id: number, data: Partial<Donation>) => {
  return request.put<any, ApiResponse>(`/v1/donations/${id}`, data)
}

// 删除捐赠记录
export const deleteDonation = (id: number) => {
  return request.delete<any, ApiResponse>(`/v1/donations/${id}`)
}



export const getDonationStatistics = (projectId: number) => {
  return request.get<any, ApiResponse<DonationStatistics>>(`/v1/donations/${projectId}/statistics`)
}

// 可获取当前用户机构下的所有项目（用于捐赠列表筛选）
export const getOrganizationProjects = (params?: { page?: number; size?: number }) => {
  const authStore = useAuthStore()
  const userInfo = authStore.userInfo
  const requestParams: any = { ...params }
  if (userInfo?.orgId) requestParams.orgId = userInfo.orgId
  return request.get<any, ApiResponse<PageResult<Project>>>('/v1/projects', { params: requestParams })
}

// 我的捐赠列表(捐赠人端)
export const getMyDonations = (params: any) => {
  return request.get<any, ApiResponse<PageResult<Donation>>>('/v1/donations/my', { params })
}

// 获取用户捐赠统计(捐赠人端)
export const getDonorStatistic = (userId: number) => {
  return request.get<any, ApiResponse<DonorStatisticResponse>>(`/v1/donations/statistic/${userId}`)
}