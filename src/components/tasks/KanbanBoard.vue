<template>
  <div class="kanban-board h-full flex flex-col">
    <!-- Board Header -->
    <div class="board-header bg-white border-b border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-bold text-gray-900">{{ board?.name }}</h1>
          <span 
            class="px-3 py-1 text-sm font-medium rounded-full"
            :class="boardTypeClass"
          >
            {{ boardTypeLabel }}
          </span>
        </div>
        
        <div class="flex items-center space-x-3">
          <!-- Filters -->
          <button
            @click="showFilters = !showFilters"
            class="px-4 py-2 text-sm font-medium bg-white border rounded-lg transition-all hover:bg-gray-50 hover:border-gray-400"
            :class="showFilters ? 'text-blue-700 border-blue-300 bg-blue-50' : 'text-gray-700 border-gray-300'"
          >
            <svg class="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </button>

          <!-- Sprint selector (only for Scrum) -->
          <div v-if="board?.type === 'scrum' && sprints.length > 0" class="min-w-[180px]">
            <CustomSelect
              v-model="selectedSprintId"
              @change="loadTasks"
              :options="sprintOptions"
              placeholder="Backlog"
              size="sm"
            />
          </div>

          <!-- Add Task -->
          <button
            @click="openTaskModal()"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
          >
            <svg class="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Tarea
          </button>
        </div>
      </div>

      <!-- Filters Panel -->
      <transition name="expand">
      <div v-if="showFilters" class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <div class="grid grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <CustomSelect
              v-model="filters.type"
              :options="[{ value: '', label: 'Todos' }, { value: 'task', label: 'Task' }, { value: 'bug', label: 'Bug' }, { value: 'feature', label: 'Feature' }, { value: 'user-story', label: 'User Story' }, { value: 'epic', label: 'Epic' }]"
              placeholder="Todos"
              size="md"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <CustomSelect
              v-model="filters.priority"
              :options="[{ value: '', label: 'Todas' }, { value: 'low', label: 'Baja' }, { value: 'medium', label: 'Media' }, { value: 'high', label: 'Alta' }, { value: 'critical', label: 'Crítica' }]"
              placeholder="Todas"
              size="md"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <CustomSelect
              v-model="filters.status"
              :options="[{ value: '', label: 'Todos' }, { value: 'active', label: 'Activo' }, { value: 'blocked', label: 'Bloqueado' }, { value: 'completed', label: 'Completado' }]"
              placeholder="Todos"
              size="md"
            />
          </div>
          <div class="flex items-end">
            <button
              @click="clearFilters"
              class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>
      </transition>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 p-6">
      <Skeleton preset="board" />
    </div>

    <!-- Board Columns -->
    <div v-else class="flex-1 overflow-x-auto motion-content-in">
      <div class="flex space-x-4 p-6 h-full motion-stagger">
        <BoardColumn
          v-for="column in columns"
          :key="column.id"
          :column="column"
          :tasks="getTasksForColumn(column.id)"
          :can-add-task="true"
          @add-task="openTaskModal(column.id)"
          @task-click="openTaskDetail"
          @task-moved="handleTaskMoved"
        />
      </div>
    </div>
  </div>

  <!-- Task Detail Modal -->
  <TaskDetailModal
    :is-open="isTaskDetailOpen"
    :task="selectedTask"
    @close="closeTaskDetail"
  />
</template>

<script setup lang="ts">
import Skeleton from '@/components/ui/Skeleton.vue'
import CustomSelect from '@/components/ui/CustomSelect.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBoardsStore } from '@/stores/boards'
import { useTasksStore } from '@/stores/tasks'
import BoardColumn from './BoardColumn.vue'
import TaskDetailModal from './TaskDetailModal.vue'
import type { Task } from '@/stores/tasks'

const route = useRoute()
const boardsStore = useBoardsStore()
const tasksStore = useTasksStore()

const showFilters = ref(false)
const selectedSprintId = ref<string | null>(null)
const filters = ref({
  type: '',
  priority: '',
  status: ''
})

const board = computed(() => boardsStore.currentBoard)
const sprints = computed(() => boardsStore.currentBoardSprints)
const loading = computed(() => boardsStore.loading || (tasksStore.loading && !isTaskDetailOpen.value))

const sprintOptions = computed(() => [
  { value: null, label: 'Backlog' },
  ...sprints.value.map((sprint: any) => ({ value: sprint._id, label: `${sprint.name} (${sprintStatus(sprint)})` }))
])

const columns = computed(() => {
  if (!board.value) return []
  return board.value.columns.sort((a, b) => a.order - b.order)
})

const boardTypeClass = computed(() => {
  const classes: Record<string, string> = {
    'kanban': 'bg-blue-100 text-blue-800',
    'scrum': 'bg-purple-100 text-purple-800',
    'custom': 'bg-gray-100 text-gray-800'
  }
  return classes[board.value?.type || 'kanban']
})

const boardTypeLabel = computed(() => {
  const labels: Record<string, string> = {
    'kanban': 'Kanban',
    'scrum': 'Scrum',
    'custom': 'Personalizado'
  }
  return labels[board.value?.type || 'kanban']
})

function sprintStatus(sprint: any): string {
  const statuses: Record<string, string> = {
    'planned': 'Planeado',
    'active': 'Activo',
    'completed': 'Completado'
  }
  return statuses[sprint.status] || sprint.status
}

function getTasksForColumn(columnId: string): Task[] {
  return tasksStore.tasks.filter(task => task.boardStatus === columnId)
}

async function loadTasks() {
  const boardId = route.params.id as string
  const filterParams = {
    ...filters.value,
    sprint: selectedSprintId.value || undefined
  }
  
  // Remove empty filters
  Object.keys(filterParams).forEach(key => {
    if (!filterParams[key as keyof typeof filterParams]) {
      delete filterParams[key as keyof typeof filterParams]
    }
  })
  
  await tasksStore.fetchTasks(boardId, filterParams)
}

function clearFilters() {
  filters.value = {
    type: '',
    priority: '',
    status: ''
  }
  loadTasks()
}

async function handleTaskMoved(task: Task, targetColumnId: string, newIndex: number) {
  try {
    await tasksStore.moveTask(task._id, targetColumnId, newIndex)
  } catch (error) {
    console.error('Error moving task:', error)
  }
}

const isTaskDetailOpen = ref(false)
const selectedTask = ref<Task | null>(null)

function openTaskModal(columnId?: string) {
  // TODO: Implementar modal de creación de tarea
  console.log('Open task modal for column:', columnId)
}

async function openTaskDetail(task: Task) {
  selectedTask.value = task
  isTaskDetailOpen.value = true
  try {
    const full = await tasksStore.fetchTaskById(task._id)
    selectedTask.value = full
  } catch (e) {
    console.error('Error fetching task detail:', e)
  }
}

function closeTaskDetail() {
  isTaskDetailOpen.value = false
  selectedTask.value = null
}

// El store reemplaza currentTask tras comentar o adjuntar; reflejarlo en el detalle
// abierto para que aparezcan el comentario y su entrada en el historial.
watch(() => tasksStore.currentTask, (task) => {
  if (task && selectedTask.value?._id === task._id) {
    selectedTask.value = task
  }
})

onMounted(async () => {
  const boardId = route.params.id as string
  await boardsStore.fetchBoardById(boardId)
  await loadTasks()
})

// Watch filters
watch(filters, () => {
  loadTasks()
}, { deep: true })
</script>

<style scoped>
.kanban-board {
  max-height: calc(100vh - 64px);
}
</style>
