import { computed, reactive, watch } from 'vue'
import { apiRequest, USE_MOCK } from '../api/client'
import {
  INITIAL_ABILITY,
  INITIAL_COMPLAINTS,
  INITIAL_COUPONS,
  INITIAL_COURTS,
  INITIAL_ORDERS,
  INITIAL_POSTS,
} from '../mock/data'
import { ENRICHED_MATCHES } from '../mock/details'
import type {
  AbilityDimensions,
  ActionModalPayload,
  BookingDraft,
  ComplaintTicket,
  CouponItem,
  CourtVenue,
  FeedbackPost,
  LightboxPayload,
  LiveMatch,
  ModuleId,
  PortalOrder,
  RadiusOption,
  VisitorOrigin,
} from '../types/portal'

const STORAGE_KEY = 'jingshan_tennis_portal_state_v3'

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
  activeModule: 1 as ModuleId,
  searchQuery: '',
  origin: (saved.origin ?? '武汉市（省内游客）') as VisitorOrigin,
  radius: '1公里' as RadiusOption,
  courtSurfaceFilter: '全部' as '全部' | '硬地' | '红土' | '室内风雨',
  courtRegionFilter: '全部' as '全部' | '温泉街道' | '新市街道' | '永兴街道',
  showActivityPopup: true,
  showEventModal: !(saved.dismissedEventModal ?? false),
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
  orders: (saved.orders ?? structuredClone(INITIAL_ORDERS)) as PortalOrder[],
  coupons: (saved.coupons ?? structuredClone(INITIAL_COUPONS)) as CouponItem[],
  favorites: (saved.favorites ?? ['京山国际网球公寓', '桥米公馆', '钟祥明显陵延伸线']) as string[],
  posts: (saved.posts ?? structuredClone(INITIAL_POSTS)) as FeedbackPost[],
  complaints: (saved.complaints ?? structuredClone(INITIAL_COMPLAINTS)) as ComplaintTicket[],
  claimedHomeSubsidy: saved.claimedHomeSubsidy ?? false,
  ticketStubCode: 'JS-20261126-089',
  parkingLots: [
    { id: 'p1', name: '国际网球中心 P1', address: '温泉街道网球大道北侧P1入口', lng: 113.1185, lat: 31.0226, remain: 84, total: 160, rating: 4.9, note: '含12个快充桩 · 订场免费停3h', reserved: false },
    { id: 'ev1', name: '温泉新区超充站', address: '温泉街道温泉大道与京山大道交叉口', lng: 113.1228, lat: 31.0212, remain: 14, total: 18, rating: 4.9, note: '120kW快充 · 距场馆200m', isCharger: true, reserved: false },
    { id: 'p2', name: '文峰公园 P2', address: '新市街道文峰路文峰公园南门', lng: 113.1128, lat: 31.0185, remain: 42, total: 120, rating: 4.8, note: '距文峰夜市150m · 可预约', reserved: false },
  ],
  lightbox: null as LightboxPayload | null,
  bookingDraft: null as BookingDraft | null,
  actionModal: null as ActionModalPayload | null,
  toastMessage: '',
  dataMode: USE_MOCK ? '前端 Mock 演示模式' : 'Spring Boot 联调模式',
})

watch(
  () => ({
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
  }),
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

  function switchModule(id: ModuleId) {
    state.activeModule = id
    if (window.location.hash !== `#m${id}`) {
      window.history.replaceState(null, '', `#m${id}`)
    }
    const stageEl = document.getElementById('moduleStageAnchor')
    if (stageEl && id !== 1) {
      stageEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
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
    if (/红土/.test(q)) {
      state.courtSurfaceFilter = '红土'
      switchModule(2)
    } else if (/风雨|室内/.test(q)) {
      state.courtSurfaceFilter = '室内风雨'
      switchModule(2)
    } else if (/比分|复盘|球场|订场|陪练|约球|硬地/.test(q)) switchModule(2)
    else if (/游|绿林山|温泉|明显陵|漳河|夜市|导览/.test(q)) switchModule(3)
    else if (/吃|桥米|美食|团餐|菜单/.test(q)) switchModule(4)
    else if (/住|酒店|民宿|公寓|购房|5万/.test(q)) switchModule(5)
    else if (/行|车位|停车|充电|限行|封闭|司机|公交|租车/.test(q)) switchModule(6)
    else if (/购|商城|李宁|葛粉|文创|特产/.test(q)) switchModule(7)
    else if (/娱|农庄|采摘|亲子|KTV|电影|影院|康养/.test(q)) switchModule(8)
    else if (/训|网校|研学|团建|晋升|评测|康复/.test(q)) switchModule(9)
    else if (/公厕|卫生间|医疗|ATM|母婴|天气|路况/.test(q)) switchModule(10)
    else if (/投诉|评价|预警|打卡|12345/.test(q)) switchModule(11)
    else if (/小程序|政务|打车|支付/.test(q)) switchModule(12)
    else if (/积分|会员|五维|订单|票根|个人/.test(q)) switchModule(13)
    else switchModule(2)
    showToast(`已为您精准定位与「${q}」相关的业务模块`)
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

  function reserveParkingOrCharger(lotId: string) {
    const lot = state.parkingLots.find((l) => l.id === lotId)
    if (!lot) return
    if (lot.reserved) {
      showToast(`您已预约「${lot.name}」，无需重复锁位`)
      return
    }
    lot.reserved = true
    lot.remain = Math.max(0, lot.remain - 1)
    showToast(`预约成功！已为您锁定「${lot.name}」（保留30分钟，凭订场码免费核销）`)
  }

  async function confirmCourtBooking(opts: {
    bookParking: boolean
    bookCharger: boolean
    usePoints: boolean
  }) {
    const draft = state.bookingDraft
    if (!draft) return
    const discountFromPoints = opts.usePoints && state.points >= 200 ? 20 : 0
    const finalPrice = Math.max(0, draft.memberPrice - discountFromPoints)
    const linked = [
      opts.bookParking ? draft.parkingName : '',
      opts.bookCharger ? draft.chargerName : '',
    ]
      .filter(Boolean)
      .join(' + ')

    const newOrder: PortalOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      category: '场地',
      title: `${draft.venueName.split('（')[0]} · 今日 ${draft.slotTime}`,
      subtitle: linked ? `已联动预约：${linked}` : '支持开场前2小时免费取消',
      time: `今日 ${draft.slotTime}`,
      amount: finalPrice,
      status: '待核销',
      cancellable: true,
    }

    await apiRequest('/orders', { method: 'POST', body: JSON.stringify(newOrder) }, () => newOrder)

    state.orders.unshift(newOrder)
    if (discountFromPoints > 0) state.points -= 200
    state.points += 50
    const v = state.courts.find((c) => c.id === draft.venueId)
    const slot = v?.slots.find((s) => s.time === draft.slotTime)
    if (slot) {
      slot.booked = true
      slot.remaining = Math.max(0, slot.remaining - 1)
    }
    state.bookingDraft = null
    showToast(`订场成功！实付 ¥${finalPrice}，获得 +50 积分，电子票根 ${state.ticketStubCode} 已激活`)
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
    const sync = () => {
      const m = window.location.hash.match(/^#m(\d+)$/)
      if (m) {
        const id = Number(m[1])
        if (id >= 1 && id <= 13) state.activeModule = id as ModuleId
      }
    }
    sync()
    window.addEventListener('hashchange', sync)
  }

  return {
    state,
    memberTier,
    activeOrdersCount,
    showToast,
    switchModule,
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
