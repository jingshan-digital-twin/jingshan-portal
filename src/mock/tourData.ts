export type TourSpotCategory = '景区' | '乡村景点' | '网红打卡点' | '夜市消费'

export interface TourSpot {
  id: string
  category: TourSpotCategory
  name: string
  badge: string
  photo: string
  rating: number
  reviewCount: number
  duration: string
  bestTime: string
  openHours: string
  price: number
  stubPrice: number
  priceUnit: string
  distance: string
  driveMin: string
  address: string
  lng: number
  lat: number
  tags: string[]
  summary: string
  intro: string
  audioScript: string
  hotItems: { name: string; price: string; tag: string; desc: string }[]
  reviews: { user: string; origin: string; score: number; date: string; content: string }[]
}

export interface TourPackageItem {
  id: string
  scope: '京山本地' | '荆门周边' | '湖北省内'
  badge: string
  title: string
  subtitle: string
  photo: string
  rating: number
  sold: number
  duration: string
  price: number
  originalPrice: number
  includes: string[]
  highlights: string[]
  address: string
  lng: number
  lat: number
}

export interface TourItineraryPlan {
  id: 'half' | 'weekend' | 'deep'
  label: string
  durationTag: string
  desc: string
  stops: {
    time: string
    spot: string
    stay: string
    tip: string
    audioScript: string
    photo: string
  }[]
}

export interface TennisBusLine {
  id: string
  code: string
  name: string
  frequency: string
  serviceHours: string
  fare: string
  stops: string[]
  startAddress: string
  lng: number
  lat: number
  highlight: string
}

export interface OutdoorTrail {
  id: string
  mode: '骑行路线' | '生态徒步'
  name: string
  distanceKm: string
  duration: string
  difficulty: string
  oxygen: string
  elevation: string
  photo: string
  startPoint: string
  address: string
  lng: number
  lat: number
  supplyStations: string
  desc: string
  audioScript: string
}

export const TOUR_SPOTS: TourSpot[] = [
  {
    id: 'spot-lulin',
    category: '景区',
    name: '绿林山风景区（美人谷 + 绿林寨）',
    badge: '🏔️ 国家4A景区 · 票根减¥20',
    photo: '/images/scenic.jpg',
    rating: 4.9,
    reviewCount: 1842,
    duration: '建议游玩 3.5小时',
    bestTime: '下午 13:00–17:00（赛后吸氧）',
    openHours: '08:00 – 17:30（16:30停检）',
    price: 118,
    stubPrice: 98,
    priceUnit: '/人',
    distance: '距国际网球中心 46km',
    driveMin: '驾车约 50 分钟（文旅专线A直达）',
    address: '湖北省荆门市京山市绿林镇绿林山风景区南门',
    lng: 112.9762,
    lat: 31.3418,
    tags: ['森林覆盖率92%', '负氧离子3200+', '文旅专线免费乘', '票根立减¥20'],
    summary: '西汉绿林起义策源地，串联翡翠瀑布群美人谷与千年石头古兵寨，赛后徒步吸氧首选。',
    intro: '绿林山风景区地处大洪山南麓，集高山峡谷瀑布、千年古兵寨遗址与原始森林氧吧于一体。栈道平缓遮阴，上午在京山挥拍后午后入山漫步，轻松舒缓肌肉疲劳。',
    audioScript: '欢迎来到国家4A级景区绿林山。沿美人谷两公里亲水栈道前行，您会依次经过沐浴潭、沉鱼瀑与翡翠峡谷，森林负氧离子高达3200个每立方厘米，非常适合打完网球后放松身心。',
    hotItems: [
      { name: '美人谷翡翠瀑布群', price: '含在联票内', tag: '必打卡', desc: '全长2公里清澈溪谷与叠瀑，拍照非常出片。' },
      { name: '绿林寨古兵寨遗址', price: '含在联票内', tag: '登高望远', desc: '两千年石城烽火台，俯瞰大洪山云海。' },
    ],
    reviews: [
      { user: '武汉球友阿泽', origin: '武汉', score: 5.0, date: '2026-11-24', content: '上午红土场挥拍，下午乘文旅专线逛美人谷，水清山绿超级解压！' },
    ],
  },
  {
    id: 'spot-kongshan',
    category: '景区',
    name: '空山洞天然溶洞（华中第一洞）',
    badge: '🏔️ 国家4A景区 · 恒温18°C',
    photo: '/images/hotspring.jpg',
    rating: 4.8,
    reviewCount: 926,
    duration: '建议游玩 2.0小时',
    bestTime: '全天适宜（雨天/酷暑首选）',
    openHours: '08:30 – 17:00',
    price: 65,
    stubPrice: 52,
    priceUnit: '/人',
    distance: '距国际网球中心 12km',
    driveMin: '驾车约 16 分钟（文旅专线B直达）',
    address: '湖北省荆门市京山市温泉街道空山洞景区',
    lng: 113.1528,
    lat: 31.0846,
    tags: ['四季恒温18°C', '天然石编钟奇观', '距市区仅16分钟', '亲子研学推荐'],
    summary: '全长1,548米天然喀斯特溶洞，洞内冬暖夏凉，可现场聆听世界罕见的天然石钟乳编钟演奏。',
    intro: '空山洞形成于数亿年前，洞内钟乳石形态万千，其中“石琴厅”的天然石笋敲击可发出完整音阶乐声，距离京山温泉度假区与网球场仅十余分钟车程。',
    audioScript: '您正步入四季恒温18度的空山洞。前方石琴厅的天然石钟乳经过亿万年滴水沉积形成，轻敲可演奏出《东方红》等经典曲目，堪称大自然鬼斧神工的音乐殿堂。',
    hotItems: [
      { name: '天然石编钟音乐厅', price: '含定时演奏', tag: '奇观必听', desc: '专业讲解员现场敲击天然石笋演奏乐曲。' },
      { name: '地下银河光影步道', price: '含在门票内', tag: '避暑纳凉', desc: '全洞平缓好走，适合全家老小雨天游览。' },
    ],
    reviews: [
      { user: '长沙欣然妈妈', origin: '长沙', score: 4.9, date: '2026-11-22', content: '离球场很近，下雨天改逛空山洞一点不耽误行程，小朋友超喜欢石琴演奏！' },
    ],
  },
  {
    id: 'spot-sanyang',
    category: '乡村景点',
    name: '三阳镇生态田园 & 稻田咖啡村',
    badge: '🌾 省级美丽乡村 · 免费入园',
    photo: '/images/scenic.jpg',
    rating: 4.9,
    reviewCount: 615,
    duration: '建议游玩 2.5小时',
    bestTime: '14:00–18:00（午后慢享+日落）',
    openHours: '全天开放（农庄/咖啡 09:00–20:30）',
    price: 68,
    stubPrice: 58,
    priceUnit: '/体验套票',
    distance: '距国际网球中心 22km',
    driveMin: '驾车约 25 分钟',
    address: '湖北省荆门市京山市三阳镇三阳河生态田园路',
    lng: 113.0684,
    lat: 31.2146,
    tags: ['免费入园打卡', '网红稻田咖啡', '柴火土灶桥米', '垂钓采摘体验'],
    summary: '溪流穿村、万亩生态稻田与网红稻香玻璃咖啡馆相映成趣，可体验垂钓、围炉煮茶与农家土菜。',
    intro: '三阳生态乡村示范片区保留了原生态鄂中田园肌理，串联河畔木栈道、稻田观景咖啡厅与生态果蔬采摘园，是球友周末团建与亲子乡野慢游的宝藏去处。',
    audioScript: '欢迎来到三阳生态田园村。这里三面环山、清溪绕村，您可以先在稻田边的玻璃咖啡馆点一杯现磨拿铁看山景，傍晚再到农庄品尝柴火大铁锅焖出的头茬桥米饭。',
    hotItems: [
      { name: '稻田全景咖啡 + 围炉煮茶', price: '套票含饮品', tag: '乡野慢生活', desc: '360°落地玻璃窗直面稻田与远山。' },
      { name: '农庄垂钓与时令果蔬采摘', price: '含在体验票内', tag: '亲子优选', desc: '现摘富硒柑橘/草莓，可现场快递寄回家。' },
    ],
    reviews: [
      { user: '武汉俱乐部领队', origin: '武汉', score: 5.0, date: '2026-11-23', content: '打完周末赛来村里喝稻田咖啡、吃柴火鸡，节奏慢下来太治愈了！' },
    ],
  },
  {
    id: 'spot-sunqiao',
    category: '乡村景点',
    name: '孙桥镇国宝桥米原乡文化村',
    badge: '🌾 非遗农耕研学 · 免费入园',
    photo: '/images/cuisine.jpg',
    rating: 4.8,
    reviewCount: 412,
    duration: '建议游玩 2.0小时',
    bestTime: '09:30–16:30',
    openHours: '08:30 – 17:30',
    price: 45,
    stubPrice: 36,
    priceUnit: '/研学体验',
    distance: '距国际网球中心 18km',
    driveMin: '驾车约 22 分钟',
    address: '湖北省荆门市京山市孙桥镇桥米原乡文化园',
    lng: 113.0356,
    lat: 31.0715,
    tags: ['国宝桥米原产地', '非遗碾米体验', '明代贡米博物馆', '原产地伴手礼直购'],
    summary: '探访国家地理标志“京山桥米”核心产区，逛桥米文化博物馆、亲手体验古法碾米与桥米锅巴制作。',
    intro: '孙桥镇是京山桥米核心发源地，明嘉靖年间被钦定为皇家贡米。景区融合桥米博物馆、万亩富硒稻田栈道、非遗作坊体验与原产地特产直营店。',
    audioScript: '您现在位于国宝京山桥米核心原产地孙桥镇。这里独特的富硒土壤与山泉水灌溉，造就了桥米细长晶莹、蒸饭清香四溢的绝佳品质，不妨进馆体验亲手焖制一锅金黄锅巴。',
    hotItems: [
      { name: '古法碾米 + 桥米锅巴手作', price: '¥36 票根价', tag: '非遗研学', desc: '适合亲子研学体验，成品可现场品尝或带走。' },
      { name: '桥米原产地直仓伴手礼', price: '享原厂价', tag: '支持包邮', desc: '当季头茬真空锁鲜，满额全国顺丰直发。' },
    ],
    reviews: [
      { user: '深圳球友Alex', origin: '深圳', score: 4.8, date: '2026-11-20', content: '带孩子体验了碾米做锅巴，顺手在原产地直发了四箱新桥米回深圳！' },
    ],
  },
  {
    id: 'spot-lianshan',
    category: '网红打卡点',
    name: '莲山湖网红生态网球场 & 落日栈道',
    badge: '📸 网红出片Top1 · 免费打卡',
    photo: '/images/hero.jpg',
    rating: 5.0,
    reviewCount: 1290,
    duration: '建议游玩 1.5小时',
    bestTime: '16:30–18:30（黄金落日机位）',
    openHours: '全天开放（灯光至 21:30）',
    price: 0,
    stubPrice: 0,
    priceUnit: '免费预约',
    distance: '距国际网球中心 3.8km',
    driveMin: '驾车约 8 分钟',
    address: '湖北省荆门市京山市温泉街道莲山湖生态湿地公园',
    lng: 113.1365,
    lat: 31.0285,
    tags: ['湖畔网红蓝红球场', '日落倒影机位', '小红书热门打卡', '免费预约入园'],
    summary: '被群山碧水环绕的网红生态网球场与亲水栈道，傍晚落日倒映球场，来京山打球必拍的城市封面机位。',
    intro: '莲山湖畔将生态湿地景观与标准硬地/红土球场融为一体，湖心观景台可俯拍“球场嵌在山水间”的震撼画面，自带高颜值咖啡驿站与免费打卡相框。',
    audioScript: '欢迎打卡京山最火的网红机位——莲山湖生态网球场。建议您走到西侧湖心木栈道二层观景台，下午五点前后夕阳斜照在蓝绿色球场与湖面上，随手一拍就是大片。',
    hotItems: [
      { name: '二层全景空中观景台', price: '免费开放', tag: '封面机位', desc: '俯拍山水球场全景，自带网球主题打卡雕塑。' },
      { name: '湖畔落日网球主题咖啡亭', price: '人均 ¥25', tag: '票根85折', desc: '网球造型拉花拿铁与冰爽气泡水。' },
    ],
    reviews: [
      { user: '上海球友Mia', origin: '上海', score: 5.0, date: '2026-11-25', content: '发朋友圈被问爆了！球场嵌在湖光山色里，落日时分美到失语！' },
    ],
  },
  {
    id: 'spot-taizi',
    category: '网红打卡点',
    name: '太子山森林氧吧 & 空中玻璃栈道',
    badge: '📸 森林秘境 · 票根减¥10',
    photo: '/images/scenic.jpg',
    rating: 4.9,
    reviewCount: 734,
    duration: '建议游玩 2.5小时',
    bestTime: '09:00–16:00',
    openHours: '08:30 – 17:30',
    price: 58,
    stubPrice: 48,
    priceUnit: '/人',
    distance: '距国际网球中心 29km',
    driveMin: '驾车约 35 分钟',
    address: '湖北省荆门市京山市石龙镇太子山国家森林公园',
    lng: 112.9284,
    lat: 30.9462,
    tags: ['国家级森林公园', '悬崖玻璃栈道', '林间树屋咖啡', '网红狩猎文化园'],
    summary: '拥有万亩松林、悬空观景玻璃栈道与北欧风森林树屋，深受年轻球友和摄影爱好者喜爱的森系网红打卡地。',
    intro: '太子山国家森林公园以密林松涛、王莽洞溶洞与高空玻璃桥闻名，林间步道串联树屋民宿与森系露营咖啡，是打完比赛后放空呼吸的绝佳森林秘境。',
    audioScript: '您已进入太子山国家森林公园。脚下是万亩生态松林，前方悬空玻璃观景台凌驾于翠谷之上，走完栈道后可以在松林木屋咖啡馆小憩片刻。',
    hotItems: [
      { name: '云端森林玻璃栈道', price: '含在套票内', tag: '刺激出片', desc: '全透明高空观景台，饱览松林云海。' },
      { name: '松林树屋咖啡与露营草坪', price: '人均 ¥38', tag: '森系网红', desc: '拍照自带电影感滤镜，周末有吉他弹唱。' },
    ],
    reviews: [
      { user: '北京林先生', origin: '北京', score: 4.9, date: '2026-11-19', content: '松林空气太清冽了，树屋咖啡拍照特别出片，适合全家轻松逛半天。' },
    ],
  },
  {
    id: 'spot-wenfeng-night',
    category: '夜市消费',
    name: '文峰河畔烟火夜市街区（68家特色摊位）',
    badge: '🌙 夜经济Top1 · 票根赠米茶',
    photo: '/images/night_market.jpg',
    rating: 4.9,
    reviewCount: 2156,
    duration: '建议游玩 2.0小时+',
    bestTime: '18:30–23:30（夜场打球后必逛）',
    openHours: '17:30 – 次日 01:00',
    price: 39,
    stubPrice: 35,
    priceUnit: '/¥50消费券',
    distance: '距文峰公园球场 300m',
    driveMin: '步行约 4 分钟（夜经济专线C直达）',
    address: '湖北省荆门市京山市新市街道文峰河畔夜市街区',
    lng: 113.1135,
    lat: 31.0172,
    tags: ['距文峰球场300m', '68家明码标价摊位', '油焖大虾/碳火烧烤', '票根免费赠米茶'],
    summary: '京山人气最旺的临河烟火夜市！打完夜场球步行4分钟开吃小龙虾、鲜牛肉串、京山米茶，听河畔民谣驻唱。',
    intro: '文峰河畔夜市依托京山河滨灯光夜景打造，汇聚68家本土风味小吃、碳火烧烤、小龙虾排档、非遗文创手作与临水驻唱舞台，明码标价并纳入网球联盟票根核销体系。',
    audioScript: '夜幕降临，欢迎来到灯火璀璨的文峰河畔夜市！从文峰公园球场步行仅需4分钟即可抵达。推荐品尝A区秘制油焖小龙虾与现烤黄牛肉串，凭京山网球电子票根还能免费领一杯冰镇京山米茶！',
    hotItems: [
      { name: '夜市 ¥50 通用消费抵用券', price: '票根价 ¥35', tag: '超值必囤', desc: '全街区 68 家认证美食与文创摊位通用核销。' },
      { name: '河畔民谣驻唱 & 赛事夜场大屏', price: '每晚 19:30', tag: '氛围拉满', desc: '边吃夜宵边看中青赛精彩集锦回放。' },
    ],
    reviews: [
      { user: '成都老杨', origin: '成都', score: 5.0, date: '2026-11-24', content: '打完夜场球走三分钟吃烧烤喝米茶，河边吹风听歌，京山夜生活太安逸了！' },
    ],
  },
  {
    id: 'spot-tennis-night',
    category: '夜市消费',
    name: '温泉新区网球不夜城 · 精酿文创市集',
    badge: '🌙 赛场零距离 · 露营音乐市集',
    photo: '/images/tournament_2.jpg',
    rating: 4.9,
    reviewCount: 864,
    duration: '建议游玩 2.0小时',
    bestTime: '18:00–22:30（赛后聚会首选）',
    openHours: '17:30 – 23:30',
    price: 68,
    stubPrice: 55,
    priceUnit: '/双人微醺套餐',
    distance: '距国际网球中心 150m',
    driveMin: '步行约 2 分钟',
    address: '湖北省荆门市京山市温泉街道网球大道北广场集市',
    lng: 113.1208,
    lat: 31.0231,
    tags: ['国际中心步行2分', '户外大屏看球', '非遗扎染文创摊', '精酿与低脂轻食'],
    summary: '紧邻国际网球中心的潮流夜间消费街区，集户外赛事大屏直播、露营精酿餐吧、运动轻食与非遗网球文创于一体。',
    intro: '专为观赛与打球客群打造的现代化潮流夜市，设置草坪天幕露营区、精酿鲜啤车、低脂能量餐吧与京山蓝染文创市集，赛事期间每晚同步转播中心球场焦点战。',
    audioScript: '这里是紧邻国际网球中心的网球不夜城潮流市集。走下赛场步行两分钟，即可坐在草坪天幕下点一份精酿与轻食沙拉，逛逛京山非遗蓝染网球文创摊位。',
    hotItems: [
      { name: '双人露营精酿 + 烤串轻食套餐', price: '票根价 ¥55', tag: '球友小聚', desc: '含2杯精酿/无醇特饮 + 招牌烤物拼盘。' },
      { name: '非遗扎染网球文创夜市专摊', price: '¥29起', tag: '限定纪念', desc: '现场挑选京山限定扎染吸汗巾与珐琅徽章。' },
    ],
    reviews: [
      { user: '武汉小周', origin: '武汉', score: 4.9, date: '2026-11-25', content: '就在中心球场门口，看完中青赛半决赛直接和球友喝一杯复盘比赛，氛围超赞！' },
    ],
  },
]

export const TOUR_PACKAGES: TourPackageItem[] = [
  {
    id: 'pkg-local-2d',
    scope: '京山本地',
    badge: '🔥 本地热卖 · 2天1晚',
    title: '京山挥拍 + 绿林山/空山洞生态吸氧套餐',
    subtitle: '含 2小时标准订场 + 绿林山/空山洞联票 + 1晚联盟酒店 + 文旅专线免费乘',
    photo: '/images/scenic.jpg',
    rating: 4.9,
    sold: 1680,
    duration: '2天1晚',
    price: 498,
    originalPrice: 648,
    includes: ['2h 硬地/红土订场', '4A景区双门票', '1晚含早联盟酒店', '文旅专线免费接驳'],
    highlights: ['周末说走就走，打球吸氧两不误', '凭电子票根享桥米公馆85折'],
    address: '京山国际网球中心集结出发',
    lng: 113.1195,
    lat: 31.0218,
  },
  {
    id: 'pkg-spa-4d',
    scope: '京山本地',
    badge: '👑 旗舰康养 · 4天3晚',
    title: '京山四天三晚尊享：打网球 + 泡温泉 + 运动康复',
    subtitle: '含 6小时高端场畅打 + 3晚天沐私汤温泉酒店 + 卫健认证理疗 + 桥米欢迎宴',
    photo: '/images/hotspring.jpg',
    rating: 5.0,
    sold: 1240,
    duration: '4天3晚',
    price: 2999,
    originalPrice: 3680,
    includes: ['6h 红土/硬地黄金场', '3晚五星温泉私汤房', '专业赛后筋膜理疗', '非遗桥米欢迎宴'],
    highlights: ['京山年度口碑No.1旗舰度假产品', '高铁京山南站专车免费接送'],
    address: '京山天沐温泉度假区 & 国际网球中心',
    lng: 113.1415,
    lat: 31.0312,
  },
  {
    id: 'pkg-jingmen-2d',
    scope: '荆门周边',
    badge: '🏛️ 世遗延伸 · 2天1晚',
    title: '京山网球 + 天沐温泉 + 钟祥明显陵/漳河联游',
    subtitle: '第一天京山挥拍泡泉，第二天顺路游世界文化遗产明显陵、莫愁村与漳河橘洲',
    photo: '/images/hotel.jpg',
    rating: 4.9,
    sold: 930,
    duration: '2天1晚',
    price: 688,
    originalPrice: 860,
    includes: ['2h 京山订场权益', '天沐温泉通票', '明显陵+漳河游船票', '1晚品质住宿'],
    highlights: ['一程尽览运动、温泉、世遗与湖岛风光', '自驾/返程顺路首选'],
    address: '京山 → 钟祥明显陵 → 漳河风景区',
    lng: 112.6345,
    lat: 31.2028,
  },
  {
    id: 'pkg-hubei-4d',
    scope: '湖北省内',
    badge: '🚄 省外专享 · 4天3晚',
    title: '湖北“网球+武当山/襄阳唐城/三峡”全域环线',
    subtitle: '专为外省参赛与旅居球友定制：京山2日打球+夜市，无缝衔接襄阳/宜昌/武当山',
    photo: '/images/night_market.jpg',
    rating: 4.9,
    sold: 645,
    duration: '4天3晚',
    price: 1299,
    originalPrice: 1680,
    includes: ['京山2日订场+夜市券', '襄阳唐城/武当山任选', '全程持证社专车保障', '3晚精选四星酒店'],
    highlights: ['一次来京山打球顺便玩透大美湖北', '支持2人起小包团灵活出发'],
    address: '京山出发 · 辐射襄阳/十堰/宜昌',
    lng: 113.1135,
    lat: 31.0172,
  },
]

export const TOUR_ITINERARY_PLANS: TourItineraryPlan[] = [
  {
    id: 'half',
    label: '半日轻游（4-5小时）',
    durationTag: '适合赛后半天放松',
    desc: '上午或下午打完 2 小时网球，就近打卡网红球场、溶洞奇观与河畔烟火夜市，零折腾最惬意。',
    stops: [
      {
        time: '14:00',
        spot: '空山洞天然溶洞',
        stay: '建议 2.0h',
        tip: '距国际网球中心仅16分钟，恒温18°C听石编钟演奏',
        audioScript: '建议下午两点抵达空山洞，洞内凉爽舒适，游览全程约2小时，重点聆听石琴厅天然编钟演奏。',
        photo: '/images/hotspring.jpg',
      },
      {
        time: '16:40',
        spot: '莲山湖网红网球场',
        stay: '建议 1.0h',
        tip: '黄金落日时段俯拍山水球场大片，喝杯网球拿铁',
        audioScript: '傍晚四点四十抵达莲山湖二层观景台，此时夕阳斜照湖面与球场，是全天最佳拍摄光线。',
        photo: '/images/hero.jpg',
      },
      {
        time: '18:30',
        spot: '文峰河畔烟火夜市',
        stay: '建议 2.0h',
        tip: '吃油焖小龙虾、现烤牛肉串，凭票根领冰镇米茶',
        audioScript: '晚上六点半逛文峰河畔夜市，68家摊位明码标价，推荐先领票根消费券再享小龙虾与米茶。',
        photo: '/images/night_market.jpg',
      },
    ],
  },
  {
    id: 'weekend',
    label: '周末 2天1晚（最受欢迎）',
    durationTag: '打球 + 4A景区 + 温泉 + 夜市',
    desc: '兼顾红土/硬地畅打、4A生态峡谷吸氧、温泉解乏与夜市美食，90%省内球友周末首选节奏。',
    stops: [
      {
        time: 'Day1 上午',
        spot: '国际网球中心 / 训练基地畅打',
        stay: '建议 2.5h',
        tip: '体验标准硬地或红土场，完赛激活79家联盟电子票根',
        audioScript: '第一天上午精力充沛，推荐预约国际网球中心或训练基地红土场挥拍两小时，完赛即可获得电子票根85折权益。',
        photo: '/images/tournament_1.jpg',
      },
      {
        time: 'Day1 下午',
        spot: '绿林山美人谷 + 三阳稻田咖啡',
        stay: '建议 3.5h',
        tip: '乘文旅专线A直达吸氧徒步，傍晚顺路喝稻田咖啡',
        audioScript: '午饭品尝桥米公馆后乘文旅专线直达绿林山美人谷，负氧离子高达3200+，赛后轻徒步极舒缓。',
        photo: '/images/scenic.jpg',
      },
      {
        time: 'Day1 晚间',
        spot: '天沐温泉康养 + 文峰夜市',
        stay: '建议 3.0h',
        tip: '凭票根立减¥60泡天然偏硅酸温泉，消除运动乳酸',
        audioScript: '夜晚到天沐温泉泡40余个园林矿物质汤池，彻底缓解打球后的腿部酸痛，次日满血复活。',
        photo: '/images/hotspring.jpg',
      },
      {
        time: 'Day2 上午',
        spot: '惠亭湖绿道骑行 / 钟祥明显陵',
        stay: '建议 2.5h',
        tip: '本地轻骑行或顺路延伸游世界遗产明显陵轻松返程',
        audioScript: '第二天上午可沿惠亭湖绿道骑行吸氧，或驱车1小时顺路打卡世界文化遗产钟祥明显陵后返程。',
        photo: '/images/night_market.jpg',
      },
    ],
  },
  {
    id: 'deep',
    label: '深度 4天3晚（旅居康养）',
    durationTag: '挥拍 + 乡村 + 康复 + 全域延伸',
    desc: '适合俱乐部团游、外省参赛家庭与旅居度假球友，深度玩透京山乡村非遗与荆门/湖北名胜。',
    stops: [
      {
        time: 'Day1-2',
        spot: '红土特训 + 绿林山 + 温泉康复',
        stay: '2天深度',
        tip: '每天打球2-3h + 下午景区/温泉 + 卫健运动理疗',
        audioScript: '前两天主打以球会友与深度康养，上午训练基地打球，下午绿林山与温泉理疗交替放松。',
        photo: '/images/hotspring.jpg',
      },
      {
        time: 'Day3',
        spot: '孙桥桥米原乡 + 太子山玻璃栈道',
        stay: '建议 5.0h',
        tip: '体验非遗碾米手作、漫步松林树屋咖啡与玻璃桥',
        audioScript: '第三天走进孙桥镇非遗桥米原乡与太子山国家森林公园，感受京山农耕文化与森林秘境。',
        photo: '/images/scenic.jpg',
      },
      {
        time: 'Day4',
        spot: '钟祥明显陵 / 襄阳盛世唐城延伸',
        stay: '全天延伸',
        tip: '持证旅行社专车衔接，满载桥米好物舒心返程',
        audioScript: '第四天可无缝衔接明显陵、襄阳唐城或武当山，一次挥拍之旅尽览大美荆楚风华。',
        photo: '/images/night_market.jpg',
      },
    ],
  },
]

export const TENNIS_BUS_LINES: TennisBusLine[] = [
  {
    id: 'bus-a',
    code: '专线 A',
    name: '生态山水网旅专线（球场 → 惠亭湖 → 绿林山）',
    frequency: '每 60 分钟一班',
    serviceHours: '08:30 – 17:30',
    fare: '凭打球票根免费（原价¥15）',
    stops: ['京山国际网球中心', '文峰公园球场', '惠亭湖绿道口', '三阳田园村', '绿林山美人谷南门'],
    startAddress: '温泉街道网球大道1号国际网球中心东门公交站',
    lng: 113.1195,
    lat: 31.0218,
    highlight: '大巴下层配专属球包行李舱，直达景区检票口免找车位',
  },
  {
    id: 'bus-b',
    code: '专线 B',
    name: '高铁温泉康养专线（高铁站 → 训练基地 → 温泉 → 空山洞）',
    frequency: '每 30 分钟一班',
    serviceHours: '08:00 – 20:00',
    fare: '凭参赛/订场票根免费（原价¥5）',
    stops: ['高铁京山南站', '国际网球中心', '网球训练基地/省网校', '天沐温泉度假区', '空山洞景区'],
    startAddress: '京山南站出站口网球文旅专属候车区',
    lng: 113.1245,
    lat: 31.0242,
    highlight: '无缝衔接武汉/襄阳方向高铁到达时刻，全程空调直达',
  },
  {
    id: 'bus-c',
    code: '专线 C',
    name: '夜经济循环接驳线（中心球场 ⇄ 文峰夜市 ⇄ 商圈）',
    frequency: '每 20 分钟一班',
    serviceHours: '18:00 – 23:00',
    fare: '全员公益免费乘坐',
    stops: ['国际网球中心', '网球不夜城市集', '文峰公园夜场', '文峰河畔夜市', '中百广场/国际影城'],
    startAddress: '温泉街道网球大道1号北广场夜班乘车点',
    lng: 113.1135,
    lat: 31.0172,
    highlight: '夜场打完球不用开车，放心吃烧烤喝精酿安全回酒店',
  },
]

export const OUTDOOR_TRAILS: OutdoorTrail[] = [
  {
    id: 'trail-huiting',
    mode: '骑行路线',
    name: '惠亭湖环湖生态绿道骑行线',
    distanceKm: '14.5 km',
    duration: '建议 1.5 小时',
    difficulty: '★ 轻松平缓（全柏油绿道）',
    oxygen: '负氧离子 3,200/cm³',
    elevation: '累计爬升 65m',
    photo: '/images/hero.jpg',
    startPoint: '惠亭湖湿地公园东门驿站（可租公路/山地车）',
    address: '湖北省荆门市京山市温泉街道惠亭湖环湖绿道东起点',
    lng: 113.0912,
    lat: 31.0456,
    supplyStations: '沿途设 3 处骑行补给驿站（免费打气/饮水/冰毛巾）',
    desc: '一线湖景与水杉林荫交织，全程无机动车干扰，支持驿站扫码租车与异地还车，特别适合赛后有氧恢复骑行。',
    audioScript: '欢迎开启14.5公里惠亭湖环湖生态骑行！前方3公里处为水杉鹭鸟观景平台，沿途共有三座补给驿站提供免费饮水与打气服务，祝您骑行愉快。',
  },
  {
    id: 'trail-wenfeng',
    mode: '生态徒步',
    name: '文峰山轻徒步观景环线（俯瞰网红球场）',
    distanceKm: '5.2 km',
    duration: '建议 1.2 小时',
    difficulty: '★★ 休闲轻徒步（石阶+林道）',
    oxygen: '负氧离子 2,900/cm³',
    elevation: '累计爬升 180m',
    photo: '/images/scenic.jpg',
    startPoint: '文峰公园北侧登山步道口',
    address: '湖北省荆门市京山市新市街道文峰山森林步道入口',
    lng: 113.1142,
    lat: 31.0168,
    supplyStations: '半山观景亭设直饮水点与休憩长椅',
    desc: '就在城区文峰公园网球场旁，步行即可上山！登顶文峰塔观景台可360°俯瞰京山城区与网球公园全景。',
    audioScript: '您正沿着文峰山森林步道攀登，全程5.2公里约需1小时10分钟。登顶观景台后向北远眺，整片文峰公园网球场与京山河风光尽收眼底。',
  },
  {
    id: 'trail-lulin',
    mode: '生态徒步',
    name: '绿林山美人谷溪谷吸氧徒步线',
    distanceKm: '6.8 km',
    duration: '建议 2.2 小时',
    difficulty: '★★ 亲水负氧离子徒步',
    oxygen: '负氧离子 3,500+/cm³',
    elevation: '累计爬升 140m',
    photo: '/images/hotspring.jpg',
    startPoint: '绿林山美人谷景区南门栈道',
    address: '湖北省荆门市京山市绿林镇美人谷游客中心',
    lng: 112.9762,
    lat: 31.3418,
    supplyStations: '沿溪设 2 处山泉茶歇驿站与急救点',
    desc: '全程紧贴翡翠溪流与瀑布叠水，森林遮阴率超90%，空气清冽甘甜，是球友团建徒步与夏季避暑的金牌线路。',
    audioScript: '欢迎步入绿林山美人谷溪谷徒步线，全程6.8公里沿翡翠溪水穿行，负氧离子浓度全城最高，非常适合比赛间隙深度放松心肺。',
  },
]
