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

export interface CourtVenue {
  id: string
  name: string
  region: '温泉街道' | '新市街道' | '永兴街道'
  address: string
  lng: number
  lat: number
  surfaces: ('硬地' | '红土' | '室内风雨')[]
  photo: string
  galleryCount: number
  liveViewers: number
  rating: number
  reviewCount: number
  openHours: string
  priceDesc: string
  tags: string[]
  parkingName: string
  parkingRemain: number
  chargerName: string
  chargerRemain: number
  quote: string
  slots: CourtSlot[]
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
  rating: number
  subtitle: string
  intro?: string
  openHours?: string
  priceInfo?: string
  address?: string
  lng?: number
  lat?: number
  tags?: string[]
  highlights?: string[]
  hotItemsTitle?: string
  hotItems?: LightboxHotItem[]
  navTip?: string
  reviews: (string | LightboxReview)[]
}

export interface BookingDraft {
  venueId: string
  venueName: string
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
