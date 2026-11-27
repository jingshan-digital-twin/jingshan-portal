<script setup lang="ts">
import { computed, ref } from 'vue'
import ServiceCircleMap from '../../components/ServiceCircleMap.vue'
import { usePortalStore } from '../../store/usePortalStore'
import type { RadiusOption } from '../../types/portal'

const {
  state,
  switchModule,
  openPhoto,
  openBookingModal,
  openActionModal,
  openNavigation,
  refreshLiveScores,
  createQuickOrder,
  showToast,
} = usePortalStore()

const subView = ref<'all' | 'courts' | 'scores' | 'matchmaking'>('all')
const radii: RadiusOption[] = ['500m', '1公里', '2公里']
const surfaces: ('全部' | '硬地' | '红土' | '室内风雨')[] = ['全部', '硬地', '红土', '室内风雨']

const filteredCourts = computed(() =>
  state.courts.filter((c) => {
    const okSurface =
      state.courtSurfaceFilter === '全部' || c.surfaces.includes(state.courtSurfaceFilter)
    const okRegion = state.courtRegionFilter === '全部' || c.region === state.courtRegionFilter
    return okSurface && okRegion
  }),
)
</script>

<template>
  <section>
    <div class="module-header">
      <div class="mh-left">
        <div class="mh-num">02</div>
        <div>
          <h1 class="mh-title">“打”：网球场地服务</h1>
          <div class="mh-desc">
            全市地图检索（实景/实况直播/开放时间/收费标准）、订场支付取消、周边500m/1公里/2公里服务圈、车位充电桩联动预约、网球记实时比分、陪练与康复
          </div>
        </div>
      </div>
      <div class="mh-tabs">
        <button class="m-tab" :class="{ active: subView === 'all' }" @click="subView = 'all'">全部功能</button>
        <button class="m-tab" :class="{ active: subView === 'scores' }" @click="subView = 'scores'">网球记实时赛况</button>
        <button class="m-tab" :class="{ active: subView === 'courts' }" @click="subView = 'courts'">在线订场与地图</button>
        <button class="m-tab" :class="{ active: subView === 'matchmaking' }" @click="subView = 'matchmaking'">
          陪练/约球({{ state.abilityLevel }})与康复
        </button>
      </div>
    </div>

    <!-- 网球记实时赛事比分看板 -->
    <div
      v-if="subView === 'all' || subView === 'scores'"
      class="card card-pad mb-16"
      style="background: linear-gradient(135deg, #092d22, #0e4936); color: #fff"
    >
      <div class="flex-between" style="margin-bottom: 10px">
        <div class="flex-row">
          <strong style="font-size: 15px">📊 正在进行的赛事实时比分与场次占用</strong>
          <span class="tag" style="background: var(--lime); color: #0b251d">实时对接「网球记」小程序数据</span>
        </div>
        <div class="flex-row">
          <button
            class="btn-ghost"
            style="background: rgba(255, 255, 255, 0.14); color: #fff; border-color: rgba(255, 255, 255, 0.28)"
            @click="refreshLiveScores"
          >
            🔄 刷新实时比分
          </button>
          <button
            class="btn-ghost"
            style="background: rgba(255, 255, 255, 0.14); color: #fff; border-color: rgba(255, 255, 255, 0.28)"
            @click="switchModule(6)"
          >
            🚦 查赛期封闭限行与停车
          </button>
          <button
            class="btn-orange"
            @click="createQuickOrder('门票', `京山周末分级赛（${state.abilityLevel}组）报名`, '完赛积+120分 · 赠联盟票根券', 120, 120)"
          >
            立即报名参赛
          </button>
        </div>
      </div>
      <div class="score-grid">
        <div
          v-for="m in state.liveMatches"
          :key="m.id"
          class="score-card"
        >
          <div class="sc-head">
            <span>📍 {{ m.venue }} · <strong>{{ m.courtNo }}</strong></span>
            <span :style="{ color: m.status === '已完赛' ? 'var(--lime)' : '#FF7B6B' }">
              {{ m.status === '已完赛' ? '✅' : '🔴' }} {{ m.status }}
            </span>
          </div>
          <div style="font-size: 10.5px; color: rgba(255, 255, 255, 0.62); margin-bottom: 6px">
            {{ m.round }} · 耗时 {{ m.duration }}
          </div>
          <div class="sc-row">
            <span>{{ m.playerA }}</span>
            <div class="sc-sets">
              <span v-for="(s, idx) in m.setsA" :key="idx" :class="{ cur: idx > 0 && m.status !== '已完赛' }">
                {{ s }}
              </span>
            </div>
          </div>
          <div class="sc-row">
            <span>{{ m.playerB }}</span>
            <div class="sc-sets">
              <span v-for="(s, idx) in m.setsB" :key="idx">{{ s }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 左侧订场（含地面/区域筛选 + 3大场馆） + 右侧 500m/1公里/2公里 服务圈地图 -->
    <div v-if="subView === 'all' || subView === 'courts'" class="grid-split mb-16">
      <div style="display: flex; flex-direction: column; gap: 12px">
        <div class="card card-pad flex-between" style="padding: 10px 14px; background: #fafdfc">
          <div class="flex-row">
            <strong style="font-size: 12.5px">地面筛选：</strong>
            <button
              v-for="sf in surfaces"
              :key="sf"
              class="m-tab"
              :class="{ active: state.courtSurfaceFilter === sf }"
              @click="state.courtSurfaceFilter = sf"
            >
              {{ sf }}
            </button>
          </div>
          <div class="flex-row">
            <select v-model="state.courtRegionFilter" class="f-input" style="width: auto; padding: 4px 10px; font-size: 12px">
              <option value="全部">全部片区</option>
              <option value="温泉街道">温泉街道</option>
              <option value="新市街道">新市街道</option>
            </select>
            <span class="tag green">共 {{ filteredCourts.length }} 处精选场馆</span>
          </div>
        </div>

        <div v-for="venue in filteredCourts" :key="venue.id" class="court-item">
          <div
            class="photo-box"
            style="height: 196px; border-radius: 12px"
            @click="
              openPhoto({
                title: venue.name,
                category: '网球场馆实景详情',
                photo: venue.photo,
                rating: venue.rating,
                subtitle: `${venue.region} ｜ ${venue.reviewCount}条球友真实评价`,
                intro: `${venue.name}采用国际网联(ITF)赛事级场地涂装与防眩光专业灯光，支持扫码自助开灯、实时视频画面查看与开场前2小时免费取消；订场同时可一键联动锁位${venue.parkingName}与${venue.chargerName}，完赛自动激活79家联盟商家电子票根。`,
                openHours: venue.openHours,
                priceInfo: venue.priceDesc,
                address: venue.address,
                lng: venue.lng,
                lat: venue.lat,
                tags: venue.tags,
                hotItemsTitle: '🎾 场馆核心配套与特色服务',
                hotItems: [
                  { name: '订场联动停车预约', price: `剩余 ${venue.parkingRemain} 位`, tag: '免费停3h', desc: venue.parkingName },
                  { name: '120kW 智慧快充联动', price: `闲置 ${venue.chargerRemain} 桩`, tag: '打球即满电', desc: venue.chargerName },
                ],
                reviews: [
                  { user: '武汉球友老林', origin: '武汉', score: 5.0, date: '2026-11-24', content: venue.quote.replace(/^.*评：“|”$/g, '') },
                  { user: '长沙球友小郑', origin: '长沙', score: 4.9, date: '2026-11-21', content: '场地弹性与夜间灯光都是一流水平，更衣室热水充足，周边吃住走几步就能搞定！' },
                ],
              })
            "
          >
            <img :src="venue.photo" :alt="venue.name" />
            <span class="badge-tl"><span class="live-dot" />实况直播 · {{ venue.liveViewers }}人在看</span>
            <span class="badge-bl">★ {{ venue.rating }}分 · 点看实景{{ venue.galleryCount }}图</span>
          </div>
          <div>
            <div class="flex-between">
              <strong style="font-size: 16px">{{ venue.name }}</strong>
              <span class="rating-pill">★ {{ venue.rating }} ({{ venue.reviewCount }}条评价)</span>
            </div>
            <div style="font-size: 11.5px; color: var(--ink-3); margin: 3px 0">
              📍 {{ venue.address }}（<span class="coord-mono">{{ venue.lng.toFixed(4) }}°E, {{ venue.lat.toFixed(4) }}°N</span>）｜ 🕒 {{ venue.openHours }} ｜ 💰 {{ venue.priceDesc }}
            </div>
            <div class="slots-4">
              <div
                v-for="slot in venue.slots"
                :key="slot.time"
                class="slot"
                :class="{ hot: slot.remaining <= 3 && !slot.booked }"
                @click="
                  openBookingModal({
                    venueId: venue.id,
                    venueName: venue.name,
                    slotTime: slot.time,
                    price: slot.price,
                    memberPrice: slot.memberPrice,
                    parkingName: venue.parkingName,
                    chargerName: venue.chargerName,
                  })
                "
              >
                <strong>{{ slot.time }}</strong>
                <span>
                  {{ slot.booked ? '已订 · 可取消' : slot.price === 0 ? '公益免费' : `可约 ¥${slot.memberPrice}` }}
                </span>
              </div>
            </div>

            <div class="link-park-box">
              <span>
                ☑️ 订场联动预约：<strong>🅿️ {{ venue.parkingName }}</strong> +
                <strong>⚡ {{ venue.chargerName }}</strong>
              </span>
              <span style="text-decoration: underline; cursor: pointer" @click="switchModule(6)">切换车位/桩</span>
            </div>
            <div class="review-quote">💬 {{ venue.quote }}</div>
            <div class="flex-between" style="margin-top: 8px">
              <span class="tag green" style="cursor: pointer" @click="openActionModal({ type: 'stub', code: state.ticketStubCode })">
                🎫 查看「网球联盟电子票根」
              </span>
              <div class="flex-row">
                <button
                  class="btn-ghost"
                  @click="
                    openNavigation({
                      placeName: venue.name.split('（')[0] ?? venue.name,
                      address: venue.address,
                      lng: venue.lng,
                      lat: venue.lat,
                      distance: '2.5 km',
                      driveMin: '约 6 分钟',
                      tip: `支持联动预约 ${venue.parkingName} 与 ${venue.chargerName}`,
                    })
                  "
                >
                  🧭 导航
                </button>
                <button
                  class="btn-ghost"
                  @click="openActionModal({ type: 'livecam', venueName: venue.name, photo: venue.photo, viewers: venue.liveViewers })"
                >
                  📹 看实时画面
                </button>
                <button
                  class="btn-primary"
                  @click="
                    openBookingModal({
                      venueId: venue.id,
                      venueName: venue.name,
                      slotTime: venue.slots[1]?.time ?? '16:00',
                      price: venue.slots[1]?.price ?? 80,
                      memberPrice: venue.slots[1]?.memberPrice ?? 68,
                      parkingName: venue.parkingName,
                      chargerName: venue.chargerName,
                    })
                  "
                >
                  在线支付订场
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-pad flex-between" style="border-bottom: 1px solid var(--line); background: #fafdfc">
          <strong style="font-size: 14px">🗺️ 订场周边服务设施（支持三档半径切换）</strong>
          <div class="flex-row">
            <button
              v-for="r in radii"
              :key="r"
              class="m-tab"
              :class="{ active: state.radius === r }"
              @click="state.radius = r"
            >
              {{ r }}
            </button>
          </div>
        </div>
        <ServiceCircleMap mode="courts" :radius="state.radius" />
        <div class="card-pad">
          <div class="flex-between" style="margin-bottom: 8px">
            <strong style="font-size: 13px">当前 {{ state.radius }} 范围内可直达配套（含实景与评分）</strong>
            <button
              class="btn-ghost"
              style="padding: 4px 9px; font-size: 11px"
              @click="
                openNavigation({
                  placeName: '京山国际网球中心',
                  address: '湖北省荆门市京山市温泉街道网球大道1号',
                  lng: 113.1195,
                  lat: 31.0218,
                  distance: '3.2 km',
                  driveMin: '约 8 分钟',
                  tip: '温泉大道东段赛事临时封闭，系统已为您规划从京山大道西入口直达 P1 停车场',
                })
              "
            >
              🗺️ 跳转高德/百度导航
            </button>
          </div>
          <div class="grid-4" style="gap: 8px; text-align: center">
            <div style="background: #f3f8f6; padding: 7px 4px; border-radius: 9px; cursor: pointer" @click="switchModule(5)">
              <strong style="color: var(--primary); display: block">
                {{ state.radius === '500m' ? 2 : state.radius === '1公里' ? 6 : 14 }} 家
              </strong>
              <span style="font-size: 10.5px; color: var(--ink-3)">联盟酒店/公寓</span>
            </div>
            <div style="background: #f3f8f6; padding: 7px 4px; border-radius: 9px; cursor: pointer" @click="switchModule(4)">
              <strong style="color: var(--primary); display: block">
                {{ state.radius === '500m' ? 5 : state.radius === '1公里' ? 19 : 42 }} 家
              </strong>
              <span style="font-size: 10.5px; color: var(--ink-3)">餐饮/夜市</span>
            </div>
            <div style="background: #f3f8f6; padding: 7px 4px; border-radius: 9px; cursor: pointer" @click="switchModule(6)">
              <strong style="color: var(--primary); display: block">
                {{ state.radius === '500m' ? 12 : state.radius === '1公里' ? 18 : 36 }} 桩
              </strong>
              <span style="font-size: 10.5px; color: var(--ink-3)">可约充电桩</span>
            </div>
            <div style="background: #f3f8f6; padding: 7px 4px; border-radius: 9px; cursor: pointer" @click="switchModule(10)">
              <strong style="color: var(--primary); display: block">
                {{ state.radius === '500m' ? 1 : state.radius === '1公里' ? 3 : 6 }} 处
              </strong>
              <span style="font-size: 10.5px; color: var(--ink-3)">医疗/运动康复</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 下方4大子服务卡片 -->
    <div v-if="subView === 'all' || subView === 'matchmaking'" class="grid-4">
      <div class="card card-pad">
        <div
          class="photo-box"
          style="height: 105px; border-radius: 10px; margin-bottom: 8px"
          @click="
            openPhoto({
              title: '陈浩 · 金网认证5.0陪练达人',
              category: '金网认证陪练详情',
              photo: '/images/coach_1.jpg',
              rating: 5.0,
              subtitle: '累计接单 326 场 · 零投诉 · 前省级青年队主力',
              intro: '持有中国网协(CTA)高级教练与金网5.0陪练认证，擅长根据学员五维能力雷达图弱项制定针对性多球喂球与实战拉练方案，支持1对1高强度对抗或2–3人球友拼单陪练。',
              openHours: '08:00 – 21:30（支持提前预约）',
              priceInfo: '标准价 ¥180/时 · Lv.3会员 ¥162/时 · 完课积+80分',
              address: '京山国际网球中心 / 训练基地 / 文峰公园均可上门',
              lng: 113.1195,
              lat: 31.0218,
              tags: ['金网5.0认证', '零差评口碑', '支持多人拼单', '免费赛后视频复盘'],
              hotItemsTitle: '🎾 热门约练项目',
              hotItems: [
                { name: '底线稳定性与多球喂球', price: '¥162/时', tag: '人气最旺', desc: '高频率精准喂球，快速固化正反手引拍与击球节奏。' },
                { name: '网前截击与双打站位特训', price: '¥162/时', tag: '晋升必练', desc: '针对性补齐五维图网前短板，助力通过晋升复测。' },
              ],
              reviews: [
                { user: '武汉球友林先生', origin: '武汉', score: 5.0, date: '2026-11-24', content: '喂球落点稳得像发球机，还会边打边提醒脚步重心，练了两节截击成功率翻倍！' },
                { user: '长沙小王', origin: '长沙', score: 5.0, date: '2026-11-19', content: '态度特别好，打完还免费帮我录了一段慢动作发球视频分析问题，物超所值！' },
              ],
            })
          "
        >
          <img src="/images/coach_1.jpg" alt="陪练" />
          <span class="badge-tl">★ 5.0 认证陪练</span>
        </div>
        <strong style="font-size: 14px">陈浩 · 金网5.0陪练达人</strong>
        <div style="font-size: 11px; color: var(--ink-3); margin: 3px 0">326条好评 · 会员¥162/时 · 积+80分</div>
        <div class="review-quote">“喂球极稳，帮我针对五维图网前弱项特训！”</div>
        <div class="flex-between" style="margin-top: 8px">
          <span class="price" style="font-size: 16px">¥180<small>/时</small></span>
          <button class="btn-primary" @click="createQuickOrder('课程', '陈浩 · 金网5.0陪练预约 (1小时)', '多球喂球与网前专项指导 · 课后可评星', 162, 80)">
            预约/评价
          </button>
        </div>
      </div>

      <div class="card card-pad">
        <div class="photo-box" style="height: 105px; border-radius: 10px; margin-bottom: 8px">
          <img src="/images/coach_2.jpg" alt="集训营" />
          <span class="badge-tl">★ 4.9 教练约课</span>
        </div>
        <strong style="font-size: 14px">青少年 & 成人短期集训营</strong>
        <div style="font-size: 11px; color: var(--ink-3); margin: 3px 0">周末提高班/1对1私教 · 含结营晋升评测</div>
        <div class="review-quote">“上完6节课直接预约晋升测试升到了JS-4.0！”</div>
        <div class="flex-between" style="margin-top: 8px">
          <span class="price" style="font-size: 16px">¥399<small>/期起</small></span>
          <button class="btn-primary" @click="switchModule(9)">报名通道</button>
        </div>
      </div>

      <div class="card card-pad">
        <div class="flex-between" style="margin-bottom: 8px">
          <strong style="font-size: 14px">🤝 同城约球精准匹配</strong>
          <span class="tag green">按 {{ state.abilityLevel }} 匹配</span>
        </div>
        <div style="font-size: 11px; color: var(--ink-3); margin-bottom: 8px">基于您的五维能力评估自动推荐同水平球局：</div>
        <div style="background: #f4faf7; padding: 8px; border-radius: 9px; margin-bottom: 7px; font-size: 11.5px">
          <strong>今晚19:00 · 文峰公园4号场</strong><br />
          <span style="color: var(--ink-3)">匹配度 96% · 球友等级 {{ state.abilityLevel }} · 缺1人</span>
        </div>
        <div style="background: #f4faf7; padding: 8px; border-radius: 9px; margin-bottom: 8px; font-size: 11.5px">
          <strong>明早08:30 · 国际网球中心</strong><br />
          <span style="color: var(--ink-3)">匹配度 92% · 武汉/深圳游客局 · 缺1人</span>
        </div>
        <button class="btn-orange" style="width: 100%" @click="showToast(`已成功加入今晚 19:00 文峰公园4号场（按 ${state.abilityLevel} 精准匹配，已发球友入群通知）`)">
          一键加入匹配球局
        </button>
      </div>

      <div class="card card-pad">
        <div class="photo-box" style="height: 105px; border-radius: 10px; margin-bottom: 8px">
          <img src="/images/hotel.jpg" alt="运动康复机构" />
          <span class="badge-tl">🏥 官方认证康复</span>
        </div>
        <strong style="font-size: 14px">运动康复机构保障</strong>
        <div style="font-size: 11px; color: var(--ink-3); margin: 3px 0">★ 4.9 · 人民医院康复中心(1.8km) / 中医院 / 世杰郭医生</div>
        <div class="review-quote">“打完3小时来贴肌贴+筋膜松解，第二天满血复活。”</div>
        <div class="flex-between" style="margin-top: 8px">
          <span class="tag blue">赛期绿色通道</span>
          <button class="btn-primary" @click="createQuickOrder('课程', '京山市人民医院运动康复理疗预约', '赛后筋膜松解与网球肘防护评估', 98, 40)">
            预约康复
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
