export interface CampProgram {
  id: string
  category: '训练营' | '研学课程' | '团建活动'
  badge: string
  title: string
  targetAudience: string
  duration: string
  scheduleDate: string
  venue: string
  photo: string
  rating: number
  price: number
  priceUnit: string
  remaining: number
  highlights: string[]
  desc: string
}

export interface ClubCourse {
  id: string
  name: string
  lessons: string
  price: number
  memberPrice: number
  tag: string
}

export interface ClubReview {
  id: string
  user: string
  score: number
  date: string
  content: string
}

export interface TennisClub {
  id: string
  name: string
  badge: string
  photo: string
  rating: number
  reviewCount: number
  courtsInfo: string
  coachCount: number
  address: string
  lng: number
  lat: number
  phone: string
  intro: string
  tags: string[]
  courses: ClubCourse[]
  reviews: ClubReview[]
}

export interface YouthTournament {
  id: string
  groupTag: 'U8/U10' | 'U12/U14' | 'U16/U18'
  levelBadge: string
  name: string
  dateRange: string
  venue: string
  surface: string
  fee: number
  quotaRemain: number
  status: '报名中' | '火热进行中' | '即将开赛'
  pointsReward: number
  desc: string
  registered?: boolean
}

export interface RehabCenter {
  id: string
  name: string
  badge: string
  photo: string
  rating: number
  reviewCount: number
  distance: string
  openHours: string
  address: string
  lng: number
  lat: number
  phone: string
  doctorInfo: string
  intro: string
  services: { name: string; duration: string; price: number }[]
  quote: string
}

export const CAMP_PROGRAMS: CampProgram[] = [
  {
    id: 'camp-winter-club',
    category: '训练营',
    badge: '❄️ 俱乐部寒假营 · 报名热招',
    title: '京彩/温泉红土网球俱乐部 · 2027青少年寒假专项训练营',
    targetAudience: '7–16岁青少年（按CUTR水平分班）',
    duration: '5天4晚',
    scheduleDate: '2027年1月18日 / 1月25日 两期开营',
    venue: '京彩室内空调馆 & 温泉红土网球学院',
    photo: '/images/indoor_court.jpg',
    rating: 5.0,
    price: 1680,
    priceUnit: '/人/期',
    remaining: 9,
    highlights: ['五星俱乐部主教练带队 · 室内恒温+红土双修', '含每日体能监测 + 世杰康复拉伸课', '结营赠五维能力晋升复测与视频动作报告'],
    desc: '专为中青赛参赛及进阶青少年打造的俱乐部寒假强化训练营：聚焦发球动力学、红土滑步与比赛关键分心理，全程配备室内恒温场与运动恢复指导。',
  },
  {
    id: 'camp-1',
    category: '训练营',
    badge: '🏕️ 省网校直营 · 热门爆款',
    title: '湖北省网球学校 7 天青少年冬夏令营',
    targetAudience: '6–18岁青少年（按水平分班）',
    duration: '7天6晚',
    scheduleDate: '每周末/寒暑假滚动开营',
    venue: '湖北省网球学校 & 31片风雨红土基地',
    photo: '/images/coach_2.jpg',
    rating: 5.0,
    price: 2480,
    priceUnit: '/人/期',
    remaining: 14,
    highlights: ['国家级教练 1:4 分层指导', '含标准营地食宿与保险', '结营赠官方五维能力评测证书'],
    desc: '系统打磨正反手稳定性、发球动力学与比赛战术思维，结营组织分组积分对抗赛并录入五维成长档案。',
  },
  {
    id: 'camp-2',
    category: '训练营',
    badge: '🏕️ 成人进阶 · 周末特训',
    title: '成人 CUTR 3.0→4.0 红土/硬地 3 天强化营',
    targetAudience: 'CUTR 2.5–4.0 成人球友',
    duration: '3天2晚',
    scheduleDate: '每周五晚报到 – 周日下午结营',
    venue: '京山国际网球中心 & 训练基地红土场',
    photo: '/images/indoor_court.jpg',
    rating: 4.9,
    price: 1280,
    priceUnit: '/人/期',
    remaining: 6,
    highlights: ['每日 4h 高密度多球+双打实战', '慢动作高速摄像逐帧复盘', '赠天沐温泉赛后恢复票1张'],
    desc: '专为想快速突破瓶颈的成人球友打造，集中攻克二发稳定性、接发抢攻与双打网前截击短板。',
  },
  {
    id: 'study-1',
    category: '研学课程',
    badge: '🎓 体教融合 · 亲子研学',
    title: '“中国网球之城”2 天亲子网球 + 非遗桥米研学',
    targetAudience: '亲子家庭 / 中小学研学团',
    duration: '2天1晚',
    scheduleDate: '每周六出发（全年可定制）',
    venue: '省网校体验馆 + 孙桥桥米原乡 + 绿林山',
    photo: '/images/scenic.jpg',
    rating: 4.9,
    price: 598,
    priceUnit: '/一大一小',
    remaining: 12,
    highlights: ['短式网球亲子趣味启蒙课', '亲手碾制国宝京山桥米与锅巴', '颁发京山文旅官方研学实践证书'],
    desc: '把体育运动与非遗农耕深度融合，孩子爱上挥拍的同时走进明代贡米原乡，体验沉浸式实践课堂。',
  },
  {
    id: 'study-2',
    category: '研学课程',
    badge: '🎓 校际实践 · 证书认证',
    title: '青少年网球文化探秘与生态地理 3 日研学营',
    targetAudience: '8–16岁学生集体/散拼',
    duration: '3天2晚',
    scheduleDate: '支持学校/机构整团预约',
    venue: '国际网球中心博物馆 + 空山洞地质馆 + 网校',
    photo: '/images/hero.jpg',
    rating: 4.8,
    price: 890,
    priceUnit: '/人',
    remaining: 20,
    highlights: ['参观国际中心赛事鹰眼与裁判系统', '空山洞喀斯特溶洞自然科学考察', '全程专业研学导师+随队医护'],
    desc: '结合网球规则礼仪、体能测评与大洪山地质生态考察，打造高含金量综合素质实践研学课程。',
  },
  {
    id: 'team-1',
    category: '团建活动',
    badge: '🤝 企业团建 · 零基础破冰',
    title: '政企网球趣味破冰团建（半日/全日一站式）',
    targetAudience: '20–150人政企团队/工会活动',
    duration: '半日 / 1天',
    scheduleDate: '提前 3 天预约即可排期',
    venue: '京山国际网球中心 / 文峰公园包场',
    photo: '/images/coach_1.jpg',
    rating: 4.9,
    price: 298,
    priceUnit: '/人起',
    remaining: 8,
    highlights: ['零基础友好趣味积分团赛', '免费提供全套球拍、比赛用球与奖杯', '配套定点营养团餐与航拍合影'],
    desc: '无需网球基础也能全员上场！专业教练带队设计发球靶盘、接力多拍与分组对抗赛，凝聚力拉满。',
  },
  {
    id: 'team-2',
    category: '团建活动',
    badge: '🤝 高端定制 · 网球+温泉',
    title: '企业高管/俱乐部“挥拍 + 天沐温泉”2 天团建',
    targetAudience: '15–80人俱乐部/企业团队',
    duration: '2天1晚',
    scheduleDate: '全年接受团队档期锁定',
    venue: '红土球场专享包场 + 天沐温泉度假区',
    photo: '/images/hotspring.jpg',
    rating: 5.0,
    price: 688,
    priceUnit: '/人',
    remaining: 5,
    highlights: ['红土球场专属团体杯赛+专业裁判', '温泉私汤晚宴+桥米庆功宴', '高铁京山南站专属大巴接送'],
    desc: '白天红土赛场挥洒汗水、晚上温泉池畔畅谈联谊，京山最具辨识度的品质体育团建方案。',
  },
]

export const INITIAL_CLUBS: TennisClub[] = [
  {
    id: 'club-jingcai',
    name: '京彩网球俱乐部（室内空调旗舰馆）',
    badge: '🏅 官方五星认证俱乐部',
    photo: '/images/indoor_court.jpg',
    rating: 4.9,
    reviewCount: 218,
    courtsInfo: '2片室内空调硬地 + 4片室外标准场',
    coachCount: 8,
    address: '湖北省荆门市京山市温泉街道网球大道12号',
    lng: 113.1214,
    lat: 31.0229,
    phone: '0724-7229501',
    intro: '京山本土口碑领先的会员制网球俱乐部，主打成人零基础快速上手、进阶私教包与每周五晚球友分级擂台赛。',
    tags: ['室内恒温空调', '赠免费晋升评测', '每周分级擂台赛', '免费穿线1次'],
    courses: [
      { id: 'cc-1', name: '成人零基础 1对1 体验课（含拍球）', lessons: '1课时 · 60分钟', price: 158, memberPrice: 128, tag: '新手必选' },
      { id: 'cc-2', name: '进阶 10 节私教强化包（赠评测）', lessons: '10课时 · 有效期6个月', price: 1880, memberPrice: 1680, tag: '热销No.1' },
      { id: 'cc-3', name: '周末双打战术小班月卡（4人班）', lessons: '8课时/月', price: 780, memberPrice: 680, tag: '性价比高' },
    ],
    reviews: [
      { id: 'cr-1', user: '武汉球友老陈', score: 5.0, date: '2026-11-24', content: '室内空调场太舒服了，买完10节私教包后反手稳定太多，直接通过了JS-4.0复测！' },
      { id: 'cr-2', user: '京山小赵', score: 4.9, date: '2026-11-20', content: '俱乐部氛围特别好，周五擂台赛认识了一堆同水平搭子！' },
    ],
  },
  {
    id: 'club-wenfeng',
    name: '文峰网球公开赛俱乐部（夜场人气据点）',
    badge: '🔥 22家联约示范俱乐部',
    photo: '/images/hero.jpg',
    rating: 4.9,
    reviewCount: 342,
    courtsInfo: '文峰公园 12 片灯光硬地合作主场',
    coachCount: 11,
    address: '湖北省荆门市京山市新市街道文峰路18号文峰公园内',
    lng: 113.1128,
    lat: 31.0185,
    phone: '0724-7223388',
    intro: '深耕京山城区全民网球普及 10 余年，拥有活跃会员 1,200+ 人，专注青少年启蒙长训班、晚间成人团课与同城联赛。',
    tags: ['城区交通便利', '青少年启蒙强项', '夜场氛围拉满', '月度积分赛'],
    courses: [
      { id: 'cc-4', name: '青少年 U8-U12 季度常规启蒙班', lessons: '24课时 · 周末班', price: 2480, memberPrice: 2280, tag: '家长力荐' },
      { id: 'cc-5', name: '下班夜场成人多球燃脂班（10次卡）', lessons: '10次 · 每次90分钟', price: 880, memberPrice: 760, tag: '夜场热卖' },
    ],
    reviews: [
      { id: 'cr-3', user: '悦悦妈妈', score: 5.0, date: '2026-11-23', content: '孩子在这里学了两个季度，动作非常规范，今年还参加了中青赛选拔！' },
    ],
  },
  {
    id: 'club-redclay',
    name: '温泉国际红土网球学院（赛事进阶基地）',
    badge: '🏆 红土专项认证学院',
    photo: '/images/tournament_1.jpg',
    rating: 5.0,
    reviewCount: 164,
    courtsInfo: '6片法网标准红土 + 智能发球机训练室',
    coachCount: 6,
    address: '湖北省荆门市京山市温泉街道网球大道16号东区',
    lng: 113.1245,
    lat: 31.0242,
    phone: '0724-7228899',
    intro: '依托京山独特红土资源打造的专业学院，擅长红土滑步步法、高弹跳上旋压制与青少年参赛选手赛前集训。',
    tags: ['法网同款红土', '赛前突击特训', '发球机自助练', '支持外地短期班'],
    courses: [
      { id: 'cc-6', name: '红土滑步与上旋专项 5 节精品课', lessons: '5课时 · 含红土场费', price: 1380, memberPrice: 1180, tag: '外地球友热选' },
      { id: 'cc-7', name: '青少年赛前 1对1 战术陪打复盘', lessons: '2小时实战+视频分析', price: 460, memberPrice: 398, tag: '赛期热门' },
    ],
    reviews: [
      { id: 'cr-4', user: '深圳教练周先生', score: 5.0, date: '2026-11-21', content: '特意带队员来京山适应红土场地，学院教练对红土站位和滑步的指导非常专业！' },
    ],
  },
]

export const INITIAL_YOUTH_TOURNAMENTS: YouthTournament[] = [
  {
    id: 'yt-1',
    groupTag: 'U16/U18',
    levelBadge: 'CTJ-A2000 国家级',
    name: '2026 中国青少年网球巡回赛总决赛（京山站）',
    dateRange: '2026-11-24 至 12-03',
    venue: '京山国际网球中心 & 训练基地',
    surface: '标准硬地 / 红土',
    fee: 0,
    quotaRemain: 42,
    status: '火热进行中',
    pointsReward: 120,
    desc: '中国青少年四大满贯级赛事，开放青少年球员现场观摩席与外卡选拔预登记，凭凭证享住宿85折。',
  },
  {
    id: 'yt-2',
    groupTag: 'U12/U14',
    levelBadge: 'CTJ-B600 省级积分',
    name: '京山“网球之城杯”青少年红土积分赛',
    dateRange: '2026-12-05 至 12-06',
    venue: '京山网球训练基地（红土场）',
    surface: '标准红土',
    fee: 120,
    quotaRemain: 18,
    status: '报名中',
    pointsReward: 150,
    desc: '单打+双打双项目设奖，全程对接「网球记」实时计分直播，完赛同步刷新 CTJ 与五维等级积分。',
  },
  {
    id: 'yt-3',
    groupTag: 'U8/U10',
    levelBadge: 'CTJ-C200 启蒙赛',
    name: '湖北省青少年周末短式/绿点球分级赛（京山站）',
    dateRange: '2026-11-29（周日全天）',
    venue: '京山文峰公园网球场',
    surface: '室外硬地',
    fee: 80,
    quotaRemain: 11,
    status: '报名中',
    pointsReward: 100,
    desc: 'U8 红球 / U10 橙绿球分龄小组循环赛，保证每位小选手至少打满 4 场实战，完赛颁发奖牌证书。',
  },
  {
    id: 'yt-4',
    groupTag: 'U12/U14',
    levelBadge: '体教融合校际赛',
    name: '湖北省网球学校冬季营际青少年对抗赛',
    dateRange: '2026-12-12 至 12-13',
    venue: '湖北省网球学校室内风雨馆',
    surface: '室内风雨硬地',
    fee: 90,
    quotaRemain: 24,
    status: '即将开赛',
    pointsReward: 120,
    desc: '面向全省及周边省份青少年开放，表现优异者可获省网校特长生试训推荐名额与冬令营学费减免。',
  },
]

export const REHAB_CENTERS: RehabCenter[] = [
  {
    id: 'rehab-rmyy',
    name: '京山市人民医院运动医学与康复中心',
    badge: '🏥 三甲医院 · 赛期绿色通道',
    photo: '/images/hotel.jpg',
    rating: 5.0,
    reviewCount: 428,
    distance: '距国际网球中心 1.8km',
    openHours: '08:00 – 20:30（急诊24小时）',
    address: '湖北省荆门市京山市新市街道城中路市人民医院康复医学楼',
    lng: 113.1158,
    lat: 31.0238,
    phone: '0724-7222120',
    doctorInfo: '运动医学主任医师团队坐诊 · 配备肌骨超声与体外冲击波仪',
    intro: '京山市卫健局指定的赛事官方医疗与运动康复核心保障单位，专攻网球肘、肩袖劳损、半月板防护与急性扭伤处置。',
    services: [
      { name: '运动损伤肌骨超声精准评估', duration: '30分钟', price: 98 },
      { name: '网球肘/肩袖体外冲击波理疗', duration: '40分钟', price: 138 },
      { name: '赛后下肢加压恢复 + 筋膜放松', duration: '45分钟', price: 118 },
    ],
    quote: '打完三场分级赛手腕有点不适，走赛期绿通半小时就做完评估+冲击波，非常专业安心！',
  },
  {
    id: 'rehab-shijie',
    name: '世杰运动康复室（郭医生专业工作室）',
    badge: '⭐ 球友口碑No.1 · 赛场零距离',
    photo: '/images/indoor_court.jpg',
    rating: 4.9,
    reviewCount: 316,
    distance: '距国际网球中心 600m',
    openHours: '09:00 – 22:00（夜场可约）',
    address: '湖北省荆门市京山市温泉街道网球大道10号体育商业街2楼',
    lng: 113.1182,
    lat: 31.0211,
    phone: '0724-7236619',
    doctorInfo: '国家认证运动康复师郭医生主理 · 长期服务省网校与参赛球员',
    intro: '紧邻国际网球中心与训练基地，深耕网球专项动作代偿纠正、赛前防扭伤肌贴贴扎与赛后深度筋膜松解。',
    services: [
      { name: '赛后全身深度筋膜松解与拉伸', duration: '50分钟', price: 120 },
      { name: '赛前防伤肌内效贴扎（膝/踝/肘）', duration: '20分钟', price: 48 },
      { name: '网球发力体态评估与核心康复训练', duration: '60分钟', price: 168 },
    ],
    quote: '打完3小时红土过来贴肌贴+筋膜松解，第二天腿一点不酸直接满血复活！',
  },
  {
    id: 'rehab-zyy',
    name: '京山市中医院中医运动调理与推拿中心',
    badge: '🌿 中医理疗 · 票根享85折',
    photo: '/images/hotspring.jpg',
    rating: 4.9,
    reviewCount: 265,
    distance: '距文峰公园球场 420m',
    openHours: '08:00 – 21:00',
    address: '湖北省荆门市京山市新市街道京源大道中医院治未病楼3层',
    lng: 113.1072,
    lat: 31.0166,
    phone: '0724-7223120',
    doctorInfo: '资深针灸推拿医师团队 · 传统正骨与现代运动恢复结合',
    intro: '距离文峰公园夜场仅400余米，擅长针对高强度打球后的腰背僵硬、肩颈酸痛提供中医推拿、温灸与中药热敷调理。',
    services: [
      { name: '球友专属经络推拿 + 局部温灸', duration: '45分钟', price: 88 },
      { name: '肩颈腰背拔罐舒筋 + 中药热敷', duration: '40分钟', price: 78 },
    ],
    quote: '在文峰打完夜场顺路做个中医推拿和热敷，肩背瞬间松快了，凭票根还能打折！',
  },
]
