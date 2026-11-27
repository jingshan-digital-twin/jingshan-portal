<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { RadiusOption } from '../types/portal'

const props = defineProps<{
  mode: 'courts' | 'traffic' | 'amenities'
  radius?: RadiusOption
}>()

const mapEl = ref<HTMLDivElement | null>(null)
const baseType = ref<'vector' | 'satellite'>('vector')

let map: L.Map | null = null
let baseLayer: L.TileLayer | null = null
let labelLayer: L.TileLayer | null = null
let overlayGroup: L.LayerGroup | null = null

const CENTER: [number, number] = [31.0218, 113.1195] // 京山国际网球中心坐标

function makePillIcon(text: string, bg: string, border = '#ffffff', textColor = '#ffffff') {
  return L.divIcon({
    className: 'js-map-pin',
    html: `<div style="display:inline-flex;align-items:center;white-space:nowrap;padding:3px 9px;border-radius:99px;background:${bg};color:${textColor};border:2px solid ${border};font-size:11px;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,0.22);transform:translate(-50%,-50%);">${text}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

function setBasemap(kind: 'vector' | 'satellite') {
  if (!map) return
  if (baseLayer) map.removeLayer(baseLayer)
  if (labelLayer) {
    map.removeLayer(labelLayer)
    labelLayer = null
  }
  if (kind === 'vector') {
    // 高德标准中文矢量底图（国内秒开、含京山完整路网与中文标注）
    baseLayer = L.tileLayer(
      'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      { subdomains: ['1', '2', '3', '4'], maxZoom: 18, attribution: '高德地图 · 京山网球底图' },
    ).addTo(map)
  } else {
    // 高德卫星影像 + 路网标注叠加
    baseLayer = L.tileLayer(
      'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
      { subdomains: ['1', '2', '3', '4'], maxZoom: 18, attribution: '高德影像底图' },
    ).addTo(map)
    labelLayer = L.tileLayer(
      'https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
      { subdomains: ['1', '2', '3', '4'], maxZoom: 18 },
    ).addTo(map)
  }
}

function popupHtml(title: string, desc: string, lat: number, lng: number) {
  const amap = `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(title)}`
  const baidu = `https://api.map.baidu.com/marker?location=${lat},${lng}&title=${encodeURIComponent(title)}&content=${encodeURIComponent(desc)}&output=html`
  return `<div style="font-family:'Noto Sans SC',sans-serif;min-width:190px;">
    <strong style="font-size:13px;color:#10251F;">${title}</strong>
    <div style="font-size:11.5px;color:#526861;margin:4px 0 8px;">${desc}<br/><span style="color:#859B93;">坐标：${lng.toFixed(4)}°E, ${lat.toFixed(4)}°N</span></div>
    <div style="display:flex;gap:6px;">
      <a href="${amap}" target="_blank" rel="noopener" style="flex:1;text-align:center;padding:4px 8px;border-radius:6px;background:#0D7A58;color:#fff;font-size:11px;font-weight:700;text-decoration:none;">高德导航</a>
      <a href="${baidu}" target="_blank" rel="noopener" style="flex:1;text-align:center;padding:4px 8px;border-radius:6px;background:#1C73E8;color:#fff;font-size:11px;font-weight:700;text-decoration:none;">百度导航</a>
    </div>
  </div>`
}

function renderOverlays() {
  if (!map || !overlayGroup) return
  overlayGroup.clearLayers()

  // Center Court Marker
  L.marker(CENTER, { icon: makePillIcon('🎾 京山国际网球中心', '#0B251D', '#C4F63D', '#C4F63D') })
    .bindPopup(popupHtml('京山国际网球中心', '9片标准硬地/红土+中心赛场 · 07:00-22:00', CENTER[0], CENTER[1]))
    .addTo(overlayGroup)

  if (props.mode === 'traffic') {
    // 红色封闭路段：温泉大道国际网球中心段
    L.polyline(
      [
        [31.0234, 113.1142],
        [31.0228, 113.1195],
        [31.0222, 113.1258],
      ],
      { color: '#DF2E38', weight: 7, opacity: 0.92 },
    )
      .bindPopup('<strong>⛔ 温泉大道国际网球中心段</strong><br/>中青赛期间 07:30-19:00 临时封闭，社会车辆请绕行京山大道。')
      .addTo(overlayGroup)

    // 橙色限行缓冲路段：京山大道东段
    L.polyline(
      [
        [31.0285, 113.1186],
        [31.0218, 113.1189],
        [31.0155, 113.1191],
      ],
      { color: '#F07C19', weight: 6, dashArray: '10 7', opacity: 0.9 },
    )
      .bindPopup('<strong>⚠️ 京山大道东段</strong><br/>赛事缓冲限行禁停，请勿路边临停，推荐驶入P1/P2停车场。')
      .addTo(overlayGroup)

    L.marker([31.0242, 113.1202], { icon: makePillIcon('⛔ 温泉大道段 临时封闭', '#DF2E38') }).addTo(overlayGroup)
    L.marker([31.0268, 113.1172], { icon: makePillIcon('⚠️ 京山大道 限行禁停', '#E87112') }).addTo(overlayGroup)
  } else {
    const meters = props.radius === '500m' ? 500 : props.radius === '2公里' ? 2000 : 1000
    L.circle(CENTER, {
      radius: meters,
      color: '#0D7A58',
      weight: 2,
      dashArray: '6 5',
      fillColor: '#0D7A58',
      fillOpacity: 0.12,
    }).addTo(overlayGroup)
    map.setZoom(meters === 500 ? 15 : meters === 2000 ? 13 : 14)
  }

  // POI Markers
  const pois =
    props.mode === 'amenities'
      ? [
          { pos: [31.0224, 113.1215] as [number, number], label: '🚻 星级公厕/母婴室', bg: '#0EA5A4', desc: '24h开放 · 无障碍与恒温母婴间' },
          { pos: [31.0195, 113.1245] as [number, number], label: '🏥 医疗保障/康复点', bg: '#DF2E38', desc: '配备AED、救护车及运动康复绿通' },
          { pos: [31.0212, 113.1228] as [number, number], label: '⚡ 温泉新区超充站(闲14)', bg: '#1C73E8', desc: '120kW快充 · 支持订场联动预约' },
          { pos: [31.0241, 113.1146] as [number, number], label: '🏧 24h ATM自助点', bg: '#D6961F', desc: '文峰花园酒店旁 · 支持外卡' },
        ]
      : [
          { pos: [31.0241, 113.1146] as [number, number], label: '🏨 文峰花园酒店(85折)', bg: '#1C73E8', desc: '距赛场0.8km · 赛事合作五星酒店' },
          { pos: [31.0226, 113.1162] as [number, number], label: '🅿️ P1车位(剩84)/⚡充电', bg: '#0E9F6E', desc: '订场免费停3h · 含12个快充桩' },
          { pos: [31.0214, 113.1248] as [number, number], label: '🍜 桥米公馆(票根85折)', bg: '#FF5D2A', desc: '网球联盟餐饮 · 招牌桥米锅巴' },
          { pos: [31.0185, 113.1128] as [number, number], label: '🎾 文峰公园12片/P2', bg: '#0D7A58', desc: '白日公益免费 · 紧邻文峰夜市' },
          { pos: [31.0258, 113.1285] as [number, number], label: '🎾 网球训练基地31片', bg: '#0D7A58', desc: '室内风雨/红土场 · 320车位' },
        ]

  for (const p of pois) {
    L.marker(p.pos, { icon: makePillIcon(p.label, p.bg) })
      .bindPopup(popupHtml(p.label, p.desc, p.pos[0], p.pos[1]))
      .addTo(overlayGroup)
  }
}

onMounted(() => {
  if (!mapEl.value) return
  map = L.map(mapEl.value, {
    center: CENTER,
    zoom: 14,
    zoomControl: true,
    scrollWheelZoom: false,
  })
  setBasemap(baseType.value)
  overlayGroup = L.layerGroup().addTo(map)
  renderOverlays()
})

watch(baseType, (val) => setBasemap(val))
watch(() => [props.mode, props.radius], () => renderOverlays())

onUnmounted(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div style="position: relative; width: 100%; height: 375px; background: #e8f1ed">
    <div ref="mapEl" style="width: 100%; height: 100%; z-index: 1" />
    <!-- 底图切换悬浮条 -->
    <div
      style="
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 400;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #d5e3dd;
        border-radius: 10px;
        padding: 3px;
        display: flex;
        gap: 4px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);
      "
    >
      <button
        class="m-tab"
        :class="{ active: baseType === 'vector' }"
        style="padding: 4px 10px; font-size: 11px"
        @click="baseType = 'vector'"
      >
        🗺️ 高德矢量底图
      </button>
      <button
        class="m-tab"
        :class="{ active: baseType === 'satellite' }"
        style="padding: 4px 10px; font-size: 11px"
        @click="baseType = 'satellite'"
      >
        🛰️ 卫星影像底图
      </button>
    </div>
  </div>
</template>
