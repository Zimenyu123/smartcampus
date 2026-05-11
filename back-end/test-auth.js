// 完整的认证测试脚本
const axios = require('axios')

const BASE_URL = 'http://localhost:7001/api'

async function testAuth() {
  try {
    console.log('=== 测试注册 ===')
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      username: 'testuser001',
      password: '123456',
      type: 'student',
    })
    console.log('注册成功:', registerResponse.data)

    console.log('\n=== 测试登录 ===')
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testuser001',
      password: '123456',
    })
    console.log('登录成功:', loginResponse.data)

    const token = loginResponse.data.accessToken
    console.log('Token:', token)

    console.log('\n=== 测试获取用户信息 ===')
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    console.log('获取用户信息成功:', profileResponse.data)
  }
  catch (error) {
    console.error('错误:', error.response?.data || error.message)
    if (error.response) {
      console.error('状态码:', error.response.status)
      console.error('响应头:', error.response.headers)
    }
  }
}

testAuth()
