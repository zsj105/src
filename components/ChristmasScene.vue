<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

/* --- 1. Canvas 雪花逻辑 --- */
const canvasRef = ref(null)
let ctx = null
let animationFrameId = null
let particles = []
const config = { count: 900, speed: 0.5, wind: 0.6 }

class Particle {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.reset(true)
  }
  reset(isInit = false) {
    this.x = Math.random() * this.w
    this.y = isInit ? Math.random() * this.h : -10
    this.size = Math.random() * 1.5 + 0.03
    this.speedY = Math.random() * config.speed + 0.1
    this.speedX = (Math.random() - 0.5) * config.wind
    this.opacity = Math.random() * 0.6 + 0.2
    this.swing = 0.01
    this.swingStep = Math.random() * 0.03
  }
  update() {
    this.swing += this.swingStep
    this.y += this.speedY
    this.x += Math.sin(this.swing) * 0.3 + this.speedX
    if (this.y > this.h || this.x > this.w || this.x < 0) this.reset()
  }
  draw(c) {
    c.beginPath()
    c.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    c.fillStyle = `rgba(255, 255, 255, ${this.opacity})`
    c.fill()
  }
}

const initCanvas = () => {
  const c = canvasRef.value
  if (!c) return
  c.width = window.innerWidth
  c.height = window.innerHeight
  ctx = c.getContext('2d')
  particles = Array.from({ length: config.count }, () => new Particle(c.width, c.height))
}
const render = () => {
  if (!ctx) return
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  particles.forEach((p) => {
    p.update()
    p.draw(ctx)
  })
  animationFrameId = requestAnimationFrame(render)
}
const handleResize = () => initCanvas()

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
  <div class="christmas-scene">
    <!-- Canvas 雪花层 -->
    <canvas ref="canvasRef" class="snow-canvas"></canvas>

    <!-- CSS 圣诞树 -->
    <div class="tree-container">
      <div class="star">⭐</div>
      <div class="tree-layer layer-top"></div>
      <div class="tree-layer layer-middle"></div>
      <div class="tree-layer layer-bottom"></div>
      <div class="trunk"></div>
      <!-- 彩灯装饰 -->
      <div class="bulb b1"></div>
      <div class="bulb b2"></div>
      <div class="bulb b3"></div>
      <div class="bulb b4"></div>
      <!-- 底部积雪 -->
      <div class="snow-ground"></div>
    </div>
  </div>
</template>

<style scoped>
.christmas-scene {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}
.snow-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* --- 圣诞树样式 --- */
.tree-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 140px;
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: drop-shadow(0 0 15px rgba(0, 255, 127, 0.2));

  /* 👇👇👇 这里控制大小 👇👇👇 */
  transform: scale(0.6); /* 缩小到 60% (你可以改成 0.5 更小，或 0.8 更大) */
  transform-origin: bottom right; /* 缩放基点设为右下角，保证贴边 */
}

/* 树叶 */
.tree-layer {
  width: 0;
  height: 0;
  position: absolute;
  border-left: solid transparent;
  border-right: solid transparent;
  border-bottom: solid #0f8a5f;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.5));
}
.layer-top {
  border-left-width: 35px;
  border-right-width: 35px;
  border-bottom-width: 45px;
  top: 20px;
  z-index: 3;
}
.layer-middle {
  border-left-width: 50px;
  border-right-width: 50px;
  border-bottom-width: 55px;
  top: 50px;
  z-index: 2;
}
.layer-bottom {
  border-left-width: 65px;
  border-right-width: 65px;
  border-bottom-width: 65px;
  top: 90px;
  z-index: 1;
}

/* 树干 */
.trunk {
  width: 24px;
  height: 35px;
  background: #5d4037;
  position: absolute;
  bottom: 0;
  border-radius: 2px;
}

/* 星星 */
.star {
  font-size: 28px;
  position: absolute;
  top: -10px;
  z-index: 10;
  animation: twinkle 1.5s infinite alternate;
  text-shadow: 0 0 10px gold;
}

/* 装饰彩灯 */
.bulb {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: absolute;
  z-index: 4;
  box-shadow: 0 0 5px currentColor;
  animation: blink 2s infinite;
}
.b1 {
  background: #ff5252;
  top: 55px;
  left: 55px;
  animation-delay: 0s;
}
.b2 {
  background: #ffd740;
  top: 95px;
  left: 40px;
  animation-delay: 0.5s;
}
.b3 {
  background: #40c4ff;
  top: 105px;
  left: 85px;
  animation-delay: 1s;
}
.b4 {
  background: #e040fb;
  top: 65px;
  left: 75px;
  animation-delay: 1.5s;
}

/* 地面积雪 */
.snow-ground {
  position: absolute;
  bottom: -10px;
  width: 160px;
  height: 20px;
  background: white;
  border-radius: 50%;
  filter: blur(5px);
  opacity: 0.8;
  z-index: 0;
}

@keyframes twinkle {
  from {
    opacity: 0.7;
    transform: scale(1);
  }
  to {
    opacity: 1;
    transform: scale(1.2) rotate(10deg);
  }
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}
</style>
