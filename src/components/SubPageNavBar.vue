<script setup lang="ts">
import { computed } from 'vue'
import { getModuleMeta, MODULE_META_LIST, usePortalStore } from '../store/usePortalStore'

const { state, switchModule, returnFromModulePage } = usePortalStore()

const currentMeta = computed(() => getModuleMeta(state.activeModule))
const subModules = MODULE_META_LIST.filter((m) => m.id >= 2 && m.id <= 9)
const isUtilityPage = computed(() => state.activeModule === 11 || state.activeModule === 12 || state.activeModule === 13)
</script>

<template>
  <div class="subpage-nav-shell">
    <div class="container">
      <div class="subpage-nav-top" :style="isUtilityPage ? 'margin-bottom: 0' : ''">
        <div class="subpage-breadcrumb">
          <button v-if="isUtilityPage" class="subpage-back-btn" @click="returnFromModulePage">
            ← 返回
          </button>
          <button v-else class="subpage-back-btn" @click="switchModule(1)">
            ← 返回首页总览
          </button>
          <span class="subpage-sep">/</span>
          <strong class="subpage-current">{{ currentMeta.title }}</strong>
        </div>
      </div>

      <div v-if="!isUtilityPage" class="subpage-pills">
        <button
          v-for="m in subModules"
          :key="m.id"
          class="subpage-pill"
          :class="{ active: state.activeModule === m.id }"
          @click="switchModule(m.id)"
        >
          <span class="subpage-pill-name">{{ m.shortName }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
