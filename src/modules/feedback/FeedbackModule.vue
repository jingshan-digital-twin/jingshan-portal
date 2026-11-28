<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { usePortalStore } from '../../store/usePortalStore'
import type { ComplaintTicket, MerchantRatingItem } from '../../types/portal'

const {
  state,
  submitFeedback,
  rateMerchant,
  advanceComplaintProgress,
  rateComplaintSatisfaction,
} = usePortalStore()

const activeView = ref<'rating' | 'complaint'>('rating')

// ===== 一、商户点评与动态星级定级 =====
type FilterTab = '全部' | '本次体验' | '球场' | '酒店' | '餐饮' | '教练' | '降星整改'
const activeFilter = ref<FilterTab>('全部')
const ratingMerchantId = ref<string | null>(null)
const draftStar = ref(5)
const draftTags = ref<string[]>([])
const draftComment = ref('')

const STAR_LABELS: Record<number, string> = {
  1: '1星 · 很不满意',
  2: '2星 · 不满意',
  3: '3星 · 一般',
  4: '4星 · 满意',
  5: '5星 · 推荐',
}

const QUICK_REVIEW_TAGS: Record<MerchantRatingItem['category'], string[]> = {
  球场: ['灯光标准', '场地平整', '停车方便', '服务到位'],
  酒店: ['干净舒适', '位置便利', '服务贴心', '明码标价'],
  餐饮: ['味道地道', '份量充足', '明码标价', '票根优惠'],
  教练: ['教学专业', '针对性强', '耐心细致', '准时履约'],
}

const experiencedMerchants = computed(() => state.merchantRatings.filter((m) => m.experienced))
const experiencedDoneCount = computed(() => experiencedMerchants.value.filter((m) => m.reviewedByMe).length)
const experiencedPendingCount = computed(() => experiencedMerchants.value.length - experiencedDoneCount.value)
const fiveStarCount = computed(() => state.merchantRatings.filter((m) => m.status === '五星标杆').length)
const fourStarCount = computed(() => state.merchantRatings.filter((m) => m.status === '四星优良').length)
const warnCount = computed(() => state.merchantRatings.filter((m) => m.status === '降星整改').length)

const MERCHANT_PAGE_SIZE = 6
const merchantPage = ref(1)

const filteredMerchants = computed(() => {
  if (activeFilter.value === '全部') return state.merchantRatings
  if (activeFilter.value === '本次体验') return experiencedMerchants.value
  if (activeFilter.value === '降星整改') return state.merchantRatings.filter((m) => m.status === '降星整改')
  return state.merchantRatings.filter((m) => m.category === activeFilter.value)
})

const pagedMerchants = computed(() => {
  const start = (merchantPage.value - 1) * MERCHANT_PAGE_SIZE
  return filteredMerchants.value.slice(start, start + MERCHANT_PAGE_SIZE)
})

watch(activeFilter, () => {
  merchantPage.value = 1
})

watch(
  () => filteredMerchants.value.length,
  (len) => {
    const maxPage = Math.max(1, Math.ceil(len / MERCHANT_PAGE_SIZE))
    if (merchantPage.value > maxPage) merchantPage.value = maxPage
  },
)

function openInlineRate(m: MerchantRatingItem) {
  if (ratingMerchantId.value === m.id) {
    ratingMerchantId.value = null
    return
  }
  ratingMerchantId.value = m.id
  draftStar.value = m.myRating ?? 5
  draftTags.value = []
  draftComment.value = ''
}

function toggleReviewTag(tag: string) {
  const idx = draftTags.value.indexOf(tag)
  if (idx >= 0) draftTags.value.splice(idx, 1)
  else draftTags.value.push(tag)
}

function submitMerchantRating(m: MerchantRatingItem) {
  const parts = [...draftTags.value, draftComment.value.trim()].filter(Boolean)
  rateMerchant(m.id, draftStar.value, parts.join('，'))
  ratingMerchantId.value = null
  draftTags.value = []
  draftComment.value = ''
}

function openComplaintForMerchant(m: MerchantRatingItem) {
  activeView.value = 'complaint'
  selectedMerchantName.value = m.name
  customMerchantName.value = ''
  selectedTagIdx.value = m.category === '酒店' || m.category === '餐饮' ? 0 : 1
}

function catTagClass(cat: MerchantRatingItem['category']) {
  if (cat === '球场') return 'green'
  if (cat === '酒店') return 'blue'
  if (cat === '餐饮') return 'orange'
  return 'purple'
}

function statusTagClass(status: MerchantRatingItem['status']) {
  if (status === '五星标杆') return 'green'
  if (status === '四星优良') return 'gold'
  return 'red'
}

// ===== 二、一键投诉与处置进度回传 =====
const complaintTags = [
  { label: '价格争议', dept: '市市场监管局', sla: '24小时内', category: '酒店/公寓/餐饮价格纠纷' },
  { label: '服务不符', dept: '市文旅局', sla: '24小时内', category: '场馆/场地设施' },
  { label: '卫生安全', dept: '市卫健局', sla: '12小时内', category: '医疗康复/便民设施' },
  { label: '停车收费', dept: '市交通局', sla: '12小时内', category: '出行/停车/充电桩' },
] as const

const quickComplaintPresets = [
  {
    label: '临时加价',
    tagIdx: 0,
    merchant: '城南快捷宾馆',
    text: '实际入住价格高于平台公示标准，要求核查退还差价并规范标价。',
  },
  {
    label: '服务不符',
    tagIdx: 1,
    merchant: '京山网球运动酒店',
    text: '预订页面标注含免费穿线与摆渡服务，到店后未按约提供。',
  },
  {
    label: '卫生问题',
    tagIdx: 2,
    merchant: '文峰河畔碳火烧烤街',
    text: '餐具消毒不彻底、就餐台面油污未及时清理，希望抽检整改。',
  },
] as const

const selectedTagIdx = ref(0)
const selectedTagObj = computed(() => complaintTags[selectedTagIdx.value] ?? complaintTags[0]!)
const selectedMerchantName = ref<string>(state.merchantRatings[state.merchantRatings.length - 1]?.name ?? '城南快捷宾馆')
const customMerchantName = ref('')
const complaintContent = ref('')

const resolvedMerchantTarget = computed(() =>
  selectedMerchantName.value === '__other__' ? customMerchantName.value.trim() : selectedMerchantName.value,
)

function applyQuickPreset(preset: (typeof quickComplaintPresets)[number]) {
  selectedTagIdx.value = preset.tagIdx
  selectedMerchantName.value = preset.merchant
  customMerchantName.value = ''
  complaintContent.value = preset.text
}

const COMPLAINT_PAGE_SIZE = 2
const complaintPage = ref(1)

const pagedComplaints = computed(() => {
  const start = (complaintPage.value - 1) * COMPLAINT_PAGE_SIZE
  return state.complaints.slice(start, start + COMPLAINT_PAGE_SIZE)
})

watch(
  () => state.complaints.length,
  (len) => {
    const maxPage = Math.max(1, Math.ceil(len / COMPLAINT_PAGE_SIZE))
    if (complaintPage.value > maxPage) complaintPage.value = maxPage
  },
)

async function onSubmitComplaint() {
  const beforeLen = state.complaints.length
  await submitFeedback({
    mode: 'complaint',
    category: selectedTagObj.value.category,
    tag: selectedTagObj.value.label,
    target: resolvedMerchantTarget.value || '其他服务商户',
    rating: 1,
    content: complaintContent.value,
  })
  if (state.complaints.length > beforeLen) {
    complaintContent.value = ''
    complaintPage.value = 1
  }
}

function ticketStatusShort(status: ComplaintTicket['status']) {
  if (status === '已办结 · 反馈满意') return '已办结'
  if (status === '部门核查处置中') return '核查处置中'
  return '已自动派单'
}

function ticketStatusClass(status: ComplaintTicket['status']) {
  if (status === '已办结 · 反馈满意') return 'green'
  if (status === '部门核查处置中') return 'orange'
  return 'blue'
}

function nextStepButtonLabel(c: ComplaintTicket) {
  const nextIdx = c.timeline?.findIndex((s) => !s.done) ?? -1
  if (nextIdx === 2) return '回传核查进度 →'
  return '回传办结结果 →'
}

function completedSteps(c: ComplaintTicket) {
  return (c.timeline ?? []).filter((s) => s.done)
}

function activeStepIndex(c: ComplaintTicket) {
  const list = c.timeline ?? []
  const nextIdx = list.findIndex((s) => !s.done)
  return nextIdx === -1 ? list.length - 1 : Math.max(0, nextIdx - 1)
}
</script>

<template>
  <section class="fb-page">
    <!-- 顶部视图切换 -->
    <div class="module-mode-bar" role="group" aria-label="点评与投诉切换">
      <button
        type="button"
        class="module-mode-btn"
        :aria-pressed="activeView === 'rating'"
        @click="activeView = 'rating'"
      >
        <span>商户点评</span>
        <span v-if="experiencedPendingCount > 0" class="fb-mode-pill green">{{ experiencedPendingCount }} 家待评</span>
      </button>
      <button
        type="button"
        class="module-mode-btn"
        :aria-pressed="activeView === 'complaint'"
        @click="activeView = 'complaint'"
      >
        <span>一键投诉</span>
        <span class="fb-mode-pill orange">{{ state.complaints.length }}</span>
      </button>
    </div>

    <!-- ===== 一、商户点评与动态星级 ===== -->
    <template v-if="activeView === 'rating'">
      <!-- 顶部关键指标 + 一键投诉入口 -->
      <div class="card fb-overview-bar">
        <div class="fb-kpi-strip">
          <button
            type="button"
            class="fb-kpi-item"
            :class="{ active: activeFilter === '本次体验' }"
            @click="activeFilter = activeFilter === '本次体验' ? '全部' : '本次体验'"
          >
            <span class="fb-kpi-label">本次行程</span>
            <strong class="fb-kpi-val primary">{{ experiencedDoneCount }}/{{ experiencedMerchants.length }} 已评</strong>
          </button>
          <span class="fb-kpi-sep" />
          <div class="fb-kpi-item static">
            <span class="fb-kpi-label">五星标杆</span>
            <strong class="fb-kpi-val">{{ fiveStarCount }} 家</strong>
          </div>
          <span class="fb-kpi-sep" />
          <div class="fb-kpi-item static">
            <span class="fb-kpi-label">四星优良</span>
            <strong class="fb-kpi-val">{{ fourStarCount }} 家</strong>
          </div>
          <span class="fb-kpi-sep" />
          <button
            type="button"
            class="fb-kpi-item"
            :class="{ active: activeFilter === '降星整改' }"
            @click="activeFilter = activeFilter === '降星整改' ? '全部' : '降星整改'"
          >
            <span class="fb-kpi-label">降星整改</span>
            <strong class="fb-kpi-val danger">{{ warnCount }} 家</strong>
          </button>
        </div>

        <button type="button" class="btn-orange fb-top-cta" @click="activeView = 'complaint'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.3 3.9L1.8 18.5A2 2 0 0 0 3.5 21.5h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
          <span>一键投诉</span>
        </button>
      </div>

      <!-- 分类筛选栏 -->
      <div class="fb-filter-row">
        <button
          v-for="tab in (['全部', '本次体验', '球场', '酒店', '餐饮', '教练', '降星整改'] as const)"
          :key="tab"
          type="button"
          class="filter-pill"
          :class="{ active: activeFilter === tab, warn: tab === '降星整改' && activeFilter !== tab }"
          @click="activeFilter = tab"
        >
          {{ tab === '本次体验' ? `本次体验 (${experiencedMerchants.length})` : tab }}
        </button>
      </div>

      <!-- 商户动态星级卡片 -->
      <div class="grid-2 fb-merchant-grid">
        <article
          v-for="m in pagedMerchants"
          :key="m.id"
          class="card fb-merchant-card"
          :class="{ 'is-warn': m.status === '降星整改' }"
        >
          <!-- 头部：分类 + 名称 + 动态定级 -->
          <div class="fb-mc-head">
            <div class="fb-mc-title-group">
              <span class="tag" :class="catTagClass(m.category)">{{ m.category }}</span>
              <h3 class="fb-mc-name">{{ m.name }}</h3>
              <span v-if="m.experienced" class="fb-exp-chip">本次体验</span>
            </div>
            <span class="tag fb-grade-tag" :class="statusTagClass(m.status)">
              {{ m.status }}
            </span>
          </div>

          <!-- 核心数据条：动态星级 / 评分 / 好评率 / 投诉 -->
          <div class="fb-mc-metrics">
            <div class="fb-metric-star">
              <span class="fb-stars" :aria-label="`${m.starLevel}星`">
                {{ '★'.repeat(m.starLevel) }}<span class="fb-stars-empty">{{ '★'.repeat(5 - m.starLevel) }}</span>
              </span>
              <strong class="fb-score-num">{{ m.rating.toFixed(1) }}</strong>
            </div>
            <div class="fb-metric-nums">
              <span>好评率 <strong>{{ m.positiveRate }}%</strong></span>
              <span>投诉 <strong :class="{ 'text-danger': m.complaintCount > 0 }">{{ m.complaintCount }}起</strong></span>
              <span>{{ m.reviewCount }}条</span>
            </div>
          </div>

          <!-- 最新一条评价 -->
          <div class="fb-mc-quote">
            <span v-if="m.reviewedByMe" class="fb-my-badge">我评 {{ m.myRating }}★</span>
            <span class="fb-quote-text">{{ m.recentReview }}</span>
          </div>

          <!-- 操作栏 -->
          <div class="fb-mc-actions">
            <button type="button" class="fb-btn-complain" @click="openComplaintForMerchant(m)">
              投诉
            </button>
            <button
              type="button"
              :class="m.reviewedByMe ? 'btn-ghost fb-btn-rate-done' : 'btn-primary fb-btn-rate'"
              @click="openInlineRate(m)"
            >
              {{ ratingMerchantId === m.id ? '收起' : m.reviewedByMe ? '修改点评' : '打分点评' }}
            </button>
          </div>

          <!-- 内联打分面板 -->
          <div v-if="ratingMerchantId === m.id" class="fb-rate-drawer">
            <div class="fb-rate-row">
              <div class="fb-star-picker">
                <button
                  v-for="s in 5"
                  :key="s"
                  type="button"
                  class="fb-star-btn"
                  :class="{ on: s <= draftStar }"
                  :aria-label="`${s}星`"
                  @click="draftStar = s"
                >
                  ★
                </button>
              </div>
              <span class="fb-star-label">{{ STAR_LABELS[draftStar] }}</span>
            </div>

            <div class="fb-quick-tags">
              <button
                v-for="tag in QUICK_REVIEW_TAGS[m.category]"
                :key="tag"
                type="button"
                class="fb-qtag"
                :class="{ active: draftTags.includes(tag) }"
                @click="toggleReviewTag(tag)"
              >
                {{ tag }}
              </button>
            </div>

            <div class="fb-rate-submit-row">
              <input
                v-model="draftComment"
                class="f-input fb-rate-input"
                placeholder="补充评价（选填）"
                @keyup.enter="submitMerchantRating(m)"
              />
              <button type="button" class="btn-orange fb-rate-submit" @click="submitMerchantRating(m)">
                提交评分
              </button>
            </div>
          </div>
        </article>
      </div>

      <PaginationBar
        :total="filteredMerchants.length"
        :page="merchantPage"
        :page-size="MERCHANT_PAGE_SIZE"
        unit="家"
        @update:page="merchantPage = $event"
      />
    </template>

    <!-- ===== 二、一键投诉与处置进度实时回传 ===== -->
    <template v-else>
      <div class="fb-complaint-layout">
        <!-- 左侧：发起投诉 -->
        <div class="card card-pad fb-form-card">
          <div class="fb-section-head">
            <h2>发起投诉</h2>
            <span class="tag blue">{{ selectedTagObj.dept }} · {{ selectedTagObj.sla }}</span>
          </div>

          <!-- 1. 问题标签 -->
          <div class="f-group">
            <label class="f-label">问题标签</label>
            <div class="fb-tag-grid">
              <button
                v-for="(t, idx) in complaintTags"
                :key="t.label"
                type="button"
                class="fb-tag-card"
                :class="{ active: selectedTagIdx === idx }"
                @click="selectedTagIdx = idx"
              >
                <strong>{{ t.label }}</strong>
                <span>{{ t.dept }} · {{ t.sla }}</span>
              </button>
            </div>
          </div>

          <!-- 2. 涉及商户 -->
          <div class="f-group">
            <label class="f-label" for="fb-merchant-select">涉及商户</label>
            <select id="fb-merchant-select" v-model="selectedMerchantName" class="f-input">
              <option v-for="m in state.merchantRatings" :key="m.id" :value="m.name">
                [{{ m.category }}] {{ m.name }}
              </option>
              <option value="__other__">其他商户（手动输入）</option>
            </select>
            <input
              v-if="selectedMerchantName === '__other__'"
              v-model="customMerchantName"
              class="f-input"
              style="margin-top: 8px"
              placeholder="输入商户或点位名称"
            />
          </div>

          <!-- 3. 问题说明 -->
          <div class="f-group">
            <div class="fb-label-bar">
              <label class="f-label" for="fb-content-input" style="margin-bottom: 0">问题说明</label>
              <div class="fb-preset-row">
                <button
                  v-for="preset in quickComplaintPresets"
                  :key="preset.label"
                  type="button"
                  class="fb-preset-btn"
                  @click="applyQuickPreset(preset)"
                >
                  {{ preset.label }}
                </button>
              </div>
            </div>
            <textarea
              id="fb-content-input"
              v-model="complaintContent"
              class="f-input"
              rows="3"
              placeholder="简述问题情况"
            />
          </div>

          <button type="button" class="btn-orange fb-submit-btn" @click="onSubmitComplaint">
            一键提交 · 派至{{ selectedTagObj.dept }}
          </button>
        </div>

        <!-- 右侧：处置进度实时回传 -->
        <div class="card card-pad fb-tracker-card">
          <div class="fb-section-head">
            <h2>处置进度实时回传</h2>
            <span class="tag green">{{ state.complaints.length }} 单</span>
          </div>

          <div class="fb-ticket-list">
            <article v-for="c in pagedComplaints" :key="c.id" class="fb-ticket">
              <!-- 工单顶栏 -->
              <div class="fb-tk-head">
                <div class="fb-tk-title">
                  <span class="fb-tk-id">{{ c.id }}</span>
                  <strong>{{ c.target }}</strong>
                  <span v-if="c.tag" class="tag orange">{{ c.tag }}</span>
                </div>
                <span class="tag" :class="ticketStatusClass(c.status)">
                  {{ ticketStatusShort(c.status) }}
                </span>
              </div>

              <!-- 分派信息条 -->
              <div class="fb-tk-meta">
                <span>分派部门 <strong>{{ c.dept }}</strong></span>
                <span>办结时限 <strong>{{ c.sla ?? '24小时内' }}</strong></span>
                <span>{{ c.createdAt }}</span>
              </div>

              <!-- 投诉内容 -->
              <div class="fb-tk-content">{{ c.content }}</div>

              <!-- 4 步横向进度条 -->
              <div v-if="c.timeline" class="fb-stepper">
                <div
                  v-for="(node, idx) in c.timeline"
                  :key="`${c.id}-step-${idx}`"
                  class="fb-step"
                  :class="{
                    done: node.done,
                    current: idx === activeStepIndex(c) && c.status !== '已办结 · 反馈满意',
                  }"
                >
                  <div class="fb-step-track">
                    <span class="fb-step-dot">
                      <svg v-if="node.done" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span v-else>{{ idx + 1 }}</span>
                    </span>
                    <span v-if="idx < c.timeline.length - 1" class="fb-step-line" :class="{ filled: c.timeline[idx + 1]?.done }" />
                  </div>
                  <div class="fb-step-name">{{ node.step }}</div>
                  <div class="fb-step-time">{{ node.done ? node.time.replace('今日 ', '') : '待处理' }}</div>
                </div>
              </div>

              <!-- 实时回传记录（仅显示已到达节点） -->
              <div class="fb-feed">
                <div
                  v-for="(item, fIdx) in completedSteps(c)"
                  :key="`${c.id}-feed-${fIdx}`"
                  class="fb-feed-row"
                  :class="{ latest: fIdx === completedSteps(c).length - 1 }"
                >
                  <span class="fb-feed-time">{{ item.time }}</span>
                  <span class="fb-feed-text">{{ item.detail }}</span>
                </div>
              </div>

              <!-- 底部交互栏 -->
              <div class="fb-tk-footer">
                <template v-if="c.status !== '已办结 · 反馈满意'">
                  <span class="fb-tk-sla">实时同步中</span>
                  <button type="button" class="btn-primary fb-advance-btn" @click="advanceComplaintProgress(c.id)">
                    {{ nextStepButtonLabel(c) }}
                  </button>
                </template>
                <template v-else>
                  <span class="fb-tk-sla done">已闭环办结</span>
                  <div v-if="!c.satisfaction" class="fb-sat-group">
                    <button type="button" class="btn-ghost fb-sat-btn ok" @click="rateComplaintSatisfaction(c.id, '满意')">
                      满意
                    </button>
                    <button type="button" class="btn-ghost fb-sat-btn" @click="rateComplaintSatisfaction(c.id, '不满意')">
                      不满意
                    </button>
                  </div>
                  <span v-else class="tag green">已评：{{ c.satisfaction }}</span>
                </template>
              </div>
            </article>
          </div>

          <PaginationBar
            :total="state.complaints.length"
            :page="complaintPage"
            :page-size="COMPLAINT_PAGE_SIZE"
            unit="单"
            @update:page="complaintPage = $event"
          />
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.fb-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fb-mode-pill {
  font-size: 12px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0;
}
.fb-mode-pill.green {
  background: var(--primary-light);
  color: var(--primary-dark);
}
.fb-mode-pill.orange {
  background: var(--accent-soft);
  color: #c24112;
}

/* ===== 顶部概览条 ===== */
.fb-overview-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
}
.fb-kpi-strip {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}
.fb-kpi-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
button.fb-kpi-item:hover {
  background: #f3f9f6;
  border-color: #d0e4db;
}
button.fb-kpi-item.active {
  background: var(--primary-light);
  border-color: #b4dbca;
}
.fb-kpi-item.static {
  cursor: default;
}
.fb-kpi-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-3);
}
.fb-kpi-val {
  font-size: 16px;
  font-weight: 800;
  color: var(--ink);
}
.fb-kpi-val.primary {
  color: var(--primary);
}
.fb-kpi-val.danger {
  color: var(--red);
}
.fb-kpi-sep {
  width: 1px;
  height: 18px;
  background: var(--line);
}
.fb-top-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  font-size: 14px;
}

/* ===== 筛选栏 ===== */
.fb-filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-pill.warn {
  color: var(--red);
  border-color: #f3c6c9;
  background: #fff9f9;
}
.filter-pill.warn:hover {
  border-color: var(--red);
  background: #fff0f1;
}

/* ===== 商户卡片 ===== */
.fb-merchant-grid {
  gap: 16px;
}
.fb-merchant-card {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-color: #dce9e3;
}
.fb-merchant-card.is-warn {
  border-color: #f2bec2;
  background: #fffbfb;
}
.fb-mc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.fb-mc-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}
.fb-mc-name {
  font-size: 17px;
  font-weight: 800;
  color: var(--ink);
  line-height: 1.3;
}
.fb-exp-chip {
  font-size: 11.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  background: #eef6f2;
  color: var(--primary-dark);
  border: 1px solid #c5e2d5;
}
.fb-grade-tag {
  flex-shrink: 0;
}

.fb-mc-metrics {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: #f6faf8;
  border: 1px solid #e6f0ec;
  border-radius: 8px;
  flex-wrap: wrap;
}
.fb-merchant-card.is-warn .fb-mc-metrics {
  background: #fff3f4;
  border-color: #f8d8da;
}
.fb-metric-star {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fb-stars {
  color: #e2a227;
  font-size: 16px;
  letter-spacing: 1px;
  line-height: 1;
}
.fb-stars-empty {
  color: #d6dfdb;
}
.fb-score-num {
  font-size: 18px;
  font-weight: 900;
  color: var(--ink);
}
.fb-metric-nums {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;
  color: var(--ink-2);
}
.fb-metric-nums strong {
  color: var(--ink);
  font-weight: 800;
}
.text-danger {
  color: var(--red) !important;
}

.fb-mc-quote {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: var(--ink-2);
  padding-left: 10px;
  border-left: 3px solid #c7e0d5;
  min-width: 0;
}
.fb-merchant-card.is-warn .fb-mc-quote {
  border-left-color: #eb9da2;
}
.fb-my-badge {
  flex-shrink: 0;
  font-size: 11.5px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--primary-light);
  color: var(--primary-dark);
}
.fb-quote-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fb-mc-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
}
.fb-btn-complain {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid #f2cfd1;
  background: #fff;
  color: var(--red);
  font-size: 13px;
  font-weight: 700;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.fb-btn-complain:hover {
  background: #fff2f2;
  border-color: var(--red);
}
.fb-btn-rate,
.fb-btn-rate-done {
  padding: 6px 16px;
  font-size: 13.5px;
}
.fb-btn-rate-done {
  color: var(--primary-dark);
  border-color: #b7d9ca;
  background: #f3faf6;
}

/* 内联打分抽屉 */
.fb-rate-drawer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}
.fb-rate-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.fb-star-picker {
  display: flex;
  gap: 4px;
}
.fb-star-btn {
  border: none;
  background: transparent;
  font-size: 24px;
  line-height: 1;
  color: #d4dfda;
  transition: transform 0.12s ease, color 0.12s ease;
}
.fb-star-btn:hover {
  transform: scale(1.12);
}
.fb-star-btn.on {
  color: #e2a227;
}
.fb-star-label {
  font-size: 13px;
  font-weight: 800;
  color: var(--ink-2);
}
.fb-quick-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.fb-qtag {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  background: #fff;
  color: var(--ink-2);
  font-size: 12.5px;
  font-weight: 600;
  transition: all 0.14s ease;
}
.fb-qtag:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.fb-qtag.active {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary-dark);
  font-weight: 700;
}
.fb-rate-submit-row {
  display: flex;
  gap: 8px;
}
.fb-rate-input {
  flex: 1;
  padding: 8px 12px;
  font-size: 13.5px;
}
.fb-rate-submit {
  padding: 8px 16px;
  font-size: 13.5px;
  flex-shrink: 0;
}

/* ===== 一键投诉页 ===== */
.fb-complaint-layout {
  display: grid;
  grid-template-columns: 450px 1fr;
  gap: 20px;
  align-items: start;
}
.fb-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}
.fb-section-head h2 {
  font-size: 18px;
  font-weight: 800;
  color: var(--ink);
}

.fb-tag-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.fb-tag-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--line-strong);
  background: #f9fcfb;
  text-align: left;
  transition: all 0.15s ease;
}
.fb-tag-card strong {
  font-size: 14.5px;
  font-weight: 800;
  color: var(--ink);
}
.fb-tag-card span {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
}
.fb-tag-card:hover {
  border-color: #f0a78b;
  background: #fffaf7;
}
.fb-tag-card.active {
  border-color: var(--accent);
  background: #fff5f0;
  box-shadow: 0 0 0 2px rgba(232, 85, 37, 0.12);
}
.fb-tag-card.active strong {
  color: #c24112;
}

.fb-label-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.fb-preset-row {
  display: flex;
  gap: 5px;
}
.fb-preset-btn {
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--line-strong);
  background: #fff;
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 700;
  transition: all 0.14s ease;
}
.fb-preset-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: #fff6f2;
}
.fb-submit-btn {
  width: 100%;
  padding: 11px 16px;
  font-size: 15px;
  margin-top: 4px;
}

/* 右侧工单追踪 */
.fb-ticket-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.fb-ticket {
  border: 1px solid #d6e6df;
  border-radius: 10px;
  background: #fbfdfc;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fb-tk-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.fb-tk-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.fb-tk-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  font-weight: 800;
  color: var(--ink-3);
}
.fb-tk-title strong {
  font-size: 15.5px;
  color: var(--ink);
}

.fb-tk-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: #eef7f3;
  border-radius: 7px;
  font-size: 13px;
  color: var(--ink-2);
  flex-wrap: wrap;
}
.fb-tk-meta strong {
  color: var(--primary-dark);
  font-weight: 800;
  margin-left: 4px;
}

.fb-tk-content {
  font-size: 14px;
  color: var(--ink);
  line-height: 1.5;
}

/* 横向 4 步进度条 */
.fb-stepper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  padding: 6px 0 2px;
}
.fb-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.fb-step-track {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}
.fb-step-dot {
  position: relative;
  z-index: 2;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2ece7;
  color: var(--ink-3);
  font-size: 11.5px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.fb-step.done .fb-step-dot {
  background: var(--primary);
  color: #fff;
}
.fb-step.current .fb-step-dot {
  box-shadow: 0 0 0 4px rgba(11, 115, 82, 0.18);
}
.fb-step-line {
  position: absolute;
  top: 50%;
  left: calc(50% + 12px);
  width: calc(100% - 24px);
  height: 2px;
  background: #dce7e2;
  transform: translateY(-50%);
  z-index: 1;
}
.fb-step-line.filled {
  background: var(--primary);
}
.fb-step-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink-3);
}
.fb-step.done .fb-step-name {
  color: var(--ink);
}
.fb-step-time {
  font-size: 11.5px;
  color: var(--ink-3);
  margin-top: 1px;
}

/* 实时回传记录 */
.fb-feed {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
}
.fb-feed-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 13px;
  color: var(--ink-2);
}
.fb-feed-row.latest {
  color: var(--ink);
  font-weight: 700;
}
.fb-feed-time {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-3);
  min-width: 72px;
}
.fb-feed-row.latest .fb-feed-time {
  color: var(--primary);
}

.fb-tk-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px dashed var(--line-strong);
}
.fb-tk-sla {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--primary);
}
.fb-tk-sla.done {
  color: var(--ink-3);
}
.fb-advance-btn {
  padding: 6px 14px;
  font-size: 13px;
}
.fb-sat-group {
  display: flex;
  gap: 8px;
}
.fb-sat-btn {
  padding: 5px 12px;
  font-size: 12.5px;
}
.fb-sat-btn.ok {
  color: var(--primary-dark);
  border-color: #b4dbca;
  background: #f2faf6;
}
</style>
