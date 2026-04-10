import request from '@/utils/request'

/**
 * 发送消息给 AI 助手小铃
 */
export const sendChatMessage = (message: string) => {
  return request.post('/v1/ai/chat', { message })
}