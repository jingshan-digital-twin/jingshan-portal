<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RESTAURANT_MENUS } from '../mock/data'
import { CINEMA_MOVIES, HOTEL_PROFILES, PRODUCT_CATALOG } from '../mock/details'
import { BOOKING_DATES, COURT_HOURS, formatHourRange } from '../mock/schedules'
import { isBookingQuantity } from '../store/reservationFlow'
import { getModuleMeta, usePortalStore } from '../store/usePortalStore'
import type { CourtUnit, LightboxReview, MenuDish } from '../types/portal'
import DetailLocationMap from './DetailLocationMap.vue'
import MapResultsLayout from './MapResultsLayout.vue'
import MapViewToggle from './MapViewToggle.vue'
import { MAP_ICONS } from './portalMap'

const {
  state,
  memberTier,
  closeDetailPage,
  switchModule,
  toggleFavorite,
  createQuickOrder,
  confirmCourtBooking,
  openNavigation,
  openActionModal,
  showToast,
} = usePortalStore()

const detail = computed(() => state.activeDetail)
const moduleMeta = computed(() => getModuleMeta(state.activeModule))

// ===== Scroll-activated sticky sub-nav =====
const showStickyBar = ref(false)
const activeAnchor = ref('dp-photos')
const showAllPhotosModal = ref(false)
const activePhotoIndex = ref(0)
const showAllAmenities = ref(false)
const activeMentionTag = ref<string | null>(null)
const showLocationMap = ref(true)
const detailMap = ref<InstanceType<typeof DetailLocationMap>>()
const showReviewForm = ref(false)
const newReviewText = ref('')
const newReviewRating = ref(5)
const localReviews = ref<{ user: string; origin: string; score: number; date: string; meta?: string; content: string }[]>([])

function onScroll() {
  showStickyBar.value = window.scrollY > 420
  const ids = ['dp-photos', 'dp-options', 'dp-amenities', 'dp-location', 'dp-reviews', 'dp-policies']
  for (let i = ids.length - 1; i >= 0; i--) {
    const el = document.getElementById(ids[i]!)
    if (el && el.getBoundingClientRect().top <= 170) {
      activeAnchor.value = ids[i]!
      break
    }
  }
}

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - 148
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

// ===== Domain Entity Resolvers =====
const hotel = computed(() => {
  const d = detail.value
  if (d?.kind !== 'hotel') return null
  return HOTEL_PROFILES.find((h) => h.id === d.hotelId) ?? HOTEL_PROFILES[0]!
})

const product = computed(() => {
  const d = detail.value
  if (d?.kind !== 'product') return null
  return PRODUCT_CATALOG.find((p) => p.id === d.productId) ?? PRODUCT_CATALOG[0]!
})

const venue = computed(() => {
  const d = detail.value
  if (d?.kind !== 'venue') return null
  return state.courts.find((c) => c.id === d.venueId) ?? state.courts[0]!
})

const place = computed(() => (detail.value?.kind === 'place' ? detail.value.data : null))

// ===== Domain-specific interactive state =====
// 1. Hotel state
const checkIn = ref(BOOKING_DATES[0]!.iso)
const checkOut = ref(BOOKING_DATES[2]!.iso)
const hotelCheckOutOptions = computed(() => BOOKING_DATES.filter((day) => day.iso > checkIn.value))
watch(hotelCheckOutOptions, (options) => {
  if (checkOut.value <= checkIn.value && options[0]) checkOut.value = options[0].iso
})
const roomCount = ref<number | ''>(1)
const roomQuantity = computed(() => isBookingQuantity(roomCount.value) ? roomCount.value : 0)
const selectedRoomId = ref<string>('')
const showAllRooms = ref(false)

const hotelNights = computed(() => {
  const s = new Date(checkIn.value).getTime()
  const e = new Date(checkOut.value).getTime()
  return Math.max(1, Math.round((e - s) / 86400000))
})

const selectedRoom = computed(() => {
  if (!hotel.value) return null
  return hotel.value.rooms.find((r) => r.id === selectedRoomId.value) ?? hotel.value.rooms[0]!
})

const selectedRoomIsLongStay = computed(() => selectedRoom.value?.leaseUnit === '/月' || selectedRoom.value?.leaseUnit === '/周')
const canBookSelectedRoom = computed(() => selectedRoom.value && isBookingQuantity(roomCount.value, selectedRoom.value.remaining))

const hotelTotalPrice = computed(() => {
  if (!selectedRoom.value) return 0
  return selectedRoomIsLongStay.value
    ? selectedRoom.value.eventPrice * roomQuantity.value
    : selectedRoom.value.eventPrice * hotelNights.value * roomQuantity.value
})

function submitHotelBooking(targetRoom?: NonNullable<typeof hotel.value>['rooms'][number]) {
  if (!hotel.value) return
  const rm = targetRoom ?? selectedRoom.value ?? hotel.value.rooms[0]!
  const count = roomCount.value
  if (!isBookingQuantity(count, rm.remaining)) {
    showToast(rm.remaining > 0 ? `请输入 1 至 ${rm.remaining} 的整数作为预订数量` : '该房型已订满')
    return
  }
  const isLong = rm.leaseUnit === '/月' || rm.leaseUnit === '/周'
  const total = rm.eventPrice * count * (isLong ? 1 : hotelNights.value)
  const inLabel = BOOKING_DATES.find((d) => d.iso === checkIn.value)?.shortDate ?? checkIn.value
  const outLabel = BOOKING_DATES.find((d) => d.iso === checkOut.value)?.shortDate ?? checkOut.value
  const periodDesc = isLong
    ? `${inLabel}起租 · ${count}套`
    : `${inLabel}入住 - ${outLabel}离店（共${hotelNights.value}晚 × ${count}间）`
  createQuickOrder(
    '住宿',
    `${hotel.value.name} · ${rm.name}`,
    `${periodDesc} · ${rm.breakfast} · 票根专享价`,
    total,
    60 * count,
    0,
    {
      fields: [
        { label: '房型', value: rm.name },
        { label: isLong ? '起租日期' : '入住日期', value: inLabel },
        ...(isLong
          ? [{ label: '租赁周期', value: rm.leaseUnit === '/月' ? '1 个月' : '1 周' }]
          : [{ label: '退房日期', value: outLabel }, { label: '住宿晚数', value: `${hotelNights.value} 晚` }]),
        { label: '房间数量', value: `${count} ${isLong ? '套' : '间'}` },
        { label: '房型权益', value: rm.breakfast },
      ],
    },
  )
}

// 2. Product state
const selectedSpecIdx = ref(0)
const prodQty = ref(1)
const prodUseStub = ref(true)
const prodUsePoints = ref(false)
const prodPayMethod = ref<'wechat' | 'alipay'>('wechat')
const prodAddr = ref('湖北省武汉市洪山区光谷大道88号（林先生 138****8866）')

const prodUnitPrice = computed(() => {
  if (!product.value) return 0
  const spec = product.value.specs[selectedSpecIdx.value] ?? product.value.specs[0]!
  return Math.max(19, product.value.memberPrice + spec.addPrice)
})
const prodRawSubtotal = computed(() => prodUnitPrice.value * prodQty.value)
const prodStubOff = computed(() => (prodUseStub.value && prodRawSubtotal.value >= 150 ? 30 : 0))
const prodPointsOff = computed(() => (prodUsePoints.value && state.points >= 100 ? 10 : 0))
const prodFinalTotal = computed(() => Math.max(1, prodRawSubtotal.value - prodStubOff.value - prodPointsOff.value))

function submitProductOrder() {
  if (!product.value) return
  const specLabel = product.value.specs[selectedSpecIdx.value]?.label ?? ''
  createQuickOrder(
    '商品',
    `${product.value.name} × ${prodQty.value}`,
    `${specLabel} · ${prodPayMethod.value === 'wechat' ? '微信支付' : '支付宝'} · ${product.value.shipping}`,
    prodFinalTotal.value,
    40,
    prodPointsOff.value > 0 ? 100 : 0,
  )
}

// 3. Venue court matrix state
const venueDate = ref(BOOKING_DATES[0]!.iso)
const venueCells = ref<string[]>([])
const venueBookParking = ref(true)
const venueBookCharger = ref(true)
const venueUsePoints = ref(false)

function isNightHour(hour: string) {
  return Number(hour.split(':')[0]) >= 18
}
function getCellPrice(court: CourtUnit, hour: string) {
  const base = isNightHour(hour) ? court.nightPrice : court.dayPrice
  const member = Math.round(base * memberTier.value.discount)
  return { base, member }
}
function isOccupied(courtId: string, hour: string) {
  if (!venue.value) return false
  return state.bookedCourtKeys.includes(`${venue.value.id}|${venueDate.value}|${courtId}|${hour}`)
}
function toggleVenueCell(court: CourtUnit, hour: string) {
  if (isOccupied(court.id, hour)) return
  const key = `${court.id}|${hour}`
  const idx = venueCells.value.indexOf(key)
  if (idx >= 0) venueCells.value.splice(idx, 1)
  else venueCells.value.push(key)
}
const venueSlotDetails = computed(() => {
  if (!venue.value) return []
  return venueCells.value
    .map((key) => {
      const [courtId, hour] = key.split('|')
      const court = venue.value!.courts.find((c) => c.id === courtId)
      if (!court || !hour) return null
      const { base, member } = getCellPrice(court, hour)
      return { courtId: court.id, courtName: court.name, hour, price: base, memberPrice: member }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.courtName.localeCompare(b.courtName) || a.hour.localeCompare(b.hour))
})
const venueOriginalSum = computed(() => venueSlotDetails.value.reduce((s, i) => s + i.price, 0))
const venueMemberSum = computed(() => venueSlotDetails.value.reduce((s, i) => s + i.memberPrice, 0))
const venueFinalPay = computed(() => {
  const pts = venueUsePoints.value && state.points >= 200 ? 20 : 0
  return Math.max(0, venueMemberSum.value - pts)
})
async function submitVenueBooking() {
  if (!venue.value || venueSlotDetails.value.length === 0) {
    showToast('请先在左侧选场矩阵点击至少 1 个空闲时段')
    scrollToSection('dp-options')
    return
  }
  const booked = await confirmCourtBooking({
    venueId: venue.value.id,
    date: venueDate.value,
    selectedSlots: venueSlotDetails.value,
    bookParking: venueBookParking.value,
    bookCharger: venueBookCharger.value,
    usePoints: venueUsePoints.value,
  })
  if (booked) venueCells.value = []
}

// 4. Cinema state
const cinemaMovieIdx = ref(0)
const cinemaShowtimeIdx = ref(0)
const cinemaSeats = ref<string[]>([])
const cinemaMovie = computed(() => CINEMA_MOVIES[cinemaMovieIdx.value] ?? CINEMA_MOVIES[0]!)
const cinemaShowtime = computed(() => cinemaMovie.value.showtimes[cinemaShowtimeIdx.value] ?? cinemaMovie.value.showtimes[0]!)
const cinemaRows = ['A', 'B', 'C', 'D', 'E']
const cinemaCols = [1, 2, 3, 4, 5, 6, 7, 8]

function toggleCinemaSeat(seatId: string) {
  if (cinemaShowtime.value.takenSeats.includes(seatId)) return
  const idx = cinemaSeats.value.indexOf(seatId)
  if (idx >= 0) cinemaSeats.value.splice(idx, 1)
  else if (cinemaSeats.value.length >= 4) showToast('单次最多选择 4 个座位')
  else cinemaSeats.value.push(seatId)
}
async function submitCinemaOrder() {
  if (!cinemaSeats.value.length) {
    showToast('请先在左侧座位图选择至少 1 个空座位')
    scrollToSection('dp-options')
    return
  }
  const total = cinemaShowtime.value.memberPrice * cinemaSeats.value.length
  const booked = await createQuickOrder(
    '门票',
    `京山国际影城 · 《${cinemaMovie.value.title}》(${cinemaSeats.value.length}张)`,
    `今日 ${cinemaShowtime.value.time} ${cinemaShowtime.value.hall} · 座位：${cinemaSeats.value.join('、')}`,
    total,
    30,
    0,
    { fields: [
      { label: '场次', value: `今日 ${cinemaShowtime.value.time} · ${cinemaShowtime.value.hall}` },
      { label: '座位', value: cinemaSeats.value.join('、') },
      { label: '票数', value: `${cinemaSeats.value.length} 张` },
    ] },
  )
  if (booked) cinemaSeats.value = []
}

// 5. Place generic reservation state
const placeDate = ref(BOOKING_DATES[0]!.iso)
const placeSlot = ref('下午 14:00-17:00')
const placeQty = ref<number | ''>(2)
const audioPlaying = ref(false)
const audioProgress = ref(28)

const placeMenuDishes = computed<MenuDish[]>(() => {
  if (!place.value) return []
  return RESTAURANT_MENUS[place.value.title] ?? []
})
const isRestaurantBooking = computed(() => placeMenuDishes.value.length > 0 || place.value?.actionKind === 'restaurant')
const canBookPlace = computed(() => isBookingQuantity(placeQty.value, place.value?.quantityLimit))

function extractPriceNumber(priceText?: string): number {
  if (!priceText) return 0
  const m = priceText.replace(/,/g, '').match(/¥\s*(\d+)/)
  return m ? Number(m[1]) : 0
}

const placeUnitPrice = computed(() => {
  if (!place.value) return 0
  if (typeof place.value.priceNum === 'number') return place.value.priceNum
  return extractPriceNumber(place.value.priceInfo)
})
const placeTotal = computed(() => isBookingQuantity(placeQty.value, place.value?.quantityLimit) ? placeUnitPrice.value * placeQty.value : 0)

function bookPlaceHotItem(item: NonNullable<NonNullable<typeof place.value>['hotItems']>[number]) {
  if (!place.value) return
  const dLabel = BOOKING_DATES.find((d) => d.iso === placeDate.value)?.shortDate ?? placeDate.value
  const priceNum = extractPriceNumber(item.price)
  const kind = place.value.actionKind
  const subtitle =
    kind === 'club'
      ? `${item.tag ?? '精品课程'} · 官方平台预订保障`
      : kind === 'rehab'
        ? `${dLabel} ${placeSlot.value} · ${item.tag ?? '专业理疗'} · 赛期绿通优先接诊`
        : `${dLabel} · ${item.tag ?? '官方报名'} · 平台保障`
  createQuickOrder(
    place.value.orderCategory ?? '课程',
    `${place.value.title.split('（')[0]} · ${item.name}`,
    subtitle,
    priceNum,
    kind === 'club' ? 100 : kind === 'camp' ? 120 : 50,
  )
}

function submitPlaceBooking() {
  if (!place.value) return
  const count = placeQty.value
  if (!isBookingQuantity(count, place.value.quantityLimit)) return
  const dLabel = BOOKING_DATES.find((d) => d.iso === placeDate.value)?.shortDate ?? placeDate.value
  const cat = place.value.orderCategory ?? '门票'
  if (isRestaurantBooking.value) {
    createQuickOrder(
      '门票',
      `美食订座：${place.value.title}`,
      `${dLabel} ${placeSlot.value} · ${count}人桌 · 凭电子票根 ${state.ticketStubCode} 享优惠`,
      0,
      60,
      0,
      { fields: [
        { label: '用餐日期', value: dLabel },
        { label: '用餐时段', value: placeSlot.value },
        { label: '用餐人数', value: `${count} 人` },
        { label: '电子票根', value: state.ticketStubCode },
      ] },
    )
    return
  }
  const unit = placeUnitPrice.value
  createQuickOrder(
    cat,
    `${place.value.title}（${count}份）`,
    `${dLabel} ${placeSlot.value} · 官方平台预订保障`,
    unit * count,
    unit > 0 ? 80 : 30,
    0,
    { fields: [
      { label: '预约日期', value: dLabel },
      { label: '预约时段', value: placeSlot.value },
      { label: '预约数量', value: `${count} 份` },
    ] },
  )
}

// Reset state when switching detail target
watch(
  detail,
  (val) => {
    showAllPhotosModal.value = false
    showAllAmenities.value = false
    showLocationMap.value = true
    showAllRooms.value = false
    activeMentionTag.value = null
    showReviewForm.value = false
    localReviews.value = []
    audioPlaying.value = false
    if (val?.kind === 'place' && val.data.quantityLimit !== undefined) placeQty.value = 1

    if (val?.kind === 'hotel') {
      const h = HOTEL_PROFILES.find((x) => x.id === val.hotelId) ?? HOTEL_PROFILES[0]!
      selectedRoomId.value = h.rooms.find((room) => room.id === val.stay?.roomId)?.id ?? h.rooms[0]?.id ?? ''
      checkIn.value = val.stay?.checkIn ?? BOOKING_DATES[0]!.iso
      checkOut.value = val.stay?.checkOut ?? BOOKING_DATES[2]!.iso
    } else if (val?.kind === 'product') {
      selectedSpecIdx.value = 0
      prodQty.value = 1
    } else if (val?.kind === 'venue') {
      venueDate.value = val.date ?? BOOKING_DATES[0]!.iso
      venueCells.value = []
      const v = state.courts.find((c) => c.id === val.venueId)
      if (v && v.courts.length > 0) {
        const targetCourt = v.courts.find((ct) => ct.id === val.courtId) ?? v.courts[0]!
        const targetHour = COURT_HOURS.includes(val.slotTime as (typeof COURT_HOURS)[number])
          ? val.slotTime!
          : '16:00'
        if (!state.bookedCourtKeys.includes(`${v.id}|${venueDate.value}|${targetCourt.id}|${targetHour}`)) {
          venueCells.value = [`${targetCourt.id}|${targetHour}`]
        }
      }
    } else if (val?.kind === 'cinema') {
      cinemaMovieIdx.value = 0
      cinemaShowtimeIdx.value = 0
      cinemaSeats.value = []
    }
  },
  { immediate: true },
)

watch(venueDate, () => {
  venueCells.value = []
})

// ===== Unified Airbnb View Model =====
const displayTitle = computed(() => {
  if (hotel.value) return hotel.value.name
  if (product.value) return product.value.name
  if (venue.value) return venue.value.name
  if (detail.value?.kind === 'cinema') return '京山国际影城（IMAX / 杜比激光厅）'
  return place.value?.title ?? ''
})

const displayCategory = computed(() => {
  if (hotel.value) return hotel.value.category === '公寓' ? '网球公寓 · 短/长租' : hotel.value.category === '民宿' ? '温泉精品民宿' : '赛事合作酒店'
  if (product.value) return `京山好物 · ${product.value.cat}`
  if (venue.value) return `标准网球场馆 · ${venue.value.region}`
  if (detail.value?.kind === 'cinema') return '休闲娱乐 · 院线选座'
  return place.value?.category ?? '官方认证详情'
})

const displaySubtitle = computed(() => {
  if (hotel.value) return `湖北京山 · ${hotel.value.distanceToCourt} · ${hotel.value.openYear}`
  if (product.value) return `${product.value.originPlace} · ${product.value.shipping} · 已售 ${product.value.sold} 件`
  if (venue.value) return `湖北京山 · ${venue.value.region} · 共 ${venue.value.courts.length} 片标准场 · 距您 ${venue.value.distanceKm} km`
  if (detail.value?.kind === 'cinema') return '京山市新市街道文峰广场 4F · 距文峰公园球场 500m'
  return place.value?.subtitle ?? ''
})

const displayRating = computed(() => {
  if (hotel.value) return hotel.value.rating
  if (product.value) return product.value.rating
  if (venue.value) return venue.value.rating
  if (detail.value?.kind === 'cinema') return 4.9
  return place.value?.rating ?? 4.9
})

const displayReviewCount = computed(() => {
  if (hotel.value) return hotel.value.reviewCount + localReviews.value.length
  if (product.value) return product.value.reviewCount + localReviews.value.length
  if (venue.value) return venue.value.reviewCount + localReviews.value.length
  if (detail.value?.kind === 'cinema') return 428 + localReviews.value.length
  return (place.value?.reviewCount ?? Math.max(86, (place.value?.reviews.length ?? 2) * 32)) + localReviews.value.length
})

const displayAddress = computed(() => {
  if (hotel.value) return hotel.value.address
  if (product.value) return `湖北省荆门市京山市${product.value.originPlace}（官方原产地直发）`
  if (venue.value) return venue.value.address
  if (detail.value?.kind === 'cinema') return '湖北省荆门市京山市新市街道京源大道88号文峰广场4F'
  return place.value?.address ?? '湖北省荆门市京山市温泉街道网球大道1号'
})

const displayCoords = computed(() => {
  if (hotel.value) return { lat: hotel.value.lat, lng: hotel.value.lng }
  if (venue.value) return { lat: venue.value.lat, lng: venue.value.lng }
  if (detail.value?.kind === 'cinema') return { lat: 31.0195, lng: 113.1162 }
  if (place.value?.lat && place.value?.lng) return { lat: place.value.lat, lng: place.value.lng }
  return { lat: 31.0218, lng: 113.1195 }
})

const detailMapItems = computed(() => [{
  id: 'location',
  title: displayTitle.value,
  photo: hotel.value?.photo ?? venue.value?.photo ?? place.value?.photo,
  location: displayAddress.value,
}])

const detailLocationIcon = computed(() => {
  switch (detail.value?.kind) {
    case 'hotel': return MAP_ICONS.hotel
    case 'venue': return MAP_ICONS.court
    case 'cinema': return MAP_ICONS.cinema
    case 'product': return MAP_ICONS.shop
    default:
      if (place.value?.actionKind === 'restaurant') return MAP_ICONS.food
      if (isTourDetail.value) return MAP_ICONS.scenic
      return MAP_ICONS.location
  }
})

const displayIntro = computed(() => {
  if (hotel.value) return hotel.value.intro
  if (product.value) return `${product.value.name}由京山原产地官方直供（${product.value.originPlace}），${product.value.highlights.join('；')}。支持会员折扣、电子票根满减与积分抵现，全国快递包邮到家。`
  if (venue.value) return `${venue.value.name}位于${venue.value.address}，现开放 ${venue.value.courts.length} 片标准网球场地（${venue.value.surfaces.join(' / ')}），营业时间 ${venue.value.openHours}。支持按日期与具体场地编号精确预约小时时段，开场前 2 小时免费取消，并同步联动预约${venue.value.parkingName}与${venue.value.chargerName}。`
  if (detail.value?.kind === 'cinema') return '京山国际影城位于文峰广场 4 楼，配备 IMAX 巨幕厅与杜比全景声激光厅，距文峰公园网球场步行仅 6 分钟。凭「京山网球」电子票根及会员身份享专属特惠票价，文峰广场地下车库凭影票免费停车 3 小时。'
  return place.value?.intro ?? '纳入京山网球官方服务体系，明码标价、品质保障，支持电子票根优待与一键导航。'
})

// Curated 5-photo mosaic gallery per type
const galleryPhotos = computed<string[]>(() => {
  const poolByKind: Record<string, string[]> = {
    hotel: ['/images/hotel.jpg', '/images/hotspring.jpg', '/images/hero.jpg', '/images/indoor_court.jpg', '/images/cuisine.jpg'],
    product: ['/images/prod_qiaomi.jpg', '/images/goods.jpg', '/images/prod_kudzu_mushroom.jpg', '/images/prod_tiedye_craft.jpg', '/images/prod_lining_racket.jpg'],
    venue: ['/images/hero.jpg', '/images/indoor_court.jpg', '/images/tournament_1.jpg', '/images/tournament_2.jpg', '/images/coach_1.jpg'],
    cinema: ['/images/night_market.jpg', '/images/hotel.jpg', '/images/hotspring.jpg', '/images/cuisine.jpg', '/images/hero.jpg'],
    place: ['/images/scenic.jpg', '/images/hero.jpg', '/images/hotspring.jpg', '/images/cuisine.jpg', '/images/night_market.jpg'],
  }

  let primary = '/images/hero.jpg'
  let extra: string[] = []
  if (hotel.value) {
    primary = hotel.value.photo
    extra = poolByKind.hotel!
  } else if (product.value) {
    primary = product.value.photo
    extra = poolByKind.product!
  } else if (venue.value) {
    primary = venue.value.photo
    extra = poolByKind.venue!
  } else if (detail.value?.kind === 'cinema') {
    primary = cinemaMovie.value.poster
    extra = [...CINEMA_MOVIES.map((m) => m.poster), ...poolByKind.cinema!]
  } else if (place.value) {
    primary = place.value.photo
    extra = [...(place.value.gallery ?? []), ...poolByKind.place!]
  }

  const result: string[] = [primary]
  for (const img of extra) {
    if (result.length >= 5) break
    if (!result.includes(img)) result.push(img)
  }
  while (result.length < 5) result.push(primary)
  return result
})

const featureHighlights = computed<{ icon: string; title: string; desc?: string }[]>(() => {
  if (hotel.value) {
    return [
      { icon: '🎾', title: `${hotel.value.distanceToCourt}`, desc: '赛事合作优选地段，步行或短途直达核心网球场馆' },
      { icon: '🎫', title: '电子票根专享优惠价', desc: `凭「京山网球」票根 ${state.ticketStubCode} 享赛事专属折扣并积 +60 分` },
      { icon: '🅿️', title: '免费停车与充电便利', desc: hotel.value.facilities.slice(0, 3).join(' · ') },
      { icon: '🛡️', title: '入住前免费取消保障', desc: hotel.value.rooms[0]?.cancelRule ?? '支持入住前免费退改，政务平台全程担保' },
    ]
  }
  if (product.value) {
    return [
      { icon: '🌾', title: `${product.value.originPlace} · 原产地直供`, desc: '京山官方认证特产与品牌授权，源头直采品质可溯源' },
      { icon: '📦', title: product.value.shipping, desc: '当日下单极速打包发出，破损包赔无忧签收' },
      { icon: '🎫', title: '票根满 ¥150 立减 ¥30', desc: '可叠加 100 会员积分抵现 ¥10，下单同步获赠 +40 积分' },
      { icon: '✅', title: '明码标价 · 持牌担保结算', desc: '支持微信/支付宝在线支付，7 天无忧售后保障' },
    ]
  }
  if (venue.value) {
    return [
      { icon: '🏟️', title: `${venue.value.courts.length} 片专业网球场地` },
      { icon: '🅿️', title: `联动锁位 · ${venue.value.parkingName}` },
      { icon: '🕒', title: `每日开放 ${venue.value.openHours}` },
      { icon: '🛡️', title: '开场前 2 小时免费退改' },
    ]
  }
  if (detail.value?.kind === 'cinema') {
    return [
      { icon: '🎬', title: 'IMAX 巨幕 & 杜比激光厅', desc: `今日热映 ${CINEMA_MOVIES.length} 部院线大片，在线实时选座出票` },
      { icon: '🎾', title: '距文峰公园球场仅 500m', desc: '打完夜场球步行 6 分钟直达文峰广场 4 楼放松观影' },
      { icon: '🅿️', title: '凭影票免费停车 3 小时', desc: '文峰广场地下车库直达电梯，停车充电一体便利' },
      { icon: '🎫', title: '京山网球会员特惠票价', desc: '在线购票立享会员专享价，并累计 +30 金网积分' },
    ]
  }
  const tags = place.value?.tags ?? []
  const highlights = place.value?.highlights ?? []
  return [
    { icon: '🏅', title: '京山官方认证推荐点位', desc: tags.slice(0, 3).join(' · ') || '明码标价、实景核验、品质服务保障' },
    { icon: '🕒', title: `开放时间：${place.value?.openHours ?? '08:30 – 21:30'}`, desc: place.value?.priceInfo ?? '支持凭京山网球电子票根享受专属礼遇' },
    { icon: '✨', title: '核心体验亮点', desc: highlights[0] ?? place.value?.subtitle ?? '深受本地市民与外地球友好评' },
    { icon: '🧭', title: '一键精准导航与票根互通', desc: place.value?.navTip ?? '支持高德/百度地图直达导航，消费同步累积积分' },
  ]
})

// Amenities / Params list (2-column grid)
const amenitiesList = computed<{ icon: string; label: string }[]>(() => {
  if (hotel.value) {
    return hotel.value.facilities.map((f) => ({ icon: '✓', label: f }))
  }
  if (product.value) {
    return [
      ...product.value.params.map((p) => ({ icon: '•', label: `${p.k}：${p.v}` })),
      ...product.value.highlights.map((h) => ({ icon: '✓', label: h })),
    ]
  }
  if (venue.value) {
    return [...venue.value.amenities, ...venue.value.tags].map((a) => ({ icon: '✓', label: a }))
  }
  if (detail.value?.kind === 'cinema') {
    return [
      { icon: '✓', label: 'IMAX 巨幕激光放映系统' },
      { icon: '✓', label: '杜比全景声沉浸音效' },
      { icon: '✓', label: '真皮电动按摩观影座椅' },
      { icon: '✓', label: '凭影票免费停车 3 小时' },
      { icon: '✓', label: '免费 3D 眼镜借用服务' },
      { icon: '✓', label: '线上极速退改与扫码取票' },
    ]
  }
  const items = [
    ...(place.value?.tags ?? []),
    ...(place.value?.highlights ?? []),
  ]
  if (items.length === 0) {
    return [
      { icon: '✓', label: '京山官方实景核验认证' },
      { icon: '✓', label: '电子票根直享联盟优惠' },
      { icon: '✓', label: '支持高德/百度精准导航' },
      { icon: '✓', label: '12345 城运服务监管保障' },
    ]
  }
  return items.map((t) => ({ icon: '✓', label: t }))
})

const visibleAmenities = computed(() =>
  showAllAmenities.value ? amenitiesList.value : amenitiesList.value.slice(0, 8),
)

// Airbnb 6-Category Rating Breakdown (tailored per domain!)
const ratingCategories = computed<{ label: string; score: string; icon: string }[]>(() => {
  const base = displayRating.value
  const s1 = base.toFixed(1)
  const s2 = Math.min(5, base + 0.05).toFixed(1)
  const s3 = Math.max(4.6, base - 0.1).toFixed(1)

  if (product.value) {
    return [
      { label: '品质口感', score: s2, icon: 'star' },
      { label: '如实描述', score: s1, icon: 'check' },
      { label: '包装完好', score: s2, icon: 'box' },
      { label: '发货速度', score: s1, icon: 'bolt' },
      { label: '售后沟通', score: s1, icon: 'chat' },
      { label: '高性价比', score: s3, icon: 'tag' },
    ]
  }
  if (venue.value) {
    return [
      { label: '场地质量', score: s2, icon: 'star' },
      { label: '灯光环境', score: s1, icon: 'check' },
      { label: '停车便利', score: s2, icon: 'map' },
      { label: '入场便捷', score: s1, icon: 'key' },
      { label: '服务响应', score: s1, icon: 'chat' },
      { label: '高性价比', score: s3, icon: 'tag' },
    ]
  }
  return [
    { label: '干净卫生', score: s2, icon: 'star' },
    { label: '如实描述', score: s1, icon: 'check' },
    { label: '体验便捷', score: s2, icon: 'key' },
    { label: '沟通顺畅', score: s1, icon: 'chat' },
    { label: '地段优越', score: s2, icon: 'map' },
    { label: '高性价比', score: s3, icon: 'tag' },
  ]
})

// Airbnb Guest Mention Chips
const guestMentions = computed(() => {
  if (product.value) {
    return [
      { icon: '🌾', label: '产地正宗', count: 46 },
      { icon: '📦', label: '物流很快', count: 38 },
      { icon: '🎁', label: '送礼体面', count: 29 },
      { icon: '💰', label: '性价比高', count: 24 },
      { icon: '🎫', label: '票根划算', count: 19 },
    ]
  }
  if (venue.value) {
    return [
      { icon: '🎾', label: '场地专业', count: 64 },
      { icon: '💡', label: '灯光敞亮', count: 42 },
      { icon: '🅿️', label: '停车方便', count: 35 },
      { icon: '✨', label: '环境整洁', count: 28 },
      { icon: '💰', label: '价格亲民', count: 22 },
    ]
  }
  return [
    { icon: '📍', label: '地段便利', count: 52 },
    { icon: '✨', label: '洁净舒适', count: 41 },
    { icon: '🎾', label: '距球场近', count: 36 },
    { icon: '💰', label: '性价比高', count: 27 },
    { icon: '🏅', label: '票根实惠', count: 23 },
    { icon: '🤝', label: '服务热情', count: 18 },
  ]
})

// Unified structured reviews list
const allReviews = computed(() => {
  const list: { user: string; origin: string; score: number; date: string; meta?: string; content: string }[] = [
    ...localReviews.value,
  ]
  if (hotel.value) {
    for (const r of hotel.value.reviews) {
      list.push({ user: r.user, origin: '实名住客', score: r.score, date: '2026年11月', meta: r.room, content: r.content })
    }
  } else if (product.value) {
    for (const r of product.value.reviews) {
      list.push({ user: r.user, origin: '已购买家', score: r.score, date: r.date, meta: r.spec, content: r.content })
    }
  } else if (venue.value) {
    list.push(
      { user: '武汉球友陈先生', origin: '武汉', score: 5.0, date: '2026年11月', meta: '标准硬地场', content: venue.value.quote },
      { user: '京山老球友周姐', origin: '京山', score: 4.9, date: '2026年11月', meta: '夜场灯光', content: '场地维护非常平整，晚上照明不刺眼，订场同步锁好车位和充电桩太省心了！' },
      { user: '长沙参赛家长', origin: '长沙', score: 4.9, date: '2026年11月', meta: '中青赛期间', content: '带孩子来京山比赛，周边餐饮住宿都很近，志愿者和场馆工作人员都很热情。' },
      { user: '深圳球友Alex', origin: '深圳', score: 5.0, date: '2026年10月', meta: '周末打球', content: '价格比一线城市实惠太多，球场氛围一流，真正名副其实的中国网球之城。' },
    )
  } else if (detail.value?.kind === 'cinema') {
    list.push(
      { user: '文峰夜打球友', origin: '京山', score: 5.0, date: '2026年11月', meta: 'IMAX 激光厅', content: '打完球走几分钟就能看一场 IMAX，座椅舒服画质清晰，票价还享会员优惠！' },
      { user: '武汉游客林女士', origin: '武汉', score: 4.9, date: '2026年11月', meta: '杜比全景声厅', content: '带小朋友看完球赛来看动画电影，文峰广场停车免费 3 小时很方便。' },
    )
  } else if (place.value) {
    for (const rev of place.value.reviews) {
      if (typeof rev === 'string') {
        list.push({ user: '实名认证游客', origin: '湖北', score: 4.9, date: '2026年11月', content: rev })
      } else {
        const r = rev as LightboxReview
        list.push({
          user: r.user,
          origin: r.origin ?? '实名球友',
          score: r.score ?? 4.9,
          date: r.date ?? '2026年11月',
          content: r.content,
        })
      }
    }
  }
  if (list.length < 2) {
    list.push({
      user: '荆门球友小张',
      origin: '荆门',
      score: 4.9,
      date: '2026年11月',
      content: '整体体验超出预期，信息公开透明、明码标价，出示京山网球电子票根核销非常顺畅！',
    })
  }
  return list
})

const MENTION_KEYWORDS: Record<string, string[]> = {
  地段便利: ['近', '分钟', '步行', '直达', '便利', '方便', '旁边'],
  洁净舒适: ['干净', '整洁', '舒服', '舒适', '温泉', '环境'],
  距球场近: ['球场', '打球', '夜场', '赛场', '网球', '中青赛'],
  性价比高: ['实惠', '划算', '便宜', '省', '折', '减', '价格', '性价比'],
  票根实惠: ['票根', '优惠', '折', '减', '送', '免费', '积分'],
  服务热情: ['热情', '耐心', '周到', '细致', '放心', '实在', '服务'],
  场地专业: ['场地', '平整', '规范', '红土', '硬地', '专业'],
  灯光敞亮: ['灯光', '夜场', '照明', '不刺眼'],
  停车方便: ['停车', '车位', '充电', '车库'],
  环境整洁: ['整洁', '维护', '环境', '氛围'],
  价格亲民: ['价格', '实惠', '划算', '免费'],
  产地正宗: ['正宗', '产地', '香', '地道', '桥米', '原生'],
  物流很快: ['快递', '寄', '包邮', '物流', '发货'],
  送礼体面: ['礼盒', '送礼', '包装', '体面', '伴手礼'],
  票根划算: ['票根', '优惠', '减', '划算', '积分'],
}

const displayedReviews = computed(() => {
  const tag = activeMentionTag.value
  if (!tag) return allReviews.value
  const kws = MENTION_KEYWORDS[tag] ?? [tag]
  const matched = allReviews.value.filter((r) =>
    kws.some((k) => r.content.includes(k) || (r.meta ?? '').includes(k)),
  )
  return matched.length > 0 ? matched : allReviews.value
})

watch(
  displayTitle,
  (t) => {
    if (t && detail.value) {
      document.title = `${t} - 京山网球`
    }
  },
  { immediate: true },
)

function submitLocalReview() {
  if (!newReviewText.value.trim()) {
    showToast('请先输入您的评价内容')
    return
  }
  localReviews.value.unshift({
    user: '林先生',
    origin: state.origin.slice(0, 2),
    score: newReviewRating.value,
    date: '刚刚',
    content: newReviewText.value.trim(),
  })
  state.points += 20
  newReviewText.value = ''
  showReviewForm.value = false
  showToast('真实评价发布成功！获赠 +20 金网积分')
}

// Price headline for sticky nav & right card
const headlinePriceText = computed(() => {
  if (hotel.value && selectedRoom.value) {
    if (!roomQuantity.value) return { main: `¥${selectedRoom.value.eventPrice}`, sub: selectedRoom.value.leaseUnit ?? ' / 晚' }
    const unit = selectedRoomIsLongStay.value ? selectedRoom.value.leaseUnit : ` / ${hotelNights.value} 晚`
    return { main: `¥${hotelTotalPrice.value}`, sub: unit }
  }
  if (product.value) {
    return { main: `¥${prodUnitPrice.value}`, sub: ' 会员专享价' }
  }
  if (venue.value) {
    return venueSlotDetails.value.length > 0
      ? { main: `¥${venueFinalPay.value}`, sub: ` / 已选 ${venueSlotDetails.value.length} 小时` }
      : { main: venue.value.minPrice === 0 ? '免费' : `¥${venue.value.minPrice}`, sub: ' / 小时起' }
  }
  if (detail.value?.kind === 'cinema') {
    return cinemaSeats.value.length > 0
      ? { main: `¥${cinemaShowtime.value.memberPrice * cinemaSeats.value.length}`, sub: ` / ${cinemaSeats.value.length} 张票` }
      : { main: `¥${cinemaShowtime.value.memberPrice}`, sub: ' / 张起' }
  }
  if (placeUnitPrice.value > 0) {
    return { main: `¥${placeUnitPrice.value}`, sub: place.value?.priceUnit ?? ' / 份起' }
  }
  return { main: place.value?.priceInfo ?? '公益/免费预约', sub: '' }
})

const optionsTabLabel = computed(() => {
  if (hotel.value) return '选择房型'
  if (product.value) return '选择规格'
  if (venue.value) return '选场预约'
  if (detail.value?.kind === 'cinema') return '排片选座'
  if (placeMenuDishes.value.length > 0) return '招牌菜单'
  if (place.value?.actionKind === 'club') return '在售课程'
  if (place.value?.actionKind === 'rehab') return '理疗项目'
  return '特色推荐'
})

const isFavorited = computed(() => state.favorites.includes(displayTitle.value))
const isTourDetail = computed(() => place.value?.actionKind === 'spot' || place.value?.actionKind === 'package')

function shareCurrentDetail() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
  }
  showToast(`已复制「${displayTitle.value}」详情页链接，可发送给球友`)
}

function triggerPrimaryNav() {
  openNavigation({
    placeName: displayTitle.value,
    address: displayAddress.value,
    lng: displayCoords.value.lng,
    lat: displayCoords.value.lat,
    distance: hotel.value?.distanceToCourt ?? (venue.value ? `${venue.value.distanceKm} km` : place.value?.distance ?? '京山核心区'),
    driveMin: place.value?.driveMin ?? '约 6 分钟',
    tip: place.value?.navTip ?? '支持高德/百度地图一键唤起导航，已关联周边停车场',
  })
}
</script>

<template>
  <div v-if="detail" class="dp-page" :class="{ 'dp-tour-page': isTourDetail }">
    <!-- 1. Scroll-Activated Sticky Anchor Sub-Nav (matches Airbnb sticky nav) -->
    <div v-if="showStickyBar" class="dp-sticky-nav">
      <div class="dp-container dp-sticky-inner">
        <div class="dp-sticky-tabs">
          <button
            type="button"
            class="dp-anchor-tab"
            :class="{ active: activeAnchor === 'dp-photos' }"
            @click="scrollToSection('dp-photos')"
          >
            照片
          </button>
          <button
            type="button"
            class="dp-anchor-tab"
            :class="{ active: activeAnchor === 'dp-options' }"
            @click="scrollToSection('dp-options')"
          >
            {{ optionsTabLabel }}
          </button>
          <button
            type="button"
            class="dp-anchor-tab"
            :class="{ active: activeAnchor === 'dp-amenities' }"
            @click="scrollToSection('dp-amenities')"
          >
            配套设施
          </button>
          <button
            type="button"
            class="dp-anchor-tab"
            :class="{ active: activeAnchor === 'dp-location' }"
            @click="scrollToSection('dp-location')"
          >
            位置与交通
          </button>
          <button
            type="button"
            class="dp-anchor-tab"
            :class="{ active: activeAnchor === 'dp-reviews' }"
            @click="scrollToSection('dp-reviews')"
          >
            真实评价
          </button>
          <button
            type="button"
            class="dp-anchor-tab"
            :class="{ active: activeAnchor === 'dp-policies' }"
            @click="scrollToSection('dp-policies')"
          >
            预订须知
          </button>
        </div>

        <div class="dp-sticky-cta-group">
          <div class="dp-sticky-price">
            <strong>{{ headlinePriceText.main }}</strong>
            <span>{{ headlinePriceText.sub }}</span>
            <div class="dp-sticky-rating">★ {{ displayRating.toFixed(1) }} · {{ displayReviewCount }} 条评价</div>
          </div>
          <button type="button" class="dp-cta-pill" @click="scrollToSection(isTourDetail ? 'dp-booking' : 'dp-options')">
            {{ isTourDetail ? '预约游览' : optionsTabLabel }}
          </button>
        </div>
      </div>
    </div>

    <div class="dp-container">
      <!-- 2. Top Breadcrumb & Back Bar -->
      <div class="dp-breadcrumb-bar">
        <button type="button" class="dp-back-btn" @click="closeDetailPage">
          ← 返回{{ moduleMeta.shortName }}
        </button>
        <div class="dp-crumb-trail">
          <span class="dp-crumb-link" @click="switchModule(1)">京山网球首页</span>
          <span>/</span>
          <span class="dp-crumb-link" @click="closeDetailPage">{{ moduleMeta.shortName }}</span>
          <span>/</span>
          <span class="dp-crumb-cur">{{ displayTitle }}</span>
        </div>
      </div>

      <!-- 3. Title & Inline Share / Save Bar -->
      <div class="dp-title-bar">
        <div class="dp-title-left">
          <span class="tag green" style="margin-bottom: 8px">{{ displayCategory }}</span>
          <h1 class="dp-h1">{{ displayTitle }}</h1>
        </div>
        <div class="dp-title-actions">
          <button type="button" class="dp-inline-action" @click="shareCurrentDetail">
            <span>🔗</span>
            <span>分享</span>
          </button>
          <button type="button" class="dp-inline-action" @click="toggleFavorite(displayTitle)">
            <span>{{ isFavorited ? '❤️' : '🤍' }}</span>
            <span>{{ isFavorited ? '已收藏' : '收藏' }}</span>
          </button>
        </div>
      </div>

      <section v-if="isTourDetail && place" class="dp-tour-overview" aria-label="游览信息">
        <div class="dp-tour-facts">
          <div class="dp-tour-summary">
            <p>{{ displaySubtitle }}</p>
            <button type="button" class="dp-rating-anchor" @click="scrollToSection('dp-reviews')">
              <strong>★ {{ displayRating.toFixed(1) }}</strong>
              <span>· {{ displayReviewCount }} 条评价</span>
            </button>
          </div>
          <dl>
            <div v-if="place.openHours">
              <dt>{{ place.actionKind === 'package' ? '出发时间' : '开放时间' }}</dt>
              <dd>{{ place.openHours }}</dd>
            </div>
            <div>
              <dt>{{ place.actionKind === 'package' ? '集合地点' : '景点位置' }}</dt>
              <dd>{{ displayAddress }}<span v-if="place.distance && place.actionKind === 'spot'"> · {{ place.distance }}</span></dd>
            </div>
          </dl>
        </div>
        <div class="dp-tour-actions">
          <p class="dp-tour-price"><strong>{{ headlinePriceText.main }}</strong><small>{{ headlinePriceText.sub }}</small></p>
          <div class="flex-row">
            <button type="button" class="btn-primary" @click="scrollToSection('dp-booking')">{{ place.actionKind === 'package' ? '预约套餐' : '预约游览' }}</button>
            <button type="button" class="btn-ghost" @click="triggerPrimaryNav">导航</button>
          </div>
        </div>
      </section>

      <!-- 4. 5-Photo Mosaic Gallery (Airbnb 50% Hero + 2x2 Grid) -->
      <section id="dp-photos" class="dp-gallery">
        <div class="dp-gallery-hero" @click="activePhotoIndex = 0; showAllPhotosModal = true">
          <img :src="galleryPhotos[0]" :alt="displayTitle" />
        </div>
        <div class="dp-gallery-grid">
          <div
            v-for="(img, idx) in galleryPhotos.slice(1, 5)"
            :key="`${img}-${idx}`"
            class="dp-gallery-cell"
            @click="activePhotoIndex = idx + 1; showAllPhotosModal = true"
          >
            <img :src="img" :alt="`${displayTitle} 实景图 ${idx + 2}`" />
          </div>
        </div>
        <button
          type="button"
          class="dp-show-photos-btn"
          @click="activePhotoIndex = 0; showAllPhotosModal = true"
        >
          ⊞ 显示所有照片
        </button>
      </section>

      <!-- 5. Two-Column Main Body (Left Details ~60% + Right Sticky Booking Card ~36%) -->
      <div :id="isTourDetail ? 'dp-booking' : undefined" class="dp-main-split">
        <!-- ===== LEFT DETAILS COLUMN ===== -->
        <div class="dp-left-col">
          <!-- Subtitle & Rating Strip -->
          <div v-if="!isTourDetail" class="dp-section-block dp-intro-head">
            <h2 class="dp-h2">{{ displaySubtitle }}</h2>
            <div class="dp-rating-strip">
              <button type="button" class="dp-rating-anchor" @click="scrollToSection('dp-reviews')">
                <strong>★ {{ displayRating.toFixed(1) }}</strong>
                <span>· {{ displayReviewCount }} 条评价</span>
              </button>
              <span class="dp-benefit-badge">🎫 京山官方认证 · 电子票根专享礼遇</span>
            </div>
          </div>

          <div v-if="!isTourDetail" class="dp-section-block">
            <div class="dp-highlights-list" :class="{ 'dp-highlights-compact': venue }">
              <div v-for="hl in featureHighlights" :key="hl.title" class="dp-highlight-row">
                <div class="dp-hl-icon">{{ hl.icon }}</div>
                <div>
                  <h3 class="dp-hl-title">{{ hl.title }}</h3>
                  <p v-if="hl.desc" class="dp-hl-desc">{{ hl.desc }}</p>
                </div>
              </div>
            </div>
          </div>

          <section v-if="isTourDetail" id="dp-about" class="dp-section-block">
            <h2 class="dp-h2" style="margin-bottom: 8px">{{ place?.actionKind === 'package' ? '行程介绍' : '景点介绍' }}</h2>
            <p class="dp-about-text">{{ displayIntro }}</p>
          </section>

          <!-- Primary Domain Options Block (#dp-options) -->
          <section id="dp-options" class="dp-section-block">
            <!-- A. HOTEL: 选择房型 -->
            <template v-if="hotel">
              <h2 class="dp-h2" style="margin-bottom: 18px">选择房型</h2>
              <div class="dp-room-stack">
                <div
                  v-for="rm in showAllRooms ? hotel.rooms : hotel.rooms.slice(0, 4)"
                  :key="rm.id"
                  class="dp-room-card"
                  :class="{ active: selectedRoom?.id === rm.id }"
                  @click="selectedRoomId = rm.id"
                >
                  <img :src="hotel.photo" :alt="rm.name" class="dp-room-thumb" />
                  <div class="dp-room-body">
                    <div class="flex-between" style="align-items: flex-start">
                      <div>
                        <h3 class="dp-room-name">{{ rm.name }}</h3>
                        <div class="dp-room-meta">{{ rm.area }} · {{ rm.bed }} · {{ rm.breakfast }}</div>
                      </div>
                      <span class="tag orange">余 {{ rm.remaining }} 间</span>
                    </div>
                    <div class="dp-room-cancel">{{ rm.cancelRule }}</div>
                    <div class="flex-between" style="margin-top: 10px">
                      <div>
                        <strong class="dp-room-price">
                          {{ roomQuantity ? `¥${rm.eventPrice * roomQuantity * (rm.leaseUnit === '/月' || rm.leaseUnit === '/周' ? 1 : hotelNights)}` : '—' }}
                        </strong>
                        <span class="dp-room-unit">
                          {{ rm.leaseUnit ? rm.leaseUnit : ` / ${hotelNights} 晚` }}
                        </span>
                        <s class="dp-room-orig">¥{{ rm.originalPrice }}</s>
                      </div>
                      <button
                        type="button"
                        :class="selectedRoom?.id === rm.id ? 'btn-orange' : 'btn-primary'"
                        @click.stop="selectedRoomId = rm.id; submitHotelBooking(rm)"
                      >
                        预订此房型
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button
                v-if="hotel.rooms.length > 4"
                type="button"
                class="dp-outline-btn"
                style="margin-top: 14px"
                @click="showAllRooms = !showAllRooms"
              >
                {{ showAllRooms ? '收起部分房型' : `显示全部 ${hotel.rooms.length} 种房型` }}
              </button>
            </template>

            <!-- B. PRODUCT: 选择规格 -->
            <template v-else-if="product">
              <h2 class="dp-h2" style="margin-bottom: 18px">选择规格与包装</h2>
              <div class="dp-room-stack">
                <div
                  v-for="(sp, idx) in product.specs"
                  :key="sp.label"
                  class="dp-room-card"
                  :class="{ active: selectedSpecIdx === idx }"
                  @click="selectedSpecIdx = idx"
                >
                  <img :src="product.photo" :alt="sp.label" class="dp-room-thumb" />
                  <div class="dp-room-body">
                    <div class="flex-between">
                      <h3 class="dp-room-name">{{ sp.label }}</h3>
                      <span v-if="selectedSpecIdx === idx" class="tag green">当前已选</span>
                    </div>
                    <div class="dp-room-meta">{{ product.originPlace }} · {{ product.shipping }}</div>
                    <div class="flex-between" style="margin-top: 12px">
                      <div>
                        <strong class="dp-room-price">¥{{ Math.max(19, product.memberPrice + sp.addPrice) }}</strong>
                        <span class="dp-room-unit"> 会员价</span>
                      </div>
                      <button
                        type="button"
                        :class="selectedSpecIdx === idx ? 'btn-orange' : 'btn-ghost'"
                        @click.stop="selectedSpecIdx = idx"
                      >
                        {{ selectedSpecIdx === idx ? '✓ 已选该规格' : '选择此规格' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- C. VENUE: 7日日期 + 场地×小时矩阵 -->
            <template v-else-if="venue">
              <div class="flex-between" style="margin-bottom: 14px">
                <h2 class="dp-h2">选择预约日期与场地时段</h2>
                <div class="flex-row" style="font-size: 13px; color: var(--ink-2)">
                  <span class="slot-legend-dot free" /> 可约
                  <span class="slot-legend-dot picked" /> 已选
                  <span class="slot-legend-dot busy" /> 已订
                </div>
              </div>

              <div class="date-strip-7 mb-16">
                <button
                  v-for="d in BOOKING_DATES"
                  :key="d.iso"
                  type="button"
                  class="date-chip"
                  :class="{ active: venueDate === d.iso }"
                  @click="venueDate = d.iso"
                >
                  <strong>{{ d.weekday }}</strong>
                  <span>{{ d.shortDate }}</span>
                </button>
              </div>

              <div class="court-matrix-wrap mb-16">
                <table class="court-matrix">
                  <thead>
                    <tr>
                      <th style="width: 150px; text-align: left">场地 / 时段</th>
                      <th v-for="h in COURT_HOURS" :key="h">{{ h }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="ct in venue.courts" :key="ct.id">
                      <td class="court-matrix-name">
                        <strong>{{ ct.name }}</strong>
                        <span>{{ ct.surface }} · {{ ct.env }}</span>
                      </td>
                      <td v-for="h in COURT_HOURS" :key="h" style="padding: 3px">
                        <button
                          type="button"
                          class="matrix-cell"
                          :class="{
                            busy: isOccupied(ct.id, h),
                            picked: venueCells.includes(`${ct.id}|${h}`),
                            free: !isOccupied(ct.id, h) && !venueCells.includes(`${ct.id}|${h}`),
                          }"
                          :disabled="isOccupied(ct.id, h)"
                          @click="toggleVenueCell(ct, h)"
                        >
                          <template v-if="isOccupied(ct.id, h)">已订</template>
                          <template v-else-if="getCellPrice(ct, h).member === 0">免费</template>
                          <template v-else>¥{{ getCellPrice(ct, h).member }}</template>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="selected-slots-bar">
                <div style="font-size: 14px; font-weight: 800; margin-bottom: 6px">
                  已选时段（{{ venueSlotDetails.length }} 小时）：
                </div>
                <div v-if="venueSlotDetails.length === 0" style="font-size: 13.5px; color: var(--ink-3)">
                  点击上方空闲时段即可选中，支持连续或多片场地同时预订
                </div>
                <div v-else class="flex-row" style="gap: 8px">
                  <span
                    v-for="s in venueSlotDetails"
                    :key="`${s.courtId}-${s.hour}`"
                    class="tag green"
                    style="cursor: pointer"
                    @click="venueCells = venueCells.filter((k) => k !== `${s.courtId}|${s.hour}`)"
                  >
                    {{ s.courtName }} {{ formatHourRange(s.hour) }}（¥{{ s.memberPrice }}）✕
                  </span>
                </div>
              </div>
            </template>

            <!-- D. CINEMA: 选影片、排片与选座 -->
            <template v-else-if="detail.kind === 'cinema'">
              <h2 class="dp-h2" style="margin-bottom: 16px">选择今日热映影片与座位</h2>
              <div class="grid-3 mb-16" style="gap: 12px">
                <div
                  v-for="(m, idx) in CINEMA_MOVIES"
                  :key="m.id"
                  class="dp-cinema-movie"
                  :class="{ active: cinemaMovieIdx === idx }"
                  @click="cinemaMovieIdx = idx; cinemaShowtimeIdx = 0; cinemaSeats = []"
                >
                  <div class="photo-box" style="height: 112px">
                    <img :src="m.poster" :alt="m.title" />
                    <span class="badge-tl">★ {{ m.score }}</span>
                  </div>
                  <div style="padding: 10px 12px">
                    <strong style="font-size: 15px; display: block">{{ m.title }}</strong>
                    <span style="font-size: 13px; color: var(--ink-3)">{{ m.duration }} · {{ m.genre }}</span>
                  </div>
                </div>
              </div>

              <div class="flex-row mb-16" style="gap: 8px">
                <button
                  v-for="(st, idx) in cinemaMovie.showtimes"
                  :key="st.id"
                  type="button"
                  class="filter-pill"
                  :class="{ active: cinemaShowtimeIdx === idx }"
                  @click="cinemaShowtimeIdx = idx; cinemaSeats = []"
                >
                  {{ st.time }} · {{ st.hall }}（¥{{ st.memberPrice }}）
                </button>
              </div>

              <div style="background: #f5f9f7; border: 1px solid var(--line); border-radius: 12px; padding: 18px">
                <div style="text-align: center; font-size: 13.5px; color: var(--ink-2); background: #dce7e2; padding: 6px; margin-bottom: 16px; font-weight: 700">
                  银幕方向 · {{ cinemaShowtime.hall }}
                </div>
                <div style="display: flex; flex-direction: column; gap: 9px; align-items: center">
                  <div v-for="r in cinemaRows" :key="r" style="display: flex; align-items: center; gap: 8px">
                    <span style="width: 20px; font-size: 13.5px; color: var(--ink-2); font-weight: 800">{{ r }}</span>
                    <button
                      v-for="c in cinemaCols"
                      :key="c"
                      type="button"
                      style="width: 38px; height: 32px; border-radius: 6px; border: 1px solid #c9dad3; font-size: 13px; font-weight: 700"
                      :style="
                        cinemaShowtime.takenSeats.includes(`${r}${c}`)
                          ? 'background: #D6DEDC; color: #8B9B95; cursor: not-allowed;'
                          : cinemaSeats.includes(`${r}${c}`)
                            ? 'background: #0D7A58; color: #fff; border-color: #0D7A58;'
                            : 'background: #fff; color: var(--ink-2);'
                      "
                      @click="toggleCinemaSeat(`${r}${c}`)"
                    >
                      {{ c }}
                    </button>
                  </div>
                </div>
                <div class="flex-between" style="font-size: 13px; color: var(--ink-2); margin-top: 14px; max-width: 340px; margin-inline: auto">
                  <span>⬜ 可选空座</span>
                  <span>🟩 已选座位</span>
                  <span>🩶 已售出</span>
                </div>
              </div>
            </template>

            <!-- E. PLACE: 招牌菜单 / 热门打卡项 / 语音导览 -->
            <template v-else-if="place">
              <!-- Embedded Audio Guide if available -->
              <div v-if="place.audioScript" class="dp-audio-box mb-18">
                <div class="flex-between" style="margin-bottom: 8px">
                  <strong style="font-size: 16.5px">🎧 官方语音导览讲解</strong>
                  <span class="tag green">建议游玩 {{ place.audioDuration ?? '2小时' }}</span>
                </div>
                <p style="font-size: 14.5px; color: var(--ink-2); line-height: 1.75; margin-bottom: 12px">
                  “{{ place.audioScript }}”
                </p>
                <div class="flex-between">
                  <button type="button" class="btn-primary" @click="audioPlaying = !audioPlaying">
                    {{ audioPlaying ? '⏸ 暂停讲解' : '▶ 播放语音导览' }}
                  </button>
                  <div style="flex: 1; margin: 0 16px; height: 6px; background: #d6e8e0; overflow: hidden">
                    <div :style="{ width: (audioPlaying ? 68 : audioProgress) + '%', height: '100%', background: 'var(--primary)', transition: 'width 0.5s ease' }" />
                  </div>
                  <span style="font-size: 13px; color: var(--ink-3)">支持息屏播放</span>
                </div>
              </div>

              <!-- Restaurant Full Menu Table if available -->
              <div v-if="placeMenuDishes.length > 0" class="mb-18">
                <h2 class="dp-h2" style="margin-bottom: 16px">招牌菜单与票根 85 折价</h2>
                <table class="clean-table" style="border: 1px solid var(--line)">
                  <thead>
                    <tr>
                      <th>菜品名称</th>
                      <th>门市价</th>
                      <th>票根专享价</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="d in placeMenuDishes" :key="d.name">
                      <td>
                        <strong>{{ d.name }}</strong>
                        <span v-if="d.tag" class="tag orange" style="margin-left: 8px">{{ d.tag }}</span>
                      </td>
                      <td><s>¥{{ d.price }}</s></td>
                      <td><strong style="color: var(--accent); font-size: 16px">¥{{ d.stubPrice }}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Hot Items / Highlights Cards -->
              <div v-if="place.hotItems?.length">
                <h2 class="dp-h2" style="margin-bottom: 16px">{{ place.hotItemsTitle ?? '核心必体验项目' }}</h2>
                <div class="dp-room-stack">
                  <div v-for="item in place.hotItems" :key="item.name" class="dp-hot-item-card">
                    <div class="flex-between" style="margin-bottom: 6px; gap: 12px">
                      <div class="flex-row" style="flex-wrap: wrap">
                        <strong style="font-size: 16.5px; color: var(--ink)">{{ item.name }}</strong>
                        <span v-if="item.tag" class="tag orange">{{ item.tag }}</span>
                      </div>
                      <div class="flex-row" style="gap: 10px; flex-shrink: 0">
                        <strong v-if="item.price" style="font-size: 17px; color: var(--accent)">{{ item.price }}</strong>
                        <button
                          v-if="place.actionKind === 'club' || place.actionKind === 'rehab' || place.actionKind === 'camp'"
                          type="button"
                          class="btn-primary"
                          style="padding: 6px 14px; font-size: 13px"
                          @click="bookPlaceHotItem(item)"
                        >
                          {{ place.actionKind === 'camp' ? '立即报名' : place.actionKind === 'rehab' ? '立即预约' : '立即预订' }}
                        </button>
                      </div>
                    </div>
                    <p v-if="item.desc" style="font-size: 14px; color: var(--ink-2); line-height: 1.65">{{ item.desc }}</p>
                  </div>
                </div>
              </div>
            </template>
          </section>

          <div v-if="!venue" class="dp-section-block">
            <div class="dp-guarantee-strip">
              <div class="flex-row" style="gap: 12px">
                <span style="font-size: 22px">🛡️</span>
                <div>
                  <strong style="font-size: 15.5px; color: var(--ink)">京山政务服务价格保障 · 明码标价</strong>
                  <div style="font-size: 13.5px; color: var(--ink-2); margin-top: 2px">
                    全市网球联盟商户均纳入市场监管与 12345 城运信用监督，价格公开透明、拒绝隐性消费。
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- About Section (#dp-about) -->
          <section v-if="!isTourDetail" id="dp-about" class="dp-section-block">
            <h2 class="dp-h2" style="margin-bottom: 14px">关于「{{ displayTitle }}」</h2>
            <p class="dp-about-text">{{ displayIntro }}</p>
          </section>

          <!-- Amenities / Specifications 2-Col Grid (#dp-amenities) -->
          <section id="dp-amenities" class="dp-section-block">
            <h2 class="dp-h2" style="margin-bottom: 18px">
              {{ product ? '商品参数与服务承诺' : '配套设施与服务' }}
            </h2>
            <div class="dp-amenities-grid">
              <div v-for="am in visibleAmenities" :key="am.label" class="dp-amenity-item">
                <span class="dp-amenity-ico">{{ am.icon }}</span>
                <span>{{ am.label }}</span>
              </div>
            </div>
            <button
              v-if="amenitiesList.length > 8"
              type="button"
              class="dp-outline-btn"
              style="margin-top: 18px"
              @click="showAllAmenities = !showAllAmenities"
            >
              {{ showAllAmenities ? '收起设施列表' : `显示所有 ${amenitiesList.length} 项设施与服务` }}
            </button>
          </section>
        </div>

        <!-- ===== RIGHT STICKY BOOKING / ACTION COLUMN ===== -->
        <aside class="dp-right-col">
          <!-- Top Promo Pill Card (matches Airbnb travel credit card) -->
          <div v-if="!isTourDetail" class="dp-promo-pill-card">
            <span style="font-size: 20px">🎫</span>
            <span>凭电子票根 <strong>{{ state.ticketStubCode }}</strong> 享联盟优待并累计积分</span>
          </div>

          <!-- Main Elevated Sticky Action Card -->
          <div class="dp-booking-card">
            <div class="dp-bc-header">
              <div>
                <strong class="dp-bc-price">{{ headlinePriceText.main }}</strong>
                <span class="dp-bc-unit">{{ headlinePriceText.sub }}</span>
              </div>
              <span class="dp-bc-rating">★ {{ displayRating.toFixed(1) }}</span>
            </div>

            <!-- HOTEL Right Card Form -->
            <template v-if="hotel">
              <div class="dp-unified-box">
                <div class="dp-ub-row-2">
                  <div class="dp-ub-cell">
                    <label>入住日期</label>
                    <select v-model="checkIn">
                      <option v-for="d in BOOKING_DATES.slice(0, 6)" :key="`ri-${d.iso}`" :value="d.iso">{{ d.shortDate }} {{ d.weekday }}</option>
                    </select>
                  </div>
                  <div class="dp-ub-cell">
                    <label>退房日期</label>
                    <select v-model="checkOut">
                      <option v-for="d in hotelCheckOutOptions" :key="`ro-${d.iso}`" :value="d.iso">{{ d.shortDate }} {{ d.weekday }}</option>
                    </select>
                  </div>
                </div>
                <div class="dp-ub-row-2">
                  <div class="dp-ub-cell">
                    <label for="hotel-room-count">{{ selectedRoomIsLongStay ? '预订套数' : '房间数量' }}</label>
                    <input
                      id="hotel-room-count"
                      v-model.number="roomCount"
                      class="dp-ub-input booking-quantity"
                      type="number"
                      min="1"
                      :max="selectedRoom?.remaining"
                      step="1"
                    />
                  </div>
                  <div class="dp-ub-cell">
                    <label>已选房型</label>
                    <div class="dp-ub-static" :title="selectedRoom?.name">{{ selectedRoom?.name }}</div>
                  </div>
                </div>
              </div>

              <button type="button" class="dp-bc-cta" :disabled="!canBookSelectedRoom" @click="submitHotelBooking()">
                {{ canBookSelectedRoom ? `立即预订（¥${hotelTotalPrice}）` : selectedRoom?.remaining ? `请输入 1 至 ${selectedRoom.remaining} 的预订数量` : '该房型已订满' }}
              </button>
              <div class="dp-bc-note">官方担保预订 · 入住前支持免费取消</div>

              <div v-if="canBookSelectedRoom" class="dp-bc-breakdown">
                <div class="flex-between">
                  <span>单价 ¥{{ selectedRoom?.eventPrice }} × {{ selectedRoomIsLongStay ? `${roomCount}套` : `${hotelNights}晚 × ${roomCount}间` }}</span>
                  <span>¥{{ hotelTotalPrice }}</span>
                </div>
                <div class="flex-between dp-bc-total">
                  <strong>总计（票根专享价）</strong>
                  <strong>¥{{ hotelTotalPrice }}</strong>
                </div>
              </div>
            </template>

            <!-- PRODUCT Right Card Form -->
            <template v-else-if="product">
              <div class="dp-unified-box">
                <div class="dp-ub-row-2">
                  <div class="dp-ub-cell">
                    <label>当前规格</label>
                    <div class="dp-ub-static">{{ product.specs[selectedSpecIdx]?.label.slice(0, 12) }}</div>
                  </div>
                  <div class="dp-ub-cell">
                    <label>购买数量</label>
                    <div class="flex-between" style="margin-top: 2px">
                      <button type="button" class="dp-qty-btn" @click="prodQty = Math.max(1, prodQty - 1)">−</button>
                      <strong style="font-size: 15px">{{ prodQty }}</strong>
                      <button type="button" class="dp-qty-btn" @click="prodQty++">+</button>
                    </div>
                  </div>
                </div>
                <div class="dp-ub-cell dp-ub-full">
                  <label>快递收货地址</label>
                  <input v-model="prodAddr" class="dp-ub-input" />
                </div>
              </div>

              <div class="dp-check-list">
                <label class="dp-check-row">
                  <span><input v-model="prodUseStub" type="checkbox" /> 票根满 ¥150 减 ¥30</span>
                  <strong style="color: var(--accent)">{{ prodStubOff > 0 ? `-¥${prodStubOff}` : '未满' }}</strong>
                </label>
                <label v-if="state.points >= 100" class="dp-check-row">
                  <span><input v-model="prodUsePoints" type="checkbox" /> 100 积分抵现 ¥10</span>
                  <strong style="color: var(--primary)">{{ prodPointsOff > 0 ? '-¥10' : '可用' }}</strong>
                </label>
              </div>

              <div class="grid-2" style="gap: 8px; margin-bottom: 14px">
                <button
                  type="button"
                  class="btn-ghost"
                  :style="prodPayMethod === 'wechat' ? 'border-color:#07C160;background:#EDFAF3;color:#068944;' : ''"
                  @click="prodPayMethod = 'wechat'"
                >
                  💚 微信支付
                </button>
                <button
                  type="button"
                  class="btn-ghost"
                  :style="prodPayMethod === 'alipay' ? 'border-color:#1677FF;background:#EEF5FF;color:#1677FF;' : ''"
                  @click="prodPayMethod = 'alipay'"
                >
                  💙 支付宝
                </button>
              </div>

              <button type="button" class="dp-bc-cta" @click="submitProductOrder">
                立即支付 ¥{{ prodFinalTotal }}
              </button>
              <div class="dp-bc-note">产地直发全国包邮 · 下单赠 +40 金网积分</div>
            </template>

            <!-- VENUE Right Card Form -->
            <template v-else-if="venue">
              <div class="dp-unified-box">
                <div class="dp-ub-row-2">
                  <div class="dp-ub-cell">
                    <label>打球日期</label>
                    <select v-model="venueDate">
                      <option v-for="d in BOOKING_DATES" :key="`vd-${d.iso}`" :value="d.iso">{{ d.shortDate }} {{ d.weekday }}</option>
                    </select>
                  </div>
                  <div class="dp-ub-cell">
                    <label>已选时段</label>
                    <div class="dp-ub-static" style="color: var(--primary)">{{ venueSlotDetails.length }} 小时</div>
                  </div>
                </div>
                <div class="dp-ub-cell dp-ub-full">
                  <label>会员折扣</label>
                  <div class="dp-ub-static">{{ memberTier.code }} {{ memberTier.name }}（{{ Math.round(memberTier.discount * 100) / 10 }}折）</div>
                </div>
              </div>

              <div class="dp-check-list">
                <label class="dp-check-row">
                  <span><input v-model="venueBookParking" type="checkbox" /> 联动 {{ venue.parkingName }}</span>
                  <span class="tag blue">免费</span>
                </label>
                <label class="dp-check-row">
                  <span><input v-model="venueBookCharger" type="checkbox" /> 联动 {{ venue.chargerName }}</span>
                  <span class="tag green">锁桩</span>
                </label>
                <label v-if="state.points >= 200" class="dp-check-row">
                  <span><input v-model="venueUsePoints" type="checkbox" /> 200 积分抵 ¥20</span>
                  <span class="tag gold">-¥20</span>
                </label>
              </div>

              <button type="button" class="dp-bc-cta" @click="submitVenueBooking">
                {{ venueSlotDetails.length > 0 ? `确认订场（¥${venueFinalPay}）` : '请先在左侧选择时段' }}
              </button>
              <div class="dp-bc-note">开场前 2 小时免费退改 · 完场赠 +50 积分/时</div>

              <div v-if="venueSlotDetails.length > 0" class="dp-bc-breakdown">
                <div class="flex-between">
                  <span>场地原价（{{ venueSlotDetails.length }}小时）</span>
                  <s>¥{{ venueOriginalSum }}</s>
                </div>
                <div class="flex-between dp-bc-total">
                  <strong>实付金额</strong>
                  <strong>¥{{ venueFinalPay }}</strong>
                </div>
              </div>
            </template>

            <!-- CINEMA Right Card Form -->
            <template v-else-if="detail.kind === 'cinema'">
              <div class="dp-unified-box">
                <div class="dp-ub-row-2">
                  <div class="dp-ub-cell">
                    <label>所选影片</label>
                    <div class="dp-ub-static">《{{ cinemaMovie.title }}》</div>
                  </div>
                  <div class="dp-ub-cell">
                    <label>放映场次</label>
                    <div class="dp-ub-static">{{ cinemaShowtime.time }}</div>
                  </div>
                </div>
                <div class="dp-ub-cell dp-ub-full">
                  <label>已选座位</label>
                  <div class="dp-ub-static" style="color: var(--primary)">
                    {{ cinemaSeats.length ? cinemaSeats.join('、') : '请在左侧座位图点击选座' }}
                  </div>
                </div>
              </div>

              <button type="button" class="dp-bc-cta" @click="submitCinemaOrder">
                {{ cinemaSeats.length ? `确认出票（¥${cinemaShowtime.memberPrice * cinemaSeats.length}）` : '请选择座位' }}
              </button>
              <div class="dp-bc-note">影院扫码取票 · 凭影票免费停车 3 小时</div>
            </template>

            <!-- PLACE Right Card Form -->
            <template v-else-if="place">
              <div class="dp-unified-box">
                <div class="dp-ub-row-2">
                  <div class="dp-ub-cell">
                    <label>预约日期</label>
                    <select v-model="placeDate">
                      <option v-for="d in BOOKING_DATES" :key="`pd-${d.iso}`" :value="d.iso">{{ d.shortDate }} {{ d.weekday }}</option>
                    </select>
                  </div>
                  <div class="dp-ub-cell">
                    <label for="place-booking-count">{{ isRestaurantBooking ? '用餐人数' : '预约数量' }}</label>
                    <input
                      id="place-booking-count"
                      v-model.number="placeQty"
                      class="dp-ub-input booking-quantity"
                      type="number"
                      min="1"
                      :max="place.quantityLimit"
                      step="1"
                    />
                  </div>
                </div>
                <div class="dp-ub-cell dp-ub-full">
                  <label>时段选择</label>
                  <select v-model="placeSlot">
                    <option>上午 09:00-12:00</option>
                    <option>下午 14:00-17:00</option>
                    <option>晚间 17:30-21:00</option>
                  </select>
                </div>
              </div>

              <button type="button" class="dp-bc-cta" :disabled="!canBookPlace" @click="submitPlaceBooking">
                {{ !canBookPlace ? '请输入有效的预约数量' : isRestaurantBooking ? '免费预约桌位并绑定票根' : placeTotal > 0 ? `立即预约（¥${placeTotal}）` : '免费预约体验' }}
              </button>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px">
                <button type="button" class="btn-ghost" @click="triggerPrimaryNav">🧭 导航前往</button>
                <button
                  type="button"
                  class="btn-ghost"
                  @click="openActionModal({ type: 'stub', code: state.ticketStubCode })"
                >
                  🎫 电子票根
                </button>
              </div>
              <div class="dp-bc-note">官方认证点位 · 支持电子票根核销优惠</div>
            </template>
          </div>

          <!-- Report / 12345 Supervision Link -->
          <div style="text-align: center; margin-top: 16px">
            <button type="button" class="dp-report-link" @click="switchModule(11)">
              🚩 服务反馈与 12345 城运监督上报
            </button>
          </div>
        </aside>
      </div>

      <!-- 6. Full-Width Location & Transit Section (#dp-location) -->
      <section id="dp-location" class="dp-full-section">
        <div class="flex-between" style="margin-bottom: 10px">
          <h2 class="dp-h2">位置与交通</h2>
          <div class="flex-row">
            <MapViewToggle v-model="showLocationMap" />
            <button type="button" class="btn-primary" @click="triggerPrimaryNav">
              🧭 高德 / 百度一键导航
            </button>
          </div>
        </div>

        <MapResultsLayout
          v-if="showLocationMap"
          class="dp-location-results"
          :items="detailMapItems"
          selected-id="location"
          list-label="地图位置列表"
          empty-text="暂无位置信息"
          @select="detailMap?.showLocation()"
        >
          <DetailLocationMap
            ref="detailMap"
            :title="displayTitle"
            :address="displayAddress"
            :lat="displayCoords.lat"
            :lng="displayCoords.lng"
            :icon="detailLocationIcon"
            :photo="detailMapItems[0]?.photo"
            @navigate="triggerPrimaryNav"
          />
        </MapResultsLayout>
        <div v-else class="dp-location-address">
          <strong>地址</strong>
          <span>{{ displayAddress }}</span>
        </div>

        <!-- Airbnb-style Transit Strip -->
        <div v-if="!isTourDetail" class="dp-transit-box">
          <h3 class="dp-h3">交通方式</h3>
          <div class="dp-transit-row">
            <div class="flex-row" style="gap: 10px">
              <span>高铁站 · 京山南站</span>
              <span class="dp-transit-pill">高铁枢纽</span>
            </div>
            <span class="dp-transit-dist">约 6.5 公里（驾车 12 分钟）</span>
          </div>
          <div class="dp-transit-row">
            <div class="flex-row" style="gap: 10px">
              <span>核心赛场 · 京山国际网球中心</span>
              <span class="dp-transit-pill">网球地标</span>
            </div>
            <span class="dp-transit-dist">
              {{ hotel?.distanceToCourt ?? (venue ? `距您 ${venue.distanceKm} 公里` : place?.distance ?? '京山城区核心圈') }}
            </span>
          </div>
        </div>
      </section>

      <!-- 7. Full-Width Reviews Summary, 7-Column Breakdown, Mention Chips & 2-Column Grid (#dp-reviews) -->
      <section id="dp-reviews" class="dp-full-section">
        <div class="flex-between" style="margin-bottom: 24px">
          <h2 class="dp-h2" style="font-size: 24px">
            ★ {{ displayRating.toFixed(1) }} · {{ displayReviewCount }} 条真实评价
          </h2>
          <button type="button" class="dp-outline-btn" @click="showReviewForm = !showReviewForm">
            {{ showReviewForm ? '收起评价框' : '✏️ 写一条真实评价（+20分）' }}
          </button>
        </div>

        <!-- Inline Quick Review Composer -->
        <div v-if="showReviewForm" class="dp-review-composer mb-18">
          <div class="flex-between" style="margin-bottom: 10px">
            <strong style="font-size: 16px">发表您对「{{ displayTitle }}」的真实评价</strong>
            <div class="flex-row" style="gap: 4px">
              <button
                v-for="s in 5"
                :key="s"
                type="button"
                style="border: none; background: transparent; font-size: 22px"
                :style="{ color: s <= newReviewRating ? '#E2A227' : '#D2DCD8' }"
                @click="newReviewRating = s"
              >
                ★
              </button>
            </div>
          </div>
          <div style="display: flex; gap: 10px">
            <input
              v-model="newReviewText"
              class="f-input"
              placeholder="分享您的实际体验、设施洁净度、位置便利度或票根优惠感受…"
              @keyup.enter="submitLocalReview"
            />
            <button type="button" class="btn-orange" @click="submitLocalReview">提交评价</button>
          </div>
        </div>

        <!-- 7-Column Airbnb Rating Breakdown Strip -->
        <div class="dp-rating-breakdown">
          <!-- Col 1: 总体评分 5->1 bars -->
          <div class="dp-rb-overall">
            <div class="dp-rb-label">总体评分</div>
            <div class="dp-rb-bars">
              <div v-for="(pct, idx) in [86, 11, 3, 0, 0]" :key="idx" class="dp-rb-bar-row">
                <span>{{ 5 - idx }}</span>
                <div class="dp-rb-track">
                  <div class="dp-rb-fill" :style="{ width: `${pct}%` }" />
                </div>
              </div>
            </div>
          </div>

          <!-- Cols 2-7: 6 Category Scores -->
          <div v-for="cat in ratingCategories" :key="cat.label" class="dp-rb-cat">
            <div>
              <div class="dp-rb-label">{{ cat.label }}</div>
              <div class="dp-rb-score">{{ cat.score }}</div>
            </div>
            <div class="dp-rb-icon">
              <svg v-if="cat.icon === 'star'" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
              </svg>
              <svg v-else-if="cat.icon === 'check'" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <circle cx="12" cy="12" r="9" />
                <path d="M8.5 12.5l2.5 2.5 4.5-5" />
              </svg>
              <svg v-else-if="cat.icon === 'key'" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <circle cx="8" cy="15" r="4" />
                <path d="M11 12l9-9M17 6l3 3" />
              </svg>
              <svg v-else-if="cat.icon === 'chat'" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <svg v-else-if="cat.icon === 'map'" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" />
                <line x1="9" y1="3" x2="9" y2="18" />
                <line x1="15" y1="6" x2="15" y2="21" />
              </svg>
              <svg v-else-if="cat.icon === 'box'" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              <svg v-else-if="cat.icon === 'bolt'" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <svg v-else width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <circle cx="7" cy="7" r="1.2" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Guest Mentions Chips -->
        <div class="dp-mentions-wrap">
          <h3 class="dp-h3">球友与游客提到</h3>
          <div class="dp-mentions-row">
            <button
              v-for="m in guestMentions"
              :key="m.label"
              type="button"
              class="dp-mention-chip"
              :class="{ active: activeMentionTag === m.label }"
              @click="activeMentionTag = activeMentionTag === m.label ? null : m.label"
            >
              <span>{{ m.icon }}</span>
              <span>{{ m.label }}</span>
              <strong>{{ m.count }}</strong>
            </button>
          </div>
        </div>

        <!-- 2-Column Reviews Grid -->
        <div v-if="activeMentionTag" class="flex-between mb-12" style="background: #f4faf7; padding: 10px 14px; border: 1px solid #d5e8df">
          <span style="font-size: 14px; color: var(--primary-dark); font-weight: 700">
            已按「{{ activeMentionTag }}」展示相关评价（共 {{ displayedReviews.length }} 条）
          </span>
          <button type="button" class="btn-ghost" style="padding: 4px 10px; font-size: 13px" @click="activeMentionTag = null">
            显示全部评价
          </button>
        </div>
        <div class="dp-reviews-grid">
          <article v-for="(rev, idx) in displayedReviews" :key="`${rev.user}-${idx}`" class="dp-review-card">
            <div class="dp-rev-head">
              <div class="dp-rev-avatar">{{ rev.user.slice(0, 1) }}</div>
              <div>
                <h4 class="dp-rev-user">{{ rev.user }}</h4>
                <div class="dp-rev-origin">{{ rev.origin }}</div>
              </div>
            </div>
            <div class="dp-rev-stars">
              <span>★★★★★</span>
              <span>· {{ rev.date }}</span>
              <span v-if="rev.meta">· {{ rev.meta }}</span>
            </div>
            <p class="dp-rev-body">{{ rev.content }}</p>
          </article>
        </div>
      </section>

      <!-- 8. Full-Width Things to Know / Policies (#dp-policies) -->
      <section id="dp-policies" class="dp-full-section">
        <h2 class="dp-h2" style="margin-bottom: 22px">预订须知与服务保障</h2>
        <div class="dp-policies-grid">
          <div class="dp-policy-col">
            <div class="dp-policy-ico">🕒</div>
            <h3 class="dp-h3">{{ hotel ? '入住与退房时间' : '营业与服务时间' }}</h3>
            <p v-if="hotel">
              14:00 后办理入住，次日 12:00 前退房；赛事期间支持延退至 14:00。前台电话：{{ hotel.phone }}。
            </p>
            <p v-else-if="venue">
              每日开放 {{ venue.openHours }}，请提前 10 分钟到达场馆核销入场。咨询电话：{{ venue.phone }}。
            </p>
            <p v-else-if="product">
              每日 16:00 前下单当日原产地发出，全国顺丰/邮政直达，全程物流可追踪。
            </p>
            <p v-else>
              开放时间：{{ place?.openHours ?? '08:30 – 21:30' }}，建议提前线上预约避免高峰排队。
            </p>
          </div>

          <div class="dp-policy-col">
            <div class="dp-policy-ico">🔄</div>
            <h3 class="dp-h3">退改与票根规则</h3>
            <p v-if="hotel">
              {{ hotel.policies.join('；') }}
            </p>
            <p v-else>
              支持使用前免费取消并极速原路退款；到店或下单出示「京山网球」电子票根（{{ state.ticketStubCode }}）自动享受联盟折扣并累计会员积分。
            </p>
          </div>

          <div class="dp-policy-col">
            <div class="dp-policy-ico">🏛️</div>
            <h3 class="dp-h3">政务认证与消费监督</h3>
            <p>
              由京山市文旅局、市政数局、市场监管局联合保障，执行明码标价与信用红黑榜制度；如遇问题可随时一键直联 12345 城运中心快速处置。
            </p>
          </div>
        </div>
      </section>
    </div>

    <!-- Full-Screen Photo Album Viewer (triggered by "显示所有照片" or clicking any gallery photo) -->
    <div v-if="showAllPhotosModal" class="modal-backdrop" @click.self="showAllPhotosModal = false">
      <div class="dp-album-modal">
        <div class="flex-between" style="padding: 16px 24px; border-bottom: 1px solid var(--line)">
          <strong style="font-size: 18px">{{ displayTitle }} · 全部实景照片（{{ activePhotoIndex + 1 }} / {{ galleryPhotos.length }}）</strong>
          <button type="button" class="btn-ghost" @click="showAllPhotosModal = false">✕ 关闭相册</button>
        </div>
        <div class="dp-album-stage">
          <button
            type="button"
            class="dp-album-arrow"
            @click="activePhotoIndex = (activePhotoIndex - 1 + galleryPhotos.length) % galleryPhotos.length"
          >
            ‹
          </button>
          <img :src="galleryPhotos[activePhotoIndex]" :alt="displayTitle" class="dp-album-img" />
          <button
            type="button"
            class="dp-album-arrow"
            @click="activePhotoIndex = (activePhotoIndex + 1) % galleryPhotos.length"
          >
            ›
          </button>
        </div>
        <div class="dp-album-thumbs">
          <button
            v-for="(img, idx) in galleryPhotos"
            :key="`th-${idx}`"
            type="button"
            class="dp-album-thumb"
            :class="{ active: idx === activePhotoIndex }"
            @click="activePhotoIndex = idx"
          >
            <img :src="img" :alt="`缩略图 ${idx + 1}`" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.booking-quantity { cursor: text; }
.booking-quantity:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.dp-bc-cta:disabled { opacity: 0.6; cursor: not-allowed; }

.dp-highlights-compact {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}
.dp-highlights-compact .dp-highlight-row { align-items: center; gap: 12px; }
.dp-highlights-compact .dp-hl-title { margin-bottom: 0; }

.dp-location-results :deep(.dp-map-shell) { margin: 0; border: 0; border-radius: 0; }
.dp-location-address {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--ink-2);
}
.dp-tour-page { padding-bottom: 40px; }
.dp-tour-page .dp-breadcrumb-bar { padding-block: 14px 10px; }
.dp-tour-page .dp-title-bar { padding-block: 15px 12px; }
.dp-tour-page .dp-gallery { height: 300px; margin-bottom: 24px; }
.dp-tour-page .dp-main-split { gap: 32px; }
.dp-tour-page .dp-section-block { padding-block: 20px; }
.dp-tour-page .dp-section-block:first-child { padding-top: 0; }
.dp-tour-page .dp-full-section { padding-block: 32px; }
.dp-tour-page .dp-map-shell { height: 340px; }
.dp-tour-page .dp-hot-item-card { padding: 10px 13px; }
.dp-tour-page .dp-room-stack { gap: 8px; }
.dp-tour-page .dp-booking-card { padding: 18px; }
.dp-tour-page .dp-bc-header { margin-bottom: 12px; }

.dp-tour-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  margin-bottom: 14px;
  padding: 13px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #f5faf7;
}

.dp-tour-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; margin-bottom: 8px; }
.dp-tour-summary p { color: var(--ink); font-weight: 700; }
.dp-tour-summary button { font-size: 13px; }
.dp-tour-facts dl { display: flex; flex-wrap: wrap; gap: 5px 20px; }
.dp-tour-facts dl div { display: flex; flex-wrap: wrap; gap: 2px 7px; font-size: 13px; }
.dp-tour-facts dt { color: var(--ink-2); font-weight: 800; }
.dp-tour-facts dd { margin: 0; }
.dp-tour-actions { text-align: right; }
.dp-tour-price { color: var(--primary-dark); line-height: 1.35; margin-bottom: 5px; }
.dp-tour-price strong { font-size: 20px; }
.dp-tour-price small { margin-left: 3px; font-size: 13px; }
.dp-tour-actions button { padding: 5px 12px; font-size: 13px; }
</style>
