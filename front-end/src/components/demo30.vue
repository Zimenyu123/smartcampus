<template>
  <div class="viewer">
    <vc-viewer @ready="ready" :logo="false">
      <vc-navigation></vc-navigation>

      <vc-analytics-flood
        ref="flood"
        :min-height="minHeight"
        :max-height="maxHeight"
        :speed="speed"
        :polygon-hierarchy="polygonHierarchy"
        @stop="onStoped"
      ></vc-analytics-flood>

      <vc-layer-imagery>
        <vc-provider-imagery-urltemplate :projection-transforms="projectionTransforms" :url="url"></vc-provider-imagery-urltemplate>
      </vc-layer-imagery>

      <vc-provider-terrain-arcgis-tiled-elevation :url="terrainUrl"></vc-provider-terrain-arcgis-tiled-elevation>
    </vc-viewer>

    <div class="demo-tool">
      <label>最低高程</label>
      <el-input v-model.number="minHeight"></el-input>
      <label>最高高程</label>
      <el-input v-model.number="maxHeight"></el-input>

      <span>速度（指定每帧增加的高度）</span>
      <el-slider v-model="speed" :min="1" :max="100" :interval="1"></el-slider>
      <el-button class="md-raised md-accent" @click="start">开始</el-button>
      <el-button
        :disabled="!starting"
        class="md-raised md-accent"
        @click="pause"
      >{{pausing ? '继续' : '暂停'}}</el-button>
      <el-button class="md-raised md-accent" @click="stop">结束</el-button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      imageryProvider: undefined,
      terrainUrl:
        "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
      minHeight: 400,
      maxHeight: 7000,
      speed: 5,
      polygonHierarchy: [
        { lng: 94.85558, lat: 29.24289 },
        { lng: 94.85518, lat: 29.10554 },
        { lng: 95.14416, lat: 29.10138 },
        { lng: 95.13892, lat: 29.25668 }
      ],
      pausing: false,
      starting: false,
      projectionTransforms: {
        from: "GCJ02",
        to: "WGS84"
      },
      url:
        "https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}"
    };
  },
  methods: {
    ready(cesiumInstance) {
      const { Cesium, viewer } = cesiumInstance;


      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(94.99242,29.18043, 22560),
        duration: 0
      });
    },
    start() {
      this.$refs.flood.start();
      this.pausing = false;
      this.starting = true;
    },
    pause() {
      this.$refs.flood.pause();
      this.pausing = !this.pausing;
    },
    stop() {
      this.$refs.flood.stop();
      this.pausing = false;
      this.starting = false;
    },
    onStoped(e) {
      this.pausing = false;
      this.starting = false;
      console.log(e);
    }
  }
};
</script>