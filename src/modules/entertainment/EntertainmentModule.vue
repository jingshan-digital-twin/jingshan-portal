<script setup lang="ts">
import { computed, ref } from 'vue'
import { ENTERTAINMENT_ITEMS } from '../../mock/data'
import { CINEMA_MOVIES } from '../../mock/details'
import { usePortalStore } from '../../store/usePortalStore'

const { state, openPhoto, openNavigation, showToast } = usePortalStore()
const entTab = ref<'全部' | '农庄' | '采摘' | '亲子' | '康养' | 'KTV/电影'>('全部')

const visibleItems = computed(() =>
  entTab.value === '全部'
    ? ENTERTAINMENT_ITEMS
    : ENTERTAINMENT_ITEMS.filter((i) => i.catKey === entTab.value),
)
</script>

<template>
  <section>
    <div class="module-header">
      <div class="mh-left">
        <div class="mh-num">08</div>
        <div>
          <h1 class="mh-title">“娱”：休闲娱乐服务</h1>
          <div class="mh-desc">
            全面覆盖休闲农庄、生态采摘、亲子游乐、康养休闲、KTV、电影院六大休闲娱乐点位，每处均标明精确地址与经纬度坐标、支持导航跳转；电影院支持查看热映影片与在线选座预订
          </div>
        </div>
      </div>
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

    <div class="grid-3">
      <div
        v-for="e in visibleItems"
        :key="e.id"
        class="card"
        :style="e.id === 'ent-6' ? 'border: 2px solid #6f42c1' : ''"
      >
        <div
          class="photo-box"
          style="height: 150px"
          @click="
            e.id === 'ent-6'
              ? (state.showCinemaModal = true)
              : openPhoto({
                  title: e.name,
                  category: `${e.cat} · 点位详情`,
                  photo: e.photo,
                  rating: e.rating,
                  subtitle: `${e.dist} ｜ ${e.desc}`,
                  intro: e.intro,
                  openHours: e.openHours,
                  priceInfo: e.price,
                  address: e.address,
                  lng: e.lng,
                  lat: e.lat,
                  tags: e.tags,
                  hotItemsTitle: '🔥 热门必体验项目与消费参考',
                  hotItems: e.hotItems,
                  reviews: e.detailedReviews.length ? e.detailedReviews : [e.quote],
                })
          "
        >
          <img :src="e.photo" :alt="e.name" />
          <span class="badge-tl" :style="e.id === 'ent-6' ? 'background: #6f42c1' : ''">{{ e.cat }}</span>
          <span class="badge-bl">
            {{ e.id === 'ent-6' ? `热映 ${CINEMA_MOVIES.length} 部 · 点击看排片选座` : e.dist }}
          </span>
        </div>
        <div class="card-pad">
          <div class="flex-between">
            <strong
              style="font-size: 15px; cursor: pointer"
              @click="e.id === 'ent-6' && (state.showCinemaModal = true)"
            >
              {{ e.name }}
            </strong>
            <span class="rating-pill">★ {{ e.rating }}</span>
          </div>

          <div class="coord-bar">
            <span>📍 {{ e.address }}</span>
            <span class="coord-mono">{{ e.lng.toFixed(4) }}°E, {{ e.lat.toFixed(4) }}°N</span>
          </div>

          <div style="font-size: 11.5px; color: var(--ink-3); margin: 4px 0">{{ e.desc }}</div>

          <div
            v-if="e.id === 'ent-6'"
            style="background: #f6f1fc; border: 1px solid #dfd1f5; border-radius: 9px; padding: 7px 9px; font-size: 11px; color: #4b238a; margin: 6px 0; cursor: pointer"
            @click="state.showCinemaModal = true"
          >
            <strong>🎬 今日热映：</strong>{{ CINEMA_MOVIES.map((m) => `《${m.title}》`).join(' / ') }}
          </div>

          <div class="review-quote">💬 “{{ e.quote }}”</div>

          <div class="flex-between" style="margin-top: 10px">
            <span class="price" style="font-size: 16px">{{ e.price }}</span>
            <div class="flex-row" style="gap: 5px">
              <button
                v-if="e.id === 'ent-6'"
                class="btn-orange"
                style="padding: 6px 10px"
                @click="state.showCinemaModal = true"
              >
                🎬 影片排片与选座
              </button>
              <button
                v-else
                class="btn-ghost"
                @click="showToast(`已预约「${e.name}」，凭京山网球电子票根到店享礼遇`)"
              >
                📞 预约
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
  </section>
</template>
