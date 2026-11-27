<script setup lang="ts">
import { computed, ref } from 'vue'
import { HOTEL_PROFILES } from '../mock/details'
import { BOOKING_DATES } from '../mock/schedules'
import { isBookingQuantity } from '../store/reservationFlow'
import { usePortalStore } from '../store/usePortalStore'

const { state, createQuickOrder, openNavigation, toggleFavorite } = usePortalStore()

const checkIn = ref(BOOKING_DATES[0]!.iso)
const checkOut = ref(BOOKING_DATES[2]!.iso)
const roomCount = ref<number | ''>(1)
const roomQuantity = computed(() => isBookingQuantity(roomCount.value) ? roomCount.value : 0)

const nights = computed(() => {
  const s = new Date(checkIn.value).getTime()
  const e = new Date(checkOut.value).getTime()
  return Math.max(1, Math.round((e - s) / 86400000))
})

const hotel = computed(() =>
  HOTEL_PROFILES.find((h) => h.id === state.activeHotelId) ?? null,
)

function close() {
  state.activeHotelId = null
}

async function bookRoom(room: NonNullable<typeof hotel.value>['rooms'][number]) {
  if (!hotel.value) return
  const count = roomCount.value
  if (!isBookingQuantity(count, room.remaining)) return
  const isLongTerm = room.leaseUnit === '/月' || room.leaseUnit === '/周'
  const total = room.eventPrice * count * (isLongTerm ? 1 : nights.value)
  const inLabel = BOOKING_DATES.find((d) => d.iso === checkIn.value)?.shortDate ?? checkIn.value
  const outLabel = BOOKING_DATES.find((d) => d.iso === checkOut.value)?.shortDate ?? checkOut.value
  const periodDesc = isLongTerm
    ? `${inLabel}起租 · ${count}套`
    : `${inLabel}入住 - ${outLabel}离店（共${nights.value}晚 × ${count}间）`
  const booked = await createQuickOrder(
    '住宿',
    `${hotel.value.name} · ${room.name}`,
    `${periodDesc} · ${room.breakfast} · 票根专享价`,
    total,
    60 * count,
  )
  if (booked) close()
}
</script>

<template>
  <div v-if="hotel" class="modal-backdrop" @click.self="close">
    <div class="modal-box" style="width: 860px; max-height: 90vh; display: flex; flex-direction: column">
      <div style="display: grid; grid-template-columns: 280px 1fr; background: #0d3629; color: #fff">
        <div class="photo-box" style="height: 220px; cursor: default">
          <img :src="hotel.photo" :alt="hotel.name" />
          <span class="badge-tl">{{ hotel.badge }}</span>
          <span class="badge-bl">★ {{ hotel.rating }}</span>
        </div>
        <div class="card-pad" style="display: flex; flex-direction: column; justify-content: space-between">
          <div>
            <div class="flex-between" style="margin-bottom: 8px">
              <strong style="font-size: 20px">{{ hotel.name }}</strong>
              <button class="btn-ghost" @click="close">✕ 关闭</button>
            </div>
            <div style="font-size: 13.5px; color: rgba(255, 255, 255, 0.88); line-height: 1.75">
              📍 地址：{{ hotel.address }}<br />
              📞 {{ hotel.phone }} ｜ 🎾 {{ hotel.distanceToCourt }}
            </div>
          </div>
          <div class="flex-row" style="margin-top: 10px">
            <button
              class="btn-orange"
              @click="openNavigation({ placeName: hotel.name, address: hotel.address, lng: hotel.lng, lat: hotel.lat, distance: hotel.distanceToCourt, driveMin: '约 5 分钟', tip: '导航已关联停车场入口，支持赛期摆渡车接送' })"
            >
              🧭 导航前往
            </button>
            <button class="btn-ghost" @click="toggleFavorite(hotel.name)">
              {{ state.favorites.includes(hotel.name) ? '❤️ 已收藏' : '🤍 收藏' }}
            </button>
          </div>
        </div>
      </div>

      <div class="card-pad" style="overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px">
        <!-- 酒店简介与配套设施 -->
        <div>
          <div style="font-size: 14.5px; color: var(--ink-2); margin-bottom: 10px">{{ hotel.intro }}</div>
          <div class="flex-row">
            <span v-for="f in hotel.facilities" :key="f" class="tag green">✔ {{ f }}</span>
          </div>
        </div>

        <!-- 完整房型与价格表 -->
        <div>
          <div class="flex-between" style="margin-bottom: 12px; background: #f3faf6; padding: 11px 14px; border-radius: 0; border: 1px solid #d5e8df">
            <strong style="font-size: 16px">🛏️ 选择日期与房型（共 {{ hotel.rooms.length }} 种）</strong>
            <div class="flex-row">
              <select v-model="checkIn" class="f-input" style="width: 142px; padding: 6px 10px">
                <option v-for="d in BOOKING_DATES.slice(0, 6)" :key="`mi-${d.iso}`" :value="d.iso">入住 {{ d.shortDate }}</option>
              </select>
              <select v-model="checkOut" class="f-input" style="width: 142px; padding: 6px 10px">
                <option v-for="d in BOOKING_DATES.slice(1)" :key="`mo-${d.iso}`" :value="d.iso">离店 {{ d.shortDate }}</option>
              </select>
              <input v-model.number="roomCount" type="number" min="1" step="1" aria-label="房间数量" class="f-input" style="width: 88px; padding: 6px 10px" />
              <span class="tag green">共 {{ nights }} 晚</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px">
            <div
              v-for="room in hotel.rooms"
              :key="room.id"
              class="flex-between"
              style="border: 1px solid var(--line); border-radius: 0; padding: 13px 16px; background: #fafdfc"
            >
              <div>
                <strong style="font-size: 16px">{{ room.name }}</strong>
                <span class="tag blue" style="margin-left: 8px">{{ room.area }}</span>
                <span class="tag orange" style="margin-left: 6px">余 {{ room.remaining }} 间</span>
                <div style="font-size: 13.5px; color: var(--ink-2); margin-top: 5px">
                  🛏️ {{ room.bed }} ｜ 🍳 {{ room.breakfast }} ｜ 🔄 {{ room.cancelRule }}
                </div>
              </div>
              <div class="flex-row" style="gap: 14px">
                <div style="text-align: right">
                  <div class="price" style="font-size: 21px">
                    {{ roomQuantity ? `¥${room.eventPrice * roomQuantity * (room.leaseUnit === '/月' || room.leaseUnit === '/周' ? 1 : nights)}` : '—' }}
                    <small>{{ room.leaseUnit === '/月' || room.leaseUnit === '/周' ? room.leaseUnit : `/${nights}晚` }}</small>
                  </div>
                  <div style="font-size: 13px; color: var(--ink-3)">单价 ¥{{ room.eventPrice }}{{ room.leaseUnit ?? '/晚' }}</div>
                </div>
                <button class="btn-orange booking-count-submit" :disabled="!isBookingQuantity(roomCount, room.remaining)" @click="bookRoom(room)">
                  {{ isBookingQuantity(roomCount, room.remaining) ? '立即预订' : '请调整预订数量' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 入住政策 + 真实评价 -->
        <div class="grid-2" style="gap: 14px">
          <div style="background: #f6faf8; border-radius: 0; padding: 13px 15px; font-size: 13.5px; color: var(--ink-2)">
            <strong style="font-size: 15px; display: block; margin-bottom: 6px">📋 入住与退改政策</strong>
            <div v-for="(p, i) in hotel.policies" :key="i" style="margin-bottom: 5px">• {{ p }}</div>
          </div>
          <div style="background: #fffaf2; border-radius: 0; padding: 13px 15px; font-size: 13.5px; color: var(--ink-2)">
            <strong style="font-size: 15px; display: block; margin-bottom: 6px">💬 住客评价</strong>
            <div v-for="(rev, i) in hotel.reviews" :key="i" style="margin-bottom: 7px">
              <strong>{{ rev.user }}</strong>（★{{ rev.score }}）：{{ rev.content }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
