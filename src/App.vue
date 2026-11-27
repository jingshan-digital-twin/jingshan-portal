<script setup lang="ts">
import { computed, onMounted } from 'vue'
import ActionDetailModal from './components/ActionDetailModal.vue'
import EventPopupModal from './components/EventPopupModal.vue'
import OrderSuccessModal from './components/OrderSuccessModal.vue'
import HeroSpotlightCarousel from './components/HeroSpotlightCarousel.vue'
import HomeSummaryStage from './components/HomeSummaryStage.vue'
import ListingDetailPage from './components/ListingDetailPage.vue'
import ModuleKingKongBar from './components/ModuleKingKongBar.vue'
import PortalHeader from './components/PortalHeader.vue'
import SubPageNavBar from './components/SubPageNavBar.vue'
import AmenitiesModule from './modules/amenities/AmenitiesModule.vue'
import EntertainmentModule from './modules/entertainment/EntertainmentModule.vue'
import FeedbackModule from './modules/feedback/FeedbackModule.vue'
import FoodModule from './modules/food/FoodModule.vue'
import MiniProgramModule from './modules/miniprogram/MiniProgramModule.vue'
import OverviewModule from './modules/overview/OverviewModule.vue'
import PlayModule from './modules/play/PlayModule.vue'
import ProfileModule from './modules/profile/ProfileModule.vue'
import ShopModule from './modules/shop/ShopModule.vue'
import StayModule from './modules/stay/StayModule.vue'
import TourModule from './modules/tour/TourModule.vue'
import TrainingModule from './modules/training/TrainingModule.vue'
import TransitModule from './modules/transit/TransitModule.vue'
import { usePortalStore } from './store/usePortalStore'

const { state, initHashRouting } = usePortalStore()

const moduleMap = {
  1: OverviewModule,
  2: PlayModule,
  3: TourModule,
  4: FoodModule,
  5: StayModule,
  6: TransitModule,
  7: ShopModule,
  8: EntertainmentModule,
  9: TrainingModule,
  10: AmenitiesModule,
  11: FeedbackModule,
  12: MiniProgramModule,
  13: ProfileModule,
} as const

const activeComponent = computed(() => moduleMap[state.activeModule])

onMounted(() => {
  initHashRouting()
})
</script>

<template>
  <div>
    <PortalHeader />

    <!-- 独立全屏详情页模式（参考爱彼迎大屏详情页布局） -->
    <template v-if="state.activeDetail">
      <ListingDetailPage />
    </template>

    <!-- 首页模式：顶部焦点轮播 + 金刚区 + 下方固定热门概览容器 -->
    <template v-else-if="!state.isStandalonePage">
      <!-- 核心热点/赛事/活动轮播宣传区 + 右侧三合一快捷办理卡 -->
      <HeroSpotlightCarousel />

      <!-- 13 模块切换摘要金刚区 -->
      <ModuleKingKongBar />

      <!-- 下方固定容器：按当前选中板块展示精炼摘要，并提供新窗口完整页面跳转入口 -->
      <main id="moduleStageAnchor" class="container stage-wrap" style="scroll-margin-top: 90px">
        <HomeSummaryStage />
      </main>
    </template>

    <!-- 独立专区页面（新窗口打开）：顶部面包屑导航 + 完整业务模块工作台 -->
    <template v-else>
      <SubPageNavBar />
      <main id="moduleStageAnchor" class="container stage-wrap subpage-stage" style="scroll-margin-top: 90px">
        <component :is="activeComponent" />
      </main>
    </template>

    <footer class="footer">
      <div class="container footer-row">
        <span>© 2026 <strong>京山网球</strong> · 中国网球之城 · 京山网旅公众服务平台</span>
        <span>指导单位：京山市文化和旅游局 · 市政数局 · 市房管局 · 卫健局 ｜ 运营单位：京山网球产业发展有限公司</span>
      </div>
    </footer>

    <ActionDetailModal />
    <EventPopupModal />
    <OrderSuccessModal />

    <div v-if="state.toastMessage" class="toast-banner">
      <span style="color: var(--lime)">✔</span>
      <span>{{ state.toastMessage }}</span>
    </div>
  </div>
</template>
