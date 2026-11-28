export type TournamentStatus = '进行中' | '报名中' | '未开始' | '已结束'

export interface TournamentDivision {
  id: string
  name: string
  fee: number
  limitText: string
  enrolled: number
  maxPlayers?: number
  status: '报名中' | '已报满' | '报名已结束'
  enrolledSample: { name: string; unit: string; level: string }[]
}

export interface TournamentHistoryRecord {
  year: string
  edition: string
  participants: string
  champion: string
  runnerUp: string
  highlight: string
}

export interface DrawCellResult {
  score: string
  win: boolean
  subScores?: string[]
}

export interface DrawTeamRow {
  code: string
  name: string
  seed?: number
  region: string
  wins: number
  rank: number
  results: Record<string, DrawCellResult>
}

export interface DrawGroup {
  groupName: string
  teams: DrawTeamRow[]
}

export interface StandingRow {
  rank: number
  name: string
  unit: string
  points?: string
}

export interface MatchStatDetail {
  label: string
  valA: number
  valB: number
  unit?: string
}

export interface TechMatchRecord {
  id: string
  division: string
  date: string
  stage: string
  round: string
  courtLabel: string
  playerA: string
  playerB: string
  scoreA: string
  scoreB: string
  duration: string
  status: '激战中' | '已完赛'
  stats: MatchStatDetail[]
}

export interface OrderOfPlaySlot {
  matchOrder: string
  timeText: string
  division: string
  stageRound: string
  teamA: string
  teamB: string
  scoreA: string
  scoreB: string
  winner?: 'A' | 'B'
  live?: boolean
}

export interface OrderOfPlayCourtCol {
  courtName: string
  matches: OrderOfPlaySlot[]
}

export interface PortalTournament {
  id: string
  name: string
  shortName: string
  typeBadge: string
  featured: boolean
  status: TournamentStatus
  dateText: string
  dateRange: string
  venue: string
  photo: string
  summary: string
  guideUnit: string
  organizerUnit: string
  coOrganizerUnit: string
  contact: string
  regStart: string
  regEnd: string
  noticeList: string[]
  latestNotice: string
  tags: string[]
  extraTagsCount?: number
  divisions: TournamentDivision[]
  historySummary: string
  historyRecords: TournamentHistoryRecord[]
  drawTabs: string[]
  drawStages: string[]
  drawGroupsByTab: Record<string, DrawGroup[]>
  standingsByTab: Record<string, StandingRow[]>
  techMatches: TechMatchRecord[]
  scheduleDates: string[]
  orderOfPlayByDate: Record<string, OrderOfPlayCourtCol[]>
}

export const PORTAL_TOURNAMENTS: PortalTournament[] = [
  {
    id: 'tourney-youth-2026',
    name: '2026中国青少年网球巡回赛总决赛（京山站）',
    shortName: '2026中青赛总决赛',
    typeBadge: '国家级标准赛',
    featured: true,
    status: '进行中',
    dateText: '11.24 – 12.03',
    dateRange: '2026-11-24 08:30:00 至 2026-12-03 18:00:00',
    venue: '京山国际网球中心、京山网球训练基地',
    photo: '/images/tournament_2.jpg',
    summary: '中国青少年四大满贯级赛事之一，覆盖全国28个省市自治区768名青少年精英球员，实时同步网球记比分与技术统计。',
    guideUnit: '国家体育总局网球运动管理中心、中国网球协会',
    organizerUnit: '湖北省体育局网球运动管理中心、荆门市人民政府、京山市人民政府',
    coOrganizerUnit: '京山市文化和旅游局（体育局）、京山网球产业发展有限公司',
    contact: '赛事组委会 0724-7228801',
    regStart: '2026-10-15 09:00:00',
    regEnd: '2026-11-28 20:00:00',
    noticeList: [
      '参赛选手须持有效身份证件及CTJ青少年注册编码提前30分钟检录。',
      '赛事期间凭报名成功电子票根享全市79家联盟酒店、餐饮、天沐温泉85折礼遇。',
      '温泉大道赛场段 07:30–19:00 实施交通管控，请自驾家长停靠P1/P2或乘坐高铁免费摆渡车。',
      '采用三盘两胜制（决胜盘抢十），全程由国家级裁判执裁并接入实时鹰眼与技术统计。',
    ],
    latestNotice: '【11/27 15:30 最新通知】男子U16半决赛正在中心球场激战中；受午后微风影响，室外5-8号场次顺延15分钟开球，请各位选手及时关注战表。',
    tags: ['U16男单', 'U16女单', 'U14男单', 'U14女单'],
    extraTagsCount: 4,
    divisions: [
      {
        id: 'div-u14-bs',
        name: 'U14 青少年男子单打',
        fee: 120,
        limitText: '64签 · 仅余12席',
        enrolled: 52,
        maxPlayers: 64,
        status: '报名中',
        enrolledSample: [
          { name: '张小宇', unit: '湖北省武汉市', level: 'CUTR 3.8' },
          { name: '李子涵', unit: '湖北省武汉市', level: 'CUTR 4.1' },
          { name: '王浩然', unit: '北京市海淀区', level: 'CUTR 4.0' },
        ],
      },
      {
        id: 'div-u16-bs',
        name: 'U16 青少年男子单打',
        fee: 120,
        limitText: '64签 · 仅余8席',
        enrolled: 56,
        maxPlayers: 64,
        status: '报名中',
        enrolledSample: [
          { name: '张明轩', unit: '北京市朝阳区', level: 'CUTR 4.8' },
          { name: '周昊天', unit: '广东省深圳市', level: 'CUTR 4.9' },
          { name: '刘一鸣', unit: '陕西省西安市', level: 'CUTR 4.5' },
        ],
      },
      {
        id: 'div-u14-gs',
        name: 'U14 青少年女子单打',
        fee: 120,
        limitText: '48签 · 余9席',
        enrolled: 39,
        maxPlayers: 48,
        status: '报名中',
        enrolledSample: [
          { name: '陈思琪', unit: '上海市徐汇区', level: 'CUTR 4.3' },
          { name: '王语桐', unit: '湖南省长沙市', level: 'CUTR 4.2' },
        ],
      },
      {
        id: 'div-u14-bd',
        name: 'U14 青少年双打组合',
        fee: 160,
        limitText: '32对 · 余6对',
        enrolled: 26,
        maxPlayers: 32,
        status: '报名中',
        enrolledSample: [
          { name: '陈宇/赵天泽', unit: '湖北省京山市', level: 'CUTR 3.9' },
        ],
      },
    ],
    historySummary: '京山已连续4年承办中国青少年网球巡回赛高级别赛事，累计吸引全国超3,200名青少年选手与家庭来京山“带着球拍游京山”，赛事复购率达42.6%。',
    historyRecords: [
      { year: '2025年', edition: '2025中青赛总决赛（京山站）', participants: '712人 / 26省市', champion: '林泽宇（北京）/ 许嘉怡（上海）', runnerUp: '陈浩然（武汉）/ 宋婉清（杭州）', highlight: '全网直播观看98.6万人次，带动住宿餐饮消费1,860万元' },
      { year: '2024年', edition: '2024中青赛CTJ-A2000京山站', participants: '648人 / 24省市', champion: '赵一帆（深圳）/ 吴桐（南京）', runnerUp: '孙铭阳（京山）/ 郑语涵（成都）', highlight: '首次启用训练基地红土场分赛区，获评年度最佳赛区' },
      { year: '2023年', edition: '2023全国青少年网球积分总决赛', participants: '530人 / 21省市', champion: '高致远（广州）/ 刘若曦（武汉）', runnerUp: '郭天宇（西安）/ 何思语（长沙）', highlight: '开创“网球票根+温泉景区联游”办赛新模式' },
    ],
    drawTabs: ['U16男单', 'U14女单'],
    drawStages: ['第一阶段小组循环', '第二阶段淘汰赛'],
    drawGroupsByTab: {
      'U16男单': [
        {
          groupName: 'A组',
          teams: [
            {
              code: 'A1',
              name: '张明轩',
              seed: 1,
              region: '北京市',
              wins: 3,
              rank: 1,
              results: {
                A2: { score: '2:0', win: true, subScores: ['6:4', '6:3'] },
                A3: { score: '2:0', win: true, subScores: ['6:2', '6:1'] },
                A4: { score: '2:0', win: true, subScores: ['6:0', '6:2'] },
              },
            },
            {
              code: 'A2',
              name: '李子涵',
              region: '湖北省武汉市',
              wins: 2,
              rank: 2,
              results: {
                A1: { score: '0:2', win: false, subScores: ['4:6', '3:6'] },
                A3: { score: '2:1', win: true, subScores: ['6:3', '4:6', '10:7'] },
                A4: { score: '2:0', win: true, subScores: ['6:1', '6:3'] },
              },
            },
            {
              code: 'A3',
              name: '陈宇轩',
              region: '湖北省京山市',
              wins: 1,
              rank: 3,
              results: {
                A1: { score: '0:2', win: false, subScores: ['2:6', '1:6'] },
                A2: { score: '1:2', win: false, subScores: ['3:6', '6:4', '7:10'] },
                A4: { score: '2:0', win: true, subScores: ['6:4', '6:2'] },
              },
            },
            {
              code: 'A4',
              name: '赵子墨',
              region: '湖南省长沙市',
              wins: 0,
              rank: 4,
              results: {
                A1: { score: '0:2', win: false, subScores: ['0:6', '2:6'] },
                A2: { score: '0:2', win: false, subScores: ['1:6', '3:6'] },
                A3: { score: '0:2', win: false, subScores: ['4:6', '2:6'] },
              },
            },
          ],
        },
        {
          groupName: 'B组',
          teams: [
            {
              code: 'B1',
              name: '周昊天',
              seed: 2,
              region: '广东省深圳市',
              wins: 3,
              rank: 1,
              results: {
                B2: { score: '2:0', win: true, subScores: ['6:3', '6:2'] },
                B3: { score: '2:0', win: true, subScores: ['6:1', '6:2'] },
                B4: { score: '2:0', win: true, subScores: ['6:2', '6:0'] },
              },
            },
            {
              code: 'B2',
              name: '刘一鸣',
              region: '陕西省西安市',
              wins: 2,
              rank: 2,
              results: {
                B1: { score: '0:2', win: false, subScores: ['3:6', '2:6'] },
                B3: { score: '2:0', win: true, subScores: ['6:4', '7:5'] },
                B4: { score: '2:1', win: true, subScores: ['6:3', '5:7', '10:6'] },
              },
            },
            {
              code: 'B3',
              name: '孙浩博',
              region: '浙江省杭州市',
              wins: 1,
              rank: 3,
              results: {
                B1: { score: '0:2', win: false, subScores: ['1:6', '2:6'] },
                B2: { score: '0:2', win: false, subScores: ['4:6', '5:7'] },
                B4: { score: '2:0', win: true, subScores: ['6:3', '6:4'] },
              },
            },
            {
              code: 'B4',
              name: '王星辰',
              region: '四川省成都市',
              wins: 0,
              rank: 4,
              results: {
                B1: { score: '0:2', win: false, subScores: ['2:6', '0:6'] },
                B2: { score: '1:2', win: false, subScores: ['3:6', '7:5', '6:10'] },
                B3: { score: '0:2', win: false, subScores: ['3:6', '4:6'] },
              },
            },
          ],
        },
      ],
      'U14女单': [
        {
          groupName: 'A组',
          teams: [
            {
              code: 'A1',
              name: '陈思琪',
              seed: 1,
              region: '上海市',
              wins: 3,
              rank: 1,
              results: {
                A2: { score: '2:0', win: true, subScores: ['7:5', '6:4'] },
                A3: { score: '2:0', win: true, subScores: ['6:2', '6:1'] },
                A4: { score: '2:0', win: true, subScores: ['6:0', '6:1'] },
              },
            },
            {
              code: 'A2',
              name: '王语桐',
              region: '湖南省长沙市',
              wins: 2,
              rank: 2,
              results: {
                A1: { score: '0:2', win: false, subScores: ['5:7', '4:6'] },
                A3: { score: '2:0', win: true, subScores: ['6:3', '6:4'] },
                A4: { score: '2:0', win: true, subScores: ['6:2', '6:1'] },
              },
            },
            {
              code: 'A3',
              name: '周欣然',
              region: '湖北省京山市',
              wins: 1,
              rank: 3,
              results: {
                A1: { score: '0:2', win: false, subScores: ['2:6', '1:6'] },
                A2: { score: '0:2', win: false, subScores: ['3:6', '4:6'] },
                A4: { score: '2:1', win: true, subScores: ['6:4', '4:6', '10:8'] },
              },
            },
            {
              code: 'A4',
              name: '林沐晴',
              region: '湖北省武汉市',
              wins: 0,
              rank: 4,
              results: {
                A1: { score: '0:2', win: false, subScores: ['0:6', '1:6'] },
                A2: { score: '0:2', win: false, subScores: ['2:6', '1:6'] },
                A3: { score: '1:2', win: false, subScores: ['4:6', '6:4', '8:10'] },
              },
            },
          ],
        },
      ],
    },
    standingsByTab: {
      'U16男单': [
        { rank: 1, name: '周昊天（红土组冠军）', unit: '广东省深圳市', points: '2000 CTJ积分' },
        { rank: 2, name: '张明轩（硬地组四强）', unit: '北京市朝阳区', points: '1400 CTJ积分' },
        { rank: 3, name: '刘一鸣', unit: '陕西省西安市', points: '1200 CTJ积分' },
        { rank: 4, name: '李子涵', unit: '湖北省武汉市', points: '900 CTJ积分' },
        { rank: 5, name: '陈宇轩', unit: '湖北省京山市', points: '650 CTJ积分' },
        { rank: 6, name: '孙浩博', unit: '浙江省杭州市', points: '520 CTJ积分' },
      ],
      'U14女单': [
        { rank: 1, name: '陈思琪', unit: '上海市徐汇区', points: '1800 CTJ积分' },
        { rank: 2, name: '王语桐', unit: '湖南省长沙市', points: '1300 CTJ积分' },
        { rank: 3, name: '周欣然', unit: '湖北省京山市', points: '960 CTJ积分' },
        { rank: 4, name: '林沐晴', unit: '湖北省武汉市', points: '720 CTJ积分' },
      ],
    },
    techMatches: [
      {
        id: 'tm-y1',
        division: 'U16男单',
        date: '2026-11-27',
        stage: '淘汰赛',
        round: '半决赛',
        courtLabel: 'U16男单 —— 中心球场 - 第1场',
        playerA: 'A1. 张明轩 - 北京市朝阳区',
        playerB: 'A2. 李子涵 - 湖北省武汉市',
        scoreA: '6 / 4 (30)',
        scoreB: '4 / 3 (15)',
        duration: '01:38',
        status: '激战中',
        stats: [
          { label: 'ACE 球', valA: 6, valB: 3 },
          { label: '一发成功率', valA: 68, valB: 61, unit: '%' },
          { label: '一发得分率', valA: 79, valB: 69, unit: '%' },
          { label: '制胜分 (Winners)', valA: 24, valB: 18 },
          { label: '非受迫性失误', valA: 15, valB: 21 },
          { label: '破发点兑现', valA: 3, valB: 1 },
        ],
      },
      {
        id: 'tm-y2',
        division: 'U14女单',
        date: '2026-11-27',
        stage: '淘汰赛',
        round: '1/4决赛',
        courtLabel: 'U14女单 —— 3号硬地场 - 第2场',
        playerA: 'A1. 陈思琪 - 上海市徐汇区',
        playerB: 'A2. 王语桐 - 湖南省长沙市',
        scoreA: '7 / 2 (40)',
        scoreB: '5 / 2 (30)',
        duration: '01:22',
        status: '激战中',
        stats: [
          { label: 'ACE 球', valA: 3, valB: 2 },
          { label: '一发成功率', valA: 72, valB: 66, unit: '%' },
          { label: '制胜分 (Winners)', valA: 19, valB: 21 },
          { label: '破发点兑现', valA: 4, valB: 3 },
        ],
      },
      {
        id: 'tm-y3',
        division: 'U16男单',
        date: '2026-11-27',
        stage: '淘汰赛',
        round: '红土组决赛',
        courtLabel: 'U16男单 —— 6号红土场 - 第1场',
        playerA: 'B1. 周昊天 - 广东省深圳市 🏆',
        playerB: 'B2. 刘一鸣 - 陕西省西安市',
        scoreA: '6 / 6',
        scoreB: '3 / 2',
        duration: '01:14',
        status: '已完赛',
        stats: [
          { label: 'ACE 球', valA: 8, valB: 2 },
          { label: '一发得分率', valA: 84, valB: 60, unit: '%' },
          { label: '制胜分 (Winners)', valA: 29, valB: 14 },
          { label: '非受迫性失误', valA: 11, valB: 23 },
        ],
      },
    ],
    scheduleDates: ['2026-11-27', '2026-11-28'],
    orderOfPlayByDate: {
      '2026-11-27': [
        {
          courtName: '中心球场',
          matches: [
            { matchOrder: '第1场', timeText: '14:00 激战中', division: 'U16男单', stageRound: '半决赛', teamA: 'A1. 张明轩（北京）', teamB: 'A2. 李子涵（武汉）', scoreA: '6-4 / 4-3', scoreB: '30-15', live: true },
            { matchOrder: '第2场', timeText: '紧跟前场', division: 'U14男单', stageRound: '1/4决赛', teamA: 'A1. 张小宇（武汉）', teamB: 'B2. 王浩然（北京）', scoreA: '待开赛', scoreB: '-' },
          ],
        },
        {
          courtName: '3号硬地场',
          matches: [
            { matchOrder: '第1场', timeText: '13:30 激战中', division: 'U14女单', stageRound: '1/4决赛', teamA: 'A1. 陈思琪（上海）', teamB: 'A2. 王语桐（长沙）', scoreA: '7-5 / 2-2', scoreB: '40-30', live: true },
            { matchOrder: '第2场', timeText: '紧跟前场', division: 'U14双打', stageRound: '第一阶段第3轮', teamA: '陈宇/赵天泽（京山）', teamB: '孙铭/高远（武汉）', scoreA: '待开赛', scoreB: '-' },
          ],
        },
        {
          courtName: '6号红土场',
          matches: [
            { matchOrder: '第1场', timeText: '13:00 已完赛', division: 'U16男单', stageRound: '红土组决赛', teamA: 'B1. 周昊天（深圳）', teamB: 'B2. 刘一鸣（西安）', scoreA: '6 / 6', scoreB: '3 / 2', winner: 'A' },
            { matchOrder: '第2场', timeText: '16:00 开始', division: 'U12红土组', stageRound: '小组第2轮', teamA: '周欣然（京山）', teamB: '林沐晴（武汉）', scoreA: '待开赛', scoreB: '-' },
          ],
        },
      ],
      '2026-11-28': [
        {
          courtName: '中心球场',
          matches: [
            { matchOrder: '第1场', timeText: '09:30 开始', division: 'U16男单', stageRound: '总决赛', teamA: '张明轩/李子涵胜者', teamB: '周昊天（深圳）', scoreA: '待开赛', scoreB: '-' },
          ],
        },
        {
          courtName: '3号硬地场',
          matches: [
            { matchOrder: '第1场', timeText: '10:00 开始', division: 'U14女单', stageRound: '半决赛', teamA: '陈思琪/王语桐胜者', teamB: 'B组第1名', scoreA: '待开赛', scoreB: '-' },
          ],
        },
        {
          courtName: '6号红土场',
          matches: [
            { matchOrder: '第1场', timeText: '10:30 开始', division: 'U14男单', stageRound: '半决赛', teamA: '上半区晋级选手', teamB: '下半区晋级选手', scoreA: '待开赛', scoreB: '-' },
          ],
        },
      ],
    },
  },
  {
    id: 'tourney-lvlin-2026',
    name: '2026农商银行中国（京山）绿林网球·英雄会',
    shortName: '2026绿林网球·英雄会',
    typeBadge: '标准赛',
    featured: true,
    status: '已结束',
    dateText: '11.06',
    dateRange: '2026-11-06 09:00:00 至 2026-11-08 18:00:00',
    venue: '湖北省京山市网球训练基地',
    photo: '/images/indoor_court.jpg',
    summary: '中国极具影响力的业余网球团体品牌盛会，公开报名、多组别混合团体赛制，汇聚全国32支精英网球俱乐部齐聚京山挥拍论剑。',
    guideUnit: '中国网球协会、湖北省体育局',
    organizerUnit: '湖北省体育局网球运动管理中心、京山市人民政府',
    coOrganizerUnit: '京山市文化和旅游局（体育局）、京山市网球协会、湖北农商银行',
    contact: '绿林英雄会赛事办 0724-7228816',
    regStart: '2026-09-20 09:00:00',
    regEnd: '2026-10-25 18:00:00',
    noticeList: [
      '混合团体赛采用五场制（男单、女单、男双、女双、混双），小组循环先胜三场或打满五场。',
      '第一阶段分8个小组进行单循环，各组前两名晋级16强淘汰赛，后两名进入17–32名附加赛。',
      '所有对阵签表、技术统计与最终成绩均永久留档于京山网球数字档案库。',
    ],
    latestNotice: '【赛事已圆满落幕】恭喜京山市代表队夺得2026绿林网球·英雄会混团冠军，湖北泰力思网球获亚军，京山市网球协会获季军！完整签表、成绩汇总与技术统计已归档可查。',
    tags: ['省外混团', '省内混团', '混团'],
    extraTagsCount: 1,
    divisions: [
      {
        id: 'div-lv-mix',
        name: '混团（32支代表队）',
        fee: 800,
        limitText: '限32队 · 已完赛',
        enrolled: 32,
        maxPlayers: 32,
        status: '报名已结束',
        enrolledSample: [
          { name: '京山市代表队', unit: '湖北省京山市', level: '团体1号' },
          { name: '湖北泰力思网球', unit: '湖北省武汉市', level: '团体2号' },
          { name: '长沙一拍即合', unit: '湖南省长沙市', level: '团体8号' },
        ],
      },
      {
        id: 'div-lv-out',
        name: '省外混团组',
        fee: 800,
        limitText: '限16队 · 已完赛',
        enrolled: 16,
        maxPlayers: 16,
        status: '报名已结束',
        enrolledSample: [
          { name: '德宏目瑙网球队', unit: '云南省德宏州', level: '省外劲旅' },
          { name: '广东欧亚灯饰队', unit: '广东省湛江市', level: '省外劲旅' },
        ],
      },
    ],
    historySummary: '“绿林网球·英雄会”创办于2012年，是京山最具标志性的全国群众性品牌网球IP，连续举办十余届，被球友誉为“业余网球界的戴维斯杯”。',
    historyRecords: [
      { year: '2026年', edition: '第十四届绿林网球·英雄会', participants: '32支队伍 / 384人', champion: '京山市代表队', runnerUp: '湖北泰力思网球', highlight: '省外参赛队伍占比突破45%，云南德宏、广东湛江等跨省强队云集' },
      { year: '2025年', edition: '第十三届绿林网球·英雄会', participants: '32支队伍 / 360人', champion: '湖北泰力思网球', runnerUp: '京山市网球协会', highlight: '首次接入全程实时战表与逐场技术统计系统' },
      { year: '2024年', edition: '第十二届绿林网球·英雄会', participants: '28支队伍 / 320人', champion: '武汉崇仁网球', runnerUp: '长沙市大小刘队', highlight: '同期举办网球文创夜市与桥米美食节，客流破5万人次' },
    ],
    drawTabs: ['混团', '17-32附加赛混团'],
    drawStages: ['第一阶段', '第二阶段淘汰赛'],
    drawGroupsByTab: {
      '混团': [
        {
          groupName: 'A组',
          teams: [
            {
              code: 'A1',
              name: '湖北泰力思网球',
              seed: 1,
              region: '湖北省',
              wins: 3,
              rank: 1,
              results: {
                A2: { score: '5:0', win: true, subScores: ['6:0', '6:1', '6:0', '6:0', '6:0'] },
                A3: { score: '5:0', win: true, subScores: ['6:1', '6:0', '6:0', '6:1', '6:0'] },
                A4: { score: '5:0', win: true, subScores: ['6:0', '6:0', '6:0', '6:1', '6:0'] },
              },
            },
            {
              code: 'A2',
              name: '孝感ACE网球',
              region: '湖北省',
              wins: 0,
              rank: 4,
              results: {
                A1: { score: '0:5', win: false, subScores: ['0:6', '1:6', '0:6', '0:6', '0:6'] },
                A3: { score: '1:4', win: false, subScores: ['1:6', '0:6', '1:6', '2:6', '6:3'] },
                A4: { score: '2:3', win: false, subScores: ['5:7', '6:1', '1:6', '2:6', '6:2'] },
              },
            },
            {
              code: 'A3',
              name: '长沙一拍即合',
              region: '湖南省',
              wins: 2,
              rank: 2,
              results: {
                A1: { score: '0:5', win: false, subScores: ['1:6', '0:6', '0:6', '1:6', '0:6'] },
                A2: { score: '4:1', win: true, subScores: ['6:1', '6:0', '6:1', '6:2', '3:6'] },
                A4: { score: '4:1', win: true, subScores: ['6:0', '6:0', '6:1', '6:0', '4:6'] },
              },
            },
            {
              code: 'A4',
              name: '北京智业联合公司',
              region: '湖北省',
              wins: 1,
              rank: 3,
              results: {
                A1: { score: '0:5', win: false, subScores: ['0:6', '0:6', '0:6', '1:6', '0:6'] },
                A2: { score: '3:2', win: true, subScores: ['7:5', '1:6', '6:1', '6:2', '2:6'] },
                A3: { score: '1:4', win: false, subScores: ['0:6', '0:6', '1:6', '0:6', '6:4'] },
              },
            },
          ],
        },
        {
          groupName: 'B组',
          teams: [
            {
              code: 'B1',
              name: '江汉油田网球协会',
              region: '湖北省',
              wins: 2,
              rank: 2,
              results: {
                B2: { score: '3:2', win: true, subScores: ['0:6', '6:3', '6:2', '6:2', '3:6'] },
                B3: { score: '2:3', win: false, subScores: ['4:6', '1:6', '1:6', '6:2', '6:0'] },
                B4: { score: '4:1', win: true, subScores: ['7:6(3)', '6:2', '6:0', '3:6', '6:1'] },
              },
            },
            {
              code: 'B2',
              name: '荆州长兴网球',
              region: '湖北省',
              wins: 1,
              rank: 3,
              results: {
                B1: { score: '2:3', win: false, subScores: ['6:0', '3:6', '2:6', '2:6', '6:3'] },
                B3: { score: '1:4', win: false, subScores: ['0:6', '0:6', '1:6', '0:6', '6:4'] },
                B4: { score: '3:2', win: true, subScores: ['6:1', '6:2', '4:6', '6:3', '3:6'] },
              },
            },
            {
              code: 'B3',
              name: '湖北三人行网球',
              seed: 2,
              region: '湖北省',
              wins: 3,
              rank: 1,
              results: {
                B1: { score: '3:2', win: true, subScores: ['6:4', '6:1', '6:1', '2:6', '0:6'] },
                B2: { score: '4:1', win: true, subScores: ['6:0', '6:0', '6:1', '6:0', '4:6'] },
                B4: { score: '5:0', win: true, subScores: ['6:1', '6:2', '6:0', '6:1', '6:2'] },
              },
            },
            {
              code: 'B4',
              name: '岳阳市网球协会',
              region: '湖南省',
              wins: 0,
              rank: 4,
              results: {
                B1: { score: '1:4', win: false, subScores: ['6:7(3)', '2:6', '0:6', '6:3', '1:6'] },
                B2: { score: '2:3', win: false, subScores: ['1:6', '2:6', '6:4', '3:6', '6:3'] },
                B3: { score: '0:5', win: false, subScores: ['1:6', '2:6', '0:6', '1:6', '2:6'] },
              },
            },
          ],
        },
      ],
      '17-32附加赛混团': [
        {
          groupName: '附加赛A组',
          teams: [
            {
              code: 'C1',
              name: '十堰市网协',
              region: '湖北省',
              wins: 2,
              rank: 1,
              results: {
                C2: { score: '4:1', win: true, subScores: ['6:2', '6:3', '6:1', '4:6', '6:2'] },
                C3: { score: '3:2', win: true, subScores: ['6:4', '3:6', '6:2', '6:3', '2:6'] },
              },
            },
            {
              code: 'C2',
              name: '益阳领格网球',
              region: '湖南省',
              wins: 1,
              rank: 2,
              results: {
                C1: { score: '1:4', win: false, subScores: ['2:6', '3:6', '1:6', '6:4', '2:6'] },
                C3: { score: '3:2', win: true, subScores: ['6:3', '6:4', '2:6', '6:1', '4:6'] },
              },
            },
            {
              code: 'C3',
              name: '武汉旷世网球',
              region: '湖北省',
              wins: 0,
              rank: 3,
              results: {
                C1: { score: '2:3', win: false, subScores: ['4:6', '6:3', '2:6', '3:6', '6:2'] },
                C2: { score: '2:3', win: false, subScores: ['3:6', '4:6', '6:2', '1:6', '6:4'] },
              },
            },
          ],
        },
      ],
    },
    standingsByTab: {
      '混团': [
        { rank: 1, name: '京山市代表队', unit: '湖北省京山市' },
        { rank: 2, name: '湖北泰力思网球', unit: '湖北省武汉市' },
        { rank: 3, name: '京山市网球协会', unit: '湖北省京山市' },
        { rank: 4, name: '长沙市大小刘队', unit: '湖南省长沙市' },
        { rank: 5, name: '武汉崇仁网球', unit: '湖北省武汉市' },
        { rank: 6, name: '德宏目瑙网球队', unit: '云南省德宏州' },
        { rank: 7, name: '广东欧亚灯饰队', unit: '广东省湛江市' },
        { rank: 8, name: '长沙一拍即合', unit: '湖南省长沙市' },
        { rank: 9, name: '湖北三人行网球', unit: '湖北省武汉市' },
        { rank: 10, name: '十堰市网协', unit: '湖北省十堰市' },
        { rank: 11, name: '益阳领格网球', unit: '湖南省益阳市' },
        { rank: 12, name: '武汉旷世网球', unit: '湖北省武汉市' },
        { rank: 13, name: '江汉油田网球协会', unit: '湖北省潜江市' },
        { rank: 14, name: '武汉指尖灵动电竞', unit: '湖北省武汉市' },
      ],
      '17-32附加赛混团': [
        { rank: 17, name: '荆州长兴网球', unit: '湖北省荆州市' },
        { rank: 18, name: '北京智业联合公司', unit: '北京市 / 湖北联队' },
        { rank: 19, name: '孝感ACE网球', unit: '湖北省孝感市' },
        { rank: 20, name: '岳阳市网球协会', unit: '湖南省岳阳市' },
      ],
    },
    techMatches: [
      {
        id: 'tm-l1',
        division: '混团',
        date: '2026-11-07',
        stage: '第一阶段',
        round: '第1轮',
        courtLabel: '混团 —— 室内2号 - 第1场',
        playerA: 'A1. 余岚/黄海 - 湖北泰力思网球',
        playerB: 'A4. 王青华/陈勇勇 - 北京智业联合公司',
        scoreA: '6',
        scoreB: '0',
        duration: '00:24',
        status: '已完赛',
        stats: [
          { label: 'ACE 球', valA: 3, valB: 0 },
          { label: '一发成功率', valA: 78, valB: 54, unit: '%' },
          { label: '网前得分率', valA: 82, valB: 45, unit: '%' },
          { label: '破发局数', valA: 3, valB: 0 },
        ],
      },
      {
        id: 'tm-l2',
        division: '混团',
        date: '2026-11-07',
        stage: '第一阶段',
        round: '第1轮',
        courtLabel: '混团 —— 室内2号 - 第2场',
        playerA: 'A1. 赵炜淋/陈俊 - 湖北泰力思网球',
        playerB: 'A4. 李慧慧/廖晶晶 - 北京智业联合公司',
        scoreA: '6',
        scoreB: '0',
        duration: '00:21',
        status: '已完赛',
        stats: [
          { label: 'ACE 球', valA: 2, valB: 0 },
          { label: '一发成功率', valA: 74, valB: 58, unit: '%' },
          { label: '制胜分', valA: 14, valB: 4 },
        ],
      },
      {
        id: 'tm-l3',
        division: '混团',
        date: '2026-11-07',
        stage: '第一阶段',
        round: '第1轮',
        courtLabel: '混团 —— 室内2号 - 第3场',
        playerA: 'A1. 涂浩波/孙铭梓 - 湖北泰力思网球',
        playerB: 'A4. 张丹衡/陈伟 - 北京智业联合公司',
        scoreA: '6',
        scoreB: '0',
        duration: '00:19',
        status: '已完赛',
        stats: [
          { label: 'ACE 球', valA: 4, valB: 1 },
          { label: '一发得分率', valA: 86, valB: 48, unit: '%' },
          { label: '制胜分', valA: 16, valB: 5 },
        ],
      },
      {
        id: 'tm-l4',
        division: '混团',
        date: '2026-11-07',
        stage: '第一阶段',
        round: '第1轮',
        courtLabel: '混团 —— 室内2号 - 第4场',
        playerA: 'A1. 王云/赵星 - 湖北泰力思网球',
        playerB: 'A4. 郑军杰/杨俊 - 北京智业联合公司',
        scoreA: '6',
        scoreB: '1',
        duration: '00:26',
        status: '已完赛',
        stats: [
          { label: '一发成功率', valA: 71, valB: 62, unit: '%' },
          { label: '制胜分', valA: 15, valB: 7 },
          { label: '非受迫性失误', valA: 6, valB: 12 },
        ],
      },
    ],
    scheduleDates: ['2026-11-07'],
    orderOfPlayByDate: {
      '2026-11-07': [
        {
          courtName: '室内2号',
          matches: [
            { matchOrder: '第1场', timeText: '9:00开始比赛', division: '混团', stageRound: '第一阶段第1轮', teamA: 'A1. 湖北泰力思网球', teamB: 'A4. 北京智业联合公司', scoreA: '5', scoreB: '0', winner: 'A' },
            { matchOrder: '第2场', timeText: '紧跟前场', division: '混团', stageRound: '第一阶段第2轮', teamA: 'A1. 湖北泰力思网球', teamB: 'A3. 长沙一拍即合', scoreA: '5', scoreB: '0', winner: 'A' },
            { matchOrder: '第3场', timeText: '紧跟前场', division: '混团', stageRound: '第一阶段第3轮', teamA: 'A1. 湖北泰力思网球', teamB: 'A2. 孝感ACE网球', scoreA: '5', scoreB: '0', winner: 'A' },
          ],
        },
        {
          courtName: '室内3号',
          matches: [
            { matchOrder: '第1场', timeText: '9:00开始比赛', division: '混团', stageRound: '第一阶段第1轮', teamA: 'A2. 孝感ACE网球', teamB: 'A3. 长沙一拍即合', scoreA: '1', scoreB: '4', winner: 'B' },
            { matchOrder: '第2场', timeText: '紧跟前场', division: '混团', stageRound: '第一阶段第2轮', teamA: 'A4. 北京智业联合公司', teamB: 'A2. 孝感ACE网球', scoreA: '3', scoreB: '2', winner: 'A' },
            { matchOrder: '第3场', timeText: '紧跟前场', division: '混团', stageRound: '第一阶段第3轮', teamA: 'A3. 长沙一拍即合', teamB: 'A4. 北京智业联合公司', scoreA: '4', scoreB: '1', winner: 'A' },
          ],
        },
        {
          courtName: '室内4号',
          matches: [
            { matchOrder: '第1场', timeText: '9:00开始比赛', division: '混团', stageRound: '第一阶段第1轮', teamA: 'B1. 江汉油田网球协会', teamB: 'B4. 岳阳市网球协会', scoreA: '4', scoreB: '1', winner: 'A' },
            { matchOrder: '第2场', timeText: '紧跟前场', division: '混团', stageRound: '第一阶段第2轮', teamA: 'B1. 江汉油田网球协会', teamB: 'B3. 湖北三人行网球', scoreA: '2', scoreB: '3', winner: 'B' },
            { matchOrder: '第3场', timeText: '紧跟前场', division: '混团', stageRound: '第一阶段第3轮', teamA: 'B3. 湖北三人行网球', teamB: 'B2. 荆州长兴网球', scoreA: '4', scoreB: '1', winner: 'A' },
          ],
        },
      ],
    },
  },
  {
    id: 'tourney-cunwang-2026',
    name: '中国村网（京山）总决赛',
    shortName: '中国村网（京山）总决赛',
    typeBadge: '特色村网',
    featured: true,
    status: '报名中',
    dateText: '12.12',
    dateRange: '2026-12-12 08:30:00 至 2026-12-14 17:30:00',
    venue: '文峰公园、文峰特色网球村',
    photo: '/images/hero.jpg',
    summary: '国家体育总局群体司指导的全国“村网”旗舰总决赛，扎根文峰特色网球村，展现乡村体育振兴与全民网球烟火气。',
    guideUnit: '国家体育总局群体司',
    organizerUnit: '湖北省体育局网球运动管理中心、湖北省网球协会、京山市人民政府',
    coOrganizerUnit: '京山市文化和旅游局（体育局）、京山市网球协会、京山市温泉街道文峰村村委会',
    contact: '文峰村委会赛事联络组 0724-7223318',
    regStart: '2026-11-20 00:00:00',
    regEnd: '2026-12-08 23:59:00',
    noticeList: [
      '面向全国县域、乡镇及乡村网球爱好者开放报名，设置单打男单、单打女单两大组别。',
      '参赛优胜者除官方奖杯证书外，还将获赠国宝京山桥米礼盒、绿林花菇等乡土特色奖品。',
      '文峰特色网球村步行300米即达文峰河畔夜市，赛事期间每晚举办村网音乐嘉年华。',
    ],
    latestNotice: '【报名进行中】中国村网（京山）总决赛已吸引来自18个省份的乡村球友报名，单打男单/女单火热开放中！',
    tags: ['单打男单', '单打女单'],
    divisions: [
      {
        id: 'div-cw-ms',
        name: '单打男单',
        fee: 30,
        limitText: '人数限制：无限制',
        enrolled: 146,
        status: '报名中',
        enrolledSample: [
          { name: '王建国', unit: '京山文峰网球村', level: 'CUTR 3.8' },
          { name: '刘志强', unit: '钟祥胡集村队', level: 'CUTR 3.5' },
          { name: '张大伟', unit: '江西武宁县队', level: 'CUTR 4.0' },
        ],
      },
      {
        id: 'div-cw-ws',
        name: '单打女单',
        fee: 30,
        limitText: '人数限制：无限制',
        enrolled: 92,
        status: '报名中',
        enrolledSample: [
          { name: '李秀兰', unit: '京山孙桥镇队', level: 'CUTR 3.2' },
          { name: '陈芳', unit: '湖北天门村队', level: 'CUTR 3.6' },
        ],
      },
    ],
    historySummary: '“中国村网”发源于京山温泉街道文峰村，将农耕乡土文化与现代网球运动融合，2025年首届总决赛登上央视新闻联播，成为全国乡村体育新名片。',
    historyRecords: [
      { year: '2025年', edition: '首届中国村网（京山）总决赛', participants: '216人 / 15省乡村代表', champion: '王建国（京山文峰）/ 周敏（湖北潜江）', runnerUp: '陈军（湖南宁乡）/ 赵雪（河南信阳）', highlight: '现场发放桥米、葛粉等农特奖品300余份，带动农旅消费超680万元' },
    ],
    drawTabs: ['单打男单', '单打女单'],
    drawStages: ['第一阶段小组赛'],
    drawGroupsByTab: {
      '单打男单': [
        {
          groupName: 'A组（预排签表）',
          teams: [
            { code: 'A1', name: '王建国', seed: 1, region: '京山文峰村', wins: 0, rank: 1, results: {} },
            { code: 'A2', name: '刘志强', region: '钟祥胡集村', wins: 0, rank: 2, results: {} },
            { code: 'A3', name: '张大伟', region: '江西武宁', wins: 0, rank: 3, results: {} },
            { code: 'A4', name: '待抽签补位', region: '开放报名中', wins: 0, rank: 4, results: {} },
          ],
        },
      ],
      '单打女单': [
        {
          groupName: 'A组（预排签表）',
          teams: [
            { code: 'A1', name: '李秀兰', seed: 1, region: '京山孙桥镇', wins: 0, rank: 1, results: {} },
            { code: 'A2', name: '陈芳', region: '湖北天门', wins: 0, rank: 2, results: {} },
          ],
        },
      ],
    },
    standingsByTab: {
      '单打男单': [
        { rank: 1, name: '2025届冠军：王建国（卫冕种子）', unit: '京山市文峰网球村' },
        { rank: 2, name: '2025届亚军：陈军', unit: '湖南省宁乡市' },
      ],
      '单打女单': [
        { rank: 1, name: '2025届冠军：周敏', unit: '湖北省潜江市' },
      ],
    },
    techMatches: [],
    scheduleDates: ['2026-12-12'],
    orderOfPlayByDate: {
      '2026-12-12': [
        {
          courtName: '文峰公园1号场',
          matches: [
            { matchOrder: '第1场', timeText: '09:00 开幕战', division: '单打男单', stageRound: '小组赛第1轮', teamA: 'A1. 王建国（文峰村）', teamB: 'A2. 刘志强（钟祥）', scoreA: '待开赛', scoreB: '-' },
          ],
        },
        {
          courtName: '文峰网球村中心场',
          matches: [
            { matchOrder: '第1场', timeText: '09:30 开赛', division: '单打女单', stageRound: '小组赛第1轮', teamA: 'A1. 李秀兰（孙桥镇）', teamB: 'A2. 陈芳（天门）', scoreA: '待开赛', scoreB: '-' },
          ],
        },
      ],
    },
  },
  {
    id: 'tourney-soft-2026',
    name: '2026年第五届世界青少年软式网球锦标赛',
    shortName: '第五届世界青少年软网锦标赛',
    typeBadge: '国际标准赛',
    featured: true,
    status: '未开始',
    dateText: '12.20',
    dateRange: '2026-12-20 08:30:00 至 2026-12-26 18:00:00',
    venue: '京山网球训练基地',
    photo: '/images/tournament_1.jpg',
    summary: '国际软式网球联合会认证顶级青少年国际赛事，设U15/U18/U21男女单打、双打及团体共12个项目，多国代表队齐聚京山。',
    guideUnit: '国际软式网球联合会（ISTF）、中国网球协会',
    organizerUnit: '湖北省体育局、荆门市人民政府、京山市人民政府',
    coOrganizerUnit: '京山市文化和旅游局（体育局）、湖北省网球学校',
    contact: '国际赛组委会 0724-7228866',
    regStart: '2026-11-10 09:00:00',
    regEnd: '2026-12-10 18:00:00',
    noticeList: [
      '采用国际软式网球联合会最新竞赛规则，红土与室内风雨场同步开赛。',
      '欢迎国内青少年选手及市民免费预约观赛席位，近距离感受国际赛事氛围。',
    ],
    latestNotice: '【赛前筹备公告】来自日本、韩国、泰国、中国台北等14个国家和地区的代表队已完成入境抵京行程报备，观赛预约通道已开启。',
    tags: ['U15男单', 'U15女单', 'U15男双'],
    extraTagsCount: 9,
    divisions: [
      {
        id: 'div-soft-u15m',
        name: 'U15 男子单打（国际组）',
        fee: 0,
        limitText: '各国代表队选派 · 开放观赛',
        enrolled: 48,
        maxPlayers: 64,
        status: '报名中',
        enrolledSample: [
          { name: '中国队 U15代表', unit: '湖北省网球学校', level: '国家青训' },
        ],
      },
      {
        id: 'div-soft-u15w',
        name: 'U15 女子单打（国际组）',
        fee: 0,
        limitText: '各国代表队选派 · 开放观赛',
        enrolled: 44,
        maxPlayers: 64,
        status: '报名中',
        enrolledSample: [
          { name: '中国队 U15女单代表', unit: '湖北省网球学校', level: '国家青训' },
        ],
      },
    ],
    historySummary: '世界青少年软式网球锦标赛每四年举办一届，第五届花落“中国网球特色城市”京山，彰显京山国际化办赛场馆与综合接待实力。',
    historyRecords: [
      { year: '2022年', edition: '第四届世界青少年软网锦标赛', participants: '16个国家及地区 / 310人', champion: '韩国队 / 日本队（分项冠军）', runnerUp: '中国队斩获U15女双银牌', highlight: '首次由亚洲县域高标准训练基地承接下一届主办权' },
    ],
    drawTabs: ['U15男单', 'U15女单'],
    drawStages: ['抽签仪式前预排'],
    drawGroupsByTab: {
      'U15男单': [
        {
          groupName: 'A组（抽签待公布）',
          teams: [
            { code: 'A1', name: '中国代表队 1号', seed: 1, region: '中国', wins: 0, rank: 1, results: {} },
            { code: 'A2', name: '日本代表队 2号', region: '日本', wins: 0, rank: 2, results: {} },
          ],
        },
      ],
      'U15女单': [],
    },
    standingsByTab: {
      'U15男单': [],
      'U15女单': [],
    },
    techMatches: [],
    scheduleDates: ['2026-12-20'],
    orderOfPlayByDate: {
      '2026-12-20': [
        {
          courtName: '训练基地1号红土场',
          matches: [
            { matchOrder: '第1场', timeText: '09:00 开幕式后', division: 'U15男单', stageRound: '小组首轮', teamA: '中国代表队', teamB: '韩国代表队', scoreA: '待开赛', scoreB: '-' },
          ],
        },
      ],
    },
  },
  {
    id: 'tourney-weekend-2026',
    name: '京山“网球之城杯”周末分级积分赛',
    shortName: '京山周末分级赛',
    typeBadge: '分级赛',
    featured: false,
    status: '报名中',
    dateText: '11.29',
    dateRange: '2026-11-29 08:30:00 至 2026-11-29 18:00:00',
    venue: '京山文峰公园网球场',
    photo: '/images/scenic.jpg',
    summary: '周周有比赛、按CUTR/JS等级分组公平对抗！自动匹配您当前技术等级，完赛同步刷新五维能力档案与个人中心积分。',
    guideUnit: '京山市文化和旅游局（体育局）',
    organizerUnit: '京山市网球协会、京山网球产业发展有限公司',
    coOrganizerUnit: '市域22家认证网球俱乐部',
    contact: '分级赛裁判长 0724-7223388',
    regStart: '2026-11-20 09:00:00',
    regEnd: '2026-11-28 22:00:00',
    noticeList: [
      '按CUTR水平分级，确保每位球友至少打满3场小组循环赛。',
      '完赛获赠 +100 金网积分，前四名可直通下月城市总决赛。',
    ],
    latestNotice: '【余位紧张】11月29日（周日）CUTR 3.5组仅余12个参赛名额，欢迎来京山参赛的家长及本地球友报名切磋！',
    tags: ['CUTR 3.0单打', 'CUTR 3.5双打', '混双体验组'],
    divisions: [
      {
        id: 'div-wk-35',
        name: 'CUTR 3.5 成人单打积分组（匹配当前等级）',
        fee: 60,
        limitText: '32签 · 仅余12席',
        enrolled: 20,
        maxPlayers: 32,
        status: '报名中',
        enrolledSample: [
          { name: '球友阿泽', unit: '湖北省武汉市', level: 'CUTR 3.6' },
          { name: '京山老王', unit: '湖北省京山市', level: 'CUTR 3.7' },
        ],
      },
      {
        id: 'div-wk-d',
        name: 'CUTR 3.5 双打友谊积分组',
        fee: 80,
        limitText: '16对 · 余5对',
        enrolled: 11,
        maxPlayers: 16,
        status: '报名中',
        enrolledSample: [
          { name: '陈浩/小周', unit: '湖北省京山市', level: 'CUTR 3.8' },
        ],
      },
    ],
    historySummary: '京山周末分级赛全年举办超过40期，是外地球友“周末打球+泡温泉”打卡频次最高的全民分级赛事。',
    historyRecords: [
      { year: '2026年11月', edition: '第38期周末分级赛', participants: '86人', champion: '张明（武汉）', runnerUp: '李强（京山）', highlight: '外地球友占比62%，赛后文峰夜市核销率超80%' },
    ],
    drawTabs: ['CUTR 3.5单打'],
    drawStages: ['小组循环预排'],
    drawGroupsByTab: {
      'CUTR 3.5单打': [],
    },
    standingsByTab: {
      'CUTR 3.5单打': [
        { rank: 1, name: '上期冠军：张明', unit: '湖北省武汉市', points: '+150 积分' },
        { rank: 2, name: '上期亚军：李强', unit: '湖北省京山市', points: '+100 积分' },
      ],
    },
    techMatches: [],
    scheduleDates: ['2026-11-29'],
    orderOfPlayByDate: {
      '2026-11-29': [
        {
          courtName: '文峰1-4号场',
          matches: [
            { matchOrder: '第1场', timeText: '09:00 开始', division: 'CUTR 3.5单打', stageRound: '小组赛第1轮', teamA: '系统开赛前1天自动抽签生成', teamB: '敬请期待', scoreA: '报名中', scoreB: '-' },
          ],
        },
      ],
    },
  },
]
