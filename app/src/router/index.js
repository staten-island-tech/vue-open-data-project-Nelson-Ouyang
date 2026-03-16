import { createRouter, createWebHistory } from 'vue-router'
import CookieClicker from '@/views/CookieClicker.vue'
import PokemonData from '@/views/PokemonData.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: CookieClicker,
    },
    {
      path: '/pkmn/:id',
      name: 'pkmn',
      component: PokemonData,
    },
  ],
})

export default router
