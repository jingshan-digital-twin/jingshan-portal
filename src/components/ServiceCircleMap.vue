<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { CourtVenue, RadiusOption } from '../types/portal'

export type MapPoiCategory = '全部' | '酒店' | '美食' | '停车充电' | '便民景点'

export interface AmenityMapPoint {
  key: '卫生间' | '医疗点' | '充电桩' | 'ATM' | '母婴室'
  name: string
  lat: number
  lng: number
  dist: string
  info: string
}

interface MapPoi {
  name: string
  category: Exclude<MapPoiCategory, '全部'>
  lat: number
  lng: number
  badgeIcon: string
  badgeBg: string
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
}>()

const emit = defineEmits<{
  (e: 'select-venue', venueId: string): void
  (e: 'select-location', locationId: string): void
}>()

const mapEl = ref<HTMLDivElement | null>(null)
const baseType = ref<'vector' | 'satellite'>('vector')

let map: L.Map | null = null
let baseLayer: L.TileLayer | null = null
let labelLayer: L.TileLayer | null = null
let overlayGroup: L.LayerGroup | null = null
const locationMarkers = new Map<string, L.Marker>()

const DEFAULT_CENTER: [number, number] = [31.0218, 113.1195]

// 各球馆周边真实分布 POI（含酒店价格、餐饮人均、车位/充电余量、景点/急救，按方位错开排布避免遮挡）
const VENUE_POIS: Record<string, MapPoi[]> = {
  'venue-international': [
    { name: '文峰花园酒店', category: '酒店', lat: 31.0268, lng: 113.1132, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥318', desc: '距场馆0.8km · 赛事合作五星酒店 · 票根85折' },
    { name: '京山国际网球公寓', category: '酒店', lat: 31.0262, lng: 113.1248, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥168', desc: '步行4分钟 · 短/长租拎包入住 · 含厨房洗衣机' },
    { name: '京山网球运动酒店', category: '酒店', lat: 31.0168, lng: 113.1178, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥268', desc: '步行6分钟到赛场 · 免费冰袋与球拍穿线' },
    { name: '桥米公馆(非遗鄂菜)', category: '美食', lat: 31.0238, lng: 113.1128, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥78', desc: '距场馆600m · 招牌桥米锅巴 · 票根85折' },
    { name: '京源中心运动员餐厅', category: '美食', lat: 31.0185, lng: 113.1246, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥45', desc: '赛间营养简餐/低脂轻食 · 步行2分钟' },
    { name: '国际中心P1停车场', category: '停车充电', lat: 31.0256, lng: 113.1192, badgeIcon: '🅿️', badgeBg: '#0d7a58', priceOrMeta: '剩84位', desc: '订场免费停3h · 含12个快充桩' },
    { name: '温泉新区超充站', category: '停车充电', lat: 31.0222, lng: 113.1268, badgeIcon: '⚡', badgeBg: '#1c73e8', priceOrMeta: '闲14桩', desc: '120kW超充 · 距场馆200m' },
    { name: '赛场医疗急救/AED', category: '便民景点', lat: 31.0188, lng: 113.1136, badgeIcon: '🏥', badgeBg: '#df2e38', priceOrMeta: '24h值守', desc: '配备AED与赛后运动康复绿色通道' },
  ],
  'venue-training-base': [
    { name: '京山国际网球公寓', category: '酒店', lat: 31.0276, lng: 113.1196, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥168', desc: '距训练基地300m · 陪读集训首选公寓' },
    { name: '温泉新区青年公寓', category: '酒店', lat: 31.0192, lng: 113.1278, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥138', desc: 'Loft复式短长租 · 球友共享客厅' },
    { name: '京源温泉私汤民宿', category: '酒店', lat: 31.0286, lng: 113.1318, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥468', desc: '私汤入户 · 赛后泡温泉舒缓肌肉' },
    { name: '省网校营养食堂', category: '美食', lat: 31.0258, lng: 113.1304, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥38', desc: '运动员配餐标准 · 干净卫生实惠' },
    { name: '温泉土菜坊', category: '美食', lat: 31.0218, lng: 113.1316, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥62', desc: '现炖土鸡汤与京山桥米饭 · 票根85折' },
    { name: '训练基地P2停车场', category: '停车充电', lat: 31.0278, lng: 113.1255, badgeIcon: '🅿️', badgeBg: '#0d7a58', priceOrMeta: '剩112位', desc: '大巴及自驾车位充足 · 免费停放' },
    { name: '温泉新区超充站', category: '停车充电', lat: 31.0205, lng: 113.1214, badgeIcon: '⚡', badgeBg: '#1c73e8', priceOrMeta: '闲18桩', desc: '120kW快充 · 满电即走' },
    { name: '湖北省网球学校', category: '便民景点', lat: 31.0242, lng: 113.1182, badgeIcon: '🎓', badgeBg: '#0ea5a4', priceOrMeta: '官方评测', desc: '体教融合示范校 · 五维能力晋升点' },
  ],
  'venue-wenfeng': [
    { name: '锦江IU酒店(文峰店)', category: '酒店', lat: 31.0226, lng: 113.1074, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥132', desc: '步行5分钟到文峰球场 · 停车方便' },
    { name: '惠亭湖畔精品酒店', category: '酒店', lat: 31.0142, lng: 113.1086, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥355', desc: '一线河景阳台 · 票根享85折' },
    { name: '城市便捷酒店(新市)', category: '酒店', lat: 31.0222, lng: 113.1176, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥136', desc: '近文峰商圈 · 性价比高' },
    { name: '文峰河畔夜市烧烤街', category: '美食', lat: 31.0152, lng: 113.1162, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥55', desc: '步行300m · 68家摊位 · 票根赠米茶' },
    { name: '新市老字号桥米馆', category: '美食', lat: 31.0195, lng: 113.1188, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥48', desc: '地道京山桥米与排骨藕汤' },
    { name: '文峰公园P2停车场', category: '停车充电', lat: 31.0168, lng: 113.1066, badgeIcon: '🅿️', badgeBg: '#0d7a58', priceOrMeta: '剩42位', desc: '距球场120m · 夜间好停车' },
    { name: '文峰广场快充站', category: '停车充电', lat: 31.0226, lng: 113.1128, badgeIcon: '⚡', badgeBg: '#1c73e8', priceOrMeta: '闲9桩', desc: '商场配套快充 · 步行4分钟' },
    { name: '京山国际影城IMAX', category: '便民景点', lat: 31.0196, lng: 113.1058, badgeIcon: '🎬', badgeBg: '#7c3aed', priceOrMeta: '影票¥32起', desc: '中百广场4楼 · 赛后观影休闲' },
  ],
  'venue-senior': [
    { name: '嘉泰大酒店(中百店)', category: '酒店', lat: 31.0252, lng: 113.1048, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥128', desc: '城区核心位置 · 步行6分钟到场' },
    { name: '王府·君赞酒店', category: '酒店', lat: 31.0262, lng: 113.1116, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥258', desc: '品质商务酒店 · 含双早免费停车' },
    { name: '京源大道私房鄂菜', category: '美食', lat: 31.0172, lng: 113.1066, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥52', desc: '本地市民口碑老店 · 现炒家常菜' },
    { name: '老年大学免费停车场', category: '停车充电', lat: 31.0242, lng: 113.1092, badgeIcon: '🅿️', badgeBg: '#0d7a58', priceOrMeta: '剩36位', desc: '地面免费车位 · 进出便捷' },
    { name: '京源大道市政充电桩', category: '停车充电', lat: 31.0178, lng: 113.1146, badgeIcon: '⚡', badgeBg: '#1c73e8', priceOrMeta: '闲6桩', desc: '快充/慢充齐全' },
    { name: '市人民医院运动康复', category: '便民景点', lat: 31.0238, lng: 113.1162, badgeIcon: '🏥', badgeBg: '#df2e38', priceOrMeta: '三甲保障', desc: '运动损伤诊疗与赛后理疗' },
  ],
  'venue-yongxing': [
    { name: '丽枫酒店(汽车中心店)', category: '酒店', lat: 31.0156, lng: 113.1568, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥182', desc: '距永兴球馆600m · 舒适商务' },
    { name: '豪威柏悦大酒店', category: '酒店', lat: 31.0074, lng: 113.1672, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥162', desc: '近高铁站方向 · 免费停车' },
    { name: '永兴土灶农家小院', category: '美食', lat: 31.0148, lng: 113.1678, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥58', desc: '招牌柴火鸡与时令鲜蔬' },
    { name: '永兴体育馆免费停车', category: '停车充电', lat: 31.0078, lng: 113.1578, badgeIcon: '🅿️', badgeBg: '#0d7a58', priceOrMeta: '剩68位', desc: '场馆门口超大免费停车场' },
    { name: '永兴新能源超充站', category: '停车充电', lat: 31.0146, lng: 113.1622, badgeIcon: '⚡', badgeBg: '#1c73e8', priceOrMeta: '闲10桩', desc: '120kW快充 · 免费停2h' },
    { name: '永兴亲子运动驿站', category: '便民景点', lat: 31.0112, lng: 113.1688, badgeIcon: '🎠', badgeBg: '#0ea5a4', priceOrMeta: '亲子¥68', desc: '无动力乐园 + 儿童短式网球区' },
  ],
}

const activeCenter = computed<[number, number]>(() =>
  props.selectedVenue ? [props.selectedVenue.lat, props.selectedVenue.lng] : DEFAULT_CENTER,
)

const activePois = computed(() => {
  const venueId = props.selectedVenue?.id ?? 'venue-international'
  const all = VENUE_POIS[venueId] ?? VENUE_POIS['venue-international']!
  if (!props.poiCategory || props.poiCategory === '全部') return all
  return all.filter((p) => p.category === props.poiCategory)
})

function makeAmapPoiIcon(poi: MapPoi) {
  const shortTitle = poi.name.length > 7 ? `${poi.name.slice(0, 7)}…` : poi.name
  let shapeSvg = ''
  if (poi.category === '酒店') {
    // 紫色实心圆点（●）
    shapeSvg = `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#6c5ce7" stroke="#fff" stroke-width="2"/></svg>`
  } else if (poi.category === '美食') {
    // 橙红色正三角形（▲）
    shapeSvg = `<svg width="16" height="16" viewBox="0 0 16 16"><polygon points="8,1.5 14.8,13.5 1.2,13.5" fill="#f25c43" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>`
  } else if (poi.category === '停车充电') {
    const fill = poi.badgeIcon === '⚡' ? '#1c73e8' : '#0d7a58'
    // 蓝/绿色小菱形（◆）
    shapeSvg = `<svg width="16" height="16" viewBox="0 0 16 16"><polygon points="8,1.2 14.8,8 8,14.8 1.2,8" fill="${fill}" stroke="#fff" stroke-width="1.8"/></svg>`
  } else {
    // 医疗/景点：倒三角（▼）
    shapeSvg = `<svg width="16" height="16" viewBox="0 0 16 16"><polygon points="1.2,2.5 14.8,2.5 8,14.5" fill="${poi.badgeBg}" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>`
  }

  return L.divIcon({
    className: 'js-amap-pin',
    html: `<div class="map-poi-node" style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">
      <div style="display:inline-flex;align-items:center;gap:3px;filter:drop-shadow(0 2px 4px rgba(16,37,31,0.28));">
        ${shapeSvg}
        <span style="font-size:11px;font-weight:900;color:${poi.badgeBg};text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff,0 0 4px #fff;white-space:nowrap;">${poi.priceOrMeta}</span>
      </div>
      <div style="margin-top:0px;font-size:10.5px;font-weight:800;color:#17322a;white-space:nowrap;text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff,0 0 5px #fff;">${shortTitle}</div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

function makeVenueFocalIcon(name: string, price: number, isActive: boolean) {
  const shortName = (name.split('（')[0] ?? name).replace(/^京山/, '')
  if (isActive) {
    return L.divIcon({
      className: 'js-amap-pin',
      html: `<div class="map-poi-node" style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-78%);z-index:999;">
        <div style="display:inline-flex;align-items:center;gap:4px;background:#0b251d;color:#c4f63d;border:1.5px solid #c4f63d;padding:2px 8px;box-shadow:0 4px 14px rgba(11,37,29,0.42);white-space:nowrap;margin-bottom:3px;">
          <strong style="font-size:11.5px;font-weight:900;">${shortName}</strong>
          <span style="background:#c4f63d;color:#0b251d;padding:0 4px;font-size:10px;font-weight:900;">${price === 0 ? '免费' : `¥${price}`}</span>
        </div>
        <svg width="24" height="24" viewBox="0 0 24 24" style="filter:drop-shadow(0 2px 5px rgba(11,37,29,0.4));">
          <circle cx="12" cy="12" r="10" fill="rgba(13,122,88,0.25)"/>
          <circle cx="12" cy="12" r="6.5" fill="#0d7a58" stroke="#ffffff" stroke-width="2.5"/>
          <circle cx="12" cy="12" r="2.2" fill="#c4f63d"/>
        </svg>
      </div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    })
  }
  // 其他未选中球馆：绿色小星点 + 轻量描边地名，不遮挡周边
  return L.divIcon({
    className: 'js-amap-pin',
    html: `<div class="map-poi-node" style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">
      <svg width="16" height="16" viewBox="0 0 16 16" style="filter:drop-shadow(0 2px 4px rgba(13,122,88,0.35));">
        <circle cx="8" cy="8" r="5.5" fill="#0d7a58" stroke="#ffffff" stroke-width="2"/>
        <circle cx="8" cy="8" r="2" fill="#c4f63d"/>
      </svg>
      <div style="margin-top:1px;font-size:10.5px;font-weight:800;color:#0b5d42;white-space:nowrap;text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff,0 0 5px #fff;">${shortName}</div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

function makeAmenityPointIcon(item: AmenityMapPoint) {
  const shortTitle = item.name.length > 8 ? `${item.name.slice(0, 8)}…` : item.name
  let color = '#0ea5a4'
  let shapeSvg = ''
  if (item.key === '卫生间') {
    color = '#0ea5a4'
    shapeSvg = `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${color}" stroke="#fff" stroke-width="2"/></svg>`
  } else if (item.key === '医疗点') {
    color = '#df2e38'
    shapeSvg = `<svg width="16" height="16" viewBox="0 0 16 16"><polygon points="1.2,2.5 14.8,2.5 8,14.5" fill="${color}" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>`
  } else if (item.key === '充电桩') {
    color = '#1c73e8'
    shapeSvg = `<svg width="16" height="16" viewBox="0 0 16 16"><polygon points="8,1.2 14.8,8 8,14.8 1.2,8" fill="${color}" stroke="#fff" stroke-width="1.8"/></svg>`
  } else if (item.key === 'ATM') {
    color = '#d6961f'
    shapeSvg = `<svg width="16" height="16" viewBox="0 0 16 16"><polygon points="8,1.5 14.8,13.5 1.2,13.5" fill="${color}" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>`
  } else {
    color = '#7c3aed'
    shapeSvg = `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${color}" stroke="#fff" stroke-width="2"/></svg>`
  }

  return L.divIcon({
    className: 'js-amap-pin',
    html: `<div class="map-poi-node" style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">
      <div style="display:inline-flex;align-items:center;gap:3px;filter:drop-shadow(0 2px 4px rgba(16,37,31,0.28));">
        ${shapeSvg}
        <span style="font-size:11px;font-weight:900;color:${color};text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff,0 0 4px #fff;white-space:nowrap;">${item.key}·${item.dist}</span>
      </div>
      <div style="margin-top:0px;font-size:10.5px;font-weight:800;color:#17322a;white-space:nowrap;text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff,0 0 5px #fff;">${shortTitle}</div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

function makeSimpleIcon(text: string, bg: string, border = '#ffffff', textColor = '#ffffff') {
  return L.divIcon({
    className: 'js-map-pin',
    html: `<div style="display:inline-flex;align-items:center;white-space:nowrap;padding:3px 9px;border-radius:0;background:${bg};color:${textColor};border:2px solid ${border};font-size:11px;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,0.22);transform:translate(-50%,-50%);">${text}</div>`,
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
    baseLayer = L.tileLayer(
      'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      { subdomains: ['1', '2', '3', '4'], maxZoom: 18, attribution: '高德地图 · 京山网球底图' },
    ).addTo(map)
  } else {
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
    <div style="font-size:11.5px;color:#526861;margin:4px 0 8px;">${desc}</div>
    <div style="display:flex;gap:6px;">
      <a href="${amap}" target="_blank" rel="noopener" style="flex:1;text-align:center;padding:4px 8px;background:#0D7A58;color:#fff;font-size:11px;font-weight:700;text-decoration:none;">高德导航</a>
      <a href="${baidu}" target="_blank" rel="noopener" style="flex:1;text-align:center;padding:4px 8px;background:#1C73E8;color:#fff;font-size:11px;font-weight:700;text-decoration:none;">百度导航</a>
    </div>
  </div>`
}

function registerLocation(id: string, marker: L.Marker) {
  locationMarkers.set(id, marker)
  marker.on('popupopen', () => emit('select-location', id))
}

function openSelectedLocation() {
  const marker = locationMarkers.get(props.selectedLocationId ?? '')
  if (marker && !marker.isPopupOpen()) marker.openPopup()
}

function renderOverlays(animatePan = false) {
  if (!map || !overlayGroup) return
  overlayGroup.clearLayers()
  locationMarkers.clear()

  const center = activeCenter.value

  if (props.mode === 'traffic') {
    L.marker(DEFAULT_CENTER, { icon: makeSimpleIcon('🎾 京山国际网球中心', '#0B251D', '#C4F63D', '#C4F63D') })
      .bindPopup(popupHtml('京山国际网球中心', '9片标准硬地/红土+中心赛场 · 07:00-22:00', DEFAULT_CENTER[0], DEFAULT_CENTER[1]))
      .addTo(overlayGroup)

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

    L.polyline(
      [
        [31.0285, 113.1186],
        [31.0218, 113.1189],
        [31.0155, 113.1191],
      ],
      { color: '#F07C19', weight: 6, dashArray: '10 7', opacity: 0.9 },
    )
      .bindPopup('<strong>⚠️ 京山大道东段</strong><br/>赛事缓冲限行禁停，推荐驶入P1/P2停车场。')
      .addTo(overlayGroup)

    L.marker([31.0242, 113.1202], { icon: makeSimpleIcon('⛔ 温泉大道段 临时封闭', '#DF2E38') }).addTo(overlayGroup)
    L.marker([31.0268, 113.1172], { icon: makeSimpleIcon('⚠️ 京山大道 限行禁停', '#E87112') }).addTo(overlayGroup)

    for (const location of props.parkingLocations ?? []) {
      const availability = `${location.isCharger ? '闲' : '剩'}${location.remain}/${location.total}`
      registerLocation(location.id, L.marker([location.lat, location.lng], {
        icon: makeSimpleIcon(availability, location.isCharger ? '#1c73e8' : '#0d7a58'),
        title: location.name,
      }).bindPopup(popupHtml(location.name, `${availability} · ${location.address}`, location.lat, location.lng)).addTo(overlayGroup))
    }
    openSelectedLocation()
    return
  }

  if (props.mode === 'courts' && !props.venues?.length) {
    map.setView(DEFAULT_CENTER, 14)
    return
  }

  const meters = props.radius === '500m' ? 500 : props.radius === '2公里' ? 2000 : 1000
  const targetZoom = meters === 500 ? 15 : meters === 2000 ? 14 : 15

  if (animatePan) {
    map.flyTo(center, targetZoom, { duration: 0.55 })
  } else {
    map.setView(center, targetZoom)
  }

  L.circle(center, {
    radius: meters,
    color: '#0D7A58',
    weight: 2,
    dashArray: '6 5',
    fillColor: '#0D7A58',
    fillOpacity: 0.08,
  }).addTo(overlayGroup)

  if (props.mode === 'amenities') {
    // 周边其他球场（可点击切换）
    for (const v of props.venues ?? []) {
      if (props.selectedVenue && v.id === props.selectedVenue.id) continue
      L.marker([v.lat, v.lng], { icon: makeVenueFocalIcon(v.name, v.minPrice, false), title: v.name, zIndexOffset: 200 })
        .on('click', () => emit('select-venue', v.id))
        .addTo(overlayGroup)
    }

    // 当前选中的网球场中心点
    if (props.selectedVenue) {
      L.marker([props.selectedVenue.lat, props.selectedVenue.lng], {
        icon: makeVenueFocalIcon(props.selectedVenue.name, props.selectedVenue.minPrice, true),
        zIndexOffset: 1000,
      })
        .bindPopup(popupHtml(props.selectedVenue.name, `${props.selectedVenue.address} · 距您 ${props.selectedVenue.distanceKm}km`, props.selectedVenue.lat, props.selectedVenue.lng))
        .addTo(overlayGroup)
    } else {
      L.marker(DEFAULT_CENTER, { icon: makeVenueFocalIcon('京山国际网球中心', 68, true), zIndexOffset: 1000 }).addTo(overlayGroup)
    }

    const list: AmenityMapPoint[] = props.customAmenities ?? [
      { key: '卫生间', name: '星级公厕/母婴室', lat: 31.0245, lng: 113.1225, dist: '120m', info: '24h开放 · 无障碍与恒温母婴间' },
      { key: '医疗点', name: '医疗保障/急救AED', lat: 31.0188, lng: 113.1245, dist: '280m', info: '配备AED、救护车及运动康复绿通' },
      { key: '充电桩', name: '温泉新区超充站', lat: 31.0218, lng: 113.1262, dist: '200m', info: '120kW快充 · 订场联动预约' },
      { key: 'ATM', name: '24h ATM自助点', lat: 31.0248, lng: 113.1142, dist: '350m', info: '文峰花园酒店旁 · 支持外卡' },
    ]
    for (const item of list) {
      const marker = L.marker([item.lat, item.lng], { icon: makeAmenityPointIcon(item), title: item.name, zIndexOffset: 600 })
        .bindPopup(popupHtml(`${item.name}（${item.key}）`, `${item.info} · 距球场 ${item.dist}`, item.lat, item.lng))
        .addTo(overlayGroup)
      registerLocation(item.name, marker)
    }
    openSelectedLocation()
    return
  }

  // Courts mode: render surrounding POIs with Amap-style price/status callouts
  for (const poi of activePois.value) {
    L.marker([poi.lat, poi.lng], { icon: makeAmapPoiIcon(poi) })
      .bindPopup(popupHtml(`${poi.name}（${poi.priceOrMeta}）`, poi.desc, poi.lat, poi.lng))
      .addTo(overlayGroup)
  }

  // Render other venues (clickable to switch selection)
  for (const v of props.venues ?? []) {
    if (props.selectedVenue && v.id === props.selectedVenue.id) continue
    L.marker([v.lat, v.lng], { icon: makeVenueFocalIcon(v.name, v.minPrice, false), title: v.name, zIndexOffset: 200 })
      .on('click', () => emit('select-venue', v.id))
      .addTo(overlayGroup)
  }

  // Render active selected venue prominently on top
  const focalVenue = props.selectedVenue
  if (focalVenue) {
    L.marker([focalVenue.lat, focalVenue.lng], {
      icon: makeVenueFocalIcon(focalVenue.name, focalVenue.minPrice, true),
      zIndexOffset: 1000,
    })
      .bindPopup(
        popupHtml(
          focalVenue.name,
          `${focalVenue.openHours} · ${focalVenue.priceDesc}`,
          focalVenue.lat,
          focalVenue.lng,
        ),
      )
      .addTo(overlayGroup)
  } else {
    L.marker(DEFAULT_CENTER, { icon: makeVenueFocalIcon('京山国际网球中心', 68, true), zIndexOffset: 1000 }).addTo(overlayGroup)
  }
  if (!animatePan && props.venues?.length) {
    map.fitBounds(L.latLngBounds(props.venues.map((venue) => [venue.lat, venue.lng])), { padding: [45, 45], maxZoom: targetZoom, animate: false })
  }
}

onMounted(() => {
  if (!mapEl.value) return
  map = L.map(mapEl.value, {
    center: activeCenter.value,
    zoom: 15,
    zoomControl: true,
    scrollWheelZoom: false,
  })
  setBasemap(baseType.value)
  overlayGroup = L.layerGroup().addTo(map)
  renderOverlays(false)
})

watch(baseType, (val) => setBasemap(val))
watch(
  () => [props.venues, props.selectedVenue?.id, props.mode, props.radius, props.poiCategory, props.customAmenities, props.parkingLocations] as const,
  ([venues, venueId], [previousVenues, previousVenueId]) => {
    renderOverlays(venueId !== previousVenueId && (props.mode !== 'courts' || venues === previousVenues))
  },
)
watch(() => props.selectedLocationId, openSelectedLocation)
defineExpose({ openSelectedLocation })

onUnmounted(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div style="position: relative; width: 100%; height: 470px; background: #e8f1ed">
    <div ref="mapEl" style="width: 100%; height: 100%; z-index: 1" />
    <!-- 顶部悬浮底图切换 -->
    <div
      style="
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 400;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid #d5e3dd;
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
        🗺️ 矢量图
      </button>
      <button
        class="m-tab"
        :class="{ active: baseType === 'satellite' }"
        style="padding: 4px 10px; font-size: 11px"
        @click="baseType = 'satellite'"
      >
        🛰️ 卫星图
      </button>
    </div>

    <!-- 左下角图例悬浮条（按几何形状与颜色清晰区分） -->
    <div
      v-if="mode === 'courts'"
      style="
        position: absolute;
        left: 10px;
        bottom: 10px;
        z-index: 400;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid #d5e3dd;
        padding: 5px 10px;
        display: flex;
        align-items: center;
        gap: 11px;
        font-size: 11px;
        font-weight: 800;
        color: #2b433b;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      "
    >
      <span><b style="color: #0d7a58">◉</b> 球馆</span>
      <span><b style="color: #6c5ce7">●</b> 酒店</span>
      <span><b style="color: #f25c43">▲</b> 美食</span>
      <span><b style="color: #0d7a58">◆</b> 停车</span>
      <span><b style="color: #1c73e8">◆</b> 充电</span>
      <span><b style="color: #df2e38">▼</b> 医疗/景点</span>
    </div>
    <!-- 便民模式左下角几何图例 -->
    <div
      v-else-if="mode === 'amenities'"
      style="
        position: absolute;
        left: 10px;
        bottom: 10px;
        z-index: 400;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid #d5e3dd;
        padding: 5px 10px;
        display: flex;
        align-items: center;
        gap: 11px;
        font-size: 11px;
        font-weight: 800;
        color: #2b433b;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      "
    >
      <span><b style="color: #0d7a58">◉</b> 球场</span>
      <span><b style="color: #0ea5a4">●</b> 卫生间</span>
      <span><b style="color: #df2e38">▼</b> 医疗点</span>
      <span><b style="color: #1c73e8">◆</b> 充电桩</span>
      <span><b style="color: #d6961f">▲</b> ATM</span>
      <span><b style="color: #7c3aed">●</b> 母婴室</span>
    </div>
  </div>
</template>
