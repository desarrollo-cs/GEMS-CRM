import { todayKeyCR, type Recurrence } from '@/services/activityService'

export const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'daily', label: 'Diaria' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' }
]
export const recurrenceLabel = (r?: Recurrence | null) => RECURRENCE_OPTIONS.find(o => o.value === r)?.label || 'Diaria'

export interface DailyLogEntry {
  date: string // 'YYYY-MM-DD' en hora de Costa Rica
  userId: string | { _id: string }
}

export interface RecurringStats {
  doneToday: boolean       // la persona actual ya le dio "+" en el período actual (hoy / esta semana / este mes / este año)
  doneTodayByAnyone: boolean
  total: number            // períodos distintos con registro (de cualquier persona)
  streak: number           // períodos seguidos con registro, hasta el actual (o el anterior si el actual aún no)
  period: string           // 'hoy' | 'esta semana' | 'este mes' | 'este año'
  unit: string             // 'día(s)' | 'semana(s)' | 'mes(es)' | 'año(s)'
  button: string           // texto del "+": 'Hoy' | 'Semana' | 'Mes' | 'Año'
}

const PERIOD_TEXT: Record<Recurrence, Pick<RecurringStats, 'period' | 'unit' | 'button'>> = {
  daily: { period: 'hoy', unit: 'día(s)', button: 'Hoy' },
  weekly: { period: 'esta semana', unit: 'semana(s)', button: 'Semana' },
  monthly: { period: 'este mes', unit: 'mes(es)', button: 'Mes' },
  yearly: { period: 'este año', unit: 'año(s)', button: 'Año' }
}

const idOf = (u: DailyLogEntry['userId']) => (typeof u === 'object' ? u?._id : u)

// Clave del período de una fecha: el día, el lunes de esa semana, 'YYYY-MM' o 'YYYY'.
// Misma regla que services/recurrence.js en el backend.
export function periodKey(dateKey: string, recurrence: Recurrence): string {
  if (recurrence === 'yearly') return dateKey.slice(0, 4)
  if (recurrence === 'monthly') return dateKey.slice(0, 7)
  if (recurrence === 'weekly') {
    const d = new Date(`${dateKey}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
    return d.toISOString().slice(0, 10)
  }
  return dateKey
}

function previousPeriod(key: string, recurrence: Recurrence): string {
  if (recurrence === 'yearly') return String(Number(key) - 1)
  if (recurrence === 'monthly') {
    const [y, m] = key.split('-').map(Number)
    return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
  }
  const d = new Date(`${key}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 7)
  return d.toISOString().slice(0, 10)
}

function previousBusinessDay(key: string): string {
  const d = new Date(`${key}T12:00:00Z`)
  do {
    d.setUTCDate(d.getUTCDate() - 1)
  } while (d.getUTCDay() === 0 || d.getUTCDay() === 6)
  return d.toISOString().slice(0, 10)
}

const isWeekend = (key: string) => {
  const day = new Date(`${key}T12:00:00Z`).getUTCDay()
  return day === 0 || day === 6
}

/**
 * Estadísticas del registro de una tarea recurrente según su periodicidad. En la
 * diaria la racha cuenta días hábiles: un fin de semana sin registro no la corta
 * (sí suma si alguien registró). En las demás cuenta períodos seguidos.
 */
export function recurringStats(log: DailyLogEntry[] | undefined, currentUserId?: string, recurrence: Recurrence = 'daily'): RecurringStats {
  const entries = log || []
  const today = todayKeyCR()
  const current = periodKey(today, recurrence)
  const keys = new Set(entries.map(e => periodKey(e.date, recurrence)))

  let streak = 0
  if (recurrence === 'daily') {
    // Si hoy todavía no se registró, la racha sigue viva desde el día hábil anterior
    let cursor = keys.has(today) ? today : previousBusinessDay(today)
    while (keys.has(cursor)) {
      streak++
      const prev = new Date(`${cursor}T12:00:00Z`)
      prev.setUTCDate(prev.getUTCDate() - 1)
      const prevKey = prev.toISOString().slice(0, 10)
      // Fin de semana con registro: cuenta y sigue; sin registro: se salta
      cursor = keys.has(prevKey) || !isWeekend(prevKey) ? prevKey : previousBusinessDay(cursor)
    }
  } else {
    let cursor = keys.has(current) ? current : previousPeriod(current, recurrence)
    while (keys.has(cursor)) {
      streak++
      cursor = previousPeriod(cursor, recurrence)
    }
  }

  return {
    doneToday: !!currentUserId && entries.some(e => periodKey(e.date, recurrence) === current && String(idOf(e.userId)) === String(currentUserId)),
    doneTodayByAnyone: keys.has(current),
    total: keys.size,
    streak,
    ...PERIOD_TEXT[recurrence]
  }
}
