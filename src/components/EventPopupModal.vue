<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { usePortalStore } from '../store/usePortalStore'

const { state, closeEventModal, switchModule, claimHomeSubsidy } = usePortalStore()
const dontShowAgain = ref(false)

function handleClose() {
  closeEventModal(dontShowAgain.value)
}

function goLiveScore() {
  closeEventModal(dontShowAgain.value)
  switchModule(2)
}

function goHomeSubsidy() {
  claimHomeSubsidy()
  closeEventModal(dontShowAgain.value)
  switchModule(5)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && state.showEventModal) {
    handleClose()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="state.showEventModal" class="modal-backdrop" @click.self="handleClose">
    <div class="modal-box" style="width: 700px; border: 2px solid #f4c65d">
      <div class="photo-box" style="height: 240px; cursor: default">
        <img src="/images/tournament_2.jpg" alt="2026京山网球重大赛事" />
        <div
          style="
            position: absolute;
            inset: 0;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 20px 24px;
            background: linear-gradient(180deg, transparent 25%, rgba(8, 30, 22, 0.94) 100%);
            color: #fff;
            z-index: 2;
          "
        >
          <div style="font-size: 24px; font-weight: 900">2026 中国青少年网球巡回赛总决赛 · 京山站</div>
          <div style="font-size: 14px; color: rgba(255, 255, 255, 0.9); margin-top: 5px">
            📅 2026年11月24日 — 12月3日 ｜ 📍 京山国际网球中心
          </div>
        </div>
        <span class="badge-tl" style="background: #df2e38; z-index: 5">
          <span class="live-dot" />重磅赛事 · 进行中
        </span>
        <button
          type="button"
          title="关闭"
          style="
            position: absolute;
            top: 12px;
            right: 12px;
            z-index: 10;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 1.5px solid rgba(255, 255, 255, 0.45);
            background: rgba(11, 37, 29, 0.86);
            color: #fff;
            font-size: 16px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          "
          @click.stop="handleClose"
        >
          ✕
        </button>
      </div>

      <div class="card-pad" style="display: flex; flex-direction: column; gap: 14px">
        <div class="grid-3" style="gap: 12px">
          <div style="background: #f3faf6; border: 1px solid #cce6da; border-radius: 0; padding: 14px">
            <strong style="font-size: 15px; color: var(--primary)">📊 实时赛况比分</strong>
            <div style="font-size: 13.5px; color: var(--ink-2); margin-top: 5px">同步网球记实时比分与赛期交通指引</div>
          </div>
          <div style="background: #fff6f2; border: 1px solid #ffd5c2; border-radius: 0; padding: 14px">
            <strong style="font-size: 15px; color: var(--accent)">🏠 购房直减 5 万元</strong>
            <div style="font-size: 13.5px; color: var(--ink-2); margin-top: 5px">市房管局联合品质楼盘凭凭证直减</div>
          </div>
          <div style="background: #eef5ff; border: 1px solid #c9defc; border-radius: 0; padding: 14px">
            <strong style="font-size: 15px; color: var(--blue)">🎫 联盟商家 85 折</strong>
            <div style="font-size: 13.5px; color: var(--ink-2); margin-top: 5px">凭电子票根享酒店、餐饮与温泉特惠</div>
          </div>
        </div>

        <div class="flex-between" style="padding-top: 10px; border-top: 1px solid var(--line)">
          <label style="font-size: 13.5px; color: var(--ink-2); display: flex; align-items: center; gap: 6px; cursor: pointer">
            <input v-model="dontShowAgain" type="checkbox" />
            今日不再自动弹出
          </label>
          <div class="flex-row">
            <button type="button" class="btn-ghost" @click="handleClose">暂不查看</button>
            <button type="button" class="btn-ghost" @click="goHomeSubsidy">领取购房补贴</button>
            <button type="button" class="btn-orange" @click="goLiveScore">查看赛况与订场 →</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
