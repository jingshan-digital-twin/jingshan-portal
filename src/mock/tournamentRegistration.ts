import type { PortalOrder } from '../types/portal'
import { BOOKING_DATES } from './schedules'
import { PORTAL_TOURNAMENTS, type PortalTournament, type TournamentDivision } from './tournamentsData'
import { INITIAL_YOUTH_TOURNAMENTS } from './trainingData'

type RegistrationEvent = Pick<PortalTournament,
  'id' | 'name' | 'photo' | 'venue' | 'venueId' | 'dateRange' | 'summary' | 'typeBadge' | 'noticeList' | 'status' | 'divisions'
>

const clayTournament = INITIAL_YOUTH_TOURNAMENTS.find((event) => event.id === 'yt-2')!
const legacyEvent: RegistrationEvent = {
  id: clayTournament.id,
  name: clayTournament.name,
  photo: '/images/tournament_1.jpg',
  venue: clayTournament.venue,
  venueId: 'venue-training-base',
  dateRange: clayTournament.dateRange,
  summary: clayTournament.desc,
  typeBadge: clayTournament.levelBadge,
  noticeList: [clayTournament.surface],
  status: '报名中',
  divisions: ['单打', '双打'].map((format, index) => ({
    id: `clay-${index}`, name: `${clayTournament.groupTag} ${format}`, fee: clayTournament.fee,
    limitText: '', enrolled: 0, status: '报名中', enrolledSample: [],
  })),
}

export function getRegistrationEvent(id: string) {
  return PORTAL_TOURNAMENTS.find((event) => event.id === id) ?? (id === legacyEvent.id ? legacyEvent : undefined)
}

export function getTournamentEntries(orders: PortalOrder[], eventId: string, groupId: string) {
  return orders.flatMap((order) => {
    const entry = order.tournamentEntry
    if (order.status === '已取消' || !entry || entry.eventId !== eventId || entry.groupId !== groupId) return []
    return [{ ...entry, orderId: order.id }]
  })
}

export function getDivisionStatus(event: RegistrationEvent, division: TournamentDivision, orders: PortalOrder[]): TournamentDivision['status'] {
  if (event.status === '已结束') return '报名已结束'
  if (division.status !== '报名中') return division.status
  const enrolled = division.enrolled + getTournamentEntries(orders, event.id, division.id).length
  return division.maxPlayers !== undefined && enrolled >= division.maxPlayers ? '已报满' : '报名中'
}

export function getOpenTournamentDivisions(event: RegistrationEvent, orders: PortalOrder[]) {
  return event.divisions.filter((division) => getDivisionStatus(event, division, orders) === '报名中')
}

export function getOpenTournamentOptions(orders: PortalOrder[]) {
  return PORTAL_TOURNAMENTS.flatMap((event) => {
    const divisions = getOpenTournamentDivisions(event, orders)
    return divisions.length ? [{ event, divisions }] : []
  })
}

export function getTournamentStay(eventDateRange: string) {
  const portalDate = BOOKING_DATES[0]!.iso
  const eventStart = eventDateRange.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? portalDate
  const checkIn = eventStart > portalDate ? eventStart : portalDate
  const checkOut = new Date(Date.parse(checkIn) + 2 * 86_400_000).toISOString().slice(0, 10)
  return { checkIn, checkOut, nights: 2 }
}
