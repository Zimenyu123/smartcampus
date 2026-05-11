<script setup>
//3DTiles属于Primitive具有很⾼的数据加载效率
import { onMounted } from 'vue'
import * as Cesium from 'cesium'
import * as turf from "@turf/turf";
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiOWM5MWQ4Yi1kY2M0LTRiODctOTc0MS01OTY2ZDkxY2IxNTYiLCJpZCI6Mjg2Mjg5LCJpYXQiOjE3NDI1MzQ0NzN9.eg4zxoPJK6GKtg2aLY9izSBy1jHpbD8fHU7PTOptyo4'
onMounted(() => {
    const viewer = new Cesium.Viewer('cesiumContainer', {
        infoBox: false,
        selectionIndicator: false,

    })
    //纽约3D建筑白模
    const tileset = viewer.scene.primitives.add(
        new Cesium.Cesium3DTileset({
            url: 'E:/webgis/智慧校园/智慧校园/public/cesium_1g/tileset.json'
        })
    )
    viewer.flyTo(tileset)
    var obj = {
        startpointStyle: {
          image: "public\static\img\greenPoint.png",
          text: "",
          pixelOffsetX: 10,
          pixelOffsetY: 20,
          scale: 1
        },
        endpointStyle: {
          image: "public\static\img\redPoint.png",
          text: "",
          pixelOffsetX: 10,
          pixelOffsetY: 20,
          scale: 1
        }
      };
      //添加场景监听事件
      var CesiumEventHandler = new Cesium.ScreenSpaceEventHandler(
        viewer.scene.canvas
      );
      var positions = [];
      var markers = []; //点实体
      CesiumEventHandler.setInputAction(function (movement) {
        var cartesian = viewer.scene.pickPosition(movement.position);
        if (cartesian) {
          positions.push(cartesian); //加点
          if (markers.length == 0) {
            //创建点实体
            var startpoint = viewer.entities.add({
              position: cartesian,
              billboard: {
                image: obj.startpointStyle.image,
                scale: obj.startpointStyle.scale,
                heightReference: Cesium.HeightReference.NONE
              },
              label: {
                text: obj.startpointStyle.text,
                fillColor: Cesium.Color.YELLOW,
                pixelOffset: {
                  x: obj.startpointStyle.pixelOffsetX,
                  y: obj.startpointStyle.pixelOffsetY
                },
                scale: obj.startpointStyle.scale
              }
            });
            markers.push(startpoint);
          } else if (markers.length == 1) {
            var endpoint = viewer.entities.add({
              position: cartesian,
              billboard: {
                image: obj.endpointStyle.image,
                scale: obj.endpointStyle.scale,
                heightReference: Cesium.HeightReference.NONE
              },
              label: {
                text: obj.endpointStyle.text,
                fillColor: Cesium.Color.YELLOW,
                pixelOffset: {
                  x: obj.endpointStyle.pixelOffsetX,
                  y: obj.endpointStyle.pixelOffsetY
                },
                scale: obj.endpointStyle.scale
              }
            });
            markers.push(endpoint);
            CesiumEventHandler.removeInputAction(
              Cesium.ScreenSpaceEventType.LEFT_CLICK
            ); //移除左键事件
            analysisVisible(positions); //开始分析
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // 进行通视分析
      function analysisVisible(positions) {
        // 计算射线的方向
        let direction = Cesium.Cartesian3.normalize(
          Cesium.Cartesian3.subtract(
            positions[1],
            positions[0],
            new Cesium.Cartesian3()
          ),
          new Cesium.Cartesian3()
        );
        // 建立射线
        let ray = new Cesium.Ray(positions[0], direction);
        // 计算交互点，返回第一个
        let result = viewer.scene.pickFromRay(ray);
        // console.log(result)
        if (Cesium.defined(result) && Cesium.defined(result.object)) {
          drawLine(result.position, positions[0], Cesium.Color.GREEN); // 可视区域
          drawLine(result.position, positions[1], Cesium.Color.RED); // 不可视区域
        } else {
          drawLine(positions[0], positions[1], Cesium.Color.GREEN);
          console.log("不在模型上");
        }
      }

      // * 绘制线
      function drawLine(leftPoint, secPoint, color) {
        var Lines = viewer.entities.add({
          polyline: {
            positions: [leftPoint, secPoint],
            width: 2,
            material: color,
            depthFailMaterial: color
          }
        });
      }
    })

</script>

<template>
    <div id="cesiumContainer"></div>
</template>

<style scoped>
#cesiumContainer {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
}
</style>