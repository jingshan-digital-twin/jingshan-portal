<script setup lang="ts">
import { computed, onMounted } from 'vue'
import ActionDetailModal from './components/ActionDetailModal.vue'
import EventPopupModal from './components/EventPopupModal.vue'
import HeroSpotlightCarousel from './components/HeroSpotlightCarousel.vue'
import ListingDetailPage from './components/ListingDetailPage.vue'
import ModuleKingKongBar from './components/ModuleKingKongBar.vue'
import OrderSuccessModal from './components/OrderSuccessModal.vue'
import PortalHeader from './components/PortalHeader.vue'
import ReservationDialog from './components/ReservationDialog.vue'
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

    <!-- 独立全屏详情页模式 -->
    <template v-if="state.activeDetail">
      <ListingDetailPage />
    </template>

    <!-- 首页模式：首屏焦点图延伸至顶部频道栏下方 + 全板块信息总览与概括 -->
    <template v-else-if="!state.isStandalonePage">
      <HeroSpotlightCarousel>
        <template #top-nav>
          <ModuleKingKongBar overlaid />
        </template>
      </HeroSpotlightCarousel>

      <main id="moduleStageAnchor" class="container stage-wrap home-overview-stage" style="scroll-margin-top: 90px">
        <OverviewModule />
      </main>
    </template>

    <!-- 业务专区页面：统一频道导航 + 完整业务模块 -->
    <template v-else>
      <ModuleKingKongBar />
      <main id="moduleStageAnchor" class="container stage-wrap subpage-stage" style="scroll-margin-top: 90px">
        <component :is="activeComponent" />
      </main>
    </template>

    <footer class="footer">
      <div class="container footer-row">
        <div class="footer-brand">
          <span class="footer-mark" aria-hidden="true" />
          <span>© 2026 <strong>京山网球</strong> · 中国网球之城 · 京山网旅公众服务平台</span>
        </div>
        <div class="footer-meta">
          <span>指导单位：京山市文化和旅游局 · 市政数局 · 市房管局 · 卫健局</span>
          <span class="footer-sep" aria-hidden="true">|</span>
          <span>运营单位：京山网球产业发展有限公司</span>
        </div>
      </div>
    </footer>

    <ActionDetailModal />
    <EventPopupModal />
    <OrderSuccessModal />
    <ReservationDialog />

    <div v-if="state.toastMessage" class="toast-banner">
      <span style="color: var(--lime)">✔</span>
      <span>{{ state.toastMessage }}</span>
    </div>
  </div>
</template>
