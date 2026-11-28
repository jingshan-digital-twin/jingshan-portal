<script setup lang="ts">
import L from 'leaflet'
import { computed, nextTick, onUnmounted, reactive, ref, watch } from 'vue'
import { HOTEL_PROFILES } from '../mock/details'
import { usePortalStore } from '../store/usePortalStore'
import { addPortalMapMarker, createPortalMap, JINGSHAN_MAP_CENTER, MAP_ICONS, setPortalMapTiles } from './portalMap'

const {
  state,
  registerYouthTournament,
  createQuickOrder,
  openHotelDetail,
  switchModule,
  showToast,
} = usePortalStore()

const step = ref<'form' | 'success'>('form')
const selectedHotelId = ref<string>('hotel-wenfeng')
const bookedHotelIds = ref<string[]>([])
const ordered3dPkg = ref(false)
const lastRegOrderId = ref('')

const regForm = reactive({
  tournamentName: '2026 中国青少年网球巡回赛总决赛（京山站）',
  playerName: '张小宇',
  group: 'U14 青少年单打积分组',
  level: 'CUTR 3.50-3.99',
  originCity: '武汉市',
  phone: '138****8866',
  bundleSpa3d: false,
})

const nearbyHotels = computed(() =>
  HOTEL_PROFILES.slice(0, 4).map((h) => {
    const firstRoom = h.rooms[0]!
    const totalRemain = h.rooms.reduce((sum, r) => sum + r.remaining, 0)
    return {
      hotel: h,
      room: firstRoom,
      totalRemain,
      starsText: h.rating >= 4.9 ? '★★★★★' : '★★★★☆',
      topReview: h.reviews[0]?.content ?? '赛场周边口碑优选，凭电子票根享85折礼遇。',
      reviewer: h.reviews[0]?.user ?? '参赛球友',
    }
  }),
)

const mapContainer = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let layerGroup: L.LayerGroup | null = null
const markers = new Map<string, L.Marker>()

function destroyMap() {
  if (map) {
    map.remove()
    map = null
    layerGroup = null
    markers.clear()
  }
}

function initHotelMap() {
  destroyMap()
  if (!mapContainer.value) return
  map = createPortalMap(mapContainer.value, JINGSHAN_MAP_CENTER, 14)
  setPortalMapTiles(L.layerGroup().addTo(map), 'vector', () => {})
  layerGroup = L.layerGroup().addTo(map)

  addPortalMapMarker(layerGroup, JINGSHAN_MAP_CENTER, {
    title: '京山国际网球中心（赛场）',
    icon: MAP_ICONS.court,
    label: '比赛主场馆',
    description: '2026中青赛总决赛主场馆 · 温泉街道网球大道1号',
    highlight: '赛场中心',
  }, 600)

  const points: L.LatLngTuple[] = [JINGSHAN_MAP_CENTER]
  for (const item of nearbyHotels.value) {
    const { hotel, room, totalRemain } = item
    points.push([hotel.lat, hotel.lng])
    const marker = addPortalMapMarker(layerGroup, [hotel.lat, hotel.lng], {
      title: `${hotel.name}`,
      icon: MAP_ICONS.hotel,
      label: `京网推荐 ¥${room.eventPrice} · 余${totalRemain}间`,
      photo: hotel.photo,
      description: `京网推荐 ${item.starsText} ${hotel.rating.toFixed(1)}分 ｜ ${hotel.distanceToCourt} ｜ 点评：“${item.topReview}”`,
      highlight: `空房余 ${totalRemain} 间 · ¥${room.eventPrice}${room.leaseUnit ?? '/晚'}`,
      actions: [
        {
          label: '立即预订',
          run: () => quickBookHotel(hotel.id),
        },
      ],
    }, hotel.id === selectedHotelId.value ? 550 : 300)
    marker.on('click', () => {
      selectedHotelId.value = hotel.id
    })
    markers.set(hotel.id, marker)
  }

  map.fitBounds(L.latLngBounds(points), { padding: [36, 40], maxZoom: 15, animate: false })
  markers.get(selectedHotelId.value)?.openPopup()
}

function focusHotelOnMap(hotelId: string) {
  selectedHotelId.value = hotelId
  const marker = markers.get(hotelId)
  if (marker && map) {
    map.panTo(marker.getLatLng(), { animate: true })
    marker.openPopup()
  }
}

function close() {
  state.showTourneyRegModal = false
}

async function submitRegistration() {
  if (!regForm.playerName.trim()) {
    showToast('请输入参赛选手姓名')
    return
  }
  lastRegOrderId.value = registerYouthTournament({
    tournamentName: regForm.tournamentName,
    playerName: `${regForm.playerName.trim()}（${regForm.originCity}）`,
    group: regForm.group,
    venue: '京山国际网球中心',
    fee: 120,
  })
  if (regForm.bundleSpa3d && !ordered3dPkg.value) {
    await orderThreeDayPackage(true)
  }
  step.value = 'success'
  await nextTick()
  window.setTimeout(initHotelMap, 60)
}

async function orderThreeDayPackage(silent = false) {
  if (ordered3dPkg.value) {
    showToast('您已下单“打网球＋泡温泉”三天两晚套餐')
    return
  }
  if (silent) {
    const orderId = `ORD-${Date.now().toString().slice(-6)}`
    state.orders.unshift({
      id: orderId,
      category: '门票',
      title: '“打网球＋泡温泉”三天两晚精品套餐',
      subtitle: '含4h标准订场 + 2晚主题酒店 + 天沐温泉通票 + 电子票根85折',
      time: '11/27–11/29',
      amount: 1688,
      status: '已确认',
      cancellable: true,
    })
    ordered3dPkg.value = true
    return
  }
  const ok = await createQuickOrder(
    '门票',
    '“打网球＋泡温泉”三天两晚精品套餐',
    '含4h标准订场 + 2晚主题/温泉酒店 + 天沐天然温泉通票 + 电子票根85折',
    1688,
    180,
    0,
    {
      fields: [
        { label: '套餐内容', value: '4小时订场 + 2晚精选住宿 + 天沐温泉通票' },
        { label: '出行日期', value: '11/27 入住 — 11/29 离店（3天2晚）' },
        { label: '专属福利', value: '自动激活 79 家网球联盟 85 折电子票根' },
      ],
      successTitle: '三天两晚套餐下单成功',
      successMessage: '已同步至个人中心，获赠 180 金网积分。',
    },
  )
  if (ok) ordered3dPkg.value = true
}

async function quickBookHotel(hotelId: string) {
  const entry = nearbyHotels.value.find((x) => x.hotel.id === hotelId)
  if (!entry) return
  const ok = await createQuickOrder(
    '住宿',
    `${entry.hotel.name} · ${entry.room.name}`,
    `11/27入住 - 11/29离店（2晚） · 京网推荐${entry.starsText} · 已核销电子票根 ${state.ticketStubCode}`,
    entry.room.eventPrice * 2,
    120,
    0,
    {
      fields: [
        { label: '酒店名称', value: `${entry.hotel.name}（京网推荐 ${entry.hotel.rating.toFixed(1)}分）` },
        { label: '预订房型', value: `${entry.room.name}（${entry.room.breakfast}）` },
        { label: '入住晚数', value: '11/27 — 11/29（共 2 晚）' },
        { label: '距赛场', value: entry.hotel.distanceToCourt },
      ],
      successTitle: '网球主题酒店预订成功',
      successMessage: '已锁定空房并获赠 120 金网积分，抵京出行指引已就绪！',
    },
  )
  if (ok && !bookedHotelIds.value.includes(hotelId)) {
    bookedHotelIds.value.push(hotelId)
  }
}

function openArrivalGuide() {
  state.showTourneyRegModal = false
  state.showArrivalGuideModal = true
}

watch(
  () => state.showTourneyRegModal,
  (open) => {
    if (!open) {
      destroyMap()
      return
    }
    if (step.value === 'success') {
      nextTick(() => window.setTimeout(initHotelMap, 60))
    }
  },
)

onUnmounted(destroyMap)
</script>

<template>
  <div v-if="state.showTourneyRegModal" class="modal-backdrop" @click.self="close">
    <div class="modal-box" :style="{ width: step === 'success' ? '1040px' : '640px', maxWidth: '96vw' }">
      <!-- 顶部栏 -->
      <div class="card-pad flex-between" style="background: linear-gradient(135deg, #092d22, #0d684a); color: #fff">
        <div>
          <div class="flex-row" style="gap: 8px; margin-bottom: 4px">
            <span class="tag" style="background: var(--lime); color: #0b251d">
              {{ step === 'form' ? '🏆 青少年巡回赛 · 一键报名' : '✅ 报名成功 · 赛场周边空房酒店地图推荐' }}
            </span>
            <span v-if="step === 'success'" style="font-size: 13px; color: rgba(255,255,255,0.85)">报名号：{{ lastRegOrderId }}</span>
          </div>
          <strong style="font-size: 19px">{{ regForm.tournamentName }}</strong>
        </div>
        <div class="flex-row" style="gap: 8px">
          <button
            v-if="step === 'success'"
            type="button"
            class="btn-ghost"
            style="background: rgba(255,255,255,0.14); color: #fff; border-color: rgba(255,255,255,0.3); padding: 6px 12px; font-size: 13px"
            @click="step = 'form'"
          >
            重新报名
          </button>
          <button type="button" class="btn-ghost" @click="close">✕ 关闭</button>
        </div>
      </div>

      <!-- STEP 1: 一键报名表单 -->
      <div v-if="step === 'form'" class="card-pad" style="display: flex; flex-direction: column; gap: 14px">
        <div style="background: #f4faf7; border: 1px solid #cce6da; padding: 12px 14px; font-size: 13.5px; color: var(--ink-2)">
          📅 赛期：<strong>2026年11月24日 – 12月3日</strong> ｜ 📍 赛场：<strong>京山国际网球中心</strong> ｜ 🎁 报名即激活 79 家联盟 85 折电子票根并赠 <strong>+120 积分</strong>
        </div>

        <div class="grid-2" style="gap: 12px">
          <div>
            <label class="f-label">参赛选手姓名 *</label>
            <input v-model="regForm.playerName" class="f-input" placeholder="如：张小宇" />
          </div>
          <div>
            <label class="f-label">报名来源地（用于智能行程推荐）</label>
            <select v-model="regForm.originCity" class="f-input">
              <option value="武汉市">武汉市（省内游客）</option>
              <option value="北京市">北京市（省外北上客源）</option>
              <option value="深圳市">深圳市（省外南下客源）</option>
              <option value="荆门市">荆门市（周边游客）</option>
            </select>
          </div>
          <div>
            <label class="f-label">参赛组别</label>
            <select v-model="regForm.group" class="f-input">
              <option>U14 青少年单打积分组</option>
              <option>U16 青少年单打积分组</option>
              <option>U12 青少年红土/硬地组</option>
              <option>U14 青少年双打组合</option>
            </select>
          </div>
          <div>
            <label class="f-label">当前技术等级（匹配赛间约球）</label>
            <select v-model="regForm.level" class="f-input">
              <option>CUTR 3.50-3.99</option>
              <option>CUTR 3.00-3.49</option>
              <option>CUTR 4.00-4.49</option>
              <option>CUTR 2.50-2.99</option>
            </select>
          </div>
        </div>

        <!-- 顺手加购三天两晚套餐 -->
        <label
          style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: #fff8f3;
            border: 1.5px solid #f7c7a8;
            padding: 13px 16px;
            cursor: pointer;
          "
        >
          <div style="display: flex; align-items: flex-start; gap: 10px">
            <input v-model="regForm.bundleSpa3d" type="checkbox" style="margin-top: 4px; width: 16px; height: 16px" />
            <div>
              <div style="font-size: 15px; font-weight: 800; color: #542600">
                ♨️ 顺手下单：“打网球＋泡温泉”三天两晚精品套餐
                <span class="tag orange" style="margin-left: 6px">省 ¥492</span>
              </div>
              <div style="font-size: 13px; color: var(--ink-2); margin-top: 3px">
                含 4h 标准订场 + 2晚主题/温泉酒店 + 天沐天然温泉通票 + 联盟美食85折
              </div>
            </div>
          </div>
          <strong style="font-size: 20px; color: var(--accent); flex-shrink: 0">¥1,688</strong>
        </label>

        <div class="flex-between" style="padding-top: 10px; border-top: 1px solid var(--line)">
          <span style="font-size: 13.5px; color: var(--ink-2)">
            赛事报名费：<strong style="color: var(--accent); font-size: 18px">¥120</strong>
            <span v-if="regForm.bundleSpa3d"> + 套餐 ¥1,688</span>
          </span>
          <div class="flex-row" style="gap: 10px">
            <button type="button" class="btn-ghost" @click="close">稍后报名</button>
            <button type="button" class="btn-orange" style="padding: 10px 22px; font-size: 15px" @click="submitRegistration">
              一键报名并查看周边空房酒店 →
            </button>
          </div>
        </div>
      </div>

      <!-- STEP 2: 报名成功 + 赛场周边空房酒店地图推荐 -->
      <div v-else class="card-pad" style="display: flex; flex-direction: column; gap: 14px; max-height: 78vh; overflow-y: auto">
        <div class="flex-between" style="background: #eefaf4; border: 1px solid #bce4d0; padding: 11px 15px; flex-wrap: wrap; gap: 10px">
          <div style="font-size: 14px; color: #0a593d">
            <strong>🎉 已为 {{ regForm.playerName }} 锁定「{{ regForm.group }}」参赛资格！</strong>
            系统已为您定位赛场周边 <strong>4 家有空房合作酒店</strong>，清晰标注“京网推荐”星级与真实点评：
          </div>
          <button
            type="button"
            :class="ordered3dPkg ? 'btn-ghost' : 'btn-orange'"
            style="padding: 6px 14px; font-size: 13px; flex-shrink: 0"
            @click="orderThreeDayPackage(false)"
          >
            {{ ordered3dPkg ? '✅ 已下单三天两晚套餐' : '♨️ 顺手下单“打网球+泡温泉”三天两晚套餐 (¥1,688)' }}
          </button>
        </div>

        <div class="trm-map-grid">
          <!-- 左侧实时空房地图 -->
          <div class="trm-map-wrap">
            <div ref="mapContainer" class="trm-map-canvas" />
            <div class="trm-map-legend">
              <span>🎾 赛场主场馆</span>
              <span>🏨 京网推荐空房酒店（点击查看星级与点评）</span>
            </div>
          </div>

          <!-- 右侧空房酒店推荐列表 -->
          <div class="trm-hotel-list">
            <div
              v-for="item in nearbyHotels"
              :key="item.hotel.id"
              class="trm-hotel-card"
              :class="{ active: selectedHotelId === item.hotel.id }"
              @click="focusHotelOnMap(item.hotel.id)"
            >
              <div class="flex-between" style="gap: 8px; margin-bottom: 4px">
                <strong style="font-size: 15px; color: var(--ink)">{{ item.hotel.name }}</strong>
                <span class="tag green" style="flex-shrink: 0">余 {{ item.totalRemain }} 间空房</span>
              </div>
              <div class="flex-row" style="gap: 8px; margin-bottom: 5px; flex-wrap: wrap">
                <span class="tag gold">🏅 京网推荐 {{ item.starsText }} {{ item.hotel.rating.toFixed(1) }}</span>
                <span style="font-size: 12.5px; color: var(--ink-3)">{{ item.hotel.reviewCount }}条真实点评 · {{ item.hotel.distanceToCourt.split('（')[0] }}</span>
              </div>
              <div class="trm-review-quote">
                💬 {{ item.reviewer }}：“{{ item.topReview }}”
              </div>
              <div class="flex-between" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--line)">
                <div>
                  <strong style="font-size: 18px; color: var(--accent)">¥{{ item.room.eventPrice }}</strong>
                  <small style="font-size: 12px; color: var(--ink-3)">{{ item.room.leaseUnit ?? '/晚' }} · 票根85折</small>
                </div>
                <div class="flex-row" style="gap: 6px">
                  <button
                    type="button"
                    class="btn-ghost"
                    style="padding: 4px 10px; font-size: 12.5px"
                    @click.stop="close(); openHotelDetail(item.hotel.id)"
                  >
                    房型详情
                  </button>
                  <button
                    type="button"
                    :class="bookedHotelIds.includes(item.hotel.id) ? 'btn-ghost' : 'btn-primary'"
                    style="padding: 5px 12px; font-size: 12.5px"
                    @click.stop="quickBookHotel(item.hotel.id)"
                  >
                    {{ bookedHotelIds.includes(item.hotel.id) ? '✅ 已预订' : '预订此酒店' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex-between" style="padding-top: 10px; border-top: 1px solid var(--line)">
          <button
            type="button"
            class="btn-ghost"
            @click="close(); switchModule(5)"
          >
            前往“住 · 住宿服务”查看全部酒店 →
          </button>
          <div class="flex-row" style="gap: 10px">
            <button type="button" class="btn-orange" @click="openArrivalGuide">
              🚦 下一步：查看抵京出行指引卡 →
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trm-map-grid {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 14px;
  align-items: stretch;
}
.trm-map-wrap {
  position: relative;
  border: 1px solid var(--line);
  background: #e8f1ed;
  min-height: 410px;
  display: flex;
  flex-direction: column;
}
.trm-map-canvas {
  flex: 1;
  width: 100%;
  min-height: 376px;
}
.trm-map-legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 12px;
  background: #f5faf8;
  border-top: 1px solid var(--line);
  font-size: 12.5px;
  color: var(--ink-2);
  font-weight: 700;
}
.trm-hotel-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 2px;
}
.trm-hotel-card {
  border: 1px solid var(--line);
  background: #ffffff;
  padding: 11px 13px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.trm-hotel-card:hover {
  border-color: #9ec8b8;
  background: #fafdfc;
}
.trm-hotel-card.active {
  border-color: var(--primary);
  border-left: 4px solid var(--primary);
  background: #f2faf6;
}
.trm-review-quote {
  font-size: 12.5px;
  color: var(--ink-2);
  background: #f6faf8;
  padding: 6px 9px;
  line-height: 1.5;
  border-left: 2px solid #c2dfd3;
}
</style>
