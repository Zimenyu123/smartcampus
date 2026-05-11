<template>
  <div class="safety-container">
    <el-button @click="handleFloodAnalysisClick">淹没分析</el-button>
    <div class="safety-content">
      这里是安全模块
    </div>
  </div>
</template>

<script setup>
import { ElButton } from 'element-plus'
import { defineEmits } from 'vue'

const emit = defineEmits(['openFloodAnalysis'])

const handleFloodAnalysisClick = () => {
  emit('openFloodAnalysis')
}
</script>

<style scoped>
.safety-container {
  padding: 20px;
}
.safety-content {
  margin-top: 15px;
}
</style>