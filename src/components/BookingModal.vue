<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePortalStore } from '../store/usePortalStore'

const { state, memberTier, confirmCourtBooking } = usePortalStore()

const bookParking = ref(true)
const bookCharger = ref(true)
const usePoints = ref(false)

watch(
  () => state.bookingDraft,
  () => {
    bookParking.value = true
    bookCharger.value = true
    usePoints.value = false
  },
)
</script>

<template>
  <div v-if="state.bookingDraft" class="modal-backdrop" @click.self="state.bookingDraft = null">
    <div class="modal-box">
      <div class="card-pad flex-between" style="background: #0d3c2e; color: #fff">
        <div>
          <strong style="font-size: 16px">🎾 在线订场与配套联动预约</strong>
          <div style="font-size: 11.5px; color: rgba(255, 255, 255, 0.8)">
            {{ state.bookingDraft.venueName }} · 今日 {{ state.bookingDraft.slotTime }}
          </div>
        </div>
        <button class="btn-ghost" @click="state.bookingDraft = null">✕ 关闭</button>
      </div>

      <div class="card-pad" style="display: flex; flex-direction: column; gap: 12px">
        <div class="flex-between" style="background: #f5faf8; padding: 10px 12px; border-radius: 10px">
          <div>
            <strong>场地费（{{ memberTier.code }} {{ memberTier.name }}专享价）</strong>
            <div style="font-size: 11px; color: var(--ink-3)">支持开场前 2 小时免费取消 · 完场赠 +50 积分与电子票根</div>
          </div>
          <span class="price">¥{{ state.bookingDraft.memberPrice }}<small>原价¥{{ state.bookingDraft.price }}</small></span>
        </div>

        <label class="flex-between" style="background: #eef6ff; padding: 10px 12px; border-radius: 10px; cursor: pointer">
          <span style="font-size: 12.5px; font-weight: 700; color: #164c96">
            <input v-model="bookParking" type="checkbox" style="margin-right: 6px" />
            🅿️ 同步提前预约停车场：{{ state.bookingDraft.parkingName }}
          </span>
          <span class="tag blue">免费锁位</span>
        </label>

        <label class="flex-between" style="background: #eef6ff; padding: 10px 12px; border-radius: 10px; cursor: pointer">
          <span style="font-size: 12.5px; font-weight: 700; color: #164c96">
            <input v-model="bookCharger" type="checkbox" style="margin-right: 6px" />
            ⚡ 同步提前预约充电桩：{{ state.bookingDraft.chargerName }}
          </span>
          <span class="tag green">打球同步充满</span>
        </label>

        <label
          v-if="state.points >= 200"
          class="flex-between"
          style="background: #fff8eb; padding: 10px 12px; border-radius: 10px; cursor: pointer"
        >
          <span style="font-size: 12.5px; font-weight: 700; color: #7a4d04">
            <input v-model="usePoints" type="checkbox" style="margin-right: 6px" />
            👑 使用 200 金网积分抵现 ¥20（当前可用 {{ state.points }} 分）
          </span>
          <span class="tag gold">-¥20</span>
        </label>

        <div class="flex-between" style="padding-top: 8px; border-top: 1px solid var(--line)">
          <div>
            实付金额：
            <strong class="price">
              ¥{{ Math.max(0, state.bookingDraft.memberPrice - (usePoints ? 20 : 0)) }}
            </strong>
          </div>
          <div class="flex-row">
            <button class="btn-ghost" @click="state.bookingDraft = null">取消</button>
            <button
              class="btn-orange"
              @click="confirmCourtBooking({ bookParking, bookCharger, usePoints })"
            >
              确认支付并锁场锁桩
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
