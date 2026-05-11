<template>
  <div class="facility-management">
    <component :is="currentFacilityComponent" />
  </div>
</template>

<script setup>
import { ref, defineProps, watch } from 'vue'
import FacilityDelivery from './FacilityDelivery.vue'
import FacilityStudy from './FacilityStudy.vue'
import FacilitySports from './FacilitySports.vue'

// 定义props接收当前选中的设施类型
const props = defineProps({
  facilityType: {
    type: String,
    default: 'delivery'
  }
})

// 根据设施类型选择对应的组件
const currentFacilityComponent = ref(FacilityDelivery)

// 监听设施类型变化，切换组件
watch(() => props.facilityType, (newType) => {
  switch (newType) {
    case 'delivery':
      currentFacilityComponent.value = FacilityDelivery
      break
    case 'study':
      currentFacilityComponent.value = FacilityStudy
      break
    case 'sports':
      currentFacilityComponent.value = FacilitySports
      break
    default:
      currentFacilityComponent.value = FacilityDelivery
  }
})

// 初始设置
currentFacilityComponent.value = {
  delivery: FacilityDelivery,
  study: FacilityStudy,
  sports: FacilitySports
}[props.facilityType] || FacilityDelivery
</script>

<style scoped>
.facility-management {
  height: 100%;
  overflow: hidden;
}
</style>