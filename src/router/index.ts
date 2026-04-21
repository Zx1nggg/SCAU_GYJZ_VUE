import {createWebHashHistory, createRouter} from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('../pages/HomePage.vue')
    },
    {
        path: '/donorLogin',
        name: 'donorLogin',
        component: () => import('../pages/donor/auth/donorLoginPage.vue')
    },
    {
        path: '/adminLogin',
        name: 'adminLogin',
        component: () => import('../pages/admin/auth/adminLoginPage.vue')
    },
    {
        path: '/donorRegister',
        name: 'donorRegister',
        component: () => import('../pages/donor/auth/donorRegisterPage.vue')
    },
    {
        path: '/adminRegister',
        name: 'adminRegister',
        component: () => import('../pages/admin/auth/adminRegisterPage.vue')
    },
    {
        path: '/admin/main',
        name: 'adminMain',
        component: () => import('../pages/admin/auth/adminLayoutPage.vue'),
       children: [
         {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../pages/admin/auth/adminDashboardPage.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'projects',
        name: 'ProjectList',
        component: () => import('../pages/admin/projects/ProjectList.vue'),
        meta: { title: '项目列表' }
      },
      {
        path: 'donations',
        name: 'DonationList',
        component: () => import('../pages/admin/donations/DonationList.vue'),
        meta: { title: '捐赠记录' }
      },
       {
            path: 'reports',
            name: 'orgReports',
            component: () => import('../pages/admin/organizations/Reports.vue')
        },
        {
            path: 'settings',
            name: 'Setting',
            component: () => import('../pages/admin/auth/Setting.vue')
        }

       ]
    },
    {
        path: '/donor/main',
        name: 'donorMain',
        component: () => import('../pages/donor/auth/donorLayoutPage.vue'),
       children: [
        {
        path: 'dashboard',
        name: 'DonorDashboard',
        component: () => import('../pages/donor/auth/DonorDashboardPage.vue'),
        meta: { title: '仪表盘' }
        },
        {
            path: 'projects',
            name: 'viewProjectList',
            component: () => import('../pages/donor/projects/viewProjectList.vue'),
            meta: { title: '公益项目' }
        },
        {
            path: 'profile',
            name: 'donorProfile',
            component: () => import('../pages/donor/auth/donorProfile.vue')
        },
        {
            path: 'records',
            name: 'myDonations',
            component: () => import('../pages/donor/donations/myDonationsPage.vue')
        },
        {
            path: 'subscriptions',
            name: 'mySubscriptions',
            component: () => import('../pages/donor/subscriptions/MySubscriptionsPage.vue')
        }
       ]
    },
    {
        path: '/sadmin/main',
        name: 'sadminMain',
        component: () => import('../pages/sadmin/auth/sadminLayoutPage.vue'),
       children: [
        {
        path: 'super-dashboard',
        name: 'SAdminDashboard',
        component: () => import('../pages/sadmin/auth/sadminDashboardPage.vue'),
        meta: { title: '仪表盘' }
        },
        {
            path: 'applications',
            name: 'OrgApplications',
            component: () => import('../pages/sadmin/applications/ApplicationManagement.vue'),
            meta: { title: '申请处理' }
        },
        {
            path: 'users',
            name: 'UserManagement',
            component: () => import('../pages/sadmin/users/UserManagement.vue'),
            meta: { title: '用户管理' }
            
        }
       ]
    }
]
const router = createRouter({
    history: createWebHashHistory(),
    routes
})
router.beforeEach((to, _from, next) => {
    
    const authStore = useAuthStore()

    // 1. 精准锁定需要保护的区域 (避开 Login 和 Register 页面)
    const isAdminSecuredRoute = to.path.startsWith('/admin/main') || to.path.startsWith('/sadmin/main')
    
    // 只有以 /donor/main 开头的才是捐赠人登录后才能看的界面
    const isDonorSecuredRoute = to.path.startsWith('/donor/main')

    if (isAdminSecuredRoute) {
        if (!authStore.isLoggedIn) {
            ElMessage.warning('请先登录管理员账号')
            return next('/adminLogin') 
        }
        if (!authStore.isAdmin) {
            ElMessage.error('越权拦截：您的身份无法访问管理后台！')
            return next('/donor/main/dashboard') 
        }
    }

   
    if (isDonorSecuredRoute) {
        if (!authStore.isLoggedIn) {
            ElMessage.warning('请先登录账号')
            return next('/donorLogin') 
        }
        if (!authStore.isDonor) {
            ElMessage.error(' 越权拦截：管理员无需访问捐赠前端！')
            return next('/admin/main/dashboard') 
        }
    }

    
    const isAuthPage = ['donorLogin', 'adminLogin', 'donorRegister', 'adminRegister'].includes(to.name as string)
    if (isAuthPage && authStore.isLoggedIn) {
        ElMessage.info('您已登录，无需重复操作')
        if (authStore.isAdmin) {
            return next(authStore.isSuperAdmin ? '/sadmin/main/super-dashboard' : '/admin/main/dashboard')
        } else {
            return next('/donor/main/dashboard')
        }
    }
    next()
})


export default router;
