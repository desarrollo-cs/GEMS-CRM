<template>
  <div class="space-y-6">
    <!-- Filtros -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gradient-to-r from-gray-800/70 to-gray-900/70 backdrop-blur-sm p-5 rounded-xl border border-blue-500/20">
      <!-- Título -->
      <div class="md:col-span-4">
        <h3 class="text-lg font-medium text-white mb-3">Filtrar tareas para notificar</h3>
      </div>
      
      <!-- Búsqueda por texto -->
      <div class="md:col-span-4">
        <div class="relative">
          <input
            v-model="filters.search"
            type="text"
            placeholder="Buscar por título o descripción..."
            class="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div class="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      <!-- Filtro por persona -->
      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1">Persona asignada</label>
        <CustomSelect
          v-model="filters.assignedTo"
          :options="assignedToOptions"
          placeholder="Todas las personas"
          size="sm"
          searchable
        />
      </div>
      
      <!-- Filtro por cliente -->
      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1">Cliente</label>
        <CustomSelect
          v-model="filters.clientId"
          :options="clientOptions"
          placeholder="Todos los clientes"
          size="sm"
          searchable
        />
      </div>
      
      <!-- Filtro por estado -->
      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1">Estado</label>
        <CustomSelect
          v-model="filters.status"
          :options="[
            { value: '', label: 'Todos los estados' },
            { value: 'pending', label: 'Pendiente' },
            { value: 'in-progress', label: 'En progreso' },
            { value: 'completed', label: 'Completada' },
            { value: 'overdue', label: 'Vencida' },
            { value: 'cancelled', label: 'Cancelada' }
          ]"
          placeholder="Todos los estados"
          size="sm"
        />
      </div>
      
      <!-- Filtro por fechas -->
      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1">Fecha límite</label>
        <div class="grid grid-cols-2 gap-2">
          <input
            v-model="filters.startDate"
            type="date"
            class="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            v-model="filters.endDate"
            type="date"
            class="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <!-- Botones de acciones rápidas -->
      <div class="md:col-span-4 flex flex-wrap gap-2 mt-2">
        <button 
          @click="resetFilters"
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm text-white rounded-lg transition-colors"
        >
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Limpiar filtros</span>
          </div>
        </button>
        <button 
          @click="selectAllFiltered"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-sm text-white rounded-lg transition-colors"
        >
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Seleccionar todas</span>
          </div>
        </button>
        <button 
          @click="deselectAll"
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm text-white rounded-lg transition-colors"
        >
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Deseleccionar todas</span>
          </div>
        </button>
        <button 
          @click="filters.status = 'overdue'"
          class="px-4 py-2 bg-red-700 hover:bg-red-600 text-sm text-white rounded-lg transition-colors"
        >
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ver vencidas</span>
          </div>
        </button>
        <button 
          @click="filters.status = 'pending'"
          class="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-sm text-white rounded-lg transition-colors"
        >
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ver pendientes</span>
          </div>
        </button>
      </div>
    </div>
    
    <!-- Lista de tareas -->
    <div class="bg-gradient-to-r from-gray-800/70 to-gray-900/70 backdrop-blur-sm rounded-xl border border-gray-700/50">
      <!-- Encabezado de la tabla -->
      <div class="flex items-center justify-between border-b border-gray-700 p-4">
        <h3 class="text-lg font-medium text-white">Tareas para notificar</h3>
        <div class="text-sm text-gray-400">
          {{ selectedTasks.length }} de {{ filteredActivities.length }} seleccionadas
        </div>
      </div>
      
      <!-- Tabla de tareas -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-700">
          <thead class="bg-gray-800">
            <tr>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-10">
                <input 
                  type="checkbox" 
                  class="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-600 bg-gray-700"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                >
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Tarea
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Cliente
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Asignado a
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Fecha límite
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          
          <tbody class="divide-y divide-gray-700">
            <tr v-if="filteredActivities.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-sm text-gray-400">
                No se encontraron tareas que coincidan con los filtros aplicados.
              </td>
            </tr>
            <tr 
              v-for="activity in filteredActivities" 
              :key="activity._id"
              class="hover:bg-gray-700/30 transition-colors"
            >
              <td class="px-4 py-3 whitespace-nowrap">
                <input 
                  type="checkbox" 
                  v-model="selectedTasks" 
                  :value="activity._id"
                  class="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-600 bg-gray-700"
                >
              </td>
              <td class="px-4 py-3 text-sm text-white">
                <div class="font-medium">{{ activity.title }}</div>
                <div v-if="activity.description" class="text-xs text-gray-400 truncate max-w-xs">
                  {{ activity.description }}
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-300">
                {{ activity.client ? activity.client.name : 'Sin cliente' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-300">
                {{ getAssignedUserName(activity) }}
              </td>
              <td class="px-4 py-3 text-sm">
                <span 
                  :class="getDueDateClass(activity.dueDate, activity.status)"
                >
                  {{ formatDate(activity.dueDate) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 rounded-full text-xs" :class="getStatusClass(activity.status)">
                  {{ getStatusLabel(activity.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Acciones finales -->
    <div class="flex justify-end mt-4">
      <button 
        @click="sendNotification"
        :disabled="sending || selectedTasks.length === 0 || !whatsappStatus"
        class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg v-if="sending" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <span v-if="sending">Enviando notificación...</span>
        <span v-else>Enviar notificación a WhatsApp</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, computed } from 'vue'
import CustomSelect from '../ui/CustomSelect.vue'
import { taskReportService } from '../../services/taskReportService'
import { useToast } from '../../composables/useToast'

interface Activity {
  _id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  client?: {
    _id: string;
    name: string;
  };
  clientId?: string;
  assignedTo?: Array<{
    _id: string;
    name: string;
    email?: string;
  }> | string[];
  assignedToUser?: {
    _id: string;
    name: string;
    email?: string;
    role?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

const props = defineProps({
  activities: {
    type: Array as () => Activity[],
    required: true
  }
})

const { toast, showError } = useToast()

// Estado
const selectedTasks = ref<string[]>([])
const sending = ref(false)
const whatsappStatus = ref(true) // Asumimos que está conectado inicialmente

// Obtener estado de WhatsApp desde el componente padre
const checkWhatsAppStatus = async () => {
  try {
    const response = await fetch('https://gems-crm-backend.onrender.com/api/wpp-status')
    const data = await response.json()
    whatsappStatus.value = data.ready === true
  } catch (error) {
    whatsappStatus.value = false
    console.error('Error verificando estado de WhatsApp:', error)
  }
}

// Llamar a la función para verificar el estado de WhatsApp
checkWhatsAppStatus()

// Filtros
const filters = ref({
  search: '',
  assignedTo: '',
  clientId: '',
  status: '',
  startDate: '',
  endDate: ''
})

// Lista filtrada de actividades
const filteredActivities = computed(() => {
  if (!props.activities || !Array.isArray(props.activities)) {
    return []
  }
  
  return props.activities.filter(activity => {
    // Filtro de búsqueda por texto
    const searchMatch = !filters.value.search || 
      (activity.title?.toLowerCase().includes(filters.value.search.toLowerCase()) ||
       activity.description?.toLowerCase().includes(filters.value.search.toLowerCase()));
    
    // Filtro por usuario asignado
    let assigneeMatch = !filters.value.assignedTo;
    
    if (filters.value.assignedTo) {
      // Caso 1: Si assignedTo es un objeto único
      if (activity.assignedToUser && activity.assignedToUser._id) {
        assigneeMatch = activity.assignedToUser._id === filters.value.assignedTo;
      }
      
      // Caso 2: Si assignedTo es un array de objetos (múltiples personas)
      if (Array.isArray(activity.assignedTo)) {
        // Si los elementos son objetos
        if (activity.assignedTo.length > 0 && typeof activity.assignedTo[0] === 'object') {
          assigneeMatch = activity.assignedTo.some((user: any) => 
            user && user._id === filters.value.assignedTo
          );
        }
        // Si los elementos son IDs (strings)
        else if (activity.assignedTo.length > 0) {
          assigneeMatch = (activity.assignedTo as string[]).includes(filters.value.assignedTo);
        }
      }
    }
    
    // Filtro por cliente
    const clientMatch = !filters.value.clientId || 
      (activity.client && activity.client._id === filters.value.clientId) || 
      activity.clientId === filters.value.clientId;
    
    // Filtro por estado
    const statusMatch = !filters.value.status || 
      activity.status === filters.value.status;
    
    // Filtro por fecha de vencimiento
    let dateMatch = true;
    if (activity.dueDate) {
      const dueDate = new Date(activity.dueDate).setHours(0, 0, 0, 0);
      
      if (filters.value.startDate) {
        const startDate = new Date(filters.value.startDate).setHours(0, 0, 0, 0);
        dateMatch = dateMatch && dueDate >= startDate;
      }
      
      if (filters.value.endDate) {
        const endDate = new Date(filters.value.endDate).setHours(0, 0, 0, 0);
        dateMatch = dateMatch && dueDate <= endDate;
      }
    }
    
    return searchMatch && assigneeMatch && clientMatch && statusMatch && dateMatch;
  }).sort((a, b) => {
    // Ordenar por fecha de vencimiento (las más próximas primero)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
})

// Comprobar si todas las tareas están seleccionadas
const isAllSelected = computed(() => {
  return filteredActivities.value.length > 0 && 
         filteredActivities.value.length === selectedTasks.value.length;
})

// Seleccionar o deseleccionar todas las tareas
function toggleSelectAll(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.checked) {
    selectedTasks.value = filteredActivities.value.map(activity => activity._id);
  } else {
    selectedTasks.value = [];
  }
}

// Lista única de usuarios para el filtro
const uniqueUsers = computed(() => {
  if (!props.activities || !Array.isArray(props.activities)) {
    return [];
  }
  
  const users: Record<string, any> = {};
  
  props.activities.forEach(activity => {
    // Caso 1: Si assignedTo es un objeto único (asignado a una persona)
    if (activity.assignedToUser && activity.assignedToUser._id) {
      users[activity.assignedToUser._id] = activity.assignedToUser;
    }
    
    // Caso 2: Si assignedTo es un array de objetos (múltiples personas)
    if (Array.isArray(activity.assignedTo)) {
      activity.assignedTo.forEach(user => {
        // Si es un objeto de usuario
        if (typeof user === 'object' && user !== null && user._id) {
          users[user._id] = user;
        }
      });
    }
  });
  
  return Object.values(users);
})

// Lista única de clientes para el filtro
const uniqueClients = computed(() => {
  if (!props.activities || !Array.isArray(props.activities)) {
    return [];
  }
  
  const clients: Record<string, any> = {};
  props.activities.forEach(activity => {
    if (activity.client && activity.client._id) {
      clients[activity.client._id] = activity.client;
    }
  });
  
  return Object.values(clients);
})

const assignedToOptions = computed(() => [
  { value: '', label: 'Todas las personas' },
  ...uniqueUsers.value.map((user: any) => ({ value: user._id, label: user.name }))
])

const clientOptions = computed(() => [
  { value: '', label: 'Todos los clientes' },
  ...uniqueClients.value.map((client: any) => ({ value: client._id, label: client.name }))
])

// Obtener nombre de usuario asignado para mostrar
function getAssignedUserName(activity: Activity): string {
  // Si hay un objeto de usuario asignado directo
  if (activity.assignedToUser && activity.assignedToUser.name) {
    return activity.assignedToUser.name;
  }
  
  // Si hay un array de usuarios asignados
  if (Array.isArray(activity.assignedTo) && activity.assignedTo.length > 0) {
    // Si el primer elemento es un objeto
    if (typeof activity.assignedTo[0] === 'object' && activity.assignedTo[0] !== null) {
      // Asumimos que es un objeto con propiedad name
      const user = activity.assignedTo[0] as { name: string };
      return user.name + (activity.assignedTo.length > 1 ? ` (+${activity.assignedTo.length-1})` : '');
    }
  }
  
  return "Sin asignar";
}

// Resetear todos los filtros
function resetFilters() {
  filters.value = {
    search: '',
    assignedTo: '',
    clientId: '',
    status: '',
    startDate: '',
    endDate: ''
  }
}

// Seleccionar todas las tareas filtradas
function selectAllFiltered() {
  selectedTasks.value = filteredActivities.value.map(activity => activity._id)
}

// Deseleccionar todas las tareas
function deselectAll() {
  selectedTasks.value = []
}

// Enviar notificación
async function sendNotification() {
  if (selectedTasks.value.length === 0) {
    toast('Selecciona al menos una tarea', 'warning')
    return
  }
  
  if (!whatsappStatus.value) {
    showError('WhatsApp no conectado', 'Es necesario vincular WhatsApp para enviar notificaciones')
    return
  }
  
  sending.value = true
  try {
    await taskReportService.sendCustomReport(selectedTasks.value)
    toast('Notificación enviada correctamente', 'success')
    selectedTasks.value = []
    resetFilters()
  } catch (error) {
    console.error('Error enviando notificación:', error)
    showError('Error al enviar notificación', error instanceof Error ? error.message : 'Error desconocido')
  } finally {
    sending.value = false
  }
}

// Formatear fecha para mostrar
function formatDate(dateString?: string): string {
  if (!dateString) return 'Sin fecha';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit'
  });
}

// Obtener clase para fecha de vencimiento
function getDueDateClass(dateString?: string, status?: string): string {
  if (!dateString) return 'text-gray-400';
  if (status === 'completed' || status === 'cancelled') return 'text-gray-400';
  
  const dueDate = new Date(dateString);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'text-red-400 font-medium';
  if (diffDays <= 2) return 'text-yellow-400 font-medium';
  
  return 'text-gray-300';
}

// Utilidades para mostrar status
function getStatusClass(status: string) {
  const classes = {
    pending: 'bg-yellow-900/40 text-yellow-300',
    'in-progress': 'bg-blue-900/40 text-blue-300',
    completed: 'bg-green-900/40 text-green-300',
    overdue: 'bg-red-900/40 text-red-300',
    cancelled: 'bg-gray-900/40 text-gray-300'
  };
  return classes[status as keyof typeof classes] || 'bg-gray-900/40 text-gray-300';
}

function getStatusLabel(status: string) {
  const labels = {
    pending: 'Pendiente',
    'in-progress': 'En Progreso',
    completed: 'Completada',
    overdue: 'Vencida',
    cancelled: 'Cancelada'
  };
  return labels[status as keyof typeof labels] || status;
}
</script>

<style scoped>
/* Estilos para el scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Estilos para inputs y selects específicos de modo oscuro */
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
}
</style>