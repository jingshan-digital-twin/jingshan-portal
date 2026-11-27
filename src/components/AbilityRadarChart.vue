<script setup lang="ts">
import { computed } from 'vue'
import type { AbilityDimensions } from '../types/portal'

const props = defineProps<{
  ability: AbilityDimensions
  level: string
}>()

// 5 axes starting at top (-90 deg) clockwise by 72 deg
const polygonPoints = computed(() => {
  const vals = [
    props.ability.serve,
    props.ability.baseline,
    props.ability.volley,
    props.ability.footwork,
    props.ability.stamina,
  ]
  const maxR = 82
  return vals
    .map((v, i) => {
      const angle = ((-90 + i * 72) * Math.PI) / 180
      const r = (Math.min(100, Math.max(0, v)) / 100) * maxR
      return `${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`
    })
    .join(' ')
})

const dotCoords = computed(() => {
  const vals = [
    props.ability.serve,
    props.ability.baseline,
    props.ability.volley,
    props.ability.footwork,
    props.ability.stamina,
  ]
  const maxR = 82
  return vals.map((v, i) => {
    const angle = ((-90 + i * 72) * Math.PI) / 180
    const r = (Math.min(100, Math.max(0, v)) / 100) * maxR
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r }
  })
})
</script>

<template>
  <svg viewBox="0 0 310 230" style="width: 100%; max-width: 260px; height: auto; display: block; margin: 0 auto">
    <g transform="translate(155, 118)">
      <polygon points="0,-82 78,-25 48,66 -48,66 -78,-25" fill="#F2F8F5" stroke="#CBE3D9" stroke-width="1.2" />
      <polygon points="0,-55 52,-17 32,44 -32,44 -52,-17" fill="none" stroke="#D8EAE2" stroke-width="1" />
      <polygon points="0,-27 26,-8 16,22 -16,22 -26,-8" fill="none" stroke="#E3F0EA" stroke-width="1" />
      <line x1="0" y1="0" x2="0" y2="-82" stroke="#D5E7DF" stroke-width="1" />
      <line x1="0" y1="0" x2="78" y2="-25" stroke="#D5E7DF" stroke-width="1" />
      <line x1="0" y1="0" x2="48" y2="66" stroke="#D5E7DF" stroke-width="1" />
      <line x1="0" y1="0" x2="-48" y2="66" stroke="#D5E7DF" stroke-width="1" />
      <line x1="0" y1="0" x2="-78" y2="-25" stroke="#D5E7DF" stroke-width="1" />

      <polygon :points="polygonPoints" fill="rgba(13,122,88,0.28)" stroke="#0D7A58" stroke-width="2.4" />
      <circle v-for="(pt, idx) in dotCoords" :key="idx" :cx="pt.x" :cy="pt.y" r="4" fill="#0D7A58" />

      <text x="0" y="-92" text-anchor="middle" font-size="11" font-weight="800" fill="#10251F">
        发球 {{ ability.serve }}
      </text>
      <text x="86" y="-22" text-anchor="start" font-size="11" font-weight="800" fill="#10251F">
        底线 {{ ability.baseline }}
      </text>
      <text x="54" y="82" text-anchor="middle" font-size="11" font-weight="800" fill="#10251F">
        网前 {{ ability.volley }}
      </text>
      <text x="-54" y="82" text-anchor="middle" font-size="11" font-weight="800" fill="#10251F">
        步法 {{ ability.footwork }}
      </text>
      <text x="-86" y="-22" text-anchor="end" font-size="11" font-weight="800" fill="#10251F">
        体能 {{ ability.stamina }}
      </text>
      <text x="0" y="6" text-anchor="middle" font-size="15" font-weight="900" fill="#0D7A58">{{ level }}</text>
    </g>
  </svg>
</template>
