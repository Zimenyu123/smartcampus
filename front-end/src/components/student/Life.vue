<template>
  <div class="life-container">
    <h2 class="module-title">生活服务</h2>
    <div class="function-cards">
      <el-card class="function-card" @click="navigateToSunlightAnalysis">
        <div class="card-content">
          <div class="icon-container">
            <i class="el-icon-sunny"></i>
          </div>
          <h3 class="card-title">日照分析</h3>
          <p class="card-desc">分析校园内不同位置的日照情况</p>
        </div>
      </el-card>
      <!-- 可以添加其他生活服务功能卡片 -->
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateToSunlightAnalysis = () => {
  // 导航到日照分析组件
  router.push({ name: 'SunlightAnalysis' })
}
</script>

<style scoped>
.life-container {
  padding: 20px;
}

.module-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.function-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.function-card {
  width: 280px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.function-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.icon-container {
  width: 60px;
  height: 60px;
  background-color: #f0f9eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.icon-container i {
  font-size: 24px;
  color: #67c23a;
}

.card-title {
  font-size: 18px;
  margin-bottom: 10px;
  color: #333;
}

.card-desc {
  font-size: 14px;
  color: #666;
  text-align: center;
}
</style>