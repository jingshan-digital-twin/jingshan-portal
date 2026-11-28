<script setup lang="ts">
import L from 'leaflet'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { usePortalStore } from '../store/usePortalStore'
import { getVenuePois, type MapPoiCategory, type MapPoi } from '../mock/venuePois'
import { REHAB_CENTERS, rehabDetail } from '../mock/trainingData'
import { INITIAL_COURTS } from '../mock/data'
import { HOTEL_PROFILES } from '../mock/details'
import type { CourtVenue, RadiusOption } from '../types/portal'
import MapBasemapSwitch from './MapBasemapSwitch.vue'
import {
  addPortalMapMarker,
  bindPortalMapPopup,
  createPortalMap,
  JINGSHAN_MAP_CENTER,
  MAP_ICONS,
  mapNavigationActions,
  setPortalMapTiles,
  type MapBasemap,
} from './portalMap'

const { openVenueDetail, openHotelDetail, openCinemaDetail, openDetailPage, openPhoto } = usePortalStore()

export interface AmenityMapPoint {
  key: '卫生间' | '医疗点' | '充电桩' | 'ATM' | '母婴室'
  name: string
  lat: number
  lng: number
  dist: string
  info: string
  photo?: string
  address?: string
}

const props = defineProps<{
  mode: 'courts' | 'traffic' | 'amenities'
  radius?: RadiusOption
  selectedVenue?: CourtVenue | null
  courtDate?: string
  venues?: CourtVenue[]
  poiCategory?: MapPoiCategory
  customAmenities?: AmenityMapPoint[]
  parkingLocations?: { id: string; name: string; address: string; lat: number; lng: number; remain: number; total: number; isCharger?: boolean }[]
  selectedLocationId?: string
  trafficPreviewCenter?: [number, number]
}>()

const emit = defineEmits<{
  (e: 'amenity-detail', name: string): void
  (e: 'select-venue', venueId: string): void
  (e: 'select-location', locationId: string): void
}>()

const mapEl = ref<HTMLDivElement | null>(null)
const baseType = ref<MapBasemap>('vector')

let map: L.Map | null = null
let tileLayers: L.LayerGroup | undefined
let overlayGroup: L.LayerGroup | null = null
const locationMarkers = new Map<string, L.Marker>()
const internationalCourtPhoto = INITIAL_COURTS.find((venue) => venue.id === 'venue-international')?.photo
const hotelPhotos = new Map(HOTEL_PROFILES.map((hotel) => [hotel.id, hotel.photo]))

const basemapUnavailable = ref(false)
const venueMarkers = new Map<string, L.Marker>()
let venueToReopen: string | undefined

const amenityIcons: Record<AmenityMapPoint['key'], string> = {
  '卫生间': MAP_ICONS.restroom,
  '医疗点': MAP_ICONS.medical,
  '充电桩': MAP_ICONS.charger,
  ATM: MAP_ICONS.atm,
  '母婴室': MAP_ICONS.nursery,
}
const courtLegend = [
  { icon: MAP_ICONS.court, label: '球场' },
  { icon: MAP_ICONS.serviceDesk, label: '服务台' },
  { icon: MAP_ICONS.restroom, label: '卫生间' },
  { icon: MAP_ICONS.restArea, label: '休息区' },
  { icon: MAP_ICONS.equipment, label: '器材服务' },
  { icon: MAP_ICONS.hotel, label: '酒店' },
  { icon: MAP_ICONS.food, label: '美食' },
  { icon: MAP_ICONS.parking, label: '停车' },
  { icon: MAP_ICONS.charger, label: '充电' },
  { icon: MAP_ICONS.medical, label: '医疗' },
  { icon: MAP_ICONS.scenic, label: '便民景点' },
  { icon: MAP_ICONS.cinema, label: '影城' },
  { icon: MAP_ICONS.rehab, label: '康复理疗' },
]
const amenityLegend = [
  { icon: MAP_ICONS.court, label: '球场' },
  ...Object.entries(amenityIcons).map(([label, icon]) => ({ label, icon })),
]

const activeCenter = computed<[number, number]>(() =>
  props.trafficPreviewCenter ?? (props.selectedVenue ? [props.selectedVenue.lat, props.selectedVenue.lng] : JINGSHAN_MAP_CENTER),
)

const radiusMeters = computed(() => props.radius === '500m' ? 500 : props.radius === '2公里' ? 2000 : 1000)
const poiCategory = computed(() => props.poiCategory ?? '全部')
const nearbyRehab = computed(() => {
  if (!props.selectedVenue || (poiCategory.value !== '全部' && poiCategory.value !== '康复理疗')) return []
  const center = L.latLng(activeCenter.value)
  return REHAB_CENTERS.filter((item) => center.distanceTo([item.lat, item.lng]) <= radiusMeters.value)
})

const activePois = computed(() => {
  const venue = props.selectedVenue
  if (!venue) return []
  const center = L.latLng(venue.lat, venue.lng)
  return getVenuePois(venue.id).filter((poi) =>
    (poiCategory.value === '全部' || poi.category === poiCategory.value)
    && center.distanceTo([poi.lat, poi.lng]) <= radiusMeters.value,
  )
})

const visibleCourtLegend = computed(() => {
  const icons = new Set([MAP_ICONS.court, ...activePois.value.map((poi) => poi.badgeIcon)])
  if (nearbyRehab.value.length) icons.add(MAP_ICONS.rehab)
  return courtLegend.filter((entry) => icons.has(entry.icon))
})

function registerLocation(id: string, marker: L.Marker) {
  locationMarkers.set(id, marker)
  marker.on('popupopen', () => emit('select-location', id))
}

function openSelectedLocation() {
  const marker = locationMarkers.get(props.selectedLocationId ?? '')
  if (marker && !marker.isPopupOpen()) marker.openPopup()
}

function openVenueLocation(id: string) {
  venueMarkers.get(id)?.openPopup()
}

function renderTraffic(layers: L.LayerGroup) {
  const fitPoints: L.LatLngTuple[] = []

  if (!props.trafficPreviewCenter) {
    fitPoints.push(JINGSHAN_MAP_CENTER)
    addPortalMapMarker(layers, JINGSHAN_MAP_CENTER, {
      title: '京山国际网球中心',
      icon: MAP_ICONS.court,
      label: '国际网球中心',
      photo: internationalCourtPhoto,
      description: '9片标准硬地/红土与中心赛场 · 07:00–22:00',
      actions: [
        { label: '查看场馆详情', run: () => openVenueDetail('venue-international') },
        ...mapNavigationActions('京山国际网球中心', '赛事场馆', ...JINGSHAN_MAP_CENTER),
      ],
    }, 500)

    const roads: { title: string; status: string; description: string; line: L.LatLngTuple[]; pin: L.LatLngTuple; style: L.PathOptions }[] = [
      {
        title: '温泉大道国际网球中心段',
        status: '临时封闭',
        description: '中青赛期间 07:30–19:00 临时封闭，社会车辆请绕行京山大道。',
        line: [[31.0234, 113.1142], [31.0228, 113.1195], [31.0222, 113.1258]],
        pin: [31.0235, 113.1138],
        style: { color: '#DF2E38', weight: 6, opacity: 0.9 },
      },
      {
        title: '京山大道东段',
        status: '限行禁停',
        description: '赛事缓冲限行禁停，推荐驶入 P1/P2 停车场。',
        line: [[31.0285, 113.1186], [31.0218, 113.1189], [31.0155, 113.1191]],
        pin: [31.0278, 113.1187],
        style: { color: '#F07C19', weight: 5, dashArray: '10 7', opacity: 0.88 },
      },
    ]
    for (const road of roads) {
      const content = {
        title: road.title,
        icon: MAP_ICONS.restriction,
        description: road.description,
        highlight: road.status,
      }
      bindPortalMapPopup(L.polyline(road.line, road.style).addTo(layers), content)
      addPortalMapMarker(layers, road.pin, { ...content, label: road.status }, 350)
      fitPoints.push(road.pin)
    }
  }

  // 为高密度核心区点位做轻量视觉防重叠偏移，点击导航仍使用原始真实坐标
  const displayPosMap: Record<string, L.LatLngTuple> = {
    p1: [31.0252, 113.1228],
    ev1: [31.0204, 113.1258],
  }

  for (const location of props.parkingLocations ?? []) {
    const { id, name, address, lat, lng, remain, total, isCharger } = location
    const availability = isCharger ? `闲${remain}/${total} 桩` : `剩${remain}/${total} 位`
    const pinPos: L.LatLngTuple = !props.trafficPreviewCenter && displayPosMap[id] ? displayPosMap[id]! : [lat, lng]
    fitPoints.push(pinPos)
    const marker = addPortalMapMarker(layers, pinPos, {
      title: name,
      icon: isCharger ? MAP_ICONS.charger : MAP_ICONS.parking,
      label: availability,
      description: address,
      highlight: availability,
      actions: [
        { label: '查看详情', run: () => openDetailPage({ kind: 'map-point', source: 'parking', id }) },
        ...mapNavigationActions(name, address, lat, lng),
      ],
    }, 400)
    registerLocation(id, marker)
  }

  if (map && fitPoints.length > 1) {
    map.fitBounds(L.latLngBounds(fitPoints), { padding: [54, 68], maxZoom: 15, animate: false })
  }
  openSelectedLocation()
}

function renderVenues(layers: L.LayerGroup) {
  const selected = props.selectedVenue
  const venues = props.venues ?? []
  const available = selected && !venues.some((venue) => venue.id === selected.id) ? [...venues, selected] : venues
  for (const venue of available) {
    const { id, name, minPrice, lat, lng, address, openHours, priceDesc, photo } = venue
    const active = id === selected?.id
    const marker = addPortalMapMarker(layers, [lat, lng], {
      title: name,
      icon: MAP_ICONS.court,
      label: minPrice > 0 ? `¥${minPrice}起` : '免费',
      photo,
      description: `${address} · ${openHours}`,
      highlight: priceDesc,
      actions: [
        { label: '查看场馆详情', run: () => openVenueDetail(id, { date: props.courtDate }) },
        ...mapNavigationActions(name, address, lat, lng),
      ],
    }, active ? 700 : 200)
    marker.getElement()?.classList.toggle('is-context', active)
    marker.on('popupopen', () => {
      if (id === props.selectedVenue?.id) return
      venueToReopen = id
      emit('select-venue', id)
    })
    venueMarkers.set(id, marker)
  }
  if (!selected) {
    addPortalMapMarker(layers, JINGSHAN_MAP_CENTER, {
      title: '京山国际网球中心',
      icon: MAP_ICONS.court,
      label: '¥68起',
      photo: internationalCourtPhoto,
      actions: [
        { label: '查看场馆详情', run: () => openVenueDetail('venue-international') },
        ...mapNavigationActions('京山国际网球中心', '赛事场馆', ...JINGSHAN_MAP_CENTER),
      ],
    })
  }
}

function renderAmenities(layers: L.LayerGroup) {
  const list: AmenityMapPoint[] = props.customAmenities ?? [
    { key: '卫生间', name: '星级公厕/母婴室', lat: 31.0245, lng: 113.1225, dist: '120m', info: '24h开放 · 无障碍与恒温母婴间' },
    { key: '医疗点', name: '医疗保障/急救AED', lat: 31.0188, lng: 113.1245, dist: '280m', info: '配备AED、救护车及运动康复绿通' },
    { key: '充电桩', name: '温泉新区超充站', lat: 31.0218, lng: 113.1262, dist: '200m', info: '120kW快充 · 订场联动预约' },
    { key: 'ATM', name: '24h ATM自助点', lat: 31.0248, lng: 113.1142, dist: '350m', info: '文峰花园酒店旁 · 支持外卡' },
  ]
  for (const item of list) {
    const { name, key, lat, lng, dist, info, address, photo } = item
    const description = address ? `${info} · ${address}` : info
    const marker = addPortalMapMarker(layers, [lat, lng], {
      title: name,
      icon: amenityIcons[key],
      label: `${key} · ${dist}`,
      photo,
      description,
      highlight: `距球场 ${dist}`,
      actions: [
        { label: '查看设施详情', run: () => emit('amenity-detail', name) },
        ...mapNavigationActions(name, description, lat, lng),
      ],
    }, 600)
    registerLocation(name, marker)
  }
  openSelectedLocation()
}

function openPoiDetail(poi: MapPoi) {
  if (poi.hotelId) return openHotelDetail(poi.hotelId)
  if (poi.badgeIcon === MAP_ICONS.cinema) return openCinemaDetail()
  if (props.selectedVenue) openDetailPage({ kind: 'map-point', source: props.selectedVenue.id, id: poi.name })
}

function renderCourtPois(layers: L.LayerGroup) {
  const compact = poiCategory.value === '全部' || radiusMeters.value === 2000
  for (const poi of activePois.value) {
    addPortalMapMarker(layers, [poi.lat, poi.lng], {
      title: poi.name,
      icon: poi.badgeIcon,
      label: poi.label ?? poi.name,
      compact,
      photo: poi.hotelId ? hotelPhotos.get(poi.hotelId) : undefined,
      description: poi.desc,
      highlight: poi.simulated ? '模拟点位' : poi.priceOrMeta,
      actions: poi.simulated ? undefined : [
        { label: '查看详情', run: () => openPoiDetail(poi) },
        ...mapNavigationActions(poi.name, poi.desc, poi.lat, poi.lng),
      ],
    })
  }
  for (const center of nearbyRehab.value) {
    const detail = rehabDetail(center)
    addPortalMapMarker(layers, [center.lat, center.lng], {
      title: center.name,
      icon: MAP_ICONS.rehab,
      photo: center.photo,
      label: center.name,
      compact,
      description: `${center.address} · ${center.openHours}`,
      highlight: detail.priceInfo,
      actions: [
        { label: '查看理疗项目', run: () => openPhoto(detail) },
        ...mapNavigationActions(center.name, center.address, center.lat, center.lng),
      ],
    }, 450)
  }
}

function renderOverlays(animatePan = false, fitCourtView = true) {
  if (!map || !overlayGroup) return
  overlayGroup.clearLayers()
  locationMarkers.clear()
  venueMarkers.clear()

  if (props.mode === 'traffic') {
    renderTraffic(overlayGroup)
    return
  }
  if (props.mode === 'courts' && !props.venues?.length) {
    map.setView(JINGSHAN_MAP_CENTER, 14)
    return
  }

  const focusedVenueId = venueToReopen === props.selectedVenue?.id ? venueToReopen : undefined
  venueToReopen = undefined
  const center = activeCenter.value
  const meters = radiusMeters.value
  const targetZoom = meters === 2000 ? 14 : 15

  if (props.mode !== 'courts') {
    if (animatePan) map.flyTo(center, targetZoom, { duration: 0.55 })
    else map.setView(center, targetZoom)
  }

  const serviceCircle = L.circle(center, {
    radius: meters,
    color: '#0D7A58',
    weight: 2,
    dashArray: '6 5',
    fillOpacity: 0.08,
    interactive: false,
  }).addTo(overlayGroup)

  if (props.mode === 'courts' && fitCourtView) {
    map.fitBounds(serviceCircle.getBounds(), { padding: [68, 46], maxZoom: 17, animate: false })
  }
  renderVenues(overlayGroup)
  if (props.mode === 'amenities') {
    renderAmenities(overlayGroup)
  } else {
    renderCourtPois(overlayGroup)
  }
  if (focusedVenueId) venueMarkers.get(focusedVenueId)?.openPopup()
}

function updateBasemap() {
  if (tileLayers) {
    setPortalMapTiles(tileLayers, baseType.value, (unavailable) => { basemapUnavailable.value = unavailable })
  }
}

onMounted(() => {
  if (!mapEl.value) return
  map = createPortalMap(mapEl.value, activeCenter.value, 15)
  if (props.mode === 'courts') map.options.zoomSnap = 0.5
  tileLayers = L.layerGroup().addTo(map)
  overlayGroup = L.layerGroup().addTo(map)
  updateBasemap()
  renderOverlays()
})

watch(baseType, updateBasemap)
watch(() => props.trafficPreviewCenter, () => {
  if (props.mode !== 'traffic') return
  map?.panTo(activeCenter.value, { animate: false })
  renderOverlays()
})
watch(
  () => [props.venues, props.selectedVenue?.id, props.mode, props.radius, props.poiCategory, props.customAmenities, props.parkingLocations] as const,
  ([, venueId, mode, radius], [, previousVenueId, previousMode, previousRadius]) => {
    const venueChanged = venueId !== previousVenueId
    renderOverlays(venueChanged, venueChanged || radius !== previousRadius || mode !== previousMode)
  },
)
watch(() => props.selectedLocationId, openSelectedLocation)
defineExpose({ openSelectedLocation, openVenueLocation })

onUnmounted(() => map?.remove())
</script>

<template>
  <div class="service-map-shell">
    <div ref="mapEl" class="service-map-canvas" :aria-label="mode === 'traffic' ? '赛事交通地图' : '球场及周边服务地图'" />
    <MapBasemapSwitch v-model="baseType" />
    <div v-if="mode !== 'traffic'" class="portal-map-legend" aria-label="地图图例">
      <span v-for="entry in mode === 'courts' ? visibleCourtLegend : amenityLegend" :key="entry.label">
        <span aria-hidden="true">{{ entry.icon }}</span> {{ entry.label }}
      </span>
    </div>
    <p v-if="mode === 'courts' && selectedVenue && !activePois.length && !nearbyRehab.length" class="portal-map-notice service-map-empty" role="status">
      当前范围内暂无匹配点位，可扩大范围或切换分类。
    </p>
    <p v-if="basemapUnavailable" class="portal-map-notice" role="status">暂时无法加载地图底图</p>
  </div>
</template>

<style scoped>
.service-map-empty { top: 54px; }
.service-map-shell { position: relative; height: 470px; background: #e8f1ed; isolation: isolate; }
.service-map-canvas { width: 100%; height: 100%; }
</style>
