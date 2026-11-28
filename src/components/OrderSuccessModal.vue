<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { usePortalStore } from '../store/usePortalStore'

const { state, closeOrderSuccess, openActionModal, switchModule } = usePortalStore()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && state.orderSuccessModal) {
    closeOrderSuccess()
  }
}

function viewTicketStub() {
  closeOrderSuccess()
  openActionModal({ type: 'stub', code: state.ticketStubCode })
}

function goToProfilePoints() {
  closeOrderSuccess()
  switchModule(13)
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div
    v-if="state.orderSuccessModal"
    class="modal-backdrop order-success-backdrop"
    @click.self="closeOrderSuccess"
  >
    <div class="order-success-card" role="dialog" aria-modal="true" :aria-label="state.orderSuccessModal.headline">
      <button type="button" class="order-success-close" aria-label="关闭弹窗" @click="closeOrderSuccess">
        ✕
      </button>

      <div class="order-success-hero">
        <div class="order-success-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 class="order-success-title">{{ state.orderSuccessModal.headline }}</h2>
        <p class="order-success-note">
          {{ state.orderSuccessModal.note || '订单已确认并同步保存，凭订单号或电子票根即可核销' }}
        </p>
      </div>

      <div class="order-success-receipt">
        <div class="flex-between" style="margin-bottom: 10px; gap: 8px">
          <span class="tag green">{{ state.orderSuccessModal.category }}</span>
          <span v-if="state.orderSuccessModal.orderId" class="order-success-id">
            订单号 {{ state.orderSuccessModal.orderId }}
          </span>
        </div>

        <div class="order-success-item-title">{{ state.orderSuccessModal.title }}</div>
        <div class="order-success-item-sub">{{ state.orderSuccessModal.subtitle }}</div>
        <div v-if="state.orderSuccessModal.time" class="order-success-item-time">
          🕒 {{ state.orderSuccessModal.time }}
        </div>

        <div class="order-success-divider" />

        <div class="flex-between" style="align-items: center; gap: 10px">
          <div>
            <span style="font-size: 13px; color: var(--ink-3); margin-right: 6px">实付金额</span>
            <strong
              v-if="typeof state.orderSuccessModal.amount === 'number' && state.orderSuccessModal.amount > 0"
              style="font-size: 22px; color: var(--accent)"
            >
              ¥{{ state.orderSuccessModal.amount }}
            </strong>
            <strong v-else style="font-size: 17px; color: var(--primary)">
              免费预约
            </strong>
          </div>

          <div class="flex-row" style="gap: 6px; flex-wrap: wrap; justify-content: flex-end">
            <span v-if="state.orderSuccessModal.pointsSpent && state.orderSuccessModal.pointsSpent > 0" class="tag orange">
              已抵扣 {{ state.orderSuccessModal.pointsSpent }} 分
            </span>
            <span v-if="state.orderSuccessModal.pointsGain && state.orderSuccessModal.pointsGain > 0" class="tag gold">
              +{{ state.orderSuccessModal.pointsGain }} 金网积分
            </span>
          </div>
        </div>
      </div>

      <div class="order-success-actions">
        <template v-if="state.orderSuccessModal.category === '商品'">
          <button type="button" class="btn-ghost" @click="closeOrderSuccess">
            继续选购
          </button>
          <button type="button" class="btn-primary" @click="goToProfilePoints">
            查看个人中心积分 →
          </button>
        </template>
        <template v-else>
          <button type="button" class="btn-ghost" @click="viewTicketStub">
            查看电子票根
          </button>
          <button type="button" class="btn-primary" @click="closeOrderSuccess">
            我知道了
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
