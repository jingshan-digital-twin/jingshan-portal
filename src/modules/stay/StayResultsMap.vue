<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import MapResultsLayout from '../../components/MapResultsLayout.vue'
import type { HotelProfile, HotelRoom } from '../../types/portal'

const props = defineProps<{
  listings: { hotel: HotelProfile; room: HotelRoom }[]
}>()
const emit = defineEmits<{
  detail: [hotelId: string, roomId: string]
}>()

const center: L.LatLngTuple = [31.0218, 113.1195]
const canvas = ref<HTMLDivElement>()
const selectedId = ref<string>()
const popupTarget = shallowRef<HTMLDivElement>()
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
    const popupContent = document.createElement('div')
    const label = document.createElement('span')
    label.textContent = `¥${room.eventPrice}`
    const marker = L.marker([hotel.lat, hotel.lng], {
      icon: L.divIcon({
        className: 'stay-price-pin',
        html: label,
        iconSize: [60, 32],
        iconAnchor: [30, 36],
        popupAnchor: [0, -34],
      }),
      title: `${hotel.name}，${room.eventPrice} 元起`,
      riseOnHover: true,
    }).addTo(markerLayer)

    marker.getElement()?.setAttribute('aria-label', `${hotel.name}，${room.eventPrice} 元起`)
    marker.bindPopup(popupContent, { minWidth: 250, maxWidth: 280, autoPanPadding: [24, 24] })
    marker.on('popupopen', () => {
      selectedId.value = hotel.id
      popupTarget.value = popupContent
      marker.getElement()?.classList.add('is-selected')
      marker.setZIndexOffset(1000)
    })
    marker.on('popupclose', () => {
      marker.getElement()?.classList.remove('is-selected')
      marker.setZIndexOffset(0)
      if (selectedId.value === hotel.id) {
        selectedId.value = undefined
        popupTarget.value = undefined
      }
    })
    markers.set(hotel.id, marker)
  }

  if (markers.size) {
    const bounds = L.latLngBounds([...markers.values()].map((marker) => marker.getLatLng()))
    map.fitBounds(bounds, { padding: [48, 60], maxZoom: 15, animate: false })
  } else {
    map.setView(center, 14)
  }
  if (previousSelection) selectHotel(previousSelection)
}

onMounted(() => {
  if (!canvas.value) return
  map = L.map(canvas.value, { center, zoom: 14, scrollWheelZoom: false, zoomControl: false })
  L.control.zoom({ position: 'bottomright', zoomInTitle: '放大', zoomOutTitle: '缩小' }).addTo(map)
  L.control.scale({ imperial: false }).addTo(map)
  const tiles = L.tileLayer(
    'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    { subdomains: ['1', '2', '3', '4'], maxZoom: 18, attribution: '高德地图' },
  )
  let hasLoadedTile = false
  tiles.on('tileload', () => {
    hasLoadedTile = true
    basemapUnavailable.value = false
  })
  tiles.on('load', () => { basemapUnavailable.value = !hasLoadedTile })
  tiles.addTo(map)
  markerLayer = L.layerGroup().addTo(map)
  redrawMarkers()
})

watch(() => props.listings, redrawMarkers)
watch(popupTarget, async (target) => {
  if (target) {
    await nextTick()
    if (popupTarget.value === target && selectedId.value) {
      markers.get(selectedId.value)?.getPopup()?.update()
    }
  }
})
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
      <p v-if="basemapUnavailable" class="stay-map-notice" role="status">暂时无法加载地图底图</p>
    </div>

    <Teleport v-if="popupTarget" :to="popupTarget">
      <template v-for="{ hotel, room } in listings" :key="hotel.id">
        <article v-if="hotel.id === selectedId" class="stay-map-popup">
          <img :src="hotel.photo" alt="" />
          <div class="stay-map-popup-body">
            <strong>{{ hotel.name }}</strong>
            <p>{{ hotel.rating.toFixed(1) }} 分 · {{ hotel.reviewCount }} 条点评 · {{ hotel.distanceToCourt }}</p>
            <div class="stay-map-popup-actions">
              <span class="stay-map-price">¥{{ room.eventPrice }}{{ room.leaseUnit ?? '/晚' }}起</span>
              <button type="button" class="btn-primary" @click="emit('detail', hotel.id, room.id)">查看详情</button>
            </div>
          </div>
        </article>
      </template>
    </Teleport>
  </MapResultsLayout>
</template>

<style scoped>
.stay-map-price { color: var(--primary-dark); font-weight: 800; }
.stay-map-area { position: relative; min-width: 0; isolation: isolate; }
.stay-map-canvas { width: 100%; height: 588px; background: #e8f1ed; }
.stay-map-notice {
  position: absolute;
  z-index: 500;
  top: 12px;
  left: 12px;
  padding: 6px 12px;
  border-radius: 4px;
  background: var(--surface);
  color: var(--ink-2);
}

.stay-map-area :deep(.stay-price-pin) {
  display: grid;
  place-items: center;
  border: 1px solid var(--primary);
  border-radius: 99px;
  background: var(--surface);
  color: var(--primary-dark);
  font-size: 14px;
  font-weight: 800;
  box-shadow: var(--shadow-md);
}

.stay-map-area :deep(.stay-price-pin::after) {
  content: '';
  position: absolute;
  bottom: -4px;
  width: 7px;
  height: 7px;
  transform: rotate(45deg);
  border-right: 1px solid var(--primary);
  border-bottom: 1px solid var(--primary);
  background: inherit;
}

.stay-map-area :deep(.stay-price-pin.is-selected) {
  background: var(--primary);
  color: white;
}

.stay-map-area :deep(.leaflet-popup-content-wrapper) { padding: 0; overflow: hidden; }
.stay-map-area :deep(.leaflet-popup-content) { margin: 0; }
.stay-map-area :deep(.leaflet-popup-close-button) {
  margin: 6px;
  border-radius: 50%;
  background: var(--surface);
}
.stay-map-popup img { display: block; width: 100%; height: 118px; object-fit: cover; }
.stay-map-popup-body { padding: 12px; font: inherit; font-family: inherit; }
.stay-map-popup-body strong { color: var(--ink); font-size: 15px; }
.stay-map-popup-body p { margin: 4px 0 10px; color: var(--ink-2); }
.stay-map-popup-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.stay-map-popup-actions .btn-primary { padding: 5px 10px; font-size: 12px; }
</style>
