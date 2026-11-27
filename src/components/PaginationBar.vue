<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    total: number
    page: number
    pageSize?: number
    unit?: string
  }>(),
  {
    pageSize: 4,
    unit: '项',
  },
)

const emit = defineEmits<{
  (e: 'update:page', value: number): void
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const pages = computed(() => Array.from({ length: totalPages.value }, (_, i) => i + 1))

function go(p: number) {
  const clamped = Math.min(totalPages.value, Math.max(1, p))
  if (clamped !== props.page) {
    emit('update:page', clamped)
  }
}
</script>

<template>
  <div v-if="total > 0" class="pagination-bar">
    <div class="pagination-info">
      共 <strong>{{ total }}</strong> {{ unit }} · 每页 {{ pageSize }} {{ unit }} · 第
      <strong>{{ page }}</strong> / {{ totalPages }} 页
    </div>
    <div class="pagination-controls">
      <button
        type="button"
        class="pg-btn"
        :disabled="page <= 1"
        @click="go(page - 1)"
      >
        ‹ 上一页
      </button>
      <button
        v-for="p in pages"
        :key="p"
        type="button"
        class="pg-btn"
        :class="{ active: p === page }"
        @click="go(p)"
      >
        {{ p }}
      </button>
      <button
        type="button"
        class="pg-btn"
        :disabled="page >= totalPages"
        @click="go(page + 1)"
      >
        下一页 ›
      </button>
    </div>
  </div>
</template>
