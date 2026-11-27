<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MapResultsLayout from '../../components/MapResultsLayout.vue'
import MapViewToggle from '../../components/MapViewToggle.vue'
import ServiceCircleMap from '../../components/ServiceCircleMap.vue'
import { BOOKING_DATES } from '../../mock/schedules'
import { usePortalStore } from '../../store/usePortalStore'

const { state, reserveParkingOrCharger, openActionModal, openNavigation, createQuickOrder } = usePortalStore()

// 主分区切换：自驾出行 / 便捷出行
const transitView = ref<'drive' | 'easy'>('drive')

// 0. 赛前 / 赛中交通管控状态
const matchStage = ref<'live' | 'upcoming'>('live')

interface RoadClosureItem {
  id: string
  stage: 'live' | 'upcoming'
  road: string
  status: '临时封闭' | '限行禁停' | '持证通行'
  timeWindow: string
  detourTip: string
  detourDest: string
  detourAddress: string
  lng: number
  lat: number
}

const ROAD_CLOSURES: RoadClosureItem[] = [
  {
    id: 'rc-1',
    stage: 'live',
    road: '温泉大道（国际网球中心段）',
    status: '临时封闭',
    timeWindow: '今日 07:30 – 19:00',
    detourTip: '社会车辆绕行京山大道北侧，直接驶入 P1 停车场',
    detourDest: '国际网球中心 P1 停车场（避堵入口）',
    detourAddress: '湖北省荆门市京山市温泉街道网球大道北侧P1入口',
    lng: 113.1185,
    lat: 31.0226,
  },
  {
    id: 'rc-2',
    stage: 'live',
    road: '京山大道东段（赛场周边缓冲段）',
    status: '限行禁停',
    timeWindow: '今日 07:00 – 20:00',
    detourTip: '即停即走严禁路边违停，建议停靠 P1 或文峰公园 P2 换乘摆渡',
    detourDest: '文峰公园 P2 停车场（换乘摆渡）',
    detourAddress: '湖北省荆门市京山市新市街道文峰路文峰公园南门',
    lng: 113.1128,
    lat: 31.0185,
  },
  {
    id: 'rc-3',
    stage: 'live',
    road: '网球大道北辅路（场馆东门连接段）',
    status: '持证通行',
    timeWindow: '今日 07:30 – 19:00',
    detourTip: '赛事免费摆渡车及工作保障车专用，观众请从东广场步行入场',
    detourDest: '国际网球中心东门摆渡车下客点',
    detourAddress: '湖北省荆门市京山市温泉街道网球大道1号东广场',
    lng: 113.1216,
    lat: 31.0212,
  },
  {
    id: 'rc-4',
    stage: 'upcoming',
    road: '文峰路南门段（文峰公园球场前）',
    status: '限行禁停',
    timeWindow: '11/29 08:00 – 18:00（赛前预告）',
    detourTip: '比赛日实行单向通行禁停，推荐停靠文峰公园 P2 或中百地下车库',
    detourDest: '文峰公园 P2 停车场',
    detourAddress: '湖北省荆门市京山市新市街道文峰路文峰公园南门',
    lng: 113.1128,
    lat: 31.0185,
  },
  {
    id: 'rc-5',
    stage: 'upcoming',
    road: '京源大道文峰广场入口辅道',
    status: '持证通行',
    timeWindow: '11/29 08:00 – 17:30（赛前预告）',
    detourTip: '预留参赛大巴与应急救护通道，自驾请走文峰路西侧入口',
    detourDest: '文峰广场地下快充车库',
    detourAddress: '湖北省荆门市京山市新市街道文峰广场商业中心B1层',
    lng: 113.1128,
    lat: 31.0226,
  },
]

const currentClosures = computed(() => ROAD_CLOSURES.filter((c) => c.stage === matchStage.value))
const trafficPreviewCenter = computed<[number, number] | undefined>(() => {
  const detour = matchStage.value === 'upcoming' ? currentClosures.value[0] : undefined
  return detour ? [detour.lat, detour.lng] : undefined
})

// 1. 停车场与充电桩预约时段
const parkDate = ref(BOOKING_DATES[0]!.shortDate)
const parkSlot = ref('16:00-18:00')
const parkTypeFilter = ref<'全部' | '停车场' | '充电桩'>('全部')
const parkSlots = ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00']
const showTrafficMap = ref(false)
const selectedLotId = ref<string>()
const trafficMap = ref<InstanceType<typeof ServiceCircleMap>>()

const visibleLots = computed(() =>
  state.parkingLots.filter((lot) => {
    if (parkTypeFilter.value === '停车场') return !lot.isCharger
    if (parkTypeFilter.value === '充电桩') return !!lot.isCharger
    return true
  }),
)
const parkingLocations = computed(() => visibleLots.value.map((lot) => ({ ...lot })))
const parkingMapItems = computed(() => parkingLocations.value.map((lot) => ({
  id: lot.id,
  title: lot.name,
  description: lot.note,
  location: lot.address,
  highlight: `${lot.isCharger ? '闲置充电桩' : '剩余车位'} ${lot.remain}/${lot.total}`,
})))
const shownLots = computed(() => showTrafficMap.value && selectedLotId.value
  ? visibleLots.value.filter((lot) => lot.id === selectedLotId.value)
  : visibleLots.value)

watch(visibleLots, (lots) => {
  if (!lots.some((lot) => lot.id === selectedLotId.value)) selectedLotId.value = undefined
})
watch(matchStage, () => { selectedLotId.value = undefined })

function selectLot(id: string) {
  if (selectedLotId.value === id) trafficMap.value?.openSelectedLocation()
  else selectedLotId.value = id
}

// 2. 京网推荐出行 · 官方优质司机
interface RecommendedDriver {
  id: string
  name: string
  vehicleType: '7座商务车' | '新能源专车' | '景区包车'
  plate: string
  rating: number
  trips: number
  routeTag: string
  priceLabel: string
  phone: string
}

const DRIVERS: RecommendedDriver[] = [
  {
    id: 'drv-1',
    name: '张师傅',
    vehicleType: '7座商务车',
    plate: '鄂H·AD862',
    rating: 5.0,
    trips: 428,
    routeTag: '京山南站接送 · 球队拼车 · 免费代搬球包',
    priceLabel: '¥38/趟起',
    phone: '139****6612',
  },
  {
    id: 'drv-2',
    name: '李师傅',
    vehicleType: '新能源专车',
    plate: '鄂H·D3918',
    rating: 4.9,
    trips: 615,
    routeTag: '京山南站 ⇄ 国际网球中心一口价 · 票根立减¥5',
    priceLabel: '¥28 一口价',
    phone: '138****5109',
  },
  {
    id: 'drv-3',
    name: '王师傅',
    vehicleType: '景区包车',
    plate: '鄂H·K5207',
    rating: 4.9,
    trips: 312,
    routeTag: '绿林山 / 空山洞 / 天沐温泉半日与全日包车',
    priceLabel: '¥168/半日',
    phone: '136****8841',
  },
]

const driverTypeFilter = ref<'全部' | RecommendedDriver['vehicleType']>('全部')

const visibleDrivers = computed(() =>
  driverTypeFilter.value === '全部'
    ? DRIVERS
    : DRIVERS.filter((d) => d.vehicleType === driverTypeFilter.value),
)

// 4. 公交与旅游专线班次查询
interface BusSchedule {
  id: string
  name: string
  category: '赛事摆渡' | '旅游专线' | '城区公交'
  route: string
  nextTime: string
  interval: string
  fare: string
  startStop: string
  lng: number
  lat: number
}

const BUS_SCHEDULES: BusSchedule[] = [
  {
    id: 'bus-1',
    name: '赛事免费摆渡1线',
    category: '赛事摆渡',
    route: '京山南站 ⇄ 国际网球中心',
    nextTime: '14:15',
    interval: '每 20 分钟',
    fare: '凭票根免费',
    startStop: '国际网球中心东门摆渡站',
    lng: 113.1216,
    lat: 31.0212,
  },
  {
    id: 'bus-2',
    name: '网旅温泉专线',
    category: '旅游专线',
    route: '国际网球中心 ⇄ 天沐温泉度假区',
    nextTime: '14:30',
    interval: '每 30 分钟',
    fare: '¥2',
    startStop: '国际网球中心东门公交站',
    lng: 113.1204,
    lat: 31.0216,
  },
  {
    id: 'bus-3',
    name: '绿林山旅游直通车',
    category: '旅游专线',
    route: '文峰公园 ⇄ 绿林山风景区（美人谷）',
    nextTime: '15:00',
    interval: '每日 4 班',
    fare: '¥15',
    startStop: '文峰公园南门旅游集散点',
    lng: 113.1128,
    lat: 31.0185,
  },
  {
    id: 'bus-4',
    name: '京山 1 路网球环线',
    category: '城区公交',
    route: '文峰广场 ⇄ 国际网球中心 ⇄ 省网校',
    nextTime: '14:08',
    interval: '每 12 分钟',
    fare: '¥2',
    startStop: '文峰广场站',
    lng: 113.1152,
    lat: 31.0195,
  },
  {
    id: 'bus-5',
    name: '明显陵延伸游专线',
    category: '旅游专线',
    route: '国际网球中心 ⇄ 钟祥明显陵',
    nextTime: '明日 08:30',
    interval: '周末定班',
    fare: '¥35（往返）',
    startStop: '国际网球中心P1旅游大巴区',
    lng: 113.1185,
    lat: 31.0226,
  },
]

const busCategory = ref<'全部' | BusSchedule['category']>('全部')
const busKeyword = ref('')

const visibleSchedules = computed(() => {
  const q = busKeyword.value.trim().toLowerCase()
  return BUS_SCHEDULES.filter((b) => {
    const okCat = busCategory.value === '全部' || b.category === busCategory.value
    const okQ = !q || b.name.toLowerCase().includes(q) || b.route.toLowerCase().includes(q)
    return okCat && okQ
  })
})

// 5. 租车与网约车第三方小程序直连
const THIRD_PARTY_APPS = [
  {
    name: '滴滴出行小程序',
    tag: '网约车',
    icon: '🚕',
    desc: '自动定位国际网球中心 / 文峰球场上车点，一键叫快车、专车',
  },
  {
    name: '高德打车小程序',
    tag: '聚合比价',
    icon: '🧭',
    desc: '聚合多家合规网约车平台实时比价，同步避开赛期封闭路段',
  },
  {
    name: '神州租车小程序',
    tag: '自驾租车',
    icon: '🚙',
    desc: '京山南站自助取还车，京山网球会员与票根用户专享 9 折',
  },
  {
    name: '一嗨租车小程序',
    tag: '自驾租车',
    icon: '🚗',
    desc: '支持异地还车与 SUV 车型预订，绿林山 / 明显陵自驾延伸游首选',
  },
]

function bookDriver(drv: RecommendedDriver) {
  createQuickOrder(
    '门票',
    `京网优质司机预约：${drv.name}（${drv.vehicleType}）`,
    `${parkDate.value} · 车牌 ${drv.plate} · ${drv.priceLabel}`,
    0,
    30,
    0,
    {
      fields: [
        { label: '出行日期', value: parkDate.value },
        { label: '车辆号牌', value: drv.plate },
        { label: '参考车费', value: drv.priceLabel },
      ],
      successTitle: '约车申请已提交',
      successMessage: '请留意来电，等候司机确认上车点。',
    },
  )
}
</script>

<template>
  <section style="display: flex; flex-direction: column; gap: 18px">
    <!-- 满宽分段切换：自驾出行 / 便捷出行 -->
    <div class="transit-mode-bar">
      <button
        type="button"
        class="transit-mode-btn"
        :class="{ active: transitView === 'drive' }"
        @click="transitView = 'drive'"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 17h14v-5l-2-5H7l-2 5v5z" />
          <circle cx="7.5" cy="17.5" r="1.5" />
          <circle cx="16.5" cy="17.5" r="1.5" />
          <path d="M5 12h14" />
        </svg>
        <span>自驾出行</span>
      </button>

      <button
        type="button"
        class="transit-mode-btn"
        :class="{ active: transitView === 'easy' }"
        @click="transitView = 'easy'"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="4" width="16" height="14" rx="2" />
          <path d="M4 11h16" />
          <circle cx="8" cy="18.5" r="1.5" />
          <circle cx="16" cy="18.5" r="1.5" />
          <path d="M8 14.5h.01M16 14.5h.01" />
        </svg>
        <span>便捷出行</span>
      </button>
    </div>

    <!-- ===== 一、自驾出行 ===== -->
    <template v-if="transitView === 'drive'">
    <!-- 顶部：赛前 / 赛中交通管控状态条 + 切换赛事时段 + 一键避堵导航 -->
    <div class="card card-pad flex-between" style="background: #fff7f6; border-color: #f3cbc7; padding: 14px 20px; gap: 14px; flex-wrap: wrap">
      <div class="flex-row" style="gap: 10px; flex: 1; min-width: 280px">
        <span class="tag" :class="matchStage === 'live' ? 'red' : 'orange'">
          {{ matchStage === 'live' ? '赛中管控进行中' : '赛前管控预告' }}
        </span>
        <select v-model="matchStage" class="dd-select active" style="width: 290px; height: 38px; font-size: 14px">
          <option value="live">进行中：2026中青赛总决赛（国际网球中心）</option>
          <option value="upcoming">赛前预告：京山周末分级赛（11/29 文峰公园）</option>
        </select>
        <span style="font-size: 14px; color: #7e171e; font-weight: 700">
          {{ matchStage === 'live' ? '温泉大道赛场段 07:30–19:00 封闭，已标注绕行路线与摆渡点' : '11/29 08:00–18:00 文峰路南门段单向通行禁停' }}
        </span>
      </div>
      <button
        class="btn-orange"
        style="flex-shrink: 0"
        @click="
          openNavigation({
            placeName: matchStage === 'live' ? '国际网球中心 P1 推荐停车场' : '文峰公园 P2 推荐停车场',
            address: matchStage === 'live' ? '湖北省荆门市京山市温泉街道网球大道北侧P1入口' : '湖北省荆门市京山市新市街道文峰路文峰公园南门',
            lng: matchStage === 'live' ? 113.1185 : 113.1128,
            lat: matchStage === 'live' ? 31.0226 : 31.0185,
            distance: '推荐避堵点',
            driveMin: '约 6 分钟',
            tip: '已自动避开当前赛期封闭与限行路段，直达推荐停车场',
          })
        "
      >
        🧭 一键避堵自驾导航
      </button>
    </div>

    <!-- 一、赛事交通管控地图（封闭/限行 + 停车充电 + 公交线 + 场馆配套）+ 右侧停车充电查询 -->
    <div class="grid-split" style="align-items: stretch">
      <!-- 左侧：赛前/赛中保障一张图 + 封闭限行路段清单 -->
      <div class="card" style="display: flex; flex-direction: column">
        <div class="card-pad flex-between" style="border-bottom: 1px solid var(--line); padding: 13px 18px; gap: 10px; flex-wrap: wrap">
          <strong style="font-size: 17.5px">{{ matchStage === 'live' ? '🗺️ 赛期封闭限行与周边保障一张图' : '🗺️ 赛前周边停车与充电' }}</strong>
          <div class="flex-row">
            <MapViewToggle v-model="showTrafficMap" />
          </div>
        </div>

        <div v-if="showTrafficMap" class="card-pad">
          <MapResultsLayout
            :items="parkingMapItems"
            :selected-id="selectedLotId"
            list-label="地图停车充电列表"
            empty-text="暂无停车充电点位"
            @select="selectLot"
          >
            <ServiceCircleMap
              ref="trafficMap"
              mode="traffic"
              :traffic-preview-center="trafficPreviewCenter"
              :parking-locations="parkingLocations"
              :selected-location-id="selectedLotId"
              @select-location="selectedLotId = $event"
            />
          </MapResultsLayout>
        </div>

        <!-- 封闭与限行路段清晰清单（可直接跳转绕行导航） -->
        <div class="card-pad" style="border-top: 1px solid var(--line); background: #fcfdfd">
          <div class="flex-between" style="margin-bottom: 10px">
            <strong style="font-size: 16px">⛔ 当前封闭与限行路段明细（点击可绕行导航）</strong>
            <span class="tag red">共 {{ currentClosures.length }} 条管控路段</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <div
              v-for="rc in currentClosures"
              :key="rc.id"
              class="flex-between"
              style="background: #ffffff; border: 1px solid #ead8d8; padding: 10px 14px; gap: 12px"
            >
              <div style="min-width: 0">
                <div class="flex-row" style="gap: 8px; margin-bottom: 3px">
                  <span class="tag" :class="rc.status === '临时封闭' ? 'red' : rc.status === '限行禁停' ? 'orange' : 'gold'">
                    {{ rc.status }}
                  </span>
                  <strong style="font-size: 15px">{{ rc.road }}</strong>
                  <span style="font-size: 13px; color: var(--ink-3)">{{ rc.timeWindow }}</span>
                </div>
                <div style="font-size: 13.5px; color: var(--ink-2)">
                  绕行建议：{{ rc.detourTip }}
                </div>
              </div>
              <button
                class="btn-ghost"
                style="padding: 6px 12px; font-size: 13px; flex-shrink: 0"
                @click="
                  openNavigation({
                    placeName: rc.detourDest,
                    address: rc.detourAddress,
                    lng: rc.lng,
                    lat: rc.lat,
                    distance: '推荐绕行点',
                    driveMin: '避开封闭段',
                    tip: rc.detourTip,
                  })
                "
              >
                🧭 绕行导航
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：推荐停车场位置与充电桩剩余查询 + 预约锁位 -->
      <div class="card card-pad filter-workbench" style="display: flex; flex-direction: column; gap: 14px">
        <div class="flex-between">
          <strong style="font-size: 17.5px">🅿️ 推荐停车与充电位置查询</strong>
          <span class="dd-count-pill">实时余位</span>
        </div>

        <div class="dd-filter-grid" style="grid-template-columns: repeat(3, minmax(0, 1fr))">
          <label class="dd-field">
            <span class="dd-field-label">到达日期</span>
            <select v-model="parkDate" class="dd-select active">
              <option v-for="d in BOOKING_DATES" :key="d.iso" :value="d.shortDate">
                {{ d.shortDate }}（{{ d.weekday }}）
              </option>
            </select>
          </label>
          <label class="dd-field">
            <span class="dd-field-label">预约时段</span>
            <select v-model="parkSlot" class="dd-select active">
              <option v-for="s in parkSlots" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
          <label class="dd-field">
            <span class="dd-field-label">点位类型</span>
            <select v-model="parkTypeFilter" class="dd-select" :class="{ active: parkTypeFilter !== '全部' }">
              <option value="全部">全部点位</option>
              <option value="停车场">仅停车场</option>
              <option value="充电桩">仅充电桩</option>
            </select>
          </label>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px">
          <div
            v-for="lot in shownLots"
            :key="lot.id"
            style="background: #f5faf8; border: 1px solid #d5e8df; padding: 14px 16px"
          >
            <div class="flex-between" style="margin-bottom: 5px">
              <strong style="font-size: 16px">{{ lot.isCharger ? '⚡' : '🅿️' }} {{ lot.name }}</strong>
              <span class="tag" :class="lot.isCharger ? 'blue' : 'green'">
                {{ lot.isCharger ? '闲' : '剩' }} {{ lot.remain }} / {{ lot.total }}
              </span>
            </div>
            <div style="font-size: 13.5px; color: var(--ink-2); margin-bottom: 8px">
              📍 {{ lot.address }} · {{ lot.note }}
            </div>
            <div class="summary-bar-track" style="margin-bottom: 10px">
              <div
                class="summary-bar-fill"
                :style="{ width: `${Math.round((lot.remain / lot.total) * 100)}%` }"
              />
            </div>
            <div class="flex-between">
              <span v-if="lot.reservedSlot" style="font-size: 13px; color: var(--primary); font-weight: 800">
                ✔ 已锁位：{{ lot.reservedSlot }}
              </span>
              <span v-else style="font-size: 13px; color: var(--ink-3)">
                当前空闲率 {{ Math.round((lot.remain / lot.total) * 100) }}%
              </span>
              <div class="flex-row" style="gap: 8px">
                <button
                  class="btn-ghost"
                  style="padding: 6px 12px; font-size: 13px"
                  @click="
                    openNavigation({
                      placeName: lot.name,
                      address: lot.address,
                      lng: lot.lng,
                      lat: lot.lat,
                      distance: '1.2 km',
                      driveMin: '约 4 分钟',
                      tip: `当前实时剩余 ${lot.remain} 个，已为您避开赛期封闭路段`,
                    })
                  "
                >
                  🧭 导航
                </button>
                <button
                  :class="lot.reserved ? 'btn-ghost' : 'btn-primary'"
                  style="padding: 6px 12px; font-size: 13px"
                  @click="reserveParkingOrCharger(lot.id, parkDate, parkSlot)"
                >
                  {{ lot.reserved ? '更新时段' : lot.isCharger ? '预约充电' : '免费锁位' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </template>

    <!-- ===== 二、便捷出行 ===== -->
    <template v-else>
    <!-- 二、京网推荐出行 · 官方优质司机 -->
    <div class="card card-pad filter-workbench">
      <div class="dd-filter-top" style="margin-bottom: 14px">
        <div class="flex-row" style="gap: 10px">
          <strong style="font-size: 18px">👨‍✈️ 京网推荐出行 · 官方优质司机</strong>
          <span class="tag gold">官方实名认证 · 明码一口价</span>
        </div>
        <label class="flex-row" style="gap: 8px; font-size: 14px; font-weight: 700; color: var(--ink-2)">
          <span>车型筛选：</span>
          <select v-model="driverTypeFilter" class="dd-select" style="width: 150px; height: 38px">
            <option value="全部">全部车型</option>
            <option value="7座商务车">7座商务车</option>
            <option value="新能源专车">新能源专车</option>
            <option value="景区包车">景区包车</option>
          </select>
        </label>
      </div>

      <div class="grid-3" style="gap: 14px">
        <div
          v-for="drv in visibleDrivers"
          :key="drv.id"
          style="background: #f8fcfa; border: 1px solid #d9ebe2; padding: 15px 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px"
        >
          <div>
            <div class="flex-between" style="margin-bottom: 6px">
              <strong style="font-size: 16.5px">{{ drv.name }} · {{ drv.vehicleType }}</strong>
              <span class="rating-pill">★ {{ drv.rating.toFixed(1) }}</span>
            </div>
            <div style="font-size: 13px; color: var(--ink-3); margin-bottom: 8px">
              车牌 {{ drv.plate }} ｜ 累计服务 {{ drv.trips }} 单
            </div>
            <div style="font-size: 13.5px; color: var(--ink-2); line-height: 1.55">
              {{ drv.routeTag }}
            </div>
          </div>
          <div class="flex-between" style="padding-top: 10px; border-top: 1px dashed var(--line)">
            <strong style="font-size: 17px; color: var(--accent)">{{ drv.priceLabel }}</strong>
            <button class="btn-primary" style="padding: 6px 14px; font-size: 13.5px" @click="bookDriver(drv)">
              一键约车
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 四、公交与旅游专线班次查询 + 租车/网约车第三方小程序直连 -->
    <div class="grid-split" style="align-items: start">
      <!-- 左侧：公交、旅游专线班次查询 -->
      <div class="card card-pad filter-workbench">
        <div class="dd-filter-top" style="margin-bottom: 14px">
          <strong style="font-size: 18px">🚌 公交与旅游专线班次查询</strong>
          <div class="flex-row" style="gap: 8px">
            <select v-model="busCategory" class="dd-select" style="width: 136px; height: 38px">
              <option value="全部">全部线路</option>
              <option value="赛事摆渡">赛事摆渡</option>
              <option value="旅游专线">旅游专线</option>
              <option value="城区公交">城区公交</option>
            </select>
            <div class="search-bar" style="width: 200px; height: 38px; border-radius: 6px">
              <span>🔍</span>
              <input v-model="busKeyword" type="text" placeholder="搜线路或站点…" />
            </div>
          </div>
        </div>

        <table class="clean-table">
          <thead>
            <tr>
              <th>线路名称</th>
              <th>起止站点</th>
              <th>下班发车</th>
              <th>票价</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in visibleSchedules" :key="b.id">
              <td>
                <strong style="display: block">{{ b.name }}</strong>
                <span class="tag green" style="margin-top: 4px">{{ b.category }}</span>
              </td>
              <td>
                <div>{{ b.route }}</div>
                <div style="font-size: 12.5px; color: var(--ink-3)">{{ b.interval }}</div>
              </td>
              <td><strong style="color: var(--primary)">{{ b.nextTime }}</strong></td>
              <td>{{ b.fare }}</td>
              <td>
                <button
                  class="btn-ghost"
                  style="padding: 5px 10px; font-size: 13px"
                  @click="
                    openNavigation({
                      placeName: b.startStop,
                      address: `湖北省荆门市京山市${b.startStop}`,
                      lng: b.lng,
                      lat: b.lat,
                      distance: '上车站点',
                      driveMin: b.interval,
                      tip: `${b.name}（${b.route}），下班发车 ${b.nextTime}`,
                    })
                  "
                >
                  🧭 站点导航
                </button>
              </td>
            </tr>
            <tr v-if="visibleSchedules.length === 0">
              <td colspan="5" style="text-align: center; color: var(--ink-3); padding: 24px">
                未查询到匹配的公交或旅游专线班次
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 右侧：租车、网约车第三方小程序直连入口 -->
      <div class="card card-pad">
        <div class="flex-between" style="margin-bottom: 14px">
          <strong style="font-size: 18px">🚕 租车与网约车入口</strong>
          <span class="tag blue">第三方小程序直连</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px">
          <button
            v-for="app in THIRD_PARTY_APPS"
            :key="app.name"
            type="button"
            class="btn-ghost"
            style="width: 100%; padding: 13px 15px; text-align: left; white-space: normal; display: flex; align-items: center; justify-content: space-between; gap: 12px"
            @click="openActionModal({ type: 'miniprogram', appName: app.name, desc: app.desc })"
          >
            <div style="display: flex; align-items: flex-start; gap: 12px; min-width: 0">
              <span style="font-size: 26px; line-height: 1">{{ app.icon }}</span>
              <div>
                <div class="flex-row" style="gap: 8px; margin-bottom: 3px">
                  <strong style="font-size: 15.5px; color: var(--ink)">{{ app.name }}</strong>
                  <span class="tag green">{{ app.tag }}</span>
                </div>
                <div style="font-size: 13px; color: var(--ink-2); line-height: 1.5">{{ app.desc }}</div>
              </div>
            </div>
            <span style="font-size: 13.5px; font-weight: 800; color: var(--primary); flex-shrink: 0">直连 →</span>
          </button>
        </div>
      </div>
    </div>
    </template>
  </section>
</template>
