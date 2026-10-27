// Formato de fechas y etiquetas compartido por los bloques del dashboard
import type { DashboardActivity } from '@/services/dashboardService'

const DAY_MS = 86400000

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function timeLabel(d: Date): string {
  return d.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/\s/g, ' ')
}

/** "hoy 3:00 p. m.", "mañana", "en 4 días", "hace 2 días", "lun 3 nov" */
export function relativeDue(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return 'Sin fecha'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Sin fecha'
  const days = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / DAY_MS)
  if (days === 0) return `hoy ${timeLabel(d)}`
  if (days === 1) return `mañana ${timeLabel(d)}`
  if (days === -1) return 'ayer'
  if (days < 0 && days >= -14) return `hace ${-days} días`
  if (days > 1 && days <= 7) return `en ${days} días`
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')
}

export function longDate(now: Date = new Date()): string {
  const s = now.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function greetingByHour(now: Date = new Date()): string {
  const h = now.getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador', manager: 'Gerencia', employee: 'Colaborador',
  support: 'Soporte', development: 'Desarrollo', fullstack: 'Fullstack',
  viewer: 'Lectura', client: 'Cliente'
}

export function roleLabel(role?: string | null): string {
  if (!role) return 'Usuario'
  return ROLE_LABELS[role] || role.charAt(0).toUpperCase() + role.slice(1)
}

export const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-primary-500', low: 'bg-slate-300'
}

export const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja'
}

export function statusBadge(a: DashboardActivity, now: Date = new Date()): { label: string; cls: string } {
  const due = a.dueDate ? new Date(a.dueDate) : null
  if (a.status === 'overdue' || (due && due.getTime() < now.getTime() && a.status !== 'completed')) {
    return { label: 'Vencida', cls: 'badge-danger' }
  }
  if (a.status === 'in-progress') return { label: 'En curso', cls: 'badge-primary' }
  if (a.status === 'completed') return { label: 'Completada', cls: 'badge-success' }
  if (due && startOfDay(due).getTime() === startOfDay(now).getTime()) return { label: 'Hoy', cls: 'badge-warning' }
  return { label: 'Pendiente', cls: 'badge-slate' }
}

export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many
}
