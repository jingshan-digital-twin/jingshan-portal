<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { usePortalStore } from '../../store/usePortalStore'

const { openPhoto } = usePortalStore()
const PAGE_SIZE = 4
const FOOD_CATEGORIES = ['联盟85折', '农家菜', '夜市'] as const
const foodCategory = ref<(typeof FOOD_CATEGORIES)[number] | ''>('')
const foodKeyword = ref('')
const foodPage = ref(1)
const foodSort = ref<'default' | 'price' | 'rating'>('default')

const restaurants = [
  {
    name: '桥米公馆 · 京山非遗特色鄂菜',
    cat: '联盟85折',
    address: '湖北省荆门市京山市温泉街道京山大道96号（国际网球中心西侧）',
    lng: 113.1168,
    lat: 31.0226,
    driveMin: '步行约 7 分钟',
    openHours: '10:30 – 21:30（午市/晚市全天候供餐）',
    photo: '/images/cuisine.jpg',
    badge: '🏅 网球联盟商家 · 票根85折',
    dist: '距国际网球中心 600m',
    rating: 4.9,
    reviews: 612,
    dishes: ['国宝桥米锅巴', '洪湖排骨藕汤', '惠亭湖刁子鱼'],
    intro:
      '京山最具代表性的非遗桥米主题鄂菜旗舰馆，紧邻国际网球中心。严选孙桥镇核心产区当年新磨“国宝京山桥米”配明火砂锅现焖，同时面向打球游客推出低脂高蛋白运动轻食菜品，出示京山网球订场/参赛电子票根立享全单85折。',
    tags: ['网球联盟85折', '非遗国宝桥米', '明厨亮灶A级食安', '免费停车2小时', '有大桌包厢'],
    highlights: [
      '球友专属礼遇：出示「京山网球」订场电子票根直享85折，消费自动累计 +60 金网积分',
      '每桌现焖一锅孙桥头茬新桥米，锅底金黄香脆的锅巴浇上龙骨藕汤是全店灵魂吃法',
      '步行距国际网球中心仅7分钟，支持提前致电预留包厢及球队聚餐加座',
    ],
    hotItems: [
      { name: '国宝京山桥米锅巴', price: '票根价 ¥41', tag: '必点No.1 · 原价¥48', desc: '金黄酥脆的桥米手工锅巴淋秘制肉末鲜汁，咔嚓作响米香四溢。' },
      { name: '洪湖粉藕煨龙骨汤', price: '票根价 ¥58', tag: '进店95%必点', desc: '文火煨制4小时，粉藕拉丝软糯、汤色乳白鲜浓，赛后补水暖胃首选。' },
      { name: '香煎惠亭湖野生刁子鱼', price: '票根价 ¥48', tag: '本地特色', desc: '外酥里嫩、椒盐微辣，配桥米饭能连干两碗。' },
      { name: '嫩煎低脂鸡胸配有机时蔬', price: '票根价 ¥36', tag: '球友轻食', desc: '专为参赛选手与减脂球友打造的低油高蛋白运动营养餐。' },
    ],
    detailedReviews: [
      { user: '武汉老陈', origin: '武汉', score: 5.0, date: '2026-11-25', content: '打完球出示订场票根直接打85折省了30多块！桥米锅巴和排骨藕汤绝配，藕粉糯拉丝，光盘行动直接拉满！' },
      { user: '长沙欣然妈妈', origin: '长沙', score: 4.9, date: '2026-11-22', content: '带娃打中青赛连吃了三顿，特意夸一下他家的低脂鸡胸和清炒葛粉，清淡不油腻，孩子赛前吃很放心。' },
      { user: '深圳球友小周', origin: '深圳', score: 4.9, date: '2026-11-19', content: '惠亭湖刁子鱼煎得太香了，吃完饭顺手在店里买了两盒同款有机桥米寄回深圳。' },
    ],
    avg: 78,
  },
  {
    name: '绿林山水农家土菜馆',
    cat: '农家菜',
    address: '湖北省荆门市京山市绿林镇绿林山风景区南门200米处',
    lng: 112.9781,
    lat: 31.3402,
    driveMin: '景区入口步行 3 分钟',
    openHours: '09:30 – 20:30',
    photo: '/images/scenic.jpg',
    badge: '🏅 网球联盟商家 · 票根满100减25',
    dist: '绿林山景区入口 200m',
    rating: 4.8,
    reviews: 384,
    dishes: ['山泉土鸡汤', '京山香菇滑鸡', '农家腊肉炒竹笋'],
    intro:
      '扎根绿林山南门15年的口碑农家老店，坚持使用大洪山泉水与山林散养土鸡、自家地窖腊肉、当年椴木花菇和柴火铁锅焖桥米饭。明码标价童叟无欺，是打球延伸游绿林山必吃的宝藏土菜馆。',
    tags: ['票根满100减25', '柴火铁锅现炖', '山林散养土鸡', '明码标价零套路'],
    highlights: [
      '游览美人谷前可先到店点好土鸡汤，下山直接上桌无需久等',
      '所有食材均为绿林山区农户直供，花菇、葛粉与腊肉支持饭后真空打包带走',
    ],
    hotItems: [
      { name: '绿林山泉散养土鸡汤（整只）', price: '票根价 ¥83', tag: '镇店招牌', desc: '金黄鸡油漂浮、肉质紧实弹牙，加几朵绿林干花菇鲜掉眉毛。' },
      { name: '农家柴火腊肉炒鲜春笋', price: '票根价 ¥39', tag: '下饭神器', desc: '柏树枝熏制腊肉肥而不腻，配脆嫩山笋香气扑鼻。' },
      { name: '柴火铁锅原味桥米饭', price: '票根价 ¥15/份', tag: '主食必点', desc: '柴火大铁锅焖出厚厚一层香脆锅巴，米香扑鼻。' },
      { name: '京山花菇滑鸡煲', price: '票根价 ¥44', tag: '鲜香浓郁', desc: '本地厚肉椴木花菇吸满鸡汁，老人小孩都爱吃。' },
    ],
    detailedReviews: [
      { user: '宜昌自驾球友', origin: '宜昌', score: 4.9, date: '2026-11-24', content: '逛完美人谷饿得不行，进店喝了三碗土鸡汤，现杀土鸡配铁锅桥米饭香绝了，用网球票根还立减25元！' },
      { user: '武汉小李', origin: '武汉', score: 4.8, date: '2026-11-20', content: '景区门口居然一点不宰客，菜单明码标价份量很足，腊肉炒竹笋特别正宗。' },
      { user: '北京家长王女士', origin: '北京', score: 4.8, date: '2026-11-17', content: '老板娘很实在，主动提醒我们4个人点3个菜就够吃，汤鲜味美非常推荐！' },
    ],
    avg: 65,
  },
  {
    name: '文峰河畔老字号碳火烧烤 & 轻食街',
    cat: '夜市',
    address: '湖北省荆门市京山市新市街道文峰河滨夜市街区A区12号',
    lng: 113.1135,
    lat: 31.0172,
    driveMin: '步行约 4 分钟',
    openHours: '17:00 – 次日 02:00',
    photo: '/images/night_market.jpg',
    badge: '🌙 夜经济联盟 · 票根赠饮品',
    dist: '距文峰公园球场 300m',
    rating: 4.9,
    reviews: 520,
    dishes: ['秘制小龙虾', '京山米茶', '运动低脂鸡胸沙拉'],
    intro:
      '位于文峰公园网球场步行仅300米的京山夜宵人气地标！既有荆楚风味十足的秘制油焖大虾、现切鲜牛肉碳火小串与冰爽京山传统米茶，也贴心为夜打球友准备了高蛋白运动轻食沙拉和电解质特饮，河畔晚风氛围感拉满。',
    tags: ['距文峰球场300m', '营业至凌晨2点', '票根赠冰镇米茶', '夜场球友聚餐据点'],
    highlights: [
      '打完20:00-22:00夜场球步行4分钟即可落座，超大临河外摆桌轻松容纳20人球友局',
      '凭「京山网球」电子票根每桌免费赠送1扎解暑京山米茶，消费同步积+60分',
    ],
    hotItems: [
      { name: '秘制油焖小龙虾（大份）', price: '票根价 ¥75', tag: '夜宵人气王', desc: '潜江/京山稻田清水鲜虾，个大腮白、酱香微辣回甜，吮指留香。' },
      { name: '现烤鲜牛肉小串（20串）', price: '票根价 ¥41', tag: '碳火现串', desc: '本地黄牛肉带筋现穿，果木炭烤外焦里嫩，孜然飘香。' },
      { name: '京山传统解暑米茶（扎）', price: '票根免费赠', tag: '京山特色', desc: '炒香稻米冷水冲泡，微甜清爽解腻，吃烧烤小龙虾绝配！' },
      { name: '赛后补给轻食沙拉碗', price: '票根价 ¥30', tag: '球友控卡', desc: '藜麦、煎鸡胸、牛油果与鲜橙油醋汁，夜间打球无负担。' },
    ],
    detailedReviews: [
      { user: '夜场双打老王', origin: '京山', score: 5.0, date: '2026-11-25', content: '每周三、周五在文峰打完夜场必来这聚餐！油焖虾入味、牛肉串鲜嫩，冰米茶喝一口太爽了！' },
      { user: '上海球友Mia', origin: '上海', score: 4.9, date: '2026-11-23', content: '没想到京山夜市还有专门给打球人做的轻食沙拉，河边灯光超美，烟火气十足！' },
      { user: '武汉小刘', origin: '武汉', score: 4.9, date: '2026-11-18', content: '出示电子票根直接送了一大扎米茶，人均50多吃到撑，来京山一定要体验文峰夜打+河畔夜宵！' },
    ],
    avg: 58,
  },
  {
    name: '硒泉鱼庄 · 温泉小镇店',
    cat: '联盟85折',
    address: '湖北省荆门市京山市温泉街道温泉大道18号',
    lng: 113.1287,
    lat: 31.0294,
    driveMin: '驾车约 6 分钟',
    openHours: '11:00 – 21:30',
    photo: '/images/cuisine.jpg',
    badge: '🎫 票根85折 · 温泉鱼头招牌',
    dist: '距国际网球中心 2.1km',
    rating: 4.7,
    reviews: 326,
    dishes: ['温泉鱼头煲', '香煎小白鱼', '葛粉圆子'],
    intro:
      '温泉小镇里的本地鱼庄，招牌温泉鱼头煲用惠亭湖胖头鱼慢炖，汤白味浓。打完球泡完汤过来吃一顿，凭电子票根整单 85 折。',
    tags: ['网球联盟85折', '温泉鱼头煲', '可停8辆车', '有包间'],
    highlights: ['出示「京山网球」电子票根整单 85 折，消费累计 +60 金网积分', '鱼头每日现杀，汤底吊足三小时，配手工葛粉圆子'],
    hotItems: [
      { name: '温泉鱼头煲（3—4人）', price: '票根价 ¥75', tag: '必点', desc: '胖头鱼头配豆腐千张，汤白鲜浓可续汤。' },
      { name: '香煎惠亭湖小白鱼', price: '票根价 ¥41', tag: '本地味', desc: '外酥里嫩，椒盐微辣，下酒下饭都合适。' },
    ],
    detailedReviews: [
      { user: '荆门球友老周', origin: '荆门', score: 4.7, date: '2026-11-23', content: '泡完温泉过来吃鱼头，汤鲜得能喝三碗，票根还打了折。' },
    ],
    avg: 72,
  },
  {
    name: '桥米煲仔饭 · 文峰店',
    cat: '联盟85折',
    address: '湖北省荆门市京山市新市街道文峰路22号',
    lng: 113.1129,
    lat: 31.0206,
    driveMin: '步行约 4 分钟',
    openHours: '10:30 – 21:00',
    photo: '/images/cuisine.jpg',
    badge: '🎫 票根85折 · 快出餐',
    dist: '距文峰公园球场 300m',
    rating: 4.6,
    reviews: 410,
    dishes: ['腊味煲仔饭', '桥米鸡蓉粥', '例汤'],
    intro:
      '打完球想快速解决一餐的最佳选择：砂锅现焖桥米煲仔饭，锅巴焦香，出餐快、分量足，凭票根 85 折。',
    tags: ['网球联盟85折', '出餐快', '单人友好', '可打包'],
    highlights: ['电子票根 85 折，单人套餐 30 元出头就能吃饱', '桥米现焖，锅巴另装一小碟，脆到最后一口'],
    hotItems: [
      { name: '腊味双拼煲仔饭', price: '票根价 ¥27', tag: '招牌', desc: '腊肠腊肉双拼，配一份时蔬与例汤。' },
      { name: '桥米鸡蓉粥', price: '票根价 ¥15', tag: '赛前轻食', desc: '好消化不顶胃，适合赛前一小时吃。' },
    ],
    detailedReviews: [
      { user: '武汉球友小林', origin: '武汉', score: 4.6, date: '2026-11-24', content: '打完早场过来十分钟就上饭，锅巴香脆，价格也实惠。' },
    ],
    avg: 38,
  },
  {
    name: '老湾土菜馆 · 惠亭湖畔',
    cat: '农家菜',
    address: '湖北省荆门市京山市新市街道惠亭湖东岸老湾村',
    lng: 113.0832,
    lat: 31.0301,
    driveMin: '驾车约 16 分钟',
    openHours: '11:00 – 20:30',
    photo: '/images/cuisine.jpg',
    badge: '🐔 柴火土鸡 · 湖边院子',
    dist: '距国际网球中心 9.4km',
    rating: 4.8,
    reviews: 512,
    dishes: ['柴火土鸡', '湖水煮鱼', '蒸白花菜'],
    intro:
      '开在惠亭湖边的老院子，柴火灶现炖散养土鸡，配自家腌的白花菜和湖边时蔬，是本地人周末聚餐常去的一家。',
    tags: ['柴火灶土鸡', '湖边院子', '亲子友好', '免费停车'],
    highlights: ['土鸡现点现炖约 40 分钟，建议提前电话预订', '院子临湖，能边吃边看水面落日'],
    hotItems: [
      { name: '柴火灶散养土鸡（半只）', price: '¥88', tag: '招牌', desc: '柴火慢炖，汤色金黄，配手工面条。' },
      { name: '湖水煮活鱼', price: '¥68', tag: '本地做法', desc: '只放姜葱与本地豆瓣，吃鱼本味。' },
    ],
    detailedReviews: [
      { user: '京山本地阿珍', origin: '京山', score: 4.8, date: '2026-11-21', content: '带外地朋友来的，土鸡炖得脱骨，院子里坐着很舒服。' },
    ],
    avg: 58,
  },
  {
    name: '太子山下的院子 · 柴火灶',
    cat: '农家菜',
    address: '湖北省荆门市京山市太子山林场路6号',
    lng: 113.0172,
    lat: 31.0408,
    driveMin: '驾车约 20 分钟',
    openHours: '11:30 – 21:00',
    photo: '/images/cuisine.jpg',
    badge: '🔥 柴火焖鹅 · 山野时蔬',
    dist: '距国际网球中心 13km',
    rating: 4.7,
    reviews: 298,
    dishes: ['柴火焖鹅', '山笋炒腊肉', '野菜煎蛋'],
    intro:
      '去太子山徒步、看玻璃栈道后顺路吃饭的院子菜，招牌柴火焖鹅分量足，山笋、野菜都是当天从林场收的。',
    tags: ['柴火焖鹅', '山野时蔬', '适合团队', '院子停车'],
    highlights: ['焖鹅需提前 1 小时预订，6—8 人一只刚好', '窗外就是林场，秋天能看到整片水杉'],
    hotItems: [
      { name: '柴火焖鹅（6—8人）', price: '¥128', tag: '招牌', desc: '铁锅焖足两小时，配土豆与魔芋。' },
      { name: '山笋炒腊肉', price: '¥58', tag: '当季', desc: '春笋季最香，平时用笋干。' },
    ],
    detailedReviews: [
      { user: '荆门自驾客', origin: '荆门', score: 4.7, date: '2026-11-18', content: '爬完太子山过来吃焖鹅，锅气足，分量给得实在。' },
    ],
    avg: 65,
  },
  {
    name: '老张烤鱼大排档 · 新市大道',
    cat: '夜市',
    address: '湖北省荆门市京山市新市大道夜市B区12号',
    lng: 113.1186,
    lat: 31.0219,
    driveMin: '驾车约 13 分钟',
    openHours: '17:00 – 次日 01:00',
    photo: '/images/night_market.jpg',
    badge: '🌙 深夜食堂 · 炭火烤鱼',
    dist: '距国际网球中心 8km',
    rating: 4.6,
    reviews: 730,
    dishes: ['炭火烤鱼', '牛油小串', '炒米粉'],
    intro:
      '新市大道夜市里开了十几年的烤鱼摊，炭火现烤草鱼，配土豆片豆皮，是本地人下夜班和球友夜宵的固定据点。',
    tags: ['炭火烤鱼', '营业到凌晨', '明码标价', '人均50'],
    highlights: ['营业到凌晨 1 点，打完夜场过来还热乎', '烤鱼现杀现烤，15 分钟上桌'],
    hotItems: [
      { name: '炭火烤鱼（2—3人）', price: '¥78', tag: '招牌', desc: '草鱼现杀，配土豆片、豆皮、藕片。' },
      { name: '牛油小串（10串）', price: '¥30', tag: '下酒', desc: '现穿现烤，趁热吃最香。' },
    ],
    detailedReviews: [
      { user: '京山本地阿凯', origin: '京山', score: 4.6, date: '2026-11-25', content: '十点多过来还满座，烤鱼入味，价格也实在。' },
    ],
    avg: 48,
  },
  {
    name: '温泉夜市 · 米茶与小龙虾铺',
    cat: '夜市',
    address: '湖北省荆门市京山市温泉街道温泉小镇商业街A区',
    lng: 113.1303,
    lat: 31.0261,
    driveMin: '步行约 9 分钟',
    openHours: '18:00 – 23:30',
    photo: '/images/night_market.jpg',
    badge: '🦐 油焖大虾 · 冰镇米茶',
    dist: '距国际网球中心 700m',
    rating: 4.5,
    reviews: 366,
    dishes: ['油焖大虾', '冰镇米茶', '卤藕'],
    intro:
      '离球场最近的一摊宵夜：夏天油焖大虾、冬天羊肉汤，配一杯冰镇京山米茶解腻，走回酒店只要十分钟。',
    tags: ['步行可达', '油焖大虾', '京山米茶', '可打包'],
    highlights: ['距球场步行约 9 分钟，吃完走回酒店正好消食', '米茶现熬放凉，解辣解腻'],
    hotItems: [
      { name: '油焖大虾（约2斤）', price: '¥98', tag: '当季', desc: '每日鲜活到货，蒜香微辣。' },
      { name: '冰镇京山米茶', price: '¥6', tag: '解腻', desc: '本地大麦炒制熬煮，微苦回甘。' },
    ],
    detailedReviews: [
      { user: '襄阳小敏', origin: '襄阳', score: 4.5, date: '2026-11-20', content: '住温泉这边，晚上下来吃虾喝米茶，走回去很近。' },
    ],
    avg: 55,
  },
]

const visibleShops = computed(() => {
  const q = foodKeyword.value.trim().toLowerCase()
  const list = restaurants.filter((r) => {
    const matchesCategory = !foodCategory.value || r.cat === foodCategory.value
    const okQ = !q || [r.name, r.address, ...r.dishes].some((text) => text.toLowerCase().includes(q))
    return matchesCategory && okQ
  })
  return [...list].sort((a, b) => {
    if (foodSort.value === 'price') return a.avg - b.avg
    if (foodSort.value === 'rating') return b.rating - a.rating
    return 0
  })
})

const pagedShops = computed(() => {
  const start = (foodPage.value - 1) * PAGE_SIZE
  return visibleShops.value.slice(start, start + PAGE_SIZE)
})

watch(visibleShops, () => {
  foodPage.value = 1
})

function openShopDetail(shop: (typeof restaurants)[number]) {
  openPhoto({
    title: shop.name,
    category: '京网推荐美食详情',
    photo: shop.photo,
    rating: shop.rating,
    reviewCount: shop.reviews,
    subtitle: `${shop.badge} ｜ ${shop.dist}`,
    intro: shop.intro,
    openHours: shop.openHours,
    priceInfo: `人均 ¥${shop.avg} · 核销票根立享优惠并积+60分`,
    priceNum: shop.avg,
    priceUnit: ' / 人均',
    distance: shop.dist,
    driveMin: shop.driveMin,
    address: shop.address,
    lng: shop.lng,
    lat: shop.lat,
    actionKind: 'restaurant',
    tags: shop.tags,
    highlights: shop.highlights,
    hotItemsTitle: '🔥 进店必吃 · 热门招牌菜推荐',
    hotItems: shop.hotItems,
    navTip: '凭订场电子票根进店扫码即可直接享85折/满减优惠',
    reviews: shop.detailedReviews,
  })
}
</script>

<template>
  <section>
    <div class="card card-pad mb-16 filter-workbench">
      <div class="dd-filter-grid food-filters">
        <label class="dd-field">
          <span class="dd-field-label">关键词搜索</span>
          <span class="search-bar food-search">
            <span aria-hidden="true">🔍</span>
            <input v-model="foodKeyword" type="text" placeholder="搜餐厅、招牌菜、地址…" />
          </span>
        </label>

        <label class="dd-field">
          <span class="dd-field-label">餐厅分类</span>
          <select v-model="foodCategory" class="dd-select" :class="{ active: foodCategory !== '' }">
            <option value="">全部餐厅</option>
            <option v-for="category in FOOD_CATEGORIES" :key="category" :value="category">{{ category }}</option>
          </select>
        </label>

        <label class="dd-field">
          <span class="dd-field-label">排序方式</span>
          <select v-model="foodSort" class="dd-select" :class="{ active: foodSort !== 'default' }">
            <option value="default">综合口碑</option>
            <option value="price">人均最低</option>
            <option value="rating">评分最高</option>
          </select>
        </label>
      </div>
    </div>

    <div class="mb-16">
      <p v-if="!visibleShops.length" class="card card-pad food-empty" role="status">没有符合条件的餐厅</p>
      <div v-else class="grid-2 food-grid">
        <article v-for="shop in pagedShops" :key="shop.name" class="card food-card">
          <div class="food-card-media">
            <img class="food-card-photo" :src="shop.photo" alt="" />
            <span v-if="shop.cat === '联盟85折'" class="badge-tl">票根85折</span>
          </div>
          <div class="food-card-content">
            <h2 class="food-card-heading">
              <button type="button" class="food-card-title" @click="openShopDetail(shop)">
                {{ shop.name }}
              </button>
            </h2>
            <div class="food-card-meta">
              <span class="rating-pill"><span aria-hidden="true">★</span> {{ shop.rating }} 分</span>
              <span>{{ shop.reviews }} 条评价</span>
              <span>人均 <strong>¥{{ shop.avg }}</strong></span>
            </div>
            <p>{{ shop.dist }}</p>
            <p><strong>推荐菜</strong> {{ shop.dishes.join('、') }}</p>
          </div>
        </article>
      </div>
      <PaginationBar
        :total="visibleShops.length"
        :page="foodPage"
        :page-size="PAGE_SIZE"
        unit="家餐厅"
        @update:page="foodPage = $event"
      />
    </div>
  </section>
</template>

<style scoped>
.food-filters {
  grid-template-columns: minmax(0, 1fr) repeat(2, 220px);
}

.food-search {
  flex: none;
  width: 100%;
  max-width: none;
  height: 42px;
  border-radius: 6px;
}

.food-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.food-empty {
  color: var(--ink-2);
  text-align: center;
}

.food-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 36%) minmax(0, 1fr);
  align-items: start;
  gap: 18px;
  padding: 12px;
  border-radius: 8px;
}

.food-card-media {
  position: relative;
}

.food-card-photo {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 4px;
}

.food-card-content {
  display: grid;
  align-content: start;
  gap: 5px;
  padding: 4px 0;
  color: var(--ink-2);
  font-size: 13px;
}

.food-card-heading {
  color: var(--ink);
  font-size: 17px;
  line-height: 1.4;
}

.food-card-title {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  white-space: normal;
  cursor: pointer;
}

.food-card-title::after {
  position: absolute;
  inset: 0;
  content: '';
}

.food-card-title:focus-visible {
  outline: none;
}

.food-card-title:focus-visible::after {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
  border-radius: 8px;
}

.food-card:hover .food-card-title {
  color: var(--primary-dark);
}

.food-card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
}

.food-card-meta .rating-pill {
  padding: 1px 6px;
  border-radius: 4px;
}
</style>
