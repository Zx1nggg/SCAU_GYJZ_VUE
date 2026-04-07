import request from '@/utils/request'

/**
 * 获取机构入驻申请列表
 */
export const getOrgApplications = (params: any) => {
  return request.get('/v1/sadmin/organizations/applications', { params })
}

/**
 * 审核机构入驻申请
 * @param id 机构ID
 * @param data status: 1-通过, 2-驳回; auditRemark: 审核备注
 */
export const auditOrgApplication = (id: number, data: { status: number; auditRemark?: string }) => {
  return request.put(`/v1/sadmin/organizations/${id}/audit`, data)
}

/**
 * 获取全平台用户列表
 */
export const getUserList = (params: any) => {
  return request.get('/v1/sadmin/users', { params })
}

/**
 * 更改用户状态 (封禁/解禁)
 * @param id 用户ID
 * @param status 1-正常, 2-封禁
 */
export const updateUserStatus = (id: number, status: number) => {
  return request.put(`/v1/sadmin/users/${id}/status`, { status })
}

export const getPlatformStats = () => {
  return request.get('/v1/sadmin/stats')
}