import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainLayout from '../layout/MainLayout.vue'
import AppManageView from '../views/AppManageView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      component: MainLayout,
      redirect: '/app-manage',
      children: [
        {
          path: 'app-manage',
          name: 'AppManage',
          component: AppManageView,
          meta: { title: '应用管理' }
        },
        // 占位路由，后续可以补充
        {
          path: 'perm-manage',
          name: 'PermManage',
          component: () => import('../views/AppManageView.vue'), // 暂时复用
          meta: { title: '权限管理' }
        },
        {
          path: 'role-manage',
          name: 'RoleManage',
          component: () => import('../views/AppManageView.vue'), // 暂时复用
          meta: { title: '角色与授权' }
        },
        {
          path: 'audit-log',
          name: 'AuditLog',
          component: () => import('../views/AppManageView.vue'), // 暂时复用
          meta: { title: '审计日志' }
        }
      ]
    }
  ],
})

// 路由守卫：检查是否已登录
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.name !== 'login' && !token) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router
