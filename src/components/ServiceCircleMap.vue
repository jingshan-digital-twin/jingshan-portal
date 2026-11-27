<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { CourtVenue, RadiusOption } from '../types/portal'

export type MapPoiCategory = '全部' | '酒店' | '美食' | '停车充电' | '便民景点'

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
}>()

const emit = defineEmits<{
  (e: 'select-venue', venueId: string): void
}>()

const mapEl = ref<HTMLDivElement | null>(null)
const baseType = ref<'vector' | 'satellite'>('vector')

let map: L.Map | null = null
let baseLayer: L.TileLayer | null = null
let labelLayer: L.TileLayer | null = null
let overlayGroup: L.LayerGroup | null = null

const DEFAULT_CENTER: [number, number] = [31.0218, 113.1195]

// 各球馆周边真实分布 POI（含酒店价格、餐饮人均、车位/充电余量、景点/急救）
const VENUE_POIS: Record<string, MapPoi[]> = {
  'venue-international': [
    { name: '文峰花园酒店', category: '酒店', lat: 31.0244, lng: 113.1144, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥318', desc: '距场馆0.8km · 赛事合作五星酒店 · 票根85折' },
    { name: '京山国际网球公寓', category: '酒店', lat: 31.0241, lng: 113.1235, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥168', desc: '步行4分钟 · 短/长租拎包入住 · 含厨房洗衣机' },
    { name: '京山网球运动酒店', category: '酒店', lat: 31.0189, lng: 113.1186, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥268', desc: '步行6分钟到赛场 · 免费冰袋与球拍穿线' },
    { name: '桥米公馆(非遗鄂菜)', category: '美食', lat: 31.0229, lng: 113.1162, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥78', desc: '距场馆600m · 招牌桥米锅巴 · 票根85折' },
    { name: '京源中心运动员餐厅', category: '美食', lat: 31.0204, lng: 113.1216, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥45', desc: '赛间营养简餐/低脂轻食 · 步行2分钟' },
    { name: '国际中心P1停车场', category: '停车充电', lat: 31.0228, lng: 113.1190, badgeIcon: '🅿️', badgeBg: '#0d7a58', priceOrMeta: '剩84位', desc: '订场免费停3h · 含12个快充桩' },
    { name: '温泉新区超充站', category: '停车充电', lat: 31.0209, lng: 113.1238, badgeIcon: '⚡', badgeBg: '#1c73e8', priceOrMeta: '闲14桩', desc: '120kW超充 · 距场馆200m' },
    { name: '赛场医疗急救/AED', category: '便民景点', lat: 31.0216, lng: 113.1174, badgeIcon: '🏥', badgeBg: '#df2e38', priceOrMeta: '24h值守', desc: '配备AED与赛后运动康复绿色通道' },
  ],
  'venue-training-base': [
    { name: '京山国际网球公寓', category: '酒店', lat: 31.0236, lng: 113.1228, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥168', desc: '距训练基地300m · 陪读集训首选公寓' },
    { name: '温泉新区青年公寓', category: '酒店', lat: 31.0196, lng: 113.1264, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥138', desc: 'Loft复式短长租 · 球友共享客厅' },
    { name: '京源温泉私汤民宿', category: '酒店', lat: 31.0282, lng: 113.1318, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥468', desc: '私汤入户 · 赛后泡温泉舒缓肌肉' },
    { name: '省网校营养食堂', category: '美食', lat: 31.0252, lng: 113.1258, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥38', desc: '运动员配餐标准 · 干净卫生实惠' },
    { name: '温泉土菜坊', category: '美食', lat: 31.0222, lng: 113.1282, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥62', desc: '现炖土鸡汤与京山桥米饭 · 票根85折' },
    { name: '训练基地P2停车场', category: '停车充电', lat: 31.0249, lng: 113.1222, badgeIcon: '🅿️', badgeBg: '#0d7a58', priceOrMeta: '剩112位', desc: '大巴及自驾车位充足 · 免费停放' },
    { name: '温泉新区超充站', category: '停车充电', lat: 31.0215, lng: 113.1235, badgeIcon: '⚡', badgeBg: '#1c73e8', priceOrMeta: '闲18桩', desc: '120kW快充 · 满电即走' },
    { name: '湖北省网球学校', category: '便民景点', lat: 31.0262, lng: 113.1241, badgeIcon: '🎓', badgeBg: '#0ea5a4', priceOrMeta: '官方评测', desc: '体教融合示范校 · 五维能力晋升点' },
  ],
  'venue-wenfeng': [
    { name: '锦江IU酒店(文峰公园店)', category: '酒店', lat: 31.0196, lng: 113.1095, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥132', desc: '步行5分钟到文峰球场 · 停车方便' },
    { name: '惠亭湖畔精品酒店', category: '酒店', lat: 31.0156, lng: 113.1098, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥355', desc: '一线河景阳台 · 票根享85折' },
    { name: '城市便捷酒店(新市大道)', category: '酒店', lat: 31.0208, lng: 113.1156, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥136', desc: '近文峰商圈 · 性价比高' },
    { name: '文峰河畔夜市烧烤街', category: '美食', lat: 31.0169, lng: 113.1139, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥55', desc: '步行300m · 68家摊位 · 票根赠米茶' },
    { name: '新市老字号桥米馆', category: '美食', lat: 31.0199, lng: 113.1121, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥48', desc: '地道京山桥米与排骨藕汤' },
    { name: '文峰公园P2停车场', category: '停车充电', lat: 31.0176, lng: 113.1116, badgeIcon: '🅿️', badgeBg: '#0d7a58', priceOrMeta: '剩42位', desc: '距球场120m · 夜间好停车' },
    { name: '文峰广场快充站', category: '停车充电', lat: 31.0202, lng: 113.1108, badgeIcon: '⚡', badgeBg: '#1c73e8', priceOrMeta: '闲9桩', desc: '商场配套快充 · 步行4分钟' },
    { name: '京山国际影城IMAX', category: '便民景点', lat: 31.0211, lng: 113.1104, badgeIcon: '🎬', badgeBg: '#7c3aed', priceOrMeta: '影票¥32起', desc: '中百广场4楼 · 赛后观影休闲' },
  ],
  'venue-senior': [
    { name: '嘉泰大酒店(中百店)', category: '酒店', lat: 31.0226, lng: 113.1072, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥128', desc: '城区核心位置 · 步行6分钟到场' },
    { name: '王府·君赞酒店', category: '酒店', lat: 31.0238, lng: 113.1118, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥258', desc: '品质商务酒店 · 含双早免费停车' },
    { name: '京源大道私房鄂菜', category: '美食', lat: 31.0198, lng: 113.1088, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥52', desc: '本地市民口碑老店 · 现炒家常菜' },
    { name: '老年大学免费停车场', category: '停车充电', lat: 31.0215, lng: 113.1095, badgeIcon: '🅿️', badgeBg: '#0d7a58', priceOrMeta: '剩36位', desc: '地面免费车位 · 进出便捷' },
    { name: '京源大道市政充电桩', category: '停车充电', lat: 31.0203, lng: 113.1114, badgeIcon: '⚡', badgeBg: '#1c73e8', priceOrMeta: '闲6桩', desc: '快充/慢充齐全' },
    { name: '市人民医院运动康复', category: '便民景点', lat: 31.0228, lng: 113.1135, badgeIcon: '🏥', badgeBg: '#df2e38', priceOrMeta: '三甲保障', desc: '运动损伤诊疗与赛后理疗' },
  ],
  'venue-yongxing': [
    { name: '丽枫酒店(京山汽车中心店)', category: '酒店', lat: 31.0142, lng: 113.1588, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥182', desc: '距永兴球馆600m · 舒适商务' },
    { name: '豪威柏悦大酒店', category: '酒店', lat: 31.0086, lng: 113.1652, badgeIcon: '🏨', badgeBg: '#6c5ce7', priceOrMeta: '¥162', desc: '近高铁站方向 · 免费停车' },
    { name: '永兴土灶农家小院', category: '美食', lat: 31.0124, lng: 113.1658, badgeIcon: '🍜', badgeBg: '#f25c43', priceOrMeta: '人均¥58', desc: '招牌柴火鸡与时令鲜蔬' },
    { name: '永兴体育馆免费停车', category: '停车充电', lat: 31.0106, lng: 113.1612, badgeIcon: '🅿️', badgeBg: '#0d7a58', priceOrMeta: '剩68位', desc: '场馆门口超大免费停车场' },
    { name: '永兴新能源超充站', category: '停车充电', lat: 31.0121, lng: 113.1596, badgeIcon: '⚡', badgeBg: '#1c73e8', priceOrMeta: '闲10桩', desc: '120kW快充 · 免费停2h' },
    { name: '永兴亲子运动驿站', category: '便民景点', lat: 31.0094, lng: 113.1636, badgeIcon: '🎠', badgeBg: '#0ea5a4', priceOrMeta: '亲子¥68', desc: '无动力乐园 + 儿童短式网球区' },
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
  return L.divIcon({
    className: 'js-amap-pin',
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-88%);pointer-events:auto;">
      <div style="display:inline-flex;align-items:center;gap:4px;background:#ffffff;border:1.5px solid ${poi.badgeBg};padding:2px 7px 2px 3px;box-shadow:0 3px 10px rgba(16,37,31,0.22);white-space:nowrap;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:${poi.badgeBg};color:#fff;font-size:11px;">${poi.badgeIcon}</span>
        <strong style="font-size:12px;font-weight:900;color:#10251f;">${poi.priceOrMeta}</strong>
      </div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid ${poi.badgeBg};"></div>
      <div style="margin-top:1px;padding:1px 5px;background:rgba(255,255,255,0.92);color:#10251f;font-size:11px;font-weight:800;white-space:nowrap;text-shadow:0 1px 0 #fff;border:1px solid rgba(16,37,31,0.1);">${poi.name}</div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

function makeVenueFocalIcon(name: string, price: number, isActive: boolean) {
  const shortName = name.split('（')[0] ?? name
  if (isActive) {
    return L.divIcon({
      className: 'js-amap-pin',
      html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-92%);z-index:999;">
        <div style="display:inline-flex;align-items:center;gap:5px;background:#0b251d;color:#c4f63d;border:2px solid #c4f63d;padding:4px 10px;box-shadow:0 6px 18px rgba(11,37,29,0.45);white-space:nowrap;">
          <span style="font-size:13px;">🎾</span>
          <strong style="font-size:12.5px;font-weight:900;">${shortName}</strong>
          <span style="background:#c4f63d;color:#0b251d;padding:0 5px;font-size:11px;font-weight:900;">${price === 0 ? '免费起' : `¥${price}起`}</span>
        </div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid #0b251d;"></div>
      </div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    })
  }
  return L.divIcon({
    className: 'js-amap-pin',
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-86%);opacity:0.9;">
      <div style="display:inline-flex;align-items:center;gap:4px;background:#0d7a58;color:#fff;border:1.5px solid #fff;padding:2px 7px;box-shadow:0 3px 10px rgba(0,0,0,0.22);white-space:nowrap;">
        <span style="font-size:11px;">🎾</span>
        <strong style="font-size:11px;">${shortName}</strong>
      </div>
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
    <div style="font-size:11.5px;color:#526861;margin:4px 0 8px;">${desc}<br/><span style="color:#859B93;">坐标：${lng.toFixed(4)}°E, ${lat.toFixed(4)}°N</span></div>
    <div style="display:flex;gap:6px;">
      <a href="${amap}" target="_blank" rel="noopener" style="flex:1;text-align:center;padding:4px 8px;background:#0D7A58;color:#fff;font-size:11px;font-weight:700;text-decoration:none;">高德导航</a>
      <a href="${baidu}" target="_blank" rel="noopener" style="flex:1;text-align:center;padding:4px 8px;background:#1C73E8;color:#fff;font-size:11px;font-weight:700;text-decoration:none;">百度导航</a>
    </div>
  </div>`
}

function renderOverlays(animatePan = false) {
  if (!map || !overlayGroup) return
  overlayGroup.clearLayers()

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

    for (const poi of VENUE_POIS['venue-international']!.filter((p) => p.category === '停车充电')) {
      L.marker([poi.lat, poi.lng], { icon: makeAmapPoiIcon(poi) })
        .bindPopup(popupHtml(poi.name, `${poi.priceOrMeta} · ${poi.desc}`, poi.lat, poi.lng))
        .addTo(overlayGroup)
    }
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
    L.marker(DEFAULT_CENTER, { icon: makeSimpleIcon('🎾 京山国际网球中心', '#0B251D', '#C4F63D', '#C4F63D') }).addTo(overlayGroup)
    const amPois: MapPoi[] = [
      { name: '星级公厕/母婴室', category: '便民景点', lat: 31.0224, lng: 113.1215, badgeIcon: '🚻', badgeBg: '#0ea5a4', priceOrMeta: '24h开放', desc: '无障碍与恒温母婴间' },
      { name: '医疗保障/急救AED', category: '便民景点', lat: 31.0195, lng: 113.1245, badgeIcon: '🏥', badgeBg: '#df2e38', priceOrMeta: '急救绿通', desc: '配备AED、救护车及运动康复' },
      { name: '温泉新区超充站', category: '停车充电', lat: 31.0212, lng: 113.1228, badgeIcon: '⚡', badgeBg: '#1c73e8', priceOrMeta: '闲14桩', desc: '120kW快充 · 订场联动预约' },
      { name: '24h ATM自助点', category: '便民景点', lat: 31.0241, lng: 113.1146, badgeIcon: '🏧', badgeBg: '#d6961f', priceOrMeta: '24h服务', desc: '文峰花园酒店旁 · 支持外卡' },
    ]
    for (const poi of amPois) {
      L.marker([poi.lat, poi.lng], { icon: makeAmapPoiIcon(poi) })
        .bindPopup(popupHtml(poi.name, poi.desc, poi.lat, poi.lng))
        .addTo(overlayGroup)
    }
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
    L.marker([v.lat, v.lng], { icon: makeVenueFocalIcon(v.name, v.minPrice, false), zIndexOffset: 200 })
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
  () => [props.mode, props.radius, props.poiCategory, props.venues?.length],
  () => renderOverlays(false),
)
watch(
  () => props.selectedVenue?.id,
  () => renderOverlays(true),
)

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

    <!-- 左下角图例悬浮条（清晰一眼看懂） -->
    <div
      v-if="mode === 'courts'"
      style="
        position: absolute;
        left: 10px;
        bottom: 10px;
        z-index: 400;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #d5e3dd;
        padding: 5px 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 11px;
        font-weight: 700;
        color: #2b433b;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      "
    >
      <span><b style="color: #6c5ce7">■</b> 酒店</span>
      <span><b style="color: #f25c43">■</b> 美食</span>
      <span><b style="color: #0d7a58">■</b> 停车</span>
      <span><b style="color: #1c73e8">■</b> 充电</span>
      <span><b style="color: #df2e38">■</b> 医疗/景点</span>
    </div>
  </div>
</template>
