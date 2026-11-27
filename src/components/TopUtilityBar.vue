<script setup lang="ts">
import { usePortalStore } from '../store/usePortalStore'
import type { VisitorOrigin } from '../types/portal'

const { state, switchModule, showToast } = usePortalStore()

const origins: VisitorOrigin[] = [
  '武汉市（省内游客）',
  '京山本地市民',
  '荆门市（周边游客）',
  '深圳市（省外游客）',
]

function onOriginChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as VisitorOrigin
  state.origin = value
  showToast(`已切换游客来源地为「${value}」，延伸旅游线路已智能更新`)
}
</script>

<template>
  <div class="top-strip">
    <div class="container">
      <div class="top-left">
        <span><i class="dot-lime" /><strong>京山网球</strong> · 中国网球之城</span>
        <select class="origin-select" :value="state.origin" @change="onOriginChange">
          <option v-for="item in origins" :key="item" :value="item">📍 来源地：{{ item }}</option>
        </select>
        <span>☀️ 晴 19°C · 空气优</span>
        <span class="top-alert" @click="switchModule(6)">
          🚦 赛期交通提示：温泉大道段临时封闭 · 点查限行与推荐停车 →
        </span>
      </div>
      <div class="top-right">
        <span class="top-link" @click="switchModule(12)">📱 小程序互通</span>
        <span class="top-link" @click="switchModule(11)">📢 投诉/评价/预警</span>
        <span class="top-link" style="color: #8ee6c6">{{ state.dataMode }}</span>
        <span class="top-link hl" @click="showToast('政务监管端由管理驾驶舱提供，此处保持管用分离')">
          🏛️ 政务监管端入口 →
        </span>
      </div>
    </div>
  </div>
</template>
