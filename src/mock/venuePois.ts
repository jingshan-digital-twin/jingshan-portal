import { MAP_ICONS } from '../components/portalMap'
import { INITIAL_COURTS } from './data'

export const VENUE_POI_FILTERS = [
  { value: '全部', label: '全部周边' },
  { value: '场馆配套', label: `${MAP_ICONS.serviceDesk} 场馆配套` },
  { value: '酒店', label: `${MAP_ICONS.hotel} 酒店` },
  { value: '美食', label: `${MAP_ICONS.food} 美食` },
  { value: '停车充电', label: `${MAP_ICONS.parking} 停车/充电` },
  { value: '便民景点', label: `${MAP_ICONS.medical} 医疗/景点` },
  { value: '康复理疗', label: `${MAP_ICONS.rehab} 康复理疗` },
] as const

export type MapPoiCategory = (typeof VENUE_POI_FILTERS)[number]['value']

export interface MapPoi {
  name: string
  label?: string
  category: Exclude<MapPoiCategory, '全部'>
  lat: number
  lng: number
  badgeIcon: string
  hotelId?: string
  simulated?: true
  priceOrMeta: string
  desc: string
}

// 各球馆的周边商家和设施演示数据。
export const VENUE_POIS: Record<string, MapPoi[]> = {
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

const FACILITY_OFFSETS: (Omit<MapPoi, 'lat' | 'lng' | 'simulated'> & { north: number; east: number })[] = [
  { name: '场馆服务台', label: '服务台', category: '场馆配套', north: 330, east: -330, badgeIcon: MAP_ICONS.serviceDesk, priceOrMeta: '签到与咨询', desc: '场地签到、预约咨询及失物招领。' },
  { name: '公共卫生间', label: '卫生间', category: '场馆配套', north: 270, east: 360, badgeIcon: MAP_ICONS.restroom, priceOrMeta: '公共设施', desc: '面向到场球友及陪同人员开放的卫生间示意点。' },
  { name: '球友休息区', label: '休息区', category: '场馆配套', north: -330, east: 330, badgeIcon: MAP_ICONS.restArea, priceOrMeta: '候场座椅', desc: '球友候场与赛间休息区，设有座椅和饮水点。' },
  { name: '球拍租借与穿线', label: '器材服务', category: '场馆配套', north: -255, east: -370, badgeIcon: MAP_ICONS.equipment, priceOrMeta: '器材服务', desc: '球拍和训练用球租借、球拍穿线服务示意点。' },
  { name: '场边急救与 AED', label: '急救/AED', category: '便民景点', north: 10, east: -435, badgeIcon: MAP_ICONS.medical, priceOrMeta: '急救设施', desc: '示意球场周边的急救服务与 AED 配置。' },
]

export function getVenuePois(venueId: string): MapPoi[] {
  const nearby = VENUE_POIS[venueId] ?? []
  const venue = INITIAL_COURTS.find((court) => court.id === venueId)
  if (!venue) return nearby

  const metersPerDegree = 111_320
  const metersPerLongitudeDegree = metersPerDegree * Math.cos(venue.lat * Math.PI / 180)
  const facilities = FACILITY_OFFSETS.map(({ north, east, ...facility }): MapPoi => ({
    ...facility,
    lat: venue.lat + north / metersPerDegree,
    lng: venue.lng + east / metersPerLongitudeDegree,
    simulated: true,
  }))
  return [...nearby, ...facilities]
}
