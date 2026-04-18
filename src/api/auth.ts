// src/api/auth.ts
import request from '@/utils/request'
import type { UserInfo } from '@/stores/auth'

// 定义 User 对象类型
export interface User {
  phone?: string
  password?: string
  username?: string
}

export interface DonorLoginResponse {
  id: number
  username?: string 
  nickname: string
  role: number
  phone: string
  avatar?: string
  token?: string
  userStatus?: number
  createTime?: string
}

export interface AdminLoginResponse {
  username: string
  orgId:number // 机构ID
  nickname: string
  role: number
  phone: string
  avatar?: string
  token?: string
  userStatus?: number
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
  token?: string
}

// 捐赠者登录 - 直接传 User 对象
export const donorLogin = (user: User): Promise<ApiResponse<DonorLoginResponse>> => {
  return request.post('/v1/donor/Login', user)
}

// 管理员登录 - 直接传 User 对象
export const adminLogin = (user: User): Promise<ApiResponse<AdminLoginResponse>> => {
  return request.post('/v1/admin/Login', user)
}

// 捐赠者注册 - 直接传 User 对象
export const donorRegister = (user:User): Promise<ApiResponse<any>> => {
  return request.post('/v1/donor/Register', user)
}

// 管理员注册申请 - 直接传 User 对象
export const adminRegisterApply = (user:User): Promise<ApiResponse<any>> => {
  return request.post('/v1/admin/registerApply', user)
}

/* 显式传入 userId，匹配后端的 PUT /api/v1/users/{userId} */
export const updateUserInfo = (userId: number, data: Partial<Pick<UserInfo, 'nickname' | 'phone' | 'avatar'>>) => {
  return request({
    url: `/v1/users/${userId}`,
    method: 'put',
    data
  })
}

// 发送验证码 - 废除前端模拟方式，改为调用后端接口
// export const sendVerifyCode = (phone: string) => {
//   // 方式1：模拟验证码（前端直接返回）
//   return new Promise((resolve) => {
//     // 生成6位随机验证码
//     const code = Math.floor(100000 + Math.random() * 900000).toString()
//     console.log(`模拟验证码: ${code} 已发送到手机 ${phone}`)
    
//     // 模拟延迟
//     setTimeout(() => {
//       resolve({
//         code: 200,
//         message: '验证码发送成功',
//         data: {
//           verifyCode: code,  // 模拟验证码，实际开发中不应返回给前端
//           expireTime: 300    // 有效期5分钟
//         }
//       })
//     }, 500)
//   })
  
//   // TODO：方式2：调用后端接口（实际项目使用）
//   // return request.post('/v1/sendCode', { phone })
// }
export const sendVerifyCode = (phone: string) => {
  // 调用后端接口，不再让前端自己生成
  return request.post('/v1/common/sendCode', { phone })
}