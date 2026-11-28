<script setup lang="ts">
import L from 'leaflet'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import MapResultsLayout from '../../components/MapResultsLayout.vue'
import { addPortalMapMarker, createPortalMap, JINGSHAN_MAP_CENTER, MAP_ICONS, setPortalMapTiles } from '../../components/portalMap'
import type { HotelProfile, HotelRoom } from '../../types/portal'

const props = defineProps<{
  listings: { hotel: HotelProfile; room: HotelRoom }[]
}>()
const emit = defineEmits<{
  detail: [hotelId: string, roomId: string]
}>()

const canvas = ref<HTMLDivElement>()
const selectedId = ref<string>()
const basemapUnavailable = ref(false)
const markers = new Map<string, L.Marker>()
let map: L.Map | undefined
let markerLayer: L.LayerGroup | undefined

const items = computed(() => props.listings.map(({ hotel, room }) => ({
  id: hotel.id,
  title: hotel.name,
  photo: hotel.photo,
  description: `${hotel.rating.toFixed(1)} 分 · ${hotel.reviewCount} 条点评`,
  location: hotel.distanceToCourt,
  highlight: `¥${room.eventPrice}${room.leaseUnit ?? '/晚'}起`,
})))

function selectHotel(id: string) {
  markers.get(id)?.openPopup()
}

function redrawMarkers() {
  if (!map || !markerLayer) return
  const previousSelection = selectedId.value
  map.closePopup()
  markerLayer.clearLayers()
  markers.clear()

  for (const { hotel, room } of props.listings) {
    const totalRemain = hotel.rooms.reduce((sum, r) => sum + r.remaining, 0)
    const stars = hotel.rating >= 4.9 ? '★★★★★' : '★★★★☆'
    const reviewSnippet = hotel.reviews[0]?.content ? ` ｜ 真实点评：“${hotel.reviews[0].content}”` : ''
    const marker = addPortalMapMarker(markerLayer, [hotel.lat, hotel.lng], {
      title: hotel.name,
      icon: MAP_ICONS.hotel,
      label: `京网推荐 ¥${room.eventPrice} · 余${totalRemain}间`,
      photo: hotel.photo,
      description: `京网推荐 ${stars} ${hotel.rating.toFixed(1)}分 · ${hotel.reviewCount}条点评 · ${hotel.distanceToCourt}${reviewSnippet}`,
      highlight: `空房余 ${totalRemain} 间 · ¥${room.eventPrice}${room.leaseUnit ?? '/晚'}起`,
      actions: [{ label: '查看详情与预订', run: () => emit('detail', hotel.id, room.id) }],
    })
    marker.on('popupopen', () => { selectedId.value = hotel.id })
    marker.on('popupclose', () => {
      if (selectedId.value === hotel.id) selectedId.value = undefined
    })
    markers.set(hotel.id, marker)
  }

  if (markers.size) {
    const bounds = L.latLngBounds([...markers.values()].map((marker) => marker.getLatLng()))
    map.fitBounds(bounds, { padding: [48, 60], maxZoom: 15, animate: false })
  } else {
    map.setView(JINGSHAN_MAP_CENTER, 14)
  }
  if (previousSelection) selectHotel(previousSelection)
}

onMounted(() => {
  if (!canvas.value) return
  map = createPortalMap(canvas.value, JINGSHAN_MAP_CENTER, 14)
  setPortalMapTiles(L.layerGroup().addTo(map), 'vector', (unavailable) => { basemapUnavailable.value = unavailable })
  markerLayer = L.layerGroup().addTo(map)
  redrawMarkers()
})

watch(() => props.listings, redrawMarkers)
onUnmounted(() => map?.remove())
</script>

<template>
  <MapResultsLayout
    :items="items"
    :selected-id="selectedId"
    list-label="地图住宿列表"
    empty-text="没有符合条件的住宿"
    @select="selectHotel"
  >
    <div class="stay-map-area">
      <div ref="canvas" class="stay-map-canvas" aria-label="京山住宿地图" />
      <p v-if="basemapUnavailable" class="portal-map-notice" role="status">暂时无法加载地图底图</p>
    </div>
  </MapResultsLayout>
</template>

<style scoped>
.stay-map-area { position: relative; min-width: 0; isolation: isolate; }
.stay-map-canvas { width: 100%; height: 588px; background: #e8f1ed; }
</style>
