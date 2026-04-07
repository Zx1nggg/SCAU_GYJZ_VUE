import request from '@/utils/request'

/**
 * 机构信息对象
 */
export interface Organization {
  id?: number
  name: string
  code?: string
  logo?: string
  content?: string
  address?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  orgStatus?: number
}

/**
 * 获取指定机构的详细信息
 */
export const getOrgInfo = (id: number) => {
  return request({
    url: `/v1/organizations/${id}`,
    method: 'get'
  })
}

/**
 * 更新机构信息
 */
export const updateOrgInfo = (data: Organization) => {
  return request({
    url: '/v1/organizations',
    method: 'put',
    data
  })
}