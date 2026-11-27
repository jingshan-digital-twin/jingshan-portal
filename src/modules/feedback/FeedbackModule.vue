<script setup lang="ts">
import { ref } from 'vue'
import { usePortalStore } from '../../store/usePortalStore'

const { state, submitFeedback, likePost } = usePortalStore()

const formMode = ref<'complaint' | 'review'>('complaint')
const category = ref('场馆/场地设施')
const target = ref('京山国际网球中心')
const rating = ref(5)
const content = ref('')

async function onSubmit() {
  await submitFeedback({
    mode: formMode.value,
    category: category.value,
    target: target.value,
    rating: rating.value,
    content: content.value,
  })
  content.value = ''
}
</script>

<template>
  <section>
    <div class="module-header">
      <div class="mh-left">
        <div class="mh-num">11</div>
        <div>
          <h1 class="mh-title">互动反馈模块</h1>
          <div class="mh-desc">
            游客打卡分享、各类设施服务星级评价打分、意见反馈与 12345 投诉上报，以及全透明「商户服务信用预警与红黑榜」闭环监督
          </div>
        </div>
      </div>
      <div class="mh-tabs">
        <button class="m-tab" :class="{ active: formMode === 'complaint' }" @click="formMode = 'complaint'">12345 投诉上报</button>
        <button class="m-tab" :class="{ active: formMode === 'review' }" @click="formMode = 'review'">发布打卡点评 (+20分)</button>
      </div>
    </div>

    <div class="grid-split">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <div class="card card-pad">
          <div class="flex-between" style="margin-bottom: 12px">
            <strong style="font-size: 15.5px">📸 游客打卡分享 & 服务后真实评价（共 {{ state.posts.length }} 条）</strong>
            <button class="btn-primary" @click="formMode = 'review'">+ 发布打卡与星级点评</button>
          </div>
          <div class="grid-3" style="gap: 12px">
            <div v-for="p in state.posts.slice(0, 6)" :key="p.id" style="border: 1px solid var(--line); border-radius: 12px; overflow: hidden">
              <div class="photo-box" style="height: 105px"><img :src="p.photo" :alt="p.title" /></div>
              <div style="padding: 9px 10px">
                <div style="font-size: 12.5px; font-weight: 800; margin-bottom: 5px">{{ p.title }}</div>
                <div class="flex-between" style="font-size: 11px; color: var(--ink-3)">
                  <span>👤 {{ p.origin }}·{{ p.author }} · ★{{ p.rating.toFixed(1) }}</span>
                  <button
                    style="border: none; background: transparent; font-size: 11.5px; font-weight: 700"
                    :style="{ color: p.liked ? '#DF2E38' : '#748982' }"
                    @click="likePost(p.id)"
                  >
                    {{ p.liked ? '❤️' : '🤍' }} {{ p.likes }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card card-pad">
          <div class="flex-between" style="margin-bottom: 10px">
            <strong style="font-size: 15.5px">🚨 各类服务动态评级、信用预警与红黑榜公示</strong>
            <span class="tag red">投诉查实自动降星预警</span>
          </div>
          <div class="grid-2" style="gap: 12px">
            <div style="background: #effaf4; border: 1px solid #c2e8d5; border-radius: 12px; padding: 11px 13px">
              <strong style="font-size: 13px; color: #0a6947; display: block; margin-bottom: 6px">🏅 本月五星诚信红榜（优先推荐）</strong>
              <div style="font-size: 11.5px; line-height: 1.85; color: var(--ink-2)">
                • 京山国际网球中心（★4.9 · 零投诉）<br />
                • 文峰花园酒店（★4.9 · 票根核销履约100%）<br />
                • 桥米公馆 / 陈浩陪练团队（★5.0 · 好评率100%）
              </div>
            </div>
            <div style="background: #fff3f3; border: 1px solid #f7c6c9; border-radius: 12px; padding: 11px 13px">
              <strong style="font-size: 13px; color: #b81d27; display: block; margin-bottom: 6px">⚠️ 消费预警与整改督办提示</strong>
              <div style="font-size: 11.5px; line-height: 1.85; color: #73272c">
                • <strong>黄牌预警：</strong>XX路社会停车点（价格公示不清，已转城管/市监整改）<br />
                • <strong>降星公示：</strong>某未认证陪练因爽约被核实扣星，平台已暂停推荐<br />
                • <strong>消费提示：</strong>请认准「京山网球联盟」标识与平台担保结算
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card card-pad">
        <div class="flex-between" style="margin-bottom: 12px">
          <strong style="font-size: 16px">{{ formMode === 'complaint' ? '📢 意见反馈与 12345 投诉上报' : '📸 发布我的服务星级点评' }}</strong>
          <span class="tag blue">{{ formMode === 'complaint' ? '系统按标签自动分办' : '发布赠 +20 积分' }}</span>
        </div>

        <div class="f-group">
          <label class="f-label">服务类别</label>
          <select v-model="category" class="f-input">
            <option>场馆/场地设施</option>
            <option>教练/陪练/俱乐部</option>
            <option>酒店/公寓/餐饮价格纠纷</option>
            <option>出行/停车/充电桩</option>
            <option>医疗康复/便民设施</option>
          </select>
        </div>

        <div class="f-group">
          <label class="f-label">关联场馆 / 商户名称</label>
          <input v-model="target" class="f-input" />
        </div>

        <div class="f-group">
          <label class="f-label">服务星级打分（当前 {{ rating }} 星）</label>
          <div style="display: flex; gap: 6px">
            <button
              v-for="s in 5"
              :key="s"
              style="border: none; background: transparent; font-size: 20px"
              :style="{ color: s <= rating ? '#E2A227' : '#D2DCD8' }"
              @click="rating = s"
            >
              ★
            </button>
          </div>
        </div>

        <div class="f-group">
          <label class="f-label">详细描述</label>
          <textarea
            v-model="content"
            class="f-input"
            rows="3"
            :placeholder="formMode === 'complaint' ? '请输入您的建议或投诉详情，提交后直联 12345 / 城运中心自动分办…' : '分享您的京山打球、住宿或美食体验，审核通过即获 +20 金网积分…'"
          />
        </div>

        <button class="btn-orange" style="width: 100%; padding: 10px; font-size: 13.5px; margin-bottom: 12px" @click="onSubmit">
          {{ formMode === 'complaint' ? '提交反馈 / 直联 12345 上报' : '发布打卡评价 (+20分)' }}
        </button>

        <div style="background: #f5f9f7; border-radius: 10px; padding: 9px 11px; font-size: 11.5px; color: var(--ink-2)">
          <strong>📌 我的反馈处置闭环记录（共 {{ state.complaints.length }} 条）：</strong>
          <div v-for="c in state.complaints.slice(0, 4)" :key="c.id" style="margin-top: 5px">
            #{{ c.id }} [{{ c.target }}] {{ c.content }} →
            <strong style="color: var(--primary)">{{ c.status }}（{{ c.dept }}）</strong>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
