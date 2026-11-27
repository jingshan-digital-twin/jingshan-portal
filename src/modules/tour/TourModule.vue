<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { BOOKING_DATES } from '../../mock/schedules'
import {
  OUTDOOR_TRAILS,
  TENNIS_BUS_LINES,
  TOUR_ITINERARY_PLANS,
  TOUR_PACKAGES,
  TOUR_SPOTS,
  type TourSpotCategory,
} from '../../mock/tourData'
import { usePortalStore } from '../../store/usePortalStore'

const { openPhoto, openActionModal, openNavigation, createQuickOrder, toggleFavorite } = usePortalStore()

// 模块顶部主视图切换
const tourTabs = [
  { id: 'scenic', label: '景区门票' },
  { id: 'rural', label: '乡村景点' },
  { id: 'trendy', label: '热门打卡' },
  { id: 'spots', label: '全部景点' },
  { id: 'packages', label: '文旅套餐' },
  { id: 'audio', label: '语音导览' },
  { id: 'lines', label: '文旅线路' },
] as const
const activeSection = ref<(typeof tourTabs)[number]['id'] | 'all'>('scenic')

// 1. 景区 / 乡村 / 网红 / 夜市 筛选、搜索与分页（每页4项）
const PAGE_SIZE = 4
const spotCategory = ref<TourSpotCategory | '全部'>('全部')
const spotKeyword = ref('')
const spotPage = ref(1)
const visitDate = ref(BOOKING_DATES[0]!.iso)
const visitSlot = ref<'上午 08:30-12:00' | '下午 13:00-17:00' | '夜游 17:30-22:00'>('下午 13:00-17:00')

const activeCategory = computed<TourSpotCategory | '全部'>(() => {
  if (activeSection.value === 'scenic') return '景区'
  if (activeSection.value === 'rural') return '乡村景点'
  if (activeSection.value === 'trendy') return '网红打卡点'
  return spotCategory.value
})

const sectionTitle = computed(() => {
  if (activeSection.value === 'scenic') return '🏔️ 景区门票与电子导览'
  if (activeSection.value === 'rural') return '🏡 乡村景点与田园体验'
  if (activeSection.value === 'trendy') return '📸 网红打卡点'
  return '🏔️ 热门景区与打卡点'
})

const visibleSpots = computed(() => {
  const q = spotKeyword.value.trim().toLowerCase()
  return TOUR_SPOTS.filter((s) => {
    const okCat = activeCategory.value === '全部' || s.category === activeCategory.value
    const okQ = !q || s.name.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q))
    return okCat && okQ
  })
})

const pagedSpots = computed(() => {
  const start = (spotPage.value - 1) * PAGE_SIZE
  return visibleSpots.value.slice(start, start + PAGE_SIZE)
})

watch([activeSection, spotCategory, spotKeyword], () => {
  spotPage.value = 1
})

const activePlanId = ref<'half' | 'weekend' | 'deep'>('weekend')
const activePlan = computed(
  () => TOUR_ITINERARY_PLANS.find((p) => p.id === activePlanId.value) ?? TOUR_ITINERARY_PLANS[1]!,
)

const visitDateLabel = computed(
  () => BOOKING_DATES.find((d) => d.iso === visitDate.value)?.shortDate ?? visitDate.value,
)

function bookSpotTicket(spot: (typeof TOUR_SPOTS)[number]) {
  createQuickOrder(
    '门票',
    `${spot.name}（1份）`,
    `${visitDateLabel.value} ${visitSlot.value} · ${spot.duration} · 票根专享价`,
    spot.stubPrice,
    spot.stubPrice > 0 ? 60 : 20,
  )
}

// 2. 网旅产品专区筛选、搜索与分页（每页4项）
const pkgScope = ref<'全部' | '京山本地' | '荆门周边' | '湖北省内'>('全部')
const pkgKeyword = ref('')
const pkgPage = ref(1)
const pkgDate = ref(BOOKING_DATES[1]!.iso)
const pkgPeople = ref(2)

const visiblePackages = computed(() => {
  const q = pkgKeyword.value.trim().toLowerCase()
  return TOUR_PACKAGES.filter((p) => {
    const okScope = pkgScope.value === '全部' || p.scope === pkgScope.value
    const okQ = !q || p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)
    return okScope && okQ
  })
})

const pagedPackages = computed(() => {
  const start = (pkgPage.value - 1) * PAGE_SIZE
  return visiblePackages.value.slice(start, start + PAGE_SIZE)
})

watch([pkgScope, pkgKeyword], () => {
  pkgPage.value = 1
})

function openSpotDetail(spot: (typeof TOUR_SPOTS)[number]) {
  openPhoto({
    title: spot.name,
    category: `京山${spot.category}详情`,
    photo: spot.photo,
    rating: spot.rating,
    subtitle: `${spot.badge} ｜ ${spot.duration}`,
    intro: spot.intro,
    openHours: `${spot.openHours}（推荐：${spot.bestTime}）`,
    priceInfo: spot.stubPrice === 0 ? '免费预约入园/打卡' : `票根价 ¥${spot.stubPrice}${spot.priceUnit}（原价 ¥${spot.price}）`,
    priceNum: spot.stubPrice,
    priceUnit: spot.stubPrice === 0 ? '' : ` ${spot.priceUnit}`,
    distance: spot.distance,
    driveMin: spot.driveMin,
    audioScript: spot.audioScript,
    audioDuration: spot.duration,
    address: spot.address,
    lng: spot.lng,
    lat: spot.lat,
    actionKind: 'spot',
    tags: spot.tags,
    hotItemsTitle: '✨ 必体验亮点与消费推荐',
    hotItems: spot.hotItems,
    reviews: spot.reviews,
  })
}

function openPackageDetail(pkg: (typeof TOUR_PACKAGES)[number]) {
  openPhoto({
    title: pkg.title,
    category: `网旅套餐 · ${pkg.scope}`,
    photo: pkg.photo,
    rating: pkg.rating,
    subtitle: `${pkg.scope} ｜ ${pkg.duration} ｜ ${pkg.subtitle}`,
    intro: `${pkg.title}（${pkg.duration}）：${pkg.subtitle}。套餐包含：${pkg.includes.join('、')}。由京山市文旅局认证持证旅行社提供全程标准化履约保障。`,
    openHours: `天天发团 · ${pkg.duration}`,
    priceInfo: `¥${pkg.price}/人起`,
    priceNum: pkg.price,
    priceUnit: ' / 人起',
    distance: pkg.scope,
    driveMin: pkg.duration,
    address: pkg.address,
    lng: pkg.lng,
    lat: pkg.lat,
    actionKind: 'package',
    tags: pkg.includes,
    highlights: pkg.highlights,
    hotItemsTitle: '✨ 套餐核心权益与行程亮点',
    hotItems: pkg.highlights.map((h, i) => ({
      name: `行程亮点 ${i + 1}`,
      tag: '已含在套餐内',
      desc: h,
    })),
    reviews: [],
  })
}

function bookTourPackage(pkg: (typeof TOUR_PACKAGES)[number]) {
  const dLabel = BOOKING_DATES.find((d) => d.iso === pkgDate.value)?.shortDate ?? pkgDate.value
  createQuickOrder(
    '门票',
    `网旅套餐：${pkg.title}`,
    `${dLabel}出发 · ${pkgPeople.value}人同行 · ${pkg.duration} · 持证社保障`,
    pkg.price * pkgPeople.value,
    180,
  )
}

// 4. 网球文旅专线 & 骑行徒步
const busDate = ref(BOOKING_DATES[0]!.shortDate)
const busDepartTime = ref('09:30')
const trailFilter = ref<'全部' | '骑行路线' | '生态徒步'>('全部')

const visibleTrails = computed(() =>
  trailFilter.value === '全部'
    ? OUTDOOR_TRAILS
    : OUTDOOR_TRAILS.filter((t) => t.mode === trailFilter.value),
)
</script>

<template>
  <section>
    <div class="module-toolbar">
      <div class="tour-tabs" role="group" aria-label="旅游分类">
        <button
          v-for="tab in tourTabs"
          :key="tab.id"
          type="button"
          class="tour-tab"
          :aria-pressed="activeSection === tab.id"
          @click="activeSection = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- ===== 模块一：景区 · 乡村景点 · 网红打卡点 · 夜市消费场景 ===== -->
    <div v-if="['all', 'spots', 'scenic', 'rural', 'trendy'].includes(activeSection)" class="mb-24">
      <div class="card card-pad mb-16 filter-workbench">
        <div class="dd-filter-top">
          <strong style="font-size: 18px">{{ sectionTitle }}</strong>
          <span class="dd-count-pill">共 {{ visibleSpots.length }} 处景点</span>
        </div>

        <div class="dd-filter-grid">
          <div class="dd-field">
            <span class="dd-field-label">关键词搜索</span>
            <div class="search-bar" style="width: 100%; height: 42px; border-radius: 6px">
              <span>🔍</span>
              <input v-model="spotKeyword" type="text" placeholder="搜索景区、乡村、夜市…" />
            </div>
          </div>

          <label v-if="activeSection === 'spots' || activeSection === 'all'" class="dd-field">
            <span class="dd-field-label">景点类型</span>
            <select v-model="spotCategory" class="dd-select" :class="{ active: spotCategory !== '全部' }">
              <option value="全部">全部类型（{{ TOUR_SPOTS.length }}）</option>
              <option value="景区">景区</option>
              <option value="乡村景点">乡村景点</option>
              <option value="网红打卡点">网红打卡点</option>
              <option value="夜市消费">夜市消费</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">预约日期</span>
            <select v-model="visitDate" class="dd-select active">
              <option v-for="d in BOOKING_DATES" :key="d.iso" :value="d.iso">
                {{ d.shortDate }}（{{ d.weekday }}）
              </option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">入园时段</span>
            <select v-model="visitSlot" class="dd-select active">
              <option value="上午 08:30-12:00">上午 08:30-12:00</option>
              <option value="下午 13:00-17:00">下午 13:00-17:00</option>
              <option value="夜游 17:30-22:00">夜游 17:30-22:00</option>
            </select>
          </label>
        </div>
      </div>

      <div v-if="pagedSpots.length === 0" class="card card-pad" style="text-align: center; padding: 36px 20px">
        <strong style="font-size: 15.5px; display: block; margin-bottom: 10px">未查询到匹配的景点或夜市</strong>
        <button class="btn-primary" @click="spotKeyword = ''; spotCategory = '全部'">重置查询条件</button>
      </div>

      <div v-else>
        <div class="grid-2">
          <div
            v-for="spot in pagedSpots"
            :key="spot.id"
            class="card"
            style="display: grid; grid-template-columns: 200px 1fr; overflow: hidden"
          >
            <div
              class="photo-box"
              style="height: 100%; min-height: 196px"
              @click="openSpotDetail(spot)"
            >
              <img :src="spot.photo" :alt="spot.name" />
              <span class="badge-tl">{{ spot.category }}</span>
            </div>

            <div class="card-pad" style="display: flex; flex-direction: column; justify-content: space-between; gap: 10px">
              <div>
                <div class="flex-between" style="margin-bottom: 5px">
                  <strong style="font-size: 17px; cursor: pointer" @click="openSpotDetail(spot)">{{ spot.name }}</strong>
                  <span class="rating-pill">★ {{ spot.rating }}</span>
                </div>
                <div style="font-size: 13.5px; color: var(--ink-2); margin-bottom: 6px; line-height: 1.55">{{ spot.summary }}</div>
                <div style="font-size: 13px; color: var(--ink-3)">
                  📍 {{ spot.distance }} · 🕒 {{ spot.openHours }}
                </div>
              </div>

              <div class="flex-between" style="padding-top: 10px; border-top: 1px dashed var(--line)">
                <div>
                  <strong style="font-size: 20px; color: var(--accent)">
                    {{ spot.stubPrice === 0 ? '免费' : `¥${spot.stubPrice}` }}
                  </strong>
                  <small style="font-size: 12.5px; color: var(--ink-3); margin-left: 3px">{{ spot.stubPrice === 0 ? '预约' : spot.priceUnit }}</small>
                </div>
                <div class="flex-row" style="gap: 6px">
                  <button
                    class="btn-ghost"
                    style="padding: 6px 10px; font-size: 13px"
                    title="语音导览"
                    @click="openActionModal({ type: 'audio', spotName: spot.name, duration: spot.duration, script: spot.audioScript, photo: spot.photo })"
                  >
                    🎧 导览
                  </button>
                  <button
                    class="btn-ghost"
                    style="padding: 6px 10px; font-size: 13px"
                    title="导航前往"
                    @click="
                      openNavigation({
                        placeName: spot.name,
                        address: spot.address,
                        lng: spot.lng,
                        lat: spot.lat,
                        distance: spot.distance,
                        driveMin: spot.driveMin,
                        tip: `${spot.bestTime} · ${spot.badge}`,
                      })
                    "
                  >
                    🧭 导航
                  </button>
                  <button class="btn-primary" style="padding: 6px 12px; font-size: 13px" @click="bookSpotTicket(spot)">
                    预约门票
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <PaginationBar
          :total="visibleSpots.length"
          :page="spotPage"
          :page-size="PAGE_SIZE"
          unit="处场景"
          @update:page="spotPage = $event"
        />
      </div>
    </div>

    <!-- ===== 模块二：“游”网旅产品专区 ===== -->
    <div v-if="activeSection === 'all' || activeSection === 'packages'" class="mb-24">
      <div class="card card-pad mb-16 filter-workbench">
        <div class="dd-filter-top">
          <strong style="font-size: 18px">🌿 网旅产品专区</strong>
          <span class="dd-count-pill">共 {{ visiblePackages.length }} 款套餐</span>
        </div>
        <div class="dd-filter-grid cols-4">
          <div class="dd-field">
            <span class="dd-field-label">套餐搜索</span>
            <div class="search-bar" style="width: 100%; height: 42px; border-radius: 6px">
              <span>🔍</span>
              <input v-model="pkgKeyword" type="text" placeholder="搜网旅套餐关键词…" />
            </div>
          </div>

          <label class="dd-field">
            <span class="dd-field-label">旅游圈层</span>
            <select v-model="pkgScope" class="dd-select" :class="{ active: pkgScope !== '全部' }">
              <option value="全部">全部圈层</option>
              <option value="京山本地">京山本地</option>
              <option value="荆门周边">荆门周边</option>
              <option value="湖北省内">湖北省内</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">出发日期</span>
            <select v-model="pkgDate" class="dd-select active">
              <option v-for="d in BOOKING_DATES" :key="`pkg-${d.iso}`" :value="d.iso">
                {{ d.shortDate }}（{{ d.weekday }}）
              </option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">同行人数</span>
            <select v-model.number="pkgPeople" class="dd-select">
              <option :value="1">1人独享</option>
              <option :value="2">2人同行</option>
              <option :value="3">3人家庭</option>
              <option :value="6">6人球队</option>
            </select>
          </label>
        </div>
      </div>

      <div class="grid-2">
        <div
          v-for="pkg in pagedPackages"
          :key="pkg.id"
          class="card"
          style="display: grid; grid-template-columns: 205px 1fr; overflow: hidden"
        >
          <div class="photo-box" style="height: 100%; min-height: 215px" @click="openPackageDetail(pkg)">
            <img :src="pkg.photo" :alt="pkg.title" />
            <span class="badge-tl">{{ pkg.scope }} · {{ pkg.duration }}</span>
          </div>
          <div class="card-pad" style="display: flex; flex-direction: column; justify-content: space-between; gap: 10px">
            <div>
              <div class="flex-between" style="margin-bottom: 6px">
                <strong style="font-size: 17px; cursor: pointer" @click="openPackageDetail(pkg)">{{ pkg.title }}</strong>
                <span class="rating-pill">★ {{ pkg.rating }}</span>
              </div>
              <div style="font-size: 13.5px; color: var(--ink-2); margin-bottom: 10px">{{ pkg.subtitle }}</div>
              <div class="flex-row" style="gap: 6px">
                <span v-for="inc in pkg.includes.slice(0, 3)" :key="inc" class="tag blue">✔ {{ inc }}</span>
              </div>
            </div>

            <div class="flex-between" style="padding-top: 10px; border-top: 1px dashed var(--line)">
              <div>
                <span class="price" style="font-size: 21px">¥{{ pkg.price * pkgPeople }}<small>/{{ pkgPeople }}人</small></span>
              </div>
              <div class="flex-row" style="gap: 8px">
                <button
                  class="btn-ghost"
                  @click="openNavigation({ placeName: pkg.title, address: pkg.address, lng: pkg.lng, lat: pkg.lat, distance: pkg.scope, driveMin: pkg.duration, tip: pkg.highlights.join('；') })"
                >
                  🧭 导航
                </button>
                <button class="btn-orange" @click="bookTourPackage(pkg)">
                  预订套餐
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PaginationBar
        :total="visiblePackages.length"
        :page="pkgPage"
        :page-size="PAGE_SIZE"
        unit="款套餐"
        @update:page="pkgPage = $event"
      />
    </div>

    <!-- ===== 模块三：语音导览与游玩时长建议 ===== -->
    <div v-if="activeSection === 'all' || activeSection === 'audio'" class="card card-pad mb-24">
      <div class="flex-between mb-16" style="padding-bottom: 14px; border-bottom: 1px solid var(--line)">
        <strong style="font-size: 18px">🎧 智能语音导览与行程建议</strong>
        <div class="seg-group">
          <button
            v-for="plan in TOUR_ITINERARY_PLANS"
            :key="plan.id"
            :class="{ active: activePlanId === plan.id }"
            @click="activePlanId = plan.id"
          >
            {{ plan.label }}
          </button>
        </div>
      </div>

      <div style="background: #f4faf7; border: 1px solid #d5e8df; padding: 12px 16px; margin-bottom: 16px" class="flex-between">
        <div>
          <span class="tag green" style="margin-right: 10px">{{ activePlan.durationTag }}</span>
          <span style="font-size: 14px; color: var(--ink-2)">{{ activePlan.desc }}</span>
        </div>
        <button
          class="btn-primary"
          @click="
            openActionModal({
              type: 'audio',
              spotName: `京山网旅全景导览（${activePlan.label}）`,
              duration: activePlan.durationTag,
              script: activePlan.stops.map((s) => `${s.time} ${s.spot}（${s.stay}）：${s.audioScript}`).join(' '),
              photo: activePlan.stops[0]?.photo ?? '/images/hero.jpg',
            })
          "
        >
          🎧 播放全程导览
        </button>
      </div>

      <div :class="activePlan.stops.length === 4 ? 'grid-4' : 'grid-3'">
        <div
          v-for="(st, idx) in activePlan.stops"
          :key="st.spot"
          style="background: #fff; border: 1px solid var(--line); padding: 14px 16px; display: flex; flex-direction: column; justify-content: space-between"
        >
          <div>
            <div class="flex-between" style="margin-bottom: 8px">
              <span class="tag green">第 {{ idx + 1 }} 站 · {{ st.time }}</span>
              <span class="tag gold">{{ st.stay }}</span>
            </div>
            <strong style="font-size: 16px; display: block; margin-bottom: 6px">{{ st.spot }}</strong>
            <div style="font-size: 13.5px; color: var(--ink-2); line-height: 1.6; margin-bottom: 12px">{{ st.tip }}</div>
          </div>
          <button
            class="btn-ghost"
            style="width: 100%"
            @click="openActionModal({ type: 'audio', spotName: st.spot, duration: st.stay, script: st.audioScript, photo: st.photo })"
          >
            🎧 试听讲解
          </button>
        </div>
      </div>
    </div>

    <!-- ===== 模块四：网球主题文旅专线 & 骑行徒步路线 ===== -->
    <div v-if="activeSection === 'all' || activeSection === 'lines'" class="grid-2">
      <!-- 左侧：3条网球主题文旅专线 -->
      <div class="card card-pad">
        <div class="flex-between mb-12" style="padding-bottom: 12px; border-bottom: 1px solid var(--line)">
          <strong style="font-size: 18px">🚌 网球主题文旅专线</strong>
        </div>

        <div class="filter-row mb-12" style="background: #f5faf8; padding: 9px 12px; border: 1px solid #d9ebe2">
          <span class="filter-label">日期：</span>
          <select v-model="busDate" class="f-input" style="width: 135px; padding: 6px 10px">
            <option v-for="d in BOOKING_DATES" :key="`bus-${d.iso}`" :value="d.shortDate">{{ d.shortDate }} {{ d.weekday }}</option>
          </select>
          <span class="filter-label">班次：</span>
          <select v-model="busDepartTime" class="f-input" style="width: 105px; padding: 6px 10px">
            <option>08:30</option>
            <option>09:30</option>
            <option>13:00</option>
            <option>14:30</option>
            <option>18:30</option>
            <option>20:00</option>
          </select>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px">
          <div
            v-for="line in TENNIS_BUS_LINES"
            :key="line.id"
            style="background: #fafdfc; border: 1px solid #d9e8e1; padding: 14px 16px"
          >
            <div class="flex-between" style="margin-bottom: 6px">
              <div class="flex-row" style="gap: 8px">
                <span class="tag green">{{ line.code }}</span>
                <strong style="font-size: 15.5px">{{ line.name }}</strong>
              </div>
              <span class="tag orange">{{ line.frequency }}</span>
            </div>
            <div style="font-size: 13.5px; color: var(--ink-2); margin-bottom: 6px">
              沿途：{{ line.stops.join(' → ') }}
            </div>
            <div style="font-size: 13px; color: var(--ink-3); margin-bottom: 10px">
              🕒 {{ line.serviceHours }} ｜ 🎫 {{ line.fare }}
            </div>
            <div class="flex-between">
              <span style="font-size: 13px; color: var(--primary); font-weight: 700">📍 {{ line.startAddress }}</span>
              <div class="flex-row" style="gap: 6px">
                <button
                  class="btn-ghost"
                  style="padding: 5px 10px; font-size: 13px"
                  @click="openNavigation({ placeName: `${line.code} 乘车点`, address: line.startAddress, lng: line.lng, lat: line.lat, distance: '场馆门口', driveMin: '步行 2 分钟', tip: `${line.frequency} · ${line.fare}` })"
                >
                  导航
                </button>
                <button
                  class="btn-primary"
                  style="padding: 5px 12px; font-size: 13px"
                  @click="createQuickOrder('门票', `文旅${line.code}免费乘车预约`, `${busDate} ${busDepartTime} 班次 · ${line.stops[0]} → ${line.stops[line.stops.length - 1]}`, 0, 20)"
                >
                  预约 {{ busDepartTime }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：骑行与生态徒步路线 -->
      <div class="card card-pad">
        <div class="flex-between mb-12" style="padding-bottom: 12px; border-bottom: 1px solid var(--line)">
          <strong style="font-size: 18px">🚴 骑行绿道与生态徒步</strong>
          <div class="flex-row" style="gap: 6px">
            <button
              v-for="tf in (['全部', '骑行路线', '生态徒步'] as const)"
              :key="tf"
              class="filter-pill"
              :class="{ active: trailFilter === tf }"
              @click="trailFilter = tf"
            >
              {{ tf }}
            </button>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px">
          <div
            v-for="trail in visibleTrails"
            :key="trail.id"
            style="display: grid; grid-template-columns: 136px 1fr; gap: 14px; background: #fafdfc; border: 1px solid #d9e8e1; padding: 12px"
          >
            <div class="photo-box" style="height: 126px">
              <img :src="trail.photo" :alt="trail.name" />
              <span class="badge-tl" style="font-size: 11.5px; padding: 2px 7px">{{ trail.mode }}</span>
            </div>
            <div style="display: flex; flex-direction: column; justify-content: space-between; gap: 6px">
              <div>
                <div class="flex-between" style="margin-bottom: 4px">
                  <strong style="font-size: 15.5px">{{ trail.name }}</strong>
                  <span class="tag blue">{{ trail.distanceKm }}</span>
                </div>
                <div style="font-size: 13px; color: var(--primary); font-weight: 700; margin-bottom: 4px">
                  ⏱️ {{ trail.duration }} · {{ trail.difficulty }}
                </div>
                <div style="font-size: 13px; color: var(--ink-2)">{{ trail.desc }}</div>
              </div>
              <div class="flex-between" style="margin-top: 7px; gap: 8px; flex-wrap: wrap">
                <span style="font-size: 12.5px; color: var(--ink-3); flex: 1 1 150px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">起点：{{ trail.startPoint }}</span>
                <div class="flex-row" style="gap: 5px; flex-shrink: 0; flex-wrap: nowrap; margin-left: auto">
                  <button
                    class="btn-ghost"
                    style="padding: 5px 10px; font-size: 13px"
                    @click="openNavigation({ placeName: trail.startPoint, address: trail.address, lng: trail.lng, lat: trail.lat, distance: trail.distanceKm, driveMin: trail.duration, tip: trail.supplyStations })"
                  >
                    导航
                  </button>
                  <button
                    class="btn-primary"
                    style="padding: 5px 12px; font-size: 13px"
                    @click="createQuickOrder('门票', `${trail.mode}打卡：${trail.name}`, `${visitDateLabel} · 起点：${trail.startPoint}（含免费驿站补给）`, 0, 30)"
                  >
                    报名打卡
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tour-tabs {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  width: 100%;
  gap: 8px;
}

.tour-tab {
  min-height: 44px;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--ink-2);
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.tour-tab:hover {
  border-color: var(--primary);
  color: var(--primary-dark);
}

.tour-tab[aria-pressed='true'] {
  border-color: var(--primary-dark);
  background: var(--primary-dark);
  color: white;
}
</style>
