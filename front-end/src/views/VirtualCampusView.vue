<template>
    <div class="virtual-campus-container">
        <!-- 修正为绝对路径 -->
        <iframe src="/三维嘉应学院展示(新)/index.html" frameborder="0" class="full-iframe"></iframe>
        <button class="back-home-btn" @click="goToHome">回到首页</button>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToHome = () => {
  router.push('/')
}
</script>

<style scoped>
.virtual-campus-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
}

.full-iframe {
    width: 100%;
    height: 100%;
}

.back-home-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    background-color: #2196F3;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    z-index: 1000;
}

.back-home-btn:hover {
    background-color: #1976D2;
}
</style>