<template>
  <div class="flex flex-col gap-4 h-full min-h-0 motion-page">

    <!-- Cabecera compacta -->
    <div class="flex-shrink-0 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 text-primary-600 flex items-center justify-center shrink-0">
          <i class="fas fa-users text-sm"></i>
        </div>
        <div class="min-w-0">
          <h1 class="text-base font-black text-slate-800 tracking-tight leading-tight">Equipo</h1>
          <p class="text-xs text-slate-500 truncate">
            {{ teamStore.members.length }} colaboradores · {{ activeMembers }} activos
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Departamentos: contadores que también filtran -->
        <div class="hidden sm:flex items-center gap-1.5">
          <button
            v-for="dept in departmentSummary"
            :key="dept.value"
            type="button"
            @click="selectedDepartment = selectedDepartment === dept.value ? '' : dept.value"
            :aria-pressed="selectedDepartment === dept.value"
            :title="`Filtrar por ${dept.label}`"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors"
            :class="selectedDepartment === dept.value
              ? 'bg-primary-50 border-primary-200 text-primary-700'
              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'"
          >
            <i :class="dept.icon" class="text-[10px] opacity-70"></i>
            {{ dept.label }}
            <span class="tabular-nums font-black" :class="selectedDepartment === dept.value ? 'text-primary-700' : 'text-slate-700'">{{ dept.count }}</span>
          </button>
        </div>
        <PermissionGuard :permissions="['create-team']" :fallback="false">
          <button
            type="button"
            @click="showCreateModal = true"
            class="inline-flex items-center gap-1.5 px-3 py-[7px] bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            <i class="fas fa-plus text-[10px]"></i> Nuevo miembro
          </button>
        </PermissionGuard>
      </div>
    </div>

    <!-- Buscador y filtros -->
    <div class="flex-shrink-0 flex flex-wrap items-center gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100 shadow-sm">
      <div class="relative flex-1 min-w-[180px]">
        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar por nombre, correo o departamento"
          class="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 transition-colors"
        >
      </div>
      <div class="w-full sm:w-40">
        <CustomSelect v-model="selectedDepartment" size="sm" :options="[{ value: '', label: 'Todos los departamentos' }, ...departmentOptions]" />
      </div>
      <div class="w-full sm:w-40">
        <CustomSelect v-model="selectedRole" size="sm" searchable :options="[{ value: '', label: 'Todos los roles' }, ...roleOptions]" />
      </div>
      <div class="w-full sm:w-32">
        <CustomSelect v-model="selectedStatus" size="sm" :options="[{ value: '', label: 'Todos' }, { value: 'true', label: 'Activos' }, { value: 'false', label: 'Inactivos' }]" />
      </div>
      <span v-if="hasFilters" class="text-[11px] text-slate-400 tabular-nums">
        {{ filteredMembers.length }} de {{ teamStore.members.length }}
        <button type="button" @click="clearFilters" class="ml-1 font-bold text-primary-600 hover:text-primary-700">Limpiar</button>
      </span>
    </div>

    <!-- Lista -->
    <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        <!-- Encabezado de columnas (escritorio) -->
        <div class="hidden md:flex items-center gap-x-4 px-4 py-2 bg-slate-50/70 border-b border-slate-100 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400">
          <div class="flex-1 min-w-0">Colaborador</div>
          <div class="w-32 shrink-0">Rol</div>
          <div class="w-36 shrink-0">Departamento</div>
          <div class="w-20 shrink-0">Estado</div>
          <div class="hidden xl:block w-28 shrink-0">Último acceso</div>
          <div class="w-24 shrink-0 text-right">Acciones</div>
        </div>

        <div v-if="teamStore.loading && teamStore.members.length === 0" class="p-4">
          <Skeleton preset="list" :rows="7" />
        </div>

        <div v-else-if="filteredMembers.length === 0" class="empty-state">
          <div class="empty-state__icon"><i class="fas fa-users"></i></div>
          <p class="empty-state__title">No se encontraron miembros</p>
          <p class="empty-state__text">Prueba con otro nombre o quita los filtros de departamento, rol y estado.</p>
        </div>

        <div v-else class="motion-stagger">
          <div
            v-for="member in filteredMembers"
            :key="member._id"
            class="group flex flex-wrap md:flex-nowrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 transition-colors"
            :class="{ 'opacity-60': !member.isActive }"
          >
            <!-- Colaborador -->
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="relative shrink-0">
                <UserAvatar :name="member.name" :photo="member.photo" size="sm" class="rounded-xl" />
                <span
                  v-if="member.departmentRole === 'leader'"
                  class="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center"
                  title="Líder de departamento"
                >
                  <i class="fas fa-crown text-white" style="font-size: 6px"></i>
                </span>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="text-[13px] font-bold text-slate-800 truncate">{{ member.name }}</span>
                  <span
                    v-if="member.selfApproval"
                    class="badge badge-violet shrink-0"
                    title="Autoaprobación: amplía plazos y elimina sin pedir autorización (queda registro)"
                  ><i class="fas fa-bolt" style="font-size: 8px"></i> Auto</span>
                </div>
                <p class="text-[11px] text-slate-400 truncate">{{ member.email }}</p>
              </div>
            </div>

            <!-- Acciones (en móvil van en la misma línea que el nombre) -->
            <div class="flex items-center gap-0.5 shrink-0 md:order-last md:w-24 md:justify-end md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
              <button
                type="button"
                title="Editar miembro"
                @click="editMember(member)"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <i class="fas fa-pen text-[11px]"></i>
              </button>
              <button
                type="button"
                :title="member.isActive ? 'Desactivar miembro' : 'Activar miembro'"
                @click="toggleMemberStatus(member)"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 transition-colors"
                :class="member.isActive ? 'hover:text-amber-600 hover:bg-amber-50' : 'hover:text-emerald-600 hover:bg-emerald-50'"
              >
                <i :class="member.isActive ? 'fas fa-user-slash' : 'fas fa-user-check'" class="text-[11px]"></i>
              </button>
              <button
                v-if="authStore.user?.role === 'admin'"
                type="button"
                title="Eliminar miembro permanentemente"
                @click="permanentDeleteMember(member)"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <i class="fas fa-trash-alt text-[11px]"></i>
              </button>
            </div>

            <!-- Columnas de escritorio -->
            <div class="hidden md:block w-32 shrink-0 min-w-0">
              <span class="badge" :class="getRoleBadgeClass(member.role)">{{ getRoleDisplayName(member.role) }}</span>
            </div>
            <div class="hidden md:block w-36 shrink-0 text-xs text-slate-600 truncate">{{ member.department || 'General' }}</div>
            <div class="hidden md:flex w-20 shrink-0 items-center gap-1.5 text-[11px] font-semibold" :class="member.isActive ? 'text-emerald-700' : 'text-slate-400'">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="member.isActive ? 'bg-emerald-500' : 'bg-slate-300'"></span>
              {{ member.isActive ? 'Activo' : 'Inactivo' }}
            </div>
            <div class="hidden xl:block w-28 shrink-0 text-[11px] text-slate-500 tabular-nums truncate">{{ formatDate(member.lastLogin) }}</div>

            <!-- Línea meta (móvil) -->
            <div class="md:hidden basis-full flex flex-wrap items-center gap-x-3 gap-y-1 pl-11 text-[11px] text-slate-500">
              <span class="badge" :class="getRoleBadgeClass(member.role)">{{ getRoleDisplayName(member.role) }}</span>
              <span class="truncate">{{ member.department || 'General' }}</span>
              <span class="flex items-center gap-1.5 font-semibold" :class="member.isActive ? 'text-emerald-700' : 'text-slate-400'">
                <span class="w-1.5 h-1.5 rounded-full" :class="member.isActive ? 'bg-emerald-500' : 'bg-slate-300'"></span>
                {{ member.isActive ? 'Activo' : 'Inactivo' }}
              </span>
              <span class="tabular-nums">{{ formatDate(member.lastLogin) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Paginación -->
      <div v-if="pagination.pages > 1" class="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          title="Página anterior"
          @click="changePage(pagination.page - 1)"
          :disabled="pagination.page === 1"
          class="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <i class="fas fa-chevron-left text-[10px]"></i>
        </button>
        <div class="seg">
          <button
            v-for="p in pagination.pages"
            :key="p"
            type="button"
            @click="changePage(p)"
            :aria-pressed="p === pagination.page"
            class="min-w-[32px] tabular-nums"
          >{{ p }}</button>
        </div>
        <button
          type="button"
          title="Página siguiente"
          @click="changePage(pagination.page + 1)"
          :disabled="pagination.page === pagination.pages"
          class="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <i class="fas fa-chevron-right text-[10px]"></i>
        </button>
      </div>
    </div>

    <!-- Modal crear / editar (misma estética que el modal de actividades) -->
    <div
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300"
      @click="closeModal"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        @click.stop
      >
        <div class="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/30 shrink-0">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100 shrink-0">
              <i :class="showCreateModal ? 'fas fa-user-plus' : 'fas fa-user-pen'" class="text-primary-500 text-sm"></i>
            </div>
            <div class="min-w-0">
              <h2 class="text-lg font-black text-slate-800 tracking-tight leading-tight">
                {{ showCreateModal ? 'Nuevo miembro' : 'Editar miembro' }}
              </h2>
              <p class="text-[11px] text-slate-400 truncate">
                {{ showCreateModal ? 'Define el acceso y el perfil del colaborador.' : editingMember?.email }}
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="closeModal"
            title="Cerrar sin guardar"
            class="w-9 h-9 shrink-0 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
          >
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>

        <form @submit.prevent="submitForm" class="flex flex-col min-h-0">
          <div class="px-5 py-4 overflow-y-auto custom-scrollbar">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nombre completo *</label>
                <input v-model="formData.name" required placeholder="Ej: Ana Rodríguez"
                  class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Correo electrónico *</label>
                <input v-model="formData.email" type="email" required placeholder="nombre@empresa.com"
                  class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Rol *</label>
                <CustomSelect v-model="formData.role" size="md" searchable placeholder="Selecciona un rol" :options="roleOptions" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Departamento</label>
                <CustomSelect v-model="formData.department" size="md" placeholder="Sin departamento" :options="[{ value: '', label: 'Sin departamento' }, ...departmentOptions]" />
              </div>

              <div v-if="showCreateModal || (showEditModal && authStore.user?.role === 'admin')">
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {{ showCreateModal ? 'Contraseña temporal *' : 'Nueva contraseña' }}
                </label>
                <input v-model="formData.password" type="password" :required="showCreateModal" :placeholder="showCreateModal ? 'Mínimo 6 caracteres' : 'Dejar vacío para no cambiarla'"
                  class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Teléfono</label>
                <input v-model="formData.phone" placeholder="Opcional"
                  class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Rol en el departamento</label>
                <div class="seg w-full">
                  <button type="button" class="flex-1 flex items-center justify-center gap-1.5" @click="formData.departmentRole = 'member'" :aria-pressed="formData.departmentRole !== 'leader'">
                    <i class="fas fa-user text-[10px]"></i> Miembro
                  </button>
                  <button type="button" class="flex-1 flex items-center justify-center gap-1.5" @click="formData.departmentRole = 'leader'" :aria-pressed="formData.departmentRole === 'leader'">
                    <i class="fas fa-crown text-[10px] text-amber-500"></i> Líder
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Permiso especial</label>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="formData.selfApproval"
                  @click="formData.selfApproval = !formData.selfApproval"
                  title="Amplía plazos y elimina tareas sin pedir autorización; cada acción queda registrada en Autorizaciones. Solo un administrador puede cambiarlo."
                  class="w-full h-[42px] px-3 rounded-lg border text-left transition-colors flex items-center gap-2.5"
                  :class="formData.selfApproval ? 'bg-primary-50 border-primary-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'"
                >
                  <i class="fas fa-bolt text-xs w-4 text-center shrink-0" :class="formData.selfApproval ? 'text-primary-600' : 'text-slate-400'"></i>
                  <span class="flex-1 min-w-0 leading-tight">
                    <span class="block text-xs font-bold" :class="formData.selfApproval ? 'text-primary-700' : 'text-slate-700'">Autoaprobación</span>
                    <span class="block text-[10px] text-slate-400 truncate">Sin pedir permiso · queda registrado</span>
                  </span>
                  <span class="relative w-8 h-[18px] rounded-full shrink-0 transition-colors" :class="formData.selfApproval ? 'bg-primary-600' : 'bg-slate-300'">
                    <span class="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform" :class="formData.selfApproval ? 'translate-x-3.5' : 'translate-x-0'"></span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/30 shrink-0">
            <button type="button" @click="closeModal" class="px-5 py-2 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors font-bold text-sm">Cancelar</button>
            <button type="submit" :disabled="isSubmitting" class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm flex items-center gap-2">
              <span v-if="isSubmitting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              <i v-else class="fas fa-check"></i>
              {{ isSubmitting ? 'Guardando...' : (showCreateModal ? 'Crear miembro' : 'Guardar cambios') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Skeleton from '@/components/ui/Skeleton.vue'
import CustomSelect from '@/components/ui/CustomSelect.vue'
import { ref, computed, onMounted, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useTeamStore } from '../stores'
import { useNotifications } from '../composables/useNotifications'
import PermissionGuard from '../components/PermissionGuard.vue'
import UserAvatar from '../components/ui/UserAvatar.vue'
import { rolesService, type Role } from '../services/rolesService'
import type { TeamMember } from '../types'

const authStore = useAuthStore()
const teamStore = useTeamStore()
const { confirmDelete, showSuccess, showError } = useNotifications()

// State
const searchQuery = ref('')
const selectedRole = ref('')
const selectedStatus = ref('')
const selectedDepartment = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const isSubmitting = ref(false)
const roles = ref<Role[]>([])
const baseRolesNames = ['admin', 'manager', 'support', 'development', 'fullstack', 'employee', 'viewer', 'client']

const allAvailableRoles = computed(() => {
  // Start with dynamic roles (they win over base roles)
  const combined: Role[] = []
  const seen = new Set<string>()
  const displayKey = (name: string) => getRoleDisplayName(name).trim().toLowerCase()

  roles.value.forEach(r => {
    const key = displayKey(r.name)
    if (seen.has(key)) return
    seen.add(key)
    combined.push(r)
  })

  // Add base roles only if no role with the same displayed name exists
  baseRolesNames.forEach(name => {
    const key = displayKey(name)
    if (seen.has(key) || combined.some(r => r.name.toLowerCase() === name.toLowerCase())) return
    seen.add(key)
    combined.push({
      name: name,
      isSystem: true,
      permissions: {} as any // Will use backend defaults
    })
  })

  return combined
})

const roleOptions = computed(() =>
  allAvailableRoles.value.map(role => ({ value: role.name, label: getRoleDisplayName(role.name) }))
)

const departmentOptions = [
  { value: 'TI', label: 'TI' },
  { value: 'Comercial', label: 'Comercial' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Customer Success', label: 'Customer Success' }
]

const editingMember = ref<TeamMember | null>(null)
const pagination = reactive({
  page: 1,
  limit: 500,
  total: 0,
  pages: 0
})

// Form data
const formData = reactive({
  name: '',
  email: '',
  password: '',
  role: '' as TeamMember['role'],
  department: '',
  position: '',
  phone: '',
  supervisor: '',
  departmentRole: 'member' as 'member' | 'leader',
  selfApproval: false
})

// Computed
const activeMembers = computed(() => teamStore.members.filter(m => m.isActive).length)

// Contadores por departamento para la cabecera (sólo presentación)
const departmentIcons: Record<string, string> = {
  'TI': 'fas fa-laptop-code',
  'Comercial': 'fas fa-handshake',
  'Marketing': 'fas fa-bullhorn',
  'Customer Success': 'fas fa-headset'
}
const departmentSummary = computed(() =>
  departmentOptions.map(d => ({
    ...d,
    icon: departmentIcons[d.value] || 'fas fa-building',
    count: teamStore.members.filter(m => m.department?.toLowerCase() === d.value.toLowerCase()).length
  }))
)

const hasFilters = computed(() => !!(searchQuery.value || selectedRole.value || selectedStatus.value || selectedDepartment.value))
const clearFilters = () => {
  searchQuery.value = ''
  selectedRole.value = ''
  selectedStatus.value = ''
  selectedDepartment.value = ''
}

const filteredMembers = computed(() => {
  let filtered = teamStore.members

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(member => 
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.department?.toLowerCase().includes(query)
    )
  }

  if (selectedRole.value) {
    filtered = filtered.filter(member => member.role === selectedRole.value)
  }

  if (selectedStatus.value) {
    const isActive = selectedStatus.value === 'true'
    filtered = filtered.filter(member => member.isActive === isActive)
  }

  if (selectedDepartment.value) {
    filtered = filtered.filter(member => member.department?.toLowerCase() === selectedDepartment.value.toLowerCase())
  }

  return filtered.sort((a,b) => (a.isActive === b.isActive) ? 0 : a.isActive ? -1 : 1)
})

// Methods
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Nunca'
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

const getRoleDisplayName = (role: string) => {
  const roleNames: Record<string, string> = {
    admin: 'Administrador',
    manager: 'Gerencia',
    support: 'Soporte Técnico',
    development: 'Especialista TI',
    fullstack: 'Ingeniero Soft.',
    employee: 'Colaborador',
    viewer: 'Consultor',
    client: 'Cliente'
  }
  return roleNames[role] || role
}

const getRoleBadgeClass = (role: string) => {
  const classes: Record<string, string> = {
    admin: 'badge-danger',
    manager: 'badge-warning',
    support: 'badge-violet',
    development: 'badge-primary',
    fullstack: 'badge-primary',
    employee: 'badge-success',
    viewer: 'badge-slate'
  }
  return classes[role] || classes.viewer
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingMember.value = null
  Object.assign(formData, { name: '', email: '', password: '', role: '', department: '', position: '', phone: '', supervisor: '', departmentRole: 'member', selfApproval: false })
}

const editMember = (member: TeamMember) => {
  editingMember.value = member
  Object.assign(formData, {
    name: member.name,
    email: member.email,
    password: '',
    role: member.role,
    department: member.department || '',
    position: member.position || '',
    phone: member.phone || '',
    supervisor: member.supervisor || '',
    departmentRole: member.departmentRole || 'member',
    selfApproval: member.selfApproval === true
  })
  showEditModal.value = true
}

const submitForm = async () => {
  try {
    isSubmitting.value = true
    // Reemplaza el `required` del select nativo de rol
    if (!formData.role) {
      showError('Validación', 'Selecciona un rol')
      isSubmitting.value = false
      return
    }
    if (showCreateModal.value) {
      // Validaciones extra
      if (formData.password.length < 6) {
        showError('Validación', 'La contraseña debe tener al menos 6 caracteres')
        isSubmitting.value = false
        return
      }
      await teamStore.createMember(formData)
    } else if (editingMember.value) {
      const { password, ...updateData } = formData
      await teamStore.updateMember(editingMember.value._id!, updateData)
      
      // Si se proporcionó una contraseña y el usuario es admin, actualizarla
      if (password && authStore.user?.role === 'admin') {
        if (password.length < 6) {
          showError('Validación', 'La nueva contraseña debe tener al menos 6 caracteres')
          isSubmitting.value = false
          return
        }
        await teamStore.updateMemberPassword(editingMember.value._id!, password)
        showSuccess('Contraseña', 'La contraseña ha sido actualizada correctamente')
      }
    }
    closeModal()
  } catch (error: any) {
    console.error('Error submitting form:', error)
    const message = error.response?.data?.message || error.message || 'Error al guardar los datos'
    showError('Error en el formulario', message)
  } finally {
    isSubmitting.value = false
  }
}

const toggleMemberStatus = async (member: TeamMember) => {
  try {
    if (member.isActive) {
      await teamStore.deleteMember(member._id!)
    } else {
      await teamStore.activateMember(member._id!)
    }
  } catch (error: any) {
    console.error('Error toggling status:', error)
  }
}

const permanentDeleteMember = async (member: TeamMember) => {
  const confirmed = await confirmDelete(
    `¿Estás seguro de eliminar permanentemente a ${member.name}?`,
    "Esta acción borrará todos sus datos de la base de datos de forma irreversible."
  )
  
  if (confirmed) {
    try {
      await teamStore.hardDeleteMember(member._id!)
      showSuccess("Usuario eliminado permanentemente")
    } catch (error: any) {
      showError(error.message || "Error al eliminar usuario")
    }
  }
}

const changePage = (page: number) => {
  if (page < 1 || page > pagination.pages) return
  teamStore.fetchTeam(page, pagination.limit).then(res => {
    if (res) Object.assign(pagination, res)
  })
}

onMounted(async () => {
  // Load roles
  try {
    roles.value = await rolesService.getAll()
  } catch (error) {
    console.error('Error loading roles:', error)
  }

  if (authStore.canViewTeam) {
    const res = await teamStore.fetchTeam(pagination.page, pagination.limit)
    if (res) Object.assign(pagination, res)
  }
})
</script>
