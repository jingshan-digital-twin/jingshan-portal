<script setup lang="ts">
import L from 'leaflet'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import MapBasemapSwitch from './MapBasemapSwitch.vue'
import { addPortalMapMarker, createPortalMap, JINGSHAN_MAP_CENTER, MAP_ICONS, setPortalMapTiles, type MapBasemap } from './portalMap'

const props = defineProps<{
  title: string
  address: string
  lat?: number
  lng?: number
  icon?: string
  photo?: string
}>()

const emit = defineEmits<{ navigate: [] }>()
const mapEl = ref<HTMLDivElement>()
const baseType = ref<MapBasemap>('vector')
const basemapUnavailable = ref(false)
const center = computed<L.LatLngTuple>(() => [
  props.lat ?? JINGSHAN_MAP_CENTER[0],
  props.lng ?? JINGSHAN_MAP_CENTER[1],
])

let map: L.Map | undefined
let tileLayers: L.LayerGroup | undefined
let markerLayer: L.LayerGroup | undefined
let locationMarker: L.Marker | undefined

function renderPin() {
  if (!map || !markerLayer) return
  markerLayer.clearLayers()
  map.setView(center.value, 15)

  L.circle(center.value, {
    radius: 320,
    color: '#0d7a58',
    weight: 1.5,
    fillOpacity: 0.1,
    interactive: false,
  }).addTo(markerLayer)

  locationMarker = addPortalMapMarker(markerLayer, center.value, {
    title: props.title,
    label: props.title,
    icon: props.icon ?? MAP_ICONS.location,
    photo: props.photo,
    description: props.address,
    actions: [{ label: '导航前往', run: () => emit('navigate') }],
  })
}

function showLocation() {
  if (!locationMarker) return
  map?.setView(locationMarker.getLatLng(), 15)
  locationMarker.openPopup()
}

defineExpose({ showLocation })

function recenter() {
  map?.flyTo(center.value, 15, { duration: 0.45 })
}

function updateBasemap() {
  if (tileLayers) {
    setPortalMapTiles(tileLayers, baseType.value, (unavailable) => { basemapUnavailable.value = unavailable })
  }
}

onMounted(() => {
  if (!mapEl.value) return
  map = createPortalMap(mapEl.value, center.value, 15)
  tileLayers = L.layerGroup().addTo(map)
  markerLayer = L.layerGroup().addTo(map)
  updateBasemap()
  renderPin()
})

watch(baseType, updateBasemap)
watch(() => [center.value, props.title, props.address, props.icon, props.photo], renderPin)
onUnmounted(() => map?.remove())
</script>

<template>
  <div class="dp-map-shell">
    <div ref="mapEl" class="dp-map-canvas" :aria-label="`${title}位置地图`" />
    <MapBasemapSwitch v-model="baseType">
      <button type="button" class="btn-ghost" @click="recenter">回到中心</button>
    </MapBasemapSwitch>
    <p v-if="basemapUnavailable" class="portal-map-notice" role="status">暂时无法加载地图底图</p>
  </div>
</template>
