export type ModuleId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
export type RadiusOption = '500m' | '1公里' | '2公里'
export type VisitorOrigin =
  | '武汉市（省内游客）'
  | '京山本地市民'
  | '荆门市（周边游客）'
  | '深圳市（省外游客）'

export interface AbilityDimensions {
  serve: number
  baseline: number
  volley: number
  footwork: number
  stamina: number
}

export interface MatchStatRow {
  label: string
  valA: number
  valB: number
  unit?: string
}

export interface MatchPlayLog {
  time: string
  setInfo: string
  tag: '破发点' | 'ACE' | '关键分' | '盘点' | '精彩多拍'
  text: string
}

export interface MatchFanComment {
  id: string
  user: string
  city: string
  score: number
  content: string
  likes: number
  liked?: boolean
}

export interface LiveMatch {
  id: string
  eventName: string
  round: string
  venue: string
  courtNo: string
  duration: string
  status: '激战中' | '进行中' | '已完赛'
  playerA: string
  playerB: string
  setsA: string[]
  setsB: string[]
  summary: string
  ratingA: number
  ratingB: number
  stats: MatchStatRow[]
  playByPlay: MatchPlayLog[]
  comments: MatchFanComment[]
}

export interface CourtSlot {
  time: string
  price: number
  memberPrice: number
  remaining: number
  booked?: boolean
}

export interface CourtUnit {
  id: string
  name: string
  surface: '硬地' | '红土' | '室内风雨' | '匹克球'
  env: '室内' | '室外' | '风雨棚'
  dayPrice: number
  nightPrice: number
}

export interface CourtVenue {
  id: string
  name: string
  region: '温泉街道' | '新市街道' | '永兴街道'
  address: string
  distanceKm: number
  phone: string
  lng: number
  lat: number
  surfaces: ('硬地' | '红土' | '室内风雨' | '匹克球')[]
  envs: ('室内' | '室外' | '风雨棚')[]
  amenities: string[]
  photo: string
  galleryCount: number
  liveViewers: number
  rating: number
  reviewCount: number
  openHours: string
  minPrice: number
  priceDesc: string
  tags: string[]
  parkingName: string
  parkingRemain: number
  chargerName: string
  chargerRemain: number
  quote: string
  courts: CourtUnit[]
  slots: CourtSlot[]
}

export type CutrBand =
  | '2.00-2.49'
  | '2.50-2.99'
  | '3.00-3.49'
  | '3.50-3.99'
  | '4.00-4.49'
  | '4.50-4.99'
  | '5.00-5.49'
  | '5.50+'

export interface MatchmakingGame {
  id: string
  title: string
  hostName: string
  hostOrigin: string
  venueId: string
  venueName: string
  region: '温泉街道' | '新市街道' | '永兴街道'
  distanceKm: number
  date: string
  startTime: string
  endTime: string
  cutrBand: CutrBand
  venueType: '室内' | '室外' | '风雨棚' | '学练馆'
  activityType: '拉球' | '比赛' | '发球机' | '人工训练'
  gender: '不限' | '男' | '女'
  format: '单打' | '双打'
  amenities: string[]
  feePerPerson: number
  maxPlayers: number
  currentPlayers: number
  joinedByMe?: boolean
  note: string
}

export interface GroupClassItem {
  id: string
  date: string
  startTime: string
  endTime: string
  title: string
  category: '零基础入门' | '多球强化' | '双打战术' | '发球专项'
  level: '零基础' | 'CUTR 2.0-3.0' | 'CUTR 3.0-4.0' | '青少年'
  coachName: string
  venueName: string
  price: number
  memberPrice: number
  capacity: number
  enrolled: number
  bookedByMe?: boolean
  tags: string[]
}

export interface PrivateCoach {
  id: string
  name: string
  title: string
  tier: '省网校国家级' | '金网5.0' | 'CTA高级'
  specialty: '零基础启蒙' | '发球提速' | '网前截击' | '比赛实战' | '青少年'
  photo: string
  rating: number
  lessonsCount: number
  venueName: string
  price: number
  memberPrice: number
  intro: string
  tags: string[]
  availableHours: string[]
}

export interface HotelRoom {
  id: string
  name: string
  area: string
  bed: string
  breakfast: string
  cancelRule: string
  originalPrice: number
  eventPrice: number
  remaining: number
  leaseUnit?: string
}

export interface HotelProfile {
  id: string
  category: '公寓' | '赛事优惠' | '民宿'
  name: string
  badge: string
  subBadge: string
  photo: string
  rating: number
  reviewCount: number
  distanceToCourt: string
  address: string
  lng: number
  lat: number
  openYear: string
  phone: string
  intro: string
  facilities: string[]
  policies: string[]
  rooms: HotelRoom[]
  reviews: { user: string; score: number; room: string; content: string }[]
}

export interface ProductReview {
  user: string
  spec: string
  score: number
  content: string
  date: string
}

export interface ProductItem {
  id: string
  cat: '农特' | '装备' | '文创'
  name: string
  badge: string
  sub: string
  photo: string
  rating: number
  reviewCount: number
  sold: number
  price: number
  memberPrice: number
  originPlace: string
  shipping: string
  specs: { label: string; addPrice: number }[]
  highlights: string[]
  params: { k: string; v: string }[]
  quote: string
  reviews: ProductReview[]
}

export interface CinemaShowtime {
  id: string
  time: string
  hall: string
  type: string
  price: number
  memberPrice: number
  takenSeats: string[]
}

export interface CinemaMovie {
  id: string
  title: string
  poster: string
  score: number
  duration: string
  genre: string
  tagline: string
  showtimes: CinemaShowtime[]
}

export interface PortalOrder {
  id: string
  category: '场地' | '住宿' | '门票' | '课程' | '商品'
  title: string
  subtitle: string
  time: string
  amount: number
  status: '待核销' | '已确认' | '待使用' | '待上课' | '已取消'
  cancellable?: boolean
}

export interface FeedbackPost {
  id: string
  author: string
  origin: string
  rating: number
  title: string
  photo: string
  likes: number
  liked?: boolean
  category: string
}

export interface ComplaintTicket {
  id: string
  category: string
  target: string
  content: string
  status: '已分办至对应部门' | '已办结 · 反馈满意'
  dept: string
  createdAt: string
}

export interface CouponItem {
  id: string
  title: string
  desc: string
  badge: string
  status: '有效中' | '已核销'
}

export interface LightboxHotItem {
  name: string
  price?: string
  tag?: string
  desc?: string
}

export interface LightboxReview {
  user: string
  origin?: string
  score?: number
  content: string
  date?: string
}

export interface LightboxPayload {
  title: string
  category?: string
  photo: string
  gallery?: string[]
  rating: number
  reviewCount?: number
  subtitle: string
  intro?: string
  openHours?: string
  priceInfo?: string
  priceNum?: number
  priceUnit?: string
  address?: string
  lng?: number
  lat?: number
  distance?: string
  driveMin?: string
  phone?: string
  tags?: string[]
  highlights?: string[]
  hotItemsTitle?: string
  hotItems?: LightboxHotItem[]
  navTip?: string
  audioScript?: string
  audioDuration?: string
  actionKind?:
    | 'spot'
    | 'package'
    | 'restaurant'
    | 'entertainment'
    | 'camp'
    | 'club'
    | 'rehab'
    | 'amenity'
    | 'store'
    | 'theme'
  orderCategory?: PortalOrder['category']
  reviews: (string | LightboxReview)[]
}

export type DetailPagePayload =
  | { kind: 'hotel'; hotelId: string }
  | { kind: 'product'; productId: string }
  | { kind: 'venue'; venueId: string; date?: string; courtId?: string; slotTime?: string }
  | { kind: 'cinema' }
  | { kind: 'place'; data: LightboxPayload }

export interface BookingDraft {
  venueId: string
  venueName: string
  date?: string
  courtId?: string
  slotTime: string
  price: number
  memberPrice: number
  parkingName: string
  chargerName: string
}

export interface MenuDish {
  name: string
  price: number
  stubPrice: number
  tag?: string
}

export type ActionModalPayload =
  | { type: 'video'; title: string; duration: string }
  | { type: 'livecam'; venueName: string; photo: string; viewers: number }
  | { type: 'menu'; shopName: string; dishes: MenuDish[]; dist: string; address: string; lng: number; lat: number }
  | { type: 'nav'; placeName: string; address: string; lng: number; lat: number; distance: string; driveMin: string; tip: string }
  | { type: 'stub'; code: string }
  | { type: 'audio'; spotName: string; duration: string; script: string; photo: string }
  | { type: 'inquiry'; title: string; subtitle: string; submitLabel: string }
  | { type: 'miniprogram'; appName: string; desc: string }
