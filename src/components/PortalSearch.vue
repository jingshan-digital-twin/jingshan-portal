<script setup lang="ts">
import { computed, ref } from 'vue'
import { HOTEL_PROFILES, PRODUCT_CATALOG } from '../mock/details'
import { restaurants, restaurantDetail } from '../mock/restaurants'
import { TOUR_SPOTS } from '../mock/tourData'
import { getOpenTournamentOptions } from '../mock/tournamentRegistration'
import { usePortalStore } from '../store/usePortalStore'
import type { ModuleId } from '../types/portal'

const portal = usePortalStore()
const dialog = ref<HTMLDialogElement>()
const query = ref('')
const channels: [string, ModuleId, string, string?][] = [
  ['预订球场', 2, '订场 硬地 红土 室内'], ['同城约球', 2, '球友 陪练', 'matchmaking'],
  ['赛事比分', 2, '赛况 比赛', 'scores'], ['旅游线路', 3, '游览 行程'],
  ['美食餐厅', 4, '吃饭 菜单 订座'], ['住宿', 5, '酒店 公寓 民宿 购房补贴'],
  ['交通出行', 6, '打车 公交 充电 停车 限行'], ['特色商品', 7, '商城 购物 特产'],
  ['休闲娱乐', 8, '采摘 农庄'], ['培训研学', 9, '课程 教练 网校'],
  ['点评投诉', 11, '反馈 12345'], ['小程序', 12, '政务'], ['个人中心', 13, '订单 票根 积分 收藏'],
]

const entries = computed(() => [
  ...channels.map(([name, id, terms, tab]) => ({
    name, group: '服务', terms, open: () => portal.switchModule(id, tab ? { tab } : undefined),
  })),
  ...portal.state.courts.map(v => ({ name: v.name, group: '球场', terms: v.address + v.surfaces.join(' '), open: () => portal.openVenueDetail(v.id) })),
  ...HOTEL_PROFILES.map(h => ({ name: h.name, group: '酒店', terms: h.address + h.category, open: () => portal.openHotelDetail(h.id) })),
  ...restaurants.map(r => ({ name: r.name, group: '美食', terms: r.dishes.join(' '), open: () => portal.openPhoto(restaurantDetail(r)) })),
  ...TOUR_SPOTS.map(s => ({ name: s.name, group: '景点', terms: s.tags.join(' '), open: () => portal.openTourSpotDetail(s) })),
  ...PRODUCT_CATALOG.map(p => ({ name: p.name, group: '商品', terms: '', open: () => portal.openProductDetail(p.id) })),
  ...getOpenTournamentOptions(portal.state.orders).map(({ event }) => ({ name: event.name, group: '赛事', terms: '报名 ' + event.venue, open: () => portal.openTournamentRegistration(event.id) })),
  { name: '京山国际影城', group: '娱乐', terms: '电影院 排片 选座', open: portal.openCinemaDetail },
])

const results = computed(() => {
  const words = query.value.trim().toLowerCase().replace(/(酒店|球场|餐厅|民宿|赛事|景点)/g, ' $1 ').trim().split(/\s+/)
  return entries.value.filter(item => words.every(word => (item.name + ' ' + item.group + ' ' + item.terms).toLowerCase().includes(word)))
})

function search() {
  if (query.value.trim() && !dialog.value?.open) dialog.value?.showModal()
}
function select(open: () => void) {
  dialog.value?.close()
  open()
}
</script>

<template>
  <form class="search-bar" role="search" @submit.prevent="search">
    <input v-model="query" type="search" required aria-label="搜索地点或服务" placeholder="搜索球场、酒店、美食…" />
    <button class="search-btn">搜索</button>
  </form>
  <dialog ref="dialog" class="portal-search-results" aria-labelledby="search-heading" @click.self="dialog?.close()">
    <div class="card-pad">
      <div class="flex-between">
        <h2 id="search-heading">搜索结果</h2>
        <button class="btn-ghost" @click="dialog?.close()">关闭</button>
      </div>
      <input v-model="query" type="search" class="f-input" aria-label="修改关键词" autofocus />
      <ul v-if="query.trim() && results.length">
        <li v-for="item in results" :key="item.group + item.name">
          <button @click="select(item.open)">{{ item.name }} <small>{{ item.group }}</small></button>
        </li>
      </ul>
      <p v-else role="status">{{ query.trim() ? '没有找到相关地点或服务，试试其他名称。' : '请输入地点或服务名称。' }}</p>
    </div>
  </dialog>
</template>

<style scoped>
.portal-search-results { margin: auto; width: min(540px, 92vw); max-height: 78vh; border: 0; border-radius: 12px; color: var(--ink); }
.portal-search-results::backdrop { background: rgb(0 25 18 / 45%); }
.portal-search-results h2 { font-size: 20px; }
.portal-search-results input { margin: 16px 0 8px; }
.portal-search-results ul { list-style: none; }
.portal-search-results li button { width: 100%; display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; background: white; border: 0; border-bottom: 1px solid var(--line); text-align: left; }
.portal-search-results small { white-space: nowrap; color: var(--ink-2); }
</style>
