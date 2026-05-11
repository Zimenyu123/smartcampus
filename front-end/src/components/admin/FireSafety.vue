<!-- FireSafety.vue -->
<template>
  <div class="fire-safety-panel">
    <el-alert title="火灾预警操作步骤" type="warning" :closable="false">
      1. 调整火焰大小和传播速度参数<br/>
      2. 点击添加起火点<br/>
      3. 观察火灾扩散模拟效果<br/>
      🔥红色=火势强烈 🔴橙色=火势中等 🟠黄色=火势较弱
    </el-alert>

    <div class="control-group">
      <el-slider
        v-model="fireSize"
        :min="1"
        :max="10"
        label-show
        :format-tooltip="formatFireSize"
        placeholder="火焰大小"
      ></el-slider>
      <el-slider
        v-model="spreadSpeed"
        :min="1"
        :max="10"
        label-show
        :format-tooltip="formatSpreadSpeed"
        placeholder="传播速度"
      ></el-slider>
    </div>

    <div class="control-group" style="margin-top: 10px;">
      <el-button @click="addFirePoint" type="primary">添加起火点</el-button>
      <el-button @click="startSimulation" type="success">开始模拟</el-button>
      <el-button @click="stopSimulation" type="danger">停止模拟</el-button>
      <el-button @click="clearSimulation" type="warning">清除模拟</el-button>
    </div>

    <div class="result-panel" v-if="firePoints.length > 0">
      <el-table :data="firePoints">
        <el-table-column prop="id" label="起火点ID"></el-table-column>
        <el-table-column prop="intensity" label="火势强度"></el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <span :class="get_status_class(scope.row.status)">{{ scope.row.status }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { inject, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
const cesiumMap = inject('cesiumMap', null)
const isReady = ref(false)
const fireSize = ref(5)
const spreadSpeed = ref(5)
const firePoints = ref([])
const isSimulating = ref(false)

onMounted(() => {
  // 等待cesiumMap实例准备就绪
  const checkCesiumMap = setInterval(() => {
    if (cesiumMap && cesiumMap.value) {
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

const formatFireSize = (value) => {
  return `火焰大小: ${value}`
}

const formatSpreadSpeed = (value) => {
  return `传播速度: ${value}`
}

const get_status_class = (status) => {
  switch(status) {
    case '强烈':
      return 'status-strong'
    case '中等':
      return 'status-medium'
    case '较弱':
      return 'status-weak'
    default:
      return ''
  }
}

const addFirePoint = () => {
  if (isReady.value) {
    const params = {
      size: fireSize.value,
      speed: spreadSpeed.value
    }
    cesiumMap.value.addFirePoint(params)
    ElMessage.info('请在地图上点击添加起火点')

    // 添加后立即尝试更新火灾点数据
    setTimeout(() => {
      if (cesiumMap.value && cesiumMap.value.getFirePoints) {
        const points = cesiumMap.value.getFirePoints();
        if (points) {
          firePoints.value = points;
        }
      }
    }, 300);
  } else {
    ElMessage.error('地图实例尚未准备好，请稍后再试')
  }
}

const startSimulation = () => {
  if (isReady.value) {
    if (firePoints.value.length === 0) {
      ElMessage.warning('请先添加起火点')
      return
    }
    cesiumMap.value.startFireSimulation({
      spreadSpeed: spreadSpeed.value
    })
    isSimulating.value = true
    ElMessage.success('火灾模拟已开始')
  } else {
    ElMessage.error('地图实例尚未准备好，请稍后再试')
  }
}

const stopSimulation = () => {
  if (isReady.value && isSimulating.value) {
    cesiumMap.value.stopFireSimulation()
    isSimulating.value = false
    ElMessage.info('火灾模拟已停止')
  } else {
    ElMessage.warning('当前没有正在进行的火灾模拟')
  }
}

const clearSimulation = () => {
  if (isReady.value) {
    cesiumMap.value.clearFireSimulation()
    firePoints.value = []
    isSimulating.value = false
    ElMessage.info('火灾模拟已清除')
  } else {
    ElMessage.error('地图实例尚未准备好，请稍后再试')
  }
}

// 监听CesiumMap中的火灾点更新
if (isReady.value) {
  // 使用定时器定期获取火灾点数据
  const updateFirePointsInterval = setInterval(() => {
    // 检查cesiumMap实例和getFirePoints方法是否存在
    if (cesiumMap.value && cesiumMap.value.getFirePoints) {
      const points = cesiumMap.value.getFirePoints();
      if (points) {
        firePoints.value = points;
      }
    }
  }, 1000);

  // 在组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(updateFirePointsInterval);
  });
}
</script>

<style scoped>
.fire-safety-panel {
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
  align-items: center;
}

.result-panel {
  margin-top: 15px;
  max-height: 300px;
  overflow-y: auto;
}

.status-strong {
  color: #f56c6c;
  font-weight: bold;
}

.status-medium {
  color: #fa8c16;
  font-weight: bold;
}

.status-weak {
  color: #e6a23c;
  font-weight: bold;
}

.el-alert {
  margin-bottom: 15px;
}

.el-slider {
  width: 100%;
  margin-top: 10px;
}
</style>