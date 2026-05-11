<template>
    <div>
        <TopNav />
        <main>
            <!-- <div class="title">
                <div class="title1">嘉应学院</div>
                <div class="title2">智慧校园</div>
            </div> -->
            <div class="videobox">
                <video src='../assets/”嘉应学院数字孪生智慧校园“底图.mp4' loop autoplay muted></video>
            </div>
        </main>
    </div>
    <button class="login-btn" @click="goToLogin">立即登录</button>
</template>

<script setup>
import TopNav from '../components/TopNav.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const goToLogin = () => {
  router.push('/login') 
}
</script>

<style scoped>
main {
  padding-top: 60px; /* 根据导航栏高度调整 */
}

.title {
    position: relative;
}

.login-btn {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20px 40px;
    font-size: 24px;
    z-index: 1000;
}

.login-btn:hover {
    transform: translate(-50%, -50%) scale(1.05);
}
.videobox video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

</style>