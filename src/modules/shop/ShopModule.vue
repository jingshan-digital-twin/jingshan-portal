<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { PRODUCT_CATALOG } from '../../mock/details'
import { usePortalStore } from '../../store/usePortalStore'

const { openProductDetail, openPhoto, openActionModal, openNavigation } = usePortalStore()

// 主分区切换：特色商品购买 / 纪念品店铺
const shopView = ref<'goods' | 'stores'>('goods')

const PAGE_SIZE = 4

// ===== 一、特色商品购买搜索与下拉筛选 =====
const shopKeyword = ref('')
const shopTab = ref<'全部' | '农特' | '文创'>('全部')
const shopPriceRange = ref<'全部' | '60以下' | '60-100' | '100以上'>('全部')
const shopOrigin = ref<'全部' | '农产产区' | '山珍林场' | '非遗文创'>('全部')
const shopSort = ref<'default' | 'sold' | 'price' | 'rating'>('default')
const shopPage = ref(1)

const visibleProducts = computed(() => {
  const q = shopKeyword.value.trim().toLowerCase()
  const list = PRODUCT_CATALOG.filter((p) => {
    const okTab = shopTab.value === '全部' || p.cat === shopTab.value
    const okQ =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.originPlace.toLowerCase().includes(q) ||
      p.badge.toLowerCase().includes(q)
    const okPrice =
      shopPriceRange.value === '全部' ||
      (shopPriceRange.value === '60以下' && p.memberPrice < 60) ||
      (shopPriceRange.value === '60-100' && p.memberPrice >= 60 && p.memberPrice <= 100) ||
      (shopPriceRange.value === '100以上' && p.memberPrice > 100)
    const okOrigin =
      shopOrigin.value === '全部' ||
      (shopOrigin.value === '农产产区' && /孙桥|坪坝/.test(p.originPlace)) ||
      (shopOrigin.value === '山珍林场' && /绿林|大洪山/.test(p.originPlace)) ||
      (shopOrigin.value === '非遗文创' && p.cat === '文创')
    return okTab && okQ && okPrice && okOrigin
  })
  return [...list].sort((a, b) => {
    if (shopSort.value === 'sold') return b.sold - a.sold
    if (shopSort.value === 'price') return a.memberPrice - b.memberPrice
    if (shopSort.value === 'rating') return b.rating - a.rating
    return 0
  })
})

const pagedProducts = computed(() => {
  const start = (shopPage.value - 1) * PAGE_SIZE
  return visibleProducts.value.slice(start, start + PAGE_SIZE)
})

watch(visibleProducts, () => {
  shopPage.value = 1
})

function resetGoodsFilters() {
  shopKeyword.value = ''
  shopTab.value = '全部'
  shopPriceRange.value = '全部'
  shopOrigin.value = '全部'
  shopSort.value = 'default'
}

function openProduct(id: string) {
  openProductDetail(id)
}

// ===== 二、纪念品店铺搜索与下拉筛选 =====
interface OfflineStore {
  id: string
  name: string
  category: '文创纪念' | '农特产'
  area: '温泉街道' | '新市街道' | '景区产区'
  badge: string
  photo: string
  rating: number
  distanceKm: number
  address: string
  distance: string
  driveMin: string
  hours: string
  lng: number
  lat: number
  highlights: string[]
  featuredGoods: string
  benefit: string
}

const OFFLINE_STORES: OfflineStore[] = [
  {
    id: 'store-tennis-flagship',
    name: '国际网球中心文创旗舰店',
    category: '文创纪念',
    area: '温泉街道',
    badge: '官方旗舰 · 票根满150减30',
    photo: '/images/prod_tiedye_craft.jpg',
    rating: 4.9,
    distanceKm: 0.15,
    address: '温泉街道网球大道1号场馆东厅',
    distance: '距国际中心 150m',
    driveMin: '步行约 2 分钟',
    hours: '08:30 – 21:30',
    lng: 113.1198,
    lat: 31.0216,
    highlights: ['非遗扎染体验', '赛事限定徽章', '顺丰全国代寄'],
    featuredGoods: '京山网球非遗扎染方巾、中青赛纪念徽章套装、城市限定帆布包',
    benefit: '与线上商城同价，支持凭打球电子票根满150减30并顺丰代寄回家',
  },
  {
    id: 'store-wenfeng-qiaomi',
    name: '文峰广场京山桥米体验馆',
    category: '农特产',
    area: '新市街道',
    badge: '地理标志直营 · 免费试吃',
    photo: '/images/prod_qiaomi.jpg',
    rating: 4.8,
    distanceKm: 0.42,
    address: '新市街道文峰路22号（文峰广场东侧）',
    distance: '距文峰球场 420m',
    driveMin: '步行约 5 分钟',
    hours: '09:00 – 20:30',
    lng: 113.1142,
    lat: 31.0185,
    highlights: ['现焖桥米试吃', '真空伴手礼盒', '线上积分抵现'],
    featuredGoods: '孙桥核心产区头茬国宝桥米、手工桥米锅巴、富硒米茶礼盒',
    benefit: '支持到店品尝现焖桥米饭，满2盒免费全国包邮代寄',
  },
  {
    id: 'store-sunqiao-workshop',
    name: '孙桥镇国宝桥米非遗工坊店',
    category: '农特产',
    area: '景区产区',
    badge: '产地直发 · 农旅打卡',
    photo: '/images/goods.jpg',
    rating: 4.9,
    distanceKm: 18,
    address: '孙桥镇青树岭桥米文化园1号',
    distance: '距国际中心 18km',
    driveMin: '驾车约 22 分钟',
    hours: '08:30 – 18:00',
    lng: 113.1765,
    lat: 31.0942,
    highlights: ['古法碾米体验', '当季新米现装', '球队团购专享'],
    featuredGoods: '御膳级京山桥米礼箱、桥米酒酿、非遗手工米糕',
    benefit: '产地源头直供价格透明，支持球友团建整箱物流代发',
  },
  {
    id: 'store-lvlin-mountain',
    name: '绿林山珍葛粉花菇特产集合店',
    category: '农特产',
    area: '景区产区',
    badge: '景区认证 · 明码标价',
    photo: '/images/prod_kudzu_mushroom.jpg',
    rating: 4.8,
    distanceKm: 28,
    address: '绿林镇绿林山风景区游客中心西侧100米',
    distance: '距绿林山景区 100m',
    driveMin: '景区步行 2 分钟',
    hours: '08:30 – 18:30',
    lng: 112.9785,
    lat: 31.3411,
    highlights: ['野生葛粉冲泡', '椴木干花菇', '支持冷链代寄'],
    featuredGoods: '大洪山纯野生柴葛粉、厚肉椴木花菇、农家压榨山茶油',
    benefit: '文旅局认证零套路门店，凭网球票根享88折并免费打包代寄',
  },
  {
    id: 'store-wenfeng-nightshop',
    name: '文峰河畔网球文创夜市集合铺',
    category: '文创纪念',
    area: '新市街道',
    badge: '夜场逛买 · 营业至23:30',
    photo: '/images/night_market.jpg',
    rating: 4.8,
    distanceKm: 0.28,
    address: '新市街道文峰河滨夜市街区A区08号',
    distance: '距文峰球场 280m',
    driveMin: '步行约 3 分钟',
    hours: '17:30 – 23:30',
    lng: 113.1131,
    lat: 31.0169,
    highlights: ['夜打顺路打卡', '手作网球周边', '支持快递代寄'],
    featuredGoods: '京山网球主题冰箱贴、夜跑防晒冰袖、手工编织网球挂件',
    benefit: '打完夜场凭订场记录立减¥15，支持扫码直邮到家',
  },
]

const storeTab = ref<'全部' | '文创纪念' | '农特产'>('全部')
const storeArea = ref<'全部' | OfflineStore['area']>('全部')
const storeService = ref<'全部' | '快递代寄' | '体验试吃' | '夜间营业'>('全部')
const storeSort = ref<'default' | 'distance' | 'rating'>('default')
const storeKeyword = ref('')
const storePage = ref(1)

const visibleStores = computed(() => {
  const q = storeKeyword.value.trim().toLowerCase()
  const list = OFFLINE_STORES.filter((s) => {
    const okTab = storeTab.value === '全部' || s.category === storeTab.value
    const okArea = storeArea.value === '全部' || s.area === storeArea.value
    const okService =
      storeService.value === '全部' ||
      (storeService.value === '快递代寄' && /代寄|代发|直邮/.test(`${s.benefit}${s.highlights.join('')}`)) ||
      (storeService.value === '体验试吃' && /体验|试吃|冲泡/.test(`${s.badge}${s.highlights.join('')}`)) ||
      (storeService.value === '夜间营业' && /21:30|23:30/.test(s.hours))
    const okQ =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      s.featuredGoods.toLowerCase().includes(q) ||
      s.highlights.some((h) => h.toLowerCase().includes(q))
    return okTab && okArea && okService && okQ
  })
  return [...list].sort((a, b) => {
    if (storeSort.value === 'distance') return a.distanceKm - b.distanceKm
    if (storeSort.value === 'rating') return b.rating - a.rating
    return 0
  })
})

const pagedStores = computed(() => {
  const start = (storePage.value - 1) * PAGE_SIZE
  return visibleStores.value.slice(start, start + PAGE_SIZE)
})

function resetStoreFilters() {
  storeKeyword.value = ''
  storeTab.value = '全部'
  storeArea.value = '全部'
  storeService.value = '全部'
  storeSort.value = 'default'
}

function openStoreDetail(store: OfflineStore) {
  openPhoto({
    title: store.name,
    category: `线下认证门店 · ${store.category}`,
    photo: store.photo,
    rating: store.rating,
    subtitle: `${store.badge} ｜ ${store.distance}`,
    intro: `主打好物：${store.featuredGoods}。${store.benefit}。`,
    openHours: store.hours,
    priceInfo: store.badge,
    distance: store.distance,
    driveMin: store.driveMin,
    address: `湖北省荆门市京山市${store.address}`,
    lng: store.lng,
    lat: store.lat,
    actionKind: 'store',
    tags: store.highlights,
    highlights: [store.benefit, `主打商品：${store.featuredGoods}`],
    reviews: [],
  })
}

watch(visibleStores, () => {
  storePage.value = 1
})
</script>

<template>
  <section style="display: flex; flex-direction: column; gap: 18px">
    <!-- 满宽分段切换：特色商品购买 / 纪念品店铺 -->
    <div class="module-mode-bar" role="group" aria-label="购物服务">
      <button
        type="button"
        class="module-mode-btn"
        :aria-pressed="shopView === 'goods'"
        @click="shopView = 'goods'"
      >
        <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <span>特色商品购买</span>
      </button>

      <button
        type="button"
        class="module-mode-btn"
        :aria-pressed="shopView === 'stores'"
        @click="shopView = 'stores'"
      >
        <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>纪念品店铺</span>
      </button>
    </div>

    <!-- ===== 一、特色商品购买 ===== -->
    <template v-if="shopView === 'goods'">
      <div class="card card-pad filter-workbench">
        <div class="dd-filter-top">
          <div class="search-bar" style="flex: 1; min-width: 240px; max-width: 420px; height: 42px; border-radius: 6px">
            <span>🔍</span>
            <input v-model="shopKeyword" type="text" placeholder="搜索京山桥米、葛粉、白花菜、网球文创…" />
            <button v-if="shopKeyword" class="btn-ghost" style="padding: 3px 9px; font-size: 12.5px" @click="shopKeyword = ''">清空</button>
          </div>
          <div class="flex-row" style="gap: 10px">
            <button class="btn-ghost" style="border-radius: 6px" @click="resetGoodsFilters">重置筛选</button>
            <span class="dd-count-pill">共找到 {{ visibleProducts.length }} 款特色好物</span>
          </div>
        </div>

        <div class="dd-filter-grid cols-4">
          <label class="dd-field">
            <span class="dd-field-label">商品分类</span>
            <select v-model="shopTab" class="dd-select" :class="{ active: shopTab !== '全部' }">
              <option value="全部">全部好物</option>
              <option value="农特">京山农特产品</option>
              <option value="文创">网球文创纪念品</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">价格区间</span>
            <select v-model="shopPriceRange" class="dd-select" :class="{ active: shopPriceRange !== '全部' }">
              <option value="全部">全部价格</option>
              <option value="60以下">¥60 以下</option>
              <option value="60-100">¥60 – ¥100</option>
              <option value="100以上">¥100 以上</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">产地 / 特色</span>
            <select v-model="shopOrigin" class="dd-select" :class="{ active: shopOrigin !== '全部' }">
              <option value="全部">全部产地</option>
              <option value="农产产区">孙桥 / 坪坝农产</option>
              <option value="山珍林场">大洪山 / 绿林山珍</option>
              <option value="非遗文创">京山非遗文创</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">排序方式</span>
            <select v-model="shopSort" class="dd-select">
              <option value="default">综合推荐</option>
              <option value="sold">按销量最高</option>
              <option value="price">按价格最低</option>
              <option value="rating">按评分最高</option>
            </select>
          </label>
        </div>
      </div>

      <div v-if="pagedProducts.length === 0" class="card card-pad" style="text-align: center; padding: 40px 20px">
        <strong style="font-size: 16px; display: block; margin-bottom: 10px">当前筛选条件下暂无匹配商品</strong>
        <button class="btn-primary" @click="resetGoodsFilters">重置全部筛选</button>
      </div>

      <template v-else>
        <div class="grid-4">
          <div v-for="item in pagedProducts" :key="item.id" class="card" style="display: flex; flex-direction: column">
            <div
              class="photo-box"
              style="height: 190px"
              @click="openProduct(item.id)"
            >
              <img :src="item.photo" :alt="item.name" />
              <span class="badge-tl">{{ item.badge }}</span>
            </div>
            <div class="card-pad" style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 12px">
              <div>
                <div class="flex-between" style="align-items: flex-start; gap: 6px; margin-bottom: 6px">
                  <strong style="font-size: 16px; cursor: pointer" @click="openProduct(item.id)">{{ item.name }}</strong>
                  <span class="rating-pill">★ {{ item.rating }}</span>
                </div>
                <div style="font-size: 13px; color: var(--ink-2)">
                  {{ item.originPlace }} · 已售 {{ item.sold }}
                </div>
              </div>

              <div class="flex-between" style="padding-top: 10px; border-top: 1px dashed var(--line)">
                <span class="price" style="font-size: 20px">¥{{ item.memberPrice }}<small>会员价</small></span>
                <button class="btn-primary" style="padding: 6px 12px; font-size: 13px" @click="openProduct(item.id)">
                  查看详情
                </button>
              </div>
            </div>
          </div>
        </div>

        <PaginationBar
          :total="visibleProducts.length"
          :page="shopPage"
          :page-size="PAGE_SIZE"
          unit="件商品"
          @update:page="shopPage = $event"
        />
      </template>
    </template>

    <!-- ===== 二、纪念品店铺 ===== -->
    <template v-else>
      <div class="card card-pad filter-workbench">
        <div class="dd-filter-top">
          <div class="search-bar" style="flex: 1; min-width: 240px; max-width: 420px; height: 42px; border-radius: 6px">
            <span>🔍</span>
            <input v-model="storeKeyword" type="text" placeholder="搜索认证店铺、地址、主打特产…" />
            <button v-if="storeKeyword" class="btn-ghost" style="padding: 3px 9px; font-size: 12.5px" @click="storeKeyword = ''">清空</button>
          </div>
          <div class="flex-row" style="gap: 10px">
            <button class="btn-ghost" style="border-radius: 6px" @click="resetStoreFilters">重置筛选</button>
            <span class="dd-count-pill">共找到 {{ visibleStores.length }} 家认证店铺</span>
          </div>
        </div>

        <div class="dd-filter-grid cols-4">
          <label class="dd-field">
            <span class="dd-field-label">店铺类型</span>
            <select v-model="storeTab" class="dd-select" :class="{ active: storeTab !== '全部' }">
              <option value="全部">全部店铺</option>
              <option value="文创纪念">文创纪念</option>
              <option value="农特产">农特产</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">所在片区</span>
            <select v-model="storeArea" class="dd-select" :class="{ active: storeArea !== '全部' }">
              <option value="全部">全部片区</option>
              <option value="温泉街道">温泉街道（国际网球中心）</option>
              <option value="新市街道">新市街道（文峰片区）</option>
              <option value="景区产区">孙桥 / 绿林景区产区</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">特色服务</span>
            <select v-model="storeService" class="dd-select" :class="{ active: storeService !== '全部' }">
              <option value="全部">全部服务</option>
              <option value="快递代寄">支持快递代寄</option>
              <option value="体验试吃">到店体验 / 试吃</option>
              <option value="夜间营业">夜间营业</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">排序方式</span>
            <select v-model="storeSort" class="dd-select">
              <option value="default">综合推荐</option>
              <option value="distance">按距离最近</option>
              <option value="rating">按评分最高</option>
            </select>
          </label>
        </div>
      </div>

      <div v-if="pagedStores.length === 0" class="card card-pad" style="text-align: center; padding: 40px 20px">
        <strong style="font-size: 16px; display: block; margin-bottom: 10px">当前筛选条件下暂无符合的纪念品店铺</strong>
        <button class="btn-primary" @click="resetStoreFilters">重置全部筛选</button>
      </div>

      <template v-else>
        <div class="grid-2">
          <div
            v-for="store in pagedStores"
            :key="store.id"
            class="card"
            style="display: grid; grid-template-columns: 180px 1fr"
          >
            <div class="photo-box" style="height: 100%; min-height: 186px" @click="openStoreDetail(store)">
              <img :src="store.photo" :alt="store.name" />
              <span class="badge-tl">{{ store.category }}</span>
            </div>
            <div class="card-pad" style="display: flex; flex-direction: column; justify-content: space-between; gap: 10px">
              <div>
                <div class="flex-between" style="align-items: flex-start; gap: 8px; margin-bottom: 6px">
                  <strong style="font-size: 16.5px; cursor: pointer" @click="openStoreDetail(store)">{{ store.name }}</strong>
                  <span class="rating-pill">★ {{ store.rating }}</span>
                </div>
                <div style="font-size: 13.5px; color: var(--ink-2); margin-bottom: 8px; line-height: 1.6">
                  <div>📍 {{ store.address }}（{{ store.distance }}）</div>
                  <div>🕒 营业时间：{{ store.hours }}</div>
                </div>
                <div style="font-size: 13.5px; color: var(--ink-2); line-height: 1.55">
                  <strong>主打：</strong>{{ store.featuredGoods }}
                </div>
              </div>

              <div class="flex-row" style="padding-top: 10px; border-top: 1px dashed var(--line)">
                <button
                  class="btn-ghost"
                  style="flex: 1"
                  @click="
                    openNavigation({
                      placeName: store.name,
                      address: `湖北省荆门市京山市${store.address}`,
                      lng: store.lng,
                      lat: store.lat,
                      distance: store.distance,
                      driveMin: store.driveMin,
                      tip: store.benefit,
                    })
                  "
                >
                  🧭 导航到店
                </button>
                <button
                  class="btn-primary"
                  style="flex: 1"
                  @click="
                    openActionModal({
                      type: 'inquiry',
                      title: `${store.name} · 到店体验 / 快递代寄`,
                      subtitle: `${store.address} · ${store.benefit}`,
                      submitLabel: '提交体验 / 代寄预约',
                    })
                  "
                >
                  📦 体验 / 代寄
                </button>
              </div>
            </div>
          </div>
        </div>

        <PaginationBar
          :total="visibleStores.length"
          :page="storePage"
          :page-size="PAGE_SIZE"
          unit="家店铺"
          @update:page="storePage = $event"
        />
      </template>
    </template>
  </section>
</template>
