<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import ServiceCircleMap, { type MapPoiCategory } from '../../components/ServiceCircleMap.vue'
import { BOOKING_DATES, COURT_HOURS, CUTR_BANDS, formatHourRange } from '../../mock/schedules'
import { usePortalStore } from '../../store/usePortalStore'
import type { CutrBand, RadiusOption } from '../../types/portal'

const {
  state,
  memberTier,
  switchModule,
  openVenueDetail,
  openBookingModal,
  openNavigation,
  refreshLiveScores,
  joinMatchmakingGame,
  publishMatchmakingGame,
  createQuickOrder,
  showToast,
} = usePortalStore()

const subView = ref<'all' | 'courts' | 'matchmaking' | 'scores'>('all')
const radii: RadiusOption[] = ['500m', '1公里', '2公里']
const mapPoiCategory = ref<MapPoiCategory>('全部')
const activeVenueId = ref<string>('venue-wenfeng')

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

function toggleVenueAmenity(tag: string) {
  const idx = selectedVenueAmenities.value.indexOf(tag)
  if (idx >= 0) selectedVenueAmenities.value.splice(idx, 1)
  else selectedVenueAmenities.value.push(tag)
}

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

const PAGE_SIZE = 4
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
    state.courts[0] ??
    null,
)

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

// ===== 同城约球多维筛选（参照图1） =====
const mgSearch = ref('')
const mgSort = ref<'distance' | 'time' | 'spots'>('distance')
const mgDate = ref<string>('全部')
const mgCutr = ref<'全部' | CutrBand>('全部')
const mgVenueType = ref<'全部' | '室内' | '室外' | '风雨棚' | '学练馆'>('全部')
const mgActivityType = ref<'全部' | '拉球' | '比赛' | '发球机' | '人工训练'>('全部')
const mgGender = ref<'不限' | '男' | '女'>('不限')
const mgFormat = ref<'全部' | '单打' | '双打'>('全部')
const mgTimeStart = ref('00:00')
const mgTimeEnd = ref('24:00')
const mgAmenities = ref<string[]>([])
const mgScopeTab = ref<'全部' | '我报名的' | '可加入'>('全部')
const showMgAdvanced = ref(true)
const showPublishModal = ref(false)

const mgAmenityOptions = ['有空调', '免费停车', '有充电桩', '有休息区', '好停车']
const timePickOptions = [
  '00:00', '07:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00', '19:00', '20:00', '22:00', '24:00',
]

function toggleMgAmenity(tag: string) {
  const idx = mgAmenities.value.indexOf(tag)
  if (idx >= 0) mgAmenities.value.splice(idx, 1)
  else mgAmenities.value.push(tag)
}

function resetMgFilters() {
  mgSearch.value = ''
  mgDate.value = '全部'
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
    return okQ && okDate && okCutr && okVenue && okAct && okGender && okFormat && okTime && okAmenities && okScope
  })

  return [...list].sort((a, b) => {
    if (mgSort.value === 'distance') return a.distanceKm - b.distanceKm
    if (mgSort.value === 'time') return `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)
    return (b.maxPlayers - b.currentPlayers) - (a.maxPlayers - a.currentPlayers)
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
    <div class="module-toolbar">
      <div class="mh-tabs">
        <button class="m-tab" :class="{ active: subView === 'all' }" @click="subView = 'all'">全部功能</button>
        <button class="m-tab" :class="{ active: subView === 'courts' }" @click="subView = 'courts'">场地预约（选日期/时段）</button>
        <button class="m-tab" :class="{ active: subView === 'matchmaking' }" @click="subView = 'matchmaking'">同城约球（CUTR分级）</button>
        <button class="m-tab" :class="{ active: subView === 'scores' }" @click="subView = 'scores'">网球记实时赛况</button>
      </div>
    </div>

    <!-- 网球记实时赛事比分看板 -->
    <div
      v-if="subView === 'all' || subView === 'scores'"
      class="card card-pad mb-16"
      style="background: linear-gradient(135deg, #092d22, #0e4936); color: #fff"
    >
      <div class="flex-between" style="margin-bottom: 14px">
        <div class="flex-row">
          <strong style="font-size: 18px">📊 赛事实时比分</strong>
          <span class="tag" style="background: var(--lime); color: #0b251d">网球记实时同步</span>
        </div>
        <div class="flex-row">
          <button
            class="btn-ghost"
            style="background: rgba(255, 255, 255, 0.14); color: #fff; border-color: rgba(255, 255, 255, 0.3)"
            @click="refreshLiveScores"
          >
            🔄 刷新比分
          </button>
          <button
            class="btn-ghost"
            style="background: rgba(255, 255, 255, 0.14); color: #fff; border-color: rgba(255, 255, 255, 0.3)"
            @click="switchModule(6)"
          >
            🚦 赛期限行
          </button>
          <button
            class="btn-orange"
            @click="createQuickOrder('门票', `京山周末分级赛（${state.abilityLevel}组）报名`, '完赛积+120分 · 赠联盟票根券', 120, 120)"
          >
            立即报名参赛
          </button>
        </div>
      </div>
      <div class="score-grid">
        <div v-for="m in state.liveMatches" :key="m.id" class="score-card">
          <div class="sc-head">
            <span>{{ m.venue }} · <strong>{{ m.courtNo }}</strong></span>
            <span :style="{ color: m.status === '已完赛' ? 'var(--lime)' : '#FF7B6B' }">
              {{ m.status }}
            </span>
          </div>
          <div style="font-size: 12.5px; color: rgba(255, 255, 255, 0.72); margin-bottom: 8px">
            {{ m.round }} · 耗时 {{ m.duration }}
          </div>
          <div class="sc-row">
            <span>{{ m.playerA }}</span>
            <div class="sc-sets">
              <span v-for="(s, idx) in m.setsA" :key="idx" :class="{ cur: idx > 0 && m.status !== '已完赛' }">{{ s }}</span>
            </div>
          </div>
          <div class="sc-row">
            <span>{{ m.playerB }}</span>
            <div class="sc-sets">
              <span v-for="(s, idx) in m.setsB" :key="idx">{{ s }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 场地预约多维检索区 + 左侧场馆列表 + 右侧服务圈地图 -->
    <div v-if="subView === 'all' || subView === 'courts'" class="mb-18">
      <!-- 顶部多维筛选面板 -->
      <div class="card card-pad mb-16 filter-workbench">
        <div class="flex-between" style="gap: 12px; margin-bottom: 14px">
          <div class="search-bar" style="max-width: 440px; height: 42px">
            <span style="color: var(--ink-3)">🔍</span>
            <input v-model="venueKeyword" type="text" placeholder="搜索场馆名称、片区或街道…" />
            <button v-if="venueKeyword" class="btn-ghost" style="padding: 3px 9px; font-size: 12.5px" @click="venueKeyword = ''">清空</button>
          </div>
          <div class="flex-row">
            <select v-model="state.courtRegionFilter" class="f-input" style="width: auto; padding: 8px 12px">
              <option value="全部">全部区域</option>
              <option value="温泉街道">温泉街道</option>
              <option value="新市街道">新市街道</option>
              <option value="永兴街道">永兴街道</option>
            </select>
            <select v-model="venueSort" class="f-input" style="width: auto; padding: 8px 12px">
              <option value="distance">按距离最近</option>
              <option value="price">按最低价格</option>
              <option value="rating">按评分最高</option>
              <option value="slots">按空场最多</option>
            </select>
            <label class="m-tab" :class="{ active: onlyBookable }" style="cursor: pointer">
              <input v-model="onlyBookable" type="checkbox" style="display: none" />
              {{ onlyBookable ? '✔ 仅看可约' : '全部场馆' }}
            </label>
            <button class="btn-ghost" @click="resetCourtFilters">重置</button>
          </div>
        </div>

        <!-- 7日日期条 + 时段区间 -->
        <div style="display: grid; grid-template-columns: 1fr 330px; gap: 14px; align-items: center; margin-bottom: 14px">
          <div class="date-strip-7">
            <button
              v-for="d in BOOKING_DATES"
              :key="d.iso"
              class="date-chip"
              :class="{ active: selectedCourtDate === d.iso }"
              @click="selectedCourtDate = d.iso"
            >
              <strong>{{ d.weekday }}</strong>
              <span>{{ d.shortDate }}</span>
            </button>
          </div>
          <div class="flex-row" style="justify-content: flex-end">
            <span style="font-size: 14px; font-weight: 800; color: var(--ink-2)">时段：</span>
            <button
              v-for="p in (['全天', '上午', '下午', '晚间'] as const)"
              :key="p"
              class="m-tab"
              :class="{ active: courtTimePeriod === p }"
              @click="courtTimePeriod = p"
            >
              {{ p }}
            </button>
          </div>
        </div>

        <!-- 场地地面 + 室内外 + 设施标签 -->
        <div class="filter-rows">
          <div class="filter-row">
            <span class="filter-label">场地类型：</span>
            <button
              v-for="sf in surfaces"
              :key="sf"
              class="filter-pill"
              :class="{ active: state.courtSurfaceFilter === sf }"
              @click="state.courtSurfaceFilter = sf"
            >
              {{ sf }}
            </button>
            <span class="filter-divider" />
            <span class="filter-label">环境：</span>
            <button
              v-for="env in (['全部', '室内', '室外', '风雨棚'] as const)"
              :key="env"
              class="filter-pill"
              :class="{ active: selectedEnv === env }"
              @click="selectedEnv = env"
            >
              {{ env }}
            </button>
          </div>

          <div class="filter-row">
            <span class="filter-label">设施：</span>
            <button
              v-for="tag in venueAmenityOptions"
              :key="tag"
              class="filter-pill"
              :class="{ active: selectedVenueAmenities.includes(tag) }"
              @click="toggleVenueAmenity(tag)"
            >
              {{ tag }}
            </button>
            <span style="margin-left: auto; font-size: 14px; font-weight: 800; color: var(--primary)">
              共 {{ filteredCourts.length }} 家可约场馆
            </span>
          </div>
        </div>
      </div>

      <!-- 左侧精简场馆列表 + 右侧高德联动标注地图 -->
      <div class="play-map-split">
        <div style="display: flex; flex-direction: column; gap: 12px">
          <div v-if="filteredCourts.length === 0" class="card card-pad" style="text-align: center; padding: 48px 20px">
            <div style="font-size: 32px; margin-bottom: 10px">🎾</div>
            <strong style="font-size: 16.5px; display: block; margin-bottom: 8px">当前筛选条件下暂无匹配场馆</strong>
            <div style="font-size: 13.5px; color: var(--ink-3); margin-bottom: 14px">可尝试放宽筛选条件或切换其他日期</div>
            <button class="btn-primary" @click="resetCourtFilters">重置全部筛选</button>
          </div>

          <div
            v-for="venue in pagedCourts"
            :key="venue.id"
            class="court-item-compact"
            :class="{ selected: selectedVenue?.id === venue.id }"
            @click="activeVenueId = venue.id"
          >
            <div
              class="photo-box"
              style="height: 138px"
              @click.stop="
                activeVenueId = venue.id;
                openVenueDetail(venue.id, { date: selectedCourtDate })
              "
            >
              <img :src="venue.photo" :alt="venue.name" />
              <span class="badge-tl" style="font-size: 12px; padding: 3px 8px">★ {{ venue.rating }} · {{ venue.distanceKm }}km</span>
            </div>

            <div class="court-compact-body">
              <!-- 第1行：名称 + 最低价 -->
              <div class="flex-between" style="gap: 8px">
                <strong
                  style="font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer"
                  @click.stop="
                    activeVenueId = venue.id;
                    openVenueDetail(venue.id, { date: selectedCourtDate })
                  "
                >
                  {{ venue.name.split('（')[0] }}
                </strong>
                <strong style="font-size: 18px; color: var(--accent); flex-shrink: 0">
                  {{ venue.minPrice === 0 ? '免费' : `¥${venue.minPrice}起` }}
                </strong>
              </div>

              <!-- 第2行：核心元信息 -->
              <div style="font-size: 13.5px; color: var(--ink-2); display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
                <span>{{ venue.region }}</span>
                <span>· {{ venue.openHours }}</span>
                <span style="color: var(--primary); font-weight: 800">
                  · 余{{ getVenueAvailableCount(venue.id, selectedCourtDate, courtTimePeriod) }}场
                </span>
              </div>

              <!-- 第3行：4个时段 + 订场按钮 -->
              <div class="court-compact-bottom">
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

                <button
                  class="btn-primary"
                  style="padding: 8px 12px; font-size: 13px; flex-shrink: 0"
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
            </div>
          </div>

          <PaginationBar
            :total="filteredCourts.length"
            :page="courtPage"
            :page-size="PAGE_SIZE"
            unit="家场馆"
            @update:page="courtPage = $event"
          />
        </div>

        <!-- 右侧固定地图 -->
        <div class="card play-map-sticky">
          <div class="card-pad" style="border-bottom: 1px solid var(--line); background: #fafdfc; padding: 14px 16px">
            <div class="flex-between" style="margin-bottom: 10px">
              <strong style="font-size: 16.5px; color: var(--ink)">
                📍 {{ selectedVenue ? (selectedVenue.name.split('（')[0] ?? selectedVenue.name) : '京山球场周边' }}
              </strong>
              <div class="flex-row" style="gap: 5px">
                <button
                  v-for="r in radii"
                  :key="r"
                  class="m-tab"
                  :class="{ active: state.radius === r }"
                  style="padding: 4px 10px; font-size: 13px"
                  @click="state.radius = r"
                >
                  {{ r }}
                </button>
              </div>
            </div>

            <div class="flex-row" style="gap: 6px">
              <button
                v-for="cat in (['全部', '酒店', '美食', '停车充电', '便民景点'] as const)"
                :key="cat"
                class="filter-pill"
                :class="{ active: mapPoiCategory === cat }"
                style="padding: 4px 11px; font-size: 13px"
                @click="mapPoiCategory = cat"
              >
                {{ cat === '全部' ? '全部周边' : cat === '酒店' ? '🏨 酒店' : cat === '美食' ? '🍜 美食' : cat === '停车充电' ? '🅿️ 停车/充电' : '🏥 医疗/景点' }}
              </button>
            </div>
          </div>

          <ServiceCircleMap
            mode="courts"
            :radius="state.radius"
            :selected-venue="selectedVenue"
            :venues="filteredCourts"
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
      </div>
    </div>

    <!-- 同城约球完整工作台 -->
    <div v-if="subView === 'all' || subView === 'matchmaking'" class="card card-pad">
      <div class="flex-between mb-16" style="padding-bottom: 14px; border-bottom: 1px solid var(--line)">
        <strong style="font-size: 19px">🤝 同城约球大厅（CUTR 分级匹配）</strong>
        <div class="flex-row">
          <div class="search-bar" style="width: 240px; height: 40px">
            <span>🔍</span>
            <input v-model="mgSearch" type="text" placeholder="搜场馆/球局…" />
          </div>
          <select v-model="mgSort" class="f-input" style="width: auto; padding: 7px 10px">
            <option value="distance">距离最近</option>
            <option value="time">开球最早</option>
            <option value="spots">空位最多</option>
          </select>
          <button class="btn-orange" @click="showPublishModal = true">＋ 发布约球</button>
          <button class="btn-ghost" @click="mgScopeTab = mgScopeTab === '我报名的' ? '全部' : '我报名的'">
            我的约球（{{ state.matchmakingGames.filter((g) => g.joinedByMe).length }}）
          </button>
        </div>
      </div>

      <!-- 日期选择条 -->
      <div class="date-strip-8 mb-12">
        <button class="date-chip" :class="{ active: mgDate === '全部' }" @click="mgDate = '全部'">
          <strong>全部</strong>
          <span>不限日期</span>
        </button>
        <button
          v-for="d in BOOKING_DATES"
          :key="d.iso"
          class="date-chip"
          :class="{ active: mgDate === d.iso }"
          @click="mgDate = d.iso"
        >
          <strong>{{ d.weekday }}</strong>
          <span>{{ d.shortDate }}</span>
        </button>
      </div>

      <!-- CUTR 多档水平卡片 + 多维筛选 -->
      <div v-if="showMgAdvanced" class="mg-filter-box mb-16">
        <div class="cutr-grid mb-12">
          <button
            class="cutr-all-btn"
            :class="{ active: mgCutr === '全部' }"
            @click="mgCutr = '全部'"
          >
            全部<br />水平
          </button>
          <div class="cutr-tiers">
            <button
              v-for="band in CUTR_BANDS"
              :key="band.value"
              class="cutr-card"
              :class="{ active: mgCutr === band.value }"
              :style="{
                borderColor: mgCutr === band.value ? band.color : `${band.color}55`,
                background: mgCutr === band.value ? band.bg : '#fff',
                color: band.color,
              }"
              @click="mgCutr = band.value"
            >
              <small>CUTR</small>
              <strong>{{ band.value }}</strong>
            </button>
          </div>
        </div>

        <div class="filter-rows">
          <div class="filter-row">
            <span class="filter-label">环境：</span>
            <button
              v-for="vt in (['全部', '室内', '室外', '风雨棚', '学练馆'] as const)"
              :key="vt"
              class="filter-pill"
              :class="{ active: mgVenueType === vt }"
              @click="mgVenueType = vt"
            >
              {{ vt }}
            </button>
            <span class="filter-divider" />
            <span class="filter-label">形式：</span>
            <button
              v-for="at in (['全部', '拉球', '比赛', '发球机', '人工训练'] as const)"
              :key="at"
              class="filter-pill"
              :class="{ active: mgActivityType === at }"
              @click="mgActivityType = at"
            >
              {{ at }}
            </button>
          </div>

          <div class="filter-row">
            <span class="filter-label">性别：</span>
            <div class="seg-group">
              <button
                v-for="g in (['不限', '男', '女'] as const)"
                :key="g"
                :class="{ active: mgGender === g }"
                @click="mgGender = g"
              >
                {{ g }}
              </button>
            </div>
            <span class="filter-label" style="margin-left: 10px">赛制：</span>
            <div class="seg-group">
              <button
                v-for="fm in (['全部', '单打', '双打'] as const)"
                :key="fm"
                :class="{ active: mgFormat === fm }"
                @click="mgFormat = fm"
              >
                {{ fm }}
              </button>
            </div>
            <span class="filter-label" style="margin-left: 10px">时间：</span>
            <select v-model="mgTimeStart" class="f-input" style="width: 108px; padding: 6px 8px">
              <option v-for="t in timePickOptions" :key="`s-${t}`" :value="t">🕒 {{ t }}</option>
            </select>
            <span style="font-size: 13.5px; color: var(--ink-3)">至</span>
            <select v-model="mgTimeEnd" class="f-input" style="width: 108px; padding: 6px 8px">
              <option v-for="t in timePickOptions" :key="`e-${t}`" :value="t">🕒 {{ t }}</option>
            </select>
          </div>

          <div class="filter-row">
            <span class="filter-label">配套：</span>
            <button
              v-for="am in mgAmenityOptions"
              :key="am"
              class="filter-pill"
              :class="{ active: mgAmenities.includes(am) }"
              @click="toggleMgAmenity(am)"
            >
              {{ am }}
            </button>
            <div style="margin-left: auto" class="flex-row">
              <button class="btn-ghost" @click="resetMgFilters">重置</button>
              <button class="btn-ghost" @click="showMgAdvanced = false">收起筛选 ▲</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="flex-between mb-12" style="background: #f5faf8; padding: 10px 14px; border-radius: 0">
        <span style="font-size: 14px; color: var(--ink-2)">已收起筛选条件（当前命中 {{ filteredGames.length }} 场球局）</span>
        <button class="btn-ghost" @click="showMgAdvanced = true">展开筛选 ▼</button>
      </div>

      <!-- 范围切换 + 约球卡片结果 -->
      <div class="flex-between mb-12">
        <div class="flex-row">
          <button
            v-for="tab in (['全部', '我报名的', '可加入'] as const)"
            :key="tab"
            class="m-tab"
            :class="{ active: mgScopeTab === tab }"
            @click="mgScopeTab = tab"
          >
            {{ tab }}
          </button>
        </div>
        <span style="font-size: 14px; color: var(--ink-2)">共 <strong style="color: var(--primary)">{{ filteredGames.length }}</strong> 场球局</span>
      </div>

      <div v-if="filteredGames.length === 0" style="text-align: center; padding: 36px 20px; background: #fafdfc; border-radius: 0; border: 1px dashed var(--line)">
        <div style="font-size: 28px; margin-bottom: 8px">🎾</div>
        <strong style="font-size: 16px; display: block; margin-bottom: 8px">当前筛选条件下暂无约球局</strong>
        <div class="flex-row" style="justify-content: center; margin-top: 12px">
          <button class="btn-ghost" @click="resetMgFilters">重置筛选</button>
          <button class="btn-orange" @click="showPublishModal = true">＋ 发布约球</button>
        </div>
      </div>

      <div v-else>
        <div class="grid-2">
          <div v-for="g in pagedGames" :key="g.id" class="card card-pad" style="display: flex; flex-direction: column; justify-content: space-between; background: #fcfefd">
          <div>
            <div class="flex-between" style="margin-bottom: 8px">
              <span class="tag green">CUTR {{ g.cutrBand }}</span>
              <span class="tag blue">{{ g.venueType }} · {{ g.activityType }} · {{ g.format }}</span>
            </div>
            <strong style="font-size: 17px; display: block; margin-bottom: 8px">{{ g.title }}</strong>
            <div style="font-size: 14px; color: var(--ink-2); line-height: 1.75; margin-bottom: 12px">
              📅 <strong>{{ BOOKING_DATES.find((d) => d.iso === g.date)?.shortDate ?? g.date }} {{ g.startTime }}-{{ g.endTime }}</strong><br />
              📍 {{ g.venueName }}（距您 {{ g.distanceKm }} km）<br />
              👤 发起人：{{ g.hostName }} · 性别：{{ g.gender }}
            </div>
          </div>

          <div class="flex-between" style="padding-top: 11px; border-top: 1px dashed var(--line)">
            <div>
              <strong style="color: var(--accent); font-size: 19px">¥{{ g.feePerPerson }}</strong>
              <span style="font-size: 13px; color: var(--ink-2)">/人 · 已报 {{ g.currentPlayers }}/{{ g.maxPlayers }}人</span>
            </div>
            <button
              :class="g.joinedByMe ? 'btn-ghost' : g.currentPlayers >= g.maxPlayers ? 'btn-ghost' : 'btn-primary'"
              :disabled="!g.joinedByMe && g.currentPlayers >= g.maxPlayers"
              @click="joinMatchmakingGame(g.id)"
            >
              {{ g.joinedByMe ? '已报名（取消）' : g.currentPlayers >= g.maxPlayers ? '已满员' : '立即加入' }}
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
