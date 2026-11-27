<script setup lang="ts">
import { ref, watch } from 'vue'
import { confirmReservation, dismissReservation, reservationView } from '../store/reservationFlow'

const dialog = ref<HTMLDialogElement>()
const reviewButton = ref<HTMLButtonElement>()
const successButton = ref<HTMLButtonElement>()
const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0 })

watch(
  () => reservationView.value?.phase,
  (phase) => {
    const element = dialog.value
    if (!element) return
    if (!phase) {
      element.close()
    } else if (!element.open) {
      element.showModal()
      reviewButton.value?.focus()
    } else if (phase === 'success') {
      successButton.value?.focus()
    }
  },
  { flush: 'post' },
)
</script>

<template>
  <dialog
    ref="dialog"
    class="reservation-dialog"
    aria-labelledby="reservation-title"
    @cancel.prevent="dismissReservation"
  >
    <template v-if="reservationView">
      <header class="reservation-header">
        <span v-if="reservationView.phase === 'success'" class="reservation-check" aria-hidden="true">✓</span>
        <h2 id="reservation-title">
          {{ reservationView.phase === 'success' ? reservationView.summary.successTitle ?? '预订成功' : '确认预订信息' }}
        </h2>
        <p v-if="reservationView.phase === 'success' && reservationView.summary.successMessage">
          {{ reservationView.summary.successMessage }}
        </p>
      </header>

      <div class="reservation-summary">
        <strong>{{ reservationView.summary.title }}</strong>
        <dl v-if="reservationView.summary.fields.length || reservationView.orderId">
          <div v-for="field in reservationView.summary.fields" :key="field.label">
            <dt>{{ field.label }}</dt>
            <dd>{{ field.value }}</dd>
          </div>
          <div v-if="reservationView.orderId">
            <dt>订单编号</dt>
            <dd>{{ reservationView.orderId }}</dd>
          </div>
        </dl>
        <div v-if="reservationView.summary.amount !== undefined" class="reservation-total">
          <span>预订金额</span>
          <strong>{{ currency.format(reservationView.summary.amount) }}</strong>
        </div>
      </div>

      <p v-if="reservationView.error" class="reservation-error" role="alert">{{ reservationView.error }}</p>

      <footer class="reservation-actions">
        <button
          v-if="reservationView.phase === 'success'"
          ref="successButton"
          type="button"
          class="btn-primary"
          @click="dismissReservation"
        >
          完成
        </button>
        <template v-else>
          <button
            ref="reviewButton"
            type="button"
            class="btn-ghost"
            :disabled="reservationView.phase === 'submitting'"
            @click="dismissReservation"
          >
            返回修改
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="reservationView.phase === 'submitting'"
            @click="confirmReservation"
          >
            {{ reservationView.phase === 'submitting' ? '正在提交…' : '确认提交' }}
          </button>
        </template>
      </footer>
    </template>
  </dialog>
</template>

<style scoped>
.reservation-dialog {
  position: fixed;
  inset: 0;
  width: min(500px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 24px;
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-lg);
}

.reservation-dialog::backdrop { background: rgb(16 37 31 / 45%); }
.reservation-header { margin-bottom: 16px; }
.reservation-header h2 { font-size: 21px; line-height: 1.4; }
.reservation-header p { margin-top: 6px; color: var(--ink-2); font-size: 14px; }
.reservation-check {
  display: grid;
  width: 36px;
  height: 36px;
  margin-bottom: 8px;
  place-items: center;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary-dark);
  font-size: 20px;
  font-weight: 800;
}
.reservation-summary { padding: 14px 16px; border-radius: 8px; background: var(--bg); }
.reservation-summary > strong { display: block; overflow-wrap: anywhere; }
.reservation-summary dl { display: grid; gap: 6px; margin-top: 10px; font-size: 14px; }
.reservation-summary dl div { display: grid; grid-template-columns: 75px minmax(0, 1fr); gap: 12px; }
.reservation-summary dt { color: var(--ink-2); }
.reservation-summary dd { margin: 0; overflow-wrap: anywhere; white-space: pre-line; }
.reservation-total { display: flex; justify-content: space-between; align-items: baseline; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line); }
.reservation-total strong { color: var(--primary-dark); font-size: 20px; }
.reservation-error { margin-top: 12px; color: #a52a24; font-size: 14px; }
.reservation-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
.reservation-actions button { border-radius: 6px; }
.reservation-actions button:disabled { opacity: 0.6; cursor: wait; }
</style>
