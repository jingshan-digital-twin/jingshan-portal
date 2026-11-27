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
    <div class="modal-box" style="width: 860px; max-height: 90vh; display: flex; flex-direction: column">
      <div class="card-pad flex-between" style="background: linear-gradient(135deg, #1b1433, #3a236b); color: #fff">
        <div>
          <strong style="font-size: 19px">🎬 京山国际影城 · 在线选座购票</strong>
          <div style="font-size: 13.5px; color: rgba(255, 255, 255, 0.86); margin-top: 3px">
            📍 京山市新市街道京源大道88号文峰广场4F ｜ 距文峰球场 500m
          </div>
        </div>
        <div class="flex-row">
          <button
            class="btn-orange"
            @click="openNavigation({ placeName: '京山国际影城（文峰广场4F）', address: '京山市新市街道京源大道88号文峰广场4F', lng: 113.1162, lat: 31.0195, distance: '距文峰球场 500m', driveMin: '步行约 6 分钟', tip: '文峰广场地下车库凭影票免费停车3小时' })"
          >
            🧭 导航
          </button>
          <button class="btn-ghost" @click="state.showCinemaModal = false">✕ 关闭</button>
        </div>
      </div>

      <div class="card-pad" style="overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px">
        <!-- 影片选择 -->
        <div class="grid-3" style="gap: 14px">
          <div
            v-for="(m, idx) in CINEMA_MOVIES"
            :key="m.id"
            style="border-radius: 0; overflow: hidden; cursor: pointer; border: 2px solid var(--line)"
            :style="movieIdx === idx ? 'border-color: var(--primary); background: #EFFAF4;' : 'background: #fff;'"
            @click="movieIdx = idx"
          >
            <div class="photo-box" style="height: 108px">
              <img :src="m.poster" :alt="m.title" />
              <span class="badge-tl">★ {{ m.score }} · {{ m.duration }}</span>
            </div>
            <div style="padding: 10px 12px">
              <strong style="font-size: 15.5px; display: block">{{ m.title }}</strong>
              <span style="font-size: 13px; color: var(--ink-3)">{{ m.genre }}</span>
            </div>
          </div>
        </div>

        <!-- 场次 + 选座图 -->
        <div class="grid-2" style="gap: 20px; align-items: start">
          <div>
            <strong style="font-size: 16px; display: block; margin-bottom: 8px">
              🕒 今日排片 · 《{{ movie.title }}》
            </strong>
            <div style="font-size: 13.5px; color: var(--ink-2); margin-bottom: 10px">{{ movie.tagline }}</div>
            <div style="display: flex; flex-direction: column; gap: 8px">
              <button
                v-for="(st, idx) in movie.showtimes"
                :key="st.id"
                class="btn-ghost flex-between"
                style="padding: 11px 14px"
                :style="showtimeIdx === idx ? 'border-color: var(--primary); background: var(--primary-light); color: var(--primary);' : ''"
                @click="showtimeIdx = idx"
              >
                <span><strong>{{ st.time }}</strong> · {{ st.hall }}</span>
                <span><strong style="color: var(--accent)">¥{{ st.memberPrice }}</strong> <s style="font-size: 12.5px; color: #999">¥{{ st.price }}</s></span>
              </button>
            </div>
          </div>

          <div style="background: #f5f8f7; border: 1px solid var(--line); border-radius: 0; padding: 14px 16px">
            <div style="text-align: center; font-size: 13px; color: var(--ink-2); background: #dce7e2; border-radius: 0; padding: 5px; margin-bottom: 14px; font-weight: 700">
              银幕方向 · {{ showtime.hall }}
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; align-items: center">
              <div v-for="r in rows" :key="r" style="display: flex; align-items: center; gap: 7px">
                <span style="width: 18px; font-size: 13px; color: var(--ink-2); font-weight: 700">{{ r }}</span>
                <button
                  v-for="c in cols"
                  :key="c"
                  style="width: 32px; height: 28px; border-radius: 0; border: 1px solid #c9dad3; font-size: 12.5px; font-weight: 700"
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
            <div class="flex-between" style="font-size: 13px; color: var(--ink-2); margin-top: 12px">
              <span>⬜ 可选</span>
              <span>🟩 已选</span>
              <span>🩶 已售</span>
            </div>
          </div>
        </div>

        <div class="flex-between" style="padding-top: 12px; border-top: 1px solid var(--line)">
          <div style="font-size: 15px">
            已选座位：<strong>{{ selectedSeats.length ? selectedSeats.join('、') : '请在右侧点击选座' }}</strong>
            <span v-if="selectedSeats.length" style="margin-left: 14px">
              实付：<strong class="price">¥{{ showtime.memberPrice * selectedSeats.length }}</strong>
            </span>
          </div>
          <button class="btn-orange" style="padding: 10px 22px" @click="confirmCinemaOrder">
            确认选座并出票
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
