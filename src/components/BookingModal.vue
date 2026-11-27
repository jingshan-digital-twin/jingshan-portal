<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BOOKING_DATES, COURT_HOURS, formatHourRange } from '../mock/schedules'
import { usePortalStore } from '../store/usePortalStore'
import type { CourtUnit } from '../types/portal'

const { state, memberTier, confirmCourtBooking } = usePortalStore()

const selectedDate = ref(BOOKING_DATES[0]!.iso)
const selectedCells = ref<string[]>([]) // key: `${courtId}|${hour}`
const bookParking = ref(true)
const bookCharger = ref(true)
const usePoints = ref(false)

const currentVenue = computed(() =>
  state.bookingDraft
    ? state.courts.find((c) => c.id === state.bookingDraft?.venueId) ?? null
    : null,
)

function isNightHour(hour: string) {
  return Number(hour.split(':')[0]) >= 18
}

function getCellPrice(court: CourtUnit, hour: string) {
  const base = isNightHour(hour) ? court.nightPrice : court.dayPrice
  const member = Math.round(base * memberTier.value.discount)
  return { base, member }
}

function isOccupied(courtId: string, hour: string) {
  if (!currentVenue.value) return false
  const fullKey = `${currentVenue.value.id}|${selectedDate.value}|${courtId}|${hour}`
  return state.bookedCourtKeys.includes(fullKey)
}

function toggleCell(court: CourtUnit, hour: string) {
  if (isOccupied(court.id, hour)) return
  const key = `${court.id}|${hour}`
  const idx = selectedCells.value.indexOf(key)
  if (idx >= 0) {
    selectedCells.value.splice(idx, 1)
  } else {
    selectedCells.value.push(key)
  }
}

watch(
  () => state.bookingDraft,
  (draft) => {
    if (!draft) return
    selectedDate.value = draft.date ?? BOOKING_DATES[0]!.iso
    bookParking.value = true
    bookCharger.value = true
    usePoints.value = false
    selectedCells.value = []

    const venue = state.courts.find((c) => c.id === draft.venueId)
    if (venue && venue.courts.length > 0) {
      const targetCourt =
        venue.courts.find((ct) => ct.id === draft.courtId) ?? venue.courts[0]!
      const targetHour = COURT_HOURS.includes(draft.slotTime as (typeof COURT_HOURS)[number])
        ? draft.slotTime
        : '16:00'
      const occupiedKey = `${venue.id}|${selectedDate.value}|${targetCourt.id}|${targetHour}`
      if (!state.bookedCourtKeys.includes(occupiedKey)) {
        selectedCells.value = [`${targetCourt.id}|${targetHour}`]
      }
    }
  },
)

watch(selectedDate, () => {
  selectedCells.value = []
})

const selectedSlotDetails = computed(() => {
  if (!currentVenue.value) return []
  return selectedCells.value
    .map((key) => {
      const [courtId, hour] = key.split('|')
      const court = currentVenue.value!.courts.find((c) => c.id === courtId)
      if (!court || !hour) return null
      const { base, member } = getCellPrice(court, hour)
      return {
        courtId: court.id,
        courtName: court.name,
        hour,
        price: base,
        memberPrice: member,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.courtName.localeCompare(b.courtName) || a.hour.localeCompare(b.hour))
})

const totalOriginal = computed(() =>
  selectedSlotDetails.value.reduce((s, item) => s + item.price, 0),
)
const totalMember = computed(() =>
  selectedSlotDetails.value.reduce((s, item) => s + item.memberPrice, 0),
)
const finalPay = computed(() => {
  const pts = usePoints.value && state.points >= 200 ? 20 : 0
  return Math.max(0, totalMember.value - pts)
})

function submitBooking() {
  if (selectedSlotDetails.value.length === 0) return
  confirmCourtBooking({
    date: selectedDate.value,
    selectedSlots: selectedSlotDetails.value,
    bookParking: bookParking.value,
    bookCharger: bookCharger.value,
    usePoints: usePoints.value,
  })
}
</script>

<template>
  <div v-if="state.bookingDraft && currentVenue" class="modal-backdrop" @click.self="state.bookingDraft = null">
    <div class="modal-box" style="width: 960px; max-height: 92vh; display: flex; flex-direction: column">
      <!-- 顶栏 -->
      <div class="card-pad flex-between" style="background: #0d3c2e; color: #fff; flex-shrink: 0">
        <div>
          <strong style="font-size: 18.5px">🎾 选择预约日期、场地编号与时段</strong>
          <div style="font-size: 13.5px; color: rgba(255, 255, 255, 0.86); margin-top: 3px">
            {{ currentVenue.name }} ｜ {{ currentVenue.openHours }}
          </div>
        </div>
        <button class="btn-ghost" @click="state.bookingDraft = null">✕ 关闭</button>
      </div>

      <!-- 主体 -->
      <div class="card-pad" style="overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 15px">
        <!-- 7日日期选择条 -->
        <div>
          <div class="flex-between" style="margin-bottom: 8px">
            <strong style="font-size: 15.5px">📅 第一步：选择预约日期</strong>
            <div class="flex-row" style="font-size: 13px; color: var(--ink-2)">
              <span class="slot-legend-dot free" /> 可预订
              <span class="slot-legend-dot picked" /> 已选
              <span class="slot-legend-dot busy" /> 已订
            </div>
          </div>
          <div class="date-strip-7">
            <button
              v-for="d in BOOKING_DATES"
              :key="d.iso"
              class="date-chip"
              :class="{ active: selectedDate === d.iso }"
              @click="selectedDate = d.iso"
            >
              <strong>{{ d.weekday }}</strong>
              <span>{{ d.shortDate }}</span>
            </button>
          </div>
        </div>

        <!-- 场地 × 小时 实时选场矩阵 -->
        <div>
          <div class="flex-between" style="margin-bottom: 8px">
            <strong style="font-size: 15.5px">🏟️ 第二步：点击选择场地与小时时段</strong>
            <span class="tag green">{{ memberTier.code }} {{ memberTier.name }}享 {{ Math.round(memberTier.discount * 100) / 10 }} 折</span>
          </div>

          <div class="court-matrix-wrap">
            <table class="court-matrix">
              <thead>
                <tr>
                  <th style="width: 156px; text-align: left">场地 / 时段</th>
                  <th v-for="h in COURT_HOURS" :key="h">{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="court in currentVenue.courts" :key="court.id">
                  <td class="court-matrix-name">
                    <strong>{{ court.name }}</strong>
                    <span>{{ court.surface }} · {{ court.env }}</span>
                  </td>
                  <td v-for="h in COURT_HOURS" :key="h" style="padding: 3px">
                    <button
                      type="button"
                      class="matrix-cell"
                      :class="{
                        busy: isOccupied(court.id, h),
                        picked: selectedCells.includes(`${court.id}|${h}`),
                        free: !isOccupied(court.id, h) && !selectedCells.includes(`${court.id}|${h}`),
                      }"
                      :disabled="isOccupied(court.id, h)"
                      :title="`${court.name} ${formatHourRange(h)}`"
                      @click="toggleCell(court, h)"
                    >
                      <template v-if="isOccupied(court.id, h)">已订</template>
                      <template v-else-if="getCellPrice(court, h).member === 0">免费</template>
                      <template v-else>¥{{ getCellPrice(court, h).member }}</template>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 已选明细 -->
        <div class="selected-slots-bar">
          <div style="font-size: 14px; font-weight: 800; color: var(--ink); margin-bottom: 6px">
            ✅ 已选时段（{{ selectedSlotDetails.length }} 小时）：
          </div>
          <div v-if="selectedSlotDetails.length === 0" style="font-size: 13.5px; color: var(--ink-3)">
            请在上方网格点击至少一个空闲时段
          </div>
          <div v-else class="flex-row" style="gap: 8px">
            <span
              v-for="s in selectedSlotDetails"
              :key="`${s.courtId}-${s.hour}`"
              class="tag green"
              style="padding: 5px 11px; cursor: pointer"
              title="点击移除该时段"
              @click="selectedCells = selectedCells.filter((k) => k !== `${s.courtId}|${s.hour}`)"
            >
              {{ BOOKING_DATES.find((d) => d.iso === selectedDate)?.shortDate }} {{ s.courtName }} {{ formatHourRange(s.hour) }}（¥{{ s.memberPrice }}）✕
            </span>
          </div>
        </div>

        <!-- 车位/充电桩/积分联动 -->
        <div class="grid-3" style="gap: 10px">
          <label class="flex-between" style="background: #eef6ff; padding: 11px 13px; border-radius: 0; cursor: pointer">
            <span style="font-size: 13.5px; font-weight: 700; color: #164c96">
              <input v-model="bookParking" type="checkbox" style="margin-right: 6px" />
              🅿️ {{ currentVenue.parkingName }}
            </span>
            <span class="tag blue">免费</span>
          </label>

          <label class="flex-between" style="background: #eef6ff; padding: 11px 13px; border-radius: 0; cursor: pointer">
            <span style="font-size: 13.5px; font-weight: 700; color: #164c96">
              <input v-model="bookCharger" type="checkbox" style="margin-right: 6px" />
              ⚡ {{ currentVenue.chargerName }}
            </span>
            <span class="tag green">联动</span>
          </label>

          <label
            v-if="state.points >= 200"
            class="flex-between"
            style="background: #fff8eb; padding: 11px 13px; border-radius: 0; cursor: pointer"
          >
            <span style="font-size: 13.5px; font-weight: 700; color: #7a4d04">
              <input v-model="usePoints" type="checkbox" style="margin-right: 6px" />
              👑 200积分抵¥20
            </span>
            <span class="tag gold">-¥20</span>
          </label>
        </div>

        <!-- 底部确认栏 -->
        <div class="flex-between" style="padding-top: 12px; border-top: 1px solid var(--line)">
          <div style="font-size: 15px">
            实付金额：
            <strong class="price">¥{{ finalPay }}</strong>
            <s v-if="totalOriginal > totalMember" style="font-size: 13.5px; color: var(--ink-3); margin-left: 8px">原价 ¥{{ totalOriginal }}</s>
            <span style="font-size: 13px; color: var(--primary); margin-left: 10px">
              开场前2h免费取消
            </span>
          </div>
          <div class="flex-row">
            <button class="btn-ghost" @click="state.bookingDraft = null">取消</button>
            <button
              class="btn-orange"
              :disabled="selectedSlotDetails.length === 0"
              :style="selectedSlotDetails.length === 0 ? 'opacity: 0.5; cursor: not-allowed' : ''"
              @click="submitBooking"
            >
              确认预约（{{ selectedSlotDetails.length }} 时段）
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
