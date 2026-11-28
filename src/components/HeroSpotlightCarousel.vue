<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { HERO_SLIDES } from '../mock/data'
import { isBookingQuantity } from '../store/reservationFlow'
import { usePortalStore } from '../store/usePortalStore'

const {
  state,
  switchModule,
  openActionModal,
  claimHomeSubsidy,
  createQuickOrder,
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

// Right 3-Tab Quick Action Widget
const widgetTab = ref<'court' | 'event' | 'package'>('court')
const courtDate = ref('今天 11月26日 下午')
const courtSurface = ref<'全部' | '硬地' | '红土' | '室内风雨'>('全部')
const courtRegion = ref<'全部' | '温泉街道' | '新市街道' | '永兴街道'>('全部')
const courtExtra = ref('停车与充电便利')

const eventChoice = ref('京山周末分级赛（匹配当前等级）')
const eventGroup = ref('单打/双打积分组')

const pkgChoice = ref('京山网旅四天三晚尊享套餐 · ¥2,999/人')
const pkgPeople = ref<number | ''>(2)

function submitCourtQuery() {
  state.courtSurfaceFilter = courtSurface.value
  state.courtRegionFilter = courtRegion.value
  switchModule(2, {
    surface: courtSurface.value,
    region: courtRegion.value,
  })
  const stageEl = document.getElementById('moduleStageAnchor')
  stageEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  showToast(`已为您筛选「${courtDate.value} / ${courtSurface.value} / ${courtRegion.value}」的空闲球场`)
}

function submitQuickEvent() {
  const isFree = eventChoice.value.includes('观赛')
  createQuickOrder(
    '门票',
    `${eventChoice.value}（${state.abilityLevel}）`,
    `${eventGroup.value} · 凭报名凭证享联盟住宿85折与票根券`,
    isFree ? 0 : 120,
    120,
  )
}

function submitQuickPackage() {
  const people = pkgPeople.value
  if (!isBookingQuantity(people)) return
  const unitPrice = pkgChoice.value.includes('2,999') ? 2999 : pkgChoice.value.includes('688') ? 688 : 498
  createQuickOrder('门票', pkgChoice.value, `${people} 人 · 持证旅行社保障 · 含电子票根`, unitPrice * people, 180, 0, {
    fields: [
      { label: '出行人数', value: `${people} 人` },
      { label: '游客来源地', value: state.origin },
    ],
  })
}
</script>

<template>
  <section
    class="hero-carousel"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <img :key="currentSlide.id" class="hero-carousel-bg" :src="currentSlide.image" :alt="currentSlide.titleHighlight" />
    <div class="hero-carousel-scrim" />

    <div class="container hero-carousel-inner">
      <!-- Left Rotating Spotlight Content -->
      <div class="hero-left">
        <h1 class="hero-main-title">
          {{ currentSlide.titlePrefix }}<em>{{ currentSlide.titleHighlight }}</em>
        </h1>

        <div class="hero-cta-row">
          <button class="btn-orange hero-cta-primary" @click="triggerSlideAction(currentSlide.primaryAction)">
            {{ currentSlide.primaryAction.label }}
          </button>
          <button
            class="btn-ghost hero-cta-secondary"
            @click="triggerSlideAction(currentSlide.secondaryAction)"
          >
            {{ currentSlide.secondaryAction.label }}
          </button>
        </div>

        <div class="hero-stats-row">
          <div v-for="st in currentSlide.stats" :key="st.label" class="hero-stat-pill">
            <div class="hero-stat-num">{{ st.num }}</div>
            <div class="hero-stat-lbl">{{ st.label }}</div>
          </div>
        </div>

        <!-- Carousel Indicators -->
        <div class="carousel-controls">
          <button class="carousel-arrow" title="上一热点" @click="prevSlide">‹</button>
          <button
            v-for="(s, idx) in HERO_SLIDES"
            :key="s.id"
            class="carousel-pill"
            :class="{ active: idx === slideIndex }"
            @click="slideIndex = idx"
          >
            {{ ['生态网球之城', '中青赛比分', '购房补贴', '网旅与温泉'][idx] }}
          </button>
          <button class="carousel-arrow" title="下一热点" @click="nextSlide">›</button>
        </div>
      </div>

      <!-- Right Floating 3-Tab Quick Widget -->
      <div class="hero-widget">
        <div class="hw-tabs">
          <button class="hw-tab" :class="{ active: widgetTab === 'court' }" @click="widgetTab = 'court'">
            🎾 快速订场
          </button>
          <button class="hw-tab" :class="{ active: widgetTab === 'event' }" @click="widgetTab = 'event'">
            🏆 赛事报名
          </button>
          <button class="hw-tab" :class="{ active: widgetTab === 'package' }" @click="widgetTab = 'package'">
            🌿 网旅套餐
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
          <button class="hw-cta" @click="submitCourtQuery">查询今日空闲球场（84片可约）</button>
        </template>

        <!-- Tab 2: Quick Event Register -->
        <template v-else-if="widgetTab === 'event'">
          <div class="hw-grid">
            <div class="hw-field" style="grid-column: span 2">
              <label>选择热门赛事</label>
              <select v-model="eventChoice">
                <option>京山周末分级赛（匹配当前等级）</option>
                <option>2026中青赛总决赛 · 现场观赛预约（免费）</option>
                <option>青少年 U12/U14 周末巡回赛</option>
              </select>
            </div>
            <div class="hw-field">
              <label for="hero-ability-level">能力等级</label>
              <output id="hero-ability-level">{{ state.abilityLevel }} 官方认证</output>
            </div>
            <div class="hw-field">
              <label>参赛组别</label>
              <select v-model="eventGroup">
                <option>单打/双打积分组</option>
                <option>混双体验组</option>
                <option>亲子观赛组</option>
              </select>
            </div>
          </div>
          <button class="hw-cta" @click="submitQuickEvent">一键报名赛事</button>
        </template>

        <!-- Tab 3: Quick Travel Package -->
        <template v-else>
          <div class="hw-grid">
            <div class="hw-field" style="grid-column: span 2">
              <label>官方精品网旅套餐</label>
              <select v-model="pkgChoice">
                <option>京山网旅四天三晚尊享套餐 · ¥2,999/人</option>
                <option>京山网球+温泉+钟祥明显陵二日游 · ¥688/人</option>
                <option>周末打球+绿林山峡谷二日游 · ¥498/人</option>
              </select>
            </div>
            <div class="hw-field">
              <label for="hero-visitor-origin">游客来源地</label>
              <output id="hero-visitor-origin">{{ state.origin }}</output>
            </div>
            <div class="hw-field">
              <label for="hero-package-people">出行人数</label>
              <input id="hero-package-people" v-model.number="pkgPeople" type="number" min="1" step="1" />
            </div>
          </div>
          <button class="hw-cta" :disabled="!isBookingQuantity(pkgPeople)" @click="submitQuickPackage">
            {{ isBookingQuantity(pkgPeople) ? '立即预订网旅套餐' : '请输入有效的出行人数' }}
          </button>
        </template>

        <div class="hw-quick-row">
          <button class="hw-mini" @click="switchModule(2)">
            <span style="width: 36px; height: 36px; border-radius: 9px; background: #fff0ea; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0">
              🏆
            </span>
            <div style="font-size: 14px; font-weight: 800; color: var(--ink)">青少年巡回赛</div>
          </button>
          <button class="hw-mini" @click="switchModule(5)">
            <span style="width: 36px; height: 36px; border-radius: 9px; background: #e9f7f1; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0">
              🏠
            </span>
            <div style="font-size: 14px; font-weight: 800; color: var(--ink)">购房补贴 & 公寓</div>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
