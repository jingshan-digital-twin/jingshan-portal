<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { PORTAL_ACCOUNTS, usePortalStore } from '../store/usePortalStore'

const { state, currentAccount, switchAccount, memberTier, switchModule, navigateToModulePage, handleSearch } =
  usePortalStore()

const accountMenuOpen = ref(false)
const accountWrapRef = ref<HTMLElement | null>(null)

function selectAccount(id: string) {
  switchAccount(id)
  accountMenuOpen.value = false
}

function goProfile() {
  accountMenuOpen.value = false
  navigateToModulePage(13)
}

function onDocClick(e: MouseEvent) {
  if (!accountMenuOpen.value) return
  if (accountWrapRef.value && !accountWrapRef.value.contains(e.target as Node)) {
    accountMenuOpen.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') accountMenuOpen.value = false
}

onMounted(() => {
  window.addEventListener('click', onDocClick)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('click', onDocClick)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <header class="header">
    <div class="container">
      <div class="header-left">
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

        <template v-if="state.isStandalonePage || state.activeDetail">
          <span class="hdr-divider" aria-hidden="true" />
          <button type="button" class="hdr-home-btn" @click="switchModule(1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" />
            </svg>
            <span>返回首页</span>
          </button>
        </template>
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
          @click="state.showTourneyRegModal = true"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
            <path d="M7 6H4v2a3 3 0 0 0 3 3" />
            <path d="M17 6h3v2a3 3 0 0 1-3 3" />
          </svg>
          <span>赛事报名</span>
          <i class="hdr-event-dot" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="hdr-pill"
          @click="state.showArrivalGuideModal = true"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          <span>抵京指引</span>
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
          <span>点评投诉</span>
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

        <div ref="accountWrapRef" class="hdr-account-wrap">
          <div
            class="member-chip hdr-account-split"
            :class="{ active: state.isStandalonePage && state.activeModule === 13 }"
          >
            <button type="button" class="hdr-account-main" @click="goProfile">
              <span class="avatar-sm">{{ currentAccount.avatar }}</span>
              <span class="member-name">{{ currentAccount.name }}</span>
              <span class="hdr-city-tag">{{ currentAccount.city }}</span>
              <span class="member-tier-badge">{{ memberTier.code }}</span>
            </button>
            <button
              type="button"
              class="hdr-account-caret"
              aria-label="切换账户"
              :aria-expanded="accountMenuOpen"
              @click.stop="accountMenuOpen = !accountMenuOpen"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>

          <div v-if="accountMenuOpen" class="hdr-account-menu" role="menu">
            <button type="button" class="hdr-acct-item" @click="goProfile">
              <strong>个人中心</strong>
              <span>{{ memberTier.code }} · {{ state.points }}分</span>
            </button>
            <div class="hdr-acct-divider">切换账户</div>
            <button
              v-for="acc in PORTAL_ACCOUNTS"
              :key="acc.id"
              type="button"
              class="hdr-acct-item"
              :class="{ current: acc.id === currentAccount.id }"
              @click="selectAccount(acc.id)"
            >
              <span class="hdr-acct-row">
                <span class="hdr-acct-avatar">{{ acc.avatar }}</span>
                <strong>{{ acc.name }}</strong>
                <span class="hdr-acct-city">{{ acc.city }}</span>
              </span>
              <span v-if="acc.id === currentAccount.id" class="hdr-acct-check">✓</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.hdr-account-wrap {
  position: relative;
}
.hdr-account-split {
  padding: 0;
  gap: 0;
  overflow: hidden;
}
.hdr-account-main {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 100%;
  padding: 4px 8px 4px 5px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
}
.hdr-city-tag {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--primary-dark);
  background: rgba(11, 115, 82, 0.1);
  padding: 1px 6px;
  border-radius: 999px;
}
.hdr-account-caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 100%;
  border: none;
  border-left: 1px solid rgba(196, 138, 25, 0.28);
  background: transparent;
  color: #8c5a06;
  transition: background-color 0.14s ease;
}
.hdr-account-caret:hover {
  background: rgba(196, 138, 25, 0.14);
}
.hdr-account-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 210px;
  background: #fff;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  box-shadow: var(--shadow-lg);
  padding: 6px;
  z-index: 600;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.hdr-acct-divider {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--ink-3);
  padding: 6px 8px 4px;
  border-top: 1px solid var(--line);
  margin-top: 4px;
}
.hdr-acct-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 7px 9px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--ink);
  font-size: 13px;
  text-align: left;
  transition: background-color 0.14s ease;
}
.hdr-acct-item:hover {
  background: #f2f9f6;
}
.hdr-acct-item.current {
  background: var(--primary-light);
  color: var(--primary-dark);
}
.hdr-acct-item > span:last-child {
  font-size: 12px;
  color: var(--ink-3);
}
.hdr-acct-row {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.hdr-acct-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e9f3ee;
  color: var(--primary-dark);
  font-size: 11.5px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.hdr-acct-city {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--ink-3);
}
.hdr-acct-check {
  color: var(--primary) !important;
  font-weight: 900;
}
</style>
