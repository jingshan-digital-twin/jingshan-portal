<script setup lang="ts">
import L from 'leaflet'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import MapResultsLayout from '../../components/MapResultsLayout.vue'
import { addPortalMapMarker, createPortalMap, JINGSHAN_MAP_CENTER, MAP_ICONS, setPortalMapTiles } from '../../components/portalMap'
import { BOOKING_DATES } from '../../mock/schedules'
import type { CourtVenue, MatchmakingGame } from '../../types/portal'

const props = defineProps<{
  games: MatchmakingGame[]
  venues: CourtVenue[]
}>()

const emit = defineEmits<{
  gameDetail: [game: MatchmakingGame]
  join: [gameId: string]
  bookVenue: [venueId: string]
}>()

const canvas = ref<HTMLDivElement>()
const selectedId = ref<string>()
const basemapUnavailable = ref(false)
const markers = new Map<string, L.Marker>()
let map: L.Map | undefined
let markerLayer: L.LayerGroup | undefined

function roleIcon(role?: MatchmakingGame['matchRole']) {
  if (role === '京网陪练') return '🎯'
  if (role === '同龄球友') return '👦'
  return '🤝'
}

const items = computed(() => [
  ...props.games.map((g) => {
    const dLabel = BOOKING_DATES.find((d) => d.iso === g.date)?.shortDate ?? g.date
    const role = g.matchRole ?? '本地球友'
    return {
      id: g.id,
      openDetail: () => emit('gameDetail', g),
      title: `${roleIcon(g.matchRole)} [${role}] ${g.title}`,
      description: `CUTR ${g.cutrBand} · ${dLabel} ${g.startTime}-${g.endTime} · 已报${g.currentPlayers}/${g.maxPlayers}人`,
      location: `${g.venueName}（${g.region}）`,
      highlight: g.joinedByMe ? '已预约' : `¥${g.feePerPerson}/人`,
    }
  }),
  ...props.venues.map((v) => ({
    id: `free-${v.id}`,
    openDetail: () => emit('bookVenue', v.id),
    title: `🎾 [空闲场地] ${v.name.split('（')[0]}`,
    description: `${v.openHours} · ${v.surfaces.join('/')}`,
    location: v.address.replace('湖北省荆门市京山市', ''),
    highlight: v.minPrice === 0 ? '公益免费' : `¥${v.minPrice}起`,
  })),
])

function selectItem(id: string) {
  markers.get(id)?.openPopup()
}

function redrawMarkers() {
  if (!map || !markerLayer) return
  const previousSelection = selectedId.value
  map.closePopup()
  markerLayer.clearLayers()
  markers.clear()

  const venueMap = new Map(props.venues.map((v) => [v.id, v]))
  const venueOffsets = new Map<string, number>()

  for (const g of props.games) {
    const venue = venueMap.get(g.venueId)
    const baseLat = venue?.lat ?? JINGSHAN_MAP_CENTER[0]
    const baseLng = venue?.lng ?? JINGSHAN_MAP_CENTER[1]
    const idx = venueOffsets.get(g.venueId) ?? 0
    venueOffsets.set(g.venueId, idx + 1)
    const angle = idx * 1.45
    const lat = baseLat + Math.sin(angle) * 0.0022
    const lng = baseLng + Math.cos(angle) * 0.0028
    const role = g.matchRole ?? '本地球友'
    const dLabel = BOOKING_DATES.find((d) => d.iso === g.date)?.shortDate ?? g.date

    const marker = addPortalMapMarker(markerLayer, [lat, lng], {
      title: `${role} · ${g.title}`,
      icon: roleIcon(g.matchRole),
      label: `${role} · ¥${g.feePerPerson}`,
      photo: venue?.photo,
      description: `CUTR ${g.cutrBand} ｜ ${dLabel} ${g.startTime}-${g.endTime} ｜ 发起：${g.hostName} ｜ ${g.note}`,
      highlight: `${g.format} · 余 ${Math.max(0, g.maxPlayers - g.currentPlayers)} 位 · ¥${g.feePerPerson}/人`,
      actions: [
        { label: '查看详情', run: () => emit('gameDetail', g) },
        {
          label: g.joinedByMe ? '取消预约' : '一键预约并支付',
          run: () => emit('join', g.id),
        },
      ],
    }, role === '京网陪练' ? 520 : 420)
    marker.on('popupopen', () => { selectedId.value = g.id })
    marker.on('popupclose', () => {
      if (selectedId.value === g.id) selectedId.value = undefined
    })
    markers.set(g.id, marker)
  }

  for (const v of props.venues) {
    const key = `free-${v.id}`
    const totalFree = v.slots.reduce((s, slot) => s + slot.remaining, 0)
    const marker = addPortalMapMarker(markerLayer, [v.lat, v.lng], {
      title: `附近空闲场地 · ${v.name.split('（')[0]}`,
      icon: MAP_ICONS.court,
      label: `空闲场 · 余${totalFree}时段`,
      photo: v.photo,
      description: `${v.address} · ${v.priceDesc}`,
      highlight: v.minPrice === 0 ? '公益免费可约' : `会员价 ¥${v.minPrice} 起`,
      actions: [
        {
          label: '查看详情与订场',
          run: () => emit('bookVenue', v.id),
        },
      ],
    }, 300)
    marker.on('popupopen', () => { selectedId.value = key })
    marker.on('popupclose', () => {
      if (selectedId.value === key) selectedId.value = undefined
    })
    markers.set(key, marker)
  }

  if (markers.size) {
    const bounds = L.latLngBounds([...markers.values()].map((m) => m.getLatLng()))
    map.fitBounds(bounds, { padding: [46, 54], maxZoom: 15, animate: false })
  } else {
    map.setView(JINGSHAN_MAP_CENTER, 14)
  }
  if (previousSelection && markers.has(previousSelection)) {
    selectItem(previousSelection)
  }
}

onMounted(() => {
  if (!canvas.value) return
  map = createPortalMap(canvas.value, JINGSHAN_MAP_CENTER, 14)
  setPortalMapTiles(L.layerGroup().addTo(map), 'vector', (unavailable) => { basemapUnavailable.value = unavailable })
  markerLayer = L.layerGroup().addTo(map)
  redrawMarkers()
})

watch(() => [props.games, props.venues], redrawMarkers, { deep: true })
onUnmounted(() => map?.remove())
</script>

<template>
  <MapResultsLayout
    :items="items"
    :selected-id="selectedId"
    list-label="水平匹配结果与空闲场地"
    empty-text="当前条件下暂无匹配约球对象"
    @select="selectItem"
  >
    <div class="mg-map-area">
      <div ref="canvas" class="mg-map-canvas" aria-label="同城约球匹配地图" />
      <div class="portal-map-legend" aria-label="约球地图图例">
        <span>🎯 京网陪练</span>
        <span>👦 同龄球友</span>
        <span>🤝 本地球友</span>
        <span>🎾 附近空闲场地</span>
      </div>
      <p v-if="basemapUnavailable" class="portal-map-notice" role="status">暂时无法加载地图底图</p>
    </div>
  </MapResultsLayout>
</template>

<style scoped>
.mg-map-area { position: relative; min-width: 0; isolation: isolate; }
.mg-map-canvas { width: 100%; height: 500px; background: #e8f1ed; }
</style>
