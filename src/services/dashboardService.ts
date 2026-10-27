import axios from 'axios'
import { API_CONFIG } from '@/config/api'

// Resumen del dashboard (GET /api/dashboard/summary): lo de la persona que
// consulta y, según su alcance, la carga de su área o de la organización.

export type DashboardScope = 'member' | 'leader' | 'admin'

export interface ActivityCounts {
  /** Activas (pendientes, en curso o vencidas), incluye features y recurrentes */
  active: number
  overdue: number
  today: number
  week: number
  later: number
  noDate: number
  inProgress: number
  highPriority: number
  completedWeek: number
}

export interface DashboardActivity {
  _id: string
  title: string
  status: 'pending' | 'in-progress' | 'overdue' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  type?: string
  dueDate: string | null
  tags: string[]
  completionPercentage: number
  client: { _id: string; name: string; company?: string } | null
  project: { _id: string; name: string } | null
}

export interface DashboardViewer {
  id: string
  name: string
  role: string
  isAdmin: boolean
  isLeader: boolean
  department: string | null
  scope: DashboardScope
}

export interface DashboardMember {
  _id: string
  name: string
  email: string
  photo: string | null
  role: string
  department: string | null
  departmentRole: 'member' | 'leader'
  position: string | null
  stats: ActivityCounts
}

export interface DashboardClientLoad {
  _id: string
  name: string
  company?: string
  active: number
  overdue: number
}

export interface DashboardSummary {
  generatedAt: string
  /** Fecha de hoy en Costa Rica, YYYY-MM-DD */
  today: string
  viewer: DashboardViewer
  mine: ActivityCounts
  lists: {
    overdue: DashboardActivity[]
    today: DashboardActivity[]
    upcoming: DashboardActivity[]
    noDate: DashboardActivity[]
  }
  routines: {
    total: number
    doneToday: number
    items: Array<{ _id: string; title: string; doneToday: boolean }>
  }
  approvals: { toReview: number; mine: number; canReview: boolean }
  team?: {
    scope: DashboardScope
    department: string | null
    members: DashboardMember[]
    totals: ActivityCounts
    clients: DashboardClientLoad[]
  }
  org?: {
    clients: { total: number; active: number }
    projects: { total: number; active: number }
    activities: ActivityCounts
    tickets: { open: number }
    cases: { open: number }
    approvals: { pending: number }
  }
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await axios.get(`${API_CONFIG.BASE_URL}/dashboard/summary`)
    if (!data?.success) throw new Error(data?.message || 'No se pudo cargar el resumen')
    return data.data as DashboardSummary
  }
}
