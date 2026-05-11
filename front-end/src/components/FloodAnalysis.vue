<template>
  <!-- <div class="control-panel">
    <el-icon class="close-btn" @click="$emit('close')"><Close /></el-icon>
    <el-slider v-model="currentHeight" :min="minHeight" :max="maxHeight" :step="0.5" />
    <el-button @click="toggleAnimation">{{ isAnimating ? '暂停' : '开始' }}淹没</el-button>
    <el-input-number v-model="speed" :min="0.1" :max="10" :step="0.5" label="上升速度(m/s)" />
  </div> -->
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as Cesium from 'cesium'
import { ElInputNumber, ElIcon, ElSlider, ElButton } from 'element-plus'
import { Close } from '@element-plus/icons-vue'

const emit = defineEmits(['update:polygonCoordinates']);

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  },
  minHeight: {
    type: Number,
    default: 0
  },
  maxHeight: {
    type: Number,
    default: 100
  },
  polygonCoordinates: {
    type: Array,
    default: () => []
  }
})

// 使用props中的值直接作为初始值
const minHeight = ref(0)
const maxHeight = ref(100)

// 监听props变化更新ref值
watch(() => props.minHeight, (newVal) => {
  minHeight.value = newVal
})

watch(() => props.maxHeight, (newVal) => {
  maxHeight.value = newVal
})
// 设置合理的初始高度值
const currentHeight = ref(props.minHeight || 0)
const speed = ref(1.2)
const isAnimating = ref(false)

let floodPrimitive = null
let animationFrameId = null

const initFloodAnalysis = () => {
  if (!props.viewer?.scene) {
    return
  }
  const polygonHierarchy = new Cesium.PolygonHierarchy(
    props.polygonCoordinates
  )

  const material = new Cesium.Material({
    fabric: {
      type: 'Water',
      uniforms: {
        baseColor: new Cesium.Color(0.2, 0.5, 0.8, 0.6),
        time: 0,
        height: currentHeight.value
      },
      source: `
        uniform vec4 baseColor;
        uniform float time;
        uniform float height;
        
        czm_material czm_getMaterial(czm_materialInput materialInput) {
          czm_material material = czm_getDefaultMaterial(materialInput);
          float verticalPos = materialInput.positionToEyeEC.z;
          float wave = sin(time * 10.0 + verticalPos * 0.1) * 0.5 + 0.5;
          material.diffuse = mix(baseColor.rgb, vec3(0.7, 0.8, 1.0), wave);
          material.alpha = baseColor.a;
          if (verticalPos < height) {
            material.diffuse *= 0.8;
          }
          return material;
        }
      `
    }
  })

  floodPrimitive = props.viewer.scene.primitives.add(
    new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: polygonHierarchy,
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
        }),
        id: 'flood-area'
      }),
      appearance: new Cesium.MaterialAppearance({
        material: material,
        translucent: true
      })
    })
  )
}

const animateFlood = () => {
  let lastTime = Date.now()
  const update = () => {
    const now = Date.now()
    const delta = (now - lastTime) / 1000
    lastTime = now

    currentHeight.value += speed.value * delta * 60
    if (currentHeight.value > maxHeight.value) {
      stopAnimation()
      return
    }

    floodPrimitive.appearance.material.uniforms.height = currentHeight.value
    floodPrimitive.appearance.material.uniforms.time += delta
    animationFrameId = requestAnimationFrame(update)
  }
  animationFrameId = requestAnimationFrame(update)
}

const stopAnimation = () => {
  isAnimating.value = false
  cancelAnimationFrame(animationFrameId)
  currentHeight.value = minHeight.value
}

const toggleAnimation = () => {
  isAnimating.value = !isAnimating.value
  isAnimating.value ? animateFlood() : stopAnimation()
}

watch(() => props.viewer, (newVal) => {
  if (newVal?.scene) {
    newVal.terrainProvider = Cesium.createWorldTerrain()
    newVal.scene.globe.depthTestAgainstTerrain = true
    initFloodAnalysis()
  }
})

onMounted(() => {
  if (props.viewer?.scene) {
    initFloodAnalysis()
  }
})

onUnmounted(() => {
  props.viewer.scene.primitives.remove(floodPrimitive)
  stopAnimation()
})

// 已在startCollection中实现了点收集功能，移除重复代码

const points = ref([])
const isCollecting = ref(false)

const handleClick = (movement) => {
  if (!isCollecting.value || points.value.length >=4) return
  
  const cartesian = props.viewer.camera.pickEllipsoid(movement.position)
  if (cartesian) {
    points.value.push(cartesian.clone())
    
    if(points.value.length ===4) {
      isCollecting.value = false
      props.viewer.scene.screenSpaceCameraController.enableRotate = true
      props.viewer.scene.screenSpaceCameraController.enableZoom = true
      // 确保正确发射更新多边形坐标的事件
emit('update:polygonCoordinates', points.value)
    }
  }
}

watch(() => props.viewer, (viewer) => {
  if(viewer) {
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction(handleClick, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    
    onUnmounted(() => {
      handler.destroy()
    })
  }
})

const startCollection = () => {
  points.value = [];
  isCollecting.value = true;
  props.viewer.scene.screenSpaceCameraController.enableRotate = false;
  props.viewer.scene.screenSpaceCameraController.enableZoom = false;
  
  const handler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  handler.setInputAction((click) => {
    const position = props.viewer.scene.pickPosition(click.position);
    if (position) {
      points.value.push(position);
      if(points.value.length === 4) {
        handler.destroy();
        isCollecting.value = false;
        props.viewer.scene.screenSpaceCameraController.enableRotate = true;
        props.viewer.scene.screenSpaceCameraController.enableZoom = true;
        emit('update:polygonCoordinates', points.value.map(p => Cesium.Cartographic.fromCartesian(p)))
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  // ... existing code ...
};

defineExpose({
  startCollection
});
</script>

<style scoped>
.control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000; /* 增加z-index确保面板在最上层 */
  background: rgba(255, 255, 255, 0.95);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  color: #666;
  font-size: 20px;
}

.close-btn:hover {
  color: #ff4d4f;
}

/* Element Plus组件样式调整 */
:deep(.el-slider) {
  margin: 10px 0;
}

:deep(.el-button) {
  margin-top: 5px;
  align-self: flex-start;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>