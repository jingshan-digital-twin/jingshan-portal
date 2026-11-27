<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { PRODUCT_CATALOG } from '../../mock/details'
import { usePortalStore } from '../../store/usePortalStore'

const { openProductDetail, openPhoto, openActionModal, openNavigation } = usePortalStore()
const PAGE_SIZE = 4
const shopKeyword = ref('')
const shopPage = ref(1)
const shopTab = ref<'全部' | '农特' | '装备' | '文创'>('全部')

const visibleProducts = computed(() => {
  const q = shopKeyword.value.trim().toLowerCase()
  return PRODUCT_CATALOG.filter((p) => {
    const okTab = shopTab.value === '全部' || p.cat === shopTab.value
    const okQ = !q || p.name.toLowerCase().includes(q) || p.originPlace.toLowerCase().includes(q) || p.badge.toLowerCase().includes(q)
    return okTab && okQ
  })
})

const pagedProducts = computed(() => {
  const start = (shopPage.value - 1) * PAGE_SIZE
  return visibleProducts.value.slice(start, start + PAGE_SIZE)
})

watch(visibleProducts, () => {
  shopPage.value = 1
})

function openProduct(id: string) {
  openProductDetail(id)
}

interface OfflineStore {
  id: string
  name: string
  category: '文创纪念' | '农特产' | '网球装备'
  badge: string
  photo: string
  rating: number
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
    badge: '官方旗舰 · 票根满150减30',
    photo: '/images/prod_tiedye_craft.jpg',
    rating: 4.9,
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
    badge: '地理标志直营 · 免费试吃',
    photo: '/images/prod_qiaomi.jpg',
    rating: 4.8,
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
    id: 'store-lining-proshop',
    name: '温泉新区李宁网球装备专营店',
    category: '网球装备',
    badge: '专业穿线 · 免费试拍',
    photo: '/images/prod_lining_racket.jpg',
    rating: 4.9,
    address: '温泉街道京山大道88号网球主题街区A栋',
    distance: '距国际中心 380m',
    driveMin: '步行约 5 分钟',
    hours: '09:00 – 21:30',
    lng: 113.1174,
    lat: 31.0221,
    highlights: ['20分钟电脑穿线', '碳素拍免费试打', '球友会员88折'],
    featuredGoods: '李宁赛事全碳素球拍、比赛级气压网球、专业吸汗手胶与网球包',
    benefit: '凭京山网球会员身份免穿线手工费，支持球拍快递直寄',
  },
  {
    id: 'store-sunqiao-workshop',
    name: '孙桥镇国宝桥米非遗工坊店',
    category: '农特产',
    badge: '产地直发 · 农旅打卡',
    photo: '/images/goods.jpg',
    rating: 4.9,
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
    badge: '景区认证 · 明码标价',
    photo: '/images/prod_kudzu_mushroom.jpg',
    rating: 4.8,
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
    badge: '夜场逛买 · 营业至23:30',
    photo: '/images/night_market.jpg',
    rating: 4.8,
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

const storeTab = ref<'全部' | '文创纪念' | '农特产' | '网球装备'>('全部')
const storeKeyword = ref('')
const storePage = ref(1)

const visibleStores = computed(() => {
  const q = storeKeyword.value.trim().toLowerCase()
  return OFFLINE_STORES.filter((s) => {
    const okTab = storeTab.value === '全部' || s.category === storeTab.value
    const okQ =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      s.featuredGoods.toLowerCase().includes(q) ||
      s.highlights.some((h) => h.toLowerCase().includes(q))
    return okTab && okQ
  })
})

const pagedStores = computed(() => {
  const start = (storePage.value - 1) * PAGE_SIZE
  return visibleStores.value.slice(start, start + PAGE_SIZE)
})

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
  <section>
    <div class="module-toolbar">
      <div class="mh-tabs">
        <button
          v-for="t in (['全部', '农特', '装备', '文创'] as const)"
          :key="t"
          class="m-tab"
          :class="{ active: shopTab === t }"
          @click="shopTab = t"
        >
          {{ t === '全部' ? '全部好物' : t === '农特' ? '京山农特产品' : t === '装备' ? '李宁网球装备' : '网球文创纪念品' }}
        </button>
      </div>
    </div>

    <div class="ticket-stub-banner mb-16">
      <div style="font-size: 17px; font-weight: 900">🛍️ 京山好物官方线上商城 · 产地直发全国包邮</div>
      <button class="btn-orange" @click="openActionModal({ type: 'miniprogram', appName: '京山好物官方商城小程序', desc: '已同步您的 Lv.3 会员折扣与积分，支持全国快递直发' })">
        🛒 跳转官方商城 →
      </button>
    </div>

    <div class="card card-pad mb-16 filter-workbench flex-between">
      <div class="search-bar" style="width: 340px; height: 40px">
        <span>🔍</span>
        <input v-model="shopKeyword" type="text" placeholder="搜索京山桥米、李宁球拍、葛粉、文创…" />
        <button v-if="shopKeyword" class="btn-ghost" style="padding: 2px 8px; font-size: 12px" @click="shopKeyword = ''">✕</button>
      </div>
      <span style="font-size: 14px; font-weight: 800; color: var(--primary)">
        共找到 {{ visibleProducts.length }} 款特色好物
      </span>
    </div>

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
    <div class="mb-16">
      <PaginationBar
        :total="visibleProducts.length"
        :page="shopPage"
        :page-size="PAGE_SIZE"
        unit="件商品"
        @update:page="shopPage = $event"
      />
    </div>

    <div class="card card-pad">
      <div class="flex-between" style="margin-bottom: 14px; gap: 10px; flex-wrap: wrap">
        <strong style="font-size: 18px">🏪 线下认证门店（支持到店体验与快递代寄）</strong>
        <div class="flex-row">
          <button
            v-for="t in (['全部', '文创纪念', '农特产', '网球装备'] as const)"
            :key="t"
            class="m-tab"
            :class="{ active: storeTab === t }"
            style="padding: 5px 12px; font-size: 13px"
            @click="storeTab = t"
          >
            {{ t === '全部' ? '全部门店' : t }}
          </button>
        </div>
      </div>

      <div class="flex-between" style="margin-bottom: 14px; gap: 10px; flex-wrap: wrap">
        <div class="search-bar" style="width: 340px; height: 40px">
          <span>🔍</span>
          <input v-model="storeKeyword" type="text" placeholder="搜索认证门店、地址、主打特产…" />
          <button v-if="storeKeyword" class="btn-ghost" style="padding: 2px 8px; font-size: 12px" @click="storeKeyword = ''">✕</button>
        </div>
        <span style="font-size: 14px; font-weight: 800; color: var(--primary)">
          共找到 {{ visibleStores.length }} 家官方认证门店
        </span>
      </div>

      <div class="grid-2">
        <div
          v-for="store in pagedStores"
          :key="store.id"
          class="card"
          style="display: grid; grid-template-columns: 180px 1fr; box-shadow: none"
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

      <div v-if="pagedStores.length === 0" style="text-align: center; padding: 24px 0; color: var(--ink-3); font-size: 14px">
        未找到符合条件的线下认证门店
      </div>

      <PaginationBar
        :total="visibleStores.length"
        :page="storePage"
        :page-size="PAGE_SIZE"
        unit="家门店"
        @update:page="storePage = $event"
      />
    </div>
  </section>
</template>
