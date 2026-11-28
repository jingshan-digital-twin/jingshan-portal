<script setup lang="ts">
import { computed, defineAsyncComponent, reactive, ref, watch } from 'vue'
import MapResultsLayout from '../../components/MapResultsLayout.vue'
import MapViewToggle from '../../components/MapViewToggle.vue'
import MultiSelectDropdown from '../../components/MultiSelectDropdown.vue'
import PaginationBar from '../../components/PaginationBar.vue'
import ServiceCircleMap from '../../components/ServiceCircleMap.vue'
import { BOOKING_DATES, COURT_HOURS, CUTR_BANDS, formatHourRange } from '../../mock/schedules'
import { CAMP_PROGRAMS, REHAB_CENTERS } from '../../mock/trainingData'
import { VENUE_POI_FILTERS, type MapPoiCategory } from '../../mock/venuePois'
import { usePortalStore } from '../../store/usePortalStore'
import type { CutrBand, MatchmakingGame, RadiusOption } from '../../types/portal'

const MatchmakingMap = defineAsyncComponent(() => import('./MatchmakingMap.vue'))
const TournamentsSection = defineAsyncComponent(() => import('./TournamentsSection.vue'))

const {
  state,
  memberTier,
  switchModule,
  openPhoto,
  openVenueDetail,
  openBookingModal,
  openNavigation,
  joinMatchmakingGame,
  publishMatchmakingGame,
  createQuickOrder,
  showToast,
} = usePortalStore()

const playTabs = [
  { id: 'courts', label: '场地预约', icon: 'M5 4h14v16H5zM5 12h14M8 8h8v8H8z' },
  { id: 'matchmaking', label: '同城约球', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z' },
  { id: 'nearby', label: '球场周边服务', icon: 'M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07' },
  { id: 'events', label: '赛事信息', icon: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3' },
] as const
const initialPlayTab = new URLSearchParams(window.location.search).get('tab')
const subView = ref<(typeof playTabs)[number]['id']>(
  initialPlayTab === 'events' || initialPlayTab === 'matchmaking' || initialPlayTab === 'nearby' ? initialPlayTab : 'courts',
)
const radii: RadiusOption[] = ['500m', '1公里', '2公里']
const mapPoiCategory = ref<MapPoiCategory>('全部')
const activeVenueId = ref<string>('venue-wenfeng')
const showCourtMap = ref(true)
const courtMap = ref<InstanceType<typeof ServiceCircleMap>>()

// ===== 场地预约多维筛选 =====
const venueKeyword = ref('')
const selectedCourtDate = ref(BOOKING_DATES[0]!.iso)
const courtTimePeriod = ref<'全天' | '上午' | '下午' | '晚间'>('全天')
const venueSort = ref<'distance' | 'price' | 'rating' | 'slots'>('distance')
const selectedEnv = ref<'全部' | '室内' | '室外' | '风雨棚'>('全部')
const onlyBookable = ref(true)
const selectedVenueAmenities = ref<string[]>([])
const surfaces: ('全部' | '硬地' | '红土' | '室内风雨' | '匹克球')[] = ['全部', '硬地', '红土', '室内风雨', '匹克球']
const venueAmenityOptions = ['公益免费', '免费停车', '有充电桩', '有空调', '灯光夜场', '可看实况']

const hasActiveCourtFilters = computed(
  () =>
    !!venueKeyword.value.trim() ||
    state.courtRegionFilter !== '全部' ||
    state.courtSurfaceFilter !== '全部' ||
    selectedEnv.value !== '全部' ||
    courtTimePeriod.value !== '全天' ||
    selectedVenueAmenities.value.length > 0,
)

function getPeriodHours(period: '全天' | '上午' | '下午' | '晚间'): string[] {
  if (period === '上午') return ['08:00', '09:00', '10:00', '11:00']
  if (period === '下午') return ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
  if (period === '晚间') return ['18:00', '19:00', '20:00', '21:00']
  return [...COURT_HOURS]
}

function getVenueAvailableCount(venueId: string, dateIso: string, period: '全天' | '上午' | '下午' | '晚间') {
  const venue = state.courts.find((c) => c.id === venueId)
  if (!venue) return 0
  const hours = getPeriodHours(period)
  let count = 0
  for (const ct of venue.courts) {
    for (const h of hours) {
      if (!state.bookedCourtKeys.includes(`${venueId}|${dateIso}|${ct.id}|${h}`)) count++
    }
  }
  return count
}

function getVenuePreviewHours(venueId: string) {
  const hours = getPeriodHours(courtTimePeriod.value)
  const sample = hours.length >= 6 ? [hours[0]!, hours[2]!, hours[4]!, hours[hours.length - 2]!] : hours.slice(0, 4)
  const venue = state.courts.find((c) => c.id === venueId)
  if (!venue) return []
  return sample.map((h) => {
    const isNight = Number(h.split(':')[0]) >= 18
    const freeCourts = venue.courts.filter(
      (ct) => !state.bookedCourtKeys.includes(`${venueId}|${selectedCourtDate.value}|${ct.id}|${h}`),
    )
    const firstCourt = freeCourts[0] ?? venue.courts[0]!
    const rawPrice = isNight ? firstCourt.nightPrice : firstCourt.dayPrice
    const memberPrice = Math.round(rawPrice * memberTier.value.discount)
    return {
      hour: h,
      range: formatHourRange(h),
      freeCount: freeCourts.length,
      courtId: firstCourt.id,
      price: rawPrice,
      memberPrice,
    }
  })
}

const filteredCourts = computed(() => {
  const q = venueKeyword.value.trim().toLowerCase()
  const list = state.courts.filter((c) => {
    const okQ = !q || c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q) || c.region.includes(q)
    const okSurface = state.courtSurfaceFilter === '全部' || c.surfaces.includes(state.courtSurfaceFilter)
    const okRegion = state.courtRegionFilter === '全部' || c.region === state.courtRegionFilter
    const okEnv = selectedEnv.value === '全部' || c.envs.includes(selectedEnv.value)
    const okAmenities = selectedVenueAmenities.value.every((a) => c.amenities.includes(a))
    const okBookable = !onlyBookable.value || getVenueAvailableCount(c.id, selectedCourtDate.value, courtTimePeriod.value) > 0
    return okQ && okSurface && okRegion && okEnv && okAmenities && okBookable
  })
  return [...list].sort((a, b) => {
    if (venueSort.value === 'distance') return a.distanceKm - b.distanceKm
    if (venueSort.value === 'price') return a.minPrice - b.minPrice
    if (venueSort.value === 'rating') return b.rating - a.rating
    return (
      getVenueAvailableCount(b.id, selectedCourtDate.value, courtTimePeriod.value) -
      getVenueAvailableCount(a.id, selectedCourtDate.value, courtTimePeriod.value)
    )
  })
})

function resetCourtFilters() {
  venueKeyword.value = ''
  state.courtSurfaceFilter = '全部'
  state.courtRegionFilter = '全部'
  selectedEnv.value = '全部'
  courtTimePeriod.value = '全天'
  selectedVenueAmenities.value = []
  onlyBookable.value = true
}

const PAGE_SIZE = 8
const courtPage = ref(1)
const gamePage = ref(1)

const pagedCourts = computed(() => {
  const start = (courtPage.value - 1) * PAGE_SIZE
  return filteredCourts.value.slice(start, start + PAGE_SIZE)
})

const selectedVenue = computed(
  () =>
    filteredCourts.value.find((c) => c.id === activeVenueId.value) ??
    pagedCourts.value[0] ??
    null,
)

const courtMapItems = computed(() => filteredCourts.value.map((venue) => ({
  id: venue.id,
  title: venue.name.split('（')[0] ?? venue.name,
  photo: venue.photo,
  description: `${venue.rating} 分 · ${venue.distanceKm} km`,
  location: venue.address,
  openDetail: () => openVenueDetail(venue.id, { date: selectedCourtDate.value }),
  highlight: venue.minPrice === 0 ? '免费' : `¥${venue.minPrice} 起`,
})))

watch(filteredCourts, (list) => {
  courtPage.value = 1
  if (list.length > 0 && !list.some((v) => v.id === activeVenueId.value)) {
    activeVenueId.value = list[0]!.id
  }
})

watch(courtPage, () => {
  const firstOnPage = pagedCourts.value[0]
  if (firstOnPage) activeVenueId.value = firstOnPage.id
})

// ===== 同城约球多维筛选 =====
const mgSearch = ref('')
const mgSort = ref<'distance' | 'time' | 'spots'>('distance')
const mgDate = ref<string>('全部')
const mgRegion = ref<'全部' | '温泉街道' | '新市街道' | '永兴街道'>('全部')
const mgRole = ref<'全部' | '京网陪练' | '同龄球友' | '本地球友'>('全部')
const mgCutr = ref<'全部' | CutrBand>('全部')
const mgVenueType = ref<'全部' | '室内' | '室外' | '风雨棚' | '学练馆'>('全部')
const mgActivityType = ref<'全部' | '拉球' | '比赛' | '发球机' | '人工训练'>('全部')
const mgGender = ref<'不限' | '男' | '女'>('不限')
const mgFormat = ref<'全部' | '单打' | '双打'>('全部')
const mgTimeStart = ref('00:00')
const mgTimeEnd = ref('24:00')
const mgAmenities = ref<string[]>([])
const mgScopeTab = ref<'全部' | '我报名的' | '可加入'>('全部')
const showMgMap = ref(true)

// ===== 球场周边服务（运动康复 + 寒假训练营） =====
const selectedRehabServiceIdx = reactive<Record<string, number>>({
  'rehab-shijie': 0,
  'rehab-rmyy': 2,
  'rehab-zyy': 0,
})
const rehabDate = ref(BOOKING_DATES[0]!.shortDate)
const rehabSlot = ref('17:30-18:30（赛后放松）')
const winterCamps = computed(() => CAMP_PROGRAMS.filter((c) => c.category === '训练营' || c.category === '研学课程').slice(0, 4))

function bookRehabService(center: (typeof REHAB_CENTERS)[number]) {
  const idx = selectedRehabServiceIdx[center.id] ?? 0
  const svc = center.services[idx] ?? center.services[0]!
  createQuickOrder(
    '课程',
    `运动康复理疗：${center.name}`,
    `${svc.name}（${svc.duration}） · ${rehabDate.value} ${rehabSlot.value}`,
    svc.price,
    60,
    0,
    {
      fields: [
        { label: '康复机构', value: `${center.name}（${center.distance}）` },
        { label: '理疗项目', value: `${svc.name}（${svc.duration}）` },
        { label: '预约时段', value: `${rehabDate.value} ${rehabSlot.value}` },
      ],
      successTitle: '运动康复理疗预约成功',
      successMessage: '已为您开通赛期绿色通道并同步至个人中心，获赠 60 积分。',
    },
  )
}

function enrollWinterCamp(item: (typeof CAMP_PROGRAMS)[number]) {
  createQuickOrder(
    '课程',
    `${item.category}报名：${item.title}`,
    `${item.scheduleDate} · ${item.duration} · ${item.venue}`,
    item.price,
    200,
    0,
    {
      fields: [
        { label: '训练营课程', value: item.title },
        { label: '授课地点', value: item.venue },
        { label: '营期安排', value: `${item.duration}（${item.scheduleDate}）` },
      ],
      successTitle: '训练营报名成功',
      successMessage: '俱乐部教务专员将同步分班测试安排，已获赠 200 金网积分。',
    },
  )
}
function openGameDetail(g: MatchmakingGame) {
  const matchedVenue = state.courts.find((c) => c.id === g.venueId)
  const dateLabel = BOOKING_DATES.find((d) => d.iso === g.date)?.fullTitle ?? g.date
  const remain = Math.max(0, g.maxPlayers - g.currentPlayers)
  openPhoto({
    title: g.title,
    category: `同城约球 · ${g.activityType} · ${g.format}`,
    photo: matchedVenue?.photo ?? '/images/hero.jpg',
    rating: matchedVenue?.rating ?? 4.9,
    reviewCount: matchedVenue?.reviewCount ?? 86,
    subtitle: `CUTR ${g.cutrBand} ｜ ${g.venueType} · ${g.format} ｜ 已报 ${g.currentPlayers}/${g.maxPlayers} 人`,
    intro: `${g.note} 本场活动由球友「${g.hostName}」（${g.hostOrigin}）发起，地点位于${g.venueName}，时间 ${dateLabel} ${g.startTime}-${g.endTime}，性别要求：${g.gender}，当前剩余 ${remain} 个席位。`,
    openHours: `${dateLabel} ${g.startTime}-${g.endTime}`,
    priceInfo: g.feePerPerson === 0 ? 'AA 免费' : `¥${g.feePerPerson} / 人`,
    priceNum: g.feePerPerson,
    priceUnit: ' / 人',
    address: matchedVenue?.address ?? `湖北省荆门市京山市${g.region}${g.venueName}`,
    lng: matchedVenue?.lng ?? 113.1128,
    lat: matchedVenue?.lat ?? 31.0185,
    distance: `距您 ${g.distanceKm} km`,
    driveMin: matchedVenue ? `驾车约 ${Math.max(4, Math.round(g.distanceKm * 2.5))} 分钟` : '约 6 分钟',
    phone: matchedVenue?.phone,
    tags: [`CUTR ${g.cutrBand}`, g.venueType, g.activityType, g.format, ...g.amenities],
    highlights: [
      `活动时间：${dateLabel} ${g.startTime}-${g.endTime}`,
      `水平匹配：CUTR ${g.cutrBand} · 性别要求 ${g.gender}`,
      `发起球友：${g.hostName}（${g.hostOrigin}）· AA费用 ¥${g.feePerPerson}/人`,
      `场地配套：${g.amenities.join('、') || '标准球场与免费停车'}`,
    ],
    actionKind: 'matchmaking',
    matchmakingGameId: g.id,
    orderCategory: '场地',
    reviews: matchedVenue?.quote ? [matchedVenue.quote] : [],
  })
}

const showPublishModal = ref(false)

const mgAmenityOptions = ['有空调', '免费停车', '有充电桩', '有休息区', '好停车']
const timePickOptions = [
  '00:00', '07:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00', '19:00', '20:00', '22:00', '24:00',
]

function resetMgFilters() {
  mgSearch.value = ''
  mgDate.value = '全部'
  mgRegion.value = '全部'
  mgRole.value = '全部'
  mgCutr.value = '全部'
  mgVenueType.value = '全部'
  mgActivityType.value = '全部'
  mgGender.value = '不限'
  mgFormat.value = '全部'
  mgTimeStart.value = '00:00'
  mgTimeEnd.value = '24:00'
  mgAmenities.value = []
  mgScopeTab.value = '全部'
}

const filteredGames = computed(() => {
  const q = mgSearch.value.trim().toLowerCase()
  const list = state.matchmakingGames.filter((g) => {
    const okQ = !q || g.title.toLowerCase().includes(q) || g.venueName.toLowerCase().includes(q) || g.hostName.toLowerCase().includes(q)
    const okDate = mgDate.value === '全部' || g.date === mgDate.value
    const okRegion = mgRegion.value === '全部' || g.region === mgRegion.value
    const okRole = mgRole.value === '全部' || (g.matchRole ?? '本地球友') === mgRole.value
    const okCutr = mgCutr.value === '全部' || g.cutrBand === mgCutr.value
    const okVenue = mgVenueType.value === '全部' || g.venueType === mgVenueType.value
    const okAct = mgActivityType.value === '全部' || g.activityType === mgActivityType.value
    const okGender = mgGender.value === '不限' || g.gender === '不限' || g.gender === mgGender.value
    const okFormat = mgFormat.value === '全部' || g.format === mgFormat.value
    const okTime = g.startTime >= mgTimeStart.value && g.endTime <= mgTimeEnd.value
    const okAmenities = mgAmenities.value.every((a) => g.amenities.includes(a))
    const okScope =
      mgScopeTab.value === '全部' ||
      (mgScopeTab.value === '我报名的' && !!g.joinedByMe) ||
      (mgScopeTab.value === '可加入' && g.currentPlayers < g.maxPlayers && !g.joinedByMe)
    return okQ && okDate && okRegion && okRole && okCutr && okVenue && okAct && okGender && okFormat && okTime && okAmenities && okScope
  })

  return [...list].sort((a, b) => {
    if (mgSort.value === 'distance') return a.distanceKm - b.distanceKm
    if (mgSort.value === 'time') return `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)
    return (b.maxPlayers - b.currentPlayers) - (a.maxPlayers - a.currentPlayers)
  })
})

const filteredMgVenues = computed(() => {
  const q = mgSearch.value.trim().toLowerCase()
  return state.courts.filter((c) => {
    const okRegion = mgRegion.value === '全部' || c.region === mgRegion.value
    const okVenueType =
      mgVenueType.value === '全部' ||
      (mgVenueType.value === '学练馆' ? c.envs.includes('室内') : c.envs.includes(mgVenueType.value))
    const okQ = !q || c.name.toLowerCase().includes(q) || c.region.includes(q) || c.address.toLowerCase().includes(q)
    return okRegion && okVenueType && okQ
  })
})

const pagedGames = computed(() => {
  const start = (gamePage.value - 1) * PAGE_SIZE
  return filteredGames.value.slice(start, start + PAGE_SIZE)
})

watch(filteredGames, () => {
  gamePage.value = 1
})

const publishForm = reactive({
  title: '',
  venueId: 'venue-international',
  date: BOOKING_DATES[0]!.iso,
  startTime: '19:00',
  endTime: '21:00',
  cutrBand: '3.50-3.99' as CutrBand,
  venueType: '室外' as '室内' | '室外' | '风雨棚' | '学练馆',
  activityType: '拉球' as '拉球' | '比赛' | '发球机' | '人工训练',
  gender: '不限' as '不限' | '男' | '女',
  format: '双打' as '单打' | '双打',
  feePerPerson: 35,
  maxPlayers: 4,
  note: '',
})

function submitNewGame() {
  if (!publishForm.title.trim()) {
    showToast('请填写约球标题（例如：国际中心夜场双打拉球）')
    return
  }
  const venue = state.courts.find((c) => c.id === publishForm.venueId) ?? state.courts[0]!
  publishMatchmakingGame({
    title: publishForm.title.trim(),
    venueId: venue.id,
    venueName: venue.name.split('（')[0] ?? venue.name,
    region: venue.region,
    distanceKm: venue.distanceKm,
    date: publishForm.date,
    startTime: publishForm.startTime,
    endTime: publishForm.endTime,
    cutrBand: publishForm.cutrBand,
    venueType: publishForm.venueType,
    activityType: publishForm.activityType,
    gender: publishForm.gender,
    format: publishForm.format,
    amenities: venue.amenities.slice(0, 3),
    feePerPerson: Number(publishForm.feePerPerson) || 0,
    maxPlayers: Number(publishForm.maxPlayers) || 4,
    note: publishForm.note.trim() || '欢迎同水平球友一起开心挥拍！',
  })
  publishForm.title = ''
  publishForm.note = ''
  showPublishModal.value = false
}
</script>

<template>
  <section>
    <div class="module-mode-bar mb-16" role="group" aria-label="网球场地服务">
      <button
        v-for="tab in playTabs"
        :key="tab.id"
        type="button"
        class="module-mode-btn"
        :aria-pressed="subView === tab.id"
        @click="subView = tab.id"
      >
        <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path :d="tab.icon" />
        </svg>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- 赛事信息模块（列表 + 历史/实时/签表/成绩汇总/技术统计/战表/报名） -->
    <TournamentsSection v-if="subView === 'events'" class="mb-16" />

    <!-- 场地预约多维检索区 + 左侧场馆列表 + 右侧服务圈地图 -->
    <div v-if="subView === 'courts'" class="mb-18">
      <!-- 顶部清晰下拉筛选栏 -->
      <div class="card card-pad mb-16 filter-workbench">
        <div class="dd-filter-top">
          <div class="search-bar" style="flex: 1; min-width: 260px; max-width: 440px; height: 42px">
            <span style="color: var(--ink-3)">🔍</span>
            <input v-model="venueKeyword" type="text" placeholder="搜索场馆名称、片区或街道…" />
            <button v-if="venueKeyword" class="btn-ghost" style="padding: 3px 9px; font-size: 12.5px" @click="venueKeyword = ''">清空</button>
          </div>
          <div class="flex-row" style="gap: 10px">
            <label class="m-tab" :class="{ active: onlyBookable }" style="cursor: pointer; border: 1px solid #cbdcd5; border-radius: 6px; padding: 7px 14px">
              <input v-model="onlyBookable" type="checkbox" style="display: none" />
              {{ onlyBookable ? '✔ 仅看可约场馆' : '显示全部场馆' }}
            </label>
            <button class="btn-ghost" style="border-radius: 6px" @click="resetCourtFilters">重置筛选</button>
            <MapViewToggle v-model="showCourtMap" />
            <span class="dd-count-pill">共 {{ filteredCourts.length }} 家可约场馆</span>
          </div>
        </div>

        <div class="dd-filter-grid cols-7">
          <label class="dd-field">
            <span class="dd-field-label">预约日期</span>
            <select v-model="selectedCourtDate" class="dd-select active">
              <option v-for="d in BOOKING_DATES" :key="d.iso" :value="d.iso">
                {{ d.weekday }}（{{ d.shortDate }}）
              </option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">预约时段</span>
            <select v-model="courtTimePeriod" class="dd-select" :class="{ active: courtTimePeriod !== '全天' }">
              <option value="全天">全天（08:00-22:00）</option>
              <option value="上午">上午（08:00-12:00）</option>
              <option value="下午">下午（12:00-18:00）</option>
              <option value="晚间">晚间（18:00-22:00）</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">所属区域</span>
            <select v-model="state.courtRegionFilter" class="dd-select" :class="{ active: state.courtRegionFilter !== '全部' }">
              <option value="全部">全部区域</option>
              <option value="温泉街道">温泉街道</option>
              <option value="新市街道">新市街道</option>
              <option value="永兴街道">永兴街道</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">场地类型</span>
            <select v-model="state.courtSurfaceFilter" class="dd-select" :class="{ active: state.courtSurfaceFilter !== '全部' }">
              <option v-for="sf in surfaces" :key="sf" :value="sf">
                {{ sf === '全部' ? '全部类型' : sf }}
              </option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">场地环境</span>
            <select v-model="selectedEnv" class="dd-select" :class="{ active: selectedEnv !== '全部' }">
              <option value="全部">全部环境</option>
              <option value="室内">室内</option>
              <option value="室外">室外</option>
              <option value="风雨棚">风雨棚</option>
            </select>
          </label>

          <MultiSelectDropdown
            v-model="selectedVenueAmenities"
            label="设施配套"
            :options="venueAmenityOptions"
            placeholder="全部不限"
          />

          <label class="dd-field">
            <span class="dd-field-label">排序方式</span>
            <select v-model="venueSort" class="dd-select">
              <option value="distance">按距离最近</option>
              <option value="price">按最低价格</option>
              <option value="rating">按评分最高</option>
              <option value="slots">按空场最多</option>
            </select>
          </label>
        </div>

        <div v-if="hasActiveCourtFilters" class="dd-active-chips">
          <span style="font-size: 13px; color: var(--ink-3); font-weight: 700">已选条件：</span>
          <span v-if="courtTimePeriod !== '全天'" class="dd-chip">
            时段：{{ courtTimePeriod }}
            <button type="button" @click="courtTimePeriod = '全天'">✕</button>
          </span>
          <span v-if="state.courtRegionFilter !== '全部'" class="dd-chip">
            区域：{{ state.courtRegionFilter }}
            <button type="button" @click="state.courtRegionFilter = '全部'">✕</button>
          </span>
          <span v-if="state.courtSurfaceFilter !== '全部'" class="dd-chip">
            类型：{{ state.courtSurfaceFilter }}
            <button type="button" @click="state.courtSurfaceFilter = '全部'">✕</button>
          </span>
          <span v-if="selectedEnv !== '全部'" class="dd-chip">
            环境：{{ selectedEnv }}
            <button type="button" @click="selectedEnv = '全部'">✕</button>
          </span>
          <span v-for="am in selectedVenueAmenities" :key="am" class="dd-chip">
            {{ am }}
            <button type="button" @click="selectedVenueAmenities = selectedVenueAmenities.filter((x) => x !== am)">✕</button>
          </span>
        </div>
      </div>

      <template v-if="!showCourtMap">
        <div class="play-court-results">
          <div v-if="filteredCourts.length === 0" class="card card-pad" style="text-align: center; padding: 48px 20px">
            <div style="font-size: 32px; margin-bottom: 10px">🎾</div>
            <strong style="font-size: 16.5px; display: block; margin-bottom: 8px">当前筛选条件下暂无匹配场馆</strong>
            <div style="font-size: 13.5px; color: var(--ink-3); margin-bottom: 14px">可尝试放宽筛选条件或切换其他日期</div>
            <button class="btn-primary" @click="resetCourtFilters">重置全部筛选</button>
          </div>

          <div
            v-for="venue in pagedCourts"
            :key="venue.id"
            class="court-item-compact play-court-row"
            :class="{ selected: selectedVenue?.id === venue.id }"
            @click="activeVenueId = venue.id"
          >
            <div
              class="photo-box play-court-photo"
              @click.stop="
                activeVenueId = venue.id;
                openVenueDetail(venue.id, { date: selectedCourtDate })
              "
            >
              <img :src="venue.photo" :alt="venue.name" />
              <span class="badge-tl" style="font-size: 12px; padding: 3px 8px">★ {{ venue.rating }} · {{ venue.distanceKm }}km</span>
            </div>

            <div class="play-court-info">
              <div class="play-court-title-row">
                <strong
                  class="play-court-name"
                  @click.stop="
                    activeVenueId = venue.id;
                    openVenueDetail(venue.id, { date: selectedCourtDate })
                  "
                >
                  {{ venue.name.split('（')[0] }}
                </strong>
                <span class="tag green">余 {{ getVenueAvailableCount(venue.id, selectedCourtDate, courtTimePeriod) }} 场</span>
                <span v-for="sf in venue.surfaces.slice(0, 2)" :key="sf" class="tag">{{ sf }}</span>
              </div>

              <div class="play-court-meta">
                <span>{{ venue.region }}</span>
                <span>·</span>
                <span>{{ venue.openHours }}</span>
                <span>·</span>
                <span>{{ venue.address.replace('湖北省荆门市京山市', '') }}</span>
              </div>

              <div class="play-court-tags">
                <span v-for="am in venue.amenities.slice(0, 4)" :key="am" class="play-court-amenity">{{ am }}</span>
              </div>
            </div>

            <div class="play-court-action">
              <div class="play-court-price-row">
                <strong class="play-court-price">
                  {{ venue.minPrice === 0 ? '免费' : `¥${venue.minPrice}` }}
                  <small v-if="venue.minPrice > 0">起</small>
                </strong>
                <button
                  type="button"
                  class="btn-primary play-court-book-btn"
                  @click.stop="
                    activeVenueId = venue.id;
                    openBookingModal({
                      venueId: venue.id,
                      venueName: venue.name,
                      date: selectedCourtDate,
                      courtId: venue.courts[0]?.id,
                      slotTime: getVenuePreviewHours(venue.id)[0]?.hour ?? '16:00',
                      price: venue.courts[0]?.dayPrice ?? 80,
                      memberPrice: Math.round((venue.courts[0]?.dayPrice ?? 80) * memberTier.discount),
                      parkingName: venue.parkingName,
                      chargerName: venue.chargerName,
                    })
                  "
                >
                  预约 →
                </button>
              </div>

              <div class="slots-compact">
                <button
                  v-for="item in getVenuePreviewHours(venue.id)"
                  :key="item.hour"
                  type="button"
                  class="slot-mini"
                  :disabled="item.freeCount === 0"
                  :style="item.freeCount === 0 ? 'opacity: 0.45; cursor: not-allowed' : ''"
                  @click.stop="
                    activeVenueId = venue.id;
                    openBookingModal({
                      venueId: venue.id,
                      venueName: venue.name,
                      date: selectedCourtDate,
                      courtId: item.courtId,
                      slotTime: item.hour,
                      price: item.price,
                      memberPrice: item.memberPrice,
                      parkingName: venue.parkingName,
                      chargerName: venue.chargerName,
                    })
                  "
                >
                  <strong>{{ item.hour }}</strong>
                  <span>{{ item.freeCount === 0 ? '满' : item.memberPrice === 0 ? '免费' : `¥${item.memberPrice}` }}</span>
                </button>
              </div>
            </div>
          </div>

        </div>
        <PaginationBar
          :total="filteredCourts.length"
          :page="courtPage"
          :page-size="PAGE_SIZE"
          unit="家场馆"
          @update:page="courtPage = $event"
        />
      </template>

      <MapResultsLayout
        v-else
        :items="courtMapItems"
        :selected-id="selectedVenue?.id"
        list-label="地图场馆列表"
        empty-text="当前筛选条件下暂无匹配场馆"
        @select="courtMap?.openVenueLocation($event)"
      >
        <div>
          <div class="card-pad" style="border-bottom: 1px solid var(--line); background: #fafdfc; padding: 14px 16px">
            <div class="flex-between" style="margin-bottom: 10px">
              <strong style="font-size: 16.5px; color: var(--ink)">
                📍 {{ selectedVenue ? (selectedVenue.name.split('（')[0] ?? selectedVenue.name) : '京山球场周边' }}
              </strong>
              <div class="flex-row" style="gap: 5px" role="group" aria-label="周边范围">
                <button
                  v-for="r in radii"
                  :key="r"
                  type="button"
                  class="m-tab"
                  :class="{ active: state.radius === r }"
                  :aria-pressed="state.radius === r"
                  style="padding: 4px 10px; font-size: 13px"
                  @click="state.radius = r"
                >
                  {{ r }}
                </button>
              </div>
            </div>

            <div class="flex-row" style="gap: 6px; flex-wrap: wrap" role="group" aria-label="周边服务分类">
              <button
                v-for="cat in VENUE_POI_FILTERS"
                :key="cat.value"
                type="button"
                class="filter-pill"
                :class="{ active: mapPoiCategory === cat.value }"
                style="padding: 4px 11px; font-size: 13px"
                :aria-pressed="mapPoiCategory === cat.value"
                @click="mapPoiCategory = cat.value"
              >
                {{ cat.label }}
              </button>
            </div>
          </div>

          <ServiceCircleMap
            ref="courtMap"
            mode="courts"
            :radius="state.radius"
            :selected-venue="selectedVenue"
            :venues="filteredCourts"
            :court-date="selectedCourtDate"
            :poi-category="mapPoiCategory"
            @select-venue="activeVenueId = $event"
          />

          <div v-if="selectedVenue" class="card-pad" style="padding: 14px 16px; background: #f8fbfa">
            <div class="flex-between">
              <div style="min-width: 0">
                <div style="font-size: 14px; font-weight: 800; color: var(--ink)">
                  {{ selectedVenue.address }}
                </div>
                <div style="font-size: 13px; color: var(--ink-2); margin-top: 4px">
                  🅿️ 剩{{ selectedVenue.parkingRemain }}车位 ｜ ⚡ 闲{{ selectedVenue.chargerRemain }}充电桩
                </div>
              </div>
              <div class="flex-row" style="flex-shrink: 0">
                <button
                  class="btn-ghost"
                  @click="
                    openNavigation({
                      placeName: selectedVenue.name.split('（')[0] ?? selectedVenue.name,
                      address: selectedVenue.address,
                      lng: selectedVenue.lng,
                      lat: selectedVenue.lat,
                      distance: `${selectedVenue.distanceKm} km`,
                      driveMin: '约 6 分钟',
                      tip: `支持联动预约 ${selectedVenue.parkingName} 与 ${selectedVenue.chargerName}`,
                    })
                  "
                >
                  🧭 导航
                </button>
                <button
                  class="btn-orange"
                  @click="
                    openBookingModal({
                      venueId: selectedVenue.id,
                      venueName: selectedVenue.name,
                      date: selectedCourtDate,
                      courtId: selectedVenue.courts[0]?.id,
                      slotTime: getVenuePreviewHours(selectedVenue.id)[0]?.hour ?? '16:00',
                      price: selectedVenue.courts[0]?.dayPrice ?? 80,
                      memberPrice: Math.round((selectedVenue.courts[0]?.dayPrice ?? 80) * memberTier.discount),
                      parkingName: selectedVenue.parkingName,
                      chargerName: selectedVenue.chargerName,
                    })
                  "
                >
                  立即订馆
                </button>
              </div>
            </div>
          </div>
        </div>
      </MapResultsLayout>
    </div>

    <!-- 同城约球完整工作台 -->
    <div v-if="subView === 'matchmaking'" class="card card-pad filter-workbench">
      <div class="dd-filter-top" style="padding-bottom: 14px; border-bottom: 1px solid var(--line)">
        <div class="flex-row" style="gap: 12px; flex-wrap: wrap">
          <strong style="font-size: 19px">🤝 同城约球大厅（水平智能匹配）</strong>
          <div class="search-bar" style="width: 220px; height: 40px">
            <span>🔍</span>
            <input v-model="mgSearch" type="text" placeholder="搜陪练/球友/球场…" />
          </div>
        </div>
        <div class="flex-row" style="gap: 8px; flex-wrap: wrap">
          <MapViewToggle v-model="showMgMap" />
          <button class="btn-orange" @click="showPublishModal = true">＋ 发布约球</button>
          <button class="btn-ghost" @click="mgScopeTab = mgScopeTab === '我报名的' ? '全部' : '我报名的'">
            我的约球（{{ state.matchmakingGames.filter((g) => g.joinedByMe).length }}）
          </button>
          <button class="btn-ghost" @click="resetMgFilters">重置筛选</button>
          <span class="dd-count-pill">共 {{ filteredGames.length }} 场匹配</span>
        </div>
      </div>

      <!-- 清晰分项下拉筛选区（技术等级 / 时间 / 区域 / 对象） -->
      <div class="dd-filter-grid cols-6 mb-16">
        <label class="dd-field">
          <span class="dd-field-label">技术等级 (CUTR)</span>
          <select v-model="mgCutr" class="dd-select" :class="{ active: mgCutr !== '全部' }">
            <option value="全部">全部技术等级</option>
            <option v-for="band in CUTR_BANDS" :key="band.value" :value="band.value">
              CUTR {{ band.value }}
            </option>
          </select>
        </label>

        <label class="dd-field">
          <span class="dd-field-label">约球日期</span>
          <select v-model="mgDate" class="dd-select" :class="{ active: mgDate !== '全部' }">
            <option value="全部">全部日期</option>
            <option v-for="d in BOOKING_DATES" :key="d.iso" :value="d.iso">
              {{ d.weekday }}（{{ d.shortDate }}）
            </option>
          </select>
        </label>

        <label class="dd-field">
          <span class="dd-field-label">所属区域</span>
          <select v-model="mgRegion" class="dd-select" :class="{ active: mgRegion !== '全部' }">
            <option value="全部">全部街道</option>
            <option value="温泉街道">温泉街道</option>
            <option value="新市街道">新市街道</option>
            <option value="永兴街道">永兴街道</option>
          </select>
        </label>

        <label class="dd-field">
          <span class="dd-field-label">匹配对象</span>
          <select v-model="mgRole" class="dd-select" :class="{ active: mgRole !== '全部' }">
            <option value="全部">全部对象</option>
            <option value="京网陪练">🎯 京网陪练</option>
            <option value="同龄球友">👦 同龄球友</option>
            <option value="本地球友">🤝 本地球友</option>
          </select>
        </label>

        <label class="dd-field">
          <span class="dd-field-label">场地环境 / 形式</span>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px">
            <select v-model="mgVenueType" class="dd-select" :class="{ active: mgVenueType !== '全部' }" style="padding-left: 8px; padding-right: 22px">
              <option value="全部">环境不限</option>
              <option value="室内">室内</option>
              <option value="室外">室外</option>
              <option value="风雨棚">风雨棚</option>
              <option value="学练馆">学练馆</option>
            </select>
            <select v-model="mgActivityType" class="dd-select" :class="{ active: mgActivityType !== '全部' }" style="padding-left: 8px; padding-right: 22px">
              <option value="全部">形式不限</option>
              <option value="拉球">拉球</option>
              <option value="比赛">比赛</option>
              <option value="发球机">发球机</option>
              <option value="人工训练">人工训练</option>
            </select>
          </div>
        </label>

        <div class="dd-field">
          <span class="dd-field-label">赛制 / 性别</span>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px">
            <select v-model="mgFormat" class="dd-select" :class="{ active: mgFormat !== '全部' }" style="padding-left: 8px; padding-right: 24px">
              <option value="全部">赛制不限</option>
              <option value="单打">单打</option>
              <option value="双打">双打</option>
            </select>
            <select v-model="mgGender" class="dd-select" :class="{ active: mgGender !== '不限' }" style="padding-left: 8px; padding-right: 24px">
              <option value="不限">性别不限</option>
              <option value="男">仅限男</option>
              <option value="女">仅限女</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 状态与时间段排序轻条 -->
      <div class="flex-between mb-16" style="padding: 10px 14px; background: #f6faf8; border: 1px solid #e1eee8; border-radius: 6px">
        <div class="flex-row" style="gap: 12px; flex-wrap: wrap">
          <label class="flex-row" style="gap: 6px; font-size: 13.5px; font-weight: 700; color: var(--ink-2)">
            <span>状态：</span>
            <select v-model="mgScopeTab" class="dd-select" style="width: 124px; height: 36px; font-size: 13.5px">
              <option value="全部">全部球局</option>
              <option value="可加入">仅看可加入</option>
              <option value="我报名的">我报名的</option>
            </select>
          </label>
          <label class="flex-row" style="gap: 6px; font-size: 13.5px; font-weight: 700; color: var(--ink-2)">
            <span>时间段：</span>
            <select v-model="mgTimeStart" class="dd-select" style="width: 108px; height: 36px; font-size: 13.5px">
              <option v-for="t in timePickOptions" :key="`s-${t}`" :value="t">{{ t }}</option>
            </select>
            <span>至</span>
            <select v-model="mgTimeEnd" class="dd-select" style="width: 108px; height: 36px; font-size: 13.5px">
              <option v-for="t in timePickOptions" :key="`e-${t}`" :value="t">{{ t }}</option>
            </select>
          </label>
          <button
            type="button"
            class="filter-pill"
            :class="{ active: mgCutr === '3.50-3.99' }"
            style="padding: 5px 11px; font-size: 12.5px"
            @click="mgCutr = mgCutr === '3.50-3.99' ? '全部' : '3.50-3.99'"
          >
            ⚡ 按参赛成绩自动匹配（CUTR 3.50-3.99）
          </button>
        </div>
        <label class="flex-row" style="gap: 6px; font-size: 13.5px; font-weight: 700; color: var(--ink-2)">
          <span>排序：</span>
          <select v-model="mgSort" class="dd-select" style="width: 132px; height: 36px; font-size: 13.5px">
            <option value="distance">按距离最近</option>
            <option value="time">按开球最早</option>
            <option value="spots">按空位最多</option>
          </select>
        </label>
      </div>

      <!-- 地图视图：同屏展示京网陪练、同龄球友、本地球友及附近空闲场地 -->
      <div v-if="showMgMap" class="mb-16">
        <div
          v-if="filteredGames.length === 0"
          class="flex-between mb-12"
          style="padding: 9px 14px; background: #fff9f2; border: 1px solid #f5d8b8; font-size: 13px; color: #7a4b15"
        >
          <span>当前筛选条件下暂无已发布的约球局，地图已为您保留「{{ mgRegion === '全部' ? '全城' : mgRegion }}」可约空闲场地，也可直接发起新球局。</span>
          <div class="flex-row" style="gap: 8px; flex-shrink: 0">
            <button type="button" class="btn-ghost" style="padding: 4px 10px; font-size: 12.5px" @click="resetMgFilters">重置筛选</button>
            <button type="button" class="btn-orange" style="padding: 4px 10px; font-size: 12.5px" @click="showPublishModal = true">＋ 发布约球</button>
          </div>
        </div>
        <MatchmakingMap
          :games="filteredGames"
          :venues="filteredMgVenues"
          @join="joinMatchmakingGame"
          @game-detail="openGameDetail"
          @book-venue="openVenueDetail($event)"
        />
      </div>

      <div v-else-if="filteredGames.length === 0" style="text-align: center; padding: 36px 20px; background: #fafdfc; border-radius: 0; border: 1px dashed var(--line)">
        <div style="font-size: 28px; margin-bottom: 8px">🎾</div>
        <strong style="font-size: 16px; display: block; margin-bottom: 8px">当前筛选条件下暂无约球局</strong>
        <div class="flex-row" style="justify-content: center; margin-top: 12px">
          <button class="btn-ghost" @click="resetMgFilters">重置筛选</button>
          <button class="btn-orange" @click="showPublishModal = true">＋ 发布约球</button>
        </div>
      </div>

      <div v-else-if="!showMgMap">
        <div class="play-game-list">
          <div v-for="g in pagedGames" :key="g.id" class="card play-game-row">
            <div class="play-game-main">
              <div class="flex-row" style="margin-bottom: 6px; gap: 8px; flex-wrap: wrap">
                <span
                  class="tag"
                  :class="g.matchRole === '京网陪练' ? 'orange' : g.matchRole === '同龄球友' ? 'purple' : 'green'"
                >
                  {{ g.matchRole === '京网陪练' ? '🎯 京网陪练' : g.matchRole === '同龄球友' ? '👦 同龄球友' : '🤝 本地球友' }}
                </span>
                <span class="tag green">CUTR {{ g.cutrBand }}</span>
                <span class="tag blue">{{ g.venueType }} · {{ g.activityType }} · {{ g.format }}</span>
                <strong
                  style="font-size: 17px; color: var(--ink); cursor: pointer"
                  @click="openGameDetail(g)"
                >
                  {{ g.title }}
                </strong>
              </div>
              <div class="play-game-meta">
                <span>📅 <strong>{{ BOOKING_DATES.find((d) => d.iso === g.date)?.shortDate ?? g.date }} {{ g.startTime }}-{{ g.endTime }}</strong></span>
                <span>📍 {{ g.venueName }}（{{ g.region }} · 距您 {{ g.distanceKm }} km）</span>
                <span>👤 {{ g.hostName }} · {{ g.ageGroup ?? `性别：${g.gender}` }}</span>
              </div>
            </div>

            <div class="play-game-side">
              <div style="text-align: right">
                <strong style="color: var(--accent); font-size: 20px">¥{{ g.feePerPerson }}</strong>
                <span style="font-size: 13px; color: var(--ink-2)">/人</span>
                <div style="font-size: 12.5px; color: var(--ink-3); margin-top: 2px">已报 {{ g.currentPlayers }}/{{ g.maxPlayers }}人</div>
              </div>
              <button
                type="button"
                :class="g.joinedByMe ? 'btn-ghost' : g.currentPlayers >= g.maxPlayers ? 'btn-ghost' : 'btn-orange'"
                style="padding: 9px 16px"
                @click="joinMatchmakingGame(g.id)"
              >
                {{ g.joinedByMe ? '已预约 · 取消' : g.currentPlayers >= g.maxPlayers ? '已满员' : '一键预约并支付' }}
              </button>
            </div>
          </div>
        </div>
        <PaginationBar
          :total="filteredGames.length"
          :page="gamePage"
          :page-size="PAGE_SIZE"
          unit="场球局"
          @update:page="gamePage = $event"
        />
      </div>
    </div>

    <!-- 球场周边服务：运动康复机构 + 网球俱乐部寒假训练营 -->
    <div v-if="subView === 'nearby'" style="display: flex; flex-direction: column; gap: 18px">
      <!-- 1. 球场周边运动康复机构一键预约 -->
      <div class="card card-pad">
        <div class="flex-between mb-14" style="padding-bottom: 12px; border-bottom: 1px solid var(--line); flex-wrap: wrap; gap: 10px">
          <div class="flex-row" style="gap: 10px">
            <strong style="font-size: 18.5px">🩺 球场周边运动康复机构（赛后放松理疗）</strong>
            <span class="tag red">市卫健局认证 · 赛期绿色通道</span>
          </div>
          <div class="flex-row" style="gap: 8px">
            <select v-model="rehabDate" class="dd-select active" style="height: 36px; width: 130px; font-size: 13px">
              <option v-for="d in BOOKING_DATES" :key="`rh-${d.iso}`" :value="d.shortDate">{{ d.shortDate }}（{{ d.weekday }}）</option>
            </select>
            <select v-model="rehabSlot" class="dd-select active" style="height: 36px; width: 175px; font-size: 13px">
              <option>17:30-18:30（赛后放松）</option>
              <option>19:00-20:00（夜场恢复）</option>
              <option>14:00-15:00（赛间肌贴）</option>
            </select>
          </div>
        </div>

        <div class="grid-3" style="gap: 14px">
          <div
            v-for="center in REHAB_CENTERS"
            :key="center.id"
            class="card"
            style="display: flex; flex-direction: column; justify-content: space-between; border-color: #d6e8e0"
          >
            <div>
              <div class="photo-box" style="height: 138px">
                <img :src="center.photo" :alt="center.name" />
                <span class="badge-tl">{{ center.badge }}</span>
              </div>
              <div class="card-pad" style="padding: 13px 14px">
                <div class="flex-between" style="margin-bottom: 5px; gap: 6px">
                  <strong style="font-size: 15.5px">{{ center.name }}</strong>
                  <span class="rating-pill" style="flex-shrink: 0">★ {{ center.rating }}</span>
                </div>
                <div style="font-size: 12.5px; color: var(--primary); font-weight: 700; margin-bottom: 6px">
                  📍 {{ center.distance }} · {{ center.openHours }}
                </div>
                <div style="font-size: 12.5px; color: var(--ink-2); margin-bottom: 10px">{{ center.doctorInfo }}</div>

                <label class="dd-field">
                  <span class="dd-field-label">选择放松理疗项目</span>
                  <select
                    v-model.number="selectedRehabServiceIdx[center.id]"
                    class="dd-select"
                    style="height: 36px; font-size: 13px"
                  >
                    <option v-for="(svc, idx) in center.services" :key="svc.name" :value="idx">
                      {{ svc.name }}（{{ svc.duration }} · ¥{{ svc.price }}）
                    </option>
                  </select>
                </label>
              </div>
            </div>

            <div class="flex-between" style="padding: 11px 14px; border-top: 1px dashed var(--line); background: #fafdfc">
              <strong style="font-size: 18px; color: var(--accent)">
                ¥{{ (center.services[selectedRehabServiceIdx[center.id] ?? 0] ?? center.services[0]!).price }}
                <small style="font-size: 12px; color: var(--ink-3); font-weight: 600">/次</small>
              </strong>
              <div class="flex-row" style="gap: 6px">
                <button
                  type="button"
                  class="btn-ghost"
                  style="padding: 6px 10px; font-size: 12.5px"
                  @click="openNavigation({ placeName: center.name, address: center.address, lng: center.lng, lat: center.lat, distance: center.distance, driveMin: '约 4 分钟', tip: center.doctorInfo })"
                >
                  导航
                </button>
                <button type="button" class="btn-orange" style="padding: 6px 13px; font-size: 13px" @click="bookRehabService(center)">
                  一键预约理疗
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 网球俱乐部寒假训练营与研学课程 -->
      <div class="card card-pad">
        <div class="flex-between mb-14" style="padding-bottom: 12px; border-bottom: 1px solid var(--line); flex-wrap: wrap; gap: 10px">
          <div class="flex-row" style="gap: 10px">
            <strong style="font-size: 18.5px">❄️ 网球俱乐部寒假训练营 & 青少年研学课程</strong>
            <span class="tag green">省网校 & 五星俱乐部直招</span>
          </div>
          <button type="button" class="btn-ghost" style="font-size: 13px" @click="switchModule(9)">
            进入完整“训 · 培训研学”专区 →
          </button>
        </div>

        <div class="grid-2" style="gap: 14px">
          <div
            v-for="camp in winterCamps"
            :key="camp.id"
            class="card"
            style="display: grid; grid-template-columns: 186px 1fr; overflow: hidden; border-color: #d6e8e0"
          >
            <div class="photo-box" style="height: 100%; min-height: 168px">
              <img :src="camp.photo" :alt="camp.title" />
              <span class="badge-tl" style="font-size: 11.5px">{{ camp.badge }}</span>
            </div>
            <div class="card-pad" style="padding: 12px 14px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px">
              <div>
                <div class="flex-between" style="margin-bottom: 4px; gap: 6px">
                  <strong style="font-size: 15.5px">{{ camp.title }}</strong>
                  <span class="tag orange" style="flex-shrink: 0">余 {{ camp.remaining }} 名</span>
                </div>
                <div style="font-size: 12.5px; color: var(--ink-2); margin-bottom: 6px">
                  📅 {{ camp.scheduleDate }} ｜ 📍 {{ camp.venue }}
                </div>
                <div class="flex-row" style="gap: 5px; flex-wrap: wrap">
                  <span v-for="hl in camp.highlights.slice(0, 2)" :key="hl" class="tag blue" style="font-size: 11.5px">✔ {{ hl }}</span>
                </div>
              </div>
              <div class="flex-between" style="padding-top: 8px; border-top: 1px dashed var(--line)">
                <strong style="font-size: 18px; color: var(--accent)">
                  ¥{{ camp.price }}<small style="font-size: 12px; color: var(--ink-3); font-weight: 600">{{ camp.priceUnit }}</small>
                </strong>
                <button type="button" class="btn-primary" style="padding: 6px 14px; font-size: 13px" @click="enrollWinterCamp(camp)">
                  一键报名训练营
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 发布约球弹窗 -->
    <div v-if="showPublishModal" class="modal-backdrop" @click.self="showPublishModal = false">
      <div class="modal-box" style="width: 600px">
        <div class="card-pad flex-between" style="background: #0d3c2e; color: #fff">
          <strong style="font-size: 18px">＋ 发布同城约球局</strong>
          <button class="btn-ghost" @click="showPublishModal = false">✕ 关闭</button>
        </div>
        <div class="card-pad" style="display: flex; flex-direction: column; gap: 12px">
          <div>
            <label class="f-label">约球标题 *</label>
            <input v-model="publishForm.title" class="f-input" placeholder="如：今晚文峰灯光场3.5双打拉球（缺2人）" />
          </div>
          <div class="grid-2" style="gap: 12px">
            <div>
              <label class="f-label">预约场馆</label>
              <select v-model="publishForm.venueId" class="f-input">
                <option v-for="c in state.courts" :key="c.id" :value="c.id">{{ c.name.split('（')[0] }}</option>
              </select>
            </div>
            <div>
              <label class="f-label">约球日期</label>
              <select v-model="publishForm.date" class="f-input">
                <option v-for="d in BOOKING_DATES" :key="d.iso" :value="d.iso">{{ d.fullTitle }}</option>
              </select>
            </div>
          </div>
          <div class="grid-3" style="gap: 12px">
            <div>
              <label class="f-label">开始时间</label>
              <select v-model="publishForm.startTime" class="f-input">
                <option v-for="h in COURT_HOURS" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
            <div>
              <label class="f-label">结束时间</label>
              <select v-model="publishForm.endTime" class="f-input">
                <option v-for="h in COURT_HOURS" :key="h" :value="h">{{ h }}</option>
                <option value="22:00">22:00</option>
              </select>
            </div>
            <div>
              <label class="f-label">CUTR 水平</label>
              <select v-model="publishForm.cutrBand" class="f-input">
                <option v-for="b in CUTR_BANDS" :key="b.value" :value="b.value">CUTR {{ b.value }}</option>
              </select>
            </div>
          </div>
          <div class="grid-4" style="gap: 10px">
            <div>
              <label class="f-label">环境</label>
              <select v-model="publishForm.venueType" class="f-input">
                <option value="室外">室外</option>
                <option value="室内">室内</option>
                <option value="风雨棚">风雨棚</option>
                <option value="学练馆">学练馆</option>
              </select>
            </div>
            <div>
              <label class="f-label">形式</label>
              <select v-model="publishForm.activityType" class="f-input">
                <option value="拉球">拉球</option>
                <option value="比赛">比赛</option>
                <option value="发球机">发球机</option>
                <option value="人工训练">人工训练</option>
              </select>
            </div>
            <div>
              <label class="f-label">赛制</label>
              <select v-model="publishForm.format" class="f-input">
                <option value="双打">双打</option>
                <option value="单打">单打</option>
              </select>
            </div>
            <div>
              <label class="f-label">AA费用(元)</label>
              <input v-model.number="publishForm.feePerPerson" type="number" min="0" class="f-input" />
            </div>
          </div>
          <div>
            <label class="f-label">球局说明</label>
            <input v-model="publishForm.note" class="f-input" placeholder="例如：自带新球、欢迎球友一起玩" />
          </div>
          <div class="flex-between" style="padding-top: 10px; border-top: 1px solid var(--line)">
            <span style="font-size: 13.5px; color: var(--primary); font-weight: 700">发布成功获赠 +40 积分</span>
            <div class="flex-row">
              <button class="btn-ghost" @click="showPublishModal = false">取消</button>
              <button class="btn-orange" @click="submitNewGame">立即发布</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.play-court-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.play-court-row {
  display: grid;
  grid-template-columns: 224px minmax(0, 1fr) 396px;
  align-items: center;
  gap: 20px;
  padding: 14px 18px;
}

.play-court-photo {
  height: 130px;
}

.play-court-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.play-court-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.play-court-name {
  font-size: 18px;
  font-weight: 900;
  color: var(--ink);
  cursor: pointer;
}

.play-court-name:hover {
  color: var(--primary);
}

.play-court-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  font-size: 13.5px;
  color: var(--ink-2);
}

.play-court-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.play-court-amenity {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-3);
  background: #f4f8f6;
  border: 1px solid #e2ece7;
  padding: 2px 8px;
  border-radius: 5px;
}

.play-court-action {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 18px;
  border-left: 1px dashed #dfebe5;
}

.play-court-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.play-court-price {
  font-size: 22px;
  font-weight: 900;
  color: var(--accent);
  line-height: 1;
}

.play-court-price small {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-3);
  margin-left: 2px;
}

.play-court-book-btn {
  padding: 8px 18px;
  font-size: 13.5px;
}

.play-game-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.play-game-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 20px;
  background: #ffffff;
}

.play-game-main {
  min-width: 0;
  flex: 1;
}

.play-game-meta {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  font-size: 13.5px;
  color: var(--ink-2);
}

.play-game-side {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-shrink: 0;
  padding-left: 20px;
  border-left: 1px dashed var(--line);
}
</style>
