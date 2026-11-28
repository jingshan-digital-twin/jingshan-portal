<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getDivisionStatus, getOpenTournamentDivisions, getTournamentEntries } from '../../mock/tournamentRegistration'
import { PORTAL_TOURNAMENTS, type PortalTournament, type TournamentDivision, type TournamentStatus } from '../../mock/tournamentsData'
import { usePortalStore } from '../../store/usePortalStore'

const {
  state,
  openTournamentRegistration,
  refreshLiveScores,
} = usePortalStore()

// ===== 列表页状态 =====
const listScope = ref<'featured' | 'all'>('featured')
const statusFilter = ref<'全部' | TournamentStatus>('全部')
const searchKeyword = ref('')
const bannerIdx = ref(0)

const featuredTournaments = computed(() => PORTAL_TOURNAMENTS.filter((t) => t.featured))
const currentBanner = computed(() => featuredTournaments.value[bannerIdx.value] ?? PORTAL_TOURNAMENTS[0]!)

const filteredTournaments = computed(() => {
  const q = searchKeyword.value.trim().toLowerCase()
  return PORTAL_TOURNAMENTS.filter((t) => {
    const okScope = listScope.value === 'all' || t.featured
    const okStatus = statusFilter.value === '全部' || t.status === statusFilter.value
    const okQ =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.venue.toLowerCase().includes(q) ||
      t.tags.some((tg) => tg.toLowerCase().includes(q))
    return okScope && okStatus && okQ
  })
})

function statusBadgeClass(status: TournamentStatus) {
  if (status === '进行中') return 'red'
  if (status === '报名中') return 'green'
  if (status === '未开始') return 'gold'
  return ''
}

// ===== 详情页状态 =====
const selectedTournamentId = ref<string | null>(null)
const activeDetailTab = ref<'info' | 'draw' | 'standings' | 'stats' | 'schedule'>('info')
const infoSubTab = ref<'divisions' | 'history' | 'notice'>('divisions')

const activeTournament = computed<PortalTournament | null>(() =>
  selectedTournamentId.value
    ? PORTAL_TOURNAMENTS.find((t) => t.id === selectedTournamentId.value) ?? null
    : null,
)

const activeDrawTab = ref('')
const activeDrawStage = ref('')
const activeStandingTab = ref('')
const activeStatTab = ref('')
const statSearch = ref('')
const statDate = ref('')
const expandedTechIds = ref<string[]>([])
const activeScheduleDate = ref('')

const openDivisions = computed(() => activeTournament.value ? getOpenTournamentDivisions(activeTournament.value, state.orders) : [])
const divisionRows = computed(() => {
  const event = activeTournament.value
  return event?.divisions.map((division) => {
    const entries = getTournamentEntries(state.orders, event.id, division.id)
    return {
      ...division,
      status: getDivisionStatus(event, division, state.orders),
      enrolled: division.enrolled + entries.length,
      enrolledSample: [...entries.map((entry) => ({ name: entry.playerName, unit: entry.unit, level: entry.level })), ...division.enrolledSample],
    }
  }) ?? []
})

function openTournament(t: PortalTournament, tab: typeof activeDetailTab.value = 'info') {
  selectedTournamentId.value = t.id
  activeDetailTab.value = tab
  infoSubTab.value = 'divisions'
  activeDrawTab.value = t.drawTabs[0] ?? ''
  activeDrawStage.value = t.drawStages[0] ?? ''
  activeStandingTab.value = t.drawTabs[0] ?? ''
  activeStatTab.value = t.drawTabs[0] ?? ''
  statSearch.value = ''
  statDate.value = t.scheduleDates[0] ?? ''
  activeScheduleDate.value = t.scheduleDates[0] ?? ''
  expandedTechIds.value = t.techMatches[0] ? [t.techMatches[0].id] : []
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function backToList() {
  selectedTournamentId.value = null
}

function openEnrollDialog(division?: TournamentDivision) {
  if (activeTournament.value) openTournamentRegistration(activeTournament.value.id, division?.id)
}

const currentDrawGroups = computed(() => {
  const t = activeTournament.value
  if (!t) return []
  return t.drawGroupsByTab[activeDrawTab.value] ?? []
})

const currentStandings = computed(() => {
  const t = activeTournament.value
  if (!t) return []
  return t.standingsByTab[activeStandingTab.value] ?? []
})

const filteredTechMatches = computed(() => {
  const t = activeTournament.value
  if (!t) return []
  const q = statSearch.value.trim().toLowerCase()
  return t.techMatches.filter((m) => {
    const okDiv = !activeStatTab.value || m.division === activeStatTab.value
    const okQ =
      !q ||
      m.playerA.toLowerCase().includes(q) ||
      m.playerB.toLowerCase().includes(q) ||
      m.courtLabel.toLowerCase().includes(q)
    return okDiv && okQ
  })
})

const currentScheduleCols = computed(() => {
  const t = activeTournament.value
  if (!t) return []
  return t.orderOfPlayByDate[activeScheduleDate.value] ?? []
})

function toggleTechExpand(id: string) {
  const idx = expandedTechIds.value.indexOf(id)
  if (idx >= 0) expandedTechIds.value.splice(idx, 1)
  else expandedTechIds.value.push(id)
}

watch(activeTournament, (t) => {
  if (!t) return
  if (!t.drawTabs.includes(activeDrawTab.value)) activeDrawTab.value = t.drawTabs[0] ?? ''
})
</script>

<template>
  <div class="ev-wrap">
    <!-- ==================== 视图一：赛事信息列表页 ==================== -->
    <template v-if="!activeTournament">
      <!-- 顶部筛选栏（学习京山网球小程序：推荐赛事 / 全部赛事 / 赛事状态 / 关键词搜索） -->
      <div class="card card-pad filter-workbench mb-16">
        <div class="dd-filter-top" style="margin-bottom: 12px">
          <div class="flex-row" style="gap: 8px; flex-wrap: wrap">
            <button
              type="button"
              class="m-tab"
              :class="{ active: listScope === 'featured' }"
              @click="listScope = 'featured'"
            >
              🌟 推荐赛事
            </button>
            <button
              type="button"
              class="m-tab"
              :class="{ active: listScope === 'all' }"
              @click="listScope = 'all'"
            >
              📋 全部赛事（{{ PORTAL_TOURNAMENTS.length }}）
            </button>
            <select
              v-model="statusFilter"
              class="dd-select"
              :class="{ active: statusFilter !== '全部' }"
              style="width: 142px; height: 38px; font-size: 13.5px"
              aria-label="赛事状态筛选"
            >
              <option value="全部">赛事状态：全部</option>
              <option value="进行中">进行中</option>
              <option value="报名中">报名中</option>
              <option value="未开始">未开始</option>
              <option value="已结束">已结束</option>
            </select>
          </div>

          <div class="flex-row" style="gap: 10px; flex-wrap: wrap">
            <div class="search-bar" style="width: 280px; height: 38px; border-radius: 6px">
              <span>🔍</span>
              <input v-model="searchKeyword" type="text" placeholder="请输入赛事名称、场馆或组别关键字…" />
              <button v-if="searchKeyword" type="button" class="btn-ghost" style="padding: 2px 7px; font-size: 12px" @click="searchKeyword = ''">
                清空
              </button>
            </div>
            <span class="dd-count-pill">共 {{ filteredTournaments.length }} 项赛事</span>
          </div>
        </div>

        <!-- 焦点推荐赛事横幅（参照小程序顶部大图卡片） -->
        <div class="ev-banner" :style="{ backgroundImage: `linear-gradient(105deg, rgba(8, 62, 46, 0.94) 0%, rgba(11, 115, 82, 0.86) 55%, rgba(15, 76, 129, 0.72) 100%), url(${currentBanner.photo})` }">
          <div class="ev-banner-body">
            <div class="flex-row" style="gap: 8px; margin-bottom: 8px">
              <span class="tag" style="background: rgba(255, 255, 255, 0.2); color: #fff; border: 1px solid rgba(255,255,255,0.35)">
                {{ currentBanner.typeBadge }}
              </span>
              <span class="tag" style="background: var(--lime); color: #0b251d">
                {{ currentBanner.status }}
              </span>
            </div>
            <h2 class="ev-banner-title">{{ currentBanner.name }}</h2>
            <p class="ev-banner-desc">{{ currentBanner.summary }}</p>
            <div class="ev-banner-meta">
              <span>📅 {{ currentBanner.dateText }}</span>
              <span>📍 {{ currentBanner.venue }}</span>
              <span>🏆 {{ currentBanner.divisions.length }} 个组别 · 等你来战</span>
            </div>
            <div class="flex-row" style="gap: 10px; margin-top: 14px">
              <button type="button" class="btn-orange" style="padding: 8px 18px" @click="openTournament(currentBanner, 'info')">
                查看赛事详情 & 报名 ›
              </button>
              <button
                type="button"
                class="btn-ghost"
                style="background: rgba(255,255,255,0.14); color: #fff; border-color: rgba(255,255,255,0.35)"
                @click="openTournament(currentBanner, 'schedule')"
              >
                📊 看实时赛况与战表
              </button>
              <button
                type="button"
                class="btn-ghost"
                style="background: rgba(255,255,255,0.14); color: #fff; border-color: rgba(255,255,255,0.35)"
                @click="openTournament(currentBanner, 'draw')"
              >
                📋 看签表与成绩
              </button>
            </div>
          </div>

          <div class="ev-banner-dots">
            <button
              v-for="(ft, idx) in featuredTournaments"
              :key="ft.id"
              type="button"
              class="ev-dot"
              :class="{ active: idx === bannerIdx }"
              :title="ft.shortName"
              @click="bannerIdx = idx"
            >
              {{ ft.shortName }}
            </button>
          </div>
        </div>
      </div>

      <!-- 赛事列表卡片 -->
      <div v-if="filteredTournaments.length === 0" class="card card-pad" style="text-align: center; padding: 40px 20px">
        <strong style="font-size: 16px; display: block; margin-bottom: 10px">当前筛选条件下暂无赛事</strong>
        <button type="button" class="btn-primary" @click="listScope = 'all'; statusFilter = '全部'; searchKeyword = ''">
          显示全部赛事
        </button>
      </div>

      <div v-else class="ev-list">
        <div
          v-for="t in filteredTournaments"
          :key="t.id"
          class="card ev-card"
          @click="openTournament(t, 'info')"
        >
          <div class="ev-card-thumb">
            <img :src="t.photo" :alt="t.name" />
            <span class="ev-status-ribbon" :class="`st-${t.status}`">{{ t.status }}</span>
            <span class="ev-type-pill">{{ t.typeBadge }}</span>
          </div>

          <div class="ev-card-main">
            <div class="flex-between" style="gap: 10px; margin-bottom: 6px; align-items: flex-start">
              <strong class="ev-card-title">{{ t.name }}</strong>
              <span class="tag" :class="statusBadgeClass(t.status)" style="flex-shrink: 0">{{ t.status }}</span>
            </div>

            <div class="ev-card-meta">
              <span>📅 比赛日期：<strong>{{ t.dateText }}</strong></span>
              <span>📍 场馆地点：{{ t.venue }}</span>
              <span>🏛️ 承办：{{ t.organizerUnit.split('、')[0] }}</span>
            </div>

            <div class="ev-card-tags">
              <span v-for="tg in t.tags" :key="tg" class="tag green" style="font-size: 12px">{{ tg }}</span>
              <span v-if="t.extraTagsCount" class="tag" style="font-size: 12px">+{{ t.extraTagsCount }}</span>
            </div>
          </div>

          <div class="ev-card-actions" @click.stop>
            <div class="flex-row" style="gap: 6px; justify-content: flex-end">
              <button type="button" class="btn-ghost" style="padding: 6px 11px; font-size: 12.5px" @click="openTournament(t, 'draw')">
                签表/成绩
              </button>
              <button type="button" class="btn-ghost" style="padding: 6px 11px; font-size: 12.5px" @click="openTournament(t, 'schedule')">
                实时战表
              </button>
            </div>
            <button
              type="button"
              :class="t.status === '进行中' || t.status === '报名中' ? 'btn-orange' : 'btn-primary'"
              style="padding: 8px 16px; font-size: 13.5px; width: 100%"
              @click="openTournament(t, 'info')"
            >
              {{ t.status === '报名中' || t.status === '进行中' ? '赛事详情 · 报名参赛 →' : '查看历史与战绩详情 →' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== 视图二：赛事详情页（5大官方页签） ==================== -->
    <template v-else>
      <!-- 顶部返回与标题栏 -->
      <div class="card card-pad mb-16" style="background: linear-gradient(135deg, #0b3326, #0d6e4f); color: #fff">
        <div class="flex-between" style="gap: 12px; flex-wrap: wrap; margin-bottom: 12px">
          <div class="flex-row" style="gap: 10px; flex-wrap: wrap">
            <button
              type="button"
              class="btn-ghost"
              style="background: rgba(255,255,255,0.14); color: #fff; border-color: rgba(255,255,255,0.3); padding: 6px 12px; font-size: 13px"
              @click="backToList"
            >
              ← 返回赛事列表
            </button>
            <span class="tag" style="background: var(--lime); color: #0b251d">{{ activeTournament.status }}</span>
            <span class="tag" style="background: rgba(255,255,255,0.18); color: #fff">{{ activeTournament.typeBadge }}</span>
          </div>

          <div class="flex-row" style="gap: 8px">
            <button
              v-if="openDivisions.length"
              type="button"
              class="btn-orange"
              style="padding: 7px 14px; font-size: 13px"
              @click="openEnrollDialog()"
            >
              ⚡ 一键报名 + 周边空房酒店地图
            </button>
          </div>
        </div>

        <h2 style="font-size: 22px; font-weight: 900; margin-bottom: 6px">{{ activeTournament.name }}</h2>
        <div style="font-size: 13.5px; color: rgba(255,255,255,0.88)">
          📅 {{ activeTournament.dateRange }} ｜ 📍 {{ activeTournament.venue }}
        </div>
      </div>

      <!-- 5大详情子导航（严格对齐小程序：赛事信息 / 签表 / 成绩汇总 / 技术统计 / 战表） -->
      <div class="card mb-16" style="padding: 8px 14px">
        <div class="ev-detail-tabs" role="tablist">
          <button type="button" class="ev-dtab" :class="{ active: activeDetailTab === 'info' }" @click="activeDetailTab = 'info'">
            📋 赛事信息 & 报名 / 历史
          </button>
          <button type="button" class="ev-dtab" :class="{ active: activeDetailTab === 'schedule' }" @click="activeDetailTab = 'schedule'">
            ⚡ 实时信息 & 战表
          </button>
          <button type="button" class="ev-dtab" :class="{ active: activeDetailTab === 'draw' }" @click="activeDetailTab = 'draw'">
            🗂️ 签表
          </button>
          <button type="button" class="ev-dtab" :class="{ active: activeDetailTab === 'standings' }" @click="activeDetailTab = 'standings'">
            🏆 成绩汇总
          </button>
          <button type="button" class="ev-dtab" :class="{ active: activeDetailTab === 'stats' }" @click="activeDetailTab = 'stats'">
            📊 技术统计
          </button>
        </div>
      </div>

      <!-- ===== Tab 1: 赛事信息 & 组别报名 & 历届历史信息 ===== -->
      <div v-if="activeDetailTab === 'info'" class="grid-split" style="align-items: start">
        <!-- 左侧：官方基础信息卡片（对齐截图2）+ 历史信息回顾 -->
        <div style="display: flex; flex-direction: column; gap: 16px">
          <div class="card card-pad">
            <div class="flex-between" style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--line)">
              <strong style="font-size: 17.5px">📌 赛事官方档案信息</strong>
              <span class="tag" :class="statusBadgeClass(activeTournament.status)">{{ activeTournament.status }}</span>
            </div>
            <div class="ev-info-rows">
              <div><span class="ev-info-lbl">👤 指导单位：</span><span>{{ activeTournament.guideUnit }}</span></div>
              <div><span class="ev-info-lbl">🏛️ 承办单位：</span><span>{{ activeTournament.organizerUnit }}</span></div>
              <div><span class="ev-info-lbl">🤝 协办单位：</span><span>{{ activeTournament.coOrganizerUnit }}</span></div>
              <div><span class="ev-info-lbl">📍 比赛地址：</span><strong>{{ activeTournament.venue }}</strong></div>
              <div><span class="ev-info-lbl">🕒 比赛时间：</span><span>{{ activeTournament.dateRange }}</span></div>
              <div><span class="ev-info-lbl">📞 联系人：</span><span>{{ activeTournament.contact }}</span></div>
              <div><span class="ev-info-lbl">📝 报名开始：</span><span>{{ activeTournament.regStart }}</span></div>
              <div><span class="ev-info-lbl">⏰ 报名截止：</span><span>{{ activeTournament.regEnd }}</span></div>
            </div>
          </div>

          <!-- 往届历史信息（响应需求：看到这个赛事的历史信息） -->
          <div class="card card-pad">
            <div class="flex-between" style="margin-bottom: 10px">
              <strong style="font-size: 17.5px">📜 赛事历史信息与历届荣誉</strong>
              <span class="tag blue">共 {{ activeTournament.historyRecords.length }} 届历史档案</span>
            </div>
            <p style="font-size: 13.5px; color: var(--ink-2); background: #f4faf7; padding: 10px 12px; margin-bottom: 12px; border-left: 3px solid var(--primary)">
              {{ activeTournament.historySummary }}
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px">
              <div
                v-for="h in activeTournament.historyRecords"
                :key="h.year"
                style="border: 1px solid var(--line); background: #fafdfc; padding: 11px 13px"
              >
                <div class="flex-between" style="margin-bottom: 4px">
                  <strong style="font-size: 14.5px; color: var(--primary-dark)">{{ h.year }} · {{ h.edition }}</strong>
                  <span class="tag green">{{ h.participants }}</span>
                </div>
                <div style="font-size: 13px; color: var(--ink); margin-bottom: 3px">
                  🥇 冠军：<strong>{{ h.champion }}</strong> ｜ 🥈 亚军：{{ h.runnerUp }}
                </div>
                <div style="font-size: 12.5px; color: var(--ink-3)">✨ 历史亮点：{{ h.highlight }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：组别项目报名 / 赛事须知（对齐截图2下半部分） -->
        <div class="card card-pad">
          <div class="flex-between" style="margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--line)">
            <div class="flex-row" style="gap: 8px">
              <button type="button" class="m-tab" :class="{ active: infoSubTab === 'divisions' }" @click="infoSubTab = 'divisions'">
                组别项目 & 报名
              </button>
              <button type="button" class="m-tab" :class="{ active: infoSubTab === 'notice' }" @click="infoSubTab = 'notice'">
                赛事须知
              </button>
            </div>
            <span style="font-size: 13px; color: var(--primary); font-weight: 700">
              共 {{ activeTournament.divisions.length }} 个比赛组别
            </span>
          </div>

          <template v-if="infoSubTab === 'divisions'">
            <div style="display: flex; flex-direction: column; gap: 12px">
              <div
                v-for="(div, idx) in divisionRows"
                :key="div.id"
                class="ev-div-card"
                :class="idx % 2 === 0 ? 'mint' : 'sand'"
              >
                <div class="flex-between" style="margin-bottom: 6px">
                  <strong style="font-size: 17px; color: var(--ink)">{{ div.name }}</strong>
                  <strong style="font-size: 18px; color: var(--accent)">
                    {{ div.fee === 0 ? '免费' : `¥${div.fee}` }}
                  </strong>
                </div>

                <div class="flex-between" style="margin-bottom: 8px">
                  <span style="font-size: 13px; color: var(--ink-2)">
                    {{ div.limitText }} · 当前已报名 <strong>{{ div.enrolled }}</strong> 人/队
                  </span>
                  <button
                    type="button"
                    :class="div.status === '报名中' ? 'btn-primary' : 'btn-ghost'"
                    :disabled="div.status !== '报名中'"
                    style="padding: 6px 16px; border-radius: 999px; font-size: 13px"
                    @click="openEnrollDialog(div)"
                  >
                    {{ div.status === '报名中' ? '立即报名' : div.status }}
                  </button>
                </div>

                <div v-if="div.enrolledSample.length" style="font-size: 12.5px; color: var(--ink-3); padding-top: 7px; border-top: 1px dashed rgba(15,38,31,0.12)">
                  已报名代表：
                  <span v-for="(s, sIdx) in div.enrolledSample.slice(0, 3)" :key="`${div.id}-${sIdx}`">
                    {{ s.name }}（{{ s.unit }}）<template v-if="sIdx < Math.min(2, div.enrolledSample.length - 1)">、</template>
                  </span>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div style="display: flex; flex-direction: column; gap: 10px">
              <div
                v-for="(n, idx) in activeTournament.noticeList"
                :key="idx"
                style="background: #f6faf8; border-left: 3px solid var(--primary); padding: 10px 12px; font-size: 13.5px; color: var(--ink-2); line-height: 1.65"
              >
                <strong>{{ idx + 1 }}.</strong> {{ n }}
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- ===== Tab 2: 实时信息 & 战表（对齐截图6 + 网球记实时比分） ===== -->
      <div v-else-if="activeDetailTab === 'schedule'" style="display: flex; flex-direction: column; gap: 16px">
        <!-- 赛事最新实时通知横幅 -->
        <div class="card card-pad flex-between" style="background: #fff8f2; border-color: #f4cfa9; gap: 12px; flex-wrap: wrap">
          <div style="font-size: 14px; color: #7a3e0a; font-weight: 700">
            📢 {{ activeTournament.latestNotice }}
          </div>
          <div class="flex-row" style="gap: 8px; flex-shrink: 0">
            <select v-model="activeScheduleDate" class="dd-select active" style="height: 36px; width: 145px; font-size: 13px">
              <option v-for="d in activeTournament.scheduleDates" :key="d" :value="d">{{ d }}</option>
            </select>
            <button
              v-if="activeTournament.status === '进行中'"
              type="button"
              class="btn-primary"
              style="padding: 6px 14px; font-size: 13px"
              @click="refreshLiveScores"
            >
              🔄 刷新实时比分
            </button>
          </div>
        </div>

        <!-- 若赛事正在进行，顶部展示网球记实时比分速览 -->
        <div
          v-if="activeTournament.id === 'tourney-youth-2026'"
          class="card card-pad"
          style="background: linear-gradient(135deg, #092d22, #0e4936); color: #fff"
        >
          <div class="flex-between" style="margin-bottom: 12px">
            <div class="flex-row" style="gap: 8px">
              <strong style="font-size: 16.5px">🔴 实时局分直击</strong>
              <span class="tag" style="background: var(--lime); color: #0b251d">网球记毫秒级同步</span>
            </div>
            <span style="font-size: 12.5px; color: rgba(255,255,255,0.78)">全网观赛 116.3 万人次</span>
          </div>
          <div class="score-grid">
            <div v-for="m in state.liveMatches" :key="m.id" class="score-card">
              <div class="sc-head">
                <span>{{ m.venue }} · <strong>{{ m.courtNo }}</strong></span>
                <span :style="{ color: m.status === '已完赛' ? 'var(--lime)' : '#FF7B6B' }">{{ m.status }}</span>
              </div>
              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.72); margin-bottom: 7px">{{ m.round }} · 耗时 {{ m.duration }}</div>
              <div class="sc-row">
                <span>{{ m.playerA }}</span>
                <div class="sc-sets">
                  <span v-for="(s, idx) in m.setsA" :key="idx" :class="{ cur: idx > 0 && m.status !== '已完赛' }">{{ s }}</span>
                </div>
              </div>
              <div class="sc-row">
                <span>{{ m.playerB }}</span>
                <div class="sc-sets">
                  <span v-for="(s, idx) in m.setsB" :key="idx">{{ s }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 场地战表多列排期（严格还原图6：室内2号 / 室内3号 / 室内4号 分场排布） -->
        <div class="card card-pad">
          <div class="flex-between mb-14">
            <strong style="font-size: 17.5px">📅 场地每日战表（{{ activeScheduleDate }}）</strong>
            <span class="tag green">红字表示胜方 / 实时领先方</span>
          </div>

          <div class="oop-grid" :style="{ gridTemplateColumns: `repeat(${Math.max(1, currentScheduleCols.length)}, minmax(0, 1fr))` }">
            <div v-for="col in currentScheduleCols" :key="col.courtName" class="oop-col">
              <div class="oop-col-head">{{ col.courtName }}</div>
              <div v-for="slot in col.matches" :key="`${col.courtName}-${slot.matchOrder}`" class="oop-card">
                <div class="oop-card-top">
                  <span class="oop-order">{{ slot.matchOrder }}</span>
                  <div class="oop-time-info">
                    <strong>{{ slot.timeText }}</strong>
                    <span>{{ slot.division }} · {{ slot.stageRound }}</span>
                  </div>
                </div>
                <div class="oop-card-body">
                  <div class="oop-team" :class="{ win: slot.winner === 'A' || slot.live }">{{ slot.teamA }}</div>
                  <div class="oop-vs-row">
                    <span class="oop-vs-pill">VS</span>
                    <div class="oop-scores">
                      <span :class="{ win: slot.winner === 'A' || slot.live }">{{ slot.scoreA }}</span>
                      <span :class="{ win: slot.winner === 'B' }">{{ slot.scoreB }}</span>
                    </div>
                  </div>
                  <div class="oop-team" :class="{ win: slot.winner === 'B' }">{{ slot.teamB }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== Tab 3: 签表（对齐截图3：A组/B组交叉对阵矩阵表） ===== -->
      <div v-else-if="activeDetailTab === 'draw'" class="card card-pad">
        <div class="flex-between mb-14" style="flex-wrap: wrap; gap: 10px">
          <div class="flex-row" style="gap: 8px; flex-wrap: wrap">
            <button
              v-for="tab in activeTournament.drawTabs"
              :key="tab"
              type="button"
              class="m-tab"
              :class="{ active: activeDrawTab === tab }"
              @click="activeDrawTab = tab"
            >
              {{ tab }}
            </button>
          </div>
          <div class="flex-row" style="gap: 6px">
            <button
              v-for="stg in activeTournament.drawStages"
              :key="stg"
              type="button"
              class="filter-pill"
              :class="{ active: activeDrawStage === stg }"
              @click="activeDrawStage = stg"
            >
              {{ stg }}
            </button>
          </div>
        </div>

        <div v-if="currentDrawGroups.length === 0" style="text-align: center; padding: 36px 20px; color: var(--ink-3)">
          该组别签表将于开赛前一日抽签公布
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 18px">
          <div v-for="grp in currentDrawGroups" :key="grp.groupName" style="overflow-x: auto">
            <table class="draw-table">
              <thead>
                <tr>
                  <th style="width: 180px">{{ grp.groupName }}</th>
                  <th v-for="colTeam in grp.teams" :key="`h-${colTeam.code}`">{{ colTeam.code }}</th>
                  <th style="width: 72px">胜次</th>
                  <th style="width: 72px">名次</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(rowTeam, rIdx) in grp.teams" :key="rowTeam.code" :class="{ alt: rIdx % 2 === 1 }">
                  <td class="draw-team-cell">
                    <strong>{{ rowTeam.name }}</strong>
                    <span v-if="rowTeam.seed" class="draw-seed">({{ rowTeam.seed }})</span>
                    <div class="draw-region">{{ rowTeam.region }}</div>
                  </td>
                  <td v-for="colTeam in grp.teams" :key="`${rowTeam.code}-${colTeam.code}`" class="draw-score-cell">
                    <template v-if="rowTeam.code === colTeam.code">
                      <span style="color: #c0d2cb">—</span>
                    </template>
                    <template v-else-if="rowTeam.results[colTeam.code]">
                      <div class="draw-main-score" :class="{ win: rowTeam.results[colTeam.code]!.win }">
                        {{ rowTeam.results[colTeam.code]!.score }}
                      </div>
                      <div v-if="rowTeam.results[colTeam.code]!.subScores" class="draw-sub-scores">
                        <span
                          v-for="(ss, sIdx) in rowTeam.results[colTeam.code]!.subScores"
                          :key="sIdx"
                          :class="{ win: Number(ss.split(':')[0]) > Number(ss.split(':')[1]?.split('(')[0]) }"
                        >
                          {{ ss }}
                        </span>
                      </div>
                    </template>
                    <template v-else>
                      <span style="font-size: 12px; color: var(--ink-3)">待赛</span>
                    </template>
                  </td>
                  <td style="text-align: center; font-weight: 800; font-size: 16px">{{ rowTeam.wins }}</td>
                  <td style="text-align: center; font-weight: 900; color: var(--primary)">第 {{ rowTeam.rank }} 名</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ===== Tab 4: 成绩汇总（对齐截图4：名次表） ===== -->
      <div v-else-if="activeDetailTab === 'standings'" class="card card-pad">
        <div class="flex-between mb-14" style="flex-wrap: wrap; gap: 10px">
          <div class="flex-row" style="gap: 8px">
            <button
              v-for="tab in activeTournament.drawTabs"
              :key="`st-${tab}`"
              type="button"
              class="m-tab"
              :class="{ active: activeStandingTab === tab }"
              @click="activeStandingTab = tab"
            >
              {{ tab }}
            </button>
          </div>
          <span class="dd-count-pill">共 {{ currentStandings.length }} 条成绩记录</span>
        </div>

        <div v-if="currentStandings.length === 0" style="text-align: center; padding: 36px 20px; color: var(--ink-3)">
          该组别比赛尚未结束，完赛后自动生成官方成绩汇总表
        </div>

        <table v-else class="clean-table standing-table">
          <thead>
            <tr>
              <th style="width: 120px">比赛名次</th>
              <th>姓名 / 参赛代表队</th>
              <th>所属单位</th>
              <th v-if="currentStandings.some((s) => s.points)">赛事积分</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in currentStandings" :key="`${row.rank}-${row.name}`">
              <td>
                <span
                  class="tag"
                  :class="row.rank === 1 ? 'gold' : row.rank === 2 ? 'blue' : row.rank === 3 ? 'orange' : 'green'"
                  style="font-weight: 900"
                >
                  {{ row.rank === 1 ? '🥇 第 1 名' : row.rank === 2 ? '🥈 第 2 名' : row.rank === 3 ? '🥉 第 3 名' : `第 ${row.rank} 名` }}
                </span>
              </td>
              <td><strong style="font-size: 15px">{{ row.name }}</strong></td>
              <td>{{ row.unit }}</td>
              <td v-if="currentStandings.some((s) => s.points)" style="color: var(--primary); font-weight: 700">{{ row.points ?? '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== Tab 5: 技术统计（对齐截图5：搜索选手/场地 + 逐场比分卡 + 技术统计展开） ===== -->
      <div v-else class="card card-pad">
        <div class="flex-between mb-14" style="flex-wrap: wrap; gap: 10px">
          <div class="flex-row" style="gap: 8px; flex-wrap: wrap">
            <button
              v-for="tab in activeTournament.drawTabs"
              :key="`tech-${tab}`"
              type="button"
              class="m-tab"
              :class="{ active: activeStatTab === tab }"
              @click="activeStatTab = tab"
            >
              {{ tab }}
            </button>
          </div>
          <div class="flex-row" style="gap: 8px; flex-wrap: wrap">
            <div class="search-bar" style="width: 240px; height: 38px; border-radius: 6px">
              <span>🔍</span>
              <input v-model="statSearch" type="text" placeholder="输入运动员姓名或场地号…" />
            </div>
            <select v-model="statDate" class="dd-select" style="width: 136px; height: 38px; font-size: 13px">
              <option v-for="d in activeTournament.scheduleDates" :key="`sd-${d}`" :value="d">{{ d }}</option>
            </select>
          </div>
        </div>

        <div v-if="filteredTechMatches.length === 0" style="text-align: center; padding: 36px 20px; color: var(--ink-3)">
          暂无匹配场次的技术统计数据（完赛或进行中场次将实时回传）
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 12px">
          <div v-for="tm in filteredTechMatches" :key="tm.id" class="tech-card">
            <div class="tech-stage-col">
              <span>{{ tm.stage }}</span>
              <small>{{ tm.round }}</small>
            </div>

            <div class="tech-body">
              <div class="flex-between" style="padding-bottom: 8px; border-bottom: 1px solid var(--line); margin-bottom: 8px">
                <strong style="color: var(--primary); font-size: 14.5px">{{ tm.courtLabel }}</strong>
                <span class="tag" :class="tm.status === '激战中' ? 'red' : 'green'">{{ tm.status }}</span>
              </div>

              <div class="tech-player-row">
                <strong>{{ tm.playerA }}</strong>
                <strong class="tech-score">{{ tm.scoreA }}</strong>
              </div>
              <div class="tech-player-row">
                <span>{{ tm.playerB }}</span>
                <strong class="tech-score muted">{{ tm.scoreB }}</strong>
              </div>

              <div class="flex-between" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--line)">
                <span style="font-size: 12.5px; color: var(--ink-3)">⏱️ 比赛用时：<strong>{{ tm.duration }}</strong></span>
                <button
                  type="button"
                  :class="expandedTechIds.includes(tm.id) ? 'btn-primary' : 'btn-ghost'"
                  style="padding: 4px 12px; font-size: 12.5px"
                  @click="toggleTechExpand(tm.id)"
                >
                  {{ expandedTechIds.includes(tm.id) ? '收起技术统计 ▲' : '📊 查看技术统计 ▼' }}
                </button>
              </div>

              <!-- 展开技术统计对比条 -->
              <div v-if="expandedTechIds.includes(tm.id)" class="tech-stats-box">
                <div v-for="st in tm.stats" :key="st.label" class="tech-stat-row">
                  <strong style="width: 54px; text-align: right; color: var(--primary)">{{ st.valA }}{{ st.unit ?? '' }}</strong>
                  <div class="tech-stat-bar-wrap">
                    <div class="tech-stat-lbl">{{ st.label }}</div>
                    <div class="tech-stat-bars">
                      <div class="tech-bar-a" :style="{ width: `${Math.round((st.valA / Math.max(1, st.valA + st.valB)) * 100)}%` }" />
                      <div class="tech-bar-b" :style="{ width: `${Math.round((st.valB / Math.max(1, st.valA + st.valB)) * 100)}%` }" />
                    </div>
                  </div>
                  <strong style="width: 54px; text-align: left; color: var(--ink-2)">{{ st.valB }}{{ st.unit ?? '' }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<style scoped>
.ev-banner {
  background-size: cover;
  background-position: center;
  color: #fff;
  padding: 22px 26px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ev-banner-title {
  font-size: 24px;
  font-weight: 900;
  margin-bottom: 6px;
}
.ev-banner-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  max-width: 780px;
  margin-bottom: 10px;
}
.ev-banner-meta {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 600;
}
.ev-banner-dots {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}
.ev-dot {
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.88);
  padding: 4px 12px;
  font-size: 12.5px;
  font-weight: 700;
}
.ev-dot.active {
  background: var(--lime);
  border-color: var(--lime);
  color: #0b251d;
}

.ev-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ev-card {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr) 220px;
  align-items: center;
  gap: 18px;
  padding: 14px 18px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.ev-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-sm);
}
.ev-card-thumb {
  position: relative;
  height: 122px;
  overflow: hidden;
  background: #e8f4ef;
}
.ev-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ev-status-ribbon {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  font-size: 11.5px;
  font-weight: 800;
  color: #fff;
  background: #6f857e;
}
.ev-status-ribbon.st-进行中 { background: #d92d38; }
.ev-status-ribbon.st-报名中 { background: #0b7352; }
.ev-status-ribbon.st-未开始 { background: #c88b1b; }
.ev-type-pill {
  position: absolute;
  bottom: 8px;
  left: 8px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(11, 37, 29, 0.8);
  color: #fff;
}
.ev-card-title {
  font-size: 18px;
  color: var(--ink);
  line-height: 1.35;
}
.ev-card-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--ink-2);
  margin-bottom: 9px;
}
.ev-card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.ev-card-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 16px;
  border-left: 1px dashed var(--line);
}

.ev-detail-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ev-dtab {
  border: 0;
  background: transparent;
  padding: 9px 18px;
  font-size: 15px;
  font-weight: 800;
  color: var(--ink-2);
  border-bottom: 3px solid transparent;
}
.ev-dtab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  background: #f2faf6;
}

.ev-info-rows {
  display: flex;
  flex-direction: column;
  gap: 9px;
  font-size: 13.5px;
  color: var(--ink-2);
}
.ev-info-lbl {
  color: var(--ink-3);
  font-weight: 700;
}

.ev-div-card {
  padding: 15px 16px;
  border: 1px solid #d5e6df;
}
.ev-div-card.mint {
  background: linear-gradient(135deg, #e7f6ee, #f6fcf9);
}
.ev-div-card.sand {
  background: linear-gradient(135deg, #f8f3e9, #fdfbf7);
}

/* 战表（Order of Play） */
.oop-grid {
  display: grid;
  gap: 14px;
}
.oop-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.oop-col-head {
  text-align: center;
  font-size: 16px;
  font-weight: 900;
  color: var(--ink);
  padding: 8px;
  background: #eef6f2;
  border-bottom: 2px solid var(--primary);
}
.oop-card {
  border: 1px solid #d4e5dd;
  overflow: hidden;
}
.oop-card-top {
  display: flex;
  align-items: stretch;
  background: #fbf8d9;
  border-bottom: 1px solid #e6e0b8;
}
.oop-order {
  background: #4caf7d;
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.oop-time-info {
  flex: 1;
  padding: 7px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12.5px;
  color: #4b4720;
}
.oop-card-body {
  background: #daf1e4;
  padding: 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}
.oop-team {
  font-size: 14px;
  font-weight: 800;
  color: var(--ink);
}
.oop-team.win {
  color: #d92d38;
}
.oop-vs-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.oop-vs-pill {
  background: #c5d6cf;
  color: #243b33;
  font-size: 11.5px;
  font-weight: 800;
  padding: 2px 8px;
}
.oop-scores {
  display: flex;
  gap: 10px;
  font-weight: 900;
  font-size: 14px;
  background: rgba(255,255,255,0.65);
  border: 1px dashed #b2ccc0;
  padding: 2px 12px;
}
.oop-scores .win {
  color: #d92d38;
}

/* 签表交叉矩阵 */
.draw-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.draw-table th {
  background: #48ad78;
  color: #fff;
  padding: 10px 8px;
  border: 1px solid #d5e6df;
  font-weight: 800;
}
.draw-table td {
  border: 1px solid #d5e6df;
  padding: 10px 8px;
  background: #fff;
  vertical-align: middle;
}
.draw-table tr.alt td {
  background: #e5f5ec;
}
.draw-team-cell {
  text-align: center;
}
.draw-seed {
  color: #d92d38;
  font-weight: 800;
  margin-left: 3px;
}
.draw-region {
  font-size: 12px;
  color: var(--ink-3);
  margin-top: 2px;
}
.draw-score-cell {
  text-align: center;
  min-width: 92px;
}
.draw-main-score {
  font-size: 16px;
  font-weight: 900;
  color: var(--ink);
  margin-bottom: 3px;
}
.draw-main-score.win {
  color: #d92d38;
}
.draw-sub-scores {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 11.5px;
  color: var(--ink-2);
}
.draw-sub-scores .win {
  color: #d92d38;
  font-weight: 700;
}

/* 技术统计卡片 */
.tech-card {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  border: 1px solid #d5e6df;
  background: #fff;
}
.tech-stage-col {
  background: #f2f9f5;
  border-right: 1px solid #d5e6df;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 800;
  color: var(--primary-dark);
  padding: 10px 6px;
  text-align: center;
}
.tech-stage-col small {
  font-weight: 600;
  color: var(--ink-3);
}
.tech-body {
  padding: 12px 16px;
}
.tech-player-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 14.5px;
}
.tech-score {
  font-size: 17px;
  color: var(--primary-dark);
}
.tech-score.muted {
  color: var(--ink-2);
}
.tech-stats-box {
  margin-top: 10px;
  padding: 12px 14px;
  background: #f6fbf8;
  border: 1px solid #d8ebe2;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tech-stat-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}
.tech-stat-bar-wrap {
  flex: 1;
}
.tech-stat-lbl {
  text-align: center;
  font-size: 12px;
  color: var(--ink-2);
  margin-bottom: 3px;
}
.tech-stat-bars {
  display: flex;
  height: 7px;
  overflow: hidden;
  background: #e1ece7;
  gap: 2px;
}
.tech-bar-a {
  background: var(--primary);
}
.tech-bar-b {
  background: #f08c4b;
}
</style>
