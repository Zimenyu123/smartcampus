<template>
    <div class="top">
        <div class="left">
            <img src="../assets/logo透明底.jfif" alt="" class="logo">
        </div>
        <div class="middle">
            <MyButton v-for="button in buttons" :key="button.id" :title="button.title" :address="button.address" />
            
            <!-- 修改实景三维容器结构 -->
            <div class="nav-item">
                <div class="button" @click="isOpenCheck = !isOpenCheck">实景三维</div>
                <div :class="{ sanWeibox: isOpenCheck }">
                    <div class="dropdown-menu">
                        <a target="_blank" href="https://3dviewer.dji.com/s/9d4a8bad-6198-4043-9a0a-447df8781208" class="menu-item">
                            电脑端
                        </a>
                        <div class="menu-item shouJibox">
                            手机端
                            <img src="../assets/二维码.png" alt="二维码" class="qrcode">
                        </div>
                    </div>
                </div>
            </div>

            <router-link class="button" to="/virtual-campus">
                虚拟嘉应
            </router-link>
        </div>
        <div class="right">
            <router-link class="dengLu" to="/login">
                <img class="woDe" src="../assets/我的_me.svg" alt="">
            </router-link>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import MyButton from './MyButton.vue'

const isOpenCheck = ref(true)

const buttons = [
    { id: 1, title: '首页', address: '/' },
    { id: 2, title: '校园服务', address: 'https://www.jyu.edu.cn/zsbs.htm' },
    { id: 3, title: '教学资源', address: 'https://www.jyu.edu.cn/xxgk.htm' }
]


</script>

<style scoped>
.top {
  position: fixed;
  top: 0;
  width: 100%;
  height: 60px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  padding: 0 30px;
  z-index: 1000;
}

.left .logo {
  height: 40px;
  margin-right: 50px; /* 增加logo右侧间距 */
}

.middle {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px; /* 统一按钮间距 */
}

/* 新增导航项容器样式 */
.middle > div:not(:last-child) {
  position: relative;
}

/* 修改下拉菜单样式 */
.sanWeibox {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 10px;
  display: none; /* 默认隐藏 */
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
  border-radius: 4px;
  z-index: 1001;
}

/* 添加显示状态 */
.sanWeibox[class*="sanWeibox"] {
  display: flex; /* 当isOpenCheck为true时显示 */
}

.shouJibox {
  position: relative;
}
.shouJibox:hover img {
  display: block;
}
.shouJibox img {
  display: none;
  position: absolute;
  left: 100%;
  top: 0;
  width: 120px;
  height: 120px;
  padding: 5px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.button {
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
  position: relative;
}
.button:hover {
  background: #f5f5f5;
}

.right {
  position: absolute;
  right: 30px;
}
.woDe {
  width: 32px;
  height: 32px;
}

/* 新增导航项统一样式 */
.nav-item {
    position: relative;
    display: flex;
    align-items: center;  /* 垂直居中 */
    height: 100%;
}

/* 调整下拉菜单定位 */
.sanWeibox {
    top: calc(100% - 10px); /* 微调下拉菜单位置 */
    align-items: center;    /* 菜单项居中对齐 */
}

/* 统一按钮高度 */
.button {
    display: flex;
    align-items: center;
    height: 40px;          /* 与导航栏高度匹配 */
    padding: 8px 20px;     /* 统一左右间距 */
}

/* 新增下拉菜单样式 */
.dropdown-menu {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 8px 0;
}

.menu-item {
    padding: 12px 24px;
    color: #333;
    white-space: nowrap;
    transition: background 0.2s;
}

.menu-item:hover {
    background: #f8f9fa;
}

/* 调整二维码样式 */
.shouJibox .qrcode {
    display: none;
    position: absolute;
    left: 100%;
    top: -40px;
    width: 120px;
    height: 120px;
    background: #fff;
    padding: 8px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.shouJibox:hover .qrcode {
    display: block;
}

/* 修改原有 sanWeibox 样式 */
.sanWeibox {
    display: none;
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 1001;
}

.sanWeibox[class*="sanWeibox"] {
    display: block;
}
</style>