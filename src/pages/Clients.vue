<template>
  <div class="flex flex-col gap-4 h-full min-h-0">
    <!-- Cabecera compacta -->
    <PageHeader icon="fas fa-building" title="Clientes">
      <template #subtitle>{{ clients.length }} clientes · Gestiona tus contactos y relaciones comerciales.</template>
      <PermissionGuard :permissions="['create-clients']" :fallback="false">
        <button
          @click="showModal = true; resetForm()"
          class="btn-primary btn-sm"
        >
          <i class="fas fa-plus text-[10px]"></i>
          Nuevo cliente
        </button>
      </PermissionGuard>
    </PageHeader>

    <!-- Buscador y orden -->
    <div class="flex-shrink-0 flex flex-wrap items-center gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
      <div class="relative flex-1 min-w-[220px] max-w-md">
        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar por empresa, contacto o correo..."
          class="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
        />
      </div>
      <span class="text-xs text-slate-500 tabular-nums">{{ filteredClients.length }} clientes</span>
      <div class="flex items-center gap-2 ml-auto">
        <span class="text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">Ordenar por</span>
        <div class="w-44">
          <CustomSelect
            v-model="sortBy"
            :options="[{ value: 'company', label: 'Empresa / Organización' }, { value: 'name', label: 'Nombre de contacto' }, { value: 'createdAt', label: 'Recientes' }]"
            size="sm"
          />
        </div>
      </div>
    </div>

    <!-- Lista -->
    <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px] relative">
        <div v-if="loading" class="p-4 sm:p-6">
          <Skeleton preset="table" :rows="7" :cols="5" />
        </div>
      
        <div v-else-if="error" class="flex-1 flex items-center justify-center p-12">
          <div class="max-w-md w-full text-center p-8 bg-red-50 rounded-2xl border border-red-100">
            <ExclamationTriangleIcon class="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 class="text-red-900 font-black text-lg mb-2">Error de conexión</h3>
            <p class="text-red-600/70 text-sm mb-6">{{ error }}</p>
            <button @click="fetchClients" class="btn-danger btn-sm">
              <i class="fas fa-sync mr-2"></i> Reintentar
            </button>
          </div>
        </div>
      
        <div v-else class="flex-1 motion-content-in">
          <!-- Desktop Table View -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full table-auto divide-y divide-slate-100">
              <thead>
                <tr class="bg-slate-50/50">
                  <th class="px-5 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Empresa / Organización</th>
                  <th class="px-5 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Nombre de Contacto</th>
                  <th class="px-5 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Correo / WhatsApp</th>
                  <th class="hidden xl:table-cell px-5 py-2.5 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">Registro</th>
                  <th class="px-5 py-2.5 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr 
                  v-for="client in paginatedClients" 
                  :key="client._id"
                  class="hover:bg-slate-50/80 transition-all group"
                >
                  <td class="px-5 py-3">
                    <router-link :to="`/clients/${client._id}`" class="flex items-center gap-3 w-fit max-w-[280px]" title="Abrir el expediente del cliente">
                      <div class="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 font-black text-sm shrink-0">
                        {{ clientOrgName(client).charAt(0).toUpperCase() }}
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="text-slate-900 font-bold text-sm leading-tight truncate group-hover:text-primary-600 group-hover:underline transition-colors">{{ clientOrgName(client) }}</span>
                          <span v-if="client.status === 'inactive'" class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">Inactivo</span>
                        </div>
                        <div class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">{{ clientNit(client) ? `NIT ${clientNit(client)}` : 'Sin NIT' }}</div>
                      </div>
                    </router-link>
                  </td>
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-2 max-w-[200px]">
                      <i class="fas fa-user text-slate-300 text-[11px] shrink-0"></i>
                      <span class="text-slate-700 text-xs font-bold truncate">{{ client.name || '—' }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-3">
                    <div class="space-y-1 max-w-[240px]">
                      <div class="text-slate-600 text-[11px] font-bold flex items-center gap-2 min-w-0">
                        <i class="fas fa-envelope text-slate-300 w-3 text-center shrink-0"></i>
                        <span class="truncate">{{ client.email }}</span>
                      </div>
                      <div class="text-slate-400 text-[11px] font-medium flex items-center gap-2 min-w-0">
                        <i class="fab fa-whatsapp text-slate-300 w-3 text-center shrink-0"></i>
                        <span class="truncate">{{ client.phone }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="hidden xl:table-cell px-5 py-3 whitespace-nowrap">
                    <div class="flex flex-col items-center">
                      <span class="text-slate-700 text-xs font-bold">{{ formatDate(client.createdAt) }}</span>
                      <span class="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Confirmado</span>
                    </div>
                  </td>
                  <td class="px-5 py-3 whitespace-nowrap text-right">
                    <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0">
                      <router-link :to="`/clients/${client._id}`" class="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-all" title="Ver expediente y editar datos del cliente">
                        <i class="fas fa-arrow-right text-sm"></i>
                      </router-link>
                      <PermissionGuard :permissions="['delete-clients']" :fallback="false">
                        <button @click="confirmDelete(client)" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Eliminar o inactivar este cliente">
                          <TrashIcon class="w-4 h-4" />
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Card View -->
          <div class="md:hidden p-4 space-y-4">
            <div 
              v-for="client in paginatedClients" 
              :key="client._id"
              class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div class="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
                <router-link :to="`/clients/${client._id}`" class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 font-black text-sm">
                    {{ clientOrgName(client).charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-slate-900 font-bold text-sm">{{ clientOrgName(client) }}</h3>
                      <span v-if="client.status === 'inactive'" class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">Inactivo</span>
                    </div>
                    <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest">Contacto: {{ client.name || '—' }}</p>
                  </div>
                </router-link>
              </div>
              
              <div class="space-y-2 mb-4">
                <div class="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <i class="fas fa-envelope text-slate-300 w-4"></i> {{ client.email }}
                </div>
                <div class="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <i class="fab fa-whatsapp text-slate-300 w-4"></i> {{ client.phone }}
                </div>
              </div>

              <router-link :to="`/clients/${client._id}`" class="block w-full text-center py-2.5 bg-primary-50 text-primary-700 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:bg-primary-100">
                Ver Expediente
              </router-link>
            </div>
          </div>
          
          <!-- Empty State -->
          <div v-if="filteredClients.length === 0" class="empty-state m-4">
            <div class="empty-state__icon"><i class="fas fa-building"></i></div>
            <p class="empty-state__title">
              {{ searchTerm ? 'Sin coincidencias' : 'Directorio vacío' }}
            </p>
            <p class="empty-state__text">
              {{ searchTerm ? 'No encontramos ningún cliente que coincida con tu búsqueda. Intenta con otros términos.' : 'Aún no tienes clientes registrados en la plataforma. Comienza a construir tu base de contactos.' }}
            </p>
            <button v-if="!searchTerm" @click="showModal = true; resetForm()" class="btn-primary btn-sm mt-2">
              <i class="fas fa-plus text-[10px]"></i>
              Crear el primer cliente
            </button>
            <button v-else @click="searchTerm = ''" class="btn-secondary btn-sm mt-2">Limpiar búsqueda</button>
          </div>
        </div>
      </div>

      <!-- Paginación -->
      <div v-if="totalPages > 1" class="mt-4 flex items-center justify-center gap-2">
         <button title="Página anterior"
           @click="currentPage--"
           :disabled="currentPage === 1"
           class="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
         >
           <i class="fas fa-chevron-left text-xs"></i>
         </button>

         <div class="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <button
              v-for="page in totalPages"
              :key="page"
              @click="currentPage = page"
              :class="currentPage === page ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'"
              class="w-7 h-7 rounded-lg text-xs font-black transition-all"
            >
              {{ page }}
            </button>
         </div>

         <button title="Página siguiente"
           @click="currentPage++"
           :disabled="currentPage === totalPages"
           class="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
         >
           <i class="fas fa-chevron-right text-xs"></i>
         </button>
      </div>
    </div>
    
    <!-- Create Modal — la edición se centraliza en el expediente del cliente (/clients/:id) -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="showModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in border border-slate-100">
        <div class="flex items-center justify-between p-5 border-b border-slate-50">
          <div>
            <h3 class="text-sm font-extrabold text-slate-800 leading-tight">Nuevo Cliente</h3>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Completa los datos de contacto</p>
          </div>
          <button title="Cerrar" @click="showModal = false" class="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form @submit.prevent="saveClient" class="p-5">
          <div class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Empresa / Organización</label>
              <input v-model="form.company" type="text" required placeholder="Nombre de la empresa" class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all" />
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">NIT</label>
              <input v-model="form.nit" type="text" placeholder="Ej: 900123456-7" class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all" />
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre de Contacto</label>
              <input v-model="form.name" type="text" required placeholder="Ej: Juan Pérez" class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all" />
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Correo Electrónico</label>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="correo@ejemplo.com"
                class="w-full bg-slate-50 border rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/10 transition-all"
                :class="emailError ? 'border-red-300' : 'border-slate-100'"
              />
              <p v-if="emailError" class="text-red-500 text-[11px] font-bold pl-1">{{ emailError }}</p>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">WhatsApp</label>
              <input v-model="form.phone" type="tel" required placeholder="+57 ..." class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/10 transition-all" />
            </div>
          </div>

          <div class="flex items-center gap-4 mt-5 pt-4 border-t border-slate-50">
            <button type="button" @click="showModal = false" class="btn-secondary flex-1">Cancelar</button>
            <button type="submit" :disabled="loading" class="btn-primary flex-1">
              <i v-if="!loading" class="fas fa-check mr-2"></i>
              <div v-else class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="showDeleteModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in border border-slate-100 p-5 text-center">
        <div class="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrashIcon class="w-10 h-10" />
        </div>
        <template v-if="!deleteBlockedMessage">
          <h3 class="text-sm font-extrabold text-slate-800 mb-2">¿Eliminar Cliente?</h3>
          <p class="text-slate-400 text-sm font-medium mb-3 leading-relaxed">
            Se eliminará permanentemente a <span class="text-slate-900 font-bold">{{ clientToDelete ? clientOrgName(clientToDelete) : '' }}</span>.
          </p>
          <p class="text-slate-400 text-xs font-medium mb-8 leading-relaxed bg-slate-50 rounded-xl px-3 py-2">
            <i class="fas fa-circle-info mr-1"></i>Si el cliente ya tiene proyectos, tareas o historial, no se borrará: podrás inactivarlo para conservar su trazabilidad.
          </p>
          <div class="flex flex-col gap-3">
            <button @click="deleteClient" :disabled="loading" class="btn-danger w-full">
              <i v-if="!loading" class="fas fa-trash-alt mr-2"></i>
              <div v-else class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 mx-auto"></div>
              {{ loading ? 'Eliminando...' : 'Sí, Eliminar' }}
            </button>
            <button @click="showDeleteModal = false" class="btn-ghost w-full">Cancelar</button>
          </div>
        </template>

        <!-- El cliente tiene historial asociado: no se puede borrar, se ofrece inactivar -->
        <template v-else>
          <h3 class="text-sm font-extrabold text-slate-800 mb-2">No se puede eliminar</h3>
          <p class="text-slate-400 text-sm font-medium mb-8 leading-relaxed">{{ deleteBlockedMessage }}</p>
          <div class="flex flex-col gap-3">
            <button @click="deactivateClient" :disabled="loading" class="btn-primary w-full">
              <i v-if="!loading" class="fas fa-user-slash mr-2"></i>
              <div v-else class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 mx-auto"></div>
              {{ loading ? 'Inactivando...' : 'Inactivar cliente' }}
            </button>
            <button @click="showDeleteModal = false" class="btn-ghost w-full">Cancelar</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Skeleton from '@/components/ui/Skeleton.vue'
import CustomSelect from '@/components/ui/CustomSelect.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { ref, computed, onMounted } from 'vue'
import { useClientStore } from '../stores/clientStore'
import type { Client, ClientForm } from '../types'
import {
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const clientsStore = useClientStore()
const showModal = ref(false)
const showDeleteModal = ref(false)
const searchTerm = ref('')
const sortBy = ref('name')
const clientToDelete = ref<Client | null>(null)
const deleteBlockedMessage = ref('')
const emailError = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

const totalPages = computed(() => Math.ceil(filteredClients.value.length / itemsPerPage.value))

const form = ref<ClientForm>({
  name: '',
  email: '',
  phone: '',
  company: '',
  nit: ''
})

const clients = computed(() => clientsStore.clients)
const loading = computed(() => clientsStore.loading)
const error = computed(() => clientsStore.error)

const filteredClients = computed(() => {
  let filtered = clients.value

  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(client => 
      client.name.toLowerCase().includes(search) ||
      client.email.toLowerCase().includes(search) ||
      (client.company || '').toLowerCase().includes(search) ||
      (client.phone || '').toLowerCase().includes(search)
    )
  }

  return [...filtered].sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'company':
        return (a.company || '').localeCompare(b.company || '')
      case 'createdAt':
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      default:
        return 0
    }
  })
})

const paginatedClients = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredClients.value.slice(start, end)
})

// Reset pagination on search
import { watch } from 'vue'
watch([searchTerm, sortBy], () => {
  currentPage.value = 1
})

const resetForm = () => {
  form.value = {
    name: '',
    email: '',
    phone: '',
    company: '',
    nit: ''
  }
  emailError.value = ''
}

const confirmDelete = (client: Client) => {
  clientToDelete.value = client
  deleteBlockedMessage.value = ''
  showDeleteModal.value = true
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const validateEmail = () => {
  emailError.value = form.value.email && !EMAIL_RE.test(form.value.email)
    ? 'Ingresa un correo electrónico con un formato válido'
    : ''
  return !emailError.value
}

// La edición se hace desde el expediente del cliente (/clients/:id) — este
// modal solo crea, para no tener dos puntos distintos de edición.
const saveClient = async () => {
  if (!validateEmail()) return
  try {
    await clientsStore.createClient(form.value)
    showModal.value = false
    resetForm()
  } catch (error) {
    console.error('Error saving client:', error)
  }
}

const deleteClient = async () => {
  if (!clientToDelete.value?._id) return

  try {
    await clientsStore.deleteClient(clientToDelete.value._id)
    showDeleteModal.value = false
    clientToDelete.value = null
  } catch (err: any) {
    if (err.status === 409) {
      deleteBlockedMessage.value = err.message
    } else {
      console.error('Error deleting client:', err)
    }
  }
}

const deactivateClient = async () => {
  if (!clientToDelete.value?._id) return
  try {
    await clientsStore.setClientStatus(clientToDelete.value._id, 'inactive')
    showDeleteModal.value = false
    clientToDelete.value = null
    deleteBlockedMessage.value = ''
  } catch (err) {
    console.error('Error deactivating client:', err)
  }
}

// El cliente se identifica por su Empresa / Organización (así se captura en el
// formulario); los registros viejos sin empresa caen al nombre de contacto.
type ClientLike = { company?: string; name?: string; nit?: string }
const clientOrgName = (client: ClientLike) => client.company || client.name || 'Sin nombre'
const clientNit = (client: ClientLike) => client.nit || ''

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const fetchClients = async () => {
  try {
    await clientsStore.fetchClients()
  } catch (error) {
    console.error('Error fetching clients:', error)
  }
}

onMounted(() => {
  fetchClients()
})
</script>
