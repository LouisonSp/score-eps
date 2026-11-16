import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/class/:classId',
      name: 'class',
      component: () => import('../views/ClassView.vue'),
    },
    {
      path: '/class/:classId/ranking',
      name: 'ranking',
      component: () => import('../views/RankingView.vue'),
    },
    {
      path: '/session/:sessionId',
      name: 'session',
      component: () => import('../views/SessionView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
