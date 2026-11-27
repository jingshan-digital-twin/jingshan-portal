<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { requestReservation } from '../store/reservationFlow'
import { usePortalStore } from '../store/usePortalStore'

const { state, showToast, createQuickOrder } = usePortalStore()

const playing = ref(true)
const progress = ref(32)
const clockText = ref('')
const camAngle = ref('中心球场 · 全景机位')
const inquiryName = ref('林先生')
const inquiryPhone = ref('138****8866')
const inquiryCount = ref('20人')
const inquiryNote = ref('')

let tick: number | undefined

function updateClock() {
  const now = new Date()
  clockText.value = now.toLocaleTimeString('zh-CN', { hour12: false })
}

watch(
  () => state.actionModal,
  (val) => {
    if (tick) window.clearInterval(tick)
    if (!val) return
    playing.value = true
    progress.value = 24
    updateClock()
    tick = window.setInterval(() => {
      updateClock()
      if (playing.value) {
        progress.value = progress.value >= 100 ? 0 : progress.value + 2
      }
    }, 1000)
  },
)

onUnmounted(() => {
  if (tick) window.clearInterval(tick)
})

function close() {
  state.actionModal = null
}

async function submitInquiryForm() {
  const name = inquiryName.value.trim()
  const phone = inquiryPhone.value.trim()
  if (!name || !phone) {
    showToast('请填写联系人姓名与手机号')
    return
  }
  const inquiry = state.actionModal
  if (inquiry?.type !== 'inquiry') return
  const count = inquiryCount.value.trim()
  const note = inquiryNote.value.trim()
  const sent = await requestReservation({
    title: inquiry.title,
    fields: [
      { label: '联系人', value: name },
      { label: '联系电话', value: phone },
      ...(count ? [{ label: '预计人数', value: count }] : []),
      ...(note ? [{ label: '补充需求', value: note }] : []),
    ],
    successTitle: '预约申请已提交',
    successMessage: '请留意联系人电话，等候服务专员确认。',
  }, () => { inquiryNote.value = '' })
  if (sent && state.actionModal === inquiry) close()
}

async function reserveRestaurant() {
  const menu = state.actionModal
  if (menu?.type !== 'menu') return
  const booked = await createQuickOrder('门票', `${menu.shopName} · 订座核销`, `已绑定电子票根 ${state.ticketStubCode}`, 0, 60)
  if (booked && state.actionModal === menu) close()
}

function redeemStubAtMerchant() {
  state.points += 60
  showToast(`电子票根 ${state.ticketStubCode} 核销成功！已享网球联盟 85 折，并获得 +60 金网积分`)
  close()
}
</script>

<template>
  <div v-if="state.actionModal" class="modal-backdrop" @click.self="close">
    <!-- 1. 官方宣传片播放器 -->
    <div v-if="state.actionModal.type === 'video'" class="modal-box" style="width: 680px">
      <div class="photo-box" style="height: 320px; background: #071d16">
        <img src="/images/hero.jpg" alt="宣传片画面" style="opacity: 0.82" />
        <span class="badge-tl"><span class="live-dot" />{{ playing ? '正在播放' : '已暂停' }} · {{ state.actionModal.duration }}</span>
        <div
          style="
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 18px 20px;
            background: linear-gradient(180deg, transparent 40%, rgba(5, 22, 16, 0.92) 100%);
            color: #fff;
          "
        >
          <strong style="font-size: 18px; margin-bottom: 10px">{{ state.actionModal.title }}</strong>
          <div style="height: 5px; background: rgba(255, 255, 255, 0.25); border-radius: 0; overflow: hidden; margin-bottom: 10px">
            <div :style="{ width: progress + '%', height: '100%', background: 'var(--lime)', transition: 'width 0.4s linear' }" />
          </div>
          <div class="flex-between">
            <div class="flex-row">
              <button class="btn-orange" style="padding: 5px 12px" @click="playing = !playing">
                {{ playing ? '⏸ 暂停播放' : '▶ 继续播放' }}
              </button>
              <span class="tag" style="background: rgba(255, 255, 255, 0.16); color: #fff" @click="progress = 10">00:00 生态山水</span>
              <span class="tag" style="background: rgba(255, 255, 255, 0.16); color: #fff" @click="progress = 45">00:55 国际网球中心</span>
              <span class="tag" style="background: rgba(255, 255, 255, 0.16); color: #fff" @click="progress = 78">01:40 温泉与桥米</span>
            </div>
            <button class="btn-ghost" @click="close">✕ 关闭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 球场摄像头实况监控 -->
    <div v-else-if="state.actionModal.type === 'livecam'" class="modal-box" style="width: 700px">
      <div class="card-pad flex-between" style="background: #0b251d; color: #fff">
        <div>
          <strong style="font-size: 18px">📹 球场实时监控画面 · {{ state.actionModal.venueName }}</strong>
          <div style="font-size: 13px; color: var(--lime); margin-top: 3px">
            LIVE 实时推流 {{ clockText }} ｜ {{ state.actionModal.viewers }} 位球友正在查看
          </div>
        </div>
        <button class="btn-ghost" @click="close">✕ 关闭</button>
      </div>
      <div class="photo-box" style="height: 310px">
        <img :src="state.actionModal.photo" alt="实时画面" />
        <span class="badge-tl"><span class="live-dot" />{{ camAngle }} · 1080P 实时画面</span>
        <span class="badge-bl">智能照明：已就绪 ｜ 当前风速 2 级</span>
      </div>
      <div class="card-pad flex-between">
        <div class="flex-row">
          <button
            v-for="ang in ['中心球场 · 全景机位', '3号硬地场 · 边线机位', '红土区 · 顶棚机位']"
            :key="ang"
            class="m-tab"
            :class="{ active: camAngle === ang }"
            @click="camAngle = ang"
          >
            {{ ang }}
          </button>
        </div>
        <button class="btn-primary" @click="close">查看完毕去订场</button>
      </div>
    </div>

    <!-- 3. 餐厅完整菜单与票根85折计算 -->
    <div v-else-if="state.actionModal.type === 'menu'" class="modal-box" style="width: 640px">
      <div class="card-pad flex-between" style="background: #0d3c2e; color: #fff">
        <div>
          <strong style="font-size: 18px">📖 {{ state.actionModal.shopName }} · 完整菜单</strong>
          <div style="font-size: 13.5px; color: var(--lime); margin-top: 3px">
            凭电子票根 {{ state.ticketStubCode }} 享 85 折优惠 · {{ state.actionModal.dist }}
          </div>
        </div>
        <button class="btn-ghost" @click="close">✕ 关闭</button>
      </div>
      <div class="card-pad">
        <table class="clean-table" style="margin-bottom: 16px">
          <thead>
            <tr><th>菜品名称</th><th>门市价</th><th>票根85折价</th></tr>
          </thead>
          <tbody>
            <tr v-for="d in state.actionModal.dishes" :key="d.name">
              <td>
                <strong>{{ d.name }}</strong>
                <span v-if="d.tag" class="tag orange" style="margin-left: 8px">{{ d.tag }}</span>
              </td>
              <td><s>¥{{ d.price }}</s></td>
              <td><strong style="color: var(--accent)">¥{{ d.stubPrice }}</strong></td>
            </tr>
          </tbody>
        </table>
        <div class="flex-between">
          <span style="font-size: 13.5px; color: var(--ink-2)">到店出示电子票根即享票根价结算</span>
          <button
            class="btn-orange"
            @click="reserveRestaurant"
          >
            免费预约餐位
          </button>
        </div>
      </div>
    </div>

    <!-- 4. 高德 / 百度真实坐标导航弹窗 -->
    <div v-else-if="state.actionModal.type === 'nav'" class="modal-box" style="width: 580px">
      <div class="card-pad flex-between" style="background: #103b66; color: #fff">
        <div>
          <strong style="font-size: 18px">🗺️ 一键导航 · {{ state.actionModal.placeName }}</strong>
          <div style="font-size: 13.5px; color: rgba(255, 255, 255, 0.88); margin-top: 3px">
            距离 {{ state.actionModal.distance }} ｜ 预计通行 {{ state.actionModal.driveMin }}
          </div>
        </div>
        <button class="btn-ghost" @click="close">✕ 关闭</button>
      </div>
      <div class="card-pad" style="display: flex; flex-direction: column; gap: 13px">
        <div style="background: #f5f9f7; border: 1px solid var(--line); border-radius: 0; padding: 12px 14px; font-size: 14px; color: var(--ink-2)">
          <div><strong>📍 详细地址：</strong>{{ state.actionModal.address }}</div>
        </div>
        <div style="background: #fff5f5; border: 1px solid #f7c5c8; color: #a81c26; padding: 12px 14px; border-radius: 0; font-size: 14px; font-weight: 700">
          🚦 到达提示：{{ state.actionModal.tip }}
        </div>
        <div class="grid-2" style="gap: 12px">
          <a
            :href="`https://uri.amap.com/marker?position=${state.actionModal.lng},${state.actionModal.lat}&name=${encodeURIComponent(state.actionModal.placeName)}`"
            target="_blank"
            rel="noopener"
            class="btn-primary"
            style="padding: 12px; text-align: center; text-decoration: none"
          >
            🧭 高德地图导航 ↗
          </a>
          <a
            :href="`https://api.map.baidu.com/marker?location=${state.actionModal.lat},${state.actionModal.lng}&title=${encodeURIComponent(state.actionModal.placeName)}&content=${encodeURIComponent(state.actionModal.address)}&output=html`"
            target="_blank"
            rel="noopener"
            class="btn-orange"
            style="padding: 12px; text-align: center; text-decoration: none"
          >
            🗺️ 百度地图导航 ↗
          </a>
        </div>
      </div>
    </div>

    <!-- 5. 电子票根二维码核销弹窗 -->
    <div v-else-if="state.actionModal.type === 'stub'" class="modal-box" style="width: 500px">
      <div class="card-pad flex-between" style="background: linear-gradient(135deg, #0b3326, #115a43); color: #fff">
        <div>
          <strong style="font-size: 18px">🎫 京山网球电子票根核销码</strong>
          <div style="font-size: 13.5px; color: var(--lime); margin-top: 3px">凭证号：{{ state.actionModal.code }} · 有效中</div>
        </div>
        <button class="btn-ghost" @click="close">✕ 关闭</button>
      </div>
      <div class="card-pad" style="text-align: center">
        <div style="width: 168px; height: 168px; margin: 6px auto 14px; padding: 12px; border: 2px solid #d5e6df; border-radius: 0; background: #fff">
          <svg viewBox="0 0 60 60" width="140" height="140">
            <rect width="60" height="60" fill="#fff" />
            <rect x="4" y="4" width="16" height="16" fill="none" stroke="#0B251D" stroke-width="3.2" />
            <rect x="9" y="9" width="6" height="6" fill="#0D7A58" />
            <rect x="40" y="4" width="16" height="16" fill="none" stroke="#0B251D" stroke-width="3.2" />
            <rect x="45" y="9" width="6" height="6" fill="#0D7A58" />
            <rect x="4" y="40" width="16" height="16" fill="none" stroke="#0B251D" stroke-width="3.2" />
            <rect x="9" y="45" width="6" height="6" fill="#0D7A58" />
            <rect x="25" y="6" width="5" height="5" fill="#0B251D" />
            <rect x="32" y="12" width="5" height="5" fill="#0D7A58" />
            <rect x="25" y="24" width="10" height="10" fill="#0D7A58" />
            <rect x="8" y="26" width="12" height="5" fill="#0B251D" />
            <rect x="40" y="26" width="14" height="5" fill="#0B251D" />
            <rect x="26" y="40" width="8" height="6" fill="#0B251D" />
            <rect x="40" y="40" width="14" height="14" fill="#0B251D" />
            <rect x="44" y="44" width="6" height="6" fill="#fff" />
          </svg>
        </div>
        <div style="font-size: 15.5px; font-weight: 800; margin-bottom: 6px">全市 79 家「京山网球联盟商家」扫码核销</div>
        <div style="font-size: 13.5px; color: var(--ink-2); margin-bottom: 16px">
          享餐饮85折、酒店85折、温泉立减¥60与特产满减
        </div>
        <button class="btn-orange" style="width: 100%; padding: 12px" @click="redeemStubAtMerchant">
          模拟商户扫码核销（+60 积分）
        </button>
      </div>
    </div>

    <!-- 6. 景点语音导览播放器 -->
    <div v-else-if="state.actionModal.type === 'audio'" class="modal-box" style="width: 600px">
      <div class="photo-box" style="height: 210px">
        <img :src="state.actionModal.photo" :alt="state.actionModal.spotName" />
        <span class="badge-tl">🎧 官方语音导览 · 建议游玩 {{ state.actionModal.duration }}</span>
      </div>
      <div class="card-pad">
        <div class="flex-between" style="margin-bottom: 10px">
          <strong style="font-size: 18px">{{ state.actionModal.spotName }}</strong>
          <button class="btn-ghost" @click="close">✕ 关闭</button>
        </div>
        <p style="font-size: 14.5px; color: var(--ink-2); line-height: 1.8; background: #f5faf8; padding: 13px 15px; border-radius: 0; margin-bottom: 14px">
          “{{ state.actionModal.script }}”
        </p>
        <div style="height: 7px; background: #e3ece8; border-radius: 0; overflow: hidden; margin-bottom: 14px">
          <div :style="{ width: progress + '%', height: '100%', background: 'var(--primary)', transition: 'width 0.4s linear' }" />
        </div>
        <div class="flex-between">
          <button class="btn-primary" @click="playing = !playing">
            {{ playing ? '⏸ 暂停讲解' : '▶ 继续讲解' }}
          </button>
          <span style="font-size: 13.5px; color: var(--ink-3)">支持息屏播放 · 沿途自动讲解</span>
        </div>
      </div>
    </div>

    <!-- 7. 通用咨询/报名表单弹窗 -->
    <div v-else-if="state.actionModal.type === 'inquiry'" class="modal-box" style="width: 560px">
      <div class="card-pad flex-between" style="background: #0d3c2e; color: #fff">
        <div>
          <strong style="font-size: 18px">{{ state.actionModal.title }}</strong>
          <div style="font-size: 13.5px; color: rgba(255, 255, 255, 0.86); margin-top: 3px">{{ state.actionModal.subtitle }}</div>
        </div>
        <button class="btn-ghost" @click="close">✕ 关闭</button>
      </div>
      <div class="card-pad">
        <div class="f-group">
          <label class="f-label">联系人姓名</label>
          <input v-model="inquiryName" class="f-input" />
        </div>
        <div class="grid-2" style="gap: 12px">
          <div class="f-group">
            <label class="f-label">联系电话</label>
            <input v-model="inquiryPhone" class="f-input" />
          </div>
          <div class="f-group">
            <label class="f-label">预计人数 / 规模</label>
            <input v-model="inquiryCount" class="f-input" />
          </div>
        </div>
        <div class="f-group">
          <label class="f-label">补充需求说明</label>
          <textarea v-model="inquiryNote" class="f-input" rows="3" placeholder="例如：希望安排的日期、住宿/餐标要求等…" />
        </div>
        <div class="flex-between">
          <span style="font-size: 13.5px; color: var(--ink-3)">官方专员 15 分钟内响应</span>
          <button class="btn-orange" @click="submitInquiryForm">{{ state.actionModal.submitLabel }}</button>
        </div>
      </div>
    </div>

    <!-- 8. 小程序授权跳转弹窗 -->
    <div v-else-if="state.actionModal.type === 'miniprogram'" class="modal-box" style="width: 500px">
      <div class="card-pad flex-between" style="background: #0b251d; color: #fff">
        <strong style="font-size: 17.5px">🔗 小程序互联互通授权</strong>
        <button class="btn-ghost" @click="close">✕ 关闭</button>
      </div>
      <div class="card-pad" style="text-align: center">
        <div style="font-size: 18px; font-weight: 900; margin-bottom: 8px">{{ state.actionModal.appName }}</div>
        <div style="font-size: 14px; color: var(--ink-2); margin-bottom: 16px">{{ state.actionModal.desc }}</div>
        <div style="background: #f3faf6; border: 1px dashed #0d7a58; border-radius: 0; padding: 14px; font-size: 14px; color: #0b5c42; margin-bottom: 16px">
          ✅ 已携带实名账号与当前定位，免重复登录
        </div>
        <button class="btn-primary" style="width: 100%; padding: 12px" @click="showToast(`已成功授权并拉起「${state.actionModal.appName}」`); close()">
          确认授权并打开小程序 →
        </button>
      </div>
    </div>
  </div>
</template>
