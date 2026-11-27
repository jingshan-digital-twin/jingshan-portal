<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    options: string[]
    modelValue: string[]
    placeholder?: string
  }>(),
  {
    placeholder: '全部不限',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const displayText = computed(() => {
  if (props.modelValue.length === 0) return props.placeholder
  if (props.modelValue.length === 1) return props.modelValue[0]!
  return `${props.modelValue[0]} 等 ${props.modelValue.length} 项`
})

function toggleOption(opt: string) {
  const next = [...props.modelValue]
  const idx = next.indexOf(opt)
  if (idx >= 0) next.splice(idx, 1)
  else next.push(opt)
  emit('update:modelValue', next)
}

function clearAll() {
  emit('update:modelValue', [])
}

function onDocClick(e: MouseEvent) {
  if (!open.value) return
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="rootRef" class="dd-field dd-multi-wrap">
    <span class="dd-field-label">{{ label }}</span>
    <button
      type="button"
      class="dd-select-trigger"
      :class="{ active: modelValue.length > 0, open }"
      @click.stop="open = !open"
    >
      <span class="dd-trigger-text">{{ displayText }}</span>
      <span class="dd-caret">▾</span>
    </button>

    <div v-if="open" class="dd-popover" @click.stop>
      <div class="dd-popover-list">
        <label
          v-for="opt in options"
          :key="opt"
          class="dd-check-item"
          :class="{ checked: modelValue.includes(opt) }"
        >
          <input
            type="checkbox"
            :checked="modelValue.includes(opt)"
            @change="toggleOption(opt)"
          />
          <span>{{ opt }}</span>
        </label>
      </div>
      <div class="dd-popover-foot">
        <button type="button" class="dd-link-btn" @click="clearAll">清空</button>
        <button type="button" class="btn-primary" style="padding: 5px 14px; font-size: 13px" @click="open = false">
          确定
        </button>
      </div>
    </div>
  </div>
</template>
