import { computed, reactive, watch } from 'vue'
import { apiRequest, USE_MOCK } from '../api/client'
import { requestReservation, ReservationUnavailable, type ReservationSummary } from './reservationFlow'
import {
  INITIAL_ABILITY,
  INITIAL_COMPLAINTS,
  INITIAL_COUPONS,
  INITIAL_COURTS,
  INITIAL_ORDERS,
  INITIAL_POSTS,
} from '../mock/data'
import { ENRICHED_MATCHES } from '../mock/details'
import {
  BOOKING_DATES,
  formatHourRange,
  INITIAL_BOOKED_COACH_KEYS,
  INITIAL_BOOKED_COURT_KEYS,
  INITIAL_GROUP_CLASSES,
  INITIAL_MATCHMAKING_GAMES,
  INITIAL_PRIVATE_COACHES,
} from '../mock/schedules'
import { TOUR_SPOTS, TOUR_VISIT_SLOTS, type TourSpot } from '../mock/tourData'
import type {
  AbilityDimensions,
  ActionModalPayload,
  BookingDraft,
  ComplaintTicket,
  CouponItem,
  CourtVenue,
  DetailPagePayload,
  FeedbackPost,
  GroupClassItem,
  HotelStaySelection,
  LightboxPayload,
  LiveMatch,
  MatchmakingGame,
  MerchantRatingItem,
  ModuleId,
  OrderSuccessModalPayload,
  PointLogItem,
  PortalOrder,
  PrivateCoach,
  RadiusOption,
  TourSpotVisitSelection,
  VisitorOrigin,
} from '../types/portal'

const STORAGE_KEY = 'jingshan_tennis_portal_state_v4'

const INITIAL_POINT_LOGS: PointLogItem[] = [
  { id: 'pt-1', title: '预订国际网球中心3号场（含停车充电联动）', category: '订场', delta: 50, time: '11-26 14:00' },
  { id: 'pt-2', title: '入住文峰花园酒店（网球主题合作 · 票根85折）', category: '住宿', delta: 120, time: '11-26 16:30' },
  { id: 'pt-3', title: '预约陈浩陪练 · 网前截击特训课', category: '参训', delta: 80, time: '11-26 18:10' },
]

const INITIAL_MERCHANT_RATINGS: MerchantRatingItem[] = [
  {
    id: 'mr-court-1',
    name: '京山国际网球中心',
    category: '球场',
    starLevel: 5,
    rating: 4.9,
    positiveRate: 99.2,
    complaintCount: 0,
    reviewCount: 1428,
    status: '五星诚信',
    badge: '京网推荐 · 零投诉示范场馆',
    recentReview: '灯光标准、订场联动车位充电桩非常丝滑！',
  },
  {
    id: 'mr-hotel-1',
    name: '文峰花园酒店（网球主题合作）',
    category: '酒店',
    starLevel: 5,
    rating: 4.9,
    positiveRate: 98.8,
    complaintCount: 0,
    reviewCount: 815,
    status: '五星诚信',
    badge: '京网推荐 · 赛事官方接待酒店',
    recentReview: '步行/摆渡3分钟到赛场，提供运动员营养早餐与球拍烘干。',
  },
  {
    id: 'mr-food-1',
    name: '桥米公馆 · 京山非遗特色鄂菜',
    category: '餐饮',
    starLevel: 5,
    rating: 4.9,
    positiveRate: 98.5,
    complaintCount: 0,
    reviewCount: 624,
    status: '五星诚信',
    badge: '京网推荐 · 明厨亮灶A级食安',
    recentReview: '国宝桥米锅巴与洪湖藕汤非常地道，票根直接享85折！',
  },
  {
    id: 'mr-coach-1',
    name: '陈浩 · 金网5.0认证陪练/教练',
    category: '教练',
    starLevel: 5,
    rating: 5.0,
    positiveRate: 99.6,
    complaintCount: 0,
    reviewCount: 326,
    status: '五星诚信',
    badge: '京网推荐 · 零投诉口碑教练',
    recentReview: '赛间加练针对性极强，帮孩子稳住了二发和反手节奏。',
  },
  {
    id: 'mr-hotel-2',
    name: '京山网球运动酒店',
    category: '酒店',
    starLevel: 4,
    rating: 4.8,
    positiveRate: 96.4,
    complaintCount: 1,
    reviewCount: 392,
    status: '四星优质',
    badge: '京网推荐 · 步行6分钟到赛场',
    recentReview: '大堂免费取用冰袋与穿线服务，性价比高。',
  },
  {
    id: 'mr-court-2',
    name: '京山文峰公园网球场',
    category: '球场',
    starLevel: 5,
    rating: 4.8,
    positiveRate: 97.9,
    complaintCount: 0,
    reviewCount: 654,
    status: '五星诚信',
    badge: '京网推荐 · 公益惠民示范场',
    recentReview: '白天免费打球，夜场打完步行300米就是文峰夜市！',
  },
  {
    id: 'mr-warn-1',
    name: 'XX路社会临时停车点（整改公示）',
    category: '球场',
    starLevel: 2,
    rating: 3.1,
    positiveRate: 68.0,
    complaintCount: 4,
    reviewCount: 42,
    status: '整改预警',
    badge: '黄牌降星预警 · 已暂停推荐',
    recentReview: '收费公示不清，已由市场监管部门介入责令限期整改。',
  },
]

export interface ModuleMeta {
  id: ModuleId
  code: string
  shortName: string
  title: string
}

export const MODULE_META_LIST: ModuleMeta[] = [
  { id: 1, code: '01', shortName: '首页总览', title: '首页总览与全城热门精选' },
  { id: 2, code: '02', shortName: '打 · 场地', title: '“打”：网球场地服务' },
  { id: 3, code: '03', shortName: '游 · 旅游', title: '“游”：旅游游览服务' },
  { id: 4, code: '04', shortName: '吃 · 美食', title: '“吃”：美食服务' },
  { id: 5, code: '05', shortName: '住 · 住宿', title: '“住”：住宿服务' },
  { id: 6, code: '06', shortName: '行 · 出行', title: '“行”：出行服务' },
  { id: 7, code: '07', shortName: '购 · 商品', title: '“购”：特色商品服务' },
  { id: 8, code: '08', shortName: '娱 · 娱乐', title: '“娱”：休闲娱乐服务' },
  { id: 9, code: '09', shortName: '训 · 培训', title: '“训”：培训研学服务' },
  { id: 10, code: '10', shortName: '便民配套', title: '便民配套服务' },
  { id: 11, code: '11', shortName: '互动反馈', title: '互动反馈' },
  { id: 12, code: '12', shortName: '小程序互通', title: '小程序互联互通' },
  { id: 13, code: '13', shortName: '个人中心', title: '个人中心' },
]

export function getModuleMeta(id: ModuleId): ModuleMeta {
  return MODULE_META_LIST.find((m) => m.id === id) ?? MODULE_META_LIST[0]!
}

function parseModuleFromUrl(): ModuleId | null {
  const params = new URLSearchParams(window.location.search)
  const queryId = Number(params.get('module'))
  if (Number.isInteger(queryId) && queryId >= 2 && queryId <= 13 && queryId !== 10) return queryId as ModuleId

  const legacyMatch = window.location.hash.match(/^#m(\d+)$/)
  const legacyId = Number(legacyMatch?.[1])
  return legacyId >= 2 && legacyId <= 13 ? legacyId as ModuleId : null
}

function parseSurfaceFromUrl(): '全部' | '硬地' | '红土' | '室内风雨' | '匹克球' {
  const s = new URLSearchParams(window.location.search).get('surface')
  if (s === '硬地' || s === '红土' || s === '室内风雨' || s === '匹克球') return s
  return '全部'
}

function parseRegionFromUrl(): '全部' | '温泉街道' | '新市街道' | '永兴街道' {
  const r = new URLSearchParams(window.location.search).get('region')
  if (r === '温泉街道' || r === '新市街道' || r === '永兴街道') return r
  return '全部'
}

const initialStandaloneModule = parseModuleFromUrl()

interface PersistedState {
  points: number
  sessionPointsEarned: number
  pointLogs: PointLogItem[]
  merchantRatings: MerchantRatingItem[]
  abilityLevel: string
  ability: AbilityDimensions
  origin: VisitorOrigin
  orders: PortalOrder[]
  coupons: CouponItem[]
  favorites: string[]
  posts: FeedbackPost[]
  complaints: ComplaintTicket[]
  claimedHomeSubsidy: boolean
  dismissedEventModal: boolean
  bookedCourtKeys: string[]
  matchmakingGames: MatchmakingGame[]
  groupClasses: GroupClassItem[]
  bookedCoachKeys: string[]
}

function loadSaved(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Partial<PersistedState>) : {}
  } catch {
    return {}
  }
}

const saved = loadSaved()

const state = reactive({
  isStandalonePage: initialStandaloneModule !== null,
  activeModule: (initialStandaloneModule ?? 1) as ModuleId,
  searchQuery: new URLSearchParams(window.location.search).get('q') ?? '',
  origin: (saved.origin ?? '武汉市（省内游客）') as VisitorOrigin,
  radius: '1公里' as RadiusOption,
  courtSurfaceFilter: parseSurfaceFromUrl(),
  courtRegionFilter: parseRegionFromUrl(),
  showActivityPopup: true,
  showEventModal: false,
  showTourneyRegModal: false,
  showArrivalGuideModal: false,
  dismissedEventModal: saved.dismissedEventModal ?? true,
  activeMatchRecapId: null as string | null,
  activeHotelId: null as string | null,
  activeProductId: null as string | null,
  showCinemaModal: false,
  points: saved.points ?? 1280,
  sessionPointsEarned: saved.sessionPointsEarned ?? 250,
  pointLogs: (saved.pointLogs ?? structuredClone(INITIAL_POINT_LOGS)) as PointLogItem[],
  merchantRatings: (saved.merchantRatings ?? structuredClone(INITIAL_MERCHANT_RATINGS)) as MerchantRatingItem[],
  abilityLevel: saved.abilityLevel ?? 'JS-3.5',
  ability: (saved.ability ?? { ...INITIAL_ABILITY }) as AbilityDimensions,
  liveMatches: structuredClone(ENRICHED_MATCHES) as LiveMatch[],
  courts: structuredClone(INITIAL_COURTS) as CourtVenue[],
  bookedCourtKeys: (saved.bookedCourtKeys ?? [...INITIAL_BOOKED_COURT_KEYS]) as string[],
  matchmakingGames: (saved.matchmakingGames ?? structuredClone(INITIAL_MATCHMAKING_GAMES)) as MatchmakingGame[],
  groupClasses: (saved.groupClasses ?? structuredClone(INITIAL_GROUP_CLASSES)) as GroupClassItem[],
  privateCoaches: structuredClone(INITIAL_PRIVATE_COACHES) as PrivateCoach[],
  bookedCoachKeys: (saved.bookedCoachKeys ?? [...INITIAL_BOOKED_COACH_KEYS]) as string[],
  orders: (saved.orders ?? structuredClone(INITIAL_ORDERS)) as PortalOrder[],
  coupons: (saved.coupons ?? structuredClone(INITIAL_COUPONS)) as CouponItem[],
  favorites: (saved.favorites ?? ['京山国际网球公寓', '桥米公馆', '钟祥明显陵延伸线']) as string[],
  posts: (saved.posts ?? structuredClone(INITIAL_POSTS)) as FeedbackPost[],
  complaints: (saved.complaints ?? structuredClone(INITIAL_COMPLAINTS)) as ComplaintTicket[],
  claimedHomeSubsidy: saved.claimedHomeSubsidy ?? false,
  ticketStubCode: 'JS-20261126-089',
  parkingLots: [
    { id: 'p1', name: '国际网球中心 P1', address: '温泉街道网球大道北侧P1入口', lng: 113.1185, lat: 31.0226, remain: 84, total: 160, rating: 4.9, note: '含12个快充桩 · 订场免费停3h', reserved: false, reservedSlot: '' },
    { id: 'ev1', name: '温泉新区超充站', address: '温泉街道温泉大道与京山大道交叉口', lng: 113.1228, lat: 31.0212, remain: 14, total: 18, rating: 4.9, note: '120kW快充 · 距场馆200m', isCharger: true, reserved: false, reservedSlot: '' },
    { id: 'p2', name: '文峰公园 P2', address: '新市街道文峰路文峰公园南门', lng: 113.1128, lat: 31.0185, remain: 42, total: 120, rating: 4.8, note: '距文峰夜市150m · 可预约', reserved: false, reservedSlot: '' },
  ],
  lightbox: null as LightboxPayload | null,
  activeDetail: null as DetailPagePayload | null,
  bookingDraft: null as BookingDraft | null,
  actionModal: null as ActionModalPayload | null,
  orderSuccessModal: null as OrderSuccessModalPayload | null,
  toastMessage: '',
})

function getPersistSnapshot(): PersistedState {
  return {
    points: state.points,
    sessionPointsEarned: state.sessionPointsEarned,
    pointLogs: state.pointLogs,
    merchantRatings: state.merchantRatings,
    abilityLevel: state.abilityLevel,
    ability: state.ability,
    origin: state.origin,
    orders: state.orders,
    coupons: state.coupons,
    favorites: state.favorites,
    posts: state.posts,
    complaints: state.complaints,
    claimedHomeSubsidy: state.claimedHomeSubsidy,
    dismissedEventModal: state.dismissedEventModal,
    bookedCourtKeys: state.bookedCourtKeys,
    matchmakingGames: state.matchmakingGames,
    groupClasses: state.groupClasses,
    bookedCoachKeys: state.bookedCoachKeys,
  }
}

function persistStateNow() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getPersistSnapshot()))
  } catch {
    // ignore storage errors
  }
}

function applySavedSnapshot(next: Partial<PersistedState>) {
  if (typeof next.points === 'number') state.points = next.points
  if (typeof next.sessionPointsEarned === 'number') state.sessionPointsEarned = next.sessionPointsEarned
  if (Array.isArray(next.pointLogs)) state.pointLogs = next.pointLogs
  if (Array.isArray(next.merchantRatings)) state.merchantRatings = next.merchantRatings
  if (typeof next.abilityLevel === 'string') state.abilityLevel = next.abilityLevel
  if (next.ability) state.ability = { ...next.ability }
  if (next.origin) state.origin = next.origin
  if (Array.isArray(next.orders)) state.orders = next.orders
  if (Array.isArray(next.coupons)) state.coupons = next.coupons
  if (Array.isArray(next.favorites)) state.favorites = next.favorites
  if (Array.isArray(next.posts)) state.posts = next.posts
  if (Array.isArray(next.complaints)) state.complaints = next.complaints
  if (typeof next.claimedHomeSubsidy === 'boolean') state.claimedHomeSubsidy = next.claimedHomeSubsidy
  if (typeof next.dismissedEventModal === 'boolean') state.dismissedEventModal = next.dismissedEventModal
  if (Array.isArray(next.bookedCourtKeys)) state.bookedCourtKeys = next.bookedCourtKeys
  if (Array.isArray(next.matchmakingGames)) state.matchmakingGames = next.matchmakingGames
  if (Array.isArray(next.groupClasses)) state.groupClasses = next.groupClasses
  if (Array.isArray(next.bookedCoachKeys)) state.bookedCoachKeys = next.bookedCoachKeys
}

function updateDocumentTitle(moduleId: ModuleId, standalone: boolean) {
  const meta = getModuleMeta(moduleId)
  document.title = standalone
    ? `${meta.title} - 京山网球`
    : '京山网球 · 中国网球之城'
}

function tourSpotDetail(spot: TourSpot, visit?: TourSpotVisitSelection): DetailPagePayload {
  return {
    kind: 'place',
    spotId: spot.id,
    visit,
    data: {
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
    },
  }
}

function parseDetailFromUrl(): DetailPagePayload | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('detail')
    if (!raw) return null
    if (raw === 'cinema') return { kind: 'cinema' }
    const [kind, id, ...options] = raw.split(':')
    if (kind === 'hotel' && id) {
      const [checkIn, checkOut, roomId] = options
      const stay = checkIn && checkOut && checkOut > checkIn
        && BOOKING_DATES.some((day) => day.iso === checkIn)
        && BOOKING_DATES.some((day) => day.iso === checkOut)
        ? { checkIn, checkOut, roomId }
        : undefined
      return { kind: 'hotel', hotelId: id, stay }
    }
    if (kind === 'spot' && id) {
      const spot = TOUR_SPOTS.find((entry) => entry.id === id)
      if (!spot) return null
      const [date, encodedSlot] = options
      const slot = TOUR_VISIT_SLOTS.find((option) => encodeURIComponent(option) === encodedSlot)
      const visit = date && slot && BOOKING_DATES.some((day) => day.iso === date) ? { date, slot } : undefined
      return tourSpotDetail(spot, visit)
    }
    if (kind === 'product' && id) return { kind: 'product', productId: id }
    if (kind === 'venue' && id) return { kind: 'venue', venueId: id }
  } catch {
    // ignore URL parse errors
  }
  return null
}

function encodeDetailParam(payload: DetailPagePayload): string {
  if (payload.kind === 'hotel') {
    const hotel = `hotel:${payload.hotelId}`
    if (!payload.stay) return hotel
    const { checkIn, checkOut, roomId } = payload.stay
    return `${hotel}:${checkIn}:${checkOut}${roomId ? `:${roomId}` : ''}`
  }
  if (payload.kind === 'product') return `product:${payload.productId}`
  if (payload.kind === 'venue') return `venue:${payload.venueId}`
  if (payload.kind === 'cinema') return 'cinema'
  if (payload.spotId) {
    const spot = `spot:${payload.spotId}`
    return payload.visit ? `${spot}:${payload.visit.date}:${encodeURIComponent(payload.visit.slot)}` : spot
  }
  return `place:${encodeURIComponent(payload.data.title.slice(0, 24))}`
}

export function buildModuleUrl(
  id: ModuleId,
  params?: Record<string, string | undefined>,
): string {
  const url = new URL(window.location.href)
  url.hash = ''
  url.search = ''
  if (id !== 1) {
    url.searchParams.set('module', String(id))
  }
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v && v !== '全部') url.searchParams.set(k, v)
    }
  }
  return url.toString()
}

watch(
  () => getPersistSnapshot(),
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch {
      // ignore storage errors
    }
  },
  { deep: true },
)

let toastTimer: number | undefined

export function usePortalStore() {
  const memberTier = computed(() => {
    if (state.points >= 1500) return { code: 'Lv.4', name: '冠军黑金会员', discount: 0.8 }
    if (state.points >= 1000) return { code: 'Lv.3', name: '金网精英会员', discount: 0.85 }
    if (state.points >= 500) return { code: 'Lv.2', name: '城市球友会员', discount: 0.92 }
    return { code: 'Lv.1', name: '挥拍新星会员', discount: 0.98 }
  })

  const activeOrdersCount = computed(
    () => state.orders.filter((o) => o.status !== '已取消').length,
  )

  function recordPoints(delta: number, title: string, category: string) {
    if (!delta) return
    state.points = Math.max(0, state.points + delta)
    if (delta > 0) state.sessionPointsEarned += delta
    const nowText = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
    state.pointLogs.unshift({
      id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      title,
      category,
      delta,
      time: `刚刚 ${nowText}`,
    })
  }

  function showToast(msg: string) {
    state.toastMessage = msg
    if (toastTimer) window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => {
      state.toastMessage = ''
    }, 3600)
  }

  function openModuleInNewWindow(
    id: ModuleId,
    params?: Record<string, string | undefined>,
    silent = false,
  ) {
    const meta = getModuleMeta(id)
    persistStateNow()
    const targetUrl = buildModuleUrl(id, params)
    const opened = window.open(targetUrl, '_blank')
    if (!opened) {
      window.location.href = targetUrl
      return
    }
    if (!silent) {
      showToast(`正在为您打开「${meta.title}」`)
    }
  }

  function openDetailPage(payload: DetailPagePayload) {
    state.activeDetail = payload
    state.lightbox = null
    state.activeHotelId = null
    state.activeProductId = null
    state.showCinemaModal = false
    state.bookingDraft = null
    persistStateNow()
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('detail', encodeDetailParam(payload))
      window.history.pushState({ detail: true, moduleId: state.activeModule }, '', url.toString())
    } catch {
      // ignore history errors
    }
    const titleText =
      payload.kind === 'place'
        ? payload.data.title
        : payload.kind === 'cinema'
          ? '京山国际影城 · 在线选座'
          : '详情页'
    document.title = `${titleText} - 京山网球`
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  function closeDetailPage() {
    if (!state.activeDetail) return
    state.activeDetail = null
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('detail')
      window.history.replaceState({ moduleId: state.activeModule }, '', url.toString())
    } catch {
      // ignore history errors
    }
    updateDocumentTitle(state.activeModule, state.isStandalonePage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openHotelDetail(hotelId: string, stay?: HotelStaySelection) {
    openDetailPage({ kind: 'hotel', hotelId, stay })
  }

  function openProductDetail(productId: string) {
    openDetailPage({ kind: 'product', productId })
  }

  function openVenueDetail(venueId: string, opts?: { date?: string; courtId?: string; slotTime?: string }) {
    openDetailPage({ kind: 'venue', venueId, ...opts })
  }

  function openCinemaDetail() {
    openDetailPage({ kind: 'cinema' })
  }

  function openTourSpotDetail(spot: TourSpot, visit?: TourSpotVisitSelection) {
    openDetailPage(tourSpotDetail(spot, visit))
  }

  function openModulePage(
    id: ModuleId,
    options?: {
      newWindow?: boolean
      params?: Record<string, string | undefined>
      silent?: boolean
    },
  ) {
    // 10 便民配套专栏已下线：统一拦截，避免残留入口打开隐藏页面
    if (id === 10) {
      showToast('该栏目已下线')
      return
    }

    // Explicit new-window jump when specifically requested
    if (options?.newWindow && id !== 1) {
      openModuleInNewWindow(id, options.params, options.silent)
      return
    }

    if (options?.params?.surface) {
      const s = options.params.surface
      if (s === '全部' || s === '硬地' || s === '红土' || s === '室内风雨' || s === '匹克球') {
        state.courtSurfaceFilter = s
      }
    }
    if (options?.params?.region) {
      const r = options.params.region
      if (r === '全部' || r === '温泉街道' || r === '新市街道' || r === '永兴街道') {
        state.courtRegionFilter = r
      }
    }

    const previousModule = state.activeModule
    const targetStandalone = id !== 1
    if (state.isStandalonePage === targetStandalone && state.activeModule === id && !state.activeDetail && !options?.params) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    state.activeDetail = null
    state.isStandalonePage = targetStandalone
    state.activeModule = id
    persistStateNow()
    try {
      const nextUrl = buildModuleUrl(id, options?.params)
      window.history.replaceState({ ...window.history.state, moduleId: previousModule }, '')
      window.history.pushState({ moduleId: id, returnToPortalPage: targetStandalone }, '', nextUrl)
    } catch {
      // ignore history errors
    }
    updateDocumentTitle(id, targetStandalone)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function switchModule(id: ModuleId, params?: Record<string, string | undefined>) {
    openModulePage(id, { newWindow: false, params })
  }

  function navigateToModulePage(id: ModuleId, params?: Record<string, string | undefined>) {
    openModulePage(id, { newWindow: false, params })
  }

  function openOrderSuccess(payload: OrderSuccessModalPayload) {
    state.orderSuccessModal = payload
  }

  function closeOrderSuccess() {
    state.orderSuccessModal = null
  }

  function returnFromModulePage() {
    if (window.history.state?.returnToPortalPage) window.history.back()
    else switchModule(1)
  }

  function openActionModal(payload: ActionModalPayload) {
    state.actionModal = payload
  }

  function openNavigation(payload: {
    placeName: string
    address: string
    lng: number
    lat: number
    distance: string
    driveMin: string
    tip: string
  }) {
    state.actionModal = { type: 'nav', ...payload }
  }

  function closeEventModal(dontShowAgain = false) {
    state.showEventModal = false
    if (dontShowAgain) state.dismissedEventModal = true
  }

  function openMatchRecap(matchId: string) {
    state.activeMatchRecapId = matchId
  }

  function addMatchComment(matchId: string, content: string, score: number) {
    const m = state.liveMatches.find((x) => x.id === matchId)
    if (!m || !content.trim()) return
    m.comments.unshift({
      id: `mc-${Date.now()}`,
      user: '张先生',
      city: state.origin.slice(0, 2),
      score,
      content: content.trim(),
      likes: 1,
      liked: true,
    })
    recordPoints(10, `发布赛事热评：${m.eventName}`, '互动')
    showToast('复盘热评发布成功！获得 +10 金网积分')
  }

  function rateMatchPlayer(matchId: string, side: 'A' | 'B', star: number) {
    const m = state.liveMatches.find((x) => x.id === matchId)
    if (!m) return
    const next = Number((((side === 'A' ? m.ratingA : m.ratingB) * 9 + star * 2) / 10).toFixed(1))
    if (side === 'A') m.ratingA = next
    else m.ratingB = next
    showToast(`已为 ${side === 'A' ? m.playerA : m.playerB} 打分（${star * 2}.0 分），当前虎扑综合评分 ${next}`)
  }

  function handleSearch() {
    const q = state.searchQuery.trim()
    if (!q) {
      showToast('请输入搜索关键词，如：红土、复盘、网球公寓、购房减5万、电影院、充电桩')
      return
    }
    let targetId: ModuleId = 2
    const params: Record<string, string | undefined> = { q }

    if (/红土/.test(q)) {
      state.courtSurfaceFilter = '红土'
      params.surface = '红土'
      targetId = 2
    } else if (/风雨|室内/.test(q)) {
      state.courtSurfaceFilter = '室内风雨'
      params.surface = '室内风雨'
      targetId = 2
    } else if (/比分|复盘|球场|订场|陪练|约球|硬地/.test(q)) targetId = 2
    else if (/游|绿林山|温泉|明显陵|漳河|夜市|导览/.test(q)) targetId = 3
    else if (/吃|桥米|美食|团餐|菜单/.test(q)) targetId = 4
    else if (/住|酒店|民宿|公寓|购房|5万/.test(q)) targetId = 5
    else if (/行|车位|停车|充电|限行|封闭|司机|公交|租车/.test(q)) targetId = 6
    else if (/购|商城|李宁|葛粉|文创|特产/.test(q)) targetId = 7
    else if (/娱|农庄|采摘|亲子|KTV|电影|影院|康养/.test(q)) targetId = 8
    else if (/训|网校|研学|团建|晋升|评测|康复/.test(q)) targetId = 9
    else if (/公厕|卫生间|医疗|ATM|母婴|天气|路况/.test(q)) targetId = 10
    else if (/投诉|评价|预警|打卡|12345/.test(q)) targetId = 11
    else if (/小程序|政务|打车|支付/.test(q)) targetId = 12
    else if (/积分|会员|五维|订单|票根|个人/.test(q)) targetId = 13

    openModulePage(targetId, { newWindow: false, params, silent: true })
    const meta = getModuleMeta(targetId)
    showToast(`已为您进入「${meta.title}」`)
  }

  function openPhoto(payload: LightboxPayload) {
    openDetailPage({ kind: 'place', data: payload })
  }

  function openBookingModal(draft: BookingDraft) {
    openDetailPage({
      kind: 'venue',
      venueId: draft.venueId,
      date: draft.date,
      courtId: draft.courtId,
      slotTime: draft.slotTime,
    })
  }

  function refreshLiveScores() {
    const m = state.liveMatches[0]
    if (!m) return
    const scoreSeq = ['0', '15', '30', '40']
    const idx = scoreSeq.indexOf(m.setsA[2] ?? '30')
    if (idx < 3) {
      m.setsA[2] = scoreSeq[idx + 1] ?? '40'
    } else {
      m.setsA[1] = String(Number(m.setsA[1]) + 1)
      m.setsA[2] = '0'
      m.setsB[2] = '0'
      m.playByPlay.unshift({
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
        setInfo: `第2盘 局分 ${m.setsA[1]}-${m.setsB[1]}`,
        tag: '关键分',
        text: `${m.playerA} 保发成功，网球记实时战报已同步更新！`,
      })
    }
    showToast(`已从「网球记」同步最新局分：${m.playerA} ${m.setsA.join('-')} vs ${m.playerB} ${m.setsB.join('-')}`)
  }

  function reserveParkingOrCharger(lotId: string, arrivalDate?: string, arrivalSlot?: string) {
    const lot = state.parkingLots.find((l) => l.id === lotId)
    if (!lot) return
    const slotText = arrivalDate && arrivalSlot ? `${arrivalDate} ${arrivalSlot}` : '今日最近时段（保留30分钟）'
    if (lot.reserved && lot.reservedSlot === slotText) {
      showToast(`您已预约「${lot.name}」（${slotText}），无需重复锁位`)
      return
    }
    return requestReservation({
      title: lot.name,
      fields: [
        { label: '服务', value: lot.isCharger ? '预约充电' : '预约停车' },
        { label: '预约时段', value: slotText },
        { label: '地址', value: lot.address },
      ],
      successMessage: '到场后可凭订场码核销。',
    }, () => {
      if (!lot.reserved) {
        if (lot.remain <= 0) throw new ReservationUnavailable('该点位当前没有空余名额，请选择其他点位。')
        lot.remain -= 1
      }
      lot.reserved = true
      lot.reservedSlot = slotText
    })
  }

  async function confirmCourtBooking(opts: {
    venueId?: string
    date?: string
    selectedSlots?: { courtId: string; courtName: string; hour: string; price: number; memberPrice: number }[]
    bookParking: boolean
    bookCharger: boolean
    usePoints: boolean
  }) {
    const venueFromId = opts.venueId ? state.courts.find((c) => c.id === opts.venueId) : null
    const draft =
      state.bookingDraft ??
      (venueFromId
        ? {
            venueId: venueFromId.id,
            venueName: venueFromId.name,
            date: opts.date,
            slotTime: opts.selectedSlots?.[0]?.hour ?? '16:00',
            price: opts.selectedSlots?.[0]?.price ?? 80,
            memberPrice: opts.selectedSlots?.[0]?.memberPrice ?? 68,
            parkingName: venueFromId.parkingName,
            chargerName: venueFromId.chargerName,
          }
        : null)
    if (!draft) return false
    const dateIso = opts.date ?? draft.date ?? BOOKING_DATES[0]!.iso
    const dateLabel = BOOKING_DATES.find((d) => d.iso === dateIso)?.shortDate ?? dateIso
    const picked = opts.selectedSlots && opts.selectedSlots.length > 0
      ? opts.selectedSlots.map((slot) => ({ ...slot }))
      : [{
          courtId: draft.courtId ?? 'default',
          courtName: '标准场地',
          hour: draft.slotTime,
          price: draft.price,
          memberPrice: draft.memberPrice,
        }]

    const memberSum = picked.reduce((acc, s) => acc + s.memberPrice, 0)
    const discountFromPoints = opts.usePoints && state.points >= 200 ? 20 : 0
    const finalPrice = Math.max(0, memberSum - discountFromPoints)
    const linked = [
      opts.bookParking ? draft.parkingName : '',
      opts.bookCharger ? draft.chargerName : '',
    ]
      .filter(Boolean)
      .join(' + ')

    const slotSummary = picked
      .map((s) => `${s.courtName} ${formatHourRange(s.hour)}`)
      .join('、')

    const newOrder: PortalOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      category: '场地',
      title: `${draft.venueName.split('（')[0]} · ${dateLabel}（${picked.length}小时）`,
      subtitle: `${slotSummary}${linked ? ` ｜ 已联动：${linked}` : ''}`,
      time: `${dateLabel} ${formatHourRange(picked[0]!.hour)}`,
      amount: finalPrice,
      status: '待核销',
      cancellable: true,
    }

    const slotKeys = picked.map((slot) => `${draft.venueId}|${dateIso}|${slot.courtId}|${slot.hour}`)
    return requestReservation({
      title: draft.venueName,
      fields: [
        { label: '预约日期', value: dateLabel },
        { label: '场地与时段', value: picked.map((slot) => `${slot.courtName} ${formatHourRange(slot.hour)}`).join('\n') },
        ...(linked ? [{ label: '联动预约', value: linked }] : []),
        ...(discountFromPoints > 0 ? [{ label: '积分抵扣', value: '200 积分抵扣 ¥20' }] : []),
      ],
      amount: finalPrice,
      successMessage: `已同步至个人中心，获赠 ${50 * picked.length} 积分。`,
    }, async () => {
      if (slotKeys.some((key) => state.bookedCourtKeys.includes(key))) {
        throw new ReservationUnavailable('所选时段已被预订，请返回重选。')
      }
      if (discountFromPoints > 0 && state.points < 200) {
        throw new ReservationUnavailable('可用积分已变更，请返回重新核对金额。')
      }
      await saveReservationOrder(newOrder)
      if (discountFromPoints > 0) recordPoints(-200, `订场抵扣：${newOrder.title}`, '抵现')
      recordPoints(50 * picked.length, newOrder.title, '订场')
      state.bookedCourtKeys.push(...slotKeys)

      const v = state.courts.find((c) => c.id === draft.venueId)
      const slot = v?.slots.find((s) => s.time === draft.slotTime)
      if (slot) {
        slot.booked = true
        slot.remaining = Math.max(0, slot.remaining - 1)
      }
      state.bookingDraft = null
      return newOrder.id
    })
  }

  function joinMatchmakingGame(gameId: string) {
    const g = state.matchmakingGames.find((x) => x.id === gameId)
    if (!g) return
    if (g.joinedByMe) {
      g.joinedByMe = false
      g.currentPlayers = Math.max(1, g.currentPlayers - 1)
      showToast(`已取消报名「${g.title}」`)
      return
    }
    if (g.currentPlayers >= g.maxPlayers) {
      showToast('该球局人数已满，请选择其他可加入球局')
      return
    }
    const dateLabel = BOOKING_DATES.find((d) => d.iso === g.date)?.shortDate ?? g.date
    const order: PortalOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      category: '场地',
      title: `约球：${g.title}`,
      subtitle: `${g.venueName} · CUTR ${g.cutrBand} · ${g.format}`,
      time: `${dateLabel} ${g.startTime}-${g.endTime}`,
      amount: g.feePerPerson,
      status: '待核销',
      cancellable: true,
    }
    return requestReservation({
      title: order.title,
      fields: [
        { label: '日期与时段', value: order.time },
        { label: '场馆与球局', value: order.subtitle },
      ],
      amount: order.amount,
      successTitle: '报名成功',
      successMessage: '已同步至个人中心，获赠 30 积分。',
    }, () => {
      if (g.joinedByMe || g.currentPlayers >= g.maxPlayers) {
        throw new ReservationUnavailable('球局名额已变更，请返回查看最新状态。')
      }
      g.joinedByMe = true
      g.currentPlayers += 1
      recordPoints(30, order.title, '约球')
      state.orders.unshift(order)
      return order.id
    })
  }

  function publishMatchmakingGame(payload: Omit<MatchmakingGame, 'id' | 'hostName' | 'hostOrigin' | 'currentPlayers' | 'joinedByMe'>) {
    const next: MatchmakingGame = {
      ...payload,
      id: `mg-${Date.now()}`,
      hostName: '张先生（我发起）',
      hostOrigin: state.origin.slice(0, 2),
      currentPlayers: 1,
      joinedByMe: true,
    }
    state.matchmakingGames.unshift(next)
    recordPoints(40, `发起同城约球：${next.title}`, '约球')
    showToast(`约球发布成功！「${next.title}」已上线，同水平球友均可报名（+40积分）`)
  }

  function bookGroupClass(classId: string) {
    const cls = state.groupClasses.find((c) => c.id === classId)
    if (!cls) return
    if (cls.bookedByMe) {
      showToast(`您已预约「${cls.title}」，无需重复报名`)
      return
    }
    if (cls.enrolled >= cls.capacity) {
      showToast('本节团体课名额已满，请选择其他日期或时段')
      return
    }
    const dateLabel = BOOKING_DATES.find((d) => d.iso === cls.date)?.shortDate ?? cls.date
    const order: PortalOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      category: '课程',
      title: `团体课：${cls.title}`,
      subtitle: `${cls.coachName} · ${cls.venueName}`,
      time: `${dateLabel} ${cls.startTime}-${cls.endTime}`,
      amount: cls.memberPrice,
      status: '待上课',
      cancellable: true,
    }
    return requestReservation({
      title: order.title,
      fields: [
        { label: '日期与时段', value: order.time },
        { label: '教练与场馆', value: order.subtitle },
      ],
      amount: order.amount,
      successMessage: '已同步至个人中心，获赠 60 积分。',
    }, () => {
      if (cls.bookedByMe || cls.enrolled >= cls.capacity) {
        throw new ReservationUnavailable('课程名额已变更，请返回查看最新状态。')
      }
      cls.bookedByMe = true
      cls.enrolled += 1
      state.orders.unshift(order)
      state.points += 60
      return order.id
    })
  }

  function bookPrivateCoachSlot(coachId: string, dateIso: string, hour: string) {
    const coach = state.privateCoaches.find((c) => c.id === coachId)
    if (!coach) return
    const key = `${coachId}|${dateIso}|${hour}`
    if (state.bookedCoachKeys.includes(key)) {
      showToast('该时段已被预约，请选择教练其他空闲时段')
      return
    }
    const dateLabel = BOOKING_DATES.find((d) => d.iso === dateIso)?.shortDate ?? dateIso
    const range = formatHourRange(hour)
    const order: PortalOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      category: '课程',
      title: `私教课：${coach.name}（${coach.specialty}）`,
      subtitle: `${coach.venueName} · ${coach.tier} · 1对1专属指导`,
      time: `${dateLabel} ${range}`,
      amount: coach.memberPrice,
      status: '待上课',
      cancellable: true,
    }
    return requestReservation({
      title: order.title,
      fields: [
        { label: '日期与时段', value: order.time },
        { label: '场馆与课程', value: order.subtitle },
      ],
      amount: order.amount,
      successMessage: '已同步至个人中心，获赠 80 积分。',
    }, () => {
      if (state.bookedCoachKeys.includes(key)) throw new ReservationUnavailable('该时段已被预约，请返回重选。')
      state.bookedCoachKeys.push(key)
      state.orders.unshift(order)
      state.points += 80
      return order.id
    })
  }

  async function saveReservationOrder(order: PortalOrder) {
    if (!USE_MOCK) {
      await apiRequest<PortalOrder>('/orders', { method: 'POST', body: JSON.stringify(order) })
    }
    state.orders.unshift(order)
  }

  async function createQuickOrder(
    category: PortalOrder['category'],
    title: string,
    subtitle: string,
    amount: number,
    pointsGain = 60,
    pointsSpent = 0,
    reservation?: Partial<Pick<ReservationSummary, 'fields' | 'successTitle' | 'successMessage'>>,
  ) {
    if (category !== '商品' && (!Number.isFinite(amount) || amount < 0 || amount > Number.MAX_SAFE_INTEGER / 100)) {
      showToast('预约金额超出可处理范围，请调整数量。')
      return false
    }
    const order: PortalOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      category,
      title,
      subtitle,
      time: '刚刚下单',
      amount,
      status: category === '住宿' ? '已确认' : '待使用',
      cancellable: true,
    }
    if (category === '商品') {
      await apiRequest('/orders', { method: 'POST', body: JSON.stringify(order) }, () => order)
      state.orders.unshift(order)
      const actualSpent = pointsSpent > 0 && state.points >= pointsSpent ? pointsSpent : 0
      if (actualSpent > 0) recordPoints(-actualSpent, `购物抵扣：${title}`, '抵现')
      recordPoints(pointsGain, title, '购物')
      openOrderSuccess({
        headline: '购买成功',
        orderId: order.id,
        category,
        title,
        subtitle,
        amount,
        pointsGain,
        pointsSpent: actualSpent,
        note: '支付已完成，我们将尽快安排原产地打包发货并同步物流',
      })
      return true
    }

    return requestReservation({
      title,
      fields: reservation?.fields ?? [{ label: '预约信息', value: subtitle }],
      amount,
      successTitle: reservation?.successTitle,
      successMessage: reservation?.successMessage ?? `已同步至个人中心，获赠 ${pointsGain} 积分。`,
    }, async () => {
      if (pointsSpent > state.points) throw new ReservationUnavailable('可用积分已变更，请返回重新核对金额。')
      await saveReservationOrder(order)
      if (pointsSpent > 0) recordPoints(-pointsSpent, `消费抵扣：${title}`, '抵现')
      recordPoints(pointsGain, title, category)
      return order.id
    })
  }

  async function cancelOrder(orderId: string) {
    await apiRequest(`/orders/${orderId}/cancel`, { method: 'POST' }, () => ({ ok: true }))
    const target = state.orders.find((o) => o.id === orderId)
    if (target) {
      target.status = '已取消'
      target.cancellable = false
      showToast(`订单「${target.title}」已取消，费用将原路极速退回`)
    }
  }

  function redeemPoints(cost: number, title: string, desc: string) {
    if (state.points < cost) {
      showToast(`当前积分不足（需 ${cost} 分，当前 ${state.points} 分）`)
      return
    }
    recordPoints(-cost, `积分兑换：${title}`, '兑换')
    state.coupons.unshift({
      id: `cp-${Date.now()}`,
      title,
      desc,
      badge: '积分兑换',
      status: '有效中',
    })
    showToast(`兑换成功！消耗 ${cost} 积分，已发放「${title}」至我的优惠券`)
  }

  async function runUpgradeTest(orgName: string, usePoints: boolean) {
    if (usePoints && state.points >= 200) state.points -= 200
    const nextAbility: AbilityDimensions = {
      serve: Math.min(98, state.ability.serve + 4),
      baseline: Math.min(98, state.ability.baseline + 3),
      volley: Math.min(97, state.ability.volley + 7),
      footwork: Math.min(97, state.ability.footwork + 4),
      stamina: Math.min(97, state.ability.stamina + 4),
    }
    await apiRequest(
      '/ability/upgrade-test',
      { method: 'POST', body: JSON.stringify({ orgName, nextAbility }) },
      () => nextAbility,
    )
    state.ability = nextAbility
    const levels = ['JS-3.5', 'JS-4.0', 'JS-4.5', 'JS-5.0']
    const curIdx = levels.indexOf(state.abilityLevel)
    state.abilityLevel = levels[Math.min(levels.length - 1, Math.max(0, curIdx) + 1)] ?? 'JS-4.5'
    state.points += 100
    showToast(`已在「${orgName}」完成晋升复测录入！五维能力图已刷新，等级晋升为 ${state.abilityLevel}（+100分）`)
  }

  function likePost(postId: string) {
    const p = state.posts.find((x) => x.id === postId)
    if (!p) return
    p.liked = !p.liked
    p.likes += p.liked ? 1 : -1
  }

  async function submitFeedback(payload: {
    mode: 'review' | 'complaint'
    category: string
    tag?: string
    target: string
    rating: number
    content: string
  }) {
    if (!payload.content.trim()) {
      showToast('请填写具体评价或反馈内容')
      return
    }
    if (payload.mode === 'review') {
      const post: FeedbackPost = {
        id: `post-${Date.now()}`,
        author: '张先生',
        origin: state.origin.slice(0, 2),
        rating: payload.rating,
        title: payload.content.trim(),
        photo: '/images/tournament_1.jpg',
        likes: 1,
        liked: true,
        category: payload.category,
      }
      await apiRequest('/feedback/review', { method: 'POST', body: JSON.stringify(post) }, () => post)
      state.posts.unshift(post)
      recordPoints(20, `商户星级点评：${payload.target || payload.category}`, '点评')
      showToast('商户点评发布成功！动态星级已同步更新，获得 +20 金网积分')
    } else {
      const tagRouteMap: Record<string, { dept: string; sla: string }> = {
        '价格争议': { dept: '市市场监管局（价格监督科）', sla: '限时 24 小时办结' },
        '服务不符': { dept: '市文旅局（市场综合执法）', sla: '限时 24 小时办结' },
        '卫生/医疗保障': { dept: '市卫健局（监督保障组）', sla: '限时 12 小时办结' },
        '交通停车收费': { dept: '市交通局 / 城运中心', sla: '限时 12 小时办结' },
      }
      const deptMap: Record<string, string> = {
        '酒店/公寓/餐饮价格纠纷': '市市场监管局（价格监督科）',
        '出行/停车/充电桩': '市交通局 / 城运中心',
        '医疗康复/便民设施': '市卫健局（监督保障组）',
      }
      const routed = payload.tag ? tagRouteMap[payload.tag] : undefined
      const dept = routed?.dept ?? deptMap[payload.category] ?? '市文旅局 / 12345 城运中心'
      const sla = routed?.sla ?? '限时 24 小时办结'
      const nowTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
      const ticket: ComplaintTicket = {
        id: `FB-${Date.now().toString().slice(-4)}`,
        category: payload.category,
        tag: payload.tag || '服务反馈',
        target: payload.target || '相关服务商户',
        content: payload.content.trim(),
        status: '已分办至对应部门',
        dept,
        sla,
        createdAt: `今日 ${nowTime}`,
        timeline: [
          { step: '游客一键提交投诉', time: `今日 ${nowTime}`, detail: `已关联商户【${payload.target || '相关商户'}】与问题标签【${payload.tag || payload.category}】`, done: true },
          { step: '系统按标签自动分派', time: `今日 ${nowTime}`, detail: `已自动分派至【${dept}】（${sla}），同步抄送政府监管端红黑榜系统`, done: true },
          { step: '责任部门现场核查处置', time: '处理中…', detail: '执法专员正在联系商户核实情况并督促整改', done: false },
          { step: '处置结果实时回传', time: '待回传', detail: '办结后自动推送整改凭证并同步商户动态星级', done: false },
        ],
      }
      await apiRequest('/feedback/complaint', { method: 'POST', body: JSON.stringify(ticket) }, () => ticket)
      state.complaints.unshift(ticket)
      showToast(`一键投诉已受理（单号 ${ticket.id}），已按标签自动分派至：${ticket.dept}`)
    }
  }

  function rateMerchant(merchantId: string, star: number, comment: string) {
    const m = state.merchantRatings.find((x) => x.id === merchantId)
    if (!m) return
    const nextCount = m.reviewCount + 1
    const nextRating = Number(((m.rating * Math.min(m.reviewCount, 50) + star) / (Math.min(m.reviewCount, 50) + 1)).toFixed(1))
    m.reviewCount = nextCount
    m.rating = Math.min(5.0, Math.max(1.0, nextRating))
    m.positiveRate = Number(Math.min(99.9, Math.max(55, m.positiveRate + (star >= 4 ? 0.1 : -1.2))).toFixed(1))
    m.starLevel = m.rating >= 4.8 && m.complaintCount === 0 ? 5 : m.rating >= 4.4 ? 4 : m.rating >= 3.8 ? 3 : 2
    m.status = m.starLevel === 5 ? '五星诚信' : m.starLevel === 4 ? '四星优质' : '整改预警'
    m.recentReview = comment.trim() || `张先生给出 ${star} 星好评，体验非常满意！`
    m.reviewedByMe = true
    state.posts.unshift({
      id: `post-${Date.now()}`,
      author: '张先生',
      origin: state.origin.slice(0, 2),
      rating: star,
      title: `【${m.name}】${m.recentReview}`,
      photo: m.category === '球场' ? '/images/tournament_1.jpg' : m.category === '酒店' ? '/images/hotel.jpg' : m.category === '餐饮' ? '/images/cuisine.jpg' : '/images/coach_1.jpg',
      likes: 1,
      liked: true,
      category: m.category,
    })
    recordPoints(20, `点评商户：${m.name}`, '点评')
    showToast(`已完成对「${m.name}」的 ${star} 星点评，动态评级已同步更新（+20积分）`)
  }

  function advanceComplaintProgress(ticketId: string) {
    const t = state.complaints.find((x) => x.id === ticketId)
    if (!t || !t.timeline) return
    const nowTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
    const nextIdx = t.timeline.findIndex((s) => !s.done)
    if (nextIdx === -1) {
      showToast(`工单 ${t.id} 已全部办结并回传结果`)
      return
    }
    const step = t.timeline[nextIdx]!
    step.done = true
    step.time = `今日 ${nowTime}`
    if (nextIdx === 2) {
      step.detail = `${t.dept}专员已抵达现场核查完毕，责令商户当场退还差价并规范明码标价`
      t.status = '部门核查处置中'
      showToast(`工单 ${t.id} 进度实时回传：${t.dept}已完成现场核查处置`)
    } else if (nextIdx === 3) {
      step.detail = '已办结并退还争议费用，同步扣减该商户动态信用分并回传政府监管端'
      t.status = '已办结 · 反馈满意'
      showToast(`工单 ${t.id} 已限时办结，处置结果已实时回传！`)
    }
  }

  function registerYouthTournament(payload: {
    tournamentName: string
    playerName: string
    group: string
    venue: string
    fee: number
  }) {
    const order: PortalOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      category: '门票',
      title: `赛事报名：${payload.tournamentName}`,
      subtitle: `参赛选手：${payload.playerName} · ${payload.group} · ${payload.venue}`,
      time: '11/28 开赛',
      amount: payload.fee,
      status: '已确认',
      cancellable: true,
    }
    state.orders.unshift(order)
    recordPoints(120, `报名${payload.tournamentName}（${payload.group}）`, '参赛')
    showToast(`报名成功！已为 ${payload.playerName} 锁定「${payload.group}」参赛席位（+120积分）`)
    return order.id
  }

  function toggleFavorite(name: string) {
    const idx = state.favorites.indexOf(name)
    if (idx >= 0) {
      state.favorites.splice(idx, 1)
      showToast(`已取消收藏「${name}」`)
    } else {
      state.favorites.unshift(name)
      showToast(`已收藏「${name}」，可在个人中心查看`)
    }
  }

  function claimHomeSubsidy() {
    if (state.claimedHomeSubsidy) {
      showToast('您已领取过「房管局网球公开赛购房减5万元补贴凭证」，可在个人中心出示')
      return
    }
    state.claimedHomeSubsidy = true
    state.coupons.unshift({
      id: 'cp-home-5w',
      title: '市房管局购房直减 ¥50,000 补贴凭证',
      desc: '温泉世家 / 网球新城等赛事合作楼盘核销有效',
      badge: '房管局补贴',
      status: '有效中',
    })
    showToast('已成功领取「市房管局网球公开赛购房减 ¥50,000 补贴凭证」，已存入个人中心！')
  }

  function initHashRouting() {
    // Bridge legacy modal triggers directly to the full Airbnb-style detail page
    watch(
      () => state.activeHotelId,
      (id) => {
        if (id) openDetailPage({ kind: 'hotel', hotelId: id })
      },
    )
    watch(
      () => state.activeProductId,
      (id) => {
        if (id) openDetailPage({ kind: 'product', productId: id })
      },
    )
    watch(
      () => state.showCinemaModal,
      (show) => {
        if (show) openDetailPage({ kind: 'cinema' })
      },
    )

    const syncFromLocation = () => {
      const urlDetail = parseDetailFromUrl()
      const urlModule = parseModuleFromUrl()
      if (urlModule) {
        state.isStandalonePage = true
        state.activeModule = urlModule
        state.courtSurfaceFilter = parseSurfaceFromUrl()
        state.courtRegionFilter = parseRegionFromUrl()
      } else {
        state.isStandalonePage = false
        state.activeModule = 1
      }

      if (urlDetail) {
        state.activeDetail = urlDetail
        return
      }
      if (!new URLSearchParams(window.location.search).get('detail')) {
        state.activeDetail = null
      }
      updateDocumentTitle(state.activeModule, state.isStandalonePage)
    }

    syncFromLocation()
    window.addEventListener('popstate', syncFromLocation)
    window.addEventListener('hashchange', syncFromLocation)
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          applySavedSnapshot(JSON.parse(e.newValue) as Partial<PersistedState>)
        } catch {
          // ignore invalid storage payload
        }
      }
    })
  }

  return {
    state,
    memberTier,
    activeOrdersCount,
    showToast,
    switchModule,
    navigateToModulePage,
    returnFromModulePage,
    openModulePage,
    openModuleInNewWindow,
    openDetailPage,
    closeDetailPage,
    openHotelDetail,
    openProductDetail,
    openVenueDetail,
    openCinemaDetail,
    openTourSpotDetail,
    buildModuleUrl,
    openActionModal,
    openOrderSuccess,
    closeOrderSuccess,
    openNavigation,
    closeEventModal,
    openMatchRecap,
    addMatchComment,
    rateMatchPlayer,
    handleSearch,
    openPhoto,
    openBookingModal,
    refreshLiveScores,
    reserveParkingOrCharger,
    confirmCourtBooking,
    joinMatchmakingGame,
    publishMatchmakingGame,
    bookGroupClass,
    bookPrivateCoachSlot,
    createQuickOrder,
    cancelOrder,
    redeemPoints,
    runUpgradeTest,
    likePost,
    submitFeedback,
    rateMerchant,
    advanceComplaintProgress,
    registerYouthTournament,
    recordPoints,
    toggleFavorite,
    claimHomeSubsidy,
    initHashRouting,
  }
}
