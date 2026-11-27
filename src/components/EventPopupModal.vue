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
    <div class="modal-box" style="width: 660px; border: 2px solid #f4c65d">
      <div class="photo-box" style="height: 230px; cursor: default">
        <img src="/images/tournament_2.jpg" alt="2026京山网球重大赛事弹窗" />
        <div
          style="
            position: absolute;
            inset: 0;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 18px 22px;
            background: linear-gradient(180deg, transparent 25%, rgba(8, 30, 22, 0.94) 100%);
            color: #fff;
            z-index: 2;
          "
        >
          <div class="flex-row" style="margin-bottom: 6px">
            <span class="tag" style="background: var(--lime); color: #0b251d">中国青少年四大满贯之一</span>
            <span class="tag" style="background: rgba(255, 255, 255, 0.2); color: #fff">观赛 116.3 万次 · 768 名选手</span>
          </div>
          <div style="font-size: 22px; font-weight: 900">2026 中国青少年网球巡回赛总决赛 · 京山站</div>
          <div style="font-size: 12px; color: rgba(255, 255, 255, 0.85); margin-top: 3px">
            📅 2026年11月24日 — 12月3日 ｜ 📍 京山国际网球中心 & 网球训练基地
          </div>
        </div>
        <span class="badge-tl" style="background: #df2e38; z-index: 5">
          <span class="live-dot" />重磅赛事弹窗 · 正在火热进行中
        </span>
        <button
          type="button"
          title="关闭弹窗"
          style="
            position: absolute;
            top: 12px;
            right: 12px;
            z-index: 10;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 1.5px solid rgba(255, 255, 255, 0.45);
            background: rgba(11, 37, 29, 0.86);
            color: #fff;
            font-size: 15px;
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

      <div class="card-pad" style="display: flex; flex-direction: column; gap: 12px">
        <div class="grid-3" style="gap: 10px">
          <div style="background: #f3faf6; border: 1px solid #cce6da; border-radius: 11px; padding: 10px">
            <strong style="font-size: 13px; color: var(--primary)">📊 网球记实时赛况</strong>
            <div style="font-size: 11px; color: var(--ink-3); margin-top: 3px">同步「网球记」各场馆实时比分、场次占用与赛期交通避堵指引</div>
          </div>
          <div style="background: #fff6f2; border: 1px solid #ffd5c2; border-radius: 11px; padding: 10px">
            <strong style="font-size: 13px; color: var(--accent)">🏠 赛期购房减5万元</strong>
            <div style="font-size: 11px; color: var(--ink-3); margin-top: 3px">市房管局联合品质楼盘：凭赛事/订场记录直减 ¥50,000</div>
          </div>
          <div style="background: #eef5ff; border: 1px solid #c9defc; border-radius: 11px; padding: 10px">
            <strong style="font-size: 13px; color: var(--blue)">🎫 79家联盟票根85折</strong>
            <div style="font-size: 11px; color: var(--ink-3); margin-top: 3px">凭电子票根享酒店85折、桥米85折、温泉立减¥60与免费摆渡</div>
          </div>
        </div>

        <div class="flex-between" style="padding-top: 8px; border-top: 1px solid var(--line)">
          <label style="font-size: 12px; color: var(--ink-3); display: flex; align-items: center; gap: 6px; cursor: pointer">
            <input v-model="dontShowAgain" type="checkbox" />
            今日不再自动弹出
          </label>
          <div class="flex-row">
            <button type="button" class="btn-ghost" @click="handleClose">暂不查看</button>
            <button type="button" class="btn-ghost" @click="goHomeSubsidy">领取购房减5万</button>
            <button type="button" class="btn-orange" @click="goLiveScore">查看实时赛况与订场 →</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
