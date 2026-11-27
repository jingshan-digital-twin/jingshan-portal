export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
  mockFactory?: () => T,
): Promise<T> {
  if (USE_MOCK && mockFactory) {
    return mockFactory()
  }
  try {
    const res = await fetch(`/api/v1${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
      ...options,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as ApiEnvelope<T>
    if (json.code !== 200) throw new Error(json.message || '请求失败')
    return json.data
  } catch (err) {
    if (mockFactory) {
      console.warn(`[API Fallback -> Mock] ${path}:`, err)
      return mockFactory()
    }
    throw err
  }
}
