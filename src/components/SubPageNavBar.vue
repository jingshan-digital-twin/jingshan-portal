<script setup lang="ts">
import { computed } from 'vue'
import { getModuleMeta, usePortalStore } from '../store/usePortalStore'
import type { ModuleId } from '../types/portal'

const { state, memberTier, activeOrdersCount, switchModule, returnFromModulePage } = usePortalStore()

const currentMeta = computed(() => getModuleMeta(state.activeModule))
const isUtilityPage = computed(() => state.activeModule === 11 || state.activeModule === 12 || state.activeModule === 13)

const moduleVisualMap: Record<ModuleId, { bg: string; desc: string }> = {
  1: { bg: 'linear-gradient(135deg,#0E8F67,#085F44)', desc: '全城网旅热门服务总览' },
  2: { bg: 'linear-gradient(135deg,#10996D,#0A6B4D)', desc: '全市标准网球场在线订场、约球与赛事实时比分' },
  3: { bg: 'linear-gradient(135deg,#2EB36A,#168249)', desc: '生态景区门票预订、全域网旅线路与智能语音导览' },
  4: { bg: 'linear-gradient(135deg,#F25C43,#C93722)', desc: '非遗桥米特色鄂菜、河畔夜市与打球电子票根优惠' },
  5: { bg: 'linear-gradient(135deg,#3385F0,#195CC2)', desc: '赛事合作酒店、网球公寓长短租与市房管局购房补贴' },
  6: { bg: 'linear-gradient(135deg,#5A6FE8,#394AC2)', desc: '赛期交通限行提示、实时车位充电预约与公交接驳' },
  7: { bg: 'linear-gradient(135deg,#F0A71E,#D17D08)', desc: '京山农特好物与网球主题文创产地直发官方商城' },
  8: { bg: 'linear-gradient(135deg,#9B5DE5,#6E35B8)', desc: '天然温泉康养、休闲农庄采摘与影城在线选座' },
  9: { bg: 'linear-gradient(135deg,#169B9E,#0D7278)', desc: '湖北省网球学校招生研学、教练约课与五维能力评测' },
  10: { bg: 'linear-gradient(135deg,#0E8F67,#085F44)', desc: '全城公共便民配套服务查询' },
  11: { bg: 'linear-gradient(135deg,#0E8F67,#085F44)', desc: '球友口碑打卡评价、12345 投诉分办与商家信用公示' },
  12: { bg: 'linear-gradient(135deg,#1C6FE3,#114BA3)', desc: '政务、文旅、赛事、出行第三方官方小程序免登直连' },
  13: { bg: 'linear-gradient(135deg,#D89922,#A66D09)', desc: '会员权益、金网积分、电子票根与全部服务订单管理' },
}

const kpiPillsMap = computed<Record<ModuleId, string[]>>(() => ({
  1: ['356片标准球场', '79家联盟商家'],
  2: ['全市356片球场', '今日84片可约', `实时${state.liveMatches.length}场焦点赛`],
  3: ['3大旅游圈层', '智能语音导览', '持证社保障'],
  4: ['79家联盟餐饮', '打球票根85折', '河畔夜市'],
  5: ['精选品质住宿', '网球公寓长短租', '购房直减¥50,000'],
  6: ['赛期限行避堵', `P1车位剩${state.parkingLots[0]?.remain ?? 84}`, `超充桩闲${state.parkingLots[1]?.remain ?? 14}`],
  7: ['产地直发包邮', '积分100分=¥10', '票根满减'],
  8: ['温泉康养', '天沐温泉立减¥60', 'IMAX在线选座'],
  9: ['湖北省网球学校', `当前等级 ${state.abilityLevel}`, '官方五维认证'],
  10: ['便民配套查询'],
  11: [`${state.posts.length}条精选口碑`, `${state.complaints.length}条办结记录`, '12345自动分办'],
  12: ['政务/文旅/支付', '网球记同步', '统一身份认证'],
  13: [`${memberTier.value.code} ${memberTier.value.name}`, `${state.points} 金网积分`, `${activeOrdersCount.value} 笔有效订单`],
}))

const currentVisual = computed(() => moduleVisualMap[state.activeModule] ?? moduleVisualMap[1])
const currentKpis = computed(() => kpiPillsMap.value[state.activeModule] ?? [])
</script>

<template>
  <div class="subpage-nav-shell">
    <div class="container">
      <div class="subpage-header-row">
        <div class="subpage-head-left">
          <button
            type="button"
            class="subpage-back-btn"
            @click="isUtilityPage ? returnFromModulePage() : switchModule(1)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span>{{ isUtilityPage ? '返回' : '返回首页' }}</span>
          </button>

          <span class="subpage-v-sep" aria-hidden="true" />

          <div class="subpage-icon-badge" :style="{ background: currentVisual.bg }" aria-hidden="true">
            <svg v-if="state.activeModule === 2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M5.5 6.8c3.3 2.5 3.3 7.9 0 10.4M18.5 6.8c-3.3 2.5-3.3 7.9 0 10.4" />
            </svg>
            <svg v-else-if="state.activeModule === 3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 20l6-11 4 6 3-4 5 9H3z" />
              <circle cx="17" cy="6" r="2" />
            </svg>
            <svg v-else-if="state.activeModule === 4" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 11h18M5 11a7 7 0 0 0 14 0M8 6c0-1.5 1-2 1-3M12 6c0-1.5 1-2 1-3M16 6c0-1.5 1-2 1-3M7 20h10" />
            </svg>
            <svg v-else-if="state.activeModule === 5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
            </svg>
            <svg v-else-if="state.activeModule === 6" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="5" width="16" height="11" rx="3" />
              <path d="M4 11h16M7 19h2M15 19h2" />
            </svg>
            <svg v-else-if="state.activeModule === 7" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 7h12l1 13H5L6 7z" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
            </svg>
            <svg v-else-if="state.activeModule === 8" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 10h.01M15 10h.01M8.5 15a4 4 0 0 0 7 0" />
            </svg>
            <svg v-else-if="state.activeModule === 9" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10L12 5 2 10l10 5 10-5z" />
              <path d="M6 12v5c3 2 9 2 12 0v-5" />
            </svg>
            <svg v-else-if="state.activeModule === 11" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.7-.3-3.9-.9L3 21l1.5-5.1A8.5 8.5 0 1 1 21 12z" />
            </svg>
            <svg v-else-if="state.activeModule === 12" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
              <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
              <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
              <path d="M14 17h6M17 14v6" />
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
          </div>

          <div class="subpage-title-block">
            <div class="subpage-breadcrumb-mini">
              <button type="button" class="subpage-crumb-link" @click="switchModule(1)">首页总览</button>
              <span class="subpage-crumb-sep">/</span>
              <span>{{ currentMeta.shortName }}</span>
            </div>
            <div class="subpage-title-line">
              <h1 class="subpage-current">{{ currentMeta.title }}</h1>
              <span class="subpage-desc">{{ currentVisual.desc }}</span>
            </div>
          </div>
        </div>

        <div class="subpage-kpi-group">
          <span v-for="pill in currentKpis" :key="pill" class="summary-kpi-pill">
            {{ pill }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
