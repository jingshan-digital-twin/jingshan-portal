<script setup lang="ts">
import { ref } from 'vue'
import { usePortalStore } from '../store/usePortalStore'

const {
  state,
  reserveParkingOrCharger,
  openNavigation,
  createQuickOrder,
  switchModule,
} = usePortalStore()

const mode = ref<'drive' | 'rail'>('drive')

const shuttleLines = [
  {
    id: 'ag-bus-1',
    name: '赛事免费摆渡 1 线',
    route: '高铁京山南站 ⇄ 国际网球中心东门',
    next: '14:15 发车（每 20 分钟一班）',
    fare: '凭参赛/订场票根免费',
    lng: 113.1216,
    lat: 31.0212,
    stop: '京山南站出站口网球文旅专属候车区',
  },
  {
    id: 'ag-bus-2',
    name: '网旅温泉旅游专线 B',
    route: '京山南站 ⇄ 国际网球中心 ⇄ 天沐温泉',
    next: '14:30 发车（每 30 分钟一班）',
    fare: '票根免费（原价¥5）',
    lng: 113.1204,
    lat: 31.0216,
    stop: '国际网球中心东门公交站',
  },
  {
    id: 'ag-bus-3',
    name: '绿林山景区旅游直通车',
    route: '文峰公园 ⇄ 绿林山风景区（美人谷）',
    next: '15:00 发车（每日 4 班）',
    fare: '¥15（票根免单程）',
    lng: 113.1128,
    lat: 31.0185,
    stop: '文峰公园南门旅游集散点',
  },
]

const recommendedDrivers = [
  {
    id: 'ag-drv-1',
    name: '张师傅 · 7座商务车',
    plate: '鄂H·AD862',
    rating: '5.0',
    desc: '京山南站接送 · 免费代搬球包 · 适合参赛家庭',
    price: '¥38/趟起',
  },
  {
    id: 'ag-drv-2',
    name: '李师傅 · 新能源专车',
    plate: '鄂H·D3918',
    rating: '4.9',
    desc: '京山南站 ⇄ 国际网球中心明码一口价 · 票根立减¥5',
    price: '¥28 一口价',
  },
  {
    id: 'ag-drv-3',
    name: '王师傅 · 景区包车',
    plate: '鄂H·K5207',
    rating: '4.9',
    desc: '天沐温泉 / 绿林山 / 钟祥明显陵半日与全日包车',
    price: '¥168/半日',
  },
]

function close() {
  state.showArrivalGuideModal = false
}

function bookDriver(drv: (typeof recommendedDrivers)[number]) {
  createQuickOrder(
    '门票',
    `京网优质出行司机预约：${drv.name}`,
    `车牌 ${drv.plate} · ${drv.price} · ${drv.desc}`,
    0,
    30,
    0,
    {
      fields: [
        { label: '认证司机', value: `${drv.name}（★${drv.rating}）` },
        { label: '车辆号牌', value: drv.plate },
        { label: '参考车费', value: drv.price },
      ],
      successTitle: '京网优质司机预约成功',
      successMessage: '司机将于高铁到站前 15 分钟在出站口接驳通道等候。',
    },
  )
}
</script>

<template>
  <div v-if="state.showArrivalGuideModal" class="modal-backdrop arrival-backdrop" @click.self="close">
    <div class="modal-box arrival-guide" role="dialog" aria-modal="true" aria-labelledby="arrival-title">
      <!-- Header -->
      <div class="card-pad flex-between" style="background: linear-gradient(135deg, #103b66, #0b7352); color: #fff">
        <div>
          <div class="flex-row" style="gap: 8px; margin-bottom: 4px">
            <span class="tag" style="background: var(--lime); color: #0b251d">📍 抵京智能推送</span>
            <span style="font-size: 13px; color: rgba(255,255,255,0.88)">政府端赛事交通保障方案实时同步</span>
          </div>
          <h2 id="arrival-title">🚦 抵京出行指引卡<span>（停车与接驳一站直达）</span></h2>
        </div>
        <button type="button" class="btn-ghost" @click="close">✕ 关闭</button>
      </div>

      <div class="guide-body">
        <!-- 双模式切换 -->
        <div class="module-mode-bar" role="group" aria-label="抵京方式选择">
          <button
            type="button"
            class="module-mode-btn"
            :aria-pressed="mode === 'drive'"
            @click="mode = 'drive'"
          >
            <span class="mode-icon" aria-hidden="true">🚗</span>
            <span>自驾抵京<small>推荐停车场与空余车位</small></span>
          </button>
          <button
            type="button"
            class="module-mode-btn"
            :aria-pressed="mode === 'rail'"
            @click="mode = 'rail'"
          >
            <span class="mode-icon" aria-hidden="true">🚄</span>
            <span>高铁抵京<small>旅游专线巴士与优质司机</small></span>
          </button>
        </div>

        <!-- Tab 1: 自驾出行 -->
        <template v-if="mode === 'drive'">
          <div style="background: #fff5f5; border: 1px solid #f5c6c9; padding: 10px 14px; font-size: 13.5px; color: #9c1a22; font-weight: 700">
            ⚠️ 赛期交通管控提醒：温泉大道（国际网球中心段）今日 07:30–19:00 临时封闭，以下导航已自动规划避堵绕行路线。
          </div>

          <div class="parking-grid">
            <div
              v-for="lot in state.parkingLots"
              :key="lot.id"
              class="parking-card"
            >
              <div class="lot-heading">
                <strong style="font-size: 16px">{{ lot.isCharger ? '⚡' : '🅿️' }} {{ lot.name }}</strong>
              </div>
              <p class="lot-location">📍 {{ lot.address }}</p>
              <p class="lot-note">{{ lot.note }}</p>
              <div class="lot-capacity">
                <span class="tag" :class="lot.isCharger ? 'blue' : 'green'">
                    实时{{ lot.isCharger ? '闲置' : '空余' }} {{ lot.remain }} / {{ lot.total }} {{ lot.isCharger ? '桩' : '位' }}
                </span>
                <span style="font-size: 12.5px; color: var(--primary); font-weight: 800">
                  空闲率 {{ Math.round((lot.remain / lot.total) * 100) }}%
                </span>
              </div>
              <div class="summary-bar-track" style="margin-bottom: 10px">
                <div class="summary-bar-fill" :style="{ width: `${Math.round((lot.remain / lot.total) * 100)}%` }" />
              </div>
              <div class="lot-booking">
                <span v-if="lot.reservedSlot" style="font-size: 13px; color: var(--primary); font-weight: 800">
                  ✔ 已免费锁位：{{ lot.reservedSlot }}
                </span>
                <span v-else style="font-size: 12.5px; color: var(--ink-3)">凭参赛/订场电子票根享免费停放 3 小时</span>
                <div class="lot-actions">
                  <button
                    type="button"
                    class="btn-orange"
                    style="padding: 6px 14px; font-size: 13px"
                    @click="
                      openNavigation({
                        placeName: lot.name,
                        address: lot.address,
                        lng: lot.lng,
                        lat: lot.lat,
                        distance: '推荐避堵入口',
                        driveMin: '约 5 分钟',
                        tip: `当前实时空余 ${lot.remain} 个，已为您避开温泉大道赛期封闭段`,
                      })
                    "
                  >
                    🧭 一键避堵导航
                  </button>
                  <button
                    type="button"
                    :class="lot.reserved ? 'btn-ghost' : 'btn-primary'"
                    style="padding: 6px 14px; font-size: 13px"
                    @click="reserveParkingOrCharger(lot.id, '11/27', '14:00-16:00')"
                  >
                    {{ lot.reserved ? '已锁位' : lot.isCharger ? '预约充电' : '免费锁位' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Tab 2: 高铁抵京 -->
        <div v-else class="rail-grid">
          <section>
            <div class="rail-heading">
              <strong style="font-size: 15.5px">🚌 旅游专线巴士 & 赛事免费摆渡班次</strong>
              <span class="tag green">高铁京山南站无缝接驳</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px">
              <div
                v-for="bus in shuttleLines"
                :key="bus.id"
                class="flex-between"
                style="background: #f5faf8; border: 1px solid #d5e8df; padding: 10px 14px; gap: 10px"
              >
                <div>
                  <div class="flex-row" style="gap: 8px">
                    <strong style="font-size: 14.5px">{{ bus.name }}</strong>
                    <span class="tag orange">{{ bus.fare }}</span>
                  </div>
                  <div style="font-size: 13px; color: var(--ink-2); margin-top: 3px">
                    {{ bus.route }}<br>🕒 下一班：<strong style="color: var(--primary)">{{ bus.next }}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn-ghost"
                  style="padding: 5px 11px; font-size: 12.5px; flex-shrink: 0"
                  @click="
                    openNavigation({
                      placeName: bus.stop,
                      address: `湖北省荆门市京山市${bus.stop}`,
                      lng: bus.lng,
                      lat: bus.lat,
                      distance: '上车站点',
                      driveMin: '出站步行2分钟',
                      tip: `${bus.name}，下一班 ${bus.next}`,
                    })
                  "
                >
                  🧭 候车点导航
                </button>
              </div>
            </div>
          </section>

          <section>
            <div class="rail-heading">
              <strong style="font-size: 15.5px">👨‍✈️ 京网优质出行司机预约（官方实名认证 · 明码一口价）</strong>
              <span class="tag gold">零绕路 · 免费搬球包</span>
            </div>
            <div class="driver-list">
              <div
                v-for="drv in recommendedDrivers"
                :key="drv.id"
                style="background: #fafdfc; border: 1px solid #d5e8df; padding: 12px 13px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px"
              >
                <div>
                  <div class="flex-between" style="margin-bottom: 4px">
                    <strong style="font-size: 14.5px">{{ drv.name }}</strong>
                    <span class="rating-pill">★ {{ drv.rating }}</span>
                  </div>
                  <div style="font-size: 12px; color: var(--ink-3); margin-bottom: 5px">车牌 {{ drv.plate }}</div>
                  <div style="font-size: 12.5px; color: var(--ink-2); line-height: 1.5">{{ drv.desc }}</div>
                </div>
                <div class="flex-between" style="padding-top: 8px; border-top: 1px dashed var(--line)">
                  <strong style="font-size: 15px; color: var(--accent)">{{ drv.price }}</strong>
                  <button type="button" class="btn-primary" style="padding: 4px 10px; font-size: 12.5px" @click="bookDriver(drv)">
                    一键预约
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="guide-footer">
          <span style="font-size: 13px; color: var(--ink-3)">💡 提示：进入“行 · 出行服务”还可查看全景管控地图与更多公交线路</span>
          <button
            type="button"
            class="btn-primary"
            @click="close(); switchModule(6)"
          >
            打开完整“行 · 出行服务”专区 →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.arrival-guide {
  width: min(1040px, 100%);
  max-height: 100%;
  display: flex;
  flex-direction: column;
}
.arrival-backdrop {
  padding: clamp(8px, 2.5vh, 24px) clamp(8px, 2vw, 24px);
}
.arrival-guide > .card-pad {
  flex: none;
}
#arrival-title {
  margin: 0;
  font-size: 21px;
}
#arrival-title span {
  display: inline-block;
  font-size: 0.8em;
}
.guide-body {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: clamp(12px, 2vw, 24px);
  display: grid;
  gap: 16px;
}
.module-mode-btn {
  height: auto;
  padding: 9px;
  gap: 12px;
  text-align: left;
}
.mode-icon {
  font-size: 24px;
}
.module-mode-btn small {
  display: block;
  font-size: 12px;
  letter-spacing: normal;
  font-weight: 500;
}
.parking-grid, .rail-grid {
  display: grid;
  gap: 12px;
}
.parking-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
}
.parking-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 16px;
  background: #f5faf8;
  border: 1px solid #d5e8df;
}
.lot-location, .lot-note {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ink-2);
}
.lot-note {
  margin: 2px 0 16px;
}
.lot-capacity, .lot-actions, .guide-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.lot-capacity {
  margin: auto 0 7px;
}
.lot-booking {
  border-top: 1px dashed var(--line);
  padding-top: 9px;
}
.lot-actions {
  margin-top: 10px;
  justify-content: flex-start;
}
.rail-grid {
  grid-template-columns: 1.12fr 1fr;
  gap: 18px;
}
.rail-heading, .driver-list {
  display: grid;
  gap: 8px;
}
.rail-heading {
  justify-items: start;
  margin-bottom: 10px;
}
.guide-footer {
  padding-top: 14px;
  border-top: 1px solid var(--line);
}
@media (max-width: 800px) {
  .rail-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .arrival-guide > .card-pad { padding: 12px; align-items: flex-start; }
  .arrival-guide > .card-pad button { flex-shrink: 0; }
  #arrival-title { font-size: 17px; }
  .module-mode-btn { gap: 5px; font-size: 15px; letter-spacing: normal; }
  .mode-icon { font-size: 18px; }
  .rail-grid .flex-between { flex-wrap: wrap; }
  .guide-footer button { width: 100%; }
}
</style>
