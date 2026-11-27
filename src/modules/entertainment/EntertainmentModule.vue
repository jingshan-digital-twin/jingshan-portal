<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { ENTERTAINMENT_ITEMS } from '../../mock/data'
import { CINEMA_MOVIES } from '../../mock/details'
import { usePortalStore } from '../../store/usePortalStore'

const { openPhoto, openCinemaDetail, openNavigation } = usePortalStore()
const PAGE_SIZE = 4
const entTab = ref<'全部' | '农庄' | '采摘' | '亲子' | '康养' | 'KTV/电影'>('全部')
const entKeyword = ref('')
const entPage = ref(1)

function openEntDetail(e: (typeof ENTERTAINMENT_ITEMS)[number]) {
  if (e.id === 'ent-6') {
    openCinemaDetail()
    return
  }
  openPhoto({
    title: e.name,
    category: `${e.cat} · 点位详情`,
    photo: e.photo,
    rating: e.rating,
    subtitle: `${e.dist} ｜ ${e.desc}`,
    intro: e.intro,
    openHours: e.openHours,
    priceInfo: e.price,
    distance: e.dist,
    driveMin: e.driveMin,
    address: e.address,
    lng: e.lng,
    lat: e.lat,
    actionKind: 'entertainment',
    tags: e.tags,
    hotItemsTitle: '🔥 热门必体验项目与消费参考',
    hotItems: e.hotItems,
    reviews: e.detailedReviews.length ? e.detailedReviews : [e.quote],
  })
}

const visibleItems = computed(() => {
  const q = entKeyword.value.trim().toLowerCase()
  return ENTERTAINMENT_ITEMS.filter((i) => {
    const okTab = entTab.value === '全部' || i.catKey === entTab.value
    const okQ = !q || i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.address.toLowerCase().includes(q)
    return okTab && okQ
  })
})

const pagedItems = computed(() => {
  const start = (entPage.value - 1) * PAGE_SIZE
  return visibleItems.value.slice(start, start + PAGE_SIZE)
})

watch(visibleItems, () => {
  entPage.value = 1
})
</script>

<template>
  <section>
    <div class="module-toolbar">
      <div class="mh-tabs">
        <button
          v-for="t in (['全部', '农庄', '采摘', '亲子', '康养', 'KTV/电影'] as const)"
          :key="t"
          class="m-tab"
          :class="{ active: entTab === t }"
          @click="entTab = t"
        >
          {{ t === '全部' ? '全部娱乐(6大类)' : t }}
        </button>
      </div>
    </div>

    <div class="card card-pad mb-16 filter-workbench flex-between">
      <div class="search-bar" style="width: 340px; height: 40px">
        <span>🔍</span>
        <input v-model="entKeyword" type="text" placeholder="搜索天沐温泉、农庄、采摘、影城…" />
        <button v-if="entKeyword" class="btn-ghost" style="padding: 2px 8px; font-size: 12px" @click="entKeyword = ''">✕</button>
      </div>
      <span style="font-size: 14px; font-weight: 800; color: var(--primary)">
        共找到 {{ visibleItems.length }} 处休闲娱乐点位
      </span>
    </div>

    <div class="grid-2">
      <div
        v-for="e in pagedItems"
        :key="e.id"
        class="card"
        :style="e.id === 'ent-6' ? 'border: 2px solid #6f42c1' : ''"
      >
        <div
          class="photo-box"
          style="height: 172px"
          @click="openEntDetail(e)"
        >
          <img :src="e.photo" :alt="e.name" />
          <span class="badge-tl" :style="e.id === 'ent-6' ? 'background: #6f42c1' : ''">{{ e.cat }} · {{ e.dist }}</span>
        </div>
        <div class="card-pad">
          <div class="flex-between" style="margin-bottom: 6px">
            <strong
              style="font-size: 17.5px; cursor: pointer"
              @click="openEntDetail(e)"
            >
              {{ e.name }}
            </strong>
            <span class="rating-pill">★ {{ e.rating }}</span>
          </div>

          <div class="coord-bar">
            <span>📍 {{ e.address }}</span>
          </div>

          <div style="font-size: 14px; color: var(--ink-2); margin: 8px 0">{{ e.desc }}</div>

          <div
            v-if="e.id === 'ent-6'"
            style="background: #f6f1fc; border: 1px solid #dfd1f5; border-radius: 0; padding: 9px 12px; font-size: 13.5px; color: #4b238a; margin: 10px 0; cursor: pointer"
            @click="openCinemaDetail()"
          >
            <strong>🎬 今日热映：</strong>{{ CINEMA_MOVIES.map((m) => `《${m.title}》`).join(' / ') }}
          </div>

          <div class="flex-between" style="margin-top: 14px">
            <span class="price" style="font-size: 20px">{{ e.price }}</span>
            <div class="flex-row" style="gap: 8px">
              <button
                v-if="e.id === 'ent-6'"
                class="btn-orange"
                @click="openCinemaDetail()"
              >
                🎬 排片与选座
              </button>
              <button
                v-else
                class="btn-ghost"
                @click="openEntDetail(e)"
              >
                详情与预约
              </button>
              <button
                class="btn-primary"
                @click="
                  openNavigation({
                    placeName: e.name,
                    address: e.address,
                    lng: e.lng,
                    lat: e.lat,
                    distance: e.dist,
                    driveMin: e.driveMin,
                    tip: '支持高德/百度地图一键唤起导航，目的地周边均配有便捷停车位',
                  })
                "
              >
                🧭 导航
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <PaginationBar
      :total="visibleItems.length"
      :page="entPage"
      :page-size="PAGE_SIZE"
      unit="处点位"
      @update:page="entPage = $event"
    />
  </section>
</template>
