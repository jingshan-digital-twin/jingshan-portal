<script setup lang="ts">
import { ref } from 'vue'
import ServiceCircleMap from '../../components/ServiceCircleMap.vue'
import { usePortalStore } from '../../store/usePortalStore'

const { state, reserveParkingOrCharger, openActionModal, openNavigation, showToast } = usePortalStore()
const transitTab = ref<'全部' | '限行与车位' | '优质司机' | '公交与租车'>('全部')
</script>

<template>
  <section>
    <div class="module-header">
      <div class="mh-left">
        <div class="mh-num">06</div>
        <div>
          <h1 class="mh-title">“行”：出行服务</h1>
          <div class="mh-desc">
            赛前/赛中封闭限行路段可视化提示、停车场剩余车位与充电桩提前预约、京网优质司机、公交与旅游专线班次查询、租车/网约车第三方小程序入口
          </div>
        </div>
      </div>
      <div class="mh-tabs">
        <button class="m-tab" :class="{ active: transitTab === '全部' }" @click="transitTab = '全部'">全部出行</button>
        <button class="m-tab" :class="{ active: transitTab === '限行与车位' }" @click="transitTab = '限行与车位'">限行图与车位/充电</button>
        <button class="m-tab" :class="{ active: transitTab === '优质司机' }" @click="transitTab = '优质司机'">京网优质司机</button>
        <button class="m-tab" :class="{ active: transitTab === '公交与租车' }" @click="transitTab = '公交与租车'">公交专线/租车打车</button>
      </div>
    </div>

    <div class="grid-split">
      <div v-if="transitTab === '全部' || transitTab === '限行与车位'" class="card">
        <div class="card-pad flex-between" style="border-bottom: 1px solid var(--line); background: #fff6f6">
          <div>
            <strong style="font-size: 15px; color: #a81721">
              🚦 赛期交通管控实时图（封闭路段 / 限行路段 / 推荐停车与充电）
            </strong>
            <div style="font-size: 11.5px; color: #7d383d">
              中青赛总决赛期间（07:30–19:00）：温泉大道国际网球中心段临时封闭，请按绿色推荐点位停泊
            </div>
          </div>
          <button
            class="btn-orange"
            @click="
              openNavigation({
                placeName: '国际网球中心 P1 推荐停车场',
                address: '湖北省荆门市京山市温泉街道网球大道北侧P1入口',
                lng: 113.1185,
                lat: 31.0226,
                distance: '2.8 km',
                driveMin: '约 7 分钟',
                tip: '已自动绕行「温泉大道临时封闭段」与「京山大道限行禁停段」',
              })
            "
          >
            🗺️ 高德/百度避堵导航
          </button>
        </div>

        <ServiceCircleMap mode="traffic" />

        <div class="card-pad">
          <div class="grid-3" style="gap: 10px">
            <div
              v-for="lot in state.parkingLots"
              :key="lot.id"
              style="background: #f3faf6; border: 1px solid #c8e7d8; border-radius: 11px; padding: 10px"
            >
              <div class="flex-between">
                <strong style="font-size: 12.5px">{{ lot.isCharger ? '⚡' : '🅿️' }} {{ lot.name }}</strong>
                <span class="tag" :class="lot.isCharger ? 'blue' : 'green'">
                  {{ lot.isCharger ? '闲' : '剩' }}{{ lot.remain }}/{{ lot.total }}
                </span>
              </div>
              <div style="font-size: 11px; color: var(--ink-3); margin: 4px 0">★ {{ lot.rating }} · {{ lot.note }}</div>
              <div style="font-size: 10.5px; color: var(--ink-2); margin-bottom: 6px">
                📍 {{ lot.address }}（{{ lot.lng.toFixed(4) }}, {{ lot.lat.toFixed(4) }}）
              </div>
              <div class="flex-between">
                <button
                  :class="lot.reserved ? 'btn-ghost' : 'btn-primary'"
                  style="padding: 4px 9px; font-size: 11px"
                  @click="reserveParkingOrCharger(lot.id)"
                >
                  {{ lot.reserved ? '✅ 已锁位' : lot.isCharger ? '预约充电桩' : '提前预约车位' }}
                </button>
                <button
                  class="btn-ghost"
                  style="padding: 3px 8px; font-size: 11px"
                  @click="
                    openNavigation({
                      placeName: lot.name,
                      address: lot.address,
                      lng: lot.lng,
                      lat: lot.lat,
                      distance: '1.2 km',
                      driveMin: '约 4 分钟',
                      tip: `当前实时剩余 ${lot.remain} 个，已为您避开赛期封闭路段`,
                    })
                  "
                >
                  🧭 导航
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px">
        <div v-if="transitTab === '全部' || transitTab === '优质司机'" class="card card-pad">
          <div class="flex-between" style="margin-bottom: 10px">
            <strong style="font-size: 15px">👨‍✈️ 京网推荐出行 · 官方优质司机（6位认证）</strong>
            <span class="tag gold">全程评星监督</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <div class="flex-between" style="background: #f6faf8; padding: 9px 11px; border-radius: 11px">
              <div>
                <strong style="font-size: 13px">张师傅 · 7座商务车（京网十佳司机）</strong> <span class="rating-pill">★ 5.0</span>
                <div style="font-size: 11px; color: var(--ink-3)">高铁接送/全城包车/代搬球包 · 182条零差评</div>
              </div>
              <button class="btn-primary" @click="showToast('已向张师傅发送约车通知，预计5分钟内来电确认上车点')">一键约车</button>
            </div>
            <div class="flex-between" style="background: #f6faf8; padding: 9px 11px; border-radius: 11px">
              <div>
                <strong style="font-size: 13px">李师傅 · 新能源专车（熟悉全城球场）</strong> <span class="rating-pill">★ 4.9</span>
                <div style="font-size: 11px; color: var(--ink-3)">京山南站→网球中心直达 ¥28一口价 · 票根减¥5</div>
              </div>
              <button class="btn-primary" @click="showToast('已预约李师傅新能源专车，电子票根已自动立减 ¥5')">一键约车</button>
            </div>
          </div>
        </div>

        <div v-if="transitTab === '全部' || transitTab === '公交与租车'" class="card card-pad">
          <div class="flex-between" style="margin-bottom: 8px">
            <strong style="font-size: 15px">🚌 公交 & 赛事旅游专线实时班次</strong>
            <span class="tag green">实时到站</span>
          </div>
          <table class="clean-table">
            <thead>
              <tr><th>线路名称</th><th>起止点</th><th>下班发车</th><th>票价</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>赛事免费摆渡1线</strong></td><td>京山南站 ⇄ 国际网球中心</td><td><strong style="color: var(--primary)">14:15 (8分钟)</strong></td><td>免费</td></tr>
              <tr><td><strong>网旅温泉专线</strong></td><td>网球中心 ⇄ 温泉度假区</td><td>14:30 (23分钟)</td><td>¥2</td></tr>
              <tr><td><strong>绿林山旅游直通车</strong></td><td>文峰公园 ⇄ 绿林山景区</td><td>15:00</td><td>¥15</td></tr>
            </tbody>
          </table>
        </div>

        <div v-if="transitTab === '全部' || transitTab === '公交与租车'" class="card card-pad">
          <strong style="font-size: 14.5px; display: block; margin-bottom: 9px">🚕 租车 & 网约车入口（无缝跳转第三方小程序）</strong>
          <div class="grid-2" style="gap: 9px">
            <button class="btn-ghost" style="padding: 10px; text-align: left" @click="openActionModal({ type: 'miniprogram', appName: '滴滴出行小程序', desc: '自动带入京山国际网球中心上车定位，支持球友一键快车/专车' })">
              🚕 <strong>滴滴出行小程序</strong><br /><span style="font-size: 10.5px; color: var(--ink-3)">一键定位当前球场叫车</span>
            </button>
            <button
              class="btn-ghost"
              style="padding: 10px; text-align: left"
              @click="
                openNavigation({
                  placeName: '京山国际网球中心',
                  address: '湖北省荆门市京山市温泉街道网球大道1号',
                  lng: 113.1195,
                  lat: 31.0218,
                  distance: '3.2 km',
                  driveMin: '约 8 分钟',
                  tip: '高德实时导航已自动避开温泉大道赛事封闭路段',
                })
              "
            >
              🗺️ <strong>高德打车 / 自驾导航</strong><br /><span style="font-size: 10.5px; color: var(--ink-3)">避开赛事封闭路段导航</span>
            </button>
            <button class="btn-ghost" style="padding: 10px; text-align: left" @click="openActionModal({ type: 'miniprogram', appName: '神州租车小程序', desc: '京山南站自助取还，京山网球会员专享9折租车权益' })">
              🚙 <strong>神州租车小程序</strong><br /><span style="font-size: 10.5px; color: var(--ink-3)">高铁站取还 · 球友专享9折</span>
            </button>
            <button class="btn-ghost" style="padding: 10px; text-align: left" @click="openActionModal({ type: 'miniprogram', appName: '一嗨租车小程序', desc: '自驾延伸游绿林山、明显陵、漳河风景区首选' })">
              🚗 <strong>一嗨租车小程序</strong><br /><span style="font-size: 10.5px; color: var(--ink-3)">自驾游绿林山/明显陵首选</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
