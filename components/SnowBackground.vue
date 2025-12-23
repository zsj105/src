<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let ctx = null
let animationFrameId = null
let particles = []

// 配置参数
const config = {
  count: 200, // 雪花数量
  speed: 0.5, // 基础下落速度
  wind: 0.5, // 左右飘动幅度
}

class Particle {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.reset(true)
  }

  reset(isInit = false) {
    this.x = Math.random() * this.canvasWidth
    // 如果是初始化，随机分布在全屏；否则从顶部开始
    this.y = isInit ? Math.random() * this.canvasHeight : -10
    this.size = Math.random() * 3 + 1 // 大小 1px - 4px
    this.speedY = Math.random() * config.speed + 0.5 // 随机速度
    this.speedX = (Math.random() - 0.5) * config.wind // 随机左右飘移
    this.opacity = Math.random() * 0.6 + 0.2 // 透明度
    this.swing = 0 // 用于正弦波飘动
    this.swingStep = Math.random() * 0.02 // 飘动频率
  }

  update() {
    this.swing += this.swingStep

    // 下落
    this.y += this.speedY
    // 左右摇摆 (正弦波)
    this.x += Math.sin(this.swing) * 0.5 + this.speedX

    // 边界检测：如果超出底部或左右边界，重置
    if (this.y > this.canvasHeight || this.x > this.canvasWidth || this.x < 0) {
      this.reset()
    }
  }

  draw(context) {
    context.beginPath()
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    context.fillStyle = `rgba(255, 255, 255, ${this.opacity})`
    context.fill()
  }
}

const initCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  // 设置画布宽高为窗口大小
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx = canvas.getContext('2d')

  // 初始化雪花
  particles = []
  for (let i = 0; i < config.count; i++) {
    particles.push(new Particle(canvas.width, canvas.height))
  }
}

const render = () => {
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)

  // 更新并绘制每个雪花
  particles.forEach((p) => {
    p.update()
    p.draw(ctx)
  })

  animationFrameId = requestAnimationFrame(render)
}

const handleResize = () => {
  initCanvas()
}

onMounted(() => {
  initCanvas()
  render()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <canvas ref="canvasRef" class="snow-canvas"></canvas>
</template>

<style scoped>
.snow-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 必须：让鼠标点击穿透 */
  z-index: 9999; /* 确保在最上层 */
}
</style>
