<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { HERO_SLIDES } from '../mock/data'
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
const courtExtra = ref('可看实况 · 联动车位充电桩')

const eventChoice = ref('京山周末分级赛（匹配当前等级）')
const eventGroup = ref('单打/双打积分组')

const pkgChoice = ref('京山网旅四天三晚尊享套餐 · ¥2,999/人')
const pkgPeople = ref('2人同行')

function submitCourtQuery() {
  state.courtSurfaceFilter = courtSurface.value
  state.courtRegionFilter = courtRegion.value
  switchModule(2)
  showToast(`已按「${courtDate.value} / ${courtSurface.value} / ${courtRegion.value}」筛选出今日空闲球场`)
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
  const price = pkgChoice.value.includes('2,999') ? 2999 : pkgChoice.value.includes('688') ? 688 : 498
  createQuickOrder('门票', pkgChoice.value, `${pkgPeople.value} · 持证旅行社保障 · 含电子票根`, price, 180)
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
        <div class="hero-eyebrow">
          <span class="hero-lime-tag">{{ currentSlide.eyebrow }}</span>
          <span>{{ currentSlide.eyebrowSub }}</span>
        </div>

        <h1 class="hero-main-title">
          {{ currentSlide.titlePrefix }}<em>{{ currentSlide.titleHighlight }}</em>
        </h1>

        <p class="hero-main-desc">{{ currentSlide.desc }}</p>

        <div class="hero-cta-row">
          <button class="btn-orange" style="padding: 9px 18px; font-size: 13px; border-radius: 99px" @click="triggerSlideAction(currentSlide.primaryAction)">
            {{ currentSlide.primaryAction.label }}
          </button>
          <button
            class="btn-ghost"
            style="padding: 8px 16px; font-size: 13px; border-radius: 99px; background: rgba(255, 255, 255, 0.14); color: #fff; border-color: rgba(255, 255, 255, 0.34)"
            @click="triggerSlideAction(currentSlide.secondaryAction)"
          >
            {{ currentSlide.secondaryAction.label }}
          </button>
        </div>

        <div class="hero-stats-row">
          <div v-for="st in currentSlide.stats" :key="st.label" class="hero-stat-pill">
            <div class="hero-stat-num">{{ st.num }}</div>
            <div class="hero-stat-lbl">
              {{ st.label }}
              <small>{{ st.sub }}</small>
            </div>
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
            {{ idx + 1 }}. {{ ['生态网球之城', '中青赛实时比分', '房管局购房减5万', '票根经济与温泉'][idx] }}
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
            🏆 报赛事
          </button>
          <button class="hw-tab" :class="{ active: widgetTab === 'package' }" @click="widgetTab = 'package'">
            🌿 买网旅套餐
          </button>
        </div>

        <!-- Tab 1: Quick Court Search -->
        <template v-if="widgetTab === 'court'">
          <div class="hw-grid">
            <div class="hw-field">
              <label>打球日期 & 时段</label>
              <select v-model="courtDate">
                <option>今天 11月26日 下午</option>
                <option>今天 11月26日 夜场</option>
                <option>明天 11月27日 全天</option>
                <option>本周末（周六/周日）</option>
              </select>
            </div>
            <div class="hw-field">
              <label>场地类型 / 地面</label>
              <select v-model="courtSurface">
                <option value="全部">硬地 / 红土 / 风雨室内</option>
                <option value="硬地">标准硬地场</option>
                <option value="红土">特色红土场</option>
                <option value="室内风雨">室内 / 风雨场</option>
              </select>
            </div>
            <div class="hw-field">
              <label>所在片区</label>
              <select v-model="courtRegion">
                <option value="全部">温泉新区 · 新市 · 永兴</option>
                <option value="温泉街道">温泉街道（国际中心/基地）</option>
                <option value="新市街道">新市街道（文峰公园）</option>
              </select>
            </div>
            <div class="hw-field">
              <label>周边配套要求</label>
              <select v-model="courtExtra">
                <option>可看实况 · 联动车位充电桩</option>
                <option>500m内有联盟酒店/餐饮</option>
                <option>支持开场前2h免费取消</option>
              </select>
            </div>
          </div>
          <button class="hw-cta" @click="submitCourtQuery">🔍 立即查询今日空闲球场（84片可约）</button>
        </template>

        <!-- Tab 2: Quick Event Register -->
        <template v-else-if="widgetTab === 'event'">
          <div class="hw-grid">
            <div class="hw-field" style="grid-column: span 2">
              <label>选择近期热门赛事</label>
              <select v-model="eventChoice">
                <option>京山周末分级赛（匹配当前等级）</option>
                <option>2026中青赛总决赛 · 现场观赛预约（免费）</option>
                <option>青少年 U12/U14 周末巡回赛</option>
              </select>
            </div>
            <div class="hw-field">
              <label>自动匹配能力等级</label>
              <select disabled>
                <option>{{ state.abilityLevel }} 官方认证级</option>
              </select>
            </div>
            <div class="hw-field">
              <label>参赛组别</label>
              <select v-model="eventGroup">
                <option>单打/双打积分组</option>
                <option>混双趣味体验组</option>
                <option>亲子观赛票根组</option>
              </select>
            </div>
          </div>
          <button class="hw-cta" @click="submitQuickEvent">🏆 一键报名赛事并激活票根福利（+120分）</button>
        </template>

        <!-- Tab 3: Quick Travel Package -->
        <template v-else>
          <div class="hw-grid">
            <div class="hw-field" style="grid-column: span 2">
              <label>选择官方精品网旅套餐</label>
              <select v-model="pkgChoice">
                <option>京山网旅四天三晚尊享套餐 · ¥2,999/人</option>
                <option>京山网球+温泉+钟祥明显陵二日游 · ¥688/人</option>
                <option>周末打球+绿林山峡谷二日游 · ¥498/人</option>
              </select>
            </div>
            <div class="hw-field">
              <label>游客来源地</label>
              <select disabled>
                <option>{{ state.origin }}</option>
              </select>
            </div>
            <div class="hw-field">
              <label>出行人数</label>
              <select v-model="pkgPeople">
                <option>1人独享</option>
                <option>2人同行</option>
                <option>家庭3人团</option>
              </select>
            </div>
          </div>
          <button class="hw-cta" @click="submitQuickPackage">🌿 立即预订官方网旅套餐（持证社保障）</button>
        </template>

        <div class="hw-quick-row">
          <button class="hw-mini" @click="switchModule(2)">
            <span style="width: 34px; height: 34px; border-radius: 10px; background: #fff0ea; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0">
              🏆
            </span>
            <div>
              <div style="font-size: 12px; font-weight: 800; color: var(--ink)">青少年巡回赛总决赛</div>
              <div style="font-size: 10.5px; color: var(--ink-3)">网球记实时比分 · 签表联动</div>
            </div>
          </button>
          <button class="hw-mini" @click="switchModule(5)">
            <span style="width: 34px; height: 34px; border-radius: 10px; background: #e9f7f1; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0">
              🏠
            </span>
            <div>
              <div style="font-size: 12px; font-weight: 800; color: var(--ink)">购房减5万 & 网球公寓</div>
              <div style="font-size: 10.5px; color: var(--ink-3)">房管局补贴 · 短/长租拎包住</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
