<script setup lang="ts">
import { computed } from 'vue'
import { VENUE_POIS } from '../mock/venuePois'
import { usePortalStore } from '../store/usePortalStore'
import type { DetailPagePayload } from '../types/portal'
import DetailLocationMap from './DetailLocationMap.vue'
import { MAP_ICONS, mapNavigationActions } from './portalMap'

const props = defineProps<{ selection: Extract<DetailPagePayload, { kind: 'map-point' }> }>()
const { state, closeDetailPage } = usePortalStore()
const point = computed(() => {
  const { source, id } = props.selection
  if (source === 'parking') {
    const lot = state.parkingLots.find(entry => entry.id === id)
    if (!lot) return
    return {
      title: lot.name, category: lot.isCharger ? '充电站' : '停车场',
      icon: lot.isCharger ? MAP_ICONS.charger : MAP_ICONS.parking,
      description: lot.note, address: lot.address, lat: lot.lat, lng: lot.lng,
      highlight: `空余 ${lot.remain} / ${lot.total} ${lot.isCharger ? '桩' : '位'}`,
    }
  }
  const poi = VENUE_POIS[source]?.find(entry => entry.name === id)
  if (!poi) return
  const nearbyCourt = state.courts.find(entry => entry.id === source)
  return {
    title: poi.name, category: poi.category, icon: poi.badgeIcon,
    description: poi.desc, address: nearbyCourt ? nearbyCourt.name + '周边' : poi.name,
    lat: poi.lat, lng: poi.lng, highlight: poi.priceOrMeta,
  }
})
const links = computed(() => {
  const p = point.value
  return p ? mapNavigationActions(p.title, p.address, p.lat, p.lng).filter(link => 'href' in link) : []
})
function navigate() {
  const link = links.value[0]
  if (link) window.open(link.href, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <main class="container stage-wrap">
    <button type="button" class="btn-ghost mb-16" @click="closeDetailPage">← 返回地图</button>
    <section v-if="point" class="card card-pad">
      <span class="tag green">{{ point.category }}</span>
      <h1>{{ point.title }}</h1>
      <p>{{ point.description }}</p>
      <p class="flex-row"><strong>{{ point.highlight }}</strong><span>📍 {{ point.address }}</span></p>
      <div class="flex-row mb-16">
        <a v-for="link in links" :key="link.label" :href="link.href" target="_blank" rel="noopener noreferrer" class="btn-ghost">{{ link.label }}</a>
      </div>
      <DetailLocationMap :title="point.title" :address="point.address" :icon="point.icon" :lat="point.lat" :lng="point.lng" @navigate="navigate" />
    </section>
    <p v-else>未找到这个地图地点。</p>
  </main>
</template>
