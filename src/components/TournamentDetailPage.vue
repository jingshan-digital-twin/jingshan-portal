<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { TOURNAMENT_REGISTRATION_OPTIONS } from '../mock/trainingData'
import { usePortalStore } from '../store/usePortalStore'
import type { DetailPagePayload } from '../types/portal'

const props = defineProps<{ selection: Extract<DetailPagePayload, { kind: 'tournament' }> }>()
const { state, registerYouthTournament, closeDetailPage, openHotelDetail, switchModule } = usePortalStore()
const event = TOURNAMENT_REGISTRATION_OPTIONS.find(item => item.id === props.selection.eventId)!
const group = event.groups.find(item => item.id === props.selection.groupId)!
const player = ref('张小宇')
const receipt = ref('')
const successHeading = ref<HTMLHeadingElement>()
const atWenfeng = event.id === 'tourney-weekend-2026'

async function confirmBooking() {
  const name = player.value.trim()
  if (!name || receipt.value) return
  receipt.value = registerYouthTournament({
    tournamentName: event.label, group: group.name, venue: event.venue,
    playerName: name, fee: group.fee, time: event.date,
  })
  await nextTick()
  successHeading.value?.focus()
  window.scrollTo({ top: 0, behavior: 'auto' })
}
</script>

<template>
  <main class="container tournament-page">
    <button class="btn-ghost" type="button" @click="closeDetailPage">← 返回</button>
    <template v-if="!receipt">
      <div class="event-layout">
        <article class="event-details">
          <img :src="event.photo" :alt="event.label" class="event-photo" />
          <div class="card-pad">
            <span class="tag green">{{ event.badge }}</span>
            <h1>{{ event.label }}</h1>
            <p>{{ event.description }}</p>
            <dl>
              <dt>比赛时间</dt><dd>{{ event.date }}</dd>
              <dt>比赛场馆</dt><dd>{{ event.venue }}</dd>
              <dt>参赛须知</dt><dd>{{ event.notice }}</dd>
            </dl>
          </div>
        </article>
        <form class="signup card-pad" @submit.prevent="confirmBooking">
          <h2>参赛预约</h2>
          <dl>
            <dt>参赛组别</dt><dd>{{ group.name }}</dd>
            <dt>能力等级</dt><dd>{{ state.abilityLevel }} 官方认证</dd>
          </dl>
          <label class="f-label" for="event-player">参赛选手姓名</label>
          <input id="event-player" v-model="player" required pattern=".*\S.*" class="f-input" autocomplete="name" />
          <div class="fee"><span>报名费</span><strong>¥{{ group.fee }}</strong></div>
          <button class="btn-orange" type="submit">确认预约</button>
        </form>
      </div>
    </template>
    <template v-else>
      <section class="receipt card-pad" aria-labelledby="receipt-heading">
        <h1 id="receipt-heading" ref="successHeading" tabindex="-1">✓ 预约成功</h1>
        <h2>{{ event.label }}</h2>
        <p>{{ player.trim() }} · {{ group.name }}</p>
        <p>{{ event.date }} ｜ {{ event.venue }}</p>
        <p>报名号 <strong>{{ receipt }}</strong></p>
      </section>
      <h2>赛场周边服务</h2>
      <div class="services">
        <button type="button" @click="openHotelDetail('hotel-wenfeng')"><strong>文峰花园酒店 →</strong><span>赛事合作住宿 · 查看房型与票根优惠</span></button>
        <button type="button" @click="switchModule(4)"><strong>赛后用餐 →</strong><span>{{ atWenfeng ? '文峰河畔烧烤街 · 距文峰公园球场 300 米' : '桥米公馆 · 距国际网球中心 600 米' }}</span></button>
        <button type="button" @click="state.showArrivalGuideModal = true"><strong>抵京出行指引 →</strong><span>查看停车余位、高铁接驳与候车点</span></button>
      </div>
    </template>
  </main>
</template>

<style scoped>
.tournament-page { padding-block: 24px 48px; }
.event-layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(290px, 1fr); align-items: start; gap: 24px; margin-top: 16px; }
.event-details, .signup, .services button { border: 1px solid var(--line); background: white; }
.event-photo { width: 100%; height: clamp(180px, 24vh, 270px); display: block; object-fit: cover; }
h1 { margin: 10px 0; font-size: clamp(24px, 2.2vw, 34px); line-height: 1.3; }
h2 { margin: 0 0 14px; font-size: 21px; }
p, dd { line-height: 1.65; }
dl { display: grid; grid-template-columns: max-content 1fr; gap: 12px 16px; margin: 20px 0; }
dt, .services span { color: var(--ink-2); }
dd { margin: 0; }
.fee { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid var(--line); margin-top: 22px; padding: 16px 0; }
.fee strong { color: var(--accent); font-size: 24px; }
.signup button { width: 100%; }
.receipt { margin: 16px 0 24px; background: #0b543e; color: white; }
.receipt h1 { color: var(--lime); }
.receipt p { margin: 6px 0; }
.services { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.services button { display: grid; gap: 8px; padding: 18px; text-align: left; }
.services strong { color: var(--primary); font-size: 17px; }
.services button:hover { border-color: var(--primary); }
@media (max-width: 760px) {
  .event-layout, .services { grid-template-columns: 1fr; }
  .tournament-page { width: min(100%, 100vw); margin-left: 0; }
}
</style>
