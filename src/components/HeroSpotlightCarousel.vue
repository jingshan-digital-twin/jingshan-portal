<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { TOURNAMENT_REGISTRATION_OPTIONS } from '../mock/trainingData'
import { HERO_SLIDES } from '../mock/data'
import { usePortalStore } from '../store/usePortalStore'

const {
  state,
  switchModule,
  openActionModal,
  openTournamentRegistration,
  claimHomeSubsidy,
  showToast,
} = usePortalStore()

const slideIndex = ref(0)
const paused = ref(false)
let timer: number | undefined

const currentSlide = computed(() => HERO_SLIDES[slideIndex.value] ?? HERO_SLIDES[0]!)

function nextSlide() {
  slideIndex.value = (slideIndex.value + 1) % HERO_SLIDES.length
}
function prevSlide() {
  slideIndex.value = (slideIndex.value - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
}

onMounted(() => {
  timer = window.setInterval(() => {
    if (!paused.value) nextSlide()
  }, 6000)
})
onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})

function triggerSlideAction(action: (typeof HERO_SLIDES)[number]['primaryAction'] | (typeof HERO_SLIDES)[number]['secondaryAction']) {
  if ('moduleId' in action && action.moduleId !== undefined) {
    switchModule(action.moduleId)
  } else if ('kind' in action && action.kind === 'video') {
    openActionModal({ type: 'video', title: '《中国网球之城 · 生态京山》官方城市宣传片', duration: '02:15' })
  } else if ('kind' in action && action.kind === 'subsidy') {
    claimHomeSubsidy()
    switchModule(5)
  } else if ('kind' in action && action.kind === 'stub') {
    openActionModal({ type: 'stub', code: state.ticketStubCode })
  }
}

// Right 2-Tab Quick Action Widget
const widgetTab = ref<'court' | 'event'>('court')
const courtDate = ref('今天 11月26日 下午')
const courtSurface = ref<'全部' | '硬地' | '红土' | '室内风雨'>('全部')
const courtRegion = ref<'全部' | '温泉街道' | '新市街道' | '永兴街道'>('全部')
const courtExtra = ref('停车与充电便利')

const eventChoice = ref(TOURNAMENT_REGISTRATION_OPTIONS[0]!)
const eventGroup = ref(eventChoice.value.groups[0]?.id)
watch(eventChoice, event => { eventGroup.value = event.groups[0]?.id })

function submitCourtQuery() {
  state.courtSurfaceFilter = courtSurface.value
  state.courtRegionFilter = courtRegion.value
  switchModule(2, {
    surface: courtSurface.value,
    region: courtRegion.value,
  })
  showToast(`已为您筛选「${courtDate.value} / ${courtSurface.value} / ${courtRegion.value}」的空闲球场`)
}

function submitQuickEvent() {
  openTournamentRegistration(eventChoice.value.id, eventGroup.value)
}
</script>

<template>
  <section
    class="hero-carousel"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <!-- 多图背景叠化切换 -->
    <div class="hero-bg-stack" aria-hidden="true">
      <img
        v-for="(s, idx) in HERO_SLIDES"
        :key="s.id"
        class="hero-carousel-bg"
        :class="{ active: idx === slideIndex }"
        :src="s.image"
        :alt="s.titleHighlight"
      />
    </div>
    <div class="hero-carousel-scrim" />

    <div v-if="$slots['top-nav']" class="hero-top-nav-slot">
      <slot name="top-nav" />
    </div>

    <div class="container hero-carousel-inner">
      <!-- Left Rotating Spotlight Content -->
      <div class="hero-left">
        <h1 class="hero-main-title">
          {{ currentSlide.titlePrefix }}<em>{{ currentSlide.titleHighlight }}</em>
        </h1>

        <div class="hero-cta-row">
          <button type="button" class="hero-cta-primary" @click="triggerSlideAction(currentSlide.primaryAction)">
            <svg
              v-if="'kind' in currentSlide.primaryAction && currentSlide.primaryAction.kind === 'video'"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
            <svg
              v-else-if="'kind' in currentSlide.primaryAction && currentSlide.primaryAction.kind === 'subsidy'"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5z" />
              <path d="M9 21v-6h6v6" />
            </svg>
            <svg
              v-else-if="'kind' in currentSlide.primaryAction && currentSlide.primaryAction.kind === 'stub'"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V7z" />
              <path d="M13 7v10" />
            </svg>
            <svg
              v-else
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 3v18h18" />
              <path d="M7 15l4-4 3 3 5-6" />
            </svg>
            <span>{{ currentSlide.primaryAction.label }}</span>
          </button>

          <button
            type="button"
            class="hero-cta-secondary"
            @click="triggerSlideAction(currentSlide.secondaryAction)"
          >
            <span>{{ currentSlide.secondaryAction.label }}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <!-- 统一三列等宽数据条 -->
        <div class="hero-stats-bar">
          <div v-for="st in currentSlide.stats" :key="st.label" class="hero-stat-cell">
            <div class="hero-stat-num">{{ st.num }}</div>
            <div class="hero-stat-lbl">{{ st.label }}</div>
          </div>
        </div>

        <!-- 等宽工整轮播切换条 -->
        <div class="carousel-controls">
          <div class="carousel-rail" role="tablist" aria-label="首页轮播主题">
            <button
              v-for="(s, idx) in HERO_SLIDES"
              :key="s.id"
              type="button"
              role="tab"
              class="carousel-pill"
              :class="{ active: idx === slideIndex }"
              :aria-selected="idx === slideIndex"
              @click="slideIndex = idx"
            >
              <span class="carousel-num">0{{ idx + 1 }}</span>
              <span>{{ ['生态网球之城', '中青赛比分', '购房补贴', '网旅与温泉'][idx] }}</span>
            </button>
          </div>
          <div class="carousel-nav-group">
            <button type="button" class="carousel-arrow" title="上一热点" aria-label="上一热点" @click="prevSlide">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button type="button" class="carousel-arrow" title="下一热点" aria-label="下一热点" @click="nextSlide">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Floating 2-Tab Quick Widget -->
      <div class="hero-widget">
        <div class="hw-tabs">
          <button type="button" class="hw-tab" :class="{ active: widgetTab === 'court' }" @click="widgetTab = 'court'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M5.5 6.8c3.3 2.5 3.3 7.9 0 10.4M18.5 6.8c-3.3 2.5-3.3 7.9 0 10.4" />
            </svg>
            <span>快速订场</span>
          </button>
          <button type="button" class="hw-tab" :class="{ active: widgetTab === 'event' }" @click="widgetTab = 'event'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
            </svg>
            <span>赛事报名</span>
          </button>
        </div>

        <!-- Tab 1: Quick Court Search -->
        <template v-if="widgetTab === 'court'">
          <div class="hw-grid">
            <div class="hw-field">
              <label>打球时段</label>
              <select v-model="courtDate">
                <option>今天 11月26日 下午</option>
                <option>今天 11月26日 夜场</option>
                <option>明天 11月27日 全天</option>
                <option>本周末（周六/周日）</option>
              </select>
            </div>
            <div class="hw-field">
              <label>场地类型</label>
              <select v-model="courtSurface">
                <option value="全部">全部地面类型</option>
                <option value="硬地">标准硬地场</option>
                <option value="红土">特色红土场</option>
                <option value="室内风雨">室内风雨场</option>
              </select>
            </div>
            <div class="hw-field">
              <label>所在片区</label>
              <select v-model="courtRegion">
                <option value="全部">全部片区</option>
                <option value="温泉街道">温泉街道</option>
                <option value="新市街道">新市街道</option>
              </select>
            </div>
            <div class="hw-field">
              <label>配套偏好</label>
              <select v-model="courtExtra">
                <option>停车与充电便利</option>
                <option>周边酒店餐饮近</option>
                <option>支持开场前退改</option>
              </select>
            </div>
          </div>
          <button type="button" class="hw-cta" @click="submitCourtQuery">查询今日空闲球场</button>
        </template>

        <!-- Tab 2: Quick Event Register -->
        <template v-else>
          <div class="hw-grid">
            <div class="hw-field" style="grid-column: span 2">
              <label>选择热门赛事</label>
              <select v-model="eventChoice">
                <option v-for="event in TOURNAMENT_REGISTRATION_OPTIONS" :key="event.id" :value="event">{{ event.label }}</option>
              </select>
            </div>
            <div class="hw-field">
              <label for="hero-ability-level">能力等级</label>
              <output id="hero-ability-level">{{ state.abilityLevel }} 官方认证</output>
            </div>
            <div class="hw-field">
              <label>参赛组别</label>
              <select v-model="eventGroup">
                <option v-for="group in eventChoice.groups" :key="group.id" :value="group.id">{{ group.name }}</option>
              </select>
            </div>
          </div>
          <button type="button" class="hw-cta" @click="submitQuickEvent">一键报名</button>
        </template>
      </div>
    </div>
  </section>
</template>
