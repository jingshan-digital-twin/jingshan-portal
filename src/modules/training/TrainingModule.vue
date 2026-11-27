<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import AbilityRadarChart from '../../components/AbilityRadarChart.vue'
import { BOOKING_DATES, formatHourRange } from '../../mock/schedules'
import { usePortalStore } from '../../store/usePortalStore'

const {
  state,
  switchModule,
  openActionModal,
  bookGroupClass,
  bookPrivateCoachSlot,
  createQuickOrder,
  runUpgradeTest,
  showToast,
} = usePortalStore()

const trainTab = ref<'group' | 'private' | 'school' | 'rehab'>('group')
const selectedDate = ref(BOOKING_DATES[0]!.iso)
const showAllDatesForGroup = ref(false)

// 团体课筛选
const groupCat = ref<'全部' | '零基础入门' | '多球强化' | '双打战术' | '发球专项'>('全部')
const groupLevel = ref<'全部' | '零基础' | 'CUTR 2.0-3.0' | 'CUTR 3.0-4.0' | '青少年'>('全部')
const groupPeriod = ref<'全天' | '上午' | '下午' | '晚间'>('全天')

// 私教课筛选
const coachTier = ref<'全部' | '省网校国家级' | '金网5.0' | 'CTA高级'>('全部')
const coachSpecialty = ref<'全部' | '零基础启蒙' | '发球提速' | '网前截击' | '比赛实战' | '青少年'>('全部')
const coachVenue = ref<string>('全部')
const pickedCoachHours = reactive<Record<string, string>>({})

// 康复/评测
const selectedOrg = ref('湖北省网球学校评测中心')
const rehabSlot = ref('16:00-17:00')

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

const filteredGroupClasses = computed(() =>
  state.groupClasses.filter((cls) => {
    const okDate = showAllDatesForGroup.value || cls.date === selectedDate.value
    const okCat = groupCat.value === '全部' || cls.category === groupCat.value
    const okLevel = groupLevel.value === '全部' || cls.level === groupLevel.value
    const okPeriod = matchPeriod(cls.startTime, groupPeriod.value)
    return okDate && okCat && okLevel && okPeriod
  }),
)

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
</script>

<template>
  <section>
    <div class="module-header">
      <div class="mh-left">
        <div class="mh-num">09</div>
        <div>
          <h1 class="mh-title">“训”：课程预约与培训研学服务</h1>
          <div class="mh-desc">
            湖北省网球学校招生咨询、五维能力评测与晋升测试、训练营研学与康复
          </div>
        </div>
      </div>
      <div class="mh-tabs">
        <button class="m-tab" :class="{ active: trainTab === 'group' }" @click="trainTab = 'group'">团体课预约</button>
        <button class="m-tab" :class="{ active: trainTab === 'private' }" @click="trainTab = 'private'">私教课预约</button>
        <button class="m-tab" :class="{ active: trainTab === 'school' }" @click="trainTab = 'school'">省网校与五维评测</button>
        <button class="m-tab" :class="{ active: trainTab === 'rehab' }" @click="trainTab = 'rehab'">团建与运动康复</button>
      </div>
    </div>

    <!-- 团体课 & 私教课 共用 7日日历头（参照图3） -->
    <div v-if="trainTab === 'group' || trainTab === 'private'" class="card card-pad mb-16 filter-workbench">
      <div class="flex-between mb-12">
        <div class="flex-row">
          <strong style="font-size: 16px">📅 {{ currentDateObj.fullTitle }}</strong>
          <span class="tag green">{{ trainTab === 'group' ? '团体课课表' : '私教1对1可约时段' }}</span>
        </div>
        <div class="flex-row">
          <div class="seg-group">
            <button :class="{ active: trainTab === 'group' }" @click="trainTab = 'group'">团体课</button>
            <button :class="{ active: trainTab === 'private' }" @click="trainTab = 'private'">私教课</button>
          </div>
          <label v-if="trainTab === 'group'" class="m-tab" :class="{ active: showAllDatesForGroup }" style="cursor: pointer">
            <input v-model="showAllDatesForGroup" type="checkbox" style="display: none" />
            {{ showAllDatesForGroup ? '✔ 显示近7日全部课程' : '查看近7日全部' }}
          </label>
        </div>
      </div>

      <div class="date-strip-7 mb-12">
        <button
          v-for="d in BOOKING_DATES"
          :key="d.iso"
          class="date-chip"
          :class="{ active: selectedDate === d.iso && !showAllDatesForGroup }"
          @click="
            selectedDate = d.iso;
            showAllDatesForGroup = false
          "
        >
          <strong>{{ d.weekday }}</strong>
          <span>{{ d.shortDate }}</span>
        </button>
      </div>

      <!-- 团体课多维筛选 -->
      <div v-if="trainTab === 'group'" class="filter-rows">
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
          <span class="filter-label">开课时段：</span>
          <button
            v-for="p in (['全天', '上午', '下午', '晚间'] as const)"
            :key="p"
            class="filter-pill"
            :class="{ active: groupPeriod === p }"
            @click="groupPeriod = p"
          >
            {{ p }}
          </button>
        </div>
        <div class="filter-row">
          <span class="filter-label">适合水平：</span>
          <button
            v-for="lv in (['全部', '零基础', 'CUTR 2.0-3.0', 'CUTR 3.0-4.0', '青少年'] as const)"
            :key="lv"
            class="filter-pill"
            :class="{ active: groupLevel === lv }"
            @click="groupLevel = lv"
          >
            {{ lv }}
          </button>
          <span style="margin-left: auto; font-size: 12px; font-weight: 800; color: var(--primary)">
            找到 {{ filteredGroupClasses.length }} 节可约团体课
          </span>
        </div>
      </div>

      <!-- 私教课多维筛选 -->
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
          <span class="filter-label">授课场馆：</span>
          <select v-model="coachVenue" class="f-input" style="width: auto; padding: 4px 10px">
            <option v-for="v in coachVenues" :key="v" :value="v">{{ v === '全部' ? '全部场馆' : v }}</option>
          </select>
        </div>
        <div class="filter-row">
          <span class="filter-label">教学专长：</span>
          <button
            v-for="sp in (['全部', '零基础启蒙', '发球提速', '网前截击', '比赛实战', '青少年'] as const)"
            :key="sp"
            class="filter-pill"
            :class="{ active: coachSpecialty === sp }"
            @click="coachSpecialty = sp"
          >
            {{ sp }}
          </button>
          <span style="margin-left: auto; font-size: 12px; font-weight: 800; color: var(--primary)">
            当前日期可约 {{ filteredCoaches.length }} 位认证教练
          </span>
        </div>
      </div>
    </div>

    <!-- 团体课列表 -->
    <div v-if="trainTab === 'group'" class="mb-18">
      <div v-if="filteredGroupClasses.length === 0" class="card card-pad" style="text-align: center; padding: 44px 20px">
        <div style="font-size: 32px; margin-bottom: 8px">📋</div>
        <strong style="font-size: 15px; display: block; margin-bottom: 5px">当前日期与筛选条件下暂无排期团体课</strong>
        <div style="font-size: 12px; color: var(--ink-3); margin-bottom: 12px">您可以切换上方其他日期，或点击查看近7日全部排期</div>
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

      <div v-else class="grid-2">
        <div
          v-for="cls in filteredGroupClasses"
          :key="cls.id"
          class="card card-pad"
          style="display: flex; flex-direction: column; justify-content: space-between; gap: 10px"
        >
          <div>
            <div class="flex-between" style="margin-bottom: 6px">
              <div class="flex-row" style="gap: 6px">
                <span class="tag green">🕒 {{ BOOKING_DATES.find((d) => d.iso === cls.date)?.shortDate }} {{ cls.startTime }}-{{ cls.endTime }}</span>
                <span class="tag blue">{{ cls.category }}</span>
                <span class="tag gold">{{ cls.level }}</span>
              </div>
              <span class="tag" :class="cls.capacity - cls.enrolled <= 2 ? 'orange' : 'green'">
                余 {{ cls.capacity - cls.enrolled }}/{{ cls.capacity }} 位
              </span>
            </div>
            <strong style="font-size: 15.5px; display: block; margin-bottom: 5px">{{ cls.title }}</strong>
            <div style="font-size: 12px; color: var(--ink-2); margin-bottom: 8px">
              👨‍🏫 授课教练：<strong>{{ cls.coachName }}</strong> ｜ 📍 {{ cls.venueName }}
            </div>
            <div class="flex-row" style="gap: 5px">
              <span v-for="t in cls.tags" :key="t" class="tag">{{ t }}</span>
            </div>
          </div>

          <div class="flex-between" style="padding-top: 10px; border-top: 1px dashed var(--line)">
            <div>
              <span class="price" style="font-size: 19px">¥{{ cls.memberPrice }}<small>会员价</small></span>
              <s style="font-size: 11px; color: var(--ink-3); margin-left: 6px">¥{{ cls.price }}</s>
            </div>
            <button
              :class="cls.bookedByMe ? 'btn-ghost' : 'btn-orange'"
              :disabled="cls.bookedByMe || cls.enrolled >= cls.capacity"
              @click="bookGroupClass(cls.id)"
            >
              {{ cls.bookedByMe ? '✅ 已预约本节课程' : cls.enrolled >= cls.capacity ? '名额已满' : '预约该时段课程' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 私教课列表（每位教练具体可约1小时时段选择） -->
    <div v-if="trainTab === 'private'" class="grid-2 mb-18">
      <div
        v-for="coach in filteredCoaches"
        :key="coach.id"
        class="card card-pad"
        style="display: flex; flex-direction: column; justify-content: space-between; gap: 12px"
      >
        <div>
          <div style="display: grid; grid-template-columns: 92px 1fr; gap: 12px; margin-bottom: 10px">
            <img :src="coach.photo" :alt="coach.name" style="width: 92px; height: 92px; border-radius: 0; object-fit: cover" />
            <div>
              <div class="flex-between" style="margin-bottom: 4px">
                <strong style="font-size: 16px">{{ coach.name }} · {{ coach.title }}</strong>
                <span class="rating-pill">★ {{ coach.rating }}</span>
              </div>
              <div class="flex-row" style="gap: 5px; margin-bottom: 5px">
                <span class="tag green">{{ coach.tier }}</span>
                <span class="tag blue">专长：{{ coach.specialty }}</span>
                <span style="font-size: 11px; color: var(--ink-3)">累计 {{ coach.lessonsCount }} 节</span>
              </div>
              <div style="font-size: 11.5px; color: var(--ink-3)">📍 常驻场馆：{{ coach.venueName }}</div>
            </div>
          </div>
          <div style="font-size: 12px; color: var(--ink-2); margin-bottom: 10px">{{ coach.intro }}</div>

          <!-- 具体可约 1 小时时段选择 -->
          <div style="background: #f6faf8; border: 1px solid #dfece6; border-radius: 0; padding: 10px">
            <div class="flex-between" style="margin-bottom: 7px">
              <strong style="font-size: 12px">🕒 选择 {{ currentDateObj.shortDate }} 具体1对1约课时段：</strong>
              <span style="font-size: 11px; color: var(--primary); font-weight: 700">
                {{ pickedCoachHours[coach.id] ? `已选 ${formatHourRange(pickedCoachHours[coach.id]!)}` : '点击空闲时段选中' }}
              </span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px">
              <button
                v-for="h in coach.availableHours"
                :key="h"
                type="button"
                class="matrix-cell"
                style="height: 36px; font-size: 11.5px"
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

        <div class="flex-between" style="padding-top: 10px; border-top: 1px dashed var(--line)">
          <div>
            <span class="price" style="font-size: 19px">¥{{ coach.memberPrice }}<small>/小时</small></span>
            <s style="font-size: 11px; color: var(--ink-3); margin-left: 6px">原价¥{{ coach.price }}</s>
          </div>
          <button class="btn-primary" @click="submitCoachSlot(coach.id)">
            {{ pickedCoachHours[coach.id] ? `预约 ${formatHourRange(pickedCoachHours[coach.id]!)}` : '预约所选时段' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 省网校与五维评测 -->
    <div v-if="trainTab === 'school'" class="grid-2 mb-16">
      <div class="card" style="border: 2px solid #0d7278">
        <div class="photo-box" style="height: 168px">
          <img src="/images/coach_2.jpg" alt="湖北省网球学校" />
          <span class="badge-tl" style="background: #0d7278">🎓 省级体教融合金字招牌</span>
          <span class="badge-bl">湖北省网球学校 · 官方报名咨询通道</span>
        </div>
        <div class="card-pad">
          <div class="flex-between">
            <strong style="font-size: 16.5px">湖北省网球学校 · 招生咨询 & 青少年研学基地</strong>
            <span class="rating-pill">★ 5.0</span>
          </div>
          <div style="font-size: 12px; color: var(--ink-2); margin: 6px 0 10px">
            面向全国招收小学至高中网球特长生及短期冬夏令营学员，专业驻校教练与国家级场地保障，支持在线提交咨询、预约实地探校。
          </div>
          <div class="flex-between">
            <button
              class="btn-ghost"
              @click="openActionModal({ type: 'inquiry', title: '湖北省网球学校 · 招生与探校咨询', subtitle: '支持小学/初中/高中网球特长招生咨询及寒暑假短期集训营报名', submitLabel: '提交招生咨询单' })"
            >
              在线招生咨询
            </button>
            <button
              class="btn-primary"
              @click="createQuickOrder('课程', '湖北省网球学校 · 青少年7天冬令营', '含食宿、专业训练与五维等级评测', 2480, 200)"
            >
              立即报名冬令营 (¥2,480)
            </button>
          </div>
        </div>
      </div>

      <div class="card" style="background: linear-gradient(135deg, #f1faf6, #ffffff); border: 2px solid var(--primary)">
        <div class="card-pad" style="display: grid; grid-template-columns: 1fr 245px; gap: 10px; align-items: center; height: 100%">
          <div>
            <span class="tag green" style="margin-bottom: 7px">🏅 官方指定评测机构 · 等级晋升闭环</span>
            <div style="font-size: 16.5px; font-weight: 900; margin-bottom: 6px">网球能力五维评测 & 训练后晋升测试</div>
            <div style="font-size: 12px; color: var(--ink-2); line-height: 1.65; margin-bottom: 8px">
              • <strong>如何升级：</strong>完成专项训练后预约<strong>「晋升测试」</strong>，指定机构复测录入新五维数据即可升级！<br />
              • <strong>结果联动：</strong>自动同步至「赛事分级报名」与「同城约球匹配」
            </div>
            <select v-model="selectedOrg" class="f-input" style="margin-bottom: 9px">
              <option>湖北省网球学校评测中心</option>
              <option>京山国际网球中心官方认证点</option>
            </select>
            <div class="flex-row">
              <button class="btn-orange" @click="runUpgradeTest(selectedOrg, true)">完成晋升复测录入（200分抵扣）</button>
              <button class="btn-ghost" @click="switchModule(13)">查看我的档案</button>
            </div>
          </div>
          <div>
            <AbilityRadarChart :ability="state.ability" :level="state.abilityLevel" />
          </div>
        </div>
      </div>
    </div>

    <!-- 团建与运动康复 -->
    <div v-if="trainTab === 'rehab'" class="grid-3">
      <div class="card card-pad">
        <div class="photo-box" style="height: 135px; border-radius: 0; margin-bottom: 9px">
          <img src="/images/indoor_court.jpg" alt="京彩俱乐部" />
          <span class="badge-tl">认证俱乐部 · 课程直售</span>
        </div>
        <div class="flex-between">
          <strong style="font-size: 14.5px">京彩网球俱乐部 · 进阶私教包</strong>
          <span class="rating-pill">★ 4.9 (218评)</span>
        </div>
        <div style="font-size: 11.5px; color: var(--ink-3); margin: 4px 0">2片室内空调硬地 · 10节私教课赠免费晋升评测1次</div>
        <div class="review-quote">💬 评：“教练针对我的发球和网前截击定制训练，进步肉眼可见！”</div>
        <div class="flex-between" style="margin-top: 9px">
          <span class="price" style="font-size: 17px">¥1,680<small>/10节</small></span>
          <button class="btn-primary" @click="createQuickOrder('课程', '京彩网球俱乐部 · 10节进阶私教包', '赠指定机构晋升评测1次', 1680, 150)">
            购买课程包
          </button>
        </div>
      </div>

      <div class="card card-pad">
        <div class="photo-box" style="height: 135px; border-radius: 0; margin-bottom: 9px">
          <img src="/images/coach_1.jpg" alt="政企团建" />
          <span class="badge-tl">🤝 企业团建 / 研学定制</span>
        </div>
        <div class="flex-between">
          <strong style="font-size: 14.5px">政企网球趣味团建 & 研学课程</strong>
          <span class="rating-pill">★ 4.9 (142评)</span>
        </div>
        <div style="font-size: 11.5px; color: var(--ink-3); margin: 4px 0">支持20–150人 · 含零基础破冰赛+定点团餐+温泉放松</div>
        <div class="review-quote">💬 评：“武汉公司带60人来京山团建两天，大家玩得停不下来！”</div>
        <div class="flex-between" style="margin-top: 9px">
          <span class="price" style="font-size: 17px">¥399<small>/人起</small></span>
          <button
            class="btn-primary"
            @click="openActionModal({ type: 'inquiry', title: '政企网球趣味团建 & 研学定制', subtitle: '支持20–150人一站式策划：场馆包场+教练破冰+定点团餐+温泉', submitLabel: '提交团建定制需求' })"
          >
            预约团建
          </button>
        </div>
      </div>

      <div class="card card-pad">
        <div class="photo-box" style="height: 135px; border-radius: 0; margin-bottom: 9px">
          <img src="/images/tournament_2.jpg" alt="运动康复" />
          <span class="badge-tl">🩺 卫健认证运动康复</span>
        </div>
        <div class="flex-between">
          <strong style="font-size: 14.5px">世杰运动康复室 & 人民医院理疗</strong>
          <span class="rating-pill">★ 4.9</span>
        </div>
        <div style="font-size: 11.5px; color: var(--ink-3); margin: 4px 0 8px">网球肘防护、肩袖肌群放松与筋膜理疗（自选理疗时段）</div>
        <div class="grid-2" style="gap: 6px; margin-bottom: 8px">
          <select v-model="selectedDate" class="f-input" style="padding: 5px 8px; font-size: 11.5px">
            <option v-for="d in BOOKING_DATES" :key="d.iso" :value="d.iso">{{ d.shortDate }} {{ d.weekday }}</option>
          </select>
          <select v-model="rehabSlot" class="f-input" style="padding: 5px 8px; font-size: 11.5px">
            <option>10:00-11:00</option>
            <option>14:00-15:00</option>
            <option>16:00-17:00</option>
            <option>19:00-20:00</option>
          </select>
        </div>
        <div class="flex-between">
          <span class="price" style="font-size: 17px">¥120<small>/次</small></span>
          <button
            class="btn-orange"
            @click="createQuickOrder('课程', `运动康复理疗（${currentDateObj.shortDate} ${rehabSlot}）`, '世杰运动康复室 · 网球肘/筋膜深度松解', 120, 40)"
          >
            预约理疗时段
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
