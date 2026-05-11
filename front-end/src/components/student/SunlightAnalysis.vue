<!-- SunlightAnalysis.vue -->
<template>
  <div class="analysis-panel">
    <el-alert title="日照分析操作步骤" type="info" :closable="false">
      1. 选择分析时间范围<br/>
      2. 点击添加分析点<br/>
      3. 查看日照分析结果<br/>
      🟡黄色=日照充足 🔵蓝色=日照不足
    </el-alert>

    <div class="control-group">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :shortcuts="shortcuts"
      ></el-date-picker>
      <el-time-select
        v-model="timeRange.start"
        placeholder="开始时间"
        :picker-options="{ start: '06:00', step: '01:00', end: '18:00' }"
      ></el-time-select>
      <el-time-select
        v-model="timeRange.end"
        placeholder="结束时间"
        :picker-options="{ start: '06:00', step: '01:00', end: '18:00' }"
      ></el-time-select>
    </div>

    <div class="control-group" style="margin-top: 10px;">
      <el-button @click="addAnalysisPoint" type="primary">添加分析点</el-button>
      <el-button @click="startAnalysis" type="success">开始分析</el-button>
      <el-button @click="clearResults" type="danger">清除结果</el-button>
    </div>

    <div class="result-panel" v-if="analysisResult.length > 0">
      <el-table :data="analysisResult">
        <el-table-column prop="id" label="分析点ID"></el-table-column>
        <el-table-column prop="sunlightHours" label="日照时长(小时)"></el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <span :class="scope.row.status === '充足' ? 'status-sufficient' : 'status-insufficient'">{{ scope.row.status }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { inject, ref, onMounted, defineExpose } from 'vue'
import { ElMessage } from 'element-plus'
const cesiumMap = ref(null)
const providedCesiumMap = inject('cesiumMap', null)
const isReady = ref(false)
const dateRange = ref([])
const timeRange = ref({
  start: '08:00',
  end: '16:00'
})

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
const analysisPoints = ref([])
const analysisResult = ref([])

// 日期选择器快捷选项
const shortcuts = [
  {
    text: '今天',
    value: () => {
      const now = new Date()
      return [now, now]
    }
  },
  {
    text: '本周',
    value: () => {
      const now = new Date()
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return [start, end]
    }
  }
]

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

const addAnalysisPoint = () => {
  if (isReady.value) {
    cesiumMap.value.addSunlightAnalysisPoint()
  } else {
    console.error('cesiumMap实例尚未准备好')
  }
}

const startAnalysis = () => {
  if (isReady.value) {
    if (dateRange.value.length === 0) {
      ElMessage.warning('请选择日期范围')
      return
    }
    if (!timeRange.value.start || !timeRange.value.end) {
      ElMessage.warning('请选择时间范围')
      return
    }
    const params = {
      startDate: dateRange.value[0],
      endDate: dateRange.value[1],
      startTime: timeRange.value.start,
      endTime: timeRange.value.end
    }
    // 调用CesiumMap的日照分析方法，并获取结果
    const results = cesiumMap.value.startSunlightAnalysis(params)
    // 更新分析结果数据，用于表格显示
    analysisResult.value = results
    ElMessage.success('日照分析完成')
  } else {
    ElMessage.error('地图实例尚未准备好，请稍后再试')
  }
}

const clearResults = () => {
  if (isReady.value) {
    cesiumMap.value.clearSunlightAnalysisResults()
    analysisResult.value = []
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

.result-panel {
  margin-top: 15px;
  max-height: 300px;
  overflow-y: auto;
}

.status-sufficient {
  color: #e6a23c;
  font-weight: bold;
}

.status-insufficient {
  color: #4096ff;
  font-weight: bold;
}

.el-alert {
  margin-bottom: 15px;
}
</style>