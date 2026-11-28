<script setup lang="ts">
import { usePortalStore } from '../store/usePortalStore'
import type { ModuleId } from '../types/portal'

defineProps<{
  overlaid?: boolean
}>()

const { state, switchModule } = usePortalStore()

interface ChannelTile {
  id: ModuleId
  title: string
  bg: string
  badge?: string
  badgeBg?: string
}

const mainTiles: ChannelTile[] = [
  { id: 2, title: '打 · 场地服务', bg: 'linear-gradient(135deg,#10996D,#0A6B4D)' },
  { id: 3, title: '游 · 旅游游览', bg: 'linear-gradient(135deg,#2EB36A,#168249)' },
  { id: 4, title: '吃 · 美食服务', bg: 'linear-gradient(135deg,#F25C43,#C93722)' },
  { id: 5, title: '住 · 住宿服务', bg: 'linear-gradient(135deg,#3385F0,#195CC2)' },
  { id: 6, title: '行 · 出行服务', bg: 'linear-gradient(135deg,#5A6FE8,#394AC2)' },
  { id: 7, title: '购 · 特色商品', bg: 'linear-gradient(135deg,#F0A71E,#D17D08)' },
  { id: 8, title: '娱 · 休闲娱乐', bg: 'linear-gradient(135deg,#9B5DE5,#6E35B8)' },
  { id: 9, title: '训 · 培训研学', bg: 'linear-gradient(135deg,#169B9E,#0D7278)', badge: '省网校', badgeBg: '#0D7278' },
]

function isTileActive(id: ModuleId): boolean {
  return state.isStandalonePage && state.activeModule === id
}
</script>

<template>
  <nav class="top-channel-bar" :class="{ 'is-overlaid': overlaid }" aria-label="核心服务频道导航">
    <div class="container">
      <div class="kk-row-main">
        <button
          v-for="m in mainTiles"
          :key="m.id"
          type="button"
          class="kk-btn"
          :class="{ active: isTileActive(m.id) }"
          :aria-current="isTileActive(m.id) ? 'page' : undefined"
          @click="switchModule(m.id)"
        >
          <div class="kk-icon" :style="{ background: m.bg }">
            <span v-if="m.badge" class="kk-badge" :style="{ background: m.badgeBg }">{{ m.badge }}</span>
            <svg v-if="m.id === 2" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M5.5 6.8c3.3 2.5 3.3 7.9 0 10.4M18.5 6.8c-3.3 2.5-3.3 7.9 0 10.4" />
            </svg>
            <svg v-else-if="m.id === 3" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 20l6-11 4 6 3-4 5 9H3z" />
              <circle cx="17" cy="6" r="2" />
            </svg>
            <svg v-else-if="m.id === 4" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 11h18M5 11a7 7 0 0 0 14 0M8 6c0-1.5 1-2 1-3M12 6c0-1.5 1-2 1-3M16 6c0-1.5 1-2 1-3M7 20h10" />
            </svg>
            <svg v-else-if="m.id === 5" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
            </svg>
            <svg v-else-if="m.id === 6" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="5" width="16" height="11" rx="3" />
              <path d="M4 11h16M7 19h2M15 19h2" />
            </svg>
            <svg v-else-if="m.id === 7" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 7h12l1 13H5L6 7z" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
            </svg>
            <svg v-else-if="m.id === 8" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 10h.01M15 10h.01M8.5 15a4 4 0 0 0 7 0" />
            </svg>
            <svg v-else width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10L12 5 2 10l10 5 10-5z" />
              <path d="M6 12v5c3 2 9 2 12 0v-5" />
            </svg>
          </div>
          <div class="kk-label">{{ m.title }}</div>
        </button>
      </div>
    </div>
  </nav>
</template>
