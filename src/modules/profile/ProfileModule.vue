<script setup lang="ts">
import { computed, ref } from 'vue'
import AbilityRadarChart from '../../components/AbilityRadarChart.vue'
import { usePortalStore } from '../../store/usePortalStore'

const { state, memberTier, switchModule, cancelOrder, redeemPoints, openActionModal } =
  usePortalStore()

const profileTab = ref<'全部' | '订单' | '票根' | '收藏'>('全部')
const orderCat = ref<'全部' | '场地' | '住宿' | '门票' | '课程' | '商品'>('全部')

const filteredOrders = computed(() =>
  orderCat.value === '全部'
    ? state.orders
    : state.orders.filter((o) => o.category === orderCat.value),
)
</script>

<template>
  <section>
    <div class="module-header">
      <div class="mh-left">
        <div class="mh-num">13</div>
        <div>
          <h1 class="mh-title">个人中心（会员积分 · 五维网球能力 · 订单票根）</h1>
          <div class="mh-desc">
            完整展示会员等级与积分规则、指定机构评测的五维网球能力图与晋升测试通道，以及我的订单（场地/住宿/门票/课程/商品）、收藏、优惠券、消息通知
          </div>
        </div>
      </div>
      <div class="mh-tabs">
        <button class="m-tab" :class="{ active: profileTab === '全部' }" @click="profileTab = '全部'">个人总览</button>
        <button class="m-tab" :class="{ active: profileTab === '订单' }" @click="profileTab = '订单'">我的订单({{ state.orders.length }})</button>
        <button class="m-tab" :class="{ active: profileTab === '票根' }" @click="profileTab = '票根'">票根与积分兑换</button>
        <button class="m-tab" :class="{ active: profileTab === '收藏' }" @click="profileTab = '收藏'">收藏({{ state.favorites.length }})</button>
      </div>
    </div>

    <div v-if="profileTab === '全部' || profileTab === '票根'" class="grid-2 mb-16">
      <div class="card card-pad" style="background: linear-gradient(145deg, #0b3125, #11553f); color: #fff">
        <div class="flex-between" style="margin-bottom: 10px">
          <div class="flex-row">
            <div
              style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #f5ca69, #ca8613); color: #2d1b00; font-size: 18px; font-weight: 900; display: flex; align-items: center; justify-content: center"
            >
              林
            </div>
            <div>
              <div style="font-size: 17px; font-weight: 900">
                林先生
                <span style="font-size: 11px; background: #f5ca69; color: #2f1c00; padding: 2px 8px; border-radius: 99px; margin-left: 5px">
                  👑 {{ memberTier.code }} {{ memberTier.name }}
                </span>
              </div>
              <div style="font-size: 11.5px; color: rgba(255, 255, 255, 0.78)">
                来源地：{{ state.origin }} ｜ 当前可用积分：
                <strong style="color: var(--lime); font-size: 15px">{{ state.points }} 分</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="grid-4" style="gap: 7px; margin-bottom: 11px">
          <div style="background: rgba(255, 255, 255, 0.1); border-radius: 9px; padding: 7px; font-size: 10.5px">
            <strong>Lv.1 新星</strong><br />注册即享 · 订场98折
          </div>
          <div style="background: rgba(255, 255, 255, 0.1); border-radius: 9px; padding: 7px; font-size: 10.5px">
            <strong>Lv.2 球友</strong><br />500分 · 订场92折
          </div>
          <div :style="memberTier.code === 'Lv.3' ? 'background:rgba(196,246,61,0.22);border:1px solid var(--lime);border-radius:9px;padding:7px;font-size:10.5px;' : 'background:rgba(255,255,255,0.1);border-radius:9px;padding:7px;font-size:10.5px;'">
            <strong :style="{ color: memberTier.code === 'Lv.3' ? 'var(--lime)' : '#fff' }">Lv.3 精英</strong><br />1000分 · 85折+免费退
          </div>
          <div :style="memberTier.code === 'Lv.4' ? 'background:rgba(196,246,61,0.22);border:1px solid var(--lime);border-radius:9px;padding:7px;font-size:10.5px;' : 'background:rgba(255,255,255,0.1);border-radius:9px;padding:7px;font-size:10.5px;'">
            <strong :style="{ color: memberTier.code === 'Lv.4' ? 'var(--lime)' : '#fff' }">Lv.4 冠军黑金</strong><br />1500分 · 8折+VIP室
          </div>
        </div>

        <div style="background: rgba(0, 0, 0, 0.24); border-radius: 11px; padding: 10px 12px; font-size: 11.5px; line-height: 1.75; margin-bottom: 10px">
          <div><strong style="color: var(--lime)">💰 怎么积累积分：</strong>在线订场 +50分 ｜ 完赛 +120分 ｜ 约陪练/购课 +80分 ｜ 联盟消费 +60分 ｜ 打卡点评 +20分</div>
          <div><strong style="color: #f5ca69">🎁 积分快捷兑换：</strong>点击下方按钮即可实时用积分兑换权益券！</div>
        </div>
        <div class="flex-row">
          <button class="btn-orange" style="padding: 5px 11px; font-size: 11.5px" @click="redeemPoints(500, '1小时免费订场通兑券', '全市186片开放球场通用 · 免场地费')">
            500分兑1h免费场
          </button>
          <button class="btn-ghost" style="padding: 5px 11px; font-size: 11.5px" @click="redeemPoints(300, '天沐温泉康养免费入园券', '含温泉泡池体验1次')">
            300分兑温泉券
          </button>
          <button class="btn-ghost" style="padding: 5px 11px; font-size: 11.5px" @click="redeemPoints(200, '指定机构晋升评测抵用券', '湖北省网球学校/国际中心通用')">
            200分兑评测券
          </button>
        </div>
      </div>

      <div class="card card-pad" style="display: grid; grid-template-columns: 255px 1fr; gap: 14px; align-items: center">
        <div style="text-align: center">
          <AbilityRadarChart :ability="state.ability" :level="state.abilityLevel" />
          <div style="font-size: 11px; color: var(--ink-3); margin-top: -4px">评测机构：湖北省网球学校认证点</div>
        </div>
        <div>
          <div class="flex-between" style="margin-bottom: 6px">
            <strong style="font-size: 16px">网球五维能力评估档案</strong>
            <span class="tag green">官方认证 {{ state.abilityLevel }}</span>
          </div>
          <div style="font-size: 11.5px; color: var(--ink-2); line-height: 1.7; margin-bottom: 10px">
            • <strong>等级体系：</strong>JS-1.5(启蒙) → JS-2.5 → <strong>{{ state.abilityLevel }}(当前)</strong> → JS-4.5 → JS-5.0<br />
            • <strong>晋升路径：</strong>训练后可在「训」模块预约指定机构<strong>晋升测试</strong>，复测录入自动刷新五维图！<br />
            • <strong>智能联动：</strong>已自动绑定至「分级赛同级报名」与「同城约球精准匹配」。
          </div>
          <div class="flex-row">
            <button class="btn-orange" @click="switchModule(9)">申请晋升测试</button>
            <button class="btn-primary" @click="switchModule(2)">按 {{ state.abilityLevel }} 匹配球友</button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-split">
      <div v-if="profileTab === '全部' || profileTab === '订单'" class="card card-pad">
        <div class="flex-between" style="margin-bottom: 10px">
          <strong style="font-size: 15.5px">📦 我的订单（场地 / 住宿 / 门票 / 课程 / 商品）</strong>
          <div class="flex-row">
            <button
              v-for="c in (['全部', '场地', '住宿', '门票', '课程', '商品'] as const)"
              :key="c"
              class="m-tab"
              :class="{ active: orderCat === c }"
              style="padding: 3px 9px; font-size: 11px"
              @click="orderCat = c"
            >
              {{ c }}
            </button>
          </div>
        </div>
        <table class="clean-table">
          <thead>
            <tr><th>类型</th><th>订单内容（含联动预约）</th><th>时间</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="o in filteredOrders" :key="o.id">
              <td>
                <span class="tag" :class="{ green: o.category === '场地', blue: o.category === '住宿', gold: o.category === '门票' || o.category === '商品', purple: o.category === '课程' }">
                  {{ o.category }}
                </span>
              </td>
              <td>
                <strong>{{ o.title }}</strong><br />
                <span style="font-size: 10.5px; color: var(--ink-3)">{{ o.subtitle }}（¥{{ o.amount }}）</span>
              </td>
              <td>{{ o.time }}</td>
              <td><strong :style="{ color: o.status === '已取消' ? '#999' : 'var(--primary)' }">{{ o.status }}</strong></td>
              <td>
                <button v-if="o.cancellable && o.status !== '已取消'" class="btn-ghost" style="padding: 3px 8px; font-size: 11px" @click="cancelOrder(o.id)">
                  取消订单
                </button>
                <span v-else style="font-size: 11px; color: var(--ink-3)">已退款</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px">
        <div v-if="profileTab === '全部' || profileTab === '票根'" class="card card-pad">
          <div class="flex-between" style="margin-bottom: 7px">
            <strong style="font-size: 14.5px">🎫 我的电子票根 & 优惠券 ({{ state.coupons.length }}张)</strong>
            <span class="tag orange">79家联盟通用</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11.5px">
            <div v-for="cp in state.coupons" :key="cp.id" class="flex-between" style="background: #fff6f2; padding: 7px 10px; border-radius: 8px">
              <div>
                <strong>{{ cp.title }}</strong> <span class="tag green">{{ cp.badge }}</span>
                <div style="font-size: 10.5px; color: var(--ink-3)">{{ cp.desc }}</div>
              </div>
              <button
                class="btn-ghost"
                style="padding: 3px 8px; font-size: 11px; color: var(--accent)"
                @click="openActionModal({ type: 'stub', code: state.ticketStubCode })"
              >
                出示核销
              </button>
            </div>
          </div>
        </div>

        <div v-if="profileTab === '全部' || profileTab === '收藏'" class="card card-pad">
          <div class="flex-between" style="margin-bottom: 7px">
            <strong style="font-size: 14.5px">🔔 消息通知 & ❤️ 我的收藏 ({{ state.favorites.length }})</strong>
          </div>
          <div style="font-size: 11.5px; line-height: 1.85; color: var(--ink-2)">
            • <strong style="color: var(--accent)">[开灯提醒]</strong> 13:55 将为您自动开启国际网球中心3号场智能照明，P1车位已锁。<br />
            • <strong style="color: var(--primary)">[积分提醒]</strong> 当前可用积分 {{ state.points }} 分，订场/购好物可直接抵现。<br />
            • <strong>[收藏夹]</strong> {{ state.favorites.join('、') || '暂无收藏' }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
