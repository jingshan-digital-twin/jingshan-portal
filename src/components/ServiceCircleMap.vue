<script setup lang="ts">
import L from 'leaflet'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
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

export type MapPoiCategory = '全部' | '酒店' | '美食' | '停车充电' | '便民景点'

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

interface MapPoi {
  name: string
  category: Exclude<MapPoiCategory, '全部'>
  lat: number
  lng: number
  badgeIcon: string
  hotelId?: string
  priceOrMeta: string
  desc: string
}

const props = defineProps<{
  mode: 'courts' | 'traffic' | 'amenities'
  radius?: RadiusOption
  selectedVenue?: CourtVenue | null
  venues?: CourtVenue[]
  poiCategory?: MapPoiCategory
  customAmenities?: AmenityMapPoint[]
  parkingLocations?: { id: string; name: string; address: string; lat: number; lng: number; remain: number; total: number; isCharger?: boolean }[]
  selectedLocationId?: string
  trafficPreviewCenter?: [number, number]
}>()

const emit = defineEmits<{
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
  { icon: MAP_ICONS.hotel, label: '酒店' },
  { icon: MAP_ICONS.food, label: '美食' },
  { icon: MAP_ICONS.parking, label: '停车' },
  { icon: MAP_ICONS.charger, label: '充电' },
  { icon: MAP_ICONS.medical, label: '医疗' },
  { icon: MAP_ICONS.scenic, label: '便民景点' },
  { icon: MAP_ICONS.cinema, label: '影城' },
]
const amenityLegend = [
  { icon: MAP_ICONS.court, label: '球场' },
  ...Object.entries(amenityIcons).map(([label, icon]) => ({ label, icon })),
]

// 各球馆周边真实分布 POI（含酒店价格、餐饮人均、车位/充电余量、景点/急救，按方位错开排布避免遮挡）
const VENUE_POIS: Record<string, MapPoi[]> = {
  'venue-international': [
    { name: '文峰花园酒店', category: '酒店', hotelId: 'hotel-wenfeng', lat: 31.0268, lng: 113.1132, badgeIcon: MAP_ICONS.hotel, priceOrMeta: '¥318', desc: '距场馆0.8km · 赛事合作五星酒店 · 票根85折' },
    { name: '京山国际网球公寓', category: '酒店', hotelId: 'hotel-apt-1', lat: 31.0262, lng: 113.1248, badgeIcon: MAP_ICONS.hotel, priceOrMeta: '¥168', desc: '步行4分钟 · 短/长租拎包入住 · 含厨房洗衣机' },
    { name: '京山网球运动酒店', category: '酒店', hotelId: 'hotel-sport', lat: 31.0168, lng: 113.1178, badgeIcon: MAP_ICONS.hotel, priceOrMeta: '¥268', desc: '步行6分钟到赛场 · 免费冰袋与球拍穿线' },
    { name: '桥米公馆(非遗鄂菜)', category: '美食', lat: 31.0238, lng: 113.1128, badgeIcon: MAP_ICONS.food, priceOrMeta: '人均¥78', desc: '距场馆600m · 招牌桥米锅巴 · 票根85折' },
    { name: '京源中心运动员餐厅', category: '美食', lat: 31.0185, lng: 113.1246, badgeIcon: MAP_ICONS.food, priceOrMeta: '人均¥45', desc: '赛间营养简餐/低脂轻食 · 步行2分钟' },
    { name: '国际中心P1停车场', category: '停车充电', lat: 31.0256, lng: 113.1192, badgeIcon: MAP_ICONS.parking, priceOrMeta: '剩84位', desc: '订场免费停3h · 含12个快充桩' },
    { name: '温泉新区超充站', category: '停车充电', lat: 31.0222, lng: 113.1268, badgeIcon: MAP_ICONS.charger, priceOrMeta: '闲14桩', desc: '120kW超充 · 距场馆200m' },
    { name: '赛场医疗急救/AED', category: '便民景点', lat: 31.0188, lng: 113.1136, badgeIcon: MAP_ICONS.medical, priceOrMeta: '24h值守', desc: '配备AED与赛后运动康复绿色通道' },
  ],
  'venue-training-base': [
    { name: '京山国际网球公寓', category: '酒店', hotelId: 'hotel-apt-1', lat: 31.0276, lng: 113.1196, badgeIcon: MAP_ICONS.hotel, priceOrMeta: '¥168', desc: '距训练基地300m · 陪读集训首选公寓' },
    { name: '温泉新区青年公寓', category: '酒店', hotelId: 'hotel-youth-apt', lat: 31.0192, lng: 113.1278, badgeIcon: MAP_ICONS.hotel, priceOrMeta: '¥138', desc: 'Loft复式短长租 · 球友共享客厅' },
    { name: '京源温泉私汤民宿', category: '酒店', hotelId: 'hotel-hotspring', lat: 31.0286, lng: 113.1318, badgeIcon: MAP_ICONS.hotel, priceOrMeta: '¥468', desc: '私汤入户 · 赛后泡温泉舒缓肌肉' },
    { name: '省网校营养食堂', category: '美食', lat: 31.0258, lng: 113.1304, badgeIcon: MAP_ICONS.food, priceOrMeta: '人均¥38', desc: '运动员配餐标准 · 干净卫生实惠' },
    { name: '温泉土菜坊', category: '美食', lat: 31.0218, lng: 113.1316, badgeIcon: MAP_ICONS.food, priceOrMeta: '人均¥62', desc: '现炖土鸡汤与京山桥米饭 · 票根85折' },
    { name: '训练基地P2停车场', category: '停车充电', lat: 31.0278, lng: 113.1255, badgeIcon: MAP_ICONS.parking, priceOrMeta: '剩112位', desc: '大巴及自驾车位充足 · 免费停放' },
    { name: '温泉新区超充站', category: '停车充电', lat: 31.0205, lng: 113.1214, badgeIcon: MAP_ICONS.charger, priceOrMeta: '闲18桩', desc: '120kW快充 · 满电即走' },
    { name: '湖北省网球学校', category: '便民景点', lat: 31.0242, lng: 113.1182, badgeIcon: MAP_ICONS.scenic, priceOrMeta: '官方评测', desc: '体教融合示范校 · 五维能力晋升点' },
  ],
  'venue-wenfeng': [
    { name: '锦江IU酒店(文峰店)', category: '酒店', lat: 31.0226, lng: 113.1074, badgeIcon: MAP_ICONS.hotel, priceOrMeta: '¥132', desc: '步行5分钟到文峰球场 · 停车方便' },
    { name: '惠亭湖畔精品酒店', category: '酒店', hotelId: 'hotel-lake', lat: 31.0142, lng: 113.1086, badgeIcon: MAP_ICONS.hotel, priceOrMeta: '¥355', desc: '一线河景阳台 · 票根享85折' },
    { name: '城市便捷酒店(新市)', category: '酒店', lat: 31.0222, lng: 113.1176, badgeIcon: MAP_ICONS.hotel, priceOrMeta: '¥136', desc: '近文峰商圈 · 性价比高' },
    { name: '文峰河畔夜市烧烤街', category: '美食', lat: 31.0152, lng: 113.1162, badgeIcon: MAP_ICONS.food, priceOrMeta: '人均¥55', desc: '步行300m · 68家摊位 · 票根赠米茶' },
    { name: '新市老字号桥米馆', category: '美食', lat: 31.0195, lng: 113.1188, badgeIcon: MAP_ICONS.food, priceOrMeta: '人均¥48', desc: '地道京山桥米与排骨藕汤' },
    { name: '文峰公园P2停车场', category: '停车充电', lat: 31.0168, lng: 113.1066, badgeIcon: MAP_ICONS.parking, priceOrMeta: '剩42位', desc: '距球场120m · 夜间好停车' },
    { name: '文峰广场快充站', category: '停车充电', lat: 31.0226, lng: 113.1128, badgeIcon: MAP_ICONS.charger, priceOrMeta: '闲9桩', desc: '商场配套快充 · 步行4分钟' },
    { name: '京山国际影城IMAX', category: '便民景点', lat: 31.0196, lng: 113.1058, badgeIcon: MAP_ICONS.cinema, priceOrMeta: '影票¥32起', desc: '中百广场4楼 · 赛后观影休闲' },
  ],
  'venue-senior': [
    { name: '嘉泰大酒店(中百店)', category: '酒店', lat: 31.0252, lng: 113.1048, badgeIcon: MAP_ICONS.hotel, priceOrMeta: '¥128', desc: '城区核心位置 · 步行6分钟到场' },
    { name: '王府·君赞酒店', category: '酒店', lat: 31.0262, lng: 113.1116, badgeIcon: MAP_ICONS.hotel, priceOrMeta: '¥258', desc: '品质商务酒店 · 含双早免费停车' },
    { name: '京源大道私房鄂菜', category: '美食', lat: 31.0172, lng: 113.1066, badgeIcon: MAP_ICONS.food, priceOrMeta: '人均¥52', desc: '本地市民口碑老店 · 现炒家常菜' },
    { name: '老年大学免费停车场', category: '停车充电', lat: 31.0242, lng: 113.1092, badgeIcon: MAP_ICONS.parking, priceOrMeta: '剩36位', desc: '地面免费车位 · 进出便捷' },
    { name: '京源大道市政充电桩', category: '停车充电', lat: 31.0178, lng: 113.1146, badgeIcon: MAP_ICONS.charger, priceOrMeta: '闲6桩', desc: '快充/慢充齐全' },
    { name: '市人民医院运动康复', category: '便民景点', lat: 31.0238, lng: 113.1162, badgeIcon: MAP_ICONS.medical, priceOrMeta: '三甲保障', desc: '运动损伤诊疗与赛后理疗' },
  ],
  'venue-yongxing': [
    { name: '丽枫酒店(汽车中心店)', category: '酒店', lat: 31.0156, lng: 113.1568, badgeIcon: MAP_ICONS.hotel, priceOrMeta: '¥182', desc: '距永兴球馆600m · 舒适商务' },
    { name: '豪威柏悦大酒店', category: '酒店', lat: 31.0074, lng: 113.1672, badgeIcon: MAP_ICONS.hotel, priceOrMeta: '¥162', desc: '近高铁站方向 · 免费停车' },
    { name: '永兴土灶农家小院', category: '美食', lat: 31.0148, lng: 113.1678, badgeIcon: MAP_ICONS.food, priceOrMeta: '人均¥58', desc: '招牌柴火鸡与时令鲜蔬' },
    { name: '永兴体育馆免费停车', category: '停车充电', lat: 31.0078, lng: 113.1578, badgeIcon: MAP_ICONS.parking, priceOrMeta: '剩68位', desc: '场馆门口超大免费停车场' },
    { name: '永兴新能源超充站', category: '停车充电', lat: 31.0146, lng: 113.1622, badgeIcon: MAP_ICONS.charger, priceOrMeta: '闲10桩', desc: '120kW快充 · 免费停2h' },
    { name: '永兴亲子运动驿站', category: '便民景点', lat: 31.0112, lng: 113.1688, badgeIcon: MAP_ICONS.scenic, priceOrMeta: '亲子¥68', desc: '无动力乐园 + 儿童短式网球区' },
  ],
}

const activeCenter = computed<[number, number]>(() =>
  props.trafficPreviewCenter ?? (props.selectedVenue ? [props.selectedVenue.lat, props.selectedVenue.lng] : JINGSHAN_MAP_CENTER),
)

const activePois = computed(() => {
  const venueId = props.selectedVenue?.id ?? 'venue-international'
  const all = VENUE_POIS[venueId] ?? VENUE_POIS['venue-international']!
  if (!props.poiCategory || props.poiCategory === '全部') return all
  return all.filter((p) => p.category === props.poiCategory)
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
  if (!props.trafficPreviewCenter) {
    addPortalMapMarker(layers, JINGSHAN_MAP_CENTER, {
      title: '京山国际网球中心',
      icon: MAP_ICONS.court,
      label: '京山国际网球中心',
      photo: internationalCourtPhoto,
      description: '9片标准硬地/红土与中心赛场 · 07:00–22:00',
      actions: mapNavigationActions('京山国际网球中心', '赛事场馆', ...JINGSHAN_MAP_CENTER),
    })

    const roads: { title: string; status: string; description: string; line: L.LatLngTuple[]; pin: L.LatLngTuple; style: L.PathOptions }[] = [
      {
        title: '温泉大道国际网球中心段',
        status: '临时封闭',
        description: '中青赛期间 07:30–19:00 临时封闭，社会车辆请绕行京山大道。',
        line: [[31.0234, 113.1142], [31.0228, 113.1195], [31.0222, 113.1258]],
        pin: [31.0242, 113.1202],
        style: { color: '#DF2E38', weight: 7, opacity: 0.92 },
      },
      {
        title: '京山大道东段',
        status: '限行禁停',
        description: '赛事缓冲限行禁停，推荐驶入 P1/P2 停车场。',
        line: [[31.0285, 113.1186], [31.0218, 113.1189], [31.0155, 113.1191]],
        pin: [31.0268, 113.1172],
        style: { color: '#F07C19', weight: 6, dashArray: '10 7', opacity: 0.9 },
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
      addPortalMapMarker(layers, road.pin, { ...content, label: road.status })
    }
  }

  for (const location of props.parkingLocations ?? []) {
    const { id, name, address, lat, lng, remain, total, isCharger } = location
    const availability = isCharger ? `闲${remain}/${total} 桩` : `剩${remain}/${total} 位`
    const marker = addPortalMapMarker(layers, [lat, lng], {
      title: name,
      icon: isCharger ? MAP_ICONS.charger : MAP_ICONS.parking,
      label: availability,
      description: address,
      highlight: availability,
      actions: mapNavigationActions(name, address, lat, lng),
    })
    registerLocation(id, marker)
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
      actions: mapNavigationActions(name, address, lat, lng),
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
      actions: mapNavigationActions('京山国际网球中心', '赛事场馆', ...JINGSHAN_MAP_CENTER),
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
      actions: mapNavigationActions(name, description, lat, lng),
    }, 600)
    registerLocation(name, marker)
  }
  openSelectedLocation()
}

function renderOverlays(animatePan = false) {
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
  const meters = props.radius === '500m' ? 500 : props.radius === '2公里' ? 2000 : 1000
  const targetZoom = meters === 2000 ? 14 : 15

  if (animatePan && !focusedVenueId) {
    map.flyTo(center, targetZoom, { duration: 0.55 })
  } else {
    map.setView(center, targetZoom)
  }

  L.circle(center, {
    radius: meters,
    color: '#0D7A58',
    weight: 2,
    dashArray: '6 5',
    fillOpacity: 0.08,
    interactive: false,
  }).addTo(overlayGroup)

  renderVenues(overlayGroup)
  if (props.mode === 'amenities') {
    renderAmenities(overlayGroup)
  } else {
    for (const poi of activePois.value) {
      addPortalMapMarker(overlayGroup, [poi.lat, poi.lng], {
        title: poi.name,
        icon: poi.badgeIcon,
        label: poi.priceOrMeta,
        photo: poi.hotelId ? hotelPhotos.get(poi.hotelId) : undefined,
        description: poi.desc,
        highlight: poi.priceOrMeta,
        actions: mapNavigationActions(poi.name, poi.desc, poi.lat, poi.lng),
      })
    }
    if (!focusedVenueId && !animatePan && props.venues?.length) {
      const bounds = L.latLngBounds(props.venues.map((venue) => [venue.lat, venue.lng]))
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: targetZoom, animate: false })
    }
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
  ([venues, venueId], [previousVenues, previousVenueId]) => {
    renderOverlays(venueId !== previousVenueId && (props.mode !== 'courts' || venues === previousVenues))
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
      <span v-for="entry in mode === 'courts' ? courtLegend : amenityLegend" :key="entry.label">
        <span aria-hidden="true">{{ entry.icon }}</span> {{ entry.label }}
      </span>
    </div>
    <p v-if="basemapUnavailable" class="portal-map-notice" role="status">暂时无法加载地图底图</p>
  </div>
</template>

<style scoped>
.service-map-shell { position: relative; height: 470px; background: #e8f1ed; isolation: isolate; }
.service-map-canvas { width: 100%; height: 100%; }
</style>
