<script setup lang="ts">
import { usePortalStore } from '../store/usePortalStore'
import type { ModuleId } from '../types/portal'

const { state, activeOrdersCount, switchModule } = usePortalStore()

interface MainTile {
  id: ModuleId
  title: string
  sub: string
  bg: string
  badge?: string
  badgeBg?: string
}

const mainTiles: MainTile[] = [
  { id: 1, title: '首页总览', sub: '名片/宣传片/活动', bg: 'linear-gradient(135deg,#0E8F67,#085F44)', badge: '总览', badgeBg: '#0D7A58' },
  { id: 2, title: '打 · 场地服务', sub: '订场/比分/陪练', bg: 'linear-gradient(135deg,#10996D,#0A6B4D)', badge: '实时余量', badgeBg: '#FF5D2A' },
  { id: 3, title: '游 · 旅游游览', sub: '延伸线/语音导览', bg: 'linear-gradient(135deg,#2EB36A,#168249)', badge: '全域游', badgeBg: '#168249' },
  { id: 4, title: '吃 · 美食服务', sub: '菜单/团餐/票根券', bg: 'linear-gradient(135deg,#F25C43,#C93722)', badge: '票根85折', badgeBg: '#E44717' },
  { id: 5, title: '住 · 住宿服务', sub: '酒店/公寓/购房减5万', bg: 'linear-gradient(135deg,#3385F0,#195CC2)', badge: '公寓/减5万', badgeBg: '#D9381E' },
  { id: 6, title: '行 · 出行服务', sub: '限行图/车位/充电', bg: 'linear-gradient(135deg,#5A6FE8,#394AC2)', badge: '限行指引', badgeBg: '#DF2E38' },
  { id: 7, title: '购 · 特色商品', sub: '农特/文创/商城', bg: 'linear-gradient(135deg,#F0A71E,#D17D08)' },
  { id: 8, title: '娱 · 休闲娱乐', sub: '农庄/采摘/康养', bg: 'linear-gradient(135deg,#9B5DE5,#6E35B8)' },
  { id: 9, title: '训 · 培训研学', sub: '省网校/评测/康复', bg: 'linear-gradient(135deg,#169B9E,#0D7278)', badge: '省网校', badgeBg: '#0D7278' },
  { id: 10, title: '便民配套服务', sub: '公厕/医疗/充电/路况', bg: 'linear-gradient(135deg,#0EA5A4,#0A6F72)' },
]
</script>

<template>
  <div class="kk-shell" style="margin-top: -46px">
    <div class="container">
      <div class="kk-card">
        <div class="kk-row-main">
          <button
            v-for="m in mainTiles"
            :key="m.id"
            class="kk-btn"
            :class="{ active: state.activeModule === m.id }"
            @click="switchModule(m.id)"
          >
            <div class="kk-icon" :style="{ background: m.bg }">
              <span v-if="m.badge" class="kk-badge" :style="{ background: m.badgeBg }">{{ m.badge }}</span>
              <!-- Crisp white vector icons matching Image 1 -->
              <svg v-if="m.id === 1" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1">
                <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" />
              </svg>
              <svg v-else-if="m.id === 2" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1">
                <circle cx="12" cy="12" r="9" />
                <path d="M5.5 6.8c3.3 2.5 3.3 7.9 0 10.4M18.5 6.8c-3.3 2.5-3.3 7.9 0 10.4" />
              </svg>
              <svg v-else-if="m.id === 3" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1">
                <path d="M3 20l6-11 4 6 3-4 5 9H3z" />
                <circle cx="17" cy="6" r="2" />
              </svg>
              <svg v-else-if="m.id === 4" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1">
                <path d="M3 11h18M5 11a7 7 0 0 0 14 0M8 6c0-1.5 1-2 1-3M12 6c0-1.5 1-2 1-3M16 6c0-1.5 1-2 1-3M7 20h10" />
              </svg>
              <svg v-else-if="m.id === 5" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1">
                <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
              </svg>
              <svg v-else-if="m.id === 6" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1">
                <rect x="4" y="5" width="16" height="11" rx="3" />
                <path d="M4 11h16M7 19h2M15 19h2" />
              </svg>
              <svg v-else-if="m.id === 7" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1">
                <path d="M6 7h12l1 13H5L6 7z" />
                <path d="M9 7V5a3 3 0 0 1 6 0v2" />
              </svg>
              <svg v-else-if="m.id === 8" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1">
                <circle cx="12" cy="12" r="9" />
                <path d="M9 10h.01M15 10h.01M8.5 15a4 4 0 0 0 7 0" />
              </svg>
              <svg v-else-if="m.id === 9" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1">
                <path d="M22 10L12 5 2 10l10 5 10-5z" />
                <path d="M6 12v5c3 2 9 2 12 0v-5" />
              </svg>
              <svg v-else width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1">
                <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </div>
            <div class="kk-label">{{ m.title }}</div>
            <div class="kk-sub">{{ m.sub }}</div>
          </button>
        </div>

        <div class="kk-row-sub">
          <div class="kk-sub-left">
            <span class="tag green">👆 点击任意模块图标</span>
            <span>下方工作区实时切换对应完整业务内容（严格对照《表3》13项清单）</span>
          </div>
          <div class="kk-sub-pills">
            <button
              class="kk-pill"
              :class="{ active: state.activeModule === 11 }"
              @click="switchModule(11)"
            >
              ⑪ 互动反馈（评价 / 投诉 / 信用预警）
            </button>
            <button
              class="kk-pill"
              :class="{ active: state.activeModule === 12 }"
              @click="switchModule(12)"
            >
              ⑫ 小程序互联互通（政务 / 文旅 / 支付 / 打车）
            </button>
            <button
              class="kk-pill"
              :class="{ active: state.activeModule === 13 }"
              @click="switchModule(13)"
            >
              ⑬ 个人中心（{{ activeOrdersCount }}笔订单 / 会员积分 / 五维图）
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
