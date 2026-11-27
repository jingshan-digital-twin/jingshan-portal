<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePortalStore } from '../../store/usePortalStore'

const { state, switchModule, openPhoto, openActionModal } = usePortalStore()
const activeTheme = ref<'全部' | '网球+文旅' | '网球+研学' | '网球+康养'>('全部')

const themes = [
  {
    key: '网球+文旅',
    badge: '🌿 主题一：网球 + 文旅',
    sub: '★ 4.9 · 延伸荆门/全省线路',
    photo: '/images/scenic.jpg',
    title: '京山打球 → 绿林山/空山洞 + 明显陵延伸线',
    desc: '热门打卡：莲山湖网红球场、美人谷、文峰河畔夜市 · 含语音导览',
    intro: '以京山国际网球中心与文峰公园挥拍为起点，午后乘网球文旅专线畅游国家4A级绿林山美人谷与恒温溶洞空山洞，夜晚漫步文峰河畔夜市品尝小龙虾与米茶，次日更可延伸打卡世界文化遗产钟祥明显陵。',
    openHours: '全年天天发团 · 推荐 2天1晚',
    address: '湖北省荆门市京山市温泉街道网球大道1号（集结出发点）',
    lng: 113.1195,
    lat: 31.0218,
    tags: ['官方精品网旅线', '含红土/硬地订场', '配智能语音导览', '票根享吃住85折'],
    hotItems: [
      { name: '绿林山美人谷 & 空山洞', price: '含景点门票', tag: '4A生态秘境', desc: '负氧离子3,200+/cm³，赛后轻徒步吸氧绝佳之选。' },
      { name: '文峰河畔夜市 & 桥米宴', price: '含票根85折', tag: '地道风味', desc: '现焖桥米锅巴、排骨藕汤与河畔碳火夜宵。' },
    ],
    detailedReviews: [
      { user: '武汉球友阿泽', origin: '武汉', score: 5.0, date: '2026-11-24', content: '上午打球下午吸氧晚上吃烧烤，两天行程张弛有度，完全不赶路，特别适合带朋友自驾来玩！' },
      { user: '深圳球友Alex', origin: '深圳', score: 4.9, date: '2026-11-19', content: '第一次发现打完网球还能顺路逛世界遗产明显陵，客服安排得非常细致。' },
    ],
    price: '¥498',
    extra: '/人起 · 会员9折',
    btn: '查看文旅线路',
    target: 3 as const,
  },
  {
    key: '网球+研学',
    badge: '🎓 主题二：网球 + 研学',
    sub: '★ 4.9 · 湖北省网球学校直营',
    photo: '/images/coach_2.jpg',
    title: '湖北省网球学校 7 天冬夏令营 & 等级评测',
    desc: '训后可在指定机构参加五维能力晋升测试 · 含食宿与赛事体验',
    intro: '依托全国体教融合典范——湖北省网球学校优质教练团队与31片室内风雨及红土场资源，针对6–18岁青少年与成人球友开设封闭式系统训练营，课程涵盖底线稳定性、发球动力学、战术实战与结营官方五维等级认证评测。',
    openHours: '寒暑假 & 周末滚动开营（7天/期）',
    address: '湖北省荆门市京山市温泉街道网球大道16号（湖北省网球学校）',
    lng: 113.1245,
    lat: 31.0242,
    tags: ['省网校直营教练', '含标准营地食宿', '官方五维能力评测', '完营积+200分'],
    hotItems: [
      { name: '国家级教练分层小班特训', price: '每日4小时', tag: '1:4师生比', desc: '按JS等级分班教学，精准纠正发球与反手发力动作。' },
      { name: '结营五维能力评测与证书', price: '含在营费内', tag: '官方录入', desc: '结营实测录入五维雷达图，颁发等级认证证书。' },
    ],
    detailedReviews: [
      { user: '长沙欣然妈妈', origin: '长沙', score: 5.0, date: '2026-11-23', content: '孩子在省网校练了一周，动作规范太多了，结营直接通过了晋升测试，还交到了全国各地的球友！' },
      { user: '北京林先生', origin: '北京', score: 4.9, date: '2026-11-18', content: '学校旁边就是网球公寓，家长陪读住得舒心，教练责任心很强。' },
    ],
    price: '¥2,480',
    extra: '/期 · 积+200分',
    btn: '报名与咨询',
    target: 9 as const,
  },
  {
    key: '网球+康养',
    badge: '♨️ 主题三：网球 + 康养',
    sub: '★ 4.9 · 官方旗舰热销1,240份',
    photo: '/images/hotspring.jpg',
    title: '京山四天三晚尊享：打网球 + 泡温泉 + 运动康复',
    desc: '含6小时红土/硬地场 + 温泉主题酒店 + 专业理疗恢复 + 桥米宴',
    intro: '京山年度口碑No.1官方旗舰度假产品！专为热爱网球又讲究身心恢复的品质球友设计：连住三晚五星/私汤温泉酒店，每天畅打红土/硬地标准场，赛后尊享天然偏硅酸温泉私汤、卫健认证运动康复筋膜松解与非遗桥米欢迎宴。',
    openHours: '全年可订 · 四天三晚自由行/小包团',
    address: '湖北省荆门市京山市温泉街道天沐温泉度假区',
    lng: 113.1415,
    lat: 31.0312,
    tags: ['热销1,240份', '含6h高端订场', '天然矿物质私汤', '配专业运动理疗'],
    hotItems: [
      { name: '红土+硬地畅打6小时', price: '含灯光与陪练体验', tag: '旗舰权益', desc: '优先锁定国际网球中心与训练基地黄金时段场地。' },
      { name: '天沐温泉 + 运动康复理疗', price: '含3晚温泉房', tag: '满血恢复', desc: '天然矿泉汤池叠加专业康复师筋膜放松，告别次日酸痛。' },
    ],
    detailedReviews: [
      { user: '上海球友俱乐部陈总', origin: '上海', score: 5.0, date: '2026-11-25', content: '带俱乐部8个人订了四天三晚套餐，白天打红土晚上泡温泉再做个理疗，吃的是地道桥米宴，大家都说来年还要来！' },
      { user: '武汉周女士', origin: '武汉', score: 4.9, date: '2026-11-20', content: '全程无缝衔接，高铁站有专车接送，几乎零操心的高品质运动度假体验。' },
    ],
    price: '¥2,999',
    extra: '/人起 · 票根立减',
    btn: '立即预订',
    target: 3 as const,
    orange: true,
  },
]

const visibleThemes = computed(() =>
  activeTheme.value === '全部' ? themes : themes.filter((t) => t.key === activeTheme.value),
)
</script>

<template>
  <section>
    <div class="module-header">
      <div class="mh-left">
        <div class="mh-num">01</div>
        <div>
          <h1 class="mh-title">首页总览与网球主题专区</h1>
          <div class="mh-desc">
            京山网球城市名片、宣传片、城市导览、三大精品网旅主题（文旅/研学/康养）、近期赛事预告、活动弹窗与快捷订场入口
          </div>
        </div>
      </div>
      <div class="mh-tabs">
        <button
          v-for="tab in (['全部', '网球+文旅', '网球+研学', '网球+康养'] as const)"
          :key="tab"
          class="m-tab"
          :class="{ active: activeTheme === tab }"
          @click="activeTheme = tab"
        >
          {{ tab === '全部' ? '全部主题' : tab }}
        </button>
        <button class="m-tab" style="background: #fff3eb; border-color: #f9c8ae; color: #c93f14" @click="state.showEventModal = true">
          🏆 赛事重磅弹窗
        </button>
        <button class="m-tab" @click="switchModule(2)">近期赛事预告 →</button>
      </div>
    </div>

    <div class="grid-split mb-18">
      <div class="card">
        <div
          class="photo-box"
          style="height: 256px"
          @click="openActionModal({ type: 'video', title: '《中国网球之城 · 生态京山》官方城市宣传片', duration: '02:15' })"
        >
          <img src="/images/hero.jpg" alt="京山网球城市名片宣传片" />
          <div class="badge-tl"><span class="live-dot" />官方宣传片 · 02:15 高清实景</div>
          <div
            style="
              position: absolute;
              inset: 0;
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
              padding: 20px 22px;
              background: linear-gradient(180deg, transparent 20%, rgba(8, 30, 22, 0.92) 100%);
              color: #fff;
            "
          >
            <div class="flex-row" style="margin-bottom: 8px">
              <span class="tag" style="background: var(--lime); color: #0b251d">中国网球之城 · 城市名片</span>
              <span class="tag" style="background: rgba(255, 255, 255, 0.2); color: #fff">全市 356 片标准场 · 万人5.67片</span>
              <span class="tag" style="background: rgba(255, 255, 255, 0.2); color: #fff">📍 已识别来源地：{{ state.origin }}</span>
            </div>
            <div style="font-size: 21px; font-weight: 900; margin-bottom: 6px">以球塑城、以赛兴业：欢迎来到生态京山</div>
            <div class="flex-between">
              <span style="font-size: 12.5px; color: rgba(255, 255, 255, 0.86)">
                一站打通吃住行游购娱训打 · 打球电子票根直享全市 79 家网球联盟商家优惠
              </span>
              <div class="flex-row">
                <button
                  class="btn-orange"
                  style="border-radius: 99px"
                  @click.stop="openActionModal({ type: 'video', title: '《中国网球之城 · 生态京山》官方城市宣传片', duration: '02:15' })"
                >
                  ▶ 播放城市宣传片
                </button>
                <button
                  class="btn-ghost"
                  style="border-radius: 99px"
                  @click.stop="openActionModal({ type: 'audio', spotName: '京山网球城市全景导览', duration: '全城2日游推荐', photo: '/images/hero.jpg', script: '欢迎来到中国网球之城——湖北京山。全市拥有356片标准网球场，每万人拥有5.67片，您可以以京山国际网球中心为起点，串联天沐温泉、绿林山、空山洞、文峰夜市与桥米美食，开启挥拍山水间的惬意旅程。' })"
                >
                  🗺️ 城市导览
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="card-pad flex-between" style="background: #fafdfc">
          <div class="flex-row">
            <span class="tag green">🎾 快捷订场入口</span>
            <span style="font-size: 12.5px; font-weight: 700">
              今日全市空闲可约 <strong style="color: var(--primary)">84 片</strong> · 同步预约车位与充电桩
            </span>
          </div>
          <div class="flex-row">
            <button class="btn-primary" @click="switchModule(2)">立即去订场 →</button>
            <button class="btn-ghost" @click="switchModule(13)">查看我的 {{ state.abilityLevel }} 能力卡</button>
          </div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px">
        <div v-if="state.showActivityPopup" class="popup-preview">
          <div class="flex-between" style="margin-bottom: 8px">
            <span class="tag orange">🎉 热门活动弹窗 · 2026京山网球公开赛重磅福利</span>
            <button style="border: none; background: transparent; font-size: 11px; color: var(--ink-3)" @click="state.showActivityPopup = false">
              ✕ 关闭弹窗
            </button>
          </div>
          <div style="font-size: 16.5px; font-weight: 900; color: #472500; margin-bottom: 5px">
            🏠 市房管局赛事特惠：网球公开赛期间购房直减 ¥50,000！
          </div>
          <div style="font-size: 12px; color: #7a4e16; margin-bottom: 10px">
            温泉世家、网球新城等核心区品质楼盘参与，凭京山网球参赛/观赛凭证即享 5 万元购房补贴（往届已热销 60+ 套）；同步支持短/长租网球公寓！
          </div>
          <div class="flex-between">
            <div class="flex-row"><span class="tag gold">房管局官方认证</span><span class="tag green">含网球公寓长短租</span></div>
            <button class="btn-orange" @click="switchModule(5)">查看购房减5万与公寓 →</button>
          </div>
        </div>
        <div v-else class="card card-pad flex-between" style="background: #fff9ef">
          <span style="font-size: 12.5px; font-weight: 700; color: #7a4e16">🎁 活动弹窗已收起（购房减5万元 / 赛事消费券）</span>
          <button class="btn-ghost" @click="state.showActivityPopup = true">重新展开弹窗</button>
        </div>

        <div class="card card-pad">
          <div class="flex-between" style="margin-bottom: 10px">
            <strong style="font-size: 15px">🏆 近期赛事预告 & 热门活动报名</strong>
            <div class="flex-row">
              <button class="btn-ghost" style="padding: 3px 9px; font-size: 11px" @click="state.showEventModal = true">
                📣 打开赛事弹窗
              </button>
              <span style="font-size: 12px; color: var(--primary); font-weight: 700; cursor: pointer" @click="switchModule(2)">
                看网球记实时比分 →
              </span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <div class="flex-between" style="background: #f5faf8; padding: 9px 11px; border-radius: 10px">
              <div>
                <div style="font-size: 13px; font-weight: 800">2026中国青少年网球巡回赛总决赛 <span class="tag red">进行中</span></div>
                <div style="font-size: 11px; color: var(--ink-3)">11/24–12/3 · 国际网球中心 · 观赛116.3万 · 实时比分同步</div>
              </div>
              <button class="btn-primary" @click="switchModule(2)">查赛况/交通</button>
            </div>
            <div class="flex-between" style="background: #fff8f4; padding: 9px 11px; border-radius: 10px">
              <div>
                <div style="font-size: 13px; font-weight: 800">京山网球周末分级赛（匹配 {{ state.abilityLevel }} 组） <span class="tag orange">余12位</span></div>
                <div style="font-size: 11px; color: var(--ink-3)">11/29 文峰公园 · 完赛积+120分 · 赠联盟商家票根折扣券</div>
              </div>
              <button class="btn-orange" @click="switchModule(2)">一键报名</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-3">
      <div v-for="t in visibleThemes" :key="t.key" class="card">
        <div
          class="photo-box"
          style="height: 165px"
          @click="
            openPhoto({
              title: t.title,
              category: '京山网球精品主题详情',
              photo: t.photo,
              rating: 4.9,
              subtitle: `${t.badge} ｜ ${t.sub}`,
              intro: t.intro,
              openHours: t.openHours,
              priceInfo: `${t.price}${t.extra}`,
              address: t.address,
              lng: t.lng,
              lat: t.lat,
              tags: t.tags,
              hotItemsTitle: '✨ 主题行程核心包含与亮点',
              hotItems: t.hotItems,
              reviews: t.detailedReviews,
            })
          "
        >
          <img :src="t.photo" :alt="t.title" />
          <span class="badge-tl">{{ t.badge }}</span>
          <span class="badge-bl">{{ t.sub }}</span>
        </div>
        <div class="card-pad">
          <div style="font-size: 15.5px; font-weight: 800; margin-bottom: 4px">{{ t.title }}</div>
          <div style="font-size: 12px; color: var(--ink-3); margin-bottom: 10px">{{ t.desc }}</div>
          <div class="flex-between">
            <span class="price">{{ t.price }}<small>{{ t.extra }}</small></span>
            <button :class="t.orange ? 'btn-orange' : 'btn-primary'" @click="switchModule(t.target)">{{ t.btn }}</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
