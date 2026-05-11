<template>
  <div class="flood-safety-panel">
    <el-alert title="淹没分析操作步骤" type="warning" :closable="false">
      1. 调整淹没点大小和速度参数<br /> 2. 点击添加淹没点按钮在地图上选择位置<br /> 3. 点击开始按钮进行淹没模拟<br /> 4. 可随时暂停或结束模拟<br />
      🔵蓝色=低水位 🔷深蓝色=中水位 🔹浅蓝色=高水位
    </el-alert>

    <div class="control-group">
      <el-input v-model.number="floodSize" placeholder="淹没点大小" :min="1" :max="10" type="number"></el-input>
      <el-slider v-model="speed" :min="1" :max="100" label-show :format-tooltip="formatSpeed"
        placeholder="淹没速度"></el-slider>
    </div>

    <div class="control-group" style="margin-top: 10px;">
      <el-button @click="startSelectingArea" type="info">选取区域</el-button>
      <el-button @click="clearSelectionArea" type="default">清除区域</el-button>
      <el-button @click="addFloodPoint" type="success">添加淹没点</el-button>
      <el-button @click="startSimulation" type="primary" :disabled="!hasFloodPoints">开始模拟</el-button>
      <el-button @click="pauseSimulation" :disabled="!isSimulating" type="success">{{ pausing ? '继续模拟' :
        '暂停模拟' }}</el-button>
      <el-button @click="stopSimulation" :disabled="!isSimulating" type="danger">结束模拟</el-button>
      <el-button @click="clearSimulation" type="warning">清除模拟</el-button>
    </div>

    <div class="result-panel" v-if="floodStatus">
      <el-table :data="floodData">
        <el-table-column prop="currentHeight" label="当前高程"></el-table-column>
        <el-table-column prop="status" label="模拟状态">
          <template #default="scope">
            <span :class="get_status_class(scope.row.status)">{{ scope.row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="spreadRadius" label="扩散半径"></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { inject, ref, onMounted, onUnmounted, watch, reactive } from 'vue'
import { ElMessage } from 'element-plus'
const cesiumMap = inject('cesiumMap', null)
const isReady = ref(false)
const floodSize = ref(5)
const speed = ref(5)
const isSimulating = ref(false)
const pausing = ref(false)
const floodStatus = ref(false)
const floodData = ref([])
const hasSelectedArea = ref(false)
const hasFloodPoints = ref(false)

// 监听区域选取状态变化
watch(() => cesiumMap && cesiumMap.value && cesiumMap.value.floodPolygonCoordinates, (newVal) => {
  hasSelectedArea.value = newVal && newVal.length > 0
})

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

const formatSpeed = (value) => {
  return `淹没速度: ${value}`
}

const get_status_class = (status) => {
  switch (status) {
    case '严重淹没':
      return 'status-high'
    case '中度淹没':
      return 'status-medium'
    case '轻度淹没':
      return 'status-low'
    case '开始淹没':
      return 'status-low'
    default:
      return ''
  }
}

const addFloodPoint = () => {
  if (isReady.value) {
    cesiumMap.value.addFloodPoint({
      size: floodSize.value,
      speed: speed.value
    })
    hasFloodPoints.value = true
    ElMessage.success('请在地图上点击选择淹没点位置')
  } else {
    ElMessage.error('地图实例尚未准备好，请稍后再试')
  }
}

const startSimulation = () => {
  if (isReady.value) {
    cesiumMap.value.startFloodSimulation({
      speed: speed.value
    })

    isSimulating.value = true
    pausing.value = false
    floodStatus.value = true
    floodData.value = []

    ElMessage.success('淹没模拟已开始')
  } else {
    ElMessage.error('地图实例尚未准备好，请稍后再试')
  }
}

const pauseSimulation = () => {
  if (isReady.value && isSimulating.value) {
    cesiumMap.value.pauseFloodSimulation()
    pausing.value = !pausing.value
    ElMessage.info(pausing.value ? '淹没模拟已暂停' : '淹没模拟已继续')
  }
}

const stopSimulation = () => {
  if (isReady.value && isSimulating.value) {
    cesiumMap.value.stopFloodSimulation()
    isSimulating.value = false
    pausing.value = false
    ElMessage.info('淹没模拟已结束')
  } else {
    ElMessage.warning('当前没有正在进行的淹没模拟')
  }
}

const startSelectingArea = () => {
  if (isReady.value) {
    cesiumMap.value.startSelectingFloodArea()
    ElMessage.info('请在地图上点击4个点以形成四边形区域')
  } else {
    ElMessage.error('地图实例尚未准备好，请稍后再试')
  }
}

const clearSelectionArea = () => {
  if (isReady.value) {
    cesiumMap.value.clearFloodSelection()
    hasSelectedArea.value = false
    ElMessage.info('已清除选取的区域')
  } else {
    ElMessage.error('地图实例尚未准备好，请稍后再试')
  }
}

const clearSimulation = () => {
  if (isReady.value) {
    cesiumMap.value.clearFloodSimulation()
    isSimulating.value = false
    pausing.value = false
    floodStatus.value = false
    floodData.value = []
    hasFloodPoints.value = false
    ElMessage.info('淹没模拟已清除')
  } else {
    ElMessage.error('地图实例尚未准备好，请稍后再试')
  }
}

// 监听CesiumMap中的淹没数据更新
let updateFloodDataInterval = null;

onMounted(() => {
  // 等待cesiumMap实例准备就绪
  const checkCesiumMap = setInterval(() => {
    if (cesiumMap && cesiumMap.value) {
      isReady.value = true;
      clearInterval(checkCesiumMap);

      // 启动数据更新定时器
      updateFloodDataInterval = setInterval(() => {
        // 检查cesiumMap实例和getFloodData方法是否存在
        if (cesiumMap.value && cesiumMap.value.getFloodData) {
          const data = cesiumMap.value.getFloodData();
          if (data && Array.isArray(data)) {
            floodData.value = data.map(point => ({
              currentHeight: point.currentHeight || 0,
              status: point.status || '未开始',
              spreadRadius: point.spreadRadius || 0
            }));
          }
        }
      }, 1000);
    }
  }, 100);

  // 5秒后仍未获取到实例则报错
  setTimeout(() => {
    if (!isReady.value) {
      clearInterval(checkCesiumMap);
      ElMessage.error('未能获取到cesiumMap实例');
    }
  }, 5000);
});

// 在组件卸载时清除定时器
onUnmounted(() => {
  if (updateFloodDataInterval) {
    clearInterval(updateFloodDataInterval);
  }
});
</script>

<style scoped>
.flood-safety-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 300px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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

.status-high {
  color: #1890ff;
  font-weight: bold;
}

.status-medium {
  color: #40a9ff;
  font-weight: bold;
}

.status-low {
  color: #69b1ff;
  font-weight: bold;
}

.el-alert {
  margin-bottom: 15px;
}

.el-slider {
  width: 100%;
  margin-top: 10px;
}

.el-input {
  width: 100%;
  margin-top: 10px;
}
</style>