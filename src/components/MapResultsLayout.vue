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
    <div class="map-results-columns">
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
  </div>
</template>

<style scoped>
.map-results-layout {
  container-type: inline-size;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 0;
  background: var(--surface);
}
.map-results-columns { display: grid; grid-template-columns: clamp(248px, 27%, 320px) minmax(0, 1fr); }
.map-results-side { position: relative; border-right: 1px solid var(--line); background: #fafdfc; }
.map-results-list { position: absolute; inset: 0; overflow: auto; padding: 12px; }
.map-results-list:focus-visible { outline-offset: -3px; }
.map-results-canvas { min-width: 0; isolation: isolate; }
.map-result-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  width: 100%;
  padding: 11px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  color: var(--ink);
  text-align: left;
  white-space: normal;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}
.map-result-with-photo { grid-template-columns: 68px minmax(0, 1fr); }
.map-result-item + .map-result-item { margin-top: 8px; }
.map-result-item:hover { background: #f2faf6; border-color: #b7d9cb; }
.map-result-item[aria-pressed='true'] {
  background: var(--primary-light);
  border-color: var(--primary);
  box-shadow: 0 3px 10px rgba(11, 115, 82, 0.1);
}
.map-result-item img { width: 68px; height: 70px; object-fit: cover; border-radius: 5px; }
.map-result-item strong { display: block; font-size: 14.5px; line-height: 1.35; }
.map-result-item small { display: block; margin-top: 3px; font-size: 12.5px; color: var(--ink-2); line-height: 1.45; }
.map-results-empty { padding: 12px; color: var(--ink-2); }
.map-result-highlight { display: inline-block; margin-top: 6px; font-size: 13px; color: var(--primary-dark); font-weight: 800; }

@container (max-width: 545px) {
  .map-results-columns { grid-template-columns: minmax(0, 1fr); }
  .map-results-side { border-right: 0; border-bottom: 1px solid var(--line); }
  .map-results-list { position: relative; max-height: 180px; }
}
</style>
