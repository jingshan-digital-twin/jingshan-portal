<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

const { state, openPhoto, openActionModal, openNavigation, createQuickOrder, toggleFavorite } = usePortalStore()

// 模块顶部主视图切换
const activeSection = ref<'all' | 'spots' | 'packages' | 'audio' | 'lines'>('all')

// 1. 景区 / 乡村 / 网红 / 夜市 筛选与门票预约参数
const spotCategory = ref<'全部' | TourSpotCategory>('全部')
const visitDate = ref(BOOKING_DATES[0]!.iso)
const visitSlot = ref<'上午 08:30-12:00' | '下午 13:00-17:00' | '夜游 17:30-22:00'>('下午 13:00-17:00')
const ticketCount = ref(2)

const visibleSpots = computed(() =>
  spotCategory.value === '全部'
    ? TOUR_SPOTS
    : TOUR_SPOTS.filter((s) => s.category === spotCategory.value),
)

// 景点分页（每页 8 个，4 列 × 2 行）
const SPOT_PAGE_SIZE = 8
const spotPage = ref(1)
const spotPageCount = computed(() => Math.max(1, Math.ceil(visibleSpots.value.length / SPOT_PAGE_SIZE)))
const pagedSpots = computed(() =>
  visibleSpots.value.slice((spotPage.value - 1) * SPOT_PAGE_SIZE, spotPage.value * SPOT_PAGE_SIZE),
)
const spotPageList = computed<(number | '...')[]>(() => {
  const total = spotPageCount.value
  const cur = spotPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set<number>([1, total, cur, cur - 1, cur + 1])
  const list = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const result: (number | '...')[] = []
  list.forEach((n, i) => {
    if (i > 0 && n - list[i - 1]! > 1) result.push('...')
    result.push(n)
  })
  return result
})
watch(spotCategory, () => {
  spotPage.value = 1
})

const visitDateLabel = computed(
  () => BOOKING_DATES.find((d) => d.iso === visitDate.value)?.shortDate ?? visitDate.value,
)

function bookSpotTicket(spot: (typeof TOUR_SPOTS)[number]) {
  const unitPrice = spot.stubPrice
  const total = unitPrice * ticketCount.value
  createQuickOrder(
    '门票',
    `${spot.name}（${ticketCount.value}份）`,
    `${visitDateLabel.value} ${visitSlot.value} · ${spot.duration} · 票根专享价`,
    total,
    total > 0 ? 60 : 20,
  )
}

// 2. 网旅产品专区筛选与预订参数
const pkgScope = ref<'全部' | '京山本地' | '荆门周边' | '湖北省内'>('全部')
const pkgDate = ref(BOOKING_DATES[1]!.iso)
const pkgPeople = ref(2)

const visiblePackages = computed(() =>
  pkgScope.value === '全部'
    ? TOUR_PACKAGES
    : TOUR_PACKAGES.filter((p) => p.scope === pkgScope.value),
)

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

// 3. 语音导览与游玩时长建议
const activePlanId = ref<'half' | 'weekend' | 'deep'>('weekend')
const activePlan = computed(
  () => TOUR_ITINERARY_PLANS.find((p) => p.id === activePlanId.value) ?? TOUR_ITINERARY_PLANS[1]!,
)

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
      <div class="mh-tabs">
        <button class="m-tab" :class="{ active: activeSection === 'all' }" @click="activeSection = 'all'">全部总览</button>
        <button class="m-tab" :class="{ active: activeSection === 'spots' }" @click="activeSection = 'spots'">景区/乡村/网红/夜市</button>
        <button class="m-tab" :class="{ active: activeSection === 'packages' }" @click="activeSection = 'packages'">网旅产品专区</button>
        <button class="m-tab" :class="{ active: activeSection === 'audio' }" @click="activeSection = 'audio'">语音导览与时长</button>
        <button class="m-tab" :class="{ active: activeSection === 'lines' }" @click="activeSection = 'lines'">文旅专线与骑行徒步</button>
      </div>
    </div>

    <!-- 顶部来源地定制横幅 -->
    <div class="ticket-stub-banner mb-16">
      <div>
        <div style="font-size: 15px; font-weight: 900">
          🧭 您的来源地：<span style="color: var(--lime)">{{ state.origin }}</span> · 电子票根 {{ state.ticketStubCode }} 畅享全市景区/夜市/专线优待
        </div>
      </div>
      <div class="flex-row">
        <button class="tag" style="background: var(--lime); color: #0b251d; border: none; cursor: pointer" @click="activeSection = 'spots'">🏔️ {{ TOUR_SPOTS.length }} 处热门场景</button>
        <button class="tag" style="background: rgba(255, 255, 255, 0.18); color: #fff; border: none; cursor: pointer" @click="activeSection = 'packages'">🌿 {{ TOUR_PACKAGES.length }} 大网旅套餐</button>
        <button class="tag" style="background: rgba(255, 255, 255, 0.18); color: #fff; border: none; cursor: pointer" @click="activeSection = 'lines'">🚌 专线与绿道</button>
      </div>
    </div>

    <!-- ===== 模块一：景区 · 乡村景点 · 网红打卡点 · 夜市消费场景（含导航 + 精确时段门票预约） ===== -->
    <div v-if="activeSection === 'all' || activeSection === 'spots'" class="mb-24">
      <div class="card card-pad mb-16 filter-workbench">
        <div class="flex-between mb-12">
          <div>
            <strong style="font-size: 16px">🏔️ 热门景区与打卡点</strong>
          </div>
          <div class="flex-row" style="gap: 6px">
            <button
              v-for="cat in (['全部', '景区', '乡村景点', '网红打卡点', '夜市消费'] as const)"
              :key="cat"
              class="filter-pill"
              :class="{ active: spotCategory === cat }"
              @click="spotCategory = cat"
            >
              {{ cat === '全部' ? `全部场景 (${TOUR_SPOTS.length})` : cat }}
            </button>
          </div>
        </div>

        <div class="filter-row" style="background: #f5faf8; padding: 8px 12px; border: 1px solid #d9ebe2">
          <span class="filter-label">📅 预约入园/消费日期：</span>
          <select v-model="visitDate" class="f-input" style="width: 140px; padding: 4px 8px; font-size: 12px">
            <option v-for="d in BOOKING_DATES" :key="d.iso" :value="d.iso">{{ d.shortDate }} {{ d.weekday }}</option>
          </select>
          <span class="filter-label">🕒 时段：</span>
          <button
            v-for="sl in (['上午 08:30-12:00', '下午 13:00-17:00', '夜游 17:30-22:00'] as const)"
            :key="sl"
            class="filter-pill"
            :class="{ active: visitSlot === sl }"
            @click="visitSlot = sl"
          >
            {{ sl }}
          </button>
          <span class="filter-label">人数/张数：</span>
          <select v-model.number="ticketCount" class="f-input" style="width: 82px; padding: 4px 8px; font-size: 12px">
            <option :value="1">1 份</option>
            <option :value="2">2 份</option>
            <option :value="3">3 份</option>
            <option :value="4">4 份</option>
          </select>
        </div>
      </div>

      <div class="grid-4" style="gap: 14px">
        <div
          v-for="spot in pagedSpots"
          :key="spot.id"
          class="card"
          style="display: flex; flex-direction: column; justify-content: space-between"
        >
          <div>
            <div
              class="photo-box"
              style="height: 148px"
              @click="
                openPhoto({
                  title: spot.name,
                  category: `京山${spot.category}详情`,
                  photo: spot.photo,
                  rating: spot.rating,
                  subtitle: `${spot.badge} ｜ ${spot.duration}`,
                  intro: spot.intro,
                  openHours: `${spot.openHours}（推荐：${spot.bestTime}）`,
                  priceInfo: spot.stubPrice === 0 ? '免费预约入园/打卡' : `票根价 ¥${spot.stubPrice}${spot.priceUnit}（原价 ¥${spot.price}）`,
                  address: spot.address,
                  lng: spot.lng,
                  lat: spot.lat,
                  tags: spot.tags,
                  hotItemsTitle: '✨ 必体验亮点与消费推荐',
                  hotItems: spot.hotItems,
                  reviews: spot.reviews,
                })
              "
            >
              <img :src="spot.photo" :alt="spot.name" />
              <span class="badge-tl" style="font-size: 10px">{{ spot.category }}</span>
              <span class="badge-bl" style="font-size: 10px">★ {{ spot.rating }} · {{ spot.duration }}</span>
            </div>

            <div class="card-pad" style="padding: 12px 13px 8px">
              <strong style="font-size: 14.5px; display: block; margin-bottom: 4px">{{ spot.name }}</strong>
              <div style="font-size: 11.5px; color: var(--ink-2); margin-bottom: 6px; line-height: 1.5">{{ spot.summary }}</div>
              <div style="font-size: 11px; color: var(--ink-3); margin-bottom: 6px">
                📍 {{ spot.distance }} · 🕒 {{ spot.openHours }}
              </div>
              <div class="flex-row" style="gap: 4px">
                <span v-for="t in spot.tags.slice(0, 2)" :key="t" class="tag" style="font-size: 10px">{{ t }}</span>
              </div>
            </div>
          </div>

          <div class="card-pad" style="padding: 8px 13px 12px; border-top: 1px dashed var(--line)">
            <div class="flex-between" style="margin-bottom: 8px">
              <div>
                <strong style="font-size: 17px; color: var(--accent)">
                  {{ spot.stubPrice === 0 ? '免费' : `¥${spot.stubPrice}` }}
                </strong>
                <small style="font-size: 10.5px; color: var(--ink-3)">{{ spot.stubPrice === 0 ? '预约打卡' : spot.priceUnit }}</small>
                <s v-if="spot.price > spot.stubPrice" style="font-size: 10.5px; color: #9aa7a2; margin-left: 4px">¥{{ spot.price }}</s>
              </div>
              <div class="flex-row" style="gap: 4px">
                <button
                  class="btn-ghost"
                  style="padding: 3px 7px; font-size: 11px"
                  title="语音导览"
                  @click="openActionModal({ type: 'audio', spotName: spot.name, duration: spot.duration, script: spot.audioScript, photo: spot.photo })"
                >
                  🎧
                </button>
                <button
                  class="btn-ghost"
                  style="padding: 3px 7px; font-size: 11px"
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
                  🧭
                </button>
                <button class="btn-ghost" style="padding: 3px 7px; font-size: 11px" @click="toggleFavorite(spot.name)">
                  {{ state.favorites.includes(spot.name) ? '❤️' : '🤍' }}
                </button>
              </div>
            </div>

            <button class="btn-primary" style="width: 100%; padding: 6px 10px; font-size: 12px" @click="bookSpotTicket(spot)">
              {{ spot.category === '夜市消费' ? `囤券/预约 ${visitDateLabel}（${ticketCount}份）` : `预约 ${visitDateLabel} 门票（${ticketCount}份）` }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="spotPageCount > 1" class="pager">
        <button class="pager-btn" :disabled="spotPage === 1" @click="spotPage--">上一页</button>
        <template v-for="(p, i) in spotPageList" :key="`pg-${i}`">
          <span v-if="p === '...'" class="pager-ellipsis">…</span>
          <button v-else class="pager-btn num" :class="{ active: p === spotPage }" @click="spotPage = p">
            {{ p }}
          </button>
        </template>
        <button class="pager-btn" :disabled="spotPage === spotPageCount" @click="spotPage++">下一页</button>
        <span class="pager-total">共 {{ visibleSpots.length }} 处 · 第 {{ spotPage }}/{{ spotPageCount }} 页</span>
      </div>
    </div>

    <!-- ===== 模块二：“游”网旅产品专区（官方打球+吃住游打包套餐） ===== -->
    <div v-if="activeSection === 'all' || activeSection === 'packages'" class="mb-24">
      <div class="card card-pad mb-16 filter-workbench">
        <div class="flex-between">
          <div>
            <strong style="font-size: 16px">🌿 网旅产品专区</strong>
          </div>
          <div class="flex-row" style="gap: 8px">
            <button
              v-for="sc in (['全部', '京山本地', '荆门周边', '湖北省内'] as const)"
              :key="sc"
              class="filter-pill"
              :class="{ active: pkgScope === sc }"
              @click="pkgScope = sc"
            >
              {{ sc === '全部' ? '全圈层套餐' : sc }}
            </button>
            <select v-model="pkgDate" class="f-input" style="width: 132px; padding: 4px 8px; font-size: 12px">
              <option v-for="d in BOOKING_DATES" :key="`pkg-${d.iso}`" :value="d.iso">出发 {{ d.shortDate }}</option>
            </select>
            <select v-model.number="pkgPeople" class="f-input" style="width: 96px; padding: 4px 8px; font-size: 12px">
              <option :value="1">1人独享</option>
              <option :value="2">2人同行</option>
              <option :value="3">3人家庭</option>
              <option :value="6">6人球队</option>
            </select>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div
          v-for="pkg in visiblePackages"
          :key="pkg.id"
          class="card"
          style="display: grid; grid-template-columns: 210px 1fr; overflow: hidden"
        >
          <div class="photo-box" style="height: 100%; min-height: 205px">
            <img :src="pkg.photo" :alt="pkg.title" />
            <span class="badge-tl" style="font-size: 10px">{{ pkg.badge }}</span>
            <span class="badge-bl" style="font-size: 10px">★ {{ pkg.rating }} · 已售 {{ pkg.sold }}</span>
          </div>
          <div class="card-pad" style="display: flex; flex-direction: column; justify-content: space-between; padding: 13px 15px">
            <div>
              <div class="flex-between" style="margin-bottom: 4px">
                <span class="tag green">{{ pkg.scope }} · {{ pkg.duration }}</span>
                <span style="font-size: 11px; color: var(--ink-3)">支持退改保障</span>
              </div>
              <strong style="font-size: 15px; display: block; margin-bottom: 4px">{{ pkg.title }}</strong>
              <div style="font-size: 11.5px; color: var(--ink-2); margin-bottom: 8px">{{ pkg.subtitle }}</div>
              <div class="flex-row" style="gap: 5px; margin-bottom: 8px">
                <span v-for="inc in pkg.includes" :key="inc" class="tag blue" style="font-size: 10.5px">✔ {{ inc }}</span>
              </div>
            </div>

            <div class="flex-between" style="padding-top: 9px; border-top: 1px dashed var(--line)">
              <div>
                <span class="price" style="font-size: 19px">¥{{ pkg.price * pkgPeople }}<small>/{{ pkgPeople }}人总价</small></span>
                <s style="font-size: 11px; color: #9aa7a2; margin-left: 5px">¥{{ pkg.originalPrice * pkgPeople }}</s>
              </div>
              <div class="flex-row" style="gap: 6px">
                <button
                  class="btn-ghost"
                  style="padding: 5px 9px; font-size: 11.5px"
                  @click="openNavigation({ placeName: pkg.title, address: pkg.address, lng: pkg.lng, lat: pkg.lat, distance: pkg.scope, driveMin: pkg.duration, tip: pkg.highlights.join('；') })"
                >
                  🧭 集结导航
                </button>
                <button class="btn-orange" style="padding: 6px 12px; font-size: 12px" @click="bookTourPackage(pkg)">
                  立即预订套餐
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 模块三：语音导览与游玩时长建议 ===== -->
    <div v-if="activeSection === 'all' || activeSection === 'audio'" class="card card-pad mb-24">
      <div class="flex-between mb-16" style="padding-bottom: 12px; border-bottom: 1px solid var(--line)">
        <div>
          <strong style="font-size: 16.5px">🎧 智能语音导览</strong>
        </div>
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

      <div style="background: #f4faf7; border: 1px solid #d5e8df; padding: 10px 14px; margin-bottom: 14px" class="flex-between">
        <div>
          <span class="tag green" style="margin-right: 8px">{{ activePlan.durationTag }}</span>
          <span style="font-size: 12.5px; color: var(--ink-2)">{{ activePlan.desc }}</span>
        </div>
        <button
          class="btn-primary"
          style="padding: 5px 12px; font-size: 12px"
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
          🎧 连续播放全程语音导览
        </button>
      </div>

      <div :class="activePlan.stops.length === 4 ? 'grid-4' : 'grid-3'">
        <div
          v-for="(st, idx) in activePlan.stops"
          :key="st.spot"
          style="background: #fff; border: 1px solid var(--line); padding: 12px 14px; display: flex; flex-direction: column; justify-content: space-between"
        >
          <div>
            <div class="flex-between" style="margin-bottom: 6px">
              <span class="tag green">第 {{ idx + 1 }} 站 · {{ st.time }}</span>
              <span class="tag gold">⏱️ {{ st.stay }}</span>
            </div>
            <strong style="font-size: 14.5px; display: block; margin-bottom: 5px">{{ st.spot }}</strong>
            <div style="font-size: 12px; color: var(--ink-2); line-height: 1.55; margin-bottom: 10px">{{ st.tip }}</div>
          </div>
          <button
            class="btn-ghost"
            style="width: 100%; font-size: 12px"
            @click="openActionModal({ type: 'audio', spotName: st.spot, duration: st.stay, script: st.audioScript, photo: st.photo })"
          >
            🎧 试听本站语音讲解
          </button>
        </div>
      </div>
    </div>

    <!-- ===== 模块四：网球主题文旅专线 & 骑行徒步路线 ===== -->
    <div v-if="activeSection === 'all' || activeSection === 'lines'" class="grid-2">
      <!-- 左侧：3条网球主题文旅专线 -->
      <div class="card card-pad">
        <div class="flex-between mb-12" style="padding-bottom: 10px; border-bottom: 1px solid var(--line)">
          <div>
            <strong style="font-size: 16px">🚌 网球主题文旅专线</strong>
          </div>
        </div>

        <div class="filter-row mb-12" style="background: #f5faf8; padding: 7px 10px; border: 1px solid #d9ebe2">
          <span class="filter-label">乘车日期：</span>
          <select v-model="busDate" class="f-input" style="width: 112px; padding: 4px 8px; font-size: 11.5px">
            <option v-for="d in BOOKING_DATES" :key="`bus-${d.iso}`" :value="d.shortDate">{{ d.shortDate }} {{ d.weekday }}</option>
          </select>
          <span class="filter-label">班次：</span>
          <select v-model="busDepartTime" class="f-input" style="width: 96px; padding: 4px 8px; font-size: 11.5px">
            <option>08:30</option>
            <option>09:30</option>
            <option>13:00</option>
            <option>14:30</option>
            <option>18:30</option>
            <option>20:00</option>
          </select>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px">
          <div
            v-for="line in TENNIS_BUS_LINES"
            :key="line.id"
            style="background: #fafdfc; border: 1px solid #d9e8e1; padding: 11px 13px"
          >
            <div class="flex-between" style="margin-bottom: 5px">
              <div class="flex-row" style="gap: 6px">
                <span class="tag green">{{ line.code }}</span>
                <strong style="font-size: 13.5px">{{ line.name }}</strong>
              </div>
              <span class="tag orange">{{ line.frequency }}</span>
            </div>
            <div style="font-size: 11.5px; color: var(--ink-2); margin-bottom: 6px">
              沿途站点：{{ line.stops.join(' → ') }}
            </div>
            <div style="font-size: 11px; color: var(--ink-3); margin-bottom: 8px">
              🕒 运营 {{ line.serviceHours }} ｜ 🎫 {{ line.fare }} ｜ ✨ {{ line.highlight }}
            </div>
            <div class="flex-between">
              <span style="font-size: 11px; color: var(--primary); font-weight: 700">📍 上车点：{{ line.startAddress }}</span>
              <div class="flex-row" style="gap: 6px">
                <button
                  class="btn-ghost"
                  style="padding: 4px 8px; font-size: 11px"
                  @click="openNavigation({ placeName: `${line.code} 乘车点`, address: line.startAddress, lng: line.lng, lat: line.lat, distance: '场馆门口', driveMin: '步行 2 分钟', tip: `${line.frequency} · ${line.fare}` })"
                >
                  🧭 站点导航
                </button>
                <button
                  class="btn-primary"
                  style="padding: 4px 10px; font-size: 11px"
                  @click="createQuickOrder('门票', `文旅${line.code}免费乘车预约`, `${busDate} ${busDepartTime} 班次 · ${line.stops[0]} → ${line.stops[line.stops.length - 1]}`, 0, 20)"
                >
                  预约 {{ busDepartTime }} 座次
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：骑行与生态徒步路线 -->
      <div class="card card-pad">
        <div class="flex-between mb-12" style="padding-bottom: 10px; border-bottom: 1px solid var(--line)">
          <div>
            <strong style="font-size: 16px">🚴 骑行绿道与生态徒步路线</strong>
          </div>
          <div class="flex-row" style="gap: 5px; flex-shrink: 0">
            <button
              v-for="tf in (['全部', '骑行路线', '生态徒步'] as const)"
              :key="tf"
              class="filter-pill"
              :class="{ active: trailFilter === tf }"
              style="padding: 3px 9px; font-size: 11px"
              @click="trailFilter = tf"
            >
              {{ tf }}
            </button>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px">
          <div
            v-for="trail in visibleTrails"
            :key="trail.id"
            style="display: grid; grid-template-columns: 120px 1fr; gap: 12px; background: #fafdfc; border: 1px solid #d9e8e1; padding: 10px"
          >
            <div class="photo-box" style="height: 116px">
              <img :src="trail.photo" :alt="trail.name" />
              <span class="badge-tl" style="font-size: 10px; padding: 2px 6px">{{ trail.mode }}</span>
              <span class="badge-bl" style="font-size: 10px; padding: 1.5px 6px">{{ trail.distanceKm }}</span>
            </div>
            <div style="display: flex; flex-direction: column; justify-content: space-between">
              <div>
                <div class="flex-between" style="margin-bottom: 4px">
                  <strong style="font-size: 14px">{{ trail.name }}</strong>
                  <span class="tag blue" style="font-size: 10.5px">{{ trail.oxygen }}</span>
                </div>
                <div style="font-size: 11px; color: var(--primary); font-weight: 700; margin-bottom: 4px">
                  ⏱️ {{ trail.duration }} · {{ trail.difficulty }} · {{ trail.elevation }}
                </div>
                <div style="font-size: 11.5px; color: var(--ink-2); margin-bottom: 5px">{{ trail.desc }}</div>
                <div style="font-size: 11px; color: var(--ink-3)">⛺ {{ trail.supplyStations }}</div>
              </div>
              <div class="flex-between" style="margin-top: 7px; gap: 8px; flex-wrap: wrap">
                <span style="font-size: 10.5px; color: var(--ink-3); flex: 1 1 150px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">起点：{{ trail.startPoint }}</span>
                <div class="flex-row" style="gap: 5px; flex-shrink: 0; flex-wrap: nowrap; margin-left: auto">
                  <button
                    class="btn-ghost"
                    style="padding: 3px 8px; font-size: 11px"
                    @click="openActionModal({ type: 'audio', spotName: trail.name, duration: trail.duration, script: trail.audioScript, photo: trail.photo })"
                  >
                    🎧 导览
                  </button>
                  <button
                    class="btn-ghost"
                    style="padding: 3px 8px; font-size: 11px"
                    @click="openNavigation({ placeName: trail.startPoint, address: trail.address, lng: trail.lng, lat: trail.lat, distance: trail.distanceKm, driveMin: trail.duration, tip: trail.supplyStations })"
                  >
                    🧭 起点导航
                  </button>
                  <button
                    class="btn-primary"
                    style="padding: 3px 9px; font-size: 11px"
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
