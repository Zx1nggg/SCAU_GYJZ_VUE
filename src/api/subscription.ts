import request from '@/utils/request'

// 1. 订阅项目
export const subscribeProject = (userId: number, projectId: number) => {
  return request.post('/v1/subscriptions', { userId, projectId })
}

// 2. 取消订阅
export const unsubscribeProject = (userId: number, projectId: number) => {
  return request.delete('/v1/subscriptions', { params: { userId, projectId } })
}

// 3. 获取我的订阅列表 (用于首页展示)
export const getMySubscriptions = (userId: number) => {
  return request.get('/v1/subscriptions/my', { params: { userId } })
}

// 4. 查询当前用户是否已订阅该项目 (用于项目详情页点亮星星)
export const checkSubscriptionStatus = (userId: number, projectId: number) => {
  return request.get('/v1/subscriptions/status', { params: { userId, projectId } })
}