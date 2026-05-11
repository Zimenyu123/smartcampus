import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isLoggedIn: false,
    userType: null,
    username: '',
    token: '',
    userInfo: null
  }),
  actions: {
    login(userType, credentials) {
      // 实际开发需对接后端API
      this.isLoggedIn = true
      this.userType = userType
      this.username = credentials.username
    },
    logout() {
      this.$reset()
      localStorage.removeItem('accessToken')
    },
    setToken(token) {
      this.token = token
      localStorage.setItem('accessToken', token)
    },
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      this.username = userInfo.username
      this.userType = userInfo.type
    }
  }
})