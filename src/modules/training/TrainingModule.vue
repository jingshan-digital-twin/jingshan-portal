<script setup lang="ts">
import { ref } from 'vue'
import AbilityRadarChart from '../../components/AbilityRadarChart.vue'
import { usePortalStore } from '../../store/usePortalStore'

const { state, switchModule, openActionModal, createQuickOrder, runUpgradeTest } = usePortalStore()
const trainTab = ref<'全部' | '省网校' | '五维评测' | '俱乐部团建'>('全部')
const selectedOrg = ref('湖北省网球学校评测中心')
</script>

<template>
  <section>
    <div class="module-header">
      <div class="mh-left">
        <div class="mh-num">09</div>
        <div>
          <h1 class="mh-title">“训”：培训研学服务</h1>
          <div class="mh-desc">
            湖北省网球学校报名咨询通道、指定能力评测与晋升测试、网球训练营/研学/团建、俱乐部课程销售评价、青少年网球比赛与运动康复机构
          </div>
        </div>
      </div>
      <div class="mh-tabs">
        <button class="m-tab" :class="{ active: trainTab === '全部' }" @click="trainTab = '全部'">全部培训研学</button>
        <button class="m-tab" :class="{ active: trainTab === '省网校' }" @click="trainTab = '省网校'">湖北省网球学校</button>
        <button class="m-tab" :class="{ active: trainTab === '五维评测' }" @click="trainTab = '五维评测'">五维评测与晋升</button>
        <button class="m-tab" :class="{ active: trainTab === '俱乐部团建' }" @click="trainTab = '俱乐部团建'">俱乐部/团建/康复</button>
      </div>
    </div>

    <div v-if="trainTab === '全部' || trainTab === '省网校' || trainTab === '五维评测'" class="grid-2 mb-16">
      <div v-if="trainTab === '全部' || trainTab === '省网校'" class="card" style="border: 2px solid #0d7278">
        <div class="photo-box" style="height: 162px">
          <img src="/images/coach_2.jpg" alt="湖北省网球学校" />
          <span class="badge-tl" style="background: #0d7278">🎓 省级体教融合金字招牌</span>
          <span class="badge-bl">湖北省网球学校 · 官方报名咨询通道</span>
        </div>
        <div class="card-pad">
          <div class="flex-between">
            <strong style="font-size: 16.5px">湖北省网球学校 · 招生咨询 & 青少年研学基地</strong>
            <span class="rating-pill">★ 5.0</span>
          </div>
          <div style="font-size: 12px; color: var(--ink-2); margin: 6px 0 10px">
            面向全国招收小学至高中网球特长生及短期冬夏令营学员，专业驻校教练与国家级场地保障，支持在线提交咨询、预约实地探校。
          </div>
          <div class="flex-between">
            <button
              class="btn-ghost"
              @click="openActionModal({ type: 'inquiry', title: '湖北省网球学校 · 招生与探校咨询', subtitle: '支持小学/初中/高中网球特长招生咨询及寒暑假短期集训营报名', submitLabel: '提交招生咨询单' })"
            >
              在线招生咨询
            </button>
            <button
              class="btn-primary"
              @click="createQuickOrder('课程', '湖北省网球学校 · 青少年7天冬令营', '含食宿、专业训练与五维等级评测', 2480, 200)"
            >
              立即报名冬令营 (¥2,480)
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="trainTab === '全部' || trainTab === '五维评测'"
        class="card"
        style="background: linear-gradient(135deg, #f1faf6, #ffffff); border: 2px solid var(--primary)"
      >
        <div class="card-pad" style="display: grid; grid-template-columns: 1fr 245px; gap: 10px; align-items: center; height: 100%">
          <div>
            <span class="tag green" style="margin-bottom: 7px">🏅 官方指定评测机构 · 等级晋升闭环</span>
            <div style="font-size: 16.5px; font-weight: 900; margin-bottom: 6px">网球能力五维评测 & 训练后晋升测试</div>
            <div style="font-size: 12px; color: var(--ink-2); line-height: 1.65; margin-bottom: 8px">
              • <strong>如何升级：</strong>完成专项训练后预约<strong>「晋升测试」</strong>，指定机构复测录入新五维数据即可升级！<br />
              • <strong>结果联动：</strong>自动同步至「赛事分级报名」与「同城约球匹配」
            </div>
            <select v-model="selectedOrg" class="f-input" style="margin-bottom: 9px">
              <option>湖北省网球学校评测中心</option>
              <option>京山国际网球中心官方认证点</option>
            </select>
            <div class="flex-row">
              <button class="btn-orange" @click="runUpgradeTest(selectedOrg, true)">完成晋升复测录入（200分抵扣）</button>
              <button class="btn-ghost" @click="switchModule(13)">查看我的档案</button>
            </div>
          </div>
          <div>
            <AbilityRadarChart :ability="state.ability" :level="state.abilityLevel" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="trainTab === '全部' || trainTab === '俱乐部团建'" class="grid-3">
      <div class="card card-pad">
        <div class="photo-box" style="height: 125px; border-radius: 10px; margin-bottom: 9px">
          <img src="/images/indoor_court.jpg" alt="京彩俱乐部" />
          <span class="badge-tl">认证俱乐部 · 课程直售</span>
        </div>
        <div class="flex-between">
          <strong style="font-size: 14.5px">京彩网球俱乐部 · 进阶私教包</strong>
          <span class="rating-pill">★ 4.9 (218评)</span>
        </div>
        <div style="font-size: 11.5px; color: var(--ink-3); margin: 4px 0">2片室内空调硬地 · 10节私教课赠免费晋升评测1次</div>
        <div class="review-quote">💬 评：“教练针对我的发球和网前截击定制训练，进步肉眼可见！”</div>
        <div class="flex-between" style="margin-top: 9px">
          <span class="price" style="font-size: 17px">¥1,680<small>/10节</small></span>
          <button class="btn-primary" @click="createQuickOrder('课程', '京彩网球俱乐部 · 10节进阶私教包', '赠指定机构晋升评测1次', 1680, 150)">
            购买课程
          </button>
        </div>
      </div>

      <div class="card card-pad">
        <div class="photo-box" style="height: 125px; border-radius: 10px; margin-bottom: 9px">
          <img src="/images/coach_1.jpg" alt="政企团建" />
          <span class="badge-tl">🤝 企业团建 / 研学定制</span>
        </div>
        <div class="flex-between">
          <strong style="font-size: 14.5px">政企网球趣味团建 & 研学课程</strong>
          <span class="rating-pill">★ 4.9 (142评)</span>
        </div>
        <div style="font-size: 11.5px; color: var(--ink-3); margin: 4px 0">支持20–150人 · 含零基础破冰赛+定点团餐+温泉放松</div>
        <div class="review-quote">💬 评：“武汉公司带60人来京山团建两天，大家玩得停不下来！”</div>
        <div class="flex-between" style="margin-top: 9px">
          <span class="price" style="font-size: 17px">¥399<small>/人起</small></span>
          <button
            class="btn-primary"
            @click="openActionModal({ type: 'inquiry', title: '政企网球趣味团建 & 研学定制', subtitle: '支持20–150人一站式策划：场馆包场+教练破冰+定点团餐+温泉', submitLabel: '提交团建定制需求' })"
          >
            预约团建
          </button>
        </div>
      </div>

      <div class="card card-pad">
        <div class="photo-box" style="height: 125px; border-radius: 10px; margin-bottom: 9px">
          <img src="/images/tournament_2.jpg" alt="青少年比赛与康复" />
          <span class="badge-tl">🏆 青少年赛 + 🩺 运动康复</span>
        </div>
        <div class="flex-between">
          <strong style="font-size: 14.5px">青少年网球比赛 & 运动康复联动</strong>
          <span class="rating-pill">★ 4.9</span>
        </div>
        <div style="font-size: 11.5px; color: var(--ink-3); margin: 4px 0">U10/U12/U14/U16分级赛报名；配套人民医院/中医院/世杰运动康复室</div>
        <div class="review-quote">💬 评：“训赛一体化，受伤了还有卫健认证运动康复兜底，很安心。”</div>
        <div class="flex-between" style="margin-top: 9px">
          <button class="btn-orange" @click="switchModule(2)">青少年赛报名</button>
          <button class="btn-ghost" @click="createQuickOrder('课程', '世杰运动康复室（郭医生）专项理疗', '网球肘/肩袖防护与深度拉伸', 120, 40)">
            预约康复
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
