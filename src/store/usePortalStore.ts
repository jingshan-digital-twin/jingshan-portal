import { computed, reactive, watch } from 'vue'
import { apiRequest } from '../api/client'
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
import type {
  AbilityDimensions,
  ActionModalPayload,
  BookingDraft,
  ComplaintTicket,
  CouponItem,
  CourtVenue,
  FeedbackPost,
  GroupClassItem,
  LightboxPayload,
  LiveMatch,
  MatchmakingGame,
  ModuleId,
  PortalOrder,
  PrivateCoach,
  RadiusOption,
  VisitorOrigin,
} from '../types/portal'

const STORAGE_KEY = 'jingshan_tennis_portal_state_v3'

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
  try {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('module')
    if (raw) {
      const id = Number(raw)
      if (id >= 2 && id <= 13) return id as ModuleId
    }
  } catch {
    // ignore URL parse errors
  }
  return null
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
  showEventModal: initialStandaloneModule === null && !(saved.dismissedEventModal ?? false),
  dismissedEventModal: saved.dismissedEventModal ?? false,
  activeMatchRecapId: null as string | null,
  activeHotelId: null as string | null,
  activeProductId: null as string | null,
  showCinemaModal: false,
  points: saved.points ?? 1280,
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
  bookingDraft: null as BookingDraft | null,
  actionModal: null as ActionModalPayload | null,
  toastMessage: '',
})

function getPersistSnapshot(): PersistedState {
  return {
    points: state.points,
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

  function openModulePage(
    id: ModuleId,
    options?: {
      newWindow?: boolean
      params?: Record<string, string | undefined>
      silent?: boolean
    },
  ) {
    // Explicit new-window jump (e.g. clicking "进入完整专区 ↗" inside the fixed summary container)
    if (options?.newWindow && id !== 1) {
      openModuleInNewWindow(id, options.params, options.silent)
      return
    }

    // Standalone detail page mode (?module=2..13)
    if (state.isStandalonePage) {
      if (id === 1) {
        persistStateNow()
        window.location.href = buildModuleUrl(1)
        return
      }
      state.activeModule = id
      const nextUrl = buildModuleUrl(id, options?.params)
      window.history.pushState({ moduleId: id }, '', nextUrl)
      updateDocumentTitle(id, true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Home page mode: switch the fixed summary container in-place without jumping away
    state.activeModule = id
    if (options?.params?.surface) {
      const s = options.params.surface
      if (s === '全部' || s === '硬地' || s === '红土' || s === '室内风雨') {
        state.courtSurfaceFilter = s
      }
    }
    if (options?.params?.region) {
      const r = options.params.region
      if (r === '全部' || r === '温泉街道' || r === '新市街道' || r === '永兴街道') {
        state.courtRegionFilter = r
      }
    }
  }

  function switchModule(id: ModuleId, params?: Record<string, string | undefined>) {
    openModulePage(id, { newWindow: false, params })
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
      user: '林先生',
      city: state.origin.slice(0, 2),
      score,
      content: content.trim(),
      likes: 1,
      liked: true,
    })
    state.points += 10
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
    if (!state.isStandalonePage) {
      const stageEl = document.getElementById('moduleStageAnchor')
      stageEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    showToast(
      state.isStandalonePage
        ? `已为您找到相关服务：${meta.title}`
        : `已为您切换至「${meta.title}」`,
    )
  }

  function openPhoto(payload: LightboxPayload) {
    state.lightbox = payload
  }

  function openBookingModal(draft: BookingDraft) {
    state.bookingDraft = draft
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
    if (!lot.reserved) {
      lot.remain = Math.max(0, lot.remain - 1)
    }
    lot.reserved = true
    lot.reservedSlot = slotText
    showToast(`预约成功！已为您锁定「${lot.name}」· ${slotText}（凭订场码核销）`)
  }

  async function confirmCourtBooking(opts: {
    date?: string
    selectedSlots?: { courtId: string; courtName: string; hour: string; price: number; memberPrice: number }[]
    bookParking: boolean
    bookCharger: boolean
    usePoints: boolean
  }) {
    const draft = state.bookingDraft
    if (!draft) return
    const dateIso = opts.date ?? draft.date ?? BOOKING_DATES[0]!.iso
    const dateLabel = BOOKING_DATES.find((d) => d.iso === dateIso)?.shortDate ?? dateIso
    const picked = opts.selectedSlots && opts.selectedSlots.length > 0
      ? opts.selectedSlots
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

    await apiRequest('/orders', { method: 'POST', body: JSON.stringify(newOrder) }, () => newOrder)

    state.orders.unshift(newOrder)
    if (discountFromPoints > 0) state.points -= 200
    state.points += 50 * picked.length

    for (const s of picked) {
      const key = `${draft.venueId}|${dateIso}|${s.courtId}|${s.hour}`
      if (!state.bookedCourtKeys.includes(key)) {
        state.bookedCourtKeys.push(key)
      }
    }

    const v = state.courts.find((c) => c.id === draft.venueId)
    const slot = v?.slots.find((s) => s.time === draft.slotTime)
    if (slot) {
      slot.booked = true
      slot.remaining = Math.max(0, slot.remaining - 1)
    }
    state.bookingDraft = null
    showToast(`订场成功！${dateLabel} ${slotSummary}，实付 ¥${finalPrice}，获赠 +${50 * picked.length} 积分`)
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
    g.joinedByMe = true
    g.currentPlayers += 1
    state.points += 30
    const dateLabel = BOOKING_DATES.find((d) => d.iso === g.date)?.shortDate ?? g.date
    state.orders.unshift({
      id: `ORD-${Date.now().toString().slice(-6)}`,
      category: '场地',
      title: `约球：${g.title}`,
      subtitle: `${g.venueName} · CUTR ${g.cutrBand} · ${g.format}`,
      time: `${dateLabel} ${g.startTime}-${g.endTime}`,
      amount: g.feePerPerson,
      status: '待核销',
      cancellable: true,
    })
    showToast(`成功加入「${g.title}」（${dateLabel} ${g.startTime}-${g.endTime}），获赠 +30 积分！`)
  }

  function publishMatchmakingGame(payload: Omit<MatchmakingGame, 'id' | 'hostName' | 'hostOrigin' | 'currentPlayers' | 'joinedByMe'>) {
    const next: MatchmakingGame = {
      ...payload,
      id: `mg-${Date.now()}`,
      hostName: '林先生（我发起）',
      hostOrigin: state.origin.slice(0, 2),
      currentPlayers: 1,
      joinedByMe: true,
    }
    state.matchmakingGames.unshift(next)
    state.points += 40
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
    cls.bookedByMe = true
    cls.enrolled += 1
    const dateLabel = BOOKING_DATES.find((d) => d.iso === cls.date)?.shortDate ?? cls.date
    state.orders.unshift({
      id: `ORD-${Date.now().toString().slice(-6)}`,
      category: '课程',
      title: `团体课：${cls.title}`,
      subtitle: `${cls.coachName} · ${cls.venueName}`,
      time: `${dateLabel} ${cls.startTime}-${cls.endTime}`,
      amount: cls.memberPrice,
      status: '待上课',
      cancellable: true,
    })
    state.points += 60
    showToast(`预约成功！${dateLabel} ${cls.startTime}-${cls.endTime}「${cls.title}」（¥${cls.memberPrice}，+60分）`)
  }

  function bookPrivateCoachSlot(coachId: string, dateIso: string, hour: string) {
    const coach = state.privateCoaches.find((c) => c.id === coachId)
    if (!coach) return
    const key = `${coachId}|${dateIso}|${hour}`
    if (state.bookedCoachKeys.includes(key)) {
      showToast('该时段已被预约，请选择教练其他空闲时段')
      return
    }
    state.bookedCoachKeys.push(key)
    const dateLabel = BOOKING_DATES.find((d) => d.iso === dateIso)?.shortDate ?? dateIso
    const range = formatHourRange(hour)
    state.orders.unshift({
      id: `ORD-${Date.now().toString().slice(-6)}`,
      category: '课程',
      title: `私教课：${coach.name}（${coach.specialty}）`,
      subtitle: `${coach.venueName} · ${coach.tier} · 1对1专属指导`,
      time: `${dateLabel} ${range}`,
      amount: coach.memberPrice,
      status: '待上课',
      cancellable: true,
    })
    state.points += 80
    showToast(`私教课预约成功！${coach.name} · ${dateLabel} ${range}（实付 ¥${coach.memberPrice}，+80分）`)
  }

  async function createQuickOrder(
    category: PortalOrder['category'],
    title: string,
    subtitle: string,
    amount: number,
    pointsGain = 60,
    pointsSpent = 0,
  ) {
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
    await apiRequest('/orders', { method: 'POST', body: JSON.stringify(order) }, () => order)
    state.orders.unshift(order)
    if (pointsSpent > 0 && state.points >= pointsSpent) state.points -= pointsSpent
    state.points += pointsGain
    showToast(`支付成功：「${title}」（¥${amount}）已同步至个人中心，获赠 +${pointsGain} 金网积分！`)
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
    state.points -= cost
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
        author: '林先生',
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
      state.points += 20
      showToast('打卡评价发布成功！获得 +20 金网积分')
    } else {
      const deptMap: Record<string, string> = {
        '酒店/公寓/餐饮价格纠纷': '市市场监管局（12345自动分办）',
        '出行/停车/充电桩': '市交通局 / 城运中心',
        '医疗康复/便民设施': '市卫健局 / 城运中心',
      }
      const ticket: ComplaintTicket = {
        id: `FB-${Date.now().toString().slice(-4)}`,
        category: payload.category,
        target: payload.target || '相关服务商户',
        content: payload.content.trim(),
        status: '已分办至对应部门',
        dept: deptMap[payload.category] ?? '市文旅局 / 12345 城运中心',
        createdAt: '刚刚',
      }
      await apiRequest('/feedback/complaint', { method: 'POST', body: JSON.stringify(ticket) }, () => ticket)
      state.complaints.unshift(ticket)
      showToast(`投诉已受理（单号 ${ticket.id}），系统已自动分办至：${ticket.dept}`)
    }
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
    const syncFromLocation = () => {
      const urlModule = parseModuleFromUrl()
      if (urlModule) {
        state.isStandalonePage = true
        state.activeModule = urlModule
        state.courtSurfaceFilter = parseSurfaceFromUrl()
        state.courtRegionFilter = parseRegionFromUrl()
        updateDocumentTitle(urlModule, true)
        return
      }
      // Backward compatibility: legacy #m2~#m13 links enter standalone mode directly
      const hashMatch = window.location.hash.match(/^#m(\d+)$/)
      if (hashMatch) {
        const id = Number(hashMatch[1])
        if (id >= 2 && id <= 13) {
          state.isStandalonePage = true
          state.activeModule = id as ModuleId
          updateDocumentTitle(id as ModuleId, true)
          return
        }
      }
      state.isStandalonePage = false
      state.activeModule = 1
      updateDocumentTitle(1, false)
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
    openModulePage,
    openModuleInNewWindow,
    buildModuleUrl,
    openActionModal,
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
    toggleFavorite,
    claimHomeSubsidy,
    initHashRouting,
  }
}
