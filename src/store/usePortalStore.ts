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
import { TOURNAMENT_REGISTRATION_OPTIONS } from '../mock/trainingData'
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
  { id: 'pt-6', title: '预约陈浩陪练 · 网前截击特训课', category: '参训', delta: 80, time: '11-27 16:00' },
  { id: 'pt-5', title: '游览绿林山风景区（电子票根核销）', category: '游览', delta: 60, time: '11-27 10:30' },
  { id: 'pt-4', title: '桥米公馆用餐（联盟85折核销）', category: '美食', delta: 40, time: '11-26 19:20' },
  { id: 'pt-3', title: '入住文峰花园酒店（合作酒店礼遇）', category: '住宿', delta: 120, time: '11-26 16:30' },
  { id: 'pt-2', title: '预订国际网球中心3号场（含停车充电）', category: '订场', delta: 50, time: '11-26 14:00' },
  { id: 'pt-1', title: '报名2026京山网球公开赛分级赛', category: '参赛', delta: 120, time: '11-26 09:30' },
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
    status: '五星标杆',
    badge: '温泉街道 · 9片标准场',
    recentReview: '灯光标准，订场顺手锁车位和充电桩非常顺畅。',
    experienced: true,
  },
  {
    id: 'mr-hotel-1',
    name: '文峰花园酒店',
    category: '酒店',
    starLevel: 5,
    rating: 4.9,
    positiveRate: 98.8,
    complaintCount: 0,
    reviewCount: 815,
    status: '五星标杆',
    badge: '温泉街道 · 赛事合作酒店',
    recentReview: '摆渡3分钟到赛场，含运动早餐和球拍烘干服务。',
    experienced: true,
  },
  {
    id: 'mr-food-1',
    name: '桥米公馆',
    category: '餐饮',
    starLevel: 5,
    rating: 4.9,
    positiveRate: 98.5,
    complaintCount: 0,
    reviewCount: 624,
    status: '五星标杆',
    badge: '温泉街道 · 联盟85折',
    recentReview: '桥米锅巴和藕汤很地道，明码标价，票根直享85折。',
    experienced: true,
  },
  {
    id: 'mr-coach-1',
    name: '陈浩 · 金网教练',
    category: '教练',
    starLevel: 5,
    rating: 5.0,
    positiveRate: 99.6,
    complaintCount: 0,
    reviewCount: 326,
    status: '五星标杆',
    badge: '金网5.0 · 私教/陪练',
    recentReview: '网前截击与二发调整针对性强，课程节奏紧凑。',
    experienced: true,
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
    status: '五星标杆',
    badge: '新市街道 · 公益惠民场',
    recentReview: '白天公益免费，夜场打完步行可达文峰夜市。',
  },
  {
    id: 'mr-hotel-2',
    name: '京山网球运动酒店',
    category: '酒店',
    starLevel: 4,
    rating: 4.6,
    positiveRate: 94.8,
    complaintCount: 1,
    reviewCount: 392,
    status: '四星优良',
    badge: '温泉街道 · 步行6分钟到场',
    recentReview: '大堂配冰袋与穿线服务，高峰期入住办理稍慢。',
  },
  {
    id: 'mr-food-2',
    name: '文峰河畔碳火烧烤街',
    category: '餐饮',
    starLevel: 4,
    rating: 4.5,
    positiveRate: 93.4,
    complaintCount: 1,
    reviewCount: 520,
    status: '四星优良',
    badge: '新市街道 · 夜市联盟',
    recentReview: '夜场球后聚餐方便，高峰时段上菜略有等待。',
  },
  {
    id: 'mr-warn-1',
    name: '城南快捷宾馆',
    category: '酒店',
    starLevel: 2,
    rating: 3.2,
    positiveRate: 71.0,
    complaintCount: 4,
    reviewCount: 68,
    status: '降星整改',
    badge: '已降星 · 暂停推荐',
    recentReview: '存在赛期临时加价投诉，已责令限期整改。',
  },
]

function recalcMerchantGrade(m: MerchantRatingItem) {
  if (m.complaintCount >= 3 || m.rating < 3.8 || m.positiveRate < 80) {
    m.starLevel = m.rating < 3.0 || m.complaintCount >= 5 ? 1 : 2
    m.status = '降星整改'
  } else if (m.complaintCount >= 1 || m.rating < 4.7 || m.positiveRate < 95) {
    m.starLevel = m.rating < 4.3 ? 3 : 4
    m.status = '四星优良'
  } else {
    m.starLevel = 5
    m.status = '五星标杆'
  }
}

function hydrateMerchantRatings(savedList?: MerchantRatingItem[]): MerchantRatingItem[] {
  const base = structuredClone(INITIAL_MERCHANT_RATINGS)
  if (!Array.isArray(savedList) || savedList.length === 0) return base
  const savedMap = new Map(savedList.map((item) => [item.id, item]))
  return base.map((item) => {
    const old = savedMap.get(item.id)
    if (!old) return item
    if (old.reviewedByMe) {
      const merged: MerchantRatingItem = {
        ...item,
        rating: old.rating,
        positiveRate: old.positiveRate,
        complaintCount: old.complaintCount,
        reviewCount: old.reviewCount,
        recentReview: old.recentReview,
        reviewedByMe: true,
        myRating: old.myRating,
      }
      recalcMerchantGrade(merged)
      return merged
    }
    return item
  })
}

export type ToastTone = 'success' | 'warning' | 'info'

export interface ToastPayload {
  id: number
  title: string
  message: string
  tone: ToastTone
}

function inferToastMeta(msg: string): { title: string; tone: ToastTone } {
  if (/请填写|请输入|请先/.test(msg)) return { title: '请完善信息', tone: 'warning' }
  if (/积分不足/.test(msg)) return { title: '积分不足', tone: 'warning' }
  if (/人数已满|名额已满|已满|已被预约|不可预订|最多选择/.test(msg)) return { title: '名额提示', tone: 'warning' }
  if (/超出|整数/.test(msg)) return { title: '数量提示', tone: 'warning' }
  if (/已下线|无需重复|您已预约|您已下单|您已领取/.test(msg)) return { title: '温馨提示', tone: 'warning' }
  if (/已取消/.test(msg)) return { title: '已取消', tone: 'info' }
  if (/已切换账户|已切换游客来源地/.test(msg)) return { title: '账户已切换', tone: 'info' }
  if (/已为您进入|已为您筛选|正在为您打开|管用分离|当前状态/.test(msg)) return { title: '操作提示', tone: 'info' }
  if (/评价|点评|打分|热评/.test(msg)) return { title: '评价成功', tone: 'success' }
  if (/投诉已受理/.test(msg)) return { title: '投诉已受理', tone: 'success' }
  if (/已办结回传|已限时办结/.test(msg)) return { title: '投诉已办结', tone: 'success' }
  if (/进度回传/.test(msg)) return { title: '处置进度回传', tone: 'success' }
  if (/已反馈工单/.test(msg)) return { title: '反馈已提交', tone: 'success' }
  if (/兑换成功/.test(msg)) return { title: '兑换成功', tone: 'success' }
  if (/报名成功/.test(msg)) return { title: '报名成功', tone: 'success' }
  if (/约球发布成功/.test(msg)) return { title: '发布成功', tone: 'success' }
  if (/核销成功/.test(msg)) return { title: '核销成功', tone: 'success' }
  if (/晋升复测/.test(msg)) return { title: '评级已更新', tone: 'success' }
  if (/领取/.test(msg)) return { title: '领取成功', tone: 'success' }
  if (/已收藏/.test(msg)) return { title: '收藏成功', tone: 'success' }
  if (/已复制/.test(msg)) return { title: '复制成功', tone: 'success' }
  if (/同步最新局分/.test(msg)) return { title: '比分已同步', tone: 'success' }
  return { title: '操作成功', tone: 'success' }
}

export interface PortalAccount {
  id: string
  name: string
  avatar: string
  city: string
  origin: VisitorOrigin
}

export const PORTAL_ACCOUNTS: PortalAccount[] = [
  { id: 'acc-wuhan', name: '张先生', avatar: '张', city: '武汉', origin: '武汉市（省内游客）' },
  { id: 'acc-beijing', name: '王先生', avatar: '王', city: '北京', origin: '北京市（省外游客）' },
  { id: 'acc-shenzhen', name: '林女士', avatar: '林', city: '深圳', origin: '深圳市（省外游客）' },
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

function hydratePointLogs(savedLogs?: PointLogItem[]): PointLogItem[] {
  if (!Array.isArray(savedLogs) || savedLogs.length === 0) return structuredClone(INITIAL_POINT_LOGS)
  // Keep user-generated logs (prefixed pt-17...) on top of the updated base trip logs
  const baseIds = new Set(['pt-1', 'pt-2', 'pt-3', 'pt-4', 'pt-5', 'pt-6'])
  const customLogs = savedLogs.filter((l) => !baseIds.has(l.id))
  return [...customLogs, ...structuredClone(INITIAL_POINT_LOGS)]
}

const saved = loadSaved()
const initialPointLogs = hydratePointLogs(saved.pointLogs)
const initialSessionEarned = initialPointLogs.reduce((sum, item) => sum + (item.delta > 0 ? item.delta : 0), 0)

const state = reactive({
  isStandalonePage: initialStandaloneModule !== null,
  activeModule: (initialStandaloneModule ?? 1) as ModuleId,
  searchQuery: new URLSearchParams(window.location.search).get('q') ?? '',
  origin: ((sessionStorage.getItem('jingshan_active_origin') as VisitorOrigin | null) ?? '武汉市（省内游客）') as VisitorOrigin,
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
  sessionPointsEarned: initialSessionEarned,
  pointLogs: initialPointLogs,
  merchantRatings: hydrateMerchantRatings(saved.merchantRatings),
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
  toast: null as ToastPayload | null,
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
  if (Array.isArray(next.merchantRatings)) state.merchantRatings = hydrateMerchantRatings(next.merchantRatings)
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
    if (kind === 'map-point' && id && options[0]) {
      return { kind, source: id, id: decodeURIComponent(options[0]) }
    }
    if (kind === 'tournament') {
      const event = TOURNAMENT_REGISTRATION_OPTIONS.find(item => item.id === id)
      const group = event?.groups.find(item => item.id === options[0]) ?? event?.groups[0]
      return event && group ? { kind, eventId: event.id, groupId: group.id } : null
    }
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
  if (payload.kind === 'map-point') return `map-point:${payload.source}:${encodeURIComponent(payload.id)}`
  if (payload.kind === 'tournament') return `tournament:${payload.eventId}:${payload.groupId}`
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
  const currentAccount = computed(
    () => PORTAL_ACCOUNTS.find((a) => a.origin === state.origin) ?? PORTAL_ACCOUNTS[0]!,
  )

  function switchAccount(accountId: string) {
    const target = PORTAL_ACCOUNTS.find((a) => a.id === accountId)
    if (!target) return
    state.origin = target.origin
    try {
      sessionStorage.setItem('jingshan_active_origin', target.origin)
    } catch {
      // ignore storage errors
    }
    showToast(`已切换账户：${target.name}（${target.city}）`)
  }

  function setVisitorOrigin(origin: VisitorOrigin) {
    state.origin = origin
    try {
      sessionStorage.setItem('jingshan_active_origin', origin)
    } catch {
      // ignore storage errors
    }
  }

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

  function dismissToast() {
    if (toastTimer) window.clearTimeout(toastTimer)
    toastTimer = undefined
    state.toast = null
    state.toastMessage = ''
  }

  function pauseToast() {
    if (toastTimer) {
      window.clearTimeout(toastTimer)
      toastTimer = undefined
    }
  }

  function resumeToast() {
    if (!state.toast) return
    if (toastTimer) window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => {
      dismissToast()
    }, 1800)
  }

  function showToast(msg: string, opts?: { title?: string; tone?: ToastTone }) {
    const inferred = inferToastMeta(msg)
    state.toastMessage = msg
    state.toast = {
      id: Date.now() + Math.random(),
      title: opts?.title ?? inferred.title,
      message: msg,
      tone: opts?.tone ?? inferred.tone,
    }
    if (toastTimer) window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => {
      dismissToast()
    }, 2800)
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

  function openTournamentRegistration(eventId: string, groupId?: string) {
    const event = TOURNAMENT_REGISTRATION_OPTIONS.find(item => item.id === eventId)
    const group = event?.groups.find(item => item.id === groupId) ?? event?.groups[0]
    if (event && group) openDetailPage({ kind: 'tournament', eventId, groupId: group.id })
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
      user: currentAccount.value.name,
      city: currentAccount.value.city,
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
      hostName: `${currentAccount.value.name}（我发起）`,
      hostOrigin: currentAccount.value.city,
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
      recordPoints(60, order.title, '参训')
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
      recordPoints(80, order.title, '参训')
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
      status: category === '住宿' ? '已确认' : category === '商品' ? '已确认' : '待使用',
      cancellable: true,
    }
    if (category === '商品') {
      await apiRequest('/orders', { method: 'POST', body: JSON.stringify(order) }, () => order)
      state.orders.unshift(order)
      const actualSpent = pointsSpent > 0 && state.points >= pointsSpent ? pointsSpent : 0
      if (actualSpent > 0) recordPoints(-actualSpent, `购物抵扣：${title}`, '抵现')
      recordPoints(pointsGain, title, '购物')
      openOrderSuccess({
        headline: '下单成功 · 快递到家',
        orderId: order.id,
        category,
        title,
        subtitle,
        amount,
        pointsGain,
        pointsSpent: actualSpent,
        note: '产地直发快递到家，积分已自动计入个人中心',
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
    recordPoints(100, `网球能力晋升复测：${orgName}`, '参训')
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
        author: currentAccount.value.name,
        origin: currentAccount.value.city,
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
        '价格争议': { dept: '市市场监管局', sla: '24小时内' },
        '服务不符': { dept: '市文旅局', sla: '24小时内' },
        '卫生安全': { dept: '市卫健局', sla: '12小时内' },
        '停车收费': { dept: '市交通局', sla: '12小时内' },
      }
      const deptMap: Record<string, string> = {
        '酒店/公寓/餐饮价格纠纷': '市市场监管局',
        '出行/停车/充电桩': '市交通局',
        '医疗康复/便民设施': '市卫健局',
      }
      const routed = payload.tag ? tagRouteMap[payload.tag] : undefined
      const dept = routed?.dept ?? deptMap[payload.category] ?? '市文旅局'
      const sla = routed?.sla ?? '24小时内'
      const nowTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
      const targetName = payload.target.trim() || '相关商户'
      const tagName = payload.tag || '服务反馈'
      const ticket: ComplaintTicket = {
        id: `FB-${Date.now().toString().slice(-4)}`,
        category: payload.category,
        tag: tagName,
        target: targetName,
        content: payload.content.trim(),
        status: '已分办至对应部门',
        dept,
        sla,
        createdAt: `今日 ${nowTime}`,
        timeline: [
          { step: '游客提交', time: `今日 ${nowTime}`, detail: `已提交【${tagName}】投诉 · ${targetName}`, done: true },
          { step: '自动派单', time: `今日 ${nowTime}`, detail: `已按标签自动分派至${dept}（${sla}办结）`, done: true },
          { step: '部门核查', time: '待核查', detail: '执法专员核查中', done: false },
          { step: '结果回传', time: '待回传', detail: '办结后同步结果与商户星级', done: false },
        ],
      }
      await apiRequest('/feedback/complaint', { method: 'POST', body: JSON.stringify(ticket) }, () => ticket)
      state.complaints.unshift(ticket)
      showToast(`投诉已受理（${ticket.id}），已自动分派至${ticket.dept}`)
    }
  }

  function rateMerchant(merchantId: string, star: number, comment: string) {
    const m = state.merchantRatings.find((x) => x.id === merchantId)
    if (!m) return
    const firstTime = !m.reviewedByMe
    if (firstTime) m.reviewCount += 1
    const baseWeight = Math.min(m.reviewCount, 12)
    const nextRating = Number(((m.rating * baseWeight + star * 2) / (baseWeight + 2)).toFixed(1))
    m.rating = Math.min(5.0, Math.max(1.0, nextRating))
    const rateDelta = star >= 4 ? 0.2 : star === 3 ? -1.5 : -4.5
    m.positiveRate = Number(Math.min(99.9, Math.max(55, m.positiveRate + rateDelta)).toFixed(1))
    recalcMerchantGrade(m)
    m.recentReview = comment.trim() || `给出 ${star} 星评价`
    m.reviewedByMe = true
    m.myRating = star
    state.posts.unshift({
      id: `post-${Date.now()}`,
      author: currentAccount.value.name,
      origin: currentAccount.value.city,
      rating: star,
      title: `【${m.name}】${m.recentReview}`,
      photo: m.category === '球场' ? '/images/tournament_1.jpg' : m.category === '酒店' ? '/images/hotel.jpg' : m.category === '餐饮' ? '/images/cuisine.jpg' : '/images/coach_1.jpg',
      likes: 1,
      liked: true,
      category: m.category,
    })
    if (firstTime) {
      recordPoints(20, `点评商户：${m.name}`, '点评')
      showToast(`已评价「${m.name}」${star}★，星级已实时更新（+20积分）`)
    } else {
      showToast(`已更新「${m.name}」评分为 ${star}★，动态定级已同步`)
    }
  }

  function advanceComplaintProgress(ticketId: string) {
    const t = state.complaints.find((x) => x.id === ticketId)
    if (!t || !t.timeline) return
    const nowTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
    const nextIdx = t.timeline.findIndex((s) => !s.done)
    if (nextIdx === -1) return
    const step = t.timeline[nextIdx]!
    step.done = true
    step.time = `今日 ${nowTime}`
    const inspectDetailMap: Record<string, string> = {
      '价格争议': `${t.dept}已到场核查，责令商户退还差价并规范明码标价`,
      '服务不符': `${t.dept}已核实服务偏差，责令商户限期整改并补齐承诺服务`,
      '卫生安全': `${t.dept}已完成现场卫生抽检，责令立即消杀整改`,
      '停车收费': `${t.dept}已核验收费公示牌，责令退还违规加收费用`,
    }
    const resolveDetailMap: Record<string, string> = {
      '价格争议': '差价已原路退回，整改凭证已上传，商户动态信用同步扣分',
      '服务不符': '商户已完成整改并致歉，动态星级已同步复核更新',
      '卫生安全': '复检合格并上传整改记录，商户信用档案已同步记录',
      '停车收费': '多收费用已退还，收费公示已规范，同步记入商户考核',
    }
    if (nextIdx === 2) {
      step.detail = inspectDetailMap[t.tag ?? ''] ?? `${t.dept}已完成现场核查，正督促商户落实整改`
      t.status = '部门核查处置中'
      showToast(`${t.id} 进度回传：${t.dept}已完成核查`)
    } else if (nextIdx === 3) {
      step.detail = resolveDetailMap[t.tag ?? ''] ?? '已限时办结，处置结果与商户信用已同步更新'
      t.status = '已办结 · 反馈满意'
      const matched = state.merchantRatings.find((m) => m.name === t.target || t.target.includes(m.name) || m.name.includes(t.target))
      if (matched) {
        matched.complaintCount += 1
        matched.positiveRate = Number(Math.max(55, matched.positiveRate - 3.5).toFixed(1))
        matched.rating = Number(Math.max(2.0, matched.rating - 0.3).toFixed(1))
        recalcMerchantGrade(matched)
        showToast(`${t.id} 已办结回传，「${matched.name}」动态星级已同步调整为 ${matched.starLevel}★`)
      } else {
        showToast(`${t.id} 已限时办结，处置结果已实时回传`)
      }
    }
  }

  function rateComplaintSatisfaction(ticketId: string, result: '满意' | '不满意') {
    const t = state.complaints.find((x) => x.id === ticketId)
    if (!t) return
    t.satisfaction = result
    showToast(`已反馈工单 ${t.id} 处置结果：${result}`)
  }

  function registerYouthTournament(payload: {
    tournamentName: string
    playerName: string
    group: string
    venue: string
    fee: number
    time?: string
  }) {
    const order: PortalOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      category: '门票',
      title: `赛事报名：${payload.tournamentName}`,
      subtitle: `参赛选手：${payload.playerName} · ${payload.group} · ${payload.venue}`,
      time: payload.time ?? '11/28 开赛',
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
    currentAccount,
    switchAccount,
    setVisitorOrigin,
    memberTier,
    activeOrdersCount,
    showToast,
    dismissToast,
    pauseToast,
    resumeToast,
    switchModule,
    navigateToModulePage,
    returnFromModulePage,
    openModulePage,
    openModuleInNewWindow,
    openDetailPage,
    openTournamentRegistration,
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
    rateComplaintSatisfaction,
    registerYouthTournament,
    recordPoints,
    toggleFavorite,
    claimHomeSubsidy,
    initHashRouting,
  }
}
