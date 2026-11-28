<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
const props = defineProps<{ script: string }>()
const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
const active = ref(false)
const error = ref('')
let current: SpeechSynthesisUtterance | undefined
function stop() {
  if (current) {
    current = undefined
    window.speechSynthesis.cancel()
  }
  active.value = false
}
function toggle() {
  if (active.value) { stop(); return }
  const speech = new SpeechSynthesisUtterance(props.script)
  speech.lang = 'zh-CN'
  error.value = ''
  current = speech
  active.value = true
  speech.onend = () => { if (current === speech) { current = undefined; active.value = false } }
  speech.onerror = () => {
    if (current !== speech) return
    current = undefined
    active.value = false
    error.value = '当前设备无法朗读，可阅读上方导览。'
  }
  window.speechSynthesis.speak(speech)
}
watch(() => props.script, () => { stop(); error.value = '' })
onUnmounted(stop)
</script>
<template>
  <button v-if="supported" class="btn-primary" type="button" @click="toggle">{{ active ? '停止朗读' : '朗读导览' }}</button>
  <p v-if="error" role="status">{{ error }}</p>
</template>
