<script setup lang="ts">
import { computed } from 'vue'
import { ENTERTAINMENT_ITEMS, TOUR_ROUTES } from '../mock/data'
import { HOTEL_PROFILES, PRODUCT_CATALOG } from '../mock/details'
import { getModuleMeta, usePortalStore } from '../store/usePortalStore'
import type { ModuleId } from '../types/portal'

const {
  state,
  memberTier,
  activeOrdersCount,
  switchModule,
  openModuleInNewWindow,
  openPhoto,
  openHotelDetail,
  openProductDetail,
  openVenueDetail,
  openCinemaDetail,
  openBookingModal,
  openActionModal,
  reserveParkingOrCharger,
  claimHomeSubsidy,
} = usePortalStore()

const currentMeta = computed(() => getModuleMeta(state.activeModule))

const kpiPillsMap = computed<Record<ModuleId, string[]>>(() => ({
  1: ['356片标准球场', '79家联盟商家', `来源地：${state.origin}`],
  2: ['全市356片球场', '今日84片可约', `实时${state.liveMatches.length}场焦点赛`],
  3: ['3大旅游圈层', '配智能语音导览', '持证社保障'],
  4: ['79家联盟餐饮', '打球票根85折', '夜市夜宵'],
  5: ['6家精选住宿', '百套短长租公寓', '购房直减¥50,000'],
  6: ['赛期限行避堵', `P1车位剩${state.parkingLots[0]?.remain ?? 84}`, `超充桩闲${state.parkingLots[1]?.remain ?? 14}`],
  7: ['产地直发包邮', '积分100分=¥10', '票根满150减30'],
  8: ['6大娱乐品类', '天沐温泉立减¥60', 'IMAX在线选座'],
  9: ['湖北省网球学校', `当前等级 ${state.abilityLevel}`, '官方五维认证'],
  10: ['☀️ 晴 19°C 空气优', '全城急救医疗点', '24h热线保障'],
  11: [`${state.posts.length}条精选口碑`, `${state.complaints.length}条办结记录`, '12345自动分办'],
  12: ['政务/文旅/支付', '网球记数据同步', '一键免登录直连'],
  13: [`${memberTier.value.code} ${memberTier.value.name}`, `${state.points} 金网积分`, `${activeOrdersCount.value} 笔有效订单`],
}))

const filteredHotCourts = computed(() => {
  const matched = state.courts.filter((c) => {
    const okSurface = state.courtSurfaceFilter === '全部' || c.surfaces.includes(state.courtSurfaceFilter)
    const okRegion = state.courtRegionFilter === '全部' || c.region === state.courtRegionFilter
    return okSurface && okRegion
  })
  return (matched.length > 0 ? matched : state.courts).slice(0, 3)
})

const overviewThemes = [
  {
    badge: '🌿 网球 + 文旅',
    title: '绿林山/空山洞 + 明显陵延伸线',
    desc: '打球后畅游 4A 生态秘境与世界遗产 · 含语音导览',
    photo: '/images/scenic.jpg',
    price: '¥498',
    extra: '/人起',
    target: 3 as ModuleId,
  },
  {
    badge: '🎓 网球 + 研学',
    title: '湖北省网球学校 7 天冬夏令营',
    desc: '国家级教练分层特训 · 结营五维能力评测认证',
    photo: '/images/coach_2.jpg',
    price: '¥2,480',
    extra: '/期',
    target: 9 as ModuleId,
  },
  {
    badge: '♨️ 网球 + 康养',
    title: '四天三晚尊享：打网球 + 泡温泉',
    desc: '含 6h 红土/硬地场 + 天沐温泉酒店 + 运动康复理疗',
    photo: '/images/hotspring.jpg',
    price: '¥2,999',
    extra: '/人起',
    target: 3 as ModuleId,
  },
]

const hotRestaurants = [
  {
    name: '桥米公馆 · 京山非遗特色鄂菜',
    photo: '/images/cuisine.jpg',
    badge: '🏅 票根85折',
    dist: '距国际网球中心 600m',
    rating: 4.9,
    avg: 78,
    summary: '国宝桥米锅巴 ¥48 ｜ 洪湖排骨藕汤 ¥68 ｜ 惠亭湖刁子鱼 ¥56',
    quote: '打完球出示订场票根直接减了¥30，桥米锅巴香到光盘！',
    address: '湖北省荆门市京山市温泉街道京山大道96号',
    lng: 113.1168,
    lat: 31.0226,
  },
  {
    name: '绿林山水农家土菜馆',
    photo: '/images/scenic.jpg',
    badge: '🏅 满100减25',
    dist: '绿林山景区入口 200m',
    rating: 4.8,
    avg: 65,
    summary: '山泉散养土鸡汤 ¥98 ｜ 京山花菇滑鸡 ¥52 ｜ 柴火桥米饭 ¥18',
    quote: '现杀土鸡配本地桥米饭，明码标价童叟无欺，强烈推荐！',
    address: '湖北省荆门市京山市绿林镇绿林山风景区南门200米处',
    lng: 112.9781,
    lat: 31.3402,
  },
  {
    name: '文峰河畔老字号碳火烧烤 & 轻食街',
    photo: '/images/night_market.jpg',
    badge: '🌙 票根赠米茶',
    dist: '距文峰公园球场 300m',
    rating: 4.9,
    avg: 58,
    summary: '秘制油焖小龙虾 ¥88 ｜ 现烤鲜牛肉小串 ¥48 ｜ 赛后轻食沙拉 ¥36',
    quote: '打完夜场球走3分钟就到，球友聚餐氛围超棒！',
    address: '湖北省荆门市京山市新市街道文峰河滨夜市街区A区12号',
    lng: 113.1135,
    lat: 31.0172,
  },
]

const hotHotels = computed(() => HOTEL_PROFILES.slice(0, 3))
const hotProducts = computed(() => PRODUCT_CATALOG.slice(0, 4))
const hotEntertainments = computed(() => [
  ENTERTAINMENT_ITEMS[3]!,
  ENTERTAINMENT_ITEMS[0]!,
  ENTERTAINMENT_ITEMS[5]!,
])

const abilityBars = computed(() => [
  { label: '发球 Serve', val: state.ability.serve },
  { label: '底线 Baseline', val: state.ability.baseline },
  { label: '截击 Volley', val: state.ability.volley },
  { label: '步法 Footwork', val: state.ability.footwork },
  { label: '体能 Stamina', val: state.ability.stamina },
])

const miniPrograms = [
  {
    name: '网球记 · 实时赛况',
    tag: '赛事直连',
    icon: '📊',
    desc: '同步中青赛及京山各品牌赛事实时比分、签表与每片场地占用动态。',
    bullets: ['实时局分 / 破发点同步', '完整赛后技术统计', '关注球员开赛提醒'],
  },
  {
    name: '游湖北 · 京山文旅',
    tag: '门票导览',
    icon: '🌿',
    desc: '直连绿林山、空山洞、明显陵门票预订与景区多语种电子语音导览。',
    bullets: ['景区预约码一键核销', '省内延伸线联票优惠', '实时客流与错峰提示'],
  },
  {
    name: '鄂汇办 · 政务便民',
    tag: '政务服务',
    icon: '🏛️',
    desc: '打通 12345 投诉自动分办、文旅消费券申领与公共服务在线查询。',
    bullets: ['实名认证免重复登录', '投诉处理进度实时追踪', '电子证照亮证即用'],
  },
  {
    name: '打车 / 充电 / 支付',
    tag: '出行支付',
    icon: '🚕',
    desc: '整合高德/滴滴一键叫车、超充桩扫码启动与微信电子票根核销。',
    bullets: ['赛场定位免输上车点', '79家联盟商户扫码立减', '多平台比价一键叫车'],
  },
]

function openCurrentFullPage() {
  if (state.activeModule === 2) {
    openModuleInNewWindow(2, {
      surface: state.courtSurfaceFilter,
      region: state.courtRegionFilter,
    })
    return
  }
  openModuleInNewWindow(state.activeModule)
}

function openRestaurantDetail(r: (typeof hotRestaurants)[number]) {
  openPhoto({
    title: r.name,
    category: '京网推荐美食详情',
    photo: r.photo,
    rating: r.rating,
    subtitle: `${r.badge} ｜ ${r.dist}`,
    intro: `${r.name}为「京山网球」官方认证联盟餐饮，招牌推荐：${r.summary}。出示订场/参赛电子票根进店扫码即享专属折扣并累计金网积分。`,
    openHours: '10:30 – 21:30',
    priceInfo: `人均 ¥${r.avg} · 票根专享优惠`,
    priceNum: r.avg,
    priceUnit: ' / 人均',
    distance: r.dist,
    driveMin: '约 6 分钟',
    address: r.address,
    lng: r.lng,
    lat: r.lat,
    actionKind: 'restaurant',
    tags: [r.badge, '网球联盟商家', '明厨亮灶A级食安', '免费停车'],
    reviews: [r.quote],
  })
}

function openTourRouteDetail(route: (typeof TOUR_ROUTES)[number]) {
  openPhoto({
    title: route.title,
    category: '京山全域网旅延伸线路',
    photo: route.photo,
    rating: route.rating,
    subtitle: `${route.badge} ｜ ${route.audio}`,
    intro: route.intro,
    openHours: route.openHours,
    priceInfo: `¥${route.price} 起`,
    priceNum: route.price,
    priceUnit: ' / 人起',
    audioScript: route.script,
    audioDuration: route.duration,
    actionKind: 'spot',
    address: route.address,
    lng: route.lng,
    lat: route.lat,
    tags: route.tags,
    highlights: route.highlights,
    hotItemsTitle: '🌟 热门打卡点',
    hotItems: route.hotItems,
    reviews: route.detailedReviews,
  })
}

function openEntDetail(ent: (typeof ENTERTAINMENT_ITEMS)[number]) {
  if (ent.id === 'ent-6') {
    openCinemaDetail()
    return
  }
  openPhoto({
    title: ent.name,
    category: `${ent.cat} · 休闲娱乐详情`,
    photo: ent.photo,
    rating: ent.rating,
    subtitle: `${ent.dist} ｜ ${ent.desc}`,
    intro: ent.intro,
    openHours: ent.openHours,
    priceInfo: ent.price,
    distance: ent.dist,
    driveMin: ent.driveMin,
    address: ent.address,
    lng: ent.lng,
    lat: ent.lat,
    actionKind: 'entertainment',
    tags: ent.tags,
    hotItemsTitle: '🔥 热门必体验项目与消费参考',
    hotItems: ent.hotItems,
    reviews: ent.detailedReviews.length ? ent.detailedReviews : [ent.quote],
  })
}
</script>

<template>
  <section class="summary-stage-box">
    <!-- 固定容器统一顶栏 -->
    <div class="summary-stage-header">
      <div class="mh-left">
        <h1 class="summary-stage-title">{{ currentMeta.title }}</h1>
      </div>

      <div class="flex-row">
        <span
          v-for="pill in kpiPillsMap[state.activeModule]"
          :key="pill"
          class="summary-kpi-pill"
        >
          {{ pill }}
        </span>
        <button
          v-if="state.activeModule === 1"
          class="btn-ghost"
          style="border-color: #f9c8ae; background: #fff3eb; color: #c93f14"
          @click="state.showEventModal = true"
        >
          🏆 赛事福利
        </button>
        <button
          v-else
          class="home-jump-btn sm"
          @click="openCurrentFullPage"
        >
          进入完整专区 ↗
        </button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="summary-stage-body">
      <!-- 01 首页总览摘要 -->
      <div v-if="state.activeModule === 1" class="summary-view-col">
        <div class="grid-split" style="align-items: stretch; flex-shrink: 0">
          <div class="card">
            <div
              class="photo-box"
              style="height: 256px"
              @click="openActionModal({ type: 'video', title: '《中国网球之城 · 生态京山》官方城市宣传片', duration: '02:15' })"
            >
              <img src="/images/hero.jpg" alt="京山网球城市名片宣传片" />
              <div class="badge-tl"><span class="live-dot" />官方城市宣传片 · 02:15</div>
              <div class="summary-hero-overlay">
                <div style="font-size: 22px; font-weight: 900; margin-bottom: 8px">以球塑城、以赛兴业：欢迎来到生态京山</div>
                <div class="flex-between">
                  <span style="font-size: 14px; color: rgba(255, 255, 255, 0.9)">
                    全市 356 片标准网球场 · 电子票根享 79 家联盟商家特惠
                  </span>
                  <div class="flex-row">
                    <button
                      class="btn-orange"
                      style="border-radius: 0; padding: 7px 14px"
                      @click.stop="openActionModal({ type: 'video', title: '《中国网球之城 · 生态京山》官方城市宣传片', duration: '02:15' })"
                    >
                      ▶ 宣传片
                    </button>
                    <button
                      class="btn-ghost"
                      style="border-radius: 0; padding: 7px 14px"
                      @click.stop="openActionModal({ type: 'audio', spotName: '京山网球城市全景导览', duration: '全城2日游推荐', photo: '/images/hero.jpg', script: '欢迎来到中国网球之城——湖北京山。全市拥有356片标准网球场，每万人拥有5.67片，您可以以京山国际网球中心为起点，串联天沐温泉、绿林山、空山洞、文峰夜市与桥米美食，开启挥拍山水间的惬意旅程。' })"
                    >
                      🗺️ 语音导览
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px; min-height: 256px">
            <div class="popup-preview" style="padding: 14px 18px">
              <div class="flex-between" style="margin-bottom: 6px">
                <span class="tag orange">市房管局惠民政策</span>
                <button class="home-more-link" @click="switchModule(5)">查看详情 →</button>
              </div>
              <div style="font-size: 16.5px; font-weight: 900; color: #472500">
                🏠 网球公开赛期间购房直减 ¥50,000
              </div>
            </div>

            <div class="card card-pad" style="padding: 14px 18px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 10px">
              <div class="flex-between">
                <strong style="font-size: 16px">🏆 近期焦点赛事</strong>
                <button class="home-more-link" @click="switchModule(2)">实时比分 →</button>
              </div>
              <div class="flex-between" style="background: #f5faf8; padding: 9px 12px; border-radius: 0">
                <div style="font-size: 14px; font-weight: 800">2026中青赛总决赛 <span class="tag red">进行中</span></div>
                <button class="btn-primary" style="padding: 5px 12px; font-size: 13px" @click="openModuleInNewWindow(2)">赛况 ↗</button>
              </div>
              <div class="flex-between" style="background: #fff8f4; padding: 9px 12px; border-radius: 0">
                <div style="font-size: 14px; font-weight: 800">京山周末分级赛 <span class="tag orange">余12位</span></div>
                <button class="btn-orange" style="padding: 5px 12px; font-size: 13px" @click="openModuleInNewWindow(2)">报名 ↗</button>
              </div>
            </div>
          </div>
        </div>

        <div class="grid-3 summary-stretch-grid">
          <div v-for="t in overviewThemes" :key="t.title" class="card home-hot-card summary-fill-card">
            <div class="photo-box" style="height: 152px" @click="openModuleInNewWindow(t.target)">
              <img :src="t.photo" :alt="t.title" />
              <span class="badge-tl">{{ t.badge }}</span>
            </div>
            <div class="summary-card-body">
              <div>
                <strong style="font-size: 16px; display: block; margin-bottom: 5px">{{ t.title }}</strong>
                <div style="font-size: 13.5px; color: var(--ink-2)">{{ t.desc }}</div>
              </div>
              <div class="flex-between">
                <span class="price" style="font-size: 20px">{{ t.price }}<small>{{ t.extra }}</small></span>
                <button class="home-more-link" @click="openModuleInNewWindow(t.target)">查看详情 ↗</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 02 打 · 场地服务摘要 -->
      <div v-else-if="state.activeModule === 2" class="summary-view-col">
        <div class="home-live-strip" style="padding: 14px 18px; flex-shrink: 0">
          <div class="flex-between" style="margin-bottom: 10px">
            <div class="flex-row">
              <span class="tag" style="background: var(--lime); color: #0b251d">📊 网球记实时比分</span>
            </div>
            <button class="home-live-jump" @click="openCurrentFullPage">查看全部赛况 ↗</button>
          </div>
          <div class="score-grid">
            <div v-for="m in state.liveMatches" :key="m.id" class="score-card" style="padding: 12px 14px">
              <div class="sc-head" style="margin-bottom: 6px">
                <span>{{ m.venue }} · <strong>{{ m.courtNo }}</strong></span>
                <span :style="{ color: m.status === '已完赛' ? 'var(--lime)' : '#FF7B6B' }">
                  {{ m.status }}
                </span>
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

        <div class="grid-3 summary-stretch-grid">
          <div v-for="venue in filteredHotCourts" :key="venue.id" class="card home-hot-card summary-fill-card">
            <div class="photo-box" style="height: 162px" @click="openVenueDetail(venue.id)">
              <img :src="venue.photo" :alt="venue.name" />
              <span class="badge-tl">★ {{ venue.rating }} · {{ venue.region }}</span>
            </div>
            <div class="summary-card-body">
              <div>
                <strong style="font-size: 16.5px; display: block; margin-bottom: 5px; cursor: pointer" @click="openVenueDetail(venue.id)">{{ venue.name }}</strong>
                <div style="font-size: 13.5px; color: var(--ink-2)">{{ venue.openHours }} · {{ venue.priceDesc }}</div>
              </div>
              <div class="home-slot-preview">
                <button
                  v-for="slot in venue.slots.slice(0, 2)"
                  :key="slot.time"
                  class="home-slot-chip"
                  @click="
                    openBookingModal({
                      venueId: venue.id,
                      venueName: venue.name,
                      slotTime: slot.time,
                      price: slot.price,
                      memberPrice: slot.memberPrice,
                      parkingName: venue.parkingName,
                      chargerName: venue.chargerName,
                    })
                  "
                >
                  <strong>今日 {{ slot.time }}</strong>
                  <span>¥{{ slot.memberPrice }} · 余{{ slot.remaining }}片</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 03 游 · 旅游游览摘要 -->
      <div v-else-if="state.activeModule === 3" class="summary-view-col">
        <div class="ticket-stub-banner" style="flex-shrink: 0">
          <strong style="font-size: 16.5px">🌿 官方精选游玩线路 · 覆盖京山及周边核心景区</strong>
          <span class="tag" style="background: var(--lime); color: #0b251d">三圈层精选 3 条</span>
        </div>

        <div class="grid-3 summary-stretch-grid">
          <div v-for="route in TOUR_ROUTES" :key="route.id" class="card home-hot-card summary-fill-card">
            <div
              class="photo-box"
              style="height: 196px"
              @click="openTourRouteDetail(route)"
            >
              <img :src="route.photo" :alt="route.title" />
              <span class="badge-tl">{{ route.scope }} · {{ route.duration }}</span>
            </div>
            <div class="summary-card-body">
              <div>
                <strong style="font-size: 16.5px; display: block; margin-bottom: 6px; cursor: pointer" @click="openTourRouteDetail(route)">{{ route.title }}</strong>
                <div style="font-size: 13.5px; color: var(--ink-2)">{{ route.desc }}</div>
              </div>
              <div class="flex-between">
                <span class="price" style="font-size: 20px">¥{{ route.price }}<small>/人起</small></span>
                <button
                  class="btn-primary"
                  @click="openTourRouteDetail(route)"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 04 吃 · 美食服务摘要 -->
      <div v-else-if="state.activeModule === 4" class="summary-view-col">
        <div class="ticket-stub-banner" style="padding: 11px 16px; flex-shrink: 0">
          <div>
            <strong style="font-size: 14px">🎫 打球电子票根（{{ state.ticketStubCode }}）· 吃美食直享 85 折</strong>
            <div style="font-size: 11.5px; color: rgba(255, 255, 255, 0.82)">
              全市 79 家网球联盟餐饮支持票根核销满减，包厢与夜市桌位可在线预约
            </div>
          </div>
          <button class="btn-orange" @click="openActionModal({ type: 'stub', code: state.ticketStubCode })">出示电子票根</button>
        </div>

        <div class="grid-3 summary-stretch-grid">
          <div v-for="r in hotRestaurants" :key="r.name" class="card home-hot-card summary-fill-card">
            <div class="photo-box" style="height: 196px" @click="openRestaurantDetail(r)">
              <img :src="r.photo" :alt="r.name" />
              <span class="badge-tl">{{ r.badge }}</span>
            </div>
            <div class="summary-card-body">
              <div>
                <strong style="font-size: 16.5px; display: block; margin-bottom: 6px; cursor: pointer" @click="openRestaurantDetail(r)">{{ r.name }}</strong>
                <div style="font-size: 13.5px; color: var(--ink-2)">★ {{ r.rating }} · {{ r.dist }}</div>
              </div>
              <div class="flex-between">
                <span class="price" style="font-size: 20px">¥{{ r.avg }}<small>/人均</small></span>
                <button class="btn-primary" @click="openRestaurantDetail(r)">看详情与菜单</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 05 住 · 住宿服务摘要 -->
      <div v-else-if="state.activeModule === 5" class="summary-view-col">
        <div class="promo-banner" style="flex-shrink: 0">
          <strong style="font-size: 16.5px; color: #542600">🏠 京山市房管局重磅活动：赛事期间购房直减 ¥50,000</strong>
          <button class="btn-orange" @click="claimHomeSubsidy">
            {{ state.claimedHomeSubsidy ? '✅ 已领5万补贴券' : '领取5万购房补贴券' }}
          </button>
        </div>

        <div class="grid-3 summary-stretch-grid">
          <div v-for="hotel in hotHotels" :key="hotel.id" class="card home-hot-card summary-fill-card">
            <div class="photo-box" style="height: 192px" @click="openHotelDetail(hotel.id)">
              <img :src="hotel.photo" :alt="hotel.name" />
              <span class="badge-tl">{{ hotel.badge }}</span>
            </div>
            <div class="summary-card-body">
              <div>
                <strong style="font-size: 16.5px; display: block; margin-bottom: 5px; cursor: pointer" @click="openHotelDetail(hotel.id)">{{ hotel.name }}</strong>
                <div style="font-size: 13.5px; color: var(--ink-2); margin-bottom: 10px">{{ hotel.distanceToCourt }}</div>
                <div class="summary-room-strip">
                  <span>{{ hotel.rooms[0]?.name }}</span>
                  <strong style="color: var(--primary)">余{{ hotel.rooms[0]?.remaining }}间</strong>
                </div>
              </div>
              <div class="flex-between">
                <span class="price" style="font-size: 20px">
                  ¥{{ hotel.rooms[0]?.eventPrice }}<small>{{ hotel.rooms[0]?.leaseUnit }}起</small>
                </span>
                <button class="btn-primary" @click="openHotelDetail(hotel.id)">看房型详情</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 06 行 · 出行服务摘要 -->
      <div v-else-if="state.activeModule === 6" class="summary-view-col">
        <div class="home-quad-alert" style="margin-bottom: 0; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0">
          <span>🚦 赛事交通提示（07:30–19:00）：温泉大道国际网球中心段临时管控，请按推荐点位停泊或乘免费摆渡车</span>
          <span class="tag red">赛期管控</span>
        </div>

        <div class="grid-3 summary-stretch-grid">
          <div v-for="lot in state.parkingLots" :key="lot.id" class="card card-pad summary-fill-card" style="justify-content: space-between">
            <div>
              <div class="flex-between" style="margin-bottom: 10px">
                <strong style="font-size: 16.5px">{{ lot.isCharger ? '⚡' : '🅿️' }} {{ lot.name }}</strong>
                <span class="tag" :class="lot.isCharger ? 'blue' : 'green'">
                  {{ lot.isCharger ? '闲' : '剩' }}{{ lot.remain }}/{{ lot.total }}
                </span>
              </div>
              <div class="coord-bar" style="margin-bottom: 12px">
                <span>📍 {{ lot.address }}</span>
              </div>
              <div class="summary-bar-track">
                <div
                  class="summary-bar-fill"
                  :style="{ width: `${Math.round((lot.remain / lot.total) * 100)}%` }"
                />
              </div>
              <div style="font-size: 13px; color: var(--ink-2); margin-top: 6px">
                当前空闲率 {{ Math.round((lot.remain / lot.total) * 100) }}% · 锁位保留 30 分钟
              </div>
            </div>
            <button
              :class="lot.reserved ? 'btn-ghost' : 'btn-primary'"
              style="width: 100%; padding: 10px 12px; margin-top: 14px"
              @click="reserveParkingOrCharger(lot.id)"
            >
              {{ lot.reserved ? '✅ 已锁位（保留30分钟）' : lot.isCharger ? '一键预约充电桩' : '免费提前锁车位' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 07 购 · 特色商品摘要 -->
      <div v-else-if="state.activeModule === 7" class="summary-view-col">
        <div class="ticket-stub-banner" style="flex-shrink: 0">
          <strong style="font-size: 16.5px">🛍️ 京山好物官方商城 · 原产地直发全国包邮</strong>
          <span class="tag" style="background: var(--lime); color: #0b251d">农特 / 文创</span>
        </div>

        <div class="grid-4 summary-stretch-grid">
          <div v-for="item in hotProducts" :key="item.id" class="card home-hot-card summary-fill-card">
            <div class="photo-box" style="height: 186px" @click="openProductDetail(item.id)">
              <img :src="item.photo" :alt="item.name" />
              <span class="badge-tl">{{ item.badge }}</span>
            </div>
            <div class="summary-card-body">
              <div>
                <strong style="font-size: 15.5px; display: block; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer" @click="openProductDetail(item.id)">
                  {{ item.name }}
                </strong>
                <div style="font-size: 13px; color: var(--ink-2)">★ {{ item.rating }} · 已售 {{ item.sold }}</div>
              </div>
              <div class="flex-between">
                <span class="price" style="font-size: 19px">¥{{ item.memberPrice }}<small>会员价</small></span>
                <button class="btn-primary" style="padding: 6px 12px; font-size: 13px" @click="openProductDetail(item.id)">看详情</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 08 娱 · 休闲娱乐摘要 -->
      <div v-else-if="state.activeModule === 8" class="summary-view-col">
        <div class="ticket-stub-banner" style="flex-shrink: 0; background: linear-gradient(95deg, #2d1b4e 0%, #52308a 100%)">
          <strong style="font-size: 16.5px">♨️ 赛后放松与亲子休闲 · 凭票根享天沐温泉立减 ¥60</strong>
          <span class="tag" style="background: var(--lime); color: #0b251d">温泉 / 农庄 / 影城</span>
        </div>

        <div class="grid-3 summary-stretch-grid">
          <div v-for="ent in hotEntertainments" :key="ent.id" class="card home-hot-card summary-fill-card">
            <div
              class="photo-box"
              style="height: 196px"
              @click="openEntDetail(ent)"
            >
              <img :src="ent.photo" :alt="ent.name" />
              <span class="badge-tl">{{ ent.cat }}</span>
            </div>
            <div class="summary-card-body">
              <div>
                <strong style="font-size: 16.5px; display: block; margin-bottom: 5px; cursor: pointer" @click="openEntDetail(ent)">{{ ent.name }}</strong>
                <div style="font-size: 13.5px; color: var(--ink-2)">★ {{ ent.rating }} · {{ ent.dist }}</div>
              </div>
              <div class="flex-between">
                <span class="price" style="font-size: 19px">{{ ent.price }}</span>
                <button
                  class="btn-primary"
                  @click="openEntDetail(ent)"
                >
                  {{ ent.id === 'ent-6' ? '在线选座' : '查看详情' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 09 训 · 培训研学摘要 -->
      <div v-else-if="state.activeModule === 9" class="summary-view-col">
        <div class="grid-2 summary-stretch-grid">
          <div class="card summary-fill-card" style="border: 1.5px solid #0d7278">
            <div class="photo-box" style="height: 226px" @click="openCurrentFullPage">
              <img src="/images/coach_2.jpg" alt="湖北省网球学校" />
              <span class="badge-tl" style="background: #0d7278">🎓 湖北省网球学校</span>
            </div>
            <div class="summary-card-body">
              <div>
                <strong style="font-size: 18px; display: block; margin-bottom: 8px">湖北省网球学校 · 招生咨询 & 青少年 7 天营</strong>
                <div style="font-size: 14px; color: var(--ink-2); margin-bottom: 10px">
                  面向全国招收小学至高中网球特长生与冬夏令营学员，国家级教练团队保障。
                </div>
                <div class="flex-row">
                  <span class="tag green">1:4 分层小班</span>
                  <span class="tag blue">含营地食宿与评测</span>
                </div>
              </div>
              <div class="flex-between">
                <span class="price" style="font-size: 21px">¥2,480<small>/期</small></span>
                <button
                  class="btn-primary"
                  @click="openActionModal({ type: 'inquiry', title: '湖北省网球学校 · 招生与探校咨询', subtitle: '支持小学/初中/高中网球特长招生咨询及冬夏令营报名', submitLabel: '提交招生咨询单' })"
                >
                  在线招生咨询
                </button>
              </div>
            </div>
          </div>

          <div class="card card-pad summary-fill-card" style="background: linear-gradient(135deg, #f3faf6, #ffffff); border: 1.5px solid var(--primary); justify-content: space-between">
            <div>
              <div class="flex-between" style="margin-bottom: 16px">
                <div>
                  <span class="tag green">🏅 官方五维能力评测</span>
                  <strong style="font-size: 19px; display: block; margin-top: 6px">当前官方认证等级：{{ state.abilityLevel }}</strong>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 13px">
                <div v-for="bar in abilityBars" :key="bar.label" class="summary-bar-row">
                  <span style="width: 124px; font-size: 14px; font-weight: 700; color: var(--ink-2)">{{ bar.label }}</span>
                  <div class="summary-bar-track">
                    <div class="summary-bar-fill" :style="{ width: `${bar.val}%` }" />
                  </div>
                  <strong style="width: 36px; text-align: right; font-size: 15px; color: var(--primary)">{{ bar.val }}</strong>
                </div>
              </div>
            </div>

            <div class="grid-2" style="gap: 12px; margin-top: 16px">
              <div class="summary-mini-tile">
                <strong>🏛️ 指定评测机构</strong>
                <span>省网校 / 国际网球中心</span>
              </div>
              <div class="summary-mini-tile">
                <strong>🩺 运动康复保障</strong>
                <span>市卫健局认证绿色通道</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 10 便民配套服务摘要 -->
      <div v-else-if="state.activeModule === 10" class="summary-view-col">
        <div class="ticket-stub-banner" style="flex-shrink: 0">
          <strong style="font-size: 16.5px">☀️ 今日气象与赛场保障：晴 19°C · AQI 28 空气优 · 微风 2 级</strong>
          <span class="tag" style="background: var(--lime); color: #0b251d">适宜室外打球</span>
        </div>

        <div class="grid-4 summary-stretch-grid">
          <div class="card card-pad summary-fill-card" style="justify-content: space-between">
            <div>
              <span class="tag red mb-10">🏥 医疗与急救</span>
              <strong style="font-size: 17px; display: block; margin-bottom: 8px">3 处 AED & 医疗站</strong>
              <div style="font-size: 13.5px; color: var(--ink-2); line-height: 1.6">
                覆盖核心场馆与市人民医院运动损伤急救绿色通道。
              </div>
            </div>
            <div class="summary-fact-grid">
              <div><strong>3 处</strong><span>AED 设备</span></div>
              <div><strong>5 分钟</strong><span>响应时间</span></div>
            </div>
          </div>

          <div class="card card-pad summary-fill-card" style="justify-content: space-between">
            <div>
              <span class="tag blue mb-10">🚻 公厕与母婴室</span>
              <strong style="font-size: 17px; display: block; margin-bottom: 8px">24 处星级点位</strong>
              <div style="font-size: 13.5px; color: var(--ink-2); line-height: 1.6">
                配无障碍通道、空调与母婴护理台，支持定位导航。
              </div>
            </div>
            <div class="summary-fact-grid">
              <div><strong>24 处</strong><span>星级点位</span></div>
              <div><strong>100%</strong><span>无障碍覆盖</span></div>
            </div>
          </div>

          <div class="card card-pad summary-fill-card" style="justify-content: space-between">
            <div>
              <span class="tag green mb-10">💧 补水与淋浴</span>
              <strong style="font-size: 17px; display: block; margin-bottom: 8px">全馆免费配套</strong>
              <div style="font-size: 13.5px; color: var(--ink-2); line-height: 1.6">
                提供恒温直饮水、智能储物柜及运动员赛后淋浴间。
              </div>
            </div>
            <div class="summary-fact-grid">
              <div><strong>18 台</strong><span>直饮水机</span></div>
              <div><strong>40 个</strong><span>淋浴储物位</span></div>
            </div>
          </div>

          <div class="card card-pad summary-fill-card" style="justify-content: space-between">
            <div>
              <span class="tag gold mb-10">📞 政务服务热线</span>
              <strong style="font-size: 17px; display: block; margin-bottom: 8px">24h 城运保障</strong>
              <div style="font-size: 13.5px; color: var(--ink-2); line-height: 1.6">
                失物招领登记、设施报修一键上报，联动 12345 处置。
              </div>
            </div>
            <div class="summary-fact-grid">
              <div><strong>10 分钟</strong><span>平均响应</span></div>
              <div><strong>12345</strong><span>24h 热线</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 11 互动反馈摘要 -->
      <div v-else-if="state.activeModule === 11" class="summary-view-col">
        <div class="ticket-stub-banner" style="flex-shrink: 0">
          <strong style="font-size: 16.5px">🛡️ 12345 投诉自动分办 & 商家信用动态监管（办结满意度 98.6%）</strong>
          <span class="tag" style="background: var(--lime); color: #0b251d">口碑与信用闭环</span>
        </div>

        <div class="grid-3 summary-stretch-grid">
          <div v-for="post in state.posts.slice(0, 3)" :key="post.id" class="card home-hot-card summary-fill-card">
            <div class="photo-box" style="height: 196px" @click="openCurrentFullPage">
              <img :src="post.photo" :alt="post.title" />
              <span class="badge-tl">{{ post.category }}</span>
            </div>
            <div class="summary-card-body">
              <div>
                <strong style="font-size: 16px; display: block; margin-bottom: 6px">{{ post.title }}</strong>
                <div style="font-size: 13.5px; color: var(--ink-2)">★ {{ post.rating.toFixed(1) }} · {{ post.origin }}球友「{{ post.author }}」</div>
              </div>
              <div class="flex-between" style="padding-top: 10px; border-top: 1px dashed var(--line)">
                <span class="tag green">已核验评价</span>
                <button class="home-more-link" @click="openCurrentFullPage">查看详情 ↗</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 12 小程序互联互通摘要 -->
      <div v-else-if="state.activeModule === 12" class="summary-view-col">
        <div class="ticket-stub-banner" style="flex-shrink: 0">
          <strong style="font-size: 16.5px">🔗 政务 / 文旅 / 赛事 / 出行 一站式直连服务</strong>
          <span class="tag" style="background: var(--lime); color: #0b251d">统一身份认证</span>
        </div>

        <div class="grid-4 summary-stretch-grid">
          <div
            v-for="app in miniPrograms"
            :key="app.name"
            class="card card-pad home-hot-card summary-fill-card"
            style="cursor: pointer; justify-content: space-between"
            @click="openActionModal({ type: 'miniprogram', appName: app.name, desc: app.desc })"
          >
            <div>
              <div class="flex-between mb-12">
                <span style="font-size: 34px">{{ app.icon }}</span>
                <span class="tag green">{{ app.tag }}</span>
              </div>
              <strong style="font-size: 17px; display: block; margin-bottom: 10px">{{ app.name }}</strong>
              <div style="font-size: 14px; color: var(--ink-2); line-height: 1.65">{{ app.desc }}</div>
            </div>
            <div class="flex-between" style="padding-top: 12px; margin-top: 16px; border-top: 1px dashed var(--line)">
              <span style="font-size: 13px; color: var(--primary); font-weight: 700">● 官方直连</span>
              <span style="font-size: 14px; font-weight: 800; color: var(--primary)">立即使用 →</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 13 个人中心摘要 -->
      <div v-else class="summary-view-col">
        <div class="grid-2 summary-stretch-grid">
          <div class="card card-pad summary-fill-card" style="background: linear-gradient(135deg, #0b3327, #0f4c39); color: #fff; justify-content: space-between">
            <div>
              <div class="flex-between" style="margin-bottom: 18px">
                <div class="flex-row" style="gap: 12px">
                  <div class="avatar-sm" style="width: 48px; height: 48px; font-size: 20px">林</div>
                  <div>
                    <strong style="font-size: 19px">林先生 · {{ memberTier.name }}</strong>
                    <div style="font-size: 14px; color: rgba(255, 255, 255, 0.84); margin-top: 3px">
                      能力等级 {{ state.abilityLevel }} · 联盟享 {{ Math.round(memberTier.discount * 100) / 10 }} 折
                    </div>
                  </div>
                </div>
                <button class="btn-orange" @click="openActionModal({ type: 'stub', code: state.ticketStubCode })">电子票根</button>
              </div>

              <div class="grid-3" style="gap: 12px; margin-bottom: 18px">
                <div class="summary-dark-stat">
                  <strong>{{ state.points }}</strong>
                  <span>可用积分</span>
                </div>
                <div class="summary-dark-stat">
                  <strong>{{ activeOrdersCount }}</strong>
                  <span>有效订单</span>
                </div>
                <div class="summary-dark-stat">
                  <strong>{{ state.coupons.length }}</strong>
                  <span>优惠卡券</span>
                </div>
              </div>
            </div>

            <div style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(196, 246, 61, 0.28); border-radius: 0; padding: 14px 16px">
              <div class="flex-between" style="margin-bottom: 6px">
                <span style="font-size: 14px; font-weight: 800; color: var(--lime)">🎫 电子票根与卡券</span>
                <span style="font-size: 13px; color: rgba(255, 255, 255, 0.8)">{{ state.ticketStubCode }}</span>
              </div>
              <div v-for="cp in state.coupons.slice(0, 2)" :key="cp.id" style="font-size: 13.5px; color: rgba(255, 255, 255, 0.92); padding: 3px 0">
                • <strong>{{ cp.title }}</strong>
              </div>
            </div>
          </div>

          <div class="card card-pad summary-fill-card" style="justify-content: space-between">
            <div>
              <div class="flex-between" style="margin-bottom: 14px">
                <strong style="font-size: 17px">🧾 最近订单（共 {{ state.orders.length }} 笔）</strong>
                <span class="tag green">支持核销与退改</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px">
                <div
                  v-for="order in state.orders.slice(0, 3)"
                  :key="order.id"
                  class="flex-between"
                  style="background: #f6faf8; border: 1px solid #e4efe9; padding: 12px 14px; border-radius: 0"
                >
                  <div style="min-width: 0">
                    <div style="font-size: 14.5px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
                      [{{ order.category }}] {{ order.title }}
                    </div>
                    <div style="font-size: 13px; color: var(--ink-3); margin-top: 3px">{{ order.time }}</div>
                  </div>
                  <div style="text-align: right; flex-shrink: 0">
                    <strong style="font-size: 16px; color: var(--accent)">¥{{ order.amount }}</strong>
                    <div style="font-size: 12.5px; color: var(--primary); font-weight: 700">{{ order.status }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 固定容器统一底部跳转入口 -->
    <div class="summary-stage-footer">
      <div v-if="state.activeModule === 1" class="summary-footer-links">
        <button class="home-jump-btn sm" @click="openModuleInNewWindow(2)">打 · 订场与比分 ↗</button>
        <button class="home-jump-btn sm" @click="openModuleInNewWindow(4)">吃 · 美食与夜市 ↗</button>
        <button class="home-jump-btn sm" @click="openModuleInNewWindow(5)">住 · 公寓与酒店 ↗</button>
        <button class="home-jump-btn sm" @click="openModuleInNewWindow(3)">游 · 全域线路 ↗</button>
      </div>
      <button v-else class="summary-footer-cta" @click="openCurrentFullPage">
        查看「{{ currentMeta.shortName }}」全部内容 ↗
      </button>
    </div>
  </section>
</template>
