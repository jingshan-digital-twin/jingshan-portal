<script setup lang="ts">
import { usePortalStore } from '../store/usePortalStore'
import type { LightboxReview } from '../types/portal'

const { state, openNavigation } = usePortalStore()

function isStructuredReview(rev: string | LightboxReview): rev is LightboxReview {
  return typeof rev !== 'string'
}

function jumpNav() {
  const lb = state.lightbox
  if (!lb || lb.lng === undefined || lb.lat === undefined) return
  const payload = {
    placeName: lb.title,
    address: lb.address ?? lb.subtitle,
    lng: lb.lng,
    lat: lb.lat,
    distance: '实时测距',
    driveMin: '高德/百度实时规划',
    tip: lb.navTip ?? '支持一键唤起高德地图或百度地图实时路线导航',
  }
  state.lightbox = null
  openNavigation(payload)
}
</script>

<template>
  <div v-if="state.lightbox" class="modal-backdrop" @click.self="state.lightbox = null">
    <div class="modal-box" style="width: 740px; max-height: 90vh; overflow-y: auto">
      <div class="photo-box" style="height: 270px; cursor: default">
        <img :src="state.lightbox.photo" :alt="state.lightbox.title" />
        <div
          style="
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(180deg, rgba(8, 25, 19, 0.12) 0%, rgba(8, 25, 19, 0.72) 100%);
            z-index: 2;
          "
        />
        <span class="badge-tl" style="z-index: 5">📸 {{ state.lightbox.category ?? '设施实景详情' }}</span>
        <span class="badge-bl" style="z-index: 5">★ {{ state.lightbox.rating.toFixed(1) }} 分 · 官方实景认证</span>
        <button
          type="button"
          style="
            position: absolute;
            top: 12px;
            right: 12px;
            z-index: 10;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 1.5px solid rgba(255, 255, 255, 0.45);
            background: rgba(11, 37, 29, 0.86);
            color: #fff;
            font-size: 14px;
            font-weight: 900;
            cursor: pointer;
          "
          @click.stop="state.lightbox = null"
        >
          ✕
        </button>
      </div>

      <div class="card-pad" style="display: flex; flex-direction: column; gap: 13px">
        <!-- 标题与基础信息 -->
        <div>
          <div class="flex-between" style="align-items: flex-start; gap: 10px">
            <div>
              <strong style="font-size: 19px; color: var(--ink)">{{ state.lightbox.title }}</strong>
              <div style="font-size: 12px; color: var(--ink-3); margin-top: 3px">{{ state.lightbox.subtitle }}</div>
            </div>
            <div class="flex-row" style="flex-shrink: 0">
              <button
                v-if="state.lightbox.lng !== undefined && state.lightbox.lat !== undefined"
                type="button"
                class="btn-primary"
                @click="jumpNav"
              >
                🧭 导航前往
              </button>
              <button type="button" class="btn-ghost" @click="state.lightbox = null">✕ 关闭</button>
            </div>
          </div>

          <!-- 亮点标签 -->
          <div v-if="state.lightbox.tags?.length" class="flex-row" style="margin-top: 9px">
            <span v-for="t in state.lightbox.tags" :key="t" class="tag green">{{ t }}</span>
          </div>
        </div>

        <!-- 实用信息条（开放时间 / 消费参考 / 地址坐标） -->
        <div
          v-if="state.lightbox.openHours || state.lightbox.priceInfo || state.lightbox.address"
          style="background: #f5faf8; border: 1px solid #d9ebe3; border-radius: 12px; padding: 10px 13px; display: flex; flex-direction: column; gap: 6px; font-size: 12px"
        >
          <div class="flex-row" style="gap: 16px">
            <span v-if="state.lightbox.openHours"><strong>🕒 开放/营业：</strong>{{ state.lightbox.openHours }}</span>
            <span v-if="state.lightbox.priceInfo"><strong>💰 费用/优惠：</strong><span style="color: var(--accent); font-weight: 800">{{ state.lightbox.priceInfo }}</span></span>
          </div>
          <div v-if="state.lightbox.address" class="flex-between">
            <span><strong>📍 精确地址：</strong>{{ state.lightbox.address }}</span>
            <span v-if="state.lightbox.lng !== undefined && state.lightbox.lat !== undefined" class="coord-mono">
              {{ state.lightbox.lng.toFixed(4) }}°E, {{ state.lightbox.lat.toFixed(4) }}°N
            </span>
          </div>
        </div>

        <!-- 详细介绍（景区介绍 / 餐馆故事 / 场馆简介） -->
        <div v-if="state.lightbox.intro">
          <strong style="font-size: 14px; display: block; margin-bottom: 5px">📖 详细介绍</strong>
          <div style="font-size: 12.5px; color: var(--ink-2); line-height: 1.75; background: #fbfdfd; border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px">
            {{ state.lightbox.intro }}
          </div>
        </div>

        <!-- 核心推荐 / 热门必吃 / 核心打卡点 -->
        <div v-if="state.lightbox.hotItems?.length">
          <strong style="font-size: 14px; display: block; margin-bottom: 7px">
            {{ state.lightbox.hotItemsTitle ?? '🔥 热门必体验推荐' }}
          </strong>
          <div class="grid-2" style="gap: 9px">
            <div
              v-for="item in state.lightbox.hotItems"
              :key="item.name"
              style="background: #fffaf3; border: 1px solid #f4deb8; border-radius: 10px; padding: 9px 11px"
            >
              <div class="flex-between" style="margin-bottom: 3px">
                <strong style="font-size: 12.5px; color: var(--ink)">{{ item.name }}</strong>
                <span v-if="item.price" style="font-size: 12px; font-weight: 900; color: var(--accent)">{{ item.price }}</span>
              </div>
              <div v-if="item.tag" style="margin-bottom: 3px">
                <span class="tag orange" style="font-size: 10px">{{ item.tag }}</span>
              </div>
              <div v-if="item.desc" style="font-size: 11.5px; color: var(--ink-3); line-height: 1.5">{{ item.desc }}</div>
            </div>
          </div>
        </div>

        <!-- 游玩贴士 / 服务亮点 -->
        <div v-if="state.lightbox.highlights?.length">
          <strong style="font-size: 14px; display: block; margin-bottom: 5px">✨ 亮点与游玩贴士</strong>
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--ink-2)">
            <div v-for="(hl, idx) in state.lightbox.highlights" :key="idx">• {{ hl }}</div>
          </div>
        </div>

        <!-- 热门真实评价 -->
        <div v-if="state.lightbox.reviews.length">
          <strong style="font-size: 14px; display: block; margin-bottom: 7px">
            💬 游客与球友热门评价（{{ state.lightbox.reviews.length }} 条精选）
          </strong>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <template v-for="(rev, idx) in state.lightbox.reviews" :key="idx">
              <div
                v-if="isStructuredReview(rev)"
                style="background: #f6faf8; border-left: 3px solid var(--primary); border-radius: 0 10px 10px 0; padding: 9px 12px"
              >
                <div class="flex-between" style="margin-bottom: 4px; font-size: 11.5px">
                  <div class="flex-row">
                    <strong>{{ rev.user }}</strong>
                    <span v-if="rev.origin" class="tag green" style="font-size: 10px">{{ rev.origin }}</span>
                    <span v-if="rev.score" style="color: #d6961f; font-weight: 800">★ {{ rev.score.toFixed(1) }}</span>
                  </div>
                  <span v-if="rev.date" style="color: var(--ink-3); font-size: 10.5px">{{ rev.date }}</span>
                </div>
                <div style="font-size: 12px; color: var(--ink-2); line-height: 1.6">{{ rev.content }}</div>
              </div>
              <div v-else class="review-quote" style="margin-top: 0">💬 {{ rev }}</div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
