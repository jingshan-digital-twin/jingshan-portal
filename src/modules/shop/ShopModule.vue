<script setup lang="ts">
import { computed, ref } from 'vue'
import { PRODUCT_CATALOG } from '../../mock/details'
import { usePortalStore } from '../../store/usePortalStore'

const { state, openActionModal, openNavigation } = usePortalStore()
const shopTab = ref<'全部' | '农特' | '装备' | '文创'>('全部')

const visibleProducts = computed(() =>
  shopTab.value === '全部'
    ? PRODUCT_CATALOG
    : PRODUCT_CATALOG.filter((p) => p.cat === shopTab.value),
)

function openProduct(id: string) {
  state.activeProductId = id
}
</script>

<template>
  <section>
    <div class="module-header">
      <div class="mh-left">
        <div class="mh-num">07</div>
        <div>
          <h1 class="mh-title">“购”：特色商品服务</h1>
          <div class="mh-desc">
            京山农特产品、李宁网球装备与非遗文创实拍展示，点击任意商品查看完整规格详情、买家真实评价与在线支付（支持积分抵现 + 票根满减）
          </div>
        </div>
      </div>
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
      <div>
        <div style="font-size: 15.5px; font-weight: 900">🛍️ 京山好物官方线上商城 · 产地直发全国包邮</div>
        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.82); margin-top: 2px">
          支持「京山网球」会员积分抵现（100分=¥10）+ 打球电子票根满150减30 · 线下32家金网特产门店同价可提
        </div>
      </div>
      <button class="btn-orange" @click="openActionModal({ type: 'miniprogram', appName: '京山好物官方商城小程序', desc: '已同步您的 Lv.3 会员折扣与积分，支持全国快递直发' })">
        🛒 一键跳转线上官方商城 →
      </button>
    </div>

    <div class="grid-4 mb-16">
      <div v-for="item in visibleProducts" :key="item.id" class="card" style="display: flex; flex-direction: column">
        <div
          class="photo-box"
          style="height: 185px"
          @click="openProduct(item.id)"
        >
          <img :src="item.photo" :alt="item.name" />
          <span class="badge-tl">{{ item.badge }}</span>
          <span class="badge-bl">{{ item.sub }} · 已售{{ item.sold }}</span>
        </div>
        <div class="card-pad" style="flex: 1; display: flex; flex-direction: column; justify-content: space-between">
          <div>
            <div class="flex-between" style="align-items: flex-start; gap: 6px">
              <strong style="font-size: 14.5px; cursor: pointer" @click="openProduct(item.id)">{{ item.name }}</strong>
              <span class="rating-pill">★ {{ item.rating }}</span>
            </div>
            <div style="font-size: 11px; color: var(--ink-3); margin: 4px 0">
              📍 {{ item.originPlace }} · {{ item.reviewCount }}条真实评价
            </div>
            <div class="flex-row" style="margin: 5px 0">
              <span class="tag green">{{ item.specs.length }}种规格可选</span>
              <span class="tag orange">支持积分/微信支付</span>
            </div>
            <div class="review-quote">💬 评：“{{ item.quote }}”</div>
          </div>

          <div class="flex-between" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--line)">
            <span class="price" style="font-size: 18px">¥{{ item.memberPrice }}<small>原价¥{{ item.price }}</small></span>
            <button class="btn-primary" @click="openProduct(item.id)">
              详情 / 评价 / 支付
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card card-pad flex-between">
      <div>
        <strong style="font-size: 14.5px">🏪 线下纪念品与特产认证店铺展示（支持到店体验 + 快递代寄）</strong>
        <div style="font-size: 12px; color: var(--ink-3); margin-top: 3px">
          ① 国际网球中心文创旗舰店（温泉街道网球大道1号 · 113.1198°E, 31.0216°N · ★4.9） ｜ ② 文峰广场京山桥米体验馆（新市街道文峰路22号 · ★4.8）
        </div>
      </div>
      <button
        class="btn-ghost"
        @click="
          openNavigation({
            placeName: '国际网球中心文创旗舰店',
            address: '湖北省荆门市京山市温泉街道网球大道1号场馆东厅',
            lng: 113.1198,
            lat: 31.0216,
            distance: '150 m',
            driveMin: '步行约 2 分钟',
            tip: '门店与线上商城同价，支持凭票根满150减30并顺丰代寄回家',
          })
        "
      >
        🧭 查看门店导航
      </button>
    </div>
  </section>
</template>
