<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { BOOKING_DATES } from '../../mock/schedules'
import {
  OUTDOOR_TRAILS,
  RETURN_TRIP_BUNDLES,
  TENNIS_BUS_LINES,
  TOUR_PACKAGES,
  TOUR_SPOTS,
  TOUR_VISIT_SLOTS,
  type ReturnTripBundle,
} from '../../mock/tourData'
import { isBookingQuantity } from '../../store/reservationFlow'
import { usePortalStore } from '../../store/usePortalStore'

const { state, currentAccount, switchModule, openPhoto, openTourSpotDetail, openActionModal, openNavigation, createQuickOrder } = usePortalStore()

// 模块顶部主视图切换
const tourTabs = [
  { id: 'postreturn', label: '赛后与返程游', icon: 'M3 12h18M13 5l7 7-7 7' },
  { id: 'scenic', label: '景区门票', icon: 'M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V7Zm12 1v2m0 4v2' },
  { id: 'rural', label: '乡村景点', icon: 'M2 20h20L15 8l-4 6-3-4-6 10ZM13 11l2 2 2-2M5 5h.01' },
  { id: 'trendy', label: '热门打卡', icon: 'M20 10c0 5-8 10-8 10S4 15 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' },
  { id: 'packages', label: '文旅套餐', icon: 'M4 8l8-4 8 4v9l-8 4-8-4V8Zm0 0 8 4 8-4m-8 4v9M8 6l8 4' },
  { id: 'lines', label: '文旅线路', icon: 'M7 6h9a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h10M3 6a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm15 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z' },
] as const
const activeSection = ref<(typeof tourTabs)[number]['id']>('postreturn')

// ===== 0. 赛后游览 & 返程顺路游（按登录账户来源地自动匹配） =====
type OriginPerspective = 'wuhan' | 'beijing' | 'shenzhen'

const originPerspective = computed<OriginPerspective>(() => {
  if (state.origin.includes('北京')) return 'beijing'
  if (state.origin.includes('深圳')) return 'shenzhen'
  return 'wuhan'
})

const bundleDate = ref(BOOKING_DATES[1]?.iso ?? BOOKING_DATES[0]!.iso)
const bundlePeople = ref<number>(2)
const bundleIncludeHotel = reactive<Record<string, boolean>>({
  'rt-wuhan-1': true,
  'rt-wuhan-2': true,
  'rt-beijing-1': true,
  'rt-beijing-2': true,
  'rt-shenzhen-1': true,
})
const bundleRooms = reactive<Record<string, number>>({})

function getRoomCount(bundleId: string) {
  return bundleRooms[bundleId] ?? Math.max(1, Math.ceil(bundlePeople.value / 2))
}

function adjustRooms(bundleId: string, delta: number) {
  const next = Math.min(6, Math.max(1, getRoomCount(bundleId) + delta))
  bundleRooms[bundleId] = next
}

watch(bundlePeople, (n) => {
  const suggested = Math.max(1, Math.ceil(n / 2))
  for (const b of RETURN_TRIP_BUNDLES) {
    bundleRooms[b.id] = suggested
  }
})

const visibleReturnBundles = computed(() =>
  RETURN_TRIP_BUNDLES.filter((b) => b.originKey === originPerspective.value),
)

const postHighlights = computed(() => {
  const specs = [
    { id: 'spot-tianmu', channelTag: '娱 · 温泉', channelModule: 8 as const, channelBtn: '更多娱乐', bookBtn: '预订门票' },
    { id: 'spot-wenfeng-night', channelTag: '吃 · 夜市美食', channelModule: 4 as const, channelBtn: '美食专区', bookBtn: '领券预订' },
    { id: 'spot-xianling', channelTag: '游 · 赛后游荆门', channelModule: null, channelBtn: '', bookBtn: '预订联票' },
  ]
  return specs
    .map((sp) => {
      const spot = TOUR_SPOTS.find((s) => s.id === sp.id)
      return spot ? { ...sp, spot } : null
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
})

const bookedBundleOrdersCount = computed(
  () => state.orders.filter((o) => o.status !== '已取消' && /^(返程)?联游打包：/.test(o.title)).length,
)

function isBundleBooked(bundle: ReturnTripBundle) {
  return state.orders.some(
    (o) => o.status !== '已取消' && o.title === `联游打包：${bundle.title}`,
  )
}

function calcBundlePricing(bundle: ReturnTripBundle) {
  const people = Math.max(1, bundlePeople.value)
  const withHotel = bundleIncludeHotel[bundle.id] ?? true
  const rooms = getRoomCount(bundle.id)
  const ticketSubtotal = bundle.ticketPrice * people
  const hotelSubtotal = withHotel ? bundle.hotelRoomPrice * rooms : 0
  const discount = withHotel ? bundle.bundleDiscount : 0
  const total = Math.max(1, ticketSubtotal + hotelSubtotal - discount)
  return { people, withHotel, rooms, ticketSubtotal, hotelSubtotal, discount, total, original: ticketSubtotal + hotelSubtotal }
}

const bundleDateLabel = computed(
  () => BOOKING_DATES.find((d) => d.iso === bundleDate.value)?.shortDate ?? bundleDate.value,
)

function bookReturnBundle(bundle: ReturnTripBundle) {
  const p = calcBundlePricing(bundle)
  const hotelSummary = p.withHotel
    ? `${bundle.hotelName}（${p.rooms}间 × ${bundle.hotelNights}晚）`
    : '不含住宿（仅景区联票）'
  createQuickOrder(
    '门票',
    `联游打包：${bundle.title}`,
    `${bundleDateLabel.value}出发 · ${p.people}人 · ${p.withHotel ? `门票+住宿(${p.rooms}间)` : '仅门票联票'}`,
    p.total,
    bundle.pointsGain,
    0,
    {
      fields: [
        { label: '出发日期', value: bundleDateLabel.value },
        { label: '联游路线', value: bundle.routeTitle },
        { label: '出行人数', value: `${p.people} 人` },
        { label: '沿途门票', value: `${bundle.ticketsIncluded.join('、')}（¥${p.ticketSubtotal}）` },
        { label: '合作住宿', value: p.withHotel ? `${hotelSummary}（¥${p.hotelSubtotal}，打包省¥${p.discount}）` : hotelSummary },
      ],
      successTitle: '联游套餐预订成功',
      successMessage: `订单与核销码已同步至个人中心，获赠 +${bundle.pointsGain} 积分。`,
    },
  )
}

// 1. 景区 / 乡村 / 网红 / 夜市 筛选、搜索与分页（每页4项）
const PAGE_SIZE = 8
const spotKeyword = ref('')
const spotPage = ref(1)
const visitDate = ref(BOOKING_DATES[0]!.iso)
const visitSlot = ref<(typeof TOUR_VISIT_SLOTS)[number]>('下午 13:00-17:00')

const activeSpotSection = computed(() => {
  if (activeSection.value === 'scenic') return { title: '🏔️ 景区门票与电子导览', categories: ['景区'] }
  if (activeSection.value === 'rural') return { title: '🏡 乡村景点与田园体验', categories: ['乡村景点'] }
  if (activeSection.value === 'trendy') return { title: '📸 热门打卡与夜市', categories: ['网红打卡点', '夜市消费'] }
})

const visibleSpots = computed(() => {
  const section = activeSpotSection.value
  if (!section) return []
  const q = spotKeyword.value.trim().toLowerCase()
  return TOUR_SPOTS.filter((s) => {
    const okCat = section.categories.includes(s.category)
    const okQ = !q || s.name.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q))
    return okCat && okQ
  })
})

const pagedSpots = computed(() => {
  const start = (spotPage.value - 1) * PAGE_SIZE
  return visibleSpots.value.slice(start, start + PAGE_SIZE)
})

watch([activeSection, spotKeyword], () => {
  spotPage.value = 1
})

const visitDateLabel = computed(
  () => BOOKING_DATES.find((d) => d.iso === visitDate.value)?.shortDate ?? visitDate.value,
)

// 2. 网旅产品专区筛选、搜索与分页（每页4项）
const pkgScope = ref<'全部' | '京山本地' | '荆门周边' | '湖北省内'>('全部')
const pkgKeyword = ref('')
const pkgPage = ref(1)
const pkgDate = ref(BOOKING_DATES[1]!.iso)
const pkgPeople = ref<number | ''>(2)

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
  openTourSpotDetail(spot, { date: visitDate.value, slot: visitSlot.value })
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
  const people = pkgPeople.value
  if (!isBookingQuantity(people)) return
  const dLabel = BOOKING_DATES.find((d) => d.iso === pkgDate.value)?.shortDate ?? pkgDate.value
  createQuickOrder(
    '门票',
    `网旅套餐：${pkg.title}`,
    `${dLabel}出发 · ${people}人同行 · ${pkg.duration} · 持证社保障`,
    pkg.price * people,
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
    <div class="module-mode-bar mb-16" role="group" aria-label="旅游分类">
      <button
        v-for="tab in tourTabs"
        :key="tab.id"
        type="button"
        class="module-mode-btn"
        :aria-pressed="activeSection === tab.id"
        @click="activeSection = tab.id"
      >
        <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path :d="tab.icon" />
        </svg>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- ===== 模块零：赛后游览 & 返程顺路游专题（按登录账户来源地自动匹配） ===== -->
    <div v-if="activeSection === 'postreturn'" class="mb-24 rt-stage">
      <!-- 一、赛后精选（所有游客常驻可见：温泉 / 夜市美食 / 钟祥明显陵·莫愁湖） -->
      <div class="rt-section">
        <div class="rt-sec-head">
          <h2>赛后精选</h2>
          <span class="tag green">完赛即享票根优惠</span>
        </div>

        <div class="grid-3 rt-spot-grid">
          <article v-for="item in postHighlights" :key="item.id" class="card rt-spot-card">
            <div class="photo-box rt-spot-photo" @click="openSpotDetail(item.spot)">
              <img :src="item.spot.photo" :alt="item.spot.name" />
              <span class="badge-tl">{{ item.channelTag }}</span>
            </div>
            <div class="rt-spot-body">
              <div class="flex-between" style="gap: 8px; align-items: flex-start">
                <strong class="rt-spot-title" @click="openSpotDetail(item.spot)">
                  {{ item.id === 'spot-xianling' ? '钟祥明显陵 · 莫愁湖' : item.spot.name.split('（')[0] }}
                </strong>
                <span class="rating-pill">★ {{ item.spot.rating }}</span>
              </div>
              <div class="rt-spot-meta">{{ item.spot.distance }} · {{ item.spot.driveMin.split('（')[0] }}</div>
            </div>
            <div class="rt-spot-foot">
              <div class="rt-spot-price">
                <strong>¥{{ item.spot.stubPrice }}</strong>
                <span>{{ item.spot.priceUnit.split('（')[0] }}</span>
              </div>
              <div class="flex-row" style="gap: 6px">
                <button
                  v-if="item.channelModule"
                  type="button"
                  class="btn-ghost rt-sm-btn"
                  @click="switchModule(item.channelModule)"
                >
                  {{ item.channelBtn }}
                </button>
                <button
                  v-else
                  type="button"
                  class="btn-ghost rt-sm-btn"
                  @click="openActionModal({ type: 'audio', spotName: item.spot.name, duration: item.spot.duration, script: item.spot.audioScript, photo: item.spot.photo })"
                >
                  导览
                </button>
                <button type="button" class="btn-primary rt-sm-btn" @click="openSpotDetail(item.spot)">
                  {{ item.bookBtn }}
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>

      <!-- 二、返程顺路游合作套餐（按当前登录账户来源地自动上架） -->
      <div class="rt-section">
        <div class="rt-sec-head">
          <div class="flex-row" style="gap: 10px">
            <h2>{{ originPerspective === 'wuhan' ? '赛后联游打包套餐' : '返程顺路游合作套餐' }}</h2>
            <span class="tag" :class="originPerspective === 'beijing' ? 'orange' : 'blue'">
              {{ currentAccount.name }}（{{ currentAccount.city }}）· 自动匹配 {{ visibleReturnBundles.length }} 款
            </span>
          </div>
          <button
            v-if="bookedBundleOrdersCount > 0"
            type="button"
            class="btn-ghost rt-orders-link"
            @click="switchModule(13)"
          >
            已订 {{ bookedBundleOrdersCount }} 单 · 个人中心查看 →
          </button>
        </div>

        <!-- 打包公共参数条（出发日期 + 出行人数） -->
        <div class="card rt-param-bar">
          <div class="rt-param-group">
            <label class="rt-param">
              <span>出发日期</span>
              <select v-model="bundleDate" class="f-input rt-date-select">
                <option v-for="d in BOOKING_DATES" :key="`rt-${d.iso}`" :value="d.iso">
                  {{ d.shortDate }} {{ d.weekday }}
                </option>
              </select>
            </label>

            <div class="rt-param">
              <span>出行人数</span>
              <div class="flex-row" style="gap: 5px">
                <button
                  v-for="n in [1, 2, 3, 4]"
                  :key="n"
                  type="button"
                  class="filter-pill rt-ppl-pill"
                  :class="{ active: bundlePeople === n }"
                  @click="bundlePeople = n"
                >
                  {{ n }}人
                </button>
              </div>
            </div>
          </div>

          <span class="tag green">门票 + 住宿 一键打包立省</span>
        </div>

        <div class="rt-bundle-list">
          <article
            v-for="bundle in visibleReturnBundles"
            :key="bundle.id"
            class="card rt-bundle-card"
          >
            <div class="photo-box rt-bundle-photo">
              <img :src="bundle.photo" :alt="bundle.title" />
              <span class="badge-tl rt-bundle-badge">{{ bundle.badge }}</span>
            </div>

            <div class="rt-bundle-body">
              <!-- 1. 标题与核心交通 -->
              <div class="rt-bundle-head">
                <div class="flex-row" style="gap: 8px">
                  <h3>{{ bundle.title }}</h3>
                  <span v-if="isBundleBooked(bundle)" class="tag green">已预订</span>
                </div>
                <div class="flex-row" style="gap: 6px">
                  <span class="tag blue">{{ bundle.duration }}</span>
                  <span class="tag">{{ bundle.transportTip }}</span>
                </div>
              </div>

              <!-- 2. 可视化沿线节点链 -->
              <div class="rt-nodes-row">
                <div v-for="(node, idx) in bundle.nodes" :key="`${bundle.id}-${idx}`" class="rt-node-item">
                  <div class="rt-node-card">
                    <div class="rt-node-city">{{ idx + 1 }}. {{ node.city }}</div>
                    <div class="rt-node-spot">{{ node.spot }}</div>
                  </div>
                  <div v-if="idx < bundle.nodes.length - 1" class="rt-node-arrow">
                    <span>→</span>
                    <small>{{ bundle.nodes[idx + 1]?.driveOrRail }}</small>
                  </div>
                </div>
              </div>

              <!-- 3. 门票 + 住宿打包明细（按人数/间数实时算价） -->
              <div class="grid-2 rt-pack-grid">
                <div class="rt-pack-box ticket">
                  <div class="flex-between">
                    <strong>沿途景区门票（必含）</strong>
                    <strong class="rt-pack-price primary">
                      ¥{{ bundle.ticketPrice }} × {{ bundlePeople }}人 = ¥{{ calcBundlePricing(bundle).ticketSubtotal }}
                    </strong>
                  </div>
                  <div class="rt-pack-chips">
                    <span v-for="tk in bundle.ticketsIncluded" :key="tk" class="rt-mini-chip">{{ tk }}</span>
                  </div>
                </div>

                <div class="rt-pack-box hotel" :class="{ off: !bundleIncludeHotel[bundle.id] }">
                  <div class="flex-between" style="gap: 8px">
                    <label class="rt-hotel-check">
                      <input v-model="bundleIncludeHotel[bundle.id]" type="checkbox" />
                      <strong>合作住宿打包（{{ bundle.hotelNights }}晚）</strong>
                    </label>
                    <strong class="rt-pack-price accent">
                      {{ bundleIncludeHotel[bundle.id] ? `¥${calcBundlePricing(bundle).hotelSubtotal}` : '未选' }}
                    </strong>
                  </div>
                  <div class="flex-between" style="gap: 8px; margin-top: 6px">
                    <span class="rt-hotel-name">{{ bundle.hotelName }}</span>
                    <div v-if="bundleIncludeHotel[bundle.id]" class="rt-room-stepper">
                      <button type="button" @click="adjustRooms(bundle.id, -1)">-</button>
                      <span>{{ getRoomCount(bundle.id) }}间</span>
                      <button type="button" @click="adjustRooms(bundle.id, 1)">+</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 4. 结算与一键下单 -->
              <div class="rt-bundle-foot">
                <div class="rt-total-group">
                  <span class="rt-total-meta">{{ bundleDateLabel }} · {{ bundlePeople }}人{{ bundleIncludeHotel[bundle.id] ? ` ${getRoomCount(bundle.id)}间` : '' }}</span>
                  <strong class="rt-total-price">¥{{ calcBundlePricing(bundle).total }}</strong>
                  <span v-if="calcBundlePricing(bundle).discount > 0" class="tag orange">打包省 ¥{{ calcBundlePricing(bundle).discount }}</span>
                  <span class="tag green">+{{ bundle.pointsGain }}积分</span>
                </div>

                <div class="flex-row" style="gap: 8px">
                  <button
                    v-if="isBundleBooked(bundle)"
                    type="button"
                    class="btn-ghost rt-action-sec"
                    @click="switchModule(13)"
                  >
                    查看订单
                  </button>
                  <button type="button" class="btn-orange rt-action-cta" @click="bookReturnBundle(bundle)">
                    {{ bundleIncludeHotel[bundle.id] ? '门票 + 住宿 一键打包预订' : '一键预订沿途联票' }}
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <!-- ===== 模块一：景区 · 乡村景点 · 网红打卡点 · 夜市消费场景 ===== -->
    <div v-if="activeSpotSection" class="mb-24">
      <div class="card card-pad mb-16 filter-workbench">
        <div class="dd-filter-top">
          <strong style="font-size: 18px">{{ activeSpotSection.title }}</strong>
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
              <option v-for="slot in TOUR_VISIT_SLOTS" :key="slot" :value="slot">{{ slot }}</option>
            </select>
          </label>
        </div>
      </div>

      <div v-if="pagedSpots.length === 0" class="card card-pad" style="text-align: center; padding: 36px 20px">
        <strong style="font-size: 15.5px; display: block; margin-bottom: 10px">未查询到匹配的景点或夜市</strong>
        <button class="btn-primary" @click="spotKeyword = ''">重置查询条件</button>
      </div>

      <div v-else>
        <div style="display: flex; flex-direction: column; gap: 12px">
          <div
            v-for="spot in pagedSpots"
            :key="spot.id"
            class="card"
            style="display: grid; grid-template-columns: 240px 1fr; overflow: hidden"
          >
            <div
              class="photo-box"
              style="height: 156px"
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
                  <button type="button" class="btn-primary" style="padding: 6px 12px; font-size: 13px" @click="openSpotDetail(spot)">
                    去预定
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
    <div v-if="activeSection === 'packages'" class="mb-24">
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
            <input v-model.number="pkgPeople" type="number" min="1" step="1" class="f-input booking-count-input" />
          </label>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px">
        <div
          v-for="pkg in pagedPackages"
          :key="pkg.id"
          class="card"
          style="display: grid; grid-template-columns: 240px 1fr; overflow: hidden"
        >
          <div class="photo-box" style="height: 164px" @click="openPackageDetail(pkg)">
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
                <span v-if="isBookingQuantity(pkgPeople)" class="price" style="font-size: 21px">¥{{ pkg.price * pkgPeople }}<small>/{{ pkgPeople }}人</small></span>
                <span v-else class="price" style="font-size: 21px">¥{{ pkg.price }}<small>/人</small></span>
              </div>
              <div class="flex-row" style="gap: 8px">
                <button
                  class="btn-ghost"
                  @click="openNavigation({ placeName: pkg.title, address: pkg.address, lng: pkg.lng, lat: pkg.lat, distance: pkg.scope, driveMin: pkg.duration, tip: pkg.highlights.join('；') })"
                >
                  🧭 导航
                </button>
                <button class="btn-orange booking-count-submit" :disabled="!isBookingQuantity(pkgPeople)" @click="bookTourPackage(pkg)">
                  {{ isBookingQuantity(pkgPeople) ? '预订套餐' : '请输入有效的同行人数' }}
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

    <!-- ===== 模块三：网球主题文旅专线 & 骑行徒步路线 ===== -->
    <div v-if="activeSection === 'lines'" class="grid-2">
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
.rt-stage {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.rt-param-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 16px;
  border-color: #d4e6de;
  flex-wrap: wrap;
}
.rt-param-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.rt-param {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-2);
}
.rt-date-select {
  width: 148px;
  padding: 5px 10px;
  font-size: 13px;
}
.rt-ppl-pill {
  padding: 4px 11px;
  font-size: 13px;
}
.rt-orders-link {
  padding: 6px 12px;
  font-size: 13px;
  color: var(--primary-dark);
  border-color: #b5d9ca;
  background: #f2faf6;
}

.rt-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rt-sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.rt-sec-head h2 {
  font-size: 17.5px;
  font-weight: 800;
  color: var(--ink);
}

/* 赛后3大精选 */
.rt-spot-grid {
  gap: 14px;
}
.rt-spot-card {
  display: flex;
  flex-direction: column;
}
.rt-spot-photo {
  height: 148px;
}
.rt-spot-body {
  padding: 12px 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rt-spot-title {
  font-size: 16px;
  color: var(--ink);
  cursor: pointer;
}
.rt-spot-meta {
  font-size: 13px;
  color: var(--ink-3);
}
.rt-spot-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-top: 1px dashed var(--line);
  background: #fafdfc;
}
.rt-spot-price {
  display: flex;
  align-items: baseline;
  gap: 3px;
}
.rt-spot-price strong {
  font-size: 19px;
  font-weight: 900;
  color: var(--accent);
}
.rt-spot-price span {
  font-size: 12px;
  color: var(--ink-3);
}
.rt-sm-btn {
  padding: 5px 11px;
  font-size: 12.5px;
}

/* 联游打包卡片 */
.rt-bundle-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.rt-bundle-card {
  display: grid;
  grid-template-columns: 240px 1fr;
  border: 1.5px solid #cde3da;
}
.rt-bundle-photo {
  height: 100%;
  min-height: 220px;
  cursor: default;
}
.rt-bundle-badge {
  background: #e85525;
}
.rt-bundle-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
}
.rt-bundle-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.rt-bundle-head h3 {
  font-size: 17.5px;
  font-weight: 800;
  color: var(--ink);
}

.rt-nodes-row {
  display: flex;
  align-items: stretch;
  gap: 6px;
  flex-wrap: wrap;
}
.rt-node-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 150px;
  min-width: 0;
}
.rt-node-card {
  flex: 1;
  background: #f5faf8;
  border: 1px solid #d4e8df;
  border-radius: 8px;
  padding: 8px 10px;
  min-width: 0;
}
.rt-node-city {
  font-size: 12px;
  font-weight: 800;
  color: var(--primary);
}
.rt-node-spot {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--ink);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rt-node-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  font-weight: 900;
  font-size: 14px;
  flex-shrink: 0;
  min-width: 44px;
}
.rt-node-arrow small {
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-3);
  white-space: nowrap;
}

.rt-pack-grid {
  gap: 10px;
}
.rt-pack-box {
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
}
.rt-pack-box.ticket {
  background: #f6fbf9;
  border: 1px solid #d5e8df;
}
.rt-pack-box.hotel {
  background: #fff9f5;
  border: 1px solid #f4d3be;
}
.rt-pack-box.hotel.off {
  background: #f7f9f8;
  border-color: var(--line);
  opacity: 0.72;
}
.rt-pack-price.primary {
  color: var(--primary-dark);
}
.rt-pack-price.accent {
  color: var(--accent);
}
.rt-pack-chips {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.rt-mini-chip {
  font-size: 11.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  background: #e7f4ee;
  color: var(--primary-dark);
}
.rt-hotel-check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.rt-hotel-name {
  font-size: 12.5px;
  color: var(--ink-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rt-room-stepper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.rt-room-stepper button {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid #e4c6b3;
  background: #fff;
  color: var(--ink);
  font-weight: 800;
  line-height: 1;
}
.rt-room-stepper span {
  font-size: 12.5px;
  font-weight: 800;
  color: var(--ink);
  min-width: 26px;
  text-align: center;
}

.rt-bundle-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
  flex-wrap: wrap;
}
.rt-total-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.rt-total-meta {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-2);
}
.rt-total-price {
  font-size: 24px;
  font-weight: 900;
  color: var(--accent);
}
.rt-action-sec {
  padding: 8px 14px;
  font-size: 13.5px;
}
.rt-action-cta {
  padding: 9px 18px;
  font-size: 14px;
}
</style>
