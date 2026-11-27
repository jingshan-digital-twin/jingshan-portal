<script setup lang="ts">
import { computed, ref } from 'vue'
import { RESTAURANT_MENUS } from '../../mock/data'
import { usePortalStore } from '../../store/usePortalStore'

const { state, openPhoto, openActionModal, openNavigation } = usePortalStore()
const foodTab = ref<'全部' | '联盟85折' | '农家菜' | '夜市' | '团餐'>('全部')

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
    menu: '国宝桥米锅巴 ¥48 ｜ 洪湖排骨藕汤 ¥68 ｜ 惠亭湖刁子鱼 ¥56',
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
    quote: '打完球出示订场票根直接减了¥30，桥米锅巴香到光盘！',
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
    menu: '山泉土鸡汤 ¥98 ｜ 京山香菇滑鸡 ¥52 ｜ 农家腊肉炒竹笋 ¥46',
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
    quote: '现杀土鸡配本地桥米饭，明码标价童叟无欺，强烈推荐！',
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
    menu: '秘制小龙虾 ¥88 ｜ 京山米茶 ¥8 ｜ 运动低脂鸡胸沙拉 ¥36',
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
    quote: '打完夜场球走3分钟就到，球友聚餐氛围超棒！',
    avg: 58,
  },
]

const groupVenues = [
  {
    name: '文峰迎宾馆赛事宴会厅',
    rating: 4.9,
    desc: '可同时接待 320 人 · 运动员营养自助 ¥60/人起 · 距赛场0.8km',
    address: '温泉街道京山大道128号文峰迎宾馆二楼',
    lng: 113.1146,
    lat: 31.0241,
    dist: '距赛场 0.8km',
    driveMin: '驾车约 3 分钟',
  },
  {
    name: '京源网球中心餐厅（定点）',
    rating: 4.8,
    desc: '可接待 200 人 · 赛间简餐/团餐 ¥45/人起 · 场馆内步行2分钟',
    address: '温泉街道网球大道1号国际网球中心东附楼',
    lng: 113.1202,
    lat: 31.0215,
    dist: '场馆内 150m',
    driveMin: '步行约 2 分钟',
  },
  {
    name: '温泉度假区生态宴会中心',
    rating: 4.9,
    desc: '可接待 400 人 · 鄂菜庆功宴 ¥880/桌起 · 免费大巴泊位',
    address: '温泉街道天沐温泉度假区东区宴会楼',
    lng: 113.1408,
    lat: 31.0305,
    dist: '距赛场 3.4km',
    driveMin: '驾车约 8 分钟',
  },
]

const visibleShops = computed(() =>
  foodTab.value === '全部' || foodTab.value === '团餐'
    ? restaurants
    : restaurants.filter((r) => r.cat === foodTab.value),
)
</script>

<template>
  <section>
    <div class="module-header">
      <div class="mh-left">
        <div class="mh-num">04</div>
        <div>
          <h1 class="mh-title">“吃”：美食服务</h1>
          <div class="mh-desc">
            京网推荐美食（特色餐饮、农家菜、本地特色店铺的精确坐标位置导航、完整菜单与真实评价）、网球联盟票根核销、以及团餐与赛事接待定点餐饮推荐
          </div>
        </div>
      </div>
      <div class="mh-tabs">
        <button
          v-for="t in (['全部', '联盟85折', '农家菜', '夜市', '团餐'] as const)"
          :key="t"
          class="m-tab"
          :class="{ active: foodTab === t }"
          @click="foodTab = t"
        >
          {{ t === '全部' ? '全部推荐美食' : t === '团餐' ? '赛事团餐定点' : t }}
        </button>
      </div>
    </div>

    <div class="ticket-stub-banner mb-16">
      <div>
        <div style="font-size: 15px; font-weight: 900">🎫 票根经济 · 打球凭证直享「京山网球联盟商家」餐饮特惠</div>
        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.82); margin-top: 2px">
          您的今日订场票根 <strong style="color: var(--lime)">{{ state.ticketStubCode }}</strong> 已激活：仅限全市
          <strong>79 家认证网球联盟商家</strong>（含26家餐饮）核销立减与85折！
        </div>
      </div>
      <button class="btn-orange" @click="openActionModal({ type: 'stub', code: state.ticketStubCode })">
        出示我的电子票根码
      </button>
    </div>

    <div v-if="foodTab !== '团餐'" class="grid-3 mb-16">
      <div v-for="shop in visibleShops" :key="shop.name" class="card">
        <div
          class="photo-box"
          style="height: 165px"
          @click="
            openPhoto({
              title: shop.name,
              category: '京网推荐美食详情',
              photo: shop.photo,
              rating: shop.rating,
              subtitle: `${shop.badge} ｜ ${shop.dist}`,
              intro: shop.intro,
              openHours: shop.openHours,
              priceInfo: `人均 ¥${shop.avg} · 核销票根立享优惠并积+60分`,
              address: shop.address,
              lng: shop.lng,
              lat: shop.lat,
              tags: shop.tags,
              highlights: shop.highlights,
              hotItemsTitle: '🔥 进店必吃 · 热门招牌菜推荐',
              hotItems: shop.hotItems,
              navTip: '凭订场电子票根进店扫码即可直接享85折/满减优惠',
              reviews: shop.detailedReviews,
            })
          "
        >
          <img :src="shop.photo" :alt="shop.name" />
          <span class="badge-tl">{{ shop.badge }}</span>
          <span class="badge-bl">{{ shop.dist }} · 点看招牌菜与热评</span>
        </div>
        <div class="card-pad">
          <div class="flex-between">
            <strong style="font-size: 15.5px">{{ shop.name }}</strong>
            <span class="rating-pill">★ {{ shop.rating }} ({{ shop.reviews }}评)</span>
          </div>
          <div class="coord-bar">
            <span>📍 {{ shop.address }}</span>
            <span class="coord-mono">{{ shop.lng.toFixed(4) }}°E, {{ shop.lat.toFixed(4) }}°N</span>
          </div>
          <div style="font-size: 11.5px; color: var(--ink-2); background: #f4faf7; padding: 7px 9px; border-radius: 8px; margin: 6px 0">
            <strong>📖 招牌菜单：</strong>{{ shop.menu }}
          </div>
          <div class="review-quote">💬 评：“{{ shop.quote }}”</div>
          <div class="flex-between" style="margin-top: 10px">
            <span class="price" style="font-size: 17px">¥{{ shop.avg }}<small>/人均 · 核销+60分</small></span>
            <div class="flex-row">
              <button
                class="btn-ghost"
                @click="
                  openActionModal({
                    type: 'menu',
                    shopName: shop.name,
                    dist: shop.dist,
                    address: shop.address,
                    lng: shop.lng,
                    lat: shop.lat,
                    dishes: RESTAURANT_MENUS[shop.name] ?? [],
                  })
                "
              >
                📖 完整菜单
              </button>
              <button
                class="btn-primary"
                @click="
                  openNavigation({
                    placeName: shop.name,
                    address: shop.address,
                    lng: shop.lng,
                    lat: shop.lat,
                    distance: shop.dist,
                    driveMin: shop.driveMin,
                    tip: '凭订场电子票根进店扫码即可直接享85折/满减优惠，支持高德/百度一键导航',
                  })
                "
              >
                🧭 导航
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card card-pad" style="background: #fffbf2; border-color: #f2d59b">
      <div class="flex-between" style="margin-bottom: 10px">
        <div>
          <strong style="font-size: 16px; color: #6e4300">🍱 团餐及赛事接待定点餐饮推荐（市场监管A级食安保障）</strong>
          <div style="font-size: 12px; color: #8d6524">
            面向参赛代表队、网球研学团、企业团建 · 支持定制运动员低脂高蛋白营养餐与大巴停靠
          </div>
        </div>
        <button
          class="btn-orange"
          @click="openActionModal({ type: 'inquiry', title: '赛事团餐 / 研学团队用餐预订', subtitle: '支持 10–400 人定制菜单与运动员营养自助餐，食安 A 级保障', submitLabel: '提交团餐预订需求' })"
        >
          一键提交团餐需求
        </button>
      </div>
      <div class="grid-3">
        <div
          v-for="gv in groupVenues"
          :key="gv.name"
          style="background: #fff; border: 1px solid #f1dfb9; border-radius: 11px; padding: 10px 12px; font-size: 12px"
        >
          <div class="flex-between" style="margin-bottom: 4px">
            <strong>{{ gv.name }}</strong>
            <span class="rating-pill">★ {{ gv.rating }}</span>
          </div>
          <div style="color: var(--ink-2); margin-bottom: 5px">{{ gv.desc }}</div>
          <div class="flex-between" style="font-size: 11px; color: var(--ink-3)">
            <span>📍 {{ gv.address }} ({{ gv.lng.toFixed(4) }}, {{ gv.lat.toFixed(4) }})</span>
            <button
              class="btn-ghost"
              style="padding: 3px 8px; font-size: 11px; flex-shrink: 0"
              @click="
                openNavigation({
                  placeName: gv.name,
                  address: gv.address,
                  lng: gv.lng,
                  lat: gv.lat,
                  distance: gv.dist,
                  driveMin: gv.driveMin,
                  tip: '团队大巴可免费停靠专属区域，食安 A 级定点接待',
                })
              "
            >
              🧭 导航
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
