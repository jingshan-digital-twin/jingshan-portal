<script setup lang="ts">
import { computed } from 'vue'
import { ENTERTAINMENT_ITEMS, TOUR_ROUTES } from '../../mock/data'
import { HOTEL_PROFILES, PRODUCT_CATALOG } from '../../mock/details'
import { usePortalStore } from '../../store/usePortalStore'
import type { ModuleId } from '../../types/portal'

const {
  state,
  navigateToModulePage,
  openPhoto,
  openHotelDetail,
  openProductDetail,
  openVenueDetail,
  openCinemaDetail,
  openBookingModal,
  openActionModal,
} = usePortalStore()

function openNewPage(id: ModuleId) {
  navigateToModulePage(id)
}

const themes = [
  {
    key: '网球+文旅',
    badge: '🌿 主题一：网球 + 文旅',
    sub: '★ 4.9 · 延伸荆门/全省线路',
    photo: '/images/scenic.jpg',
    title: '京山打球 → 绿林山/空山洞 + 明显陵延伸线',
    desc: '热门打卡：莲山湖网红球场、美人谷、文峰河畔夜市 · 含语音导览',
    intro: '以京山国际网球中心与文峰公园挥拍为起点，午后乘网球文旅专线畅游国家4A级绿林山美人谷与恒温溶洞空山洞，夜晚漫步文峰河畔夜市品尝小龙虾与米茶，次日更可延伸打卡世界文化遗产钟祥明显陵。',
    openHours: '全年天天发团 · 推荐 2天1晚',
    address: '湖北省荆门市京山市温泉街道网球大道1号（集结出发点）',
    lng: 113.1195,
    lat: 31.0218,
    tags: ['官方精品网旅线', '含红土/硬地订场', '配智能语音导览', '票根享吃住85折'],
    hotItems: [
      { name: '绿林山美人谷 & 空山洞', price: '含景点门票', tag: '4A生态秘境', desc: '负氧离子3,200+/cm³，赛后轻徒步吸氧绝佳之选。' },
      { name: '文峰河畔夜市 & 桥米宴', price: '含票根85折', tag: '地道风味', desc: '现焖桥米锅巴、排骨藕汤与河畔碳火夜宵。' },
    ],
    detailedReviews: [
      { user: '武汉球友阿泽', origin: '武汉', score: 5.0, date: '2026-11-24', content: '上午打球下午吸氧晚上吃烧烤，两天行程张弛有度，完全不赶路，特别适合带朋友自驾来玩！' },
      { user: '深圳球友Alex', origin: '深圳', score: 4.9, date: '2026-11-19', content: '第一次发现打完网球还能顺路逛世界遗产明显陵，客服安排得非常细致。' },
    ],
    price: '¥498',
    extra: '/人起 · 会员9折',
    btn: '文旅专区 →',
    target: 3 as const,
  },
  {
    key: '网球+研学',
    badge: '🎓 主题二：网球 + 研学',
    sub: '★ 4.9 · 湖北省网球学校直营',
    photo: '/images/coach_2.jpg',
    title: '湖北省网球学校 7 天冬夏令营 & 等级评测',
    desc: '训后可在指定机构参加五维能力晋升测试 · 含食宿与赛事体验',
    intro: '依托全国体教融合典范——湖北省网球学校优质教练团队与31片室内风雨及红土场资源，针对6–18岁青少年与成人球友开设封闭式系统训练营，课程涵盖底线稳定性、发球动力学、战术实战与结营官方五维等级认证评测。',
    openHours: '寒暑假 & 周末滚动开营（7天/期）',
    address: '湖北省荆门市京山市温泉街道网球大道16号（湖北省网球学校）',
    lng: 113.1245,
    lat: 31.0242,
    tags: ['省网校直营教练', '含标准营地食宿', '官方五维能力评测', '完营积+200分'],
    hotItems: [
      { name: '国家级教练分层小班特训', price: '每日4小时', tag: '1:4师生比', desc: '按JS等级分班教学，精准纠正发球与反手发力动作。' },
      { name: '结营五维能力评测与证书', price: '含在营费内', tag: '官方录入', desc: '结营实测录入五维雷达图，颁发等级认证证书。' },
    ],
    detailedReviews: [
      { user: '长沙欣然妈妈', origin: '长沙', score: 5.0, date: '2026-11-23', content: '孩子在省网校练了一周，动作规范太多了，结营直接通过了晋升测试，还交到了全国各地的球友！' },
      { user: '北京林先生', origin: '北京', score: 4.9, date: '2026-11-18', content: '学校旁边就是网球公寓，家长陪读住得舒心，教练责任心很强。' },
    ],
    price: '¥2,480',
    extra: '/期 · 积+200分',
    btn: '研学专区 →',
    target: 9 as const,
  },
  {
    key: '网球+康养',
    badge: '♨️ 主题三：网球 + 康养',
    sub: '★ 4.9 · 官方旗舰热销1,240份',
    photo: '/images/hotspring.jpg',
    title: '京山四天三晚尊享：打网球 + 泡温泉 + 运动康复',
    desc: '含6小时红土/硬地场 + 温泉主题酒店 + 专业理疗恢复 + 桥米宴',
    intro: '京山年度口碑No.1官方旗舰度假产品！专为热爱网球又讲究身心恢复的品质球友设计：连住三晚五星/私汤温泉酒店，每天畅打红土/硬地标准场，赛后尊享天然偏硅酸温泉私汤、卫健认证运动康复筋膜松解与非遗桥米欢迎宴。',
    openHours: '全年可订 · 四天三晚自由行/小包团',
    address: '湖北省荆门市京山市温泉街道天沐温泉度假区',
    lng: 113.1415,
    lat: 31.0312,
    tags: ['热销1,240份', '含6h高端订场', '天然矿物质私汤', '配专业运动理疗'],
    hotItems: [
      { name: '红土+硬地畅打6小时', price: '含灯光与陪练体验', tag: '旗舰权益', desc: '优先锁定国际网球中心与训练基地黄金时段场地。' },
      { name: '天沐温泉 + 运动康复理疗', price: '含3晚温泉房', tag: '满血恢复', desc: '天然矿泉汤池叠加专业康复师筋膜放松，告别次日酸痛。' },
    ],
    detailedReviews: [
      { user: '上海球友俱乐部陈总', origin: '上海', score: 5.0, date: '2026-11-25', content: '带俱乐部8个人订了四天三晚套餐，白天打红土晚上泡温泉再做个理疗，吃的是地道桥米宴，大家都说来年还要来！' },
      { user: '武汉周女士', origin: '武汉', score: 4.9, date: '2026-11-20', content: '全程无缝衔接，高铁站有专车接送，几乎零操心的高品质运动度假体验。' },
    ],
    price: '¥2,999',
    extra: '/人起 · 票根立减',
    btn: '立即查看 →',
    target: 3 as const,
    orange: true,
  },
]

const hotRestaurants = [
  {
    name: '桥米公馆 · 京山非遗特色鄂菜',
    photo: '/images/cuisine.jpg',
    badge: '票根85折',
    dist: '距国际网球中心 600m',
    rating: 4.9,
    avg: 78,
    summary: '国宝桥米锅巴 · 洪湖排骨藕汤 · 惠亭湖刁子鱼',
    address: '湖北省荆门市京山市温泉街道京山大道96号',
    lng: 113.1168,
    lat: 31.0226,
  },
  {
    name: '绿林山水农家土菜馆',
    photo: '/images/scenic.jpg',
    badge: '满100减25',
    dist: '绿林山景区入口 200m',
    rating: 4.8,
    avg: 65,
    summary: '绿林山泉土鸡汤 · 农家腊肉炒春笋 · 柴火桥米饭',
    address: '湖北省荆门市京山市绿林镇绿林山风景区南门200米处',
    lng: 112.9781,
    lat: 31.3402,
  },
  {
    name: '文峰河畔老字号碳火烧烤 & 轻食街',
    photo: '/images/night_market.jpg',
    badge: '票根赠米茶',
    dist: '距文峰公园球场 300m',
    rating: 4.9,
    avg: 58,
    summary: '秘制油焖小龙虾 · 现烤鲜牛肉串 · 赛后轻食沙拉',
    address: '湖北省荆门市京山市新市街道文峰河滨夜市街区A区12号',
    lng: 113.1135,
    lat: 31.0172,
  },
]

const hotHotels = computed(() => HOTEL_PROFILES.slice(0, 3))
const hotProducts = computed(() => PRODUCT_CATALOG.slice(0, 2))
const hotEntertainments = computed(() => [ENTERTAINMENT_ITEMS[3]!, ENTERTAINMENT_ITEMS[5]!])

const totalRemainingSlots = computed(() =>
  state.courts.reduce(
    (sum, c) => sum + c.slots.reduce((s, slot) => s + slot.remaining, 0),
    0,
  ),
)

function openRestaurantMenu(r: (typeof hotRestaurants)[number]) {
  openPhoto({
    title: r.name,
    category: '京网推荐美食详情',
    photo: r.photo,
    rating: r.rating,
    subtitle: `${r.badge} ｜ ${r.dist}`,
    intro: `${r.name}为「京山网球」官方认证联盟餐饮，招牌推荐：${r.summary}。出示订场/参赛电子票根进店扫码即享专属折扣。`,
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
    tags: [r.badge, '网球联盟商家', '明厨亮灶A级食安'],
    reviews: [],
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

function getLowestRoom(hotel: (typeof HOTEL_PROFILES)[number]) {
  return hotel.rooms[0]!
}
</script>

<template>
  <section class="home-fixed-overview">
    <!-- 01 首页总览与网球主题专区 -->
    <div class="home-overview-bar mb-18">
      <div class="home-overview-bar-left">
        <h2 class="summary-stage-title">全城服务总览与热门精选</h2>
      </div>
      <button
        type="button"
        class="hdr-pill hdr-pill-event"
        style="height: 36px"
        @click="state.showEventModal = true"
      >
        赛事福利
      </button>
    </div>

    <div class="grid-split mb-18">
      <div class="card">
        <div
          class="photo-box"
          style="height: 268px"
          @click="openActionModal({ type: 'video', title: '《中国网球之城 · 生态京山》官方城市宣传片', duration: '02:15' })"
        >
          <img src="/images/hero.jpg" alt="京山网球城市名片宣传片" />
          <div class="badge-tl"><span class="live-dot" />官方城市宣传片 · 02:15</div>
          <div
            style="
              position: absolute;
              inset: 0;
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
              padding: 22px 24px;
              background: linear-gradient(180deg, transparent 20%, rgba(8, 30, 22, 0.92) 100%);
              color: #fff;
            "
          >
            <div class="flex-between">
              <div style="font-size: 23px; font-weight: 900">以球塑城、以赛兴业：欢迎来到生态京山</div>
              <div class="flex-row">
                <button
                  class="btn-orange"
                  style="border-radius: 8px"
                  @click.stop="openActionModal({ type: 'video', title: '《中国网球之城 · 生态京山》官方城市宣传片', duration: '02:15' })"
                >
                  ▶ 宣传片
                </button>
                <button
                  class="btn-ghost"
                  style="border-radius: 8px"
                  @click.stop="openActionModal({ type: 'audio', spotName: '京山网球城市全景导览', duration: '全城2日游推荐', photo: '/images/hero.jpg', script: '欢迎来到中国网球之城——湖北京山。全市拥有356片标准网球场，每万人拥有5.67片，您可以以京山国际网球中心为起点，串联天沐温泉、绿林山、空山洞、文峰夜市与桥米美食，开启挥拍山水间的惬意旅程。' })"
                >
                  🗺️ 语音导览
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="card-pad flex-between" style="background: #fafdfc">
          <div class="flex-row">
            <span class="tag green">🎾 快捷订场</span>
            <span style="font-size: 14.5px; font-weight: 700">
              今日可约 <strong style="color: var(--primary)">84 片</strong> · 余 {{ totalRemainingSlots }} 个时段
            </span>
          </div>
          <div class="flex-row">
            <button class="btn-primary" @click="openNewPage(2)">进入订场专区 →</button>
            <button class="btn-ghost" @click="openNewPage(13)">我的能力卡 →</button>
          </div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px">
        <div v-if="state.showActivityPopup" class="popup-preview">
          <div class="flex-between" style="margin-bottom: 8px">
            <span class="tag orange">市房管局惠民政策</span>
            <button style="border: none; background: transparent; font-size: 13px; color: var(--ink-3)" @click="state.showActivityPopup = false">
              ✕ 收起
            </button>
          </div>
          <div style="font-size: 18px; font-weight: 900; color: #472500; margin-bottom: 10px">
            🏠 网球公开赛期间购房直减 ¥50,000！
          </div>
          <div class="flex-between">
            <span class="tag gold">含网球公寓长短租</span>
            <button class="btn-orange" @click="openNewPage(5)">查看政策与公寓 →</button>
          </div>
        </div>
        <div v-else class="card card-pad flex-between" style="background: #fff9ef">
          <span style="font-size: 14px; font-weight: 700; color: #7a4e16">🎁 购房减5万元政策已收起</span>
          <button class="btn-ghost" @click="state.showActivityPopup = true">展开</button>
        </div>

        <div class="card card-pad">
          <div class="flex-between" style="margin-bottom: 12px">
            <strong style="font-size: 17px">🏆 近期焦点赛事</strong>
            <button class="home-more-link" @click="openNewPage(2)">实时比分 →</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px">
            <div class="flex-between" style="background: #f5faf8; padding: 11px 13px; border-radius: 0">
              <div>
                <div style="font-size: 14.5px; font-weight: 800">2026中青赛总决赛 <span class="tag red">进行中</span></div>
                <div style="font-size: 13px; color: var(--ink-3); margin-top: 2px">11/24–12/3 · 国际网球中心</div>
              </div>
              <button class="btn-primary" @click="openNewPage(2)">赛况 →</button>
            </div>
            <div class="flex-between" style="background: #fff8f4; padding: 11px 13px; border-radius: 0">
              <div>
                <div style="font-size: 14.5px; font-weight: 800">京山周末分级赛 <span class="tag orange">余12位</span></div>
                <div style="font-size: 13px; color: var(--ink-3); margin-top: 2px">11/29 文峰公园 · 匹配 {{ state.abilityLevel }}</div>
              </div>
              <button class="btn-orange" @click="openNewPage(2)">报名 →</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 三大精品主题 -->
    <div class="grid-3 mb-24">
      <div v-for="t in themes" :key="t.key" class="card">
        <div
          class="photo-box"
          style="height: 175px"
          @click="
            openPhoto({
              title: t.title,
              category: '京山网球精品主题详情',
              photo: t.photo,
              rating: 4.9,
              subtitle: `${t.badge} ｜ ${t.sub}`,
              intro: t.intro,
              openHours: t.openHours,
              priceInfo: `${t.price}${t.extra}`,
              address: t.address,
              lng: t.lng,
              lat: t.lat,
              tags: t.tags,
              hotItemsTitle: '✨ 主题行程核心包含与亮点',
              hotItems: t.hotItems,
              reviews: t.detailedReviews,
            })
          "
        >
          <img :src="t.photo" :alt="t.title" />
          <span class="badge-tl">{{ t.badge }}</span>
        </div>
        <div class="card-pad">
          <div style="font-size: 17px; font-weight: 800; margin-bottom: 14px">{{ t.title }}</div>
          <div class="flex-between">
            <span class="price">{{ t.price }}<small>{{ t.extra }}</small></span>
            <button :class="t.orange ? 'btn-orange' : 'btn-primary'" @click="openNewPage(t.target)">{{ t.btn }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 02 热门球场 & 实时赛况概览（打 · 场地服务） -->
    <div class="home-section-block mb-24">
      <div class="home-sec-head">
        <div class="home-sec-left">
          <span class="home-sec-badge" style="background: linear-gradient(135deg, #10996d, #0a6b4d)">打</span>
          <h2 class="home-sec-title">热门球场推荐 & 实时赛况</h2>
        </div>
        <button class="home-jump-btn" @click="openNewPage(2)">
          查看全部球场（356片） →
        </button>
      </div>

      <!-- 实时焦点比分横栏 -->
      <div class="home-live-strip mb-16">
        <div class="flex-between" style="margin-bottom: 12px">
          <div class="flex-row">
            <span class="tag" style="background: var(--lime); color: #0b251d">📊 网球记实时比分</span>
            <span style="font-size: 14px; color: rgba(255, 255, 255, 0.9)">2026中青赛总决赛焦点对阵</span>
          </div>
          <button class="home-live-jump" @click="openNewPage(2)">全部赛况 →</button>
        </div>
        <div class="score-grid">
          <div v-for="m in state.liveMatches" :key="m.id" class="score-card" style="cursor: pointer" @click="openNewPage(2)">
            <div class="sc-head">
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

      <!-- Top 3 热门球场精选 -->
      <div class="grid-3">
        <div v-for="venue in state.courts.slice(0, 3)" :key="venue.id" class="card home-hot-card">
          <div
            class="photo-box"
            style="height: 170px"
            @click="openVenueDetail(venue.id)"
          >
            <img :src="venue.photo" :alt="venue.name" />
            <span class="badge-tl">★ {{ venue.rating }} · {{ venue.region }}</span>
          </div>
          <div class="card-pad">
            <strong style="font-size: 16.5px; display: block; margin-bottom: 6px; line-height: 1.3; cursor: pointer" @click="openVenueDetail(venue.id)">{{ venue.name }}</strong>
            <div style="font-size: 13.5px; color: var(--ink-2); margin-bottom: 12px">
              {{ venue.openHours }} · {{ venue.priceDesc }}
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
            <div class="flex-between" style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--line)">
              <span style="font-size: 13px; color: var(--primary); font-weight: 700">
                🅿️ 剩{{ venue.parkingRemain }} · ⚡ 闲{{ venue.chargerRemain }}
              </span>
              <button class="home-more-link" @click="openNewPage(2)">更多时段 →</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 03 吃 · 热门美食 & 住 · 精选住宿（双栏热门概览） -->
    <div class="grid-2 mb-24">
      <!-- 吃 · 美食服务概览 -->
      <div class="card card-pad home-panel">
        <div class="flex-between mb-16">
          <div class="home-sec-left">
            <span class="home-sec-badge" style="background: linear-gradient(135deg, #f25c43, #c93722)">吃</span>
            <h2 class="home-panel-title">热门美食与票根联盟</h2>
          </div>
          <button class="home-jump-btn sm" @click="openNewPage(4)">全部美食 →</button>
        </div>

        <div class="home-mini-list">
          <div
            v-for="r in hotRestaurants"
            :key="r.name"
            class="home-mini-item"
            @click="openRestaurantMenu(r)"
          >
            <img :src="r.photo" :alt="r.name" class="home-mini-thumb" />
            <div class="home-mini-body">
              <div class="flex-between">
                <strong class="home-mini-name">{{ r.name }}</strong>
                <span class="rating-pill">★ {{ r.rating }}</span>
              </div>
              <div class="home-mini-desc">{{ r.summary }}</div>
              <div class="flex-between" style="margin-top: 4px">
                <span class="tag orange">{{ r.badge }}</span>
                <span style="font-size: 15px; font-weight: 900; color: var(--accent)">人均 ¥{{ r.avg }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 住 · 住宿服务概览 -->
      <div class="card card-pad home-panel">
        <div class="flex-between mb-16">
          <div class="home-sec-left">
            <span class="home-sec-badge" style="background: linear-gradient(135deg, #3385f0, #195cc2)">住</span>
            <h2 class="home-panel-title">精选网球公寓与酒店</h2>
          </div>
          <button class="home-jump-btn sm" @click="openNewPage(5)">全部住宿 →</button>
        </div>

        <div class="home-mini-list">
          <div
            v-for="hotel in hotHotels"
            :key="hotel.id"
            class="home-mini-item"
            @click="openHotelDetail(hotel.id)"
          >
            <img :src="hotel.photo" :alt="hotel.name" class="home-mini-thumb" />
            <div class="home-mini-body">
              <div class="flex-between">
                <strong class="home-mini-name">{{ hotel.name }}</strong>
                <span class="rating-pill">★ {{ hotel.rating }}</span>
              </div>
              <div class="home-mini-desc">{{ hotel.distanceToCourt }} · 共 {{ hotel.rooms.length }} 种房型</div>
              <div class="flex-between" style="margin-top: 4px">
                <span class="tag blue">{{ hotel.category === '公寓' ? '网球公寓' : hotel.category }}</span>
                <strong style="font-size: 16px; color: var(--accent)">
                  ¥{{ getLowestRoom(hotel).eventPrice }}<small style="font-size: 12.5px; font-weight: 500; color: var(--ink-3)">{{ getLowestRoom(hotel).leaseUnit }}起</small>
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 04 游 · 全域网旅线路概览 -->
    <div class="home-section-block mb-24">
      <div class="home-sec-head">
        <div class="home-sec-left">
          <span class="home-sec-badge" style="background: linear-gradient(135deg, #2eb36a, #168249)">游</span>
          <h2 class="home-sec-title">全域网旅延伸线路</h2>
        </div>
        <button class="home-jump-btn" @click="openNewPage(3)">全部线路与导览 →</button>
      </div>

      <div class="grid-3">
        <div v-for="route in TOUR_ROUTES" :key="route.id" class="card home-hot-card">
          <div
            class="photo-box"
            style="height: 168px"
            @click="
              openPhoto({
                title: route.title,
                category: '京山全域网旅延伸线路',
                photo: route.photo,
                rating: route.rating,
                subtitle: `${route.badge} ｜ ${route.audio}`,
                intro: route.intro,
                openHours: route.openHours,
                priceInfo: `门票/套餐 ¥${route.price} 起`,
                address: route.address,
                lng: route.lng,
                lat: route.lat,
                tags: route.tags,
                highlights: route.highlights,
                hotItemsTitle: '🌟 线路热门打卡点',
                hotItems: route.hotItems,
                reviews: route.detailedReviews,
              })
            "
          >
            <img :src="route.photo" :alt="route.title" />
            <span class="badge-tl">{{ route.scope }} · {{ route.duration }}</span>
          </div>
          <div class="card-pad">
            <strong style="font-size: 16.5px; display: block; margin-bottom: 14px">{{ route.title }}</strong>
            <div class="flex-between">
              <span class="price" style="font-size: 20px">¥{{ route.price }}<small>/人起</small></span>
              <div class="flex-row" style="gap: 8px">
                <button
                  class="btn-ghost"
                  @click="openActionModal({ type: 'audio', spotName: route.title, duration: route.duration, script: route.script, photo: route.photo })"
                >
                  🎧 导览
                </button>
                <button class="btn-primary" @click="openNewPage(3)">详情 →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 05 行 · 购 · 娱 · 训 四大板块热门速览 -->
    <div class="home-section-block mb-24">
      <div class="home-sec-head">
        <div class="home-sec-left">
          <span class="home-sec-badge" style="background: linear-gradient(135deg, #0d7a58, #085940)">全</span>
          <h2 class="home-sec-title">行 · 购 · 娱 · 训 核心业务概览</h2>
        </div>
      </div>

      <div class="grid-4">
        <!-- 行 · 出行服务 -->
        <div class="card card-pad home-quad-card">
          <div class="flex-between mb-10">
            <span class="tag blue">🚦 行 · 出行</span>
          </div>
          <strong style="font-size: 16.5px; display: block; margin-bottom: 8px">车位充电 & 限行指引</strong>
          <div class="home-quad-alert">温泉大道 07:30–19:00 临时封闭</div>
          <div class="home-quad-list">
            <div v-for="lot in state.parkingLots" :key="lot.id" class="home-quad-row">
              <span>{{ lot.isCharger ? '⚡' : '🅿️' }} {{ lot.name }}</span>
              <strong :style="{ color: lot.isCharger ? 'var(--blue)' : 'var(--primary)' }">
                {{ lot.isCharger ? '闲' : '剩' }}{{ lot.remain }}
              </strong>
            </div>
          </div>
          <button class="home-quad-cta" @click="openNewPage(6)">进入出行专区 →</button>
        </div>

        <!-- 购 · 特色商品 -->
        <div class="card card-pad home-quad-card">
          <div class="flex-between mb-10">
            <span class="tag gold">🛍️ 购 · 好物</span>
          </div>
          <strong style="font-size: 16.5px; display: block; margin-bottom: 10px">京山农特与网球文创</strong>
          <div class="home-quad-products">
            <div
              v-for="prod in hotProducts"
              :key="prod.id"
              class="home-quad-prod"
              @click="openProductDetail(prod.id)"
            >
              <img :src="prod.photo" :alt="prod.name" />
              <div style="min-width: 0; flex: 1">
                <div class="home-quad-prod-name">{{ prod.name }}</div>
                <div class="flex-between" style="margin-top: 4px">
                  <strong style="font-size: 14.5px; color: var(--accent)">¥{{ prod.memberPrice }}</strong>
                  <span style="font-size: 12.5px; color: var(--ink-3)">已售{{ prod.sold }}</span>
                </div>
              </div>
            </div>
          </div>
          <button class="home-quad-cta" @click="openNewPage(7)">进入好物商城 →</button>
        </div>

        <!-- 娱 · 休闲娱乐 -->
        <div class="card card-pad home-quad-card">
          <div class="flex-between mb-10">
            <span class="tag purple">♨️ 娱 · 休闲</span>
          </div>
          <strong style="font-size: 16.5px; display: block; margin-bottom: 10px">温泉康养 & 影城选座</strong>
          <div class="home-quad-products">
            <div
              v-for="ent in hotEntertainments"
              :key="ent.id"
              class="home-quad-prod"
              @click="openEntDetail(ent)"
            >
              <img :src="ent.photo" :alt="ent.name" />
              <div style="min-width: 0; flex: 1">
                <div class="home-quad-prod-name">{{ ent.name }}</div>
                <div class="flex-between" style="margin-top: 4px">
                  <strong style="font-size: 13.5px; color: var(--purple)">{{ ent.price }}</strong>
                  <span style="font-size: 12.5px; color: var(--ink-3)">★ {{ ent.rating }}</span>
                </div>
              </div>
            </div>
          </div>
          <button class="home-quad-cta" @click="openNewPage(8)">进入娱乐专区 →</button>
        </div>

        <!-- 训 · 培训研学 -->
        <div class="card card-pad home-quad-card">
          <div class="flex-between mb-10">
            <span class="tag green">🎓 训 · 研学</span>
            <span style="font-size: 13px; color: var(--primary); font-weight: 800">{{ state.abilityLevel }}</span>
          </div>
          <strong style="font-size: 16.5px; display: block; margin-bottom: 8px">湖北省网球学校 & 评测</strong>
          <div style="font-size: 13.5px; color: var(--ink-2); line-height: 1.7; margin-bottom: 10px">
            • 省网校招生与冬夏令营<br />
            • 五维复测晋升认证<br />
            • 运动康复绿色通道
          </div>
          <button class="home-quad-cta" @click="openNewPage(9)">进入培训专区 →</button>
        </div>
      </div>
    </div>

    <!-- 06 互动反馈 / 小程序互通 / 个人中心 底栏速览 -->
    <div class="grid-3">
      <button type="button" class="home-service-card" @click="openNewPage(11)">
        <div class="flex-between">
          <div class="home-sec-left">
            <span class="home-svc-icon" style="background: linear-gradient(135deg, #0e8f67, #085f44)">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.7-.3-3.9-.9L3 21l1.5-5.1A8.5 8.5 0 1 1 21 12z" />
              </svg>
            </span>
            <strong style="font-size: 16px">互动反馈社区</strong>
          </div>
          <span class="home-service-arrow">→</span>
        </div>
        <div class="home-service-foot" style="margin-top: 12px">进入评价打卡与信用公示</div>
      </button>

      <button type="button" class="home-service-card" @click="openNewPage(12)">
        <div class="flex-between">
          <div class="home-sec-left">
            <span class="home-svc-icon" style="background: linear-gradient(135deg, #1c6fe3, #114ba3)">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
                <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
                <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
                <path d="M14 17h6M17 14v6" />
              </svg>
            </span>
            <strong style="font-size: 16px">小程序互联互通</strong>
          </div>
          <span class="home-service-arrow">→</span>
        </div>
        <div class="home-service-foot" style="margin-top: 12px">进入全部互通服务</div>
      </button>

      <button type="button" class="home-service-card highlight" @click="openNewPage(13)">
        <div class="flex-between">
          <div class="home-sec-left">
            <span class="home-svc-icon" style="background: linear-gradient(135deg, #d89922, #a66d09)">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M5 20a7 7 0 0 1 14 0" />
              </svg>
            </span>
            <strong style="font-size: 16px">个人中心</strong>
          </div>
          <span class="home-service-arrow">→</span>
        </div>
        <div class="home-service-foot" style="margin-top: 12px">管理订单、积分与电子票根</div>
      </button>
    </div>
  </section>
</template>
