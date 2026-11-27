<script setup lang="ts">
import { computed, ref } from 'vue'
import ServiceCircleMap from '../../components/ServiceCircleMap.vue'
import { usePortalStore } from '../../store/usePortalStore'

const { switchModule, openPhoto, openNavigation } = usePortalStore()
const amFilter = ref<'全部' | '卫生间' | '医疗点' | '充电桩' | 'ATM' | '母婴室'>('全部')

const amenities = [
  { key: '卫生间', ico: '🚻', name: '国际网球中心东广场星级公厕', address: '温泉街道网球大道1号东广场入口', lng: 113.1204, lat: 31.0221, photo: '/images/hotel.jpg', rating: 4.9, dist: '120m', info: '24小时开放 · 无障碍厕位 · 实时保洁达标' },
  { key: '医疗点', ico: '🏥', name: '赛场医疗保障点 & 人民医院运动康复', address: '温泉街道网球大道南侧医疗驿站', lng: 113.1182, lat: 31.0206, photo: '/images/indoor_court.jpg', rating: 4.9, dist: '280m / 1.8km', info: '配备AED、救护车值守、24h药房导航' },
  { key: '充电桩', ico: '⚡', name: '温泉新区智慧超充站（18个快充桩）', address: '温泉街道温泉大道与京山大道交叉口', lng: 113.1228, lat: 31.0212, photo: '/images/hero.jpg', rating: 4.9, dist: '200m', info: '闲置 14 桩 · 支持与订场联动提前锁桩预约' },
  { key: 'ATM', ico: '🏧', name: '中国银行 / 农行 24h ATM 自助点', address: '温泉街道京山大道128号文峰花园酒店旁', lng: 113.1149, lat: 31.0239, photo: '/images/hotel.jpg', rating: 4.8, dist: '350m', info: '支持外卡取现 · 位于文峰花园酒店旁' },
  { key: '母婴室', ico: '👶', name: '网球中心亲子母婴室（温奶/护理台）', address: '温泉街道网球大道1号中心馆一楼西厅', lng: 113.1191, lat: 31.0217, photo: '/images/hotspring.jpg', rating: 5.0, dist: '150m', info: '恒温空调 · 独立哺乳间 · 免费饮水与急救包' },
]

const visibleAmenities = computed(() =>
  amFilter.value === '全部' ? amenities : amenities.filter((a) => a.key === amFilter.value),
)
</script>

<template>
  <section>
    <div class="module-header">
      <div class="mh-left">
        <div class="mh-num">10</div>
        <div>
          <h1 class="mh-title">便民配套服务</h1>
          <div class="mh-desc">
            全市卫生间、医疗点、充电桩、ATM、母婴室地图一键查找（均含实景照片与评分），叠加实时天气、打球指数与全城路况查询
          </div>
        </div>
      </div>
      <div class="mh-tabs">
        <button
          v-for="t in (['全部', '卫生间', '医疗点', '充电桩', 'ATM', '母婴室'] as const)"
          :key="t"
          class="m-tab"
          :class="{ active: amFilter === t }"
          @click="amFilter = t"
        >
          {{ t === '全部' ? '全部便民设施' : t }}
        </button>
      </div>
    </div>

    <div class="grid-2 mb-16">
      <div class="card card-pad" style="background: linear-gradient(135deg, #0d4c39, #127355); color: #fff">
        <div class="flex-between" style="margin-bottom: 8px">
          <strong style="font-size: 16px">☀️ 京山实时天气与网球气象指数</strong>
          <span class="tag" style="background: var(--lime); color: #0b251d">极适宜户外打球</span>
        </div>
        <div class="flex-between">
          <div style="font-size: 32px; font-weight: 900">19°C <span style="font-size: 14px; font-weight: 500">晴 · 东南风2级 · 湿度48%</span></div>
          <div style="font-size: 11.5px; text-align: right; color: rgba(255, 255, 255, 0.86)">
            明日：多云 12–21°C（适宜）<br />后日：小雨（推荐室内风雨场）
          </div>
        </div>
      </div>

      <div class="card card-pad">
        <div class="flex-between" style="margin-bottom: 8px">
          <strong style="font-size: 16px">🚦 全城实时路况与赛场通行状态</strong>
          <span class="tag orange" style="cursor: pointer" @click="switchModule(6)">查看完整限行地图 →</span>
        </div>
        <div class="grid-3" style="gap: 8px; font-size: 11.5px">
          <div style="background: #ffecee; color: #b01c26; padding: 8px; border-radius: 9px"><strong>🔴 温泉大道赛场段</strong><br />07:30-19:00 临时封闭</div>
          <div style="background: #fff5e8; color: #a65608; padding: 8px; border-radius: 9px"><strong>🟠 京山大道东段</strong><br />赛事缓冲限行/禁停</div>
          <div style="background: #eaf8f1; color: #0a6b46; padding: 8px; border-radius: 9px"><strong>🟢 高铁站/城区主路</strong><br />全线畅通 · P1剩84位</div>
        </div>
      </div>
    </div>

    <div class="grid-split-rev">
      <div style="display: flex; flex-direction: column; gap: 10px">
        <div
          v-for="a in visibleAmenities"
          :key="a.name"
          class="card"
          style="display: grid; grid-template-columns: 86px 1fr; gap: 12px; padding: 10px 12px; align-items: center"
        >
          <div
            class="photo-box"
            style="height: 68px; border-radius: 9px"
            @click="
              openPhoto({
                title: a.name,
                category: `便民设施详情 · ${a.key}`,
                photo: a.photo,
                rating: a.rating,
                subtitle: `距您 ${a.dist} ｜ ${a.info}`,
                intro: `${a.name}位于${a.address}，纳入京山市城运中心智慧网格巡检体系，实时保障洁净度、设备可用率与无障碍通行，外地来京球友与游客可免费或按公开标准使用。`,
                openHours: a.key === '医疗点' ? '赛事日 07:00–22:00 / 人民医院急诊 24小时' : '全天 24 小时开放',
                priceInfo: a.key === '充电桩' ? '电费+服务费约 ¥0.98/度（订场可提前锁桩）' : '公益便民免费开放',
                address: a.address,
                lng: a.lng,
                lat: a.lat,
                tags: ['官方网格认证', '实景核验', '一键精准导航', '支持故障上报'],
                reviews: [
                  { user: '武汉球友小吴', origin: '武汉', score: 5.0, date: '2026-11-24', content: '标识非常清晰、环境维护得很整洁，点一下导航两三分钟就找到了，很贴心！' },
                  { user: '陪读家长陈女士', origin: '长沙', score: 4.9, date: '2026-11-20', content: '带小宝过来看赛，设施齐全干净，京山网球配套做得确实很细心。' },
                ],
              })
            "
          >
            <img :src="a.photo" :alt="a.name" />
          </div>
          <div>
            <div class="flex-between">
              <strong style="font-size: 13.5px">{{ a.ico }} {{ a.name }}</strong>
              <span class="rating-pill">★ {{ a.rating }}</span>
            </div>
            <div style="font-size: 11px; color: var(--ink-3); margin: 2px 0 5px">
              📍 {{ a.address }}（{{ a.lng.toFixed(4) }}°E, {{ a.lat.toFixed(4) }}°N）｜ 距您 {{ a.dist }}
            </div>
            <div class="flex-between">
              <span class="tag green">{{ a.info.slice(0, 14) }}…</span>
              <button
                class="btn-primary"
                style="padding: 3.5px 10px; font-size: 11px"
                @click="
                  openNavigation({
                    placeName: a.name,
                    address: a.address,
                    lng: a.lng,
                    lat: a.lat,
                    distance: a.dist,
                    driveMin: '步行约 3 分钟',
                    tip: a.info,
                  })
                "
              >
                🧭 导航前往
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-pad flex-between" style="border-bottom: 1px solid var(--line)">
          <strong style="font-size: 14.5px">🗺️ 京山便民设施一站式实景地图</strong>
          <div class="flex-row">
            <span class="tag green">🚻 卫生间</span><span class="tag red">🏥 医疗</span>
            <span class="tag blue">⚡ 充电</span><span class="tag gold">🏧 ATM</span><span class="tag purple">👶 母婴室</span>
          </div>
        </div>
        <ServiceCircleMap mode="amenities" />
        <div class="card-pad flex-between" style="background: #fafdfc">
          <span style="font-size: 12px; color: var(--ink-2)">点击左侧任意设施缩略图可查看现场实景与游客评分，支持一键跳转高德/百度导航</span>
          <button class="btn-orange" @click="switchModule(11)">设施故障上报</button>
        </div>
      </div>
    </div>
  </section>
</template>
