<!-- VisibilityAnalysis.vue -->
<template>
  <div class="analysis-panel">
    <el-alert title="操作步骤" type="info" :closable="false">
      1. 先添加视点（绿色）<br/>
      2. 再添加目标点（红色）<br/>
      3. 自动分析显示结果<br/>
      🟢绿色=可见 🔴红色=不可见
    </el-alert>

    <div class="control-group">
      <el-button @click="addViewPoint" type="success">添加视点</el-button>
      <el-button @click="addTargetPoint" type="warning">添加目标点</el-button>
      <el-button @click="clearResults" type="danger">清除所有</el-button>
    </div>
  </div>
</template>

<script setup>
import { inject, ref, onMounted, defineExpose } from 'vue'
import { ElMessage } from 'element-plus'
const cesiumMap = ref(null)
const providedCesiumMap = inject('cesiumMap', null)
const isReady = ref(false)

// 接收地图实例的方法
const setCesiumMap = (mapInstance) => {
  if (mapInstance) {
    cesiumMap.value = mapInstance
    isReady.value = true
    ElMessage.success('地图实例已设置成功')
  } else {
    ElMessage.error('传入的地图实例无效')
  }
}

// 暴露方法给父组件
defineExpose({ setCesiumMap })

onMounted(() => {
  // 优先使用通过setCesiumMap传入的实例
  if (cesiumMap.value) {
    isReady.value = true
    return
  }

  // 其次尝试使用inject的实例
  const checkCesiumMap = setInterval(() => {
    if (providedCesiumMap && providedCesiumMap.value) {
      cesiumMap.value = providedCesiumMap.value
      isReady.value = true
      clearInterval(checkCesiumMap)
    }
  }, 100)
  
  // 5秒后仍未获取到实例则报错
  setTimeout(() => {
    if (!isReady.value) {
      clearInterval(checkCesiumMap)
      ElMessage.error('未能获取到cesiumMap实例')
    }
  }, 5000)
})

const addViewPoint = () => {
  if (isReady.value) {
    cesiumMap.value.clearResults()
    cesiumMap.value.addViewPoint()
  } else {
    console.error('cesiumMap实例尚未准备好')
  }
}

const addTargetPoint = () => {
  if (isReady.value) {
    cesiumMap.value.addTargetPoint()
  } else {
    console.error('cesiumMap实例尚未准备好')
  }
}

const clearResults = () => {
  if (isReady.value) {
    cesiumMap.value.clearResults()
  } else {
    console.error('cesiumMap实例尚未准备好')
  }
}
</script>

<style scoped>
.analysis-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 300px;
  background: rgba(255,255,255,0.9);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  z-index: 1000;
}

.control-group {
  margin-top: 15px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.el-alert {
  margin-bottom: 15px;
}
</style>