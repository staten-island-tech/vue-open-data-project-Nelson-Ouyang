import { createRouter, createWebHistory } from 'vue-router'
import cards from '@/views/cards.vue'
import information from '@/views/information.vue'
import ScatterPlot from '@/views/ScatterPlot.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: cards,
    },
    {
      path: '/info/:id',
      name: 'information',
      component: information,
    },
    {
      path: '/scatterplot',
      name: 'scatterplot',
      component: ScatterPlot,
    },
  ],
})

export default router
