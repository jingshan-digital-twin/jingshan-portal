<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { HOTEL_PROFILES } from '../../mock/details'
import { BOOKING_DATES } from '../../mock/schedules'
import { usePortalStore } from '../../store/usePortalStore'

const { state, openHotelDetail, openActionModal, openNavigation, createQuickOrder, claimHomeSubsidy } = usePortalStore()
const PAGE_SIZE = 4
const stayTab = ref<'公寓' | '赛事优惠' | '民宿'>('公寓')
const stayKeyword = ref('')
const stayPage = ref(1)
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
  const q = stayKeyword.value.trim().toLowerCase()
  const list = HOTEL_PROFILES.filter((h) => {
    const okTab = h.category === stayTab.value
    const okQ = !q || h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q) || h.rooms.some((r) => r.name.toLowerCase().includes(q))
    const minP = h.rooms[0]?.eventPrice ?? 0
    const okPrice =
      stayPriceFilter.value === '全部' ||
      (stayPriceFilter.value === '200以下' && minP < 200) ||
      (stayPriceFilter.value === '200-400' && minP >= 200 && minP <= 400) ||
      (stayPriceFilter.value === '400以上' && minP > 400)
    const okFac = stayFacilities.value.every((f) => h.facilities.some((hf) => hf.includes(f.slice(0, 4))))
    return okTab && okQ && okPrice && okFac
  })
  return [...list].sort((a, b) => {
    if (staySort.value === 'price') return (a.rooms[0]?.eventPrice ?? 0) - (b.rooms[0]?.eventPrice ?? 0)
    if (staySort.value === 'rating') return b.rating - a.rating
    return 0
  })
})

const visibleCards = computed(() => {
  const start = (stayPage.value - 1) * PAGE_SIZE
  return filteredHotels.value.slice(start, start + PAGE_SIZE)
})

watch(filteredHotels, () => {
  stayPage.value = 1
})
</script>

<template>
  <section>
    <div class="module-toolbar">
      <div class="mh-tabs">
        <button class="m-tab" :class="{ active: stayTab === '公寓' }" @click="stayTab = '公寓'">短/长租网球公寓</button>
        <button class="m-tab" :class="{ active: stayTab === '赛事优惠' }" @click="stayTab = '赛事优惠'">赛事合作优惠专区</button>
        <button class="m-tab" :class="{ active: stayTab === '民宿' }" @click="stayTab = '民宿'">温泉精品民宿</button>
      </div>
    </div>

    <!-- 房管局网球公开赛购房减5万元 -->
    <div class="promo-banner mb-16">
      <div class="flex-row" style="gap: 12px">
        <div
          style="width: 46px; height: 46px; border-radius: 0; background: #ff5d2a; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0"
        >
          🏠
        </div>
        <div style="font-size: 17.5px; font-weight: 900; color: #542600">
          京山市房管局重磅活动：2026京山网球公开赛期间购房直减 ¥50,000！
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
          {{ state.claimedHomeSubsidy ? '✅ 已领取5万元补贴券' : '领取5万元购房补贴券 →' }}
        </button>
      </div>
    </div>

    <!-- 入住日期、价格区间与配套筛选 -->
    <div class="card card-pad mb-16 filter-workbench">
      <div class="filter-rows">
        <div class="filter-row">
          <span class="filter-label">入住日期：</span>
          <select v-model="checkInDate" class="f-input" style="width: 155px; padding: 7px 10px">
            <option v-for="d in BOOKING_DATES.slice(0, 6)" :key="`in-${d.iso}`" :value="d.iso">{{ d.shortDate }} {{ d.weekday }}</option>
          </select>
          <span class="filter-label">离店日期：</span>
          <select v-model="checkOutDate" class="f-input" style="width: 155px; padding: 7px 10px">
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
          <select v-model="staySort" class="f-input" style="width: auto; padding: 7px 10px; margin-left: auto">
            <option value="default">综合推荐</option>
            <option value="price">价格最低</option>
            <option value="rating">评分最高</option>
          </select>
        </div>
        <div class="filter-row">
          <div class="search-bar" style="width: 240px; height: 40px">
            <span>🔍</span>
            <input v-model="stayKeyword" type="text" placeholder="搜索酒店、公寓、房型…" />
          </div>
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
          <span style="margin-left: auto; font-size: 14px; font-weight: 800; color: var(--primary)">
            符合条件：{{ filteredHotels.length }} 家
          </span>
        </div>
      </div>
    </div>

    <!-- 精选酒店/公寓/民宿卡片（每页4家） -->
    <div class="grid-2 mb-16">
      <div
        v-for="hotel in visibleCards"
        :key="hotel.id"
        class="card"
        :style="hotel.category === '公寓' ? 'border: 2px solid var(--primary)' : ''"
      >
        <div
          class="photo-box"
          style="height: 185px"
          @click="openHotelDetail(hotel.id)"
        >
          <img :src="hotel.photo" :alt="hotel.name" />
          <span class="badge-tl" :style="hotel.category === '公寓' ? 'background: var(--primary)' : ''">
            {{ hotel.badge }}
          </span>
        </div>

        <div class="card-pad">
          <div class="flex-between" style="margin-bottom: 6px">
            <strong style="font-size: 17.5px; cursor: pointer" @click="openHotelDetail(hotel.id)">
              {{ hotel.name }}
            </strong>
            <span class="rating-pill">★ {{ hotel.rating }}</span>
          </div>

          <div class="coord-bar">
            <span>📍 {{ hotel.distanceToCourt }} · {{ hotel.address.replace('湖北省荆门市京山市', '') }}</span>
          </div>

          <!-- 房型与透明价格预览（前2种房型 + 点击展开全部） -->
          <div style="background: #f5f9f7; border: 1px solid #dfece6; border-radius: 0; padding: 10px 14px; margin: 10px 0">
            <div
              v-for="rm in hotel.rooms.slice(0, 2)"
              :key="rm.id"
              class="flex-between"
              style="padding: 6px 0; border-bottom: 1px dashed #e1ece7; font-size: 13.5px"
            >
              <div>
                <strong style="color: var(--ink)">{{ rm.name }}</strong>
                <div style="font-size: 12.5px; color: var(--ink-3)">{{ rm.area }} · {{ rm.breakfast }}</div>
              </div>
              <div style="text-align: right; flex-shrink: 0">
                <strong style="color: var(--accent); font-size: 15.5px">¥{{ rm.eventPrice }}{{ rm.leaseUnit }}</strong>
                <div style="font-size: 12px; color: var(--primary)">余{{ rm.remaining }}间</div>
              </div>
            </div>
            <div
              style="font-size: 13.5px; color: var(--primary); font-weight: 800; padding-top: 8px; cursor: pointer; display: flex; justify-content: space-between"
              @click="openHotelDetail(hotel.id)"
            >
              <span>{{ hotel.facilities.slice(0, 2).join(' · ') }}</span>
              <span>查看全部 {{ hotel.rooms.length }} 种房型 →</span>
            </div>
          </div>

          <div class="flex-between" style="margin-top: 14px">
            <span class="price">
              ¥{{ hotel.rooms[0]?.eventPrice }}
              <small>{{ hotel.rooms[0]?.leaseUnit }}起</small>
            </span>
            <div class="flex-row" style="gap: 8px">
              <button
                class="btn-ghost"
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
              <button class="btn-primary" @click="openHotelDetail(hotel.id)">
                详情与选房
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mb-16">
      <PaginationBar
        :total="filteredHotels.length"
        :page="stayPage"
        :page-size="PAGE_SIZE"
        unit="家住宿"
        @update:page="stayPage = $event"
      />
    </div>

    <!-- 全部 6 家住宿房型与价格透明对照表 -->
    <div class="card card-pad">
      <strong style="font-size: 17.5px; display: block; margin-bottom: 12px">
        📋 赛事合作住宿 & 网球公寓房型价格一览
      </strong>
      <table class="clean-table">
        <thead>
          <tr>
            <th>住宿名称</th>
            <th>类型</th>
            <th>距赛场</th>
            <th>主推房型</th>
            <th>赛事/票根价</th>
            <th>评分</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in HOTEL_PROFILES" :key="h.id">
            <td>
              <strong style="cursor: pointer; color: var(--primary-dark)" @click="openHotelDetail(h.id)">{{ h.name }}</strong>
              <div style="font-size: 12.5px; color: var(--ink-3)">{{ h.address.replace('湖北省荆门市京山市', '') }}</div>
            </td>
            <td>
              <span class="tag" :class="h.category === '公寓' ? 'green' : h.category === '民宿' ? 'orange' : 'blue'">
                {{ h.category === '公寓' ? '网球公寓' : h.category === '民宿' ? '温泉民宿' : '联盟酒店' }}
              </span>
            </td>
            <td>{{ h.distanceToCourt }}</td>
            <td>
              <div style="font-weight: 700">{{ h.rooms[0]?.name }}</div>
              <div style="font-size: 12.5px; color: var(--ink-3)">共 {{ h.rooms.length }} 种房型</div>
            </td>
            <td>
              <strong style="color: var(--accent); font-size: 15px">¥{{ h.rooms[0]?.eventPrice }}{{ h.rooms[0]?.leaseUnit }}</strong>
            </td>
            <td>★ {{ h.rating }}</td>
            <td>
              <div class="flex-row" style="gap: 6px">
                <button class="btn-ghost" style="padding: 5px 10px; font-size: 13px" @click="openHotelDetail(h.id)">
                  详情
                </button>
                <button
                  class="btn-primary"
                  style="padding: 5px 12px; font-size: 13px"
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
                  预订
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
