<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CINEMA_MOVIES } from '../mock/details'
import { usePortalStore } from '../store/usePortalStore'

const { state, createQuickOrder, openNavigation, showToast } = usePortalStore()

const movieIdx = ref(0)
const showtimeIdx = ref(0)
const selectedSeats = ref<string[]>([])

const movie = computed(() => CINEMA_MOVIES[movieIdx.value] ?? CINEMA_MOVIES[0]!)
const showtime = computed(() => movie.value.showtimes[showtimeIdx.value] ?? movie.value.showtimes[0]!)

watch(movieIdx, () => {
  showtimeIdx.value = 0
  selectedSeats.value = []
})
watch(showtimeIdx, () => {
  selectedSeats.value = []
})

const rows = ['A', 'B', 'C', 'D', 'E']
const cols = [1, 2, 3, 4, 5, 6, 7, 8]

function toggleSeat(seatId: string) {
  if (showtime.value.takenSeats.includes(seatId)) return
  const idx = selectedSeats.value.indexOf(seatId)
  if (idx >= 0) selectedSeats.value.splice(idx, 1)
  else if (selectedSeats.value.length >= 4) showToast('单次最多选择 4 个座位')
  else selectedSeats.value.push(seatId)
}

function confirmCinemaOrder() {
  if (!selectedSeats.value.length) {
    showToast('请先在下方座位图点击选择至少 1 个空座位')
    return
  }
  const total = showtime.value.memberPrice * selectedSeats.value.length
  createQuickOrder(
    '门票',
    `京山国际影城 · 《${movie.value.title}》(${selectedSeats.value.length}张)`,
    `今日 ${showtime.value.time} ${showtime.value.hall} · 座位：${selectedSeats.value.join('、')}`,
    total,
    30,
  )
  state.showCinemaModal = false
  selectedSeats.value = []
}
</script>

<template>
  <div v-if="state.showCinemaModal" class="modal-backdrop" @click.self="state.showCinemaModal = false">
    <div class="modal-box" style="width: 820px; max-height: 90vh; display: flex; flex-direction: column">
      <div class="card-pad flex-between" style="background: linear-gradient(135deg, #1b1433, #3a236b); color: #fff">
        <div>
          <strong style="font-size: 17px">🎬 京山国际影城（IMAX / 杜比激光厅）· 在线选座购票</strong>
          <div style="font-size: 11.5px; color: rgba(255, 255, 255, 0.82); margin-top: 2px">
            📍 京山市新市街道京源大道88号文峰广场4F ｜ 🌐 113.1162°E, 31.0195°N ｜ 距文峰公园球场 500m
          </div>
        </div>
        <div class="flex-row">
          <button
            class="btn-orange"
            style="padding: 5px 10px; font-size: 11.5px"
            @click="openNavigation({ placeName: '京山国际影城（文峰广场4F）', address: '京山市新市街道京源大道88号文峰广场4F', lng: 113.1162, lat: 31.0195, distance: '距文峰球场 500m', driveMin: '步行约 6 分钟', tip: '文峰广场地下车库凭影票免费停车3小时' })"
          >
            🧭 导航前往
          </button>
          <button class="btn-ghost" @click="state.showCinemaModal = false">✕ 关闭</button>
        </div>
      </div>

      <div class="card-pad" style="overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px">
        <!-- 影片选择 -->
        <div class="grid-3" style="gap: 12px">
          <div
            v-for="(m, idx) in CINEMA_MOVIES"
            :key="m.id"
            style="border-radius: 13px; overflow: hidden; cursor: pointer; border: 2px solid var(--line)"
            :style="movieIdx === idx ? 'border-color: var(--primary); background: #EFFAF4;' : 'background: #fff;'"
            @click="movieIdx = idx"
          >
            <div class="photo-box" style="height: 98px">
              <img :src="m.poster" :alt="m.title" />
              <span class="badge-tl">★ {{ m.score }}</span>
              <span class="badge-bl">{{ m.duration }}</span>
            </div>
            <div style="padding: 8px 10px">
              <strong style="font-size: 13.5px; display: block">{{ m.title }}</strong>
              <span style="font-size: 10.5px; color: var(--ink-3)">{{ m.genre }}</span>
            </div>
          </div>
        </div>

        <!-- 场次 + 选座图 -->
        <div class="grid-2" style="gap: 18px; align-items: start">
          <div>
            <strong style="font-size: 14px; display: block; margin-bottom: 8px">
              🕒 今日排片场次 · 《{{ movie.title }}》
            </strong>
            <div style="font-size: 11.5px; color: var(--ink-3); margin-bottom: 8px">{{ movie.tagline }}</div>
            <div style="display: flex; flex-direction: column; gap: 7px">
              <button
                v-for="(st, idx) in movie.showtimes"
                :key="st.id"
                class="btn-ghost flex-between"
                style="padding: 9px 12px"
                :style="showtimeIdx === idx ? 'border-color: var(--primary); background: var(--primary-light); color: var(--primary);' : ''"
                @click="showtimeIdx = idx"
              >
                <span><strong>{{ st.time }}</strong> · {{ st.hall }}（{{ st.type }}）</span>
                <span><strong style="color: var(--accent)">¥{{ st.memberPrice }}</strong> <s style="font-size: 10.5px; color: #999">¥{{ st.price }}</s></span>
              </button>
            </div>
          </div>

          <div style="background: #f5f8f7; border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px">
            <div style="text-align: center; font-size: 11px; color: var(--ink-3); background: #dce7e2; border-radius: 99px; padding: 3px; margin-bottom: 12px">
              银幕方向 · {{ showtime.hall }}
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; align-items: center">
              <div v-for="r in rows" :key="r" style="display: flex; align-items: center; gap: 6px">
                <span style="width: 14px; font-size: 10.5px; color: var(--ink-3); font-weight: 700">{{ r }}</span>
                <button
                  v-for="c in cols"
                  :key="c"
                  style="width: 28px; height: 24px; border-radius: 6px; border: 1px solid #c9dad3; font-size: 10px; font-weight: 700"
                  :style="
                    showtime.takenSeats.includes(`${r}${c}`)
                      ? 'background: #D6DEDC; color: #8B9B95; cursor: not-allowed;'
                      : selectedSeats.includes(`${r}${c}`)
                        ? 'background: #0D7A58; color: #fff; border-color: #0D7A58;'
                        : 'background: #fff; color: var(--ink-2);'
                  "
                  @click="toggleSeat(`${r}${c}`)"
                >
                  {{ c }}
                </button>
              </div>
            </div>
            <div class="flex-between" style="font-size: 10.5px; color: var(--ink-3); margin-top: 10px">
              <span>⬜ 可选空座</span>
              <span>🟩 已选座位</span>
              <span>🩶 已售出</span>
            </div>
          </div>
        </div>

        <div class="flex-between" style="padding-top: 10px; border-top: 1px solid var(--line)">
          <div style="font-size: 13px">
            已选座位：<strong>{{ selectedSeats.length ? selectedSeats.join('、') : '请在右侧点击选座' }}</strong>
            <span v-if="selectedSeats.length" style="margin-left: 12px">
              实付：<strong class="price">¥{{ showtime.memberPrice * selectedSeats.length }}</strong>
            </span>
          </div>
          <button class="btn-orange" style="padding: 9px 20px" @click="confirmCinemaOrder">
            确认选座并出票
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
