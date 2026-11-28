<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePortalStore } from '../../store/usePortalStore'
import type { MerchantRatingItem } from '../../types/portal'

const {
  state,
  submitFeedback,
  rateMerchant,
  advanceComplaintProgress,
  likePost,
} = usePortalStore()

const activeView = ref<'rating' | 'complaint'>('rating')

// ===== 一、商户点评与动态星级定级 =====
const merchantCat = ref<'全部' | '球场' | '酒店' | '餐饮' | '教练'>('全部')
const ratingMerchantId = ref<string | null>(null)
const draftStar = ref(5)
const draftComment = ref('')

const filteredMerchants = computed(() =>
  merchantCat.value === '全部'
    ? state.merchantRatings
    : state.merchantRatings.filter((m) => m.category === merchantCat.value),
)

function openInlineRate(m: MerchantRatingItem) {
  ratingMerchantId.value = ratingMerchantId.value === m.id ? null : m.id
  draftStar.value = 5
  draftComment.value = ''
}

function submitMerchantRating(m: MerchantRatingItem) {
  rateMerchant(m.id, draftStar.value, draftComment.value)
  ratingMerchantId.value = null
  draftComment.value = ''
}

// ===== 二、一键投诉与按标签自动分派 + 进度实时回传 =====
const complaintTags = [
  { label: '价格争议', dept: '市市场监管局（价格监督科）', sla: '限时 24 小时办结', category: '酒店/公寓/餐饮价格纠纷' },
  { label: '服务不符', dept: '市文旅局（市场综合执法）', sla: '限时 24 小时办结', category: '场馆/场地设施' },
  { label: '卫生/医疗保障', dept: '市卫健局（监督保障组）', sla: '限时 12 小时办结', category: '医疗康复/便民设施' },
  { label: '交通停车收费', dept: '市交通局 / 城运中心', sla: '限时 12 小时办结', category: '出行/停车/充电桩' },
] as const

const selectedTagIdx = ref(0)
const selectedTagObj = computed(() => complaintTags[selectedTagIdx.value] ?? complaintTags[0]!)
const targetMerchant = ref('XX路社会临时停车点')
const complaintContent = ref('')

function fillDemoComplaint(tagIdx: number, targetName: string, text: string) {
  selectedTagIdx.value = tagIdx
  targetMerchant.value = targetName
  complaintContent.value = text
}

async function onSubmitComplaint() {
  await submitFeedback({
    mode: 'complaint',
    category: selectedTagObj.value.category,
    tag: selectedTagObj.value.label,
    target: targetMerchant.value,
    rating: 1,
    content: complaintContent.value,
  })
  complaintContent.value = ''
}
</script>

<template>
  <section style="display: flex; flex-direction: column; gap: 16px">
    <!-- 顶部主视图切换：商户点评与动态星级 / 一键投诉与进度回传 -->
    <div class="module-mode-bar" role="group" aria-label="商户点评与一键投诉">
      <button
        type="button"
        class="module-mode-btn"
        :aria-pressed="activeView === 'rating'"
        @click="activeView = 'rating'"
      >
        ⭐ 商户点评 & 动态星级定级
      </button>
      <button
        type="button"
        class="module-mode-btn"
        :aria-pressed="activeView === 'complaint'"
        @click="activeView = 'complaint'"
      >
        🚨 一键投诉 & 处置进度实时回传（{{ state.complaints.length }}）
      </button>
    </div>

    <!-- ===== 一、商户点评页与动态星级定级 ===== -->
    <template v-if="activeView === 'rating'">
      <div class="card card-pad" style="background: linear-gradient(135deg, #f1faf6, #ffffff); border-color: #c2e3d6">
        <div class="flex-between" style="gap: 12px; flex-wrap: wrap">
          <div>
            <div class="flex-row" style="gap: 8px; margin-bottom: 4px">
              <strong style="font-size: 18.5px">🏅 平台公开商户动态星级定级（球场 · 酒店 · 餐饮 · 教练）</strong>
              <span class="tag green">好评率 + 投诉情况动态定级 · 优胜劣汰</span>
            </div>
            <div style="font-size: 13.5px; color: var(--ink-2)">
              行程结束后可对体验过的球场、酒店、餐饮、教练逐一打分点评；所有数据脱敏回传政府监管端信用红黑榜。
            </div>
          </div>
          <div class="flex-row" style="gap: 6px; flex-wrap: wrap">
            <button
              v-for="cat in (['全部', '球场', '酒店', '餐饮', '教练'] as const)"
              :key="cat"
              type="button"
              class="filter-pill"
              :class="{ active: merchantCat === cat }"
              @click="merchantCat = cat"
            >
              {{ cat === '全部' ? '全部商户' : cat }}
            </button>
            <button type="button" class="btn-orange" style="padding: 6px 14px; font-size: 13px" @click="activeView = 'complaint'">
              🚨 一键投诉 →
            </button>
          </div>
        </div>
      </div>

      <!-- 商户动态星级卡片网格 -->
      <div class="grid-2" style="gap: 14px">
        <div
          v-for="m in filteredMerchants"
          :key="m.id"
          class="card card-pad"
          :style="m.status === '整改预警' ? 'border: 1.5px solid #f4b7bc; background: #fff9f9' : 'border-color: #d6e8e0'"
        >
          <div class="flex-between" style="margin-bottom: 6px; gap: 8px">
            <div class="flex-row" style="gap: 8px; flex-wrap: wrap">
              <span
                class="tag"
                :class="m.category === '球场' ? 'green' : m.category === '酒店' ? 'blue' : m.category === '餐饮' ? 'orange' : 'purple'"
              >
                {{ m.category }}
              </span>
              <strong style="font-size: 16.5px">{{ m.name }}</strong>
            </div>
            <span
              class="tag"
              :class="m.status === '五星诚信' ? 'green' : m.status === '四星优质' ? 'gold' : 'red'"
              style="flex-shrink: 0"
            >
              {{ m.status === '整改预警' ? '⚠️ 黄牌降星预警' : m.status }}
            </span>
          </div>

          <div class="flex-between" style="margin-bottom: 8px; font-size: 13px; color: var(--ink-2); flex-wrap: wrap; gap: 8px">
            <div class="flex-row" style="gap: 8px">
              <span style="color: #e2a227; font-size: 15px; letter-spacing: 1px">
                {{ '★'.repeat(m.starLevel) }}{{ '☆'.repeat(5 - m.starLevel) }}
              </span>
              <strong style="font-size: 15px; color: var(--ink)">{{ m.rating.toFixed(1) }} 分</strong>
              <span>（{{ m.reviewCount }} 条点评）</span>
            </div>
            <div class="flex-row" style="gap: 10px">
              <span>好评率 <strong style="color: var(--primary)">{{ m.positiveRate }}%</strong></span>
              <span>近30日投诉 <strong :style="{ color: m.complaintCount > 0 ? '#d92d38' : 'var(--primary)' }">{{ m.complaintCount }} 起</strong></span>
            </div>
          </div>

          <div style="font-size: 13px; color: var(--ink-2); background: #f6faf8; padding: 8px 10px; margin-bottom: 10px; border-left: 3px solid #c2dfd3">
            💬 最新点评：{{ m.recentReview }}
          </div>

          <div class="flex-between">
            <span style="font-size: 12.5px; color: var(--ink-3)">{{ m.badge }}</span>
            <div class="flex-row" style="gap: 8px">
              <button
                type="button"
                class="btn-ghost"
                style="padding: 5px 10px; font-size: 12.5px; color: #b81d27"
                @click="
                  activeView = 'complaint';
                  targetMerchant = m.name;
                  selectedTagIdx = m.category === '餐饮' || m.category === '酒店' ? 0 : 1
                "
              >
                投诉反馈
              </button>
              <button
                type="button"
                :class="m.reviewedByMe ? 'btn-ghost' : 'btn-primary'"
                style="padding: 5px 12px; font-size: 12.5px"
                @click="openInlineRate(m)"
              >
                {{ m.reviewedByMe ? '✅ 已点评 · 追加' : '⭐ 打分点评 (+20分)' }}
              </button>
            </div>
          </div>

          <!-- 内联打分点评表单 -->
          <div v-if="ratingMerchantId === m.id" style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--line)">
            <div class="flex-between" style="margin-bottom: 8px">
              <span style="font-size: 13px; font-weight: 700">为「{{ m.name }}」打分：</span>
              <div style="display: flex; gap: 4px">
                <button
                  v-for="s in 5"
                  :key="s"
                  type="button"
                  style="border: none; background: transparent; font-size: 22px; line-height: 1"
                  :style="{ color: s <= draftStar ? '#E2A227' : '#D2DCD8' }"
                  @click="draftStar = s"
                >
                  ★
                </button>
              </div>
            </div>
            <div class="flex-row" style="gap: 8px">
              <input
                v-model="draftComment"
                class="f-input"
                style="flex: 1; padding: 7px 10px; font-size: 13px"
                :placeholder="`写下您对${m.name}的真实体验（提交自动刷新动态星级并+20分）…`"
              />
              <button type="button" class="btn-orange" style="padding: 7px 14px; font-size: 13px; flex-shrink: 0" @click="submitMerchantRating(m)">
                提交点评
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 下方：信用红黑榜公示 + 球友实拍点评墙 -->
      <div class="grid-2" style="gap: 16px">
        <div class="card card-pad">
          <div class="flex-between" style="margin-bottom: 12px">
            <strong style="font-size: 17px">🚨 服务信用红黑榜公示</strong>
            <span class="tag red">两端互通 · 实时同步政府端</span>
          </div>
          <div class="grid-2" style="gap: 12px">
            <div style="background: #effaf4; border: 1px solid #c2e8d5; padding: 12px 14px">
              <strong style="font-size: 14.5px; color: #0a6947; display: block; margin-bottom: 6px">🏅 本月五星诚信红榜</strong>
              <div style="font-size: 13px; line-height: 1.85; color: var(--ink-2)">
                • 京山国际网球中心（★4.9 · 零投诉）<br />
                • 文峰花园酒店（★4.9 · 履约100%）<br />
                • 桥米公馆 / 陈浩教练（★5.0）
              </div>
            </div>
            <div style="background: #fff3f3; border: 1px solid #f7c6c9; padding: 12px 14px">
              <strong style="font-size: 14.5px; color: #b81d27; display: block; margin-bottom: 6px">⚠️ 黄牌预警与整改公示</strong>
              <div style="font-size: 13px; line-height: 1.85; color: #73272c">
                • <strong>降星整改：</strong>XX路社会停车点（价格公示不清）<br />
                • <strong>暂停推荐：</strong>未认证陪练爽约扣星<br />
                • <strong>保障机制：</strong>查实投诉自动降星并限期整改
              </div>
            </div>
          </div>
        </div>

        <div class="card card-pad">
          <div class="flex-between" style="margin-bottom: 12px">
            <strong style="font-size: 17px">📸 最新球友真实点评（共 {{ state.posts.length }} 条）</strong>
          </div>
          <div style="display: flex; flex-direction: column; gap: 9px">
            <div
              v-for="p in state.posts.slice(0, 3)"
              :key="p.id"
              class="flex-between"
              style="background: #f8fbfa; border: 1px solid var(--line); padding: 9px 12px; gap: 10px"
            >
              <div style="min-width: 0">
                <div style="font-size: 13.5px; font-weight: 800; color: var(--ink)">{{ p.title }}</div>
                <div style="font-size: 12px; color: var(--ink-3); margin-top: 2px">
                  👤 {{ p.origin }}·{{ p.author }} · ★{{ p.rating.toFixed(1) }} · {{ p.category }}
                </div>
              </div>
              <button
                type="button"
                style="border: none; background: transparent; font-size: 13px; font-weight: 700; flex-shrink: 0"
                :style="{ color: p.liked ? '#DF2E38' : '#748982' }"
                @click="likePost(p.id)"
              >
                {{ p.liked ? '❤️' : '🤍' }} {{ p.likes }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== 二、一键投诉 & 按标签自动分派与处置进度实时回传 ===== -->
    <template v-else>
      <div class="grid-split" style="align-items: start">
        <!-- 左侧：一键投诉提交表单 -->
        <div class="card card-pad">
          <div class="flex-between" style="margin-bottom: 12px">
            <strong style="font-size: 18px">🚨 一键发起投诉反馈</strong>
            <span class="tag red">按标签自动分派 · 限时办结</span>
          </div>

          <div class="f-group">
            <label class="f-label">第一步：选择问题标签（系统自动匹配责任部门）</label>
            <div class="grid-2" style="gap: 8px">
              <button
                v-for="(t, idx) in complaintTags"
                :key="t.label"
                type="button"
                class="card"
                style="padding: 9px 11px; text-align: left; cursor: pointer"
                :style="
                  selectedTagIdx === idx
                    ? 'border: 1.5px solid var(--accent); background: #fff6f2'
                    : 'border: 1px solid var(--line); background: #fafdfc'
                "
                @click="selectedTagIdx = idx"
              >
                <div style="font-size: 14px; font-weight: 800; color: var(--ink)">{{ t.label }}</div>
                <div style="font-size: 12px; color: var(--primary); margin-top: 2px">→ {{ t.dept }}</div>
              </button>
            </div>
          </div>

          <!-- 自动分派预览条 -->
          <div style="background: #eef5ff; border: 1px solid #c9defc; padding: 9px 12px; font-size: 13px; color: #164488; margin-bottom: 12px">
            🏛️ 智能路由预览：提交后将自动分派至 <strong>{{ selectedTagObj.dept }}</strong>（{{ selectedTagObj.sla }}），处置进度实时回传。
          </div>

          <div class="f-group">
            <label class="f-label">涉及商户 / 场馆名称</label>
            <input v-model="targetMerchant" class="f-input" placeholder="如：XX路社会临时停车点 / 某餐饮店" />
          </div>

          <div class="f-group">
            <div class="flex-between" style="margin-bottom: 4px">
              <label class="f-label" style="margin-bottom: 0">投诉详情描述</label>
              <button
                type="button"
                class="btn-ghost"
                style="padding: 2px 8px; font-size: 12px"
                @click="fillDemoComplaint(0, 'XX路社会临时停车点', '现场未按公示牌标准收费，临时加收赛期停车费20元，希望核查退还差价并规范明码标价。')"
              >
                ✨ 填入价格争议示例
              </button>
            </div>
            <textarea
              v-model="complaintContent"
              class="f-input"
              rows="3"
              placeholder="请简述遇到的价格争议、服务不符或设施问题…"
            />
          </div>

          <button type="button" class="btn-orange" style="width: 100%; padding: 11px; font-size: 15px" @click="onSubmitComplaint">
            一键提交投诉并自动分派至【{{ selectedTagObj.dept.split('（')[0] }}】
          </button>
        </div>

        <!-- 右侧：处置进度实时回传时间轴 -->
        <div class="card card-pad">
          <div class="flex-between" style="margin-bottom: 14px">
            <strong style="font-size: 18px">📡 投诉分派与处置进度实时回传（{{ state.complaints.length }} 单）</strong>
            <span class="tag blue">政民实时同步</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px">
            <div
              v-for="c in state.complaints"
              :key="c.id"
              style="border: 1px solid #d5e6df; background: #fafdfc; padding: 14px 16px"
            >
              <div class="flex-between" style="margin-bottom: 6px; gap: 8px; flex-wrap: wrap">
                <div class="flex-row" style="gap: 8px">
                  <strong style="font-size: 15.5px">#{{ c.id }} · {{ c.target }}</strong>
                  <span v-if="c.tag" class="tag orange">{{ c.tag }}</span>
                </div>
                <span
                  class="tag"
                  :class="c.status === '已办结 · 反馈满意' ? 'green' : 'red'"
                >
                  {{ c.status }}
                </span>
              </div>

              <div style="font-size: 13.5px; color: var(--ink-2); margin-bottom: 8px">{{ c.content }}</div>

              <div class="flex-between" style="font-size: 12.5px; color: var(--primary); font-weight: 700; margin-bottom: 12px; background: #edf8f3; padding: 6px 10px">
                <span>🏛️ 自动分派部门：{{ c.dept }}</span>
                <span>⏱️ {{ c.sla ?? '限时 24 小时办结' }}</span>
              </div>

              <!-- 4 步实时处置进度回传轴 -->
              <div v-if="c.timeline" class="fb-timeline">
                <div
                  v-for="(node, nIdx) in c.timeline"
                  :key="`${c.id}-${nIdx}`"
                  class="fb-tl-item"
                  :class="{ done: node.done }"
                >
                  <span class="fb-tl-dot" />
                  <div style="flex: 1">
                    <div class="flex-between">
                      <strong style="font-size: 13.5px">{{ node.step }}</strong>
                      <span style="font-size: 12px; color: var(--ink-3)">{{ node.time }}</span>
                    </div>
                    <div style="font-size: 12.5px; color: var(--ink-2); margin-top: 2px">{{ node.detail }}</div>
                  </div>
                </div>
              </div>

              <div v-if="c.status !== '已办结 · 反馈满意'" class="flex-between" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--line)">
                <span style="font-size: 12px; color: var(--ink-3)">演示控制：可模拟部门现场核查与办结回传</span>
                <button
                  type="button"
                  class="btn-primary"
                  style="padding: 5px 12px; font-size: 12.5px"
                  @click="advanceComplaintProgress(c.id)"
                >
                  ⚡ 模拟部门实时回传下一步进度 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.fb-timeline {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 6px;
}
.fb-tl-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  opacity: 0.55;
}
.fb-tl-item.done {
  opacity: 1;
}
.fb-tl-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
  background: #c5d6cf;
}
.fb-tl-item.done .fb-tl-dot {
  background: var(--primary);
  box-shadow: 0 0 0 3px rgba(11, 115, 82, 0.16);
}
</style>
