<template>
  <div class="ai-chat-container">
    <!-- 悬浮触发按钮：动态位置绑定 -->
    <div 
      class="float-bubble no-select" 
      :class="{ 'active': isOpen }"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
      @mousedown="startDrag"
      @touchstart="startDrag"
      @click="handleBubbleClick"
    >
      <el-icon v-if="!isOpen" size="28"><Service /></el-icon>
      <el-icon v-else size="28"><Close /></el-icon>
      <span class="unread-dot" v-if="!hasOpened">1</span>
    </div>

    <!-- 聊天主面板：智能判断展开方向 -->
    <transition name="pop-direction">
      <div 
        v-if="isOpen" 
        class="chat-panel"
        :style="panelStyle"
      >
        <div class="header no-select">
          <div class="header-left">
            <el-avatar :size="36" :src="xiaolingAvatar" class="avatar-fixed" />
            <div class="title-wrap">
              <span class="name">公益助手 · 小铃</span>
              <span class="status">正在聆听微风...</span>
            </div>
          </div>
        </div>

        <!-- 消息区 -->
        <div class="message-box" ref="scrollRef">
          <div v-for="(msg, i) in messages" :key="i" :class="['msg-row', msg.role]">
            <el-avatar v-if="msg.role === 'ai'" :size="32" :src="xiaolingAvatar" class="no-select avatar-fixed" />
            <div class="bubble">
              <div class="text-content">{{ msg.content }}</div>
            </div>
            <el-avatar v-if="msg.role === 'user'" :size="32" :src="authStore.userAvatar" class="no-select avatar-fixed" />
          </div>

          <!-- 加载中动画 -->
          <div v-if="loading" class="msg-row ai">
            <el-avatar :size="32" :src="xiaolingAvatar" class="no-select avatar-fixed" />
            <div class="bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="footer">
          <el-input
            v-model="input"
            type="textarea"
            :rows="2"
            placeholder="问问小铃关于公益的事吧..."
            resize="none"
            @keyup.enter.exact.prevent="send"
          />
          <div class="actions">
            <span class="tip no-select">Enter 发送</span>
            <el-button type="primary" size="small" :disabled="!input.trim() || loading" @click="send">
              发送
            </el-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { Service, Close } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { sendChatMessage } from '@/api/ai'
import xiaolingAvatar from '@/assets/xiaoling.jpg'

const authStore = useAuthStore()
const isOpen = ref(false)
const hasOpened = ref(false)
const loading = ref(false)
const input = ref('')
const scrollRef = ref<HTMLElement | null>(null)

// --- 初始位置设定 ---
const position = reactive({
  x: window.innerWidth - 80,
  y: window.innerHeight - 150
})

const dragData = {
  isDragging: false,
  startX: 0,
  startY: 0,
  initialX: 0,
  initialY: 0,
  moveDistance: 0
}

/**
 * 核心：动态计算面板位置与弹出方向
 */
const panelStyle = computed(() => {
  const bubbleSize = 56
  const margin = 15
  const isLeft = position.x < window.innerWidth / 2
  const isTop = position.y < window.innerHeight / 2 // 判断是否在屏幕上半部分

  let style: any = {
    position: 'fixed',
    left: isLeft ? position.x + 'px' : 'auto',
    right: isLeft ? 'auto' : (window.innerWidth - position.x - bubbleSize) + 'px'
  }

  if (isTop) {
    // 在上半部分：向下展示
    style.top = (position.y + bubbleSize + margin) + 'px'
    style.bottom = 'auto'
    // 设置动画源点为上方，对应的水平位置根据左右停靠决定
    style.transformOrigin = isLeft ? 'top left' : 'top right'
  } else {
    // 在下半部分：向上展示
    style.bottom = (window.innerHeight - position.y + margin) + 'px'
    style.top = 'auto'
    style.transformOrigin = isLeft ? 'bottom left' : 'bottom right'
  }

  return style
})

const startDrag = (e: MouseEvent | TouchEvent) => {
  dragData.isDragging = true
  dragData.moveDistance = 0
  
  const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX
  const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY
  
  dragData.startX = clientX
  dragData.startY = clientY
  dragData.initialX = position.x
  dragData.initialY = position.y

  window.addEventListener('mousemove', onDragging)
  window.addEventListener('touchmove', onDragging, { passive: false })
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchend', stopDrag)
}

const onDragging = (e: MouseEvent | TouchEvent) => {
  if (!dragData.isDragging) return
  if (e instanceof TouchEvent) e.preventDefault()

  const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX
  const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY

  const dx = clientX - dragData.startX
  const dy = clientY - dragData.startY
  dragData.moveDistance = Math.sqrt(dx * dx + dy * dy)

  const bubbleSize = 56
  position.x = Math.max(10, Math.min(window.innerWidth - bubbleSize - 10, dragData.initialX + dx))
  position.y = Math.max(10, Math.min(window.innerHeight - bubbleSize - 10, dragData.initialY + dy))
}

const stopDrag = () => {
  dragData.isDragging = false
  window.removeEventListener('mousemove', onDragging)
  window.removeEventListener('touchmove', onDragging)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchend', stopDrag)
}

const handleBubbleClick = () => {
  if (dragData.moveDistance > 5) return
  isOpen.value = !isOpen.value
  hasOpened.value = true
  if (isOpen.value) scrollBottom()
}

const handleResize = () => {
  if (position.x > window.innerWidth - 60) position.x = window.innerWidth - 80
  if (position.y > window.innerHeight - 60) position.y = window.innerHeight - 150
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

// --- 业务逻辑 ---
const messages = ref([
  { role: 'ai', content: '嘎哦~ 你好！我是公益助手小铃。如果你把我拖到屏幕上方，我会向下展开哦；拖到下方，我就向上展示！是不是很神奇？V(^-^)V' }
])

const scrollBottom = async () => {
  await nextTick()
  if (scrollRef.value) {
    scrollRef.value.scrollTop = scrollRef.value.scrollHeight
  }
}

const send = async () => {
  if (!input.value.trim() || loading.value) return
  const text = input.value.trim()
  input.value = ''
  messages.value.push({ role: 'user', content: text })
  scrollBottom()
  
  loading.value = true
  try {
    const res: any = await sendChatMessage(text)
    if (res.code === 200) {
      messages.value.push({ role: 'ai', content: res.data })
    } else {
      messages.value.push({ role: 'ai', content: '呜，小铃刚才走神了，再说一遍好吗？' })
    }
  } catch (e) {
    messages.value.push({ role: 'ai', content: '网络连接断开了，小铃找不到回家的路了嘎哦...' })
  } finally {
    loading.value = false
    scrollBottom()
  }
}
</script>

<style scoped>
.no-select {
  user-select: none;
  -webkit-user-select: none;
}

.float-bubble {
  position: fixed;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: linear-gradient(135deg, #FF7E5F, #FEB47B);
  box-shadow: 0 4px 15px rgba(255, 126, 95, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: move;
  color: white;
  transition: transform 0.3s, background 0.3s;
  z-index: 3001;
  touch-action: none;
}

.float-bubble:hover { transform: scale(1.05); }
.float-bubble.active { background: #909399; }

.unread-dot {
  position: absolute;
  top: 0;
  right: 0;
  background: #F56C6C;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  border: 2px solid white;
}

.chat-panel {
  position: fixed;
  width: 360px;
  height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 3000;
}

.header {
  padding: 15px 20px;
  background: linear-gradient(135deg, #FF7E5F, #FEB47B);
  color: white;
  display: flex;
  justify-content: space-between;
}

.header-left { display: flex; gap: 12px; align-items: center; }
.name { font-weight: bold; font-size: 16px; display: block; }
.status { font-size: 12px; opacity: 0.8; }

.message-box {
  flex: 1;
  padding: 15px;
  background: #f7f8fa;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.msg-row { display: flex; gap: 10px; max-width: 90%; }
.msg-row.user { align-self: flex-end; flex-direction: row; }
.msg-row.ai { align-self: flex-start; }

.avatar-fixed { flex-shrink: 0; }

.bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}

.ai .bubble { background: white; color: #333; border-top-left-radius: 2px; }
.user .bubble { background: #FF7E5F; color: white; border-top-right-radius: 2px; }

.footer { padding: 15px; border-top: 1px solid #eee; }
.actions { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.tip { font-size: 11px; color: #999; }

/* 打字动画 */
.typing span {
  width: 6px; height: 6px; background: #999; border-radius: 50%; display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both; margin: 0 2px;
}
.typing span:nth-child(1) { animation-delay: -0.32s; }
.typing span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce { 
  0%, 80%, 100% { transform: scale(0); } 
  40% { transform: scale(1); } 
}

/* 🌟 方向自适应缩放动画 */
.pop-direction-enter-active, 
.pop-direction-leave-active { 
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
}
.pop-direction-enter-from, 
.pop-direction-leave-to { 
  opacity: 0; 
  transform: scale(0.5); 
}
</style>