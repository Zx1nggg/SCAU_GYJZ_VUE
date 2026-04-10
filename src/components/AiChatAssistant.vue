<template>
  <div class="ai-assistant-container">
    <!-- 悬浮按钮 -->
    <div 
      class="float-button" 
      :class="{ 'is-active': isOpen }"
      @click="toggleChat"
    >
      <el-icon size="28" color="#fff"><Service /></el-icon>
      <!-- 未读红点提示 -->
      <span class="badge" v-if="!hasOpened">1</span>
    </div>

    <!-- 聊天窗口面板 -->
    <transition name="chat-fade">
      <div v-show="isOpen" class="chat-panel shadow-lg">
        <!-- 头部 -->
        <div class="chat-header">
          <div class="header-left">
            <!-- 替换为本地头像，并加上 no-select 禁止选中 -->
            <el-avatar :size="36" :src="xiaolingAvatar" class="no-select" />
            <div class="ai-info no-select">
              <span class="ai-name">公益之星 · 小铃</span>
              <span class="ai-status">在线为您服务</span>
            </div>
          </div>
          <div class="header-right">
            <el-icon class="close-btn" @click="toggleChat"><Close /></el-icon>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="chat-body" ref="chatBodyRef">
          <div 
            v-for="(msg, index) in messageList" 
            :key="index" 
            class="message-wrapper"
            :class="msg.role === 'user' ? 'is-user' : 'is-ai'"
          >
            <!-- AI 头像：加上 no-select -->
            <el-avatar 
              v-if="msg.role === 'ai'" 
              :size="32" 
              :src="xiaolingAvatar" 
              class="msg-avatar no-select"
            />
            
            <!-- 消息气泡 (只允许选中这里的文字) -->
            <div class="message-bubble">
              <div style="white-space: pre-wrap; line-height: 1.5;">{{ msg.content }}</div>
            </div>

            <!-- 用户头像：加上 no-select -->
            <el-avatar 
              v-if="msg.role === 'user'" 
              :size="32" 
              :src="authStore.userAvatar" 
              class="msg-avatar user-avatar no-select"
            />
          </div>
          
          <!-- 加载动画 -->
          <div v-if="isTyping" class="message-wrapper is-ai">
            <el-avatar :size="32" :src="xiaolingAvatar" class="msg-avatar no-select" />
            <div class="message-bubble typing-bubble">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="chat-footer">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            placeholder="问问小铃关于公益的事情吧..."
            resize="none"
            @keyup.enter.exact.prevent="sendMessage"
          />
          <div class="footer-actions">
            <span class="tip-text no-select">Enter 发送</span>
            <el-button type="primary" size="small" class="send-btn" @click="sendMessage" :disabled="isTyping || !inputText.trim()">
              <el-icon><Position /></el-icon> 发送
            </el-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Service, Close, Position } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { sendChatMessage } from '@/api/ai'

// 引入本地头像图片 (确保图片放在 src/assets/ 下，名字对得上)
import xiaolingAvatar from '@/assets/xiaoling.jpg'

const authStore = useAuthStore()

const isOpen = ref(false)
const hasOpened = ref(false)
const isTyping = ref(false)
const inputText = ref('')
const chatBodyRef = ref<HTMLElement | null>(null)

// 初始欢迎语
const messageList = ref([
  { role: 'ai', content: `嘎哦~ 你好，我是公益之星小铃 🔔！\n感谢你对 SCAU 公益捐赠平台的支持。\n你可以问我关于如何捐赠、机构入驻或者平台使用的问题哦，像夏天的微风一样清爽地问我吧 V(^-^)V` }
])

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value && !hasOpened.value) {
    hasOpened.value = true
  }
  if (isOpen.value) {
    scrollToBottom()
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  }
}

const sendMessage = async () => {
  if (!inputText.value.trim() || isTyping.value) return

  const userMsg = inputText.value.trim()
  inputText.value = ''
  
  // 1. 把用户消息推入列表
  messageList.value.push({ role: 'user', content: userMsg })
  scrollToBottom()

  // 2. 显示 AI 正在输入
  isTyping.value = true
  scrollToBottom()

  try {
    // 3. 请求后端 Spring AI 接口
    const res: any = await sendChatMessage(userMsg)
    if (res.code === 200 && res.data) {
      messageList.value.push({ role: 'ai', content: res.data })
    } else {
      messageList.value.push({ role: 'ai', content: '不好意思，小铃开小差了，请稍后再试一次吧，嘎哦。' })
    }
  } catch (error) {
    messageList.value.push({ role: 'ai', content: '呜……网络连接异常，无法连接到 AI 服务，嘎哦。' })
  } finally {
    isTyping.value = false
    scrollToBottom()
  }
}
</script>

<style scoped>
/* 核心防复制污染 CSS：禁止鼠标选中头像和头部文字 */
.no-select {
  user-select: none;          /* 标准语法 */
  -webkit-user-select: none;  /* Safari/Chrome */
  -moz-user-select: none;     /* Firefox */
  -ms-user-select: none;      /* IE/Edge */
}

.ai-assistant-container {
  position: fixed;
  right: 30px;
  bottom: 40px;
  z-index: 2000;
}

/* 悬浮按钮 */
.float-button {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(255, 126, 95, 0.4);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
}

.float-button:hover {
  transform: scale(1.1);
}

.float-button.is-active {
  transform: scale(0.9);
  opacity: 0;
  pointer-events: none;
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #F56C6C;
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  border: 2px solid white;
}

/* 聊天面板 */
.chat-panel {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 380px;
  height: 550px;
  background-color: #fff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid #ebeef5;
}

/* 动画过渡 */
.chat-fade-enter-active,
.chat-fade-leave-active {
  transition: all 0.3s ease;
  transform-origin: bottom right;
}
.chat-fade-enter-from,
.chat-fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

/* 头部 */
.chat-header {
  height: 60px;
  background: linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: white;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ai-info {
  display: flex;
  flex-direction: column;
}
.ai-name {
  font-size: 16px;
  font-weight: bold;
}
.ai-status {
  font-size: 12px;
  opacity: 0.9;
}
.close-btn {
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}
.close-btn:hover {
  transform: rotate(90deg);
}

/* 消息区 */
.chat-body {
  flex: 1;
  padding: 20px;
  background-color: #f7f8fa;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message-wrapper {
  display: flex;
  align-items: flex-start;
  max-width: 95%;
}

.is-user {
  align-self: flex-end;
  justify-content: flex-end;
}

.is-ai {
  align-self: flex-start;
}

.msg-avatar {
  flex-shrink: 0;
  border: 1px solid #ebeef5; /* 给本地头像加个淡雅的边框会更好看 */
  background-color: #fff;
}
.user-avatar {
  margin-left: 10px;
}
.is-ai .message-bubble {
  margin-left: 10px;
  background-color: #ffffff;
  color: #333;
  border-top-left-radius: 4px;
}

.is-user .message-bubble {
  background-color: #FF7E5F;
  color: #fff;
  border-top-right-radius: 4px;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  word-break: break-word;
  /* 确保文字可以被正常选中复制 */
  user-select: text; 
}

/* 底部输入区 */
.chat-footer {
  padding: 15px;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
}
.chat-footer :deep(.el-textarea__inner) {
  background-color: #f5f7fa;
  border: none;
  border-radius: 8px;
  padding: 10px;
}
.chat-footer :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #FF7E5F inset;
}
.footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}
.tip-text {
  font-size: 12px;
  color: #999;
}
.send-btn {
  background-color: #FF7E5F;
  border: none;
}

/* 打字动画 */
.typing-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 16px !important;
}
.dot {
  width: 6px;
  height: 6px;
  background-color: #999;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}
.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>