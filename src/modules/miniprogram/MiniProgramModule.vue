<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePortalStore } from '../../store/usePortalStore'

const { openActionModal } = usePortalStore()
const mpTab = ref<'全部' | '政务' | '文旅' | '支付' | '打车'>('全部')

const groups = [
  { key: '政务', icon: '🏛️', cat: '本地政务服务小程序', color: '#1C73E8', apps: ['鄂汇办 · 京山专区（实名政务服务）', '12345 政务服务便民热线小程序', '京山气象灾害与应急避难预警', '体育赛事属地备案查询'], desc: '统一身份免密互认，投诉直联城运中心与12345流转体系。' },
  { key: '文旅', icon: '🌿', cat: '本地文旅服务小程序', color: '#0D7A58', apps: ['游京山官方文旅小程序', '绿林山/空山洞电子年卡与扫码入园', '京山市博物馆/图书馆预约', '荆门全域旅游联票小程序'], desc: '景区门票、电子语音导览与跨区联游线路数据双向打通。' },
  { key: '支付', icon: '💳', cat: '支付与统一分账小程序', color: '#E28B12', apps: ['微信支付（免密/极速原路退款）', '支付宝生活号与信用免押租拍', '持牌金融机构多商户分账电子凭证', '消费券与房管局补贴核销平台'], desc: '保障订场取消秒退与社会俱乐部T+0安全分账，合规透明。' },
  { key: '打车', icon: '🚕', cat: '打车与公共交通小程序', color: '#6F42C1', apps: ['滴滴出行 / 高德打车（带入球场定位）', '京山实时公交乘车码', '神州租车 / 一嗨租车小程序', '特来电/星星充电跨平台扫码'], desc: '球场中心无缝外链成熟出行工具，不重复造轮子。' },
]

const visibleGroups = computed(() =>
  mpTab.value === '全部' ? groups : groups.filter((g) => g.key === mpTab.value),
)
</script>

<template>
  <section>
    <div class="module-toolbar">
      <div class="mh-tabs">
        <button
          v-for="t in (['全部', '政务', '文旅', '支付', '打车'] as const)"
          :key="t"
          class="m-tab"
          :class="{ active: mpTab === t }"
          @click="mpTab = t"
        >
          {{ t === '全部' ? '全部互联生态' : '本地' + t }}
        </button>
      </div>
    </div>

    <div class="grid-2 mb-16">
      <div v-for="g in visibleGroups" :key="g.cat" class="card card-pad">
        <div class="flex-between" style="margin-bottom: 10px">
          <div class="flex-row">
            <span style="font-size: 24px">{{ g.icon }}</span>
            <strong style="font-size: 16px">{{ g.cat }}</strong>
          </div>
          <span class="tag green">● 已连通</span>
        </div>
        <div class="grid-2" style="gap: 8px; margin-bottom: 12px">
          <button
            v-for="a in g.apps"
            :key="a"
            class="btn-ghost"
            style="padding: 8px 10px; font-size: 11.5px; text-align: left"
            @click="openActionModal({ type: 'miniprogram', appName: a, desc: g.desc })"
          >
            {{ a }}
          </button>
        </div>
        <button class="btn-primary" :style="{ background: g.color }" @click="openActionModal({ type: 'miniprogram', appName: g.cat, desc: g.desc })">
          一键授权跳转对应小程序 →
        </button>
      </div>
    </div>
  </section>
</template>
