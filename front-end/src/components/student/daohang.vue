<template>
  <div class="navigation-container">
    <div class="transport-mode">
      <button :class="{ active: currentMode === 'car' }" @click="currentMode = 'car'"><i class="icon">🚗</i>驾车</button>
      <button :class="{ active: currentMode === 'walk' }" @click="currentMode = 'walk'"><i class="icon">🚶</i>步行</button>
      <button :class="{ active: currentMode === 'bike' }" @click="currentMode = 'bike'"><i class="icon">🚲</i>骑行</button>
      <button class="close-btn" @click="resetForm"><i class="icon">✕</i></button>
    </div>
    
    <div class="search-bar">
      <div class="location-input">
        <i class="location-icon start">📍</i>
        <div class="input-container">
          <select v-model="startBuilding" class="location-select">
            <option value="">选择起点建筑物</option>
            <option v-for="building in buildings" :key="building.id" :value="building">
              {{ building.name }}
            </option>
          </select>
          <div class="input-divider">或</div>
          <input 
            v-model="startLocationText" 
            type="text" 
            placeholder="输入起点坐标（经度,纬度）"
            class="location-text"
            @blur="parseStartLocation"
          />
        </div>
      </div>
      
      <div class="location-input">
        <i class="location-icon end">🏁</i>
        <div class="input-container">
          <select v-model="endBuilding" class="location-select">
            <option value="">选择终点建筑物</option>
            <option v-for="building in buildings" :key="building.id" :value="building">
              {{ building.name }}
            </option>
          </select>
          <div class="input-divider">或</div>
          <input 
            v-model="endLocationText" 
            type="text" 
            placeholder="输入终点坐标（经度,纬度）"
            class="location-text"
            @blur="parseEndLocation"
          />
        </div>
      </div>
      
      <!-- 路线策略选择 -->
      <div class="strategy-select" v-if="currentMode === 'car'">
        <label>路线策略:</label>
        <select v-model="routeStrategy">
          <option value="0">速度优先</option>
          <option value="2">距离优先</option>
          <option value="3">不走高速</option>
          <option value="4">躲避拥堵</option>
          <option value="5">多策略</option>
          <option value="6">不走高速且躲避拥堵</option>
          <option value="7">不走高速且收费最少</option>
          <option value="8">不走高速且距离最短</option>
          <option value="9">躲避拥堵且收费最少</option>
          <option value="10">躲避拥堵且距离最短</option>
        </select>
      </div>
      
      <div class="action-buttons">
        <button class="search-btn" @click="searchRoute" :disabled="isLoading">
          <i class="icon">🔍</i>
          <span>{{ isLoading ? '规划中...' : '搜索路线' }}</span>
        </button>
        <button class="clear-btn" @click="clearRoute" v-if="routeEntity">
          <i class="icon">🗑️</i>
          <span>清除</span>
        </button>
      </div>
    </div>
    
    <!-- 路线信息 -->
    <div class="route-info" v-if="routeInfo">
      <div class="info-item">
        <span class="label">距离:</span>
        <span class="value">{{ routeInfo.distance }} 公里</span>
      </div>
      <div class="info-item">
        <span class="label">预计时间:</span>
        <span class="value">{{ routeInfo.duration }} 分钟</span>
      </div>
      <div class="info-item" v-if="routeInfo.tolls">
        <span class="label">收费:</span>
        <span class="value">{{ routeInfo.tolls }} 元</span>
      </div>
      <div class="info-item" v-if="routeInfo.trafficLights">
        <span class="label">红绿灯:</span>
        <span class="value">{{ routeInfo.trafficLights }} 个</span>
      </div>
    </div>
    
    <!-- 路线步骤详情 -->
    <div class="route-steps" v-if="routeSteps && routeSteps.length > 0">
      <div class="steps-header">
        <h4>路线指引</h4>
      </div>
      <div class="steps-content">
        <div v-for="(step, index) in routeSteps" :key="index" class="step-item">
          <div class="step-icon">{{ index + 1 }}</div>
          <div class="step-info">
            <div class="step-instruction">{{ step.instruction }}</div>
            <div class="step-details" v-if="step.distance || step.duration">
              <span v-if="step.distance">{{ step.distance }}米</span>
              <span v-if="step.duration"> | {{ step.duration }}分钟</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import * as Cesium from 'cesium';
import * as turf from '@turf/turf';

// 高德地图API配置
const AMAP_KEY = 'e824f66d91152fd1c44a82473c838acb';

// 注入Cesium viewer
const cesiumViewer = inject('cesiumViewer', null);

// 交通方式
const currentMode = ref('walk');
// 路线策略（驾车模式专用）
const routeStrategy = ref('0');
// 建筑物列表
const buildings = ref([]);
// 选择的起点和终点
const startBuilding = ref(null);
const endBuilding = ref(null);
// 文字输入的位置
const startLocationText = ref('');
const endLocationText = ref('');
// 自定义位置
const customStartLocation = ref(null);
const customEndLocation = ref(null);
// 加载状态
const isLoading = ref(false);
// 路线信息
const routeInfo = ref(null);
// 路线步骤
const routeSteps = ref([]);
// 路线实体
const routeEntity = ref(null);
// 起点和终点标记
const startMarker = ref(null);
const endMarker = ref(null);

// 加载建筑物数据
async function loadBuildingsData() {
  try {
    const response = await fetch('/buildings-data.json');
    const data = await response.json();
    buildings.value = data.buildings || [];
    console.log('建筑物数据加载完成:', buildings.value.length, '条记录');
  } catch (error) {
    console.error('加载建筑物数据失败:', error);
    buildings.value = [];
  }
}

// 解析坐标文本
function parseCoordinate(text) {
  if (!text.trim()) return null;
  
  const parts = text.split(',').map(part => part.trim());
  if (parts.length !== 2) {
    alert('请输入正确的坐标格式：经度,纬度');
    return null;
  }
  
  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);
  
  if (isNaN(lng) || isNaN(lat)) {
    alert('坐标格式错误，请输入数字');
    return null;
  }
  
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    alert('坐标范围错误：经度(-180~180)，纬度(-90~90)');
    return null;
  }
  
  return { longitude: lng, latitude: lat, radius: 50 };
}

// 解析起点位置
function parseStartLocation() {
  if (startLocationText.value.trim()) {
    const location = parseCoordinate(startLocationText.value);
    if (location) {
      customStartLocation.value = location;
      startBuilding.value = null;
    }
  }
}

// 解析终点位置
function parseEndLocation() {
  if (endLocationText.value.trim()) {
    const location = parseCoordinate(endLocationText.value);
    if (location) {
      customEndLocation.value = location;
      endBuilding.value = null;
    }
  }
}

// 重置表单
function resetForm() {
  startBuilding.value = null;
  endBuilding.value = null;
  startLocationText.value = '';
  endLocationText.value = '';
  customStartLocation.value = null;
  customEndLocation.value = null;
  currentMode.value = 'walk';
  routeStrategy.value = '0';
  clearRoute();
}

// 清除路线
function clearRoute() {
  if (!cesiumViewer) return;
  
  console.log('清除路线和标记');
  
  // 移除所有路线相关的实体
  const entitiesToRemove = [];
  
  // 查找所有路线相关的实体
  const allEntities = cesiumViewer.entities.values;
  for (let i = 0; i < allEntities.length; i++) {
    const entity = allEntities[i];
    if (entity.name === '导航路线' || entity.name === '导航路线边框' || 
        entity.name === '起点' || entity.name === '终点') {
      entitiesToRemove.push(entity);
    }
  }
  
  // 批量移除
  entitiesToRemove.forEach(entity => {
    cesiumViewer.entities.remove(entity);
  });
  
  // 重置引用
  routeEntity.value = null;
  startMarker.value = null;
  endMarker.value = null;
  
  routeInfo.value = null;
  routeSteps.value = [];
  
  console.log('路线清除完成');
}



// 获取起点位置
function getStartLocation() {
  if (customStartLocation.value) {
    return customStartLocation.value;
  }
  if (startBuilding.value) {
    return startBuilding.value.location;
  }
  return null;
}

// 获取终点位置
function getEndLocation() {
  if (customEndLocation.value) {
    return customEndLocation.value;
  }
  if (endBuilding.value) {
    return endBuilding.value.location;
  }
  return null;
}

// 获取起点名称
function getStartName() {
  if (customStartLocation.value) {
    return `自定义起点 (${customStartLocation.value.longitude}, ${customStartLocation.value.latitude})`;
  }
  if (startBuilding.value) {
    return startBuilding.value.name;
  }
  return '起点';
}

// 获取终点名称
function getEndName() {
  if (customEndLocation.value) {
    return `自定义终点 (${customEndLocation.value.longitude}, ${customEndLocation.value.latitude})`;
  }
  if (endBuilding.value) {
    return endBuilding.value.name;
  }
  return '终点';
}

// 搜索路线
async function searchRoute() {
  const start = getStartLocation();
  const end = getEndLocation();
  
  if (!start || !end) {
    alert('请选择或输入起点和终点');
    return;
  }
  
  if (start.longitude === end.longitude && start.latitude === end.latitude) {
    alert('起点和终点不能相同');
    return;
  }
  
  isLoading.value = true;
  
  try {
    
    // 调用高德地图新版路径规划API
    const routeData = await fetchRouteFromAMap(start, end, currentMode.value);
    
    console.log('API返回数据:', routeData);
    
    if (routeData && routeData.route && routeData.route.paths && routeData.route.paths.length > 0) {
      const path = routeData.route.paths[0];
      console.log('路径数据:', path);
      
      // 检查路径数据中的字段
      console.log('路径字段:', Object.keys(path));
      
      // 解析路线坐标 - 高德API v5可能使用不同的数据结构
      let routeCoordinates = [];
      
      // 1. 首先添加起点坐标
      routeCoordinates.push([start.longitude, start.latitude]);
      console.log('添加起点坐标:', [start.longitude, start.latitude]);
      
      // 2. 尝试从不同的字段获取路径坐标
      let pathPoints = [];
      if (path.steps && path.steps.length > 0) {
        pathPoints = parseRouteSteps(path.steps);
      } else if (path.tmcs) {
        pathPoints = parsePolyline(path.tmcs);
      } else if (path.polyline) {
        pathPoints = parsePolyline(path.polyline);
      }
      
      // 3. 添加路径中的坐标点（跳过第一个点，因为它通常是起点）
      if (pathPoints.length > 0) {
        // 如果路径第一个点与起点非常接近，则跳过
        const firstPoint = pathPoints[0];
        const startPoint = [start.longitude, start.latitude];
        const distanceToStart = Math.sqrt(
          Math.pow(firstPoint[0] - startPoint[0], 2) + 
          Math.pow(firstPoint[1] - startPoint[1], 2)
        );
        
        if (distanceToStart > 0.0001) { // 约10米
          routeCoordinates.push(...pathPoints);
        } else {
          routeCoordinates.push(...pathPoints.slice(1));
        }
      }
      
      // 4. 最后添加终点坐标
      const lastPoint = routeCoordinates[routeCoordinates.length - 1];
      const endPoint = [end.longitude, end.latitude];
      const distanceToEnd = Math.sqrt(
        Math.pow(lastPoint[0] - endPoint[0], 2) + 
        Math.pow(lastPoint[1] - endPoint[1], 2)
      );
      
      // 如果最后一个点与终点不重合，则添加终点
      if (distanceToEnd > 0.0001) { // 约10米
        routeCoordinates.push(endPoint);
        console.log('添加终点坐标:', endPoint);
      }
      
      console.log('完整路线坐标数量:', routeCoordinates.length);
      console.log('路线坐标:', routeCoordinates);
      
      // 使用Turf.js处理路线数据
      const processedRoute = processRouteWithTurf(routeCoordinates);
      
      // 在Cesium上绘制路线
      drawRouteOnCesium(processedRoute);
      
      // 添加起点和终点标记
      addStartEndMarkers(start, end, getStartName(), getEndName());
      
      // 调整视角
      fitViewToRoute(processedRoute);
      
      // 更新路线信息
      routeInfo.value = {
        distance: (path.distance / 1000).toFixed(2),
        duration: Math.ceil(path.duration / 60),
        tolls: path.tolls || 0,
        trafficLights: path.traffic_lights || 0
      };
      
      // 更新路线步骤
      routeSteps.value = path.steps.map(step => ({
        instruction: step.instruction,
        distance: step.distance,
        duration: Math.ceil(step.duration / 60)
      }));
      
      console.log('路线规划成功:', routeInfo.value);
    } else {
      alert('未找到可用路线，请尝试其他起点或终点');
    }
  } catch (error) {
    console.error('路线规划失败:', error);
    alert('路线规划失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
}

// 调用高德地图新版路径规划API
async function fetchRouteFromAMap(start, end, mode) {
  // 交通方式映射
  const modeMap = {
    'car': 'driving',
    'walk': 'walking',
    'bike': 'bicycling'
  };
  
  const amapMode = modeMap[mode] || 'walking';
  
  // 构建基础参数
  const baseParams = {
    key: AMAP_KEY,
    origin: `${start.longitude},${start.latitude}`,
    destination: `${end.longitude},${end.latitude}`,
    output: 'JSON'
  };
  
  // 添加特定模式的参数
  // 使用extensions=all获取详细的坐标数据（polyline）
  if (amapMode === 'driving') {
    baseParams.strategy = routeStrategy.value;
    baseParams.extensions = 'all'; // 获取详细信息和坐标
  } else if (amapMode === 'walking') {
    baseParams.extensions = 'all'; // 步行也需要all才能获取polyline
  } else if (amapMode === 'bicycling') {
    baseParams.extensions = 'all'; // 骑行也需要all才能获取polyline
  }
  
  // 构建请求URL
  const queryString = Object.keys(baseParams)
    .map(key => `${key}=${encodeURIComponent(baseParams[key])}`)
    .join('&');
  
  const url = `https://restapi.amap.com/v5/direction/${amapMode}?${queryString}`;
  
  console.log('API请求URL:', url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && data.route) {
      console.log('高德API返回数据:', JSON.stringify(data, null, 2));
      return data;
    } else {
      console.error('高德API返回错误:', data.info, data.infocode);
      // 如果API调用失败，使用模拟数据
      return generateMockRoute(start, end);
    }
  } catch (error) {
    console.error('调用高德API失败:', error);
    // 使用模拟数据
    return generateMockRoute(start, end);
  }
}

// 生成模拟路线数据（当API不可用时使用）
function generateMockRoute(start, end) {
  console.log('使用模拟路线数据');
  
  // 计算直线距离
  const from = turf.point([start.longitude, start.latitude]);
  const to = turf.point([end.longitude, end.latitude]);
  const distance = turf.distance(from, to, { units: 'kilometers' });
  
  // 生成中间点（模拟路线）
  const steps = [];
  const numPoints = 5;
  
  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    const lng = start.longitude + (end.longitude - start.longitude) * ratio;
    const lat = start.latitude + (end.latitude - start.latitude) * ratio;
    
    // 添加一些随机偏移使路线更自然
    const offset = (Math.random() - 0.5) * 0.001;
    
    steps.push({
      instruction: i === 0 ? '从起点出发' : i === numPoints ? '到达目的地' : `沿道路行驶`,
      distance: Math.round(distance * 1000 / numPoints),
      duration: Math.round(distance * 10 * 60 / numPoints),
      polyline: `${lng + offset},${lat + offset}`
    });
  }
  
  return {
    route: {
      paths: [{
        distance: distance * 1000, // 转换为米
        duration: distance * 10 * 60, // 假设速度为6km/h
        tolls: 0,
        traffic_lights: 0,
        steps: steps
      }]
    }
  };
}

// 解析polyline字符串为坐标数组
function parsePolyline(polyline) {
  if (!polyline) return [];
  
  const coordinates = [];
  const points = polyline.split(';');
  
  points.forEach(point => {
    const [lng, lat] = point.split(',').map(Number);
    if (!isNaN(lng) && !isNaN(lat)) {
      coordinates.push([lng, lat]);
    }
  });
  
  return coordinates;
}

// 解析路线步骤中的坐标
function parseRouteSteps(steps) {
  const coordinates = [];
  
  console.log('解析路线步骤，步骤数量:', steps ? steps.length : 0);
  
  if (!steps || steps.length === 0) {
    console.warn('没有步骤数据');
    return coordinates;
  }
  
  steps.forEach((step, index) => {
    // 高德API v5版本可能使用不同的字段名
    // 尝试多种可能的字段名
    const polyline = step.polyline || step.tmcs || step.tmclines;
    
    if (polyline) {
      // 高德API返回的polyline格式: "lng,lat;lng,lat;..."
      const points = polyline.split(';');
      console.log(`步骤${index}: 坐标点数量 ${points.length}`);
      
      points.forEach(point => {
        const [lng, lat] = point.split(',').map(Number);
        if (!isNaN(lng) && !isNaN(lat)) {
          coordinates.push([lng, lat]);
        } else {
          console.warn('无效的坐标点:', point);
        }
      });
    } else {
      console.warn(`步骤${index} 没有polyline数据，可用字段:`, Object.keys(step));
    }
  });
  
  console.log('解析完成，总坐标点数量:', coordinates.length);
  
  // 去重：移除相邻的重复点
  const uniqueCoordinates = [];
  for (let i = 0; i < coordinates.length; i++) {
    if (i === 0 || 
        coordinates[i][0] !== coordinates[i-1][0] || 
        coordinates[i][1] !== coordinates[i-1][1]) {
      uniqueCoordinates.push(coordinates[i]);
    }
  }
  
  console.log('去重后坐标点数量:', uniqueCoordinates.length);
  
  return uniqueCoordinates;
}

// 使用Turf.js处理路线数据
function processRouteWithTurf(coordinates) {
  if (coordinates.length < 2) {
    console.warn('坐标点数量不足，无法处理路线');
    return coordinates;
  }
  
  console.log('原始坐标点数量:', coordinates.length);
  
  try {
    // 创建LineString
    const line = turf.lineString(coordinates);
    
    // 使用Turf.js简化路线（减少点的数量）
    // 增加容差值以减少简化程度，确保路线可见
    const simplified = turf.simplify(line, { tolerance: 0.0001, highQuality: false });
    
    // 计算路线总长度
    const length = turf.length(simplified, { units: 'kilometers' });
    console.log('路线总长度:', length.toFixed(2), 'km');
    console.log('简化后坐标点数量:', simplified.geometry.coordinates.length);
    
    // 获取简化后的坐标
    return simplified.geometry.coordinates;
  } catch (error) {
    console.error('Turf.js处理路线数据失败:', error);
    console.log('使用原始坐标数据');
    return coordinates;
  }
}

// 在Cesium上绘制路线
function drawRouteOnCesium(coordinates) {
  if (!cesiumViewer || coordinates.length < 2) {
    console.warn('无法绘制路线：viewer不存在或坐标点不足');
    return;
  }
  
  console.log('开始绘制路线，坐标点数量:', coordinates.length);
  
  // 清除之前的路线
  if (routeEntity.value) {
    cesiumViewer.entities.remove(routeEntity.value);
    routeEntity.value = null;
  }
  
  // 将坐标转换为Cesium的Cartesian3数组，添加高度确保路线可见
  const positions = coordinates.map(coord => {
    // 添加10米高度，确保路线在地面上方
    return Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 10);
  });
  
  console.log('坐标转换完成，位置数量:', positions.length);
  
  // 根据交通方式选择颜色
  const colorMap = {
    'car': Cesium.Color.fromCssColorString('#409EFF'),    // 蓝色
    'walk': Cesium.Color.fromCssColorString('#67C23A'),   // 绿色
    'bike': Cesium.Color.fromCssColorString('#E6A23C')    // 橙色
  };
  
  const routeColor = colorMap[currentMode.value] || Cesium.Color.YELLOW;
  
  // 创建路线实体 - 使用更明显的样式
  routeEntity.value = cesiumViewer.entities.add({
    name: '导航路线',
    polyline: {
      positions: positions,
      width: 12,  // 增加线宽
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.3,
        color: routeColor
      }),
      clampToGround: false,  // 不贴地，使用绝对高度
      classificationType: Cesium.ClassificationType.BOTH  // 在地形和3D模型上都显示
    }
  });
  
  // 添加第二条细线作为边框，使路线更清晰
  cesiumViewer.entities.add({
    name: '导航路线边框',
    polyline: {
      positions: positions,
      width: 4,
      material: Cesium.Color.WHITE,
      clampToGround: false,
      classificationType: Cesium.ClassificationType.BOTH
    }
  });
  
  console.log('路线已成功绘制到Cesium地图');
}

// 添加起点和终点标记
function addStartEndMarkers(start, end, startName, endName) {
  if (!cesiumViewer) return;
  
  // 清除之前的标记
  if (startMarker.value) {
    cesiumViewer.entities.remove(startMarker.value);
  }
  if (endMarker.value) {
    cesiumViewer.entities.remove(endMarker.value);
  }
  
  // 添加起点标记
  startMarker.value = cesiumViewer.entities.add({
    name: '起点',
    position: Cesium.Cartesian3.fromDegrees(start.longitude, start.latitude, 50),
    billboard: {
      image: createMarkerCanvas('起', '#409EFF'),
      scale: 0.5,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
    },
    label: {
      text: startName,
      font: '14px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      pixelOffset: new Cesium.Cartesian2(0, -40),
      heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
    }
  });
  
  // 添加终点标记
  endMarker.value = cesiumViewer.entities.add({
    name: '终点',
    position: Cesium.Cartesian3.fromDegrees(end.longitude, end.latitude, 50),
    billboard: {
      image: createMarkerCanvas('终', '#67C23A'),
      scale: 0.5,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
    },
    label: {
      text: endName,
      font: '14px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      pixelOffset: new Cesium.Cartesian2(0, -40),
      heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
    }
  });
}

// 创建标记Canvas
function createMarkerCanvas(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  // 绘制圆形背景
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // 绘制文字
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 32, 32);
  
  // 绘制指针
  ctx.beginPath();
  ctx.moveTo(32, 60);
  ctx.lineTo(22, 45);
  ctx.lineTo(42, 45);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  
  return canvas.toDataURL();
}

// 调整视角以适应路线
function fitViewToRoute(coordinates) {
  if (!cesiumViewer || coordinates.length < 2) {
    console.warn('无法调整视角：viewer不存在或坐标点不足');
    return;
  }
  
  console.log('调整视角以适应路线');
  
  // 计算路线的包围盒
  const lons = coordinates.map(c => c[0]);
  const lats = coordinates.map(c => c[1]);
  
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  
  console.log('路线范围:', { minLon, maxLon, minLat, maxLat });
  
  // 添加一些边距
  const padding = 0.001; // 约100米的边距
  const rectangle = Cesium.Rectangle.fromDegrees(
    minLon - padding, 
    minLat - padding, 
    maxLon + padding, 
    maxLat + padding
  );
  
  // 调整相机视角
  cesiumViewer.camera.flyTo({
    destination: rectangle,
    duration: 1.5,
    orientation: {
      heading: 0,
      pitch: -Math.PI / 3,  // 60度俯角
      roll: 0
    }
  });
  
  console.log('视角调整完成');
}

// 组件挂载时加载数据
onMounted(() => {
  loadBuildingsData();
});
</script>

<style scoped>
.navigation-container {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  max-width: 380px;
  max-height: 80vh;
  overflow-y: auto;
}

.transport-mode {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.transport-mode button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.transport-mode button.active {
  background: #409EFF;
  color: white;
  border-color: #409EFF;
}

.transport-mode button:hover:not(.active) {
  border-color: #409EFF;
  color: #409EFF;
}

.close-btn {
  margin-left: auto;
  padding: 8px !important;
  border-radius: 50% !important;
}

.search-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.location-input {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.location-icon {
  font-size: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-top: 6px;
}

.location-icon.start {
  background: #409EFF;
}

.location-icon.end {
  background: #67C23A;
}

.input-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.location-select {
  width: 100%;
  border: 1px solid #ddd;
  background: white;
  outline: none;
  font-size: 14px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.input-divider {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin: 4px 0;
}

.location-text {
  width: 100%;
  border: 1px solid #ddd;
  background: white;
  outline: none;
  font-size: 14px;
  padding: 6px 8px;
  border-radius: 4px;
}

.location-text:focus {
  border-color: #409EFF;
}

.strategy-select {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.strategy-select label {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.strategy-select select {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.search-btn, .clear-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.search-btn {
  background: #409EFF;
  color: white;
}

.search-btn:hover:not(:disabled) {
  background: #66b1ff;
}

.search-btn:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

.clear-btn {
  background: #f56c6c;
  color: white;
}

.clear-btn:hover {
  background: #f78989;
}

.route-info {
  margin-top: 15px;
  padding: 15px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #409EFF;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
  font-size: 14px;
}

.value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.route-steps {
  margin-top: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.steps-header {
  background: #f5f5f5;
  padding: 10px 15px;
  border-bottom: 1px solid #e0e0e0;
}

.steps-header h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.steps-content {
  max-height: 200px;
  overflow-y: auto;
}

.step-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
}

.step-item:last-child {
  border-bottom: none;
}

.step-icon {
  width: 24px;
  height: 24px;
  background: #409EFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-right: 10px;
  flex-shrink: 0;
}

.step-info {
  flex: 1;
}

.step-instruction {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.step-details {
  font-size: 12px;
  color: #666;
}

.step-details span {
  margin-right: 8px;
}
</style>