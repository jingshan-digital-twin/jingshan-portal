<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PRODUCT_CATALOG } from '../mock/details'
import { usePortalStore } from '../store/usePortalStore'

const { state, createQuickOrder } = usePortalStore()

const product = computed(() =>
  PRODUCT_CATALOG.find((p) => p.id === state.activeProductId) ?? null,
)

const selectedSpecIdx = ref(0)
const qty = ref(1)
const usePoints = ref(false)
const useStubDiscount = ref(true)
const payMethod = ref<'wechat' | 'alipay'>('wechat')
const receiverAddr = ref('湖北省武汉市洪山区光谷大道88号（林先生 138****8866）')
const detailTab = ref<'detail' | 'reviews'>('detail')

watch(
  () => state.activeProductId,
  () => {
    selectedSpecIdx.value = 0
    qty.value = 1
    usePoints.value = false
    useStubDiscount.value = true
    detailTab.value = 'detail'
  },
)

const unitPrice = computed(() => {
  if (!product.value) return 0
  const spec = product.value.specs[selectedSpecIdx.value] ?? product.value.specs[0]!
  return Math.max(19, product.value.memberPrice + spec.addPrice)
})

const rawSubtotal = computed(() => unitPrice.value * qty.value)
const stubOff = computed(() => (useStubDiscount.value && rawSubtotal.value >= 150 ? 30 : 0))
const pointsOff = computed(() => (usePoints.value && state.points >= 100 ? 10 : 0))
const finalTotal = computed(() => Math.max(1, rawSubtotal.value - stubOff.value - pointsOff.value))

function close() {
  state.activeProductId = null
}

function submitPayment() {
  if (!product.value) return
  const specLabel = product.value.specs[selectedSpecIdx.value]?.label ?? ''
  createQuickOrder(
    '商品',
    `${product.value.name} × ${qty.value}`,
    `${specLabel} · ${payMethod.value === 'wechat' ? '微信支付' : '支付宝'} · ${product.value.shipping}`,
    finalTotal.value,
    40,
    pointsOff.value > 0 ? 100 : 0,
  )
  close()
}
</script>

<template>
  <div v-if="product" class="modal-backdrop" @click.self="close">
    <div class="modal-box" style="width: 820px; max-height: 90vh; display: flex; flex-direction: column">
      <div class="card-pad flex-between" style="background: #0d3629; color: #fff">
        <div>
          <strong style="font-size: 16.5px">🛍️ {{ product.name }}</strong>
          <div style="font-size: 11.5px; color: var(--lime)">
            {{ product.originPlace }} ｜ {{ product.shipping }} ｜ 已售 {{ product.sold }} 件
          </div>
        </div>
        <button class="btn-ghost" @click="close">✕ 关闭</button>
      </div>

      <div class="card-pad" style="overflow-y: auto; flex: 1; display: grid; grid-template-columns: 320px 1fr; gap: 20px">
        <!-- Left: 商品实拍图 + 详情/评价切换 -->
        <div style="display: flex; flex-direction: column; gap: 12px">
          <div class="photo-box" style="height: 225px; border-radius: 14px; cursor: default">
            <img :src="product.photo" :alt="product.name" />
            <span class="badge-tl">{{ product.badge }}</span>
            <span class="badge-bl">★ {{ product.rating }} ({{ product.reviewCount }}条真实评价)</span>
          </div>

          <div class="flex-row">
            <button class="m-tab" :class="{ active: detailTab === 'detail' }" @click="detailTab = 'detail'">📋 商品详情与参数</button>
            <button class="m-tab" :class="{ active: detailTab === 'reviews' }" @click="detailTab = 'reviews'">💬 买家评价 ({{ product.reviews.length }})</button>
          </div>

          <div v-if="detailTab === 'detail'" style="background: #f6faf8; border-radius: 12px; padding: 11px 12px; font-size: 11.5px; color: var(--ink-2)">
            <div v-for="(h, i) in product.highlights" :key="i" style="margin-bottom: 5px">✔ {{ h }}</div>
            <div style="border-top: 1px dashed #d6e4de; margin-top: 8px; padding-top: 8px">
              <div v-for="p in product.params" :key="p.k" class="flex-between" style="margin-bottom: 3px">
                <span style="color: var(--ink-3)">{{ p.k }}</span>
                <strong>{{ p.v }}</strong>
              </div>
            </div>
          </div>

          <div v-else style="display: flex; flex-direction: column; gap: 8px">
            <div v-for="(rev, i) in product.reviews" :key="i" style="background: #fafdfc; border: 1px solid var(--line); border-radius: 10px; padding: 9px 11px; font-size: 11.5px">
              <div class="flex-between" style="margin-bottom: 3px">
                <strong>{{ rev.user }} <span style="color: #e2a227">★★★★★</span></strong>
                <span style="color: var(--ink-3); font-size: 10.5px">{{ rev.date }}</span>
              </div>
              <div style="color: var(--ink-3); font-size: 10.5px; margin-bottom: 3px">规格：{{ rev.spec }}</div>
              <div style="color: var(--ink-2)">{{ rev.content }}</div>
            </div>
          </div>
        </div>

        <!-- Right: 规格选择、收货地址与在线支付结算 -->
        <div style="display: flex; flex-direction: column; gap: 11px">
          <div style="background: #fff7f3; border: 1px solid #ffd5c2; border-radius: 12px; padding: 11px 14px" class="flex-between">
            <div>
              <span class="price" style="font-size: 24px">¥{{ unitPrice }}</span>
              <span style="font-size: 12px; color: var(--ink-3); margin-left: 6px"><s>原价 ¥{{ product.price }}</s></span>
            </div>
            <span class="tag green">Lv.3 会员专享价 · 购后积+40分</span>
          </div>

          <div>
            <label class="f-label">选择规格</label>
            <div style="display: flex; flex-direction: column; gap: 6px">
              <button
                v-for="(sp, idx) in product.specs"
                :key="sp.label"
                class="btn-ghost"
                style="text-align: left; padding: 8px 11px"
                :style="selectedSpecIdx === idx ? 'border-color: var(--primary); background: var(--primary-light); color: var(--primary);' : ''"
                @click="selectedSpecIdx = idx"
              >
                {{ sp.label }}
                <span style="float: right">{{ sp.addPrice === 0 ? '标准价' : sp.addPrice > 0 ? `+¥${sp.addPrice}` : `-¥${Math.abs(sp.addPrice)}` }}</span>
              </button>
            </div>
          </div>

          <div class="flex-between">
            <label class="f-label" style="margin: 0">购买数量</label>
            <div class="flex-row">
              <button class="btn-ghost" style="padding: 3px 10px" @click="qty = Math.max(1, qty - 1)">-</button>
              <strong style="min-width: 24px; text-align: center">{{ qty }}</strong>
              <button class="btn-ghost" style="padding: 3px 10px" @click="qty++">+</button>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px">
            <label class="flex-between" style="background: #f5faf8; padding: 7px 10px; border-radius: 8px; cursor: pointer">
              <span><input v-model="useStubDiscount" type="checkbox" style="margin-right: 6px" />🎫 使用打球电子票根（满¥150立减¥30）</span>
              <strong style="color: var(--accent)">{{ stubOff > 0 ? `-¥${stubOff}` : '未满¥150' }}</strong>
            </label>
            <label v-if="state.points >= 100" class="flex-between" style="background: #fff9eb; padding: 7px 10px; border-radius: 8px; cursor: pointer">
              <span><input v-model="usePoints" type="checkbox" style="margin-right: 6px" />👑 使用 100 金网积分抵现 ¥10</span>
              <strong style="color: #8a5600">{{ pointsOff > 0 ? '-¥10' : '可用' }}</strong>
            </label>
          </div>

          <div>
            <label class="f-label">快递收货地址</label>
            <input v-model="receiverAddr" class="f-input" />
          </div>

          <div>
            <label class="f-label">在线支付方式（持牌机构担保分账）</label>
            <div class="grid-2" style="gap: 8px">
              <button
                class="btn-ghost"
                :style="payMethod === 'wechat' ? 'border-color: #07C160; background: #EDFAF3; color: #068944;' : ''"
                @click="payMethod = 'wechat'"
              >
                💚 微信支付
              </button>
              <button
                class="btn-ghost"
                :style="payMethod === 'alipay' ? 'border-color: #1677FF; background: #EEF5FF; color: #1677FF;' : ''"
                @click="payMethod = 'alipay'"
              >
                💙 支付宝支付
              </button>
            </div>
          </div>

          <div class="flex-between" style="padding-top: 10px; border-top: 1px solid var(--line); margin-top: auto">
            <div>
              实付总额：<strong class="price" style="font-size: 22px">¥{{ finalTotal }}</strong>
            </div>
            <button class="btn-orange" style="padding: 10px 22px; font-size: 13.5px" @click="submitPayment">
              立即支付下单
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
