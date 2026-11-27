<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

export interface MapResultItem {
  id: string
  title: string
  photo?: string
  description?: string
  location?: string
  highlight?: string
}

const props = defineProps<{
  items: MapResultItem[]
  listLabel: string
  emptyText: string
  selectedId?: string
}>()
const emit = defineEmits<{ select: [id: string] }>()
const list = ref<HTMLDivElement>()

watch(() => props.selectedId, async (id) => {
  if (!id) return
  await nextTick()
  const container = list.value
  const selected = container?.querySelector<HTMLElement>('[aria-pressed="true"]')
  if (!container || !selected) return
  if (selected.offsetTop < container.scrollTop) {
    container.scrollTop = selected.offsetTop
  } else if (selected.offsetTop + selected.offsetHeight > container.scrollTop + container.clientHeight) {
    container.scrollTop = selected.offsetTop + selected.offsetHeight - container.clientHeight
  }
}, { immediate: true })
</script>

<template>
  <div class="map-results-layout">
    <div class="map-results-side">
      <div ref="list" class="map-results-list" role="region" :aria-label="listLabel" tabindex="0">
        <p v-if="!items.length" class="map-results-empty">{{ emptyText }}</p>
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="map-result-item"
          :class="{ 'map-result-with-photo': item.photo }"
          :aria-pressed="selectedId === item.id"
          @click="emit('select', item.id)"
        >
          <img v-if="item.photo" :src="item.photo" alt="" />
          <span>
            <strong>{{ item.title }}</strong>
            <small v-if="item.description">{{ item.description }}</small>
            <small v-if="item.location">{{ item.location }}</small>
            <span v-if="item.highlight" class="map-result-highlight">{{ item.highlight }}</span>
          </span>
        </button>
      </div>
    </div>
    <div class="map-results-canvas"><slot /></div>
  </div>
</template>

<style scoped>
.map-results-layout {
  display: grid;
  grid-template-columns: clamp(205px, 29%, 330px) minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
}
.map-results-side { position: relative; border-right: 1px solid var(--line); }
.map-results-list { position: absolute; inset: 0; overflow: auto; padding: 10px; }
.map-results-list:focus-visible { outline-offset: -3px; }
.map-results-canvas { min-width: 0; isolation: isolate; }
.map-result-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  width: 100%;
  padding: 9px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: none;
  color: var(--ink);
  text-align: left;
  white-space: normal;
  cursor: pointer;
}
.map-result-with-photo { grid-template-columns: 68px minmax(0, 1fr); }
.map-result-item + .map-result-item { margin-top: 5px; }
.map-result-item:hover, .map-result-item[aria-pressed='true'] { background: var(--primary-light); }
.map-result-item[aria-pressed='true'] { border-color: var(--primary); }
.map-result-item img { width: 68px; height: 70px; object-fit: cover; border-radius: 5px; }
.map-result-item small { display: block; margin-top: 2px; color: var(--ink-2); }
.map-results-empty { padding: 12px; color: var(--ink-2); }
.map-result-highlight { color: var(--primary-dark); font-weight: 800; }
</style>
