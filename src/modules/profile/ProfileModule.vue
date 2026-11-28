<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AbilityRadarChart from '../../components/AbilityRadarChart.vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { usePortalStore } from '../../store/usePortalStore'

const { state, currentAccount, memberTier, switchModule, cancelOrder, redeemPoints, openActionModal } =
  usePortalStore()

// ===== 会员等级体系 =====
const MEMBER_TIERS = [
  {
    code: 'Lv.1',
    name: '挥拍新星',
    minPoints: 0,
    discount: '98折',
    perks: ['订场 98 折', '全行程消费积分'],
  },
  {
    code: 'Lv.2',
    name: '城市球友',
    minPoints: 500,
    discount: '92折',
    perks: ['订场 92 折', '联盟商户 88 折', '订场免费改签'],
  },
  {
    code: 'Lv.3',
    name: '金网精英',
    minPoints: 1000,
    discount: '85折',
    perks: ['订场 85 折', '热门赛事优先报名', '合作酒店 85 折', '景区快速通道'],
  },
  {
    code: 'Lv.4',
    name: '冠军黑金',
    minPoints: 1500,
    discount: '8折',
    perks: ['订场 8 折', '热门赛事VIP席位', '合作酒店免费升房', '景区专属免票礼遇'],
  },
] as const

const nextTier = computed(() => MEMBER_TIERS.find((t) => t.minPoints > state.points) ?? null)
const tierProgressPct = computed(() => {
  if (!nextTier.value) return 100
  const curIdx = MEMBER_TIERS.findIndex((t) => t.code === memberTier.value.code)
  const floor = MEMBER_TIERS[Math.max(0, curIdx)]?.minPoints ?? 0
  const span = Math.max(1, nextTier.value.minPoints - floor)
  return Math.min(100, Math.max(0, Math.round(((state.points - floor) / span) * 100)))
})
const currentDiscountLabel = computed(() => {
  const cur = MEMBER_TIERS.find((t) => t.code === memberTier.value.code)
  return cur?.discount ?? '85折'
})

// ===== 积分兑换消费券 =====
const REDEEM_ITEMS = [
  {
    id: 'rd-20',
    value: '¥20',
    title: '全城通用消费券',
    scope: '吃住游购通用',
    cost: 200,
  },
  {
    id: 'rd-spa',
    value: '¥60',
    title: '天沐温泉立减券',
    scope: '温泉康养核销',
    cost: 300,
  },
  {
    id: 'rd-hotel',
    value: '¥100',
    title: '合作酒店礼遇券',
    scope: '联盟酒店直减',
    cost: 400,
  },
  {
    id: 'rd-court',
    value: '1小时',
    title: '免费订场通兑券',
    scope: '全市开放球场',
    cost: 500,
  },
] as const

function handleRedeem(item: (typeof REDEEM_ITEMS)[number]) {
  redeemPoints(item.cost, `${item.title}（${item.value}）`, item.scope)
}

// ===== 消费积分明细（分页） =====
const POINT_PAGE_SIZE = 5
const pointFilter = ref<'全部' | '获取' | '兑换'>('全部')
const pointPage = ref(1)

const filteredPointLogs = computed(() => {
  if (pointFilter.value === '获取') return state.pointLogs.filter((l) => l.delta > 0)
  if (pointFilter.value === '兑换') return state.pointLogs.filter((l) => l.delta < 0)
  return state.pointLogs
})

const pagedPointLogs = computed(() => {
  const start = (pointPage.value - 1) * POINT_PAGE_SIZE
  return filteredPointLogs.value.slice(start, start + POINT_PAGE_SIZE)
})

watch(pointFilter, () => {
  pointPage.value = 1
})

watch(
  () => filteredPointLogs.value.length,
  (len) => {
    const maxPage = Math.max(1, Math.ceil(len / POINT_PAGE_SIZE))
    if (pointPage.value > maxPage) pointPage.value = maxPage
  },
)

// ===== 下半区 3-Tab 工作区 =====
const bottomTab = ref<'orders' | 'coupons' | 'ability'>('orders')

const ORDER_PAGE_SIZE = 6
const orderCat = ref<'全部' | '商品' | '场地' | '住宿' | '门票' | '课程'>('全部')
const orderKeyword = ref('')
const orderPage = ref(1)

const filteredOrders = computed(() => {
  const q = orderKeyword.value.trim().toLowerCase()
  return state.orders.filter((o) => {
    const okCat = orderCat.value === '全部' || o.category === orderCat.value
    const okQ =
      !q ||
      o.title.toLowerCase().includes(q) ||
      o.subtitle.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q) ||
      o.category.toLowerCase().includes(q)
    return okCat && okQ
  })
})

const pagedOrders = computed(() => {
  const start = (orderPage.value - 1) * ORDER_PAGE_SIZE
  return filteredOrders.value.slice(start, start + ORDER_PAGE_SIZE)
})

watch([orderCat, orderKeyword], () => {
  orderPage.value = 1
})

watch(
  () => filteredOrders.value.length,
  (len) => {
    const maxPage = Math.max(1, Math.ceil(len / ORDER_PAGE_SIZE))
    if (orderPage.value > maxPage) orderPage.value = maxPage
  },
)

const COUPON_PAGE_SIZE = 6
const couponPage = ref(1)
const pagedCoupons = computed(() => {
  const start = (couponPage.value - 1) * COUPON_PAGE_SIZE
  return state.coupons.slice(start, start + COUPON_PAGE_SIZE)
})

watch(
  () => state.coupons.length,
  (len) => {
    const maxPage = Math.max(1, Math.ceil(len / COUPON_PAGE_SIZE))
    if (couponPage.value > maxPage) couponPage.value = maxPage
  },
)

function pointCatClass(cat: string) {
  if (cat === '购物') return 'orange'
  if (cat === '订场' || cat === '参赛') return 'green'
  if (cat === '住宿' || cat === '游览') return 'blue'
  if (cat === '参训') return 'purple'
  return 'gold'
}
</script>

<template>
  <section class="pf-page">
    <!-- ===== 一、京网会员总览（等级 · 积分 · 专属权益） ===== -->
    <div class="card pf-member-hero">
      <div class="pf-hero-left">
        <div class="pf-user-row">
          <div class="pf-avatar">{{ currentAccount.avatar }}</div>
          <div>
            <div class="pf-user-name">
              <strong>{{ currentAccount.name }}</strong>
              <span class="pf-origin-pill">{{ currentAccount.city }}</span>
              <span class="pf-tier-pill">{{ memberTier.code }} {{ memberTier.name }}</span>
            </div>
            <div class="pf-tier-progress-line">
              <span v-if="nextTier">距 {{ nextTier.code }} {{ nextTier.name }} 还差 <strong>{{ nextTier.minPoints - state.points }}</strong> 分</span>
              <span v-else>已达最高等级 {{ memberTier.code }} {{ memberTier.name }}</span>
              <span class="pf-tier-ratio">{{ state.points }} / {{ nextTier?.minPoints ?? state.points }}</span>
            </div>
            <div class="pf-progress-track">
              <div class="pf-progress-fill" :style="{ width: `${tierProgressPct}%` }" />
            </div>
          </div>
        </div>

        <div class="pf-kpi-grid">
          <div class="pf-kpi">
            <span>可用积分</span>
            <strong class="lime">{{ state.points }}</strong>
          </div>
          <div class="pf-kpi">
            <span>本次行程累计</span>
            <strong class="lime">+{{ state.sessionPointsEarned }}</strong>
          </div>
          <div class="pf-kpi">
            <span>订场专享折扣</span>
            <strong>{{ currentDiscountLabel }}</strong>
          </div>
        </div>
      </div>

      <!-- 右侧：4 级会员专属权益对照 -->
      <div class="pf-hero-right">
        <div class="pf-tiers-grid">
          <div
            v-for="tier in MEMBER_TIERS"
            :key="tier.code"
            class="pf-tier-box"
            :class="{ current: tier.code === memberTier.code, unlocked: state.points >= tier.minPoints }"
          >
            <div class="pf-tb-head">
              <strong>{{ tier.code }} {{ tier.name }}</strong>
              <span v-if="tier.code === memberTier.code" class="pf-cur-tag">当前</span>
              <span v-else class="pf-min-pts">{{ tier.minPoints }}分</span>
            </div>
            <ul class="pf-perk-list">
              <li v-for="perk in tier.perks" :key="perk">{{ perk }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 二、积分兑换消费券 + 消费积分明细 ===== -->
    <div class="grid-2 pf-mid-grid">
      <!-- 左：积分兑换消费券 -->
      <div class="card card-pad pf-panel">
        <div class="pf-panel-head">
          <h2>积分兑换消费券</h2>
          <span class="tag green">可用 {{ state.points }} 分</span>
        </div>

        <div class="pf-redeem-grid">
          <div v-for="item in REDEEM_ITEMS" :key="item.id" class="pf-redeem-card">
            <div class="pf-rd-top">
              <strong class="pf-rd-val">{{ item.value }}</strong>
              <span class="pf-rd-cost">{{ item.cost }} 分</span>
            </div>
            <div class="pf-rd-title">{{ item.title }}</div>
            <div class="pf-rd-foot">
              <span class="pf-rd-scope">{{ item.scope }}</span>
              <button
                type="button"
                class="btn-orange pf-rd-btn"
                :disabled="state.points < item.cost"
                @click="handleRedeem(item)"
              >
                {{ state.points < item.cost ? '积分不足' : '兑换' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右：本次消费积分明细 -->
      <div class="card card-pad pf-panel">
        <div class="pf-panel-head">
          <h2>消费积分明细</h2>
          <div class="pf-mini-tabs">
            <button
              v-for="tab in (['全部', '获取', '兑换'] as const)"
              :key="tab"
              type="button"
              class="pf-mini-tab"
              :class="{ active: pointFilter === tab }"
              @click="pointFilter = tab"
            >
              {{ tab }}
            </button>
          </div>
        </div>

        <div class="pf-point-list">
          <div v-for="log in pagedPointLogs" :key="log.id" class="pf-point-row">
            <span class="tag" :class="pointCatClass(log.category)">{{ log.category }}</span>
            <span class="pf-point-title" :title="log.title">{{ log.title }}</span>
            <span class="pf-point-time">{{ log.time }}</span>
            <strong class="pf-point-delta" :class="log.delta > 0 ? 'plus' : 'minus'">
              {{ log.delta > 0 ? `+${log.delta}` : log.delta }}
            </strong>
          </div>
          <div v-if="pagedPointLogs.length === 0" class="pf-empty">暂无积分记录</div>
        </div>

        <PaginationBar
          :total="filteredPointLogs.length"
          :page="pointPage"
          :page-size="POINT_PAGE_SIZE"
          unit="条"
          @update:page="pointPage = $event"
        />
      </div>
    </div>

    <!-- ===== 三、订单 / 消费券 / 能力档案 ===== -->
    <div class="card card-pad">
      <div class="pf-sub-bar">
        <div class="pf-sub-tabs">
          <button
            type="button"
            class="pf-sub-tab"
            :class="{ active: bottomTab === 'orders' }"
            @click="bottomTab = 'orders'"
          >
            我的订单 <span>{{ state.orders.length }}</span>
          </button>
          <button
            type="button"
            class="pf-sub-tab"
            :class="{ active: bottomTab === 'coupons' }"
            @click="bottomTab = 'coupons'"
          >
            消费券与票根 <span>{{ state.coupons.length }}</span>
          </button>
          <button
            type="button"
            class="pf-sub-tab"
            :class="{ active: bottomTab === 'ability' }"
            @click="bottomTab = 'ability'"
          >
            网球能力档案 <span>{{ state.abilityLevel }}</span>
          </button>
        </div>
      </div>

      <!-- Tab 1: 我的订单 -->
      <template v-if="bottomTab === 'orders'">
        <div class="pf-order-toolbar">
          <div class="flex-row" style="gap: 6px">
            <button
              v-for="c in (['全部', '商品', '场地', '住宿', '门票', '课程'] as const)"
              :key="c"
              type="button"
              class="filter-pill"
              :class="{ active: orderCat === c }"
              style="padding: 5px 12px; font-size: 13px"
              @click="orderCat = c"
            >
              {{ c }}
            </button>
          </div>
          <div class="search-bar" style="width: 260px; height: 36px; border-radius: 7px">
            <input v-model="orderKeyword" type="text" placeholder="搜索订单…" style="font-size: 13px" />
            <button v-if="orderKeyword" type="button" class="search-clear" @click="orderKeyword = ''">×</button>
          </div>
        </div>

        <table class="clean-table">
          <thead>
            <tr>
              <th style="white-space: nowrap">类型</th>
              <th>订单内容</th>
              <th style="white-space: nowrap">时间</th>
              <th style="white-space: nowrap">金额</th>
              <th style="white-space: nowrap">状态</th>
              <th style="white-space: nowrap">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in pagedOrders" :key="o.id">
              <td style="white-space: nowrap">
                <span
                  class="tag"
                  :class="{
                    orange: o.category === '商品',
                    green: o.category === '场地',
                    blue: o.category === '住宿',
                    gold: o.category === '门票',
                    purple: o.category === '课程',
                  }"
                >
                  {{ o.category }}
                </span>
              </td>
              <td>
                <strong>{{ o.title }}</strong>
                <div class="pf-order-sub">{{ o.subtitle }}</div>
              </td>
              <td style="white-space: nowrap">{{ o.time }}</td>
              <td style="white-space: nowrap; font-weight: 800">¥{{ o.amount }}</td>
              <td style="white-space: nowrap">
                <strong :style="{ color: o.status === '已取消' ? '#999' : 'var(--primary)' }">{{ o.status }}</strong>
              </td>
              <td style="white-space: nowrap">
                <button
                  v-if="o.cancellable && o.status !== '已取消'"
                  type="button"
                  class="btn-ghost"
                  style="padding: 4px 10px; font-size: 12.5px"
                  @click="cancelOrder(o.id)"
                >
                  取消
                </button>
                <span v-else style="font-size: 12.5px; color: var(--ink-3)">已退款</span>
              </td>
            </tr>
            <tr v-if="pagedOrders.length === 0">
              <td colspan="6" class="pf-empty">暂无订单记录</td>
            </tr>
          </tbody>
        </table>

        <PaginationBar
          :total="filteredOrders.length"
          :page="orderPage"
          :page-size="ORDER_PAGE_SIZE"
          unit="条"
          @update:page="orderPage = $event"
        />
      </template>

      <!-- Tab 2: 消费券与票根 -->
      <template v-else-if="bottomTab === 'coupons'">
        <div class="grid-2 pf-coupon-grid">
          <div v-for="cp in pagedCoupons" :key="cp.id" class="pf-coupon-card">
            <div class="pf-cp-main">
              <div class="flex-row" style="gap: 8px; margin-bottom: 4px">
                <span class="tag orange">{{ cp.badge }}</span>
                <span class="tag green">{{ cp.status }}</span>
              </div>
              <strong class="pf-cp-title">{{ cp.title }}</strong>
              <div class="pf-cp-desc">{{ cp.desc }}</div>
            </div>
            <button
              type="button"
              class="btn-primary pf-cp-btn"
              @click="openActionModal({ type: 'stub', code: state.ticketStubCode })"
            >
              出示核销
            </button>
          </div>
        </div>

        <PaginationBar
          :total="state.coupons.length"
          :page="couponPage"
          :page-size="COUPON_PAGE_SIZE"
          unit="张"
          @update:page="couponPage = $event"
        />
      </template>

      <!-- Tab 3: 网球能力档案 -->
      <template v-else>
        <div class="pf-ability-wrap">
          <div style="text-align: center">
            <AbilityRadarChart :ability="state.ability" :level="state.abilityLevel" />
          </div>
          <div class="pf-ability-info">
            <div class="flex-row" style="gap: 10px">
              <strong style="font-size: 20px">{{ state.abilityLevel }}</strong>
              <span class="tag green">湖北省网球学校认证</span>
            </div>
            <div class="pf-ability-dims">
              <div><span>发球</span><strong>{{ state.ability.serve }}</strong></div>
              <div><span>底线</span><strong>{{ state.ability.baseline }}</strong></div>
              <div><span>网前</span><strong>{{ state.ability.volley }}</strong></div>
              <div><span>步法</span><strong>{{ state.ability.footwork }}</strong></div>
              <div><span>体能</span><strong>{{ state.ability.stamina }}</strong></div>
            </div>
            <div class="flex-row" style="gap: 10px">
              <button type="button" class="btn-orange" @click="switchModule(9)">申请晋升测试</button>
              <button type="button" class="btn-primary" @click="switchModule(2)">匹配同级球友</button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.pf-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== 会员总览卡 ===== */
.pf-member-hero {
  display: grid;
  grid-template-columns: 440px 1fr;
  gap: 20px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #0b2f23 0%, #104e3a 58%, #0c3d2d 100%);
  color: #fff;
  border-color: #145b44;
}
.pf-hero-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}
.pf-user-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.pf-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f6cc6c, #c78212);
  color: #2c1900;
  font-size: 21px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pf-user-row > div:last-child {
  flex: 1;
  min-width: 0;
}
.pf-user-name {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.pf-user-name strong {
  font-size: 20px;
  font-weight: 900;
}
.pf-origin-pill {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}
.pf-tier-pill {
  font-size: 12.5px;
  font-weight: 800;
  padding: 2px 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f8d47b, #d89723);
  color: #2f1b00;
}
.pf-tier-progress-line {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 5px;
}
.pf-tier-progress-line strong {
  color: var(--lime);
}
.pf-tier-ratio {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.72);
}
.pf-progress-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  overflow: hidden;
}
.pf-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #b8f13c, #f6cc6c);
  transition: width 0.25s ease;
}

.pf-kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.pf-kpi {
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pf-kpi span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.74);
}
.pf-kpi strong {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.2;
}
.pf-kpi strong.lime {
  color: var(--lime);
}

/* 右侧 4 级权益对照 */
.pf-hero-right {
  display: flex;
  align-items: stretch;
}
.pf-tiers-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.pf-tier-box {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pf-tier-box.current {
  background: rgba(200, 245, 66, 0.15);
  border-color: var(--lime);
  box-shadow: 0 0 0 1px rgba(200, 245, 66, 0.35);
}
.pf-tb-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}
.pf-tb-head strong {
  font-size: 13px;
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
}
.pf-tier-box.current .pf-tb-head strong {
  color: var(--lime);
}
.pf-cur-tag {
  font-size: 11px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--lime);
  color: #0b251d;
}
.pf-min-pts {
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.65);
}
.pf-perk-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.35;
}
.pf-perk-list li::before {
  content: '· ';
  color: var(--lime);
  font-weight: 900;
}

/* ===== 中间双栏：兑换消费券 + 积分明细 ===== */
.pf-mid-grid {
  gap: 16px;
  align-items: stretch;
}
.pf-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pf-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.pf-panel-head h2 {
  font-size: 17.5px;
  font-weight: 800;
  color: var(--ink);
}

.pf-redeem-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex: 1;
}
.pf-redeem-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid #f5d8c9;
  background: linear-gradient(135deg, #fffaf7, #fff5ef);
}
.pf-rd-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.pf-rd-val {
  font-size: 24px;
  font-weight: 900;
  color: var(--accent);
  line-height: 1;
}
.pf-rd-cost {
  font-size: 12.5px;
  font-weight: 800;
  color: #8f5c04;
  background: var(--gold-soft);
  padding: 2px 8px;
  border-radius: 999px;
}
.pf-rd-title {
  font-size: 14.5px;
  font-weight: 800;
  color: var(--ink);
}
.pf-rd-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 6px;
  border-top: 1px dashed #f1d1c0;
}
.pf-rd-scope {
  font-size: 12px;
  color: var(--ink-3);
}
.pf-rd-btn {
  padding: 5px 14px;
  font-size: 12.5px;
}
.pf-rd-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* 积分明细 */
.pf-mini-tabs {
  display: flex;
  gap: 4px;
  background: #edf4f1;
  padding: 3px;
  border-radius: 7px;
}
.pf-mini-tab {
  border: none;
  background: transparent;
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink-2);
}
.pf-mini-tab.active {
  background: #fff;
  color: var(--primary);
  box-shadow: 0 1px 3px rgba(15, 38, 31, 0.08);
}

.pf-point-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.pf-point-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  background: #f8fbfa;
  border: 1px solid var(--line);
  border-radius: 8px;
}
.pf-point-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pf-point-time {
  font-size: 12px;
  color: var(--ink-3);
  white-space: nowrap;
}
.pf-point-delta {
  font-size: 15px;
  font-weight: 900;
  min-width: 44px;
  text-align: right;
}
.pf-point-delta.plus {
  color: var(--primary);
}
.pf-point-delta.minus {
  color: var(--accent);
}

/* ===== 下半区 3-Tab 工作区 ===== */
.pf-sub-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1.5px solid var(--line);
  margin-bottom: 16px;
}
.pf-sub-tabs {
  display: flex;
  gap: 24px;
}
.pf-sub-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 2px 11px;
  border: none;
  border-bottom: 2.5px solid transparent;
  margin-bottom: -1.5px;
  background: transparent;
  font-size: 15.5px;
  font-weight: 800;
  color: var(--ink-2);
}
.pf-sub-tab span {
  font-size: 12px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
  background: #edf4f1;
  color: var(--ink-2);
}
.pf-sub-tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}
.pf-sub-tab.active span {
  background: var(--primary-light);
  color: var(--primary-dark);
}

.pf-order-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.pf-order-sub {
  font-size: 12.5px;
  color: var(--ink-3);
  margin-top: 2px;
}

.pf-coupon-grid {
  gap: 12px;
}
.pf-coupon-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  background: #fff9f5;
  border: 1px solid #f4d6c4;
  border-radius: 10px;
}
.pf-cp-main {
  min-width: 0;
}
.pf-cp-title {
  display: block;
  font-size: 15px;
  color: var(--ink);
  margin-bottom: 2px;
}
.pf-cp-desc {
  font-size: 12.5px;
  color: var(--ink-2);
}
.pf-cp-btn {
  padding: 7px 14px;
  font-size: 13px;
  flex-shrink: 0;
}

.pf-ability-wrap {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 24px;
  align-items: center;
  padding: 8px 0;
}
.pf-ability-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pf-ability-dims {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.pf-ability-dims > div {
  background: #f5faf8;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pf-ability-dims span {
  font-size: 12.5px;
  color: var(--ink-3);
}
.pf-ability-dims strong {
  font-size: 20px;
  font-weight: 900;
  color: var(--primary-dark);
}

.pf-empty {
  text-align: center;
  padding: 24px 0;
  color: var(--ink-3);
  font-size: 13.5px;
}
</style>
