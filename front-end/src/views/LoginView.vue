<template>
    <div class="header">
      <div class="logo">嘉应学院</div>
      <div class="nav">
        <span @click="goToCampusService">校园服务</span>
        <span @click="goToTeachingResources">教学资源</span>
        <span>实景三维</span>
        <span @click="goToVirtualCampus">虚拟嘉应</span>
        <span @click="goToHome">回到首页</span>
      </div>
    </div>
    <div class="login-container">
      <video class="video-bg" src="../assets/”嘉应学院数字孪生智慧校园“底图.mp4" loop autoplay muted></video>
      <form>
        <h1>欢迎登录</h1>
        <div class="form-item">
          <label for="account">账号:</label>
          <input type="text" id="account" v-model="account" placeholder="请输入账号">
        </div>
        <div class="form-item">
          <label for="password">密码:</label>
          <input type="password" id="password" v-model="password" placeholder="请输入密码">
        </div>
        <div class="form-item">
          <label>用户类型:</label>
          <select v-model="userType">
            <option value="student">学生端</option>
            <option value="admin">管理端</option>
          </select>
        </div>
        <button type="button" @click="login">立即登录</button>
        <div class="form-footer">
          <span @click="register">注册账号</span>
        </div>
      </form>



      <!-- 注册账号模态框 -->
      <div class="modal" v-if="registerModal">
        <div class="modal-content">
          <h3>注册账号</h3>
          <div class="form-item">
            <label for="registerAccount">账号:</label>
            <input type="text" id="registerAccount" v-model="registerAccount" placeholder="请输入账号">
          </div>
          <div class="form-item">
            <label for="registerPassword">密码:</label>
            <input type="password" id="registerPassword" v-model="registerPassword" placeholder="请输入密码">
          </div>
          <div class="form-item">
            <label>用户类型:</label>
            <select v-model="registerType">
              <option value="student">学生端</option>
              <option value="admin">管理端</option>
            </select>
          </div>
          <div class="modal-buttons">
            <button @click="registerModal = false">取消</button>
            <button @click="submitRegister">立即注册</button>
          </div>
        </div>
      </div>
    </div>
</template>

  <script setup>
  import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import api from '@/utils/api'
const authStore = useAuthStore()
  
  const router = useRouter()
  const account = ref('')
  const password = ref('')
  const userType = ref('student')
  // 模态框状态
  const registerModal = ref(false)
  // 注册表单数据
  const registerAccount = ref('')
  const registerPassword = ref('')
  const registerType = ref('student')
  
  const goToHome = () => {
  router.push('/')
}

const goToCampusService = () => {
  window.open('https://www.jyu.edu.cn/zsbs.htm', '_blank')
}

const goToTeachingResources = () => {
  window.open('https://www.jyu.edu.cn/xxgk.htm', '_blank')
}

const goToVirtualCampus = () => {
  router.push('/virtual-campus')
}

// 移除了实景三维的下拉菜单功能，相关状态已删除

const login = async () => {
  // 表单验证
  if (!account.value || !password.value) {
    alert('请输入账号和密码')
    return
  }

  try {
    const data = await api.post('/auth/login', {
      username: account.value,
      password: password.value
    });

    console.log('Login response data:', data);
    if (data.code === 200 && data.data && data.data.accessToken) {
      const accessToken = data.data.accessToken;
      authStore.setToken(accessToken);
      authStore.setUserInfo(data.data.user);
      authStore.isLoggedIn = true;
      console.log('Login successful, token set:', authStore.token);

      // 根据用户类型跳转
      if (authStore.userType === 'admin' || userType.value === 'admin') {
        await router.push('/admin');
      } else {
        await router.push('/student');
      }
    } else {
      console.error('Login successful but accessToken is missing in response');
      alert('登录成功但未获取到令牌');
    }
  } catch (error) {
    console.error('登录错误:', error);
    alert(error.message || '登录失败');
  }
  }



  // 注册账号方法
  const register = () => {
    registerModal.value = true
  }

  // 发送注册验证码
  const sendRegisterVerifyCode = () => {
    if (!registerPhone.value) {
      alert('请输入手机号')
      return
    }
    // 这里应该调用发送验证码的API
    console.log('发送注册验证码到手机:', registerPhone.value)
    alert('注册验证码已发送，请注意查收')
  }

  // 提交注册
const submitRegister = async () => {
  // 前端字段验证
  if (!registerAccount.value || !registerPassword.value || !registerType.value) {
    alert('用户名、密码和用户类型为必填项');
    return;
  }

  try {
    const response = await fetch('http://localhost:7001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: registerAccount.value,
        password: registerPassword.value,
        type: userType.value // 使用选择的用户类型
      })
    });

    const data = await response.json();
    if (response.ok) {
      alert(`注册成功`);
      registerModal.value = false;
      // 自动填充登录表单
      account.value = registerAccount.value;
      password.value = registerPassword.value;
    } else {
      throw new Error(data.message || '注册失败');
    }
  } catch (error) {
    console.error('注册错误:', error);
    alert(error.message);
  }
}
</script>
  
  <style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 30px;
    background-color: rgba(255, 255, 255, 0.8);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
}

/* 按钮样式 */
.button {
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 4px;
    transition: all 0.3s;
}

.button:hover {
    background: #f5f5f5;
}

.logo {
    font-size: 20px;
    font-weight: bold;
    color: #333;
}

.nav {
    display: flex;
    gap: 30px;
}

.nav span {
    color: #333;
    cursor: pointer;
}

.login-container {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    min-height: 100vh;
    padding: 0 100px;
    box-sizing: border-box;
    position: relative;
}

.video-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -1;
}

form {
    width: 400px;
    padding: 40px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    opacity: 0.95;
}

form {
    width: 400px;
    padding: 40px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

h1 {
    text-align: center;
    margin-bottom: 40px;
    color: #2c3e50;
    font-size: 28px;
}

.form-item {
    margin-bottom: 25px;
}

label {
    display: block;
    margin-bottom: 8px;
    color: #606266;
    font-size: 14px;
    font-weight: 500;
}

input, select {
    width: 100%;
    height: 44px;
    padding: 0 15px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.3s;
}

input:focus, select:focus {
    border-color: #1890ff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(24,144,255,.1);
}

button {
    width: 100%;
    height: 44px;
    background-color: #1890ff;
    color: white;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.3s;
    border: none;
    cursor: pointer;
}

button:hover {
    background-color: #40a9ff;
    transform: translateY(-1px);
}

.form-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
    font-size: 14px;
    color: #1890ff;
}

.form-footer span {
    cursor: pointer;
}

button:hover {
    background-color: #66b1ff;
    transform: translateY(-1px);
}

/* 模态框样式 */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    padding: 30px;
    border-radius: 12px;
    width: 400px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.verify-code-container {
    display: flex;
    gap: 10px;
}

.verify-code-btn {
    width: auto;
    padding: 0 15px;
    height: 44px;
    font-size: 14px;
}

.modal-buttons {
    display: flex;
    gap: 15px;
    margin-top: 20px;
}

.modal-buttons button {
    flex: 1;
}

.modal-buttons button:first-child {
    background-color: #f5f5f5;
    color: #333;
}

.modal-buttons button:first-child:hover {
    background-color: #e8e8e8;
}
</style>