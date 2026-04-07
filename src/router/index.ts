import {createWebHashHistory, createRouter} from 'vue-router'

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

export default router;
