<template>
  <div class="student-page">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <div class="logo-container">
        <img src="../assets/logo透明底.jfif" alt="嘉应学院logo" class="logo" />
        <span class="school-name">嘉应学院</span>
      </div>
      <div class="search-container">
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            placeholder="请输入搜索关键词..."
            class="search-input"
            prefix-icon="Search"
            @keyup.enter="handleSearch"
          ></el-input>
          <el-button type="primary" class="search-button" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
        </div>
      </div>
      <div class="user-container">
        <span class="greeting">您好</span>
        <el-button type="primary" class="logout-btn" @click="logout">退出登录</el-button>
      </div>
    </div>
    <div class="content-wrapper">
      <div class="left-menu" :style="{ width: leftMenuWidth }">
        <el-menu
          default-active="1"
          class="el-menu-vertical"
          @select="handleMenuSelect"
        >
          <!-- 学习模块 -->
          <el-sub-menu index="learning">
            <template #title>
              <el-icon><Notebook /></el-icon>
              <span>学习</span>
            </template>
            <el-menu-item index="learning-resources">学习设施预约</el-menu-item>
          </el-sub-menu>

          <!-- 生活模块 -->
          <el-sub-menu index="life">
            <template #title>
              <el-icon><House /></el-icon>
              <span>生活</span>
            </template>
            <el-menu-item index="sunlight-analysis">日照分析</el-menu-item>
            <el-menu-item index="visibility-analysis">通视分析</el-menu-item>
          </el-sub-menu>

          <!-- 娱乐模块 -->
          <el-sub-menu index="entertainment">
            <template #title>
              <el-icon><Basketball /></el-icon>
              <span>娱乐</span>
            </template>
            <el-menu-item index="sports-facilities">体育设施预约</el-menu-item>
          </el-sub-menu>

          <!-- 安全模块 -->
          <el-sub-menu index="safety">
            <template #title>
              <el-icon><Warning /></el-icon>
              <span>安全</span>
            </template>
            <el-menu-item index="fire-safety">火灾预警</el-menu-item>
            <el-menu-item index="flood-safety">淹没分析</el-menu-item>
          </el-sub-menu>

          <!-- 上报模块 -->
          <el-sub-menu index="report">
            <template #title>
              <el-icon><DocumentAdd /></el-icon>
              <span>上报</span>
            </template>
            <el-menu-item index="application">申请上报</el-menu-item>
          </el-sub-menu>
          
          <!-- 导航模块 -->
          <el-sub-menu index="navigation">
            <template #title>
              <el-icon><ArrowRight /></el-icon>
              <span>导航</span>
            </template>
            <el-menu-item index="map-navigation">地图导航</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>

      <!-- 左侧拖拽分隔条 -->
      <div class="resizer resizer-left" @mousedown="startResize('left')"></div>

      <div class="middle-map" :style="{ width: middleWidth }">
        <CesiumMap ref="cesiumMapRef" />
        <div class="map-buttons">
          <!-- <component :is="currentComponent" /> -->
        </div>
      </div>

      <!-- 右侧拖拽分隔条 -->
      <div class="resizer resizer-right" @mousedown="startResize('right')"></div>

      <!-- 优化后的可折叠右侧面板 -->
      <div class="right-panel" :class="{ 'is-collapsed': isCollapsed }" :style="{ width: rightPanelWidth }">
        <el-button 
          class="toggle-button"
          @click="() => { isCollapsed = !isCollapsed; resetPanelWidths(); }"
          circle
        >
          {{ isCollapsed ? '<' : '>' }}
        </el-button>
        <div class="panel-content">
          <component :is="currentComponent" ref="securityRef" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import CesiumMap from '../components/CesiumMap.vue'
import { ref, computed, provide, onMounted, nextTick, watch } from 'vue'
import { Search, ArrowLeft, ArrowRight, Notebook, House, Basketball, Warning, DocumentAdd } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

// 退出登录方法
const logout = () => {
  router.push('/login')
}
import Learning from '../components/student/Learning.vue'
import Entertainment from '../components/student/Entertainment.vue'
import Report from '../components/student/Report.vue'
import Daohang from '../components/student/daohang.vue'

// 安全子组件导入
import VisibilityAnalysis from '../components/student/VisibilityAnalysis.vue'
import SunlightAnalysis from '../components/student/SunlightAnalysis.vue'
import FireSafety from '../components/student/FireSafety.vue'
import FloodSafety from '../components/student/FloodSafety.vue'

// 搜索查询词
const searchQuery = ref('')

// 当前显示的组件 - 初始化为空闲学习资源查询
const currentComponent = ref(Learning)
const cesiumMap = ref(null)
const cesiumMapRef = ref(null)
// 安全组件引用
const securityRef = ref(null)

// 监听当前组件变化，确保地图实例正确传递
watch(() => currentComponent.value, (newComponent) => {
  if (newComponent && cesiumMap.value) {
    nextTick(() => {
      if (securityRef.value && typeof securityRef.value.setCesiumMap === 'function') {
        securityRef.value.setCesiumMap(cesiumMap.value)
      }
    })
  }
})

// 组件挂载后设置CesiumMap实例
onMounted(() => {
  // 等待CesiumMap实例准备就绪
  const checkCesiumMap = setInterval(() => {
    if (cesiumMapRef.value) {
      cesiumMap.value = cesiumMapRef.value
      provide('cesiumMap', cesiumMap)

      // 尝试直接设置到安全组件
      if (securityRef.value && typeof securityRef.value.setCesiumMap === 'function') {
        securityRef.value.setCesiumMap(cesiumMap.value)
      }

      clearInterval(checkCesiumMap)
    }
  }, 200)
  
  // 10秒后仍未设置成功则清除定时器
  setTimeout(() => {
    clearInterval(checkCesiumMap)
  }, 10000)
})

// 中文关键词映射表
const chineseKeywordMap = {
  '学习设施预约': 'learning-resources',
  '日照分析': 'sunlight-analysis',
  '通视分析': 'visibility-analysis',
  '体育设施预约': 'sports-facilities',
  '火灾预警': 'fire-safety',
  '淹没分析': 'flood-safety',
  '申请上报': 'application',
  '地图导航': 'map-navigation'
}

// 组件映射表
const componentMap = {
    // 学习模块
    'learning-resources': Learning,
    
    // 生活模块
    'sunlight-analysis': SunlightAnalysis,
    'visibility-analysis': VisibilityAnalysis,
    
    // 娱乐模块
    'sports-facilities': Entertainment,
    
    // 安全模块
    'fire-safety': FireSafety,
    'flood-safety': FloodSafety,
    
    // 上报模块
    'application': Report,
    
    // 导航模块
    'map-navigation': Daohang,
    
}

// 菜单处理函数
// 搜索处理函数
const handleSearch = () => {
  if (!searchQuery.value.trim()) return

  // 获取搜索关键词
  const searchTerm = searchQuery.value.trim()
  let targetComponent = null

  // 首先检查中文关键词映射表
  if (chineseKeywordMap[searchTerm]) {
    const key = chineseKeywordMap[searchTerm]
    targetComponent = componentMap[key]
  } else {
    // 按照原逻辑搜索
    const lowerSearchTerm = searchTerm.toLowerCase()
    Object.entries(componentMap).forEach(([key, item]) => {
      // 使用键名进行匹配
      if (key.toLowerCase().includes(lowerSearchTerm)) {
        targetComponent = item
      }
    })
  }

  // 如果找到匹配的组件，则切换
  if (targetComponent) {
    currentComponent.value = targetComponent

    // 菜单切换后，确保组件已挂载再设置地图实例
    nextTick(() => {
      if (cesiumMap.value && securityRef.value && typeof securityRef.value.setCesiumMap === 'function') {
        securityRef.value.setCesiumMap(cesiumMap.value)
      }
    })
  } else {
    // 未找到匹配项时的处理
    ElMessage({
      message: '未找到相关功能',
      type: 'warning'
    })
  }
}

const handleMenuSelect = (index) => {
    currentComponent.value = componentMap[index] || null
    // 触发具体功能逻辑
    console.log('激活功能:', index)
    if (index === 'flood-safety' && cesiumMap.value) {
        cesiumMap.value.handleFloodAnalysis()
    }

    // 菜单切换后，确保组件已挂载再设置地图实例
    nextTick(() => {
      if (cesiumMap.value && securityRef.value && typeof securityRef.value.setCesiumMap === 'function') {
        securityRef.value.setCesiumMap(cesiumMap.value)
      }
    })
}

// 新增折叠状态（与Admin保持一致）
const isCollapsed = ref(false)

// 面板宽度控制
const leftMenuWidth = ref('20%')
const rightPanelWidth = ref('20%')

// 默认宽度值
const DEFAULT_LEFT_WIDTH = '20%'
const DEFAULT_RIGHT_WIDTH = '20%'
const middleWidth = computed(() => {
  if (isCollapsed.value) {
    return `calc(100% - ${leftMenuWidth.value} - 10px)`
  } else {
    return `calc(100% - ${leftMenuWidth.value} - ${rightPanelWidth.value} - 20px)`
  }
})

// 拖拽调整大小相关变量
const isResizing = ref(false)
const resizeType = ref('')
const startX = ref(0)
const startLeftWidth = ref(0)
const startRightWidth = ref(0)

// 开始调整大小
const startResize = (type) => {
  isResizing.value = true
  resizeType.value = type
  startX.value = event.clientX
  startLeftWidth.value = parseFloat(leftMenuWidth.value)
  startRightWidth.value = parseFloat(rightPanelWidth.value)
  
  document.addEventListener('mousemove', resize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = type === 'left' ? 'col-resize' : 'col-resize'
  document.body.style.userSelect = 'none'
}

// 调整大小
const resize = (e) => {
  if (!isResizing.value) return
  
  const deltaX = e.clientX - startX.value
  const containerWidth = document.querySelector('.content-wrapper').offsetWidth
  
  if (resizeType.value === 'left') {
    // 调整左侧菜单宽度
    let newLeftWidth = startLeftWidth.value + (deltaX / containerWidth) * 100
    newLeftWidth = Math.max(10, Math.min(40, newLeftWidth)) // 限制在10%-40%之间
    leftMenuWidth.value = `${newLeftWidth}%`
  } else if (resizeType.value === 'right') {
    // 调整右侧面板宽度
    let newRightWidth = startRightWidth.value - (deltaX / containerWidth) * 100
    newRightWidth = Math.max(10, Math.min(40, newRightWidth)) // 限制在10%-40%之间
    rightPanelWidth.value = `${newRightWidth}%`
  }
}

// 停止调整大小
const stopResize = () => {
  isResizing.value = false
  resizeType.value = ''
  document.removeEventListener('mousemove', resize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// 重置面板宽度为默认值
const resetPanelWidths = () => {
  leftMenuWidth.value = DEFAULT_LEFT_WIDTH
  rightPanelWidth.value = DEFAULT_RIGHT_WIDTH
}

// 移除原有的togglePanel方法
</script>

<style scoped>
.left-menu {
    min-width: 10%;
    max-width: 40%;
    padding: 15px;
    background: #e6f7ff; /* 淡蓝色背景 */
    border-radius: 10px;
    margin: 5px 0 10px 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
}

.el-menu-vertical {
    border-right: none;
    background: transparent; /* 透明背景，继承父元素的淡蓝色 */
}

.el-menu-item {
    font-size: 14px;
    color: #1890ff; /* 淡蓝色文字 */
}

.el-menu-item.is-active {
    background-color: #bae7ff !important; /* 激活项的背景色 */
    color: #0050b3 !important; /* 激活项的文字颜色 */
}

.el-sub-menu__title {
    color: #1890ff !important; /* 子菜单标题颜色 */
}

.el-sub-menu__title:hover {
    background-color: #bae7ff !important; /* 子菜单标题悬停背景 */
}

.student-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.content-wrapper {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.left-menu {
    width: 20%;
    padding: 15px;
}

.middle-map {
    width: 60%;
    height: 100%;
    position: relative;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: 10px;
    margin: 5px 10px 10px 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
}

.map-buttons {
    position: absolute;
    top: 10px;
    right: 10px;
}

.right-content {
    width: 20%;
    padding: 15px;
}

.right-panel {
    min-width: 10%;
    max-width: 40%;
    position: relative;
    transition: all 0.3s ease;
    background: #fff;
    border-radius: 10px;
    margin: 5px 10px 10px 0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

/* 拖拽分隔条样式 */
.resizer {
    width: 5px;
    background: #e0e0e0;
    cursor: col-resize;
    transition: background-color 0.2s ease;
    position: relative;
    z-index: 1000;
}

.resizer:hover {
    background: #409EFF;
}

.resizer-left {
    margin: 5px 0 10px 0;
}

.resizer-right {
    margin: 5px 0 10px 0;
}

/* 顶部栏样式 */
.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    height: 60px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    position: relative;
    z-index: 100;
}

.logo-container {
    display: flex;
    align-items: center;
}

.logo {
    width: 40px;
    height: 40px;
    margin-right: 10px;
    border-radius: 50%;
}

.school-name {
    font-size: 18px;
    font-weight: bold;
    color: #333;
}

.search-container {
    flex: 1;
    max-width: 400px;
    margin: 0 20px;
}

.search-container {
    flex: 1;
    max-width: 700px;
    margin: 0 20px;
}

.search-input .el-input__wrapper {
    border-radius: 20px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
}

.search-input .el-input__inner {
    height: 40px;
    font-size: 16px;
    border-radius: 20px !important;
}

.search-button {
    height: 40px;
    font-size: 16px;
}

.search-box {
    display: flex;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
}

.search-input {
    flex: 1;
    border: 1px solid #e4e7ed;
    border-right: none;
    border-radius: 20px 0 0 20px !important;
    transition: all 0.3s ease;
}

.search-button {
    border-radius: 0 20px 20px 0 !important;
    background-color: #409EFF;
    border-color: #409EFF;
    white-space: nowrap;
    padding: 0 20px;
}

.user-container {
    display: flex;
    align-items: center;
}

.greeting {
    margin-right: 15px;
    color: #666;
}

.logout-btn {
    background-color: #409EFF;
    border-color: #409EFF;
}

.panel-content {
    padding: 20px;
    height: 100%;
    overflow-y: auto;
}

.toggle-button {
    position: absolute;
    left: -20px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1000;
    background-color: #409EFF;
    border-color: #409EFF;
    color: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 18px;
    font-weight: bold;
}

.toggle-button:hover {
    background-color: #66b1ff;
    border-color: #66b1ff;
    transform: translateY(-50%) scale(1.1);
}

.right-panel.is-collapsed {
    transform: translateX(100%);
}
</style>