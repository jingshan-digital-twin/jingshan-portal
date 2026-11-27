<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AbilityRadarChart from '../../components/AbilityRadarChart.vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { BOOKING_DATES, formatHourRange } from '../../mock/schedules'
import {
  CAMP_PROGRAMS,
  INITIAL_CLUBS,
  INITIAL_YOUTH_TOURNAMENTS,
  REHAB_CENTERS,
  type TennisClub,
  type YouthTournament,
} from '../../mock/trainingData'
import { usePortalStore } from '../../store/usePortalStore'

const {
  state,
  switchModule,
  openPhoto,
  openActionModal,
  openNavigation,
  bookGroupClass,
  bookPrivateCoachSlot,
  createQuickOrder,
  runUpgradeTest,
  showToast,
} = usePortalStore()

// 主分区切换
const trainSection = ref<'booking' | 'camps' | 'clubs' | 'school' | 'rehab'>('booking')

// ===== 1. 日常约课（团体课 / 私教课 7日日历） =====
const lessonMode = ref<'group' | 'private'>('group')
const selectedDate = ref(BOOKING_DATES[0]!.iso)
const showAllDatesForGroup = ref(false)
const groupCat = ref<'全部' | '零基础入门' | '多球强化' | '双打战术' | '发球专项'>('全部')
const groupLevel = ref<'全部' | '零基础' | 'CUTR 2.0-3.0' | 'CUTR 3.0-4.0' | '青少年'>('全部')
const groupPeriod = ref<'全天' | '上午' | '下午' | '晚间'>('全天')
const coachTier = ref<'全部' | '省网校国家级' | '金网5.0' | 'CTA高级'>('全部')
const coachSpecialty = ref<'全部' | '零基础启蒙' | '发球提速' | '网前截击' | '比赛实战' | '青少年'>('全部')
const coachVenue = ref<string>('全部')
const pickedCoachHours = reactive<Record<string, string>>({})

const currentDateObj = computed(
  () => BOOKING_DATES.find((d) => d.iso === selectedDate.value) ?? BOOKING_DATES[0]!,
)

function matchPeriod(startTime: string, period: '全天' | '上午' | '下午' | '晚间') {
  const h = Number(startTime.split(':')[0])
  if (period === '上午') return h < 12
  if (period === '下午') return h >= 12 && h < 18
  if (period === '晚间') return h >= 18
  return true
}

const PAGE_SIZE = 4
const groupKeyword = ref('')
const groupPage = ref(1)
const campPage = ref(1)

const filteredGroupClasses = computed(() => {
  const q = groupKeyword.value.trim().toLowerCase()
  return state.groupClasses.filter((cls) => {
    const okDate = showAllDatesForGroup.value || cls.date === selectedDate.value
    const okCat = groupCat.value === '全部' || cls.category === groupCat.value
    const okLevel = groupLevel.value === '全部' || cls.level === groupLevel.value
    const okPeriod = matchPeriod(cls.startTime, groupPeriod.value)
    const okQ = !q || cls.title.toLowerCase().includes(q) || cls.coachName.toLowerCase().includes(q) || cls.venueName.toLowerCase().includes(q)
    return okDate && okCat && okLevel && okPeriod && okQ
  })
})

const pagedGroupClasses = computed(() => {
  const start = (groupPage.value - 1) * PAGE_SIZE
  return filteredGroupClasses.value.slice(start, start + PAGE_SIZE)
})

watch(filteredGroupClasses, () => {
  groupPage.value = 1
})

const coachVenues = computed(() => [
  '全部',
  ...Array.from(new Set(state.privateCoaches.map((c) => c.venueName))),
])

const filteredCoaches = computed(() =>
  state.privateCoaches.filter((c) => {
    const okTier = coachTier.value === '全部' || c.tier === coachTier.value
    const okSpec = coachSpecialty.value === '全部' || c.specialty === coachSpecialty.value
    const okVenue = coachVenue.value === '全部' || c.venueName === coachVenue.value
    return okTier && okSpec && okVenue
  }),
)

function isCoachSlotBooked(coachId: string, hour: string) {
  return state.bookedCoachKeys.includes(`${coachId}|${selectedDate.value}|${hour}`)
}

function selectCoachSlot(coachId: string, hour: string) {
  if (isCoachSlotBooked(coachId, hour)) return
  pickedCoachHours[coachId] = hour
}

function submitCoachSlot(coachId: string) {
  const chosen = pickedCoachHours[coachId]
  if (!chosen) {
    showToast('请先点击选择该教练的一个具体空闲时间段')
    return
  }
  bookPrivateCoachSlot(coachId, selectedDate.value, chosen)
  delete pickedCoachHours[coachId]
}

// ===== 2. 训练营 / 研学课程 / 团建活动 =====
const campFilter = ref<'全部' | '训练营' | '研学课程' | '团建活动'>('全部')
const campKeyword = ref('')
const campDate = ref(BOOKING_DATES[1]!.shortDate)
const campPeople = ref(1)

const visibleCamps = computed(() => {
  const q = campKeyword.value.trim().toLowerCase()
  return CAMP_PROGRAMS.filter((c) => {
    const okCat = campFilter.value === '全部' || c.category === campFilter.value
    const okQ = !q || c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.targetAudience.toLowerCase().includes(q)
    return okCat && okQ
  })
})

const pagedCamps = computed(() => {
  const start = (campPage.value - 1) * PAGE_SIZE
  return visibleCamps.value.slice(start, start + PAGE_SIZE)
})

watch(visibleCamps, () => {
  campPage.value = 1
})

function enrollCamp(item: (typeof CAMP_PROGRAMS)[number]) {
  createQuickOrder(
    '课程',
    `${item.category}：${item.title}`,
    `${campDate.value}批次 · ${campPeople.value}人报名 · ${item.duration}`,
    item.price * campPeople.value,
    item.category === '训练营' ? 200 : 120,
  )
}

// ===== 3. 认证俱乐部（介绍 / 课程销售 / 评价与在线发评） =====
const clubs = reactive<TennisClub[]>(structuredClone(INITIAL_CLUBS))
const reviewDrafts = reactive<Record<string, { score: number; content: string }>>({})

function getReviewDraft(clubId: string) {
  if (!reviewDrafts[clubId]) {
    reviewDrafts[clubId] = { score: 5, content: '' }
  }
  return reviewDrafts[clubId]!
}

function submitClubReview(club: TennisClub) {
  const draft = getReviewDraft(club.id)
  if (!draft.content.trim()) {
    showToast('请填写您对俱乐部的真实上课评价')
    return
  }
  club.reviews.unshift({
    id: `cr-${Date.now()}`,
    user: `林先生（${state.origin.slice(0, 2)}）`,
    score: draft.score,
    date: '刚刚',
    content: draft.content.trim(),
  })
  club.reviewCount += 1
  draft.content = ''
  state.points += 15
  showToast(`已成功发布对「${club.name.split('（')[0]}」的评价，获赠 +15 金网积分！`)
}

// ===== 4. 湖北省网球学校报名咨询通道 + 五维评测 =====
const selectedOrg = ref('湖北省网球学校评测中心')
const schoolForm = reactive({
  track: '小学/初中网球特长生招生',
  studentName: '',
  age: '11岁',
  level: '已有1年基础',
  visitDate: BOOKING_DATES[1]!.shortDate,
  phone: '',
})
const schoolInquiryHistory = ref<{ id: string; track: string; studentName: string; visitDate: string }[]>([])

function submitSchoolInquiry() {
  if (!schoolForm.studentName.trim() || !schoolForm.phone.trim()) {
    showToast('请填写学员姓名和家长联系电话，方便省网校招生老师联系您')
    return
  }
  const code = `HBTW-${Date.now().toString().slice(-4)}`
  schoolInquiryHistory.value.unshift({
    id: code,
    track: schoolForm.track,
    studentName: schoolForm.studentName.trim(),
    visitDate: schoolForm.visitDate,
  })
  showToast(`湖北省网球学校招生咨询单（${code}）提交成功！招生办将在 2 小时内致电确认探校与试训`)
  schoolForm.studentName = ''
  schoolForm.phone = ''
}

// ===== 5. 青少年网球比赛 =====
const youthGroupFilter = ref<'全部' | 'U8/U10' | 'U12/U14' | 'U16/U18'>('全部')
const youthTournaments = reactive<YouthTournament[]>(structuredClone(INITIAL_YOUTH_TOURNAMENTS))
const youthMatchMode = reactive<Record<string, '单打' | '双打'>>({})

const visibleYouthTournaments = computed(() =>
  youthGroupFilter.value === '全部'
    ? youthTournaments
    : youthTournaments.filter((t) => t.groupTag === youthGroupFilter.value),
)

function registerYouthMatch(t: YouthTournament) {
  if (t.registered) {
    showToast(`您已报名「${t.name}」，可在个人中心查看参赛凭证`)
    return
  }
  const mode = youthMatchMode[t.id] ?? '单打'
  t.registered = true
  t.quotaRemain = Math.max(0, t.quotaRemain - 1)
  createQuickOrder(
    '门票',
    `青少年赛：${t.name}（${t.groupTag} ${mode}）`,
    `${t.dateRange} · ${t.venue} · 完赛积+${t.pointsReward}分`,
    t.fee,
    t.pointsReward,
  )
}

// ===== 6. 运动康复机构 =====
const rehabDate = ref(BOOKING_DATES[0]!.shortDate)
const rehabSlot = ref('16:00-17:00')
const rehabSlots = ['09:00-10:00', '11:00-12:00', '14:00-15:00', '16:00-17:00', '19:00-20:00', '20:30-21:30']
const pickedRehabService = reactive<Record<string, number>>({})

function bookRehab(center: (typeof REHAB_CENTERS)[number]) {
  const idx = pickedRehabService[center.id] ?? 0
  const svc = center.services[idx] ?? center.services[0]!
  createQuickOrder(
    '课程',
    `运动康复：${center.name.split('（')[0]} · ${svc.name}`,
    `${rehabDate.value} ${rehabSlot.value} · 时长${svc.duration} · 赛期绿通优先接诊`,
    svc.price,
    50,
  )
}
</script>

<template>
  <section>
    <div class="module-toolbar">
      <div class="mh-tabs">
        <button class="m-tab" :class="{ active: trainSection === 'booking' }" @click="trainSection = 'booking'">团体/私教约课</button>
        <button class="m-tab" :class="{ active: trainSection === 'camps' }" @click="trainSection = 'camps'">训练营/研学/团建</button>
        <button class="m-tab" :class="{ active: trainSection === 'clubs' }" @click="trainSection = 'clubs'">俱乐部与评价</button>
        <button class="m-tab" :class="{ active: trainSection === 'school' }" @click="trainSection = 'school'">省网校与青少年赛</button>
        <button class="m-tab" :class="{ active: trainSection === 'rehab' }" @click="trainSection = 'rehab'">运动康复机构</button>
      </div>
    </div>

    <!-- ===== 一、湖北省网球学校官方报名咨询通道 + 官方五维评测 ===== -->
    <div v-if="trainSection === 'school'" class="mb-24">
      <div class="grid-2 mb-16">
        <!-- 湖北省网球学校直通咨询通道 -->
        <div class="card" style="border: 2px solid #0d7278">
          <div class="photo-box" style="height: 154px">
            <img src="/images/coach_2.jpg" alt="湖北省网球学校" />
            <span class="badge-tl" style="background: #0d7278">🎓 全国体教融合金字招牌 · 湖北省网球学校</span>
            <span class="badge-bl">小学至高中一贯制 · 31片室内风雨/红土场</span>
          </div>
          <div class="card-pad">
            <div class="flex-between mb-10">
              <div>
                <strong style="font-size: 16.5px">湖北省网球学校 · 官方招生与探校咨询通道</strong>
                <div style="font-size: 11.5px; color: var(--ink-3)">支持特长生招生咨询、短期插班试训与寒暑假探校预约（官方直连招生办）</div>
              </div>
              <span class="rating-pill">★ 5.0</span>
            </div>

            <div class="grid-2" style="gap: 8px; margin-bottom: 8px">
              <select v-model="schoolForm.track" class="f-input" style="padding: 6px 9px">
                <option>小学/初中网球特长生招生</option>
                <option>高中体教融合单招冲刺班</option>
                <option>寒暑假 7 天体验营插班咨询</option>
                <option>家长实地探校与试训预约</option>
              </select>
              <select v-model="schoolForm.visitDate" class="f-input" style="padding: 6px 9px">
                <option v-for="d in BOOKING_DATES" :key="`sc-${d.iso}`" :value="d.shortDate">意向探校：{{ d.shortDate }} {{ d.weekday }}</option>
              </select>
            </div>
            <div class="grid-3" style="gap: 8px; margin-bottom: 10px">
              <input v-model="schoolForm.studentName" class="f-input" style="padding: 6px 9px" placeholder="学员姓名 *" />
              <select v-model="schoolForm.level" class="f-input" style="padding: 6px 9px">
                <option>零基础启蒙</option>
                <option>已有1年基础</option>
                <option>有省级参赛经历</option>
              </select>
              <input v-model="schoolForm.phone" class="f-input" style="padding: 6px 9px" placeholder="家长联系电话 *" />
            </div>

            <div class="flex-between">
              <span style="font-size: 11px; color: #0d7278; font-weight: 700">
                {{ schoolInquiryHistory.length > 0 ? `✅ 最近回执：${schoolInquiryHistory[0]?.id}（${schoolInquiryHistory[0]?.studentName}）` : '📞 招生热线：0724-7228866 · 2小时内回电' }}
              </span>
              <button class="btn-primary" style="background: #0d7278" @click="submitSchoolInquiry">
                提交招生/探校咨询单 →
              </button>
            </div>
          </div>
        </div>

        <!-- 五维能力评测与晋升 -->
        <div class="card" style="background: linear-gradient(135deg, #f1faf6, #ffffff); border: 2px solid var(--primary)">
          <div class="card-pad" style="display: grid; grid-template-columns: 1fr 240px; gap: 10px; align-items: center; height: 100%">
            <div>
              <span class="tag green" style="margin-bottom: 7px">🏅 官方指定评测机构 · 等级晋升闭环</span>
              <div style="font-size: 16.5px; font-weight: 900; margin-bottom: 6px">网球能力五维评测 & 训练后晋升测试</div>
              <div style="font-size: 12px; color: var(--ink-2); line-height: 1.65; margin-bottom: 10px">
                • <strong>如何晋升：</strong>完成课程或训练营后预约指定机构复测，实时刷新五维能力雷达图并升级认证等级。<br />
                • <strong>全域联动：</strong>等级自动同步至「青少年/周末分级赛」与「同城约球 CUTR 匹配」。
              </div>
              <select v-model="selectedOrg" class="f-input" style="margin-bottom: 10px">
                <option>湖北省网球学校评测中心</option>
                <option>京山国际网球中心官方认证点</option>
              </select>
              <div class="flex-row">
                <button class="btn-orange" @click="runUpgradeTest(selectedOrg, true)">完成晋升复测录入（200分抵扣）</button>
              </div>
            </div>
            <div>
              <AbilityRadarChart :ability="state.ability" :level="state.abilityLevel" />
            </div>
          </div>
        </div>
      </div>

      <!-- 青少年网球比赛专区 -->
      <div class="card card-pad">
        <div class="flex-between mb-12" style="padding-bottom: 10px; border-bottom: 1px solid var(--line)">
          <div>
            <strong style="font-size: 16.5px">🏆 青少年网球比赛 · 官方赛事日历与在线报名</strong>
            <div style="font-size: 11.5px; color: var(--ink-3)">对接 CTJ 全国积分与「网球记」实时计分直播，按年龄组别精准报名</div>
          </div>
          <div class="flex-row" style="gap: 6px">
            <button
              v-for="g in (['全部', 'U8/U10', 'U12/U14', 'U16/U18'] as const)"
              :key="g"
              class="filter-pill"
              :class="{ active: youthGroupFilter === g }"
              @click="youthGroupFilter = g"
            >
              {{ g === '全部' ? '全部年龄组' : `${g} 组` }}
            </button>
          </div>
        </div>

        <div class="grid-2">
          <div
            v-for="t in visibleYouthTournaments"
            :key="t.id"
            style="border: 1px solid var(--line); background: #fafdfc; padding: 13px 15px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px"
          >
            <div>
              <div class="flex-between" style="margin-bottom: 6px">
                <div class="flex-row" style="gap: 6px">
                  <span class="tag green">{{ t.groupTag }}</span>
                  <span class="tag blue">{{ t.levelBadge }}</span>
                  <span class="tag" :class="t.status === '火热进行中' ? 'red' : 'orange'">{{ t.status }}</span>
                </div>
                <span style="font-size: 11.5px; color: var(--primary); font-weight: 800">余 {{ t.quotaRemain }} 席</span>
              </div>
              <strong style="font-size: 15px; display: block; margin-bottom: 4px">{{ t.name }}</strong>
              <div style="font-size: 11.5px; color: var(--ink-2); margin-bottom: 5px">
                📅 {{ t.dateRange }} ｜ 📍 {{ t.venue }}（{{ t.surface }}）
              </div>
              <div style="font-size: 11.5px; color: var(--ink-3)">{{ t.desc }}</div>
            </div>

            <div class="flex-between" style="padding-top: 9px; border-top: 1px dashed var(--line)">
              <div class="flex-row" style="gap: 8px">
                <strong style="font-size: 17px; color: var(--accent)">{{ t.fee === 0 ? '免费观摩/预登记' : `¥${t.fee}` }}</strong>
                <div class="seg-group">
                  <button
                    :class="{ active: (youthMatchMode[t.id] ?? '单打') === '单打' }"
                    style="padding: 3px 9px; font-size: 11px"
                    @click="youthMatchMode[t.id] = '单打'"
                  >
                    单打
                  </button>
                  <button
                    :class="{ active: youthMatchMode[t.id] === '双打' }"
                    style="padding: 3px 9px; font-size: 11px"
                    @click="youthMatchMode[t.id] = '双打'"
                  >
                    双打
                  </button>
                </div>
              </div>
              <button
                :class="t.registered ? 'btn-ghost' : 'btn-orange'"
                style="padding: 6px 13px; font-size: 12px"
                @click="registerYouthMatch(t)"
              >
                {{ t.registered ? '✅ 已报名参赛' : `报名 ${t.groupTag}（+${t.pointsReward}分）` }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 二、网球训练营 · 研学课程 · 团建活动 查询报名 ===== -->
    <div v-if="trainSection === 'camps'" class="mb-24">
      <div class="card card-pad mb-16 filter-workbench">
        <div class="flex-between mb-12">
          <div>
            <strong style="font-size: 16.5px">🏕️ 网球训练营 · 研学课程 · 团建活动查询报名</strong>
            <div style="font-size: 11.5px; color: var(--ink-3)">支持按项目类型、关键词检索，并选择营期/团建日期与人数在线报名或定制</div>
          </div>
          <div class="flex-row" style="gap: 8px">
            <div class="search-bar" style="width: 230px; height: 34px">
              <span>🔍</span>
              <input v-model="campKeyword" type="text" placeholder="搜冬夏令营、研学、团建…" />
            </div>
            <select v-model="campDate" class="f-input" style="width: 132px; padding: 5px 8px; font-size: 12px">
              <option v-for="d in BOOKING_DATES" :key="`cp-${d.iso}`" :value="d.shortDate">批次：{{ d.shortDate }}</option>
            </select>
            <select v-model.number="campPeople" class="f-input" style="width: 96px; padding: 5px 8px; font-size: 12px">
              <option :value="1">1人报名</option>
              <option :value="2">2人同行</option>
              <option :value="5">5人小团</option>
              <option :value="20">20人团建</option>
            </select>
          </div>
        </div>
        <div class="filter-row">
          <span class="filter-label">分类筛选：</span>
          <button
            v-for="cat in (['全部', '训练营', '研学课程', '团建活动'] as const)"
            :key="cat"
            class="filter-pill"
            :class="{ active: campFilter === cat }"
            @click="campFilter = cat"
          >
            {{ cat === '全部' ? `全部项目 (${CAMP_PROGRAMS.length})` : cat }}
          </button>
          <span style="margin-left: auto; font-size: 12px; font-weight: 800; color: var(--primary)">
            当前命中 {{ visibleCamps.length }} 个可报名项目
          </span>
        </div>
      </div>

      <div class="grid-2">
        <div
          v-for="item in pagedCamps"
          :key="item.id"
          class="card"
          style="display: flex; flex-direction: column; justify-content: space-between"
        >
          <div>
            <div
              class="photo-box"
              style="height: 146px"
              @click="
                openPhoto({
                  title: item.title,
                  category: item.category,
                  photo: item.photo,
                  rating: item.rating,
                  subtitle: `${item.badge} ｜ ${item.duration}`,
                  intro: item.desc,
                  openHours: item.scheduleDate,
                  priceInfo: `¥${item.price}${item.priceUnit}`,
                  address: item.venue,
                  tags: item.highlights,
                  reviews: [{ user: '往期参营家长', origin: '武汉', score: 5.0, date: '2026-11-20', content: '组织非常专业，教练耐心负责，孩子进步很大！' }],
                })
              "
            >
              <img :src="item.photo" :alt="item.title" />
              <span class="badge-tl" style="font-size: 10px">{{ item.badge }}</span>
              <span class="badge-bl" style="font-size: 10px">★ {{ item.rating }} · {{ item.duration }} · 余{{ item.remaining }}位</span>
            </div>
            <div class="card-pad" style="padding: 12px 14px 8px">
              <strong style="font-size: 14.5px; display: block; margin-bottom: 4px">{{ item.title }}</strong>
              <div style="font-size: 11px; color: var(--primary); font-weight: 700; margin-bottom: 5px">
                👥 {{ item.targetAudience }} ｜ 📍 {{ item.venue }}
              </div>
              <div style="font-size: 11.5px; color: var(--ink-2); margin-bottom: 8px">{{ item.desc }}</div>
              <div class="flex-row" style="gap: 4px">
                <span v-for="hl in item.highlights" :key="hl" class="tag" style="font-size: 10px">✔ {{ hl }}</span>
              </div>
            </div>
          </div>

          <div class="card-pad flex-between" style="padding: 10px 14px 13px; border-top: 1px dashed var(--line)">
            <span class="price" style="font-size: 18px">¥{{ item.price }}<small>{{ item.priceUnit }}</small></span>
            <div class="flex-row" style="gap: 6px">
              <button
                v-if="item.category === '团建活动'"
                class="btn-ghost"
                style="padding: 5px 9px; font-size: 11.5px"
                @click="openActionModal({ type: 'inquiry', title: `${item.title} · 方案定制`, subtitle: `${item.targetAudience} · 支持定制专属赛制与团餐`, submitLabel: '提交团建定制需求' })"
              >
                定制方案
              </button>
              <button class="btn-primary" style="padding: 6px 11px; font-size: 12px" @click="enrollCamp(item)">
                立即报名 ({{ campPeople }}人)
              </button>
            </div>
          </div>
        </div>
      </div>
      <PaginationBar
        :total="visibleCamps.length"
        :page="campPage"
        :page-size="PAGE_SIZE"
        unit="个项目"
        @update:page="campPage = $event"
      />
    </div>

    <!-- ===== 三、认证网球俱乐部：介绍 · 课程销售 · 学员真实评价 ===== -->
    <div v-if="trainSection === 'clubs'" class="mb-24">
      <div class="flex-between mb-12">
        <div>
          <strong style="font-size: 16.5px">🏟️ 认证网球俱乐部 · 俱乐部介绍、课程直售与真实评价</strong>
          <div style="font-size: 11.5px; color: var(--ink-3)">京山官方认证合作俱乐部，支持直接购买单次体验课/私教包/季度班，并可现场发表评价赚积分</div>
        </div>
        <span class="tag green">共 {{ clubs.length }} 家官方认证俱乐部</span>
      </div>

      <div class="grid-3">
        <div v-for="club in clubs" :key="club.id" class="card" style="display: flex; flex-direction: column; justify-content: space-between">
          <div>
            <div class="photo-box" style="height: 144px">
              <img :src="club.photo" :alt="club.name" />
              <span class="badge-tl" style="font-size: 10px">{{ club.badge }}</span>
              <span class="badge-bl" style="font-size: 10px">★ {{ club.rating }} ({{ club.reviewCount }}评) · {{ club.coachCount }}位认证教练</span>
            </div>
            <div class="card-pad" style="padding: 13px 14px">
              <div class="flex-between" style="margin-bottom: 4px">
                <strong style="font-size: 15px">{{ club.name }}</strong>
              </div>
              <div style="font-size: 11px; color: var(--primary); font-weight: 700; margin-bottom: 5px">
                🎾 {{ club.courtsInfo }} ｜ 📞 {{ club.phone }}
              </div>
              <div style="font-size: 11.5px; color: var(--ink-2); margin-bottom: 8px">{{ club.intro }}</div>
              <div class="flex-row" style="gap: 4px; margin-bottom: 10px">
                <span v-for="t in club.tags" :key="t" class="tag" style="font-size: 10px">{{ t }}</span>
              </div>

              <!-- 俱乐部在售课程列表 -->
              <div style="background: #f5faf8; border: 1px solid #d9ebe2; padding: 9px 10px; margin-bottom: 10px">
                <div style="font-size: 11.5px; font-weight: 800; color: var(--ink); margin-bottom: 6px">🛒 在售精品课程（点击直购）</div>
                <div
                  v-for="course in club.courses"
                  :key="course.id"
                  class="flex-between"
                  style="padding: 6px 0; border-bottom: 1px dashed #dfece6; gap: 6px"
                >
                  <div style="min-width: 0">
                    <div style="font-size: 12px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
                      {{ course.name }}
                    </div>
                    <div style="font-size: 10.5px; color: var(--ink-3)">{{ course.lessons }} · <span style="color: var(--primary)">{{ course.tag }}</span></div>
                  </div>
                  <div class="flex-row" style="gap: 6px; flex-shrink: 0">
                    <strong style="font-size: 13.5px; color: var(--accent)">¥{{ course.memberPrice }}</strong>
                    <button
                      class="btn-primary"
                      style="padding: 3px 8px; font-size: 11px"
                      @click="createQuickOrder('课程', `${club.name.split('（')[0]} · ${course.name}`, `${course.lessons} · 会员专享价`, course.memberPrice, 100)"
                    >
                      购课
                    </button>
                  </div>
                </div>
              </div>

              <!-- 真实评价 + 在线发评 -->
              <div style="background: #fffcf5; border: 1px solid #f0e1bf; padding: 9px 10px">
                <div class="flex-between" style="margin-bottom: 6px">
                  <strong style="font-size: 11.5px; color: #7a4e16">💬 学员真实评价（{{ club.reviews.length }}条精选）</strong>
                  <button
                    class="btn-ghost"
                    style="padding: 2px 7px; font-size: 10.5px"
                    @click="openNavigation({ placeName: club.name, address: club.address, lng: club.lng, lat: club.lat, distance: '城区直达', driveMin: '约 6 分钟', tip: `电话 ${club.phone}` })"
                  >
                    🧭 导航
                  </button>
                </div>
                <div v-for="rev in club.reviews.slice(0, 2)" :key="rev.id" style="font-size: 11px; color: var(--ink-2); margin-bottom: 5px; line-height: 1.45">
                  <strong>{{ rev.user }}</strong>（★{{ rev.score.toFixed(1) }} · {{ rev.date }}）：{{ rev.content }}
                </div>
                <div style="display: flex; gap: 5px; margin-top: 7px">
                  <input
                    v-model="getReviewDraft(club.id).content"
                    class="f-input"
                    style="padding: 4px 8px; font-size: 11px"
                    placeholder="写一句上课评价（+15积分）…"
                    @keyup.enter="submitClubReview(club)"
                  />
                  <button class="btn-orange" style="padding: 4px 9px; font-size: 11px; flex-shrink: 0" @click="submitClubReview(club)">
                    发评
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 四、日常团体课 / 私教课 7日日历约课 ===== -->
    <div v-if="trainSection === 'booking'" class="mb-24">
      <div class="card card-pad mb-16 filter-workbench">
        <div class="flex-between mb-12">
          <div class="flex-row">
            <strong style="font-size: 16px">📅 日常约课排期：{{ currentDateObj.fullTitle }}</strong>
            <span class="tag green">{{ lessonMode === 'group' ? '团体课课表' : '私教1对1时段' }}</span>
          </div>
          <div class="flex-row">
            <div class="seg-group">
              <button :class="{ active: lessonMode === 'group' }" @click="lessonMode = 'group'">团体课</button>
              <button :class="{ active: lessonMode === 'private' }" @click="lessonMode = 'private'">私教课</button>
            </div>
            <label v-if="lessonMode === 'group'" class="m-tab" :class="{ active: showAllDatesForGroup }" style="cursor: pointer">
              <input v-model="showAllDatesForGroup" type="checkbox" style="display: none" />
              {{ showAllDatesForGroup ? '✔ 显示近7日全部' : '查看近7日全部' }}
            </label>
          </div>
        </div>

        <div class="date-strip-7 mb-12">
          <button
            v-for="d in BOOKING_DATES"
            :key="d.iso"
            class="date-chip"
            :class="{ active: selectedDate === d.iso && !(lessonMode === 'group' && showAllDatesForGroup) }"
            @click="
              selectedDate = d.iso;
              showAllDatesForGroup = false
            "
          >
            <strong>{{ d.weekday }}</strong>
            <span>{{ d.shortDate }}</span>
          </button>
        </div>

        <div v-if="lessonMode === 'group'" class="filter-rows">
          <div class="filter-row">
            <span class="filter-label">课程分类：</span>
            <button
              v-for="cat in (['全部', '零基础入门', '多球强化', '双打战术', '发球专项'] as const)"
              :key="cat"
              class="filter-pill"
              :class="{ active: groupCat === cat }"
              @click="groupCat = cat"
            >
              {{ cat }}
            </button>
            <span class="filter-divider" />
            <span class="filter-label">时段：</span>
            <button
              v-for="p in (['全天', '上午', '下午', '晚间'] as const)"
              :key="p"
              class="filter-pill"
              :class="{ active: groupPeriod === p }"
              @click="groupPeriod = p"
            >
              {{ p }}
            </button>
            <span class="filter-divider" />
            <span class="filter-label">水平：</span>
            <button
              v-for="lv in (['全部', '零基础', 'CUTR 2.0-3.0', 'CUTR 3.0-4.0', '青少年'] as const)"
              :key="lv"
              class="filter-pill"
              :class="{ active: groupLevel === lv }"
              @click="groupLevel = lv"
            >
              {{ lv }}
            </button>
            <div class="search-bar" style="width: 200px; height: 32px; margin-left: auto">
              <span>🔍</span>
              <input v-model="groupKeyword" type="text" placeholder="搜课程/教练/场馆…" />
            </div>
          </div>
        </div>

        <div v-else class="filter-rows">
          <div class="filter-row">
            <span class="filter-label">教练等级：</span>
            <button
              v-for="t in (['全部', '省网校国家级', '金网5.0', 'CTA高级'] as const)"
              :key="t"
              class="filter-pill"
              :class="{ active: coachTier === t }"
              @click="coachTier = t"
            >
              {{ t }}
            </button>
            <span class="filter-divider" />
            <span class="filter-label">专长：</span>
            <button
              v-for="sp in (['全部', '零基础启蒙', '发球提速', '网前截击', '比赛实战', '青少年'] as const)"
              :key="sp"
              class="filter-pill"
              :class="{ active: coachSpecialty === sp }"
              @click="coachSpecialty = sp"
            >
              {{ sp }}
            </button>
            <select v-model="coachVenue" class="f-input" style="width: auto; padding: 4px 10px; margin-left: auto">
              <option v-for="v in coachVenues" :key="v" :value="v">{{ v === '全部' ? '全部授课场馆' : v }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 团体课结果 -->
      <div v-if="lessonMode === 'group'">
        <div v-if="filteredGroupClasses.length === 0" class="card card-pad" style="text-align: center; padding: 36px 20px">
          <strong style="font-size: 14px; display: block; margin-bottom: 8px">当前日期与筛选条件下暂无团体课</strong>
          <button
            class="btn-primary"
            @click="
              showAllDatesForGroup = true;
              groupCat = '全部';
              groupLevel = '全部';
              groupPeriod = '全天'
            "
          >
            查看近7日全部团体课
          </button>
        </div>
        <div v-else>
          <div class="grid-2">
            <div
              v-for="cls in pagedGroupClasses"
              :key="cls.id"
              class="card card-pad"
              style="display: flex; flex-direction: column; justify-content: space-between; gap: 8px"
            >
              <div>
                <div class="flex-between" style="margin-bottom: 5px">
                  <div class="flex-row" style="gap: 5px">
                    <span class="tag green">🕒 {{ BOOKING_DATES.find((d) => d.iso === cls.date)?.shortDate }} {{ cls.startTime }}-{{ cls.endTime }}</span>
                    <span class="tag blue">{{ cls.category }}</span>
                    <span class="tag gold">{{ cls.level }}</span>
                  </div>
                  <span class="tag orange">余 {{ cls.capacity - cls.enrolled }}/{{ cls.capacity }} 位</span>
                </div>
                <strong style="font-size: 15px; display: block; margin-bottom: 4px">{{ cls.title }}</strong>
                <div style="font-size: 12px; color: var(--ink-2)">👨‍🏫 {{ cls.coachName }} ｜ 📍 {{ cls.venueName }}</div>
              </div>
              <div class="flex-between" style="padding-top: 8px; border-top: 1px dashed var(--line)">
                <span class="price" style="font-size: 18px">¥{{ cls.memberPrice }}<small>会员价</small></span>
                <button
                  :class="cls.bookedByMe ? 'btn-ghost' : 'btn-orange'"
                  :disabled="cls.bookedByMe || cls.enrolled >= cls.capacity"
                  @click="bookGroupClass(cls.id)"
                >
                  {{ cls.bookedByMe ? '✅ 已预约' : '预约本节课程' }}
                </button>
              </div>
            </div>
          </div>
          <PaginationBar
            :total="filteredGroupClasses.length"
            :page="groupPage"
            :page-size="PAGE_SIZE"
            unit="节课程"
            @update:page="groupPage = $event"
          />
        </div>
      </div>

      <!-- 私教课结果 -->
      <div v-else class="grid-2">
        <div
          v-for="coach in filteredCoaches"
          :key="coach.id"
          class="card card-pad"
          style="display: flex; flex-direction: column; justify-content: space-between; gap: 10px"
        >
          <div>
            <div style="display: grid; grid-template-columns: 84px 1fr; gap: 12px; margin-bottom: 9px">
              <img :src="coach.photo" :alt="coach.name" style="width: 84px; height: 84px; object-fit: cover" />
              <div>
                <div class="flex-between">
                  <strong style="font-size: 15.5px">{{ coach.name }} · {{ coach.title }}</strong>
                  <span class="rating-pill">★ {{ coach.rating }}</span>
                </div>
                <div class="flex-row" style="gap: 5px; margin: 4px 0">
                  <span class="tag green">{{ coach.tier }}</span>
                  <span class="tag blue">{{ coach.specialty }}</span>
                </div>
                <div style="font-size: 11px; color: var(--ink-3)">📍 {{ coach.venueName }} · 累计 {{ coach.lessonsCount }} 节</div>
              </div>
            </div>
            <div style="background: #f6faf8; border: 1px solid #dfece6; padding: 9px">
              <div style="font-size: 11.5px; font-weight: 800; margin-bottom: 6px">🕒 选择 {{ currentDateObj.shortDate }} 1对1约课时段：</div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px">
                <button
                  v-for="h in coach.availableHours"
                  :key="h"
                  type="button"
                  class="matrix-cell"
                  style="height: 34px; font-size: 11px"
                  :class="{
                    busy: isCoachSlotBooked(coach.id, h),
                    picked: pickedCoachHours[coach.id] === h,
                    free: !isCoachSlotBooked(coach.id, h) && pickedCoachHours[coach.id] !== h,
                  }"
                  :disabled="isCoachSlotBooked(coach.id, h)"
                  @click="selectCoachSlot(coach.id, h)"
                >
                  {{ formatHourRange(h) }}{{ isCoachSlotBooked(coach.id, h) ? ' (已约)' : '' }}
                </button>
              </div>
            </div>
          </div>
          <div class="flex-between" style="padding-top: 9px; border-top: 1px dashed var(--line)">
            <span class="price" style="font-size: 18px">¥{{ coach.memberPrice }}<small>/小时</small></span>
            <button class="btn-primary" @click="submitCoachSlot(coach.id)">
              {{ pickedCoachHours[coach.id] ? `预约 ${formatHourRange(pickedCoachHours[coach.id]!)}` : '预约所选时段' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 五、运动康复机构专区（卫健认证 + 自选日期时段与理疗项目） ===== -->
    <div v-if="trainSection === 'rehab'">
      <div class="card card-pad mb-16 filter-workbench">
        <div class="flex-between mb-10">
          <div>
            <strong style="font-size: 16.5px">🩺 运动康复机构保障（市卫健局认证 · 赛期绿色通道）</strong>
            <div style="font-size: 11.5px; color: var(--ink-3)">覆盖三甲医院运动医学中心、中医院推拿理疗与场馆零距离运动康复工作室，支持按日期与时段预约</div>
          </div>
          <span class="tag red">赛期绿色优先接诊</span>
        </div>
        <div class="filter-row" style="background: #f5faf8; padding: 8px 12px; border: 1px solid #d9ebe2">
          <span class="filter-label">📅 预约康复日期：</span>
          <select v-model="rehabDate" class="f-input" style="width: 120px; padding: 4px 8px; font-size: 12px">
            <option v-for="d in BOOKING_DATES" :key="`rh-${d.iso}`" :value="d.shortDate">{{ d.shortDate }} {{ d.weekday }}</option>
          </select>
          <span class="filter-label">🕒 选择理疗时段：</span>
          <button
            v-for="sl in rehabSlots"
            :key="sl"
            class="filter-pill"
            :class="{ active: rehabSlot === sl }"
            @click="rehabSlot = sl"
          >
            {{ sl }}
          </button>
        </div>
      </div>

      <div class="grid-3">
        <div
          v-for="center in REHAB_CENTERS"
          :key="center.id"
          class="card"
          style="display: flex; flex-direction: column; justify-content: space-between"
        >
          <div>
            <div class="photo-box" style="height: 144px">
              <img :src="center.photo" :alt="center.name" />
              <span class="badge-tl" style="font-size: 10px">{{ center.badge }}</span>
              <span class="badge-bl" style="font-size: 10px">★ {{ center.rating }} ({{ center.reviewCount }}评) · {{ center.distance }}</span>
            </div>
            <div class="card-pad" style="padding: 13px 14px">
              <strong style="font-size: 15px; display: block; margin-bottom: 4px">{{ center.name }}</strong>
              <div style="font-size: 11px; color: var(--primary); font-weight: 700; margin-bottom: 4px">
                👨‍⚕️ {{ center.doctorInfo }}
              </div>
              <div style="font-size: 11px; color: var(--ink-3); margin-bottom: 8px">
                🕒 {{ center.openHours }} ｜ 📞 {{ center.phone }}
              </div>
              <div style="font-size: 11.5px; color: var(--ink-2); margin-bottom: 9px">{{ center.intro }}</div>

              <!-- 选择具体理疗项目 -->
              <div style="display: flex; flex-direction: column; gap: 5px; margin-bottom: 8px">
                <button
                  v-for="(svc, sIdx) in center.services"
                  :key="svc.name"
                  type="button"
                  class="flex-between"
                  style="padding: 6px 9px; border: 1px solid; text-align: left; font-size: 11.5px"
                  :style="
                    (pickedRehabService[center.id] ?? 0) === sIdx
                      ? 'border-color: var(--primary); background: #eaf7f1; color: var(--primary-dark); font-weight: 800'
                      : 'border-color: #dfece6; background: #fafdfc; color: var(--ink-2)'
                  "
                  @click="pickedRehabService[center.id] = sIdx"
                >
                  <span>{{ svc.name }}（{{ svc.duration }}）</span>
                  <strong style="color: var(--accent)">¥{{ svc.price }}</strong>
                </button>
              </div>

              <div class="review-quote" style="margin-top: 0">💬 “{{ center.quote }}”</div>
            </div>
          </div>

          <div class="card-pad flex-between" style="padding: 10px 14px 13px; border-top: 1px dashed var(--line)">
            <button
              class="btn-ghost"
              style="padding: 5px 9px; font-size: 11.5px"
              @click="openNavigation({ placeName: center.name, address: center.address, lng: center.lng, lat: center.lat, distance: center.distance, driveMin: '约 5 分钟', tip: `电话 ${center.phone}` })"
            >
              🧭 导航前往
            </button>
            <button class="btn-orange" style="padding: 6px 12px; font-size: 12px" @click="bookRehab(center)">
              预约 {{ rehabDate }} {{ rehabSlot }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
