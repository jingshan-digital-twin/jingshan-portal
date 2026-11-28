<script setup lang="ts">
import { usePortalStore } from '../store/usePortalStore'

const { state, memberTier, switchModule, navigateToModulePage, handleSearch } = usePortalStore()
</script>

<template>
  <header class="header">
    <div class="container">
      <div class="brand" role="button" tabindex="0" @click="switchModule(1)" @keyup.enter="switchModule(1)">
        <div class="brand-logo" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="10.8" stroke="#D2F854" stroke-width="2.2" />
            <path
              d="M6.4 7.7C10.2 10.6 10.2 17.4 6.4 20.3M21.6 7.7C17.8 10.6 17.8 17.4 21.6 20.3"
              stroke="#D2F854"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle cx="14" cy="14" r="2.2" fill="#FFFFFF" />
          </svg>
        </div>
        <div class="brand-text">
          <div class="brand-name">
            <span>京山网球</span>
            <span class="brand-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 3l7 3v5c0 5-3.2 8.7-7 10-3.8-1.3-7-5-7-10V6l7-3z" />
                <path d="M9.2 12.2l1.9 1.9 3.8-4" />
              </svg>
              官方服务平台
            </span>
          </div>
        </div>
      </div>

      <div class="search-bar">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.8-3.8" />
        </svg>
        <input
          v-model="state.searchQuery"
          type="text"
          placeholder="搜索球场、赛事、酒店、美食或文旅线路…"
          @keyup.enter="handleSearch"
        />
        <button
          v-if="state.searchQuery"
          type="button"
          class="search-clear"
          title="清空搜索"
          aria-label="清空搜索"
          @click="state.searchQuery = ''"
        >
          ×
        </button>
        <button type="button" class="search-btn" @click="handleSearch">搜索</button>
      </div>

      <nav class="header-right" aria-label="快捷服务入口">
        <button
          type="button"
          class="hdr-pill hdr-pill-event"
          @click="state.showEventModal = true"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
            <path d="M7 6H4v2a3 3 0 0 0 3 3" />
            <path d="M17 6h3v2a3 3 0 0 1-3 3" />
          </svg>
          <span>赛事福利</span>
          <i class="hdr-event-dot" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="hdr-pill"
          :class="{ active: state.isStandalonePage && state.activeModule === 11 }"
          @click="navigateToModulePage(11)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.7-.3-3.9-.9L3 21l1.5-5.1A8.5 8.5 0 1 1 21 12z" />
            <path d="M8.5 11.5h7" />
            <path d="M8.5 15h4.5" />
          </svg>
          <span>互动反馈</span>
        </button>

        <button
          type="button"
          class="hdr-pill"
          :class="{ active: state.isStandalonePage && state.activeModule === 12 }"
          @click="navigateToModulePage(12)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
            <path d="M14 17h6" />
            <path d="M17 14v6" />
          </svg>
          <span>小程序</span>
        </button>

        <span class="hdr-divider" aria-hidden="true" />

        <button
          type="button"
          class="member-chip"
          :class="{ active: state.isStandalonePage && state.activeModule === 13 }"
          @click="navigateToModulePage(13)"
        >
          <span class="avatar-sm">林</span>
          <span class="member-name">林先生</span>
          <span class="member-tier-badge">{{ memberTier.code }}</span>
          <svg class="member-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </nav>
    </div>
  </header>
</template>
