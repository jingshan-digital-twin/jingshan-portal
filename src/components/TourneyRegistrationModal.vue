<script setup lang="ts">
import L from 'leaflet'
import { computed, nextTick, onUnmounted, reactive, ref, watch } from 'vue'
import { HOTEL_PROFILES } from '../mock/details'
import { getOpenTournamentDivisions, getOpenTournamentOptions, getRegistrationEvent, getTournamentStay } from '../mock/tournamentRegistration'
import { TOUR_PACKAGES } from '../mock/tourData'
import { usePortalStore } from '../store/usePortalStore'
import type { VisitorOrigin } from '../types/portal'
import { addPortalMapMarker, createPortalMap, MAP_ICONS, setPortalMapTiles } from './portalMap'

const {
  state, currentAccount, registerYouthTournament, hasTournamentPackage, bookTournamentPackage, openHotelDetail, switchModule,
} = usePortalStore()
const spaPackage = TOUR_PACKAGES.find((item) => item.id === 'pkg-spa-3d')!
const origins: VisitorOrigin[] = ['武汉市（省内游客）', '北京市（省外游客）', '深圳市（省外游客）', '荆门市（周边游客）', '京山本地市民']
const dialog = ref<HTMLDialogElement>()
const playerField = ref<HTMLInputElement>()
const successHeading = ref<HTMLElement>()
const mapContainer = ref<HTMLDivElement>()
const hotelList = ref<HTMLDivElement>()
const selectedHotelId = ref('')
const roomChoices = ref<Record<string, string>>({})
const receipt = ref<{ id: string; groupName: string; player: string }>()
const registrationPending = ref(false)
const packagePending = ref(false)
const form = reactive({
  eventId: '', groupId: '', player: '', origin: state.origin, unit: '', level: '', addPackage: false,
})

const event = computed(() => getRegistrationEvent(form.eventId))
const venue = computed(() => state.courts.find((court) => court.id === event.value?.venueId))
const eventChoices = computed(() => getOpenTournamentOptions(state.orders).map((item) => item.event))
const divisions = computed(() => event.value ? getOpenTournamentDivisions(event.value, state.orders) : [])
const division = computed(() => divisions.value.find((item) => item.id === form.groupId))
const stay = computed(() => getTournamentStay(event.value?.dateRange ?? ''))
const stayLabel = computed(() => stay.value.checkIn + ' 入住 — ' + stay.value.checkOut + ' 离店（' + stay.value.nights + ' 晚）')
const packageOrder = computed(() => ({
  title: spaPackage.title,
  subtitle: stayLabel.value + ' · ' + spaPackage.includes.join(' · '),
  amount: spaPackage.price,
  fields: [
    { label: '出行日期', value: stayLabel.value },
    { label: '套餐内容', value: spaPackage.includes.join(' · ') },
  ],
}))
const packageOrdered = computed(() => hasTournamentPackage(packageOrder.value))

watch(divisions, (groups) => {
  if (!receipt.value && !groups.some((group) => group.id === form.groupId)) form.groupId = groups[0]?.id ?? ''
})

const nearbyHotels = computed(() => {
  if (!venue.value) return []
  const center = L.latLng(venue.value.lat, venue.value.lng)
  return HOTEL_PROFILES.flatMap((hotel) => {
    const distance = center.distanceTo([hotel.lat, hotel.lng])
    const rooms = hotel.rooms.filter((room) => room.remaining > 0 && room.leaseUnit !== '/周' && room.leaseUnit !== '/月')
    const room = rooms.find((item) => item.name.includes('网球主题')) ?? rooms[0]
    if (!room || distance > 3000) return []
    return [{
      hotel, rooms, room, distance,
      distanceLabel: distance < 1000 ? Math.round(distance) + ' 米' : (distance / 1000).toFixed(1) + ' 公里',
      totalRemain: rooms.reduce((sum, item) => sum + item.remaining, 0),
      stars: hotel.rating >= 4.9 ? '★★★★★' : '★★★★☆',
      review: hotel.reviews[0],
    }]
  }).sort((a, b) =>
    Number(b.hotel.category === '赛事优惠') - Number(a.hotel.category === '赛事优惠') || a.distance - b.distance,
  )
})

type HotelEntry = (typeof nearbyHotels.value)[number]
const roomFor = (entry: HotelEntry) => entry.rooms.find((room) => room.id === roomChoices.value[entry.hotel.id]) ?? entry.room

async function selectHotel(id: string) {
  selectedHotelId.value = id
  await nextTick()
  if (selectedHotelId.value !== id) return
  const list = hotelList.value
  const card = list?.querySelector('.trm-hotel-card.active')
  if (!list || !card) return
  const listBounds = list.getBoundingClientRect()
  const cardBounds = card.getBoundingClientRect()
  if (cardBounds.top < listBounds.top || cardBounds.bottom > listBounds.bottom) {
    list.scrollTop += cardBounds.top - listBounds.top
  }
}

let map: L.Map | undefined
const markers = new Map<string, L.Marker>()
const basemapUnavailable = ref(false)

function destroyMap() {
  map?.remove()
  map = undefined
  markers.clear()
}

function buildHotelMap(canvas: HTMLDivElement) {
  const court = venue.value
  if (!court) return
  const center: L.LatLngTuple = [court.lat, court.lng]
  map = createPortalMap(canvas, center, 15)
  setPortalMapTiles(L.layerGroup().addTo(map), 'vector', (unavailable) => { basemapUnavailable.value = unavailable })
  const layers = L.layerGroup().addTo(map)
  const points: L.LatLngTuple[] = [center]
  addPortalMapMarker(layers, center, {
    title: court.name, label: '比赛场馆', icon: MAP_ICONS.court, description: court.address, photo: court.photo,
  }, 500)

  for (const entry of nearbyHotels.value) {
    const { hotel, room, stars, distanceLabel, review, totalRemain } = entry
    points.push([hotel.lat, hotel.lng])
    const marker = addPortalMapMarker(layers, [hotel.lat, hotel.lng], {
      title: hotel.name,
      label: '京网推荐 · 余 ' + totalRemain + ' 间',
      compact: true,
      icon: MAP_ICONS.hotel,
      photo: hotel.photo,
      description: '京网推荐 ' + stars + ' ' + hotel.rating.toFixed(1) + ' 分 · 距赛场 ' + distanceLabel
        + (review ? ' · 住客点评 ' + review.user + '：“' + review.content + '”' : ''),
      highlight: '¥' + room.eventPrice + (room.leaseUnit ?? '/晚') + ' · 余 ' + totalRemain + ' 间',
      actions: [{ label: '详情与选房', run: () => viewHotel(entry) }],
    }, 300)
    marker.on('popupopen', () => { void selectHotel(hotel.id) })
    markers.set(hotel.id, marker)
  }

  if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [36, 42], maxZoom: 16, animate: false })
  markers.get(nearbyHotels.value[0]?.hotel.id ?? '')?.openPopup()
}

watch(mapContainer, (canvas) => {
  destroyMap()
  if (canvas) buildHotelMap(canvas)
}, { flush: 'post' })
onUnmounted(destroyMap)

watch(() => state.tournamentRegistration, async (selection) => {
  if (!selection) {
    dialog.value?.close()
    return
  }
  receipt.value = undefined
  selectedHotelId.value = ''
  roomChoices.value = {}
  Object.assign(form, {
    eventId: selection.eventId, groupId: selection.groupId,
    player: currentAccount.value.name, origin: state.origin, unit: '', level: state.abilityLevel, addPackage: false,
  })
  dialog.value?.showModal()
  await nextTick()
  playerField.value?.focus()
})

function close() {
  state.tournamentRegistration = null
}

async function submitRegistration() {
  if (registrationPending.value || receipt.value || !division.value || !form.player.trim()) return
  const player = form.player.trim()
  const group = division.value
  const addOn = form.addPackage && !packageOrdered.value ? packageOrder.value : undefined
  registrationPending.value = true
  try {
    const id = await registerYouthTournament({
      eventId: form.eventId, groupId: group.id, playerName: player, unit: form.unit.trim() || form.origin, level: form.level.trim(),
    }, form.origin, addOn)
    if (!id) return
    receipt.value = { id, groupName: group.name, player }
    await nextTick()
    successHeading.value?.focus()
  } finally {
    registrationPending.value = false
  }
}

async function bookSpaPackage() {
  if (packagePending.value || packageOrdered.value) return
  packagePending.value = true
  try {
    await bookTournamentPackage(packageOrder.value)
  } finally {
    packagePending.value = false
  }
}

function viewHotel(entry: HotelEntry) {
  const { checkIn, checkOut } = stay.value
  close()
  openHotelDetail(entry.hotel.id, { checkIn, checkOut, roomId: roomFor(entry).id })
}

function showModule(id: 5 | 13) {
  close()
  switchModule(id)
}
</script>

<template>
  <dialog ref="dialog" class="tourney-dialog" :class="{ 'tourney-dialog-wide': receipt }" aria-labelledby="tourney-heading" @cancel.prevent="close" @click.self="close">
    <div v-if="state.tournamentRegistration && event">
      <header class="tourney-heading card-pad flex-between">
        <div>
          <h2 id="tourney-heading" ref="successHeading" tabindex="-1">{{ receipt ? '报名成功' : '赛事一键报名' }}</h2>
          <p>{{ event.name }}</p>
        </div>
        <button type="button" class="btn-ghost" @click="close">关闭</button>
      </header>

      <form v-if="!receipt" class="card-pad tourney-form" @submit.prevent="submitRegistration">
        <div class="grid-2 tourney-fields">
          <label class="dd-field">
            <span class="dd-field-label">可报名赛事</span>
            <select v-model="form.eventId" class="dd-select">
              <option v-if="!eventChoices.some((item) => item.id === event?.id)" :value="event.id">{{ event.name }}</option>
              <option v-for="item in eventChoices" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </label>
          <label class="dd-field">
            <span class="dd-field-label">参赛组别</span>
            <select v-model="form.groupId" class="dd-select" :disabled="!divisions.length">
              <option v-if="!divisions.length" value="">暂无可报名组别</option>
              <option v-for="item in divisions" :key="item.id" :value="item.id">{{ item.name }} · ¥{{ item.fee }}</option>
            </select>
          </label>
          <label class="dd-field">
            <span class="dd-field-label">参赛选手姓名</span>
            <input ref="playerField" v-model="form.player" class="f-input" required autocomplete="name" />
          </label>
          <label class="dd-field">
            <span class="dd-field-label">报名来源地</span>
            <select v-model="form.origin" class="dd-select">
              <option v-for="origin in origins" :key="origin">{{ origin }}</option>
            </select>
          </label>
          <label class="dd-field">
            <span class="dd-field-label">代表单位（选填）</span>
            <input v-model="form.unit" class="f-input" />
          </label>
          <label class="dd-field">
            <span class="dd-field-label">技术等级</span>
            <input v-model="form.level" class="f-input" />
          </label>
        </div>
        <p>{{ event.dateRange }} · {{ event.venue }}</p>
        <p v-if="event.noticeList[0]" class="tourney-notice">{{ event.noticeList[0] }}</p>

        <label class="tourney-addon">
          <input v-model="form.addPackage" type="checkbox" :disabled="packageOrdered" />
          <span>
            <strong>{{ spaPackage.title }}</strong>
            <small>{{ spaPackage.includes.join(' · ') }}</small>
            <small>{{ packageOrdered ? '该出行日期已下单' : '勾选后与赛事报名一起确认' }}</small>
          </span>
          <strong class="price">¥{{ spaPackage.price.toLocaleString('zh-CN') }}</strong>
        </label>

        <div class="flex-between tourney-actions">
          <span v-if="division">报名费 <strong class="price">¥{{ division.fee }}</strong></span>
          <button type="submit" class="btn-orange" :disabled="registrationPending || !division || !form.player.trim()">一键报名并查看周边酒店</button>
        </div>
      </form>

      <div v-else class="card-pad tourney-form">
        <div class="flex-between tourney-receipt">
          <div>
            <strong>{{ receipt.player }} · {{ receipt.groupName }}</strong>
            <p>报名号 {{ receipt.id }}</p>
          </div>
          <button type="button" class="btn-ghost" @click="showModule(13)">查看订单</button>
        </div>

        <div class="flex-between tourney-actions">
          <div>
            <h3>赛场周边空房酒店</h3>
            <p>{{ stayLabel }} · {{ nearbyHotels.length }} 家可订 · 示例房态与点评</p>
          </div>
          <div class="tourney-package-status">
            <span v-if="packageOrdered" class="tag green" role="status">已下单三天两晚套餐</span>
            <button v-else type="button" class="btn-orange" :disabled="packagePending" @click="bookSpaPackage">
              {{ packagePending ? '等待确认套餐' : '加购三天两晚套餐 ¥' + spaPackage.price.toLocaleString('zh-CN') }}
            </button>
          </div>
        </div>

        <div class="trm-map-grid">
          <div class="trm-map-wrap">
            <div ref="mapContainer" class="trm-map-canvas" aria-label="赛场周边酒店地图" />
            <p v-if="basemapUnavailable" class="portal-map-notice" role="status">暂时无法加载地图底图</p>
          </div>
          <div ref="hotelList" class="trm-hotel-list">
            <p v-if="!nearbyHotels.length" role="status">赛场 3 公里内暂无可订酒店。</p>
            <article v-for="entry in nearbyHotels" :key="entry.hotel.id" class="trm-hotel-card" :class="{ active: selectedHotelId === entry.hotel.id }">
              <div class="flex-between">
                <button type="button" class="trm-hotel-name" :aria-pressed="selectedHotelId === entry.hotel.id" @click="markers.get(entry.hotel.id)?.openPopup()">{{ entry.hotel.name }}</button>
                <span class="tag green">余 {{ entry.totalRemain }} 间</span>
              </div>
              <p><span class="tag gold">京网推荐 {{ entry.stars }} {{ entry.hotel.rating.toFixed(1) }}</span> · 距赛场 {{ entry.distanceLabel }}</p>
              <blockquote v-if="entry.review" class="trm-review-quote">{{ entry.review.user }}：“{{ entry.review.content }}”</blockquote>
              <label class="dd-field">
                <span class="dd-field-label">可订房型</span>
                <select :value="roomFor(entry).id" class="dd-select" @change="roomChoices[entry.hotel.id] = ($event.target as HTMLSelectElement).value">
                  <option v-for="room in entry.rooms" :key="room.id" :value="room.id">{{ room.name }} · ¥{{ room.eventPrice }}{{ room.leaseUnit ?? '/晚' }}</option>
                </select>
              </label>
              <div class="flex-between tourney-actions">
                <span><strong class="price">¥{{ roomFor(entry).eventPrice * stay.nights }}</strong> / {{ stay.nights }} 晚</span>
                <button type="button" class="btn-primary" @click="viewHotel(entry)">详情与选房</button>
              </div>
            </article>
          </div>
        </div>
        <div class="flex-between tourney-actions">
          <button type="button" class="btn-ghost" @click="showModule(5)">查看全部住宿</button>
          <button type="button" class="btn-ghost" @click="close(); state.showArrivalGuideModal = true">抵京出行指引</button>
        </div>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.tourney-dialog {
  position: fixed;
  inset: 0;
  width: min(700px, calc(100vw - 32px));
  max-width: none;
  max-height: calc(100vh - 32px);
  margin: auto;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--ink);
}
.tourney-dialog-wide { width: min(1100px, calc(100vw - 32px)); }
.tourney-dialog::backdrop { background: rgb(15 38 31 / 45%); }
.tourney-heading { background: linear-gradient(135deg, #092d22, #0d684a); color: white; }
.tourney-heading h2 { color: white; font-size: 20px; }
.tourney-heading p { margin-top: 4px; }
.tourney-form { display: grid; gap: 14px; }
.tourney-fields { gap: 12px; }
.tourney-notice { color: var(--ink-2); font-size: 13px; }
.tourney-addon {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f7c7a8;
  background: #fff8f3;
}
.tourney-addon small { display: block; color: var(--ink-2); }
.tourney-actions { flex-wrap: wrap; }
.tourney-actions > button:last-child { margin-left: auto; }
.tourney-package-status { display: flex; justify-content: flex-end; align-items: center; min-height: 39px; margin-left: auto; }
.tourney-package-status button:disabled { filter: none; transform: none; }
.tourney-dialog button:disabled { cursor: not-allowed; opacity: 0.55; }
.tourney-receipt { padding: 12px; background: var(--primary-light); }
.trm-map-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; }
.trm-map-wrap { position: relative; isolation: isolate; }
.trm-map-canvas { width: 100%; height: 420px; background: #e8f1ed; }
.trm-hotel-list { display: grid; align-content: start; gap: 10px; max-height: 420px; overflow: auto; }
.trm-hotel-card { display: grid; gap: 7px; padding: 12px; border: 1px solid var(--line); }
.trm-hotel-card.active { border-color: var(--primary); background: #f2faf6; }
.trm-hotel-name { border: 0; background: transparent; color: var(--primary-dark); font: inherit; font-weight: 800; text-align: left; }
.trm-review-quote { padding: 7px 9px; border-left: 3px solid var(--primary-light); font-size: 13px; color: var(--ink-2); }
@media (max-width: 760px) {
  .tourney-fields, .trm-map-grid { grid-template-columns: minmax(0, 1fr); }
  .trm-map-canvas { height: 340px; }
}
</style>
