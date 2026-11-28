<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { ENTERTAINMENT_ITEMS } from '../../mock/data'
import { CINEMA_MOVIES } from '../../mock/details'
import { usePortalStore } from '../../store/usePortalStore'

const { openPhoto, openCinemaDetail, openNavigation } = usePortalStore()
const PAGE_SIZE = 8
const entCategory = ref<'全部' | '农庄' | '采摘' | '亲子' | '康养' | 'KTV/电影'>('全部')
const entScene = ref<'全部' | '亲子家庭' | '赛后放松' | '好友聚会'>('全部')
const entBudget = ref<'全部' | '80以下' | '80-150' | '150以上'>('全部')
const entSort = ref<'default' | 'rating' | 'price'>('default')
const entKeyword = ref('')
const entPage = ref(1)

function parsePriceNum(priceText: string): number {
  const m = priceText.replace(/,/g, '').match(/(\d+)/)
  return m ? Number(m[1]) : 0
}

function resetEntFilters() {
  entKeyword.value = ''
  entCategory.value = '全部'
  entScene.value = '全部'
  entBudget.value = '全部'
  entSort.value = 'default'
}

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
  const list = ENTERTAINMENT_ITEMS.filter((i) => {
    const okCat = entCategory.value === '全部' || i.catKey === entCategory.value
    const okQ =
      !q ||
      i.name.toLowerCase().includes(q) ||
      i.desc.toLowerCase().includes(q) ||
      i.address.toLowerCase().includes(q) ||
      i.cat.toLowerCase().includes(q)
    const okScene =
      entScene.value === '全部' ||
      (entScene.value === '亲子家庭' && (i.catKey === '亲子' || i.catKey === '采摘' || /亲子|儿童|家庭/.test(i.desc + i.intro))) ||
      (entScene.value === '赛后放松' && (i.catKey === '康养' || i.catKey === 'KTV/电影' || /温泉|放松|观影/.test(i.desc + i.intro))) ||
      (entScene.value === '好友聚会' && (i.catKey === '农庄' || i.catKey === 'KTV/电影' || /烧烤|聚会|垂钓|农庄/.test(i.desc + i.intro)))
    const pNum = parsePriceNum(i.price)
    const okBudget =
      entBudget.value === '全部' ||
      (entBudget.value === '80以下' && pNum < 80) ||
      (entBudget.value === '80-150' && pNum >= 80 && pNum <= 150) ||
      (entBudget.value === '150以上' && pNum > 150)
    return okCat && okQ && okScene && okBudget
  })
  return [...list].sort((a, b) => {
    if (entSort.value === 'rating') return b.rating - a.rating
    if (entSort.value === 'price') return parsePriceNum(a.price) - parsePriceNum(b.price)
    return 0
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
    <div class="card card-pad mb-16 filter-workbench">
      <div class="dd-filter-top">
        <div class="search-bar" style="flex: 1; min-width: 240px; max-width: 420px; height: 42px; border-radius: 6px">
          <span>🔍</span>
          <input v-model="entKeyword" type="text" placeholder="搜索天沐温泉、农庄、采摘、亲子、影城…" />
          <button v-if="entKeyword" class="btn-ghost" style="padding: 3px 9px; font-size: 12.5px" @click="entKeyword = ''">清空</button>
        </div>
        <div class="flex-row" style="gap: 10px">
          <button class="btn-ghost" style="border-radius: 6px" @click="resetEntFilters">重置筛选</button>
          <span class="dd-count-pill">共找到 {{ visibleItems.length }} 处休闲娱乐点位</span>
        </div>
      </div>

      <div class="dd-filter-grid cols-4">
        <label class="dd-field">
          <span class="dd-field-label">娱乐分类</span>
          <select v-model="entCategory" class="dd-select" :class="{ active: entCategory !== '全部' }">
            <option value="全部">全部分类</option>
            <option value="农庄">农庄</option>
            <option value="采摘">采摘</option>
            <option value="亲子">亲子</option>
            <option value="康养">康养 / 温泉</option>
            <option value="KTV/电影">KTV / 电影</option>
          </select>
        </label>

        <label class="dd-field">
          <span class="dd-field-label">适用场景</span>
          <select v-model="entScene" class="dd-select" :class="{ active: entScene !== '全部' }">
            <option value="全部">不限场景</option>
            <option value="亲子家庭">亲子家庭</option>
            <option value="赛后放松">赛后放松</option>
            <option value="好友聚会">好友聚会</option>
          </select>
        </label>

        <label class="dd-field">
          <span class="dd-field-label">消费预算</span>
          <select v-model="entBudget" class="dd-select" :class="{ active: entBudget !== '全部' }">
            <option value="全部">全部预算</option>
            <option value="80以下">¥80 以下</option>
            <option value="80-150">¥80 – ¥150</option>
            <option value="150以上">¥150 以上</option>
          </select>
        </label>

        <label class="dd-field">
          <span class="dd-field-label">排序方式</span>
          <select v-model="entSort" class="dd-select">
            <option value="default">综合推荐</option>
            <option value="rating">按评分最高</option>
            <option value="price">按价格最低</option>
          </select>
        </label>
      </div>
    </div>

    <div v-if="pagedItems.length === 0" class="card card-pad" style="text-align: center; padding: 40px 20px">
      <strong style="font-size: 16px; display: block; margin-bottom: 10px">当前筛选条件下暂无匹配的休闲娱乐点位</strong>
      <button class="btn-primary" @click="resetEntFilters">重置全部筛选</button>
    </div>

    <div v-else style="display: flex; flex-direction: column; gap: 12px">
      <div
        v-for="e in pagedItems"
        :key="e.id"
        class="card"
        style="display: grid; grid-template-columns: 256px 1fr; overflow: hidden"
        :style="e.id === 'ent-6' ? 'border: 2px solid #6f42c1' : ''"
      >
        <div
          class="photo-box"
          style="height: 100%; min-height: 176px"
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
