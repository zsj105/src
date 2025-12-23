<script setup>
import { ref, onMounted } from 'vue'

// 雪花数量
const snowCount = 50
const snowflakes = ref([])

// 生成随机雪花属性
const createSnowflakes = () => {
  const flakes = []
  for (let i = 0; i < snowCount; i++) {
    flakes.push({
      id: i,
      // 水平位置 0% - 100%
      left: Math.random() * 100 + 'vw',
      // 动画时长 5s - 15s (飘得快慢不同)
      duration: Math.random() * 10 + 5 + 's',
      // 延迟时间，避免同时落下
      delay: Math.random() * 5 + 's',
      // 雪花大小
      size: Math.random() * 10 + 5 + 'px',
      // 透明度
      opacity: Math.random() * 0.5 + 0.3,
    })
  }
  snowflakes.value = flakes
}

onMounted(() => {
  createSnowflakes()
})
</script>

<template>
  <div class="christmas-container">
    <!-- 1. 下雪层 -->
    <div
      v-for="flake in snowflakes"
      :key="flake.id"
      class="snowflake"
      :style="{
        left: flake.left,
        animationDuration: flake.duration,
        animationDelay: flake.delay,
        width: flake.size,
        height: flake.size,
        opacity: flake.opacity,
      }"
    ></div>

    <!-- 2. 圣诞树 (固定在右下角) -->
    <div class="christmas-tree">
      <div class="star">⭐</div>
      <div class="tree-layer layer-top"></div>
      <div class="tree-layer layer-middle"></div>
      <div class="tree-layer layer-bottom"></div>
      <div class="trunk"></div>
      <!-- 简单的装饰球 -->
      <div class="ornament o1"></div>
      <div class="ornament o2"></div>
      <div class="ornament o3"></div>
    </div>
  </div>
</template>

<style scoped>
/* 容器：覆盖全屏，但不能阻挡鼠标点击下面的内容 */
.christmas-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 关键：让鼠标穿透，不影响正常操作 */
  z-index: 9999;
  overflow: hidden;
}

/* --- 雪花样式 --- */
.snowflake {
  position: absolute;
  top: -20px;
  background: white;
  border-radius: 50%;
  filter: blur(1px);
  animation: fall linear infinite;
}

@keyframes fall {
  0% {
    transform: translateY(-20px) translateX(0);
  }
  50% {
    transform: translateY(50vh) translateX(20px); /* 半路飘一点 */
  }
  100% {
    transform: translateY(110vh) translateX(-20px);
  }
}

/* --- 圣诞树样式 --- */
.christmas-tree {
  position: absolute;
  bottom: 20px;
  right: 20px; /* 放在右下角 */
  width: 120px;
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: drop-shadow(0 5px 5px rgba(0, 0, 0, 0.2));
  /* 如果不想挡住右下角的操作，可以取消下面的注释让树也半透明或穿透 */
  /* pointer-events: auto; */
}

/* 星星 */
.star {
  font-size: 24px;
  color: gold;
  position: absolute;
  top: -15px;
  z-index: 10;
  animation: twinkle 1.5s infinite alternate;
}

/* 树叶层（三角形） */
.tree-layer {
  width: 0;
  height: 0;
  border-left: solid transparent;
  border-right: solid transparent;
  border-bottom: solid #0f8a5f;
  position: absolute;
}

.layer-top {
  border-left-width: 30px;
  border-right-width: 30px;
  border-bottom-width: 40px;
  top: 10px;
  z-index: 3;
}
.layer-middle {
  border-left-width: 45px;
  border-right-width: 45px;
  border-bottom-width: 50px;
  top: 35px;
  z-index: 2;
}
.layer-bottom {
  border-left-width: 60px;
  border-right-width: 60px;
  border-bottom-width: 60px;
  top: 70px;
  z-index: 1;
}

/* 树干 */
.trunk {
  width: 20px;
  height: 30px;
  background: #6d4c41;
  position: absolute;
  bottom: 0;
}

/* 装饰球 */
.ornament {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: absolute;
  z-index: 4;
  animation: glow 2s infinite alternate;
}
.o1 {
  background: red;
  top: 40px;
  left: 50px;
}
.o2 {
  background: gold;
  top: 80px;
  left: 30px;
  animation-delay: 0.5s;
}
.o3 {
  background: red;
  top: 90px;
  left: 75px;
  animation-delay: 1s;
}

/* 动画 */
@keyframes twinkle {
  from {
    transform: scale(1);
    opacity: 0.8;
  }
  to {
    transform: scale(1.2);
    opacity: 1;
    text-shadow: 0 0 10px gold;
  }
}
@keyframes glow {
  from {
    box-shadow: 0 0 2px currentColor;
  }
  to {
    box-shadow: 0 0 8px currentColor;
  }
}
</style>
