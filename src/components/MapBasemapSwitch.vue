<script setup lang="ts">
import type { MapBasemap } from './portalMap'

const model = defineModel<MapBasemap>({ required: true })
</script>

<template>
  <div class="portal-map-toolbar" role="group" aria-label="底图样式">
    <button type="button" class="btn-ghost" :aria-pressed="model === 'vector'" @click="model = 'vector'">标准地图</button>
    <button type="button" class="btn-ghost" :aria-pressed="model === 'satellite'" @click="model = 'satellite'">卫星影像</button>
    <slot />
  </div>
</template>
