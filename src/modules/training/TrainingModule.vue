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
import type { GroupClassItem, PrivateCoach } from '../../types/portal'

const {
  state,
  switchModule,
  openPhoto,
  openOrderSuccess,
  openNavigation,
  runUpgradeTest,
  showToast,
} = usePortalStore()

// 主分区切换：课程培训 / 成长进阶 / 认证机构
const trainView = ref<'courses' | 'growth' | 'institutions'>('courses')

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

const PAGE_SIZE = 6
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

// ===== 2. 训练营 / 研学课程 / 团建活动 =====
const campFilter = ref<'全部' | '训练营' | '研学课程' | '团建活动'>('全部')
const campKeyword = ref('')

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

// ===== 3. 认证俱乐部 =====
const clubs = reactive<TennisClub[]>(structuredClone(INITIAL_CLUBS))

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
  const student = schoolForm.studentName.trim()
  const track = schoolForm.track
  const visitDate = schoolForm.visitDate
  const level = schoolForm.level
  schoolInquiryHistory.value.unshift({
    id: code,
    track,
    studentName: student,
    visitDate,
  })
  openOrderSuccess({
    headline: '咨询提交成功',
    orderId: code,
    category: '省网校招生',
    title: `湖北省网球学校 · ${track}`,
    subtitle: `学员 ${student}（${level}） · 意向探校 ${visitDate}`,
    amount: 0,
    note: '省网校招生办将在 2 小时内致电确认探校与试训安排',
  })
  schoolForm.studentName = ''
  schoolForm.phone = ''
}

// ===== 5. 青少年网球比赛 =====
const youthGroupFilter = ref<'全部' | 'U8/U10' | 'U12/U14' | 'U16/U18'>('全部')
const youthTournaments = reactive<YouthTournament[]>(structuredClone(INITIAL_YOUTH_TOURNAMENTS))

const visibleYouthTournaments = computed(() =>
  youthGroupFilter.value === '全部'
    ? youthTournaments
    : youthTournaments.filter((t) => t.groupTag === youthGroupFilter.value),
)

// ===== 6. 详情页跳转 =====
function openGroupClassDetail(cls: GroupClassItem) {
  const dateLabel = BOOKING_DATES.find((d) => d.iso === cls.date)?.shortDate ?? cls.date
  openPhoto({
    title: cls.title,
    category: `日常团体课 · ${cls.category}`,
    photo: '/images/indoor_court.jpg',
    rating: 4.9,
    subtitle: `${dateLabel} ${cls.startTime}-${cls.endTime} ｜ ${cls.coachName} ｜ ${cls.venueName}`,
    intro: `由 ${cls.coachName} 执教的「${cls.title}」，适合 ${cls.level} 学员参与，小班制精准指导（每班限 ${cls.capacity} 人，当前余 ${cls.capacity - cls.enrolled} 位）。授课地点：${cls.venueName}。`,
    openHours: `${dateLabel} ${cls.startTime} – ${cls.endTime}`,
    priceInfo: `¥${cls.memberPrice} / 节`,
    priceNum: cls.memberPrice,
    priceUnit: ' / 节',
    actionKind: 'club',
    orderCategory: '课程',
    address: cls.venueName,
    tags: [cls.category, cls.level, `余 ${cls.capacity - cls.enrolled}/${cls.capacity} 位`, ...cls.tags],
    hotItemsTitle: '📅 课程席位预订',
    hotItems: [
      {
        name: `${cls.title}（${dateLabel} ${cls.startTime}-${cls.endTime}）`,
        price: `会员价 ¥${cls.memberPrice}`,
        tag: `${cls.level} · 余 ${cls.capacity - cls.enrolled} 位`,
        desc: `门市价 ¥${cls.price} · 执教教练：${cls.coachName} · 含训练用球与基础器材`,
      },
    ],
    reviews: [
      { user: '京山球友小陈', origin: '京山', score: 5.0, date: '2026-11-24', content: '小班节奏紧凑、教练纠正动作很细致，一节课打下来出汗又涨球！' },
    ],
  })
}

function openCoachDetail(coach: PrivateCoach) {
  const dateLabel = currentDateObj.value.shortDate
  openPhoto({
    title: `${coach.name} · ${coach.title}`,
    category: `私教 1对1 · ${coach.tier}`,
    photo: coach.photo,
    rating: coach.rating,
    reviewCount: coach.lessonsCount,
    subtitle: `${coach.tier} ｜ 擅长 ${coach.specialty} ｜ ${coach.venueName}`,
    intro: `${coach.intro} 累计授课 ${coach.lessonsCount} 节，常驻 ${coach.venueName}，支持按小时灵活预约 1对1 定制指导。`,
    openHours: `每日 08:00 – 21:00（当前查看 ${dateLabel} 排期）`,
    priceInfo: `¥${coach.memberPrice} / 小时`,
    priceNum: coach.memberPrice,
    priceUnit: ' / 小时',
    actionKind: 'club',
    orderCategory: '课程',
    address: coach.venueName,
    tags: [coach.tier, coach.specialty, ...coach.tags],
    hotItemsTitle: `🕒 ${dateLabel} 私教 1对1 可约时段`,
    hotItems: coach.availableHours.map((h) => ({
      name: `${dateLabel} ${formatHourRange(h)} · 1对1专属指导`,
      price: `会员价 ¥${coach.memberPrice}`,
      tag: `${coach.specialty} · 60分钟`,
      desc: `门市价 ¥${coach.price}/小时 · 授课场馆：${coach.venueName}`,
    })),
    reviews: [
      { user: '武汉进阶球友', origin: '武汉', score: 5.0, date: '2026-11-23', content: `跟着${coach.name}上了两节${coach.specialty}专项课，发力逻辑一下就通了！` },
    ],
  })
}

function openSchoolDetail() {
  openPhoto({
    title: '湖北省网球学校（京山）',
    category: '官方体教融合示范校',
    photo: '/images/coach_2.jpg',
    rating: 5.0,
    reviewCount: 512,
    subtitle: '🎓 湖北省体育局与京山市人民政府共建 · 全国体教融合示范校',
    intro: '湖北省网球学校坐落于“中国网球之城”京山，实行小学、初中、高中贯通培养与文化课+网球专项双轨教学，配备 31 片标准风雨馆、硬地及法网红土训练场，由国家级教练团队常驻执教。招生热线：0724-7228866。',
    openHours: '周一至周日 08:30 – 17:30（支持预约实地探校与试训）',
    priceInfo: '免费探校咨询',
    priceNum: 0,
    actionKind: 'club',
    orderCategory: '课程',
    phone: '0724-7228866',
    address: '湖北省荆门市京山市温泉街道网球大道8号（湖北省网球学校）',
    lng: 113.1235,
    lat: 31.0251,
    tags: ['体教融合示范校', '31片标准训练场', '国家级教练团队', '小初高贯通培养'],
    hotItemsTitle: '🎓 官方招生与试训通道',
    hotItems: [
      { name: '小学/初中网球特长生招生试训', price: '免费预约', tag: '全日制贯通', desc: '文化课同步京山名校师资，每日系统网球与体能专项训练' },
      { name: '高中体教融合单招冲刺班', price: '免费预约', tag: '升学定向', desc: '面向全国高一至高三网球特长生，冲刺双一流高校运动训练单招' },
      { name: '寒暑假 7 天体验营插班', price: '¥2480', tag: '7天6晚', desc: '含营地食宿保险、国家级教练分层指导与官方五维能力评测证书' },
      { name: '家长实地探校与免费体验课', price: '免费预约', tag: '周末可约', desc: '参观校园宿舍、文化课堂与红土/风雨馆，享 1 节试训体验评估' },
    ],
    reviews: [
      { user: '武汉家长李女士', origin: '武汉', score: 5.0, date: '2026-11-22', content: '实地探校后当场决定让孩子入读，文化课抓得紧，球场硬件和教练水平在全省数一数二！' },
      { user: '长沙球友爸爸', origin: '长沙', score: 5.0, date: '2026-11-18', content: '暑假送孩子来插班 7 天营，进步特别明显，回校后直接拿了市赛冠军。' },
    ],
  })
}

function openTournamentDetail(t: YouthTournament) {
  openPhoto({
    title: t.name,
    category: `青少年网球比赛 · ${t.levelBadge}`,
    photo: '/images/tournament_1.jpg',
    rating: 4.9,
    subtitle: `${t.groupTag} ｜ ${t.dateRange} ｜ ${t.surface}`,
    intro: `${t.desc} 比赛场地：${t.venue}（${t.surface}），当前剩余 ${t.quotaRemain} 个参赛席位，完赛可获 +${t.pointsReward} 金网积分。`,
    openHours: t.dateRange,
    priceInfo: t.fee === 0 ? '免费报名' : `¥${t.fee} / 人`,
    priceNum: t.fee,
    priceUnit: ' / 人',
    actionKind: 'camp',
    orderCategory: '门票',
    address: t.venue,
    tags: [t.groupTag, t.levelBadge, t.surface, t.status],
    hotItemsTitle: '🏆 选择参赛项目报名',
    hotItems: [
      {
        name: `${t.groupTag} 单打组报名`,
        price: t.fee === 0 ? '免费报名' : `¥${t.fee}`,
        tag: `${t.dateRange} · 余 ${t.quotaRemain} 席`,
        desc: `比赛场馆：${t.venue}（${t.surface}），完赛积 +${t.pointsReward} 金网积分`,
      },
      {
        name: `${t.groupTag} 双打组报名`,
        price: t.fee === 0 ? '免费报名' : `¥${t.fee}`,
        tag: `${t.dateRange} · 支持搭档组队`,
        desc: `比赛场馆：${t.venue}（${t.surface}），完赛同步刷新 CTJ 与五维积分`,
      },
    ],
    reviews: [],
  })
}

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
    actionKind: 'camp',
    orderCategory: '课程',
    address: item.venue,
    tags: item.highlights,
    reviews: [{ user: '往期参营家长', origin: '武汉', score: 5.0, date: '2026-11-20', content: '组织非常专业，教练耐心负责，孩子进步很大！' }],
  })
}

function openClubDetail(club: TennisClub) {
  const minPrice = Math.min(...club.courses.map((c) => c.memberPrice))
  openPhoto({
    title: club.name,
    category: '官方认证网球俱乐部',
    photo: club.photo,
    rating: club.rating,
    reviewCount: club.reviewCount,
    subtitle: `${club.badge} ｜ ${club.courtsInfo} · ${club.coachCount}位教练`,
    intro: `${club.intro} 场馆配置：${club.courtsInfo}，配备 ${club.coachCount} 位官方认证专业教练。咨询电话：${club.phone}。`,
    openHours: '08:00 – 22:00',
    priceInfo: `课程 ¥${minPrice} 起`,
    priceNum: minPrice,
    priceUnit: ' / 期起',
    actionKind: 'club',
    orderCategory: '课程',
    phone: club.phone,
    address: club.address,
    lng: club.lng,
    lat: club.lat,
    tags: club.tags,
    hotItemsTitle: '🎓 俱乐部在售精品课程',
    hotItems: club.courses.map((c) => ({
      name: c.name,
      price: `会员价 ¥${c.memberPrice}`,
      tag: `${c.tag} · ${c.lessons}`,
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
  const minPrice = Math.min(...center.services.map((s) => s.price))
  openPhoto({
    title: center.name,
    category: '运动康复保障机构',
    photo: center.photo,
    rating: center.rating,
    reviewCount: center.reviewCount,
    subtitle: `${center.badge} ｜ ${center.doctorInfo}`,
    intro: `${center.intro} 团队配置：${center.doctorInfo}。咨询电话：${center.phone}。`,
    openHours: center.openHours,
    priceInfo: `¥${minPrice} 起`,
    priceNum: minPrice,
    priceUnit: ' / 次起',
    actionKind: 'rehab',
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
    reviews: [center.quote],
  })
}
</script>

<template>
  <section class="training-compact">
    <!-- 满宽分段切换：课程培训 / 成长进阶 / 认证机构 -->
    <div class="transit-mode-bar cols-3 tr-mode-bar">
      <button
        type="button"
        class="transit-mode-btn"
        :class="{ active: trainView === 'courses' }"
        @click="trainView = 'courses'"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        </svg>
        <span>课程培训</span>
      </button>

      <button
        type="button"
        class="transit-mode-btn"
        :class="{ active: trainView === 'growth' }"
        @click="trainView = 'growth'"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
        <span>成长进阶</span>
      </button>

      <button
        type="button"
        class="transit-mode-btn"
        :class="{ active: trainView === 'institutions' }"
        @click="trainView = 'institutions'"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span>认证机构</span>
      </button>
    </div>

    <!-- ===== 一、课程培训（日常约课排期 + 训练营/研学/团建） ===== -->
    <template v-if="trainView === 'courses'">
      <!-- 1. 日常团体课 / 私教课 7日日历约课 -->
      <div>
        <div class="card filter-workbench tr-filter-bar">
          <div class="dd-filter-top">
            <div class="flex-row" style="gap: 10px">
              <strong class="tr-sec-title">📅 日常约课排期：{{ currentDateObj.fullTitle }}</strong>
              <div class="seg-group tr-seg">
                <button :class="{ active: lessonMode === 'group' }" @click="lessonMode = 'group'">团体课</button>
                <button :class="{ active: lessonMode === 'private' }" @click="lessonMode = 'private'">私教1对1</button>
              </div>
            </div>
            <label v-if="lessonMode === 'group'" class="m-tab tr-toggle-chip" :class="{ active: showAllDatesForGroup }">
              <input v-model="showAllDatesForGroup" type="checkbox" style="display: none" />
              {{ showAllDatesForGroup ? '✔ 近7日全部课程' : '按所选日期查看' }}
            </label>
          </div>

          <div v-if="lessonMode === 'group'" class="dd-filter-grid cols-5 tr-filter-grid">
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
              <div class="search-bar tr-search">
                <span>🔍</span>
                <input v-model="groupKeyword" type="text" placeholder="搜课程/教练/场馆…" />
              </div>
            </div>
          </div>

          <div v-else class="dd-filter-grid cols-4 tr-filter-grid">
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

        <!-- 团体课结果：紧凑 3 列网格 -->
        <div v-if="lessonMode === 'group'">
          <div v-if="filteredGroupClasses.length === 0" class="card tr-empty">
            <strong style="font-size: 15px; display: block; margin-bottom: 8px">当前日期与筛选条件下暂无团体课</strong>
            <button
              class="btn-primary tr-btn-sm"
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
            <div class="tr-grid-3">
              <div
                v-for="cls in pagedGroupClasses"
                :key="cls.id"
                class="card tr-lesson-card"
              >
                <div>
                  <div class="flex-between" style="margin-bottom: 6px; gap: 6px">
                    <div class="flex-row" style="gap: 5px; flex-wrap: wrap">
                      <span class="tag green tr-tag">{{ BOOKING_DATES.find((d) => d.iso === cls.date)?.shortDate }} {{ cls.startTime }}-{{ cls.endTime }}</span>
                      <span class="tag blue tr-tag">{{ cls.category }}</span>
                    </div>
                    <span class="tag orange tr-tag">余 {{ cls.capacity - cls.enrolled }}/{{ cls.capacity }}</span>
                  </div>
                  <strong class="tr-card-title tr-clamp-1" style="cursor: pointer" :title="cls.title" @click="openGroupClassDetail(cls)">{{ cls.title }}</strong>
                  <div class="tr-card-meta tr-clamp-1">👨‍🏫 {{ cls.coachName }} ｜ 📍 {{ cls.venueName }}</div>
                </div>
                <div class="tr-card-foot">
                  <span class="price tr-price">¥{{ cls.memberPrice }}<small>会员价</small></span>
                  <button
                    class="btn-primary tr-btn-sm"
                    @click="openGroupClassDetail(cls)"
                  >
                    详情与预订
                  </button>
                </div>
              </div>
            </div>
            <PaginationBar
              v-if="filteredGroupClasses.length > PAGE_SIZE"
              :total="filteredGroupClasses.length"
              :page="groupPage"
              :page-size="PAGE_SIZE"
              unit="节课程"
              @update:page="groupPage = $event"
            />
          </div>
        </div>

        <!-- 私教课结果：紧凑 3 列网格 -->
        <div v-else class="tr-grid-3">
          <div
            v-for="coach in filteredCoaches"
            :key="coach.id"
            class="card tr-lesson-card"
          >
            <div style="display: grid; grid-template-columns: 64px 1fr; gap: 10px">
              <img
                :src="coach.photo"
                :alt="coach.name"
                style="width: 64px; height: 64px; object-fit: cover; border-radius: 4px; cursor: pointer"
                @click="openCoachDetail(coach)"
              />
              <div style="min-width: 0">
                <div class="flex-between" style="gap: 6px">
                  <strong class="tr-card-title tr-clamp-1" style="cursor: pointer" @click="openCoachDetail(coach)">{{ coach.name }} · {{ coach.title }}</strong>
                  <span class="rating-pill" style="flex-shrink: 0">★ {{ coach.rating }}</span>
                </div>
                <div class="flex-row" style="gap: 5px; margin: 4px 0; flex-wrap: wrap">
                  <span class="tag green tr-tag">{{ coach.tier }}</span>
                  <span class="tag blue tr-tag">{{ coach.specialty }}</span>
                </div>
                <div class="tr-card-meta tr-clamp-1">📍 {{ coach.venueName }} · 可约 {{ coach.availableHours.length }} 个时段</div>
              </div>
            </div>
            <div class="tr-card-foot">
              <span class="price tr-price">¥{{ coach.memberPrice }}<small>/小时</small></span>
              <button class="btn-primary tr-btn-sm" @click="openCoachDetail(coach)">
                详情与预订
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 网球训练营 · 研学课程 · 团建活动（紧凑 3 列） -->
      <div>
        <div class="card filter-workbench tr-filter-bar">
          <div class="dd-filter-top">
            <strong class="tr-sec-title">🏕️ 主题营地 · 研学与团建</strong>
            <span class="dd-count-pill">共 {{ visibleCamps.length }} 个项目</span>
          </div>
          <div class="dd-filter-grid tr-filter-grid" style="grid-template-columns: 1.4fr 1fr">
            <div class="dd-field">
              <span class="dd-field-label">项目搜索</span>
              <div class="search-bar tr-search">
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
          </div>
        </div>

        <div class="tr-grid-3">
          <div
            v-for="item in pagedCamps"
            :key="item.id"
            class="card tr-photo-card"
          >
            <div>
              <div
                class="photo-box tr-photo"
                @click="openCampDetail(item)"
              >
                <img :src="item.photo" :alt="item.title" />
                <span class="badge-tl">{{ item.category }} · {{ item.duration }}</span>
              </div>
              <div class="tr-photo-body">
                <div class="flex-between" style="align-items: flex-start; gap: 6px">
                  <strong class="tr-card-title tr-clamp-1" style="cursor: pointer" :title="item.title" @click="openCampDetail(item)">{{ item.title }}</strong>
                  <span class="rating-pill" style="flex-shrink: 0">★ {{ item.rating }}</span>
                </div>
                <div class="tr-card-meta tr-clamp-1">
                  {{ item.targetAudience }} · {{ item.venue }}
                </div>
              </div>
            </div>

            <div class="tr-photo-foot">
              <span class="price tr-price">¥{{ item.price }}<small>{{ item.priceUnit }}</small></span>
              <button class="btn-primary tr-btn-sm" @click="openCampDetail(item)">
                详情与报名
              </button>
            </div>
          </div>
        </div>
        <PaginationBar
          v-if="visibleCamps.length > PAGE_SIZE"
          :total="visibleCamps.length"
          :page="campPage"
          :page-size="PAGE_SIZE"
          unit="个项目"
          @update:page="campPage = $event"
        />
      </div>
    </template>

    <!-- ===== 二、成长进阶（省网校招生 + 五维能力评测 + 青少年赛事） ===== -->
    <template v-else-if="trainView === 'growth'">
      <div class="tr-grid-2">
        <!-- 湖北省网球学校直通咨询通道 -->
        <div class="card" style="border: 1.5px solid #0d7278">
          <div class="photo-box" style="height: 112px; cursor: pointer" @click="openSchoolDetail">
            <img src="/images/coach_2.jpg" alt="湖北省网球学校" />
            <span class="badge-tl" style="background: #0d7278">🎓 湖北省网球学校 · 官方招生通道</span>
          </div>
          <div style="padding: 12px 15px">
            <div class="flex-between" style="margin-bottom: 8px">
              <strong style="font-size: 16px; cursor: pointer" @click="openSchoolDetail">湖北省网球学校 · 招生与探校咨询</strong>
              <span class="rating-pill">★ 5.0</span>
            </div>

            <div class="grid-2" style="gap: 8px; margin-bottom: 8px">
              <select v-model="schoolForm.track" class="f-input tr-input-sm">
                <option>小学/初中网球特长生招生</option>
                <option>高中体教融合单招冲刺班</option>
                <option>寒暑假 7 天体验营插班咨询</option>
                <option>家长实地探校与试训预约</option>
              </select>
              <select v-model="schoolForm.visitDate" class="f-input tr-input-sm">
                <option v-for="d in BOOKING_DATES" :key="`sc-${d.iso}`" :value="d.shortDate">意向探校：{{ d.shortDate }} {{ d.weekday }}</option>
              </select>
            </div>
            <div class="grid-3" style="gap: 8px; margin-bottom: 10px">
              <input v-model="schoolForm.studentName" class="f-input tr-input-sm" placeholder="学员姓名 *" />
              <select v-model="schoolForm.level" class="f-input tr-input-sm">
                <option>零基础启蒙</option>
                <option>已有1年基础</option>
                <option>有省级参赛经历</option>
              </select>
              <input v-model="schoolForm.phone" class="f-input tr-input-sm" placeholder="家长电话 *" />
            </div>

            <div class="flex-between" style="gap: 8px">
              <span style="font-size: 12.5px; color: #0d7278; font-weight: 700">
                {{ schoolInquiryHistory.length > 0 ? `✅ 最近回执：${schoolInquiryHistory[0]?.id}` : '📞 招生热线：0724-7228866' }}
              </span>
              <div class="flex-row" style="gap: 6px">
                <button class="btn-ghost tr-btn-sm" @click="openSchoolDetail">学校详情</button>
                <button class="btn-primary tr-btn-sm" style="background: #0d7278" @click="submitSchoolInquiry">
                  提交咨询单 →
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 五维能力评测与晋升 -->
        <div class="card" style="background: linear-gradient(135deg, #f1faf6, #ffffff); border: 1.5px solid var(--primary)">
          <div style="padding: 13px 16px; display: grid; grid-template-columns: 1fr 205px; gap: 12px; align-items: center; height: 100%">
            <div>
              <span class="tag green tr-tag" style="margin-bottom: 6px">🏅 官方五维评测</span>
              <div style="font-size: 16.5px; font-weight: 900; margin-bottom: 4px">网球能力评测 & 晋升测试</div>
              <div style="font-size: 12.5px; color: var(--ink-2); margin-bottom: 10px">
                复测实时刷新能力图，自动同步约球等级
              </div>
              <select v-model="selectedOrg" class="f-input tr-input-sm" style="margin-bottom: 10px">
                <option>湖北省网球学校评测中心</option>
                <option>京山国际网球中心官方认证点</option>
              </select>
              <div class="flex-row" style="gap: 8px; flex-wrap: wrap">
                <button class="btn-orange tr-btn-sm" @click="runUpgradeTest(selectedOrg, true)">晋升复测（200分抵扣）</button>
                <button class="btn-ghost tr-btn-sm" @click="switchModule(13)">能力档案</button>
              </div>
            </div>
            <div>
              <AbilityRadarChart :ability="state.ability" :level="state.abilityLevel" />
            </div>
          </div>
        </div>
      </div>

      <!-- 青少年网球比赛专区 -->
      <div class="card" style="padding: 13px 16px">
        <div class="flex-between" style="padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid var(--line)">
          <strong class="tr-sec-title">🏆 青少年网球比赛</strong>
          <div class="flex-row" style="gap: 6px">
            <button
              v-for="g in (['全部', 'U8/U10', 'U12/U14', 'U16/U18'] as const)"
              :key="g"
              class="filter-pill"
              style="padding: 4px 10px; font-size: 12.5px"
              :class="{ active: youthGroupFilter === g }"
              @click="youthGroupFilter = g"
            >
              {{ g === '全部' ? '全部年龄组' : `${g} 组` }}
            </button>
          </div>
        </div>

        <div class="tr-grid-2">
          <div
            v-for="t in visibleYouthTournaments"
            :key="t.id"
            style="border: 1px solid var(--line); background: #fafdfc; padding: 11px 14px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px"
          >
            <div>
              <div class="flex-between" style="margin-bottom: 5px">
                <div class="flex-row" style="gap: 5px">
                  <span class="tag green tr-tag">{{ t.groupTag }}</span>
                  <span class="tag tr-tag" :class="t.status === '火热进行中' ? 'red' : 'orange'">{{ t.status }}</span>
                </div>
                <span style="font-size: 12.5px; color: var(--primary); font-weight: 800">余 {{ t.quotaRemain }} 席</span>
              </div>
              <strong
                class="tr-card-title tr-clamp-1"
                style="margin-bottom: 4px; cursor: pointer"
                :title="t.name"
                @click="openTournamentDetail(t)"
              >
                {{ t.name }}
              </strong>
              <div class="tr-card-meta tr-clamp-1">
                📅 {{ t.dateRange }} ｜ 📍 {{ t.venue }}
              </div>
            </div>

            <div class="flex-between" style="padding-top: 8px; border-top: 1px dashed var(--line)">
              <strong style="font-size: 17px; color: var(--accent)">{{ t.fee === 0 ? '免费' : `¥${t.fee}` }}</strong>
              <button class="btn-primary tr-btn-sm" @click="openTournamentDetail(t)">
                详情与报名
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== 三、认证机构（官方认证俱乐部 + 运动康复机构） ===== -->
    <template v-else>
      <!-- 1. 认证网球俱乐部 -->
      <div>
        <div class="card flex-between tr-sec-bar">
          <div class="flex-row" style="gap: 8px">
            <strong class="tr-sec-title">🏟️ 官方认证网球俱乐部</strong>
            <span class="tag gold tr-tag">五星认证</span>
          </div>
          <span class="dd-count-pill">共 {{ clubs.length }} 家</span>
        </div>

        <div class="tr-grid-3">
          <div v-for="club in clubs" :key="club.id" class="card tr-photo-card">
            <div>
              <div class="photo-box tr-photo" @click="openClubDetail(club)">
                <img :src="club.photo" :alt="club.name" />
                <span class="badge-tl">{{ club.badge }}</span>
              </div>
              <div class="tr-photo-body">
                <div class="flex-between" style="align-items: flex-start; gap: 6px">
                  <strong class="tr-card-title tr-clamp-1" style="cursor: pointer" :title="club.name" @click="openClubDetail(club)">{{ club.name }}</strong>
                  <span class="rating-pill" style="flex-shrink: 0">★ {{ club.rating }}</span>
                </div>
                <div class="tr-card-meta tr-clamp-1">
                  {{ club.courtsInfo }} · {{ club.coachCount }}位教练
                </div>
              </div>
            </div>

            <div class="tr-photo-foot">
              <span class="price tr-price">
                ¥{{ Math.min(...club.courses.map((c) => c.memberPrice)) }}<small>起</small>
              </span>
              <div class="flex-row" style="gap: 6px">
                <button
                  class="btn-ghost tr-btn-sm"
                  @click="openNavigation({ placeName: club.name, address: club.address, lng: club.lng, lat: club.lat, distance: '城区直达', driveMin: '约 6 分钟', tip: `电话 ${club.phone}` })"
                >
                  🧭 导航
                </button>
                <button class="btn-primary tr-btn-sm" @click="openClubDetail(club)">
                  详情与预订
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 运动康复机构专区 -->
      <div>
        <div class="card flex-between tr-sec-bar">
          <div class="flex-row" style="gap: 8px">
            <strong class="tr-sec-title">🩺 运动康复机构保障</strong>
            <span class="tag red tr-tag">赛期绿色通道</span>
          </div>
          <span class="dd-count-pill">共 {{ REHAB_CENTERS.length }} 家</span>
        </div>

        <div class="tr-grid-3">
          <div
            v-for="center in REHAB_CENTERS"
            :key="center.id"
            class="card tr-photo-card"
          >
            <div>
              <div class="photo-box tr-photo" @click="openRehabDetail(center)">
                <img :src="center.photo" :alt="center.name" />
                <span class="badge-tl">{{ center.badge }}</span>
              </div>
              <div class="tr-photo-body">
                <div class="flex-between" style="align-items: flex-start; gap: 6px">
                  <strong class="tr-card-title tr-clamp-1" style="cursor: pointer" :title="center.name" @click="openRehabDetail(center)">{{ center.name }}</strong>
                  <span class="rating-pill" style="flex-shrink: 0">★ {{ center.rating }}</span>
                </div>
                <div class="tr-card-meta tr-clamp-1">
                  {{ center.distance }} · {{ center.services.length }}项理疗服务
                </div>
              </div>
            </div>

            <div class="tr-photo-foot">
              <span class="price tr-price">
                ¥{{ Math.min(...center.services.map((s) => s.price)) }}<small>/次起</small>
              </span>
              <div class="flex-row" style="gap: 6px">
                <button
                  class="btn-ghost tr-btn-sm"
                  @click="openNavigation({ placeName: center.name, address: center.address, lng: center.lng, lat: center.lat, distance: center.distance, driveMin: '约 5 分钟', tip: `电话 ${center.phone}` })"
                >
                  🧭 导航
                </button>
                <button class="btn-primary tr-btn-sm" @click="openRehabDetail(center)">
                  详情与预订
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
.training-compact {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tr-mode-bar :deep(.transit-mode-btn),
.tr-mode-bar .transit-mode-btn {
  height: 42px;
  font-size: 15.5px;
}
.tr-sec-title {
  font-size: 16px;
}
.tr-sec-bar {
  padding: 10px 16px;
  margin-bottom: 10px;
}
.tr-filter-bar {
  padding: 11px 16px;
  margin-bottom: 10px;
}
.tr-filter-bar .dd-filter-top {
  margin-bottom: 8px;
}
.tr-filter-grid {
  gap: 10px;
}
.tr-filter-grid .dd-field-label {
  font-size: 12px;
  margin-bottom: 3px;
}
.tr-filter-grid .dd-select {
  height: 36px;
  font-size: 13px;
  padding: 0 10px;
}
.tr-search {
  width: 100%;
  height: 36px;
  border-radius: 6px;
  padding: 2px 10px;
}
.tr-search input {
  font-size: 13px;
}
.tr-seg button {
  padding: 4px 10px;
  font-size: 12.5px;
}
.tr-toggle-chip {
  cursor: pointer;
  border: 1px solid #cbdcd5;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12.5px;
}
.tr-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.tr-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.tr-lesson-card {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}
.tr-photo-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.tr-photo {
  height: 118px;
}
.tr-photo-body {
  padding: 10px 13px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.tr-photo-foot {
  padding: 9px 13px;
  border-top: 1px dashed var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.tr-card-foot {
  padding-top: 8px;
  border-top: 1px dashed var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.tr-card-title {
  display: block;
  font-size: 15px;
  line-height: 1.35;
  color: var(--ink);
}
.tr-card-accent {
  font-size: 12.5px;
  color: var(--primary);
  font-weight: 700;
}
.tr-card-meta {
  font-size: 12.5px;
  color: var(--ink-2);
  line-height: 1.45;
}
.tr-price {
  font-size: 17.5px;
}
.tr-tag {
  font-size: 11.5px;
  padding: 2px 7px;
}
.tr-btn-sm {
  padding: 5px 11px;
  font-size: 12.5px;
}
.tr-input-sm {
  padding: 6px 10px;
  font-size: 13px;
}
.tr-empty {
  text-align: center;
  padding: 24px 16px;
}
.tr-clamp-1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tr-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
@media (max-width: 960px) {
  .tr-grid-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
