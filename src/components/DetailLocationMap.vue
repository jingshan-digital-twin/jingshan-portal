<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    address: string
    lat?: number
    lng?: number
    subtitle?: string
  }>(),
  {
    lat: 31.0218,
    lng: 113.1195,
    subtitle: '',
  },
)

const mapEl = ref<HTMLDivElement | null>(null)
const baseType = ref<'vector' | 'satellite'>('vector')

let map: L.Map | null = null
let baseLayer: L.TileLayer | null = null
let labelLayer: L.TileLayer | null = null
let markerLayer: L.LayerGroup | null = null
let locationMarker: L.Marker | undefined

function applyTileLayer(kind: 'vector' | 'satellite') {
  if (!map) return
  if (baseLayer) {
    map.removeLayer(baseLayer)
    baseLayer = null
  }
  if (labelLayer) {
    map.removeLayer(labelLayer)
    labelLayer = null
  }
  if (kind === 'vector') {
    baseLayer = L.tileLayer(
      'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      { subdomains: ['1', '2', '3', '4'], maxZoom: 18, attribution: '高德地图 · 京山网球' },
    ).addTo(map)
  } else {
    baseLayer = L.tileLayer(
      'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
      { subdomains: ['1', '2', '3', '4'], maxZoom: 18, attribution: '高德影像' },
    ).addTo(map)
    labelLayer = L.tileLayer(
      'https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
      { subdomains: ['1', '2', '3', '4'], maxZoom: 18 },
    ).addTo(map)
  }
}

function renderPin() {
  if (!map || !markerLayer) return
  markerLayer.clearLayers()
  const lat = props.lat ?? 31.0218
  const lng = props.lng ?? 113.1195

  map.setView([lat, lng], 15)

  L.circle([lat, lng], {
    radius: 320,
    color: '#0d7a58',
    weight: 1.5,
    fillColor: '#0d7a58',
    fillOpacity: 0.1,
  }).addTo(markerLayer)

  const pinIcon = L.divIcon({
    className: 'dp-map-pin',
    html: `<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;">
      <div style="width:46px;height:46px;border-radius:50%;background:#10251f;border:3px solid #ffffff;box-shadow:0 8px 24px rgba(16,37,31,0.38);display:flex;align-items:center;justify-content:center;">
        <div style="width:14px;height:14px;border-radius:50%;background:#c4f63d;"></div>
      </div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })

  locationMarker = L.marker([lat, lng], { icon: pinIcon, title: props.title })
    .bindPopup(
      `<div style="font-family:'Noto Sans SC',sans-serif;min-width:200px;padding:2px 0;">
        <strong style="font-size:14.5px;color:#10251f;">${props.title}</strong>
        <div style="font-size:12.5px;color:#415750;margin-top:4px;">${props.address}</div>
      </div>`,
    )
    .addTo(markerLayer)
}

function showLocation() {
  if (!locationMarker) return
  map?.setView(locationMarker.getLatLng(), 15)
  locationMarker.openPopup()
}

defineExpose({ showLocation })

function zoomIn() {
  map?.zoomIn()
}
function zoomOut() {
  map?.zoomOut()
}
function recenter() {
  map?.flyTo([props.lat ?? 31.0218, props.lng ?? 113.1195], 15, { duration: 0.45 })
}

onMounted(() => {
  if (!mapEl.value) return
  map = L.map(mapEl.value, {
    center: [props.lat ?? 31.0218, props.lng ?? 113.1195],
    zoom: 15,
    zoomControl: false,
    scrollWheelZoom: false,
  })
  markerLayer = L.layerGroup().addTo(map)
  applyTileLayer(baseType.value)
  renderPin()
  window.setTimeout(() => map?.invalidateSize(), 120)
})

watch(baseType, (next) => applyTileLayer(next))
watch(
  () => [props.lat, props.lng, props.title, props.address],
  () => renderPin(),
)

onUnmounted(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div class="dp-map-shell">
    <div ref="mapEl" class="dp-map-canvas" />

    <!-- Top-left pill (Airbnb-inspired floating context chip) -->
    <div class="dp-map-float-tl">
      <span class="dp-map-dot" />
      <span>{{ title }}</span>
    </div>

    <!-- Top-right map style toggle -->
    <div class="dp-map-float-tr">
      <button
        type="button"
        class="dp-map-ctrl-btn"
        :class="{ active: baseType === 'vector' }"
        @click="baseType = 'vector'"
      >
        标准地图
      </button>
      <button
        type="button"
        class="dp-map-ctrl-btn"
        :class="{ active: baseType === 'satellite' }"
        @click="baseType = 'satellite'"
      >
        卫星影像
      </button>
    </div>

    <!-- Bottom-right zoom controls -->
    <div class="dp-map-float-br">
      <button type="button" class="dp-map-zoom-btn" title="放大" @click="zoomIn">+</button>
      <button type="button" class="dp-map-zoom-btn" title="缩小" @click="zoomOut">−</button>
      <button type="button" class="dp-map-zoom-btn" title="回到中心" @click="recenter">◎</button>
    </div>
  </div>
</template>
