import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import VirtualCampusView from '../views/VirtualCampusView.vue'
import StudentDashboard from '../views/StudentDashboard.vue'  
import AdminDashboard from '../views/AdminDashboard.vue'     

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/virtual-campus',
    name: 'virtual-campus',
    component: VirtualCampusView,
    meta: {
      title: '虚拟嘉应'
    }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/student',
    name: 'student',
    component: StudentDashboard 
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminDashboard    
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 可选：动态设置页面标题
router.beforeEach((to) => {
  document.title = to.meta.title || '嘉应学院智慧校园'
})

export default router