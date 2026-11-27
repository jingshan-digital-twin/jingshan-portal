<script setup lang="ts">
import { computed, ref } from 'vue'
import { TOUR_ROUTES } from '../../mock/data'
import { usePortalStore } from '../../store/usePortalStore'

const { state, openPhoto, openActionModal, openNavigation, createQuickOrder, toggleFavorite } = usePortalStore()
const scopeFilter = ref<'全部' | '京山本地' | '荆门周边' | '湖北省内'>('全部')

const visibleRoutes = computed(() =>
  scopeFilter.value === '全部'
    ? TOUR_ROUTES
    : TOUR_ROUTES.filter((r) => r.scope === scopeFilter.value),
)
</script>

<template>
  <section>
    <div class="module-header">
      <div class="mh-left">
        <div class="mh-num">03</div>
        <div>
          <h1 class="mh-title">“游”：旅游游览服务</h1>
          <div class="mh-desc">
            以京山打网球为起点延伸全域旅游（京山温泉景区 → 荆门周边 → 湖北省内），根据用户来源地智能推荐，配语音导览、游玩时长、网红打卡与骑行徒步线
          </div>
        </div>
      </div>
      <div class="mh-tabs">
        <button
          v-for="s in (['全部', '京山本地', '荆门周边', '湖北省内'] as const)"
          :key="s"
          class="m-tab"
          :class="{ active: scopeFilter === s }"
          @click="scopeFilter = s"
        >
          {{ s === '全部' ? '按来源地全览' : s + '延伸' }}
        </button>
      </div>
    </div>

    <div class="ticket-stub-banner mb-16">
      <div>
        <div style="font-size: 15px; font-weight: 900">
          🧭 已识别您的来源地：<span style="color: var(--lime)">{{ state.origin }}</span> · 为您定制「打完网球顺路游」全域线路
        </div>
        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.82); margin-top: 3px">
          以京山打网球为起点，辐射带动本地温泉景区、荆门钟祥明显陵/漳河、以及湖北省内襄阳/宜昌/武当山旅游资源！
        </div>
      </div>
      <div class="flex-row">
        <button class="tag" style="background: var(--lime); color: #0b251d; border: none" @click="scopeFilter = '京山本地'">① 京山本地</button>
        <button class="tag" style="background: rgba(255, 255, 255, 0.18); color: #fff; border: none" @click="scopeFilter = '荆门周边'">② 荆门周边</button>
        <button class="tag" style="background: rgba(255, 255, 255, 0.18); color: #fff; border: none" @click="scopeFilter = '湖北省内'">③ 湖北省内</button>
      </div>
    </div>

    <div class="grid-3 mb-16">
      <div v-for="route in visibleRoutes" :key="route.id" class="card">
        <div
          class="photo-box"
          style="height: 172px"
          @click="
            openPhoto({
              title: route.title,
              category: '景区与线路详情',
              photo: route.photo,
              rating: route.rating,
              subtitle: `${route.badge} ｜ ${route.audio}`,
              intro: route.intro,
              openHours: route.openHours,
              priceInfo: `门票 ¥${route.price}起 · 精品套票 ¥${route.pkgPrice}`,
              address: route.address,
              lng: route.lng,
              lat: route.lat,
              tags: route.tags,
              highlights: route.highlights,
              hotItemsTitle: '✨ 核心必打卡景点与体验',
              hotItems: route.hotItems,
              navTip: `${route.badge} · 凭京山网球电子票根享专线与联票优待`,
              reviews: route.detailedReviews,
            })
          "
        >
          <img :src="route.photo" :alt="route.title" />
          <span class="badge-tl">{{ route.badge }}</span>
          <span class="badge-bl">{{ route.audio }} · 点看景区详解</span>
        </div>
        <div class="card-pad">
          <div class="flex-between">
            <strong style="font-size: 15.5px">{{ route.title }}</strong>
            <span class="rating-pill">★ {{ route.rating }}</span>
          </div>
          <div style="font-size: 11.5px; color: var(--ink-3); margin: 4px 0">{{ route.desc }}</div>
          <div class="coord-bar">
            <span>📍 {{ route.address }}</span>
            <span class="coord-mono">{{ route.lng.toFixed(4) }}°E, {{ route.lat.toFixed(4) }}°N</span>
          </div>
          <div class="review-quote">💬 游客评：“{{ route.quote }}”</div>
          <div class="flex-between" style="margin-top: 10px">
            <span class="price">¥{{ route.price }}<small>/起 · 套票¥{{ route.pkgPrice }}</small></span>
            <div class="flex-row" style="gap: 5px">
              <button
                class="btn-ghost"
                style="padding: 5px 8px; font-size: 11.5px"
                @click="
                  openNavigation({
                    placeName: route.title,
                    address: route.address,
                    lng: route.lng,
                    lat: route.lat,
                    distance: route.distance,
                    driveMin: route.driveMin,
                    tip: `${route.badge} · 凭京山网球订场电子票根可享景区联票与专线优待`,
                  })
                "
              >
                🧭 导航
              </button>
              <button
                class="btn-ghost"
                style="padding: 5px 8px; font-size: 11.5px"
                @click="openActionModal({ type: 'audio', spotName: route.title, duration: route.duration, script: route.script, photo: route.photo })"
              >
                🎧 导览
              </button>
              <button class="btn-ghost" style="padding: 5px 7px" @click="toggleFavorite(route.title)">
                {{ state.favorites.includes(route.title) ? '❤️' : '🤍' }}
              </button>
              <button class="btn-primary" style="padding: 6px 10px" @click="createQuickOrder('门票', route.title, `${route.audio} · 持证旅行社保障`, route.price, 60)">
                预约门票
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card card-pad">
        <div class="flex-between" style="margin-bottom: 10px">
          <strong style="font-size: 15px">🚌 网球主题文旅专线（高铁→球场→景区串联）</strong>
          <button
            class="btn-ghost"
            @click="
              openNavigation({
                placeName: '绿林山景区游客中心',
                address: '湖北省荆门市京山市绿林镇绿林山风景区游客中心',
                lng: 112.9762,
                lat: 31.3418,
                distance: '46 km',
                driveMin: '约 50 分钟',
                tip: '文旅专线A每60分钟自国际网球中心发车，凭打球电子票根免费乘坐',
              })
            "
          >
            🧭 路线导航
          </button>
        </div>
        <div style="font-size: 12px; color: var(--ink-2); line-height: 1.85">
          <strong>专线A（生态山水线）：</strong>京山国际网球中心 → 文峰公园 → 惠亭湖 → 绿林山景区（每60分钟一班）<br />
          <strong>专线B（温泉康养线）：</strong>京山南站 → 网球训练基地 → 温泉度假区 → 空山洞（每30分钟一班）
        </div>
      </div>
      <div class="card card-pad">
        <div class="flex-between" style="margin-bottom: 10px">
          <strong style="font-size: 15px">🚴 骑行与生态徒步推荐路线（含实时语音导览）</strong>
          <span class="tag blue">负氧离子 3,200/cm³</span>
        </div>
        <div style="font-size: 12px; color: var(--ink-2); line-height: 1.85">
          <strong>惠亭湖环湖绿道骑行线：</strong>全程 14.5km · 建议游玩 1.5h · 沿途设3处补给驿站<br />
          <strong>文峰山轻徒步观景线：</strong>全程 5.2km · 建议游玩 1.2h · 登顶俯瞰京山网球公园网红全景
        </div>
      </div>
    </div>
  </section>
</template>
