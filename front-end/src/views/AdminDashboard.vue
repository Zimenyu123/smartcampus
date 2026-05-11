<template>
    <div class="admin-page">
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
                <el-menu default-active="1" class="el-menu-vertical" @select="handleMenuSelect">
                    <!-- 校园设施管理 -->
                    <el-sub-menu index="facility-management">
                        <template #title>
                            <el-icon><OfficeBuilding /></el-icon>
                            <span>校园设施管理</span>
                        </template>
                        <el-menu-item index="facility-study">学习设施</el-menu-item>
                    </el-sub-menu>

                    <!-- 安防系统优化 -->
                    <el-sub-menu index="security-optimization">
                        <template #title>
                            <el-icon><Monitor /></el-icon>
                            <span>安防系统优化</span>
                        </template>
                        <el-menu-item index="security-fire">火灾预警</el-menu-item>
                        <el-menu-item index="security-flood">淹没预警</el-menu-item>
                    </el-sub-menu>

                    <!-- 报修处理 -->
                    <el-sub-menu index="maintenance-management">
                        <template #title>
                            <el-icon><Tools /></el-icon>
                            <span>报修处理</span>
                        </template>
                        <el-menu-item index="maintenance-list">报修状态处理</el-menu-item>
                    </el-sub-menu>
                </el-menu>
            </div>

            <!-- 左侧拖拽分隔条 -->
            <div class="resizer resizer-left" @mousedown="startResize('left')"></div>

            <div class="middle-map" :style="{ width: middleWidth }">
                <CesiumMap ref="cesiumMap" />
            </div>

            <!-- 右侧拖拽分隔条 -->
            <div class="resizer resizer-right" @mousedown="startResize('right')"></div>

            <!-- 新增可折叠右侧面板 -->
            <div class="right-panel" :class="{ 'is-collapsed': isCollapsed }" :style="{ width: rightPanelWidth }">
                <el-button 
                    class="toggle-button"
                    @click="() => { isCollapsed = !isCollapsed; resetPanelWidths(); }"
                    circle
                >
                    {{ isCollapsed ? '<' : '>' }}
                </el-button>
                <div class="panel-content">
                    <component 
                        :is="currentComponent"
                        :facility-type="currentFacilityType"
                        :type="currentFacilityType"
                        ref="securityRef"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import CesiumMap from '../components/CesiumMap.vue'
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

// 退出登录方法
const logout = () => {
  router.push('/login')
}
import FacilityManagement from '../components/admin/FacilityManagement.vue'
import SecurityOptimization from '../components/admin/SecurityOptimization.vue'
import MaintenanceManagement from '../components/admin/MaintenanceManagement.vue'

// 搜索查询词
const searchQuery = ref('')

// 控制当前显示的组件
const currentComponent = ref(FacilityManagement)
// 安全组件引用
const securityRef = ref(null)
// CesiumMap引用
const cesiumMap = ref(null)
// 控制当前设施类型
const currentFacilityType = ref('study')
// 当前选中的预警类型
const currentWarningType = ref(null)

// 新增折叠状态
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

// 新增图标导入
import {
    OfficeBuilding,
    Monitor,
    Tools,
    ArrowLeft,
    ArrowRight
} from '@element-plus/icons-vue'

// 中文关键词映射表
const chineseKeywordMap = {
  '学习设施': 'facility-study',
  '火灾预警': 'security-fire',
  '淹没预警': 'security-flood',
  '报修状态处理': 'maintenance-list'
}

// 新增组件映射
const componentMap = {
    // 设施管理
    'facility-study': { component: FacilityManagement, type: 'study' },
    
    // 安防优化
    'security-fire': { 
        component: SecurityOptimization,
        warningType: 'fire'
    },
    'security-flood': { 
        component: SecurityOptimization,
        warningType: 'flood'
    },
    // 报修处理
    'maintenance-list': { component: MaintenanceManagement, type: 'list' }
}

// 搜索处理函数
const handleSearch = () => {
  if (!searchQuery.value.trim()) return

  // 获取搜索关键词
  const searchTerm = searchQuery.value.trim()
  let targetComponent = null
  let targetType = ''
  let targetWarningType = ''

  // 首先检查中文关键词映射表
  if (chineseKeywordMap[searchTerm]) {
    const key = chineseKeywordMap[searchTerm]
    const item = componentMap[key]
    if (item) {
      targetComponent = item.component
      targetType = item.type || ''
      targetWarningType = item.warningType || ''
    }
  } else {
    // 按照原逻辑搜索
    const lowerSearchTerm = searchTerm.toLowerCase()
    Object.entries(componentMap).forEach(([key, item]) => {
      if (key.toLowerCase().includes(lowerSearchTerm) ||
          item.type?.toLowerCase().includes(lowerSearchTerm) ||
          item.warningType?.toLowerCase().includes(lowerSearchTerm)) {
        targetComponent = item.component
        targetType = item.type || ''
        targetWarningType = item.warningType || ''
      }
    })
  }

  // 如果找到匹配的组件，则切换
  if (targetComponent) {
    currentComponent.value = targetComponent
    if (targetWarningType) {
      currentWarningType.value = targetWarningType
    } else {
      currentFacilityType.value = targetType
    }
  } else {
    // 未找到匹配项时的处理
    ElMessage({
      message: '未找到相关功能',
      type: 'warning'
    })
  }
}

const handleMenuSelect = (index) => {
    const item = componentMap[index] || { component: null }
    currentComponent.value = item.component
    
    if (item.component === SecurityOptimization) {
        currentWarningType.value = item.warningType;
    } else {
        currentFacilityType.value = item.type || '';
    }
}

// 监听预警类型变化并设置
watch(() => currentWarningType.value, (newType) => {
    if (newType) {
        // 使用nextTick确保组件已挂载
        nextTick(() => {
            if (securityRef.value && typeof securityRef.value.setWarningType === 'function') {
                securityRef.value.setWarningType(newType);
                // 同时设置地图实例
                if (cesiumMap.value && typeof securityRef.value.setCesiumMap === 'function') {
                    securityRef.value.setCesiumMap(cesiumMap.value);
                }
            } else {
                console.error('无法调用setWarningType方法，securityRef.value:', securityRef.value);
            }
        });
    }
})

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
    if (cesiumMap.value && securityRef.value && typeof securityRef.value.setCesiumMap === 'function') {
      securityRef.value.setCesiumMap(cesiumMap.value)
      clearInterval(checkCesiumMap)
    }
  }, 200)
  
  //// 10秒后仍未设置成功则清除定时器
    setTimeout(() => {
      clearInterval(checkCesiumMap)
    }, 10000)
  })

// 移除原有的goToPage函数
</script>

<style scoped>
.admin-page {
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