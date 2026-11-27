<script setup lang="ts">
import { computed } from 'vue'
import { HOTEL_PROFILES } from '../mock/details'
import { usePortalStore } from '../store/usePortalStore'

const { state, createQuickOrder, openNavigation, toggleFavorite } = usePortalStore()

const hotel = computed(() =>
  HOTEL_PROFILES.find((h) => h.id === state.activeHotelId) ?? null,
)

function close() {
  state.activeHotelId = null
}
</script>

<template>
  <div v-if="hotel" class="modal-backdrop" @click.self="close">
    <div class="modal-box" style="width: 820px; max-height: 90vh; display: flex; flex-direction: column">
      <div style="display: grid; grid-template-columns: 280px 1fr; background: #0d3629; color: #fff">
        <div class="photo-box" style="height: 205px; cursor: default">
          <img :src="hotel.photo" :alt="hotel.name" />
          <span class="badge-tl">{{ hotel.badge }}</span>
          <span class="badge-bl">★ {{ hotel.rating }} ({{ hotel.reviewCount }}评)</span>
        </div>
        <div class="card-pad" style="display: flex; flex-direction: column; justify-content: space-between">
          <div>
            <div class="flex-between" style="margin-bottom: 6px">
              <strong style="font-size: 18px">{{ hotel.name }}</strong>
              <button class="btn-ghost" style="padding: 4px 10px" @click="close">✕ 关闭</button>
            </div>
            <div style="font-size: 11.5px; color: rgba(255, 255, 255, 0.86); line-height: 1.7">
              📍 地址：{{ hotel.address }}<br />
              🌐 坐标：{{ hotel.lng.toFixed(4) }}°E, {{ hotel.lat.toFixed(4) }}°N ｜ 📞 {{ hotel.phone }} ｜ {{ hotel.openYear }}<br />
              🎾 球场距离：{{ hotel.distanceToCourt }}
            </div>
          </div>
          <div class="flex-between" style="margin-top: 8px">
            <div class="flex-row">
              <button
                class="btn-orange"
                style="padding: 5px 11px; font-size: 11.5px"
                @click="openNavigation({ placeName: hotel.name, address: hotel.address, lng: hotel.lng, lat: hotel.lat, distance: hotel.distanceToCourt, driveMin: '约 5 分钟', tip: '导航已关联停车场入口，支持赛期摆渡车接送' })"
              >
                🧭 高德/百度导航前往
              </button>
              <button class="btn-ghost" style="padding: 5px 11px; font-size: 11.5px" @click="toggleFavorite(hotel.name)">
                {{ state.favorites.includes(hotel.name) ? '❤️ 已收藏' : '🤍 收藏酒店' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card-pad" style="overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px">
        <!-- 酒店简介与配套设施 -->
        <div>
          <div style="font-size: 12.5px; color: var(--ink-2); margin-bottom: 8px">{{ hotel.intro }}</div>
          <div class="flex-row">
            <span v-for="f in hotel.facilities" :key="f" class="tag green">✔ {{ f }}</span>
          </div>
        </div>

        <!-- 完整房型与价格表 -->
        <div>
          <strong style="font-size: 15px; display: block; margin-bottom: 8px">🛏️ 全部可选房型与实时价格（共 {{ hotel.rooms.length }} 种房型）</strong>
          <div style="display: flex; flex-direction: column; gap: 9px">
            <div
              v-for="room in hotel.rooms"
              :key="room.id"
              class="flex-between"
              style="border: 1px solid var(--line); border-radius: 12px; padding: 11px 14px; background: #fafdfc"
            >
              <div>
                <strong style="font-size: 14px">{{ room.name }}</strong>
                <span class="tag blue" style="margin-left: 6px">{{ room.area }}</span>
                <span class="tag orange" style="margin-left: 4px">仅剩 {{ room.remaining }} 间</span>
                <div style="font-size: 11.5px; color: var(--ink-3); margin-top: 3px">
                  🛏️ {{ room.bed }} ｜ 🍳 {{ room.breakfast }} ｜ 🔄 {{ room.cancelRule }}
                </div>
              </div>
              <div class="flex-row" style="gap: 12px">
                <div style="text-align: right">
                  <div class="price" style="font-size: 19px">
                    ¥{{ room.eventPrice }}<small>{{ room.leaseUnit ?? '/晚' }}</small>
                  </div>
                  <div style="font-size: 11px; color: var(--ink-3)"><s>原价 ¥{{ room.originalPrice }}</s> · 票根专享</div>
                </div>
                <button
                  class="btn-orange"
                  @click="
                    createQuickOrder('住宿', `${hotel.name} · ${room.name}`, `${room.area} · ${room.breakfast} · 票根专享价`, room.eventPrice, 60);
                    close()
                  "
                >
                  立即预订
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 入住政策 + 真实评价 -->
        <div class="grid-2" style="gap: 12px">
          <div style="background: #f6faf8; border-radius: 12px; padding: 11px 13px; font-size: 11.5px; color: var(--ink-2)">
            <strong style="font-size: 13px; display: block; margin-bottom: 5px">📋 入住与退改政策</strong>
            <div v-for="(p, i) in hotel.policies" :key="i" style="margin-bottom: 4px">• {{ p }}</div>
          </div>
          <div style="background: #fffaf2; border-radius: 12px; padding: 11px 13px; font-size: 11.5px; color: var(--ink-2)">
            <strong style="font-size: 13px; display: block; margin-bottom: 5px">💬 住客真实评价</strong>
            <div v-for="(rev, i) in hotel.reviews" :key="i" style="margin-bottom: 6px">
              <strong>{{ rev.user }}</strong>（★{{ rev.score }} · {{ rev.room }}）：{{ rev.content }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
