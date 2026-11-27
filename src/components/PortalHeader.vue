<script setup lang="ts">
import { usePortalStore } from '../store/usePortalStore'

const { state, memberTier, switchModule, handleSearch } = usePortalStore()
</script>

<template>
  <header class="header">
    <div class="container">
      <div class="brand" @click="switchModule(1)">
        <div class="brand-logo">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="11" stroke="#C4F63D" stroke-width="2.4" />
            <path
              d="M6.2 7.5C10.2 10.5 10.2 17.5 6.2 20.5M21.8 7.5C17.8 10.5 17.8 17.5 21.8 20.5"
              stroke="#C4F63D"
              stroke-width="2.2"
              stroke-linecap="round"
            />
            <circle cx="14" cy="14" r="2.2" fill="#FFFFFF" />
          </svg>
        </div>
        <div>
          <div class="brand-name">京山网球 <span class="brand-tag">公众端 · 游客服务版</span></div>
          <div class="brand-sub">吃住行游购娱训打 · 查约付评一站式官方平台</div>
        </div>
      </div>

      <div class="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6F837C" stroke-width="2.3">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.8-3.8" stroke-linecap="round" />
        </svg>
        <input
          v-model="state.searchQuery"
          type="text"
          placeholder="搜球场、实时比分、网球公寓、购房减5万、充电桩预约、桥米美食…"
          @keyup.enter="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">搜索</button>
      </div>

      <div class="header-right">
        <span
          class="hdr-pill"
          style="background: #fff3eb; border-color: #f9c8ae; color: #c93f14"
          @click="state.showEventModal = true"
        >
          🏆 赛事弹窗
        </span>
        <span class="hdr-pill" :class="{ active: state.activeModule === 11 }" @click="switchModule(11)">
          💬 互动反馈
        </span>
        <span class="hdr-pill" :class="{ active: state.activeModule === 12 }" @click="switchModule(12)">
          🔗 小程序互通
        </span>
        <div class="member-chip" :class="{ active: state.activeModule === 13 }" @click="switchModule(13)">
          <div class="avatar-sm">林</div>
          <span>林先生 · {{ memberTier.code }} · {{ state.abilityLevel }} · {{ state.points }}分</span>
        </div>
      </div>
    </div>
  </header>
</template>
