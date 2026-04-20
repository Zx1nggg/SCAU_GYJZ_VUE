import request from '@/utils/request'

/**
 * 获取机构入驻申请列表
 */
export const getOrgApplications = (params: any) => {
  return request.get('/v1/sadmin/organizations/applications', { params })
}

/**
 * 审核机构入驻申请
 */
export const auditOrgApplication = (applyId: number, data: { status: number; auditRemark?: string; auditorId?: number }) => {
  // 组装后端需要的完整 JSON 结构
  const payload = {
    applyId: applyId,
    status: data.status,
    auditRemark: data.auditRemark,
    auditorId: data.auditorId // 如果系统里有当前审核人的 ID，可以在调用时传进来
  };
  return request.post(`/v1/sadmin/registerApply/audit`, payload);
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

// 重置用户密码为默认密码
export const resetUserPassword = (userId: number) => {
  return request.put(`/v1/users/${userId}/reset-password`)
}