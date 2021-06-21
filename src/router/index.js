import { createRouter, createWebHistory } from 'vue-router'
import PersonChoice from '../views/PersonChoice.vue'

const routes = [
  {
    path: '/',
    name: 'PersonChoice',
    component: PersonChoice
  },
  {
    path: '/formation',
    name: 'CreateFormation',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/CreateFormation.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
