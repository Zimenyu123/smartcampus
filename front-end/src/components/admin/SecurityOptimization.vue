<template>
  <div class="security-container">
    <component :is="currentWarningComponent" ref="securityRef" />
  </div>
</template>

<script setup>
import { ref, provide, nextTick } from 'vue'
import FireSafety from './FireSafety.vue'
import FloodSafety from './FloodSafety.vue'

const currentWarningComponent = ref(null)
const cesiumMap = ref(null)
const securityRef = ref(null)

// 提供CesiumMap实例给子组件
provide('cesiumMap', cesiumMap)

// 设置CesiumMap引用
const setCesiumMap = (mapInstance) => {
  cesiumMap.value = mapInstance
  // 如果当前有活跃的预警组件，立即设置地图实例
  if (currentWarningComponent.value && securityRef.value && typeof securityRef.value.setCesiumMap === 'function') {
    nextTick(() => {
      securityRef.value.setCesiumMap(mapInstance)
    })
  }
}

defineExpose({
  setWarningType(type) {
    currentWarningComponent.value = type === 'fire' ? FireSafety : FloodSafety
    // 设置预警类型后，确保地图实例正确传递
    nextTick(() => {
      if (cesiumMap.value && securityRef.value && typeof securityRef.value.setCesiumMap === 'function') {
        securityRef.value.setCesiumMap(cesiumMap.value)
      }
    })
  },
  setCesiumMap
})
</script>