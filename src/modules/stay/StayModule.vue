<script setup lang="ts">
import { computed, ref } from 'vue'
import { HOTEL_PROFILES } from '../../mock/details'
import { BOOKING_DATES } from '../../mock/schedules'
import { usePortalStore } from '../../store/usePortalStore'

const { state, openActionModal, openNavigation, createQuickOrder, claimHomeSubsidy } = usePortalStore()
const stayTab = ref<'全部' | '公寓' | '赛事优惠' | '民宿'>('全部')
const checkInDate = ref(BOOKING_DATES[0]!.iso)
const checkOutDate = ref(BOOKING_DATES[2]!.iso)
const stayPriceFilter = ref<'全部' | '200以下' | '200-400' | '400以上'>('全部')
const staySort = ref<'default' | 'price' | 'rating'>('default')
const stayFacilities = ref<string[]>([])
const facilityOptions = ['免费停车', '快充充电桩', '免费赛场摆渡车', '天然私汤入户', '独立厨房/洗衣机']

function toggleFacility(f: string) {
  const idx = stayFacilities.value.indexOf(f)
  if (idx >= 0) stayFacilities.value.splice(idx, 1)
  else stayFacilities.value.push(f)
}

const nightsCount = computed(() => {
  const s = new Date(checkInDate.value).getTime()
  const e = new Date(checkOutDate.value).getTime()
  return Math.max(1, Math.round((e - s) / 86400000))
})

const filteredHotels = computed(() => {
  const list = HOTEL_PROFILES.filter((h) => {
    const okTab = stayTab.value === '全部' || h.category === stayTab.value
    const minP = h.rooms[0]?.eventPrice ?? 0
    const okPrice =
      stayPriceFilter.value === '全部' ||
      (stayPriceFilter.value === '200以下' && minP < 200) ||
      (stayPriceFilter.value === '200-400' && minP >= 200 && minP <= 400) ||
      (stayPriceFilter.value === '400以上' && minP > 400)
    const okFac = stayFacilities.value.every((f) => h.facilities.some((hf) => hf.includes(f.slice(0, 4))))
    return okTab && okPrice && okFac
  })
  return [...list].sort((a, b) => {
    if (staySort.value === 'price') return (a.rooms[0]?.eventPrice ?? 0) - (b.rooms[0]?.eventPrice ?? 0)
    if (staySort.value === 'rating') return b.rating - a.rating
    return 0
  })
})

const visibleCards = computed(() => filteredHotels.value)

function openHotelDetail(id: string) {
  state.activeHotelId = id
}
</script>

<template>
  <section>
    <div class="module-header">
      <div class="mh-left">
        <div class="mh-num">05</div>
        <div>
          <h1 class="mh-title">“住”：住宿服务</h1>
        </div>
      </div>
      <div class="mh-tabs">
        <button class="m-tab" :class="{ active: stayTab === '全部' }" @click="stayTab = '全部'">全部住宿 (6家)</button>
        <button class="m-tab" :class="{ active: stayTab === '公寓' }" @click="stayTab = '公寓'">短/长租网球公寓</button>
        <button class="m-tab" :class="{ active: stayTab === '赛事优惠' }" @click="stayTab = '赛事优惠'">赛事合作优惠专区</button>
        <button class="m-tab" :class="{ active: stayTab === '民宿' }" @click="stayTab = '民宿'">温泉精品民宿</button>
      </div>
    </div>

    <!-- 房管局网球公开赛购房减5万元 -->
    <div class="promo-banner mb-16">
      <div class="flex-row" style="gap: 12px">
        <div
          style="width: 44px; height: 44px; border-radius: 0; background: #ff5d2a; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0"
        >
          🏠
        </div>
        <div>
          <div style="font-size: 15.5px; font-weight: 900; color: #542600">
            京山市房管局重磅活动：2026京山网球公开赛期间购房直减 ¥50,000！
          </div>
          <div style="font-size: 12px; color: #824e17">
            凭「京山网球」参赛/观赛/订场实名记录，购买核心区「温泉世家」「网球新城」等品质住宅立享 5 万元专属购房补贴（可预约看房专车）
          </div>
        </div>
      </div>
      <div class="flex-row">
        <button
          class="btn-ghost"
          @click="openActionModal({ type: 'inquiry', title: '预约房管局赛事安居看房专车', subtitle: '温泉世家 / 网球新城品质现房 · 凭网球赛事/订场凭证立减 ¥50,000', submitLabel: '预约免费看房专车' })"
        >
          预约看房专车
        </button>
        <button class="btn-orange" @click="claimHomeSubsidy">
          {{ state.claimedHomeSubsidy ? '✅ 已领取5万元补贴凭证' : '领取5万元购房补贴券 →' }}
        </button>
      </div>
    </div>

    <!-- 入住日期、价格区间与配套筛选 -->
    <div class="card card-pad mb-16 filter-workbench">
      <div class="filter-rows">
        <div class="filter-row">
          <span class="filter-label">入住日期：</span>
          <select v-model="checkInDate" class="f-input" style="width: 145px; padding: 5px 9px">
            <option v-for="d in BOOKING_DATES.slice(0, 6)" :key="`in-${d.iso}`" :value="d.iso">{{ d.shortDate }} {{ d.weekday }}</option>
          </select>
          <span class="filter-label">离店日期：</span>
          <select v-model="checkOutDate" class="f-input" style="width: 145px; padding: 5px 9px">
            <option v-for="d in BOOKING_DATES.slice(1)" :key="`out-${d.iso}`" :value="d.iso">{{ d.shortDate }} {{ d.weekday }}</option>
          </select>
          <span class="tag green">共住 {{ nightsCount }} 晚</span>
          <span class="filter-divider" />
          <span class="filter-label">价格：</span>
          <button
            v-for="p in (['全部', '200以下', '200-400', '400以上'] as const)"
            :key="p"
            class="filter-pill"
            :class="{ active: stayPriceFilter === p }"
            @click="stayPriceFilter = p"
          >
            {{ p === '全部' ? '不限' : `¥${p}` }}
          </button>
          <select v-model="staySort" class="f-input" style="width: auto; padding: 5px 10px; margin-left: auto">
            <option value="default">综合推荐</option>
            <option value="price">价格最低</option>
            <option value="rating">评分最高</option>
          </select>
        </div>
        <div class="filter-row">
          <span class="filter-label">设施筛选：</span>
          <button
            v-for="f in facilityOptions"
            :key="f"
            class="filter-pill"
            :class="{ active: stayFacilities.includes(f) }"
            @click="toggleFacility(f)"
          >
            {{ f }}
          </button>
          <span style="margin-left: auto; font-size: 12px; font-weight: 800; color: var(--primary)">
            符合条件：{{ visibleCards.length }} 家精选住宿
          </span>
        </div>
      </div>
    </div>

    <!-- 精选酒店/公寓/民宿卡片（含完整房型与价格、坐标导航、点击查看完整详情） -->
    <div class="grid-3 mb-16">
      <div
        v-for="hotel in visibleCards"
        :key="hotel.id"
        class="card"
        :style="hotel.category === '公寓' ? 'border: 2px solid var(--primary)' : ''"
      >
        <div
          class="photo-box"
          style="height: 175px"
          @click="openHotelDetail(hotel.id)"
        >
          <img :src="hotel.photo" :alt="hotel.name" />
          <span class="badge-tl" :style="hotel.category === '公寓' ? 'background: var(--primary)' : ''">
            {{ hotel.badge }}
          </span>
          <span class="badge-bl">{{ hotel.subBadge }} · 共{{ hotel.rooms.length }}种房型</span>
        </div>

        <div class="card-pad">
          <div class="flex-between">
            <strong style="font-size: 15.5px; cursor: pointer" @click="openHotelDetail(hotel.id)">
              {{ hotel.name }}
            </strong>
            <span class="rating-pill">★ {{ hotel.rating }} ({{ hotel.reviewCount }}评)</span>
          </div>

          <div class="coord-bar">
            <span>📍 {{ hotel.address }}</span>
          </div>

          <!-- 房型与透明价格预览（前2种房型 + 点击展开全部） -->
          <div style="background: #f5f9f7; border: 1px solid #dfece6; border-radius: 0; padding: 8px 10px; margin: 7px 0">
            <div
              v-for="rm in hotel.rooms.slice(0, 2)"
              :key="rm.id"
              class="flex-between"
              style="padding: 4px 0; border-bottom: 1px dashed #e1ece7; font-size: 11.5px"
            >
              <div>
                <strong style="color: var(--ink)">{{ rm.name }}</strong>
                <div style="font-size: 10.5px; color: var(--ink-3)">{{ rm.area }} · {{ rm.bed }} · {{ rm.breakfast }}</div>
              </div>
              <div style="text-align: right; flex-shrink: 0">
                <s style="font-size: 10px; color: #9aa7a2; margin-right: 4px">¥{{ rm.originalPrice }}</s>
                <strong style="color: var(--accent); font-size: 13.5px">¥{{ rm.eventPrice }}{{ rm.leaseUnit }}</strong>
                <div style="font-size: 10px; color: var(--primary)">余{{ rm.remaining }}间</div>
              </div>
            </div>
            <div
              style="font-size: 11px; color: var(--primary); font-weight: 800; padding-top: 5px; cursor: pointer; display: flex; justify-content: space-between"
              @click="openHotelDetail(hotel.id)"
            >
              <span>✨ 配套：{{ hotel.facilities.slice(0, 3).join(' · ') }}</span>
              <span>查看全部 {{ hotel.rooms.length }} 种房型与详情 →</span>
            </div>
          </div>

          <div class="review-quote">💬 {{ hotel.reviews[0]?.user }}：“{{ hotel.reviews[0]?.content }}”</div>

          <div class="flex-between" style="margin-top: 10px">
            <span class="price">
              ¥{{ hotel.rooms[0]?.eventPrice }}
              <small>{{ hotel.rooms[0]?.leaseUnit }}起 · 原价¥{{ hotel.rooms[0]?.originalPrice }}</small>
            </span>
            <div class="flex-row" style="gap: 5px">
              <button
                class="btn-ghost"
                style="padding: 5px 8px; font-size: 11.5px"
                @click="
                  openNavigation({
                    placeName: hotel.name,
                    address: hotel.address,
                    lng: hotel.lng,
                    lat: hotel.lat,
                    distance: hotel.distanceToCourt,
                    driveMin: '约 5 分钟',
                    tip: `${hotel.openYear} · 前台电话 ${hotel.phone}`,
                  })
                "
              >
                🧭 导航
              </button>
              <button class="btn-primary" style="padding: 6px 11px" @click="openHotelDetail(hotel.id)">
                详情与选房
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 全部 6 家住宿房型与价格透明对照表 -->
    <div class="card card-pad">
      <strong style="font-size: 14.5px; display: block; margin-bottom: 8px">
        📋 赛事合作住宿 & 网球公寓房型价格一览
      </strong>
      <table class="clean-table">
        <thead>
          <tr>
            <th>住宿名称 & 地址</th>
            <th>类型</th>
            <th>距赛场</th>
            <th>全部可选房型</th>
            <th>日常价 → 赛事/票根价</th>
            <th>评分</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in HOTEL_PROFILES" :key="h.id">
            <td>
              <strong style="cursor: pointer; color: var(--primary-dark)" @click="openHotelDetail(h.id)">{{ h.name }}</strong>
              <div style="font-size: 10.5px; color: var(--ink-3)">📍 {{ h.address }}</div>
            </td>
            <td>
              <span class="tag" :class="h.category === '公寓' ? 'green' : h.category === '民宿' ? 'orange' : 'blue'">
                {{ h.category === '公寓' ? '短/长租公寓' : h.category === '民宿' ? '温泉民宿' : '联盟酒店' }}
              </span>
            </td>
            <td>{{ h.distanceToCourt }}</td>
            <td>
              <div style="font-weight: 700">{{ h.rooms[0]?.name }}</div>
              <div style="font-size: 10.5px; color: var(--ink-3)">共 {{ h.rooms.length }} 种房型可选（{{ h.rooms[0]?.area }}）</div>
            </td>
            <td>
              <s style="color: #888">¥{{ h.rooms[0]?.originalPrice }}</s> →
              <strong style="color: var(--accent)">¥{{ h.rooms[0]?.eventPrice }}{{ h.rooms[0]?.leaseUnit }}</strong>
            </td>
            <td>★ {{ h.rating }}</td>
            <td>
              <div class="flex-row" style="gap: 5px">
                <button class="btn-ghost" style="padding: 4px 8px; font-size: 11px" @click="openHotelDetail(h.id)">
                  酒店详情
                </button>
                <button
                  class="btn-primary"
                  style="padding: 4px 9px; font-size: 11px"
                  @click="
                    createQuickOrder(
                      '住宿',
                      `${h.name} · ${h.rooms[0]?.name ?? '标准房'}`,
                      `已核销电子票根 ${state.ticketStubCode} · ${h.rooms[0]?.breakfast ?? ''}`,
                      h.rooms[0]?.eventPrice ?? 298,
                      60,
                    )
                  "
                >
                  一键预订
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
