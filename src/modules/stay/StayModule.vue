<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'
import MultiSelectDropdown from '../../components/MultiSelectDropdown.vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { HOTEL_PROFILES } from '../../mock/details'
import { BOOKING_DATES } from '../../mock/schedules'
import { usePortalStore } from '../../store/usePortalStore'
import type { HotelProfile, HotelRoom } from '../../types/portal'

const StayResultsMap = defineAsyncComponent(() => import('./StayResultsMap.vue'))
const { state, openHotelDetail, openActionModal, openNavigation, createQuickOrder, claimHomeSubsidy } = usePortalStore()
const PAGE_SIZE = 4
const promotionMessage = '京山市房管局重磅活动：2026京山网球公开赛期间购房直减 ¥50,000！'
const typeLabels: Record<HotelProfile['category'], string> = {
  公寓: '网球公寓',
  赛事优惠: '赛事合作酒店',
  民宿: '温泉民宿',
}
const facilityOptions = ['免费停车', '快充充电桩', '免费赛场摆渡车', '天然私汤入户', '独立厨房/洗衣机']
const isNightlyRoom = (room: HotelRoom) => room.leaseUnit !== '/周' && room.leaseUnit !== '/月'
const hotelOffers = HOTEL_PROFILES.map((hotel) => ({
  hotel,
  rooms: hotel.rooms.filter(isNightlyRoom).sort((a, b) => a.eventPrice - b.eventPrice),
}))
const maxNightlyPrice = Math.max(100, ...hotelOffers.flatMap(({ rooms }) => rooms.map((room) => room.eventPrice)))
const priceLimit = Math.ceil(maxNightlyPrice / 100) * 100

const keywordInput = ref('')
const stayKeyword = ref('')
const stayPage = ref(1)
const checkInDate = ref(BOOKING_DATES[0]!.iso)
const checkOutDate = ref(BOOKING_DATES[2]!.iso)
const minPrice = ref(0)
const maxPrice = ref(priceLimit)
const stayType = ref<HotelProfile['category'] | ''>('')
const minRating = ref(0)
const minReviews = ref(0)
const breakfast = ref<'' | 'included' | 'excluded'>('')
const stayFacilities = ref<string[]>([])
const staySort = ref<'default' | 'price' | 'rating' | 'reviews'>('default')
const showMap = ref(false)
const mapTrigger = ref<HTMLButtonElement>()
const resultsHeading = ref<HTMLHeadingElement>()
const promoCollapsed = ref(false)
const promoHintDismissed = ref(false)
const promoCloseButton = ref<HTMLButtonElement>()
const promoReminderButton = ref<HTMLButtonElement>()
const checkOutOptions = computed(() => BOOKING_DATES.filter((day) => day.iso > checkInDate.value))
const nightsCount = computed(() => (Date.parse(checkOutDate.value) - Date.parse(checkInDate.value)) / 86400000)
const priceTrack = computed(() => ({
  left: `${minPrice.value / priceLimit * 100}%`,
  right: `${100 - maxPrice.value / priceLimit * 100}%`,
}))

watch(checkOutOptions, (options) => {
  if (checkOutDate.value <= checkInDate.value) checkOutDate.value = options[0]!.iso
}, { flush: 'sync' })

function updatePrice(event: Event, bound: 'min' | 'max') {
  const input = event.target as HTMLInputElement
  if (bound === 'min') {
    minPrice.value = Math.min(input.valueAsNumber, maxPrice.value)
    input.valueAsNumber = minPrice.value
  } else {
    maxPrice.value = Math.max(input.valueAsNumber, minPrice.value)
    input.valueAsNumber = maxPrice.value
  }
}

function searchStays() {
  stayKeyword.value = keywordInput.value.trim().toLowerCase()
  stayPage.value = 1
}

function resetStayFilters() {
  keywordInput.value = ''
  stayKeyword.value = ''
  minPrice.value = 0
  maxPrice.value = priceLimit
  stayType.value = ''
  minRating.value = 0
  minReviews.value = 0
  breakfast.value = ''
  stayFacilities.value = []
  staySort.value = 'default'
  stayPage.value = 1
}

function includesBreakfast(room: HotelRoom) {
  return room.breakfast.startsWith('含') && room.breakfast.includes('早')
}

const filteredHotels = computed(() => {
  const list = hotelOffers.flatMap(({ hotel, rooms }) => {
    if (stayType.value && hotel.category !== stayType.value) return []
    if (hotel.rating < minRating.value || hotel.reviewCount < minReviews.value) return []
    if (!stayFacilities.value.every((facility) =>
      hotel.facilities.includes(facility) || (facility === '免费停车' && hotel.facilities.includes('免费地下车库')),
    )) return []

    const query = stayKeyword.value
    const matchesHotel = [hotel.name, hotel.address, typeLabels[hotel.category]].some((text) => text.toLowerCase().includes(query))
    const matchesLongStay = hotel.rooms.some((offer) => !isNightlyRoom(offer) && offer.name.toLowerCase().includes(query))
    const eligibleRooms = rooms.filter((room) => !breakfast.value || includesBreakfast(room) === (breakfast.value === 'included'))
    const room = matchesHotel || matchesLongStay
      ? eligibleRooms[0]
      : eligibleRooms.find((offer) => offer.name.toLowerCase().includes(query))
    if (!room || room.eventPrice < minPrice.value || room.eventPrice > maxPrice.value) return []
    return [{ hotel, room }]
  })

  return list.sort((a, b) => {
    if (staySort.value === 'price') return a.room.eventPrice - b.room.eventPrice
    if (staySort.value === 'rating') return b.hotel.rating - a.hotel.rating
    if (staySort.value === 'reviews') return b.hotel.reviewCount - a.hotel.reviewCount
    return 0
  })
})

const visibleCards = computed(() => {
  const start = (stayPage.value - 1) * PAGE_SIZE
  return filteredHotels.value.slice(start, start + PAGE_SIZE)
})

watch(filteredHotels, () => { stayPage.value = 1 })

function toggleMap() {
  showMap.value = !showMap.value
  if (showMap.value) resultsHeading.value?.focus()
  else mapTrigger.value?.focus()
}

async function togglePromotion() {
  promoCollapsed.value = !promoCollapsed.value
  promoHintDismissed.value = false
  await nextTick()
  const button = promoCollapsed.value ? promoReminderButton.value : promoCloseButton.value
  button?.focus({ preventScroll: true })
}

function openStayDetail(hotelId: string, roomId: string) {
  openHotelDetail(hotelId, { checkIn: checkInDate.value, checkOut: checkOutDate.value, roomId })
}

function navigateToHotel(hotel: HotelProfile) {
  openNavigation({
    placeName: hotel.name,
    address: hotel.address,
    lng: hotel.lng,
    lat: hotel.lat,
    distance: hotel.distanceToCourt,
    driveMin: '约 5 分钟',
    tip: `${hotel.openYear} · 前台电话 ${hotel.phone}`,
  })
}

function bookStay(hotel: HotelProfile, room: HotelRoom) {
  const arrival = BOOKING_DATES.find((day) => day.iso === checkInDate.value)?.shortDate
  const departure = BOOKING_DATES.find((day) => day.iso === checkOutDate.value)?.shortDate
  createQuickOrder(
    '住宿',
    `${hotel.name} · ${room.name}`,
    `${arrival}入住 - ${departure}离店（共${nightsCount.value}晚） · 已核销电子票根 ${state.ticketStubCode} · ${room.breakfast}`,
    room.eventPrice * nightsCount.value,
    60,
  )
}
</script>

<template>
  <section>
    <form class="stay-search mb-16" aria-label="搜索住宿" @submit.prevent="searchStays">
      <div class="stay-destination">
        <span>目的地</span>
        <strong>京山市</strong>
      </div>
      <label class="dd-field">
        <span class="dd-field-label">入住日期</span>
        <select v-model="checkInDate" class="dd-select">
          <option v-for="day in BOOKING_DATES.slice(0, -1)" :key="day.iso" :value="day.iso">{{ day.shortDate }}（{{ day.weekday }}）</option>
        </select>
      </label>
      <label class="dd-field">
        <span class="dd-field-label">离店日期</span>
        <select v-model="checkOutDate" class="dd-select">
          <option v-for="day in checkOutOptions" :key="day.iso" :value="day.iso">{{ day.shortDate }}（{{ day.weekday }}）</option>
        </select>
      </label>
      <span class="tag green stay-nights">{{ nightsCount }} 晚</span>
      <label class="dd-field">
        <span class="dd-field-label">关键词</span>
        <input v-model="keywordInput" class="stay-keyword" type="search" placeholder="酒店、商圈、地址或房型" />
      </label>
      <button type="submit" class="btn-primary stay-search-btn">搜索住宿</button>
    </form>

    <div class="promo-banner stay-promo mb-16" :class="{ 'stay-promo-collapsed': promoCollapsed }">
      <div id="stay-promo-content" class="stay-promo-content" :inert="promoCollapsed">
        <div class="stay-promo-copy">
          <span class="stay-promo-house" aria-hidden="true">🏠</span>
          <strong>{{ promotionMessage }}</strong>
        </div>
        <div class="stay-promo-actions">
          <button
            type="button"
            class="btn-ghost"
            @click="openActionModal({ type: 'inquiry', title: '预约房管局赛事安居看房专车', subtitle: '温泉世家 / 网球新城品质现房 · 凭网球赛事/订场凭证立减 ¥50,000', submitLabel: '预约免费看房专车' })"
          >
            预约看房专车
          </button>
          <button type="button" class="btn-orange" @click="claimHomeSubsidy">
            {{ state.claimedHomeSubsidy ? '✅ 已领取5万元补贴券' : '领取5万元购房补贴券 →' }}
          </button>
          <button
            ref="promoCloseButton"
            type="button"
            class="stay-promo-close"
            aria-label="关闭购房补贴条幅"
            @click="togglePromotion"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>
    </div>

    <div class="stay-layout">
      <aside class="stay-sidebar" aria-label="住宿筛选">
        <button
          ref="mapTrigger"
          type="button"
          class="stay-map-entry"
          :aria-pressed="showMap"
          @click="toggleMap"
        >
          <span aria-hidden="true">◎</span> {{ showMap ? '返回列表' : '在地图上显示' }}
        </button>

        <div class="card stay-filter-panel">
          <div class="stay-filter-heading">
            <h2>热门筛选</h2>
            <button type="button" class="stay-reset" @click="resetStayFilters">重置</button>
          </div>
          <fieldset class="stay-price-filter">
            <legend>每晚起价</legend>
            <div class="stay-price-values">
              <span>¥{{ minPrice }}</span><span>¥{{ maxPrice }}</span>
            </div>
            <div class="stay-price-slider">
              <span class="stay-price-track" :style="priceTrack" />
              <input type="range" aria-label="最低每晚起价" min="0" :max="priceLimit" :value="minPrice" :class="{ 'at-limit': minPrice === priceLimit }" @input="updatePrice($event, 'min')" />
              <input type="range" aria-label="最高每晚起价" min="0" :max="priceLimit" :value="maxPrice" @input="updatePrice($event, 'max')" />
            </div>
          </fieldset>

          <label class="dd-field">
            <span class="dd-field-label">住宿类型</span>
            <select v-model="stayType" class="dd-select">
              <option value="">全部住宿</option>
              <option v-for="(label, value) in typeLabels" :key="value" :value="value">{{ label }}</option>
            </select>
          </label>
          <label class="dd-field">
            <span class="dd-field-label">住客评分</span>
            <select v-model.number="minRating" class="dd-select">
              <option :value="0">不限评分</option>
              <option :value="4.8">4.8 分及以上</option>
              <option :value="4.9">4.9 分及以上</option>
            </select>
          </label>
          <label class="dd-field">
            <span class="dd-field-label">点评数</span>
            <select v-model.number="minReviews" class="dd-select">
              <option :value="0">不限点评数</option>
              <option :value="200">200 条及以上</option>
              <option :value="400">400 条及以上</option>
              <option :value="800">800 条及以上</option>
            </select>
          </label>
          <label class="dd-field">
            <span class="dd-field-label">早餐</span>
            <select v-model="breakfast" class="dd-select">
              <option value="">不限早餐</option>
              <option value="included">含早餐</option>
              <option value="excluded">不含早餐</option>
            </select>
          </label>
          <MultiSelectDropdown v-model="stayFacilities" label="设施配套" :options="facilityOptions" />
        </div>
      </aside>

      <div class="stay-results">
        <div class="stay-results-heading">
          <h2 ref="resultsHeading" tabindex="-1" aria-live="polite">京山住宿 <span>{{ filteredHotels.length }} 家</span></h2>
          <div class="stay-results-actions">
            <div
              v-if="promoCollapsed"
              class="stay-promo-reminder"
              :class="{ 'stay-promo-hint-dismissed': promoHintDismissed }"
              @pointerleave="promoHintDismissed = false"
            >
              <button
                ref="promoReminderButton"
                type="button"
                class="stay-promo-info"
                aria-label="展开购房补贴活动"
                aria-controls="stay-promo-content"
                aria-describedby="stay-promo-hint"
                @click="togglePromotion"
                @keydown.esc.stop="promoHintDismissed = true"
                @blur="promoHintDismissed = false"
              >
                <span aria-hidden="true">i</span>
              </button>
              <p id="stay-promo-hint" class="stay-promo-hint" role="tooltip">{{ promotionMessage }}</p>
            </div>
            <label class="stay-sort">
              <span>排序</span>
              <select v-model="staySort" class="dd-select">
                <option value="default">综合推荐</option>
                <option value="price">价格从低到高</option>
                <option value="rating">评分最高</option>
                <option value="reviews">点评最多</option>
              </select>
            </label>
          </div>
        </div>

        <StayResultsMap v-if="showMap" :listings="filteredHotels" @detail="openStayDetail" />
        <template v-else-if="visibleCards.length">
          <div class="stay-cards">
            <article v-for="{ hotel, room } in visibleCards" :key="hotel.id" class="card stay-card">
              <button type="button" class="stay-card-photo" :aria-label="`查看${hotel.name}详情`" @click="openStayDetail(hotel.id, room.id)">
                <img :src="hotel.photo" alt="" />
                <span class="stay-card-type">{{ typeLabels[hotel.category] }}</span>
              </button>
              <div class="stay-card-info">
                <h3>{{ hotel.name }}</h3>
                <div class="stay-card-meta">
                  <span class="stay-score">{{ hotel.rating.toFixed(1) }} 分</span>
                  <span>{{ hotel.reviewCount }} 条点评</span>
                </div>
                <p class="stay-location">
                  {{ hotel.distanceToCourt }} · {{ hotel.address.replace('湖北省荆门市京山市', '') }}
                  <button type="button" class="stay-reset" @click="navigateToHotel(hotel)">导航</button>
                </p>
                <div class="stay-offer">
                  <div>
                    <strong>{{ room.name }}</strong>
                    <p>{{ room.area }} · {{ room.breakfast }}</p>
                    <p class="stay-cancel">{{ room.cancelRule }}</p>
                  </div>
                  <div class="stay-offer-actions">
                    <div class="stay-card-price">¥{{ room.eventPrice }} <small>{{ room.leaseUnit ?? '/晚' }}起</small></div>
                    <button type="button" class="btn-primary" @click="openStayDetail(hotel.id, room.id)">详情与选房</button>
                  </div>
                </div>
              </div>
            </article>
          </div>
          <PaginationBar :total="filteredHotels.length" :page="stayPage" :page-size="PAGE_SIZE" unit="家住宿" @update:page="stayPage = $event" />
          <details class="card stay-compare">
            <summary>对比房型与价格</summary>
            <table class="clean-table">
              <thead>
                <tr><th>住宿名称</th><th>房型</th><th>类型</th><th>赛事价</th><th>操作</th></tr>
              </thead>
              <tbody>
                <tr v-for="{ hotel, room } in filteredHotels" :key="hotel.id">
                  <td>{{ hotel.name }}</td>
                  <td>{{ room.name }}</td>
                  <td>{{ typeLabels[hotel.category] }}</td>
                  <td>¥{{ room.eventPrice }}{{ room.leaseUnit ?? '/晚' }}</td>
                  <td class="stay-compare-actions">
                    <button type="button" class="btn-ghost" @click="openStayDetail(hotel.id, room.id)">详情</button>
                    <button type="button" class="btn-primary" @click="bookStay(hotel, room)">预订</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </details>
        </template>
        <div v-else class="card stay-empty">
          <strong>没有符合条件的住宿</strong>
          <button type="button" class="btn-ghost" @click="resetStayFilters">重置筛选</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stay-search {
  display: grid;
  grid-template-columns: minmax(115px, 0.7fr) repeat(2, minmax(150px, 1fr)) auto minmax(190px, 1.6fr) auto;
  align-items: end;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--primary);
  border-radius: 10px;
  background: var(--surface);
}

.stay-destination { display: grid; gap: 3px; padding: 0 12px 5px; border-right: 1px solid var(--line); }
.stay-destination span { color: var(--ink-2); font-size: 13px; font-weight: 700; }
.stay-destination strong { font-size: 18px; }
.stay-nights { margin-bottom: 8px; border-radius: 20px; }
.stay-keyword { height: 42px; padding: 0 12px; border: 1.5px solid #cbdcd5; border-radius: 6px; color: var(--ink); font-size: 14px; }
.stay-search-btn { height: 42px; padding: 0 20px; border-radius: 6px; }

.stay-promo {
  display: grid;
  width: 100%;
  height: 78px;
  margin-left: auto;
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
  transition: width 280ms ease, height 280ms ease, border-radius 280ms ease, border-width 280ms ease, margin-bottom 280ms ease;
}

.stay-promo-collapsed { width: 36px; height: 0; margin-bottom: 0; border-width: 0; border-radius: 50%; }

.stay-promo-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  min-height: 0;
  padding: 0 18px 0 22px;
  overflow: hidden;
  transition: opacity 150ms ease;
}

.stay-promo-collapsed .stay-promo-content { opacity: 0; }
.stay-promo-copy, .stay-promo-actions { display: flex; align-items: center; gap: 10px; }
.stay-promo-copy { gap: 12px; color: #542600; font-size: 17.5px; }
.stay-promo-actions { flex-shrink: 0; }
.stay-promo-house {
  display: grid;
  place-items: center;
  flex: none;
  width: 46px;
  height: 46px;
  border-radius: 5px;
  background: var(--accent);
  font-size: 22px;
}

.stay-promo-close, .stay-promo-info {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #7f471f;
  font-size: 22px;
  cursor: pointer;
}

.stay-promo-close:hover, .stay-promo-info:hover { background: #f8dfc9; }
.stay-promo-reminder { position: relative; z-index: 5; }
.stay-promo-info {
  width: 36px;
  height: 36px;
  border: 1px solid #f7c799;
  background: #fff7ee;
  animation: stay-promo-info-in 280ms ease both;
}
.stay-promo-info span {
  display: grid;
  place-items: center;
  width: 17px;
  height: 17px;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

@keyframes stay-promo-info-in {
  0%, 55% { opacity: 0; transform: scale(0.7); }
  100% { opacity: 1; transform: none; }
}

.stay-promo-hint {
  position: absolute;
  top: 100%;
  right: 0;
  width: 300px;
  padding: 10px 12px;
  border: 1px solid #f7c799;
  border-radius: 7px;
  background: #fff9f2;
  box-shadow: var(--shadow-md);
  color: #542600;
  font-size: 13px;
  visibility: hidden;
  opacity: 0;
  transition: opacity 150ms ease, visibility 150ms ease;
}

.stay-promo-reminder:not(.stay-promo-hint-dismissed):hover .stay-promo-hint,
.stay-promo-reminder:not(.stay-promo-hint-dismissed) .stay-promo-info:focus-visible + .stay-promo-hint {
  visibility: visible;
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .stay-promo, .stay-promo-content, .stay-promo-hint { transition: none; }
  .stay-promo-info { animation: none; }
}

.stay-layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); align-items: start; gap: 20px; }
.stay-sidebar { display: grid; gap: 12px; }

.stay-map-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 70px;
  border: 1px solid #bdd9cf;
  border-radius: 8px;
  background: linear-gradient(31deg, transparent 36%, #fff9 37%, #fff9 43%, transparent 44%), #e8f4ef;
  color: var(--primary-dark);
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
}
.stay-map-entry:hover, .stay-map-entry[aria-pressed='true'] { border-color: var(--primary); background-color: #d6eee3; }
.stay-map-entry span { font-size: 20px; }

.stay-filter-panel { display: grid; gap: 15px; padding: 15px; border-radius: 8px; overflow: visible; }
.stay-filter-heading, .stay-price-values, .stay-results-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.stay-filter-heading h2 { font-size: 17px; }
.stay-reset { border: 0; background: transparent; color: var(--primary-dark); font-size: 13px; cursor: pointer; }
.stay-reset:hover { text-decoration: underline; }
.stay-price-filter { min-width: 0; padding: 0 1px 9px; border: 0; border-bottom: 1px solid var(--line); }
.stay-price-filter legend { color: var(--ink-2); font-size: 13px; font-weight: 800; }
.stay-price-values { margin: 4px 0; color: var(--primary-dark); font-size: 13px; font-weight: 700; }
.stay-price-slider { position: relative; height: 24px; }
.stay-price-slider::before, .stay-price-track { position: absolute; top: 10px; height: 4px; border-radius: 4px; }
.stay-price-slider::before { content: ''; inset-inline: 0; background: var(--line); }
.stay-price-track { background: var(--primary); }
.stay-price-slider input { position: absolute; inset: 0; width: 100%; height: 24px; appearance: none; background: transparent; pointer-events: none; }
.stay-price-slider input::-webkit-slider-thumb { width: 16px; height: 16px; appearance: none; border: 2px solid var(--primary); border-radius: 50%; background: white; cursor: ew-resize; pointer-events: auto; }
.stay-price-slider input::-moz-range-thumb { width: 13px; height: 13px; border: 2px solid var(--primary); border-radius: 50%; background: white; cursor: ew-resize; pointer-events: auto; }
.stay-price-slider input:focus { z-index: 1; }
.stay-price-slider input.at-limit { z-index: 2; }

.stay-results-heading { min-height: 44px; margin-bottom: 12px; }
.stay-results-heading h2 { display: flex; align-items: center; gap: 10px; font-size: 20px; }
.stay-results-heading h2 span { color: var(--primary-dark); font-size: 14px; }
.stay-results-actions { display: flex; align-items: center; gap: 10px; }
.stay-sort { display: flex; align-items: center; gap: 8px; color: var(--ink-2); font-size: 13px; }
.stay-sort select { width: 145px; height: 36px; }
.stay-cards { display: grid; gap: 12px; }
.stay-card { display: grid; grid-template-columns: minmax(180px, 28%) minmax(0, 1fr); border-radius: 9px; overflow: hidden; }
.stay-card-photo { position: relative; display: block; min-height: 178px; border: 0; background: var(--primary-light); cursor: pointer; }
.stay-card-photo:focus-visible { outline-offset: -3px; }
.stay-card-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.stay-card-type { position: absolute; top: 10px; left: 10px; padding: 2px 8px; border-radius: 4px; background: var(--surface); color: var(--primary-dark); font-size: 12px; font-weight: 800; }
.stay-card-info { padding: 13px 15px; }
.stay-card-info h3 { font-size: 18px; line-height: 1.4; }
.stay-card-meta { display: flex; align-items: center; gap: 8px; margin: 5px 0; color: var(--ink-2); font-size: 13px; }
.stay-score { padding: 1px 6px; border-radius: 4px; background: var(--primary); color: white; font-weight: 800; }
.stay-location { color: var(--ink-2); font-size: 13px; }
.stay-location button { margin-left: 6px; font-weight: 700; }
.stay-offer { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin-top: 9px; padding: 9px 11px; border-radius: 6px; background: #f2f8f5; font-size: 13px; }
.stay-offer p { color: var(--ink-2); }
.stay-offer .stay-cancel { color: var(--primary-dark); }
.stay-offer-actions { flex-shrink: 0; text-align: right; }
.stay-card-price { color: var(--primary-dark); font-size: 22px; font-weight: 900; line-height: 1.4; }
.stay-card-price small { font-size: 12px; font-weight: 600; }
.stay-offer-actions button { margin-top: 4px; padding: 5px 12px; border-radius: 5px; font-size: 13px; }
.stay-empty { display: grid; justify-items: center; gap: 12px; padding: 36px; border-radius: 8px; }
.stay-compare { margin-top: 14px; border-radius: 8px; }
.stay-compare summary { padding: 10px 14px; font-weight: 800; cursor: pointer; }
.stay-compare-actions { white-space: nowrap; }
.stay-compare-actions button { margin-right: 5px; padding: 4px 8px; font-size: 12px; }
</style>
