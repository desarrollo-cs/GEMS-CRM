<template>
  <div class="flex flex-col gap-4 h-full min-h-0">
    <!-- Cabecera compacta -->
    <PageHeader icon="fas fa-person-running" title="Daily Scrum">
      <template #subtitle>{{ usersWithTasks.length }} colaboradores · {{ activeSessions.length }} sesiones activas</template>
      <button @click="openEmailModal" class="btn-primary btn-sm">
        <i class="fas fa-paper-plane text-[10px]"></i>
        Enviar reporte
      </button>
    </PageHeader>

    <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div class="flex flex-col gap-4">

        <!-- Barra de rastreo en vivo -->
        <div v-if="activeSessions.length > 0" class="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <span class="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-wider">
              <span class="relative flex h-2 w-2">
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 animate-pulse"></span>
              </span>
              En vivo
            </span>

            <div class="flex -space-x-2">
              <div
                v-for="(session, idx) in activeSessions"
                :key="session.userId + idx"
                class="relative group/avatar"
                :title="`${session.userName} - ${session.taskTitle}`"
              >
                <PersonAvatar :name="session.userName" :photo="session.userPhoto" :letters="1" title="" class="w-9 h-9 rounded-xl bg-primary-100 border-2 border-white shadow-sm text-xs font-black text-primary-700 transition-transform group-hover/avatar:-translate-y-1" />
                <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
              </div>
            </div>

            <div class="hidden lg:block h-8 w-px bg-slate-200 mx-1"></div>

            <div class="hidden lg:flex flex-col">
              <span class="text-slate-800 font-extrabold text-sm">{{ activeSessions.length }} Sesiones Activas</span>
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Sincronización en tiempo real</span>
            </div>
          </div>

          <div class="hidden xl:flex items-center gap-6 pr-2">
            <div v-for="(session, idx) in activeSessions.slice(0, 2)" :key="'msg-'+idx" class="flex flex-col items-end animate-fade-in">
              <span class="text-primary-600 font-black text-[10px] uppercase tracking-wider">{{ session.userName }}</span>
              <span class="text-slate-500 text-xs font-medium italic truncate max-w-[200px]">"{{ session.taskTitle }}"</span>
            </div>
          </div>
        </div>

        <!-- Evolución del equipo -->
        <section class="flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 border border-primary-100">
              <i class="fas fa-users-cog text-xs"></i>
            </div>
            <div>
              <h2 class="text-sm font-extrabold text-slate-800">Evolución del Equipo</h2>
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Monitoreo de eficiencia operativa</p>
            </div>
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div
              v-for="item in usersWithTasks"
              :key="item.user._id"
              class="group bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm hover:border-primary-200 transition-colors"
            >
              <div class="flex flex-col lg:flex-row gap-4 p-4">
                <!-- User Profile Section -->
                <div class="lg:w-[240px] flex lg:flex-col justify-between lg:justify-start gap-4">
                  <div class="flex items-center lg:items-start gap-4">
                    <div class="relative shrink-0">
                      <PersonAvatar :name="item.user.name" :photo="item.user.photo" :letters="1" class="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 font-black text-base" />
                      <div v-if="isUserActive(item.user._id)" class="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                    </div>
                    <div class="space-y-0.5 min-w-0">
                      <h3 class="text-slate-800 font-black text-sm tracking-tight truncate">{{ item.user.name }}</h3>
                      <span class="px-2 py-0.5 bg-primary-50 text-primary-600 border border-primary-100 rounded-full text-[9px] font-black uppercase tracking-wider block w-fit">
                        {{ item.user.role || 'Consultor' }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="flex flex-col gap-2 mt-auto">
                    <div class="flex justify-between items-end">
                      <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Rendimiento</span>
                      <span class="text-xs font-black text-primary-600">{{ calculateUserPerformance(item.tasks) }}%</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        class="bg-primary-500 h-full rounded-full transition-[width] duration-300" 
                        :style="{ width: `${calculateUserPerformance(item.tasks)}%` }"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- Vertical Divider -->
                <div class="hidden lg:block w-px bg-slate-100 self-stretch my-2"></div>

                <!-- Activities Timeline Section -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-3 px-2">
                    <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Actividades del Día ({{ item.tasks.length }})</span>
                    <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Carga: {{ formatSecondsToTime(calculateTotalTime(item.tasks)) }}</span>
                  </div>
                  
                  <div class="space-y-2 h-[130px] overflow-y-auto pr-2 custom-scrollbar-mini">
                    <div v-if="item.tasks.length === 0" class="flex flex-col items-center justify-center h-full text-slate-300">
                      <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Sin actividad registrada</p>
                    </div>
                    
                    <div 
                      v-for="task in item.tasks" 
                      :key="task._id"
                      class="flex items-center gap-3 bg-slate-50/50 hover:bg-slate-50 p-2.5 rounded-xl border border-transparent hover:border-slate-100 transition-all group/task"
                    >
                      <div class="w-1.5 h-1.5 rounded-full shrink-0" :class="task.activeSessions?.some((s: any) => (s.userId?._id || s.userId) === item.user._id) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'"></div>
                      <div class="flex-1 min-w-0">
                        <h5 class="text-slate-700 text-[11px] font-bold truncate tracking-tight">{{ task.title }}</h5>
                        <div class="flex items-center gap-3 text-[9px] font-bold text-slate-400">
                           <span class="flex items-center gap-1"><i class="fas fa-clock text-[8px]"></i> {{ formatSecondsToTime(task.timeSpent || 0) }}</span>
                           <span v-if="task.completionPercentage" class="text-primary-500">{{ task.completionPercentage }}% completo</span>
                        </div>
                      </div>
                      <div class="shrink-0 text-[10px] font-black text-slate-400 group-hover/task:text-primary-500 transition-colors">
                        <i class="fas fa-chevron-right text-[8px]"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer Stats Row -->
              <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl">
                <div class="flex items-center gap-6">
                  <div class="flex flex-col">
                    <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Actividad</span>
                    <span class="text-[10px] font-bold" :class="isUserActive(item.user._id) ? 'text-emerald-500' : 'text-slate-500'">
                      {{ isUserActive(item.user._id) ? 'Trabajando' : 'En pausa' }}
                    </span>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                   <div v-for="n in 3" :key="n" class="w-1.5 h-1.5 rounded-full" :class="n <= Math.ceil(calculateUserPerformance(item.tasks)/33) ? 'bg-primary-400' : 'bg-slate-200'"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>

    <!-- Modal de Envío de Reporte (Premium Redesign) -->
    <Teleport to="body">
      <div v-if="showEmailModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 relative overflow-hidden animate-fade-in">
          <div class="text-center space-y-4 mb-6">
            <div class="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto border border-primary-100">
              <i class="fas fa-paper-plane text-primary-600 text-xl"></i>
            </div>
            <div class="space-y-1">
              <h3 class="text-sm font-extrabold text-slate-800 tracking-tight">Enviar reporte</h3>
              <p class="text-xs font-medium text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                Se enviará un sumario ejecutivo con el progreso, eficiencia y métricas clave de todo el equipo asignado.
              </p>
            </div>
          </div>
          
          <div class="space-y-5">
            <div class="group">
              <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 ml-1 group-focus-within:text-primary-600 transition-colors">Destinatario Principal</label>
              <div class="relative">
                <i class="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-xs group-focus-within:text-primary-400 transition-colors"></i>
                <input
                  v-model="reportEmail"
                  type="email"
                  placeholder="admin@customertouch.pro"
                  class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div class="flex gap-3">
              <button @click="showEmailModal = false" class="btn-secondary btn-sm flex-1">
                Cancelar
              </button>
              <button
                @click="confirmSendReport"
                :disabled="sendingEmail || !reportEmail"
                class="btn-primary btn-sm flex-[1.5]"
              >
                <div v-if="sendingEmail" class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <i v-else class="fas fa-paper-plane text-xs"></i>
                {{ sendingEmail ? 'Procesando...' : 'Confirmar Envío' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import PersonAvatar from '../components/ui/PersonAvatar.vue'
import PageHeader from '../components/ui/PageHeader.vue'
import { ref, computed } from 'vue'
import axios from 'axios'
import { API_CONFIG } from '@/config/api'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/composables/useNotifications'

const props = defineProps<{
  activities: any[]
}>()

const authStore = useAuthStore()
const { showSuccess, showError } = useNotifications()
const API_URL = API_CONFIG.BASE_URL.replace('/api', '')

const dailyTasks = computed(() => {
  return props.activities.filter((t: any) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const updated = new Date(t.updatedAt)
    const hasActive = t.activeSessions && t.activeSessions.length > 0
    const isInProgress = t.status === 'in-progress'
    const isTodayOrActive = updated >= today || hasActive || isInProgress
    
    // Filtrar si el asignado es un cliente
    const isAssignedToClient = Array.isArray(t.assignedTo) && t.assignedTo.some((u: any) => {
      const role = u.role?.toLowerCase() || ''
      return role.includes('client') || role.includes('cliente')
    })

    return isTodayOrActive && !isAssignedToClient
  })
})

const usersWithTasks = computed(() => {
  const grouped = new Map<string, { user: any, tasks: any[] }>()
  
  dailyTasks.value.forEach(task => {
    if (Array.isArray(task.assignedTo) && task.assignedTo.length > 0) {
      task.assignedTo.forEach(user => {
        const userId = typeof user === 'object' ? user._id : user
        if (!userId) return

        if (!grouped.has(userId)) {
          grouped.set(userId, { 
            user: typeof user === 'object' ? user : { _id: userId, name: 'Usuario' }, 
            tasks: [] 
          })
        }
        grouped.get(userId)!.tasks.push(task)
      })
    }
  })
  
  // Convert map to sorted array (by name)
  return Array.from(grouped.values()).sort((a, b) => a.user.name.localeCompare(b.user.name))
})

const activeSessions = computed(() => {
  const sessions: any[] = []
  dailyTasks.value.forEach(task => {
    if (task.activeSessions) {
      task.activeSessions.forEach((session: any) => {
        // Encontrar el usuario en la lista de asignados para obtener nombre/foto
        const userId = typeof session.userId === 'object' ? session.userId._id : session.userId
        const user = task.assignedTo?.find((u: any) => (u._id || u) === userId)
        
        sessions.push({
          ...session,
          userName: user?.name || 'Usuario',
          userPhoto: user?.photo || user?.avatar,
          taskTitle: task.title,
          taskId: task._id
        })
      })
    }
  })
  return sessions
})

const isUserActive = (userId: string) => {
  return activeSessions.value.some(s => (s.userId?._id || s.userId) === userId)
}

const sendingEmail = ref(false)
const showEmailModal = ref(false)
const reportEmail = ref('')

function openEmailModal() {
  reportEmail.value = authStore.user?.email || ''
  showEmailModal.value = true
}

async function confirmSendReport() {
  if (!reportEmail.value) return
  
  sendingEmail.value = true
  try {
    await axios.post(`${API_URL}/api/task-reports/send-daily-email`, {
      toEmail: reportEmail.value
    }, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    showEmailModal.value = false
    showSuccess(`Reporte enviado exitosamente a ${reportEmail.value}`)
  } catch (error: any) {
    showError(error.response?.data?.error || 'Error al enviar el reporte.')
  } finally {
    sendingEmail.value = false
  }
}

const calculateUserPerformance = (tasks: any[]) => {
  if (tasks.length === 0) return 0
  const total = tasks.length
  const completedWeight = tasks.reduce((acc, t) => acc + (t.completionPercentage || 0), 0)
  return Math.round(completedWeight / total)
}

const formatSecondsToTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const calculateTotalTime = (tasks: any[]) => {
  return tasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0)
}

</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.custom-scrollbar-mini::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar-mini::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar-mini::-webkit-scrollbar-thumb {
  background: #f1f5f9;
  border-radius: 10px;
}
.custom-scrollbar-mini::-webkit-scrollbar-thumb:hover {
  background: #e2e8f0;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoom-in-95 {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes slide-in-from-top-4 {
  from { transform: translateY(-1rem); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-in {
  animation-fill-mode: forwards;
}
.fade-in {
  animation-name: fade-in;
}
.zoom-in-95 {
  animation-name: zoom-in-95;
}
.slide-in-from-top-4 {
  animation-name: slide-in-from-top-4;
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out forwards;
}
</style>
