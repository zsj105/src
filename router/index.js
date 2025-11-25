import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCurrentUserPermissions } from '../services/utils.js'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login/LoginPage.vue'), // 登录页面
      meta: {
        title: '用户登录',
        public: true, // 标记为公共路由，不需要认证
        isFullScreenLayout: true,
      },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HelloWelcome.vue'),
      meta: { title: '首页' },
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import('../views/Product/ProductUpload.vue'),
      meta: { title: '商品导入', requiredPermission: 'P004' },
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/Product/ProductSearch.vue'),
      meta: { title: '商品列表', requiredPermission: 'P003' },
    },
    {
      path: '/user/roles',
      name: 'user-roles',
      component: () => import('../views/User/RoleManagement.vue'),
      meta: { title: '角色管理', requiredPermission: 'P001' },
    },
    {
      path: '/user/auth',
      name: 'user-auth',
      component: () => import('../views/User/UserAuthorization.vue'),
      meta: { title: '用户授权', requiredPermission: 'P002' },
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('../views/NotFound.vue'),
      meta: {
        title: '403 - 权限不足',
        isFullScreenLayout: true,
      },
    },
    {
      path: '/404',
      name: 'not-found',
      component: () => import('../views/NotFound.vue'), // 请确保创建此文件
      meta: {
        title: '404 - 页面未找到',
        isFullScreenLayout: true, // 404 页面通常不需要主布局
      },
    },
    // 捕获所有未匹配路由，并重定向到首页或 404
    {
      path: '/:catchAll(.*)',
      redirect: '/404', // 或 '/404'
    },
  ],
})

router.beforeEach((to, from, next) => {
  const requiresAuth = !to.meta.public

  // 检查是否存在 Token
  const isAuthenticated = localStorage.getItem('accessToken')

  if (requiresAuth && !isAuthenticated) {
    // 如果需要认证但用户未登录，跳转到登录页，并带上当前路由作为重定向参数
    const redirectUrl = encodeURIComponent(to.fullPath)
    next(`/login?redirect=${redirectUrl}`)
  } else if (to.name === 'login' && isAuthenticated) {
    // 如果用户已登录，但访问登录页，则重定向到首页
    next('/')
  }
  const requiredPermission = to.meta.requiredPermission

  if (requiredPermission && isAuthenticated) {
    // ⚡️ 核心修正：直接从 Token 解析权限
    const userPermissions = getCurrentUserPermissions()

    // 检查用户是否拥有此权限 (或是否为超级管理员 'ADMIN')
    if (userPermissions.includes(requiredPermission) || userPermissions.includes('admin')) {
      next() // 拥有权限，放行
    } else {
      // 权限不足
      ElMessage.error('权限不足，无法访问该页面。')
      next('/403')
    }
  } else {
    // 3. 正常放行：不需要认证或不需要权限的路由
    next()
  }
})
export default router
