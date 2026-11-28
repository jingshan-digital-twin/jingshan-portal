<script setup lang="ts">
import { computed } from 'vue'
import { getDivisionStatus, getRegistrationEvent } from '../mock/tournamentRegistration'
import { usePortalStore } from '../store/usePortalStore'
import type { DetailPagePayload } from '../types/portal'

const props = defineProps<{ selection: Extract<DetailPagePayload, { kind: 'tournament' }> }>()
const { state, openTournamentRegistration, closeDetailPage } = usePortalStore()
const event = getRegistrationEvent(props.selection.eventId)
const group = event?.divisions.find((item) => item.id === props.selection.groupId)
const status = computed(() => event && group ? getDivisionStatus(event, group, state.orders) : '报名已结束')
</script>

<template>
  <main class="container tournament-page">
    <button class="btn-ghost" type="button" @click="closeDetailPage">← 返回</button>
    <div v-if="event && group" class="event-layout">
        <article class="event-details">
          <img :src="event.photo" :alt="event.name" class="event-photo" />
          <div class="card-pad">
            <span class="tag green">{{ event.typeBadge }}</span>
            <h1>{{ event.name }}</h1>
            <p>{{ event.summary }}</p>
            <dl>
              <dt>比赛时间</dt><dd>{{ event.dateRange }}</dd>
              <dt>比赛场馆</dt><dd>{{ event.venue }}</dd>
              <dt>参赛须知</dt><dd>{{ event.noticeList[0] }}</dd>
            </dl>
          </div>
        </article>
        <section class="signup card-pad">
          <h2>参赛预约</h2>
          <dl>
            <dt>参赛组别</dt><dd>{{ group.name }}</dd>
            <dt>能力等级</dt><dd>{{ state.abilityLevel }} 官方认证</dd>
          </dl>
          <div class="fee"><span>报名费</span><strong>¥{{ group.fee }}</strong></div>
          <button class="btn-orange" type="button" :disabled="status !== '报名中'" @click="openTournamentRegistration(event.id, group.id)">
            {{ status === '报名中' ? '一键报名' : status }}
          </button>
        </section>
    </div>
    <p v-else>未找到该赛事或组别。</p>
  </main>
</template>

<style scoped>
.tournament-page { padding-block: 24px 48px; }
.event-layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(290px, 1fr); align-items: start; gap: 24px; margin-top: 16px; }
.event-details, .signup { border: 1px solid var(--line); background: white; }
.event-photo { width: 100%; height: clamp(180px, 24vh, 270px); display: block; object-fit: cover; }
h1 { margin: 10px 0; font-size: clamp(24px, 2.2vw, 34px); line-height: 1.3; }
h2 { margin: 0 0 14px; font-size: 21px; }
p, dd { line-height: 1.65; }
dl { display: grid; grid-template-columns: max-content 1fr; gap: 12px 16px; margin: 20px 0; }
dt { color: var(--ink-2); }
dd { margin: 0; }
.fee { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid var(--line); margin-top: 22px; padding: 16px 0; }
.fee strong { color: var(--accent); font-size: 24px; }
.signup button { width: 100%; }
@media (max-width: 760px) {
  .event-layout { grid-template-columns: 1fr; }
  .tournament-page { width: min(100%, 100vw); margin-left: 0; }
}
</style>
