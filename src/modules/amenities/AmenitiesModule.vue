<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import ServiceCircleMap, { type AmenityMapPoint } from '../../components/ServiceCircleMap.vue'
import { usePortalStore } from '../../store/usePortalStore'
import type { RadiusOption } from '../../types/portal'

interface AmenityCardItem extends AmenityMapPoint {
  ico: string
  address: string
  photo: string
  rating: number
}

const { state, switchModule, openPhoto, openNavigation } = usePortalStore()
const PAGE_SIZE = 4
const amFilter = ref<'全部' | '卫生间' | '医疗点' | '充电桩' | 'ATM' | '母婴室'>('全部')
const amKeyword = ref('')
const amPage = ref(1)
const mapRadius = ref<RadiusOption>('1公里')

// 按距您最近排序的网球场列表
const nearestCourts = computed(() =>
  [...state.courts].sort((a, b) => a.distanceKm - b.distanceKm),
)

const selectedVenueId = ref<string>(nearestCourts.value[0]?.id ?? 'venue-wenfeng')

const selectedVenue = computed(
  () => nearestCourts.value.find((c) => c.id === selectedVenueId.value) ?? nearestCourts.value[0] ?? null,
)

// 每个网球场专属周边便民配套数据（坐标围绕对应球场错开排布）
const VENUE_AMENITIES: Record<string, AmenityCardItem[]> = {
  'venue-wenfeng': [
    { key: '卫生间', ico: '🚻', name: '文峰公园南门星级旅游公厕', address: '新市街道文峰路文峰公园南门广场', lng: 113.1166, lat: 31.0216, photo: '/images/hotel.jpg', rating: 4.9, dist: '90m', info: '24小时开放 · 无障碍厕位 · 紧邻文峰球场' },
    { key: '医疗点', ico: '🏥', name: '京山市中医院急救与运动康复点', address: '新市街道京源大道中医院急诊楼', lng: 113.1072, lat: 31.0166, photo: '/images/indoor_court.jpg', rating: 4.9, dist: '420m', info: '24h急诊值守 · 扭伤冰敷/理疗绿色通道' },
    { key: '充电桩', ico: '⚡', name: '文峰广场地下快充站（12桩）', address: '新市街道文峰广场商业中心B1层', lng: 113.1078, lat: 31.0218, photo: '/images/hero.jpg', rating: 4.8, dist: '220m', info: '闲置 9 桩 · 夜间打球同步快充免费停2h' },
    { key: 'ATM', ico: '🏧', name: '工商银行 24h 自助存取款点', address: '新市街道新市大道文峰商圈入口', lng: 113.1172, lat: 31.0158, photo: '/images/hotel.jpg', rating: 4.8, dist: '260m', info: '支持各行银行卡及外卡24小时取现' },
    { key: '母婴室', ico: '👶', name: '中百广场亲子母婴护理间', address: '新市街道京源大道中百广场2楼东侧', lng: 113.1126, lat: 31.0232, photo: '/images/hotspring.jpg', rating: 4.9, dist: '310m', info: '恒温空调 · 温奶器/尿布台/独立哺乳间' },
  ],
  'venue-senior': [
    { key: '卫生间', ico: '🚻', name: '老年大学西侧惠民洁净公厕', address: '新市街道京源大道老年大学西门旁', lng: 113.1054, lat: 31.0242, photo: '/images/hotel.jpg', rating: 4.8, dist: '80m', info: '全天开放 · 专人定时保洁 · 配备无障碍扶手' },
    { key: '医疗点', ico: '🏥', name: '京山市人民医院急诊 & 康复中心', address: '新市街道城中路市人民医院门急诊大楼', lng: 113.1158, lat: 31.0238, photo: '/images/indoor_court.jpg', rating: 5.0, dist: '520m', info: '三甲医院24h急救 · 运动损伤与AED保障' },
    { key: '充电桩', ico: '⚡', name: '京源大道市政新能源充电站', address: '新市街道京源大道中段公共停车带', lng: 113.1146, lat: 31.0176, photo: '/images/hero.jpg', rating: 4.8, dist: '180m', info: '闲置 6 桩 · 60kW/120kW双枪快充' },
    { key: 'ATM', ico: '🏧', name: '建设银行 24h ATM 网点', address: '新市街道京源大道华联商厦北侧', lng: 113.1116, lat: 31.0258, photo: '/images/hotel.jpg', rating: 4.8, dist: '240m', info: '24小时营业 · 紧邻商圈取现便捷' },
    { key: '母婴室', ico: '👶', name: '市民文化中心温馨母婴室', address: '新市街道文化馆一楼大厅西侧', lng: 113.1058, lat: 31.0178, photo: '/images/hotspring.jpg', rating: 4.9, dist: '300m', info: '免费提供直饮温水、婴儿护理台与休息区' },
  ],
  'venue-international': [
    { key: '卫生间', ico: '🚻', name: '国际网球中心东广场星级公厕', address: '温泉街道网球大道1号东广场入口', lng: 113.1246, lat: 31.0252, photo: '/images/hotel.jpg', rating: 4.9, dist: '120m', info: '24小时开放 · 无障碍厕位 · 实时保洁达标' },
    { key: '医疗点', ico: '🏥', name: '赛场医疗保障点 & 急救AED驿站', address: '温泉街道网球大道南侧医疗驿站', lng: 113.1144, lat: 31.0184, photo: '/images/indoor_court.jpg', rating: 4.9, dist: '180m', info: '配备AED、救护车值守与24h药房导航' },
    { key: '充电桩', ico: '⚡', name: '温泉新区智慧超充站（18个快充桩）', address: '温泉街道温泉大道与京山大道交叉口', lng: 113.1264, lat: 31.0212, photo: '/images/hero.jpg', rating: 4.9, dist: '200m', info: '闲置 14 桩 · 支持与订场联动提前锁桩预约' },
    { key: 'ATM', ico: '🏧', name: '中国银行 / 农行 24h ATM 自助点', address: '温泉街道京山大道128号文峰花园酒店旁', lng: 113.1136, lat: 31.0254, photo: '/images/hotel.jpg', rating: 4.8, dist: '350m', info: '支持外卡取现 · 位于文峰花园酒店大堂旁' },
    { key: '母婴室', ico: '👶', name: '网球中心亲子母婴室（温奶/护理台）', address: '温泉街道网球大道1号中心馆一楼西厅', lng: 113.1216, lat: 31.0176, photo: '/images/hotspring.jpg', rating: 5.0, dist: '150m', info: '恒温空调 · 独立哺乳间 · 免费饮水与急救包' },
  ],
  'venue-training-base': [
    { key: '卫生间', ico: '🚻', name: '训练基地风雨馆星级卫生间/淋浴间', address: '温泉街道网球大道16号风雨馆西侧', lng: 113.1194, lat: 31.0268, photo: '/images/hotel.jpg', rating: 4.9, dist: '60m', info: '配备热水淋浴更衣室与无障碍卫生间' },
    { key: '医疗点', ico: '🏥', name: '省网校运动防护与理疗医疗室', address: '温泉街道网球大道16号校医务楼1层', lng: 113.1296, lat: 31.0262, photo: '/images/indoor_court.jpg', rating: 5.0, dist: '110m', info: '驻校运动康复师值守 · 肌贴与冷敷急救' },
    { key: '充电桩', ico: '⚡', name: '训练基地P2大巴/私家车快充区', address: '温泉街道网球大道16号P2停车场东排', lng: 113.1288, lat: 31.0206, photo: '/images/hero.jpg', rating: 4.9, dist: '140m', info: '闲置 18 桩 · 练球期间免费停放快充' },
    { key: 'ATM', ico: '🏧', name: '农商银行 24h 自助金融服务点', address: '温泉街道网球人才公寓A栋底商', lng: 113.1196, lat: 31.0212, photo: '/images/hotel.jpg', rating: 4.8, dist: '280m', info: '24h自助存取 · 紧邻网球公寓生活圈' },
    { key: '母婴室', ico: '👶', name: '网球人才公寓亲子驿站母婴室', address: '温泉街道网球大道18号公寓大堂东侧', lng: 113.1248, lat: 31.0282, photo: '/images/hotspring.jpg', rating: 4.9, dist: '260m', info: '陪读家庭专属休憩空间 · 配温奶器与玩具角' },
  ],
  'venue-yongxing': [
    { key: '卫生间', ico: '🚻', name: '永兴室内网球馆洁净卫生间', address: '永兴街道轻机大道东段68号1楼大厅', lng: 113.1578, lat: 31.0144, photo: '/images/hotel.jpg', rating: 4.9, dist: '50m', info: '室内恒温空调 · 24h保洁达标' },
    { key: '医疗点', ico: '🏥', name: '永兴街道卫生院运动急救站', address: '永兴街道轻机大道东段卫生院门诊', lng: 113.1674, lat: 31.0142, photo: '/images/indoor_court.jpg', rating: 4.8, dist: '480m', info: '外伤处置、AED急救与基础运动药品' },
    { key: '充电桩', ico: '⚡', name: '永兴新能源超充站（120kW）', address: '永兴街道体育馆停车场北侧入口', lng: 113.1668, lat: 31.0082, photo: '/images/hero.jpg', rating: 4.9, dist: '130m', info: '闲置 10 桩 · 场馆免费停车2小时' },
    { key: 'ATM', ico: '🏧', name: '邮政储蓄 24h ATM 机', address: '永兴街道客运中心商业广场东侧', lng: 113.1572, lat: 31.0086, photo: '/images/hotel.jpg', rating: 4.7, dist: '380m', info: '支持银联卡24小时自助存取款' },
    { key: '母婴室', ico: '👶', name: '永兴亲子运动驿站母婴护理间', address: '永兴街道轻机大道66号亲子驿站内', lng: 113.1628, lat: 31.0154, photo: '/images/hotspring.jpg', rating: 4.9, dist: '190m', info: '带娃看球专属母婴室 · 配备儿童游乐区' },
  ],
}

const currentVenueAmenities = computed(
  () => VENUE_AMENITIES[selectedVenue.value?.id ?? 'venue-wenfeng'] ?? VENUE_AMENITIES['venue-wenfeng']!,
)

const visibleAmenities = computed(() => {
  const q = amKeyword.value.trim().toLowerCase()
  return currentVenueAmenities.value.filter((a) => {
    const okCat = amFilter.value === '全部' || a.key === amFilter.value
    const okQ = !q || a.name.toLowerCase().includes(q) || a.address.toLowerCase().includes(q) || a.info.toLowerCase().includes(q)
    return okCat && okQ
  })
})

const pagedAmenities = computed(() => {
  const start = (amPage.value - 1) * PAGE_SIZE
  return visibleAmenities.value.slice(start, start + PAGE_SIZE)
})

watch([visibleAmenities, selectedVenueId], () => {
  amPage.value = 1
})
</script>

<template>
  <section>
    <div class="module-header">
      <div class="mh-left">
        <div class="mh-num">10</div>
        <div>
          <h1 class="mh-title">便民配套服务</h1>
          <div class="mh-desc">
            卫生间、医疗点、充电桩、母婴室与 ATM，随时找到离你最近的一处
          </div>
        </div>
      </div>
      <div class="mh-tabs">
        <button
          v-for="t in (['全部', '卫生间', '医疗点', '充电桩', 'ATM', '母婴室'] as const)"
          :key="t"
          class="m-tab"
          :class="{ active: amFilter === t }"
          @click="amFilter = t"
        >
          {{ t === '全部' ? '全部便民设施' : t }}
        </button>
      </div>
    </div>

    <div class="grid-2 mb-16">
      <div class="card card-pad" style="background: linear-gradient(135deg, #0d4c39, #127355); color: #fff">
        <div class="flex-between" style="margin-bottom: 8px">
          <strong style="font-size: 16px">☀️ 京山实时天气与网球气象指数</strong>
          <span class="tag" style="background: var(--lime); color: #0b251d">极适宜户外打球</span>
        </div>
        <div class="flex-between">
          <div style="font-size: 32px; font-weight: 900">19°C <span style="font-size: 14px; font-weight: 500">晴 · 东南风2级 · 湿度48%</span></div>
          <div style="font-size: 11.5px; text-align: right; color: rgba(255, 255, 255, 0.86)">
            明日：多云 12–21°C（适宜）<br />后日：小雨（推荐室内风雨场）
          </div>
        </div>
      </div>

      <div class="card card-pad">
        <div class="flex-between" style="margin-bottom: 8px">
          <strong style="font-size: 16px">🚦 全城实时路况与赛场通行状态</strong>
          <span class="tag orange" style="cursor: pointer" @click="switchModule(6)">查看完整限行地图 →</span>
        </div>
        <div class="grid-3" style="gap: 8px; font-size: 11.5px">
          <div style="background: #ffecee; color: #b01c26; padding: 8px; border-radius: 0"><strong>🔴 温泉大道赛场段</strong><br />07:30-19:00 临时封闭</div>
          <div style="background: #fff5e8; color: #a65608; padding: 8px; border-radius: 0"><strong>🟠 京山大道东段</strong><br />赛事缓冲限行/禁停</div>
          <div style="background: #eaf8f1; color: #0a6b46; padding: 8px; border-radius: 0"><strong>🟢 高铁站/城区主路</strong><br />全线畅通 · P1剩84位</div>
        </div>
      </div>
    </div>

    <!-- 选择最近的几个网球场（实时联动下方设施列表与右侧地图） -->
    <div class="card card-pad mb-16 filter-workbench">
      <div class="flex-between mb-10">
        <div class="flex-row">
          <strong style="font-size: 14px">🎾 选择离你最近的网球场（按距离由近到远）</strong>
          <span class="tag green">点击切换后，下方设施列表与右侧地图同步定位</span>
        </div>
        <div class="flex-row" style="gap: 5px">
          <span style="font-size: 11.5px; color: var(--ink-3); font-weight: 700">周边半径：</span>
          <button
            v-for="r in (['500m', '1公里', '2公里'] as const)"
            :key="r"
            class="filter-pill"
            :class="{ active: mapRadius === r }"
            @click="mapRadius = r"
          >
            {{ r }}
          </button>
        </div>
      </div>

      <div class="amenity-court-grid">
        <button
          v-for="(v, idx) in nearestCourts"
          :key="v.id"
          class="amenity-court-btn"
          :class="{ active: selectedVenue?.id === v.id }"
          @click="selectedVenueId = v.id"
        >
          <div class="flex-between" style="width: 100%; margin-bottom: 3px">
            <span class="tag" :class="selectedVenue?.id === v.id ? 'green' : ''" style="font-size: 10px; padding: 1px 6px">
              {{ idx === 0 ? '离你最近' : `第${idx + 1}近` }} · {{ v.distanceKm }}km
            </span>
            <span style="font-size: 10.5px; opacity: 0.78">{{ v.region }}</span>
          </div>
          <strong style="font-size: 13px; text-align: left; display: block">
            {{ v.name.split('（')[0] }}
          </strong>
        </button>
      </div>
    </div>

    <div class="grid-split-rev">
      <div style="display: flex; flex-direction: column; gap: 10px">
        <div class="search-bar" style="max-width: 100%; height: 36px; background: #fff">
          <span>🔍</span>
          <input v-model="amKeyword" type="text" placeholder="搜索公厕、AED医疗、快充桩、ATM、母婴室…" />
          <button v-if="amKeyword" class="btn-ghost" style="padding: 1px 6px; font-size: 11px" @click="amKeyword = ''">✕</button>
        </div>

        <div
          v-for="a in pagedAmenities"
          :key="`${selectedVenue?.id}-${a.name}`"
          class="card"
          style="display: grid; grid-template-columns: 82px 1fr; gap: 12px; padding: 10px 12px; align-items: center"
        >
          <div
            class="photo-box"
            style="height: 66px; border-radius: 0"
            @click="
              openPhoto({
                title: a.name,
                category: `便民设施详情 · ${a.key}`,
                photo: a.photo,
                rating: a.rating,
                subtitle: `距${selectedVenue?.name.split('（')[0] ?? '球场'} ${a.dist} ｜ ${a.info}`,
                intro: `${a.name}位于${a.address}，纳入京山市城运中心智慧网格巡检体系，实时保障洁净度、设备可用率与无障碍通行。`,
                openHours: a.key === '医疗点' ? '赛事日 07:00–22:00 / 急诊 24小时' : '全天 24 小时开放',
                priceInfo: a.key === '充电桩' ? '电费+服务费约 ¥0.98/度' : '公益便民免费开放',
                address: a.address,
                lng: a.lng,
                lat: a.lat,
                tags: ['官方网格认证', '实景核验', '一键精准导航', '支持故障上报'],
                reviews: [
                  { user: '武汉球友小吴', origin: '武汉', score: 5.0, date: '2026-11-24', content: '标识非常清晰、环境维护得很整洁，点一下导航两三分钟就找到了！' },
                ],
              })
            "
          >
            <img :src="a.photo" :alt="a.name" />
          </div>
          <div style="min-width: 0">
            <div class="flex-between">
              <strong style="font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{ a.ico }} {{ a.name }}</strong>
              <span class="rating-pill">★ {{ a.rating }}</span>
            </div>
            <div style="font-size: 11px; color: var(--ink-3); margin: 3px 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
              📍 {{ a.address }} ｜ 距该球场 <strong style="color: var(--primary)">{{ a.dist }}</strong>
            </div>
            <div class="flex-between">
              <span class="tag green">{{ a.info.slice(0, 16) }}{{ a.info.length > 16 ? '…' : '' }}</span>
              <button
                class="btn-primary"
                style="padding: 4px 10px; font-size: 11px"
                @click="
                  openNavigation({
                    placeName: a.name,
                    address: a.address,
                    lng: a.lng,
                    lat: a.lat,
                    distance: a.dist,
                    driveMin: '步行约 3 分钟',
                    tip: a.info,
                  })
                "
              >
                🧭 导航前往
              </button>
            </div>
          </div>
        </div>

        <PaginationBar
          :total="visibleAmenities.length"
          :page="amPage"
          :page-size="PAGE_SIZE"
          unit="处设施"
          @update:page="amPage = $event"
        />
      </div>

      <div class="card">
        <div class="card-pad flex-between" style="border-bottom: 1px solid var(--line); padding: 12px 14px">
          <div>
            <strong style="font-size: 14.5px">
              🗺️ {{ selectedVenue ? (selectedVenue.name.split('（')[0] ?? selectedVenue.name) : '京山球场' }} · 周边便民设施地图
            </strong>
            <div style="font-size: 11px; color: var(--ink-3)">
              点击上方最近球场或地图其他球场标点，实时切换该球场周边设施
            </div>
          </div>
          <div class="flex-row" style="gap: 5px">
            <button
              v-for="t in (['全部', '卫生间', '医疗点', '充电桩', 'ATM', '母婴室'] as const)"
              :key="`map-${t}`"
              class="filter-pill"
              :class="{ active: amFilter === t }"
              style="padding: 3px 8px; font-size: 11px"
              @click="amFilter = t"
            >
              {{ t === '全部' ? '全部' : t }}
            </button>
          </div>
        </div>
        <ServiceCircleMap
          mode="amenities"
          :radius="mapRadius"
          :selected-venue="selectedVenue"
          :venues="nearestCourts"
          :custom-amenities="visibleAmenities"
          @select-venue="selectedVenueId = $event"
        />
        <div class="card-pad flex-between" style="background: #fafdfc; padding: 11px 14px">
          <span style="font-size: 12px; color: var(--ink-2)">
            当前定位：<strong>{{ selectedVenue?.name.split('（')[0] }}</strong>（{{ selectedVenue?.address }}） · 显示 {{ visibleAmenities.length }} 处周边便民点
          </span>
          <button class="btn-orange" @click="switchModule(11)">设施故障上报</button>
        </div>
      </div>
    </div>
  </section>
</template>
