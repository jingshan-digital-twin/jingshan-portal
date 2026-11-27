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
import { isBookingQuantity, requestReservation } from '../../store/reservationFlow'

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
const trainSection = ref<'全部' | 'booking' | 'camps' | 'clubs' | 'school' | 'rehab'>('booking')

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

async function submitCoachSlot(coachId: string) {
  const chosen = pickedCoachHours[coachId]
  if (!chosen) {
    showToast('请先点击选择该教练的一个具体空闲时间段')
    return
  }
  if (await bookPrivateCoachSlot(coachId, selectedDate.value, chosen)) delete pickedCoachHours[coachId]
}

// ===== 2. 训练营 / 研学课程 / 团建活动 =====
const campFilter = ref<'全部' | '训练营' | '研学课程' | '团建活动'>('全部')
const campKeyword = ref('')
const campDate = ref(BOOKING_DATES[1]!.shortDate)
const campPeople = ref<number | ''>(1)

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
  const people = campPeople.value
  if (!isBookingQuantity(people, item.remaining)) return
  createQuickOrder(
    '课程',
    `${item.category}：${item.title}`,
    `${campDate.value}批次 · ${people}人报名 · ${item.duration}`,
    item.price * people,
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
  age: '' as number | '',
  level: '',
  visitDate: BOOKING_DATES[1]!.iso,
  phone: '',
})
const schoolInquiryHistory = ref<{ id: string; track: string; studentName: string; visitDate: string }[]>([])

function submitSchoolInquiry() {
  if (!schoolForm.studentName.trim() || !schoolForm.phone.trim()) {
    showToast('请填写学员姓名和家长联系电话，方便省网校招生老师联系您')
    return
  }
  if (schoolForm.age !== '' && !isBookingQuantity(schoolForm.age)) {
    showToast('请输入有效的学员年龄')
    return
  }
  if (!schoolForm.visitDate || schoolForm.visitDate < BOOKING_DATES[0]!.iso) {
    showToast('请选择有效的意向到访日期')
    return
  }
  const application = { ...schoolForm, studentName: schoolForm.studentName.trim(), phone: schoolForm.phone.trim() }
  return requestReservation({
    title: '湖北省网球学校招生咨询',
    fields: [
      { label: '咨询项目', value: application.track },
      { label: '学员姓名', value: application.studentName },
      ...(application.age ? [{ label: '年龄', value: `${application.age} 岁` }] : []),
      ...(application.level ? [{ label: '网球基础', value: application.level }] : []),
      { label: '到访日期', value: application.visitDate },
      { label: '联系电话', value: application.phone },
    ],
    successTitle: '咨询申请已提交',
    successMessage: '请留意联系电话，等候招生办确认探校与试训安排。',
  }, () => {
    const code = `HBTW-${Date.now().toString().slice(-4)}`
    schoolInquiryHistory.value.unshift({
      id: code,
      track: application.track,
      studentName: application.studentName,
      visitDate: application.visitDate,
    })
    schoolForm.studentName = ''
    schoolForm.phone = ''
    schoolForm.age = ''
    schoolForm.level = ''
  })
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

async function registerYouthMatch(t: YouthTournament) {
  if (t.registered) {
    showToast(`您已报名「${t.name}」，可在个人中心查看参赛凭证`)
    return
  }
  const mode = youthMatchMode[t.id] ?? '单打'
  const booked = await createQuickOrder(
    '门票',
    `青少年赛：${t.name}（${t.groupTag} ${mode}）`,
    `${t.dateRange} · ${t.venue} · 完赛积+${t.pointsReward}分`,
    t.fee,
    t.pointsReward,
    0,
    { successTitle: '报名成功' },
  )
  if (booked) {
    t.registered = true
    t.quotaRemain = Math.max(0, t.quotaRemain - 1)
  }
}

// ===== 6. 运动康复机构 =====
const rehabDate = ref(BOOKING_DATES[0]!.shortDate)
const rehabSlot = ref('16:00-17:00')
const rehabSlots = ['09:00-10:00', '11:00-12:00', '14:00-15:00', '16:00-17:00', '19:00-20:00', '20:30-21:30']
const pickedRehabService = reactive<Record<string, number>>({})

function openCampDetail(item: (typeof CAMP_PROGRAMS)[number]) {
  openPhoto({
    title: item.title,
    category: item.category,
    photo: item.photo,
    rating: item.rating,
    subtitle: `${item.badge} ｜ ${item.duration}`,
    intro: item.desc,
    openHours: item.scheduleDate,
    priceInfo: `¥${item.price}${item.priceUnit}`,
    priceNum: item.price,
    priceUnit: ` ${item.priceUnit}`,
    orderCategory: '课程',
    address: item.venue,
    tags: item.highlights,
    reviews: [{ user: '往期参营家长', origin: '武汉', score: 5.0, date: '2026-11-20', content: '组织非常专业，教练耐心负责，孩子进步很大！' }],
  })
}

function openClubDetail(club: TennisClub) {
  openPhoto({
    title: club.name,
    category: '官方认证网球俱乐部',
    photo: club.photo,
    rating: club.rating,
    reviewCount: club.reviewCount,
    subtitle: `${club.badge} ｜ ${club.courtsInfo} · ${club.coachCount}位教练`,
    intro: `${club.name}拥有 ${club.courtsInfo}，配备 ${club.coachCount} 位官方认证专业教练，提供青少年启蒙、成人拉球与赛前技战术特训课程。咨询电话：${club.phone}。`,
    openHours: '08:00 – 22:00',
    priceInfo: `课程 ¥${club.courses[0]?.memberPrice ?? 298} 起`,
    priceNum: club.courses[0]?.memberPrice ?? 298,
    priceUnit: ' / 期起',
    orderCategory: '课程',
    phone: club.phone,
    address: club.address,
    lng: club.lng,
    lat: club.lat,
    tags: [club.badge, club.courtsInfo, `${club.coachCount}位认证教练`],
    hotItemsTitle: '🎓 俱乐部在售精品课程',
    hotItems: club.courses.map((c) => ({
      name: c.name,
      price: `会员价 ¥${c.memberPrice}`,
      tag: c.lessons,
      desc: `门市价 ¥${c.price}，含场地与基础装备体验`,
    })),
    reviews: club.reviews.map((r) => ({
      user: r.user,
      score: r.score,
      date: r.date,
      content: r.content,
    })),
  })
}

function openRehabDetail(center: (typeof REHAB_CENTERS)[number]) {
  openPhoto({
    title: center.name,
    category: '运动康复保障机构',
    photo: center.photo,
    rating: center.rating,
    subtitle: `${center.badge} ｜ ${center.doctorInfo}`,
    intro: `${center.name}由京山市卫健局认证授牌，配备专业运动康复师团队（${center.doctorInfo}），提供赛后筋膜松解、冷敷理疗与运动损伤绿色通道。电话：${center.phone}。`,
    openHours: center.openHours,
    priceInfo: `¥${center.services[0]?.price ?? 98} 起`,
    priceNum: center.services[0]?.price ?? 98,
    priceUnit: ' / 次起',
    orderCategory: '课程',
    distance: center.distance,
    phone: center.phone,
    address: center.address,
    lng: center.lng,
    lat: center.lat,
    tags: [center.badge, '市卫健局认证', '赛期绿色通道'],
    hotItemsTitle: '🩺 运动康复理疗服务项目',
    hotItems: center.services.map((s) => ({
      name: s.name,
      price: `¥${s.price}`,
      tag: s.duration,
      desc: '专业康复师一对一评估与赛后放松理疗',
    })),
    reviews: [],
  })
}

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
        <button class="m-tab" :class="{ active: trainSection === '全部' }" @click="trainSection = '全部'">全部</button>
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
          <div class="photo-box" style="height: 164px">
            <img src="/images/coach_2.jpg" alt="湖北省网球学校" />
            <span class="badge-tl" style="background: #0d7278">🎓 湖北省网球学校 · 官方招生通道</span>
          </div>
          <div class="card-pad">
            <div class="flex-between mb-12">
              <strong style="font-size: 18px">湖北省网球学校 · 招生与探校咨询</strong>
              <span class="rating-pill">★ 5.0</span>
            </div>

            <div class="grid-2" style="gap: 10px; margin-bottom: 10px">
              <label class="dd-field">
                <span class="dd-field-label">咨询项目</span>
                <select v-model="schoolForm.track" class="f-input">
                  <option>小学/初中网球特长生招生</option>
                  <option>高中体教融合单招冲刺班</option>
                  <option>寒暑假 7 天体验营插班咨询</option>
                  <option>家长实地探校与试训预约</option>
                </select>
              </label>
              <label class="dd-field">
                <span class="dd-field-label">意向探校日期</span>
                <input v-model="schoolForm.visitDate" type="date" :min="BOOKING_DATES[0]!.iso" class="f-input" />
              </label>
            </div>
            <div class="grid-2" style="gap: 10px; margin-bottom: 14px">
              <input v-model="schoolForm.studentName" class="f-input" placeholder="学员姓名 *" aria-label="学员姓名" />
              <input v-model.number="schoolForm.age" type="number" min="1" step="1" class="f-input" placeholder="年龄（选填）" aria-label="学员年龄" />
              <input v-model.trim="schoolForm.level" class="f-input" placeholder="网球基础（选填）" aria-label="网球基础" />
              <input v-model="schoolForm.phone" type="tel" class="f-input" placeholder="家长电话 *" aria-label="家长电话" />
            </div>

            <div class="flex-between">
              <span style="font-size: 13px; color: #0d7278; font-weight: 700">
                {{ schoolInquiryHistory.length > 0 ? `✅ 最近回执：${schoolInquiryHistory[0]?.id}` : '📞 招生热线：0724-7228866' }}
              </span>
              <button class="btn-primary" style="background: #0d7278" @click="submitSchoolInquiry">
                提交咨询单 →
              </button>
            </div>
          </div>
        </div>

        <!-- 五维能力评测与晋升 -->
        <div class="card" style="background: linear-gradient(135deg, #f1faf6, #ffffff); border: 2px solid var(--primary)">
          <div class="card-pad" style="display: grid; grid-template-columns: 1fr 240px; gap: 14px; align-items: center; height: 100%">
            <div>
              <span class="tag green" style="margin-bottom: 8px">🏅 官方五维评测认证</span>
              <div style="font-size: 18px; font-weight: 900; margin-bottom: 8px">网球能力评测 & 晋升测试</div>
              <div style="font-size: 13.5px; color: var(--ink-2); line-height: 1.75; margin-bottom: 12px">
                完成培训后可预约复测，实时刷新五维能力图并自动同步分级赛与约球等级。
              </div>
              <select v-model="selectedOrg" class="f-input" style="margin-bottom: 12px">
                <option>湖北省网球学校评测中心</option>
                <option>京山国际网球中心官方认证点</option>
              </select>
              <div class="flex-row">
                <button class="btn-orange" @click="runUpgradeTest(selectedOrg, true)">完成晋升复测录入（200分抵扣）</button>
                <button class="btn-ghost" @click="switchModule(13)">能力档案</button>
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
        <div class="flex-between mb-12" style="padding-bottom: 12px; border-bottom: 1px solid var(--line)">
          <strong style="font-size: 18px">🏆 青少年网球比赛 · 赛事日历与报名</strong>
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
            style="border: 1px solid var(--line); background: #fafdfc; padding: 16px 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px"
          >
            <div>
              <div class="flex-between" style="margin-bottom: 8px">
                <div class="flex-row" style="gap: 6px">
                  <span class="tag green">{{ t.groupTag }}</span>
                  <span class="tag" :class="t.status === '火热进行中' ? 'red' : 'orange'">{{ t.status }}</span>
                </div>
                <span style="font-size: 13.5px; color: var(--primary); font-weight: 800">余 {{ t.quotaRemain }} 席</span>
              </div>
              <strong style="font-size: 17px; display: block; margin-bottom: 6px">{{ t.name }}</strong>
              <div style="font-size: 13.5px; color: var(--ink-2); margin-bottom: 6px">
                📅 {{ t.dateRange }} ｜ 📍 {{ t.venue }}
              </div>
              <div style="font-size: 13.5px; color: var(--ink-3)">{{ t.desc }}</div>
            </div>

            <div class="flex-between" style="padding-top: 11px; border-top: 1px dashed var(--line)">
              <div class="flex-row" style="gap: 10px">
                <strong style="font-size: 19px; color: var(--accent)">{{ t.fee === 0 ? '免费' : `¥${t.fee}` }}</strong>
                <div class="seg-group">
                  <button
                    :class="{ active: (youthMatchMode[t.id] ?? '单打') === '单打' }"
                    @click="youthMatchMode[t.id] = '单打'"
                  >
                    单打
                  </button>
                  <button
                    :class="{ active: youthMatchMode[t.id] === '双打' }"
                    @click="youthMatchMode[t.id] = '双打'"
                  >
                    双打
                  </button>
                </div>
              </div>
              <button
                :class="t.registered ? 'btn-ghost' : 'btn-orange'"
                @click="registerYouthMatch(t)"
              >
                {{ t.registered ? '✅ 已报名' : `报名 ${t.groupTag}` }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 二、网球训练营 · 研学课程 · 团建活动 ===== -->
    <div v-if="trainSection === '全部' || trainSection === 'camps'" class="mb-24">
      <div class="card card-pad mb-16 filter-workbench">
        <div class="dd-filter-top">
          <strong style="font-size: 18px">🏕️ 训练营 · 研学课程 · 团建活动</strong>
          <span class="dd-count-pill">共 {{ visibleCamps.length }} 个项目</span>
        </div>
        <div class="dd-filter-grid cols-4">
          <div class="dd-field">
            <span class="dd-field-label">项目搜索</span>
            <div class="search-bar" style="width: 100%; height: 42px; border-radius: 6px">
              <span>🔍</span>
              <input v-model="campKeyword" type="text" placeholder="搜冬夏令营、研学、团建…" />
            </div>
          </div>

          <label class="dd-field">
            <span class="dd-field-label">项目分类</span>
            <select v-model="campFilter" class="dd-select" :class="{ active: campFilter !== '全部' }">
              <option value="全部">全部分类（{{ CAMP_PROGRAMS.length }}）</option>
              <option value="训练营">训练营</option>
              <option value="研学课程">研学课程</option>
              <option value="团建活动">团建活动</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">开营批次</span>
            <select v-model="campDate" class="dd-select active">
              <option v-for="d in BOOKING_DATES" :key="`cp-${d.iso}`" :value="d.shortDate">
                {{ d.shortDate }}（{{ d.weekday }}）
              </option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">报名人数</span>
            <input v-model.number="campPeople" type="number" min="1" step="1" class="f-input booking-count-input" />
          </label>
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
              style="height: 168px"
              @click="openCampDetail(item)"
            >
              <img :src="item.photo" :alt="item.title" />
              <span class="badge-tl">{{ item.badge }} · {{ item.duration }}</span>
            </div>
            <div class="card-pad">
              <div class="flex-between" style="margin-bottom: 6px">
                <strong style="font-size: 17px; cursor: pointer" @click="openCampDetail(item)">{{ item.title }}</strong>
                <span class="rating-pill">★ {{ item.rating }}</span>
              </div>
              <div style="font-size: 13.5px; color: var(--primary); font-weight: 700; margin-bottom: 6px">
                👥 {{ item.targetAudience }} ｜ 📍 {{ item.venue }}
              </div>
              <div style="font-size: 13.5px; color: var(--ink-2)">{{ item.desc }}</div>
            </div>
          </div>

          <div class="card-pad flex-between" style="padding: 13px 20px; border-top: 1px dashed var(--line)">
            <span class="price" style="font-size: 20px">¥{{ item.price }}<small>{{ item.priceUnit }}</small></span>
            <div class="flex-row" style="gap: 8px">
              <button
                v-if="item.category === '团建活动'"
                class="btn-ghost"
                @click="openActionModal({ type: 'inquiry', title: `${item.title} · 方案定制`, subtitle: `${item.targetAudience} · 支持定制专属赛制与团餐`, submitLabel: '提交团建定制需求' })"
              >
                定制方案
              </button>
              <button class="btn-primary booking-count-submit" :disabled="!isBookingQuantity(campPeople, item.remaining)" @click="enrollCamp(item)">
                {{ !isBookingQuantity(campPeople) ? '请输入有效的报名人数' : campPeople > item.remaining ? `余 ${item.remaining} 名，请修改人数` : `立即报名（${campPeople} 人）` }}
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

    <!-- ===== 三、认证网球俱乐部 ===== -->
    <div v-if="trainSection === '全部' || trainSection === 'clubs'" class="mb-24">
      <div class="flex-between mb-12">
        <strong style="font-size: 18px">🏟️ 官方认证网球俱乐部</strong>
        <span class="tag green">共 {{ clubs.length }} 家认证俱乐部</span>
      </div>

      <div class="grid-3">
        <div v-for="club in clubs" :key="club.id" class="card" style="display: flex; flex-direction: column; justify-content: space-between">
          <div>
            <div class="photo-box" style="height: 162px" @click="openClubDetail(club)">
              <img :src="club.photo" :alt="club.name" />
              <span class="badge-tl">{{ club.badge }}</span>
            </div>
            <div class="card-pad">
              <div class="flex-between" style="margin-bottom: 6px">
                <strong style="font-size: 17px; cursor: pointer" @click="openClubDetail(club)">{{ club.name }}</strong>
                <span class="rating-pill">★ {{ club.rating }}</span>
              </div>
              <div style="font-size: 13.5px; color: var(--primary); font-weight: 700; margin-bottom: 8px">
                🎾 {{ club.courtsInfo }} · {{ club.coachCount }}位教练
              </div>

              <!-- 俱乐部在售课程列表 -->
              <div style="background: #f5faf8; border: 1px solid #d9ebe2; padding: 11px 12px; margin-bottom: 12px">
                <div style="font-size: 13.5px; font-weight: 800; color: var(--ink); margin-bottom: 6px">在售课程</div>
                <div
                  v-for="course in club.courses"
                  :key="course.id"
                  class="flex-between"
                  style="padding: 7px 0; border-bottom: 1px dashed #dfece6; gap: 6px"
                >
                  <div style="min-width: 0">
                    <div style="font-size: 14px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
                      {{ course.name }}
                    </div>
                    <div style="font-size: 12.5px; color: var(--ink-3)">{{ course.lessons }}</div>
                  </div>
                  <div class="flex-row" style="gap: 8px; flex-shrink: 0">
                    <strong style="font-size: 15.5px; color: var(--accent)">¥{{ course.memberPrice }}</strong>
                    <button
                      class="btn-primary"
                      style="padding: 5px 10px; font-size: 13px"
                      @click="createQuickOrder('课程', `${club.name.split('（')[0]} · ${course.name}`, `${course.lessons} · 会员专享价`, course.memberPrice, 100)"
                    >
                      购课
                    </button>
                  </div>
                </div>
              </div>

              <!-- 真实评价 + 在线发评 -->
              <div style="background: #fffcf5; border: 1px solid #f0e1bf; padding: 11px 12px">
                <div class="flex-between" style="margin-bottom: 6px">
                  <strong style="font-size: 13.5px; color: #7a4e16">💬 学员评价（{{ club.reviews.length }}条）</strong>
                  <button
                    class="btn-ghost"
                    style="padding: 4px 9px; font-size: 12.5px"
                    @click="openNavigation({ placeName: club.name, address: club.address, lng: club.lng, lat: club.lat, distance: '城区直达', driveMin: '约 6 分钟', tip: `电话 ${club.phone}` })"
                  >
                    🧭 导航
                  </button>
                </div>
                <div v-for="rev in club.reviews.slice(0, 1)" :key="rev.id" style="font-size: 13px; color: var(--ink-2); margin-bottom: 8px; line-height: 1.55">
                  <strong>{{ rev.user }}</strong>：{{ rev.content }}
                </div>
                <div style="display: flex; gap: 6px">
                  <input
                    v-model="getReviewDraft(club.id).content"
                    class="f-input"
                    style="padding: 6px 10px; font-size: 13px"
                    placeholder="发表评价（+15分）…"
                    @keyup.enter="submitClubReview(club)"
                  />
                  <button class="btn-orange" style="padding: 6px 12px; font-size: 13px; flex-shrink: 0" @click="submitClubReview(club)">
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
        <div class="dd-filter-top">
          <div class="flex-row" style="gap: 10px">
            <strong style="font-size: 18px">📅 日常约课排期：{{ currentDateObj.fullTitle }}</strong>
            <div class="seg-group">
              <button :class="{ active: lessonMode === 'group' }" @click="lessonMode = 'group'">团体课</button>
              <button :class="{ active: lessonMode === 'private' }" @click="lessonMode = 'private'">私教1对1</button>
            </div>
          </div>
          <label v-if="lessonMode === 'group'" class="m-tab" :class="{ active: showAllDatesForGroup }" style="cursor: pointer; border: 1px solid #cbdcd5; border-radius: 6px; padding: 6px 12px">
            <input v-model="showAllDatesForGroup" type="checkbox" style="display: none" />
            {{ showAllDatesForGroup ? '✔ 显示近7日全部课程' : '按所选日期查看' }}
          </label>
        </div>

        <div v-if="lessonMode === 'group'" class="dd-filter-grid cols-5">
          <label class="dd-field">
            <span class="dd-field-label">上课日期</span>
            <select
              v-model="selectedDate"
              class="dd-select active"
              @change="showAllDatesForGroup = false"
            >
              <option v-for="d in BOOKING_DATES" :key="d.iso" :value="d.iso">
                {{ d.weekday }}（{{ d.shortDate }}）
              </option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">课程分类</span>
            <select v-model="groupCat" class="dd-select" :class="{ active: groupCat !== '全部' }">
              <option value="全部">全部分类</option>
              <option value="零基础入门">零基础入门</option>
              <option value="多球强化">多球强化</option>
              <option value="双打战术">双打战术</option>
              <option value="发球专项">发球专项</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">上课时段</span>
            <select v-model="groupPeriod" class="dd-select" :class="{ active: groupPeriod !== '全天' }">
              <option value="全天">全天时段</option>
              <option value="上午">上午</option>
              <option value="下午">下午</option>
              <option value="晚间">晚间</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">适配水平</span>
            <select v-model="groupLevel" class="dd-select" :class="{ active: groupLevel !== '全部' }">
              <option value="全部">全部水平</option>
              <option value="零基础">零基础</option>
              <option value="CUTR 2.0-3.0">CUTR 2.0-3.0</option>
              <option value="CUTR 3.0-4.0">CUTR 3.0-4.0</option>
              <option value="青少年">青少年</option>
            </select>
          </label>

          <div class="dd-field">
            <span class="dd-field-label">搜索课程 / 教练</span>
            <div class="search-bar" style="width: 100%; height: 42px; border-radius: 6px">
              <span>🔍</span>
              <input v-model="groupKeyword" type="text" placeholder="搜课程/教练/场馆…" />
            </div>
          </div>
        </div>

        <div v-else class="dd-filter-grid cols-4">
          <label class="dd-field">
            <span class="dd-field-label">约课日期</span>
            <select v-model="selectedDate" class="dd-select active">
              <option v-for="d in BOOKING_DATES" :key="d.iso" :value="d.iso">
                {{ d.weekday }}（{{ d.shortDate }}）
              </option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">教练等级</span>
            <select v-model="coachTier" class="dd-select" :class="{ active: coachTier !== '全部' }">
              <option value="全部">全部等级</option>
              <option value="省网校国家级">省网校国家级</option>
              <option value="金网5.0">金网5.0</option>
              <option value="CTA高级">CTA高级</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">教学专长</span>
            <select v-model="coachSpecialty" class="dd-select" :class="{ active: coachSpecialty !== '全部' }">
              <option value="全部">全部专长</option>
              <option value="零基础启蒙">零基础启蒙</option>
              <option value="发球提速">发球提速</option>
              <option value="网前截击">网前截击</option>
              <option value="比赛实战">比赛实战</option>
              <option value="青少年">青少年</option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">授课场馆</span>
            <select v-model="coachVenue" class="dd-select" :class="{ active: coachVenue !== '全部' }">
              <option v-for="v in coachVenues" :key="v" :value="v">{{ v === '全部' ? '全部授课场馆' : v }}</option>
            </select>
          </label>
        </div>
      </div>

      <!-- 团体课结果 -->
      <div v-if="lessonMode === 'group'">
        <div v-if="filteredGroupClasses.length === 0" class="card card-pad" style="text-align: center; padding: 36px 20px">
          <strong style="font-size: 16px; display: block; margin-bottom: 10px">当前日期与筛选条件下暂无团体课</strong>
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
              style="display: flex; flex-direction: column; justify-content: space-between; gap: 10px"
            >
              <div>
                <div class="flex-between" style="margin-bottom: 8px">
                  <div class="flex-row" style="gap: 6px">
                    <span class="tag green">{{ BOOKING_DATES.find((d) => d.iso === cls.date)?.shortDate }} {{ cls.startTime }}-{{ cls.endTime }}</span>
                    <span class="tag blue">{{ cls.category }}</span>
                  </div>
                  <span class="tag orange">余 {{ cls.capacity - cls.enrolled }}/{{ cls.capacity }} 位</span>
                </div>
                <strong style="font-size: 17px; display: block; margin-bottom: 6px">{{ cls.title }}</strong>
                <div style="font-size: 14px; color: var(--ink-2)">👨‍🏫 {{ cls.coachName }} ｜ 📍 {{ cls.venueName }}</div>
              </div>
              <div class="flex-between" style="padding-top: 10px; border-top: 1px dashed var(--line)">
                <span class="price" style="font-size: 20px">¥{{ cls.memberPrice }}<small>会员价</small></span>
                <button
                  :class="cls.bookedByMe ? 'btn-ghost' : 'btn-orange'"
                  :disabled="cls.bookedByMe || cls.enrolled >= cls.capacity"
                  @click="bookGroupClass(cls.id)"
                >
                  {{ cls.bookedByMe ? '✅ 已预约' : '预约本节课' }}
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
          style="display: flex; flex-direction: column; justify-content: space-between; gap: 12px"
        >
          <div>
            <div style="display: grid; grid-template-columns: 90px 1fr; gap: 14px; margin-bottom: 12px">
              <img :src="coach.photo" :alt="coach.name" style="width: 90px; height: 90px; object-fit: cover" />
              <div>
                <div class="flex-between">
                  <strong style="font-size: 17px">{{ coach.name }} · {{ coach.title }}</strong>
                  <span class="rating-pill">★ {{ coach.rating }}</span>
                </div>
                <div class="flex-row" style="gap: 6px; margin: 6px 0">
                  <span class="tag green">{{ coach.tier }}</span>
                  <span class="tag blue">{{ coach.specialty }}</span>
                </div>
                <div style="font-size: 13px; color: var(--ink-2)">📍 {{ coach.venueName }}</div>
              </div>
            </div>
            <div style="background: #f6faf8; border: 1px solid #dfece6; padding: 11px">
              <div style="font-size: 13.5px; font-weight: 800; margin-bottom: 8px">🕒 选择 {{ currentDateObj.shortDate }} 约课时段：</div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px">
                <button
                  v-for="h in coach.availableHours"
                  :key="h"
                  type="button"
                  class="matrix-cell"
                  style="height: 38px; font-size: 13px"
                  :class="{
                    busy: isCoachSlotBooked(coach.id, h),
                    picked: pickedCoachHours[coach.id] === h,
                    free: !isCoachSlotBooked(coach.id, h) && pickedCoachHours[coach.id] !== h,
                  }"
                  :disabled="isCoachSlotBooked(coach.id, h)"
                  @click="selectCoachSlot(coach.id, h)"
                >
                  {{ formatHourRange(h) }}{{ isCoachSlotBooked(coach.id, h) ? ' (满)' : '' }}
                </button>
              </div>
            </div>
          </div>
          <div class="flex-between" style="padding-top: 10px; border-top: 1px dashed var(--line)">
            <span class="price" style="font-size: 20px">¥{{ coach.memberPrice }}<small>/小时</small></span>
            <button class="btn-primary" @click="submitCoachSlot(coach.id)">
              {{ pickedCoachHours[coach.id] ? `预约 ${formatHourRange(pickedCoachHours[coach.id]!)}` : '预约所选时段' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 五、运动康复机构专区 ===== -->
    <div v-if="trainSection === '全部' || trainSection === 'rehab'">
      <div class="card card-pad mb-16 filter-workbench">
        <div class="dd-filter-top">
          <strong style="font-size: 18px">🩺 运动康复机构保障（市卫健局认证）</strong>
          <span class="tag red">赛期绿色通道</span>
        </div>
        <div class="dd-filter-grid" style="grid-template-columns: repeat(2, minmax(0, 260px))">
          <label class="dd-field">
            <span class="dd-field-label">康复日期</span>
            <select v-model="rehabDate" class="dd-select active">
              <option v-for="d in BOOKING_DATES" :key="`rh-${d.iso}`" :value="d.shortDate">
                {{ d.shortDate }}（{{ d.weekday }}）
              </option>
            </select>
          </label>

          <label class="dd-field">
            <span class="dd-field-label">预约时段</span>
            <select v-model="rehabSlot" class="dd-select active">
              <option v-for="sl in rehabSlots" :key="sl" :value="sl">{{ sl }}</option>
            </select>
          </label>
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
            <div class="photo-box" style="height: 162px" @click="openRehabDetail(center)">
              <img :src="center.photo" :alt="center.name" />
              <span class="badge-tl">{{ center.badge }}</span>
            </div>
            <div class="card-pad">
              <div class="flex-between" style="margin-bottom: 6px">
                <strong style="font-size: 17px; cursor: pointer" @click="openRehabDetail(center)">{{ center.name }}</strong>
                <span class="rating-pill">★ {{ center.rating }}</span>
              </div>
              <div style="font-size: 13.5px; color: var(--primary); font-weight: 700; margin-bottom: 5px">
                👨‍⚕️ {{ center.doctorInfo }}
              </div>
              <div style="font-size: 13px; color: var(--ink-3); margin-bottom: 10px">
                🕒 {{ center.openHours }} · {{ center.distance }}
              </div>

              <!-- 选择具体理疗项目 -->
              <div style="display: flex; flex-direction: column; gap: 7px">
                <button
                  v-for="(svc, sIdx) in center.services"
                  :key="svc.name"
                  type="button"
                  class="flex-between"
                  style="padding: 8px 11px; border: 1px solid; text-align: left; font-size: 13.5px"
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
            </div>
          </div>

          <div class="card-pad flex-between" style="padding: 13px 20px; border-top: 1px dashed var(--line)">
            <button
              class="btn-ghost"
              @click="openNavigation({ placeName: center.name, address: center.address, lng: center.lng, lat: center.lat, distance: center.distance, driveMin: '约 5 分钟', tip: `电话 ${center.phone}` })"
            >
              🧭 导航
            </button>
            <button class="btn-orange" @click="bookRehab(center)">
              预约 {{ rehabSlot }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
