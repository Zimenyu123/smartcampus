<!-- CesiumMap.vue -->
<style src="./CesiumMap.css"></style>
<script setup>
import { onMounted, onUnmounted, ref, provide } from 'vue'
import * as Cesium from 'cesium'
import FloodAnalysis from './FloodAnalysis.vue'
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiOWM5MWQ4Yi1kY2M0LTRiODctOTc0MS01OTY2ZDkxY2IxNTYiLCJpZCI6Mjg2Mjg5LCJpYXQiOjE3NDI1MzQ0NzN9.eg4zxoPJK6GKtg2aLY9izSBy1jHpbD8fHU7PTOptyo4'

let viewer = null
const tileset = ref(null)

const floodAnalysisVisible = ref(false)
const floodPolygonCoordinates = ref([])
let positions = []
let markers = []
const isInitialized = ref(false)
const tilesetVisible = ref(true)
// CesiumMap引用
const cesiumMap = ref(null)
// 建筑物信息弹窗
const selectedBuilding = ref(null)
const buildingInfoVisible = ref(false)

// GeoJSON图层实例
let geoJsonLayer = null

class GeoJSONLayer {
  constructor(viewer) {
    this.viewer = viewer
    this.dataSource = null
    this.entities = []
    this.loadedFeatures = []
    this.elevationCache = new Map()
    this.terrainHeightCache = new Map()
    this.minElevation = Infinity
    this.maxElevation = -Infinity
    this.loading = false
    this.loaded = false
    this.error = null
  }

  // 查询地形高度
  async getTerrainHeight(lon, lat) {
    const key = `${lon.toFixed(8)},${lat.toFixed(8)}`
    
    // 检查缓存
    if (this.terrainHeightCache.has(key)) {
      return this.terrainHeightCache.get(key)
    }
    
    // 创建Cartographic对象
    const position = Cesium.Cartographic.fromDegrees(lon, lat)
    
    try {
      // 从地形提供者获取高度
      const terrainProvider = this.viewer.terrainProvider
      const positions = [position]
      const updatedPositions = await Cesium.sampleTerrainMostDetailed(terrainProvider, positions)
      
      const height = updatedPositions[0].height || 0
      
      // 缓存结果
      this.terrainHeightCache.set(key, height)
      
      return height
    } catch (error) {
      console.warn('获取地形高度失败:', error)
      return 0
    }
  }

  // 批量查询地形高度
  async getTerrainHeights(coordinates) {
    const positions = coordinates.map(coord => 
      Cesium.Cartographic.fromDegrees(coord[0], coord[1])
    )
    
    try {
      const terrainProvider = this.viewer.terrainProvider
      const updatedPositions = await Cesium.sampleTerrainMostDetailed(terrainProvider, positions)
      
      const heights = updatedPositions.map(pos => pos.height || 0)
      
      // 缓存结果
      coordinates.forEach((coord, index) => {
        const key = `${coord[0].toFixed(8)},${coord[1].toFixed(8)}`
        this.terrainHeightCache.set(key, heights[index])
      })
      
      return heights
    } catch (error) {
      console.warn('批量获取地形高度失败:', error)
      return coordinates.map(() => 0)
    }
  }

  async loadGeoJSON(url) {
    this.loading = true
    this.error = null
    this.loadedFeatures = []
    this.elevationCache.clear()
    this.terrainHeightCache.clear()
    this.minElevation = Infinity
    this.maxElevation = -Infinity

    try {
      console.log('开始加载GeoJSON数据:', url)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const geojsonData = await response.json()
      console.log('GeoJSON数据加载成功，要素数量:', geojsonData.features?.length || 0)
      
      await this.processGeoJSON(geojsonData)
      console.log('GeoJSON图层加载完成')
      
      this.loaded = true
      this.loading = false
      return true
    } catch (error) {
      console.error('加载GeoJSON数据失败:', error)
      this.error = error.message
      this.loading = false
      return false
    }
  }

  async processGeoJSON(geojsonData) {
    if (!geojsonData || !geojsonData.features) {
      throw new Error('无效的GeoJSON数据')
    }

    this.dataSource = new Cesium.CustomDataSource('GeoJSONLayer')
    
    for (let i = 0; i < geojsonData.features.length; i++) {
      const feature = geojsonData.features[i]
      try {
        await this.processFeature(feature, i)
      } catch (error) {
        console.warn(`处理要素 ${i} 失败:`, error)
      }
    }

    await this.viewer.dataSources.add(this.dataSource)
    console.log('GeoJSON数据源已添加到场景')
  }

  async processFeature(feature, index) {
    if (!feature.geometry || !feature.geometry.type) {
      console.warn(`要素 ${index} 缺少几何数据`)
      return
    }

    const elevation = this.extractElevation(feature.properties)
    const featureId = `geojson_feature_${index}_${Date.now()}`
    
    this.elevationCache.set(featureId, elevation)
    
    if (elevation < this.minElevation) this.minElevation = elevation
    if (elevation > this.maxElevation) this.maxElevation = elevation

    // 获取几何坐标和地形高度
    const { coordinates, avgTerrainHeight } = await this.convertCoordinatesWithTerrain(feature.geometry)
    
    if (!coordinates || coordinates.length < 3) {
      console.warn(`要素 ${index} 坐标转换失败或点数不足`)
      return
    }

    const entity = this.createPolygonEntity(coordinates, elevation, avgTerrainHeight, feature.properties, featureId)
    this.entities.push(entity)
    this.loadedFeatures.push({
      id: featureId,
      properties: feature.properties,
      elevation: elevation,
      terrainHeight: avgTerrainHeight,
      entity: entity
    })
  }

  // 转换坐标并查询地形高度
  async convertCoordinatesWithTerrain(geometry) {
    if (!geometry || !geometry.coordinates) {
      return { coordinates: null, avgTerrainHeight: 0 }
    }

    let rawCoords = []
    
    switch (geometry.type) {
      case 'Polygon':
        rawCoords = geometry.coordinates[0]
        break
      case 'MultiPolygon':
        // 只取第一个多边形的外圈
        if (geometry.coordinates.length > 0) {
          rawCoords = geometry.coordinates[0][0]
        }
        break
      default:
        console.warn(`不支持的几何类型: ${geometry.type}`)
        return { coordinates: null, avgTerrainHeight: 0 }
    }

    if (rawCoords.length < 3) {
      return { coordinates: null, avgTerrainHeight: 0 }
    }

    // 查询地形高度
    const terrainHeights = await this.getTerrainHeights(rawCoords)
    const avgTerrainHeight = terrainHeights.reduce((a, b) => a + b, 0) / terrainHeights.length

    // 转换为Cartesian3坐标（使用平均地形高度作为基准）
    const positions = []
    for (let i = 0; i < rawCoords.length; i++) {
      const coord = rawCoords[i]
      if (coord.length >= 2) {
        const cartesian = Cesium.Cartesian3.fromDegrees(coord[0], coord[1], avgTerrainHeight)
        positions.push(cartesian)
      }
    }

    return { coordinates: positions, avgTerrainHeight: avgTerrainHeight }
  }

  extractElevation(properties) {
    if (!properties) {
      console.warn('要素缺少属性数据，使用默认高程值')
      return 10
    }

    const elevationValue = properties['高程'] || properties['elevation'] || properties['height']
    
    if (elevationValue === undefined || elevationValue === null) {
      console.warn('要素缺少"高程"属性，使用默认高程值')
      return 10
    }

    const numValue = parseFloat(elevationValue)
    if (isNaN(numValue)) {
      console.warn(`无效的高程值: ${elevationValue}，使用默认高程值`)
      return 10
    }

    return Math.max(numValue, 0)
  }

  convertCoordinates(geometry) {
    if (!geometry || !geometry.coordinates) {
      return null
    }

    const positions = []
    
    switch (geometry.type) {
      case 'Polygon':
        const outerRing = geometry.coordinates[0]
        for (const coord of outerRing) {
          if (coord.length >= 2) {
            const cartesian = Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 0)
            positions.push(cartesian)
          }
        }
        break
        
      case 'MultiPolygon':
        for (const polygon of geometry.coordinates) {
          const outerRing = polygon[0]
          for (const coord of outerRing) {
            if (coord.length >= 2) {
              const cartesian = Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 0)
              positions.push(cartesian)
            }
          }
        }
        break
        
      default:
        console.warn(`不支持的几何类型: ${geometry.type}`)
        return null
    }

    return positions
  }

  createPolygonEntity(positions, elevation, avgTerrainHeight, properties, featureId) {
    // 计算底部高度（地形高度）和顶部高度（地形高度 + 拉伸高度）
    const bottomHeight = avgTerrainHeight
    const topHeight = avgTerrainHeight + elevation
    
    console.log(`创建实体:`, properties['名称'], 'featureId:', featureId);
    
    const entity = this.dataSource.entities.add({
      id: featureId,
      name: properties['名称'] || 'GeoJSON Entity',
      description: JSON.stringify(properties),
      properties: properties, // 直接在 entity 配置中设置 properties
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(positions),
        extrudedHeight: topHeight,
        height: bottomHeight,
        material: Cesium.Color.TRANSPARENT, // 完全透明
        outline: false, // 无轮廓线
        closeTop: true,
        closeBottom: true,
        perPositionHeight: false,
        shadows: Cesium.ShadowMode.DISABLED // 禁用阴影以提高性能
      }
    })

    // 额外保存属性到实体对象上，方便访问
    entity._properties = properties;
    entity.elevation = elevation;
    entity.terrainHeight = avgTerrainHeight;
    entity._originalColor = this.getColorByElevation(elevation); // 保存原始颜色
    
    console.log('实体创建完成:', entity);

    return entity;
  }

  getColorByElevation(elevation) {
    const range = this.maxElevation - this.minElevation || 1
    
    const normalized = (elevation - this.minElevation) / range
    
    if (normalized < 0.3) {
      return '#4CAF50'
    } else if (normalized < 0.6) {
      return '#FFC107'
    } else {
      return '#F44336'
    }
  }

  updateElevationMapping(newMin, newMax) {
    if (this.minElevation === newMin && this.maxElevation === newMax) {
      return
    }

    this.minElevation = newMin
    this.maxElevation = newMax

    for (const feature of this.loadedFeatures) {
      const entity = feature.entity
      const newColor = this.getColorByElevation(feature.elevation)
      entity.polygon.material = new Cesium.Color.fromCssColorString(newColor).withAlpha(0.85)
    }

    console.log('高程映射已更新')
  }

  updateFeatureElevation(featureId, newElevation) {
    const feature = this.loadedFeatures.find(f => f.id === featureId)
    if (!feature) {
      console.warn(`未找到要素: ${featureId}`)
      return false
    }

    const validatedElevation = Math.max(parseFloat(newElevation) || 0, 0)
    
    feature.elevation = validatedElevation
    this.elevationCache.set(featureId, validatedElevation)
    
    if (feature.entity && feature.entity.polygon) {
      const terrainHeight = feature.terrainHeight || 0
      feature.entity.polygon.extrudedHeight = terrainHeight + validatedElevation
      
      const newColor = this.getColorByElevation(validatedElevation)
      feature.entity.polygon.material = new Cesium.Color.fromCssColorString(newColor).withAlpha(0.85)
    }

    this.minElevation = Math.min(this.minElevation, validatedElevation)
    this.maxElevation = Math.max(this.maxElevation, validatedElevation)

    return true
  }

  remove() {
    if (this.dataSource) {
      this.viewer.dataSources.remove(this.dataSource, true)
      this.dataSource = null
    }
    
    this.entities = []
    this.loadedFeatures = []
    this.elevationCache.clear()
    this.terrainHeightCache.clear()
    this.loaded = false
    this.loading = false
    
    console.log('GeoJSON图层已移除')
  }

  show() {
    if (this.dataSource) {
      this.dataSource.show = true
    }
  }

  hide() {
    if (this.dataSource) {
      this.dataSource.show = false
    }
  }

  toggleVisibility() {
    if (this.dataSource) {
      this.dataSource.show = !this.dataSource.show
      return this.dataSource.show
    }
    return false
  }

  getStatistics() {
    return {
      featureCount: this.loadedFeatures.length,
      minElevation: this.minElevation,
      maxElevation: this.maxElevation,
      avgElevation: this.loadedFeatures.length > 0 
        ? this.loadedFeatures.reduce((sum, f) => sum + f.elevation, 0) / this.loadedFeatures.length
        : 0,
      loaded: this.loaded,
      loading: this.loading,
      error: this.error
    }
  }
}


// 通过provide向子组件暴露响应式地图实例
provide('cesiumMap', cesiumMap);

// 提供viewer实例供其他组件使用
const viewerRef = ref(null);
provide('cesiumViewer', viewerRef);

// 加载 GeoJSON 图层
async function loadGeoJSONLayer() {
  console.log('=== 开始加载 GeoJSON 图层 ===');
  
  if (!viewer) {
    console.error('Viewer 未初始化，无法加载 GeoJSON 图层');
    return;
  }

  try {
    // 先移除旧的GeoJSON图层（如果存在）
    if (geoJsonLayer) {
      geoJsonLayer.remove();
      geoJsonLayer = null;
    }
    
    geoJsonLayer = new GeoJSONLayer(viewer);
    
    const geojsonUrl = '/JYUminimaxtest/JYUData.geojson';
    console.log('GeoJSON 文件路径:', geojsonUrl);
    
    const success = await geoJsonLayer.loadGeoJSON(geojsonUrl);
    
    if (success) {
      console.log('GeoJSON 图层加载成功');
      
      const stats = geoJsonLayer.getStatistics();
      console.log('GeoJSON 图层统计信息:', {
        要素数量: stats.featureCount,
        最小高程: stats.minElevation,
        最大高程: stats.maxElevation,
        平均高程: stats.avgElevation.toFixed(2)
      });
      
      viewer.flyTo(geoJsonLayer.dataSource);
    } else {
      console.error('GeoJSON 图层加载失败');
    }
  } catch (error) {
    console.error('加载 GeoJSON 图层时发生错误:', error);
  }
}

// 切换 GeoJSON 图层可见性
function toggleGeoJSONLayerVisibility() {
  if (geoJsonLayer) {
    const visible = geoJsonLayer.toggleVisibility();
    console.log(`GeoJSON 图层可见性已切换为: ${visible}`);
    return visible;
  }
  console.warn('GeoJSON 图层尚未加载');
  return false;
}

// 获取 GeoJSON 图层统计信息
function getGeoJSONLayerStats() {
  if (geoJsonLayer) {
    return geoJsonLayer.getStatistics();
  }
  return null;
}

// 移除 GeoJSON 图层
function removeGeoJSONLayer() {
  if (geoJsonLayer) {
    geoJsonLayer.remove();
    geoJsonLayer = null;
    console.log('GeoJSON 图层已移除');
    return true;
  }
  return false;
}

// 清理所有临时实体（用于重置场景）
function clearAllTemporaryEntities() {
  if (!viewer) return;
  
  // 清理GeoJSON图层
  if (geoJsonLayer) {
    geoJsonLayer.remove();
    geoJsonLayer = null;
  }
  
  // 清理所有entities
  viewer.entities.removeAll();
  
  // 清理全局标记数组
  markers = [];
  fireMarkers = [];
  floodMarkers = [];
  sunlightAnalysisMarkers = [];
  floodSelectionMarkers = [];
  
  // 清理全局点数组
  positions = [];
  firePoints = [];
  floodPoints = [];
  sunlightAnalysisPoints = [];
  floodSelectionPoints = [];
  
  // 清理多边形
  if (window.floodSelectionPolygon) {
    viewer.entities.remove(window.floodSelectionPolygon);
    window.floodSelectionPolygon = null;
  }
  
  console.log('所有临时实体已清理完毕');
}

// 设置建筑物点击事件处理器
function setupBuildingClickHandler() {
  console.log('设置建筑物点击事件处理器');
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  handler.setInputAction((click) => {
    console.log('=== 点击事件触发 ===', click.position);

    // 方法1: 直接从 dataSource 中查找包含点击点的实体
    let pickedGeoJSONEntity = null;
    
    if (geoJsonLayer && geoJsonLayer.dataSource) {
      try {
        const entities = geoJsonLayer.dataSource.entities.values;
        console.log('数据源中实体数量:', entities.length);
        
        // 获取点击点的经纬度
        const ray = viewer.camera.getPickRay(click.position);
        const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const clickLon = Cesium.Math.toDegrees(cartographic.longitude);
          const clickLat = Cesium.Math.toDegrees(cartographic.latitude);
          
          console.log('点击位置经纬度:', clickLon, clickLat);
          
          // 遍历所有实体，检查点击点是否在多边形内
          for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            console.log(`检查实体 ${i}:`, entity.id);
            
            // 检查多边形实体
            if (entity.polygon && entity.polygon.hierarchy) {
              const hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now());
              
              if (hierarchy && hierarchy.positions) {
                // 转换多边形坐标为经纬度
                const polygonPositions = [];
                for (let j = 0; j < hierarchy.positions.length; j++) {
                  const posCartographic = Cesium.Cartographic.fromCartesian(hierarchy.positions[j]);
                  polygonPositions.push({
                    lon: Cesium.Math.toDegrees(posCartographic.longitude),
                    lat: Cesium.Math.toDegrees(posCartographic.latitude)
                  });
                }
                
                console.log('多边形坐标:', polygonPositions);
                
                // 检查点是否在多边形内
                if (isPointInPolygon(clickLon, clickLat, polygonPositions)) {
                  pickedGeoJSONEntity = entity;
                  console.log('找到包含点击点的实体:', entity);
                  break;
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('从数据源查找实体失败:', e);
      }
    }
    
    // 方法2: 如果方法1失败，再尝试使用 scene.pick 和 drillPick
    if (!pickedGeoJSONEntity) {
      try {
        const picked = viewer.scene.pick(click.position);
        console.log('Pick结果:', picked);
        
        if (picked && picked.id) {
          const entity = picked.id;
          let props = entity.properties || entity._properties;
          if (props && (props['名称'] || props['name'])) {
            pickedGeoJSONEntity = entity;
            console.log('通过pick找到GeoJSON图层实体:', props);
          }
        }
      } catch (e) {
        console.warn('scene.pick 失败:', e);
      }
    }

    // 如果点击到了 GeoJSON 图层，直接处理
    if (pickedGeoJSONEntity) {
      console.log('=== 处理GeoJSON建筑信息 ===');
      const properties = pickedGeoJSONEntity.properties || pickedGeoJSONEntity._properties;
      
      // 设置选中的建筑物信息，保存所有属性
      selectedBuilding.value = {
        name: properties['名称'] || properties['name'] || '未知建筑',
        type: properties['类型'] || properties['type'] || '未知类型',
        elevation: properties['高程'] || properties['elevation'] || properties['height'] || null,
        isGeoJSON: true,
        properties: properties // 保存完整属性对象
      };
      
      buildingInfoVisible.value = true;
      console.log('GeoJSON建筑信息已显示:', selectedBuilding.value);
      
      // 点击时高亮显示建筑
      highlightEntity(pickedGeoJSONEntity);
      return;
    }

    console.log('未找到GeoJSON图层实体，关闭弹窗');
    // 如果没有点击到任何建筑，关闭弹窗并清除高亮
    buildingInfoVisible.value = false;
    selectedBuilding.value = null;
    clearEntityHighlight();
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  window.buildingClickHandler = handler;
  console.log('建筑物点击事件处理器已设置');
}

// 保存当前高亮的实体
let highlightedEntity = null;

// 高亮实体 - 点击时显示建筑
function highlightEntity(entity) {
  // 清除之前的高亮
  clearEntityHighlight();
  
  // 保存当前高亮的实体
  highlightedEntity = entity;
  
  console.log('准备高亮显示建筑', entity);
  
  try {
    if (entity.polygon) {
      // 显示建筑 - 使用保存的原始颜色
      const materialColor = entity._originalColor || '#FFC107'; // 如果没有保存颜色，使用黄色
      entity.polygon.material = new Cesium.Color.fromCssColorString(materialColor).withAlpha(0.7);
      entity.polygon.outline = true; // 显示轮廓
      entity.polygon.outlineColor = Cesium.Color.BLACK;
      entity.polygon.outlineWidth = 2;
    }
  } catch (e) {
    console.warn('设置高亮失败:', e);
  }
  
  console.log('建筑已高亮显示');
}

// 清除高亮 - 隐藏建筑
function clearEntityHighlight() {
  if (highlightedEntity) {
    console.log('清除建筑高亮，隐藏建筑', highlightedEntity);
    try {
      if (highlightedEntity.polygon) {
        // 恢复为完全透明
        highlightedEntity.polygon.material = Cesium.Color.TRANSPARENT;
        highlightedEntity.polygon.outline = false;
      }
    } catch (e) {
      console.warn('恢复透明失败:', e);
    }
  }
  highlightedEntity = null;
  console.log('建筑已隐藏');
}


// 关闭建筑物信息弹窗
function closeBuildingInfo() {
  buildingInfoVisible.value = false;
  selectedBuilding.value = null;
  clearEntityHighlight(); // 关闭时清除高亮，隐藏建筑
}

// 格式化属性标签
function formatPropertyLabel(key) {
  const labelMap = {
    '名称': '建筑名称',
    '类型': '建筑类型',
    '高程': '建筑高程（米）',
    'height': '高度',
    'elevation': '高程',
    'name': '名称',
    'type': '类型'
  };
  return labelMap[key] || key;
}

// 格式化属性值
function formatPropertyValue(value) {
  if (value === null || value === undefined) {
    return '-';
  }
  // 如果是数字，保留适当的小数位
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(2);
  }
  return String(value);
}

// 判断点是否在多边形内（射线法）
function isPointInPolygon(pointLon, pointLat, polygonPoints) {
  if (!polygonPoints || polygonPoints.length < 3) {
    return false;
  }
  
  let inside = false;
  for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
    const xi = polygonPoints[i].lon, yi = polygonPoints[i].lat;
    const xj = polygonPoints[j].lon, yj = polygonPoints[j].lat;
    
    // 检查点是否在多边形的边界框内
    const intersect = ((yi > pointLat) !== (yj > pointLat))
      && (pointLon < (xj - xi) * (pointLat - yi) / (yj - yi) + xi);
    
    if (intersect) {
      inside = !inside;
    }
  }
  
  return inside;
}
// 检查Cesium渲染设置
function checkCesiumRenderSettings() {
  if (!viewer) {
    console.error('Viewer not initialized');
    return;
  }

  console.log('检查Cesium渲染设置:');
  console.log('requestRenderMode:', viewer.scene.requestRenderMode);
  console.log('maximumRenderTimeChange:', viewer.scene.maximumRenderTimeChange);
  console.log('pixelRatio:', viewer.scene.pixelRatio);
  console.log('orderIndependentTranslucency:', viewer.scene.orderIndependentTranslucency);
  console.log('globe.enableLighting:', viewer.scene.globe.enableLighting);
  console.log('globe.showGroundAtmosphere:', viewer.scene.globe.showGroundAtmosphere);
  console.log('fxaa:', viewer.scene.fxaa);
  console.log('postProcessStages.fxaa.enabled:', viewer.scene.postProcessStages.fxaa.enabled);

  // 检查WebGL支持
  console.log('WebGL支持检查:');
  // console.log('WebGL可用:', Cesium.FeatureDetection.supportsWebgl());
  console.log('WebGL上下文:', viewer.scene.context);
  console.log('WebGL上下文属性:', {
    antialias: viewer.scene.context.antialias,
    depth: viewer.scene.context.depth,
    stencil: viewer.scene.context.stencil,
    alpha: viewer.scene.context.alpha
  });

  // 检查场景状态
  console.log('场景状态:');
  console.log('场景已渲染:', viewer.scene.render);
  console.log('相机位置:', viewer.camera.position);
  console.log('相机方向:', viewer.camera.direction);
  console.log('场景模式:', viewer.scene.mode);

  // 检查粒子系统支持
  console.log('粒子系统支持检查:');
  console.log('ParticleSystem构造函数:', typeof Cesium.ParticleSystem);
  console.log('CircleEmitter构造函数:', typeof Cesium.CircleEmitter);
}

// 全面的粒子系统诊断函数
function diagnoseParticleSystem() {
  if (!viewer) {
    console.error('Viewer not initialized');
    return;
  }

  console.log('=== 粒子系统全面诊断 ===');

  // 1. 检查场景中的粒子系统
  const primitives = viewer.scene.primitives;
  console.log('场景中primitives总数:', primitives.length);

  let particleSystemCount = 0;
  for (let i = 0; i < primitives.length; i++) {
    const primitive = primitives.get(i);
    if (primitive instanceof Cesium.ParticleSystem) {
      particleSystemCount++;
      console.log(`粒子系统 ${particleSystemCount}:`, {
        show: primitive.show,
        image: primitive.image,
        rate: primitive.rate,
        emitter: primitive.emitter,
        modelMatrix: primitive.modelMatrix,
        startColor: primitive.startColor,
        endColor: primitive.endColor,
        startScale: primitive.startScale,
        endScale: primitive.endScale,
        life: primitive.life,
        speed: primitive.speed,
        width: primitive.width,
        height: primitive.height
      });
    }
  }

  console.log('场景中粒子系统总数:', particleSystemCount);

  // 2. 检查相机是否能看到粒子系统
  if (particleSystemCount > 0) {
    const camera = viewer.camera;
    console.log('相机位置:', camera.position);
    console.log('相机方向:', camera.direction);
    console.log('相机视锥体:', camera.frustum);
  }

  // 3. 检查渲染设置
  console.log('渲染设置:');
  console.log('requestRenderMode:', viewer.scene.requestRenderMode);
  console.log('maximumRenderTimeChange:', viewer.scene.maximumRenderTimeChange);
  console.log('pixelRatio:', viewer.scene.pixelRatio);

  // 4. 强制渲染并检查
  viewer.scene.requestRender();
  console.log('已强制请求渲染');
}

// 测试粒子系统函数
function testParticleSystem() {
  if (!viewer) {
    console.error('Viewer not initialized');
    return;
  }

  console.log('=== 创建测试粒子系统 ===');

  // 创建一个更明显的测试粒子系统
  const testParticleSystem = new Cesium.ParticleSystem({
    image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    startColor: Cesium.Color.RED.withAlpha(1.0),
    endColor: Cesium.Color.YELLOW.withAlpha(0.8),
    startScale: 20.0, // 进一步增大粒子尺寸
    endScale: 10.0, // 进一步增大粒子尺寸
    life: 6.0, // 增加生命周期
    speed: 8.0, // 增加速度
    width: 300, // 进一步增大宽度
    height: 300, // 进一步增大高度
    rate: 3000, // 进一步增加粒子产生率
    emitter: new Cesium.CircleEmitter(50), // 进一步增大发射器半径
    modelMatrix: Cesium.Matrix4.fromTranslation(
      Cesium.Cartesian3.fromDegrees(116.121637, 24.328083, 300) // 进一步提高高度
    ),
    show: true,
    minimumImageSize: new Cesium.Cartesian2(1, 1), // 设置最小图像尺寸
    maximumImageSize: new Cesium.Cartesian2(15, 15) // 设置最大图像尺寸
  });

  console.log('测试粒子系统创建成功:', testParticleSystem);
  console.log('测试粒子系统详细配置:', {
    image: testParticleSystem.image,
    startColor: testParticleSystem.startColor,
    endColor: testParticleSystem.endColor,
    startScale: testParticleSystem.startScale,
    endScale: testParticleSystem.endScale,
    life: testParticleSystem.life,
    speed: testParticleSystem.speed,
    width: testParticleSystem.width,
    height: testParticleSystem.height,
    rate: testParticleSystem.rate,
    emitter: testParticleSystem.emitter,
    modelMatrix: testParticleSystem.modelMatrix,
    show: testParticleSystem.show
  });

  viewer.scene.primitives.add(testParticleSystem);
  viewer.scene.requestRender();

  console.log('测试粒子系统已添加到场景，当前primitives数量:', viewer.scene.primitives.length);

  // 验证粒子系统是否正确添加
  setTimeout(() => {
    const primitives = viewer.scene.primitives;
    console.log('场景中的primitives数量:', primitives.length);
    for (let i = 0; i < primitives.length; i++) {
      const primitive = primitives.get(i);
      if (primitive instanceof Cesium.ParticleSystem) {
        console.log('找到粒子系统:', primitive);
        console.log('粒子系统是否可见:', primitive.show);
        console.log('粒子系统位置:', primitive.modelMatrix);
      }
    }

    // 执行全面诊断
    diagnoseParticleSystem();
  }, 1000);

  // 10秒后移除测试粒子系统
  setTimeout(() => {
    viewer.scene.primitives.remove(testParticleSystem);
    viewer.scene.requestRender();
    console.log('测试粒子系统已移除');
  }, 10000);
}





// 处理路线绘制事件
function handleDrawRoute(event) {
  const { startPoint, endPoint, mode } = event.detail;
  console.log('绘制路线:', { startPoint, endPoint, mode });
  
  // 根据不同的交通方式选择不同的颜色
  let lineColor = getLineColorByMode(mode);
  
  // 绘制路线
  drawLine(startPoint, endPoint, lineColor);
  
  // 添加起点和终点标记
  addLocationMarker(startPoint, '起点', Cesium.Color.GREEN);
  addLocationMarker(endPoint, '终点', Cesium.Color.RED);
  
  // 调整视角以显示整个路线
  viewer.flyTo(viewer.entities);
}

// 根据交通方式获取线条颜色
function getLineColorByMode(mode) {
  switch(mode) {
    case 'car':
      return Cesium.Color.RED;
    case 'walk':
      return Cesium.Color.GREEN;
    case 'bike':
      return Cesium.Color.YELLOW;
    default:
      return Cesium.Color.GREEN;
  }
}

// 处理交互式绘制事件
function handleInteractiveDraw(event) {
  const { mode } = event.detail;
  console.log('开始交互式绘制，交通方式:', mode);
  
  // 存储用户点击的点
  const points = [];
  // 获取线条颜色
  const lineColor = getLineColorByMode(mode);
  
  // 创建事件处理器
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  
  // 清除之前的实体（可选）
  // viewer.entities.removeAll();
  
  handler.setInputAction((movement) => {
    // 获取点击位置的坐标
    const cartesian = viewer.scene.pickPosition(movement.position);
    
    if (cartesian) {
      points.push(cartesian);
      
      // 添加临时标记
      viewer.entities.add({
        position: cartesian,
        point: {
          pixelSize: 10,
          color: points.length === 1 ? Cesium.Color.GREEN : Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        },
        label: {
          text: points.length === 1 ? '起点' : '终点',
          font: '14pt monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -15)
        }
      });
      
      // 如果已经点击了两个点，绘制路线并结束交互
      if (points.length === 2) {
        // 绘制路线
        drawLine(points[0], points[1], lineColor);
        
        // 调整视角以显示整个路线
        viewer.flyTo(viewer.entities);
        
        // 移除事件处理器
        handler.destroy();
        
        console.log('交互式绘制完成，已绘制路线');
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// 添加位置标记
function addLocationMarker(position, labelText, color) {
  viewer.entities.add({
    position: position,
    point: {
      pixelSize: 10,
      color: color,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2
    },
    label: {
      text: labelText,
      font: '14pt monospace',
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -10)
    }
  });
}

onMounted(() => {
  // 监听draw-route事件
window.addEventListener('draw-route', handleDrawRoute);
// 监听交互式绘制事件
window.addEventListener('start-interactive-draw', handleInteractiveDraw);
  
  function initCesium() {
    const container = document.getElementById('cesiumContainer');
    // 确保容器存在且尺寸有效
    if (container) {
      // 强制设置最小尺寸以防为0
      if (container.clientWidth <= 0) container.style.minWidth = '1px';
      if (container.clientHeight <= 0) container.style.minHeight = '1px';

      viewer = new Cesium.Viewer('cesiumContainer', {
        infoBox: false,
        selectionIndicator: false,
        timeline: false,  // 禁用时间线控件
        animation: false, // 禁用动画控件
        fullscreenButton: false,//禁用全屏按钮
        geocoder: false,//禁用搜索框
        sceneModePicker: false,//禁用投影选择器
        homeButton: false,//禁用Home按钮
        baseLayerPicker: false,//禁用图层选择控件
        navigationHelpButton: false,//禁用帮助按钮
        terrainProvider: Cesium.createWorldTerrain(), // 贴地
        orderIndependentTranslucency: false, // 禁用独立透明度排序，可能影响粒子系统
        targetFrameRate: 60 // 设置目标帧率
      });
      initializeViewer();
      return true;
    }
    return false;
  }

  // 尝试初始化，如果失败则重试
  if (!initCesium()) {
    console.warn('Cesium container has zero dimensions, waiting for next frame');

    // 最多重试10次，每次间隔100ms
    let retryCount = 0;
    const maxRetries = 10;
    const retryInterval = 100;

    const retryInit = () => {
      retryCount++;
      if (retryCount > maxRetries) {
        console.error('Failed to initialize Cesium after multiple attempts');
        return;
      }

      if (!initCesium()) {
        setTimeout(retryInit, retryInterval);
      }
    };

    setTimeout(retryInit, retryInterval);
  }

  // 添加窗口大小变化监听
  const handleResize = () => {
    if (viewer) {
      // 正确的调整大小方法是直接调用viewer.resize()
      viewer.resize();
    }
  };

  window.addEventListener('resize', handleResize);

  // 保存事件处理器用于清理
  window.cesiumResizeHandler = handleResize;
});

function initializeViewer() {
  // 设置viewerRef供其他组件使用
  viewerRef.value = viewer;
  
  // CPU和内存性能优化设置
  viewer.scene.logarithmicDepthBuffer = true; // 启用对数深度缓冲
  viewer.scene.highDynamicRange = false; // 关闭HDR
  viewer.scene.fog.enabled = false; // 关闭雾效
  viewer.scene.sun.show = false; // 关闭太阳效果
  viewer.scene.moon.show = false; // 关闭月亮效果
  viewer.scene.skyBox.show = false; // 关闭天空盒
  viewer.scene.shadowMap.enabled = false; // 关闭阴影
  viewer.scene.requestRenderMode = false; // 飞行时需要禁用按需渲染
  viewer.scene.requestRenderModeMaximumRenderTimeChange = 0.0; // 渲染时间变化阈值

  // 确保粒子系统能够正确渲染
  viewer.scene.globe.enableLighting = false; // 关闭CPU光照计算
  viewer.scene.globe.dynamicAtmosphereLighting = false; // 关闭CPU大气计算
  viewer.scene.globe.showGroundAtmosphere = false; // 关闭CPU大气渲染
  viewer.scene.debugShowFramesPerSecond = true; // 显示帧率
  viewer.scene.fxaa = false; // 关闭FXAA抗锯齿
  viewer.scene.postProcessStages.fxaa.enabled = false; // 关闭后处理FXAA

  // 确保粒子系统渲染设置
  viewer.scene.requestRenderMode = false; // 禁用按需渲染，确保粒子系统持续渲染
  viewer.scene.maximumRenderTimeChange = Infinity; // 允许无限渲染时间
  viewer.scene.pixelRatio = 1.0; // 设置像素比例

  // CPU和内存优化设置
  viewer.scene.globe.maximumScreenSpaceError = 16; // 飞行时允许更高细节
  viewer.scene.globe.tileCacheSize = 50; // 减少CPU缓存占用
  viewer.scene.globe.loadingDescendantLimit = 0; // 限制CPU密集型子瓦片加载
  viewer.scene.globe.enableLighting = false; // 关闭CPU光照计算
  viewer.scene.globe.dynamicAtmosphereLighting = false; // 关闭CPU大气计算
  viewer.scene.globe.showGroundAtmosphere = false; // 关闭CPU大气渲染

  // 内存优化设置
  viewer.scene.globe.depthTestAgainstTerrain = false; // 减少内存深度测试
  viewer.scene.globe.showWaterEffect = false; // 关闭内存水面效果
  viewer.scene.globe.showSkirts = false; // 减少内存地形数据

  // CPU优化的相机控制
  viewer.scene.screenSpaceCameraController.enableCollisionDetection = true; // 启用碰撞检测保证飞行路径
  viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1;
  viewer.scene.screenSpaceCameraController.maximumZoomDistance = 100000;

  // 地形深度测试
  viewer.scene.globe.depthTestAgainstTerrain = false;
  

  // 加载三维实景数据 - CPU和内存优化版本
  tileset.value = viewer.scene.primitives.add(
    new Cesium.Cesium3DTileset({
      url: 'cesium4/tileset.json',
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      maximumScreenSpaceError: 8, // 显著降低CPU计算负载
      maximumMemoryUsage: 256, // 大幅降低内存使用限制(MB)
      cacheBytes: 134217728, // 减少缓存大小为128MB
      maximumCacheOverflowBytes: 67108864, // 减少最大缓存溢出64MB
      preloadWhenHidden: false, // 标签页不可见时暂停加载 - 减少CPU占用
      preloadFlightDestinations: false, // 关闭预加载飞行路线 - 减少内存预加载
      skipLevelOfDetail: true, // 启用跳过LOD层级 - 减少CPU计算
      loadSiblings: false, // 关闭预加载相邻瓦片 - 减少内存占用
      cullWithChildrenBounds: true, // 使用子包围盒裁剪 - 减少CPU剔除计算
      preferLeaves: false, // 优先加载中间节点 - 减少CPU加载压力
      progressiveResolutionHeightFraction: 0.2, // 降低渐进式分辨率 - 减少CPU渲染压力
      dynamicScreenSpaceErrorComputedDensity: 0.01, // 降低动态计算密度 - 减少CPU计算
      dynamicScreenSpaceErrorFactor: 0.5, // 降低动态因子 - 减少CPU计算
      dynamicScreenSpaceErrorHeightFalloff: 0.05, // 降低高度衰减系数 - 减少CPU计算
      immediatelyLoadDesiredLevelOfDetail: false, // 不立即加载期望的LOD - 减少CPU突发负载
      loadOnlyVisibleTiles: true, // 仅加载可见瓦片 - 减少内存占用
      cullRequestsWhileMoving: true, // 移动时剔除请求 - 减少CPU网络请求
      cullRequestsWhileMovingMultiplier: 10.0, // 移动剔除乘数 - 减少CPU计算
      foveatedScreenSpaceError: true, // 启用注视点渲染 - 减少CPU渲染区域
      foveatedConeSize: 0.2, // 增大注视锥体大小 - 平衡CPU和内存
      foveatedMinimumScreenSpaceErrorRelaxation: 0.5, // 放松最小错误 - 减少CPU计算
      foveatedInterpolationCallback: Cesium.Cesium3DTileset.foveatedInterpolationCallback
    }));

  // 动态调整LOD参数
  tileset.value.maximumScreenSpaceError = 16; // 飞行结束后降低细节要求
  tileset.value.dynamicScreenSpaceError = false; // 飞行时禁用动态细节调整
  tileset.value.dynamicScreenSpaceErrorDensity = 0.00278; // 动态密度系数
  tileset.value.dynamicScreenSpaceErrorFactor = 4.0; // 动态因子
  tileset.value.dynamicScreenSpaceErrorHeightFalloff = 0.25; // 高度衰减系数

  // 等待数据加载完成再飞行 - CPU和内存优化版本
  tileset.value.readyPromise.then(() => {
    viewer.flyTo(tileset.value);

    // 设置初始化完成标志
    isInitialized.value = true;

    // 加载 GeoJSON 图层
    loadGeoJSONLayer().then(() => {
      // GeoJSON加载完成后设置点击事件处理器
      console.log('GeoJSON图层加载完成，设置点击事件处理器');
      setupBuildingClickHandler();
    });


    // 测试粒子系统（2秒后执行）
    setTimeout(() => {
      testParticleSystem();
    }, 2000);

    // 立即创建一个简单的测试粒子系统
    setTimeout(() => {
      console.log('=== 创建立即测试粒子系统 ===');
      const immediateTestParticle = new Cesium.ParticleSystem({
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        startColor: Cesium.Color.GREEN.withAlpha(1.0),
        endColor: Cesium.Color.BLUE.withAlpha(0.8),
        startScale: 25.0, // 进一步增大
        endScale: 15.0, // 进一步增大
        life: 8.0, // 增加生命周期
        speed: 10.0, // 增加速度
        width: 400, // 进一步增大
        height: 400, // 进一步增大
        rate: 4000, // 进一步增加
        emitter: new Cesium.CircleEmitter(80), // 进一步增大
        modelMatrix: Cesium.Matrix4.fromTranslation(
          Cesium.Cartesian3.fromDegrees(116.121637, 24.328083, 400) // 进一步提高
        ),
        show: true,
        minimumImageSize: new Cesium.Cartesian2(1, 1), // 设置最小图像尺寸
        maximumImageSize: new Cesium.Cartesian2(20, 20) // 设置最大图像尺寸
      });

      console.log('立即测试粒子系统创建成功:', immediateTestParticle);
      console.log('立即测试粒子系统详细配置:', {
        image: immediateTestParticle.image,
        startColor: immediateTestParticle.startColor,
        endColor: immediateTestParticle.endColor,
        startScale: immediateTestParticle.startScale,
        endScale: immediateTestParticle.endScale,
        life: immediateTestParticle.life,
        speed: immediateTestParticle.speed,
        width: immediateTestParticle.width,
        height: immediateTestParticle.height,
        rate: immediateTestParticle.rate,
        emitter: immediateTestParticle.emitter,
        modelMatrix: immediateTestParticle.modelMatrix,
        show: immediateTestParticle.show
      });

      viewer.scene.primitives.add(immediateTestParticle);
      viewer.scene.requestRender();
      console.log('立即测试粒子系统已添加到场景，当前primitives数量:', viewer.scene.primitives.length);

      // 立即检查粒子系统是否被正确添加
      setTimeout(() => {
        const primitives = viewer.scene.primitives;
        let foundImmediateParticle = false;
        for (let i = 0; i < primitives.length; i++) {
          const primitive = primitives.get(i);
          if (primitive === immediateTestParticle) {
            foundImmediateParticle = true;
            console.log('找到立即测试粒子系统:', primitive);
            console.log('立即测试粒子系统是否可见:', primitive.show);
            console.log('立即测试粒子系统位置:', primitive.modelMatrix);
          }
        }
        if (!foundImmediateParticle) {
          console.error('未找到立即测试粒子系统！');
        }
      }, 100);

      // 5秒后移除
      setTimeout(() => {
        viewer.scene.primitives.remove(immediateTestParticle);
        viewer.scene.requestRender();
        console.log('立即测试粒子系统已移除');
      }, 5000); // 延长显示时间
    }, 1000); // 缩短延迟时间

    // 轻量级性能监控
    viewer.performanceWatchdog = new Cesium.PerformanceWatchdog({
      scene: viewer.scene,
      lowFrameRateMessage: '性能警告: 帧率过低',
      lowFrameRateMessageDuration: 2000 // 减少显示时间
    });

    // CPU优化的性能监控 - 使用节流函数减少CPU占用
    let lastFrameCheck = 0;
    const frameCheckInterval = 500; // 500ms检查一次

    // 保存preRender监听器引用
    const preRenderListener = function () {
      const now = Date.now();
      if (now - lastFrameCheck > frameCheckInterval) {
        lastFrameCheck = now;
        const frameRate = viewer.scene.frameState.frameRate;
        if (frameRate < 25) {
          // 帧率过低时降低CPU负载
          tileset.value.maximumScreenSpaceError = Math.min(tileset.value.maximumScreenSpaceError + 4, 20);
          viewer.scene.globe.maximumScreenSpaceError = Math.min(viewer.scene.globe.maximumScreenSpaceError + 2, 10);
        } else if (frameRate > 40) {
          // 帧率充足时适当提高质量
          tileset.value.maximumScreenSpaceError = Math.max(tileset.value.maximumScreenSpaceError - 2, 4);
          viewer.scene.globe.maximumScreenSpaceError = Math.max(viewer.scene.globe.maximumScreenSpaceError - 1, 2);
        }
      }
    };

    viewer.scene.preRender.addEventListener(preRenderListener);
    // 保存监听器引用到viewer对象，方便卸载时清理
    viewer._preRenderListener = preRenderListener;

    // 内存清理机制
    let cleanupInterval = setInterval(() => {
      if (viewer && viewer.scene) {
        // 定期清理未使用的资源
        viewer.scene.requestRender();

        // 当内存使用过高时强制清理
        if (viewer.scene.globe.tilesLoading > 5) {
          tileset.value.maximumScreenSpaceError = Math.min(tileset.value.maximumScreenSpaceError + 2, 16);
        }
      }
    }, 1000); // 每10秒清理一次

    // 保存清理定时器ID用于卸载时清理
    viewer._cleanupInterval = cleanupInterval;

    // 优化的瓦片加载监控
    // 保存tileLoadProgressEvent监听器引用
    const tileLoadProgressListener = function () {
      // 限制同时加载的瓦片数量，减少CPU压力
      if (viewer.scene.globe.tilesLoading > 8) {
        tileset.value.maximumScreenSpaceError = Math.min(tileset.value.maximumScreenSpaceError + 1, 12);
      }
    };

    viewer.scene.globe.tileLoadProgressEvent.addEventListener(tileLoadProgressListener);
    // 保存监听器引用到viewer对象，方便卸载时清理
    viewer._tileLoadProgressListener = tileLoadProgressListener;
  });
}



onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('draw-route', handleDrawRoute);
window.removeEventListener('start-interactive-draw', handleInteractiveDraw);
  
  if (viewer) {
    // 清理定时器
    if (viewer._cleanupInterval) {
      clearInterval(viewer._cleanupInterval);
    }

    // 清理事件监听器
    if (viewer.scene) {
      // 使用保存的监听器引用进行移除
      if (viewer._preRenderListener) {
        viewer.scene.preRender.removeEventListener(viewer._preRenderListener);
        viewer._preRenderListener = null;
      }
      if (viewer._tileLoadProgressListener) {
        viewer.scene.globe.tileLoadProgressEvent.removeEventListener(viewer._tileLoadProgressListener);
        viewer._tileLoadProgressListener = null;
      }
    }

    // 清理点击事件处理器
    if (window.cesiumClickHandler) {
      window.cesiumClickHandler.destroy();
      window.cesiumClickHandler = null;
    }
    
    // 清理建筑点击事件处理器
    if (window.buildingClickHandler) {
      window.buildingClickHandler.destroy();
      window.buildingClickHandler = null;
    }

    // 清理窗口大小变化监听器
    if (window.cesiumResizeHandler) {
      window.removeEventListener('resize', window.cesiumResizeHandler);
      window.cesiumResizeHandler = null;
    }

    // 清除高亮
    clearEntityHighlight();

    // 清理GeoJSON图层
    if (geoJsonLayer) {
      geoJsonLayer.remove();
      geoJsonLayer = null;
    }

    // 清理所有实体
    if (viewer.entities) {
      viewer.entities.removeAll();
    }

    // 强制清理缓存
    if (tileset.value) {
      tileset.value.trimLoadedTiles();
    }

    // 销毁viewer实例
    viewer.destroy();
    viewer = null;
    tileset.value = null;

    // 触发垃圾回收提示
    if (window.gc) {
      window.gc();
    }
  }
});

// 处理从Safety组件发出的事件
const handleFloodAnalysis = () => {
  floodAnalysisVisible.value = true
  console.log('淹没分析功能已激活')
}

// 接收从FloodAnalysis组件更新的多边形坐标
const updatePolygonCoordinates = (coordinates) => {
  floodPolygonCoordinates.value = coordinates
}
// 日照分析相关变量
let sunlightAnalysisPoints = []
let sunlightAnalysisMarkers = []
let sunlightAnalysisResults = []

// 火灾模拟相关变量
let firePoints = []
let fireMarkers = []
let fireSimulationInterval = null
let isFireSimulating = false

// 火焰粒子系统配置
const fireParticleSystemOptions = {
  image: 'fire.png',
  startColor: Cesium.Color.RED,
  endColor: Cesium.Color.YELLOW,
  startScale: 1.0,
  endScale: 0.1,
  life: 2.0,
  speed: 1.0,
  width: 10,
  height: 10,
  rate: 50
}

// 水淹模拟相关变量
let floodPoints = []
let floodMarkers = []
let floodSimulationInterval = null
let isFloodSimulating = false

// 水淹粒子系统配置
const floodParticleSystemOptions = {
  image: 'shuibowen.jpeg', // 使用1x1像素的透明PNG
  startColor: Cesium.Color.CYAN.withAlpha(1.0), // 使用更明显的青色
  endColor: Cesium.Color.WHITE.withAlpha(0.9), // 使用白色作为结束颜色
  startScale: 20.0, // 进一步增大粒子尺寸
  endScale: 10.0, // 进一步增大粒子尺寸
  life: 6.0, // 增加生命周期
  speed: 8.0, // 增加速度
  width: 300, // 进一步增大宽度
  height: 300, // 进一步增大高度
  rate: 3000 // 进一步增加粒子产生率
}

// 通视分析相关方法
function addViewPoint() {
  clearResults();
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((movement) => {
    const cartesian = viewer.scene.pickPosition(movement.position);
    if (cartesian) {
      positions = [cartesian];
      markers = [viewer.entities.add({
        position: cartesian,
        billboard: {
          image: 'static/img/greenPoint.png',
          scale: 1,
          heightReference: Cesium.HeightReference.NONE
        }
      })];
      handler.destroy();
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function addTargetPoint() {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((movement) => {
    const cartesian = viewer.scene.pickPosition(movement.position);
    if (cartesian) {
      positions.push(cartesian);
      markers.push(viewer.entities.add({
        position: cartesian,
        billboard: {
          image: 'static/img/redPoint.png',
          scale: 1,
          heightReference: Cesium.HeightReference.NONE
        }
      }));
      handler.destroy();
      analysisVisible(positions);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function clearResults() {
  if (markers) {
    markers.forEach(marker => viewer.entities.remove(marker));
    markers = [];
  }
  positions = [];
}

function analysisVisible(positions) {
  let direction = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.subtract(
      positions[1],
      positions[0],
      new Cesium.Cartesian3()
    ),
    new Cesium.Cartesian3()
  );
  let ray = new Cesium.Ray(positions[0], direction);
  let result = viewer.scene.pickFromRay(ray);
  if (Cesium.defined(result) && Cesium.defined(result.object)) {
    drawLine(result.position, positions[0], Cesium.Color.GREEN);
    drawLine(result.position, positions[1], Cesium.Color.RED);
  } else {
    drawLine(positions[0], positions[1], Cesium.Color.GREEN);
  }
}

function drawLine(leftPoint, secPoint, color) {
  const line = viewer.entities.add({
    polyline: {
      positions: [leftPoint, secPoint],
      width: 2,
      material: color,
      depthFailMaterial: color
    }
  });
  markers.push(line); // 将线条实体添加到markers数组，以便后续清除

}

// 火灾模拟相关方法
function addFirePoint(params) {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((movement) => {
    const cartesian = viewer.scene.pickPosition(movement.position);
    if (cartesian) {
      const pointId = firePoints.length + 1;
      // 根据参数计算火势强度
      const intensity = params.size * 10;
      firePoints.push({
        id: pointId,
        position: cartesian,
        size: params.size,
        speed: params.speed,
        intensity: intensity,
        status: '较弱',
        spreadRadius: 0
      });

      // 创建火焰粒子系统
      const particleSystem = new Cesium.ParticleSystem({
        image: fireParticleSystemOptions.image,
        startColor: fireParticleSystemOptions.startColor,
        endColor: fireParticleSystemOptions.endColor,
        startScale: fireParticleSystemOptions.startScale * params.size / 5,
        endScale: fireParticleSystemOptions.endScale,
        life: fireParticleSystemOptions.life,
        speed: fireParticleSystemOptions.speed,
        width: fireParticleSystemOptions.width * params.size / 5,
        height: fireParticleSystemOptions.height * params.size / 5,
        rate: fireParticleSystemOptions.rate * params.size / 5,
        emitter: new Cesium.CircleEmitter(5 * params.size / 5),
        modelMatrix: Cesium.Matrix4.fromTranslation(cartesian),
        emitterModelMatrix: Cesium.Matrix4.identity
      });

      viewer.scene.primitives.add(particleSystem);

      // 添加起火点标记
      fireMarkers.push({
        id: pointId,
        marker: viewer.entities.add({
          position: cartesian,
          billboard: {
            image: 'public/fire.png',
            scale: params.size / 5,
            heightReference: Cesium.HeightReference.NONE
          },
          label: {
            text: '',
            font: '14pt monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20)
          }
        }),
        particleSystem: particleSystem
      });

      handler.destroy();
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function startFireSimulation(params) {
  if (isFireSimulating) {
    return;
  }

  isFireSimulating = true;
  // 模拟火灾扩散
  fireSimulationInterval = setInterval(() => {
    firePoints.forEach((point, index) => {
      // 更新火势状态
      point.spreadRadius += point.speed * 0.1;

      // 根据火势大小更新状态
      if (point.spreadRadius > 10) {
        point.status = '强烈';
      } else if (point.spreadRadius > 5) {
        point.status = '中等';
      } else {
        point.status = '较弱';
      }

      // 更新粒子系统
      const marker = fireMarkers.find(m => m.id === point.id);
      if (marker && marker.particleSystem) {
        marker.particleSystem.emitter = new Cesium.CircleEmitter(point.spreadRadius);
      }

      // 模拟火势蔓延 - 创建新的子火点
      if (Math.random() < 0.1 && point.spreadRadius > 3) {
        const angle = Math.random() * Math.PI * 2;
        const distance = point.spreadRadius * (0.5 + Math.random() * 0.5);
        const newPosition = Cesium.Cartesian3.add(
          point.position,
          new Cesium.Cartesian3(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance,
            0
          ),
          new Cesium.Cartesian3()
        );

        // 创建新的火点
        const newPointId = firePoints.length + 1;
        firePoints.push({
          id: newPointId,
          position: newPosition,
          size: point.size * 0.8,
          speed: point.speed,
          intensity: point.intensity * 0.8,
          status: '较弱',
          spreadRadius: 0
        });

        // 创建新的粒子系统
        const newParticleSystem = new Cesium.ParticleSystem({
          image: fireParticleSystemOptions.image,
          startColor: fireParticleSystemOptions.startColor,
          endColor: fireParticleSystemOptions.endColor,
          startScale: fireParticleSystemOptions.startScale * point.size / 5 * 0.8,
          endScale: fireParticleSystemOptions.endScale,
          life: fireParticleSystemOptions.life,
          speed: fireParticleSystemOptions.speed,
          width: fireParticleSystemOptions.width * point.size / 5 * 0.8,
          height: fireParticleSystemOptions.height * point.size / 5 * 0.8,
          rate: fireParticleSystemOptions.rate * point.size / 5 * 0.8,
          emitter: new Cesium.CircleEmitter(1),
          modelMatrix: Cesium.Matrix4.fromTranslation(newPosition),
          emitterModelMatrix: Cesium.Matrix4.identity
        });

        viewer.scene.primitives.add(newParticleSystem);

        // 添加新的起火点标记
        fireMarkers.push({
          id: newPointId,
          marker: viewer.entities.add({
            position: newPosition,
            billboard: {
              image: 'public/fire.png',
              scale: point.size / 5 * 0.8,
              heightReference: Cesium.HeightReference.NONE
            },
            label: {
              text: '',
              font: '14pt monospace',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -20)
            }
          }),
          particleSystem: newParticleSystem
        });
      }
    });
  }, 500);
}

function stopFireSimulation() {
  if (!isFireSimulating) {
    return;
  }

  isFireSimulating = false;
  clearInterval(fireSimulationInterval);
  fireSimulationInterval = null;
}

function clearFireSimulation() {
  stopFireSimulation();

  // 移除所有火点标记和粒子系统
  if (fireMarkers) {
    fireMarkers.forEach(marker => {
      viewer.entities.remove(marker.marker);
      viewer.scene.primitives.remove(marker.particleSystem);
    });
    fireMarkers = [];
  }
  firePoints = [];
}

// 获取火灾点数据
function getFirePoints() {
  return firePoints;
}

// 区域选取相关变量
let floodSelectionPoints = [];
let floodSelectionMarkers = [];
let isSelectingFloodArea = false;

// 开始选取水淹区域
function startSelectingFloodArea() {
  clearFloodSelection();
  isSelectingFloodArea = true;
  console.log('开始选取水淹区域，请点击地图上的4个点形成四边形区域，系统将自动闭合');

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((movement) => {
    const cartesian = viewer.scene.pickPosition(movement.position);
    if (cartesian) {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const lng = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      const height = cartographic.height;

      floodSelectionPoints.push({ lng, lat, height });

      // 添加标记
      const marker = viewer.entities.add({
        position: cartesian,
        billboard: {
          scale: 1,
          heightReference: Cesium.HeightReference.NONE
        },
        label: {
          text: `点 ${floodSelectionPoints.length}`,
          font: '14pt monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -20)
        }
      });
      floodSelectionMarkers.push(marker);

      // 如果已经选了4个点，自动闭合四边形并完成选取
      if (floodSelectionPoints.length === 4) {

        finishFloodAreaSelection();
        handler.destroy();
      } else if (floodSelectionPoints.length > 1) {
        // 更新多边形线
        updateFloodSelectionPolygon();
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // 保存处理器以便后续清理
  window.floodSelectionHandler = handler;
}

// 更新选取区域多边形
function updateFloodSelectionPolygon() {
  // 先移除之前的多边形
  if (window.floodSelectionPolygon) {
    viewer.entities.remove(window.floodSelectionPolygon);
  }

  // 创建新的多边形
  const positions = floodSelectionPoints.map(point =>
    Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.height)
  );

  // 如果是4个点，闭合多边形
  if (floodSelectionPoints.length === 4) {
    positions.push(positions[0]); // 连接回起点
  }

  window.floodSelectionPolygon = viewer.entities.add({
    polyline: {
      positions: positions,
      width: 2,
      material: Cesium.Color.BLUE,
      depthFailMaterial: Cesium.Color.BLUE
    }
  });
}

// 完成水淹区域选取
function finishFloodAreaSelection() {
  isSelectingFloodArea = false;
  floodPolygonCoordinates.value = floodSelectionPoints;
  console.log('水淹区域选取完成，已设置多边形坐标');

  // 显示完整多边形
  updateFloodSelectionPolygon();
}

// 清除区域选取
function clearFloodSelection() {
  isSelectingFloodArea = false;

  // 移除标记
  if (floodSelectionMarkers) {
    floodSelectionMarkers.forEach(marker => viewer.entities.remove(marker));
    floodSelectionMarkers = [];
  }

  // 移除多边形
  if (window.floodSelectionPolygon) {
    viewer.entities.remove(window.floodSelectionPolygon);
    window.floodSelectionPolygon = null;
  }

  floodSelectionPoints = [];
}

// 添加淹没点（类似火灾模拟的addFirePoint）
function addFloodPoint(params) {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((movement) => {
    const cartesian = viewer.scene.pickPosition(movement.position);
    if (cartesian) {
      const pointId = floodPoints.length + 1;
      // 根据参数计算水淹强度
      const intensity = params.size * 10;
      floodPoints.push({
        id: pointId,
        position: cartesian,
        size: params.size,
        speed: params.speed,
        intensity: intensity,
        status: '开始淹没',
        spreadRadius: 0,
        currentHeight: 0
      });

      // 创建水淹粒子系统
      const particleSystem = new Cesium.ParticleSystem({
        image: floodParticleSystemOptions.image,
        startColor: floodParticleSystemOptions.startColor,
        endColor: floodParticleSystemOptions.endColor,
        startScale: floodParticleSystemOptions.startScale * params.size / 5,
        endScale: floodParticleSystemOptions.endScale,
        life: floodParticleSystemOptions.life,
        speed: floodParticleSystemOptions.speed,
        width: floodParticleSystemOptions.width * params.size / 5,
        height: floodParticleSystemOptions.height * params.size / 5,
        rate: floodParticleSystemOptions.rate * params.size / 5,
        emitter: new Cesium.CircleEmitter(5 * params.size / 5),
        modelMatrix: Cesium.Matrix4.fromTranslation(cartesian),
        emitterModelMatrix: Cesium.Matrix4.identity,
        show: true,
        minimumImageSize: new Cesium.Cartesian2(1, 1),
        maximumImageSize: new Cesium.Cartesian2(15, 15)
      });

      viewer.scene.primitives.add(particleSystem);
      viewer.scene.requestRender();

      // 添加淹没点标记
      floodMarkers.push({
        id: pointId,
        marker: viewer.entities.add({
          position: cartesian,
          billboard: {
            image: 'water.svg',
            scale: params.size / 5,
            heightReference: Cesium.HeightReference.NONE
          },
          label: {
            text: '',
            font: '14pt monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20)
          }
        }),
        particleSystem: particleSystem
      });

      handler.destroy();
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// 开始淹没模拟（类似火灾模拟的startFireSimulation）
function startFloodSimulation(params) {
  console.log('开始淹没模拟，参数:', params);

  if (isFloodSimulating) {
    console.warn('淹没模拟已在运行中');
    return;
  }

  isFloodSimulating = true;
  const { speed } = params;

  console.log('淹没模拟状态:', {
    isFloodSimulating,
    speed,
    floodPointsCount: floodPoints.length,
    hasPolygonCoordinates: floodPolygonCoordinates.value && floodPolygonCoordinates.value.length > 0
  });

  // 如果没有淹没点，在绘制区域的中心创建一个
  if (floodPoints.length === 0 && floodPolygonCoordinates.value && floodPolygonCoordinates.value.length > 0) {
    const center = Cesium.BoundingSphere.fromPoints(
      floodPolygonCoordinates.value.map(coord =>
        Cesium.Cartesian3.fromDegrees(coord.lng, coord.lat, 0)
      )
    ).center;

    const pointId = 1;
    floodPoints.push({
      id: pointId,
      position: center,
      size: 5,
      speed: speed,
      intensity: 50,
      status: '开始淹没',
      spreadRadius: 0,
      currentHeight: 0
    });

    // 创建主水淹粒子系统
    console.log('=== 创建主水淹粒子系统 ===');
    const particleSystem = new Cesium.ParticleSystem({
      image: floodParticleSystemOptions.image,
      startColor: floodParticleSystemOptions.startColor,
      endColor: floodParticleSystemOptions.endColor,
      startScale: floodParticleSystemOptions.startScale,
      endScale: floodParticleSystemOptions.endScale,
      life: floodParticleSystemOptions.life,
      speed: floodParticleSystemOptions.speed,
      width: floodParticleSystemOptions.width,
      height: floodParticleSystemOptions.height,
      rate: floodParticleSystemOptions.rate,
      emitter: new Cesium.CircleEmitter(50),
      modelMatrix: Cesium.Matrix4.fromTranslation(center),
      emitterModelMatrix: Cesium.Matrix4.identity,
      show: true,
      minimumImageSize: new Cesium.Cartesian2(1, 1),
      maximumImageSize: new Cesium.Cartesian2(15, 15)
    });

    console.log('主水淹粒子系统创建成功:', particleSystem);
    viewer.scene.primitives.add(particleSystem);
    viewer.scene.requestRender();
    console.log('主水淹粒子系统已添加到场景');

    floodMarkers.push({
      id: pointId,
      particleSystem: particleSystem,
      center: center
    });
  }

  // 模拟水淹过程，参考火焰蔓延机制
  floodSimulationInterval = setInterval(() => {
    floodPoints.forEach((point, index) => {
      // 更新水淹状态
      point.spreadRadius += point.speed * 0.1;
      point.currentHeight += point.speed * 0.05;

      // 根据水淹大小更新状态
      if (point.spreadRadius > 20) {
        point.status = '严重淹没';
      } else if (point.spreadRadius > 10) {
        point.status = '中度淹没';
      } else if (point.spreadRadius > 5) {
        point.status = '轻度淹没';
      } else {
        point.status = '开始淹没';
      }

      // 更新粒子系统
      const marker = floodMarkers.find(m => m.id === point.id);
      if (marker && marker.particleSystem) {
        marker.particleSystem.emitter = new Cesium.CircleEmitter(point.spreadRadius);

        // 更新粒子系统位置，跟随水位上升
        const newPosition = Cesium.Cartesian3.fromDegrees(
          Cesium.Cartographic.fromCartesian(point.position).longitude,
          Cesium.Cartographic.fromCartesian(point.position).latitude,
          point.currentHeight
        );
        marker.particleSystem.modelMatrix = Cesium.Matrix4.fromTranslation(newPosition);
      }

      // 模拟水淹扩散 - 创建新的子淹没点
      if (Math.random() < 0.1 && point.spreadRadius > 3) {
        const angle = Math.random() * Math.PI * 2;
        const distance = point.spreadRadius * (0.5 + Math.random() * 0.5);
        const newPosition = Cesium.Cartesian3.add(
          point.position,
          new Cesium.Cartesian3(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance,
            0
          ),
          new Cesium.Cartesian3()
        );

        // 创建新的淹没点
        const newPointId = floodPoints.length + 1;
        floodPoints.push({
          id: newPointId,
          position: newPosition,
          size: point.size * 0.8,
          speed: point.speed,
          intensity: point.intensity * 0.8,
          status: '开始淹没',
          spreadRadius: 0,
          currentHeight: point.currentHeight
        });

        // 创建新的粒子系统
        const newParticleSystem = new Cesium.ParticleSystem({
          image: floodParticleSystemOptions.image,
          startColor: floodParticleSystemOptions.startColor,
          endColor: floodParticleSystemOptions.endColor,
          startScale: floodParticleSystemOptions.startScale * point.size / 5 * 0.8,
          endScale: floodParticleSystemOptions.endScale,
          life: floodParticleSystemOptions.life,
          speed: floodParticleSystemOptions.speed,
          width: floodParticleSystemOptions.width * point.size / 5 * 0.8,
          height: floodParticleSystemOptions.height * point.size / 5 * 0.8,
          rate: floodParticleSystemOptions.rate * point.size / 5 * 0.8,
          emitter: new Cesium.CircleEmitter(1),
          modelMatrix: Cesium.Matrix4.fromTranslation(newPosition),
          emitterModelMatrix: Cesium.Matrix4.identity,
          show: true,
          minimumImageSize: new Cesium.Cartesian2(1, 1),
          maximumImageSize: new Cesium.Cartesian2(10, 10)
        });

        viewer.scene.primitives.add(newParticleSystem);
        viewer.scene.requestRender();

        // 添加新的淹没点标记
        floodMarkers.push({
          id: newPointId,
          marker: viewer.entities.add({
            position: newPosition,
            billboard: {
              image: 'public/water.svg',
              scale: point.size / 5 * 0.8,
              heightReference: Cesium.HeightReference.NONE
            },
            label: {
              text: '',
              font: '14pt monospace',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -20)
            }
          }),
          particleSystem: newParticleSystem
        });
      }
    });
  }, 500);
}

function pauseFloodSimulation() {
  if (!isFloodSimulating) {
    return;
  }

  if (floodSimulationInterval) {
    clearInterval(floodSimulationInterval);
    floodSimulationInterval = null;
    floodPoints[0].status = '已暂停';
  } else {
    // 恢复模拟
    const { minHeight, maxHeight, speed } = floodPoints[0];
    let currentHeight = floodPoints[0].currentHeight;

    floodSimulationInterval = setInterval(() => {
      if (currentHeight < maxHeight) {
        currentHeight += speed * 0.1;
        currentHeight = Math.min(currentHeight, maxHeight);
        floodPoints[0].currentHeight = currentHeight;
      } else {
        floodPoints[0].status = '已完成';
        clearInterval(floodSimulationInterval);
      }
    }, 500);
    floodPoints[0].status = '模拟中';
  }
}

function stopFloodSimulation() {
  if (!isFloodSimulating) {
    return;
  }

  isFloodSimulating = false;
  if (floodSimulationInterval) {
    clearInterval(floodSimulationInterval);
    floodSimulationInterval = null;
  }
  if (floodPoints.length > 0) {
    floodPoints[0].status = '已结束';
  }
}

function clearFloodSimulation() {
  stopFloodSimulation();

  // 移除所有水淹粒子系统和标记，包括主区域和子区域
  if (floodMarkers) {
    floodMarkers.forEach(marker => {
      if (marker.particleSystem) {
        viewer.scene.primitives.remove(marker.particleSystem);
      }
      if (marker.marker) {
        viewer.entities.remove(marker.marker);
      }
    });
    floodMarkers = [];
  }
  floodPoints = [];
}

// 获取水淹数据
function getFloodData() {
  return floodPoints.length > 0 ? floodPoints : null;
}

// 日照分析相关方法
function addSunlightAnalysisPoint() {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((movement) => {
    const cartesian = viewer.scene.pickPosition(movement.position);
    if (cartesian) {
      const pointId = sunlightAnalysisPoints.length + 1;
      sunlightAnalysisPoints.push({
        id: pointId,
        position: cartesian
      });
      sunlightAnalysisMarkers.push(viewer.entities.add({
        position: cartesian,
        billboard: {
          image: 'static/img/yellowPoint.png',
          scale: 1,
          heightReference: Cesium.HeightReference.NONE
        },
        label: {
          text: `分析点 ${pointId}`,
          font: '14pt monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -20)
        }
      }));
      handler.destroy();
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function startSunlightAnalysis(params) {
  // 清空之前的分析结果
  clearSunlightAnalysisResults();

  // 提取参数中的日期和时间
  const { startDate, endDate, startTime, endTime } = params;

  // 计算日期范围的天数
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // 计算每天的日照时间范围（小时）
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  const dailySunlightHours = endHour - startHour;

  // 模拟日照分析过程，考虑选择的时间范围
  sunlightAnalysisPoints.forEach(point => {
    // 根据选择的时间范围调整日照时长 (基础值为选择的每天日照小时数)
    // 增加一些随机变化 (±30%)
    const variation = 0.7 + Math.random() * 0.6; // 0.7到1.3之间
    const sunlightHours = dailySunlightHours * dayCount * variation;
    const status = sunlightHours > (dailySunlightHours * dayCount * 0.7) ? '充足' : '不足';

    // 存储分析结果
    sunlightAnalysisResults.push({
      id: point.id,
      sunlightHours: sunlightHours.toFixed(1),
      status: status
    });

    // 在3D场景中可视化结果
    const color = status === '充足' ? Cesium.Color.YELLOW : Cesium.Color.BLUE;
    sunlightAnalysisMarkers.push(viewer.entities.add({
      position: point.position,
      cylinder: {
        length: 10,
        topRadius: 5,
        bottomRadius: 5,
        material: color,
        outline: true,
        outlineColor: Cesium.Color.BLACK
      },
      label: {
        text: `${status}: ${sunlightHours.toFixed(1)}小时`,
        font: '12pt monospace',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        pixelOffset: new Cesium.Cartesian2(0, 20)
      }
    }));
  });

  // 将分析结果发送给SunlightAnalysis组件
  return sunlightAnalysisResults;
}

function clearSunlightAnalysisResults() {
  if (sunlightAnalysisMarkers) {
    sunlightAnalysisMarkers.forEach(marker => viewer.entities.remove(marker));
    sunlightAnalysisMarkers = [];
  }
  sunlightAnalysisResults = [];
}



function toggleTilesetVisibility() {
  tilesetVisible.value = !tilesetVisible.value;
  if (tileset.value) {
    tileset.value.show = tilesetVisible.value;
  }
}

// 暴露方法
defineExpose({
  startSelectingFloodArea,
  clearFloodSelection,
  handleFloodAnalysis,
  addViewPoint,
  addTargetPoint,
  clearResults,
  addSunlightAnalysisPoint,
  startSunlightAnalysis,
  clearSunlightAnalysisResults,
  addFirePoint,
  startFireSimulation,
  stopFireSimulation,
  clearFireSimulation,
  getFirePoints,
  addFloodPoint,
  startFloodSimulation,
  pauseFloodSimulation,
  stopFloodSimulation,
  clearFloodSimulation,
  getFloodData,
  floodPolygonCoordinates,
  // GeoJSON图层相关方法
  toggleGeoJSONLayerVisibility,
  getGeoJSONLayerStats,
  removeGeoJSONLayer,
  clearAllTemporaryEntities,
})

</script>

<template>
  <div id="cesiumContainer" class="cesium-container">
    <button class="tileset-toggle-btn" @click="toggleTilesetVisibility">
      {{ tilesetVisible ? '隐藏' : '显示' }}3D图层
    </button>

    <!-- 建筑物信息弹窗 -->
    <div v-if="buildingInfoVisible && selectedBuilding" class="building-info-panel">
      <div class="building-info-header">
        <h3>{{ selectedBuilding.name || '建筑物信息' }}</h3>
        <button class="close-btn" @click="closeBuildingInfo">×</button>
      </div>
      <div class="building-info-content">
        <!-- 显示GeoJSON图层的建筑信息 -->
        <div v-if="selectedBuilding.isGeoJSON" class="geojson-building-info">
          <div class="info-section">
            <h4>建筑信息</h4>
            <table class="building-info-table">
              <tbody>
                <!-- 动态显示所有属性 -->
                <tr v-for="(value, key) in selectedBuilding.properties" :key="key">
                  <td class="property-name">{{ formatPropertyLabel(key) }}</td>
                  <td class="property-value">{{ formatPropertyValue(value) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <FloodAnalysis v-if="floodAnalysisVisible" :viewer="viewer" :min-height="0" :max-height="100"
      :polygon-coordinates="floodPolygonCoordinates" @close="floodAnalysisVisible = false" />
  </div>
</template>

<style>
.cesium-container {
  width: 100%;
  height: 100vh;
  position: relative;
  min-width: 320px;
  min-height: 480px;
  overflow: hidden;
}

/* 平板设备 */
@media (max-width: 1024px) and (min-width: 769px) {
  .cesium-container {
    height: 90vh;
  }
}

/* 移动设备 */
@media (max-width: 768px) {
  .cesium-container {
    height: 80vh;
  }
}

/* 小屏手机 */
@media (max-width: 480px) {
  .cesium-container {
    height: 70vh;
  }
}

/* 横竖屏切换适配 */
@media (max-aspect-ratio: 1/1) {
  .cesium-container {
    height: 75vh;
  }
}

.cesium-viewer-bottom {
  display: none;
}

.tileset-toggle-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  padding: 8px 16px;
  background-color: rgba(42, 144, 217, 0.9);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.tileset-toggle-btn:hover {
  background-color: rgba(42, 144, 217, 1);
}

.tileset-toggle-btn:active {
  background-color: rgba(30, 100, 160, 1);
}

/* 建筑物信息弹窗样式 */
.building-info-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  max-height: 80vh;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow-y: auto;
}

.building-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.building-info-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.building-info-content {
  padding: 16px;
}

.info-section {
  margin-bottom: 20px;
}

.info-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #555;
  border-bottom: 2px solid #2a90d9;
  padding-bottom: 8px;
}

.building-info-table {
  width: 100%;
  border-collapse: collapse;
}

.building-info-table td {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.property-name {
  font-weight: 500;
  color: #666;
  width: 100px;
}

.property-value {
  color: #333;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.info-tag {
  display: inline-block;
  padding: 4px 12px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 16px;
  font-size: 14px;
}

.facility-tag {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.opening-hours {
  margin: 0;
  color: #666;
  line-height: 1.6;
}
</style>
