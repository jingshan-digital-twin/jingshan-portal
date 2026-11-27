<script setup lang="ts">
const showMap = defineModel<boolean>({ required: true })
</script>

<template>
  <button type="button" class="btn-ghost map-view-toggle" @click="showMap = !showMap">
    <span aria-hidden="true">◎</span> {{ showMap ? '返回列表' : '在地图上显示' }}
  </button>
</template>

<style scoped>
.map-view-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 6px;
  color: var(--primary-dark);
  font-weight: 800;
}
.map-view-toggle:hover { background: var(--primary-light); }
</style>
