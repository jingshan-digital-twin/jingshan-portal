import { shallowRef } from 'vue'

export interface ReservationField {
  label: string
  value: string
}

export interface ReservationSummary {
  title: string
  fields: ReservationField[]
  amount?: number
  successTitle?: string
  successMessage?: string
}

interface ReservationView {
  summary: ReservationSummary
  phase: 'review' | 'submitting' | 'success'
  error?: string
  orderId?: string
}

type Commit = () => string | void | Promise<string | void>

export const reservationView = shallowRef<ReservationView | null>(null)
let pending: { commit: Commit; resolve: (confirmed: boolean) => void } | null = null

export function requestReservation(summary: ReservationSummary, commit: Commit): Promise<boolean> {
  if (reservationView.value) return Promise.resolve(false)
  return new Promise((resolve) => {
    pending = { commit, resolve }
    reservationView.value = { summary, phase: 'review' }
  })
}

export function dismissReservation() {
  if (reservationView.value?.phase === 'submitting') return
  const request = pending
  pending = null
  reservationView.value = null
  request?.resolve(false)
}

export async function confirmReservation() {
  const view = reservationView.value
  const request = pending
  if (view?.phase !== 'review' || !request) return
  reservationView.value = { summary: view.summary, phase: 'submitting' }
  try {
    const orderId = await request.commit()
    pending = null
    reservationView.value = { summary: view.summary, phase: 'success', orderId: orderId || undefined }
    request.resolve(true)
  } catch (error) {
    reservationView.value = {
      summary: view.summary,
      phase: 'review',
      error: error instanceof ReservationUnavailable ? error.message : '暂时无法提交，请稍后重试。',
    }
  }
}

export class ReservationUnavailable extends Error {}
