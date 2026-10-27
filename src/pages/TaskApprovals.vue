<template>
  <div class="flex flex-col h-full min-h-0 motion-page">
    <div class="flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
      <!-- Encabezado compacto -->
      <div class="px-5 pt-4 pb-3 border-b border-slate-100 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <i class="fas fa-user-shield text-sm"></i>
            </div>
            <div class="min-w-0">
              <h1 class="text-base font-black text-slate-800 leading-tight">Autorizaciones</h1>
              <p class="text-xs text-slate-500 truncate">
                <template v-if="summary.canReview">Solicitudes de tu equipo y tareas eliminadas que aún se pueden recuperar.</template>
                <template v-else>Estado de las solicitudes que enviaste a tu líder.</template>
              </p>
            </div>
          </div>
          <button
            @click="load"
            :disabled="loading"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:text-primary-600 hover:border-primary-200 transition-colors"
          >
            <i class="fas fa-rotate text-[10px]" :class="{ 'animate-spin': loading }"></i>
            Actualizar
          </button>
        </div>

        <!-- Bandejas + filtros en una sola fila -->
        <div class="flex flex-col lg:flex-row lg:items-center gap-2.5">
          <div class="seg">
            <button
              v-if="summary.canReview"
              @click="goTo('inbox')"
              :aria-pressed="box === 'inbox'"
              class="flex items-center gap-1.5 whitespace-nowrap"
            >
              <i class="fas fa-inbox text-[10px]"></i>
              Por aprobar
              <span class="badge" :class="summary.toReview > 0 ? 'badge-warning' : 'badge-slate'">{{ summary.toReview }}</span>
            </button>
            <button @click="goTo('mine')" :aria-pressed="box === 'mine'" class="flex items-center gap-1.5 whitespace-nowrap">
              <i class="fas fa-paper-plane text-[10px]"></i>
              Mis solicitudes
              <span class="badge" :class="summary.waiting > 0 ? 'badge-primary' : 'badge-slate'">{{ summary.waiting }}</span>
            </button>
            <button
              v-if="summary.canReview"
              @click="goTo('trash')"
              :aria-pressed="box === 'trash'"
              title="Tareas y actividades eliminadas que todavía se pueden recuperar"
              class="flex items-center gap-1.5 whitespace-nowrap"
            >
              <i class="fas fa-trash-arrow-up text-[10px]"></i>
              Papelera
              <span v-if="box === 'trash'" class="badge badge-danger">{{ trashItems.length }}</span>
            </button>
          </div>

          <div v-if="box !== 'trash'" class="flex flex-wrap items-center gap-2 lg:ml-auto">
            <div class="w-40">
              <CustomSelect v-model="statusFilter" size="sm" :options="statusOptions" />
            </div>
            <div class="w-44">
              <CustomSelect v-model="kindFilter" size="sm" :options="kindOptions" />
            </div>
          </div>
          <p v-else class="text-[11px] text-slate-400 lg:ml-auto">
            Se conservan {{ retentionDays }} días desde que se eliminan.
          </p>
        </div>
      </div>

      <!-- Papelera: solo aprobadores -->
      <div v-if="box === 'trash'" class="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-50/40">
        <Skeleton v-if="loading && trashItems.length === 0" preset="list" :rows="5" />
        <div v-else-if="error" class="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-medium">
          {{ error }}
        </div>
        <div v-else-if="trashItems.length === 0" class="empty-state bg-white border border-dashed border-slate-200">
          <div class="empty-state__icon bg-rose-50 text-rose-400"><i class="fas fa-trash-can"></i></div>
          <p class="empty-state__title">La papelera está vacía</p>
          <p class="empty-state__text">Lo que se elimine quedará aquí {{ retentionDays }} días por si hay que recuperarlo.</p>
        </div>
        <div v-else class="space-y-1.5 motion-stagger">
          <article
            v-for="item in trashItems"
            :key="item._id"
            class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3 hover:border-slate-300 transition-colors"
          >
            <span class="w-2 h-2 rounded-full shrink-0" :class="daysLeft(item) <= 7 ? 'bg-rose-500' : 'bg-rose-300'"></span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 min-w-0">
                <p class="text-[13px] font-bold text-slate-800 truncate">{{ item.title || 'Sin título' }}</p>
                <span class="badge badge-slate shrink-0">
                  {{ item.entityType === 'task' ? 'Tarea' : item.itemType === 'feature' ? 'Feature' : 'Actividad' }}
                </span>
              </div>
              <p class="mt-0.5 text-[11px] text-slate-500 flex items-center gap-1.5 min-w-0">
                <PersonAvatar v-if="item.deletedBy" :name="item.deletedBy.name" :photo="item.deletedBy.photo" :letters="1"
                  class="w-4 h-4 rounded-full bg-primary-100 text-primary-600 text-[8px] font-black shrink-0" />
                <span class="truncate">
                  Eliminada por <strong class="text-slate-600">{{ item.deletedBy?.name || 'alguien' }}</strong> · {{ relative(item.deletedAt) }}
                </span>
                <span class="text-slate-300">·</span>
                <span class="shrink-0 font-semibold" :class="daysLeft(item) <= 7 ? 'text-rose-600' : 'text-slate-400'">
                  {{ daysLeft(item) <= 0 ? 'Se borra hoy' : `Se borra en ${daysLeft(item)} día${daysLeft(item) === 1 ? '' : 's'}` }}
                </span>
              </p>
            </div>
            <button
              @click="restoreItem(item)"
              :disabled="busyId === item._id"
              title="Devolver la tarea a donde estaba, con sus comentarios, historial y adjuntos"
              class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 rounded-lg text-[11px] font-bold transition-colors"
            >
              <i class="text-[10px]" :class="busyId === item._id ? 'fas fa-spinner animate-spin' : 'fas fa-rotate-left'"></i>
              Restaurar
            </button>
          </article>
        </div>
      </div>

      <!-- Lista de solicitudes -->
      <div v-else class="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-50/40">
        <Skeleton v-if="loading && requests.length === 0" preset="list" :rows="6" />

        <div v-else-if="error" class="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-medium">
          {{ error }}
        </div>

        <div v-else-if="requests.length === 0" class="empty-state bg-white border border-dashed border-slate-200">
          <div class="empty-state__icon" :class="box === 'inbox' ? 'bg-amber-50 text-amber-500' : 'bg-sky-50 text-sky-500'">
            <i :class="box === 'inbox' ? 'fas fa-check-double' : 'fas fa-paper-plane'"></i>
          </div>
          <p class="empty-state__title">{{ emptyState.title }}</p>
          <p class="empty-state__text">{{ emptyState.detail }}</p>
        </div>

        <div v-else class="space-y-1.5 motion-stagger">
          <article
            v-for="req in requests"
            :key="req._id"
            class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 hover:border-slate-300 transition-colors"
          >
            <div class="flex items-start lg:items-center gap-3">
              <span class="w-2 h-2 rounded-full shrink-0 mt-1.5 lg:mt-0" :class="stateOf(req).bar"></span>

              <!-- Título, tipo y quién pide -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 min-w-0">
                  <button
                    v-if="!(req.kind === 'deletion' && req.status === 'approved')"
                    @click="openEntity(req)"
                    class="text-left text-[13px] font-bold text-slate-800 hover:text-primary-600 transition-colors truncate"
                    :title="req.entityTitle || 'Sin título'"
                  >
                    {{ req.entityTitle || 'Sin título' }}
                  </button>
                  <p v-else class="text-[13px] font-bold text-slate-400 line-through truncate">{{ req.entityTitle || 'Sin título' }}</p>
                  <span class="badge shrink-0" :class="req.kind === 'deletion' ? 'badge-danger' : 'badge-warning'">
                    {{ APPROVAL_KIND_LABELS[req.kind] }}
                  </span>
                  <span class="hidden md:inline text-[11px] text-slate-400 shrink-0">
                    {{ req.entityType === 'task' ? 'Tarea' : 'Actividad' }}<template v-if="req.department"> · {{ req.department }}</template>
                  </span>
                </div>

                <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 min-w-0">
                  <!-- Quién pidió (bandeja del líder) -->
                  <span v-if="box === 'inbox'" class="inline-flex items-center gap-1.5 min-w-0">
                    <PersonAvatar :name="req.requestedBy?.name" :photo="req.requestedBy?.photo" :letters="1"
                      class="w-4 h-4 rounded-full bg-primary-100 text-primary-600 text-[8px] font-black shrink-0" />
                    <strong class="text-slate-700">{{ req.requestedBy?.name || 'Alguien' }}</strong>
                    <template v-if="req.autoApproved">
                      {{ req.kind === 'deletion' ? 'la eliminó con' : 'amplió el plazo con' }}
                      <span class="font-bold text-violet-700">autoaprobación</span>
                    </template>
                    <template v-else>{{ req.kind === 'deletion' ? 'quiere eliminarla' : 'pide más tiempo' }}</template>
                  </span>
                  <!-- Estado para quien pidió -->
                  <span v-else class="inline-flex items-center gap-1.5 min-w-0">
                    <span class="font-bold" :class="stateOf(req).text">{{ stateOf(req).label }}</span>
                    <span v-if="outcomeOf(req)" class="truncate">· {{ outcomeOf(req) }}</span>
                  </span>
                  <span class="text-slate-400">· {{ relative(req.createdAt) }}</span>

                  <!-- Cambio de fecha -->
                  <span v-if="req.kind === 'due-date-extension'" class="inline-flex items-center gap-1.5 shrink-0">
                    <span class="text-slate-400 line-through">{{ formatDate(req.currentDueDate) }}</span>
                    <i class="fas fa-arrow-right text-slate-300 text-[9px]"></i>
                    <span class="font-bold text-amber-700">{{ formatDate(req.requestedDueDate) }}</span>
                    <span v-if="extraDays(req)" class="badge badge-slate">{{ extraDays(req) }}</span>
                  </span>

                  <!-- Resultado para el líder -->
                  <span v-if="box === 'inbox' && req.autoApproved" class="text-slate-400">· aplicada de inmediato, no requirió tu aprobación</span>
                  <span v-else-if="box === 'inbox' && req.status !== 'pending'" class="text-slate-400 min-w-0 truncate">
                    <template v-if="req.reviewedBy">
                      · {{ req.status === 'approved' ? 'Aprobada' : 'Rechazada' }} por <strong class="text-slate-600">{{ req.reviewedBy.name }}</strong>
                      {{ req.reviewedAt ? relative(req.reviewedAt) : '' }}<template v-if="req.reviewComment">: “{{ req.reviewComment }}”</template>
                    </template>
                    <template v-else-if="req.status === 'cancelled'">· {{ req.reviewComment || 'Cancelada por quien la pidió' }}</template>
                  </span>
                </div>

                <p v-if="req.reason" class="mt-1 text-[11px] text-slate-500 italic truncate" :title="req.reason">
                  <i class="fas fa-quote-left text-slate-300 text-[9px] mr-1"></i>{{ req.reason }}
                </p>
              </div>

              <!-- Acciones del líder -->
              <div v-if="req.status === 'pending' && box === 'inbox'" class="shrink-0 flex items-center gap-1.5">
                <button
                  @click="showComment[req._id] = !showComment[req._id]"
                  :title="showComment[req._id] ? 'Ocultar comentario' : 'Agregar comentario'"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] transition-colors"
                  :class="showComment[req._id] || comments[req._id] ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'"
                >
                  <i class="fas fa-comment-dots"></i>
                </button>
                <button
                  @click="review(req, 'reject')"
                  :disabled="busyId === req._id"
                  class="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50 rounded-lg text-[11px] font-bold transition-colors"
                >
                  Rechazar
                </button>
                <button
                  @click="review(req, 'approve')"
                  :disabled="busyId === req._id"
                  class="px-2.5 py-1.5 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold transition-colors min-w-[72px]"
                  :class="req.kind === 'deletion' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'"
                >
                  <i v-if="busyId === req._id" class="fas fa-spinner animate-spin"></i>
                  <template v-else>{{ req.kind === 'deletion' ? 'Eliminar' : 'Aprobar' }}</template>
                </button>
              </div>

              <!-- Acción de quien pidió -->
              <div v-else-if="req.status === 'pending' && box === 'mine'" class="shrink-0">
                <button
                  @click="cancel(req)"
                  :disabled="busyId === req._id"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:text-rose-600 hover:border-rose-200 disabled:opacity-50 transition-colors"
                >
                  <i class="fas fa-xmark text-[10px]"></i> Retirar
                </button>
              </div>
            </div>

            <!-- Comentario del líder (desplegable) -->
            <transition name="expand">
              <div v-if="req.status === 'pending' && box === 'inbox' && showComment[req._id]" class="mt-2 pl-5">
                <textarea
                  v-model="comments[req._id]"
                  rows="2"
                  placeholder="Comentario para quien lo pidió"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-primary-400 resize-none transition-all"
                ></textarea>
              </div>
            </transition>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { format, formatDistanceToNow, differenceInCalendarDays } from 'date-fns'
import { es } from 'date-fns/locale'
import PersonAvatar from '../components/ui/PersonAvatar.vue'
import CustomSelect from '../components/ui/CustomSelect.vue'
import Skeleton from '../components/ui/Skeleton.vue'
import { useActivityModalStore } from '../stores/activityModal'
import { useNotifications } from '../composables/useNotifications'
import {
  taskApprovalService,
  APPROVALS_CHANGED_EVENT,
  APPROVALS_REFRESH_EVENT,
  APPROVAL_KIND_LABELS,
  APPROVER_SOURCE_LABELS,
  type TaskApprovalRequest,
  type ApprovalStatus,
  type ApprovalKind,
  type ApprovalSummary,
  type TrashedItem
} from '../services/taskApprovalService'

type Box = 'inbox' | 'mine' | 'trash'

const { showSuccess, showError, confirmDelete } = useNotifications()
const activityModalStore = useActivityModalStore()

const box = ref<Box>('mine')
const statusFilter = ref<ApprovalStatus | 'all'>('pending')
const kindFilter = ref<ApprovalKind | ''>('')
const requests = ref<TaskApprovalRequest[]>([])
const summary = ref<ApprovalSummary>({ toReview: 0, waiting: 0, canReview: false, canManageTasks: false })
const trashItems = ref<TrashedItem[]>([])
const retentionDays = ref(60)
const loading = ref(false)
const error = ref('')
const busyId = ref<string | null>(null)
const comments = reactive<Record<string, string>>({})
const showComment = reactive<Record<string, boolean>>({})
let initialized = false

// "Pendiente" significa cosas distintas según quién mira: al líder le toca
// actuar; a quien pidió le toca esperar.
const statusOptions = computed(() => [
  { value: 'pending' as const, label: box.value === 'inbox' ? 'Por resolver' : 'En espera' },
  { value: 'approved' as const, label: 'Aprobadas' },
  { value: 'rejected' as const, label: 'Rechazadas' },
  { value: 'cancelled' as const, label: box.value === 'inbox' ? 'Canceladas' : 'Retiradas' },
  { value: 'all' as const, label: 'Todas' }
])

const kindOptions = [
  { value: '' as const, label: 'Todos los tipos' },
  { value: 'due-date-extension' as const, label: 'Ampliaciones de plazo' },
  { value: 'deletion' as const, label: 'Eliminaciones' }
]

const emptyState = computed(() => {
  if (box.value === 'inbox') {
    return statusFilter.value === 'pending'
      ? { title: 'Estás al día', detail: 'No hay solicitudes de tu equipo esperando tu aprobación.' }
      : { title: 'No hay solicitudes con este estado', detail: 'Prueba con otro filtro.' }
  }
  return statusFilter.value === 'pending'
    ? { title: 'No tienes solicitudes en espera', detail: 'Cuando pidas ampliar un plazo o eliminar una tarea, podrás seguir aquí su aprobación.' }
    : { title: 'No hay solicitudes con este estado', detail: 'Prueba con otro filtro.' }
})

function approverNames(req: TaskApprovalRequest) {
  const names = (req.approvers || []).map(a => a.name).filter(Boolean)
  if (names.length) return names.join(', ')
  return APPROVER_SOURCE_LABELS[req.approverSource] || 'tu líder'
}

// Estado visible de una solicitud según quién la mira
function stateOf(req: TaskApprovalRequest) {
  if (req.status === 'pending') {
    return box.value === 'inbox'
      ? { label: 'Requiere tu aprobación', text: 'text-amber-700', bar: 'bg-amber-400' }
      : { label: `En espera de ${approverNames(req)}`, text: 'text-sky-700', bar: 'bg-sky-400' }
  }
  if (req.status === 'approved' && req.autoApproved) {
    return { label: 'Autoaprobada', text: 'text-violet-700', bar: 'bg-violet-500' }
  }
  if (req.status === 'approved') {
    return { label: 'Aprobada', text: 'text-emerald-700', bar: 'bg-emerald-500' }
  }
  if (req.status === 'rejected') {
    return { label: 'Rechazada', text: 'text-rose-700', bar: 'bg-rose-500' }
  }
  return { label: box.value === 'mine' ? 'Retirada' : 'Cancelada', text: 'text-slate-500', bar: 'bg-slate-300' }
}

// Resumen en una línea de cómo quedó la solicitud (para quien pidió)
function outcomeOf(req: TaskApprovalRequest) {
  const steps = stepsOf(req)
  const last = steps[steps.length - 1]
  if (!last) return ''
  if (req.status === 'pending' && !req.autoApproved) return `Lo revisa ${approverNames(req)}`
  return last.detail
}

// Línea de tiempo para quien pidió: Enviada → En revisión → Resultado
function stepsOf(req: TaskApprovalRequest) {
  const done = { dot: 'bg-emerald-500 text-white', line: 'bg-emerald-300', titleClass: 'text-slate-700', icon: 'fas fa-check' }
  const current = { dot: 'bg-sky-500 text-white ring-4 ring-sky-100', line: 'bg-slate-200', titleClass: 'text-sky-700', icon: 'fas fa-hourglass-half' }
  const todo = { dot: 'bg-slate-100 text-slate-300', line: 'bg-slate-200', titleClass: 'text-slate-400', icon: 'fas fa-circle text-[6px]' }

  const sent = { ...done, title: 'Enviada', detail: relative(req.createdAt) }

  // Con autoaprobación no hubo revisión: se aplicó al momento y quedó el registro
  if (req.autoApproved) {
    return [
      { ...done, title: 'Registrada', detail: relative(req.createdAt) },
      {
        ...done,
        dot: 'bg-violet-600 text-white',
        icon: 'fas fa-bolt',
        titleClass: 'text-violet-700',
        title: 'Autoaprobada',
        detail: req.kind === 'deletion'
          ? 'Eliminada con tu permiso especial'
          : `Nueva entrega: ${formatDate(req.requestedDueDate)}`
      }
    ]
  }

  if (req.status === 'pending') {
    return [
      sent,
      { ...current, title: 'En revisión', detail: `Lo revisa ${approverNames(req)}` },
      { ...todo, title: 'Resultado', detail: 'Te avisaremos en la campana' }
    ]
  }

  const reviewer = req.reviewedBy?.name
  const when = req.reviewedAt ? relative(req.reviewedAt) : ''
  if (req.status === 'cancelled') {
    return [
      sent,
      { ...todo, dot: 'bg-slate-300 text-white', icon: 'fas fa-ban', title: 'Retirada', detail: req.reviewComment || 'La retiraste antes de que la revisaran' }
    ]
  }
  const approved = req.status === 'approved'
  const outcomeDetail = approved
    ? (req.kind === 'deletion' ? 'La tarea fue eliminada' : `Nueva entrega: ${formatDate(req.requestedDueDate)}`)
    : (req.reviewComment ? `“${req.reviewComment}”` : 'Se mantiene como estaba')
  return [
    sent,
    { ...done, title: 'Revisada', detail: reviewer ? `Por ${reviewer} ${when}` : when },
    {
      ...done,
      dot: approved ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white',
      icon: approved ? 'fas fa-check' : 'fas fa-xmark',
      titleClass: approved ? 'text-emerald-700' : 'text-rose-700',
      title: approved ? 'Aprobada' : 'Rechazada',
      detail: outcomeDetail
    }
  ]
}

function goTo(target: Box) {
  if (box.value === target) return
  box.value = target
  statusFilter.value = 'pending'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    summary.value = await taskApprovalService.summary()
    // El contador del menú lateral (App.vue) se actualiza con este evento
    window.dispatchEvent(new CustomEvent(APPROVALS_CHANGED_EVENT, { detail: summary.value }))
    // Al abrir: quien aprueba entra a su bandeja; los demás, a sus solicitudes
    if (!initialized) {
      initialized = true
      const target: Box = summary.value.canReview ? 'inbox' : 'mine'
      if (box.value !== target) {
        box.value = target // el watch vuelve a cargar la lista
        return
      }
    }
    if (!summary.value.canReview && box.value !== 'mine') box.value = 'mine'
    if (box.value === 'trash') {
      const trash = await taskApprovalService.trash()
      trashItems.value = trash.items
      retentionDays.value = trash.retentionDays
      return
    }
    requests.value = await taskApprovalService.list(box.value, statusFilter.value, kindFilter.value || undefined)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudieron cargar las solicitudes'
  } finally {
    loading.value = false
  }
}

async function review(req: TaskApprovalRequest, action: 'approve' | 'reject') {
  // Aprobar una eliminación no se puede deshacer: se confirma antes
  if (action === 'approve' && req.kind === 'deletion') {
    const confirmation = await confirmDelete(req.entityTitle || 'esta tarea')
    if (!confirmation.isConfirmed) return
  }

  busyId.value = req._id
  try {
    const comment = comments[req._id] || ''
    if (action === 'approve') {
      await taskApprovalService.approve(req._id, comment)
      showSuccess(req.kind === 'deletion'
        ? 'Eliminación aprobada: la tarea quedó en la papelera'
        : 'Ampliación aprobada: la nueva fecha ya quedó en la tarea')
    } else {
      await taskApprovalService.reject(req._id, comment)
      showSuccess('Solicitud rechazada. Le avisamos a quien la pidió')
    }
    delete comments[req._id]
    delete showComment[req._id]
    await load()
  } catch (e) {
    showError(e instanceof Error ? e.message : 'No se pudo procesar la solicitud')
  } finally {
    busyId.value = null
  }
}

async function cancel(req: TaskApprovalRequest) {
  busyId.value = req._id
  try {
    await taskApprovalService.cancel(req._id)
    showSuccess('Retiraste la solicitud')
    await load()
  } catch (e) {
    showError(e instanceof Error ? e.message : 'No se pudo retirar la solicitud')
  } finally {
    busyId.value = null
  }
}

async function restoreItem(item: TrashedItem) {
  busyId.value = item._id
  try {
    await taskApprovalService.restore(item._id)
    showSuccess(`"${item.title}" se recuperó`)
    await load()
  } catch (e) {
    showError(e instanceof Error ? e.message : 'No se pudo recuperar')
  } finally {
    busyId.value = null
  }
}

function daysLeft(item: TrashedItem) {
  return differenceInCalendarDays(new Date(item.expiresAt), new Date())
}

function openEntity(req: TaskApprovalRequest) {
  activityModalStore.open(String(req.entityId), req.entityType)
}

function formatDate(date: string | null) {
  if (!date) return 'Sin fecha'
  return format(new Date(date), "d MMM yyyy, HH:mm", { locale: es })
}

function relative(date: string) {
  return formatDistanceToNow(new Date(date), { locale: es, addSuffix: true })
}

function extraDays(req: TaskApprovalRequest) {
  if (!req.currentDueDate || !req.requestedDueDate) return ''
  const days = differenceInCalendarDays(new Date(req.requestedDueDate), new Date(req.currentDueDate))
  if (days <= 0) return ''
  return days === 1 ? '+1 día' : `+${days} días`
}

watch([box, statusFilter, kindFilter], load)
// Solicitudes creadas desde el modal de la tarea (abierto encima de esta página)
const onRefreshRequested = () => { load() }
onMounted(() => {
  load()
  window.addEventListener(APPROVALS_REFRESH_EVENT, onRefreshRequested)
})
onBeforeUnmount(() => window.removeEventListener(APPROVALS_REFRESH_EVENT, onRefreshRequested))
</script>
