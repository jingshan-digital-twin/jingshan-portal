<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { usePortalStore } from '../store/usePortalStore'

const { state, dismissToast, pauseToast, resumeToast } = usePortalStore()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && state.toast) {
    dismissToast()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Transition name="notice-fade">
    <div
      v-if="state.toast"
      class="notice-backdrop"
      role="status"
      aria-live="polite"
      @click.self="dismissToast"
    >
      <div
        :key="state.toast.id"
        class="notice-card"
        :class="`tone-${state.toast.tone}`"
        @mouseenter="pauseToast"
        @mouseleave="resumeToast"
      >
        <button type="button" class="notice-close" aria-label="关闭提示" @click="dismissToast">
          ✕
        </button>

        <div class="notice-icon" :class="`tone-${state.toast.tone}`" aria-hidden="true">
          <svg
            v-if="state.toast.tone === 'success'"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg
            v-else-if="state.toast.tone === 'warning'"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="8" x2="12" y2="13" />
            <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
          </svg>
          <svg
            v-else
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
            <line x1="12" y1="11.5" x2="12" y2="17" />
          </svg>
        </div>

        <h3 class="notice-title">{{ state.toast.title }}</h3>
        <p class="notice-msg">{{ state.toast.message }}</p>

        <button type="button" class="notice-btn" :class="`tone-${state.toast.tone}`" @click="dismissToast">
          知道了
        </button>

        <div class="notice-bar-track" aria-hidden="true">
          <div class="notice-bar-fill" :class="`tone-${state.toast.tone}`" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.notice-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1400;
  background: rgba(8, 28, 21, 0.24);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.notice-card {
  position: relative;
  width: 376px;
  max-width: 100%;
  background: #ffffff;
  border: 1px solid #d5e6df;
  border-radius: 16px;
  padding: 28px 26px 22px;
  text-align: center;
  box-shadow: 0 24px 64px rgba(8, 30, 22, 0.24);
  overflow: hidden;
  animation: noticePop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes noticePop {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.notice-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: #f6faf8;
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.notice-close:hover {
  background: #e7f3ee;
  color: var(--ink);
}

.notice-icon {
  width: 54px;
  height: 54px;
  margin: 0 auto 14px;
  border-radius: 50%;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.notice-icon.tone-success {
  background: linear-gradient(135deg, #10926a, #0b6c4e);
  box-shadow: 0 0 0 8px rgba(13, 122, 88, 0.12), 0 8px 20px rgba(13, 122, 88, 0.24);
}
.notice-icon.tone-warning {
  background: linear-gradient(135deg, #f39c26, #d97706);
  box-shadow: 0 0 0 8px rgba(243, 156, 38, 0.14), 0 8px 20px rgba(217, 119, 6, 0.24);
}
.notice-icon.tone-info {
  background: linear-gradient(135deg, #2b7ae4, #185bc0);
  box-shadow: 0 0 0 8px rgba(43, 122, 228, 0.13), 0 8px 20px rgba(24, 91, 192, 0.22);
}

.notice-title {
  font-size: 19px;
  font-weight: 900;
  color: var(--ink);
  margin-bottom: 8px;
  line-height: 1.3;
}

.notice-msg {
  font-size: 14px;
  color: var(--ink-2);
  line-height: 1.6;
  margin-bottom: 18px;
}

.notice-btn {
  min-width: 112px;
  height: 38px;
  padding: 0 22px;
  border-radius: 9px;
  border: none;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  transition: filter 0.15s ease, transform 0.14s ease;
}
.notice-btn:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
}
.notice-btn.tone-success {
  background: linear-gradient(135deg, #0f8862, #096246);
}
.notice-btn.tone-warning {
  background: linear-gradient(135deg, #f0951f, #d97706);
}
.notice-btn.tone-info {
  background: linear-gradient(135deg, #2b7ae4, #185bc0);
}

.notice-bar-track {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: #edf3f0;
}
.notice-bar-fill {
  height: 100%;
  width: 100%;
  transform-origin: left center;
  animation: noticeShrink 2.8s linear forwards;
}
.notice-card:hover .notice-bar-fill {
  animation-play-state: paused;
}
.notice-bar-fill.tone-success {
  background: var(--primary);
}
.notice-bar-fill.tone-warning {
  background: #e08b17;
}
.notice-bar-fill.tone-info {
  background: var(--blue);
}

@keyframes noticeShrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

.notice-fade-enter-active,
.notice-fade-leave-active {
  transition: opacity 0.18s ease;
}
.notice-fade-enter-from,
.notice-fade-leave-to {
  opacity: 0;
}
</style>
