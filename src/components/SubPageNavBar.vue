<script setup lang="ts">
import { computed } from 'vue'
import { getModuleMeta, MODULE_META_LIST, usePortalStore } from '../store/usePortalStore'

const { state, switchModule } = usePortalStore()

const currentMeta = computed(() => getModuleMeta(state.activeModule))
const subModules = MODULE_META_LIST.filter((m) => m.id !== 1)

function closeOrReturnHome() {
  if (window.opener && !window.opener.closed) {
    window.close()
  } else {
    switchModule(1)
  }
}
</script>

<template>
  <div class="subpage-nav-shell">
    <div class="container">
      <div class="subpage-nav-top">
        <div class="subpage-breadcrumb">
          <button class="subpage-back-btn" @click="switchModule(1)">
            ← 返回首页总览
          </button>
          <span class="subpage-sep">/</span>
          <span class="subpage-code">{{ currentMeta.code }}</span>
          <strong class="subpage-current">{{ currentMeta.title }}</strong>
        </div>

        <div class="flex-row">
          <button class="btn-ghost" style="padding: 5px 11px; font-size: 11.5px" @click="closeOrReturnHome">
            返回门户主页
          </button>
        </div>
      </div>

      <div class="subpage-pills">
        <button
          v-for="m in subModules"
          :key="m.id"
          class="subpage-pill"
          :class="{ active: state.activeModule === m.id }"
          @click="switchModule(m.id)"
        >
          <span class="subpage-pill-num">{{ m.code }}</span>
          <span>{{ m.shortName }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
